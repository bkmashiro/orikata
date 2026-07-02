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

当前实现是第二个几何地基版本：支持任意直线切 convex polygon、内部 `Mat4` 矩阵模型、CSS `matrix3d()` serializer、父子 fold world matrix 合成、基于变换后 polygon 的初版 hit-test，以及 KISS 版 projected-bounds source 坐标映射。交互桥已有简单 adapter registry，默认支持 button/input button/checkbox/radio 和 anchor click，另提供 `PointerSyntheticAdapter`。复杂凹多边形布尔切割、透视 ray-plane 反投影、input proxy、wheel/drag 高级 adapters 后续再补。

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
