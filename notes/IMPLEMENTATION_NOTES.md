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

## Visual renderer strategies

最新结论：视觉内容不能绑定到某个“所属面”。DOM 元素存在于原始 2D 纸面坐标里；如果折线穿过 input/button/text，它的视觉表现必须按 folded face 切成多片，每片跟随自己的 face transform。

因此 Orikata 应该保留两套 visual renderer 路线：

### 1. `snapshot-texture` renderer（当前主线 / KISS）

这是现在代码的基本方案，也最接近 GPT Pro 原型：

```txt
source DOM / SVG / image snapshot
  -> one texture
  -> split by FoldNode polygons
  -> each piece uses background-position + clip-path + face matrix3d
```

特点：

- 一张完整贴图天然被折线切开；控件如果跨越折线，会自动在视觉上分成多片。
- 真实 DOM 仍然只有一份并隐藏。
- click/input 通过 folded hit-test 映射回 source DOM。
- 纸张折叠动画只更新 face transform，不需要重新截图。
- 内容状态变化（例如 `Save -> Saved`、input value）可以低频重新 capture / rebuild snapshot；需要更顺滑时用两套 snapshot pieces crossfade。

这是短期应该回归的 demo 方案。不要再把按钮/输入视觉层作为 root overlay 固定在某个 face 上。

### 2. `dom-clone-clip` renderer（预备高级方案）

为了更完整地保留 DOM/CSS 外观，可以准备一套视觉克隆方案：

```txt
for each FoldNode face:
  clone source DOM as visual-only subtree
  clip clone to this face polygon
  transform clone with this face world matrix
```

特点：

- 每个 face 有一份视觉 clone，clip 后只露出属于该 face 的区域。
- 一个控件跨越折线时，会在多个 clone 里分别显示对应片段。
- clone 只负责视觉，必须 `pointer-events: none`；真实交互仍然回到唯一 source DOM。
- 可以更好保留 CSS animation / transitions / DOM 外观。
- 代价是样式、状态、表单值同步更复杂；不能把 clone 当成真实可交互控件，否则 focus/IME/event/state 会炸。

建议将它作为第二阶段 renderer，而不是替代当前 snapshot renderer。

### 不采用：single control overlay attached to facet

已证伪：把 `typedValue`/`visualSave` 作为一个独立 overlay 绑定到 `right-panel` 或 `upper-corner-flap` 是错误模型。只要控件跨越折线或不完全属于该面，就会出现纸动、控件不按纸面切分的问题。

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
4. 每个 node 派生 `projectedPolygon`；hit-test 使用 projected polygon，命中后用 fan triangulation + barycentric 映射回 source local point。
5. visual snapshot provider 只做接口和 StaticImage provider，未内置 html-to-image / foreignObject。
6. interaction bridge 有简单 adapter registry；默认 click adapters + text input proxy 已覆盖早期按钮/文本输入验证。
7. Playwright Chromium smoke 覆盖 folded button click + folded text input。
8. pointer synthetic adapter 保留为可选底层能力，但产品面先不扩。

## Next slices

1. 做一个更像真实卡片的 demo，验证 folded 后按钮/输入都能操作。
2. 评估凹多边形/多片拓扑是否真的需要；没需求前不要引入复杂 dependency。
