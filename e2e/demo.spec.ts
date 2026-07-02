import { test, expect } from '@playwright/test';

async function waitForIntro(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('#foldStage')).toHaveAttribute('data-tools-ready', 'true');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-center-angle', '0');
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

  const initialFlapTransform = await page.locator('[data-ori-node-id="upper-corner-flap"]').evaluate((node) => getComputedStyle(node).transform);
  await page.mouse.click(target!.x + 290, target!.y + 150);
  await expect.poll(async () => decodeURIComponent(await page.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage))).toContain('>Saved<');
  const feedbackFlapTransform = await page.locator('[data-ori-node-id="upper-corner-flap"]').evaluate((node) => getComputedStyle(node).transform);
  expect(feedbackFlapTransform).toBe(initialFlapTransform);

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

  const corner = page.locator('[data-fold-candidate="corner-mountain"]');
  await expect(corner).toBeAttached();
  await expect(page.locator('#foldStage')).toHaveAttribute('data-active-fold', 'corner-mountain');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-center-angle', '0');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-corner-angle', '48');
  await expect(corner).toHaveAttribute('data-state', 'selected');

  const center = page.locator('[data-fold-candidate="center-valley"]');
  await center.hover();
  await expect(center).toHaveAttribute('data-state', 'hover');
  await center.click();
  await expect(page.locator('#activeFoldName')).toHaveText(/center valley/i);
  await expect(center).toHaveAttribute('data-state', 'selected');

  const dial = page.locator('#angleDial');
  await dial.click({ position: { x: 60, y: 33 } });

  await expect(page.locator('#foldStage')).not.toHaveAttribute('data-center-angle', '0');
  await expect(page.locator('#angleValue')).not.toHaveText('0°');
});

test('live mirror spike renders visual clones and syncs folded hover state', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  const live = page.locator('#liveMirrorTarget');
  await expect(live).toHaveAttribute('data-live-mirror-ready', 'true');
  await expect(live.locator('.ori-live-mirror')).toHaveCount(3);
  await expect(live.locator('#liveMirrorButton')).toHaveCount(1);
  await expect(live.locator('[data-fold-original-id="liveMirrorButton"]')).toHaveCount(3);
  await expect(live.locator('.ori-live-mirror').first()).toHaveCSS('pointer-events', 'none');

  const box = await live.boundingBox();
  expect(box).not.toBeNull();
  await live.scrollIntoViewIfNeeded();
  const visibleBox = await live.boundingBox();
  expect(visibleBox).not.toBeNull();
  await page.mouse.move(visibleBox!.x + 210, visibleBox!.y + 74);
  await expect(live.locator('.ori-live-mirror [data-fold-hover="true"]').first()).toHaveAttribute('data-fold-original-id', 'liveMirrorButton');
  await expect(live.locator('.ori-live-mirror [data-fold-hover="true"]').first()).toHaveCSS('background-color', 'rgb(182, 95, 69)');
  await expect(live.locator('.ori-live-mirror .live-shine').first()).toHaveCSS('animation-name', 'live-shine');
});

test('example snippets are rendered as folded code surfaces', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  await expect(page.locator('[data-code-fold]')).toHaveCount(3);
  await expect(page.locator('[data-code-fold][data-rendered="true"]')).toHaveCount(3);
  const firstFold = page.locator('[data-code-fold]').first();
  await expect(firstFold.locator('[data-ori-node-id="code-right-panel"]')).toBeAttached();
  await expect(firstFold.locator('[data-ori-node-id="code-corner-flap"]')).toBeAttached();
  await expect(firstFold.locator('.code-fold-source')).toHaveCSS('font-family', /SF Mono|SFMono-Regular|ui-monospace/);
  const foldedCodeTexture = await firstFold.locator('.ori-fold-paint').first().evaluate((node) => (node as HTMLElement).style.backgroundImage);
  expect(decodeURIComponent(foldedCodeTexture)).toContain("mode: 'static-view'");
});

test('crease guides are attached to folded facets instead of a flat global overlay', async ({ page }) => {
  await page.goto('/demo/');
  await waitForIntro(page);

  const centerLayer = page.locator('[data-tool-node="root"]');
  const cornerLayer = page.locator('[data-tool-node="right-panel"]');
  await expect(centerLayer).toHaveAttribute('data-tool-id', 'center-valley');
  await expect(cornerLayer).toHaveAttribute('data-tool-id', 'corner-mountain');

  const rightPanelTransform = await page.locator('[data-ori-node-id="right-panel"]').evaluate((node) => getComputedStyle(node).transform);
  const cornerGuideTransform = await cornerLayer.evaluate((node) => getComputedStyle(node).transform);
  expect(cornerGuideTransform).toBe(rightPanelTransform);
  expect(cornerGuideTransform).not.toBe('none');
});
