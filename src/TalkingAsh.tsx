import { useEffect, useState, type CSSProperties } from 'react';
import { assetUrl } from './data/assets';
const greeting = 'Hi, I’m Ash. I’m a game developer.';
export function TalkingAsh() {
  const [letters, setLetters] = useState(0),
    [winking, setWinking] = useState(false),
    [replay, setReplay] = useState(0);
  useEffect(() => {
    setLetters(0);
    setWinking(false);
    let step = 0;
    const timer = window.setInterval(() => {
      step++;
      setLetters(Math.min(greeting.length, Math.floor(step * 0.8)));
      setWinking(step % 80 >= 48 && step % 80 < 56);
    }, 110);
    return () => window.clearInterval(timer);
  }, [replay]);
  return (
    <div className="meet-ash">
      <div
        className={`talking-portrait fullbody-portrait ${letters < greeting.length ? 'is-waving' : 'is-victory'}`}
        role="img"
        aria-label="Ash greeting you"
        style={{
          backgroundImage: `url(${assetUrl('assets/character/ash-fullbody-greeting.png')})`,
        }}
      >
        <div className="talking-body" />
        <div className="greeting-hand" aria-hidden="true" />
        <div
          className={`ash-wink ${winking ? 'active' : ''}`}
          aria-hidden="true"
          style={{ backgroundImage: `url(${assetUrl('assets/character/ash-fullbody-greeting.png')})` }}
        />
        {winking && (
          <div className="wink-stars" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                style={
                  {
                    '--dx': `${32 + i * 8}px`,
                    '--dy': `${-36 + i * 10}px`,
                    '--delay': `${i * 25}ms`,
                  } as CSSProperties
                }
              >
                ✦
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="greeting" aria-label={greeting}>
        <h2 aria-label="Hi, I’m Ash.">{greeting.slice(0, Math.min(12, letters)) || '\u00a0'}</h2>
        <p aria-hidden="true">{letters > 13 ? greeting.slice(13, letters) : '\u00a0'}</p>
      </div>
      <button className="text-button replay-greeting" onClick={() => setReplay((n) => n + 1)}>
        ↻ Replay greeting
      </button>
    </div>
  );
}
