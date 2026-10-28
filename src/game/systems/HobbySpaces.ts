import Phaser from 'phaser';
import { viewWidth } from '../display';
import type { Gateway } from '../Gateway';

export const hobbies = ['Tennis', 'Padel', 'Yoga', 'Archery'];
export const hobbyCenter = (i: number) => 620 + i * 1050;

/** Permanent, traversable spaces; equipment remains visible between rounds. */
export function buildHobbySpace(s: Gateway, name: string, cx: number, index: number) {
  const g = s.add.graphics().setDepth(3);
  const court = name === 'Tennis' || name === 'Padel';
  const left = cx - 440,
    right = cx + 440;
  g.fillStyle(0x0c2030, 0.35);
  g.fillEllipse(cx, 665, 940, 95);
  if (court) {
    g.fillStyle(name === 'Padel' ? 0x2b6c88 : 0x377c70);
    g.fillPoints(
      [
        { x: left, y: 550 },
        { x: right, y: 550 },
        { x: right + 35, y: 650 },
        { x: left - 35, y: 650 },
      ],
      true,
    );
    for (let y = 554; y < 650; y += 4) {
      g.lineStyle(1, 0xb5d9c6, 0.06);
      g.lineBetween(left, y, right, y);
    }
    g.lineStyle(2, 0xe8f0dc, 0.8);
    g.strokeRect(left + 24, 566, 832, 72);
    g.lineBetween(cx, 566, cx, 638);
    g.lineBetween(left + 24, 602, right - 24, 602);
    g.lineBetween(cx - 220, 566, cx - 220, 638);
    g.lineBetween(cx + 220, 566, cx + 220, 638);
    // Net mesh and its weighted top band.
    g.fillStyle(0x17283a, 0.5);
    g.fillRect(cx - 5, 492, 14, 153);
    g.lineStyle(1, 0xc5d7d1, 0.45);
    for (let y = 498; y < 640; y += 10) g.lineBetween(cx - 12, y, cx + 12, y);
    for (let x = cx - 12; x <= cx + 12; x += 6) g.lineBetween(x, 493, x, 644);
    g.lineStyle(4, 0xf0e7cf);
    g.lineBetween(cx - 13, 492, cx + 13, 492);
    g.lineStyle(5, 0x425259);
    g.lineBetween(cx - 14, 490, cx - 14, 650);
    if (name === 'Padel') {
      g.fillStyle(0x9adcf0, 0.13);
      g.fillRect(right - 25, 365, 32, 280);
      g.lineStyle(3, 0xb1e3eb, 0.85);
      g.strokeRect(right - 25, 365, 32, 280);
      g.lineStyle(1, 0xc4ecf7, 0.5);
      g.lineBetween(right - 22, 440, right + 3, 420);
      g.lineBetween(right - 22, 470, right + 3, 450);
      for (let x = left; x < right; x += 110) {
        g.lineStyle(1, 0x8db8c8, 0.3);
        g.strokeRect(x, 395, 108, 154);
      }
    }
    // A visible practice launcher rather than a disembodied ball.
    g.fillStyle(0x243847);
    g.fillRoundedRect(cx + 290, 585, 65, 44, 8);
    g.fillStyle(0xa8c1c4);
    g.fillRoundedRect(cx + 300, 562, 42, 27, 5);
    g.lineStyle(2, 0x88aab3);
    g.strokeRoundedRect(cx + 290, 585, 65, 44, 8);
    for (let n = 0; n < 4; n++) {
      g.lineStyle(2, 0x0f2634);
      g.lineBetween(cx + 304, 596 + n * 6, cx + 339, 596 + n * 6);
    }
    g.fillStyle(0xc5ee95);
    g.fillCircle(cx + 338, 574, 4);
    g.fillStyle(0x101c28);
    g.fillCircle(cx + 304, 637, 10);
    g.fillCircle(cx + 342, 637, 10);
    g.lineStyle(6, 0xe4d6bc);
    g.lineBetween(cx + 308, 572, cx + 285, 558);
  } else if (name === 'Archery') {
    g.fillStyle(0x7c8b64, 0.85);
    g.fillRoundedRect(left, 605, 880, 45, 18);
    for (let i = 0; i < 3; i++) {
      const x = cx + 220 + i * 75;
      g.lineStyle(6, 0x9e7852);
      g.lineBetween(x, 515, x - 28, 650);
      g.lineBetween(x, 515, x + 28, 650);
      [0xd5bc86, 0xf3e3c8, 0xc87878, 0xf3d38c, 0x7bcdb9].forEach((color, j) => {
        g.fillStyle(color);
        g.fillCircle(x, 480, 49 - j * 9);
      });
    }
    g.lineStyle(2, 0xf4e6bd, 0.5);
    g.lineBetween(cx - 240, 590, cx - 240, 650);
  } else {
    // Warm cedar decking, mats, plants and lanterns for the movement garden.
    g.fillStyle(0x725e57);
    g.fillRoundedRect(left, 603, 880, 50, 12);
    for (let x = left + 12; x < right; x += 35) {
      g.lineStyle(1, 0xb59879, 0.4);
      g.lineBetween(x, 607, x, 650);
    }
    g.fillStyle(0x94cdbb);
    g.fillEllipse(cx, 630, 340, 36);
    g.lineStyle(2, 0xe3e5dc, 0.7);
    g.strokeEllipse(cx, 630, 320, 26);
    [-350, 350].forEach((dx) => {
      g.fillStyle(0xa78569);
      g.fillRoundedRect(cx + dx - 24, 602, 48, 36, 5);
      for (let n = 0; n < 7; n++) {
        g.fillStyle(n % 2 ? 0x5a9b85 : 0x85b294);
        g.fillEllipse(cx + dx + Math.sin(n) * 24, 582 - n * 5, 18, 48);
      }
    });
  }
  // A distinct pavilion, lighting and signage for every hobby.
  g.lineStyle(7, 0x4b4b50);
  g.lineBetween(left, 355, left, 640);
  g.lineBetween(right, 355, right, 640);
  g.lineStyle(2, 0xd3c3a0, 0.7);
  g.lineBetween(left, 355, cx, 390);
  g.lineBetween(cx, 390, right, 355);
  for (let n = 0; n < 9; n++) {
    const x = left + n * 110,
      y = 355 + Math.sin((n / 8) * Math.PI) * 35;
    const glow = s.add
      .circle(x, y + 10, 28, 0xffd58c, 0.12)
      .setDepth(4)
      .setBlendMode(Phaser.BlendModes.ADD);
    const bulb = s.add.circle(x, y + 10, 4, 0xffe5b5).setDepth(4);
    s.tweens.add({ targets: bulb, alpha: 0.35, duration: 1800 + n * 150, yoyo: true, repeat: -1 });
    s.tweens.add({
      targets: glow,
      alpha: 0.45,
      scale: 1.8,
      duration: 1500 + n * 130,
      yoyo: true,
      repeat: -1,
    });
  }
  const pool = s.add
    .ellipse(cx, 620, 650, 100, 0xffd88c, 0.06)
    .setDepth(4)
    .setBlendMode(Phaser.BlendModes.ADD);
  s.tweens.add({
    targets: pool,
    alpha: 0.18,
    scaleX: 1.06,
    duration: 2600 + index * 200,
    yoyo: true,
    repeat: -1,
  });
  s.badge(cx, 318, name, 23)
    .setData('hobby-prompt', true)
    .setVisible(viewWidth(s) > 650);
}
