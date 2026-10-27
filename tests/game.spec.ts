import { test, expect, Page } from '@playwright/test';
test.setTimeout(65000);
async function setup(page: Page, world = 0) {
  await page.goto('/');
  await page.evaluate(
    (w) =>
      localStorage.setItem(
        'ashify-v2',
        JSON.stringify({
          stars: [],
          skills: [],
          tasks: [],
          secrets: [],
          archer: false,
          world: w,
          unlockedWorld: w,
          finished: false,
        }),
      ),
    world,
  );
  await page.reload();
  await page.getByRole('button', { name: /START ADVENTURE|CONTINUE ADVENTURE/ }).click();
  await page.waitForTimeout(250);
}
async function move(page: Page, x: number, y = 590) {
  await page.evaluate(
    ([x, y]) => {
      const s = (window as any).__ashify.scene.getScene('Gateway');
      s.player.setPosition(x, y).setVelocity(0, 0);
    },
    [x, y],
  );
  await page.waitForTimeout(350);
}
async function tap(page: Page) {
  await page.keyboard.press('e');
  await page.waitForTimeout(120);
}
async function has(page: Page, id: string) {
  return page.evaluate((id) => (window as any).__ashify.scene.getScene('Gateway').has(id), id);
}
async function shootTarget(page: Page, index = 0) {
  const data = await page.evaluate((i) => {
    const s = (window as any).__ashify.scene.getScene('Gateway'),
      t = s.logic.targets.getChildren()[i];
    return { x: t.x, y: t.y };
  }, index);
  await move(page, data.x - 65, data.y - 30);
  const pt = await page.evaluate((i) => {
    const s = (window as any).__ashify.scene.getScene('Gateway'),
      t = s.logic.targets.getChildren()[i],
      c = s.cameras.main,
      r = s.game.canvas.getBoundingClientRect();
    return { x: r.left + t.x - c.scrollX, y: r.top + t.y - c.scrollY - 8 };
  }, index);
  await page.mouse.move(pt.x, pt.y);
  await page.mouse.down();
  await page.waitForTimeout(180);
  await page.mouse.up();
  await page.waitForTimeout(500);
}
test('intro movement, real stars, gate transition, save and scene cleanup', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await setup(page);
  await page.keyboard.down('d');
  await page.waitForTimeout(400);
  await page.keyboard.up('d');
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.x),
  ).toBeGreaterThan(170);
  await page.keyboard.down('Space');
  await page.waitForTimeout(130);
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').player.body.velocity.y,
    ),
  ).toBeLessThan(0);
  await page.keyboard.up('Space');
  for (const [x, y] of [
    [400, 490],
    [790, 430],
    [1110, 360],
  ])
    await move(page, x, y);
  await expect(page.getByRole('heading', { name: 'Hello. I’m Ash.' })).toBeVisible();
  await page.getByRole('button', { name: 'LET’S GET MOVING' }).click();
  await move(page, 1630);
  await tap(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').world))
    .toBe(1);
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByRole('button', { name: 'CONTINUE ADVENTURE' })).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ashify-v2')!).world)).toBe(1);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'tests/active-preview.png' });
});
test('sports: tennis, padel ricochet, yoga, stretching and pilates', async ({ page }) => {
  await setup(page, 1);
  await move(page, 420);
  for (let hit = 0; hit < 3; hit++) {
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const s = (window as any).__ashify.scene.getScene('Gateway');
            return s.logic.balls
              .getChildren()
              .some((b: any) => !b.getData('returned') && Math.abs(b.x - s.player.x) < 85);
          }),
        { timeout: 10000, intervals: [50] },
      )
      .toBe(true);
    await tap(page);
    await page.waitForTimeout(900);
  }
  expect(await has(page, 'sport-tennis')).toBe(true);
  await move(page, 1000);
  await expect
    .poll(
      () =>
        page.evaluate(
          () => Math.floor((window as any).__ashify.scene.getScene('Gateway').worldTime / 850) % 3,
        ),
      { intervals: [50] },
    )
    .toBe(1);
  await tap(page);
  await expect.poll(() => has(page, 'sport-padel'), { timeout: 5000 }).toBe(true);
  await move(page, 1560);
  for (let i = 0; i < 3; i++) {
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              Math.abs(
                Math.sin((window as any).__ashify.scene.getScene('Gateway').worldTime * 0.0025),
              ) < 0.2,
          ),
        { intervals: [30] },
      )
      .toBe(true);
    await tap(page);
    await page.waitForTimeout(350);
  }
  expect(await has(page, 'sport-yoga')).toBe(true);
  await move(page, 2050);
  await page.keyboard.down('e');
  await page.waitForTimeout(2100);
  await page.keyboard.up('e');
  expect(await has(page, 'sport-stretch')).toBe(true);
  await move(page, 2510);
  await tap(page);
  for (let i = 0; i < 80 && !(await has(page, 'sport-pilates')); i++) {
    const dir = await page.evaluate(() => {
      const l = (window as any).__ashify.scene.getScene('Gateway').logic;
      const v = l.balance * 3 + l.balanceVelocity;
      return v > 0.04 ? 'a' : v < -0.04 ? 'd' : '';
    });
    if (dir) await page.keyboard.down(dir);
    await page.waitForTimeout(100);
    if (dir) await page.keyboard.up(dir);
  }
  expect(await has(page, 'sport-pilates')).toBe(true);
  await expect.poll(() => has(page, 'active-soul')).toBe(true);
  await page.screenshot({ path: 'tests/sports-preview.png' });
});
test('archery: six physical targets, moving targets and rune gate', async ({ page }) => {
  await setup(page, 2);
  await move(page, 320);
  await tap(page);
  expect(await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').bow)).toBe(
    true,
  );
  for (let tries = 0; tries < 18; tries++) {
    const n = await page.evaluate(
      () =>
        (window as any).__ashify.scene
          .getScene('Gateway')
          .logic.targets.getChildren()
          .filter((t: any) => t.getData('kind') === 'target').length,
    );
    if (!n) break;
    await shootTarget(page, 0);
  }
  expect(
    await page.evaluate(
      () =>
        (window as any).__ashify.scene
          .getScene('Gateway')
          .logic.targets.getChildren()
          .filter((t: any) => t.getData('kind') === 'target').length,
    ),
  ).toBe(0);
  for (const i of [1, 0, 2]) await shootTarget(page, i);
  await expect.poll(() => has(page, 'sharp-eye')).toBe(true);
  await page.screenshot({ path: 'tests/archery-preview.png' });
});
test('observatory: constellation order, planets and telescope', async ({ page }) => {
  await setup(page, 3);
  await move(page, 610);
  for (let i = 0; i < 5; i++) {
    const pt = await page.evaluate((i) => {
      const s = (window as any).__ashify.scene.getScene('Gateway'),
        t = s.logic.constellationStars[i],
        c = s.cameras.main,
        r = s.game.canvas.getBoundingClientRect();
      return { x: r.left + t.x - c.scrollX, y: r.top + t.y - c.scrollY };
    }, i);
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(90);
  }
  expect(await has(page, 'constellation')).toBe(true);
  await move(page, 1520);
  for (let i = 0; i < 3; i++) {
    for (let tries = 0; tries < 8; tries++) {
      const pt = await page.evaluate((i) => {
        const s = (window as any).__ashify.scene.getScene('Gateway'),
          t = s.logic.planets[i],
          c = s.cameras.main,
          r = s.game.canvas.getBoundingClientRect();
        return {
          x: r.left + t.x - c.scrollX,
          y: r.top + t.y - c.scrollY,
          angle: s.logic.planetAngles[i],
        };
      }, i);
      if (pt.angle === 0) break;
      await page.mouse.click(pt.x, pt.y);
      await page.waitForTimeout(100);
    }
  }
  expect(await has(page, 'planets')).toBe(true);
  await move(page, 2210);
  await tap(page);
  await expect(page.getByRole('heading', { name: 'Curiosity has no limits.' })).toBeVisible();
  await page.getByRole('button', { name: 'BACK TO THE OBSERVATORY' }).click();
  await expect.poll(() => has(page, 'cosmic-explorer')).toBe(true);
  await page.screenshot({ path: 'tests/observatory-preview.png' });
});
test('creator: stomp bugs, seven showcases, duplicate prevention and boss gate', async ({
  page,
}) => {
  await setup(page, 4);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const s = (window as any).__ashify.scene.getScene('Gateway'),
        b = s.logic.bugs.getChildren()[0];
      s.player.setPosition(b.x, b.y - 130).setVelocity(0, 220);
    });
    await page.waitForTimeout(600);
  }
  await expect.poll(() => has(page, 'unity')).toBe(true);
  for (let i = 0; i < 7; i++) {
    await move(page, 1260 + i * 300);
    await tap(page);
    await expect(page.getByText('PROJECT SHOWCASE COMING SOON', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'SKIP & UNLOCK' }).click();
    await page.waitForTimeout(100);
  }
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').progress.skills.length,
    ),
  ).toBe(7);
  await move(page, 1260);
  await tap(page);
  await page.getByRole('button', { name: 'SKIP & UNLOCK' }).click();
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').progress.skills.length,
    ),
  ).toBe(7);
  await move(page, 3530);
  await tap(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').world))
    .toBe(5);
});
test('boss: vulnerable core, three real arrows and final reveal', async ({ page }) => {
  await setup(page, 5);
  for (let tries = 0; tries < 12; tries++) {
    const state = await page.evaluate(() => {
      const s = (window as any).__ashify.scene.getScene('Gateway');
      return { world: s.world, hp: s.logic.bossHp };
    });
    if (state.world === 6 || state.hp === 0) break;
    await move(page, 925);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const s = (window as any).__ashify.scene.getScene('Gateway');
            return s.logic.vulnerable() && s.worldTime % 6200 < 5000;
          }),
        { intervals: [60], timeout: 8000 },
      )
      .toBe(true);
    const pt = await page.evaluate(() => {
      const s = (window as any).__ashify.scene.getScene('Gateway'),
        b = s.logic.boss,
        c = s.cameras.main,
        r = s.game.canvas.getBoundingClientRect();
      return { x: r.left + b.x - c.scrollX, y: r.top + b.y - c.scrollY - 20 };
    });
    await page.mouse.move(pt.x, pt.y);
    await page.mouse.down();
    await page.waitForTimeout(250);
    await page.mouse.up();
    await page.waitForTimeout(1050);
  }
  await expect(page.getByRole('heading', { name: 'Hi, I’m Ash.' })).toBeVisible({ timeout: 10000 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ashify-v2')!).finished)).toBe(
    true,
  );
  await page.screenshot({ path: 'tests/final-preview.png', animations: 'disabled' });
});
test('mobile touch, pause, portrait, corrupt-save recovery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('ashify-v2', 'broken-json'));
  await page.reload();
  await page.getByRole('button', { name: 'START ADVENTURE' }).click();
  await page
    .getByRole('button', { name: 'right', exact: true })
    .dispatchEvent('pointerdown', { pointerId: 1 });
  await page.waitForTimeout(400);
  await page
    .getByRole('button', { name: 'right', exact: true })
    .dispatchEvent('pointerup', { pointerId: 1 });
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.x),
  ).toBeGreaterThan(160);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.getByRole('button', { name: 'Portrait 9:16 mode' }).click();
  await page.getByRole('button', { name: 'RESUME ADVENTURE' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'tests/mobile-preview.png' });
});

test('intro is traversable with only keyboard controls', async ({ page }) => {
  await setup(page);
  async function runTo(x: number) {
    await page.keyboard.down('d');
    await expect
      .poll(
        () => page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.x),
        { intervals: [15], timeout: 3000 },
      )
      .toBeGreaterThan(x);
    await page.keyboard.up('d');
  }
  await runTo(280);
  await page.waitForTimeout(250);
  for (const x of [400, 610, 790, 955, 1110]) {
    await page.keyboard.down('Space');
    // Brake before the destination: the controller deliberately has momentum.
    await runTo(x - 23);
    await page.waitForTimeout(430);
    await page.keyboard.up('Space');
    await page.waitForTimeout(250);
  }
  await expect(page.getByRole('heading', { name: 'Hello. I’m Ash.' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').health)).toBe(
    3,
  );
});
test('world map locks, pause freezes gameplay, replay resets only current challenges', async ({
  page,
}) => {
  await setup(page, 1);
  await page.getByRole('button', { name: 'World map', exact: true }).click();
  await expect(page.getByRole('button', { name: /03 ARCHER/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Pause game' }).click();
  const before = await page.evaluate(
    () => (window as any).__ashify.scene.getScene('Gateway').worldTime,
  );
  await page.waitForTimeout(600);
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').worldTime),
  ).toBe(before);
  await page.getByRole('button', { name: 'Replay this world’s challenges' }).click();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').held)).toBe(
    false,
  );
  await page.keyboard.down('d');
  await page.waitForTimeout(300);
  await page.keyboard.up('d');
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').player.x),
  ).toBeGreaterThan(150);
});

test('bow stays equipped after pickup, supports keyboard fire and survives reload', async ({
  page,
}) => {
  await setup(page, 2);
  await move(page, 320);
  await tap(page);
  await page.waitForTimeout(1000);
  await expect(page.getByTestId('bow-status')).toBeVisible();
  expect(
    await page.evaluate(() =>
      Number((window as any).__ashify.scene.getScene('Gateway').player.frame.name),
    ),
  ).toBe(19);
  await page.keyboard.down('d');
  await page.waitForTimeout(180);
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').bowVisual.visible),
  ).toBe(true);
  await page.keyboard.up('d');
  // First target at (650, 565): a ground-level shot aimed slightly upward.
  await move(page, 550);
  const initialAngle = await page.evaluate(
    () => (window as any).__ashify.scene.getScene('Gateway').aimAngle,
  );
  await page.keyboard.down('w');
  await page.waitForTimeout(80);
  await page.keyboard.up('w');
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').aimAngle),
  ).toBeLessThan(initialAngle);
  await page.keyboard.down('f');
  await page.waitForTimeout(350);
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').keyboardDraw),
  ).toBe(true);
  await page.keyboard.up('f');
  await expect.poll(() => has(page, 'arch-target-0')).toBe(true);
  await page.keyboard.down('f');
  await page.waitForTimeout(80);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.keyboard.up('f');
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').drawing),
  ).toBe(0);
  await page.getByRole('button', { name: 'RESUME ADVENTURE' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'CONTINUE ADVENTURE' }).click();
  await expect(page.getByTestId('bow-status')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').bow)).toBe(
    true,
  );
});

test('touch aiming releases an arrow without using the movement pointer', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await setup(page, 2);
  await move(page, 320);
  await page.getByRole('button', { name: 'interact', exact: true }).tap();
  await page.waitForTimeout(900);
  await expect(page.getByTestId('bow-status')).toBeVisible();
  await move(page, 550);
  const pt = await page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway'),
      c = s.cameras.main,
      r = s.game.canvas.getBoundingClientRect();
    return { x: r.left + 650 - c.scrollX, y: r.top + 555 - c.scrollY };
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: pt.x, y: pt.y, id: 11 }],
  });
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').drawing),
  ).toBeGreaterThan(0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => has(page, 'arch-target-0')).toBe(true);
  await context.close();
});

test('astronomy guide preserves correct stars, locks planets and explains the exit', async ({
  page,
}) => {
  await setup(page, 3);
  await expect(page.getByText(/Step 1\/3: click or tap star 1/)).toBeVisible();
  await move(page, 610);
  for (const key of ['1', '2', '5']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(90);
  }
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').logic.constellationStep,
    ),
  ).toBe(2);
  await expect(page.getByText(/Step 1\/3: click or tap star 3/)).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'CONTINUE ADVENTURE' }).click();
  await move(page, 610);
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').logic.constellationStep,
    ),
  ).toBe(2);
  for (const key of ['3', '4', '5']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(90);
  }
  await expect(page.getByText(/Step 2\/3:/)).toBeVisible();
  await move(page, 1520);
  for (let i = 0; i < 6; i++) await tap(page);
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').logic.planetAngles[0],
    ),
  ).toBe(0);
  async function clickTurn(index: number) {
    const pt = await page.evaluate((i) => {
      const s = (window as any).__ashify.scene.getScene('Gateway'),
        b = s.logic.planetButtons[i],
        c = s.cameras.main,
        r = s.game.canvas.getBoundingClientRect();
      return { x: r.left + b.x - c.scrollX, y: r.top + b.y - c.scrollY };
    }, index);
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(80);
  }
  await clickTurn(0);
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').logic.planetAngles[0],
    ),
  ).toBe(0);
  for (let i = 0; i < 3; i++) await clickTurn(1);
  for (let i = 0; i < 7; i++) await clickTurn(2);
  await expect(page.getByText(/Step 3\/3:/)).toBeVisible();
  await move(page, 2530);
  expect(
    await page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').prompt.text),
  ).toContain('Telescope discovery');
  await move(page, 2210);
  await tap(page);
  await page.getByRole('button', { name: 'BACK TO THE OBSERVATORY' }).click();
  await expect(page.getByText(/All three discoveries complete!/)).toBeVisible();
  await move(page, 2530);
  await tap(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__ashify.scene.getScene('Gateway').world))
    .toBe(4);
});

test('astronomy touch targets and fixed TURN buttons fit a phone viewport', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await setup(page, 3);
  await move(page, 430);
  const star = await page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway'),
      t = s.logic.constellationStars[0],
      c = s.cameras.main,
      r = s.game.canvas.getBoundingClientRect();
    return { x: r.left + t.x - c.scrollX + 20, y: r.top + t.y - c.scrollY };
  });
  // Touch the forgiving hit area, outside the small visible star itself.
  await page.touchscreen.tap(star.x, star.y);
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').logic.constellationStep,
    ),
  ).toBe(1);
  await move(page, 1520);
  await page.waitForTimeout(500);
  const buttons = await page.evaluate(() => {
    const s = (window as any).__ashify.scene.getScene('Gateway'),
      c = s.cameras.main,
      r = s.game.canvas.getBoundingClientRect();
    return s.logic.planetButtons.map((b: any) => ({
      x: r.left + b.x - c.scrollX,
      y: r.top + b.y - c.scrollY,
      left: r.left + b.x - b.width / 2 - c.scrollX,
      right: r.left + b.x + b.width / 2 - c.scrollX,
    }));
  });
  for (const b of buttons) {
    expect(b.left).toBeGreaterThan(0);
    expect(b.right).toBeLessThan(390);
  }
  for (let i = 0; i < 6; i++) {
    await page.touchscreen.tap(buttons[0].x, buttons[0].y);
    await page.waitForTimeout(70);
  }
  expect(
    await page.evaluate(
      () => (window as any).__ashify.scene.getScene('Gateway').logic.planetAngles[0],
    ),
  ).toBe(0);
  await page.screenshot({ path: 'tests/astronomy-mobile-preview.png', animations: 'disabled' });
  await context.close();
});
