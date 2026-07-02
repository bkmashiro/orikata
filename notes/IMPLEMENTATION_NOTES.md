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

当前是初版，为了先立住边界：

1. fold split 只支持轴对齐 hinge：vertical / horizontal。
2. hit-test 暂时用源空间 polygon，不做真实 CSS 3D ray-plane 反投影。
3. visual snapshot provider 只做接口和 StaticImage provider，未内置 html-to-image / foreignObject。
4. input proxy / IME / selection / native select 暂未实现。
5. 多层 worldMatrix 当前是 CSS transform string，后续需要换成 DOMMatrix/自有矩阵，才能做真实反投影和嵌套 transform 合成。

## Next slices

1. 把 `localMatrix/worldMatrix` 从 string 升级为内部矩阵 + CSS serializer。
2. 实现任意线 polygon split。
3. 实现 ray-plane hit-test 和 node local -> source local 反投影。
4. 增加 `InteractionAdapter` registry。
5. 做 `InputProxyAdapter`，覆盖 input/textarea/range/checkbox。
6. 增加 Playwright Chromium smoke；之后补 Safari/Firefox。
