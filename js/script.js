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

// Plain-language descriptor of which API/gateway a sample integrates against.
// Shown on each card so developers new to Global Payments can tell otherwise
// identically-named samples apart (e.g. the three "Online Recurring Payments").
const PLATFORM_CAPTION = {
  'gp-api':             'Powered by GP-API',
  'portico':            'Powered by the Portico gateway',
  'gpecom':             'Powered by the GP Ecom gateway',
  'integrated-partner': 'Powered by the Integrated Partner API',
  'tools':              'Developer utility',
};

// Curated, merchant-oriented use-case filters. Each sample is matched into a
// group when any of its topics appears in the group's `tags` list. This keeps
// the filter bar short and meaningful instead of listing every raw topic.
const USE_CASE_GROUPS = [
  { id: 'accept-payments', label: 'Accept Payments', tags: [
    'ecommerce', 'hosted-fields', 'checkout', 'card-payments', 'payment-form',
    'payments', 'payment-processing', 'google-pay', 'wallet', 'mobile-payments',
    'pay-by-link', 'payment-links', 'remote-payments', 'drop-in-ui', 'ui-components',
    'auth-capture', 'delayed-capture', 'two-step-payment', 'payment-authorization',
    'ach-payments', 'echeck', 'bank-account', 'electronic-payments',
    'localization', 'i18n', 'multi-currency', 'dynamic-currency', 'regional-payments',
    'integration',
  ] },
  { id: 'recurring-billing', label: 'Recurring & Billing', tags: [
    'recurring-payments', 'subscription', 'subscriptions', 'billing',
    'automated-payments', 'payment-schedule', 'one-time-payments',
    'donation', 'fundraising', 'saas',
  ] },
  { id: 'save-tokenize', label: 'Save & Tokenize', tags: [
    'customer-vault', 'stored-payments', 'payment-methods', 'tokenization',
    'token-management', 'network-tokenization', 'multi-use-tokens',
    'wallet-management', 'one-click-payment',
  ] },
  { id: 'fraud-security', label: 'Fraud & Security', tags: [
    '3d-secure', '3ds2', 'authentication', 'strong-authentication',
    'fraud-prevention', 'avs', 'cvv', 'card-verification', 'pci-compliant',
    'validation',
  ] },
  { id: 'marketplace', label: 'Marketplace & Platform', tags: [
    'fee-splitting', 'embedded-payments', 'platform-payments', 'marketplace',
    'multi-merchant', 'partner-payments', 'revenue-sharing',
  ] },
  { id: 'reporting-tools', label: 'Reporting & Tools', tags: [
    'reporting', 'transaction-reporting', 'transaction-search', 'analytics',
    'dashboard', 'data-export', 'csv', 'json', 'refund',
  ] },
];

// Common starting points shown by default so new developers aren't dropped into
// all 26 samples at once. A broad, GP-API-first "start here" set.
const RECOMMENDED_REPOS = new Set([
  'online-card-payments',
  'save-and-reuse-payment-methods',
  'online-recurring-payments',
  'gpapi-3ds2',
  'google-pay-payments',
  'pay-by-link',
  'wallet-management',
  'localized-checkout-experience',
]);

const DEFAULT_FILTER = 'recommended';

// Filter/search state, applied together against the rendered cards.
let activeFilter = DEFAULT_FILTER;
let searchQuery  = '';
// The filter that was active before a search widened the view to "View All",
// so it can be restored when the search box is cleared.
let filterBeforeSearch = null;

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

// The use-case group ids a sample belongs to, plus "recommended" when curated.
function groupsForProject(project) {
  const groups = [];
  if (RECOMMENDED_REPOS.has(project.repo_name)) groups.push('recommended');
  USE_CASE_GROUPS.forEach(group => {
    if (project.tags.some(tag => group.tags.includes(tag))) groups.push(group.id);
  });
  return groups;
}

// Lowercased text a card can be matched against by the search box.
function searchHaystack(project) {
  return [
    project.title,
    project.description,
    CATEGORY_LABELS[project.category] || project.category,
    project.language_labels.join(' '),
    project.tags.join(' '),
  ].join(' ').toLowerCase();
}

function mapRepo(repo) {
  const topics       = repo.topics || [];
  const langLabels   = topics.filter(t => t in LANG_TOPIC_MAP).map(t => LANG_TOPIC_MAP[t]);
  const featureTags  = topics.filter(t => !(t in LANG_TOPIC_MAP));

  const project = {
    title:           repoNameToTitle(repo.name),
    repo_name:       repo.name,
    url:             repo.html_url,
    category:        deriveCategory(repo.name),
    description:     repo.description || '',
    language_labels: langLabels,
    tags:            featureTags,
  };

  project.groups = groupsForProject(project);
  project.search = searchHaystack(project);
  return project;
}

function renderProjects(projects) {
  const grid = document.getElementById('gp-project-grid');
  if (!grid) return;

  grid.innerHTML = projects.map(p => {
    const categoryLabel = encodeEntities(CATEGORY_LABELS[p.category] || p.category);
    const badgeClass    = encodeEntities(BADGE_CLASS[p.category] || '');
    const langBadges    = p.language_labels
      .map(l => `<span class="gp-lang ${encodeEntities(LANG_CLASS[l] || '')}">${encodeEntities(l)}</span>`)
      .join('');
    const tagBadges     = p.tags
      .map(t => `<span class="gp-tag">${encodeEntities(t)}</span>`)
      .join('');

    const dataGroups   = encodeEntities(p.groups.join(','));
    const dataSearch   = encodeEntities(p.search);
    const platformText = encodeEntities(PLATFORM_CAPTION[p.category] || '');

    return `
      <a
        class="gp-project-card"
        href="${encodeEntities(p.url)}"
        target="_blank"
        rel="noopener noreferrer"
        data-category="${encodeEntities(p.category)}"
        data-groups="${dataGroups}"
        data-search="${dataSearch}"
      >
        <div class="gp-project-card-header">
          <span class="gp-badge ${badgeClass}">${categoryLabel}</span>
        </div>
        <h3 class="gp-project-card-title">${encodeEntities(p.title)}</h3>
        ${platformText ? `<p class="gp-project-card-platform">${platformText}</p>` : ''}
        <p class="gp-project-card-desc">${encodeEntities(p.description)}</p>
        ${langBadges ? `<div class="gp-project-card-langs">${langBadges}</div>` : ''}
        ${tagBadges  ? `<div class="gp-project-card-tags">${tagBadges}</div>`  : ''}
        <span class="gp-project-card-link">View on GitHub \u2192</span>
      </a>
    `.trim();
  }).join('');
}

/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 *
 * @param value
 * @returns escaped text
 */
function encodeEntities(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Builds the filter bar: Recommended (default) first, curated use-case groups in
// the middle, and "View All" last — only including groups that actually match at
// least one sample so the bar never shows an empty filter.
function renderFilterButtons(projects) {
  const container = document.querySelector('.gp-filters');
  if (!container) return;

  const present = new Set(projects.flatMap(p => p.groups));
  const buttons = [];

  if (projects.some(p => RECOMMENDED_REPOS.has(p.repo_name))) {
    buttons.push({ id: 'recommended', label: 'Recommended' });
  }
  USE_CASE_GROUPS.forEach(group => {
    if (present.has(group.id)) buttons.push({ id: group.id, label: group.label });
  });
  buttons.push({ id: 'all', label: 'View All' });

  // Fall back to "View All" if the recommended set somehow matched nothing.
  if (!buttons.some(b => b.id === activeFilter)) activeFilter = 'all';

  container.innerHTML = '';
  buttons.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gp-filter-button' + (id === activeFilter ? ' active' : '');
    btn.dataset.filter = id;
    btn.setAttribute('aria-pressed', String(id === activeFilter));
    btn.textContent = label;
    container.appendChild(btn);
  });
}

function cardMatches(card) {
  const groups     = card.dataset.groups ? card.dataset.groups.split(',') : [];
  const inFilter   = activeFilter === 'all' || groups.includes(activeFilter);
  const haystack   = card.dataset.search || '';
  const inSearch   = !searchQuery || haystack.indexOf(searchQuery) !== -1;
  return inFilter && inSearch;
}

function applyFilters() {
  const grid = document.getElementById('gp-project-grid');
  if (!grid) return;
  grid.querySelectorAll('.gp-project-card').forEach(card => {
    card.classList.toggle('gp-hidden', !cardMatches(card));
  });
  updateCount();
}

function setActiveFilter(id) {
  activeFilter = id;
  document.querySelectorAll('.gp-filter-button').forEach(b => {
    const isActive = b.dataset.filter === id;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', String(isActive));
  });
}

function initFilters() {
  const container = document.querySelector('.gp-filters');
  const grid      = document.getElementById('gp-project-grid');
  if (!container || !grid) return;

  container.addEventListener('click', e => {
    const btn = e.target.closest('.gp-filter-button');
    if (!btn) return;
    // An explicit filter choice supersedes any filter remembered from before a
    // search, so clearing the search later won't override this selection.
    filterBeforeSearch = null;
    setActiveFilter(btn.dataset.filter);
    applyFilters();
  });

  const search = document.getElementById('gp-search-input');
  if (search) {
    search.addEventListener('input', () => {
      searchQuery = search.value.trim().toLowerCase();
      if (searchQuery) {
        // Searching spans every sample, so widen the view to "View All" the
        // moment the user starts typing — otherwise a query could hide behind
        // the Recommended filter and appear to return nothing. Remember the
        // filter we came from so it can be restored when the search is cleared.
        if (activeFilter !== 'all') {
          filterBeforeSearch = activeFilter;
          setActiveFilter('all');
        }
      } else if (filterBeforeSearch !== null) {
        // Search cleared — return to the filter that was active before searching.
        setActiveFilter(filterBeforeSearch);
        filterBeforeSearch = null;
      }
      applyFilters();
    });
  }
}

function updateCount() {
  const countEl = document.getElementById('project-count');
  if (!countEl) return;
  const all     = document.querySelectorAll('.gp-project-card');
  const visible = document.querySelectorAll('.gp-project-card:not(.gp-hidden)');

  if (!visible.length) {
    countEl.textContent = searchQuery
      ? `No samples match "${searchQuery}". Try a different search or View All.`
      : 'No samples match this filter.';
    return;
  }
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
    renderFilterButtons(projects);
    initFilters();
    applyFilters();
  } catch (err) {
    console.error('Failed to load repos:', err);
    if (grid) {
      grid.innerHTML = '<p class="gp-loading">Could not load samples. <a href="https://github.com/globalpayments-samples">Browse on GitHub \u2192</a></p>';
    }
  }
}

loadAndRender();
