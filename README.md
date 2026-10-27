# ASHIFY — Enter my universe

A local React + TypeScript + Phaser 3 interactive portfolio, built directly in `E:\superAsh`.

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

## Two open areas

1. **A little about Ash:** tennis, padel, yoga and archery in one flat room. Four spacious, connected in-world areas contain a tennis court, glass-walled padel court, yoga deck and archery range. Ash performs racket wind-up/contact/follow-through frames, animated breathing and pose transitions, and bow draw/release animations. Tennis and padel require three visible returns; padel shows the wall approach and rebound. Archery uses gravity, a trajectory preview and three successive targets. The movement activities use distinct poses with short holds. No hobby opens a modal timing panel.
2. **The Portfolio:** seven immediately accessible discipline portals. No enemies, timers, required completion or boss fight. The final portal introduces Ash.

The header’s **View my work** button takes visitors directly to the portfolio. Both areas are available in the map from the beginning. Actual project arrays are still empty and explicitly marked as upcoming; add real media using the schema below.

## Controls

- A/D or Left/Right: walk along continuous, obstacle-free ground.
- E near a station, or choose a hobby in the garden navigation: play in that space.
- Tennis/padel: E or tap to swing as the approaching ball glows. A/D adjusts stance.
- Yoga: hold E or touch to breathe into the pose.
- Archery: hold E/touch to draw, release to shoot. W/S adjusts aim; touch the target to aim.
- Q or Leave activity: return to exploration immediately.
- Enter: start. Escape: pause. On-screen buttons support touch.

## Visual direction

The entire experience uses a continuous space environment. A seamless nebula panorama follows camera travel slowly, stars move at two depth speeds, and world-positioned planets pass by as Ash explores. Planets rotate, rings tilt, moons orbit and shooting stars cross the environment. The portfolio shares the same layered space rendering. Portals use luminous ellipses, animated inner rings and orbiting light particles. Text uses larger antialiased sans-serif labels. Original reference images remain untouched.

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

Progress uses `ashify-v4` in localStorage. Older saves retain valid explored disciplines and personal discoveries, and restart in the new first area. Unavailable storage falls back to session play. Private reference folders are ignored by Git.

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


Yoga uses a dedicated three-cell padded sheet (`ash-yoga.png`) and one visible pose at a time. Walking left mirrors Ash’s run, jump and idle facing. Screen-space falling leaves/stars and stronger pulsing pavilion lights animate every garden view.

Old v3 saves in the removed Observatory return to the hobby stage; old portfolio saves move to the new portfolio index. Explored disciplines and hobby progress are retained.
