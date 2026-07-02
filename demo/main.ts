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
    id: 'center-valley',
    targetNodeId: ROOT_ID,
    childNodeId: 'right-panel',
    line: { a: { x: 210, y: 0 }, b: { x: 210, y: 220 } },
    movingSide: 1 as const,
    angleDeg: -46
  },
  {
    id: 'corner-mountain',
    targetNodeId: 'right-panel',
    childNodeId: 'upper-corner-flap',
    line: { a: { x: 210, y: 0 }, b: { x: 420, y: 108 } },
    movingSide: -1 as const,
    angleDeg: 28
  }
];

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
  <path d="M210 0v220" stroke="#2b2f2a" stroke-opacity="0.33" stroke-width="1.4" stroke-dasharray="7 8"/>
  <path d="M210 0 420 108" stroke="#b65f45" stroke-opacity="0.46" stroke-width="1.2" stroke-dasharray="5 7"/>
  <g filter="url(#bleed)">
    <circle cx="84" cy="86" r="40" fill="none" stroke="#1f2420" stroke-opacity="0.16" stroke-width="12"/>
    <text x="32" y="58" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="28" fill="#1f2420">Washi form</text>
    <text x="34" y="91" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">one real DOM</text>
    <text x="34" y="111" font-family="system-ui, sans-serif" font-size="13" fill="#5f5a51">folded like paper</text>
    <rect x="270" y="82" width="100" height="30" fill="rgba(255,255,255,.72)" stroke="#1f2420" stroke-opacity=".28"/>
    <text x="282" y="102" font-family="system-ui, sans-serif" font-size="13" fill="#1f2420">Aoi</text>
    <rect x="270" y="132" width="100" height="36" fill="#2b2f2a"/>
    <text x="320" y="155" text-anchor="middle" font-family="Hiragino Mincho ProN, Yu Mincho, Georgia, serif" font-size="13" fill="#f7f1e4">Save</text>
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

button.addEventListener('click', () => {
  folded = !folded;
  runtime.setAngle('center-valley', folded ? -46 : 0);
  runtime.setAngle('corner-mountain', folded ? 28 : 0);
});
