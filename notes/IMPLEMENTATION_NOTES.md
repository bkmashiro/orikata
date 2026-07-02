# Orikata implementation notes

来自 GPT Pro 原型的核心结论已经落到初版代码：真实 DOM 只有一份，视觉层是 snapshot 投影，交互通过 folded point -> source point 的桥接回真实 DOM。

## Runtime modes

### `static-view`

默认安全模式：

- 输入：`snapshot + foldOps + camera`
- 输出：CSS 3D 折片视觉层
- 不承诺 click/input/selection/drag/wheel
- `setAngle()` 只重算 fold tree + transform，不刷新 snapshot

### `interactive-bridge`

全功能方向：

- `sourceRoot` 保留唯一真实 DOM
- `ori-visual-layer` 显示 snapshot pieces
- `ori-interaction-layer` 后续拦截 pointer/wheel
- 初版只实现了基础 click bridge：stage point -> fold node -> source local point -> target.click()
- 后续补：真实 3D 反投影、PointerSyntheticAdapter、InputProxyAdapter、TextareaProxyAdapter、ScrollAdapter、RangeAdapter

### `baked-view`

新增的固定烘焙模式，适合角度和折线不会变化的场景：

- build-time / setup-time 调 `buildBakedOrigamiManifest()`
- manifest 预存每个 piece 的 polygon、clipPath、transform、background 信息
- runtime 只把 fixed pieces 挂到 DOM
- `setAngle()` 返回 `false`，明确不可变
- 适合：静态文章插图、作品展示、SSR 输出、列表里大量折叠卡片、低端设备节能

和 `static-view` 的区别：

```txt
static-view:
  foldOps 仍是运行时输入，允许动态 setAngle，适合轻量动画。

baked-view:
  foldOps/angle 已经固化成 manifest，运行时不 rebuild tree，适合最低计算开销。
```

## Initial implementation constraints

当前是第二个几何地基版本：

1. fold split 支持任意直线切 convex polygon；凹多边形和多片拓扑暂未做完整布尔处理。
2. `localMatrix/worldMatrix` 已升级为内部 `Mat4`，renderer 通过 `cssMatrixFromMat4()` 输出 `matrix3d()`。
3. 多层 fold 会合成 parent world matrix 和 child local matrix。
4. hit-test 会使用变换后的 polygon 轮廓；命中后用 projected bounding box 映射回 source local point。这是 KISS 近似，足够支撑早期 click bridge。
5. visual snapshot provider 只做接口和 StaticImage provider，未内置 html-to-image / foreignObject。
6. interaction bridge 有简单 adapter registry；默认 click adapters + 可选 pointer synthetic adapter 已覆盖早期按钮/拖拽验证。
7. input proxy / IME / selection / native select 暂未实现。

## Next slices

1. 做最小 `InputProxyAdapter`，只覆盖 text input，IME/selection 先不承诺。
2. 增加 Playwright Chromium smoke。
3. 评估凹多边形/多片拓扑是否真的需要；没需求前不要引入复杂 dependency。
