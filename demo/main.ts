import { ROOT_ID, StaticImageSnapshotProvider, buildBakedOrigamiManifest, createFoldPlan, createOrigamiRuntime, inspectFoldPlan } from '../src/index';

const target = document.querySelector<HTMLElement>('#target');
const button = document.querySelector<HTMLButtonElement>('#toggle');
const saveBtn = document.querySelector<HTMLButtonElement>('#saveBtn');
const nameInput = document.querySelector<HTMLInputElement>('#nameInput');
const copyInstall = document.querySelector<HTMLButtonElement>('#copyInstall');
const installCommand = document.querySelector<HTMLElement>('#installCommand');
const foldStage = document.querySelector<HTMLElement>('#foldStage');
const activeFoldName = document.querySelector<HTMLElement>('#activeFoldName');
const angleValue = document.querySelector<HTMLElement>('#angleValue');
const angleDial = document.querySelector<HTMLElement>('#angleDial');
const angleHand = document.querySelector<HTMLElement>('#angleHand');
const creaseTools = document.querySelector<HTMLElement>('#creaseTools');
const liveMirrorTarget = document.querySelector<HTMLElement>('#liveMirrorTarget');
const squareFoldTarget = document.querySelector<HTMLElement>('#squareFoldTarget');
const complexDomTarget = document.querySelector<HTMLElement>('#complexDomTarget');

if (!target || !button || !saveBtn || !nameInput || !copyInstall || !installCommand || !foldStage || !activeFoldName || !angleValue || !angleDial || !angleHand || !creaseTools || !liveMirrorTarget || !squareFoldTarget || !complexDomTarget) {
  throw new Error('Demo DOM is missing required elements');
}

const stageElement = foldStage;
const activeNameElement = activeFoldName;
const angleValueElement = angleValue;
const angleDialElement = angleDial;
const angleHandElement = angleHand;
const creaseToolHost = creaseTools;
const liveMirrorTargetElement = liveMirrorTarget;
const squareFoldTargetElement = squareFoldTarget;
const complexDomTargetElement = complexDomTarget;
const targetElement = target;
const saveButtonElement = saveBtn;
const nameInputElement = nameInput;
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

function setSnapshotInputValue(value: string): void {
  targetElement.dataset.inputValue = value;
  refreshSnapshotTexture();
}

targetElement.addEventListener('focusin', (event) => {
  if ((event.target as HTMLElement).classList?.contains('ori-input-proxy')) targetElement.dataset.inputActive = 'true';
});
targetElement.addEventListener('focusout', (event) => {
  if ((event.target as HTMLElement).classList?.contains('ori-input-proxy')) delete targetElement.dataset.inputActive;
});

let feedbackTimer: number | undefined;
saveButtonElement.addEventListener('click', () => {
  window.clearTimeout(feedbackTimer);
  saveButtonElement.textContent = 'Saved';
  refreshSnapshotTexture();

  feedbackTimer = window.setTimeout(() => {
    saveButtonElement.textContent = 'Save';
    refreshSnapshotTexture();
  }, 620);
});
nameInputElement.addEventListener('input', () => {
  setSnapshotInputValue(nameInputElement.value);
});

const mainFoldPlan = createFoldPlan({ width: 420, height: 220 })
  .foldRight({ id: 'quarter-fold-1', childId: 'right-three-quarter-panel', x: 105, angle: 45 })
  .foldRight({ id: 'quarter-fold-2', childId: 'right-half-panel', target: 'right-three-quarter-panel', x: 210, angle: -45 })
  .foldRight({ id: 'quarter-fold-3', childId: 'right-quarter-panel', target: 'right-half-panel', x: 315, angle: 45 });

const foldOps = mainFoldPlan.foldOps;
const foldPlanInspection = inspectFoldPlan({ paper: { width: 420, height: 220 }, foldOps });
if (foldPlanInspection.warnings.length > 0) {
  stageElement.dataset.foldWarnings = foldPlanInspection.warnings.map((warning) => warning.code).join(' ');
}

const foldAngles: Record<string, number> = {
  'quarter-fold-1': 45,
  'quarter-fold-2': -45,
  'quarter-fold-3': 45
};
const foldLabels: Record<string, string> = {
  'quarter-fold-1': 'quarter fold 1',
  'quarter-fold-2': 'quarter fold 2',
  'quarter-fold-3': 'quarter fold 3'
};
let activeFoldId = 'quarter-fold-3';

function applyFoldAngle(id: string, angle: number): void {
  foldAngles[id] = Math.max(-85, Math.min(85, Math.round(angle)));
  runtime?.setAngle(id, foldAngles[id]);
  renderCreaseTools();
  stageElement.dataset.activeFold = activeFoldId;
  stageElement.dataset.fold1Angle = String(foldAngles['quarter-fold-1']);
  stageElement.dataset.fold2Angle = String(foldAngles['quarter-fold-2']);
  stageElement.dataset.fold3Angle = String(foldAngles['quarter-fold-3']);
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
    id: 'quarter-fold-1',
    nodeId: ROOT_ID,
    guide: { x1: 105, y1: 0, x2: 105, y2: 220 },
    hot: { x1: 105, y1: 0, x2: 105, y2: 220 }
  },
  {
    id: 'quarter-fold-2',
    nodeId: 'right-three-quarter-panel',
    guide: { x1: 210, y1: 0, x2: 210, y2: 220 },
    hot: { x1: 210, y1: 0, x2: 210, y2: 220 }
  },
  {
    id: 'quarter-fold-3',
    nodeId: 'right-half-panel',
    guide: { x1: 315, y1: 0, x2: 315, y2: 220 },
    hot: { x1: 315, y1: 0, x2: 315, y2: 220 }
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
    hotspot.className = `crease-hotspot ${guide.id}`;
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

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSnapshotSvg(name: string, buttonLabel: string): string {
  const safeName = escapeSvgText(name || '\u00a0');
  const safeButton = escapeSvgText(buttonLabel || 'Save');
  const buttonFill = buttonLabel === 'Saved' ? '#b65f45' : '#2b2f2a';
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
  <path d="M105 0v220M210 0v220M315 0v220" stroke="#2b2f2a" stroke-opacity="0.22" stroke-width="1.1" stroke-dasharray="6 8"/>
  <g filter="url(#bleed)">
    <circle cx="84" cy="86" r="40" fill="none" stroke="#1f2420" stroke-opacity="0.16" stroke-width="12"/>
    <text x="32" y="58" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="28" fill="#1f2420">Washi form</text>
    <text x="34" y="91" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">one real DOM</text>
    <text x="34" y="111" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">folded like paper</text>
    <path d="M270 112h100" stroke="#1f2420" stroke-opacity=".42" stroke-width="1"/>
    <text x="282" y="102" font-family="system-ui, sans-serif" font-size="13" fill="#1f2420">${safeName}</text>
    <rect x="270" y="132" width="100" height="36" fill="${buttonFill}" fill-opacity="${buttonLabel === 'Saved' ? '0.86' : '1'}"/>
    <text x="320" y="155" text-anchor="middle" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="13" fill="#f7f1e4">${safeButton}</text>
    <circle cx="385" cy="32" r="18" fill="#b65f45" fill-opacity="0.18"/>
  </g>
</svg>`;
}

const snapshot = {
  id: 'washi-asanoha-card',
  width: 420,
  height: 220,
  url: `data:image/svg+xml,${encodeURIComponent(buildSnapshotSvg(nameInputElement.value, saveButtonElement.textContent || 'Save'))}`
};

function refreshSnapshotTexture(): void {
  snapshot.url = `data:image/svg+xml,${encodeURIComponent(buildSnapshotSvg(nameInputElement.value, saveButtonElement.textContent || 'Save'))}`;
  runtime.setAngles?.([
    { opId: 'quarter-fold-1', angleDeg: foldAngles['quarter-fold-1'] },
    { opId: 'quarter-fold-2', angleDeg: foldAngles['quarter-fold-2'] },
    { opId: 'quarter-fold-3', angleDeg: foldAngles['quarter-fold-3'] }
  ]);
}


function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function buildSquareCollapseSvg(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260">
  <defs>
    <pattern id="squareAsanoha" width="40" height="34.64" patternUnits="userSpaceOnUse">
      <path d="M20 0v34.64M0 17.32h40M0 17.32 20 0l20 17.32-20 17.32zM0 17.32 20 34.64M40 17.32 20 34.64M0 17.32 20 0M40 17.32 20 0" fill="none" stroke="#314037" stroke-opacity="0.14" stroke-width="1"/>
    </pattern>
    <filter id="squarePaper" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.016 0.05" numOctaves="3" seed="21" result="noise"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.1"/></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>
  <rect width="260" height="260" fill="#efe3cb"/>
  <rect width="260" height="260" fill="url(#squareAsanoha)"/>
  <g filter="url(#squarePaper)">
    <circle cx="130" cy="126" r="52" fill="none" stroke="#1f2420" stroke-opacity="0.17" stroke-width="17"/>
    <path d="M66 130h128M130 66v128" stroke="#1f2420" stroke-opacity="0.22" stroke-width="1.2"/>
    <text x="130" y="125" text-anchor="middle" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="22" fill="#1f2420">四隅</text>
    <text x="130" y="150" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#5f5a51">corner collapse</text>
    <circle cx="54" cy="54" r="12" fill="#b65f45" fill-opacity="0.32"/>
    <circle cx="206" cy="54" r="12" fill="#b65f45" fill-opacity="0.32"/>
    <circle cx="206" cy="206" r="12" fill="#b65f45" fill-opacity="0.32"/>
    <circle cx="54" cy="206" r="12" fill="#b65f45" fill-opacity="0.32"/>
  </g>
  <path d="M-10 80 80 -10M180 -10 270 80M270 180 180 270M80 270 -10 180" stroke="#766f64" stroke-opacity="0.42" stroke-dasharray="6 8"/>
  <path d="M0 130h260" stroke="#2b2f2a" stroke-opacity="0.28" stroke-dasharray="7 9"/>
</svg>`;
}

function buildComplexDomSvg(): string {
  const cards = [
    '<rect x="20" y="54" width="86" height="58" rx="8" fill="#f8f1e5" stroke="#2b2f2a" stroke-opacity="0.12"/><text x="34" y="78" font-family="system-ui" font-size="10" fill="#766f64">queue</text><path d="M34 94h48" stroke="#b65f45" stroke-width="5" stroke-linecap="round"/><path d="M34 104h32" stroke="#2b2f2a" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>',
    '<rect x="126" y="44" width="88" height="78" rx="8" fill="#f8f1e5" stroke="#2b2f2a" stroke-opacity="0.12"/><circle cx="154" cy="82" r="18" fill="none" stroke="#b65f45" stroke-width="7" stroke-opacity=".65"/><path d="M184 66v36M196 76v26" stroke="#2b2f2a" stroke-opacity=".24" stroke-width="6" stroke-linecap="round"/>',
    '<rect x="234" y="58" width="84" height="52" rx="8" fill="#f8f1e5" stroke="#2b2f2a" stroke-opacity="0.12"/><path d="M250 92 266 76l16 10 20-22" fill="none" stroke="#b65f45" stroke-width="3"/><circle cx="250" cy="92" r="3" fill="#b65f45"/><circle cx="302" cy="64" r="3" fill="#b65f45"/>',
    '<rect x="24" y="142" width="290" height="48" rx="9" fill="#f8f1e5" stroke="#2b2f2a" stroke-opacity="0.12"/><circle cx="50" cy="166" r="12" fill="#2b2f2a" fill-opacity=".18"/><path d="M76 157h80M76 174h54M178 157h58M178 174h106" stroke="#2b2f2a" stroke-opacity=".24" stroke-width="4" stroke-linecap="round"/>'
  ].join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220" viewBox="0 0 340 220">
  <defs>
    <linearGradient id="complexWash" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#f3ead8"/><stop offset="1" stop-color="#e7d8be"/>
    </linearGradient>
    <pattern id="complexGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0v24" fill="none" stroke="#2b2f2a" stroke-opacity="0.045"/>
    </pattern>
  </defs>
  <rect width="340" height="220" fill="url(#complexWash)"/>
  <rect width="340" height="220" fill="url(#complexGrid)"/>
  <text x="20" y="32" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="24" fill="#1f2420">Signal garden</text>
  <text x="320" y="31" text-anchor="end" font-family="system-ui" font-size="10" fill="#766f64">complex DOM</text>
  ${cards}
  <path d="M113 0v220M227 0v220" stroke="#766f64" stroke-opacity="0.36" stroke-dasharray="7 9"/>
</svg>`;
}

type ExampleMode = 'static' | 'interactive' | 'baked';

function buildCodeSnapshotSvg(code: string, mode: ExampleMode, status = 'idle'): string {
  const lines = code.split('\n').slice(0, mode === 'baked' ? 7 : 6);
  const rows = lines.map((line, index) => {
    const y = 23 + index * 14;
    return `<text x="16" y="${y}" font-family="SF Mono, SFMono-Regular, Menlo, Consolas, monospace" font-size="10.4" fill="#252922">${escapeSvgText(line)}</text>`;
  }).join('');
  const accent = mode === 'interactive' ? '#b65f45' : mode === 'baked' ? '#766f64' : '#2b2f2a';
  const creaseStroke = mode === 'interactive' ? '#766f64' : accent;
  const label = mode === 'interactive' ? (status === 'clicked' ? 'Clicked' : 'Tap') : mode === 'baked' ? 'Frozen' : 'View';
  const button = mode === 'interactive'
    ? `<rect x="52" y="96" width="72" height="28" fill="${accent}"/><text x="88" y="114" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#f7f1e4">${label}</text>`
    : `<text x="194" y="114" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="${accent}">${label}</text>`;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="248" height="148" viewBox="0 0 248 148">
  <defs>
    <pattern id="kozo" width="22" height="22" patternUnits="userSpaceOnUse">
      <path d="M0 11h22M11 0v22" stroke="#2b2f2a" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
    <filter id="paperNoise" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.06" numOctaves="3" seed="11" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.1"/></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>
  <rect width="248" height="148" fill="#f3ead8"/>
  <rect width="248" height="148" fill="url(#kozo)"/>
  <path d="M88 0v148" stroke="${creaseStroke}" stroke-opacity="0.42" stroke-width="1.4" stroke-dasharray="5 7"/>
  <g filter="url(#paperNoise)">${rows}</g>
  ${button}
</svg>`;
}


async function mountStaticShowcases(): Promise<void> {
  const squareRuntime = createOrigamiRuntime({
    mode: 'static-view',
    host: squareFoldTargetElement,
    paper: { width: 260, height: 260 },
    snapshot: { id: 'square-collapse', width: 260, height: 260, url: svgDataUrl(buildSquareCollapseSvg()) },
    foldOps: [
      { id: 'corner-tl', targetNodeId: ROOT_ID, childNodeId: 'corner-tl-panel', line: { a: { x: -10, y: 80 }, b: { x: 80, y: -10 } }, movingSide: 1, angleDeg: 58 },
      { id: 'corner-tr', targetNodeId: ROOT_ID, childNodeId: 'corner-tr-panel', line: { a: { x: 180, y: -10 }, b: { x: 270, y: 80 } }, movingSide: 1, angleDeg: 58 },
      { id: 'square-mid-up', targetNodeId: ROOT_ID, childNodeId: 'square-bottom-half', line: { a: { x: 0, y: 130 }, b: { x: 260, y: 130 } }, movingSide: -1, angleDeg: -44 },
      { id: 'corner-br', targetNodeId: 'square-bottom-half', childNodeId: 'corner-br-panel', line: { a: { x: 270, y: 180 }, b: { x: 180, y: 270 } }, movingSide: 1, angleDeg: 58 },
      { id: 'corner-bl', targetNodeId: 'square-bottom-half', childNodeId: 'corner-bl-panel', line: { a: { x: 80, y: 270 }, b: { x: -10, y: 180 } }, movingSide: 1, angleDeg: 58 }
    ]
  });
  await squareRuntime.mount();
  squareFoldTargetElement.dataset.rendered = 'true';

  const complexRuntime = createOrigamiRuntime({
    mode: 'static-view',
    host: complexDomTargetElement,
    paper: { width: 340, height: 220 },
    snapshot: { id: 'complex-dom-graphic', width: 340, height: 220, url: svgDataUrl(buildComplexDomSvg()) },
    foldOps: [
      { id: 'complex-left-fold', targetNodeId: ROOT_ID, childNodeId: 'complex-mid-panel', line: { a: { x: 113, y: 0 }, b: { x: 113, y: 220 } }, movingSide: 1, angleDeg: -34 },
      { id: 'complex-right-fold', targetNodeId: 'complex-mid-panel', childNodeId: 'complex-right-panel', line: { a: { x: 227, y: 0 }, b: { x: 227, y: 220 } }, movingSide: 1, angleDeg: 38 }
    ]
  });
  await complexRuntime.mount();
  complexDomTargetElement.dataset.rendered = 'true';

  const startedAt = performance.now();
  const quantizeAngle = (value: number) => Math.round(value * 4) / 4;
  const animate = (now: number) => {
    const t = (Math.sin((now - startedAt) / 1300) + 1) / 2;
    const ease = t * t * (3 - 2 * t);
    const corner = quantizeAngle(12 + ease * 54);
    const mid = quantizeAngle(-8 - ease * 42);
    squareRuntime.setAngles?.([
      { opId: 'corner-tl', angleDeg: corner },
      { opId: 'corner-tr', angleDeg: corner },
      { opId: 'corner-br', angleDeg: corner },
      { opId: 'corner-bl', angleDeg: corner },
      { opId: 'square-mid-up', angleDeg: mid }
    ]);
    complexRuntime.setAngles?.([
      { opId: 'complex-left-fold', angleDeg: quantizeAngle(-12 - ease * 34) },
      { opId: 'complex-right-fold', angleDeg: quantizeAngle(12 + ease * 34) }
    ]);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

async function mountLiveMirrorSpike(): Promise<void> {
  const sourceRoot = liveMirrorTargetElement.querySelector<HTMLElement>('.live-card-source');
  if (!sourceRoot) return;
  const liveRuntime = createOrigamiRuntime({
    mode: 'interactive-bridge',
    host: liveMirrorTargetElement,
    sourceRoot,
    paper: { width: 300, height: 144 },
    foldOps: [
      {
        id: 'live-quarter-fold-1',
        targetNodeId: ROOT_ID,
        childNodeId: 'live-right-three-quarter-panel',
        line: { a: { x: 75, y: 0 }, b: { x: 75, y: 144 } },
        movingSide: 1,
        angleDeg: 45
      },
      {
        id: 'live-quarter-fold-2',
        targetNodeId: 'live-right-three-quarter-panel',
        childNodeId: 'live-right-half-panel',
        line: { a: { x: 150, y: 0 }, b: { x: 150, y: 144 } },
        movingSide: 1,
        angleDeg: -45
      },
      {
        id: 'live-quarter-fold-3',
        targetNodeId: 'live-right-half-panel',
        childNodeId: 'live-right-quarter-panel',
        line: { a: { x: 225, y: 0 }, b: { x: 225, y: 144 } },
        movingSide: 1,
        angleDeg: 45
      }
    ],
    snapshotProvider: new StaticImageSnapshotProvider({ id: 'live-mirror-unused-snapshot', width: 300, height: 144, url: '' }),
    visual: { backend: 'live-mirror', pseudoStates: { hover: true, active: true } }
  });
  await liveRuntime.mount();

  const animateLiveThirdFold = (now: number) => {
    const ease = (Math.sin(now / 760) + 1) / 2;
    liveRuntime.setAngle('live-quarter-fold-3', Math.round(45 + ease * 35));
    requestAnimationFrame(animateLiveThirdFold);
  };
  requestAnimationFrame(animateLiveThirdFold);

  liveMirrorTargetElement.dataset.liveMirrorReady = 'true';
}

const codeFoldOps = [
  {
    id: 'code-button-fold',
    targetNodeId: ROOT_ID,
    childNodeId: 'code-right-panel',
    line: { a: { x: 88, y: 0 }, b: { x: 88, y: 148 } },
    movingSide: 1 as const,
    angleDeg: -45
  }
];

async function mountFoldedCodeExamples(): Promise<void> {
  const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-code-fold]'));
  await Promise.all(blocks.map(async (host, index) => {
    const mode = (host.dataset.exampleMode || 'static') as ExampleMode;
    const source = host.querySelector<HTMLElement>('.code-fold-source');
    const code = source?.textContent?.trim() || '';
    const snapshotFor = (status = host.dataset.bridgeStatus || 'idle') => ({
      id: `code-example-${mode}-${index}`,
      width: 248,
      height: 148,
      url: `data:image/svg+xml,${encodeURIComponent(buildCodeSnapshotSvg(code, mode, status))}`
    });

    if (mode === 'interactive') {
      const interactiveSnapshot = snapshotFor();
      const snapshotProvider = new StaticImageSnapshotProvider(interactiveSnapshot);
      const action = host.querySelector<HTMLButtonElement>('[data-example-action]');
      action?.addEventListener('click', () => {
        host.dataset.bridgeStatus = 'clicked';
        interactiveSnapshot.url = snapshotFor('clicked').url;
        interactiveRuntime.setAngle('code-button-fold', -45);
      });
      const interactiveRuntime = createOrigamiRuntime({
        mode: 'interactive-bridge',
        host,
        sourceRoot: source!,
        paper: { width: 248, height: 148 },
        foldOps: codeFoldOps,
        snapshotProvider
      });
      host.addEventListener('pointerup', (event) => {
        const rect = host.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        if (localX >= 0 && localX <= 124 && localY >= 0 && localY <= 148) action?.click();
      });
      await interactiveRuntime.mount();
    } else if (mode === 'baked') {
      const manifest = buildBakedOrigamiManifest({
        paper: { width: 248, height: 148 },
        snapshot: snapshotFor(),
        foldOps: codeFoldOps
      });
      const bakedRuntime = createOrigamiRuntime({ mode: 'baked-view', host, manifest });
      await bakedRuntime.mount();
      host.dataset.bakedAngleMutable = String(bakedRuntime.setAngle('code-button-fold', 0));
    } else {
      const codeRuntime = createOrigamiRuntime({
        mode: 'static-view',
        host,
        paper: { width: 248, height: 148 },
        snapshot: snapshotFor(),
        foldOps: codeFoldOps
      });
      await codeRuntime.mount();
    }
    host.dataset.rendered = 'true';
  }));
}

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
setSnapshotInputValue(nameInputElement.value);
await mountLiveMirrorSpike();
await mountStaticShowcases();
await mountFoldedCodeExamples();
startIntroAnimation();

function startIntroAnimation(): void {
  stageElement.dataset.toolsReady = 'true';
  renderCreaseTools();
  applyFoldAngle(activeFoldId, foldAngles[activeFoldId]);
}

button.addEventListener('click', () => {
  folded = !folded;
  foldAngles['quarter-fold-1'] = folded ? 45 : 0;
  foldAngles['quarter-fold-2'] = folded ? -45 : 0;
  foldAngles['quarter-fold-3'] = folded ? 45 : 0;
  runtime.setAngles?.([
    { opId: 'quarter-fold-1', angleDeg: foldAngles['quarter-fold-1'] },
    { opId: 'quarter-fold-2', angleDeg: foldAngles['quarter-fold-2'] },
    { opId: 'quarter-fold-3', angleDeg: foldAngles['quarter-fold-3'] }
  ]);
  renderCreaseTools();
  applyFoldAngle(activeFoldId, foldAngles[activeFoldId]);
});
