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
