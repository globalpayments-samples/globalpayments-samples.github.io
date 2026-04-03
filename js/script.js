// Global Payments — Developer Portal
// Renders project cards from GP_PROJECTS (js/projects.js) with category filters.

const CATEGORY_LABELS = {
  'gp-api':   'GP-API',
  'portico':  'Portico',
  'gpecom':   'GP Ecom',
  'tools':    'Tools',
};

function renderProjects(projects) {
  const grid = document.getElementById('gp-project-grid');
  if (!grid) return;

  grid.innerHTML = projects.map(p => {
    const categoryLabel = CATEGORY_LABELS[p.category] || p.category;
    const langBadges = p.language_labels
      .map(l => `<span class="gp-lang-badge">${l}</span>`)
      .join('');

    return `
      <a
        class="gp-project-card"
        href="${p.url}"
        target="_blank"
        rel="noopener noreferrer"
        data-category="${p.category}"
        data-languages="${p.languages.join(',')}"
      >
        <div class="gp-project-card-top">
          <span class="gp-category-badge gp-category-badge--${p.category}">${categoryLabel}</span>
        </div>
        <div class="gp-project-card-body">
          <h3 class="gp-card-title">${p.title}</h3>
          <p class="gp-card-description">${p.description}</p>
        </div>
        <div class="gp-lang-badges">${langBadges}</div>
        <span class="gp-project-card-link">View on GitHub →</span>
      </a>
    `.trim();
  }).join('');
}

function initFilters() {
  const buttons = document.querySelectorAll('.gp-filter-button');
  const grid = document.getElementById('gp-project-grid');
  if (!buttons.length || !grid) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active state
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show / hide cards
      grid.querySelectorAll('.gp-project-card').forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('gp-hidden', !match);
      });
    });
  });
}

// Run immediately since script loads at end of </body> (DOM is ready)
if (typeof GP_PROJECTS !== 'undefined') {
  renderProjects(GP_PROJECTS);
  initFilters();
}
