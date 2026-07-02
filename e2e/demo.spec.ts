import { test, expect } from '@playwright/test';

test('folded demo bridges button click and text input', async ({ page }) => {
  await page.goto('/demo/');

  const target = await page.locator('#target').boundingBox();
  expect(target).not.toBeNull();

  await expect(page.locator('#clickCount')).toHaveText('0');
  await page.mouse.click(target!.x + 290, target!.y + 150);
  await expect(page.locator('#clickCount')).toHaveText('1');

  await page.mouse.click(target!.x + 290, target!.y + 97);
  const proxy = page.locator('.ori-input-proxy');
  await expect(proxy).toBeVisible();
  await proxy.fill('Bob');

  await expect(page.locator('#sourceValue')).toHaveText('Bob');
});

test('fold tooling highlights candidate lines and edits the selected angle with a dial', async ({ page }) => {
  await page.goto('/demo/');

  const corner = page.locator('[data-fold-candidate="corner-mountain"]');
  await expect(corner).toBeAttached();
  await corner.hover();
  await expect(corner).toHaveAttribute('data-state', 'hover');

  const center = page.locator('[data-fold-candidate="center-valley"]');
  await center.click();
  await expect(page.locator('#activeFoldName')).toHaveText(/center valley/i);
  await expect(center).toHaveAttribute('data-state', 'selected');

  await expect(page.locator('#foldStage')).toHaveAttribute('data-active-fold', 'center-valley');
  await expect(page.locator('#foldStage')).toHaveAttribute('data-center-angle', '-46');

  const dial = page.locator('#angleDial');
  await dial.click({ position: { x: 60, y: 33 } });

  await expect(page.locator('#foldStage')).not.toHaveAttribute('data-center-angle', '-46');
  await expect(page.locator('#angleValue')).not.toHaveText('-46°');
});
