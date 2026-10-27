import { test, expect } from '@playwright/test';

async function scene(page: any, world: number, x = 120) {
  await page.evaluate(({world, x}: any) => {
    const s = (window as any).__ashify.scene.getScene('Gateway');
    s.go(world);
  }, {world, x});
  await expect.poll(() => page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').world)).toBe(world);
  await page.waitForTimeout(700);
  await page.evaluate(x => { const s = (window as any).__ashify.scene.getScene('Gateway'); s.player.setPosition(x, 600); }, x);
}

test('three open areas, optional hobbies, immediate portfolio and ending', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', {name: 'START ADVENTURE'}).click();
  await expect(page.locator('.hud')).toContainText('A LITTLE ABOUT ASH');
  await page.evaluate(() => {const s = (window as any).__ashify.scene.getScene('Gateway'); s.player.setPosition(240,600);});
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ashify-v3')!).tasks)).toContain('hobby-tennis');
  await page.getByRole('button', {name: 'World map'}).click();
  await expect(page.locator('.world-map button')).toHaveCount(3);
  await expect(page.locator('.world-map button:disabled')).toHaveCount(0);
  await page.getByRole('button', {name: 'Close', exact: true}).click();
  await page.getByRole('button', {name: 'View my work'}).click();
  await expect(page.locator('.hud')).toContainText('THE PORTFOLIO');
  await page.waitForTimeout(800);
  await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.setPosition(280,600));
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('2D Games');
  await page.getByRole('button', {name: 'BACK TO PORTFOLIO'}).click();
  await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.setPosition(2700,600));
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('Hi, I’m Ash.');
  expect(errors).toEqual([]);
});

test('astronomy is three quick stars and an optional telescope', async ({page}) => {
  await page.goto('/'); await page.getByRole('button', {name:'START ADVENTURE'}).click();
  await scene(page, 1, 390);
  await page.keyboard.press('1'); await page.keyboard.press('2'); await page.keyboard.press('3');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ashify-v3')!).tasks)).toContain('discovery-stars');
  await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.setPosition(920,600));
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('Curiosity has no limits.');
  await page.screenshot({path:'design/observatory-preview.png'});
});

test('mobile touch, clear paths, smooth scene and old progress migration', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(() => localStorage.setItem('ashify-v2', JSON.stringify({world:6,unlockedWorld:6,skills:['2d'],tasks:[],stars:[]})));
  await page.goto('/'); await page.getByRole('button', {name:'CONTINUE ADVENTURE'}).click();
  await expect(page.locator('.hud')).toContainText('A LITTLE ABOUT ASH');
  await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.setPosition(240,600));
  await page.getByRole('button', {name:'interact',exact:true}).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ashify-v3')!).tasks)).toContain('hobby-tennis');
  expect(await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').platforms.getLength())).toBe(1);
  await page.screenshot({path:'design/hobbies-mobile-preview.png'});
  await page.getByRole('button', {name:'View my work'}).click();
  await expect(page.locator('.hud')).toContainText('THE PORTFOLIO');
  await page.setViewportSize({width:1440,height:1000});
  await page.waitForTimeout(800);
  await page.screenshot({path:'design/portfolio-preview.png'});
});
