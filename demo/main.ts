import { ROOT_ID, StaticImageSnapshotProvider, createOrigamiRuntime } from '../src/index';

const target = document.querySelector<HTMLElement>('#target');
const button = document.querySelector<HTMLButtonElement>('#toggle');
const saveBtn = document.querySelector<HTMLButtonElement>('#saveBtn');
const nameInput = document.querySelector<HTMLInputElement>('#nameInput');
const visualSave = document.querySelector<HTMLElement>('#visualSave');
const typedValue = document.querySelector<HTMLElement>('#typedValue');
const controlOverlay = document.querySelector<HTMLElement>('#controlOverlay');
const copyInstall = document.querySelector<HTMLButtonElement>('#copyInstall');
const installCommand = document.querySelector<HTMLElement>('#installCommand');
const foldStage = document.querySelector<HTMLElement>('#foldStage');
const activeFoldName = document.querySelector<HTMLElement>('#activeFoldName');
const angleValue = document.querySelector<HTMLElement>('#angleValue');
const angleDial = document.querySelector<HTMLElement>('#angleDial');
const angleHand = document.querySelector<HTMLElement>('#angleHand');
const creaseTools = document.querySelector<HTMLElement>('#creaseTools');

if (!target || !button || !saveBtn || !nameInput || !visualSave || !typedValue || !controlOverlay || !copyInstall || !installCommand || !foldStage || !activeFoldName || !angleValue || !angleDial || !angleHand || !creaseTools) {
  throw new Error('Demo DOM is missing required elements');
}

const stageElement = foldStage;
const activeNameElement = activeFoldName;
const angleValueElement = angleValue;
const angleDialElement = angleDial;
const angleHandElement = angleHand;
const creaseToolHost = creaseTools;
const targetElement = target;
const visualSaveElement = visualSave;
const typedValueElement = typedValue;
const controlOverlayElement = controlOverlay;
const copyInstallButton = copyInstall;
const installCommandElement = installCommand;

copyInstallButton.addEventListener('click', async () => {
  const command = installCommandElement.textContent?.trim() || 'npm install orikata';
  try {
    await navigator.clipboard?.writeText(command);
  } catch {
    const scratch = document.createElement('textarea');
    scratch.value = command;
    scratch.style.position = 'fixed';
    scratch.style.opacity = '0';
    document.body.appendChild(scratch);
    scratch.select();
    document.execCommand('copy');
    scratch.remove();
  }
  copyInstallButton.textContent = 'copied';
  window.setTimeout(() => { copyInstallButton.textContent = 'copy'; }, 1100);
});

function setVisualInputValue(value: string): void {
  typedValueElement.textContent = value || '\u00a0';
  targetElement.dataset.inputValue = value;
}

function syncControlOverlayTransform(): void {
  const foldedPanel = targetElement.querySelector<HTMLElement>('[data-ori-node-id="upper-corner-flap"]');
  if (!foldedPanel) return;
  controlOverlayElement.style.transform = foldedPanel.style.transform || getComputedStyle(foldedPanel).transform;
}

targetElement.addEventListener('focusin', (event) => {
  if ((event.target as HTMLElement).classList?.contains('ori-input-proxy')) targetElement.dataset.inputActive = 'true';
});
targetElement.addEventListener('focusout', (event) => {
  if ((event.target as HTMLElement).classList?.contains('ori-input-proxy')) delete targetElement.dataset.inputActive;
});

let feedbackTimer: number | undefined;
saveBtn.addEventListener('click', () => {
  window.clearTimeout(feedbackTimer);
  const baseAngle = foldAngles['corner-mountain'];
  saveBtn.textContent = 'Saved';
  visualSaveElement.textContent = 'Saved';
  visualSaveElement.dataset.state = 'saved';
  stageElement.dataset.feedback = 'saved';
  runtime?.setAngle('corner-mountain', Math.min(72, baseAngle + 10));
  syncControlOverlayTransform();
  renderCreaseTools();

  feedbackTimer = window.setTimeout(() => {
    runtime?.setAngle('corner-mountain', baseAngle);
    syncControlOverlayTransform();
    renderCreaseTools();
    saveBtn.textContent = 'Save';
    visualSaveElement.textContent = 'Save';
    delete visualSaveElement.dataset.state;
    delete stageElement.dataset.feedback;
  }, 620);
});
nameInput.addEventListener('input', () => {
  setVisualInputValue(nameInput.value);
});

const foldOps = [
  {
    id: 'center-valley',
    targetNodeId: ROOT_ID,
    childNodeId: 'right-panel',
    line: { a: { x: 210, y: 0 }, b: { x: 210, y: 220 } },
    movingSide: 1 as const,
    angleDeg: -60
  },
  {
    id: 'corner-mountain',
    targetNodeId: 'right-panel',
    childNodeId: 'upper-corner-flap',
    line: { a: { x: 300, y: 0 }, b: { x: 420, y: 80 } },
    movingSide: 1 as const,
    angleDeg: 48
  }
];

const foldAngles: Record<string, number> = {
  'center-valley': -60,
  'corner-mountain': 48
};
const foldLabels: Record<string, string> = {
  'center-valley': 'center valley',
  'corner-mountain': 'corner mountain'
};
let activeFoldId = 'corner-mountain';

function applyFoldAngle(id: string, angle: number): void {
  foldAngles[id] = Math.max(-85, Math.min(85, Math.round(angle)));
  runtime?.setAngle(id, foldAngles[id]);
  syncControlOverlayTransform();
  renderCreaseTools();
  stageElement.dataset.activeFold = activeFoldId;
  stageElement.dataset.centerAngle = String(foldAngles['center-valley']);
  stageElement.dataset.cornerAngle = String(foldAngles['corner-mountain']);
  angleValueElement.textContent = `${foldAngles[activeFoldId]}°`;
  angleDialElement.setAttribute('aria-valuenow', String(foldAngles[activeFoldId]));
  angleHandElement.style.transform = `rotate(${foldAngles[activeFoldId]}deg)`;
}

function setCandidateState(id: string, state: 'idle' | 'hover' | 'selected'): void {
  for (const line of targetElement.querySelectorAll<HTMLElement>('[data-fold-candidate], .crease-tool-layer[data-tool-id]')) {
    if (line.dataset.foldCandidate === id || line.dataset.toolId === id) line.dataset.state = state;
  }
}

const creaseGuides = [
  {
    id: 'center-valley',
    nodeId: ROOT_ID,
    guide: { x1: 210, y1: 0, x2: 210, y2: 220 },
    hot: { x1: 210, y1: 0, x2: 210, y2: 220 }
  },
  {
    id: 'corner-mountain',
    nodeId: 'right-panel',
    guide: { x1: 300, y1: 0, x2: 420, y2: 80 },
    hot: { x1: 300, y1: 0, x2: 420, y2: 80 }
  }
] as const;

function svgLine(attrs: Record<string, string | number>, className: string): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('class', className);
  for (const [key, value] of Object.entries(attrs)) line.setAttribute(key, String(value));
  return line;
}

function renderCreaseTools(): void {
  creaseToolHost.remove();
  for (const oldLayer of targetElement.querySelectorAll(':scope > .crease-tool-layer')) oldLayer.remove();
  for (const guide of creaseGuides) {
    const foldedNode = targetElement.querySelector<HTMLElement>(`[data-ori-node-id="${guide.nodeId}"]`);
    if (!foldedNode) continue;

    const layer = document.createElement('div');
    layer.className = 'crease-tool-layer';
    layer.dataset.toolNode = guide.nodeId;
    layer.dataset.toolId = guide.id;
    layer.dataset.state = guide.id === activeFoldId ? 'selected' : 'idle';
    layer.style.transform = foldedNode.style.transform || getComputedStyle(foldedNode).transform;

    const hotspot = document.createElement('button');
    hotspot.type = 'button';
    hotspot.className = `crease-hotspot ${guide.id === 'center-valley' ? 'center' : 'corner'}`;
    hotspot.dataset.foldCandidate = guide.id;
    hotspot.dataset.state = guide.id === activeFoldId ? 'selected' : 'idle';
    hotspot.setAttribute('aria-label', `select ${foldLabels[guide.id]} crease`);
    hotspot.addEventListener('mouseenter', () => {
      if (guide.id !== activeFoldId) setCandidateState(guide.id, 'hover');
    });
    hotspot.addEventListener('mouseleave', () => {
      if (guide.id !== activeFoldId) setCandidateState(guide.id, 'idle');
    });
    hotspot.addEventListener('click', (event) => {
      event.stopPropagation();
      setActiveFold(guide.id);
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'fold-tool-layer');
    svg.setAttribute('viewBox', '0 0 420 220');
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(svgLine(guide.guide, 'candidate-guide'));
    svg.appendChild(svgLine(guide.hot, 'candidate-line'));

    layer.appendChild(hotspot);
    layer.appendChild(svg);
    targetElement.appendChild(layer);
  }
  syncControlOverlayTransform();
}

function setActiveFold(id: string): void {
  activeFoldId = id;
  activeNameElement.textContent = foldLabels[id] ?? id;
  for (const guide of creaseGuides) setCandidateState(guide.id, guide.id === id ? 'selected' : 'idle');
  applyFoldAngle(id, foldAngles[id] ?? 0);
}

function angleFromPointer(event: PointerEvent): number {
  const rect = angleDialElement.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const deg = Math.atan2(event.clientY - cy, event.clientX - cx) * 180 / Math.PI;
  return Math.max(-85, Math.min(85, Math.round(deg)));
}

function updateAngleFromPointer(event: PointerEvent): void {
  applyFoldAngle(activeFoldId, angleFromPointer(event));
}

angleDialElement.addEventListener('pointerdown', (event) => {
  angleDialElement.setPointerCapture(event.pointerId);
  updateAngleFromPointer(event);
});
angleDialElement.addEventListener('pointermove', (event) => {
  if (angleDialElement.hasPointerCapture(event.pointerId)) updateAngleFromPointer(event);
});
angleDialElement.addEventListener('click', (event) => updateAngleFromPointer(event));
angleDialElement.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  applyFoldAngle(activeFoldId, foldAngles[activeFoldId] + (event.key === 'ArrowRight' ? 5 : -5));
});

const snapshotSvg = `
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
    <circle cx="385" cy="32" r="18" fill="#b65f45" fill-opacity="0.18"/>
  </g>
</svg>`;

const snapshot = {
  id: 'washi-asanoha-card',
  width: 420,
  height: 220,
  url: `data:image/svg+xml,${encodeURIComponent(snapshotSvg)}`
};

const runtime = createOrigamiRuntime({
  mode: 'interactive-bridge',
  host: target,
  sourceRoot: target.querySelector<HTMLElement>('.card-source')!,
  paper: { width: 420, height: 220 },
  foldOps,
  snapshotProvider: new StaticImageSnapshotProvider(snapshot)
});

let folded = true;
await runtime.mount();
setVisualInputValue(nameInput.value);
syncControlOverlayTransform();
startIntroAnimation();

function startIntroAnimation(): void {
  const start = -60;
  const end = 0;
  const duration = 950;
  const startedAt = performance.now();
  stageElement.dataset.intro = 'folding';
  delete stageElement.dataset.toolsReady;

  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const angle = Math.round(start + (end - start) * eased);
    foldAngles['center-valley'] = angle;
    runtime.setAngle('center-valley', angle);
    syncControlOverlayTransform();
    stageElement.dataset.centerAngle = String(angle);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    foldAngles['center-valley'] = 0;
    runtime.setAngle('center-valley', 0);
    syncControlOverlayTransform();
    stageElement.dataset.centerAngle = '0';
    stageElement.dataset.toolsReady = 'true';
    delete stageElement.dataset.intro;
    renderCreaseTools();
  };

  requestAnimationFrame(tick);
}

button.addEventListener('click', () => {
  folded = !folded;
  foldAngles['center-valley'] = 0;
  foldAngles['corner-mountain'] = folded ? 48 : 0;
  runtime.setAngle('center-valley', foldAngles['center-valley']);
  runtime.setAngle('corner-mountain', foldAngles['corner-mountain']);
  syncControlOverlayTransform();
  renderCreaseTools();
  applyFoldAngle(activeFoldId, foldAngles[activeFoldId]);
});
