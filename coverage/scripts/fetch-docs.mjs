#!/usr/bin/env node
// Parses the developer portal's llms.txt into a product tree.
// Source of truth for the ROWS of the coverage matrix.
//
//   node scripts/fetch-docs.mjs  ->  data/products.json

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LLMS_URL = 'https://developer.globalpayments.com/llms.txt';

// "- [Title](https://.../docs/a/b/c.md): description"
const ENTRY = /^-\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*:?\s*(.*)$/;

// A page slug ending in one of these describes the SAME product as its siblings.
// Stripping them is what turns 145 pages into a sane list of matrix rows.
const PAGE_SUFFIX = /-(overview|guide|customization|step-by-step)$/;
const INDEX_LEAF = /^(overview|guide|step-by-step)$/i;

// Words that must not be naively title-cased.
const ACRONYMS = new Map(
  Object.entries({
    api: 'API',
    sdk: 'SDK',
    ui: 'UI',
    hpp: 'HPP',
    qr: 'QR',
    dcc: 'DCC',
    bnpl: 'BNPL',
    '3d': '3D',
    '3ds': '3DS',
    cz: 'Czechia',
    sk: 'Slovakia',
    id: 'ID',
    url: 'URL',
    moto: 'MOTO',
    ach: 'ACH',
    mcp: 'MCP',
    ios: 'iOS',
    net: '.NET',
    php: 'PHP',
    javascript: 'JavaScript',
    woocommerce: 'WooCommerce',
    opencart: 'OpenCart',
    prestashop: 'PrestaShop',
    paypal: 'PayPal',
    fintech: 'Fintech',
  })
);

const label = (slugSegment) =>
  slugSegment
    .split('-')
    .map((w) => ACRONYMS.get(w.toLowerCase()) ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

function parse(text) {
  const sections = [];
  let section = null;

  for (const line of text.split('\n')) {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      section = { name: heading[1].trim(), pages: [] };
      sections.push(section);
      continue;
    }

    const entry = line.match(ENTRY);
    if (!entry || !section) continue;

    const [, title, url, description] = entry;

    // Most pages live under /docs/, but API References and Resources do not.
    const slug = url
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^docs\//, '')
      .replace(/\.md$/, '')
      .replace(/\/$/, '');

    const segments = slug.split('/');
    const leaf = segments[segments.length - 1];

    // Fold Overview/Guide pages into the product they describe.
    let nodeSegments;
    if (INDEX_LEAF.test(leaf)) {
      nodeSegments = segments.slice(0, -1);
    } else if (PAGE_SUFFIX.test(leaf)) {
      nodeSegments = [...segments.slice(0, -1), leaf.replace(PAGE_SUFFIX, '')];
    } else {
      nodeSegments = segments;
    }
    if (nodeSegments.length === 0) nodeSegments = segments;

    section.pages.push({
      title: title.trim(),
      description: description.trim(),
      url,
      slug,
      isIndex: INDEX_LEAF.test(leaf),
      node: nodeSegments.join('/'),
    });
  }

  return sections;
}

function toNodes(sections) {
  const nodes = new Map();

  for (const section of sections) {
    for (const page of section.pages) {
      if (!nodes.has(page.node)) {
        const segments = page.node.split('/');
        nodes.set(page.node, {
          id: page.node,
          section: section.name,
          segments,
          depth: segments.length,
          label: label(segments[segments.length - 1]),
          parent: segments.length > 1 ? segments.slice(0, -1).join('/') : null,
          pages: [],
        });
      }
      nodes.get(page.node).pages.push(page);
    }
  }

  const ids = new Set(nodes.keys());

  for (const node of nodes.values()) {
    node.docCount = node.pages.length;
    node.hasChildren = [...ids].some((id) => id.startsWith(node.id + '/'));
    // A node with children is a container ("Payments", "Payment Methods"). It is a
    // heading, not a thing you can write a sample for, so it never scores. Leaves
    // are the real products — even when their only pages are an Overview + Guide.
    node.scoreable = !node.hasChildren;
  }

  return [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const main = async () => {
  process.stdout.write(`Fetching ${LLMS_URL} ... `);
  const res = await fetch(LLMS_URL, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(
      `llms.txt returned HTTP ${res.status}. Refusing to emit a partial product tree.`
    );
  }
  const text = await res.text();
  console.log(`${text.length} bytes`);

  const sections = parse(text);
  if (sections.length === 0) {
    throw new Error(
      'Parsed 0 sections from llms.txt. The format has changed — fix the parser before trusting any output.'
    );
  }

  const nodes = toNodes(sections);
  const pageCount = sections.reduce((n, s) => n + s.pages.length, 0);
  const scoreable = nodes.filter((n) => n.scoreable);

  const out = {
    generatedAt: new Date().toISOString(),
    source: LLMS_URL,
    sectionCount: sections.length,
    pageCount,
    nodeCount: nodes.length,
    scoreableCount: scoreable.length,
    sections: sections.map((s) => ({ name: s.name, pageCount: s.pages.length })),
    nodes,
  };

  await mkdir(resolve(ROOT, 'data'), { recursive: true });
  await writeFile(
    resolve(ROOT, 'data/products.json'),
    JSON.stringify(out, null, 2) + '\n'
  );

  console.log(
    `\n${sections.length} sections  ${pageCount} pages  ${nodes.length} nodes  ${scoreable.length} scoreable products`
  );
  for (const s of out.sections) {
    console.log(`  ${String(s.pageCount).padStart(3)}  ${s.name}`);
  }
  console.log('\n-> data/products.json');
};

main().catch((err) => {
  console.error(`\nfetch-docs failed: ${err.message}`);
  process.exit(1);
});
