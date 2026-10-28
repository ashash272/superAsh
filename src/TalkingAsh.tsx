import { useEffect, useState } from 'react';
import { assetUrl } from './data/assets';
const greeting = 'Hi, I’m Ash. I’m a game developer.';
const positions = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'];
export function TalkingAsh() {
  const [letters, setLetters] = useState(0),
    [frame, setFrame] = useState(0),
    [replay, setReplay] = useState(0);
  useEffect(() => {
    setLetters(0);
    setFrame(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step++;
      setLetters(Math.min(greeting.length, Math.floor(step * 0.8)));
      const talking = step < Math.ceil(greeting.length / 0.8) + 4;
      setFrame(talking ? [0, 1, 2, 1, 0, 1, 3, 1][step % 8] : 0);
      if (!talking) window.clearInterval(timer);
    }, 110);
    return () => window.clearInterval(timer);
  }, [replay]);
  return (
    <div className="meet-ash">
      <div
        className={`talking-portrait ${letters < greeting.length ? 'is-talking' : ''}`}
        role="img"
        aria-label="Ash greeting you"
        style={{
          backgroundImage: `url(${assetUrl('assets/character/ash-talking.png')})`,
          backgroundPosition: positions[frame],
        }}
      />
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
