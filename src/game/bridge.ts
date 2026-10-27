import Phaser from 'phaser';
export const bridge = new Phaser.Events.EventEmitter();
export const touch = { left: false, right: false, jump: false, interact: false };
export function clearTouch() {
  Object.keys(touch).forEach((k) => (touch[k as keyof typeof touch] = false));
}
let context: AudioContext | undefined, master: GainNode | undefined;
let enabled = true,
  volume = 0.25;
function sync() {
  if (context && master)
    master.gain.setTargetAtTime(enabled ? volume : 0, context.currentTime, 0.03);
}
function note(f: number, duration: number, gain: number, type: OscillatorType = 'triangle') {
  if (!enabled || !context || !master) return;
  const o = context.createOscillator(),
    g = context.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.001, context.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, context.currentTime + 0.035);
  g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  o.connect(g);
  g.connect(master);
  o.start();
  o.stop(context.currentTime + duration + 0.02);
}
export const audio = {
  get enabled() {
    return enabled;
  },
  set enabled(v: boolean) {
    enabled = v;
    sync();
  },
  get volume() {
    return volume;
  },
  set volume(v: number) {
    volume = v;
    sync();
  },
  unlock() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.connect(context.destination);
      sync();
    }
    void context.resume();
  },
  play(f = 600) {
    note(f, 0.22, 0.3);
  },
  ambient(world: number) {
    const root = [146.83, 174.61, 130.81, 164.81, 196, 110, 220][world];
    [1, 1.5, 2].forEach((ratio, i) => note(root * ratio, 3.5 + i * 0.3, 0.035, 'sine'));
  },
};
