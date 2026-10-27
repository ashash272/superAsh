import Phaser from 'phaser';
import type { Gateway } from './Gateway';

/** Camera-driven layers: distant sky, stars, planets, then playable foreground. */
export function createUniverse(s: Gateway, worldWidth: number) {
  const source = s.textures.get('astronomy-sky').getSourceImage() as HTMLImageElement;
  const skyKey = 'universe-panorama';
  if (!s.textures.exists(skyKey)) {
    // Reflect the second half so the panorama loops without a hard edge.
    const texture = s.textures.createCanvas(skyKey, source.width * 2, source.height)!;
    const ctx = texture.context;
    ctx.drawImage(source, 0, 0);
    ctx.save();
    ctx.translate(source.width * 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(source, 0, 0);
    ctx.restore();
    texture.refresh();
  }
  const sky = s.add
    .tileSprite(0, 0, 1, 1, skyKey)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(-30)
    .setName('universe-sky');
  const layout = () => {
    const cam = s.cameras.main,
      zoom = cam.zoom;
    const w = s.scale.width / zoom,
      h = s.scale.height / zoom;
    sky.setPosition(s.scale.width / 2, s.scale.height / 2).setSize(w, h);
    const scale = Math.max(h / source.height, w / source.width) * 1.12;
    sky.setTileScale(scale);
    sky.tilePositionX = cam.scrollX * 0.18;
    sky.tilePositionY = cam.scrollY * 0.08;
  };
  layout();
  s.events.on('preupdate', layout);
  s.events.once('shutdown', () => s.events.off('preupdate', layout));
  const rng = new Phaser.Math.RandomDataGenerator(['universe-' + s.world]);
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < 70; i++) {
      const star = s.add
        .circle(
          rng.between(-700, worldWidth + 1600),
          rng.between(-700, 1250),
          layer ? 2 : 1,
          i % 3 ? 0xd7e8ff : 0xffd8aa,
          0.6,
        )
        .setDepth(-24 + layer)
        .setScrollFactor(layer ? 0.65 : 0.3);
      s.tweens.add({
        targets: star,
        alpha: 0.15,
        duration: rng.between(1600, 4200),
        yoyo: true,
        repeat: -1,
      });
    }
  }
  const palettes = [
    ['#b5edfa', '#5188bb', '#142b58'],
    ['#efd5af', '#ae829b', '#362348'],
    ['#c6eac8', '#5c9da8', '#1a3550'],
    ['#ead7fc', '#8670ba', '#25224b'],
  ];
  palettes.forEach((colors, index) => {
    const key = 'planet-body-' + index;
    if (s.textures.exists(key)) return;
    const texture = s.textures.createCanvas(key, 256, 256)!;
    const ctx = texture.context;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.clip();
    const light = ctx.createRadialGradient(80, 65, 5, 140, 140, 150);
    light.addColorStop(0, colors[0]);
    light.addColorStop(0.45, colors[1]);
    light.addColorStop(1, colors[2]);
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 256, 256);
    for (let band = 0; band < 14; band++) {
      ctx.strokeStyle = band % 2 ? '#ffffff16' : '#081a3426';
      ctx.lineWidth = 3 + (band % 4);
      ctx.beginPath();
      ctx.ellipse(120, band * 23 - 25, 160, 22, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    const shadow = ctx.createLinearGradient(0, 0, 256, 180);
    shadow.addColorStop(0, '#00000000');
    shadow.addColorStop(0.5, '#00000000');
    shadow.addColorStop(1, '#020819bb');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, 256, 256);
    texture.refresh();
  });
  const count = Math.ceil(worldWidth / 780) + 1;
  for (let i = 0; i < count; i++) {
    const x = 420 + i * 690,
      y = 320 + (i % 3) * 65,
      size = i % 2 ? 105 : 170;
    const planet = s.add
      .container(x, y)
      .setDepth(-15)
      .setScrollFactor(0.78)
      .setName('world-planet-' + i);
    const halo = s.add.circle(0, 0, size * 0.53, 0x9bcbef, 0.06);
    const body = s.add.image(0, 0, 'planet-body-' + (i % 4)).setDisplaySize(size, size);
    planet.add([halo, body]);
    if (i % 2) {
      const ring = s.add
        .ellipse(0, 0, size * 1.9, size * 0.44)
        .setStrokeStyle(8, 0xd9bda7, 0.6)
        .setAngle(-24);
      planet.addAt(ring, 1);
      const front = s.add.graphics();
      front.lineStyle(5, 0xecd5bb, 0.75);
      front.strokeEllipse(0, 0, size * 1.9, size * 0.44);
      front.setAngle(-24).setAlpha(0.4);
      planet.add(front);
      s.tweens.add({ targets: [ring, front], angle: -12, duration: 18000, yoyo: true, repeat: -1 });
    }
    s.tweens.add({
      targets: body,
      angle: 360,
      duration: 90000 + i * 14000,
      repeat: -1,
      ease: 'Linear',
    });
    s.tweens.add({
      targets: planet,
      x: x + 22,
      y: y - 18,
      duration: 7500 + i * 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    s.tweens.add({
      targets: halo,
      alpha: 0.15,
      scale: 1.1,
      duration: 4000,
      yoyo: true,
      repeat: -1,
    });
    // A small moon travels around its planet rather than staying glued to a screen corner.
    if (i % 3 === 0) {
      const moon = s.add.circle(0, 0, 7, 0xd6dce6);
      planet.add(moon);
      s.tweens.addCounter({
        from: 0,
        to: Math.PI * 2,
        duration: 14000 + i * 1000,
        repeat: -1,
        onUpdate: (t) => {
          const a = t.getValue() ?? 0;
          moon
            .setPosition(Math.cos(a) * size * 0.85, Math.sin(a) * size * 0.35)
            .setAlpha(Math.sin(a) > 0 ? 1 : 0.45);
        },
      });
    }
  }
  for (let i = 0; i < 7; i++) {
    const meteor = s.add
      .graphics()
      .setDepth(-10)
      .setScrollFactor(0.55)
      .setName('world-meteor-' + i);
    meteor.lineStyle(2, 0xc6e4ff, 0.75);
    meteor.lineBetween(-120, -55, 0, 0);
    meteor.fillStyle(0xfff3dc);
    meteor.fillCircle(0, 0, 3);
    const homeX = 200 + i * 620,
      homeY = 20 + (i % 3) * 110;
    meteor.setPosition(homeX, homeY).setAlpha(0);
    s.tweens.add({
      targets: meteor,
      x: homeX + 420,
      y: homeY + 190,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      delay: i * 950,
      repeatDelay: 5000 + i * 650,
      repeat: -1,
      onRepeat: () => meteor.setPosition(homeX, homeY),
    });
  }
}
