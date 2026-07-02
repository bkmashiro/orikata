# Live mirror backend

`live-mirror` is Orikata's DOM-clone visual backend for `interactive-bridge` mode.

It is useful when a folded surface must keep CSS transitions, keyframe animations, or pseudo-state styling alive after folding. It is not a replacement for the default snapshot renderer; it trades simplicity and performance for live CSS fidelity.

## Mental model

`interactive-bridge` always keeps one source DOM tree as the authority. The rendered folded surface is a projection.

With `visual: { backend: 'live-mirror' }`, Orikata:

1. builds the fold tree from `foldOps`;
2. creates one visual fragment per folded face;
3. clones the source DOM into each fragment;
4. removes duplicate `id` attributes from clones and stores them as `data-fold-original-id`;
5. clips each clone to that face polygon;
6. applies the face `matrix3d(...)` transform;
7. routes pointer interaction through the interaction layer back to the original source DOM.

The clones are not interactive controls. They are marked presentational with `pointer-events: none`, `aria-hidden`, and `inert`.

## When to choose it

Use `live-mirror` when:

- CSS keyframes or transitions should continue on folded facets;
- hover/active visual states need to appear on folded clones;
- the source DOM is small enough that clone-per-face cost is acceptable;
- exact native-widget behavior is not required.

Prefer the default `snapshot` backend when:

- the DOM tree is large;
- you need predictable rendering and lower memory usage;
- visual updates can be handled by refreshing a snapshot;
- the folded content includes iframe/canvas/video/native controls.

## Basic usage

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
  paper: { width: 320, height: 160 },
  foldOps: [{
    id: 'fold-right',
    targetNodeId: ROOT_ID,
    childNodeId: 'right-panel',
    line: { a: { x: 160, y: 0 }, b: { x: 160, y: 160 } },
    movingSide: 1,
    angleDeg: -45
  }],
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

`live-mirror` currently shares the same runtime constructor shape as snapshot-backed `interactive-bridge`, so a `snapshotProvider` is still required by the API. The live visual backend does not use the snapshot texture for painting.

## Pseudo-state mirroring

Native `:hover` and `:active` do not naturally apply to clipped clone fragments. Enable pseudo-state mirroring and write CSS that accepts both native and Orikata data-state selectors:

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

Current pointer bridge behavior:

- `hover` is set on folded pointer move and cleared when the pointer leaves/cancels the interaction layer;
- `active` is set on pointer down and cleared on pointer up/cancel/leave;
- renderer internals can represent focus/focus-visible attributes, but end-to-end focus mirroring should still be treated as incomplete.

## Interaction bridge

The event flow remains source-DOM based:

1. the transparent interaction layer receives a pointer event;
2. Orikata hit-tests the folded projected polygon;
3. the folded point is mapped back into source-paper coordinates;
4. the source element is resolved;
5. adapters handle the action on the real source element.

Built-in adapters currently cover:

- button-like clicks;
- anchors;
- simple text input via a real proxy input;
- fallback synthetic pointer events.

For drag, wheel, complex text editing, native select, file input, and custom widgets, provide custom adapters or use the snapshot backend for purely visual folding.

## DOM and styling notes

Generated structure uses these classes:

- `.ori-source-layer` — hidden real source DOM;
- `.ori-visual-layer` — folded visual output;
- `.ori-live-fragment.ori-fold-node` — one live visual face;
- `.ori-live-clip` — face clip path wrapper;
- `.ori-live-mirror` — cloned source DOM for a face;
- `.ori-interaction-layer` — transparent event capture layer;
- `.ori-activation-layer` — real proxy controls for text input.

Debugging helpers:

- cloned elements lose `id` to avoid collisions;
- the old id is available as `data-fold-original-id`;
- all source/cloned elements get internal `data-fold-key` values.

## Limitations

`live-mirror` is supported as a feature, but it is intentionally scoped:

- **Performance:** full source DOM is cloned per face. Large DOMs and many folds can be expensive.
- **Seams:** `clip-path` plus CSS 3D can leave aliasing seams at fold boundaries. Orikata uses a small bleed, but browsers are not pixel-perfect here.
- **Dynamic media:** iframe, canvas, video, WebGL, and similar content are best-effort.
- **Native controls:** complex select/menu/file input behavior is not guaranteed.
- **Focus and accessibility:** source DOM remains authoritative, but folded visual clones are inert. Accessibility-complete folded interaction is not promised yet.
- **Structural mutation:** basic form values are mirrored; continuous structural DOM mutation syncing is not automatic. Remount or explicitly refresh for large structural changes.

## Verification checklist

Before relying on `live-mirror` in a product surface:

1. keep the source DOM small;
2. test the exact folded geometry in a real browser;
3. hover/click through every folded interactive target;
4. inspect seams during animation, not only at rest;
5. verify that no duplicate live-looking source controls are visible behind the folded layer;
6. run keyboard/focus/accessibility checks separately if the folded control must be user-operable beyond pointer clicks.
