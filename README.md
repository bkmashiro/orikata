# Fold3D

Pseudo-3D origami/folding effects for DOM elements.

## 当前状态

项目脚手架已准备好，等待实现方案落地真实 renderer。

- TypeScript library entry: `src/index.ts`
- Vite demo: `demo/index.html`, `demo/main.ts`
- Vitest test: `tests/index.test.ts`
- Build output target: `dist/`

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## API placeholder

```ts
import { createFold3D } from 'fold3d';

const fold = createFold3D(element, {
  segments: 6,
  axis: 'y',
  angle: -20,
  perspective: 900
});

fold.setAngle(0);
fold.destroy();
```
