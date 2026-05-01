export const REPO_API_URL =
  'https://api.github.com/orgs/globalpayments-samples/repos?per_page=100&sort=updated';

export const SKIP_REPOS = new Set([
  '.github',
  'globalpayments-samples.github.io',
  'gh-monthly',
  'starter-template',
]);

export const TOOLS_REPOS = new Set([
  'basic-refund-tool',
  'reporting-service',
  'php-payments-and-reporting',
]);

export const CATEGORY_LABELS = {
  'gp-api':             'GP-API',
  'portico':            'Portico',
  'gpecom':             'GP Ecom',
  'integrated-partner': 'Integrated Partner',
  'tools':              'Tools',
};

export const BADGE_CLASS = {
  'gp-api':             'gp-badge-gpapi',
  'portico':            'gp-badge-portico',
  'gpecom':             'gp-badge-gpecom',
  'integrated-partner': 'gp-badge-integrated-partner',
  'tools':              'gp-badge-tools',
};

export const LANG_CLASS = {
  'PHP':     'gp-lang-php',
  'Node.js': 'gp-lang-node',
  'Java':    'gp-lang-java',
  '.NET':    'gp-lang-dotnet',
  'Python':  'gp-lang-python',
  'Go':      'gp-lang-go',
};

export const LANG_TOPIC_MAP = {
  'lang-php':    'PHP',
  'lang-nodejs': 'Node.js',
  'lang-java':   'Java',
  'lang-dotnet': '.NET',
  'lang-python': 'Python',
  'lang-go':     'Go',
};

export const FILTERS = [
  { value: 'all',                label: 'All' },
  { value: 'gp-api',             label: 'GP-API' },
  { value: 'portico',            label: 'Portico' },
  { value: 'gpecom',             label: 'GP Ecomm' },
  { value: 'integrated-partner', label: 'Integrated Partner' },
  { value: 'tools',              label: 'Tools' },
];

export const FEATURES = [
  {
    icon:        '📦',
    title:       'Multi-Language Backends',
    description: 'PHP, Node.js, .NET, and Java implementations sharing a single frontend.',
  },
  {
    icon:        '🐳',
    title:       'Docker Support',
    description: 'docker-compose.yml with per-language services for instant local setup.',
  },
  {
    icon:        '☁',
    title:       'Cloud Previews',
    description: 'CodeSandbox and DevContainer configs for one-click cloud development.',
  },
  {
    icon:        '🔒',
    title:       'Sandbox-Ready',
    description: 'Pre-configured for Global Payments sandbox environment with .env.sample files.',
  },
];

export const COMMUNITY_LINKS = [
  {
    href:  'https://github.com/orgs/globalpayments/discussions',
    label: 'GitHub Discussions',
    desc:  'Ask questions and share ideas',
  },
  {
    href:  'https://discord.gg/myER9G9qkc',
    label: 'Discord',
    desc:  'Chat with the team in real-time',
  },
  {
    href:  'https://developer.globalpay.com/blog/overview',
    label: 'Developer Blog',
    desc:  'Tutorials, guides, and announcements',
  },
  {
    href:  'https://www.linkedin.com/showcase/global-payments-for-developers/',
    label: 'LinkedIn',
    desc:  'Follow for updates and events',
  },
  {
    href:  'https://youtube.com/playlist?list=PLYOhsY1Babga_03fc9FcGIWqagCHEyxY0&si=H4YgJYez6VMxLE68',
    label: 'YouTube',
    desc:  'Video tutorials and walkthroughs',
  },
];

const WORD_MAP = {
  gp: 'GP', api: 'API', gpapi: 'GP-API', gpecom: 'GP Ecom',
  portico: 'Portico', '3ds2': '3DS2', ach: 'ACH', php: 'PHP', ui: 'UI',
  and: '&',
};

export function deriveCategory(name) {
  if (TOOLS_REPOS.has(name))                 return 'tools';
  if (name.startsWith('integrated-partner-')) return 'integrated-partner';
  if (name.startsWith('portico-'))            return 'portico';
  if (name.startsWith('gpecom-'))             return 'gpecom';
  return 'gp-api';
}

export function repoNameToTitle(name) {
  return name
    .replace(/^(portico|gpecom|integrated-partner)-/, '')
    .split('-')
    .map(w => WORD_MAP[w.toLowerCase()] || (w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

export function mapRepo(repo) {
  const topics      = repo.topics || [];
  const langLabels  = topics.filter(t => t in LANG_TOPIC_MAP).map(t => LANG_TOPIC_MAP[t]);
  const featureTags = topics.filter(t => !(t in LANG_TOPIC_MAP));

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
