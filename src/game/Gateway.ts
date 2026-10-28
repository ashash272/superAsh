import { assetUrl } from '../data/assets';
import Phaser from 'phaser';
import { createArt } from './art';
import { renderScale, viewWidth } from './display';
import { createUniverse } from './Universe';
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
  drawPointer: Phaser.Input.Pointer | null = null;
  keyboardDraw = false;
  aimAngle = -0.35;
  bowVisual!: Phaser.GameObjects.Graphics;
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
    this.bow = false;
    this.drawing = 0;
    this.drawPointer = null;
    this.keyboardDraw = false;
    this.aimAngle = -0.35;
    this.lastInteract = false;
    this.interactQueued = false;
    this.poseUntil = 0;
    this.worldTime = 0;
    clearTouch();
  }
  preload() {
    this.load.image('astronomy-sky', assetUrl('assets/environments/astronomy-sky.png'));
    this.load.image('ash-yoga', assetUrl('assets/character/ash-yoga.png'));
    this.load.image('garden-painted', assetUrl('assets/environments/garden-painted.png'));
    this.load.spritesheet('ash-atlas', assetUrl('assets/character/ash-animations.png'), {
      frameWidth: 192,
      frameHeight: 256,
    });
  }
  create() {
    if (!this.textures.exists('tile')) createArt(this);
    const yoga = this.textures.get('ash-yoga');
    if (!yoga.has('0')) {
      const source = yoga.getSourceImage() as HTMLImageElement;
      const cell = source.width / 3;
      for (let i = 0; i < 3; i++) yoga.add(String(i), 0, i * cell, 0, cell, source.height);
    }
    const width = worlds[this.world].width;
    if (!this.anims.exists('ash-run')) {
      for (const id of [19, 26, 28]) {
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
    this.platform(0, 650, width);
    this.player = this.physics.add.sprite(120, 600, 'ash-atlas', 8).setScale(0.36).setDepth(10);
    this.player.setSize(68, 192).setOffset(64, 54).setMaxVelocity(290, 750).setDragX(1800);
    this.physics.add.collider(this.player, this.platforms);
    this.cameras.main.setZoom(renderScale);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(0, 40);
    this.keys = this.input.keyboard!.addKeys('A,D,W,S,F,LEFT,RIGHT,SPACE,UP,E,ENTER,ESC') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    const queue = () => {
      if (!this.held) this.interactQueued = true;
    };
    this.input.keyboard!.on('keydown-E', queue);
    bridge.on('interact', queue);
    // Queue quick touch taps even when down/up both occur between render frames.
    const queueJump = () => {
      if (!this.held && !this.logic.lockMovement) this.bufferedAt = this.worldTime;
    };
    bridge.on('jump', queueJump);
    this.events.once('shutdown', () => bridge.off('jump', queueJump));
    this.arrows = this.physics.add.group();
    this.physics.add.collider(this.arrows, this.platforms, (a) => a.destroy());
    this.aim = this.add.graphics().setDepth(13);
    this.bowVisual = this.add.graphics().setDepth(12);
    this.prompt = this.add
      .text(0, 0, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
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

    const pointerDown = (p: Phaser.Input.Pointer) => {
      if (!this.started || this.held || this.transitioning) return;
      if (this.bow && !this.drawing && p.downElement === this.game.canvas) {
        this.drawPointer = p;
        this.drawing = Math.max(1, this.worldTime);
        audio.play(220);
      }
    };
    const pointerUp = (p: Phaser.Input.Pointer) => {
      if (this.drawing && this.drawPointer?.id === p.id && !this.held) {
        this.shoot(p);
        this.cancelDraw();
      }
    };
    const cancelPointer = () => this.cancelDraw();
    this.input.on('pointerdown', pointerDown);
    this.input.on('pointerup', pointerUp);
    this.input.on('pointerupoutside', pointerUp);
    this.game.canvas.addEventListener('touchcancel', cancelPointer);
    const fireDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        !this.bow ||
        !this.started ||
        this.held ||
        this.transitioning ||
        this.drawing
      )
        return;
      this.keyboardDraw = true;
      this.drawing = Math.max(1, this.worldTime);
      audio.play(220);
    };
    const fireUp = () => {
      if (this.keyboardDraw && !this.held && !this.transitioning) this.shoot();
      if (this.keyboardDraw) this.cancelDraw();
    };
    this.input.keyboard!.on('keydown-F', fireDown);
    this.input.keyboard!.on('keyup-F', fireUp);
    const pause = (v: boolean) => {
      this.held = v;
      this.cancelDraw();
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
      const prefixes = [['hobby-'], []][this.world];
      this.progress.tasks = this.progress.tasks.filter(
        (t) => !prefixes.some((p) => t.startsWith(p)),
      );
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
      bridge.off('interact', queue);
      this.input.off('pointerdown', pointerDown);
      this.input.off('pointerup', pointerUp);
      this.input.off('pointerupoutside', pointerUp);
      this.game.canvas.removeEventListener('touchcancel', cancelPointer);
      this.input.keyboard?.off('keydown-F', fireDown);
      this.input.keyboard?.off('keyup-F', fireUp);
      this.logic.destroy();
    });
    this.persist();
    bridge.emit('health', 3);
    bridge.emit('equipment', this.bow);
    bridge.emit('location', worlds[this.world].name);
    bridge.emit('world', this.world);
    bridge.emit('ready');
    this.cameras.main.fadeIn(650, 15, 12, 35);
  }
  platform(x: number, y: number, w: number) {
    const tile = this.add.rectangle(x + w / 2, y + 100, w, 200, 0x162b3c, 0).setDepth(2);
    const rock = this.add
      .rectangle(x + w / 2, y + 3, w, 6, worlds[this.world].color, 0)
      .setDepth(3);
    this.add.rectangle(x + w / 2, y + 16, w, 22, 0xffffff, 0).setDepth(3);
    const p = this.add.rectangle(x + w / 2, y + 8, w, 16, 0, 0);
    this.physics.add.existing(p, true);
    this.platforms.add(p);
    p.setData('tile', tile);
    p.setData('rock', rock);
    return p;
  }
  background() {
    createUniverse(this, worlds[this.world].width);
  }
  label(x: number, y: number, text: string, size = 13, color = '#e3d3ed') {
    return this.add
      .text(x, y, text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: Math.max(16, size) + 'px',
        color,
        align: 'center',
        lineSpacing: 5,
      })
      .setResolution(2)
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
    for (let i = 7; i > 0; i--)
      c.add(this.add.ellipse(0, 0, 85 + i * 12, 140 + i * 10, color, 0.025));
    c.add(this.add.ellipse(0, 0, 90, 145, 0x151a38, 0.9).setStrokeStyle(3, color));
    for (let i = 0; i < 3; i++) {
      const ring = this.add
        .ellipse(0, 0, 76 - i * 15, 128 - i * 20)
        .setStrokeStyle(1.5, color, 0.7 - i * 0.15);
      c.add(ring);
      this.tweens.add({
        targets: ring,
        scaleX: 0.35,
        alpha: 0.2,
        duration: 1800 + i * 500,
        yoyo: true,
        repeat: -1,
      });
    }
    for (let i = 0; i < 10; i++) {
      const dot = this.add.circle(0, 0, 2, color);
      c.add(dot);
      this.tweens.addCounter({
        from: (i * Math.PI) / 5,
        to: (i * Math.PI) / 5 + Math.PI * 2,
        duration: 4500,
        repeat: -1,
        onUpdate: (tween) => {
          const a = tween.getValue() ?? 0;
          dot.setPosition(Math.cos(a) * 54, Math.sin(a) * 83);
        },
      });
    }
    const pool = this.add.ellipse(0, 78, 140, 18, color, 0.16);
    c.add(pool);
    this.tweens.add({
      targets: pool,
      scaleX: 1.18,
      alpha: 0.3,
      duration: 1700,
      yoyo: true,
      repeat: -1,
    });
    this.label(x, y - 112, title, 18, '#ffffff');
    return c;
  }
  pose(frame: number, duration = 700) {
    this.poseFrame = frame;
    this.poseUntil = this.worldTime + duration;
  }
  burst(x: number, y: number, color: number) {
    for (let i = 0; i < 16; i++) {
      const p = this.add.circle(x, y, 2.5, color).setDepth(30);
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
  cancelDraw() {
    this.drawing = 0;
    this.drawPointer = null;
    this.keyboardDraw = false;
    this.aim?.clear();
  }
  equipBow() {
    this.bow = true;
    if (this.world === 2 && !this.has('arch-bow')) {
      this.progress.tasks.push('arch-bow');
      this.persist();
    }
    this.pose(16, 700);
    bridge.emit('equipment', true);
  }
  shoot(p?: Phaser.Input.Pointer) {
    if (p) {
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      this.aimAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, w.x, w.y);
    }
    const angle = this.aimAngle;
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
    this.cancelDraw();
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
    if (dir !== 0 && !this.logic.lockMovement) this.player.setFlipX(dir < 0);
    if (this.bow && !this.drawPointer) {
      if (dir < 0 && Math.cos(this.aimAngle) > 0) this.aimAngle = -Math.PI - this.aimAngle;
      if (dir > 0 && Math.cos(this.aimAngle) < 0) this.aimAngle = -Math.PI - this.aimAngle;
      const tilt = Number(this.keys.S.isDown) - Number(this.keys.W.isDown);
      this.aimAngle +=
        tilt * Math.sign(Math.cos(this.aimAngle) || 1) * Math.min(delta, 50) * 0.0015;
    }
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
    if (this.logic.mini) {
      this.prompt.setVisible(false);
      return;
    }
    this.prompt
      .setText(hint)
      .setPosition(
        Phaser.Math.Clamp(this.player.x, 160, worlds[this.world].width - 160),
        this.player.y + 85,
      )
      .setVisible(
        !!hint &&
          !this.logic.stations.some((st) => Math.abs(st.x - this.player.x) < 110) &&
          viewWidth(this) > 650,
      );
    if (this.drawing) {
      this.player.anims.stop();
      this.player.setFrame(17);
    } else if (this.poseUntil > time) {
      this.player.anims.stop();
      this.player.setFrame(this.poseFrame);
    } else if (!body.blocked.down) {
      this.player.anims.stop();
      this.player.setFrame(body.velocity.y < 0 ? 13 : 14);
    } else if (Math.abs(body.velocity.x) > 15) this.player.play('ash-run', true);
    else if (this.bow) {
      this.player.anims.stop();
      this.player.setFrame(19);
    } else this.player.play('ash-idle', true);
    // The run/jump atlas frames have no equipment, so attach a bow while moving.
    this.bowVisual.clear();
    const embeddedBow = [16, 17, 19].includes(Number(this.player.frame.name));
    this.bowVisual.setVisible(this.bow && !embeddedBow);
    if (this.bow && !embeddedBow) {
      this.bowVisual.lineStyle(2, 0xe4c388).beginPath();
      this.bowVisual.arc(this.player.x + 15, this.player.y - 5, 20, -1.2, 1.2).strokePath();
      this.bowVisual.lineStyle(1, 0xf4ddaa);
      this.bowVisual.lineBetween(
        this.player.x + 22,
        this.player.y - 24,
        this.player.x + 22,
        this.player.y + 14,
      );
    }
    if (body.blocked.down && !this.wasGrounded) {
      this.pose(15, 120);
    }
    this.wasGrounded = body.blocked.down;
    this.aim.clear();
    if (this.bow) {
      if (this.drawPointer) {
        const w = this.cameras.main.getWorldPoint(this.drawPointer.x, this.drawPointer.y);
        this.aimAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y - 10, w.x, w.y);
      }
      const a = this.aimAngle,
        v = 520 + (this.drawing ? Math.min(850, time - this.drawing) * 0.4 : 0);
      this.aim.fillStyle(0xffdf9b, this.drawing ? 0.85 : 0.35);
      for (let t = 0.08; t < (this.drawing ? 0.9 : 0.35); t += 0.08)
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
