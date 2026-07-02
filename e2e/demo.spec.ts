import { test, expect } from '@playwright/test';

async function waitForIntro(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('#foldStage')).toHaveAttribute('data-tools-ready', 'true');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-fold1-angle', '45');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-fold2-angle', '-45');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-fold3-angle', '45');
}

test('install command copies and folded demo bridges button feedback and text input', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  await page.locator('#copyInstall').click();
  await expect(page.locator('#copyInstall')).toHaveText('copied');

  const target = await page.locator('#target').boundingBox();
  expect(target).not.toBeNull();

  await expect(page.locator('#clickCount')).toHaveCount(0);
  await expect(page.locator('#sourceValue')).toHaveCount(0);
  await expect(page.locator('#saveFeedback')).toHaveCount(0);
  await expect(page.locator('#target > .ori-source-layer')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('#target > .ori-source-layer')).toHaveCSS('pointer-events', 'none');
  const snapshotBackground = await page.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage);
  expect(decodeURIComponent(snapshotBackground)).toContain('>Save<');
  expect(decodeURIComponent(snapshotBackground)).toContain('>Aoi<');
  await expect(page.locator('#controlOverlay')).toHaveCount(0);

  const initialQuarterTransform = await page.locator('[data-ori-node-id="right-quarter-panel"]').evaluate((node) => getComputedStyle(node).transform);
  await page.mouse.click(target!.x + 290, target!.y + 150);
  await expect.poll(async () => decodeURIComponent(await page.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage))).toContain('>Saved<');
  const feedbackQuarterTransform = await page.locator('[data-ori-node-id="right-quarter-panel"]').evaluate((node) => getComputedStyle(node).transform);
  expect(feedbackQuarterTransform).toBe(initialQuarterTransform);

  await page.mouse.click(target!.x + 290, target!.y + 97);
  const proxy = page.locator('.ori-input-proxy');
  await expect(proxy).toBeAttached();
  await expect(proxy).toHaveCSS('opacity', '0');
  const proxyBox = await proxy.boundingBox();
  expect(proxyBox).not.toBeNull();
  expect(proxyBox!.x).toBeGreaterThan(target!.x + 250);
  expect(proxyBox!.y).toBeGreaterThan(target!.y + 70);
  await proxy.fill('Bob');

  await expect(page.locator('#nameInput')).toHaveValue('Bob');
  await expect.poll(async () => decodeURIComponent(await page.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage))).toContain('>Bob<');
});

test('fold tooling highlights candidate lines and edits the selected angle with a dial', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  const third = page.locator('[data-fold-candidate="quarter-fold-3"]');
  await expect(third).toBeAttached();
  await expect(third).toHaveCSS('width', '32px');
  await expect(page.locator('[data-fold-candidate="quarter-fold-1"]')).toHaveCSS('width', '32px');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-active-fold', 'quarter-fold-3');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-fold1-angle', '45');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-fold2-angle', '-45');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-fold3-angle', '45');
  await expect(third).toHaveAttribute('data-state', 'selected');

  const second = page.locator('[data-fold-candidate="quarter-fold-2"]');
  await second.dispatchEvent('mouseenter');
  await expect(second).toHaveAttribute('data-state', 'hover');
  await second.evaluate((node: HTMLElement) => node.click());
  await expect(page.locator('#activeFoldName')).toHaveText(/quarter fold 2/i);
  await expect(second).toHaveAttribute('data-state', 'selected');

  const dial = page.locator('#angleDial');
  await dial.click({ position: { x: 60, y: 33 } });

  await expect(page.locator('#foldStage')).not.toHaveAttribute('data-fold2-angle', '-45');
  await expect(page.locator('#angleValue')).not.toHaveText('-45°');
});

test('live mirror backend renders visual clones and syncs folded hover state', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  const live = page.locator('#liveMirrorTarget');
  await expect(live).toHaveAttribute('data-live-mirror-ready', 'true');
  await expect(live.locator('.ori-live-mirror')).toHaveCount(4);
  await expect(live.locator('#liveMirrorButton')).toHaveCount(1);
  await expect(live.locator('[data-fold-original-id="liveMirrorButton"]')).toHaveCount(4);
  await expect(live.locator('.ori-live-mirror').first()).toHaveCSS('pointer-events', 'none');

  const livePanelTransform = await live.locator('[data-ori-node-id="live-right-three-quarter-panel"]').evaluate((node) => getComputedStyle(node).transform);
  expect(livePanelTransform).not.toBe('none');
  const liveHalfPanelTransform = await live.locator('[data-ori-node-id="live-right-half-panel"]').evaluate((node) => getComputedStyle(node).transform);
  expect(liveHalfPanelTransform).not.toBe('none');
  const liveQuarterPanelTransform = await live.locator('[data-ori-node-id="live-right-quarter-panel"]').evaluate((node) => getComputedStyle(node).transform);
  expect(liveQuarterPanelTransform).not.toBe('none');
  await expect(live.locator('[data-ori-node-id="live-last-third-panel"]')).toHaveCount(0);
  await expect(live.locator('[data-ori-node-id="live-button-flap"]')).toHaveCount(0);

  const box = await live.boundingBox();
  expect(box).not.toBeNull();
  await live.scrollIntoViewIfNeeded();
  const visibleBox = await live.boundingBox();
  expect(visibleBox).not.toBeNull();
  await page.mouse.move(visibleBox!.x + 200, visibleBox!.y + 74);
  await expect(live.locator('.ori-live-mirror [data-fold-hover="true"]').first()).toHaveAttribute('data-fold-original-id', 'liveMirrorButton');
  await expect(live.locator('.ori-live-mirror [data-fold-hover="true"]').first()).toHaveCSS('background-color', 'rgb(182, 95, 69)');
  await page.mouse.move(visibleBox!.x - 24, visibleBox!.y - 24);
  await expect(live.locator('.ori-live-mirror [data-fold-hover="true"]')).toHaveCount(0);
  await page.mouse.move(visibleBox!.x + 200, visibleBox!.y + 74);
  await expect(live.locator('.ori-live-mirror [data-fold-hover="true"]').first()).toHaveAttribute('data-fold-original-id', 'liveMirrorButton');
  await expect(live.locator('.ori-live-mirror .live-shine').first()).toHaveCSS('animation-name', 'live-shine');
  await expect(live.locator('.ori-live-mirror [data-fold-original-id="liveMirrorButton"]').first()).toHaveCSS('overflow', 'hidden');
});

test('static showcase demos render animated folded surfaces', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  const square = page.locator('[data-static-showcase="square"]');
  const complex = page.locator('[data-static-showcase="complex"]');
  await expect(square).toHaveAttribute('data-rendered', 'true');
  await expect(complex).toHaveAttribute('data-rendered', 'true');
  await expect(square.locator('.ori-interaction-layer')).toHaveCount(0);
  await expect(complex.locator('.ori-interaction-layer')).toHaveCount(0);
  await expect(square.locator('[data-ori-node-id="corner-tl-panel"]')).toBeAttached();
  await expect(square.locator('[data-ori-node-id="corner-br-panel"]')).toBeAttached();
  await expect(complex.locator('[data-ori-node-id="complex-right-panel"]')).toBeAttached();
  const squareCornerTransform = await square.locator('[data-ori-node-id="corner-tl-panel"]').evaluate((node) => getComputedStyle(node).transform);
  const complexTransform = await complex.locator('[data-ori-node-id="complex-right-panel"]').evaluate((node) => getComputedStyle(node).transform);
  expect(squareCornerTransform).not.toBe('none');
  expect(complexTransform).not.toBe('none');
});

test('example mode cards show distinct static, interactive, and baked behavior', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  await expect(page.locator('[data-code-fold]')).toHaveCount(3);
  await expect(page.locator('[data-code-fold][data-rendered="true"]')).toHaveCount(3);

  const staticFold = page.locator('[data-example-mode="static"]');
  await expect(staticFold.locator('[data-ori-node-id="code-right-panel"]')).toBeAttached();
  await expect(staticFold.locator('.code-fold-source')).toHaveCSS('font-family', /SF Mono|SFMono-Regular|ui-monospace/);
  await expect(staticFold.locator('.ori-interaction-layer')).toHaveCount(0);
  const codePanelTransform = await staticFold.locator('[data-ori-node-id="code-right-panel"]').evaluate((node) => getComputedStyle(node).transform);
  expect(codePanelTransform).not.toBe('none');
  const staticTexture = await staticFold.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage);
  expect(decodeURIComponent(staticTexture)).toContain("mode: 'static-view'");
  expect(decodeURIComponent(staticTexture)).not.toContain('>static<');
  expect(decodeURIComponent(staticTexture)).not.toContain('>bridge<');
  expect(decodeURIComponent(staticTexture)).not.toContain('>manifest<');

  const interactiveFold = page.locator('[data-example-mode="interactive"]');
  await interactiveFold.scrollIntoViewIfNeeded();
  await expect(interactiveFold.locator('.ori-interaction-layer')).toHaveCount(1);
  await expect(interactiveFold).toHaveAttribute('data-bridge-status', 'idle');
  const interactiveBox = await interactiveFold.boundingBox();
  expect(interactiveBox).not.toBeNull();
  await page.mouse.click(interactiveBox!.x + 88, interactiveBox!.y + 110);
  await expect(interactiveFold).toHaveAttribute('data-bridge-status', 'clicked');
  const interactiveTexture = await expect.poll(async () => decodeURIComponent(await interactiveFold.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage)));
  await interactiveTexture.toContain('Clicked');
  await interactiveTexture.toContain('stroke="#766f64"');

  const bakedFold = page.locator('[data-example-mode="baked"]');
  await expect(bakedFold).toHaveAttribute('data-baked-angle-mutable', 'false');
  await expect(bakedFold.locator('.ori-fold-paint[data-ori-baked="true"]')).not.toHaveCount(0);
  const bakedTexture = await bakedFold.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage);
  expect(decodeURIComponent(bakedTexture)).toContain('manifest');
});

test('crease guides are attached to folded facets instead of a flat global overlay', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  const firstLayer = page.locator('[data-tool-node="root"]');
  const secondLayer = page.locator('[data-tool-node="right-three-quarter-panel"]');
  const thirdLayer = page.locator('[data-tool-node="right-half-panel"]');
  await expect(firstLayer).toHaveAttribute('data-tool-id', 'quarter-fold-1');
  await expect(secondLayer).toHaveAttribute('data-tool-id', 'quarter-fold-2');
  await expect(thirdLayer).toHaveAttribute('data-tool-id', 'quarter-fold-3');

  const halfPanelTransform = await page.locator('[data-ori-node-id="right-half-panel"]').evaluate((node) => getComputedStyle(node).transform);
  const thirdGuideTransform = await thirdLayer.evaluate((node) => getComputedStyle(node).transform);
  expect(thirdGuideTransform).toBe(halfPanelTransform);
  expect(thirdGuideTransform).not.toBe('none');
});
