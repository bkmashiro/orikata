# Orikata

Pseudo-3D origami/folding effects for DOM elements.

## 初版架构

Orikata 现在有三种 runtime mode：

```ts
type OrigamiRuntimeMode = 'static-view' | 'interactive-bridge' | 'baked-view';
```

- `static-view`：只渲染 snapshot 折片，适合展示/回放/只读动画。
- `interactive-bridge`：真实 DOM 保留一份，视觉层用 snapshot，点击通过 hit-test 映射回 source DOM。
- `baked-view`：角度和折线固定，预先生成 manifest；运行时只挂载固定折片，不允许 `setAngle`，适合低算力展示、SSR/静态导出、批量列表卡片。

当前实现是初版：支持轴对齐折线（vertical / horizontal）、CSS 3D 折片渲染、基础 click bridge、baked manifest。复杂任意折线、多层矩阵反投影、input proxy、wheel/drag adapters 后续再补。

## Install / dev

```bash
npm install
npm run dev
npm test
npm run build
```

## Static view

```ts
import { ROOT_ID, createOrigamiRuntime } from 'orikata';

const runtime = createOrigamiRuntime({
  mode: 'static-view',
  host,
  paper: { width: 360, height: 240 },
  snapshot: { id: 'snap', width: 360, height: 240, url: '/card.webp' },
  foldOps: [{
    id: 'fold-right',
    targetNodeId: ROOT_ID,
    childNodeId: 'right',
    line: { a: { x: 180, y: 0 }, b: { x: 180, y: 240 } },
    movingSide: 1,
    angleDeg: -60
  }]
});

runtime.render();
runtime.setAngle('fold-right', -30);
```

## Baked view

```ts
import { buildBakedOrigamiManifest, createOrigamiRuntime } from 'orikata';

const manifest = buildBakedOrigamiManifest({ paper, snapshot, foldOps });
const runtime = createOrigamiRuntime({ mode: 'baked-view', host, manifest });

runtime.render();
runtime.setAngle('fold-right', 0); // false: baked mode is immutable
```

## Interactive bridge

```ts
import { StaticImageSnapshotProvider, createOrigamiRuntime } from 'orikata';

const runtime = createOrigamiRuntime({
  mode: 'interactive-bridge',
  host,
  sourceRoot,
  paper,
  foldOps,
  snapshotProvider: new StaticImageSnapshotProvider(snapshot)
});

await runtime.mount();
```
