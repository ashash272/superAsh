import { useState } from 'react';
import type { Project } from './data/progress';

export function ProjectShelf({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState(0);
  const project = projects[selected];
  return (
    <>
      <nav className="game-picker" aria-label="Choose a project">
        {projects.map((game, i) => (
          <button key={game.name} aria-pressed={i === selected} onClick={() => setSelected(i)}>
            {game.name}
          </button>
        ))}
      </nav>
      <article key={project.name} className="gallery-project">
        <small>
          Project {selected + 1} of {projects.length}
        </small>
        <h3>{project.name}</h3>
        {project.description && <p>{project.description}</p>}
        {project.playUrl && (
          <a
            className="gold"
            href={project.playUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Play the game here (opens in a new tab)"
          >
            🎮 Play the game here ↗
          </a>
        )}
        <ProjectMedia key={project.name} project={project} />
      </article>
    </>
  );
}

function ProjectMedia({ project }: { project: Project }) {
  const [section, setSection] = useState(0);
  const sections = [{ name: 'Overview', media: project.media }, ...(project.experiments ?? [])];
  const { media } = sections[section];
  return (
    <>
      {sections.length > 1 && (
        <nav className="game-picker" aria-label="Choose an experiment">
          {sections.map(({ name }, i) => (
            <button key={name} aria-pressed={i === section} onClick={() => setSection(i)}>
              {name}
            </button>
          ))}
        </nav>
      )}
      <div key={section}>
        <MediaSlider title="Videos" media={media.filter((item) => item.type === 'video')} />
        <MediaSlider title="Photos" media={media.filter((item) => item.type === 'image')} />
      </div>
    </>
  );
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
          <span className="media-count" aria-live="polite">
            {index + 1}/{media.length}
          </span>
          {media.length > 1 && (
            <nav aria-label={title}>
              <button
                aria-label="Previous media"
                onClick={() => select((index + media.length - 1) % media.length)}
              >
                ←
              </button>
              <button aria-label="Next media" onClick={() => select((index + 1) % media.length)}>
                →
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
