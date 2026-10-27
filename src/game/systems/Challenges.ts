import Phaser from 'phaser';
import type { Gateway } from '../Gateway';
import { bridge, audio } from '../bridge';
import { categories, worlds } from '../../data/progress';

/** Three open rooms. Interactions introduce Ash; none gate the portfolio. */
export class Challenges {
  lockMovement = false;
  stations: { x: number; title: string; action: () => void }[] = [];
  constellationStep = 0;
  stars: Phaser.GameObjects.Star[] = [];
  keyHandler?: (event: KeyboardEvent) => void;
  constructor(public s: Gateway) {}
  station(x: number, title: string, action: () => void) {
    this.stations.push({ x, title, action });
    const button = this.s.label(x, 510, title + '\nClick / tap · or E nearby', 17, '#ffffff')
      .setBackgroundColor('#14243eee').setPadding(16, 12).setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => { if (this.s.started && !this.s.held) action(); });
  }
  create() {
    const s = this.s;
    if (s.world === 0) this.hobbies();
    if (s.world === 1) this.astronomy();
    if (s.world === 2) this.portfolio();
    const next = s.world === 2 ? 'MEET ASH' : worlds[s.world + 1].name;
    s.portal(worlds[s.world].width - 150, 565, next);
  }
  hobbies() {
    const s = this.s;
    bridge.emit('objective', 'A quick introduction: try any hobby, or go straight to my work. Everything is optional.');
    const activities = [
      ['Tennis', 'A little energy, a little friendly competition.', 21],
      ['Padel', 'Fast rallies and good company.', 21],
      ['Yoga', 'A calm moment to reset and refocus.', 24],
      ['Flexibility', 'Small stretches. Steady progress.', 26],
      ['Pilates', 'Balance and control, one movement at a time.', 24],
      ['Archery', 'Focus, patience, and trusting my aim.', 18],
    ] as const;
    activities.forEach(([name, story, pose], i) => {
      const x = 240 + i * 280;
      const color = i % 2 ? 0xf3ca99 : 0x91e5d1;
      s.add.ellipse(x, 638, 150, 13, color, 0.2);
      const icon = s.add.graphics();
      icon.lineStyle(3, color);
      if (i < 2) { icon.strokeEllipse(x, 395, 40, 60); icon.lineBetween(x, 425, x - 15, 455); }
      else if (i === 5) { [34, 23, 10].forEach(r => icon.strokeCircle(x, 410, r)); }
      else { icon.strokeRoundedRect(x - 55, 425, 110, 12, 6); icon.strokeCircle(x, 395, 13); }
      let busy = false;
      this.station(x, name, () => {
        if (busy) return; busy = true;
        s.pose(pose, 900);
        s.complete('hobby-' + name.toLowerCase(), name.toUpperCase() + ' · ' + story);
        bridge.emit('toast', story);
        const ball = s.add.circle(x - 55, 405, i === 5 ? 4 : 7, color).setDepth(7);
        s.tweens.add({targets: ball, x: x + 45, y: i < 2 ? 365 : 405, duration: 650, yoyo: i < 2,
          onComplete: () => {ball.destroy(); busy = false; s.burst(x, 410, color);}});
      });
    });
  }
  astronomy() {
    const s = this.s;
    bridge.emit('objective', 'Connect three glowing stars in order. Then take a look through the telescope—or continue to my work.');
    this.constellationStep = s.has('discovery-stars') ? 3 : 0;
    const lines = s.add.graphics().lineStyle(2, 0x9ee7fb);
    const points = [[270, 365], [390, 290], [510, 365]];
    const connect = (i: number) => {
      if (!s.started || s.held || this.constellationStep >= 3) return;
      if (i !== this.constellationStep) { bridge.emit('toast', 'Choose glowing star ' + (this.constellationStep + 1) + '.'); return; }
      this.stars[i].setFillStyle(0x8ee9dd); s.burst(...points[i] as [number, number], 0x8ee9dd);
      if (i) lines.lineBetween(...points[i - 1] as [number, number], ...points[i] as [number, number]);
      this.constellationStep++; audio.play(600 + i * 150);
      if (this.constellationStep === 3) s.complete('discovery-stars', 'Curiosity connects the dots. Try the telescope next.');
    };
    points.forEach(([x, y], i) => {
      const star = s.add.star(x, y, 5, 13, 27, this.constellationStep === 3 ? 0x8ee9dd : 0xffe2ac)
        .setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);
      star.on('pointerdown', () => connect(i)); this.stars.push(star);
      s.label(x, y + 48, String(i + 1), 18);
      if (this.constellationStep === 3 && i) lines.lineBetween(...points[i - 1] as [number, number], x, y);
    });
    this.keyHandler = e => { if (/^[1-3]$/.test(e.key)) connect(Number(e.key) - 1); };
    s.input.keyboard?.on('keydown', this.keyHandler);
    this.station(390, 'Connect the stars · 1 → 2 → 3', () => connect(this.constellationStep));
    const telescope = s.add.graphics().lineStyle(9, 0xa3c8e7);
    telescope.lineBetween(880, 410, 955, 365); telescope.lineStyle(3, 0xd8e4fa);
    telescope.lineBetween(910, 405, 880, 465); telescope.lineBetween(910, 405, 945, 465);
    this.station(920, 'Look through the telescope', () => {
      s.complete('discovery-telescope', 'There is always more to discover.'); bridge.emit('overlay', 'telescope');
    });
  }
  portfolio() {
    const s = this.s;
    bridge.emit('objective', 'My creative toolkit. Open any portal to explore a discipline. No challenges or required order.');
    categories.forEach((c, i) => {
      const x = 280 + i * 340;
      s.portal(x, 570, c.title, Phaser.Display.Color.HexStringToColor(c.color).color);
      const open = () => bridge.emit('showcase', c.id);
      this.stations.push({x, title: 'Explore ' + c.title, action: open});
      s.add.zone(x, 550, 155, 190).setInteractive({useHandCursor: true}).on('pointerdown', () => {
        if (s.started && !s.held) open();
      });
    });
  }
  update(_delta: number, edge: boolean, _held: boolean, _dir: number) {
    const s = this.s;
    this.stars.forEach((star, i) => star.setScale(i === this.constellationStep ? 1 + Math.sin(s.worldTime * 0.004) * 0.12 : 1));
    const station = this.stations.find(st => Math.abs(s.player.x - st.x) < 110);
    if (Math.abs(s.player.x - (worlds[s.world].width - 150)) < 110) {
      if (edge) {
        if (s.world < 2) s.go(s.world + 1);
        else { s.progress.finished = true; s.persist(); bridge.emit('overlay', 'final'); }
      }
      return s.world < 2 ? 'E · Continue — no tasks required' : 'E · Meet the creator';
    }
    if (station) { if (edge) station.action(); return 'E · ' + station.title; }
    return 'Walk right → · Click an activity to try it';
  }
  canExit() { return true; }
  destroy() { if (this.keyHandler) this.s.input.keyboard?.off('keydown', this.keyHandler); }
}
