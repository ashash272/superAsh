import { test, expect } from '@playwright/test';
async function start(page: any) {
  await page.goto('/');
  await page.getByRole('button', { name: 'START ADVENTURE' }).click();
  await page.waitForTimeout(750);
}
async function hobby(page: any, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.locator('.activity-guide')).toContainText(name.toUpperCase());
}
async function value(page: any, prop: string) {
  return page.evaluate(
    (prop: string) => (window as any).__ashify.scene.getScene('Gateway').logic.mini?.[prop],
    prop,
  );
}

test('all hobbies play in one continuous stage with character animation and physical returns', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  for (const name of ['Tennis', 'Padel']) {
    await hobby(page, name);
    await page.waitForTimeout(250);
    await page.screenshot({ path: 'design/' + name.toLowerCase() + '-world.png' });
    expect(await value(page, 'score')).toBe(0);
    await page.keyboard.press('e');
    expect(await value(page, 'score')).toBe(0);
    for (let hit = 0; hit < 3; hit++) {
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const m = (window as any).__ashify.scene.getScene('Gateway').logic.mini;
              return (
                m.phase === 'incoming' &&
                Math.abs(m.ball.x - m.actor.x) < 70 &&
                m.ball.y < 600 &&
                m.time - m.swingAt > 600
              );
            }),
          { intervals: [40], timeout: 10000 },
        )
        .toBe(true);
      await page.keyboard.press('e');
      await expect.poll(() => value(page, 'phase')).toBe('return');
      await expect.poll(() => value(page, 'score'), { timeout: 4000 }).toBe(hit + 1);
    }
    await expect.poll(() => value(page, 'finished')).toBe(true);
    await page.getByRole('button', { name: 'Leave activity' }).click();
  }
  for (const name of ['Yoga']) {
    await hobby(page, name);
    await page.keyboard.down('e');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'design/' + name.toLowerCase() + '-world.png' });
    await expect.poll(() => value(page, 'poseIndex'), { timeout: 5000 }).toBeGreaterThan(0);
    await expect.poll(() => value(page, 'finished'), { timeout: 10000 }).toBe(true);
    await page.keyboard.up('e');
    await page.getByRole('button', { name: 'Leave activity' }).click();
  }
  await hobby(page, 'Archery');
  await page.screenshot({ path: 'design/archery-world.png' });
  for (let i = 0; i < 3; i++) {
    await page.keyboard.down('e');
    await page.waitForTimeout(750);
    expect(await value(page, 'draw')).toBeGreaterThan(0.8);
    await page.keyboard.up('e');
    await expect.poll(() => value(page, 'score'), { timeout: 3000 }).toBe(i + 1);
  }
  expect(errors).toEqual([]);
});

test('hobby navigation, pause, leave and portfolio shortcut preserve a usable world', async ({
  page,
}) => {
  await start(page);
  await hobby(page, 'Yoga');
  await page.keyboard.down('e');
  await page.waitForTimeout(400);
  await page.keyboard.up('e');
  await page.getByRole('button', { name: 'Pause game' }).click();
  const progress = await value(page, 'progress');
  await page.waitForTimeout(400);
  expect(await value(page, 'progress')).toBe(progress);
  await page.getByRole('button', { name: 'RESUME ADVENTURE' }).click();
  await hobby(page, 'Padel');
  await page.getByRole('button', { name: 'Leave activity' }).click();
  await expect(page.locator('.activity-guide')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.visible),
  ).toBe(true);
  await page.getByRole('button', { name: 'View my work' }).click();
  await expect(page.locator('.hud')).toContainText('THE PORTFOLIO');
  await page.getByRole('button', { name: 'World map' }).click();
  await expect(page.locator('.world-map button')).toHaveCount(2);
  await expect(page.locator('.world-map button:disabled')).toHaveCount(0);
});

test.describe('mobile', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('touch swing and full court remain visible on phone', async ({ page }) => {
    await start(page);
    await hobby(page, 'Tennis');
    await page.screenshot({ path: 'design/tennis-world-mobile.png' });
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const m = (window as any).__ashify.scene.getScene('Gateway').logic.mini;
            return Math.abs(m.ball.x - m.actor.x) < 60 && m.ball.y < 600;
          }),
        { timeout: 10000, intervals: [40] },
      )
      .toBe(true);
    await page.getByRole('button', { name: 'interact', exact: true }).tap();
    await expect.poll(() => value(page, 'phase')).toBe('return');
    await expect.poll(() => value(page, 'score')).toBe(1);
    await page.getByRole('button', { name: 'Leave activity' }).tap();
    await expect(page.locator('.activity-guide')).toHaveCount(0);
  });
});

test('four spaces, left-facing movement and three complete yoga frames', async ({ page }) => {
  await start(page);
  await expect(page.locator('.hobby-navigation button')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Pilates', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Flexibility', exact: true })).toHaveCount(0);
  await page.keyboard.down('d');
  await page.waitForTimeout(300);
  await page.keyboard.up('d');
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.flipX),
  ).toBe(false);
  await page.keyboard.down('a');
  await page.waitForTimeout(250);
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.flipX),
  ).toBe(true);
  await page.screenshot({ path: 'design/ash-facing-left.png' });
  await page.keyboard.up('a');
  await hobby(page, 'Yoga');
  for (let i = 0; i < 3; i++) {
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).__ashify.scene.getScene('Gateway').logic.mini.actor.frame.name,
        ),
      )
      .toBe(String(i));
    expect(
      await page.evaluate(
        () => (window as any).__ashify.scene.getScene('Gateway').logic.mini.actor.texture.key,
      ),
    ).toBe('ash-yoga');
    await page.screenshot({ path: `design/yoga-fixed-${i}.png` });
    await page.keyboard.down('e');
    await expect
      .poll(() => value(page, 'poseIndex'), { timeout: 5000, intervals: [50] })
      .toBe(i + 1);
    await page.keyboard.up('e');
  }
  expect(
    await page.evaluate(
      () =>
        (window as any).__ashify.scene
          .getScene('Gateway')
          .children.list.filter((o: any) => o.name.startsWith('world-meteor')).length,
    ),
  ).toBe(7);
});

test('observatory removed, old saves migrate and astronomy animates within hobbies', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ashify-v3',
      JSON.stringify({ world: 1, unlockedWorld: 2, tasks: ['hobby-yoga'], skills: [], stars: [] }),
    ),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'CONTINUE ADVENTURE' }).click();
  await expect(page.locator('.hud')).toContainText('I love astronomy');
  const before = await page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway');
    const p = s.children.getByName('world-planet-0');
    return { x: p.x, y: p.y };
  });
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(() => {
      const p = (window as any).__ashify.scene
        .getScene('Gateway')
        .children.getByName('world-planet-0');
      return { x: p.x, y: p.y };
    }),
  ).not.toEqual(before);
  await page.getByRole('button', { name: 'World map' }).click();
  await expect(page.locator('.world-map button')).toHaveCount(2);
  await expect(page.locator('.world-map')).not.toContainText('OBSERVATORY');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway');
    s.player.setPosition(4350, 600);
  });
  await page.keyboard.press('e');
  await expect(page.locator('.hud')).toContainText('THE PORTFOLIO');
  expect(
    await page.evaluate(
      () =>
        (window as any).__ashify.scene.getScene('Gateway').children.getByName('universe-sky')
          ?.displayTexture.key,
    ),
  ).toBe('universe-panorama');
});

test('sky parallax and planet locations follow travel in both stages', async ({ page }) => {
  await start(page);
  const snapshot = () =>
    page.evaluate(() => {
      const s = (window as any).__ashify.scene.getScene('Gateway'),
        p = s.children.getByName('world-planet-0'),
        sky = s.children.getByName('universe-sky');
      return {
        offset: sky.tilePositionX,
        screenX: p.x - s.cameras.main.scrollX * p.scrollFactorX,
        factor: p.scrollFactorX,
      };
    });
  const before = await snapshot();
  await page.keyboard.down('d');
  await page.waitForTimeout(3500);
  await page.keyboard.up('d');
  const after = await snapshot();
  expect(after.offset).toBeGreaterThan(before.offset + 30);
  expect(after.screenX).toBeLessThan(before.screenX - 150);
  expect(after.factor).toBe(0.78);
  await page.screenshot({ path: 'design/universe-travel.png' });
  await page.getByRole('button', { name: 'View my work' }).click();
  await expect(page.locator('.hud')).toContainText('THE PORTFOLIO');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'design/universe-portfolio.png' });
  expect((await snapshot()).factor).toBe(0.78);
});
