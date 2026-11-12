import { useState } from 'react';
import type { Project } from './data/progress';

export function ProjectCard({ project }: { project: Project }) {
  const [index, select] = useState(0);
  const item = project.media[index];
  return (
    <article className="gallery-project">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
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
          {project.media.length > 1 && (
            <nav aria-label={project.name + ' media'}>
              <button
                aria-label="Previous media"
                onClick={() => select((index + project.media.length - 1) % project.media.length)}
              >
                ←
              </button>
              <span aria-live="polite">
                {item.type === 'video' ? 'Video' : 'Photo'} · {index + 1} / {project.media.length}
              </span>
              <button
                aria-label="Next media"
                onClick={() => select((index + 1) % project.media.length)}
              >
                →
              </button>
            </nav>
          )}
        </div>
      )}
    </article>
  );
}
