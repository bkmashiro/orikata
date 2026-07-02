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

const snapshot = {
  id: 'demo-gradient',
  width: 420,
  height: 220,
  url: 'linear-gradient(135deg, #60a5fa, #a78bfa 55%, #f472b6)'
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
