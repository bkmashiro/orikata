export const ROOT_ID = 'root';

export type Id = string;
export type Side = 1 | -1;
export type OrigamiRuntimeMode = 'static-view' | 'interactive-bridge' | 'baked-view';

export interface Point2 {
  x: number;
  y: number;
}

export interface PaperSpec {
  width: number;
  height: number;
}

export interface CameraSpec {
  perspective: number;
  perspectiveOrigin: Point2;
}

export interface HingeLine {
  a: Point2;
  b: Point2;
}

export interface FoldOp {
  id: Id;
  targetNodeId: Id;
  childNodeId: Id;
  line: HingeLine;
  movingSide: Side;
  angleDeg: number;
  disabled?: boolean;
}

export interface ControlLine {
  id: Id;
  targetNodeId: Id;
  a: Point2;
  b: Point2;
  movingSide: Side;
  angleDeg: number;
  opId?: Id;
  status: 'draft' | 'committed' | 'invalid';
}

export interface OrigamiDocumentState {
  paper: PaperSpec;
  camera: CameraSpec;
  foldOps: FoldOp[];
  controls: Record<Id, ControlLine>;
  selectedNodeId?: Id;
}

export type Polygon = Point2[];

export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface FoldNode {
  id: Id;
  parentId: Id | null;
  polygon: Polygon;
  projectedPolygon: Polygon;
  hinge: HingeLine | null;
  angleDeg: number;
  sourceOpId: Id | null;
  children: Id[];
  localMatrix: Mat4;
  worldMatrix: Mat4;
  depth: number;
  valid: boolean;
}

export interface DerivedFoldTree {
  rootId: Id;
  nodes: Record<Id, FoldNode>;
  renderOrder: Id[];
  invalidOps: Record<Id, string>;
}

export interface Snapshot {
  id: Id;
  width: number;
  height: number;
  url: string;
  revoke?: () => void;
}

export interface SnapshotProvider {
  capture(sourceRoot: HTMLElement, paper: PaperSpec): Promise<Snapshot>;
}

export interface FoldVisualPiece {
  nodeId: Id;
  polygon: Polygon;
  clipPath: string;
  transform: string;
  backgroundPosition: string;
  backgroundSize: string;
}

export interface BakedOrigamiManifest {
  mode: 'baked-view';
  paper: PaperSpec;
  camera: CameraSpec;
  snapshot: Snapshot;
  pieces: FoldVisualPiece[];
}

export interface FoldHit {
  nodeId: Id;
  localPoint: Point2;
}

export interface MappedEventTarget {
  originalEvent: { clientX: number; clientY: number; type: string };
  hit: FoldHit;
  sourcePoint: Point2;
  sourceTarget: HTMLElement;
  elementId?: Id;
}

export interface ActivePointerState {
  pointerId: number;
  sourceTarget: HTMLElement;
  nodeId: Id;
  startLocal: Point2;
  lastLocal: Point2;
  buttons: number;
}

export interface InteractionAdapter {
  name: string;
  match(el: HTMLElement): boolean;
  pointerDown?(ctx: MappedEventTarget): boolean;
  pointerMove?(ctx: MappedEventTarget, active?: ActivePointerState): boolean;
  pointerUp?(ctx: MappedEventTarget, active?: ActivePointerState): boolean;
}

export interface StaticViewRuntimeOptions {
  mode: 'static-view';
  host: HTMLElement;
  paper: PaperSpec;
  snapshot: Snapshot;
  foldOps: FoldOp[];
  camera?: Partial<CameraSpec>;
}

export interface InteractiveRuntimeOptions {
  mode: 'interactive-bridge';
  host: HTMLElement;
  sourceRoot: HTMLElement;
  paper: PaperSpec;
  foldOps?: FoldOp[];
  snapshotProvider: SnapshotProvider;
  adapters?: InteractionAdapter[];
  camera?: Partial<CameraSpec>;
}

export interface BakedViewRuntimeOptions {
  mode: 'baked-view';
  host: HTMLElement;
  manifest: BakedOrigamiManifest;
}

export type OrigamiRuntimeOptions = StaticViewRuntimeOptions | InteractiveRuntimeOptions | BakedViewRuntimeOptions;

export interface OrigamiRuntime {
  readonly mode: OrigamiRuntimeMode;
  render(): void;
  mount(): Promise<void>;
  setAngle(opId: Id, angleDeg: number): boolean;
  setMode?(mode: 'static-view' | 'interactive-bridge'): void;
  bridgePointer?(event: { clientX: number; clientY: number; type: string }): boolean;
  dispose(): void;
}

function defaultCamera(paper: PaperSpec, camera?: Partial<CameraSpec>): CameraSpec {
  return {
    perspective: camera?.perspective ?? 900,
    perspectiveOrigin: camera?.perspectiveOrigin ?? { x: paper.width / 2, y: paper.height / 2 }
  };
}

function cloneFoldOps(foldOps: FoldOp[]): FoldOp[] {
  return foldOps.map((op) => ({
    ...op,
    line: {
      a: { ...op.line.a },
      b: { ...op.line.b }
    }
  }));
}

function rootPolygon(paper: PaperSpec): Polygon {
  return [
    { x: 0, y: 0 },
    { x: paper.width, y: 0 },
    { x: paper.width, y: paper.height },
    { x: 0, y: paper.height }
  ];
}

function signedDistanceToLine(point: Point2, line: HingeLine): number {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  return dy * (point.x - line.a.x) - dx * (point.y - line.a.y);
}

function clipPolygonByLine(polygon: Polygon, line: HingeLine, side: Side): Polygon {
  const signed = (point: Point2) => signedDistanceToLine(point, line);
  const inside = (point: Point2) => side === 1 ? signed(point) >= -1e-9 : signed(point) <= 1e-9;
  const intersect = (a: Point2, b: Point2): Point2 => {
    const da = signed(a);
    const db = signed(b);
    const t = Math.abs(da - db) < 1e-9 ? 0 : da / (da - db);
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  };

  const output: Polygon = [];
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

function dedupePolygon(polygon: Polygon): Polygon {
  const result: Polygon = [];
  for (const point of polygon) {
    const last = result.at(-1);
    if (!last || Math.abs(last.x - point.x) > 1e-6 || Math.abs(last.y - point.y) > 1e-6) {
      result.push(roundPoint(point));
    }
  }
  if (result.length > 1) {
    const first = result[0];
    const last = result.at(-1)!;
    if (Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - last.y) < 1e-6) result.pop();
  }
  return result;
}

function roundPoint(point: Point2): Point2 {
  return {
    x: Math.abs(point.x) < 1e-9 ? 0 : Number(point.x.toFixed(6)),
    y: Math.abs(point.y) < 1e-9 ? 0 : Number(point.y.toFixed(6))
  };
}

export function mat4Identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function mat4Translation(x: number, y: number, z: number): Mat4 {
  return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
}

function mat4AxisRotation(axis: Point3, angleDeg: number): Mat4 {
  const length = Math.hypot(axis.x, axis.y, axis.z) || 1;
  const x = axis.x / length;
  const y = axis.y / length;
  const z = axis.z / length;
  const radians = angleDeg * Math.PI / 180;
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  const t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0,
    0, 0, 0, 1
  ];
}

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = Array.from({ length: 16 }, () => 0) as Mat4;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[row * 4 + col] = a[row * 4 + 0] * b[col + 0]
        + a[row * 4 + 1] * b[col + 4]
        + a[row * 4 + 2] * b[col + 8]
        + a[row * 4 + 3] * b[col + 12];
    }
  }
  return out.map((value) => Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12))) as Mat4;
}

export function mat4ApplyPoint(matrix: Mat4, point: Point3): Point3 {
  const x = matrix[0] * point.x + matrix[1] * point.y + matrix[2] * point.z + matrix[3];
  const y = matrix[4] * point.x + matrix[5] * point.y + matrix[6] * point.z + matrix[7];
  const z = matrix[8] * point.x + matrix[9] * point.y + matrix[10] * point.z + matrix[11];
  const w = matrix[12] * point.x + matrix[13] * point.y + matrix[14] * point.z + matrix[15];
  return { x: x / (w || 1), y: y / (w || 1), z: z / (w || 1) };
}

export function mat4Invert(matrix: Mat4): Mat4 {
  const r00 = matrix[0];
  const r01 = matrix[1];
  const r02 = matrix[2];
  const r10 = matrix[4];
  const r11 = matrix[5];
  const r12 = matrix[6];
  const r20 = matrix[8];
  const r21 = matrix[9];
  const r22 = matrix[10];
  const tx = matrix[3];
  const ty = matrix[7];
  const tz = matrix[11];

  return [
    r00, r10, r20, -(r00 * tx + r10 * ty + r20 * tz),
    r01, r11, r21, -(r01 * tx + r11 * ty + r21 * tz),
    r02, r12, r22, -(r02 * tx + r12 * ty + r22 * tz),
    0, 0, 0, 1
  ].map((value) => Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12))) as Mat4;
}

export function cssMatrixFromMat4(matrix: Mat4): string {
  const cssOrder = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
  return `matrix3d(${cssOrder.map((index) => formatCssNumber(matrix[index])).join(', ')})`;
}

function formatCssNumber(value: number): string {
  return String(Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12)));
}

function foldTransform(line: HingeLine, angleDeg: number): Mat4 {
  const axis = { x: line.b.x - line.a.x, y: line.b.y - line.a.y, z: 0 };
  return mat4Multiply(
    mat4Multiply(mat4Translation(line.a.x, line.a.y, 0), mat4AxisRotation(axis, angleDeg)),
    mat4Translation(-line.a.x, -line.a.y, 0)
  );
}

export function buildDerivedFoldTree(documentState: OrigamiDocumentState): DerivedFoldTree {
  const nodes: Record<Id, FoldNode> = {
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
  const invalidOps: Record<Id, string> = {};

  for (const op of documentState.foldOps) {
    if (op.disabled) continue;
    const target = nodes[op.targetNodeId];
    if (!target) {
      invalidOps[op.id] = `Missing target node: ${op.targetNodeId}`;
      continue;
    }

    const childPolygon = clipPolygonByLine(target.polygon, op.line, op.movingSide);
    const remainingPolygon = clipPolygonByLine(target.polygon, op.line, op.movingSide === 1 ? -1 : 1);
    if (childPolygon.length < 3 || remainingPolygon.length < 3) {
      invalidOps[op.id] = 'Fold line does not split target polygon';
      continue;
    }

    target.polygon = remainingPolygon;
    target.children.push(op.childNodeId);
    const localMatrix = foldTransform(op.line, op.angleDeg);
    nodes[op.childNodeId] = {
      id: op.childNodeId,
      parentId: target.id,
      polygon: childPolygon,
      projectedPolygon: [],
      hinge: op.line,
      angleDeg: op.angleDeg,
      sourceOpId: op.id,
      children: [],
      localMatrix,
      worldMatrix: mat4Multiply(target.worldMatrix, localMatrix),
      depth: target.depth + 1,
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

function polygonToClipPath(polygon: Polygon): string {
  return `polygon(${polygon.map((point) => `${point.x}px ${point.y}px`).join(', ')})`;
}

function pointOnSegment(point: Point2, a: Point2, b: Point2): boolean {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > 1e-6) return false;
  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
  if (dot < -1e-6) return false;
  const lengthSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return dot <= lengthSq + 1e-6;
}

function pointInPolygon(point: Point2, polygon: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (pointOnSegment(point, pj, pi)) return true;
    const crosses = (pi.y > point.y) !== (pj.y > point.y)
      && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y || 1e-12) + pi.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function transformedPolygon(node: FoldNode): Polygon {
  return node.polygon.map((point) => {
    const transformed = mat4ApplyPoint(node.worldMatrix, { x: point.x, y: point.y, z: 0 });
    return roundPoint({ x: transformed.x, y: transformed.y });
  });
}

function barycentric(point: Point2, a: Point2, b: Point2, c: Point2): [number, number, number] | null {
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

function weightsInside(weights: [number, number, number]): boolean {
  return weights.every((value) => value >= -1e-6 && value <= 1 + 1e-6);
}

function mapProjectedPointToSource(point: Point2, node: FoldNode): Point2 {
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

export function hitTestFoldTree(stagePoint: Point2, tree: DerivedFoldTree): FoldHit | null {
  for (const nodeId of [...tree.renderOrder].reverse()) {
    const node = tree.nodes[nodeId];
    if (pointInPolygon(stagePoint, node.projectedPolygon)) {
      return { nodeId, localPoint: mapProjectedPointToSource(stagePoint, node) };
    }
  }
  return null;
}

function piecesFromTree(tree: DerivedFoldTree, paper: PaperSpec): FoldVisualPiece[] {
  return tree.renderOrder.map((nodeId) => {
    const node = tree.nodes[nodeId];
    return {
      nodeId,
      polygon: node.polygon,
      clipPath: polygonToClipPath(node.polygon),
      transform: cssMatrixFromMat4(node.worldMatrix),
      backgroundPosition: '0px 0px',
      backgroundSize: `${paper.width}px ${paper.height}px`
    } satisfies FoldVisualPiece;
  });
}

export function buildBakedOrigamiManifest(options: {
  paper: PaperSpec;
  snapshot: Snapshot;
  foldOps: FoldOp[];
  camera?: Partial<CameraSpec>;
}): BakedOrigamiManifest {
  const camera = defaultCamera(options.paper, options.camera);
  const state: OrigamiDocumentState = { paper: options.paper, camera, foldOps: cloneFoldOps(options.foldOps), controls: {} };
  const tree = buildDerivedFoldTree(state);
  return {
    mode: 'baked-view',
    paper: options.paper,
    camera,
    snapshot: options.snapshot,
    pieces: piecesFromTree(tree, options.paper)
  };
}

class FoldVisualRenderer {
  readonly rootElement: HTMLElement;
  private snapshot: Snapshot | null = null;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
  }

  setSnapshot(snapshot: Snapshot): void {
    this.snapshot?.revoke?.();
    this.snapshot = snapshot;
  }

  renderPieces(pieces: FoldVisualPiece[], paper: PaperSpec, baked: boolean): void {
    if (!this.snapshot) return;
    this.rootElement.innerHTML = '';
    this.rootElement.style.position = 'relative';
    this.rootElement.style.width = `${paper.width}px`;
    this.rootElement.style.height = `${paper.height}px`;
    this.rootElement.style.transformStyle = 'preserve-3d';

    for (const piece of pieces) {
      const node = document.createElement('div');
      node.className = 'ori-fold-node';
      node.dataset.oriNodeId = piece.nodeId;
      node.style.position = 'absolute';
      node.style.inset = '0';
      node.style.transformOrigin = '0 0';
      node.style.transformStyle = 'preserve-3d';
      node.style.pointerEvents = 'none';
      node.style.transform = piece.transform;

      const paint = document.createElement('div');
      paint.className = 'ori-fold-paint';
      paint.style.position = 'absolute';
      paint.style.inset = '0';
      paint.style.pointerEvents = 'none';
      paint.style.backfaceVisibility = 'visible';
      paint.style.backgroundImage = `url("${this.snapshot.url}")`;
      paint.style.backgroundPosition = piece.backgroundPosition;
      paint.style.backgroundSize = piece.backgroundSize;
      paint.style.backgroundRepeat = 'no-repeat';
      paint.style.clipPath = piece.clipPath;
      paint.dataset.oriBaked = String(baked);

      node.appendChild(paint);
      this.rootElement.appendChild(node);
    }
  }
}

class SourceSurface {
  constructor(readonly sourceRoot: HTMLElement) {}

  elementFromLocalPoint(point: Point2): HTMLElement | null {
    const candidates = Array.from(this.sourceRoot.querySelectorAll<HTMLElement>('*')).reverse();
    for (const element of candidates) {
      const box = readLocalBox(element);
      if (box && point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height) {
        return element;
      }
    }
    return this.sourceRoot;
  }

  dispose(): void {}
}

function readLocalBox(element: HTMLElement): { x: number; y: number; width: number; height: number } | null {
  const left = parseCssPx(element.style.left);
  const top = parseCssPx(element.style.top);
  const width = parseCssPx(element.style.width);
  const height = parseCssPx(element.style.height);
  if (width > 0 && height > 0) return { x: left, y: top, width, height };

  const rect = element.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  return null;
}

function parseCssPx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class StaticImageSnapshotProvider implements SnapshotProvider {
  constructor(private readonly snapshot: Snapshot) {}

  async capture(): Promise<Snapshot> {
    return this.snapshot;
  }
}

export class ButtonAdapter implements InteractionAdapter {
  name = 'ButtonAdapter';

  match(el: HTMLElement): boolean {
    return el instanceof HTMLButtonElement
      || (el instanceof HTMLInputElement && ['button', 'submit', 'checkbox', 'radio'].includes(el.type));
  }

  pointerUp(ctx: MappedEventTarget): boolean {
    ctx.sourceTarget.click();
    return true;
  }
}

export class AnchorAdapter implements InteractionAdapter {
  name = 'AnchorAdapter';

  match(el: HTMLElement): boolean {
    return el instanceof HTMLAnchorElement;
  }

  pointerUp(ctx: MappedEventTarget): boolean {
    ctx.sourceTarget.click();
    return true;
  }
}

export class PointerSyntheticAdapter implements InteractionAdapter {
  name = 'PointerSyntheticAdapter';

  match(): boolean {
    return true;
  }

  pointerDown(ctx: MappedEventTarget): boolean {
    dispatchSyntheticEvent(ctx.sourceTarget, 'pointerdown');
    return true;
  }

  pointerMove(ctx: MappedEventTarget): boolean {
    dispatchSyntheticEvent(ctx.sourceTarget, 'pointermove');
    return true;
  }

  pointerUp(ctx: MappedEventTarget): boolean {
    dispatchSyntheticEvent(ctx.sourceTarget, 'pointerup');
    return true;
  }
}

export class TextInputProxyAdapter implements InteractionAdapter {
  name = 'TextInputProxyAdapter';

  match(el: HTMLElement): boolean {
    return el instanceof HTMLInputElement && ['text', 'search', 'email', 'url', 'tel', 'password'].includes(el.type);
  }

  pointerUp(ctx: MappedEventTarget): boolean {
    const sourceInput = ctx.sourceTarget as HTMLInputElement;
    const activationLayer = findActivationLayer(sourceInput);
    if (!activationLayer) return false;

    const proxy = sourceInput.cloneNode(false) as HTMLInputElement;
    proxy.removeAttribute('id');
    proxy.classList.add('ori-input-proxy');
    proxy.value = sourceInput.value;
    proxy.style.position = 'absolute';
    proxy.style.left = sourceInput.style.left || '0px';
    proxy.style.top = sourceInput.style.top || '0px';
    proxy.style.width = sourceInput.style.width || `${sourceInput.getBoundingClientRect().width}px`;
    proxy.style.height = sourceInput.style.height || `${sourceInput.getBoundingClientRect().height}px`;
    proxy.style.pointerEvents = 'auto';

    activationLayer.replaceChildren(proxy);

    const sync = () => {
      sourceInput.value = proxy.value;
      sourceInput.dispatchEvent(new Event('input', { bubbles: true }));
    };
    proxy.addEventListener('input', sync);
    proxy.addEventListener('blur', () => {
      sync();
      sourceInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, { once: true });
    proxy.focus();
    proxy.setSelectionRange?.(proxy.value.length, proxy.value.length);
    return true;
  }
}

function findActivationLayer(element: HTMLElement): HTMLElement | null {
  const sourceLayer = element.closest('.ori-source-layer');
  return sourceLayer?.parentElement?.querySelector<HTMLElement>(':scope > .ori-activation-layer') ?? null;
}

function dispatchSyntheticEvent(target: HTMLElement, type: string): void {
  const EventCtor = typeof PointerEvent === 'function' ? PointerEvent : Event;
  target.dispatchEvent(new EventCtor(type, { bubbles: true }));
}

class StaticOrigamiView implements OrigamiRuntime {
  readonly mode = 'static-view';
  private state: OrigamiDocumentState;
  private tree: DerivedFoldTree;
  private renderer: FoldVisualRenderer;

  constructor(private readonly options: StaticViewRuntimeOptions) {
    this.state = {
      paper: options.paper,
      camera: defaultCamera(options.paper, options.camera),
      foldOps: cloneFoldOps(options.foldOps),
      controls: {}
    };
    this.tree = buildDerivedFoldTree(this.state);
    setupHost(options.host, 'static-view', this.state.camera);
    this.renderer = new FoldVisualRenderer(ensureLayer(options.host, 'ori-visual-layer'));
    this.renderer.setSnapshot(options.snapshot);
  }

  async mount(): Promise<void> {
    this.render();
  }

  render(): void {
    this.renderer.renderPieces(piecesFromTree(this.tree, this.state.paper), this.state.paper, false);
  }

  setAngle(opId: Id, angleDeg: number): boolean {
    const op = this.state.foldOps.find((candidate) => candidate.id === opId);
    if (!op) return false;
    op.angleDeg = angleDeg;
    this.tree = buildDerivedFoldTree(this.state);
    this.render();
    return true;
  }

  dispose(): void {
    this.options.host.innerHTML = '';
  }
}

class BakedOrigamiView implements OrigamiRuntime {
  readonly mode = 'baked-view';
  private renderer: FoldVisualRenderer;

  constructor(private readonly options: BakedViewRuntimeOptions) {
    setupHost(options.host, 'baked-view', options.manifest.camera);
    options.host.dataset.oriBaked = 'true';
    this.renderer = new FoldVisualRenderer(ensureLayer(options.host, 'ori-visual-layer'));
    this.renderer.setSnapshot(options.manifest.snapshot);
  }

  async mount(): Promise<void> {
    this.render();
  }

  render(): void {
    this.renderer.renderPieces(this.options.manifest.pieces, this.options.manifest.paper, true);
  }

  setAngle(): boolean {
    return false;
  }

  dispose(): void {
    this.options.host.innerHTML = '';
  }
}

class InteractiveOrigamiRuntime implements OrigamiRuntime {
  readonly mode = 'interactive-bridge';
  private readonly state: OrigamiDocumentState;
  private tree: DerivedFoldTree;
  private readonly source: SourceSurface;
  private readonly renderer: FoldVisualRenderer;
  private readonly adapters: InteractionAdapter[];
  private snapshot: Snapshot | null = null;

  constructor(private readonly options: InteractiveRuntimeOptions) {
    this.state = {
      paper: options.paper,
      camera: defaultCamera(options.paper, options.camera),
      foldOps: cloneFoldOps(options.foldOps ?? []),
      controls: {}
    };
    this.tree = buildDerivedFoldTree(this.state);
    this.adapters = [...(options.adapters ?? []), new TextInputProxyAdapter(), new ButtonAdapter(), new AnchorAdapter()];
    this.source = new SourceSurface(options.sourceRoot);
    setupHost(options.host, 'interactive-bridge', this.state.camera);
    ensureLayer(options.host, 'ori-source-layer').appendChild(options.sourceRoot);
    this.renderer = new FoldVisualRenderer(ensureLayer(options.host, 'ori-visual-layer'));
    ensureLayer(options.host, 'ori-interaction-layer');
    ensureLayer(options.host, 'ori-activation-layer');
  }

  async mount(): Promise<void> {
    this.snapshot = await this.options.snapshotProvider.capture(this.options.sourceRoot, this.state.paper);
    this.renderer.setSnapshot(this.snapshot);
    this.render();
  }

  render(): void {
    if (!this.snapshot) return;
    this.renderer.renderPieces(piecesFromTree(this.tree, this.state.paper), this.state.paper, false);
  }

  setAngle(opId: Id, angleDeg: number): boolean {
    const op = this.state.foldOps.find((candidate) => candidate.id === opId);
    if (!op) return false;
    op.angleDeg = angleDeg;
    this.tree = buildDerivedFoldTree(this.state);
    this.render();
    return true;
  }

  setMode(mode: 'static-view' | 'interactive-bridge'): void {
    this.options.host.dataset.oriMode = mode;
  }

  bridgePointer(event: { clientX: number; clientY: number; type: string }): boolean {
    const hit = hitTestFoldTree({ x: event.clientX, y: event.clientY }, this.tree);
    if (!hit) return false;
    const target = this.source.elementFromLocalPoint(hit.localPoint);
    if (!target) return false;

    const ctx: MappedEventTarget = {
      originalEvent: event,
      hit,
      sourcePoint: hit.localPoint,
      sourceTarget: target,
      elementId: target.dataset.oriElementId
    };

    const method = event.type === 'pointerdown'
      ? 'pointerDown'
      : event.type === 'pointermove'
        ? 'pointerMove'
        : event.type === 'pointerup' || event.type === 'click'
          ? 'pointerUp'
          : undefined;

    if (method) {
      for (const adapter of this.adapters) {
        const handler = adapter[method];
        if (adapter.match(target) && handler?.call(adapter, ctx)) return true;
      }
    }

    dispatchSyntheticEvent(target, event.type);
    return true;
  }

  dispose(): void {
    this.source.dispose();
    this.snapshot?.revoke?.();
    this.options.host.innerHTML = '';
  }
}

function setupHost(host: HTMLElement, mode: OrigamiRuntimeMode, camera: CameraSpec): void {
  host.dataset.oriMode = mode;
  host.style.position = host.style.position || 'relative';
  host.style.perspective = `${camera.perspective}px`;
  host.style.perspectiveOrigin = `${camera.perspectiveOrigin.x}px ${camera.perspectiveOrigin.y}px`;
  host.style.transformStyle = 'preserve-3d';
}

function ensureLayer(host: HTMLElement, className: string): HTMLElement {
  const existing = host.querySelector<HTMLElement>(`:scope > .${className}`);
  if (existing) return existing;
  const layer = document.createElement('div');
  layer.className = className;
  layer.style.position = 'absolute';
  layer.style.inset = '0';
  if (className === 'ori-visual-layer' || className === 'ori-activation-layer') layer.style.transformStyle = 'preserve-3d';
  if (className === 'ori-visual-layer') layer.style.pointerEvents = 'none';
  host.appendChild(layer);
  return layer;
}

export function createOrigamiRuntime(options: OrigamiRuntimeOptions): OrigamiRuntime {
  if (options.mode === 'static-view') return new StaticOrigamiView(options);
  if (options.mode === 'baked-view') return new BakedOrigamiView(options);
  return new InteractiveOrigamiRuntime(options);
}

export type FoldAxis = 'x' | 'y';

export interface Fold3DOptions {
  segments?: number;
  axis?: FoldAxis;
  angle?: number;
  perspective?: number | string;
  hideOriginal?: boolean;
}

export interface Fold3DNormalizedOptions {
  segments: number;
  axis: FoldAxis;
  angle: number;
  perspective: string;
  hideOriginal: boolean;
}

export interface Fold3DInstance {
  readonly element: HTMLElement;
  readonly options: Fold3DNormalizedOptions;
  setAngle(angle: number): void;
  destroy(): void;
}

const DEFAULT_FOLD3D_OPTIONS: Fold3DNormalizedOptions = {
  segments: 6,
  axis: 'y',
  angle: 0,
  perspective: '900px',
  hideOriginal: false
};

export function normalizeOptions(options: Fold3DOptions = {}): Fold3DNormalizedOptions {
  const merged = { ...DEFAULT_FOLD3D_OPTIONS, ...options };
  return {
    segments: Math.max(1, Math.floor(merged.segments)),
    axis: merged.axis,
    angle: merged.angle,
    perspective: typeof merged.perspective === 'number' ? `${merged.perspective}px` : merged.perspective,
    hideOriginal: merged.hideOriginal
  };
}

export function createFold3D(element: HTMLElement, options: Fold3DOptions = {}): Fold3DInstance {
  const normalized = normalizeOptions(options);
  const previousVisibility = element.style.visibility;
  element.dataset.fold3d = 'attached';
  element.style.setProperty('--fold3d-angle', `${normalized.angle}deg`);
  element.style.setProperty('--fold3d-perspective', normalized.perspective);
  if (normalized.hideOriginal) element.style.visibility = 'hidden';

  return {
    element,
    options: normalized,
    setAngle(angle: number) {
      element.style.setProperty('--fold3d-angle', `${angle}deg`);
    },
    destroy() {
      delete element.dataset.fold3d;
      element.style.removeProperty('--fold3d-angle');
      element.style.removeProperty('--fold3d-perspective');
      element.style.visibility = previousVisibility;
    }
  };
}
