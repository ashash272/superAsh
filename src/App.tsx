import { renderScale } from './game/display';
import { TalkingAsh } from './TalkingAsh';
import { ActionIcon } from './ActionIcon';
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
  'menu' | 'help' | 'pause' | 'reveal' | 'showcase' | 'gallery' | 'map' | 'final' | null;
export default function App() {
  const host = useRef<HTMLDivElement>(null),
    game = useRef<Phaser.Game | null>(null);
  const [miniActive, setMiniActive] = useState(false);
  const [hobbyName, setHobbyName] = useState('');
  const [hobbyStatus, setHobbyStatus] = useState('');
  const [nearbyAction, setNearbyAction] = useState('Star');
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
      'hobby-active': setMiniActive,
      'hobby-name': setHobbyName,
      'hobby-status': setHobbyStatus,
      'action-context': setNearbyAction,
      progress: setProgress,
      health: setHealth,
      location: setLocation,
      world: (value: number) => {
        setWorld(value);
        setToast('');
      },
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
        mode: Phaser.Scale.FIT,
        width: Math.round(host.current!.clientWidth * renderScale),
        height: Math.round(host.current!.clientHeight * renderScale),
      },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1050 }, debug: false } },
      scene: [Gateway],
      input: { activePointers: 4 },
    });
    if (import.meta.env.DEV)
      (window as unknown as { __ashify: Phaser.Game }).__ashify = game.current;
    const resize = new ResizeObserver(() => {
      if (game.current?.isBooted && host.current)
        game.current.scale.setGameSize(
          Math.round(host.current.clientWidth * renderScale),
          Math.round(host.current.clientHeight * renderScale),
        );
    });
    resize.observe(host.current!);
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
      resize.disconnect();
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
          <button
            className="work-shortcut"
            onClick={() => {
              setStarted(true);
              setOverlay(null);
              bridge.emit('travel', 1);
            }}
          >
            View my work ↗
          </button>
          <button onClick={() => setOverlay('map')} aria-label="World map">
            ⌖
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
        {started && world === 0 && !overlay && (
          <div className="hobby-navigation" aria-label="Hobby spaces">
            {['Tennis', 'Padel', 'Yoga', 'Archery'].map((name, i) => (
              <button
                key={name}
                aria-pressed={miniActive && hobbyName === name}
                onClick={() => bridge.emit('choose-hobby', i)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {miniActive && !overlay && (
          <div className="activity-guide">
            <div>
              <strong>{hobbyName}</strong>
              <p>{objective}</p>
            </div>
            <button aria-label="Leave activity" onClick={() => bridge.emit('leave-hobby')}>
              Exit ×
            </button>
          </div>
        )}
        {miniActive && !overlay && (
          <div className="hobby-status" role="status">
            {hobbyStatus}
          </div>
        )}
        {started && !miniActive && !overlay && (
          <div className="hud">
            <div>
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
              className={`panel ${overlay === 'showcase' ? 'showcase show-' + showId : ''} ${overlay === 'final' ? 'final-panel' : ''} ${overlay === 'pause' ? 'pause-panel' : ''}`}
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
                    Meet Ash through a few optional hobbies, share her love of astronomy, and
                    explore her creative work. Both areas are open from the start.
                  </p>
                  <div className="controls-list">
                    <span>
                      <kbd>A</kbd> <kbd>D</kbd> / ← →
                    </span>
                    <b>Walk</b>
                    <span>
                      <kbd>E</kbd> / tap a station
                    </span>
                    <b>Try an activity or open a portal</b>
                    <span>View my work</span>
                    <b>Go straight to the portfolio</b>
                  </div>
                  <p className="muted">
                    Short, easy hobby games with no lives to lose. Follow each game’s instructions,
                    or close it anytime. Touch controls are at the bottom.
                  </p>
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
                    <button onClick={() => setOverlay('gallery')}>Project gallery</button>
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
                  <div className="pause-settings">
                    <div className="display-setting">
                      <span>Display</span>
                      <button onClick={() => setPortrait(!portrait)}>
                        {portrait ? 'Landscape mode' : 'Portrait 9:16 mode'}
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
                  </div>
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
                  <TalkingAsh />
                  <p className="gold">I TURN IDEAS INTO PLAYABLE WORLDS.</p>
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
                    ) : null}
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
                title={key === 'interact' ? `${miniActive ? hobbyName : nearbyAction} · Action (E)` : undefined}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  touch[key] = true;
                  if (key === 'jump') bridge.emit('jump');
                  if (key === 'interact') bridge.emit('interact');
                }}
                onPointerUp={() => (touch[key] = false)}
                onPointerCancel={() => (touch[key] = false)}
                onLostPointerCapture={() => (touch[key] = false)}
              >
                {i === 3 ? <ActionIcon action={miniActive ? hobbyName : nearbyAction} /> : ['←', '→', '↑'][i]}
              </button>
            ))}
          </div>
        )}
        {!overlay && (
          <div className="bottom-note">
            {!started
              ? '✦  PRESS START TO KNOW ASH'
              : 'A / D  WALK     E  INTERACT     OR CLICK A STATION'}
            <span>TWO AREAS · ONE CREATIVE MIND</span>
          </div>
        )}
      </section>
      <footer>
        <span>IDEAS MADE PLAYABLE</span>
        <button onClick={() => setOverlay('map')}>Explore the universe ↗</button>
        <span>ASHIFY — ENTER MY UNIVERSE</span>
      </footer>
    </main>
  );
}
