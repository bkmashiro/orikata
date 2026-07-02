# Orikata

Orikata is a TypeScript library for folding one DOM surface into pseudo-3D paper facets.

It gives you three runtime modes:

- **`static-view`** — render a snapshot texture as folded visual pieces. Good for decorative cards, docs, replay, and read-only animation.
- **`interactive-bridge`** — keep one real source DOM, render folded visuals, and map pointer events back to the source DOM.
- **`baked-view`** — precompute fixed folded pieces into an immutable manifest for static/SSR-style output.

Links:

- npm: <https://www.npmjs.com/package/orikata>
- Demo: <https://orikata.pages.dev/>
- GitHub: <https://github.com/bkmashiro/orikata>

```bash
npm install orikata
```

## Quick start: static folded texture

```ts
import { ROOT_ID, createOrigamiRuntime } from 'orikata';

const runtime = createOrigamiRuntime({
  mode: 'static-view',
  host: document.querySelector('#fold')!,
  paper: { width: 360, height: 240 },
  snapshot: {
    id: 'card',
    width: 360,
    height: 240,
    url: '/card-snapshot.webp'
  },
  foldOps: [{
    id: 'fold-right',
    targetNodeId: ROOT_ID,
    childNodeId: 'right-panel',
    line: { a: { x: 180, y: 0 }, b: { x: 180, y: 240 } },
    movingSide: 1,
    angleDeg: -45
  }]
});

await runtime.mount();
runtime.setAngle('fold-right', -20);
```

## Fold plan helpers

For product code, prefer the high-level fold-plan helpers over hand-writing `movingSide` and nested `targetNodeId` values:

```ts
import { createFoldPlan, inspectFoldPlan } from 'orikata';

const plan = createFoldPlan({ width: 420, height: 220 })
  .preCrease('center-guide', {
    a: { x: 210, y: 0 },
    b: { x: 210, y: 220 }
  })
  .foldRight({ id: 'center-valley', childId: 'right-panel', x: 210, angle: 0 })
  .foldCorner({
    id: 'corner-mountain',
    childId: 'upper-corner-flap',
    corner: 'top-right',
    target: 'right-panel',
    size: 120,
    angle: 48
  });

const inspection = inspectFoldPlan({ paper: { width: 420, height: 220 }, foldOps: plan.foldOps });
```

`preCrease` records a guide/crease without rotating a face. This helps avoid the common “paper looks cut in half” mistake where a large active root fold is used when the intended visual is a flat crease plus a smaller local flap. `inspectFoldPlan` returns the derived fold tree plus warnings such as `large-root-active-fold`, invalid targets, and tiny folded faces.

See [docs/dx.md](docs/dx.md) for the full DX guide.

## Interactive bridge

`interactive-bridge` keeps the original DOM as the source of truth. The visual layer is folded, but events are hit-tested through the folded geometry and routed back to source elements through adapters.

```ts
import {
  ROOT_ID,
  StaticImageSnapshotProvider,
  createOrigamiRuntime
} from 'orikata';

const runtime = createOrigamiRuntime({
  mode: 'interactive-bridge',
  host,
  sourceRoot,
  paper: { width: 360, height: 240 },
  foldOps: [{
    id: 'fold-right',
    targetNodeId: ROOT_ID,
    childNodeId: 'right-panel',
    line: { a: { x: 180, y: 0 }, b: { x: 180, y: 240 } },
    movingSide: 1,
    angleDeg: -45
  }],
  snapshotProvider: new StaticImageSnapshotProvider(snapshot)
});

await runtime.mount();
```

Default adapters currently cover simple button/anchor clicks and text-input proxying. Rich drag/wheel/native-widget behavior should be treated as custom-adapter work.

## Visual backends

### `snapshot` backend, default

The default renderer draws one snapshot texture and clips it into folded faces. It is the most predictable and efficient path, especially for large DOMs or UIs where visual state can be refreshed by replacing the snapshot.

```ts
createOrigamiRuntime({
  mode: 'interactive-bridge',
  host,
  sourceRoot,
  paper,
  foldOps,
  snapshotProvider
  // visual omitted: snapshot backend
});
```

### `live-mirror` backend

`live-mirror` is a first-class non-snapshot backend for `interactive-bridge`. It creates visual-only DOM clones per folded face, clips each clone to that face polygon, and applies the fold transform. CSS transitions and keyframe animations can keep running on the folded surface.

Events still bridge to the single source DOM. The clones are presentational (`pointer-events: none`, `aria-hidden`, `inert`) and have duplicate IDs sanitized into `data-fold-original-id`.

```ts
const runtime = createOrigamiRuntime({
  mode: 'interactive-bridge',
  host,
  sourceRoot,
  paper: { width: 320, height: 160 },
  foldOps,
  snapshotProvider: new StaticImageSnapshotProvider({
    id: 'live-placeholder',
    width: 320,
    height: 160,
    url: ''
  }),
  visual: {
    backend: 'live-mirror',
    pseudoStates: {
      hover: true,
      active: true
    }
  }
});

await runtime.mount();
```

Use fold data attributes alongside native pseudo-classes:

```css
.card button:hover,
.card button[data-fold-hover='true'] {
  background: #b65f45;
  transform: translateY(-1px) scale(1.04);
}

.card button:active,
.card button[data-fold-active='true'] {
  transform: scale(0.98);
}
```

Known limits of `live-mirror`:

- It clones the full source subtree per face, so large DOMs or many folds can be expensive.
- Basic form value mirroring covers `input`, `textarea`, and `select`; complex native controls are not fully solved.
- `iframe`, `canvas`, `video`, and other dynamic embedded content are best-effort.
- Advanced focus, accessibility, drag, wheel, selection, and IME behavior may need custom adapters.
- Fold-boundary seams can still appear because browser `clip-path` + CSS 3D compositing is not perfectly continuous.

See [docs/live-mirror.md](docs/live-mirror.md) for detailed guidance.

## Baked view

Use `baked-view` when fold lines, angles, camera, and texture are fixed ahead of time.

```ts
import { buildBakedOrigamiManifest, createOrigamiRuntime } from 'orikata';

const manifest = buildBakedOrigamiManifest({ paper, snapshot, foldOps });
const runtime = createOrigamiRuntime({ mode: 'baked-view', host, manifest });

await runtime.mount();
runtime.setAngle('fold-right', 0); // false: baked mode is immutable
```

## Fold model

A fold operation splits one convex face with a line and creates a moving child face:

```ts
{
  id: 'fold-right',
  targetNodeId: ROOT_ID,
  childNodeId: 'right-panel',
  line: { a: { x: 180, y: 0 }, b: { x: 180, y: 240 } },
  movingSide: 1,
  angleDeg: -45
}
```

Nested folds target an existing child face. If multiple fold angles change in one animation frame, prefer `runtime.setAngles?.([...])` so geometry is rebuilt once.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run smoke
npm run build
npm pack --dry-run
```

## Status

Orikata is early. The core geometry, static rendering, interactive click/input bridge, baked manifests, and live-mirror visual backend are usable. Concave polygon splitting, full native-event emulation, complex browser widgets, and accessibility-complete folded interaction are intentionally not promised yet.
