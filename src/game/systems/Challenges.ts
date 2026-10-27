import Phaser from 'phaser';
import type { Gateway } from '../Gateway';
import { bridge, audio } from '../bridge';
import { categories, worlds } from '../../data/progress';
type Sprite = Phaser.Physics.Arcade.Sprite;
export class Challenges {
  s: Gateway;
  lockMovement = false;
  targets?: Phaser.Physics.Arcade.Group;
  balls?: Phaser.Physics.Arcade.Group;
  hazards?: Phaser.Physics.Arcade.Group;
  bugs?: Phaser.Physics.Arcade.Group;
  sports = [
    { id: 'tennis', x: 420 },
    { id: 'padel', x: 1000 },
    { id: 'yoga', x: 1560 },
    { id: 'stretch', x: 2050 },
    { id: 'pilates', x: 2510 },
  ];
  scores: Record<string, number> = {};
  boards: Phaser.GameObjects.Text[] = [];
  meter?: Phaser.GameObjects.Graphics;
  balanceActive = false;
  balance = 0;
  balanceVelocity = 0;
  balanceTime = 0;
  stretch = 0;
  lastLaunch = -5000;
  gateSequence = [1, 0, 2];
  gateStep = 0;
  constellationStep = 0;
  constellationStars: Phaser.GameObjects.Star[] = [];
  starLines?: Phaser.GameObjects.Graphics;
  nextStarRing?: Phaser.GameObjects.Arc;
  constellationLabel?: Phaser.GameObjects.Text;
  planetLabel?: Phaser.GameObjects.Text;
  planetButtons: Phaser.GameObjects.Text[] = [];
  astronomyKeyHandler?: (event: KeyboardEvent) => void;
  lastObjective = '';
  planetAngles = [2, 5, 1];
  planets: Phaser.GameObjects.Arc[] = [];
  planetGraphics?: Phaser.GameObjects.Graphics;
  boss?: Sprite;
  bossHp = 3;
  bossLastHit = -5000;
  bossNextAttack = 0;
  bossLabel?: Phaser.GameObjects.Text;
  movingYoga?: Phaser.Tweens.Tween;
  bowPickup?: Phaser.GameObjects.Graphics;
  bowPickupLabel?: Phaser.GameObjects.Text;
  skillPortals: Phaser.GameObjects.Container[] = [];
  constructor(s: Gateway) {
    this.s = s;
  }
  create() {
    const s = this.s;
    if (s.world === 0) this.intro();
    if (s.world === 1) this.active();
    if (s.world === 2) this.archery();
    if (s.world === 3) this.observatory();
    if (s.world === 4) this.creator();
    if (s.world === 5) this.bossFight();
    if (s.world === 6) {
      s.complete('creator-of-worlds', 'CREATOR OF WORLDS · Welcome to my universe.');
      s.progress.finished = true;
      s.persist();
      for (let i = 0; i < 12; i++)
        s.time.delayedCall(i * 130, () => s.burst(200 + i * 90, 360, 0xffd99b));
    }
    if (s.world < 5)
      s.portal(
        worlds[s.world].width - 170,
        570,
        s.world === 4 ? 'THE IMPOSSIBLE IDEA' : 'NEXT WORLD',
      );
  }
  objective(text: string) {
    if (this.lastObjective === text) return;
    this.lastObjective = text;
    bridge.emit('objective', text);
  }
  intro() {
    const s = this.s,
      stars = s.physics.add.staticGroup();
    [
      [400, 500],
      [790, 440],
      [1110, 370],
    ].forEach(([x, y], id) => {
      if (!s.progress.stars.includes(id)) {
        const star = stars.create(x, y, 'star').setData('id', id);
        // A forgiving pickup area accounts for momentum after releasing movement.
        (star.body as Phaser.Physics.Arcade.StaticBody).setSize(44, 44, true);
        s.tweens.add({ targets: star, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
      }
    });
    s.physics.add.overlap(s.player, stars, (_p, obj) => {
      const star = obj as Sprite,
        id = star.getData('id') as number;
      s.progress.stars.push(id);
      s.burst(star.x, star.y, 0xffd889);
      star.destroy();
      s.pose(28);
      audio.play(650 + id * 180);
      s.persist();
      bridge.emit('toast', ['HELLO!', 'MY NAME IS…', 'ASH!'][id]);
      if (s.progress.stars.length === 3)
        s.time.delayedCall(500, () => bridge.emit('overlay', 'reveal'));
    });
    this.objective('Collect three stars. The Active World awaits.');
  }
  active() {
    const s = this.s;
    this.meter = s.add.graphics().setDepth(15);
    this.balls = s.physics.add.group({ allowGravity: false });
    this.targets = s.physics.add.group({ allowGravity: false, immovable: true });
    this.sports.forEach((st, i) => {
      const g = s.add.graphics().setDepth(1);
      g.fillStyle([0x3b776e, 0x5d658b, 0x715c83, 0x6a6d8b, 0x66598c][i], 0.75);
      g.fillRect(st.x - 125, 620, 300, 24);
      g.lineStyle(1, 0xd6d7c0, 0.6);
      g.strokeRect(st.x - 110, 624, 270, 14);
      this.boards.push(s.label(st.x, 390, st.id.toUpperCase(), 15));
      s.label(
        st.x,
        415,
        [
          'RETURN THREE BALLS',
          'ONE WALL. ONE SWITCH.',
          'BREATHE WITH THE RHYTHM',
          'REACH A LITTLE FURTHER',
          'FIND YOUR CENTRE',
        ][i],
        10,
      );
    });
    const target = this.targets.create(680, 590, 'target').setScale(0.8).setData('type', 'tennis');
    const net = s.add.graphics();
    net.lineStyle(2, 0xe4ddd5, 0.6);
    for (let x = 560; x < 610; x += 8) net.lineBetween(x, 604, x, 645);
    net.lineBetween(555, 604, 615, 604);
    const wall = s.add.rectangle(1250, 490, 16, 290, 0x8bc9e0, 0.6).setStrokeStyle(2, 0xb8edee);
    s.physics.add.existing(wall, true);
    this.targets.create(1100, 400, 'target').setData('type', 'padel');
    s.physics.add.collider(wall, this.balls, (_wall, b) => {
      const ball = b as Sprite;
      ball.setData('bounced', true);
      audio.play(370);
    });
    s.physics.add.overlap(this.balls, this.targets, (b, t) => {
      const ball = b as Sprite,
        target = t as Sprite,
        type = target.getData('type');
      if (ball.getData('type') !== type || !ball.getData('returned')) return;
      if (type === 'padel' && !ball.getData('bounced')) return;
      ball.destroy();
      s.burst(target.x, target.y, 0x9ee7ca);
      this.scores[type] = (this.scores[type] || 0) + 1;
      audio.play(850);
      if (type === 'padel' || this.scores[type] >= 3)
        s.complete(
          'sport-' + type,
          type === 'tennis'
            ? 'TENNIS · Three perfect returns!'
            : 'PADEL · A little geometry goes a long way.',
        );
    });
    s.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => {
        if (s.started && !s.held && !s.has('sport-tennis') && Math.abs(s.player.x - 420) < 350) {
          const b = this.balls!.create(680, 590, 'star') as Sprite;
          b.setScale(0.5).setTint(0xc8ed71).setVelocityX(-190).setData('type', 'tennis');
          s.time.delayedCall(4200, () => {
            if (b.active) b.destroy();
          });
        }
      },
    });
    const moving = s.platform(1450, 520, 120);
    const movingArt = moving.getData('tile') as Phaser.GameObjects.TileSprite;
    const movingRock = moving.getData('rock') as Phaser.GameObjects.Graphics;
    this.movingYoga = s.tweens.add({
      targets: moving,
      x: 1640,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        const body = moving.body as Phaser.Physics.Arcade.StaticBody;
        body.updateFromGameObject();
        movingArt.x = moving.x - 60;
        movingRock.x = moving.x - 1510;
      },
    }); // Visible mat below is the timing station; this upper collision ledge is optional.
    s.add.rectangle(1560, 616, 140, 8, 0x9f8ac4).setDepth(5);
    s.add.rectangle(2050, 616, 140, 8, 0xc19ac8).setDepth(5);
    s.add.rectangle(2510, 616, 140, 8, 0x8fbec0).setDepth(5);
    s.add.star(2050, 470, 5, 8, 16, 0xffd488);
    this.objective('Tennis · Padel · Yoga · Flexibility · Pilates — complete all five.');
  }
  archery() {
    const s = this.s;
    this.targets = s.physics.add.group({ allowGravity: false, immovable: true });
    this.bowPickupLabel = s.label(320, 520, s.bow ? 'BOW EQUIPPED ✓' : 'E · PICK UP YOUR BOW', 12);
    const bow = s.add.graphics();
    this.bowPickup = bow;
    bow.setVisible(!s.bow);
    bow.lineStyle(3, 0xe4c388);
    bow.beginPath();
    bow.arc(320, 580, 25, -1.2, 1.2);
    bow.strokePath();
    bow.lineStyle(1, 0xf4ddaa);
    bow.lineBetween(329, 557, 329, 603);
    [
      [650, 565],
      [900, 580],
      [1190, 460],
      [1450, 560],
      [1770, 440],
      [2050, 560],
    ].forEach(([x, y], i) => {
      if (s.has('arch-target-' + i)) return;
      const t = this.targets!.create(x, y, 'target').setData('index', i).setData('kind', 'target');
      if (i >= 3)
        s.tweens.add({
          targets: t,
          y: y - 85,
          x: x + (i === 4 ? 95 : 0),
          duration: 1600 + i * 150,
          yoyo: true,
          repeat: -1,
        });
    });
    s.label(2520, 390, 'THE HIDDEN GATE\nMOON → LEAF → STAR', 12);
    ['LEAF', 'MOON', 'STAR'].forEach((name, i) => {
      const t = this.targets!.create(2420 + i * 95, 510, 'target')
        .setData('index', i)
        .setData('kind', 'rune');
      if (s.has('arch-gate')) t.setTint(0x6ce9c0);
      s.label(t.x, 550, name, 10);
    });
    s.physics.add.overlap(s.arrows, this.targets, (a, t) => {
      const target = t as Sprite,
        index = target.getData('index');
      a.destroy();
      if (target.getData('kind') === 'rune') {
        if (s.has('arch-gate')) return;
        if (index === this.gateSequence[this.gateStep]) {
          target.setTint(0x7dffc9);
          this.gateStep++;
          audio.play(700 + this.gateStep * 100);
          if (this.gateStep === 3)
            s.complete('arch-gate', 'HIDDEN GATE OPENED · A path for the curious.');
        } else {
          this.gateStep = 0;
          this.targets!.children.iterate((obj) => {
            const v = obj as Sprite;
            if (v.getData('kind') === 'rune') v.clearTint();
            return true;
          });
          bridge.emit('toast', 'Try the carved order: Moon → Leaf → Star');
        }
        return;
      }
      s.burst(target.x, target.y, 0x9adfbb);
      target.destroy();
      s.complete('arch-target-' + index, `TARGET ${index + 1}/6 · Right on target!`);
    });
    this.objective('Pick up the bow. Hit six targets, then solve the three-rune gate.');
  }
  observatory() {
    const s = this.s;
    this.starLines = s.add.graphics().setDepth(6);
    this.planetGraphics = s.add.graphics().setDepth(5);
    const starPoints = [
      [430, 410],
      [520, 340],
      [610, 430],
      [700, 350],
      [790, 395],
    ];
    this.constellationStep = s.has('constellation') ? 5 : 0;
    while (this.constellationStep < 5 && s.has('constellation-star-' + this.constellationStep))
      this.constellationStep++;
    this.constellationLabel = s
      .label(610, 270, '', 14)
      .setBackgroundColor('#17132ee8')
      .setPadding(12);
    this.nextStarRing = s.add.circle(430, 410, 28).setStrokeStyle(3, 0xffe7a1).setDepth(6);
    starPoints.forEach(([x, y], i) => {
      const star = s.add
        .star(x, y, 4, 7, 16, i < this.constellationStep ? 0x8ee9dd : 0xffdc9e)
        .setDepth(7)
        .setInteractive(new Phaser.Geom.Circle(16, 16, 28), Phaser.Geom.Circle.Contains);
      s.label(x, y + 34, String(i + 1), 16)
        .setBackgroundColor('#17132edb')
        .setPadding(4);
      star.on('pointerdown', () => {
        if (!s.started || s.held) return;
        if (Math.abs(s.player.x - x) > 600) {
          bridge.emit('toast', 'Walk closer to the numbered stars first.');
          return;
        }
        this.connectStar(i);
      });
      this.constellationStars.push(star);
      if (i > 0 && i < this.constellationStep) {
        const previous = this.constellationStars[i - 1];
        this.starLines!.lineStyle(2, 0x9ee7fb).lineBetween(previous.x, previous.y, x, y);
      }
    });
    this.planetLabel = s.label(1520, 290, '', 13).setBackgroundColor('#17132ee8').setPadding(12);
    this.planetAngles = [2, 5, 1].map((angle, i) =>
      s.has('planets') || s.has('planets-' + i) ? 0 : angle,
    );
    for (let i = 0; i < 3; i++) {
      const p = s.add
        .circle(1400 + i * 120, 405, 18, [0xc6a6f3, 0x8acbdd, 0xe5a2ac][i])
        .setDepth(7)
        .setInteractive(new Phaser.Geom.Circle(18, 18, 28), Phaser.Geom.Circle.Contains);
      p.on('pointerdown', () => {
        this.rotatePlanet(i);
      });
      this.planets.push(p);
      const button = s
        .label(1400 + i * 120, 495, 'TURN ' + (i + 1), 13)
        .setBackgroundColor('#241c3dec')
        .setPadding(14, 12)
        .setDepth(8)
        .setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.rotatePlanet(i));
      this.planetButtons.push(button);
    }
    this.astronomyKeyHandler = (event: KeyboardEvent) => {
      if (!s.started || s.held || event.repeat || s.player.x > 1050) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < 5) {
        if (Math.abs(s.player.x - this.constellationStars[index].x) <= 600) this.connectStar(index);
      }
    };
    s.input.keyboard!.on('keydown', this.astronomyKeyHandler);
    const telescope = s.add.graphics().setDepth(4);
    telescope.lineStyle(6, 0x887ba5);
    telescope.lineBetween(2210, 590, 2180, 640);
    telescope.lineBetween(2210, 590, 2240, 640);
    telescope.lineBetween(2210, 590, 2210, 641);
    telescope.lineStyle(18, 0xc5b8d5);
    telescope.lineBetween(2170, 575, 2245, 540);
    telescope.lineStyle(23, 0x8ed8e8);
    telescope.lineBetween(2240, 542, 2250, 538);
    s.label(2210, 490, 'E · LOOK THROUGH THE TELESCOPE', 11);
    this.updateAstronomyGuide();
  }
  rotatePlanet(index: number) {
    const s = this.s;
    if (!s.started || s.held) return;
    if (Math.abs(s.player.x - 1520) > 600) {
      bridge.emit('toast', 'Walk closer to the three planet rings first.');
      return;
    }
    // An aligned planet locks, so another tap cannot undo a solved ring.
    if (this.planetAngles[index] === 0) return;
    this.planetAngles[index] = (this.planetAngles[index] + 1) % 8;
    audio.play(440 + index * 110);
    if (this.planetAngles[index] === 0) {
      s.complete('planets-' + index, `PLANET ${index + 1} ALIGNED ✓ · This ring is now locked.`);
    }
    if (this.planetAngles.every((a) => a === 0))
      s.complete('planets', 'PLANETS ALIGNED · Walk right to the telescope, then press E.');
    this.updateAstronomyGuide();
  }
  updateAstronomyGuide() {
    const s = this.s;
    const linked = this.constellationStep;
    const aligned = this.planetAngles.filter((a) => a === 0).length;
    if (linked === 5 && !s.has('constellation'))
      s.complete('constellation', 'CONSTELLATION COMPLETE ✓');
    if (aligned === 3 && !s.has('planets')) s.complete('planets', 'PLANETS ALIGNED ✓');
    // On narrow screens the persistent HUD carries the guide instead of clipped world headings.
    this.constellationLabel?.setVisible(s.scale.width >= 650).setWordWrapWidth(440);
    this.planetLabel?.setVisible(s.scale.width >= 650).setWordWrapWidth(440);
    this.constellationLabel?.setText(
      linked === 5
        ? '1. CONSTELLATION COMPLETE ✓\nWalk right to the three planets →'
        : `1. CLICK / TAP STAR ${linked + 1}\nFollow 1 → 2 → 3 → 4 → 5 · Keyboard: number keys`,
    );
    this.planetLabel?.setText(
      aligned === 3
        ? '2. ALL PLANETS ALIGNED ✓\nWalk right to the telescope →'
        : `2. MOVE EACH PLANET TO ITS GOLD DOT ON THE RIGHT\nTap TURN or the planet · E turns the next unsolved ring · ${aligned}/3 aligned`,
    );
    this.planetButtons.forEach((button, i) =>
      button
        .setText(this.planetAngles[i] === 0 ? 'LOCKED ✓' : 'TURN ' + (i + 1))
        .setColor(this.planetAngles[i] === 0 ? '#8ee9dd' : '#fff0d2'),
    );
    const x = !s.has('constellation')
      ? 610
      : !s.has('planets')
        ? 1520
        : !s.has('telescope')
          ? 2210
          : 2530;
    const direction =
      s.player.x < x - 130 ? 'Walk right →' : s.player.x > x + 130 ? '← Walk left' : 'You are here';
    const task = !s.has('constellation')
      ? `Step 1/3: click or tap star ${linked + 1} (${linked}/5 connected). You do not need to jump.`
      : !s.has('planets')
        ? `Step 2/3: turn each planet to its gold dot (${aligned}/3 aligned).`
        : !s.has('telescope')
          ? 'Step 3/3: stand beside the telescope and press E.'
          : 'All three discoveries complete! Walk to the portal and press E.';
    this.objective(`${task} ${direction}`);
  }
  connectStar(index: number) {
    const s = this.s;
    if (s.has('constellation')) return;
    if (index !== this.constellationStep) {
      bridge.emit(
        'toast',
        `Tap the glowing star ${this.constellationStep + 1} next. Your connected stars are safe.`,
      );
      return;
    }
    const star = this.constellationStars[index];
    star.setFillStyle(0x8ee9dd);
    s.burst(star.x, star.y, 0x94dff5);
    if (index > 0) {
      const prev = this.constellationStars[index - 1];
      this.starLines!.lineStyle(2, 0x9ee7fb);
      this.starLines!.lineBetween(prev.x, prev.y, star.x, star.y);
    }
    this.constellationStep++;
    s.progress.tasks.push('constellation-star-' + index);
    s.persist();
    audio.play(600 + index * 100);
    if (this.constellationStep === 5)
      s.complete('constellation', 'CONSTELLATION COMPLETE · Walk right to the three planets.');
    this.updateAstronomyGuide();
  }
  creator() {
    const s = this.s;
    this.bugs = s.physics.add.group();
    for (let i = 0; i < 3; i++) {
      if (s.has('bug-' + i)) continue;
      const bug = this.bugs.create(360 + i * 260, 610, 'bug') as Sprite;
      bug
        .setTint(0xf593b7)
        .setData('index', i)
        .setData('home', 360 + i * 260)
        .setVelocityX(i % 2 ? 70 : -70)
        .setBounceX(1);
      s.label(360 + i * 260, 555, 'BUG ' + (i + 1), 11);
    }
    s.physics.add.collider(this.bugs, s.platforms);
    s.physics.add.overlap(s.player, this.bugs, (_p, b) => {
      const bug = b as Sprite,
        body = s.player.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y > 30 && body.bottom < bug.y + 18) {
        const i = bug.getData('index');
        s.burst(bug.x, bug.y, 0xf48eb9);
        bug.destroy();
        s.player.setVelocityY(-380);
        s.complete('bug-' + i, ['BUG FIXED +1', 'ERROR RESOLVED!', 'IT WORKS ON MY MACHINE!'][i]);
      } else s.hurt();
    });
    categories.forEach((c, i) => {
      const x = 1260 + i * 300;
      this.skillPortals.push(
        s.portal(x, 570, c.title, Phaser.Display.Color.HexStringToColor(c.color).color),
      );
      s.label(x, 460, c.icon, 28, c.color);
    });
    this.objective('Stomp three bugs, then explore all seven professional portals.');
  }
  bossFight() {
    const s = this.s;
    this.hazards = s.physics.add.group();
    this.boss = s.physics.add.sprite(1100, 440, 'boss').setScale(1.6).setTint(0xf98bb9);
    (this.boss.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.boss.setImmovable(true);
    s.tweens.add({ targets: this.boss, y: 395, duration: 1600, yoyo: true, repeat: -1 });
    this.bossLabel = s.label(1100, 280, 'THE IMPOSSIBLE IDEA\n♥ ♥ ♥', 18);
    s.label(350, 500, 'BOW EQUIPPED\nDODGE. DRAW. SHOOT WHEN THE CORE IS CYAN.', 12);
    const g = s.add.graphics().setDepth(4);
    for (let i = 0; i < 18; i++) {
      g.fillStyle(i % 2 ? 0xad68db : 0xf181b0, 0.65);
      g.fillRect(1030 + ((i * 37) % 150), 350 + ((i * 53) % 170), 9 + (i % 4) * 4, 9);
    }
    s.tweens.add({ targets: g, alpha: 0.15, x: 8, duration: 140, yoyo: true, repeat: -1 });
    s.physics.add.overlap(s.player, this.hazards, (_p, h) => {
      h.destroy();
      s.hurt();
    });
    s.physics.add.collider(this.hazards, s.platforms, (h) => h.destroy());
    s.physics.add.overlap(this.boss, s.arrows, (_boss, a) => {
      a.destroy();
      if (!this.vulnerable() || s.worldTime - this.bossLastHit < 800 || this.bossHp <= 0) return;
      this.bossLastHit = s.worldTime;
      this.bossHp--;
      s.burst(this.boss!.x, this.boss!.y, 0x8be7e1);
      audio.play(1100);
      this.bossLabel!.setText('THE IMPOSSIBLE IDEA\n' + '♥ '.repeat(this.bossHp));
      if (this.bossHp === 0) {
        this.boss!.disableBody(true, true);
        this.hazards!.clear(true, true);
        s.complete('boss', 'IMPOSSIBLE IDEA DEFEATED!');
        s.time.delayedCall(1500, () => s.go(6));
      }
    });
    this.objective('Avoid errors and falling blocks. Land three arrows while the core glows cyan.');
  }
  vulnerable() {
    return this.s.worldTime % 6200 > 3500;
  }
  attack() {
    const s = this.s;
    const kind = Math.floor(s.worldTime / 900) % 3;
    if (kind === 2) {
      const x = s.player.x;
      const warning = s.add.rectangle(x, 635, 55, 7, 0xff8eaf, 0.7).setDepth(7);
      s.time.delayedCall(800, () => {
        warning.destroy();
        if (this.bossHp <= 0) return;
        const b = this.hazards!.create(x, 210, 'tile') as Sprite;
        b.setScale(0.7).setTint(0xe799bd).setVelocityY(170);
        s.time.delayedCall(4000, () => {
          if (b.active) b.destroy();
        });
      });
    } else {
      const b = this.hazards!.create(1050, 450, 'star') as Sprite;
      const angle = Phaser.Math.Angle.Between(1050, 450, s.player.x, s.player.y);
      b.setTint(kind ? 0xb47cf2 : 0xf394b6)
        .setScale(kind ? 1.3 : 1)
        .setGravityY(-1050)
        .setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220)
        .setData('glitch', kind === 1);
      s.time.delayedCall(6000, () => {
        if (b.active) b.destroy();
      });
    }
    audio.play(190);
  }
  sportsUpdate(delta: number, edge: boolean, held: boolean, dir: number) {
    const s = this.s;
    this.meter!.clear();
    let hint = '';
    this.sports.forEach((st, i) =>
      this.boards[i].setText(st.id.toUpperCase() + (s.has('sport-' + st.id) ? ' ✓' : '')),
    );
    if (this.balanceActive) {
      this.lockMovement = true;
      const dt = Math.min(delta, 50) / 1000;
      this.balanceVelocity += (Math.sin(s.worldTime * 0.0019) * 0.35 + dir * 1.8) * dt;
      this.balanceVelocity *= 0.985;
      this.balance += this.balanceVelocity * dt;
      if (Math.abs(this.balance) < 0.35) this.balanceTime += dt;
      else this.balanceTime = Math.max(0, this.balanceTime - dt * 0.5);
      if (Math.abs(this.balance) > 1) {
        this.balance = 0;
        this.balanceVelocity = 0;
        this.balanceTime = 0;
        bridge.emit('toast', 'Find your centre — small taps work best.');
      }
      s.pose(24, 100);
      this.drawMeter(2510, 520, this.balance, this.balanceTime / 4);
      hint = 'PILATES · A / D or ← → to balance\nStay in the green for 4 seconds';
      if (this.balanceTime >= 4) {
        this.balanceActive = false;
        this.lockMovement = false;
        s.complete('sport-pilates', 'PILATES · Steady, strong, centred.');
      }
      return hint;
    }
    for (const st of this.sports) {
      if (Math.abs(s.player.x - st.x) > 130) continue;
      if (s.has('sport-' + st.id)) {
        hint = st.id.toUpperCase() + ' ✓';
        continue;
      }
      if (st.id === 'tennis') {
        hint = `TENNIS · E to swing when the ball is close\n${this.scores.tennis || 0}/3 returns`;
        if (edge) {
          s.pose(21, 350);
          audio.play(500);
          this.balls!.children.iterate((o) => {
            const b = o as Sprite;
            if (
              b.getData('type') === 'tennis' &&
              !b.getData('returned') &&
              Math.abs(b.x - s.player.x) < 105
            ) {
              b.setData('returned', true).setVelocity(430, 0);
            }
            return true;
          });
        }
      }
      if (st.id === 'padel') {
        const phase = Math.floor(s.worldTime / 850) % 3;
        hint =
          'PADEL · E to launch a wall ricochet\nChoose the middle trajectory: ' +
          ['LOW', 'MIDDLE', 'HIGH'][phase];
        this.meter!.lineStyle(2, 0x8be1ed, 0.7);
        this.meter!.lineBetween(1020, 590, 1170, 590 + [-80, -150, -230][phase] * 0.5);
        if (edge && s.worldTime - this.lastLaunch > 2000) {
          this.lastLaunch = s.worldTime;
          const b = this.balls!.create(1020, 590, 'star') as Sprite;
          b.setScale(0.55)
            .setTint(0xc8f38e)
            .setBounceX(1)
            .setVelocity(300, [-80, -150, -230][phase])
            .setData('type', 'padel')
            .setData('returned', true);
          s.pose(21, 350);
          s.time.delayedCall(4000, () => {
            if (b.active) b.destroy();
          });
        }
      }
      if (st.id === 'yoga') {
        const v = Math.sin(s.worldTime * 0.0025);
        this.drawMeter(st.x, 490, v, (this.scores.yoga || 0) / 3);
        hint = `YOGA · Tap E in the green zone\n${this.scores.yoga || 0}/3 calm breaths`;
        s.pose(24, 80);
        if (edge) {
          if (Math.abs(v) < 0.35) {
            this.scores.yoga = (this.scores.yoga || 0) + 1;
            audio.play(700);
            if (this.scores.yoga === 3) {
              this.movingYoga?.pause();
              s.complete('sport-yoga', 'YOGA · A moment of stillness. The platform is steady.');
            }
          } else {
            bridge.emit('toast', 'Breathe. Wait for the green zone.');
          }
        }
      }
      if (st.id === 'stretch') {
        this.stretch = held
          ? Math.min(1, this.stretch + delta / 1800)
          : Math.max(0, this.stretch - delta / 900);
        this.drawMeter(st.x, 490, 0, this.stretch);
        hint = 'FLEXIBILITY · Hold E to reach the star';
        if (held) s.pose(26, 100);
        if (this.stretch >= 1)
          s.complete('sport-stretch', 'FLEXIBILITY · A little further than yesterday.');
      }
      if (st.id === 'pilates') {
        hint = 'PILATES · E to begin balancing';
        if (edge) {
          this.balanceActive = true;
          this.balance = 0;
          this.balanceVelocity = 0;
          this.balanceTime = 0;
        }
      }
    }
    if (this.sports.every((st) => s.has('sport-' + st.id)))
      s.complete('active-soul', 'ACTIVE SOUL · Powered by movement.');
    return hint;
  }
  drawMeter(x: number, y: number, value: number, progress: number) {
    const g = this.meter!;
    g.fillStyle(0x15142a, 0.9);
    g.fillRect(x - 100, y, 200, 18);
    g.fillStyle(0x78cdb1, 0.6);
    g.fillRect(x - 35, y, 70, 18);
    g.fillStyle(0xffe6ad);
    g.fillRect(x + value * 94 - 3, y - 3, 6, 24);
    g.fillStyle(0xcba4fa);
    g.fillRect(x - 100, y + 25, Math.min(1, progress) * 200, 4);
  }
  update(delta: number, edge: boolean, held: boolean, dir: number) {
    const s = this.s;
    let hint = '';
    if (s.world === 1) hint = this.sportsUpdate(delta, edge, held, dir);
    if (s.world === 2) {
      if (!s.bow && Math.abs(s.player.x - 320) < 110) {
        hint = 'E · PICK UP THE BOW';
        if (edge) {
          s.equipBow();
          this.bowPickup?.setVisible(false);
          this.bowPickupLabel?.setText('BOW EQUIPPED ✓');
          audio.play(500);
          bridge.emit('toast', 'Bow equipped! Hold LEFT CLICK or F, then release to shoot.');
        }
      } else if (s.bow)
        hint = 'BOW EQUIPPED · HOLD LEFT CLICK / F\nRELEASE TO SHOOT · W / S TO AIM';
      const n = Array.from({ length: 6 }, (_, i) => s.has('arch-target-' + i)).filter(
        Boolean,
      ).length;
      if (n === 6 && s.has('arch-gate')) {
        s.progress.archer = true;
        s.complete('sharp-eye', 'SHARP EYE · Focus turns intention into action.');
      }
      if (s.player.x > 2250) hint = 'RUNE ORDER · MOON → LEAF → STAR';
    }
    if (s.world === 3) {
      this.updateAstronomyGuide();
      this.nextStarRing!.setVisible(this.constellationStep < 5);
      if (this.constellationStep < 5) {
        const next = this.constellationStars[this.constellationStep];
        this.nextStarRing!.setPosition(next.x, next.y).setScale(
          1 + 0.12 * Math.sin(s.worldTime * 0.005),
        );
      }
      if (s.player.x < 1050)
        hint = s.has('constellation')
          ? 'STARS COMPLETE ✓ · WALK RIGHT →'
          : `CLICK / TAP THE GLOWING STAR ${this.constellationStep + 1}\nOR PRESS ITS NUMBER KEY · NO JUMP NEEDED`;
      if (Math.abs(s.player.x - 1520) < 240) {
        const next = this.planetAngles.findIndex((a) => a !== 0);
        hint =
          next < 0
            ? 'PLANETS COMPLETE ✓ · WALK RIGHT →'
            : `TAP TURN ${next + 1} OR PRESS E\nMove the planet to the gold dot on the RIGHT`;
        if (edge && next >= 0) this.rotatePlanet(next);
      }
      this.planetGraphics!.clear();
      for (let i = 0; i < 3; i++) {
        const cx = 1400 + i * 120,
          cy = 410,
          angle = (this.planetAngles[i] * Math.PI) / 4;
        this.planetGraphics!.lineStyle(1, 0xb5a3da, 0.6);
        this.planetGraphics!.strokeCircle(cx, cy, 45);
        this.planetGraphics!.fillStyle(0xffd794);
        this.planetGraphics!.fillCircle(cx + 45, cy, 5);
        this.planetGraphics!.lineStyle(2, this.planetAngles[i] === 0 ? 0x8ee9dd : 0xffd794, 0.9);
        this.planetGraphics!.strokeCircle(cx + 45, cy, 23);
        this.planets[i].setPosition(cx + Math.cos(angle) * 45, cy + Math.sin(angle) * 45);
      }
      if (Math.abs(s.player.x - 2210) < 140) {
        hint = 'E · LOOK THROUGH THE TELESCOPE';
        if (edge) {
          s.pose(29, 800);
          s.complete('telescope', 'COSMIC DISCOVERY · There is always more to discover.');
          bridge.emit('overlay', 'telescope');
        }
      }
      if (s.has('constellation') && s.has('planets') && s.has('telescope'))
        s.complete('cosmic-explorer', 'COSMIC EXPLORER · Curiosity has no limits.');
    }
    if (s.world === 4) {
      this.bugs!.children.iterate((o) => {
        const b = o as Sprite,
          home = b.getData('home');
        if (b.x < home - 70) b.setVelocityX(65);
        if (b.x > home + 70) b.setVelocityX(-65);
        return true;
      });
      const fixed = [0, 1, 2].every((i) => s.has('bug-' + i));
      if (fixed) s.complete('unity', 'I BUILD GAMES WITH UNITY');
      categories.forEach((c, i) => {
        this.skillPortals[i].setAlpha(fixed ? 1 : 0.35);
        if (s.progress.skills.includes(c.id))
          this.skillPortals[i].setScale(1 + 0.015 * Math.sin(s.worldTime * 0.002));
        if (Math.abs(s.player.x - (1260 + i * 300)) < 105) {
          hint = fixed
            ? 'E · ' + c.title + (s.progress.skills.includes(c.id) ? ' · REPLAY' : '')
            : 'STOMP THREE BUGS TO POWER THE PORTALS';
          if (edge && fixed) {
            s.pose(31);
            audio.play(750);
            bridge.emit('showcase', c.id);
          }
        }
      });
      if (s.progress.skills.length === 7)
        s.complete('skill-tree', '7 SKILLS. COUNTLESS IDEAS. ONE GAME DEVELOPER.');
    }
    if (s.world === 5) {
      if (this.bossHp > 0) {
        this.boss!.setTint(this.vulnerable() ? 0x82eee1 : 0xea83b8);
        if (!this.vulnerable() && s.worldTime > this.bossNextAttack) {
          this.attack();
          this.bossNextAttack = s.worldTime + 950;
        }
      }
      hint = this.vulnerable()
        ? 'CORE EXPOSED · AIM AND RELEASE!'
        : 'DODGE THE ERRORS · WAIT FOR THE CYAN CORE';
      bridge.emit('boss', this.bossHp);
    }
    if (s.world < 5 && Math.abs(s.player.x - (worlds[s.world].width - 170)) < 120) {
      const open = this.canExit();
      hint = open
        ? 'E · ENTER ' + worlds[s.world + 1].name
        : 'PORTAL SEALED · COMPLETE THIS WORLD’S CHALLENGES';
      if (s.world === 3 && !open)
        hint =
          'PORTAL SEALED · Still needed:\n' +
          [
            !s.has('constellation') && '5 connected stars',
            !s.has('planets') && '3 aligned planets',
            !s.has('telescope') && 'Telescope discovery',
          ]
            .filter(Boolean)
            .join(' · ');
      if (edge && open) s.go(s.world + 1);
    }
    return hint;
  }
  canExit() {
    const s = this.s;
    return (
      [
        s.progress.stars.length === 3,
        s.has('active-soul'),
        s.has('sharp-eye'),
        s.has('cosmic-explorer'),
        s.progress.skills.length === 7 && s.has('unity'),
      ][s.world] ?? false
    );
  }
  destroy() {
    if (this.astronomyKeyHandler) this.s.input.keyboard?.off('keydown', this.astronomyKeyHandler);
    this.lockMovement = false;
  }
}
