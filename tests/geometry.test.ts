import { describe, expect, it } from 'vitest';
import {
  ROOT_ID,
  buildDerivedFoldTree,
  cssMatrixFromMat4,
  hitTestFoldTree,
  mat4ApplyPoint,
  mat4Invert,
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
  it('inverts composed transforms back to source coordinates', () => {
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

    const sourcePoint = { x: 150, y: 50, z: 0 };
    const foldedPoint = mat4ApplyPoint(tree.nodes.right.worldMatrix, sourcePoint);
    const mappedBack = mat4ApplyPoint(mat4Invert(tree.nodes.right.worldMatrix), foldedPoint);

    expect(mappedBack.x).toBeCloseTo(150, 5);
    expect(mappedBack.y).toBeCloseTo(50, 5);
  });

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
  it('stores projected polygons on derived nodes', () => {
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

    expect(tree.nodes.right.projectedPolygon).toEqual(tree.nodes.right.polygon.map((point) => {
      const projected = mat4ApplyPoint(tree.nodes.right.worldMatrix, { ...point, z: 0 });
      return { x: expect.closeTo(projected.x, 5), y: expect.closeTo(projected.y, 5) };
    }));
  });

  it('maps projected triangle points back to source polygon with barycentric coordinates', () => {
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
    const node = tree.nodes['upper-right'];
    const weights = [0.2, 0.3, 0.5];
    const foldedPoint = node.projectedPolygon.reduce((acc, point, index) => ({
      x: acc.x + point.x * weights[index],
      y: acc.y + point.y * weights[index]
    }), { x: 0, y: 0 });
    const expectedSource = node.polygon.reduce((acc, point, index) => ({
      x: acc.x + point.x * weights[index],
      y: acc.y + point.y * weights[index]
    }), { x: 0, y: 0 });

    const hit = hitTestFoldTree(foldedPoint, tree);

    expect(hit?.nodeId).toBe('upper-right');
    expect(hit?.localPoint.x).toBeCloseTo(expectedSource.x, 5);
    expect(hit?.localPoint.y).toBeCloseTo(expectedSource.y, 5);
  });

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

    const foldedPoint = mat4ApplyPoint(tree.nodes.right.worldMatrix, { x: 150, y: 50, z: 0 });
    const hit = hitTestFoldTree({ x: foldedPoint.x, y: foldedPoint.y }, tree);

    expect(hit?.nodeId).toBe('right');
    expect(hit?.localPoint.x).toBeCloseTo(150, 5);
    expect(hit?.localPoint.y).toBeCloseTo(50, 5);
    expect(hitTestFoldTree({ x: 190, y: 50 }, tree)).toBeNull();
  });
});
