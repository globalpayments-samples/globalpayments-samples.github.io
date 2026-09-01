#!/usr/bin/env node
// Inventories every repo in the globalpayments-samples org.
//
// Language support is read from the repo's top-level FOLDERS, not from its topics.
// Folders are what actually ships; topics are metadata that drifts. Both are recorded
// so build-coverage can report where they disagree.
//
//   node scripts/fetch-repos.mjs  ->  data/samples.json

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORG = 'globalpayments-samples';
const CONCURRENCY = 8;

// Folder name (lowercased) -> canonical language id.
const LANG_DIRS = new Map(
  Object.entries({
    php: 'php',
    nodejs: 'nodejs',
    node: 'nodejs',
    'node-js': 'nodejs',
    javascript: 'nodejs',
    java: 'java',
    dotnet: 'dotnet',
    net: 'dotnet',
    csharp: 'dotnet',
    'c#': 'dotnet',
    python: 'python',
    go: 'go',
    golang: 'go',
  })
);

// Repos that are tooling or infrastructure, not integration samples. They are
// excluded from coverage but still listed, so the exclusion is visible.
const NOT_A_SAMPLE = new Set([
  '.github',
  'agent-skills',
  'gp-os',
  'knowledge-base',
  'globalpayments-cli',
  'content-pipeline',
  'globalpayments-samples.github.io',
  'gp-hackathon',
  'gh-monthly',
  'starter-template',
]);

const gh = async (args) => {
  const { stdout } = await exec('gh', args, { maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(stdout);
};

// Gateway is inferred from the repo name first, then topics. Anything unmarked is
// GP-API, which is the org's default and matches the naming convention.
function gateway(name, topics) {
  if (/^portico-/.test(name) || topics.includes('portico')) return 'portico';
  if (/^gpecom-/.test(name) || topics.includes('gpecom')) return 'gpecom';
  return 'gp-api';
}

async function topLevelLanguages(repo) {
  try {
    const entries = await gh([
      'api',
      `repos/${ORG}/${repo}/contents`,
      '--jq',
      '[.[] | select(.type=="dir") | .name]',
    ]);
    const langs = new Set();
    for (const dir of entries) {
      const lang = LANG_DIRS.get(dir.toLowerCase());
      if (lang) langs.add(lang);
    }
    return { languages: [...langs].sort(), dirs: entries, ok: true };
  } catch (err) {
    // An empty repo returns 404 on /contents. That is a finding, not a crash.
    return { languages: [], dirs: [], ok: false, error: err.message.split('\n')[0] };
  }
}

async function mapWithLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const index = i++;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
}

const main = async () => {
  process.stdout.write(`Listing repos in ${ORG} ... `);
  const raw = await gh([
    'repo',
    'list',
    ORG,
    '--limit',
    '300',
    '--json',
    'name,description,url,isArchived,isPrivate,pushedAt,repositoryTopics,primaryLanguage',
  ]);
  console.log(`${raw.length} repos`);

  process.stdout.write(`Reading top-level folders (${CONCURRENCY} at a time) `);
  const repos = await mapWithLimit(raw, CONCURRENCY, async (r) => {
    const topics = (r.repositoryTopics ?? []).map((t) => t.name);
    const tree = await topLevelLanguages(r.name);
    process.stdout.write('.');

    // Languages claimed by topics, for the hygiene check.
    const topicLangs = [
      ...new Set(
        topics
          .map((t) => LANG_DIRS.get(t.replace(/^lang-/, '').toLowerCase()))
          .filter(Boolean)
      ),
    ].sort();

    return {
      name: r.name,
      description: r.description ?? '',
      url: r.url,
      archived: r.isArchived,
      private: r.isPrivate,
      pushedAt: r.pushedAt,
      primaryLanguage: r.primaryLanguage?.name ?? null,
      topics,
      gateway: gateway(r.name, topics),
      isSample: !NOT_A_SAMPLE.has(r.name) && !r.isArchived,
      languages: tree.languages,
      topicLanguages: topicLangs,
      dirs: tree.dirs,
      readable: tree.ok,
      readError: tree.error ?? null,
    };
  });
  console.log(' done');

  repos.sort((a, b) => a.name.localeCompare(b.name));

  const samples = repos.filter((r) => r.isSample);
  const out = {
    generatedAt: new Date().toISOString(),
    org: ORG,
    repoCount: repos.length,
    sampleCount: samples.length,
    excluded: repos.filter((r) => !r.isSample).map((r) => r.name),
    repos,
  };

  await mkdir(resolve(ROOT, 'data'), { recursive: true });
  await writeFile(
    resolve(ROOT, 'data/samples.json'),
    JSON.stringify(out, null, 2) + '\n'
  );

  const byGateway = samples.reduce((acc, r) => {
    acc[r.gateway] = (acc[r.gateway] ?? 0) + 1;
    return acc;
  }, {});
  const noLangs = samples.filter((r) => r.languages.length === 0);
  const noTopics = samples.filter((r) => r.topics.length === 0);
  const noDesc = samples.filter((r) => !r.description);

  console.log(`\n${repos.length} repos  ${samples.length} treated as samples`);
  console.log(`  gateways: ${JSON.stringify(byGateway)}`);
  console.log(`  no language folders: ${noLangs.length}${noLangs.length ? ' -> ' + noLangs.map((r) => r.name).join(', ') : ''}`);
  console.log(`  no topics:           ${noTopics.length}`);
  console.log(`  no description:      ${noDesc.length}`);
  console.log('\n-> data/samples.json');
};

main().catch((err) => {
  console.error(`\nfetch-repos failed: ${err.message}`);
  process.exit(1);
});
