# ASHIFY — Enter my universe

A local React + TypeScript + Phaser 3 pixel-art adventure, built directly in `E:\superAsh`.

## Play locally

```powershell
cd E:\superAsh
npm install
npm run dev
```

Open the address Vite prints, normally http://127.0.0.1:5173. To preview the production build:

```powershell
npm run build
npm run preview
```

No public deployment or GitHub push has been performed. Original photos and environment references in `my-assets` remain untouched and are excluded from the public build.

## The connected adventure

1. **Cosmic Gateway:** run, jump between floating ruins, collect three introduction stars and meet Ash.
2. **Active World:** return three tennis balls, time a padel wall ricochet, find the yoga rhythm, hold a stretch, and balance with Pilates. All five unlock Active Soul.
3. **Archer’s Forest:** pick up the bow, draw and release ballistic arrows, hit three stationary and three moving targets, and solve the Moon → Leaf → Star rune gate. Unlock Sharp Eye.
4. **The Observatory:** connect five stars in sequence, align rotating planets with their gold markers, and look through the telescope. Unlock Cosmic Explorer.
5. **Creator’s Dimension:** stomp three bugs, explore seven professional skill portals, and unlock the complete skill tree. Each temporary showreel has skip/replay controls and a distinct icon/color treatment.
6. **The Impossible Idea:** avoid projectiles and telegraphed falling blocks; land three arrows while the core is vulnerable.
7. **Welcome to My Universe:** the final reveal, project gallery, replay, sharing and configurable Instagram link.

World gates enforce progression. The map allows revisiting unlocked worlds. Pause includes a current-world challenge replay option and a separately confirmed full reset. Four optional stars reward exploration and reveal personal details.

The intended first-play pacing is exploratory; a 10–15 minute duration has not yet been measured with first-time human players.

## Controls

- A/D or Left/Right: move; also adjust Pilates balance.
- Space/Up: jump. Hold for height; release early for a short hop.
- E: interact, swing, launch, or time a yoga breath.
- Hold E: flexibility challenge.
- Hold left click or touch on the game world, then release: draw and shoot the bow. Dotted trajectory previews gravity. Alternatively, W/S adjusts aim; hold F to draw and release F to fire. The equipped bow remains visible while idle and moving, and pickup is saved.
- Click/tap stars and planets: Observatory puzzles.
- Enter: start. Escape: pause.

Touchscreen controls appear at the bottom. Use the game world itself for touch aiming. Desktop browsers also show subdued touch buttons. Portrait mode in Pause uses a real 9:16 viewport without stretching the character or physics. Browser blur pauses active play.

## Approved character and art

Ash wears a natural black hijab, plain black sweatshirt, grey sweatpants and cream sneakers. There is no exposed bandana or exaggerated bun. The approved study is `public/assets/character/ash-approved.png`; the animation atlas is `ash-animations.png`.

The atlas supplies run, idle, jump/fall/landing, bow, racket, yoga, stretching, victory, surprise, damage and portal poses. Facial textures are never mirrored horizontally; the beauty mark remains on the anatomical right in the portrait. Directional left-facing artwork and more consistent hand-cleaned pixel animation would be useful future visual refinements; currently the character keeps the same three-quarter orientation while moving both ways. Some actions use held poses rather than dedicated multi-frame cycles.

World backgrounds and character art were generated for this project. Equipment, portals, terrain, bugs, the boss and particles use original procedural artwork. Sound effects and subtle world-specific ambient chords are synthesized with Web Audio. Mute and volume affect all sound; playback begins after user interaction. No third-party music is bundled.

## Source map

- `src/game/Gateway.ts`: shared scene lifecycle, movement, camera, physics, transitions, saving, character animations, audio and input.
- `src/game/systems/Challenges.ts`: playable world mechanics and progression conditions.
- `src/game/art.ts`: procedural texture generation for terrain, equipment and enemies.
- `src/game/bridge.ts`: React/Phaser events, touch state and Web Audio.
- `src/App.tsx`: menus, HUD, showcases, map, achievements, gallery and ending.
- `src/data/progress.ts`: world/category configuration, project schema, social link and validated local progress.
- `tests/game.spec.ts`: browser gameplay checks.

Progress uses `ashify-v2` in localStorage; valid introductory data from the earlier v1 preview is accepted when no v2 save exists. Unavailable storage falls back to session play. Private reference folders are ignored by Git.

## Add real project media later

No additional user-supplied media folders are required now. Every category has an empty `projects` array. Add records with:

```ts
{
  name: 'Your real project name',
  description: 'Your verified project description',
  technologies: ['Unity'],
  media: [
    { type: 'image', src: '/assets/projects/example.webp', alt: 'Actual project screenshot' },
    { type: 'video', src: '/assets/projects/example.mp4', alt: 'Actual gameplay recording' },
  ],
}
```

These paths are examples only; no fictional projects or source-media folders have been populated. Showcases and the gallery read the same category inventory without gameplay changes. Category `duration` controls playback: temporary presentations default to 6 seconds; real projects use at least 8 seconds and can be set to 10–12 seconds. Videos are only mounted when viewed; gallery videos use `preload="none"`, images lazy-load. Source-media optimization/inventory tooling will be added when real media is supplied.

Set `social.instagram` in `src/data/progress.ts` to enable the final Instagram link. Sharing uses the current page URL, which becomes publicly useful after a separately authorized deployment.

## Verification

```powershell
npm test
```

Playwright is configured for installed Windows Chrome in `playwright.config.ts`. Change `executablePath` for another machine or use Playwright's installed browser. The runner starts and stops its own local Vite server.

Tests exercise actual physics callbacks and pointer-fired arrows, sports mechanics, constellation and planet clicks, bug stomps, all seven showcase unlocks, boss hits and the final reveal, local saving, scene transitions, mobile controls, portrait layout, corrupt-save recovery, pause and replay. Most world-specific tests place the player near interactions for speed; the introduction also has a keyboard-only traversal test. This is automated desktop-browser verification with mobile viewport emulation, not physical-phone testing or a complete first-time human playthrough.

The development-only `window.__ashify` handle enables browser inspection and is removed by Vite in production. Google Fonts has local system-font fallbacks. Phaser is split into its own bundle; Vite reports a large-chunk warning for it. Production files are generated in `dist`.

## Remaining external content / polish

Real project media and the Instagram URL are intentionally unfilled. Additional animation cleanup, richer foreground props, physical-device performance testing, accessibility testing with real users and measured playthrough pacing remain sensible release-polish work. The connected gameplay, challenges, seven portals and ending are implemented; the gallery honestly remains empty until real projects are added.

## Publish to GitHub Pages

The repository is `ashash272/superAsh`. In GitHub, choose **Settings → Pages → Source → GitHub Actions**. Commit and push the prepared source and `.github/workflows/deploy-pages.yml` to `main`. The **Deploy ASHIFY to GitHub Pages** workflow builds the game and publishes only `dist`.

The public address after a successful deployment is https://ashash272.github.io/superAsh/ . Check the repository Actions tab for deployment status. No custom domain is required.

`npm run build:pages` sets Vite's base to `/superAsh/`. Public artwork and configured project media resolve against that base. Normal `npm run dev` and `npm run build` continue using `/`. To test the Pages build locally, run `npm run build:pages`, then `npm run preview:pages`, and open `/superAsh/` on the printed local address.

The workflow and path fixes are prepared locally; creating them does not itself push or publish the project.

