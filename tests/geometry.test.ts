import { describe, expect, it } from 'vitest';
import {
  ROOT_ID,
  buildDerivedFoldTree,
  cssMatrixFromMat4,
  hitTestFoldTree,
  mat4ApplyPoint,
  mat4Multiply
} from '../src/index';

const camera = { perspective: 900, perspectiveOrigin: { x: 100, y: 50 } };

describe('arbitrary hinge polygon split', () => {
  it('splits a convex paper polygon by a diagonal hinge and preserves both halves', () => {
    const tree = buildDerivedFoldTree({
      paper: { width: 100, height: 100 },
      camera,
      controls: {},
      foldOps: [{
        id: 'diag',
        targetNodeId: ROOT_ID,
        childNodeId: 'upper-right',
        line: { a: { x: 0, y: 100 }, b: { x: 100, y: 0 } },
        movingSide: -1,
        angleDeg: 45
      }]
    });

    expect(tree.invalidOps).toEqual({});
    expect(tree.nodes[ROOT_ID].polygon).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 }
    ]);
    expect(tree.nodes['upper-right'].polygon).toEqual([
      { x: 0, y: 100 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ]);
  });
});

describe('matrix model', () => {
  it('composes child world matrices from parent folds', () => {
    const tree = buildDerivedFoldTree({
      paper: { width: 200, height: 100 },
      camera,
      controls: {},
      foldOps: [
        {
          id: 'fold-right',
          targetNodeId: ROOT_ID,
          childNodeId: 'right',
          line: { a: { x: 100, y: 0 }, b: { x: 100, y: 100 } },
          movingSide: 1,
          angleDeg: -60
        },
        {
          id: 'fold-right-bottom',
          targetNodeId: 'right',
          childNodeId: 'right-bottom',
          line: { a: { x: 100, y: 50 }, b: { x: 200, y: 50 } },
          movingSide: 1,
          angleDeg: 30
        }
      ]
    });

    const parent = tree.nodes.right.localMatrix;
    const child = tree.nodes['right-bottom'].localMatrix;
    expect(tree.nodes['right-bottom'].worldMatrix).toEqual(mat4Multiply(parent, child));
    expect(cssMatrixFromMat4(tree.nodes['right-bottom'].worldMatrix)).toContain('matrix3d(');
  });

  it('keeps hinge points fixed under fold local matrix', () => {
    const tree = buildDerivedFoldTree({
      paper: { width: 200, height: 100 },
      camera,
      controls: {},
      foldOps: [{
        id: 'fold-right',
        targetNodeId: ROOT_ID,
        childNodeId: 'right',
        line: { a: { x: 100, y: 0 }, b: { x: 100, y: 100 } },
        movingSide: 1,
        angleDeg: -60
      }]
    });

    expect(mat4ApplyPoint(tree.nodes.right.localMatrix, { x: 100, y: 25, z: 0 })).toMatchObject({ x: 100, y: 25 });
  });
});

describe('folded hit-test', () => {
  it('uses transformed polygon positions for hit-testing after a fold', () => {
    const tree = buildDerivedFoldTree({
      paper: { width: 200, height: 100 },
      camera,
      controls: {},
      foldOps: [{
        id: 'fold-right',
        targetNodeId: ROOT_ID,
        childNodeId: 'right',
        line: { a: { x: 100, y: 0 }, b: { x: 100, y: 100 } },
        movingSide: 1,
        angleDeg: -60
      }]
    });

    expect(hitTestFoldTree({ x: 125, y: 50 }, tree)?.nodeId).toBe('right');
    expect(hitTestFoldTree({ x: 190, y: 50 }, tree)).toBeNull();
  });
});
