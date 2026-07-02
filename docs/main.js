// src/index.ts
var ROOT_ID = "root";
function defaultCamera(paper, camera) {
  return {
    perspective: camera?.perspective ?? 900,
    perspectiveOrigin: camera?.perspectiveOrigin ?? { x: paper.width / 2, y: paper.height / 2 }
  };
}
function cloneFoldOps(foldOps2) {
  return foldOps2.map((op) => ({
    ...op,
    line: {
      a: { ...op.line.a },
      b: { ...op.line.b }
    }
  }));
}
function rootPolygon(paper) {
  return [
    { x: 0, y: 0 },
    { x: paper.width, y: 0 },
    { x: paper.width, y: paper.height },
    { x: 0, y: paper.height }
  ];
}
function signedDistanceToLine(point, line) {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  return dy * (point.x - line.a.x) - dx * (point.y - line.a.y);
}
function clipPolygonByLine(polygon, line, side) {
  const signed = (point) => signedDistanceToLine(point, line);
  const inside = (point) => side === 1 ? signed(point) >= -1e-9 : signed(point) <= 1e-9;
  const intersect = (a, b) => {
    const da = signed(a);
    const db = signed(b);
    const t = Math.abs(da - db) < 1e-9 ? 0 : da / (da - db);
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  };
  const output = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentInside = inside(current);
    const previousInside = inside(previous);
    if (currentInside) {
      if (!previousInside) output.push(intersect(previous, current));
      output.push(current);
    } else if (previousInside) {
      output.push(intersect(previous, current));
    }
  }
  return dedupePolygon(output);
}
function dedupePolygon(polygon) {
  const result = [];
  for (const point of polygon) {
    const last = result.at(-1);
    if (!last || Math.abs(last.x - point.x) > 1e-6 || Math.abs(last.y - point.y) > 1e-6) {
      result.push(roundPoint(point));
    }
  }
  if (result.length > 1) {
    const first = result[0];
    const last = result.at(-1);
    if (Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - last.y) < 1e-6) result.pop();
  }
  return result;
}
function roundPoint(point) {
  return {
    x: Math.abs(point.x) < 1e-9 ? 0 : Number(point.x.toFixed(6)),
    y: Math.abs(point.y) < 1e-9 ? 0 : Number(point.y.toFixed(6))
  };
}
function mat4Identity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function mat4Translation(x, y, z) {
  return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
}
function mat4AxisRotation(axis, angleDeg) {
  const length = Math.hypot(axis.x, axis.y, axis.z) || 1;
  const x = axis.x / length;
  const y = axis.y / length;
  const z = axis.z / length;
  const radians = angleDeg * Math.PI / 180;
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  const t = 1 - c;
  return [
    t * x * x + c,
    t * x * y - s * z,
    t * x * z + s * y,
    0,
    t * x * y + s * z,
    t * y * y + c,
    t * y * z - s * x,
    0,
    t * x * z - s * y,
    t * y * z + s * x,
    t * z * z + c,
    0,
    0,
    0,
    0,
    1
  ];
}
function mat4Multiply(a, b) {
  const out = Array.from({ length: 16 }, () => 0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[row * 4 + col] = a[row * 4 + 0] * b[col + 0] + a[row * 4 + 1] * b[col + 4] + a[row * 4 + 2] * b[col + 8] + a[row * 4 + 3] * b[col + 12];
    }
  }
  return out.map((value) => Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12)));
}
function mat4ApplyPoint(matrix, point) {
  const x = matrix[0] * point.x + matrix[1] * point.y + matrix[2] * point.z + matrix[3];
  const y = matrix[4] * point.x + matrix[5] * point.y + matrix[6] * point.z + matrix[7];
  const z = matrix[8] * point.x + matrix[9] * point.y + matrix[10] * point.z + matrix[11];
  const w = matrix[12] * point.x + matrix[13] * point.y + matrix[14] * point.z + matrix[15];
  return { x: x / (w || 1), y: y / (w || 1), z: z / (w || 1) };
}
function cssMatrixFromMat4(matrix) {
  const cssOrder = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
  return `matrix3d(${cssOrder.map((index) => formatCssNumber(matrix[index])).join(", ")})`;
}
function formatCssNumber(value) {
  return String(Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12)));
}
function foldTransform(line, angleDeg) {
  const axis = { x: line.b.x - line.a.x, y: line.b.y - line.a.y, z: 0 };
  return mat4Multiply(
    mat4Multiply(mat4Translation(line.a.x, line.a.y, 0), mat4AxisRotation(axis, angleDeg)),
    mat4Translation(-line.a.x, -line.a.y, 0)
  );
}
function buildDerivedFoldTree(documentState) {
  const nodes = {
    [ROOT_ID]: {
      id: ROOT_ID,
      parentId: null,
      polygon: rootPolygon(documentState.paper),
      projectedPolygon: [],
      hinge: null,
      angleDeg: 0,
      sourceOpId: null,
      children: [],
      localMatrix: mat4Identity(),
      worldMatrix: mat4Identity(),
      depth: 0,
      valid: true
    }
  };
  const invalidOps = {};
  for (const op of documentState.foldOps) {
    if (op.disabled) continue;
    const target2 = nodes[op.targetNodeId];
    if (!target2) {
      invalidOps[op.id] = `Missing target node: ${op.targetNodeId}`;
      continue;
    }
    const childPolygon = clipPolygonByLine(target2.polygon, op.line, op.movingSide);
    const remainingPolygon = clipPolygonByLine(target2.polygon, op.line, op.movingSide === 1 ? -1 : 1);
    if (childPolygon.length < 3 || remainingPolygon.length < 3) {
      invalidOps[op.id] = "Fold line does not split target polygon";
      continue;
    }
    target2.polygon = remainingPolygon;
    target2.children.push(op.childNodeId);
    const localMatrix = foldTransform(op.line, op.angleDeg);
    nodes[op.childNodeId] = {
      id: op.childNodeId,
      parentId: target2.id,
      polygon: childPolygon,
      projectedPolygon: [],
      hinge: op.line,
      angleDeg: op.angleDeg,
      sourceOpId: op.id,
      children: [],
      localMatrix,
      worldMatrix: mat4Multiply(target2.worldMatrix, localMatrix),
      depth: target2.depth + 1,
      valid: true
    };
  }
  for (const node of Object.values(nodes)) {
    node.projectedPolygon = transformedPolygon(node);
  }
  return {
    rootId: ROOT_ID,
    nodes,
    renderOrder: Object.values(nodes).sort((a, b) => a.depth - b.depth).map((node) => node.id),
    invalidOps
  };
}
function polygonToClipPath(polygon) {
  return `polygon(${polygon.map((point) => `${point.x}px ${point.y}px`).join(", ")})`;
}
function pointOnSegment(point, a, b) {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 1e-6) return false;
  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
  if (dot < -1e-6) return false;
  const lengthSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= lengthSq + 1e-6;
}
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (pointOnSegment(point, pj, pi)) return true;
    const crosses = pi.y > point.y !== pj.y > point.y && point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y || 1e-12) + pi.x;
    if (crosses) inside = !inside;
  }
  return inside;
}
function transformedPolygon(node) {
  return node.polygon.map((point) => {
    const transformed = mat4ApplyPoint(node.worldMatrix, { x: point.x, y: point.y, z: 0 });
    return roundPoint({ x: transformed.x, y: transformed.y });
  });
}
function barycentric(point, a, b, c) {
  const v0 = { x: b.x - a.x, y: b.y - a.y };
  const v1 = { x: c.x - a.x, y: c.y - a.y };
  const v2 = { x: point.x - a.x, y: point.y - a.y };
  const d00 = v0.x * v0.x + v0.y * v0.y;
  const d01 = v0.x * v1.x + v0.y * v1.y;
  const d11 = v1.x * v1.x + v1.y * v1.y;
  const d20 = v2.x * v0.x + v2.y * v0.y;
  const d21 = v2.x * v1.x + v2.y * v1.y;
  const denom = d00 * d11 - d01 * d01;
  if (Math.abs(denom) < 1e-9) return null;
  const v = (d11 * d20 - d01 * d21) / denom;
  const w = (d00 * d21 - d01 * d20) / denom;
  const u = 1 - v - w;
  return [u, v, w];
}
function weightsInside(weights) {
  return weights.every((value) => value >= -1e-6 && value <= 1 + 1e-6);
}
function mapProjectedPointToSource(point, node) {
  const projected = node.projectedPolygon.length > 0 ? node.projectedPolygon : transformedPolygon(node);
  for (let index = 1; index < projected.length - 1; index += 1) {
    const weights = barycentric(point, projected[0], projected[index], projected[index + 1]);
    if (!weights || !weightsInside(weights)) continue;
    const sourceA = node.polygon[0];
    const sourceB = node.polygon[index];
    const sourceC = node.polygon[index + 1];
    return {
      x: sourceA.x * weights[0] + sourceB.x * weights[1] + sourceC.x * weights[2],
      y: sourceA.y * weights[0] + sourceB.y * weights[1] + sourceC.y * weights[2]
    };
  }
  return point;
}
function hitTestFoldTree(stagePoint, tree) {
  for (const nodeId of [...tree.renderOrder].reverse()) {
    const node = tree.nodes[nodeId];
    if (pointInPolygon(stagePoint, node.projectedPolygon)) {
      return { nodeId, localPoint: mapProjectedPointToSource(stagePoint, node) };
    }
  }
  return null;
}
function piecesFromTree(tree, paper) {
  return tree.renderOrder.map((nodeId) => {
    const node = tree.nodes[nodeId];
    return {
      nodeId,
      polygon: node.polygon,
      clipPath: polygonToClipPath(node.polygon),
      transform: cssMatrixFromMat4(node.worldMatrix),
      backgroundPosition: "0px 0px",
      backgroundSize: `${paper.width}px ${paper.height}px`
    };
  });
}
var FoldVisualRenderer = class {
  rootElement;
  snapshot = null;
  constructor(rootElement) {
    this.rootElement = rootElement;
  }
  setSnapshot(snapshot2) {
    this.snapshot?.revoke?.();
    this.snapshot = snapshot2;
  }
  renderPieces(pieces, paper, baked) {
    if (!this.snapshot) return;
    this.rootElement.innerHTML = "";
    this.rootElement.style.position = "relative";
    this.rootElement.style.width = `${paper.width}px`;
    this.rootElement.style.height = `${paper.height}px`;
    this.rootElement.style.transformStyle = "preserve-3d";
    for (const piece of pieces) {
      const node = document.createElement("div");
      node.className = "ori-fold-node";
      node.dataset.oriNodeId = piece.nodeId;
      node.style.position = "absolute";
      node.style.inset = "0";
      node.style.transformOrigin = "0 0";
      node.style.transformStyle = "preserve-3d";
      node.style.pointerEvents = "none";
      node.style.transform = piece.transform;
      const paint = document.createElement("div");
      paint.className = "ori-fold-paint";
      paint.style.position = "absolute";
      paint.style.inset = "0";
      paint.style.pointerEvents = "none";
      paint.style.backfaceVisibility = "visible";
      paint.style.backgroundImage = `url("${this.snapshot.url}")`;
      paint.style.backgroundPosition = piece.backgroundPosition;
      paint.style.backgroundSize = piece.backgroundSize;
      paint.style.backgroundRepeat = "no-repeat";
      paint.style.clipPath = piece.clipPath;
      paint.dataset.oriBaked = String(baked);
      node.appendChild(paint);
      this.rootElement.appendChild(node);
    }
  }
};
var SourceSurface = class {
  constructor(sourceRoot) {
    this.sourceRoot = sourceRoot;
  }
  sourceRoot;
  elementFromLocalPoint(point) {
    const candidates = Array.from(this.sourceRoot.querySelectorAll("*")).reverse();
    for (const element of candidates) {
      const box = readLocalBox(element);
      if (box && point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height) {
        return element;
      }
    }
    return this.sourceRoot;
  }
  dispose() {
  }
};
function readLocalBox(element) {
  const style = getComputedStyle(element);
  const left = parseCssPx(element.style.left || style.left);
  const top = parseCssPx(element.style.top || style.top);
  const width = parseCssPx(element.style.width || style.width);
  const height = parseCssPx(element.style.height || style.height);
  if (width > 0 && height > 0) return { x: left, y: top, width, height };
  const rect = element.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  return null;
}
function parseCssPx(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
var StaticImageSnapshotProvider = class {
  constructor(snapshot2) {
    this.snapshot = snapshot2;
  }
  snapshot;
  async capture() {
    return this.snapshot;
  }
};
var ButtonAdapter = class {
  name = "ButtonAdapter";
  match(el) {
    return el instanceof HTMLButtonElement || el instanceof HTMLInputElement && ["button", "submit", "checkbox", "radio"].includes(el.type);
  }
  pointerUp(ctx) {
    ctx.sourceTarget.click();
    return true;
  }
};
var AnchorAdapter = class {
  name = "AnchorAdapter";
  match(el) {
    return el instanceof HTMLAnchorElement;
  }
  pointerUp(ctx) {
    ctx.sourceTarget.click();
    return true;
  }
};
var TextInputProxyAdapter = class {
  name = "TextInputProxyAdapter";
  match(el) {
    return el instanceof HTMLInputElement && ["text", "search", "email", "url", "tel", "password"].includes(el.type);
  }
  pointerUp(ctx) {
    const sourceInput = ctx.sourceTarget;
    const activationLayer = findActivationLayer(sourceInput);
    if (!activationLayer) return false;
    const proxy = sourceInput.cloneNode(false);
    proxy.removeAttribute("id");
    proxy.classList.add("ori-input-proxy");
    proxy.value = sourceInput.value;
    const localBox = readLocalBox(sourceInput);
    proxy.style.position = "absolute";
    proxy.style.left = `${localBox?.x ?? 0}px`;
    proxy.style.top = `${localBox?.y ?? 0}px`;
    proxy.style.width = `${localBox?.width ?? sourceInput.getBoundingClientRect().width}px`;
    proxy.style.height = `${localBox?.height ?? sourceInput.getBoundingClientRect().height}px`;
    proxy.style.pointerEvents = "auto";
    activationLayer.replaceChildren(proxy);
    const sync = () => {
      sourceInput.value = proxy.value;
      sourceInput.dispatchEvent(new Event("input", { bubbles: true }));
    };
    proxy.addEventListener("input", sync);
    proxy.addEventListener("blur", () => {
      sync();
      sourceInput.dispatchEvent(new Event("change", { bubbles: true }));
    }, { once: true });
    proxy.focus();
    proxy.setSelectionRange?.(proxy.value.length, proxy.value.length);
    return true;
  }
};
function findActivationLayer(element) {
  const sourceLayer = element.closest(".ori-source-layer");
  return sourceLayer?.parentElement?.querySelector(":scope > .ori-activation-layer") ?? null;
}
function dispatchSyntheticEvent(target2, type) {
  const EventCtor = typeof PointerEvent === "function" ? PointerEvent : Event;
  target2.dispatchEvent(new EventCtor(type, { bubbles: true }));
}
var StaticOrigamiView = class {
  constructor(options) {
    this.options = options;
    this.state = {
      paper: options.paper,
      camera: defaultCamera(options.paper, options.camera),
      foldOps: cloneFoldOps(options.foldOps),
      controls: {}
    };
    this.tree = buildDerivedFoldTree(this.state);
    setupHost(options.host, "static-view", this.state.camera);
    this.renderer = new FoldVisualRenderer(ensureLayer(options.host, "ori-visual-layer"));
    this.renderer.setSnapshot(options.snapshot);
  }
  options;
  mode = "static-view";
  state;
  tree;
  renderer;
  async mount() {
    this.render();
  }
  render() {
    this.renderer.renderPieces(piecesFromTree(this.tree, this.state.paper), this.state.paper, false);
  }
  setAngle(opId, angleDeg) {
    const op = this.state.foldOps.find((candidate) => candidate.id === opId);
    if (!op) return false;
    op.angleDeg = angleDeg;
    this.tree = buildDerivedFoldTree(this.state);
    this.render();
    return true;
  }
  dispose() {
    this.options.host.innerHTML = "";
  }
};
var BakedOrigamiView = class {
  constructor(options) {
    this.options = options;
    setupHost(options.host, "baked-view", options.manifest.camera);
    options.host.dataset.oriBaked = "true";
    this.renderer = new FoldVisualRenderer(ensureLayer(options.host, "ori-visual-layer"));
    this.renderer.setSnapshot(options.manifest.snapshot);
  }
  options;
  mode = "baked-view";
  renderer;
  async mount() {
    this.render();
  }
  render() {
    this.renderer.renderPieces(this.options.manifest.pieces, this.options.manifest.paper, true);
  }
  setAngle() {
    return false;
  }
  dispose() {
    this.options.host.innerHTML = "";
  }
};
var InteractiveOrigamiRuntime = class {
  constructor(options) {
    this.options = options;
    this.state = {
      paper: options.paper,
      camera: defaultCamera(options.paper, options.camera),
      foldOps: cloneFoldOps(options.foldOps ?? []),
      controls: {}
    };
    this.tree = buildDerivedFoldTree(this.state);
    this.adapters = [...options.adapters ?? [], new TextInputProxyAdapter(), new ButtonAdapter(), new AnchorAdapter()];
    this.source = new SourceSurface(options.sourceRoot);
    setupHost(options.host, "interactive-bridge", this.state.camera);
    ensureLayer(options.host, "ori-source-layer").appendChild(options.sourceRoot);
    this.renderer = new FoldVisualRenderer(ensureLayer(options.host, "ori-visual-layer"));
    this.interactionLayer = ensureLayer(options.host, "ori-interaction-layer");
    ensureLayer(options.host, "ori-activation-layer");
  }
  options;
  mode = "interactive-bridge";
  state;
  tree;
  source;
  renderer;
  adapters;
  interactionLayer;
  snapshot = null;
  onLayerPointer = (event) => {
    const rect = this.options.host.getBoundingClientRect();
    this.bridgePointer({
      clientX: event.clientX - rect.left,
      clientY: event.clientY - rect.top,
      type: event.type
    });
  };
  async mount() {
    this.snapshot = await this.options.snapshotProvider.capture(this.options.sourceRoot, this.state.paper);
    this.renderer.setSnapshot(this.snapshot);
    this.render();
    this.interactionLayer.addEventListener("pointerdown", this.onLayerPointer);
    this.interactionLayer.addEventListener("pointermove", this.onLayerPointer);
    this.interactionLayer.addEventListener("pointerup", this.onLayerPointer);
  }
  render() {
    if (!this.snapshot) return;
    this.renderer.renderPieces(piecesFromTree(this.tree, this.state.paper), this.state.paper, false);
  }
  setAngle(opId, angleDeg) {
    const op = this.state.foldOps.find((candidate) => candidate.id === opId);
    if (!op) return false;
    op.angleDeg = angleDeg;
    this.tree = buildDerivedFoldTree(this.state);
    this.render();
    return true;
  }
  setMode(mode) {
    this.options.host.dataset.oriMode = mode;
  }
  bridgePointer(event) {
    const hit = hitTestFoldTree({ x: event.clientX, y: event.clientY }, this.tree);
    if (!hit) return false;
    const target2 = this.source.elementFromLocalPoint(hit.localPoint);
    if (!target2) return false;
    const ctx = {
      originalEvent: event,
      hit,
      sourcePoint: hit.localPoint,
      sourceTarget: target2,
      elementId: target2.dataset.oriElementId
    };
    const method = event.type === "pointerdown" ? "pointerDown" : event.type === "pointermove" ? "pointerMove" : event.type === "pointerup" || event.type === "click" ? "pointerUp" : void 0;
    if (method) {
      for (const adapter of this.adapters) {
        const handler = adapter[method];
        if (adapter.match(target2) && handler?.call(adapter, ctx)) return true;
      }
    }
    dispatchSyntheticEvent(target2, event.type);
    return true;
  }
  dispose() {
    this.interactionLayer.removeEventListener("pointerdown", this.onLayerPointer);
    this.interactionLayer.removeEventListener("pointermove", this.onLayerPointer);
    this.interactionLayer.removeEventListener("pointerup", this.onLayerPointer);
    this.source.dispose();
    this.snapshot?.revoke?.();
    this.options.host.innerHTML = "";
  }
};
function setupHost(host, mode, camera) {
  host.dataset.oriMode = mode;
  host.style.position = host.style.position || "relative";
  host.style.perspective = `${camera.perspective}px`;
  host.style.perspectiveOrigin = `${camera.perspectiveOrigin.x}px ${camera.perspectiveOrigin.y}px`;
  host.style.transformStyle = "preserve-3d";
}
function ensureLayer(host, className) {
  const existing = host.querySelector(`:scope > .${className}`);
  if (existing) return existing;
  const layer = document.createElement("div");
  layer.className = className;
  layer.style.position = "absolute";
  layer.style.inset = "0";
  if (className === "ori-visual-layer" || className === "ori-activation-layer") layer.style.transformStyle = "preserve-3d";
  if (className === "ori-visual-layer" || className === "ori-activation-layer") layer.style.pointerEvents = "none";
  host.appendChild(layer);
  return layer;
}
function createOrigamiRuntime(options) {
  if (options.mode === "static-view") return new StaticOrigamiView(options);
  if (options.mode === "baked-view") return new BakedOrigamiView(options);
  return new InteractiveOrigamiRuntime(options);
}

// demo/main.ts
var target = document.querySelector("#target");
var button = document.querySelector("#toggle");
var saveBtn = document.querySelector("#saveBtn");
var nameInput = document.querySelector("#nameInput");
var copyInstall = document.querySelector("#copyInstall");
var installCommand = document.querySelector("#installCommand");
var foldStage = document.querySelector("#foldStage");
var activeFoldName = document.querySelector("#activeFoldName");
var angleValue = document.querySelector("#angleValue");
var angleDial = document.querySelector("#angleDial");
var angleHand = document.querySelector("#angleHand");
var creaseTools = document.querySelector("#creaseTools");
if (!target || !button || !saveBtn || !nameInput || !copyInstall || !installCommand || !foldStage || !activeFoldName || !angleValue || !angleDial || !angleHand || !creaseTools) {
  throw new Error("Demo DOM is missing required elements");
}
var stageElement = foldStage;
var activeNameElement = activeFoldName;
var angleValueElement = angleValue;
var angleDialElement = angleDial;
var angleHandElement = angleHand;
var creaseToolHost = creaseTools;
var targetElement = target;
var saveButtonElement = saveBtn;
var nameInputElement = nameInput;
var copyInstallButton = copyInstall;
var installCommandElement = installCommand;
copyInstallButton.addEventListener("click", async () => {
  const command = installCommandElement.textContent?.trim() || "npm install orikata";
  try {
    await navigator.clipboard?.writeText(command);
  } catch {
    const scratch = document.createElement("textarea");
    scratch.value = command;
    scratch.style.position = "fixed";
    scratch.style.opacity = "0";
    document.body.appendChild(scratch);
    scratch.select();
    document.execCommand("copy");
    scratch.remove();
  }
  copyInstallButton.textContent = "copied";
  window.setTimeout(() => {
    copyInstallButton.textContent = "copy";
  }, 1100);
});
function setSnapshotInputValue(value) {
  targetElement.dataset.inputValue = value;
  refreshSnapshotTexture();
}
targetElement.addEventListener("focusin", (event) => {
  if (event.target.classList?.contains("ori-input-proxy")) targetElement.dataset.inputActive = "true";
});
targetElement.addEventListener("focusout", (event) => {
  if (event.target.classList?.contains("ori-input-proxy")) delete targetElement.dataset.inputActive;
});
var feedbackTimer;
saveButtonElement.addEventListener("click", () => {
  window.clearTimeout(feedbackTimer);
  const baseAngle = foldAngles["corner-mountain"];
  saveButtonElement.textContent = "Saved";
  stageElement.dataset.feedback = "saved";
  refreshSnapshotTexture();
  runtime?.setAngle("corner-mountain", Math.min(72, baseAngle + 10));
  renderCreaseTools();
  feedbackTimer = window.setTimeout(() => {
    saveButtonElement.textContent = "Save";
    refreshSnapshotTexture();
    runtime?.setAngle("corner-mountain", baseAngle);
    renderCreaseTools();
    delete stageElement.dataset.feedback;
  }, 620);
});
nameInputElement.addEventListener("input", () => {
  setSnapshotInputValue(nameInputElement.value);
});
var foldOps = [
  {
    id: "center-valley",
    targetNodeId: ROOT_ID,
    childNodeId: "right-panel",
    line: { a: { x: 210, y: 0 }, b: { x: 210, y: 220 } },
    movingSide: 1,
    angleDeg: -60
  },
  {
    id: "corner-mountain",
    targetNodeId: "right-panel",
    childNodeId: "upper-corner-flap",
    line: { a: { x: 300, y: 0 }, b: { x: 420, y: 80 } },
    movingSide: 1,
    angleDeg: 48
  }
];
var foldAngles = {
  "center-valley": -60,
  "corner-mountain": 48
};
var foldLabels = {
  "center-valley": "center valley",
  "corner-mountain": "corner mountain"
};
var activeFoldId = "corner-mountain";
function applyFoldAngle(id, angle) {
  foldAngles[id] = Math.max(-85, Math.min(85, Math.round(angle)));
  runtime?.setAngle(id, foldAngles[id]);
  renderCreaseTools();
  stageElement.dataset.activeFold = activeFoldId;
  stageElement.dataset.centerAngle = String(foldAngles["center-valley"]);
  stageElement.dataset.cornerAngle = String(foldAngles["corner-mountain"]);
  angleValueElement.textContent = `${foldAngles[activeFoldId]}\xB0`;
  angleDialElement.setAttribute("aria-valuenow", String(foldAngles[activeFoldId]));
  angleHandElement.style.transform = `rotate(${foldAngles[activeFoldId]}deg)`;
}
function setCandidateState(id, state) {
  for (const line of targetElement.querySelectorAll("[data-fold-candidate], .crease-tool-layer[data-tool-id]")) {
    if (line.dataset.foldCandidate === id || line.dataset.toolId === id) line.dataset.state = state;
  }
}
var creaseGuides = [
  {
    id: "center-valley",
    nodeId: ROOT_ID,
    guide: { x1: 210, y1: 0, x2: 210, y2: 220 },
    hot: { x1: 210, y1: 0, x2: 210, y2: 220 }
  },
  {
    id: "corner-mountain",
    nodeId: "right-panel",
    guide: { x1: 300, y1: 0, x2: 420, y2: 80 },
    hot: { x1: 300, y1: 0, x2: 420, y2: 80 }
  }
];
function svgLine(attrs, className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("class", className);
  for (const [key, value] of Object.entries(attrs)) line.setAttribute(key, String(value));
  return line;
}
function renderCreaseTools() {
  creaseToolHost.remove();
  for (const oldLayer of targetElement.querySelectorAll(":scope > .crease-tool-layer")) oldLayer.remove();
  for (const guide of creaseGuides) {
    const foldedNode = targetElement.querySelector(`[data-ori-node-id="${guide.nodeId}"]`);
    if (!foldedNode) continue;
    const layer = document.createElement("div");
    layer.className = "crease-tool-layer";
    layer.dataset.toolNode = guide.nodeId;
    layer.dataset.toolId = guide.id;
    layer.dataset.state = guide.id === activeFoldId ? "selected" : "idle";
    layer.style.transform = foldedNode.style.transform || getComputedStyle(foldedNode).transform;
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = `crease-hotspot ${guide.id === "center-valley" ? "center" : "corner"}`;
    hotspot.dataset.foldCandidate = guide.id;
    hotspot.dataset.state = guide.id === activeFoldId ? "selected" : "idle";
    hotspot.setAttribute("aria-label", `select ${foldLabels[guide.id]} crease`);
    hotspot.addEventListener("mouseenter", () => {
      if (guide.id !== activeFoldId) setCandidateState(guide.id, "hover");
    });
    hotspot.addEventListener("mouseleave", () => {
      if (guide.id !== activeFoldId) setCandidateState(guide.id, "idle");
    });
    hotspot.addEventListener("click", (event) => {
      event.stopPropagation();
      setActiveFold(guide.id);
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "fold-tool-layer");
    svg.setAttribute("viewBox", "0 0 420 220");
    svg.setAttribute("aria-hidden", "true");
    svg.appendChild(svgLine(guide.guide, "candidate-guide"));
    svg.appendChild(svgLine(guide.hot, "candidate-line"));
    layer.appendChild(hotspot);
    layer.appendChild(svg);
    targetElement.appendChild(layer);
  }
}
function setActiveFold(id) {
  activeFoldId = id;
  activeNameElement.textContent = foldLabels[id] ?? id;
  for (const guide of creaseGuides) setCandidateState(guide.id, guide.id === id ? "selected" : "idle");
  applyFoldAngle(id, foldAngles[id] ?? 0);
}
function angleFromPointer(event) {
  const rect = angleDialElement.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const deg = Math.atan2(event.clientY - cy, event.clientX - cx) * 180 / Math.PI;
  return Math.max(-85, Math.min(85, Math.round(deg)));
}
function updateAngleFromPointer(event) {
  applyFoldAngle(activeFoldId, angleFromPointer(event));
}
angleDialElement.addEventListener("pointerdown", (event) => {
  angleDialElement.setPointerCapture(event.pointerId);
  updateAngleFromPointer(event);
});
angleDialElement.addEventListener("pointermove", (event) => {
  if (angleDialElement.hasPointerCapture(event.pointerId)) updateAngleFromPointer(event);
});
angleDialElement.addEventListener("click", (event) => updateAngleFromPointer(event));
angleDialElement.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  applyFoldAngle(activeFoldId, foldAngles[activeFoldId] + (event.key === "ArrowRight" ? 5 : -5));
});
function escapeSvgText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function buildSnapshotSvg(name, buttonLabel) {
  const safeName = escapeSvgText(name || "\xA0");
  const safeButton = escapeSvgText(buttonLabel || "Save");
  const buttonFill = buttonLabel === "Saved" ? "#b65f45" : "#2b2f2a";
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220">
  <defs>
    <pattern id="asanoha" width="36" height="31.176" patternUnits="userSpaceOnUse">
      <path d="M18 0v31.176M0 15.588h36M0 15.588 18 0l18 15.588-18 15.588zM0 15.588 18 31.176M36 15.588 18 31.176M0 15.588 18 0M36 15.588 18 0" fill="none" stroke="#334137" stroke-opacity="0.16" stroke-width="0.9"/>
    </pattern>
    <filter id="bleed" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.048" numOctaves="3" seed="7" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.13"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>
  <rect width="420" height="220" fill="#efe3cb"/>
  <rect width="420" height="220" fill="url(#asanoha)"/>
  <path d="M0 0h420v220H0z" fill="none" stroke="#2b2f2a" stroke-opacity="0.22"/>
  <path d="M210 0v220" stroke="#2b2f2a" stroke-opacity="0.22" stroke-width="1.1" stroke-dasharray="6 8"/>
  <path d="M300 0 420 80" stroke="#b65f45" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="5 7"/>
  <g filter="url(#bleed)">
    <circle cx="84" cy="86" r="40" fill="none" stroke="#1f2420" stroke-opacity="0.16" stroke-width="12"/>
    <text x="32" y="58" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="28" fill="#1f2420">Washi form</text>
    <text x="34" y="91" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">one real DOM</text>
    <text x="34" y="111" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">folded like paper</text>
    <path d="M270 112h100" stroke="#1f2420" stroke-opacity=".42" stroke-width="1"/>
    <text x="282" y="102" font-family="system-ui, sans-serif" font-size="13" fill="#1f2420">${safeName}</text>
    <rect x="270" y="132" width="100" height="36" fill="${buttonFill}" fill-opacity="${buttonLabel === "Saved" ? "0.86" : "1"}"/>
    <text x="320" y="155" text-anchor="middle" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="13" fill="#f7f1e4">${safeButton}</text>
    <circle cx="385" cy="32" r="18" fill="#b65f45" fill-opacity="0.18"/>
  </g>
</svg>`;
}
var snapshot = {
  id: "washi-asanoha-card",
  width: 420,
  height: 220,
  url: `data:image/svg+xml,${encodeURIComponent(buildSnapshotSvg(nameInputElement.value, saveButtonElement.textContent || "Save"))}`
};
function refreshSnapshotTexture() {
  snapshot.url = `data:image/svg+xml,${encodeURIComponent(buildSnapshotSvg(nameInputElement.value, saveButtonElement.textContent || "Save"))}`;
  runtime.setAngle("corner-mountain", foldAngles["corner-mountain"]);
}
var runtime = createOrigamiRuntime({
  mode: "interactive-bridge",
  host: target,
  sourceRoot: target.querySelector(".card-source"),
  paper: { width: 420, height: 220 },
  foldOps,
  snapshotProvider: new StaticImageSnapshotProvider(snapshot)
});
var folded = true;
await runtime.mount();
setSnapshotInputValue(nameInputElement.value);
startIntroAnimation();
function startIntroAnimation() {
  const start = -60;
  const end = 0;
  const duration = 950;
  const startedAt = performance.now();
  stageElement.dataset.intro = "folding";
  delete stageElement.dataset.toolsReady;
  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const angle = Math.round(start + (end - start) * eased);
    foldAngles["center-valley"] = angle;
    runtime.setAngle("center-valley", angle);
    stageElement.dataset.centerAngle = String(angle);
    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }
    foldAngles["center-valley"] = 0;
    runtime.setAngle("center-valley", 0);
    stageElement.dataset.centerAngle = "0";
    stageElement.dataset.toolsReady = "true";
    delete stageElement.dataset.intro;
    renderCreaseTools();
  };
  requestAnimationFrame(tick);
}
button.addEventListener("click", () => {
  folded = !folded;
  foldAngles["center-valley"] = 0;
  foldAngles["corner-mountain"] = folded ? 48 : 0;
  runtime.setAngle("center-valley", foldAngles["center-valley"]);
  runtime.setAngle("corner-mountain", foldAngles["corner-mountain"]);
  renderCreaseTools();
  applyFoldAngle(activeFoldId, foldAngles[activeFoldId]);
});
//# sourceMappingURL=main.js.map
