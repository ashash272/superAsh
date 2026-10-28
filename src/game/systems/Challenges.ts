import Phaser from 'phaser';
import { viewWidth } from '../display';
import { HobbyGame } from './HobbyGame';
import { hobbies, hobbyCenter, buildHobbySpace } from './HobbySpaces';
import type { Gateway } from '../Gateway';
import { bridge, audio } from '../bridge';
import { categories, worlds } from '../../data/progress';

/** Three open rooms. Interactions introduce Ash; none gate the portfolio. */
export class Challenges {
  lockMovement = false;
  mini?: HobbyGame;
  stations: { x: number; title: string; action: () => void }[] = [];
  constellationStep = 0;
  stars: Phaser.GameObjects.Star[] = [];
  keyHandler?: (event: KeyboardEvent) => void;
  constructor(public s: Gateway) {}
  station(x: number, title: string, action: () => void) {
    this.stations.push({ x, title, action });
    const button = this.s
      .label(x, 510, title + '\nClick / tap · or E nearby', 17, '#ffffff')
      .setBackgroundColor('#14243eee')
      .setPadding(16, 12)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      if (this.s.started && !this.s.held) action();
    });
  }
  create() {
    const s = this.s;
    if (s.world === 0) this.hobbies();
    if (s.world === 1) this.portfolio();
    const next = s.world === 1 ? 'MEET ASH' : worlds[s.world + 1].name;
    s.portal(worlds[s.world].width - 150, 565, next);
  }
  hobbies() {
    const s = this.s;
    bridge.emit('objective', 'I love astronomy. Pick a hobby to play.');
    hobbies.forEach((name, i) => {
      const cx = hobbyCenter(i);
      buildHobbySpace(s, name, cx, i);
      const action = () => this.startHobby(i);
      this.stations.push({ x: cx - 275, title: 'Play ' + name, action });
      s.label(cx - 275, 690, 'E · PLAY ' + name.toUpperCase(), 16, '#fff2d4')
        .setBackgroundColor('#172e3be8')
        .setPadding(12, 8)
        .setData('hobby-prompt', true)
        .setVisible(viewWidth(s) > 650)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (s.started && !s.held && !this.mini) action();
        });
    });
    bridge.on('choose-hobby', this.chooseHobby);
  }
  chooseHobby = (index: number) => {
    if (this.s.world === 0 && Number.isInteger(index) && index >= 0 && index < hobbies.length)
      this.startHobby(index);
  };
  startHobby(index: number) {
    this.mini?.destroy();
    this.mini = undefined;
    this.lockMovement = true;
    this.mini = new HobbyGame(this.s, hobbies[index], hobbyCenter(index), () => {
      this.mini?.destroy();
      this.mini = undefined;
      this.lockMovement = false;
      bridge.emit('objective', 'Pick a hobby, or view my work.');
    });
  }
  portfolio() {
    const s = this.s;
    bridge.emit('objective', 'Open a portal to explore my work.');
    categories.forEach((c, i) => {
      const x = 280 + i * 340;
      s.portal(x, 570, c.title, Phaser.Display.Color.HexStringToColor(c.color).color);
      const open = () => bridge.emit('showcase', c.id);
      this.stations.push({ x, title: 'Explore ' + c.title, action: open });
      s.add
        .zone(x, 550, 155, 190)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (s.started && !s.held) open();
        });
    });
  }
  update(_delta: number, edge: boolean, _held: boolean, _dir: number) {
    const s = this.s;
    if (this.mini) {
      this.mini.update(_delta, edge, _held, _dir);
      return '';
    }
    this.stars.forEach((star, i) =>
      star.setScale(i === this.constellationStep ? 1 + Math.sin(s.worldTime * 0.004) * 0.12 : 1),
    );
    const station = this.stations.find((st) => Math.abs(s.player.x - st.x) < 110);
    if (Math.abs(s.player.x - (worlds[s.world].width - 150)) < 110) {
      if (edge) {
        if (s.world < 1) s.go(s.world + 1);
        else {
          s.progress.finished = true;
          s.persist();
          bridge.emit('overlay', 'final');
        }
      }
      return s.world < 1 ? 'E · Continue — no tasks required' : 'E · Meet the creator';
    }
    if (station) {
      if (edge) station.action();
      return 'E · ' + station.title;
    }
    return 'Walk right → · Click an activity to try it';
  }
  canExit() {
    return true;
  }
  destroy() {
    bridge.off('choose-hobby', this.chooseHobby);
    this.mini?.destroy();
    if (this.keyHandler) this.s.input.keyboard?.off('keydown', this.keyHandler);
  }
}
