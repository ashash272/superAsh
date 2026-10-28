import Phaser from 'phaser';
import { renderScale, viewWidth } from '../display';
import type { Gateway } from '../Gateway';
import { bridge, audio } from '../bridge';

/** Every action is performed by Ash inside the shared world, with visible trajectories. */
export class HobbyGame {
  actor: Phaser.GameObjects.Sprite;
  fx: Phaser.GameObjects.Graphics;
  ball: Phaser.GameObjects.Arc;
  shadow: Phaser.GameObjects.Ellipse;
  guide: Phaser.GameObjects.Text;
  score = 0;
  time = 0;
  phaseTime = 0;
  phase: 'incoming' | 'return' | 'ready' | 'flight' | 'wall' = 'incoming';
  finished = false;
  progress = 0;
  balance = 0.6;
  swingAt = -1000;
  poseIndex = 0;

  aim = -0.24;
  draw = 0;
  wasHeld = false;
  pointerHeld = false;
  queued = false;
  arrow?: { x: number; y: number; vx: number; vy: number };
  trail: { x: number; y: number }[] = [];
  lastFeedback = '';
  feedbackUntil = 0;
  closeTimer?: Phaser.Time.TimerEvent;
  down: (p: Phaser.Input.Pointer) => void;
  up: () => void;
  resize: () => void;
  exitKey: () => void;
  constructor(
    public s: Gateway,
    public name: string,
    public cx: number,
    public onClose: () => void,
  ) {
    if (name === 'Padel') this.phase = 'wall';
    bridge.emit('toast', '');
    const sport = name === 'Tennis' || name === 'Padel' || name === 'Archery';
    this.actor = s.add
      .sprite(sport ? cx - 275 : cx, 650, 'ash-atlas', sport ? (name === 'Archery' ? 19 : 20) : 24)
      .setOrigin(0.5, 1)
      .setScale(0.72)
      .setDepth(12);
    if (name === 'Yoga')
      this.actor
        .setTexture('ash-yoga', '0')
        .setOrigin(0.5, 0.95)
        .setScale(224 / s.textures.get('ash-yoga').get('0').height);
    this.shadow = s.add.ellipse(this.actor.x, 646, 110, 16, 0x0d1925, 0.3).setDepth(4);
    this.fx = s.add.graphics().setDepth(14);
    this.ball = s.add
      .circle(cx + 285, 552, 8, 0xe9f79b)
      .setDepth(15)
      .setVisible(name === 'Tennis' || name === 'Padel');
    this.guide = s
      .label(cx, 770, '', 20, '#ffffff')
      .setBackgroundColor('#112b38ed')
      .setPadding(16, 10)
      .setDepth(25)
      .setVisible(false);
    s.children.list.forEach((o) => {
      if (o.getData('hobby-prompt')) (o as Phaser.GameObjects.Text).setVisible(false);
    });
    s.player.setVisible(false).setVelocity(0);
    (s.player.body as Phaser.Physics.Arcade.Body).enable = false;
    s.cameras.main.stopFollow();
    this.resize = () => {
      const cam = s.cameras.main;
      cam.setZoom(
        Math.min(1.15, viewWidth(s) / (name === 'Yoga' ? 480 : name === 'Archery' ? 780 : 880)) *
          renderScale,
      );
      // Center the entire activity, including Ash and the receiving end, on small screens.
      cam.useBounds = false;
      cam.centerOn(cx + (name === 'Archery' ? 30 : 0), 540);
    };
    this.resize();
    s.scale.on('resize', this.resize);
    this.down = (p) => {
      if (s.held || s.transitioning || this.finished) return;
      this.pointerHeld = true;
      this.queued = true;
      if (name === 'Archery') {
        const w = s.cameras.main.getWorldPoint(p.x, p.y);
        if (w.x > this.actor.x + 100)
          this.aim = Phaser.Math.Clamp(Math.atan2(w.y - 535, w.x - this.actor.x), -0.8, 0.2);
      }
    };
    this.up = () => {
      this.pointerHeld = false;
    };
    this.exitKey = () => onClose();
    s.input.on('pointerdown', this.down);
    s.input.on('pointerup', this.up);
    s.input.on('pointerupoutside', this.up);
    s.input.keyboard?.on('keydown-Q', this.exitKey);
    bridge.on('leave-hobby', this.exitKey);
    bridge.emit('hobby-active', true);
    bridge.emit('hobby-name', name);
    bridge.emit('hobby-status', '');
    this.objective();
  }
  objective() {
    const descriptions: Record<string, string> = {
      Tennis: 'Tap HIT when the ball glows. Return 3 balls.',
      Padel: 'Let it rebound, then tap HIT. Return 3 balls.',
      Yoga: 'Hold to breathe into each pose. Release to rest.',
      Archery: 'Hold DRAW, release to shoot. Tap a target to aim.',
    };
    bridge.emit('objective', descriptions[this.name]);
  }
  message(text: string) {
    this.lastFeedback = text;
    this.feedbackUntil = this.time + 1600;
  }
  changePose(frame: number) {
    this.actor.setFrame(frame).setAlpha(1);
    // One complete pose at a time: no ghost body or overlapping limbs.
    this.s.tweens.add({
      targets: this.actor,
      angle: { from: -2, to: 0 },
      duration: 350,
      ease: 'Sine.easeOut',
    });
  }

  impact(x: number, y: number, color = 0xffe0a3) {
    this.s.burst(x, y, color);
    audio.play(720);
    const ring = this.s.add.circle(x, y, 8).setStrokeStyle(3, color).setDepth(16);
    this.s.tweens.add({
      targets: ring,
      radius: 50,
      alpha: 0,
      duration: 450,
      onComplete: () => ring.destroy(),
    });
  }
  complete() {
    if (this.finished) return;
    this.finished = true;
    this.s.complete('hobby-' + this.name.toLowerCase(), this.name + ' · Beautifully done!');
    if (this.name !== 'Yoga') this.changePose(28);
    this.message('Complete ✓');
    bridge.emit('hobby-status', 'Complete ✓');
    this.closeTimer = this.s.time.delayedCall(2400, this.onClose);
  }
  update(delta: number, edge: boolean, held: boolean, dir: number) {
    const dt = Math.min(delta, 50);
    this.time += dt;
    this.phaseTime += dt;
    this.fx.clear();
    const fire = edge || this.queued;
    this.queued = false;
    const hold = held || this.pointerHeld;
    if (this.finished) {
      this.actor.setY(650 - Math.sin(this.time / 180) * 3);
      return;
    }
    if (this.name === 'Tennis' || this.name === 'Padel') this.racket(dt, fire, dir);
    else if (this.name === 'Archery') this.archery(dt, hold);
    else this.movement(dt, hold, dir);
    this.shadow.setX(this.actor.x);
    const count = this.name === 'Yoga' ? `${this.poseIndex + 1} / 3 poses` : `${this.score} / 3`;
    bridge.emit(
      'hobby-status',
      this.finished ? 'Complete ✓' : this.time < this.feedbackUntil ? this.lastFeedback : count,
    );
    this.guide.setText(
      this.time < this.feedbackUntil ? this.lastFeedback : count + '  ·  ' + this.hint(),
    );
    this.wasHeld = hold;
  }
  hint() {
    if (this.name === 'Archery')
      return this.draw > 0 ? 'DRAWING… release to shoot' : 'HOLD E / TOUCH TO DRAW';
    if (this.name === 'Yoga') return 'HOLD E / TOUCH · BREATHE & MOVE';
    return this.phase === 'return'
      ? 'WATCH YOUR RETURN ↗'
      : Math.abs(this.ball.x - this.actor.x) < 110
        ? 'NOW · E / TAP TO SWING'
        : 'WATCH THE BALL';
  }
  racket(dt: number, fire: boolean, dir: number) {
    this.actor.x = Phaser.Math.Clamp(this.actor.x + dir * dt * 0.18, this.cx - 365, this.cx - 180);
    if (this.phase === 'wall') {
      const u = Math.min(1, this.phaseTime / 700);
      this.ball.setPosition(this.cx + 285 + u * 120, 552 - Math.sin(u * Math.PI) * 55);
      if (u === 1) {
        this.impact(this.cx + 405, 552, 0x9de6fa);
        this.phase = 'incoming';
        this.phaseTime = 0;
      }
      return;
    }
    const t = this.phaseTime / (this.phase === 'incoming' ? 2600 : 1550);
    if (this.phase === 'incoming') {
      // The serve crosses the net, bounces on court, then rises toward Ash's racket.
      const from = this.name === 'Padel' ? this.cx + 405 : this.cx + 285;
      const x = Phaser.Math.Linear(from, this.cx - 360, Math.min(1, t));
      const y =
        t < 0.7
          ? 552 - 180 * Math.sin((Math.PI * t) / 0.7) + (80 * t) / 0.7
          : 632 - 112 * Math.sin((Math.min(1, (t - 0.7) / 0.3) * Math.PI) / 2);
      this.ball.setPosition(x, y);

      if (this.phaseTime - dt < 1820 && this.phaseTime >= 1820) this.impact(x, 634, 0xcde9bb);
      const near = Math.abs(x - this.actor.x) < 120 && y < 620;
      this.ball.setFillStyle(near ? 0xffffff : 0xe9f79b);
      if (near) {
        this.fx.lineStyle(2, 0xa0f4bd, 0.8);
        this.fx.strokeCircle(x, y, 19 + Math.sin(this.time / 80) * 3);
      }
      if (fire && this.time - this.swingAt > 550) {
        this.swingAt = this.time;
        if (near) {
          this.phase = 'return';
          this.phaseTime = 0;
          this.trail = [];
          this.impact(x, y);
          this.message('CLEAN CONTACT · Watch it fly!');
        } else this.message('A little closer… swing when the ball glows.');
      }
      if (t > 1.15) {
        this.phaseTime = 0;
        this.message('Another serve coming · your score stays.');
      }
    } else {
      const u = Math.min(1, t),
        start = this.actor.x + 45;
      this.ball.setPosition(
        Phaser.Math.Linear(start, this.cx + (this.name === 'Padel' ? 405 : 320), u),
        535 - 175 * Math.sin(u * Math.PI) + 80 * u,
      );
      if (t >= 1) {
        this.score++;
        this.impact(this.ball.x, this.ball.y, 0x8deac8);
        this.phase = this.name === 'Padel' ? 'wall' : 'incoming';
        this.phaseTime = 0;
        if (this.score >= 3) this.complete();
      }
    }
    const swing = this.time - this.swingAt;
    if (!this.finished) {
      this.actor.setFrame(
        swing < 130 ? 20 : swing < 260 ? 21 : swing < 440 ? 22 : swing < 650 ? 23 : 20,
      );
      this.actor
        .setAngle(swing < 440 ? Math.sin((swing / 440) * Math.PI) * -6 : 0)
        .setY(
          650 -
            (swing < 440 ? Math.sin((swing / 440) * Math.PI) * 5 : Math.sin(this.time / 450) * 2),
        );
    }
    if (swing < 450) {
      this.fx.lineStyle(4, 0xffe1a1, 0.5 * (1 - swing / 450));
      this.fx.beginPath();
      this.fx.arc(this.actor.x + 42, 540, 65, -1.2, 0.8);
      this.fx.strokePath();
    }
    this.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.trail.length > 9) this.trail.shift();
    this.trail.forEach((p, i) => {
      this.fx.fillStyle(0xe9f79b, (i / this.trail.length) * 0.35);
      this.fx.fillCircle(p.x, p.y, 3 + i * 0.35);
    });
    this.fx.fillStyle(0x102332, 0.22);
    this.fx.fillEllipse(this.ball.x, 645, 24, 6);
  }
  movement(dt: number, hold: boolean, dir: number) {
    const frames = [0, 1, 2];
    if (Number(this.actor.frame.name) !== frames[this.poseIndex])
      this.changePose(frames[this.poseIndex]);
    if (hold) this.progress = Math.min(1, this.progress + dt / 2600);
    const breath = (Math.sin(this.time / 750) + 1) / 2;
    const scale = 224 / this.s.textures.get('ash-yoga').get('0').height;
    this.actor.setY(650 - breath * 2).setScale(scale, scale * (1 + breath * 0.008));
    this.actor.setAngle(Math.sin(this.time / 1200) * 0.8);
    this.fx.lineStyle(2, 0xa5e8d1, 0.25);
    this.fx.strokeEllipse(this.cx, 640, 210 + breath * 50, 30 + breath * 8);
    this.fx.lineStyle(4, 0xddebbd, 0.8);
    this.fx.beginPath();
    this.fx.arc(
      this.cx,
      465,
      32,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.min(1, this.progress),
    );
    this.fx.strokePath();
    for (let i = 0; i < 5; i++) {
      const a = this.time / 1700 + i * Math.PI * 0.4;
      this.fx.fillStyle(0xe2d5ad, 0.6);
      this.fx.fillCircle(this.cx + Math.cos(a) * 120, 555 + Math.sin(a) * 55, 2);
    }
    if (this.progress >= 1) {
      this.poseIndex++;
      this.progress = 0;
      this.balance = this.poseIndex % 2 ? -0.5 : 0.5;
      this.impact(this.cx, 560, 0xa3e4cc);
      if (this.poseIndex >= frames.length) this.complete();
      else this.message('Lovely · smoothly into the next pose');
    }
  }
  archery(dt: number, hold: boolean) {
    const tilt = Number(this.s.keys.S.isDown) - Number(this.s.keys.W.isDown);
    this.aim = Phaser.Math.Clamp(this.aim + tilt * dt * 0.0006, -0.8, 0.2);
    const x = this.actor.x + 50,
      y = 535;
    this.fx.lineStyle(2, 0xfff1b5, 0.65);
    this.fx.strokeCircle(this.cx + 220 + this.score * 75, 480, 56 + Math.sin(this.time / 300) * 3);
    if (this.phase !== 'flight') {
      if (hold) {
        this.draw = Math.min(1, this.draw + dt / 700);
        this.actor.setFrame(17);
      } else if (this.wasHeld && this.draw > 0) {
        const speed = 720;
        this.arrow = { x, y, vx: Math.cos(this.aim) * speed, vy: Math.sin(this.aim) * speed };
        this.phase = 'flight';
        this.phaseTime = 0;
        this.draw = 0;
        this.actor.setFrame(18);
        this.trail = [];
        audio.play(460);
      } else this.actor.setFrame(19);
      this.fx.fillStyle(0xffe2aa, 0.65);
      for (let t = 0.1; t < 0.85; t += 0.09)
        this.fx.fillCircle(
          x + Math.cos(this.aim) * 720 * t,
          y + Math.sin(this.aim) * 720 * t + 130 * t * t,
          2,
        );
      if (hold) {
        this.fx.lineStyle(1.5, 0xf8dfb0);
        this.fx.lineBetween(x + 8, y - 40, x - 18 - this.draw * 12, y);
        this.fx.lineBetween(x - 18 - this.draw * 12, y, x + 8, y + 40);
      }
    }
    if (this.arrow) {
      const a = this.arrow;
      a.x += (a.vx * dt) / 1000;
      a.y += (a.vy * dt) / 1000;
      a.vy += (260 * dt) / 1000;
      const angle = Math.atan2(a.vy, a.vx);
      this.fx.lineStyle(3, 0xf9dfab);
      this.fx.lineBetween(a.x - Math.cos(angle) * 35, a.y - Math.sin(angle) * 35, a.x, a.y);
      this.fx.fillStyle(0x93e6dd);
      this.fx.fillTriangle(
        a.x,
        a.y,
        a.x - 12 * Math.cos(angle - 0.4),
        a.y - 12 * Math.sin(angle - 0.4),
        a.x - 12 * Math.cos(angle + 0.4),
        a.y - 12 * Math.sin(angle + 0.4),
      );
      this.trail.push({ x: a.x, y: a.y });
      if (this.trail.length > 12) this.trail.shift();
      this.trail.forEach((p, i) => {
        this.fx.fillStyle(0xffe2ac, i / 30);
        this.fx.fillCircle(p.x, p.y, 2);
      });
      const target = this.cx + 220 + this.score * 75;
      if (a.x >= target && a.x - (a.vx * dt) / 1000 < target) {
        if (Math.abs(a.y - 480) < 55) {
          this.score++;
          this.impact(target, a.y, 0xf5d888);
          this.message('TARGET HIT ✓');
          const stuck = this.s.add
            .image(target - 15, a.y, 'arrow')
            .setRotation(angle)
            .setDepth(16);
          this.s.time.delayedCall(5000, () => stuck.destroy());
          if (this.score >= 3) this.complete();
        } else this.message('Try W / S to adjust the dotted path.');
        this.arrow = undefined;
        this.phase = 'ready';
      } else if (a.y > 660 || this.phaseTime > 2000) {
        this.arrow = undefined;
        this.phase = 'ready';
        this.message('Draw again · your hits stay saved.');
      }
    }
  }
  destroy() {
    this.closeTimer?.remove();
    this.s.input.off('pointerdown', this.down);
    this.s.input.off('pointerup', this.up);
    this.s.input.off('pointerupoutside', this.up);
    this.s.input.keyboard?.off('keydown-Q', this.exitKey);
    bridge.off('leave-hobby', this.exitKey);
    this.s.scale.off('resize', this.resize);
    [this.actor, this.fx, this.ball, this.shadow, this.guide].forEach((o) => o.destroy());
    this.s.children.list.forEach((o) => {
      if (o.getData('hobby-prompt'))
        (o as Phaser.GameObjects.Text).setVisible(viewWidth(this.s) > 650);
    });
    this.s.player.setVisible(true).setPosition(this.cx - 275, 600);
    (this.s.player.body as Phaser.Physics.Arcade.Body).enable = true;
    this.s.cameras.main
      .setZoom(renderScale)
      .setBounds(0, 0, this.s.physics.world.bounds.width, 850)
      .startFollow(this.s.player, true, 0.1, 0.1);
    bridge.emit('hobby-active', false);
  }
}
