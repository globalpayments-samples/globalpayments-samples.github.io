// Global Payments — Developer Portal
// Fetches repos live from the GitHub org REST API and renders project cards with
// category filters. Language support is driven by `lang-*` topics on each repo;
// feature tags are all other topics. No static enrichment file required.

const REPO_API_URL = 'https://api.github.com/orgs/globalpayments-samples/repos?per_page=100&sort=updated';

// Repos to exclude from the grid (meta/infra repos)
const SKIP_REPOS = new Set([
  '.github',
  'globalpayments-samples.github.io',
  'gh-monthly',
  'starter-template',
]);

// Repo names that belong to the "tools" category
const TOOLS_REPOS = new Set([
  'basic-refund-tool',
  'reporting-service',
  'php-payments-and-reporting',
]);

const CATEGORY_LABELS = {
  'gp-api':              'GP-API',
  'portico':             'Portico',
  'gpecom':              'GP Ecom',
  'integrated-partner':  'Integrated Partner',
  'tools':               'Tools',
};

const BADGE_CLASS = {
  'gp-api':             'gp-badge-gpapi',
  'portico':            'gp-badge-portico',
  'gpecom':             'gp-badge-gpecom',
  'integrated-partner': 'gp-badge-integrated-partner',
  'tools':              'gp-badge-tools',
};

const LANG_CLASS = {
  'PHP':     'gp-lang-php',
  'Node.js': 'gp-lang-node',
  'Java':    'gp-lang-java',
  '.NET':    'gp-lang-dotnet',
  'Python':  'gp-lang-python',
  'Go':      'gp-lang-go',
};

// Maps `lang-*` topics to display labels
const LANG_TOPIC_MAP = {
  'lang-php':    'PHP',
  'lang-nodejs': 'Node.js',
  'lang-java':   'Java',
  'lang-dotnet': '.NET',
  'lang-python': 'Python',
  'lang-go':     'Go',
};

function deriveCategory(name) {
  if (TOOLS_REPOS.has(name))                return 'tools';
  if (name.startsWith('integrated-partner-')) return 'integrated-partner';
  if (name.startsWith('portico-'))           return 'portico';
  if (name.startsWith('gpecom-'))            return 'gpecom';
  return 'gp-api';
}

function repoNameToTitle(name) {
  const WORD_MAP = {
    gp: 'GP', api: 'API', gpapi: 'GP-API', gpecom: 'GP Ecom',
    portico: 'Portico', '3ds2': '3DS2', ach: 'ACH', php: 'PHP', ui: 'UI',
    and: '&',
  };
  return name
    .replace(/^(portico|gpecom|integrated-partner)-/, '') // strip gateway prefix (shown in category badge)
    .split('-')
    .map(w => WORD_MAP[w.toLowerCase()] || (w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function mapRepo(repo) {
  const topics       = repo.topics || [];
  const langLabels   = topics.filter(t => t in LANG_TOPIC_MAP).map(t => LANG_TOPIC_MAP[t]);
  const featureTags  = topics.filter(t => !(t in LANG_TOPIC_MAP));

  return {
    title:           repoNameToTitle(repo.name),
    repo_name:       repo.name,
    url:             repo.html_url,
    category:        deriveCategory(repo.name),
    description:     repo.description || '',
    language_labels: langLabels,
    tags:            featureTags,
  };
}

function renderProjects(projects) {
  const grid = document.getElementById('gp-project-grid');
  if (!grid) return;

  grid.innerHTML = projects.map(p => {
    const categoryLabel = CATEGORY_LABELS[p.category] || p.category;
    const badgeClass    = BADGE_CLASS[p.category] || '';
    const langBadges    = p.language_labels
      .map(l => `<span class="gp-lang ${LANG_CLASS[l] || ''}">${l}</span>`)
      .join('');
    const tagBadges     = p.tags
      .map(t => `<span class="gp-tag">${t}</span>`)
      .join('');

    return `
      <a
        class="gp-project-card"
        href="${p.url}"
        target="_blank"
        rel="noopener noreferrer"
        data-category="${p.category}"
      >
        <div class="gp-project-card-header">
          <span class="gp-badge ${badgeClass}">${categoryLabel}</span>
        </div>
        <h3 class="gp-project-card-title">${p.title}</h3>
        <p class="gp-project-card-desc">${p.description}</p>
        ${langBadges ? `<div class="gp-project-card-langs">${langBadges}</div>` : ''}
        ${tagBadges  ? `<div class="gp-project-card-tags">${tagBadges}</div>`  : ''}
        <span class="gp-project-card-link">View on GitHub \u2192</span>
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

function updateCount() {
  const countEl = document.getElementById('project-count');
  if (!countEl) return;
  const all     = document.querySelectorAll('.gp-project-card');
  const visible = document.querySelectorAll('.gp-project-card:not(.gp-hidden)');
  countEl.textContent = `Showing ${visible.length} of ${all.length} samples`;
}

async function loadAndRender() {
  const grid = document.getElementById('gp-project-grid');
  if (grid) grid.innerHTML = '<p class="gp-loading">Loading samples\u2026</p>';

  try {
    const res    = await fetch(REPO_API_URL);
    const repos  = await res.json();

    const projects = repos
      .filter(r => !SKIP_REPOS.has(r.name) && !r.is_template && r.description)
      .map(mapRepo);

    renderProjects(projects);
    initFilters();
    updateCount();
  } catch (err) {
    console.error('Failed to load repos:', err);
    if (grid) {
      grid.innerHTML = '<p class="gp-loading">Could not load samples. <a href="https://github.com/globalpayments-samples">Browse on GitHub \u2192</a></p>';
    }
  }
}

loadAndRender();
