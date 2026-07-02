import { describe, expect, it } from 'vitest';
import {
  ROOT_ID,
  createFoldPlan,
  inspectFoldPlan
} from '../src/index';

const paper = { width: 300, height: 180 };

describe('fold DX helpers', () => {
  it('builds common right and top-right folds without hand-written movingSide math', () => {
    const plan = createFoldPlan(paper)
      .foldRight({ x: 150, angle: -45 })
      .foldCorner({ corner: 'top-right', target: 'right-panel', size: 72, angle: 38 });

    expect(plan.foldOps).toEqual([
      {
        id: 'fold-right',
        targetNodeId: ROOT_ID,
        childNodeId: 'right-panel',
        line: { a: { x: 150, y: 0 }, b: { x: 150, y: 180 } },
        movingSide: 1,
        angleDeg: -45
      },
      {
        id: 'fold-top-right',
        targetNodeId: 'right-panel',
        childNodeId: 'top-right-flap',
        line: { a: { x: 228, y: 0 }, b: { x: 300, y: 72 } },
        movingSide: 1,
        angleDeg: 38
      }
    ]);
  });

  it('keeps pre-creases separate from active folds and can materialize crease controls', () => {
    const plan = createFoldPlan(paper)
      .preCrease('center-guide', { a: { x: 150, y: 0 }, b: { x: 150, y: 180 } }, { target: ROOT_ID })
      .foldRight({ id: 'right-live', x: 150, angle: 0 });

    expect(plan.foldOps).toHaveLength(1);
    expect(plan.creases).toEqual([
      {
        id: 'center-guide',
        targetNodeId: ROOT_ID,
        line: { a: { x: 150, y: 0 }, b: { x: 150, y: 180 } }
      }
    ]);
    expect(plan.toDocumentState().controls['center-guide']).toMatchObject({
      id: 'center-guide',
      targetNodeId: ROOT_ID,
      status: 'draft',
      angleDeg: 0
    });
  });

  it('inspects fold plans and warns when a first active fold makes the paper read as cut in half', () => {
    const plan = createFoldPlan(paper).foldRight({ x: 150, angle: -60 });

    const inspection = inspectFoldPlan({ paper, foldOps: plan.foldOps });

    expect(inspection.tree.nodes['right-panel']).toBeDefined();
    expect(inspection.warnings).toContainEqual(expect.objectContaining({
      code: 'large-root-active-fold',
      opId: 'fold-right',
      severity: 'warning'
    }));
    expect(inspection.warnings[0].message).toMatch(/pre-crease|local flap/i);
  });

  it('surfaces invalid fold targets through inspection warnings', () => {
    const inspection = inspectFoldPlan({
      paper,
      foldOps: [{
        id: 'bad-child',
        targetNodeId: 'missing-panel',
        childNodeId: 'child',
        line: { a: { x: 40, y: 0 }, b: { x: 40, y: 180 } },
        movingSide: 1,
        angleDeg: 30
      }]
    });

    expect(inspection.warnings).toContainEqual(expect.objectContaining({
      code: 'invalid-fold-op',
      opId: 'bad-child',
      message: expect.stringContaining('Missing target node')
    }));
  });
});
