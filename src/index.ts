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

export interface FoldNode {
  id: Id;
  parentId: Id | null;
  polygon: Polygon;
  hinge: HingeLine | null;
  angleDeg: number;
  sourceOpId: Id | null;
  children: Id[];
  localMatrix: string;
  worldMatrix: string;
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

function isVertical(line: HingeLine): boolean {
  return Math.abs(line.a.x - line.b.x) <= Math.abs(line.a.y - line.b.y);
}

function clipPolygonByAxisAlignedLine(polygon: Polygon, line: HingeLine, side: Side): Polygon {
  const vertical = isVertical(line);
  const c = vertical ? line.a.x : line.a.y;
  const value = (point: Point2) => vertical ? point.x : point.y;
  const inside = (point: Point2) => side === 1 ? value(point) >= c - 1e-9 : value(point) <= c + 1e-9;
  const intersect = (a: Point2, b: Point2): Point2 => {
    const denom = value(b) - value(a);
    const t = Math.abs(denom) < 1e-9 ? 0 : (c - value(a)) / denom;
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

function axisAlignedFoldTransform(line: HingeLine, angleDeg: number): string {
  const vertical = isVertical(line);
  const axis = vertical ? '0, 1, 0' : '1, 0, 0';
  return `translate3d(${line.a.x}px, ${line.a.y}px, 0px) rotate3d(${axis}, ${angleDeg}deg) translate3d(${-line.a.x}px, ${-line.a.y}px, 0px)`;
}

export function buildDerivedFoldTree(documentState: OrigamiDocumentState): DerivedFoldTree {
  const nodes: Record<Id, FoldNode> = {
    [ROOT_ID]: {
      id: ROOT_ID,
      parentId: null,
      polygon: rootPolygon(documentState.paper),
      hinge: null,
      angleDeg: 0,
      sourceOpId: null,
      children: [],
      localMatrix: 'none',
      worldMatrix: 'none',
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

    const childPolygon = clipPolygonByAxisAlignedLine(target.polygon, op.line, op.movingSide);
    const remainingPolygon = clipPolygonByAxisAlignedLine(target.polygon, op.line, op.movingSide === 1 ? -1 : 1);
    if (childPolygon.length < 3 || remainingPolygon.length < 3) {
      invalidOps[op.id] = 'Fold line does not split target polygon';
      continue;
    }

    target.polygon = remainingPolygon;
    target.children.push(op.childNodeId);
    const localMatrix = axisAlignedFoldTransform(op.line, op.angleDeg);
    nodes[op.childNodeId] = {
      id: op.childNodeId,
      parentId: target.id,
      polygon: childPolygon,
      hinge: op.line,
      angleDeg: op.angleDeg,
      sourceOpId: op.id,
      children: [],
      localMatrix,
      worldMatrix: localMatrix,
      depth: target.depth + 1,
      valid: true
    };
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

function pointInPolygon(point: Point2, polygon: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    const crosses = (pi.y > point.y) !== (pj.y > point.y)
      && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y || 1e-12) + pi.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function hitTestFoldTree(stagePoint: Point2, tree: DerivedFoldTree): FoldHit | null {
  for (const nodeId of [...tree.renderOrder].reverse()) {
    const node = tree.nodes[nodeId];
    if (pointInPolygon(stagePoint, node.polygon)) {
      return { nodeId, localPoint: stagePoint };
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
      transform: node.worldMatrix,
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
  private snapshot: Snapshot | null = null;

  constructor(private readonly options: InteractiveRuntimeOptions) {
    this.state = {
      paper: options.paper,
      camera: defaultCamera(options.paper, options.camera),
      foldOps: cloneFoldOps(options.foldOps ?? []),
      controls: {}
    };
    this.tree = buildDerivedFoldTree(this.state);
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
    if (event.type === 'pointerup' || event.type === 'click') {
      target.click();
      return true;
    }
    target.dispatchEvent(new Event(event.type, { bubbles: true }));
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
