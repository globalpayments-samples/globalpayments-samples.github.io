# Sample Coverage Dashboard — Build Plan

**One line:** A live map of which Global Payments products have sample projects, in which
languages, on which gateway — and exactly where the holes are.

**Why it exists:** Today nobody can answer "what do our samples actually cover?" without
opening 45 repos. That question comes up in sample prioritisation, in the dev portal work
(PDP-26, PR #62), in coverage-gap planning, and in every leadership update. This makes it
one screenshot.

---

## 1. What it proves

| Audience | What they get in 5 seconds |
|---|---|
| Leadership | "We cover 62% of the documented product surface. Here are the top 3 gaps and the plan." |
| The team | A ranked backlog of what sample to build next, with evidence |
| Dev portal team | Which doc pages have no runnable sample to link to |
| SDK team | Which gateways each sample still depends on — the migration surface |

---

## 2. The three axes

Coverage is not one number. It is a cube:

```
                 PRODUCT  ×  LANGUAGE  ×  GATEWAY
        payments/tokenization    php        gp-api
        payments/recurring       nodejs     portico
        risk/fraud               java       gpecom
        ...                      dotnet
```

A cell is **covered** only if a sample exists for that product *in that language* *on that
gateway*. That is the honest definition, and it is the one that produces a useful gap list.

The gateway axis matters right now: the SDKs are being rewritten to drop multi-gateway and
target Global API only. This dashboard shows, on day one, exactly how much of our sample
estate is still Portico/GP-ECOM bound. That is the migration scope.

---

## 3. Data sources — all verified working

### 3.1 Product taxonomy — `llms.txt`

`https://developer.globalpayments.com/llms.txt` → HTTP 200, 24 KB, 176 lines.

145 documented pages across 7 sections:

| Section | Pages |
|---|---|
| Getting Started | 12 |
| Integration Options | 17 |
| **Payments** | **62** |
| Risk Management | 11 |
| Operations & Reporting | 8 |
| API References | 30 |
| Resources | 5 |

URL slugs give a clean hierarchy for free:

```
payments/tokenization/network-tokenization-guide
payments/payment-methods/digital-wallets/apple-pay
payments/manage-payments/refund-guide
```

That hierarchy **is** the row structure of the matrix. No taxonomy needs inventing.

### 3.2 Sample inventory — GitHub

`gh` CLI is already authenticated as `RadoslavSheytanovGP`.
`globalpayments-samples` org: **45 repos**.

Two signals per repo:

- **Language folders** (ground truth). Repos follow a convention:
  `dotnet/ java/ nodejs/ php/ python/ go/`
  Verified on `virtual-terminal` (dotnet, java, nodejs, php) and `apple-pay-payments`
  (dotnet, go, java, nodejs, php, python).
- **Topics** (metadata). Many repos carry `lang-dotnet`, `lang-php`, plus product topics
  (`tokenization`, `google-pay`, `recurring-payments`, `3d-secure`, `portico`, `gp-api`).

**Folders win.** Topics are used as a cross-check — and the disagreement is itself a
finding (see §6, hygiene panel). Example: `apple-pay-payments` has six language folders and
**zero topics**. `gpecom-digital-wallets` has none either. That is invisible today.

### 3.3 Gateway

Derived, in priority order:

1. Repo name prefix — `portico-*` → Portico, `gpecom-*` → GP-ECOM
2. Topic — `portico` / `gpecom` / `gp-api`
3. Default → GP-API

Cross-checked against `gp-os/skills/gp-product-map/gateways.md`, which already documents the
gateway fingerprints.

### 3.4 Existing assets we reuse, not rebuild

- **`globalpayments-samples.github.io/css/styles.css`** — the complete GP design token set
  is already written and in production. See §5.
- **`gp-os/skills/gp-product-map/`** — `gateways.md` + `repos.md` are a hand-curated product
  map. Seed the mapping table from these instead of guessing.
- **`gp-os/skills/coverage-gap-analyzer/`** — this skill currently *asks the user to type in
  their sample inventory by hand on every first use*. The dashboard generates exactly that
  inventory as JSON. **The dashboard becomes the data layer that skill has been missing.**
  Worth saying out loud in the demo: it turns a manual skill into an automatic one.

---

## 4. Architecture — deliberately boring

No framework. No build step. No bundler. Same stack as the samples landing page already in
production, so it can be dropped straight into that site.

```
sample-coverage-dashboard/
├── PLAN.md
├── README.md
├── config/
│   └── mapping.json        # product-topic → doc-path rules (hand-curated, ~40 entries)
├── scripts/
│   ├── fetch-docs.mjs      # llms.txt      → data/products.json
│   ├── fetch-repos.mjs     # gh api        → data/samples.json
│   └── build-coverage.mjs  # join the two  → data/coverage.json
├── data/
│   ├── products.json       # generated
│   ├── samples.json        # generated
│   └── coverage.json       # generated — the only file the UI reads
├── css/
│   ├── tokens.css          # copied verbatim from samples.github.io
│   └── dashboard.css
├── js/
│   └── dashboard.js
├── assets/img/             # GP_logo.svg, GP_favicon.svg (copied)
└── index.html
```

Node 26 is installed. Scripts are plain `.mjs`, zero dependencies — `fetch` and `gh` are
enough. Total pipeline runtime: seconds.

### The join

`build-coverage.mjs` is the only place with real logic. Rules:

1. Every doc page from `llms.txt` becomes a **product node**.
2. Every repo maps to one or more product nodes via `config/mapping.json`
   (`"google-pay" → payments/payment-methods/digital-wallets/google-pay`).
3. Unmapped repos and unmapped doc pages are **both reported**, never silently dropped.
   An honest dashboard shows its own blind spots.
4. Each match records: languages (from folders), gateway, repo URL, last push date.

Output states per cell:

| State | Meaning |
|---|---|
| **Covered** | Sample exists in this language |
| **Partial** | Sample exists, but not in this language |
| **Missing** | No sample for this product at all |
| **Stale** | Covered, but no push in 12 months |
| **Undocumented** | Sample exists with no matching doc page — a docs gap, not a sample gap |

That last state is the one that makes people lean in. It finds work the docs team owns.

---

## 5. The UI — real GP brand, not an approximation

The design tokens already exist in production and get copied verbatim. Nothing is invented:

```
--gp-global-blue  #262AFF     --gp-deep-blue   #1B1EC6
--gp-pulse-blue   #1CABFF     --gp-grape       #87179D
--gp-sunshine     #FFCC00     --gp-creamsicle  #FDA052
--gp-raspberry    #F4364C     --gp-charcoal    #595959
--gp-fog #EEEEEE  --gp-haze #F4F4F4  --gp-mist #F8F8F8
font: 'DM Sans'   radii: 4 / 8 / 12 / 16px
```

Same logo, same favicon, same font, same spacing scale as the live samples page. It will
look like it shipped from the design system because it did.

**Encoding rule:** state is never colour-only. Covered = filled blue block. Partial = half
block. Missing = dashed outline. Stale = filled with a diagonal hatch. Readable
mono, readable projected, readable by anyone colour-blind, readable in a printed leave-behind.

### Screens

1. **KPI strip** — four numbers: `% product surface covered` · `45 samples` ·
   `4 languages` · `N open gaps`. Big, quiet, no gauges or donuts.
2. **Coverage matrix** — the hero. Rows = product tree from `llms.txt` (collapsible by
   section). Columns = PHP · Node.js · Java · .NET. Click a cell → side panel with repo
   links, last commit, gateway. Python/Go coverage shows in the panel as a footnote, never
   as a column.
3. **Gateway filter** — All / GP-API / Portico / GP-ECOM. Flipping to Portico instantly
   shows the migration surface.
4. **Gap ranking** — the top gaps, sorted by `doc-page-count × language-breadth-missing`.
   This is the "what should we build next" answer, with arithmetic behind it.
5. **Hygiene panel** — repos with no description, no topics, or folder/topic mismatch. Small
   section, quick wins, makes the estate look maintained.
6. **Export** — one button: copies a Markdown summary and a PNG of the matrix. Because this
   ends up in a deck, and the leave-behind should not require a screenshot tool.

Responsive down to laptop. Dark mode is not in scope for v1.

---

## 6. Build phases

### Phase 1 — Data — DONE
- [x] `fetch-docs.mjs`: parse `llms.txt` into a product tree
- [x] `fetch-repos.mjs`: 45 repos → name, description, topics, language folders, pushedAt, gateway
- [x] Seed `config/mapping.json` from `gp-product-map/repos.md`
- [x] `build-coverage.mjs`: join, emit `coverage.json`
- [x] Print an unmapped report to console — tune mapping until it is small and explainable

**Gate:** `coverage.json` is correct enough to read aloud. Data before pixels.

### Phase 2 — The matrix — DONE
- [x] `index.html` shell with real GP header/footer copied from the samples site
- [x] `tokens.css` copied verbatim; `dashboard.css` written on top
- [x] Render the matrix from `coverage.json`
- [x] Row click → inline detail (not a modal)
- [x] Gateway filter, product search, reference-section toggle

**Gate:** it is genuinely useful with the styling switched off.

### Phase 3 — Polish and proof — DONE
- [x] Coverage field, gap ranking, undocumented list, hygiene panel
- [x] Copy-to-clipboard Markdown summary; print stylesheet for the leave-behind
- [x] Empty and missing-data states
- [x] Keyboard focus states, ARIA labels on every row
- [x] `README.md`: what it is, how to regenerate, how to extend the mapping

### Phase 4 — Ship (≈1 hour)
- [ ] GitHub Action: regenerate `coverage.json` nightly, commit if changed
- [ ] Publish as `/coverage` inside `globalpayments-samples.github.io` — zero new infra, and
      it lands inside work the team already owns
- [ ] Post in the Team channel with the live link and the top 3 gaps

**Total: roughly two evenings.**

---

## 7. Decisions — settled

1. **Where it lives** — a `/coverage` route inside the existing
   `globalpayments-samples.github.io`. No new infra, no new permissions, and it sits next to
   the samples it describes.
2. **Language columns** — the four majors: **PHP, Node.js, Java, .NET**.
   Python and Go are still *recorded* in `coverage.json` where folders exist, but they are
   not columns and never count toward or against a coverage score. Adding a column later is
   a one-line config change, not a rewrite.

Everything else gets decided while building.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Product mapping is subjective | Mapping lives in one reviewable JSON file, seeded from `gp-product-map`. Unmapped items are reported, never hidden. |
| `llms.txt` structure changes | Parser fails loudly with a clear message rather than emitting a wrong tree. |
| GitHub rate limits | Pipeline runs on demand and nightly, not per page load. UI only ever reads a static JSON file. |
| Looks like criticism of other teams | Framing is "here is the map and the plan", not "here is who is behind". The gap list ships with proposed owners. |
| Scope creep into a full analytics platform | v1 is a static page reading one JSON file. Anything needing a server is v2. |

---

## 9. Definition of done

A single URL that loads in under a second, shows the honest state of sample coverage across
product, language and gateway, names the top gaps with reasoning, refreshes itself nightly,
and looks like it belongs to Global Payments.
