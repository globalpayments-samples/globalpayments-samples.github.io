// Global Payments — Developer Portal
// Renders project cards from GP_PROJECTS (js/projects.js) with category filters.

const CATEGORY_LABELS = {
  'gp-api':   'GP-API',
  'portico':  'Portico',
  'gpecom':   'GP Ecom',
  'tools':    'Tools',
};

const BADGE_CLASS = {
  'gp-api':   'gp-badge-gpapi',
  'portico':  'gp-badge-portico',
  'gpecom':   'gp-badge-gpecom',
  'tools':    'gp-badge-tools',
};

const LANG_CLASS = {
  'PHP':     'gp-lang-php',
  'Node.js': 'gp-lang-node',
  'Java':    'gp-lang-java',
  '.NET':    'gp-lang-dotnet',
  'Python':  'gp-lang-python',
  'Go':      'gp-lang-go',
};

function renderProjects(projects) {
  const grid = document.getElementById('gp-project-grid');
  if (!grid) return;

  grid.innerHTML = projects.map(p => {
    const categoryLabel = CATEGORY_LABELS[p.category] || p.category;
    const badgeClass    = BADGE_CLASS[p.category] || '';
    const langBadges    = p.language_labels
      .map(l => `<span class="gp-lang ${LANG_CLASS[l] || ''}">${l}</span>`)
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
        <div class="gp-project-card-header">
          <span class="gp-badge ${badgeClass}">${categoryLabel}</span>
        </div>
        <h3 class="gp-project-card-title">${p.title}</h3>
        <p class="gp-project-card-desc">${p.description}</p>
        <div class="gp-project-card-langs">${langBadges}</div>
        <span class="gp-project-card-link">View on GitHub →</span>
      </a>
    `.trim();
  }).join('');
}

function initFilters() {
  const buttons = document.querySelectorAll('.gp-filter-button');
  const grid    = document.getElementById('gp-project-grid');
  if (!buttons.length || !grid) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      grid.querySelectorAll('.gp-project-card').forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('gp-hidden', !match);
      });
    });
  });
}

// Run immediately — script loads at end of </body> so DOM is ready
if (typeof GP_PROJECTS !== 'undefined') {
  renderProjects(GP_PROJECTS);
  initFilters();
}
