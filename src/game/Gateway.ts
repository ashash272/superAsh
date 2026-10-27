import Phaser from 'phaser';
import { createArt } from './art';
import { audio, bridge, touch, clearTouch } from './bridge';
import { readProgress, saveProgress, worlds, categories, type Progress } from '../data/progress';
import { Challenges } from './systems/Challenges';
export class Gateway extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  platforms!: Phaser.Physics.Arcade.StaticGroup;
  arrows!: Phaser.Physics.Arcade.Group;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  progress: Progress = readProgress();
  world = 0;
  started = false;
  held = false;
  transitioning = false;
  groundedAt = -1000;
  bufferedAt = -1000;
  wasJump = false;
  health = 3;
  checkpoint = 120;
  invulnerableUntil = 0;
  bow = false;
  drawing = 0;
  lastInteract = false;
  interactQueued = false;
  aim!: Phaser.GameObjects.Graphics;
  prompt!: Phaser.GameObjects.Text;
  logic!: Challenges;
  poseUntil = 0;
  poseFrame = 8;
  wasGrounded = true;
  worldTime = 0;
  constructor() {
    super('Gateway');
  }
  init(data: { world?: number; started?: boolean }) {
    this.progress = readProgress();
    this.world = data.world ?? this.progress.world;
    this.started = data.started ?? false;
    this.held = false;
    this.transitioning = false;
    this.groundedAt = -1000;
    this.bufferedAt = -1000;
    this.wasJump = false;
    this.health = 3;
    this.checkpoint = 120;
    this.invulnerableUntil = 0;
    this.bow = this.world === 5;
    this.drawing = 0;
    this.lastInteract = false;
    this.interactQueued = false;
    this.poseUntil = 0;
    this.worldTime = 0;
    clearTouch();
  }
  preload() {
    this.load.image('cosmic', '/assets/environments/cosmic.png');
    this.load.spritesheet('worlds', '/assets/environments/worlds.png', {
      frameWidth: 836,
      frameHeight: 313,
    });
    this.load.spritesheet('ash-atlas', '/assets/character/ash-animations.png', {
      frameWidth: 192,
      frameHeight: 256,
    });
  }
  create() {
    if (!this.textures.exists('tile')) createArt(this);
    const width = worlds[this.world].width;
    if (!this.anims.exists('ash-run')) {
      for (const id of [26, 28]) {
        const f = this.textures.get('ash-atlas').get(id);
        f.setSize(152, 256, f.cutX + 40, f.cutY);
        f.setTrim(192, 256, 40, 0, 152, 256);
      }
      this.anims.create({
        key: 'ash-run',
        frames: this.anims.generateFrameNumbers('ash-atlas', { start: 0, end: 7 }),
        frameRate: 11,
        repeat: -1,
      });
      this.anims.create({
        key: 'ash-idle',
        frames: this.anims.generateFrameNumbers('ash-atlas', { start: 8, end: 11 }),
        frameRate: 4,
        repeat: -1,
      });
    }
    this.physics.world.setBounds(0, 0, width, 850);
    this.cameras.main.setBounds(0, 0, width, 850);
    this.background();
    this.platforms = this.physics.add.staticGroup();
    if (this.world === 0) {
      [
        [0, 650, 600],
        [665, 610, 245],
        [980, 560, 240],
        [1280, 650, 520],
        [330, 540, 144],
        [565, 515, 100],
        [720, 480, 144],
        [925, 445, 90],
        [1040, 410, 144],
      ].forEach(([x, y, w]) => this.platform(x, y, w));
    } else {
      this.platform(0, 650, width);
      if (this.world !== 5 && this.world !== 6) {
        [
          [380, 545, 130],
          [780, 470, 120],
          [1120, 535, 145],
          [1760, 530, 135],
          [2120, 450, 145],
        ].forEach(([x, y, w]) => this.platform(x, y, w));
      }
    }
    this.player = this.physics.add.sprite(120, 600, 'ash-atlas', 8).setScale(0.36).setDepth(10);
    this.player.setSize(68, 192).setOffset(64, 54).setMaxVelocity(290, 750).setDragX(1800);
    this.physics.add.collider(this.player, this.platforms);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(-65, 40);
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,SPACE,UP,E,ENTER,ESC') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    const queue = () => {
      if (!this.held) this.interactQueued = true;
    };
    this.input.keyboard!.on('keydown-E', queue);
    this.arrows = this.physics.add.group();
    this.physics.add.collider(this.arrows, this.platforms, (a) => a.destroy());
    this.aim = this.add.graphics().setDepth(13);
    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#fff0d2',
        backgroundColor: '#17132ee8',
        padding: { x: 10, y: 8 },
        align: 'center',
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5, 1)
      .setDepth(25);
    this.time.addEvent({
      delay: 6500,
      loop: true,
      callback: () => {
        if (this.started && !this.held) audio.ambient(this.world);
      },
    });
    this.logic = new Challenges(this);
    this.logic.create();
    this.addSecrets();
    const pointerDown = (p: Phaser.Input.Pointer) => {
      if (!this.started || this.held || this.transitioning) return;
      if (this.bow && p.downElement === this.game.canvas) {
        this.drawing = this.worldTime;
        audio.play(220);
      }
    };
    const pointerUp = (p: Phaser.Input.Pointer) => {
      if (this.drawing && !this.held) {
        this.shoot(p);
        this.drawing = 0;
      }
    };
    this.input.on('pointerdown', pointerDown);
    this.input.on('pointerup', pointerUp);
    const pause = (v: boolean) => {
      this.held = v;
      this.drawing = 0;
      this.interactQueued = false;
      clearTouch();
      if (v) {
        this.physics.pause();
        if (this.started) {
          this.tweens.pauseAll();
          this.time.paused = true;
        }
        this.player.setAccelerationX(0).setVelocityX(0);
      } else {
        this.physics.resume();
        this.tweens.resumeAll();
        this.time.paused = false;
      }
    };
    const start = () => {
      this.started = true;
      this.cameras.main.fadeIn(650, 15, 12, 35);
    };
    const complete = (id: string) => {
      if (!categories.some((c) => c.id === id)) return;
      if (!this.progress.skills.includes(id)) {
        this.progress.skills.push(id);
        this.persist();
      }
      this.pose(28, 900);
      this.burst(this.player.x, this.player.y, 0xb794ef);
    };
    const travel = (index: number) => {
      if (Number.isInteger(index) && index >= 0 && index <= this.progress.unlockedWorld)
        this.go(index);
    };
    const replay = () => {
      const prefixes = [
        ['intro'],
        ['sport-', 'active-soul'],
        ['arch-', 'sharp-eye'],
        ['constellation', 'planets', 'telescope', 'cosmic-explorer'],
        ['bug-', 'unity', 'skill-tree'],
        ['boss'],
        ['creator-of-worlds'],
      ][this.world];
      this.progress.tasks = this.progress.tasks.filter(
        (t) => !prefixes.some((p) => t.startsWith(p)),
      );
      if (this.world === 0) this.progress.stars = [];
      if (this.world === 2) this.progress.archer = false;
      this.persist();
      this.go(this.world);
    };
    bridge.on('replay-world', replay);
    bridge.on('pause', pause);
    bridge.on('start', start);
    bridge.on('skill-complete', complete);
    bridge.on('travel', travel);
    this.events.once('shutdown', () => {
      bridge.off('replay-world', replay);
      bridge.off('pause', pause);
      bridge.off('start', start);
      bridge.off('skill-complete', complete);
      bridge.off('travel', travel);
      this.input.keyboard?.off('keydown-E', queue);
      this.input.off('pointerdown', pointerDown);
      this.input.off('pointerup', pointerUp);
      this.logic.destroy();
    });
    this.persist();
    bridge.emit('health', 3);
    bridge.emit('location', worlds[this.world].name);
    bridge.emit('world', this.world);
    bridge.emit('ready');
    this.cameras.main.fadeIn(650, 15, 12, 35);
    if (this.world === 6) this.time.delayedCall(1500, () => bridge.emit('overlay', 'final'));
  }
  platform(x: number, y: number, w: number) {
    const tile = this.add
      .tileSprite(x, y, w, 48, 'tile')
      .setOrigin(0)
      .setTint(this.world === 4 ? 0xbb9aff : this.world === 1 ? 0xc0e2c8 : 0xffffff);
    tile.setDepth(2);
    const rock = this.add.graphics().setDepth(1);
    rock.fillStyle(0x28243d);
    rock.fillTriangle(x, y + 44, x + w, y + 44, x + w * 0.55, y + 95);
    rock.fillStyle(0x403452);
    rock.fillTriangle(x + w * 0.6, y + 46, x + w, y + 44, x + w * 0.55, y + 95);
    const p = this.add.rectangle(x + w / 2, y + 8, w, 16, 0, 0);
    this.physics.add.existing(p, true);
    this.platforms.add(p);
    p.setData('tile', tile);
    p.setData('rock', rock);
    return p;
  }
  background() {
    const width = worlds[this.world].width;
    this.cameras.main.setBackgroundColor('#141126');
    const bg = this.add
      .image(
        0,
        0,
        this.world === 0 ? 'cosmic' : 'worlds',
        this.world === 0 ? undefined : this.world - 1,
      )
      .setOrigin(0)
      .setScrollFactor(0.06)
      .setAlpha(0.72);
    bg.setDisplaySize(Math.max(1800, this.scale.width + width * 0.06), 900);
    const resize = (size: Phaser.Structs.Size) =>
      bg.setDisplaySize(Math.max(1800, size.width + width * 0.06), 900);
    this.scale.on('resize', resize);
    this.events.once('shutdown', () => this.scale.off('resize', resize));
    const rand = new Phaser.Math.RandomDataGenerator(['ashify-' + this.world]);
    for (let i = 0; i < 75; i++) {
      const p = this.add
        .rectangle(
          rand.between(0, width),
          rand.between(70, 660),
          i % 5 ? 2 : 3,
          i % 5 ? 2 : 3,
          i % 2 ? 0xa1e5d6 : 0xe5cbff,
          0.6,
        )
        .setScrollFactor(0.45);
      this.tweens.add({
        targets: p,
        y: p.y - 25,
        alpha: 0.1,
        duration: rand.between(2000, 5000),
        yoyo: true,
        repeat: -1,
      });
    }
    this.label(100, 555, worlds[this.world].subtitle, 11);
  }
  label(x: number, y: number, text: string, size = 13, color = '#e3d3ed') {
    return this.add
      .text(x, y, text, {
        fontFamily: 'monospace',
        fontSize: size + 'px',
        color,
        align: 'center',
        lineSpacing: 5,
      })
      .setOrigin(0.5)
      .setDepth(5);
  }
  addSecrets() {
    if (this.world === 0 || this.world === 5 || this.world === 6) return;
    const id = 'secret-' + this.world;
    if (this.progress.secrets.includes(id)) return;
    const star = this.physics.add.staticImage(840, 420, 'star').setTint(0x9de8dc).setScale(1.3);
    this.physics.add.overlap(this.player, star, () => {
      this.progress.secrets.push(id);
      this.persist();
      this.burst(star.x, star.y, 0x9de8dc);
      star.destroy();
      audio.play(1300);
      bridge.emit(
        'toast',
        [
          '',
          'SECRET: Movement is my kind of magic.',
          'SECRET: I’ve practiced archery in real life.',
          'SECRET: I’ve attended astronomy conferences.',
          'SECRET: Yes, I really do build with Unity.',
        ][this.world],
      );
    });
  }
  portal(x: number, y: number, title: string, color = worlds[this.world].color) {
    const c = this.add.container(x, y).setDepth(3);
    for (let i = 3; i >= 0; i--)
      c.add(this.add.ellipse(0, 0, 90 + i * 14, 140 + i * 14, color, 0.035));
    c.add(this.add.ellipse(0, 0, 76, 134, 0x211333).setStrokeStyle(3, color));
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI) / 8;
      c.add(
        this.add
          .rectangle(Math.cos(a) * 57, -Math.sin(a) * 78, 22, 22, 0x5a506c)
          .setStrokeStyle(2, 0x8b759e),
      );
    }
    c.add(this.add.rectangle(-57, 24, 22, 98, 0x5a506c));
    c.add(this.add.rectangle(57, 24, 22, 98, 0x5a506c));
    const inner = this.add.ellipse(0, 0, 44, 85).setStrokeStyle(2, color, 0.8);
    c.add(inner);
    this.tweens.add({
      targets: inner,
      scaleX: 0.5,
      scaleY: 0.8,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });
    this.label(x, y - 115, title, 12);
    return c;
  }
  pose(frame: number, duration = 700) {
    this.poseFrame = frame;
    this.poseUntil = this.worldTime + duration;
  }
  burst(x: number, y: number, color: number) {
    for (let i = 0; i < 16; i++) {
      const p = this.add.image(x, y, 'pixel').setTint(color).setDepth(30);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-65, 65),
        y: y + Phaser.Math.Between(-70, 35),
        alpha: 0,
        duration: 650,
        onComplete: () => p.destroy(),
      });
    }
  }
  persist() {
    saveProgress(this.progress);
    bridge.emit('progress', {
      ...this.progress,
      skills: [...this.progress.skills],
      tasks: [...this.progress.tasks],
    });
  }
  complete(id: string, message: string) {
    if (!this.progress.tasks.includes(id)) {
      this.progress.tasks.push(id);
      this.persist();
      this.pose(28, 900);
      this.burst(this.player.x, this.player.y, worlds[this.world].color);
      audio.play(1000);
      bridge.emit('toast', message);
    }
  }
  has(id: string) {
    return this.progress.tasks.includes(id);
  }
  hurt() {
    if (this.worldTime < this.invulnerableUntil) return;
    this.health--;
    this.invulnerableUntil = this.worldTime + 1700;
    audio.play(150);
    this.pose(30, 500);
    this.cameras.main.shake(160, 0.005);
    if (this.health <= 0) {
      this.health = 3;
      this.player.setPosition(this.checkpoint, 570).setVelocity(0, 0);
      bridge.emit('toast', 'A fresh start. Your discoveries stay with you.');
    }
    bridge.emit('health', this.health);
  }
  respawn() {
    this.player.setPosition(this.checkpoint, 550).setVelocity(0, 0);
    this.hurt();
  }
  shoot(p: Phaser.Input.Pointer) {
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, w.x, w.y);
    const speed = 520 + Math.min(850, this.worldTime - this.drawing) * 0.4;
    const a = this.arrows.create(
      this.player.x,
      this.player.y - 10,
      'arrow',
    ) as Phaser.Physics.Arcade.Sprite;
    a.setSize(20, 8)
      .setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
      .setGravityY(-700)
      .setRotation(angle);
    this.time.delayedCall(4500, () => {
      if (a.active) a.destroy();
    });
    this.pose(18, 400);
    audio.play(420);
  }
  go(index: number) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.progress.world = index;
    this.progress.unlockedWorld = Math.max(index, this.progress.unlockedWorld);
    this.persist();
    this.pose(31, 600);
    clearTouch();
    bridge.emit('overlay', null);
    this.cameras.main.fadeOut(550, 15, 12, 35);
    this.time.delayedCall(570, () => this.scene.restart({ world: index, started: true }));
  }
  update(_time: number, delta: number) {
    if (!this.player) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) && !this.started)
      bridge.emit('request-start');
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) && this.started) bridge.emit('escape');
    if (!this.started || this.held || this.transitioning) {
      this.player.setVelocityX(0);
      return;
    }
    this.worldTime += Math.min(delta, 50);
    const time = this.worldTime;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const jump = this.keys.SPACE.isDown || this.keys.UP.isDown || touch.jump;
    const dir =
      Number(this.keys.D.isDown || this.keys.RIGHT.isDown || touch.right) -
      Number(this.keys.A.isDown || this.keys.LEFT.isDown || touch.left);
    const interact = touch.interact || this.keys.E.isDown;
    const edge = this.interactQueued || (touch.interact && !this.lastInteract);
    this.interactQueued = false;
    this.lastInteract = touch.interact;
    if (body.blocked.down) this.groundedAt = time;
    if (jump && !this.wasJump) this.bufferedAt = time;
    if (!this.logic.lockMovement && time - this.bufferedAt < 140 && time - this.groundedAt < 115) {
      this.player.setVelocityY(-570);
      this.groundedAt = -1000;
      this.bufferedAt = -1000;
      audio.play(300);
    }
    if (!jump && this.wasJump && body.velocity.y < -180) this.player.setVelocityY(-180);
    this.wasJump = jump;
    this.player.setAccelerationX(this.logic.lockMovement ? 0 : dir * 1800);
    if (this.logic.lockMovement) this.player.setVelocityX(0);
    if (this.player.x < 22) this.player.x = 22;
    if (this.player.x > worlds[this.world].width - 25)
      this.player.x = worlds[this.world].width - 25;
    if (this.player.y > 790) this.respawn();
    if (body.blocked.down && this.player.x > this.checkpoint + 650) this.checkpoint = this.player.x;
    this.player.setAlpha(
      time < this.invulnerableUntil ? (Math.floor(time / 100) % 2 ? 0.35 : 1) : 1,
    );
    let hint = this.logic.update(delta, edge, interact, dir);
    this.prompt
      .setText(hint)
      .setPosition(
        Phaser.Math.Clamp(this.player.x, 160, worlds[this.world].width - 160),
        this.player.y - 63,
      )
      .setVisible(!!hint);
    if (this.poseUntil > time) {
      this.player.anims.stop();
      this.player.setFrame(this.poseFrame);
    } else if (this.drawing) {
      this.player.anims.stop();
      this.player.setFrame(17);
    } else if (!body.blocked.down) {
      this.player.anims.stop();
      this.player.setFrame(body.velocity.y < 0 ? 13 : 14);
    } else if (Math.abs(body.velocity.x) > 15) this.player.play('ash-run', true);
    else this.player.play('ash-idle', true);
    if (body.blocked.down && !this.wasGrounded) {
      this.pose(15, 120);
    }
    this.wasGrounded = body.blocked.down;
    this.aim.clear();
    if (this.drawing) {
      const w = this.cameras.main.getWorldPoint(
          this.input.activePointer.x,
          this.input.activePointer.y,
        ),
        a = Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, w.x, w.y),
        v = 520 + Math.min(850, time - this.drawing) * 0.4;
      this.aim.fillStyle(0xffdf9b, 0.85);
      for (let t = 0.08; t < 0.9; t += 0.08)
        this.aim.fillCircle(
          this.player.x + Math.cos(a) * v * t,
          this.player.y - 10 + Math.sin(a) * v * t + 175 * t * t,
          2,
        );
    }
    this.arrows.children.iterate((a) => {
      const s = a as Phaser.Physics.Arcade.Sprite,
        b = s.body as Phaser.Physics.Arcade.Body;
      if (b) s.setRotation(Math.atan2(b.velocity.y, b.velocity.x));
      return true;
    });
  }
}
