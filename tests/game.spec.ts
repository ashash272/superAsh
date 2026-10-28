import { test, expect } from '@playwright/test';
async function start(page: any) {
  await page.goto('/');
  await page.getByRole('button', { name: 'START ADVENTURE' }).click();
  await page.waitForTimeout(750);
}
async function hobby(page: any, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
  await expect(page.locator('.activity-guide')).toContainText(name);
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

test.describe('portrait polish', () => {
  test.use({ hasTouch: true, deviceScaleFactor: 3, viewport: { width: 390, height: 844 } });
  test('sharp canvas, compact controls, readable menu and animated introduction', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'START ADVENTURE' })).toBeEnabled();
    await page.screenshot({ path: 'design/portrait-start.png' });
    const pixels = await page.locator('canvas').evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      css: c.getBoundingClientRect().width,
    }));
    expect(pixels.width / pixels.css).toBeGreaterThanOrEqual(1.95);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await expect(page.getByRole('button', { name: /My disciplines/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'START ADVENTURE' }).tap();
    await expect(page.locator('.hud')).not.toContainText('I love astronomy');
    await page.waitForTimeout(900);
    const playerY = () =>
      page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.y);
    const groundedY = await playerY();
    await page.getByRole('button', { name: 'jump', exact: true }).tap();
    await expect.poll(playerY, { intervals: [50] }).toBeLessThan(groundedY - 15);
    await page.getByRole('button', { name: 'Yoga', exact: true }).tap();
    const guide = await page.locator('.activity-guide').boundingBox();
    expect(guide!.height).toBeLessThan(75);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'design/portrait-yoga.png' });
    await page
      .getByRole('button', { name: 'interact', exact: true })
      .dispatchEvent('pointerdown', { pointerId: 1 });
    await expect.poll(() => value(page, 'progress')).toBeGreaterThan(0.2);
    await page
      .getByRole('button', { name: 'interact', exact: true })
      .dispatchEvent('pointerup', { pointerId: 1 });
    await page.getByRole('button', { name: 'Leave activity' }).tap();
    await page.getByRole('button', { name: 'Pause game' }).tap();
    await page.screenshot({ path: 'design/portrait-pause.png' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: 'design/desktop-pause.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: 'Character design', exact: true })).toHaveCount(
      0,
    );
    await page.getByRole('button', { name: 'RESUME ADVENTURE' }).tap();
    await page.getByRole('button', { name: 'View my work' }).tap();
    await expect(page.locator('.hud')).toContainText('THE PORTFOLIO');
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const s = (window as any).__ashify.scene.getScene('Gateway');
      s.player.setPosition(2700, 600);
    });
    await page.getByRole('button', { name: 'interact', exact: true }).tap();
    await expect(page.locator('.talking-portrait')).toBeVisible();
    await expect(page.locator('.talking-portrait')).toHaveClass(/is-waving/);
    await page.screenshot({ path: 'design/ash-fullbody-wave.png' });
    await expect(page.locator('.talking-body')).toHaveCSS('transform', 'none');
    await expect(page.locator('.talking-body')).toHaveCSS('background-position', '0px 0px');
    await expect(page.locator('.talking-mouth')).toHaveCount(0);
    await expect(page.locator('.talking-portrait')).toHaveCSS('transform', 'none');
    await expect(page.locator('.talking-body')).toHaveCSS('transform', 'none');
    await expect(page.locator('.greeting')).toContainText('I’m a game developer.', {
      timeout: 8000,
    });
    await expect(page.locator('.ash-wink')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('.talking-portrait')).toHaveClass(/is-victory/);
    await expect(page.locator('.wink-stars span')).toHaveCount(7);
    await page.screenshot({ path: 'design/ash-wink-stars.png' });
    await expect(page.locator('.ash-wink')).not.toHaveClass(/active/);
    await expect(page.locator('.final-panel')).not.toContainText('cosmic dreamer');
    await expect(page.locator('.final-panel')).not.toContainText('adventure lover');
    await page.screenshot({ path: 'design/portrait-meet-ash.png' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: 'design/desktop-meet-ash.png' });
    expect(errors).toEqual([]);
  });
});

test('portal labels highlight nearby and interaction guide stays visible', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'View my work' }).click();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway');
    s.player.setPosition(280, 600);
  });
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway');
    return s.prompt.visible && s.prompt.text.includes('Open 2D Games');
  })).toBe(true);
  expect(await page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway');
    return s.children.getByName('portal-label').scaleX;
  })).toBeGreaterThan(1.04);
  await page.screenshot({path: 'design/portal-labels.png'});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').prompt.visible)).toBe(true);
  await page.screenshot({path: 'design/portal-labels-mobile.png'});
});

test('action icon follows nearby hobbies and portals', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await start(page);
  for (const [x, action] of [[100,'Star'],[345,'Tennis'],[1395,'Padel'],[2445,'Yoga'],[3495,'Archery']] as const) {
    await page.evaluate((x) => { const s=(window as any).__ashify.scene.getScene('Gateway'); s.player.setPosition(x,600); s.player.setVelocity(0,0); },x);
    await expect(page.locator('.action-icon')).toHaveAttribute('data-action', action);
  }
  await page.getByRole('button',{name:'Yoga',exact:true}).click();
  await expect(page.locator('.action-icon')).toHaveAttribute('data-action','Yoga');
  await page.getByRole('button',{name:'Leave activity'}).click();
  await page.getByRole('button',{name:'View my work'}).click();
  await page.waitForTimeout(800);
  await page.evaluate(() => { (window as any).__ashify.scene.getScene('Gateway').player.setPosition(280,600); });
  await expect(page.locator('.action-icon')).toHaveAttribute('data-action','Portal');
  await page.screenshot({path:'design/context-action-icons.png'});
});
