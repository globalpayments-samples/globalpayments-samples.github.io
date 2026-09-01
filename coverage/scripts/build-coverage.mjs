#!/usr/bin/env node
// Joins the product tree and the sample inventory into the single file the UI reads.
//
//   node scripts/build-coverage.mjs  ->  data/coverage.json
//
// Design rule: nothing is silently dropped. Every repo that does not map to a product,
// and every product with no sample, ends up in the output where a human can see it.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async (p) => JSON.parse(await readFile(resolve(ROOT, p), 'utf8'));

const DAY = 24 * 60 * 60 * 1000;

const main = async () => {
  const [products, samples, config] = await Promise.all([
    read('data/products.json'),
    read('data/samples.json'),
    read('config/mapping.json'),
  ]);

  const LANGS = config.languageColumns;
  const SCOREABLE_SECTIONS = new Set(config.scoreableSections);
  const staleMs = config.staleAfterDays * DAY;
  const now = Date.now();

  const nodesById = new Map(products.nodes.map((n) => [n.id, n]));
  const repos = samples.repos.filter((r) => r.isSample);
  const reposByName = new Map(repos.map((r) => [r.name, r]));

  // --- validate the mapping before trusting it -----------------------------
  const problems = [];
  for (const [repo, nodeIds] of Object.entries(config.repos)) {
    if (!reposByName.has(repo)) {
      problems.push(`mapping references unknown repo "${repo}"`);
    }
    for (const id of nodeIds) {
      if (!nodesById.has(id)) {
        problems.push(`mapping for "${repo}" references unknown product node "${id}"`);
      }
    }
  }
  if (problems.length) {
    throw new Error(
      'config/mapping.json is out of sync with the data:\n  - ' + problems.join('\n  - ')
    );
  }

  // --- attach samples to product nodes -------------------------------------
  const excluded = (id) =>
    (config.excludeNodes ?? []).some((p) => id === p || id.startsWith(p + '/'));

  const coverage = new Map();
  for (const node of products.nodes) {
    coverage.set(node.id, {
      ...node,
      excluded: excluded(node.id),
      inScope:
        node.scoreable && SCOREABLE_SECTIONS.has(node.section) && !excluded(node.id),
      samples: [],
    });
  }

  const undocumented = [];
  for (const repo of repos) {
    const targets = config.repos[repo.name];
    if (!targets || targets.length === 0) {
      undocumented.push({
        name: repo.name,
        url: repo.url,
        gateway: repo.gateway,
        languages: repo.languages,
        reason:
          config.knownUndocumented?.[repo.name] ??
          'No product mapping yet — needs triage',
        acknowledged: Boolean(config.knownUndocumented?.[repo.name]),
      });
      continue;
    }
    const stale = now - new Date(repo.pushedAt).getTime() > staleMs;
    for (const id of targets) {
      coverage.get(id).samples.push({
        name: repo.name,
        url: repo.url,
        gateway: repo.gateway,
        languages: repo.languages,
        extraLanguages: repo.languages.filter((l) => !LANGS.includes(l)),
        pushedAt: repo.pushedAt,
        stale,
      });
    }
  }

  // --- compute a cell state per product x language --------------------------
  for (const node of coverage.values()) {
    node.cells = {};
    node.gateways = [...new Set(node.samples.map((s) => s.gateway))].sort();
    node.sampleCount = node.samples.length;

    for (const lang of LANGS) {
      const hits = node.samples.filter((s) => s.languages.includes(lang));
      let state;
      if (!node.inScope) state = 'out-of-scope';
      else if (hits.length === 0) state = node.samples.length ? 'partial' : 'missing';
      else if (hits.every((s) => s.stale)) state = 'stale';
      else state = 'covered';

      node.cells[lang] = {
        state,
        repos: hits.map((s) => s.name),
        gateways: [...new Set(hits.map((s) => s.gateway))].sort(),
      };
    }

    // A product is "covered" when at least one of the four majors is covered.
    node.covered =
      node.inScope && LANGS.some((l) => ['covered', 'stale'].includes(node.cells[l].state));
    node.languageDepth = node.inScope
      ? LANGS.filter((l) => ['covered', 'stale'].includes(node.cells[l].state)).length
      : 0;

    // Which gateways this product is genuinely runnable on. node.gateways lists every
    // gateway that has a mapped repo; this lists only the ones that produced a
    // covered cell, which is what the gateway filter must key off.
    node.coveredGateways = [
      ...new Set(LANGS.flatMap((l) => node.cells[l].gateways)),
    ].sort();
  }

  // --- disambiguating labels -------------------------------------------------
  // "Czechia" and "Slovakia" mean nothing on their own, and six labels ("Batches",
  // "Payers", "Installments"...) appear twice in the tree. Qualify a label with its
  // parent when it is either deep or duplicated, so no row is ambiguous out of
  // context. Everything else keeps its bare label; qualifying all of them would
  // add noise to the 32 rows that are already unambiguous.
  const titleCase = (seg) =>
    seg.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const labelCounts = new Map();
  for (const node of coverage.values()) {
    if (!node.scoreable) continue;
    labelCounts.set(node.label, (labelCounts.get(node.label) ?? 0) + 1);
  }

  const parentLabel = (node) => {
    if (!node.parent) return null;
    const known = coverage.get(node.parent);
    if (known) return known.label;
    // The parent is a path segment the portal never gave its own page.
    return titleCase(node.parent.split('/').pop());
  };

  for (const node of coverage.values()) {
    const ambiguous = node.depth >= 4 || (labelCounts.get(node.label) ?? 0) > 1;
    const parent = ambiguous ? parentLabel(node) : null;
    node.displayLabel = parent ? `${parent} — ${node.label}` : node.label;
  }

  const all = [...coverage.values()];
  const inScope = all.filter((n) => n.inScope);
  const covered = inScope.filter((n) => n.covered);

  // --- gap ranking ----------------------------------------------------------
  // Weight by how much documentation exists (proxy for how much people read about
  // it) and how many of the four languages are missing. Fully-missing products
  // outrank thin ones.
  const gaps = inScope
    .filter((n) => n.languageDepth < LANGS.length)
    .map((n) => ({
      id: n.id,
      label: n.label,
      displayLabel: n.displayLabel,
      section: n.section,
      docCount: n.docCount,
      languageDepth: n.languageDepth,
      missingLanguages: LANGS.filter(
        (l) => !['covered', 'stale'].includes(n.cells[l].state)
      ),
      sampleCount: n.sampleCount,
      score: n.docCount * (LANGS.length - n.languageDepth) + (n.covered ? 0 : 4),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  // The score is coarse on purpose — it only knows how much documentation points at
  // a product and how many languages are missing. In practice that produces a
  // handful of large ties, not a 1..N ranking. Emitting the tier makes the ties
  // visible instead of hiding them behind ordinal numbers the data cannot support.
  const distinctScores = [...new Set(gaps.map((g) => g.score))].sort((a, b) => b - a);
  const tierSizes = new Map(
    distinctScores.map((sc) => [sc, gaps.filter((g) => g.score === sc).length])
  );
  for (const g of gaps) {
    g.tier = distinctScores.indexOf(g.score) + 1;
    g.tieCount = tierSizes.get(g.score);
    g.reason =
      g.sampleCount === 0
        ? `No sample in any language, and ${g.docCount} documented page${g.docCount === 1 ? '' : 's'} point${g.docCount === 1 ? 's' : ''} at it.`
        : `${g.sampleCount} sample${g.sampleCount === 1 ? '' : 's'}, but only ${g.languageDepth} of ${LANGS.length} languages.`;
  }

  const uniform = (members, key) =>
    members.every((m) => m[key] === members[0][key]) ? members[0][key] : null;

  const gapTiers = distinctScores.map((sc, i) => {
    const members = gaps.filter((g) => g.score === sc);
    const noSample = members.every((g) => g.sampleCount === 0);
    const docs = uniform(members, 'docCount');
    const depth = uniform(members, 'languageDepth');

    // State the tier's shared facts, then say plainly what the score cannot decide.
    // The alternative is an ordinal list whose order the data does not support.
    const facts = [];
    if (noSample) facts.push('no sample in any language');
    else if (depth !== null) facts.push(`${depth} of ${LANGS.length} languages covered`);
    if (docs !== null) facts.push(`${docs} documented page${docs === 1 ? '' : 's'}`);

    const headline = facts.length
      ? facts.join(', ').replace(/^./, (c) => c.toUpperCase())
      : 'Mixed';

    return {
      tier: i + 1,
      score: sc,
      count: members.length,
      headline,
      note:
        members.length > 1
          ? `These ${members.length} are tied. The score only knows documentation weight and missing languages, and on those they are identical — so pick within this group by business priority, not by the order shown.`
          : 'The only product at this weight.',
      items: members.map((g) => g.id),
    };
  });

  // --- metadata hygiene -----------------------------------------------------
  const hygiene = repos
    .map((r) => {
      const issues = [];
      if (!r.description) issues.push('no description');
      if (r.topics.length === 0) issues.push('no topics');
      if (r.languages.length === 0) issues.push('no language folders found');
      const claimedNotBuilt = r.topicLanguages.filter((l) => !r.languages.includes(l));
      const builtNotClaimed = r.languages.filter((l) => !r.topicLanguages.includes(l));
      if (r.topicLanguages.length && claimedNotBuilt.length)
        issues.push(`topics claim ${claimedNotBuilt.join(', ')} with no folder`);
      if (r.topicLanguages.length && builtNotClaimed.length)
        issues.push(`folders for ${builtNotClaimed.join(', ')} not in topics`);
      return { name: r.name, url: r.url, issues };
    })
    .filter((r) => r.issues.length)
    .sort((a, b) => b.issues.length - a.issues.length || a.name.localeCompare(b.name));

  // --- language totals ------------------------------------------------------
  const byLanguage = Object.fromEntries(
    LANGS.map((l) => [
      l,
      inScope.filter((n) => ['covered', 'stale'].includes(n.cells[l].state)).length,
    ])
  );

  const byGateway = repos.reduce((acc, r) => {
    acc[r.gateway] = (acc[r.gateway] ?? 0) + 1;
    return acc;
  }, {});

  // --- per-gateway product coverage ----------------------------------------
  // byGateway counts repositories. That is not the same question as "how many
  // products can you actually run on this gateway", which is what the filter is
  // for. A product counts for a gateway when one of the four majors is covered by
  // a sample on that gateway.
  const coveredOnGateway = (n, g) =>
    LANGS.some((l) => n.cells[l].gateways.includes(g));

  const bandFor = (pct) =>
    (config.coverageBands ?? []).find((b) => pct <= b.upTo) ??
    { id: 'unknown', label: 'Ungraded' };

  const byGatewayDetail = Object.fromEntries(
    Object.keys(byGateway).sort().map((g) => {
      const hit = inScope.filter((n) => coveredOnGateway(n, g));
      const pct = Math.round((hit.length / inScope.length) * 100);
      return [
        g,
        {
          repos: byGateway[g],
          productsCovered: hit.length,
          productsInScope: inScope.length,
          coveragePercent: pct,
          band: bandFor(pct),
          coveredIds: hit.map((n) => n.id),
        },
      ];
    })
  );

  // --- section scores -------------------------------------------------------
  // The section is the unit a manager budgets in, so every section carries its own
  // score. Ordered worst-first: the point of the page is the hole, not the fill.
  const sectionScores = products.sections
    .filter((sec) => SCOREABLE_SECTIONS.has(sec.name))
    .map((sec) => {
      const rows = inScope.filter((n) => n.section === sec.name);
      const hit = rows.filter((n) => n.covered);
      const pct = rows.length ? Math.round((hit.length / rows.length) * 100) : 0;
      return {
        name: sec.name,
        inScope: true,
        productsInScope: rows.length,
        productsCovered: hit.length,
        coveragePercent: pct,
        band: bandFor(pct),
        // The same score restricted to one gateway, so the section band stays true
        // when the gateway filter is on rather than silently reporting the total.
        byGateway: Object.fromEntries(
          Object.keys(byGateway).sort().map((g) => {
            const gh = rows.filter((n) => coveredOnGateway(n, g));
            const gpct = rows.length ? Math.round((gh.length / rows.length) * 100) : 0;
            return [g, { productsCovered: gh.length, coveragePercent: gpct, band: bandFor(gpct) }];
          })
        ),
      };
    })
    .sort((a, b) => a.coveragePercent - b.coveragePercent || a.name.localeCompare(b.name));

  const referenceSections = products.sections
    .filter((sec) => !SCOREABLE_SECTIONS.has(sec.name))
    .map((sec) => ({
      name: sec.name,
      inScope: false,
      productsInScope: 0,
      productsCovered: 0,
      coveragePercent: null,
    }));

  // --- which cell states actually occur -------------------------------------
  // The stylesheet defines five states. Rendering a legend for states the data
  // never produces makes the reader learn a vocabulary they will never use.
  const statesIn = [...new Set(inScope.flatMap((n) => LANGS.map((l) => n.cells[l].state)))];
  const statesRef = [...new Set(
    all.filter((n) => n.scoreable && !n.inScope).flatMap((n) => LANGS.map((l) => n.cells[l].state))
  )];
  const stateOrder = ['covered', 'stale', 'partial', 'missing', 'out-of-scope'];
  const orderStates = (list) => stateOrder.filter((st) => list.includes(st));

  const coveragePercent = Math.round((covered.length / inScope.length) * 100);
  const band = bandFor(coveragePercent);

  const target = typeof config.coverageTarget === 'number' ? config.coverageTarget : null;

  const out = {
    generatedAt: new Date().toISOString(),
    sources: { products: products.source, samples: `github.com/${samples.org}` },
    languages: LANGS,
    scoreableSections: config.scoreableSections,
    summary: {
      sampleRepos: repos.length,
      productsInScope: inScope.length,
      productsCovered: covered.length,
      productsMissing: inScope.length - covered.length,
      coveragePercent,
      band,
      target,
      targetShortfall: target === null ? null : Math.max(0, target - covered.length),
      languageCellsPossible: inScope.length * LANGS.length,
      languageCellsCovered: Object.values(byLanguage).reduce((a, b) => a + b, 0),
      byLanguage,
      byGateway,
      byGatewayDetail,
      statesInScope: orderStates(statesIn),
      statesInReference: orderStates(statesRef),
      undocumentedSamples: undocumented.length,
      hygieneIssues: hygiene.length,
      staleRepos: repos.filter((r) => now - new Date(r.pushedAt).getTime() > staleMs).length,
    },
    sections: products.sections.map((s) => ({
      ...s,
      inScope: SCOREABLE_SECTIONS.has(s.name),
    })),
    sectionScores,
    referenceSections,
    products: all,
    gaps,
    gapTiers,
    undocumented,
    hygiene,
  };

  await writeFile(
    resolve(ROOT, 'data/coverage.json'),
    JSON.stringify(out, null, 2) + '\n'
  );

  // Same payload as a plain script. fetch() of a local file is blocked by CORS,
  // and this page WILL get opened straight from disk in a meeting. Shipping both
  // means double-clicking index.html just works.
  await writeFile(
    resolve(ROOT, 'data/coverage.js'),
    'window.__COVERAGE__ = ' + JSON.stringify(out) + ';\n'
  );

  const s = out.summary;
  console.log(`\nCoverage: ${s.coveragePercent}%  (${s.productsCovered}/${s.productsInScope} documented products have a sample)`);
  console.log(`Language cells: ${s.languageCellsCovered}/${s.languageCellsPossible}`);
  console.log(`  ${LANGS.map((l) => `${l}=${byLanguage[l]}`).join('  ')}`);
  console.log(`Gateways: ${JSON.stringify(byGateway)}`);
  console.log(`Undocumented samples: ${s.undocumentedSamples}  Hygiene issues: ${s.hygieneIssues}  Stale: ${s.staleRepos}`);

  console.log('\nBy section, worst first:');
  for (const sec of sectionScores) {
    console.log(
      `  ${sec.name.padEnd(24)} ${String(sec.productsCovered).padStart(2)}/${String(sec.productsInScope).padEnd(2)}  ${String(sec.coveragePercent).padStart(3)}%`
    );
  }
  console.log(`Band: ${band.label}${target === null ? '  (no target set)' : `  target ${target}/${inScope.length}`}`);

  console.log('\nGap tiers:');
  for (const t of gapTiers) {
    console.log(`  tier ${t.tier}  ${String(t.count).padStart(2)} products  ${t.headline}`);
  }

  const needsTriage = undocumented.filter((u) => !u.acknowledged);
  if (needsTriage.length) {
    console.log('\nUnmapped repos needing triage:');
    for (const u of needsTriage) console.log(`  ${u.name}`);
  }

  console.log('\n-> data/coverage.json');
};

main().catch((err) => {
  console.error(`\nbuild-coverage failed: ${err.message}`);
  process.exit(1);
});
