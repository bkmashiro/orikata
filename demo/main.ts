import { createFold3D } from '../src/index';

const target = document.querySelector<HTMLElement>('#target');
const button = document.querySelector<HTMLButtonElement>('#toggle');

if (!target || !button) throw new Error('Demo DOM is missing required elements');

const fold = createFold3D(target, { angle: 0, perspective: 900 });
let folded = false;

button.addEventListener('click', () => {
  folded = !folded;
  fold.setAngle(folded ? -28 : 0);
});
