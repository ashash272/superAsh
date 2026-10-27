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
    name: 'A LITTLE ABOUT ASH',
    subtitle: 'A love of movement. A mind among the stars.',
    width: 4500,
    color: 0x8ee6d2,
  },
  {
    name: 'THE PORTFOLIO',
    subtitle: 'I turn ideas into playable worlds.',
    width: 2850,
    color: 0xd394ff,
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
  unlockedWorld: 1,
  finished: false,
});
const strings = (a: unknown) =>
  Array.isArray(a) ? [...new Set(a.filter((x): x is string => typeof x === 'string'))] : [];
export function readProgress(): Progress {
  try {
    const p = JSON.parse(
      localStorage.getItem('ashify-v4') ||
        localStorage.getItem('ashify-v3') ||
        localStorage.getItem('ashify-v2') ||
        localStorage.getItem('ashify-v1') ||
        'null',
    );
    if (!p || typeof p !== 'object') return emptyProgress();
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
      world: Number.isInteger(p.world)
        ? localStorage.getItem('ashify-v4')
          ? Math.max(0, Math.min(1, p.world))
          : p.world === 2
            ? 1
            : 0
        : 0,
      unlockedWorld: 1,
      finished: p.finished === true,
    };
  } catch {
    return emptyProgress();
  }
}
export function saveProgress(p: Progress) {
  try {
    localStorage.setItem('ashify-v4', JSON.stringify(p));
  } catch {
    /* Saving unavailable: keep session playable. */
  }
}
