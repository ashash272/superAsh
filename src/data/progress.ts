export type Project = {
  name: string;
  description: string;
  technologies: string[];
  media: { type: 'image' | 'video'; src: string; alt: string }[];
};
export const categories = [
  ['2d', '2D Games', '◇', '#92e5d0'],
  ['3d', '3D Games', '▧', '#c3a1ff'],
  ['vr', 'Virtual Reality', '◎', '#84cbff'],
  ['ar', 'Augmented Reality', '⌖', '#ffc58c'],
  ['xr', 'Mixed Reality / XR', '✧', '#ff9ed4'],
  ['motion', 'Kinect / Motion Sensing', '⌁', '#b8e986'],
  ['interactive', 'Interactive Experiences', '✦', '#ffe198'],
].map(([id, title, icon, color]) => ({
  id,
  title,
  icon,
  color,
  projects: [] as Project[],
  duration: 6000,
}));
export const social = { instagram: '' };
export const worlds = [
  {
    name: 'COSMIC GATEWAY',
    subtitle: 'A little curiosity goes a long way.',
    width: 1800,
    color: 0xb896f1,
  },
  { name: 'THE ACTIVE WORLD', subtitle: 'Powered by movement.', width: 3100, color: 0x8be0cb },
  {
    name: 'ARCHER’S FOREST',
    subtitle: 'Find your focus. Trust your aim.',
    width: 3100,
    color: 0x92d4ab,
  },
  { name: 'THE OBSERVATORY', subtitle: 'Curiosity has no limits.', width: 2700, color: 0x99c9ff },
  {
    name: 'CREATOR’S DIMENSION',
    subtitle: 'Seven skills. Countless ideas.',
    width: 3700,
    color: 0xd394ff,
  },
  {
    name: 'THE IMPOSSIBLE IDEA',
    subtitle: 'Every great world starts with a challenge.',
    width: 1600,
    color: 0xff87b5,
  },
  {
    name: 'WELCOME TO MY UNIVERSE',
    subtitle: 'I turn ideas into playable worlds.',
    width: 1600,
    color: 0xffd99b,
  },
];
export type Progress = {
  stars: number[];
  archer: boolean;
  skills: string[];
  tasks: string[];
  secrets: string[];
  world: number;
  unlockedWorld: number;
  finished: boolean;
};
export const emptyProgress = (): Progress => ({
  stars: [],
  archer: false,
  skills: [],
  tasks: [],
  secrets: [],
  world: 0,
  unlockedWorld: 0,
  finished: false,
});
const strings = (a: unknown) =>
  Array.isArray(a) ? [...new Set(a.filter((x): x is string => typeof x === 'string'))] : [];
export function readProgress(): Progress {
  try {
    const p = JSON.parse(
      localStorage.getItem('ashify-v2') || localStorage.getItem('ashify-v1') || 'null',
    );
    if (!p || typeof p !== 'object') return emptyProgress();
    const unlockedWorld = Number.isInteger(p.unlockedWorld)
      ? Math.max(0, Math.min(6, p.unlockedWorld))
      : 0;
    return {
      stars: Array.isArray(p.stars)
        ? [
            ...new Set<number>(
              p.stars.filter(
                (n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < 3,
              ),
            ),
          ]
        : [],
      archer: p.archer === true,
      skills: strings(p.skills).filter((s) => categories.some((c) => c.id === s)),
      tasks: strings(p.tasks),
      secrets: strings(p.secrets),
      world: Number.isInteger(p.world) ? Math.max(0, Math.min(unlockedWorld, p.world)) : 0,
      unlockedWorld,
      finished: p.finished === true,
    };
  } catch {
    return emptyProgress();
  }
}
export function saveProgress(p: Progress) {
  try {
    localStorage.setItem('ashify-v2', JSON.stringify(p));
  } catch {
    /* Saving unavailable: keep session playable. */
  }
}
