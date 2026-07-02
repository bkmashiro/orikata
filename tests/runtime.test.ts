import { describe, expect, it, vi } from 'vitest';
import {
  ROOT_ID,
  PointerSyntheticAdapter,
  TextInputProxyAdapter,
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

  it('updates multiple fold angles in one render pass for nested animation', () => {
    const host = document.createElement('div');
    const nestedOps = [
      ...foldOps,
      {
        id: 'fold-right-half',
        targetNodeId: 'right',
        childNodeId: 'right-edge',
        line: { a: { x: 150, y: 0 }, b: { x: 150, y: 100 } },
        movingSide: 1 as const,
        angleDeg: 20
      }
    ];
    const runtime = createOrigamiRuntime({ mode: 'static-view', host, paper, snapshot, foldOps: nestedOps });

    const changed = runtime.setAngles?.([
      { opId: 'fold-right', angleDeg: -24 },
      { opId: 'fold-right-half', angleDeg: 36 }
    ]);

    expect(changed).toBe(true);
    expect(host.querySelectorAll('.ori-fold-node')).toHaveLength(3);
    expect(cssTransform(host, 'right-edge')).toContain('matrix3d(');
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

  it('lets custom adapters intercept mapped targets before defaults', async () => {
    const host = document.createElement('div');
    const sourceRoot = document.createElement('div');
    const button = document.createElement('button');
    button.style.position = 'absolute';
    button.style.left = '130px';
    button.style.top = '40px';
    button.style.width = '50px';
    button.style.height = '20px';
    sourceRoot.appendChild(button);

    let clicks = 0;
    button.addEventListener('click', () => clicks += 1);
    const handled: string[] = [];

    const runtime = createOrigamiRuntime({
      mode: 'interactive-bridge',
      host,
      sourceRoot,
      paper,
      foldOps,
      snapshotProvider: new StaticImageSnapshotProvider(snapshot),
      adapters: [{
        name: 'test-adapter',
        match: (el) => el === button,
        pointerUp: (ctx) => {
          handled.push(ctx.sourceTarget.tagName);
          return true;
        }
      }]
    });

    await runtime.mount();
    expect(runtime.bridgePointer?.({ clientX: 125, clientY: 50, type: 'pointerup' })).toBe(true);

    expect(handled).toEqual(['BUTTON']);
    expect(clicks).toBe(0);
  });

  it('dispatches pointer events through PointerSyntheticAdapter', async () => {
    const host = document.createElement('div');
    const sourceRoot = document.createElement('div');
    const drag = document.createElement('div');
    drag.style.position = 'absolute';
    drag.style.left = '130px';
    drag.style.top = '40px';
    drag.style.width = '50px';
    drag.style.height = '20px';
    sourceRoot.appendChild(drag);

    const events: string[] = [];
    drag.addEventListener('pointerdown', () => events.push('pointerdown'));

    const runtime = createOrigamiRuntime({
      mode: 'interactive-bridge',
      host,
      sourceRoot,
      paper,
      foldOps,
      snapshotProvider: new StaticImageSnapshotProvider(snapshot),
      adapters: [new PointerSyntheticAdapter()]
    });

    await runtime.mount();
    expect(runtime.bridgePointer?.({ clientX: 125, clientY: 50, type: 'pointerdown' })).toBe(true);

    expect(events).toEqual(['pointerdown']);
  });

  it('renders live mirror clones as visual-only folded fragments and syncs hover pseudo-state', async () => {
    const host = document.createElement('div');
    const sourceRoot = document.createElement('div');
    sourceRoot.id = 'source-card';
    const button = document.createElement('button');
    button.id = 'saveBtn';
    button.textContent = 'Save';
    button.style.position = 'absolute';
    button.style.left = '130px';
    button.style.top = '40px';
    button.style.width = '50px';
    button.style.height = '20px';
    sourceRoot.appendChild(button);

    const runtime = createOrigamiRuntime({
      mode: 'interactive-bridge',
      host,
      sourceRoot,
      paper,
      foldOps,
      snapshotProvider: new StaticImageSnapshotProvider(snapshot),
      visual: { backend: 'live-mirror', pseudoStates: { hover: true, active: true } }
    });

    await runtime.mount();

    const mirrors = host.querySelectorAll<HTMLElement>('.ori-live-mirror');
    expect(mirrors).toHaveLength(2);
    expect(host.querySelectorAll('[data-fold-original-id="saveBtn"]')).toHaveLength(2);
    expect(host.querySelectorAll('#saveBtn')).toHaveLength(1);
    expect(host.querySelector<HTMLElement>('.ori-live-mirror')?.style.pointerEvents).toBe('none');
    expect(host.querySelector<HTMLElement>('.ori-live-clip')?.style.clipPath).toContain('polygon(');
    expect(host.querySelector<HTMLElement>('.ori-live-fragment')?.style.transform).toContain('matrix3d(');

    expect(runtime.bridgePointer?.({ clientX: 125, clientY: 50, type: 'pointermove' })).toBe(true);
    const hoveredClones = host.querySelectorAll<HTMLElement>('.ori-live-mirror [data-fold-hover="true"]');
    expect(hoveredClones).toHaveLength(2);
    expect(hoveredClones[0].dataset.foldOriginalId).toBe('saveBtn');
  });

  it('creates a text input proxy and syncs input back to source', async () => {
    const host = document.createElement('div');
    const sourceRoot = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'Alice';
    input.style.position = 'absolute';
    input.style.left = '130px';
    input.style.top = '40px';
    input.style.width = '50px';
    input.style.height = '20px';
    sourceRoot.appendChild(input);

    const values: string[] = [];
    input.addEventListener('input', () => values.push(input.value));

    const runtime = createOrigamiRuntime({
      mode: 'interactive-bridge',
      host,
      sourceRoot,
      paper,
      foldOps,
      snapshotProvider: new StaticImageSnapshotProvider(snapshot),
      adapters: [new TextInputProxyAdapter()]
    });

    await runtime.mount();
    expect(runtime.bridgePointer?.({ clientX: 125, clientY: 50, type: 'pointerup' })).toBe(true);

    const proxy = host.querySelector<HTMLInputElement>('.ori-input-proxy');
    expect(proxy).toBeInstanceOf(HTMLInputElement);
    expect(proxy?.value).toBe('Alice');
    expect(proxy?.style.left).toBe('130px');
    expect(proxy?.style.top).toBe('40px');

    proxy!.value = 'Bob';
    proxy!.dispatchEvent(new Event('input', { bubbles: true }));

    expect(input.value).toBe('Bob');
    expect(values).toEqual(['Bob']);
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
