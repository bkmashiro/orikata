import { test, expect } from '@playwright/test';

test('folded demo bridges button feedback and text input', async ({ page }) => {
  await page.goto('/demo/');

  const target = await page.locator('#target').boundingBox();
  expect(target).not.toBeNull();

  await expect(page.locator('#clickCount')).toHaveCount(0);
  await expect(page.locator('#sourceValue')).toHaveCount(0);

  const initialFlapTransform = await page.locator('[data-ori-node-id="upper-corner-flap"]').evaluate((node) => getComputedStyle(node).transform);
  await page.mouse.click(target!.x + 290, target!.y + 150);
  await expect(page.locator('#saveFeedback')).toHaveText(/saved/i);
  await expect(page.locator('#foldStage')).toHaveAttribute('data-feedback', 'saved');
  const feedbackFlapTransform = await page.locator('[data-ori-node-id="upper-corner-flap"]').evaluate((node) => getComputedStyle(node).transform);
  expect(feedbackFlapTransform).not.toBe(initialFlapTransform);

  await page.mouse.click(target!.x + 290, target!.y + 97);
  const proxy = page.locator('.ori-input-proxy');
  await expect(proxy).toBeVisible();
  const proxyBox = await proxy.boundingBox();
  expect(proxyBox).not.toBeNull();
  expect(proxyBox!.x).toBeGreaterThan(target!.x + 250);
  expect(proxyBox!.y).toBeGreaterThan(target!.y + 70);
  await proxy.fill('Bob');

  await expect(page.locator('#nameInput')).toHaveValue('Bob');
});

test('fold tooling highlights candidate lines and edits the selected angle with a dial', async ({ page }) => {
  await page.goto('/demo/');

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

test('crease guides are attached to folded facets instead of a flat global overlay', async ({ page }) => {
  await page.goto('/demo/');

  const centerLayer = page.locator('[data-tool-node="root"]');
  const cornerLayer = page.locator('[data-tool-node="right-panel"]');
  await expect(centerLayer).toHaveAttribute('data-tool-id', 'center-valley');
  await expect(cornerLayer).toHaveAttribute('data-tool-id', 'corner-mountain');

  const rightPanelTransform = await page.locator('[data-ori-node-id="right-panel"]').evaluate((node) => getComputedStyle(node).transform);
  const cornerGuideTransform = await cornerLayer.evaluate((node) => getComputedStyle(node).transform);
  expect(cornerGuideTransform).toBe(rightPanelTransform);
  expect(cornerGuideTransform).not.toBe('none');
});
