'use client';

import { Container } from '../ui/Container';
import { ProjectCard } from '../cards/ProjectCard';
import { useProjects } from '../../hooks/useProjects';
import { FILTERS } from '../../data/projects';

export function SamplesSection() {
  const {
    projects,
    filteredProjects,
    activeFilter,
    setActiveFilter,
    isLoading,
    error,
  } = useProjects();

  return (
    <section id="samples" className="gp-section">
      <Container>
        <div className="gp-section-header">
          <h2 className="gp-section-title">Integration Samples</h2>
          <p className="gp-section-subtitle">
            Production-ready examples with multi-language backends, Docker support,
            and one-click cloud previews.
          </p>
        </div>

        <div className="gp-filters">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`gp-filter-button${activeFilter === f.value ? ' active' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="gp-project-grid">
          {isLoading && (
            <p className="gp-loading">Loading samples…</p>
          )}
          {error && !isLoading && (
            <p className="gp-loading">
              Could not load samples.{' '}
              <a href="https://github.com/globalpayments-samples">Browse on GitHub →</a>
            </p>
          )}
          {!isLoading && !error && filteredProjects.map(project => (
            <ProjectCard key={project.repo_name} project={project} />
          ))}
        </div>

        {!isLoading && !error && (
          <p className="gp-project-count">
            Showing {filteredProjects.length} of {projects.length} samples
          </p>
        )}
      </Container>
    </section>
  );
}
