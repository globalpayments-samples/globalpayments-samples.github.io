# Sample Coverage Dashboard

A live map of which Global Payments products have sample projects, in which languages, on
which gateway — and exactly where the holes are.

See [PLAN.md](PLAN.md) for the full build plan.

## View it

Published at **https://globalpayments-samples.github.io/coverage/**.

It is a static page with no build step and no dependencies. `index.html` also opens
straight from disk — the build writes `data/coverage.js` next to `coverage.json`, so the
page has its data without a `fetch`. To serve it locally instead:

```sh
python3 -m http.server 8777
```

## Regenerate the data

Requires Node 18+ and a `gh` CLI authenticated against the `globalpayments-samples` org.

```sh
node scripts/fetch-docs.mjs      # llms.txt        -> data/products.json
node scripts/fetch-repos.mjs     # GitHub org      -> data/samples.json
node scripts/build-coverage.mjs  # join the two    -> data/coverage.json
```

Or all three in order:

```sh
scripts/refresh.sh
```

The scripts resolve their paths from their own location, so they can be run from any
working directory. `data/coverage.json` is the only file the UI reads.

## Refreshing on a schedule

A launchd agent runs `scripts/refresh.sh` every weekday morning at 09:00 and appends the
output to `~/Library/Logs/sample-coverage-refresh.log`. If the machine is asleep at 09:00,
launchd runs it on the next wake.

The agent is a local, per-machine thing: its plist holds absolute paths, so it is not
committed here. `scripts/com.globalpayments.sample-coverage.plist.sample` is a template —
copy it, replace `__REPO__` with the absolute path of your clone, and load it:

```sh
sed -e "s|__REPO__|$(cd .. && pwd)|g" -e "s|__HOME__|$HOME|g" \
  scripts/com.globalpayments.sample-coverage.plist.sample \
  > ~/Library/LaunchAgents/com.globalpayments.sample-coverage.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.globalpayments.sample-coverage.plist
```

```sh
launchctl kickstart -p gui/$(id -u)/com.globalpayments.sample-coverage   # run it now
launchctl print gui/$(id -u)/com.globalpayments.sample-coverage          # is it scheduled
launchctl bootout gui/$(id -u)/com.globalpayments.sample-coverage        # stop scheduling
```

To change the time, edit `Hour` and `Minute`, regenerate the plist, then `bootout` and
`bootstrap` again.

The refresh only rewrites `data/`. It never commits and never pushes — publishing a new
number stays a deliberate act:

```sh
git diff --stat coverage/data          # what moved
git add coverage/data && git commit -m "chore: refresh sample coverage data"
```

### Why not GitHub Actions

A workflow in this repo cannot do the `fetch-repos` step. The default `GITHUB_TOKEN` is
scoped to the repository it runs in, so it cannot list or read the other repos in the org.
Moving the refresh to CI therefore needs either a personal access token or a GitHub App
installation token held as a repository secret — an org-wide credential decision, not a
build decision. Until that is agreed, the scheduled local refresh above covers it, and the
data in `git` is the record of what was published when.

## How coverage is decided

**Rows** come from the developer portal's `llms.txt`. Every documented page is folded into
a product node — an Overview and a Guide for the same thing become one row. Container
nodes ("Payments", "Payment Methods") are headings, not products, so they never score.

**Columns** are the four major languages: PHP, Node.js, Java, .NET. A repo supports a
language if it has that top-level folder. Folders are ground truth; repo topics are only
used to detect metadata drift.

**Scope.** Only Payments, Risk Management, and Operations & Reporting count toward the
percentage. Getting Started, Integration Options, API References and Resources are
reference material — a runnable sample is not the right artifact for "Country Codes". They
still render in the UI, marked out of scope, so nothing looks hidden.

**Gateway** is inferred from the repo name prefix (`portico-`, `gpecom-`), then topics,
defaulting to GP-API.

## Cell states

| State | Meaning |
|---|---|
| Covered | A sample exists in this language |
| Partial | A sample exists for this product, but not in this language |
| Missing | No sample for this product at all |
| Stale | Covered, but no push in 12 months |
| Not scored | Reference documentation, not a sample target |

The legend on the page only draws the states the current data actually produces —
`build-coverage.mjs` emits `summary.statesInScope`. Today that is Covered and Missing;
Partial and Stale are defined and styled but unreachable, because every mapped repo
ships all four language folders. Making a reader learn five states to read a
two-state chart is a cost with no payoff.

## Grading the number

A percentage with nothing to compare it against reads as neutral. `config/mapping.json`
carries two knobs:

- **`coverageBands`** — inclusive upper bounds that turn the percentage into a word.
  Today 40% lands in `Critical`. The word is printed next to the figure, so the grade
  survives greyscale and print; the colour is a second signal, never the only one.
- **`coverageTarget`** — how many of the in-scope products should have a sample. It is
  `null` until the team agrees one. Set a number and the strip draws a target line and
  the summary reports the shortfall. An invented target is worse than no target.

## What to build next

The gap score only knows two things: how many documented pages point at a product, and
how many languages are missing. Across 26 gaps that produces two distinct values, not
26 — so the page groups them into tiers and says so, rather than printing an ordinal
1..26 list whose order the data cannot support. Within a tier the order is meaningless
and the copy says that out loud.

## Row labels

A label like "Czechia" means nothing on its own, and six labels appear twice in the
product tree. `build-coverage.mjs` emits a `displayLabel` that prefixes the parent when
a label is either deep in the tree or duplicated: `Bank Payment — Czechia`. Labels that
are already unambiguous are left alone.

## Editing the mapping

`config/mapping.json` is the one file with human judgement in it. It maps each sample repo
to the product node(s) it demonstrates.

A repo with no entry is reported as **undocumented** — a sample that exists with no
matching doc page. That is a real finding, usually work the docs team owns. Do not invent a
mapping to make the warning go away; add it to `knownUndocumented` with a reason instead.

`build-coverage.mjs` fails loudly if the mapping references a repo or product node that no
longer exists, so the config cannot rot silently.

## Layout

```
config/mapping.json        repo -> product mapping, scope, bands and column config
scripts/fetch-docs.mjs     llms.txt parser
scripts/fetch-repos.mjs    GitHub inventory
scripts/build-coverage.mjs the join, scoring, gap tiers, hygiene report
scripts/refresh.sh         runs all three in order
scripts/*.plist.sample     launchd schedule template, filled in per machine
data/*.json                generated — safe to delete and rebuild
data/coverage.js           the same object as a <script> tag, so file:// works
index.html + css/ + js/    the page; no framework, no build step
assets/img/GP_logo*.svg    screen (white) and print (dark) variants of the mark
```

The three brand files under `assets/img/` are deliberate copies of the ones at the site
root. `coverage/` stays self-contained so it keeps rendering from `file://` and cannot be
broken by a change to the landing page's asset layout.

`js/dashboard.js` renders and nothing else. If a number needs deciding, decide it in
`build-coverage.mjs` and read it in the renderer.
