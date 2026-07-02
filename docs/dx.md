# Origami DX helpers

Orikata's low-level `FoldOp` model is intentionally explicit: a fold splits one convex face and rotates one side. That is powerful, but it also exposes geometry details (`targetNodeId`, `childNodeId`, `movingSide`) that are easy to misuse.

Use the fold-plan helpers for product/demo code, then drop down to raw `FoldOp` only when you need custom geometry.

## Fold plan builder

```ts
import { createFoldPlan, createOrigamiRuntime } from 'orikata';

const plan = createFoldPlan({ width: 420, height: 220 })
  .preCrease('center-guide', {
    a: { x: 210, y: 0 },
    b: { x: 210, y: 220 }
  })
  .foldRight({
    id: 'center-valley',
    childId: 'right-panel',
    x: 210,
    angle: 0
  })
  .foldCorner({
    id: 'corner-mountain',
    childId: 'upper-corner-flap',
    corner: 'top-right',
    target: 'right-panel',
    size: 120,
    angle: 48
  });

const runtime = createOrigamiRuntime({
  mode: 'static-view',
  host,
  paper: { width: 420, height: 220 },
  snapshot,
  foldOps: plan.foldOps
});
```

Current helpers:

- `preCrease(id, line, { target })` — records a crease/control line without adding an active moving face.
- `foldRight({ x, angle, id, childId, target })` — creates a vertical fold whose moving side is right of `x`.
- `foldLeft({ x, angle, id, childId, target })` — creates a vertical fold whose moving side is left of `x`.
- `foldCorner({ corner, size, angle, target })` — creates a diagonal corner flap.
- `zFold({ angles })` — creates a simple vertical thirds Z-fold.

## Pre-crease vs active fold

A common visual mistake is using a large root fold when you only wanted to show a crease plus a local flap.

Bad visual model:

```ts
createFoldPlan(paper)
  .foldRight({ x: paper.width / 2, angle: -60 });
```

That rotates half of the whole sheet, so it can read like the paper was cut in two.

Better local-flap model:

```ts
createFoldPlan(paper)
  .preCrease('center-guide', verticalCenterLine)
  .foldRight({ id: 'right-panel', x: paper.width / 2, angle: 0 })
  .foldCorner({ corner: 'top-right', target: 'right-panel', size: 96, angle: 45 });
```

The large center line stays visually flat, while the smaller child face carries the visible fold.

## Inspect and warn

`inspectFoldPlan` builds the fold tree and reports common DX/visual-semantics issues:

```ts
import { inspectFoldPlan } from 'orikata';

const inspection = inspectFoldPlan({ paper, foldOps: plan.foldOps });

for (const warning of inspection.warnings) {
  console.warn(warning.code, warning.message);
}
```

Warnings currently include:

- `large-root-active-fold` — the first active root fold rotates roughly half the paper at a large angle. This often looks like a cut sheet instead of a local fold.
- `invalid-fold-op` — the fold cannot be applied, usually because the target face does not exist or the line does not split the target polygon.
- `tiny-fold-face` — the created face is very small and may alias/disappear under CSS 3D compositing.

The returned `inspection.tree` is the same derived fold tree used by renderers, so it can also power custom debug overlays and facet inspectors.
