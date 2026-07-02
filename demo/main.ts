import { ROOT_ID, StaticImageSnapshotProvider, createOrigamiRuntime } from '../src/index';

const target = document.querySelector<HTMLElement>('#target');
const button = document.querySelector<HTMLButtonElement>('#toggle');
const saveBtn = document.querySelector<HTMLButtonElement>('#saveBtn');
const nameInput = document.querySelector<HTMLInputElement>('#nameInput');
const clickCount = document.querySelector<HTMLElement>('#clickCount');
const sourceValue = document.querySelector<HTMLElement>('#sourceValue');

if (!target || !button || !saveBtn || !nameInput || !clickCount || !sourceValue) {
  throw new Error('Demo DOM is missing required elements');
}

let clicks = 0;
saveBtn.addEventListener('click', () => {
  clicks += 1;
  clickCount.textContent = String(clicks);
});
nameInput.addEventListener('input', () => {
  sourceValue.textContent = nameInput.value;
});

const foldOps = [
  {
    id: 'fold-right',
    targetNodeId: ROOT_ID,
    childNodeId: 'right-panel',
    line: { a: { x: 210, y: 0 }, b: { x: 210, y: 220 } },
    movingSide: 1 as const,
    angleDeg: -35
  }
];

const snapshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#67e8f9"/>
      <stop offset="0.55" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#f472b6"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#111827" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="420" height="220" rx="24" fill="url(#g)"/>
  <path d="M210 0v220" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="32" y="65" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="34" fill="white">Paper UI</text>
  <text x="32" y="96" font-family="Inter, system-ui, sans-serif" font-size="15" fill="rgba(255,255,255,.82)">Click the folded button or</text>
  <text x="32" y="118" font-family="Inter, system-ui, sans-serif" font-size="15" fill="rgba(255,255,255,.82)">type into the folded input.</text>
  <rect x="270" y="82" width="100" height="30" rx="10" fill="white" fill-opacity="0.95"/>
  <text x="283" y="102" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#334155">Alice</text>
  <rect x="270" y="132" width="100" height="36" rx="18" fill="white" filter="url(#shadow)"/>
  <text x="304" y="155" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="13" fill="#111827">Save</text>
</svg>`;

const snapshot = {
  id: 'demo-card',
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

button.addEventListener('click', () => {
  folded = !folded;
  runtime.setAngle('fold-right', folded ? -35 : 0);
});
