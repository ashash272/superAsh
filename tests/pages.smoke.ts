import { test, expect } from '@playwright/test';

test('Pages build loads the game and artwork under /superAsh/', async ({ page }) => {
  const errors: string[] = [];
  const assets: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname !== '127.0.0.1' || !url.pathname.includes('/assets/')) return;
    assets.push(url.pathname);
    if (response.status() !== 200 || !url.pathname.startsWith('/superAsh/assets/')) {
      errors.push(`${response.status()} ${url.pathname}`);
    }
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'START ADVENTURE' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.getByRole('button', { name: 'Character design', exact: true }).click();
  await expect.poll(() => page.locator('.design-sheet').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(assets).toContain('/superAsh/assets/character/ash-animations.png');
  expect(assets).toContain('/superAsh/assets/character/ash-approved.png');

  expect(errors).toEqual([]);
});
