export type Project = {
  playUrl?: string;
  experiments?: { name: string; media: Project['media'] }[];
  name: string;
  description: string;
  technologies: string[];
  media: { type: 'image' | 'video'; src: string; alt: string }[];
};
const descriptions = import.meta.glob<string>('../../projects/**/{description,Description}.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const assets = import.meta.glob<string>('../../projects/**/*.{jpeg,jpg,png,webp,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function project(folder: string, name: string): Project {
  const root = '../../projects/' + folder + '/';
  const media: Project['media'] = [];
  const groups = new Map<string, Project['media']>();
  for (const [path, src] of Object.entries(assets).sort(([a], [b]) =>
    a.localeCompare(b, 'en', { numeric: true }),
  )) {
    if (!path.startsWith(root)) continue;
    const [first, child] = path.slice(root.length).split('/');
    if (child && !groups.has(first)) groups.set(first, []);
    const list = child ? groups.get(first)! : media;
    list.push({
      src,
      type: /\.(mp4|webm)$/i.test(path) ? 'video' : 'image',
      alt: [name, child && first, child || first].filter(Boolean).join(' · '),
    });
  }
  return {
    name,
    media,
    technologies: [],
    description: (
      descriptions[root + 'description.txt'] ||
      descriptions[root + 'Description.txt'] ||
      ''
    ).trim(),
    experiments: Array.from(groups, ([group, media]) => ({
      name: group[0].toUpperCase() + group.slice(1),
      media,
    })),
  };
}
const portfolio: Record<string, Project[]> = {
  '2d': [
    project('2DGames/Game one', 'Le Germania'),
    { ...project('2DGames/Game two', 'Oscar Game'), playUrl: 'https://dsoatmepc.dsoatme.com/' },
    project('2DGames/Game three', 'Collect Game'),
    project('2DGames/Game four', 'Meza Memory Game'),
    project('2DGames/Gmae five', 'Haier XO'),
  ],
  vr: [
    project('Virtual Reality/ChemistryLabSimulation', 'Chemistry Lab Simulation'),
    project('Virtual Reality/fire extinguisherSimulation', 'Fire Extinguisher Simulation'),
  ],
  ar: [project('Augmented Reality', 'AR Slingshot')],
};
const categoryFolders: Record<string, string> = {
  '2DGames': '2d',
  '3DGames': '3d',
  'Virtual Reality': 'vr',
  'Interactive Solutions': 'interactive',
  'Kinect-sensor': 'motion',
};
const titles: Record<string, string> = {
  'Collect food': 'Collect Food',
  'Cross word': 'Crossword',
  'Karat Memory game': 'Karat Memory Game',
  Memorygame: 'Vitamin C Memory Game',
  telofill: 'Telofill',
  falcon: 'Falcon',
  'Inertactive Floor': 'Interactive Floor',
  'Ice skating Kinect': 'Ice Skating Kinect',
  'Leap motion': 'Leap Motion',
  'Vr goal keeper': 'VR Goalkeeper',
};
const existingFolders = new Set([
  '2DGames/Game one', '2DGames/Game two', '2DGames/Game three', '2DGames/Game four',
  '2DGames/Gmae five', 'Virtual Reality/ChemistryLabSimulation',
  'Virtual Reality/fire extinguisherSimulation',
]);
for (const path of Object.keys(assets)) {
  const [categoryFolder, folder] = path.slice('../../projects/'.length).split('/');
  const category = categoryFolders[categoryFolder];
  const key = categoryFolder + '/' + folder;
  if (!category || existingFolders.has(key)) continue;
  (portfolio[category] ??= []).push(project(key, titles[folder] ?? folder));
  existingFolders.add(key);
}
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
  projects: portfolio[id] ?? [],
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
