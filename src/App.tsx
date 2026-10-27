import { assetUrl } from './data/assets';
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Gateway } from './game/Gateway';
import { audio, bridge, touch, clearTouch } from './game/bridge';
import {
  categories,
  worlds,
  social,
  emptyProgress,
  readProgress,
  saveProgress,
  type Progress,
} from './data/progress';
type Overlay =
  | 'menu'
  | 'help'
  | 'pause'
  | 'reveal'
  | 'showcase'
  | 'skills'
  | 'design'
  | 'gallery'
  | 'map'
  | 'telescope'
  | 'final'
  | null;
export default function App() {
  const host = useRef<HTMLDivElement>(null),
    game = useRef<Phaser.Game | null>(null);
  const [ready, setReady] = useState(false),
    [started, setStarted] = useState(false),
    [overlay, setOverlay] = useState<Overlay>('menu'),
    [progress, setProgress] = useState<Progress>(readProgress),
    [toast, setToast] = useState(''),
    [health, setHealth] = useState(3),
    [location, setLocation] = useState('A LITTLE ABOUT ASH'),
    [world, setWorld] = useState(0),
    [objective, setObjective] = useState(''),
    [bowEquipped, setBowEquipped] = useState(false),
    [boss, setBoss] = useState(3),
    [muted, setMuted] = useState(false),
    [portrait, setPortrait] = useState(false),
    [showTime, setShowTime] = useState(0),
    [showKey, setShowKey] = useState(0),
    [showId, setShowId] = useState('2d'),
    [resetConfirm, setResetConfirm] = useState(false);
  const state = useRef({ started, overlay });
  state.current = { started, overlay };
  const category = categories.find((c) => c.id === showId)!;
  const showcaseDuration = category.projects.length
    ? Math.max(8000, category.duration)
    : category.duration;
  const start = () => {
    audio.unlock();
    setStarted(true);
    setOverlay(null);
    bridge.emit('start');
  };
  useEffect(() => {
    const listeners: { [key: string]: (...args: any[]) => void } = {
      ready: () => setReady(true),
      progress: setProgress,
      health: setHealth,
      location: setLocation,
      world: (value: number) => {setWorld(value); setToast('');},
      objective: setObjective,
      equipment: setBowEquipped,
      boss: setBoss,
      overlay: setOverlay,
      showcase: (id: string) => {
        setShowId(id);
        setOverlay('showcase');
      },
      toast: setToast,
      'request-start': start,
      escape: () =>
        setOverlay((v) =>
          v === null ? 'pause' : v === 'showcase' || v === 'reveal' || v === 'final' ? v : null,
        ),
    };
    Object.entries(listeners).forEach(([k, v]) => bridge.on(k, v));
    game.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      backgroundColor: '#100d29',
      pixelArt: false,
      antialias: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: host.current!.clientWidth,
        height: host.current!.clientHeight,
      },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1050 }, debug: false } },
      scene: [Gateway],
      input: { activePointers: 4 },
    });
    if (import.meta.env.DEV)
      (window as unknown as { __ashify: Phaser.Game }).__ashify = game.current;
    const blur = () => {
      clearTouch();
      if (state.current.started && state.current.overlay === null) setOverlay('pause');
    };
    window.addEventListener('blur', blur);
    const visibility = () => {
      if (document.hidden) blur();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      Object.entries(listeners).forEach(([k, v]) => bridge.off(k, v));
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      game.current?.destroy(true);
    };
  }, []);
  useEffect(() => {
    bridge.emit('pause', !!overlay);
    clearTouch();
  }, [overlay, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3800);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (overlay !== 'showcase') return;
    setShowTime(0);
    const t = setInterval(() => setShowTime((v) => Math.min(v + 100, showcaseDuration)), 100);
    return () => clearInterval(t);
  }, [overlay, showKey, showcaseDuration]);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      game.current?.scale.resize(host.current!.clientWidth, host.current!.clientHeight),
    );
    return () => cancelAnimationFrame(id);
  }, [portrait]);
  useEffect(() => {
    if (!overlay) return;
    const first = document.querySelector<HTMLButtonElement>('.panel button, .title-screen button');
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.panel button:not(:disabled), .panel a[href], .panel input, .title-screen button:not(:disabled)',
        ),
      );
      if (!list.length) return;
      const first = list[0],
        last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [overlay]);
  const finish = () => {
    bridge.emit('skill-complete', showId);
    audio.play(1000);
    setOverlay(null);
    setToast(category.title + ' explored. Choose another portal whenever you like.');
  };
  const close = () => setOverlay(started ? null : 'menu');
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({ title: 'ASHIFY — Enter my universe', url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        setToast('Game link copied.');
      }
    } catch {
      setToast('Sharing cancelled or unavailable in this browser.');
    }
  };
  const project =
    category.projects[
      Math.min(
        category.projects.length - 1,
        Math.floor((showTime / showcaseDuration) * category.projects.length),
      )
    ];
  const medium =
    project?.media[
      Math.min(
        project.media.length - 1,
        Math.floor(showTime / 2500) % Math.max(1, project.media.length),
      )
    ];
  return (
    <main className={portrait ? 'app portrait' : 'app'}>
      <header className="topbar">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setOverlay(started ? 'pause' : 'menu');
          }}
        >
          A<span>✦</span>SHIFY<span className="wordmark-dot">.</span>
        </a>
        <span className="edition">GAME DEVELOPER · INTERACTIVE PORTFOLIO</span>
        <nav>
          <button className="work-shortcut" onClick={() => {setStarted(true); setOverlay(null); bridge.emit('travel', 2);}}>View my work ↗</button>
          <button onClick={() => setOverlay('map')} aria-label="World map">
            ⌖
          </button>
          <button onClick={() => setOverlay('skills')}>
            ✧ <span>My disciplines</span> {progress.skills.length}/7
          </button>
          <button
            aria-label="Toggle sound"
            onClick={() => {
              audio.unlock();
              audio.enabled = muted;
              setMuted(!muted);
            }}
          >
            {muted ? '♫ OFF' : '♫ ON'}
          </button>
          <button aria-label="Pause game" onClick={() => setOverlay('pause')}>
            Ⅱ
          </button>
        </nav>
      </header>
      <section className="viewport" aria-label="ASHIFY platform adventure">
        <div className="game" ref={host} />
        <div className="vignette" />
        {started && (
          <div className="hud">
            <div>
              <small>{String(world + 1).padStart(2, '0')} / 03 · EXPLORE AT YOUR PACE</small>
              <strong>{location}</strong>
              <p className="objective">{objective}</p>
              {bowEquipped && (
                <p className="objective" data-testid="bow-status">
                  BOW EQUIPPED · Hold left click / touch or F, release to shoot. W / S: aim.
                </p>
              )}
            </div>

          </div>
        )}
        {overlay === 'menu' && (
          <div className="title-screen">
            <div className="eyebrow">
              <span /> AN ADVENTURE BY ASH <span />
            </div>
            <h1>
              ASHIFY<span>ENTER MY UNIVERSE</span>
            </h1>
            <p>
              A little stardust. A lot of curiosity.
              <br />
              Come meet the person behind the worlds.
            </p>
            <button className="primary" disabled={!ready} onClick={start}>
              {ready
                ? progress.tasks.length || progress.skills.length
                  ? 'CONTINUE ADVENTURE'
                  : 'START ADVENTURE'
                : 'GATHERING STARDUST…'}{' '}
              <span>↗</span>
            </button>
            <button className="text-button" onClick={() => setOverlay('help')}>
              HOW TO PLAY <span>↗</span>
            </button>
            <div className="press-start">PRESS ENTER TO KNOW ASH</div>
            <div className="chapter-label">
              <span>{String(world + 1).padStart(2, '0')}</span> {worlds[world].name} <i>───── ✦</i>
            </div>
          </div>
        )}
        {overlay && overlay !== 'menu' && (
          <div className="scrim">
            <section
              className={`panel ${overlay === 'design' ? 'design-panel' : ''} ${overlay === 'showcase' ? 'showcase show-' + showId : ''} ${overlay === 'final' ? 'final-panel' : ''}`}
              style={
                overlay === 'showcase'
                  ? ({ '--skill-color': category.color } as React.CSSProperties)
                  : undefined
              }
              role="dialog"
              aria-modal="true"
              aria-label={overlay}
            >
              {!['showcase', 'reveal', 'final'].includes(overlay) && (
                <button className="close" aria-label="Close" onClick={close}>
                  ×
                </button>
              )}
              {overlay === 'help' && (
                <>
                  <small>YOUR POCKET FIELD GUIDE</small>
                  <h2>Follow your curiosity.</h2>
                  <p>
                    Meet Ash through a few optional hobbies, visit the observatory, and explore her creative work. All three areas are open from the start.
                  </p>
                  <div className="controls-list">
                    <span><kbd>A</kbd> <kbd>D</kbd> / ← →</span><b>Walk</b>
                    <span><kbd>E</kbd> / tap a station</span><b>Try an activity or open a portal</b>
                    <span><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></span><b>Connect the observatory stars</b>
                    <span>View my work</span><b>Go straight to the portfolio</b>
                  </div>
                  <p className="muted">No obstacles, timers, or required tasks. Explore at your own pace. Touch controls are at the bottom.</p>
                  <button className="primary" onClick={started ? close : start}>
                    LET’S EXPLORE ↗
                  </button>
                </>
              )}
              {overlay === 'pause' && (
                <>
                  <small>TAKE A BREATH</small>
                  <h2>The stars can wait.</h2>
                  <button className="primary" onClick={started ? close : start}>
                    {started ? 'RESUME ADVENTURE' : 'START ADVENTURE'} ↗
                  </button>
                  <div className="menu-grid">
                    <button onClick={() => setOverlay('help')}>Controls</button>
                    <button onClick={() => setOverlay('map')}>World map</button>
                    <button onClick={() => setPortrait(!portrait)}>
                      {portrait ? 'Landscape mode' : 'Portrait 9:16 mode'}
                    </button>
                    <button onClick={() => setOverlay('gallery')}>Project gallery</button>
                    <button onClick={() => setOverlay('design')}>Character design</button>
                    <button
                      onClick={() => {
                        setStarted(true);
                        bridge.emit('replay-world');
                        setOverlay(null);
                      }}
                    >
                      Replay this area
                    </button>
                  </div>
                  <label className="volume">
                    Sound volume{' '}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      defaultValue={audio.volume}
                      onChange={(e) => (audio.volume = +e.target.value)}
                    />
                  </label>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (resetConfirm) {
                        saveProgress(emptyProgress());
                        window.location.reload();
                      } else setResetConfirm(true);
                    }}
                  >
                    {resetConfirm ? 'CONFIRM RESET — ERASE SAVED PROGRESS' : 'RESET PROGRESS'}
                  </button>
                </>
              )}
              {overlay === 'reveal' && (
                <>
                  <small>✦ CHARACTER UNLOCKED ✦</small>
                  <div className="portrait-crop">
                    <img
                      src={assetUrl('assets/character/ash-approved.png')}
                      alt="Ash in her black hijab and black sweatshirt"
                    />
                  </div>
                  <h2>Hello. I’m Ash.</h2>
                  <p className="gold">CREATIVE EXPLORER / GAME DEVELOPER</p>
                  <p>
                    Special ability?
                    <br />
                    Turning ideas into playable worlds.
                  </p>
                  <button className="primary" onClick={close}>
                    LET’S GET MOVING ↗
                  </button>
                </>
              )}
              {overlay === 'showcase' && (
                <>
                  <small>CREATOR’S DIMENSION / {category.title.toUpperCase()}</small>
                  {medium ? (
                    <div className="project-media">
                      {medium.type === 'video' ? (
                        <video
                          key={medium.src}
                          src={assetUrl(medium.src)}
                          autoPlay
                          muted
                          playsInline
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img key={medium.src} src={assetUrl(medium.src)} alt={medium.alt} />
                      )}
                    </div>
                  ) : (
                    <div className="showcase-orbit">
                      {category.icon}
                      <i />
                      <i />
                    </div>
                  )}
                  <h2>{category.title}</h2>
                  {project ? (
                    <>
                      <h3>{project.name}</h3>
                      <p>{project.description}</p>
                      <p className="gold">{project.technologies.join(' · ')}</p>
                    </>
                  ) : (
                    <>
                      <p className="gold">PROJECT SHOWCASE COMING SOON</p>
                      <p className="muted">A temporary presentation. Real projects arrive later.</p>
                    </>
                  )}

                  <div className="button-row">
                    <button onClick={() => setShowKey((k) => k + 1)}>↻ Replay</button>
                    <button className="primary" onClick={finish}>
                      {'BACK TO PORTFOLIO'} ↗
                    </button>
                  </div>
                </>
              )}
              {overlay === 'skills' && (
                <>
                  <small>YOUR CREATIVE CONSTELLATION</small>
                  <h2>
                    {progress.skills.length === 7
                      ? 'All seven disciplines explored'
                      : `Disciplines explored: ${progress.skills.length}/7`}
                  </h2>
                  <div className="skill-grid">
                    {categories.map((c) => (
                      <div key={c.id} className={progress.skills.includes(c.id) ? 'unlocked' : ''}>
                        <span style={{ color: c.color }}>{c.icon}</span>
                        <b>{c.title}</b>
                        <small>
                          {progress.skills.includes(c.id) ? 'EXPLORED' : 'OPEN IN THE PORTFOLIO'}
                        </small>
                      </div>
                    ))}
                  </div>
                  <p className="gold">
                    {progress.skills.length === 7
                      ? '7 SKILLS. COUNTLESS IDEAS. ONE GAME DEVELOPER.'
                      : 'Explore any discipline, in any order.'}
                  </p>
                </>
              )}
              {overlay === 'map' && (
                <>
                  <small>YOUR UNIVERSE, ONE PORTAL AT A TIME</small>
                  <h2>Choose a world.</h2>
                  <div className="world-map">
                    {worlds.map((w, i) => (
                      <button
                        disabled={i > progress.unlockedWorld}
                        key={w.name}
                        onClick={() => {
                          setStarted(true);
                          setOverlay(null);
                          bridge.emit('travel', i);
                        }}
                      >
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <b>{w.name}</b>
                          <small>
                            {i > progress.unlockedWorld
                              ? 'PORTAL LOCKED'
                              : i === world
                                ? 'YOU ARE HERE'
                                : w.subtitle}
                          </small>
                        </div>
                        <i>{i > progress.unlockedWorld ? '◇' : '↗'}</i>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {overlay === 'design' && (
                <>
                  <small>ASH / APPROVED CHARACTER DIRECTION</small>
                  <h2>Ready for an adventure.</h2>
                  <img
                    className="design-sheet"
                    src={assetUrl('assets/character/ash-approved.png')}
                    alt="Ash wearing a natural black hijab, black sweatshirt and grey sweatpants"
                  />
                  <p className="muted">
                    Black sweatshirt · grey sweatpants · natural black hijab · cream sneakers.
                  </p>
                </>
              )}
              {overlay === 'telescope' && (
                <>
                  <small>THROUGH THE LOOKING GLASS</small>
                  <div className="space-view">
                    <span className="planet" />
                    <i>✦</i>
                    <i>✧</i>
                    <i>✦</i>
                  </div>
                  <h2>Curiosity has no limits.</h2>
                  <p>
                    I’ve attended astronomy conferences, but the best part is still looking up and
                    wondering what else is out there.
                  </p>
                  <p className="gold">COSMIC DISCOVERY · A UNIVERSE OF POSSIBILITIES</p>
                  <button className="primary" onClick={close}>
                    BACK TO THE OBSERVATORY ↗
                  </button>
                </>
              )}
              {overlay === 'gallery' && (
                <>
                  <small>THE CREATOR’S ARCHIVE</small>
                  <h2>
                    {categories.some((c) => c.projects.length)
                      ? 'Ideas made playable.'
                      : 'New worlds are on their way.'}
                  </h2>
                  {categories.some((c) => c.projects.length) ? (
                    categories.flatMap((c) =>
                      c.projects.map((p) => (
                        <article className="gallery-project" key={c.id + p.name}>
                          <small>{c.title}</small>
                          <h3>{p.name}</h3>
                          <p>{p.description}</p>
                          {p.media.map((m) =>
                            m.type === 'image' ? (
                              <img loading="lazy" key={m.src} src={assetUrl(m.src)} alt={m.alt} />
                            ) : (
                              <video
                                key={m.src}
                                src={assetUrl(m.src)}
                                controls
                                preload="none"
                                playsInline
                              />
                            ),
                          )}
                          <p>{p.technologies.join(' · ')}</p>
                        </article>
                      )),
                    )
                  ) : (
                    <>
                      <div className="empty-orbit">✧</div>
                      <p>
                        Real project videos, screenshots, and stories will live here.
                        <br />
                        For now, the adventure is the introduction.
                      </p>
                    </>
                  )}
                  <button className="primary" onClick={close}>
                    BACK TO EXPLORING ↗
                  </button>
                </>
              )}
              {overlay === 'final' && (
                <>
                  <small>✦ CREATOR OF WORLDS ✦</small>
                  <div className="final-symbols">⌁ &nbsp; ◎ &nbsp; ✧ &nbsp; ◇</div>
                  <h2>Hi, I’m Ash.</h2>
                  <p>
                    I’m a game developer, a cosmic dreamer,
                    <br />
                    and an adventure lover.
                  </p>
                  <p className="gold">I TURN IDEAS INTO PLAYABLE WORLDS.</p>
                  <h3>Welcome to my universe.</h3>
                  <div className="brand-reveal">ASHIFY.GG</div>
                  <p className="muted">FOLLOW MY JOURNEY TO UNLOCK THE NEXT LEVEL.</p>
                  <div className="menu-grid">
                    <button
                      className="primary"
                      onClick={() => {
                        saveProgress(emptyProgress());
                        window.location.reload();
                      }}
                    >
                      REPLAY ADVENTURE
                    </button>
                    <button onClick={() => setOverlay('gallery')}>EXPLORE MY PROJECTS</button>
                    {social.instagram ? (
                      <a
                        className="social-link"
                        href={social.instagram}
                        target="_blank"
                        rel="noreferrer"
                      >
                        FOLLOW ON INSTAGRAM ↗
                      </a>
                    ) : (
                      <button disabled>INSTAGRAM · LINK COMING SOON</button>
                    )}
                    <button onClick={share}>SHARE THE GAME ↗</button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
        {toast && (
          <div className="toast" role="status" key={toast}>
            <span>✦</span>
            {toast}
          </div>
        )}
        {started && !overlay && (
          <div className="touch-controls">
            {(['left', 'right', 'jump', 'interact'] as const).map((key, i) => (
              <button
                key={key}
                aria-label={key}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  touch[key] = true;
                  if (key === 'interact') bridge.emit('interact');
                }}
                onPointerUp={() => (touch[key] = false)}
                onPointerCancel={() => (touch[key] = false)}
                onLostPointerCapture={() => (touch[key] = false)}
              >
                {['←', '→', '↑', 'E'][i]}
              </button>
            ))}
          </div>
        )}
        <div className="bottom-note">
          {!started ? '✦  PRESS START TO KNOW ASH' : 'A / D  WALK     E  INTERACT     OR CLICK A STATION'}
          <span>THREE AREAS · ONE CREATIVE MIND</span>
        </div>
      </section>
      <footer>
        <span>IDEAS MADE PLAYABLE</span>
        <button onClick={() => setOverlay('map')}>Explore the universe ↗</button>
        <span>ASHIFY — ENTER MY UNIVERSE</span>
      </footer>
    </main>
  );
}
