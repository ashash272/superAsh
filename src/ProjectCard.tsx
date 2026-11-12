import { useState } from 'react';
import type { Project } from './data/progress';

export function ProjectShelf({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState(0);
  const project = projects[selected];
  return <>
    <nav className="game-picker" aria-label="Choose a game">
      {projects.map((game, i) => <button key={game.name} aria-pressed={i === selected}
        onClick={() => setSelected(i)}>{game.name}</button>)}
    </nav>
    <article key={project.name} className="gallery-project">
      <small>Game {selected + 1} of {projects.length}</small>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      {project.playUrl && (
        <a className="gold" href={project.playUrl} target="_blank" rel="noopener noreferrer"
          aria-label="Play the game here (opens in a new tab)">🎮 Play the game here ↗</a>
      )}
      <MediaSlider title="Videos" media={project.media.filter(item => item.type === 'video')} />
      <MediaSlider title="Photos" media={project.media.filter(item => item.type === 'image')} />
    </article>
  </>;
}

function MediaSlider({ title, media }: { title: string; media: Project['media'] }) {
  const [index, select] = useState(0);
  const item = media[index];
  if (!item) return null;
  return (
    <section aria-label={title}>
      <h4>{title}</h4>
      {item && (
        <div className="project-media">
          {item.type === 'video' ? (
            <video
              key={item.src}
              src={item.src}
              aria-label={item.alt}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img src={item.src} alt={item.alt} loading="lazy" />
          )}
          <span className="media-count" aria-live="polite">{index + 1}/{media.length}</span>
          {media.length > 1 && (
            <nav aria-label={title}>
              <button
                aria-label="Previous media"
                onClick={() => select((index + media.length - 1) % media.length)}
              >
                ←
              </button>
              <button
                aria-label="Next media"
                onClick={() => select((index + 1) % media.length)}
              >
                →
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
