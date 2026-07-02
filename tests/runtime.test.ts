import { describe, expect, it, vi } from 'vitest';
import {
  ROOT_ID,
  StaticImageSnapshotProvider,
  buildBakedOrigamiManifest,
  buildDerivedFoldTree,
  createOrigamiRuntime,
  hitTestFoldTree
} from '../src/index';

const paper = { width: 200, height: 100 };
const snapshot = { id: 'snap', width: 200, height: 100, url: 'data:image/png;base64,abc' };
const foldOps = [
  {
    id: 'fold-right',
    targetNodeId: ROOT_ID,
    childNodeId: 'right',
    line: { a: { x: 100, y: 0 }, b: { x: 100, y: 100 } },
    movingSide: 1 as const,
    angleDeg: -60
  }
];

function cssTransform(host: HTMLElement, nodeId: string): string {
  return host.querySelector<HTMLElement>(`[data-ori-node-id="${nodeId}"]`)?.style.transform ?? '';
}

describe('derived fold tree', () => {
  it('splits the root polygon into a static parent and moving child', () => {
    const tree = buildDerivedFoldTree({
      paper,
      camera: { perspective: 900, perspectiveOrigin: { x: 100, y: 50 } },
      foldOps,
      controls: {}
    });

    expect(Object.keys(tree.nodes)).toEqual([ROOT_ID, 'right']);
    expect(tree.nodes[ROOT_ID].polygon).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ]);
    expect(tree.nodes.right.polygon).toEqual([
      { x: 100, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 100, y: 100 }
    ]);
    expect(tree.nodes.right.localMatrix).toHaveLength(16);
  });
});

describe('static-view runtime', () => {
  it('renders folded snapshot pieces and updates angle without refreshing snapshot', () => {
    const host = document.createElement('div');
    const runtime = createOrigamiRuntime({ mode: 'static-view', host, paper, snapshot, foldOps });

    runtime.render();

    expect(host.dataset.oriMode).toBe('static-view');
    expect(host.querySelectorAll('.ori-fold-node')).toHaveLength(2);
    expect(cssTransform(host, 'right')).toContain('matrix3d(');

    runtime.setAngle('fold-right', -20);
    expect(cssTransform(host, 'right')).not.toBe(cssTransform(host, ROOT_ID));
  });
});

describe('baked-view runtime', () => {
  it('precomputes fixed visual pieces and refuses angle mutation', () => {
    const manifest = buildBakedOrigamiManifest({ paper, snapshot, foldOps });
    const host = document.createElement('div');
    const runtime = createOrigamiRuntime({ mode: 'baked-view', host, manifest });

    runtime.render();

    const before = host.innerHTML;
    const changed = runtime.setAngle('fold-right', -10);

    expect(changed).toBe(false);
    expect(host.innerHTML).toBe(before);
    expect(host.dataset.oriBaked).toBe('true');
    expect(manifest.pieces.find((piece) => piece.nodeId === 'right')?.transform).toContain('matrix3d(');
  });
});

describe('interactive-bridge runtime', () => {
  it('captures a snapshot on mount and bridges clicks to the source element', async () => {
    const host = document.createElement('div');
    const sourceRoot = document.createElement('div');
    sourceRoot.style.width = '200px';
    sourceRoot.style.height = '100px';
    const button = document.createElement('button');
    button.id = 'saveBtn';
    button.style.position = 'absolute';
    button.style.left = '130px';
    button.style.top = '40px';
    button.style.width = '50px';
    button.style.height = '20px';
    sourceRoot.appendChild(button);

    let clicks = 0;
    button.addEventListener('click', () => clicks += 1);

    const provider = new StaticImageSnapshotProvider(snapshot);
    const capture = vi.spyOn(provider, 'capture');
    const runtime = createOrigamiRuntime({ mode: 'interactive-bridge', host, sourceRoot, paper, foldOps, snapshotProvider: provider });

    await runtime.mount();
    expect(runtime.bridgePointer?.({ clientX: 125, clientY: 50, type: 'pointerup' })).toBe(true);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(clicks).toBe(1);
    expect(host.dataset.oriMode).toBe('interactive-bridge');
  });
});

describe('hit testing', () => {
  it('maps a stage point to the deepest folded node source point', () => {
    const tree = buildDerivedFoldTree({
      paper,
      camera: { perspective: 900, perspectiveOrigin: { x: 100, y: 50 } },
      foldOps,
      controls: {}
    });

    expect(hitTestFoldTree({ x: 125, y: 50 }, tree)?.nodeId).toBe('right');
    expect(hitTestFoldTree({ x: 50, y: 50 }, tree)?.nodeId).toBe(ROOT_ID);
    expect(hitTestFoldTree({ x: 250, y: 50 }, tree)).toBeNull();
  });
});
