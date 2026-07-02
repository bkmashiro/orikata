# Fold3D implementation notes

等主人给具体方案后再填 renderer。预留的决策点：

1. DOM 切片策略：clone 节点 / canvas snapshot / CSS background-position / SVG foreignObject。
2. 几何模型：按轴切 segments，给每片设置 transform-origin、rotateX/Y、translateZ。
3. 视觉补偿：背面、阴影、折痕 highlight、边缘 seam 遮罩。
4. 交互模型：imperative API + optional scroll/mouse progress adapter。
5. 约束：尽量不破坏原 DOM 事件/布局；destroy 必须完整还原。

当前 scaffold 只提供 API 壳和 demo transform，不代表最终实现。
