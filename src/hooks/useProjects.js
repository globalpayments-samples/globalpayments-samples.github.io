'use client';

import { useState, useEffect } from 'react';
import { REPO_API_URL, SKIP_REPOS, mapRepo } from '../data/projects';

export function useProjects() {
  const [projects,     setProjects]     = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res    = await fetch(REPO_API_URL);
        const repos  = await res.json();
        const mapped = repos
          .filter(r => !SKIP_REPOS.has(r.name) && !r.is_template && r.description)
          .map(mapRepo);
        setProjects(mapped);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredProjects = activeFilter === 'all'
    ? projects
    : projects.filter(p => p.category === activeFilter);

  return { projects, filteredProjects, activeFilter, setActiveFilter, isLoading, error };
}
