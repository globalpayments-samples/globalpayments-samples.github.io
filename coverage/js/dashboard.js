/* Sample Coverage Dashboard — rendering only. All judgement lives in the
   build scripts; this file draws what data/coverage.js already decided.

   The one rule to keep: if a number needs deciding, decide it in
   build-coverage.mjs and read it here. Nothing below computes a score. */

(function () {
  'use strict';

  var LANG_LABEL = { php: 'PHP', nodejs: 'Node.js', java: 'Java', dotnet: '.NET', python: 'Python', go: 'Go' };
  var GATEWAY_LABEL = { 'gp-api': 'GP-API', portico: 'Portico', gpecom: 'GP-ECOM' };

  /* Short name for a cell, and the sentence the legend uses to define it. */
  var STATE_LABEL = {
    covered: 'Covered',
    partial: 'Partial',
    stale: 'Stale',
    missing: 'Missing',
    'out-of-scope': 'Not scored'
  };
  var STATE_MEANING = {
    covered: 'A sample ships this language',
    partial: 'A sample exists, but not in this language',
    stale: 'Covered, but no push in 12 months',
    missing: 'No sample in this language',
    'out-of-scope': 'Reference page — a sample is not the right artifact'
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  var svg = function (path) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  };
  var CHEVRON = '<path d="M9 6l6 6-6 6"/>';

  var state = { gateway: 'all', query: '', showOutOfScope: false, open: null };
  var data = null;

  /* ------------------------------------------------------------- utilities */

  function langLabel(id) { return LANG_LABEL[id] || id; }
  function gatewayLabel(id) { return GATEWAY_LABEL[id] || id; }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }

  function relativeDate(iso) {
    var ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return 'just now';
    var days = Math.floor(ms / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 45) return days + ' days ago';
    var months = Math.round(days / 30.44);
    if (months < 24) return months + ' months ago';
    var years = Math.floor(days / 365.25);
    return years + ' ' + plural(years, 'year') + ' ago';
  }

  function cssEscape(v) {
    return window.CSS && CSS.escape ? CSS.escape(v) : v.replace(/[^\w-]/g, '\\$&');
  }

  /* -------------------------------------------------------------- the view */

  /* Everything the page shows is one of two views: the whole org, or a single
     gateway. Resolving it once here keeps every renderer reading the same
     precomputed numbers instead of each inventing its own. */
  function view() {
    var s = data.summary;
    if (state.gateway === 'all') {
      return {
        gateway: null,
        percent: s.coveragePercent,
        band: s.band,
        covered: s.productsCovered,
        total: s.productsInScope,
        missing: s.productsMissing,
        coveredIds: null
      };
    }
    var g = s.byGatewayDetail[state.gateway];
    return {
      gateway: state.gateway,
      percent: g.coveragePercent,
      band: g.band,
      covered: g.productsCovered,
      total: g.productsInScope,
      missing: g.productsInScope - g.productsCovered,
      coveredIds: g.coveredIds
    };
  }

  /* A product is covered *in the current view*. */
  function coveredInView(product) {
    if (state.gateway === 'all') return !!product.covered;
    return product.coveredGateways.indexOf(state.gateway) !== -1;
  }

  /* Rows are removed by the gateway filter, never dimmed. Dimming made the empty
     rows the sharpest thing on screen, which is the opposite of the truth. */
  function visible(product) {
    if (state.query) {
      var q = state.query.toLowerCase();
      var hay = (product.displayLabel + ' ' + product.id + ' ' + product.section).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    if (state.gateway !== 'all' && !coveredInView(product)) return false;
    return true;
  }

  function sectionScoreFor(name) {
    for (var i = 0; i < data.sectionScores.length; i++) {
      if (data.sectionScores[i].name === name) return data.sectionScores[i];
    }
    return null;
  }

  /* ------------------------------------------------------------------ lede */

  function renderLede() {
    var s = data.summary;
    var v = view();

    var figure = $('#coverage-figure');
    figure.textContent = v.percent + '%';
    figure.dataset.band = v.band.id;

    // The band is written out as well as coloured. A number nobody can grade
    // defaults to "fine", and colour alone is not a grade.
    $('#coverage-band').textContent = v.band.label;

    $('#coverage-caption').textContent =
      v.covered + ' of ' + v.total + ' products have a runnable sample. ' +
      v.missing + ' have none.';

    var statement = $('#statement');
    statement.innerHTML = '';
    if (v.gateway) {
      statement.appendChild(document.createTextNode('Showing '));
      statement.appendChild(el('strong', null, gatewayLabel(v.gateway)));
      statement.appendChild(document.createTextNode(
        ' only — ' + s.byGatewayDetail[v.gateway].repos + ' ' +
        plural(s.byGatewayDetail[v.gateway].repos, 'repository', 'repositories') +
        ' covering ' + v.covered + ' of the same ' + v.total + ' products.'
      ));
    } else {
      statement.appendChild(document.createTextNode('Measured across '));
      statement.appendChild(el('strong', null, String(s.sampleRepos)));
      statement.appendChild(document.createTextNode(' sample repositories and the '));
      statement.appendChild(el('strong', null, String(s.productsInScope)));
      statement.appendChild(document.createTextNode(
        ' products documented for Payments, Risk Management and Operations & Reporting.'
      ));
    }

    renderStrip(v);
    renderFacts();
  }

  /* One block per in-scope product. The strip and the percentage are the same
     fact drawn two ways — this one reads from across a room. */
  function renderStrip(v) {
    var strip = $('#strip');
    strip.innerHTML = '';
    var inScope = data.products.filter(function (p) { return p.inScope; });
    var coveredSet = null;
    if (v.coveredIds) {
      coveredSet = {};
      v.coveredIds.forEach(function (id) { coveredSet[id] = true; });
    }

    inScope.forEach(function (p, i) {
      var covered = coveredSet ? !!coveredSet[p.id] : !!p.covered;
      var cell = el('li', 'strip__cell');
      cell.dataset.covered = String(covered);
      cell.style.animationDelay = Math.min(i * 12, 600) + 'ms';
      cell.title = p.displayLabel + ' — ' + (covered ? 'has a sample' : 'no sample');
      strip.appendChild(cell);
    });

    var caption = 'One block per documented product. Filled blocks have a sample.';
    var target = data.summary.target;
    if (typeof target === 'number') {
      var marker = strip.children[target - 1];
      if (marker) marker.dataset.target = 'true';
      caption += ' The line marks the target of ' + target + '.';
    }
    $('#strip-caption').textContent = caption;
  }

  function renderFacts() {
    var s = data.summary;
    var gw = s.byGateway;
    var legacy = (gw.portico || 0) + (gw.gpecom || 0);

    var items = [
      { value: String(s.sampleRepos), label: 'sample repositories' },
      { value: String(gw['gp-api'] || 0), label: 'on GP-API, the current gateway' },
      { value: String(legacy), label: 'still on Portico or GP-ECOM', flag: true },
      { value: String(s.undocumentedSamples), label: 'samples with no doc page', flag: true },
      { value: String(s.hygieneIssues), label: 'repositories missing metadata', flag: true }
    ];

    var wrap = $('#facts');
    wrap.innerHTML = '';
    items.forEach(function (f) {
      var item = el('div', 'facts__item' + (f.flag ? ' facts__item--flag' : ''));
      item.appendChild(el('span', 'facts__value', f.value));
      item.appendChild(el('span', 'facts__label', f.label));
      wrap.appendChild(item);
    });
  }

  /* -------------------------------------------------------------- controls */

  function gatewayOptions() {
    var s = data.summary;
    var options = [{ id: 'all', label: 'All gateways', count: s.sampleRepos }];
    Object.keys(s.byGateway).sort().forEach(function (id) {
      options.push({ id: id, label: gatewayLabel(id), count: s.byGateway[id] });
    });
    return options;
  }

  function renderControls() {
    var seg = $('#gateway-filter');
    seg.innerHTML = '';
    var options = gatewayOptions();

    options.forEach(function (opt) {
      var pressed = state.gateway === opt.id;
      var b = el('button', 'segmented__btn');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(pressed));
      // Roving tabindex: the group is one stop, arrows move within it.
      b.tabIndex = pressed ? 0 : -1;
      b.dataset.gateway = opt.id;
      b.appendChild(document.createTextNode(opt.label));
      var count = el('span', 'count', String(opt.count));
      count.setAttribute('aria-hidden', 'true');
      b.appendChild(count);
      b.setAttribute('aria-label',
        opt.label + ', ' + opt.count + ' ' + plural(opt.count, 'repository', 'repositories'));

      b.addEventListener('click', function () { setGateway(opt.id); });
      b.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
            : e.key === 'Home' ? 'first' : e.key === 'End' ? 'last' : 0;
        if (!step) return;
        e.preventDefault();
        var ids = options.map(function (o) { return o.id; });
        // Move relative to the button the user is actually on. Under roving tabindex
        // that is the selected one, but not if focus was moved programmatically.
        var at = ids.indexOf(this.dataset.gateway);
        if (at === -1) at = ids.indexOf(state.gateway);
        var next = step === 'first' ? 0
          : step === 'last' ? ids.length - 1
            : (at + step + ids.length) % ids.length;
        setGateway(ids[next], true);
      });
      seg.appendChild(b);
    });
  }

  function setGateway(id, focus) {
    state.gateway = id;
    state.open = null;
    renderControls();
    renderLede();
    renderMatrix();
    renderGaps();
    writeHash();
    if (focus) {
      var b = $('.segmented__btn[data-gateway="' + cssEscape(id) + '"]');
      if (b) b.focus();
    }
  }

  /* ---------------------------------------------------------------- legend */

  /* Only the states this dataset actually produces. The stylesheet defines five;
     drawing all five teaches a vocabulary most readers will never meet. */
  function renderLegend() {
    var host = $('#legend');
    host.innerHTML = '';
    var states = data.summary.statesInScope.slice();
    if (state.showOutOfScope) {
      data.summary.statesInReference.forEach(function (st) {
        if (states.indexOf(st) === -1) states.push(st);
      });
    }
    states.forEach(function (st) {
      var item = el('div', 'legend__item');
      var swatch = el('span', 'cell');
      swatch.dataset.state = st;
      swatch.setAttribute('aria-hidden', 'true');
      item.appendChild(swatch);
      var text = el('span', 'legend__text');
      text.appendChild(el('strong', null, STATE_LABEL[st]));
      text.appendChild(el('span', 'legend__meaning', STATE_MEANING[st]));
      item.appendChild(text);
      host.appendChild(item);
    });
  }

  /* ---------------------------------------------------------------- matrix */

  function renderMatrix() {
    var host = $('#matrix');
    host.innerHTML = '';

    var sections = data.sectionScores.map(function (s) { return s.name; });
    if (state.showOutOfScope) {
      data.referenceSections.forEach(function (s) { sections.push(s.name); });
    }

    var shown = 0;
    var totalCandidates = 0;

    sections.forEach(function (sectionName) {
      var all = data.products.filter(function (p) {
        if (p.section !== sectionName) return false;
        if (!p.scoreable) return false;
        if (!p.inScope && !state.showOutOfScope) return false;
        return true;
      });
      totalCandidates += all.length;

      var rows = all.filter(visible);
      if (rows.length === 0) return;
      shown += rows.length;

      var group = el('div', 'matrix__group');
      group.appendChild(buildSectionBand(sectionName, rows.length, all.length));

      // Visual column headers. The row buttons carry the real accessible name, so
      // this is decoration — marking it up as a table row it is not was worse.
      var head = el('div', 'matrix__head');
      head.setAttribute('aria-hidden', 'true');
      head.appendChild(el('div', 'matrix__head-name', 'Product'));
      var heads = el('div', 'matrix__cells');
      data.languages.forEach(function (l) { heads.appendChild(el('div', null, langLabel(l))); });
      head.appendChild(heads);
      head.appendChild(el('div', 'matrix__head-depth', 'Covered'));
      group.appendChild(head);

      rows.forEach(function (p) { group.appendChild(buildRow(p)); });
      host.appendChild(group);
    });

    if (shown === 0) {
      var empty = el('div', 'empty');
      empty.appendChild(el('p', 'empty__title', 'Nothing matches those filters.'));
      var reset = el('button', 'btn', 'Show everything again');
      reset.type = 'button';
      reset.addEventListener('click', clearFilters);
      empty.appendChild(reset);
      host.appendChild(empty);
    }

    announce(shown, totalCandidates);
  }

  /* The section is the unit a manager budgets in, so it carries its own score.
     Without this you have to count squares by eye — which is how "Risk Management
     is at 1 of 7" got remembered as zero. */
  function buildSectionBand(name, shownCount, totalCount) {
    var band = el('div', 'matrix__section');
    var score = sectionScoreFor(name);

    band.appendChild(el('h3', 'matrix__groupname', name));

    if (!score) {
      band.appendChild(el('p', 'matrix__score matrix__score--ref',
        'Reference pages. Never counted toward the percentage.'));
      return band;
    }

    var s = state.gateway === 'all' ? score : score.byGateway[state.gateway];
    var line = el('p', 'matrix__score');
    line.dataset.band = s.band.id;
    line.appendChild(el('strong', null, s.productsCovered + ' of ' + score.productsInScope));
    line.appendChild(document.createTextNode(
      ' products covered' + (state.gateway === 'all' ? '' : ' on ' + gatewayLabel(state.gateway)) +
      ' — ' + s.coveragePercent + '%'
    ));
    band.appendChild(line);

    // The same ratio as blocks, at section scale, so the shape of the problem is
    // visible before you read a single row.
    var mini = el('ul', 'ministrip');
    mini.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < score.productsInScope; i++) {
      var b = el('li', 'ministrip__cell');
      b.dataset.covered = String(i < s.productsCovered);
      mini.appendChild(b);
    }
    band.appendChild(mini);

    if (shownCount < totalCount) {
      band.appendChild(el('p', 'matrix__filtered',
        'Showing ' + shownCount + ' of ' + totalCount + ' rows.'));
    }
    return band;
  }

  function buildRow(product) {
    var frag = document.createDocumentFragment();
    var isOpen = state.open === product.id;
    var detailId = 'detail-' + product.id.replace(/[^\w-]/g, '_');

    var row = el('button', 'matrix__row');
    row.type = 'button';
    row.setAttribute('aria-expanded', String(isOpen));
    row.setAttribute('aria-controls', detailId);
    row.dataset.rowId = product.id;

    var name = el('div', 'matrix__name');
    name.innerHTML = '<span class="matrix__chev">' + svg(CHEVRON) + '</span>';
    name.appendChild(el('span', 'matrix__label', product.displayLabel));
    if (product.docCount > 1) {
      name.appendChild(el('span', 'matrix__docs', product.docCount + ' pages'));
    }
    row.appendChild(name);

    var cells = el('div', 'matrix__cells');
    data.languages.forEach(function (lang) {
      var cellData = product.cells[lang];
      var cell = el('div', 'cell');
      cell.dataset.state = cellData.state;
      cell.setAttribute('aria-hidden', 'true');
      cell.title = langLabel(lang) + ' — ' + STATE_MEANING[cellData.state] +
        (cellData.repos.length ? ': ' + cellData.repos.join(', ') : '');
      // Visible only in the stacked card layout, where columns no longer exist.
      cell.appendChild(el('span', 'cell__label', langLabel(lang)));
      cells.appendChild(cell);
    });
    row.appendChild(cells);

    var depth = el('div', 'depth');
    depth.setAttribute('aria-hidden', 'true');
    depth.appendChild(el('span', 'depth__count',
      product.inScope ? product.languageDepth + '/' + data.languages.length : '—'));
    row.appendChild(depth);

    row.setAttribute('aria-label', rowLabel(product));

    row.addEventListener('click', function () {
      state.open = isOpen ? null : product.id;
      renderMatrix();
      writeHash();
      // Rebuilding the list destroys the button that was clicked; put focus back on
      // its replacement so the keyboard does not get thrown to the top of the page.
      var again = document.querySelector('[data-row-id="' + cssEscape(product.id) + '"]');
      if (again) again.focus();
    });

    frag.appendChild(row);
    if (isOpen) frag.appendChild(buildDetail(product, detailId));
    return frag;
  }

  /* The cells are decoration to a screen reader; this sentence is the row. */
  function rowLabel(product) {
    if (!product.inScope) {
      return product.displayLabel + ' — reference page, not scored. Select for details.';
    }
    var covered = data.languages.filter(function (l) {
      return ['covered', 'stale'].indexOf(product.cells[l].state) !== -1;
    });
    var missing = data.languages.filter(function (l) {
      return covered.indexOf(l) === -1;
    });
    if (covered.length === 0) {
      return product.displayLabel + ' — no sample in any language. Select for details.';
    }
    var text = product.displayLabel + ' — covered in ' + covered.map(langLabel).join(', ');
    if (missing.length) text += '; missing ' + missing.map(langLabel).join(', ');
    text += '. ' + product.sampleCount + ' ' + plural(product.sampleCount, 'sample') +
      ' on ' + product.coveredGateways.map(gatewayLabel).join(', ') + '. Select for details.';
    return text;
  }

  function buildDetail(product, id) {
    var wrap = el('div', 'detail');
    wrap.id = id;
    var grid = el('div', 'detail__grid');

    // Samples
    var samples = el('div');
    samples.appendChild(el('h4', 'detail__heading', 'Samples'));
    if (product.samples.length === 0) {
      var none = el('p', 'detail__meta',
        'No sample project covers this product yet, in any language, on any gateway.');
      samples.appendChild(none);
    } else {
      var list = el('ul', 'detail__list');
      product.samples.forEach(function (s) {
        var li = el('li');
        var a = el('a', null, s.name);
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener';
        li.appendChild(a);
        li.appendChild(document.createTextNode(' '));
        var tag = el('span', 'tag', gatewayLabel(s.gateway));
        tag.dataset.gateway = s.gateway;
        li.appendChild(tag);

        var langs = s.languages.map(langLabel).join(', ') || 'no language folders';
        var meta = langs + ' · updated ' + relativeDate(s.pushedAt);
        if (s.stale) meta += ' · stale';
        li.appendChild(el('span', 'detail__meta', meta));
        list.appendChild(li);
      });
      samples.appendChild(list);
    }
    grid.appendChild(samples);

    // Language breakdown — the plain-text statement of every cell in this row.
    var langs = el('div');
    langs.appendChild(el('h4', 'detail__heading', 'By language'));
    var llist = el('ul', 'detail__list');
    data.languages.forEach(function (lang) {
      var c = product.cells[lang];
      var li = el('li');
      li.appendChild(el('strong', null, langLabel(lang)));
      li.appendChild(document.createTextNode(' — ' + STATE_MEANING[c.state]));
      if (c.repos.length) li.appendChild(el('span', 'detail__meta', c.repos.join(', ')));
      llist.appendChild(li);
    });
    langs.appendChild(llist);

    var extras = {};
    product.samples.forEach(function (s) {
      s.extraLanguages.forEach(function (l) { extras[l] = true; });
    });
    var extraKeys = Object.keys(extras);
    if (extraKeys.length) {
      langs.appendChild(el('p', 'detail__meta',
        'Also present, not scored: ' + extraKeys.map(langLabel).join(', ') + '.'));
    }
    grid.appendChild(langs);

    // Documentation
    var docs = el('div');
    docs.appendChild(el('h4', 'detail__heading', 'Documentation'));
    var dlist = el('ul', 'detail__list');
    product.pages.forEach(function (p) {
      var li = el('li');
      var a = el('a', null, p.title);
      a.href = p.url;
      a.target = '_blank';
      a.rel = 'noopener';
      li.appendChild(a);
      if (p.description) li.appendChild(el('span', 'detail__meta', p.description));
      dlist.appendChild(li);
    });
    docs.appendChild(dlist);
    grid.appendChild(docs);

    wrap.appendChild(grid);
    return wrap;
  }

  /* ------------------------------------------------------------------ gaps */

  /* Grouped by tier, not numbered 1..26. The score has two distinct values across
     26 products, so an ordinal list would invent a precision the data lacks. */
  function renderGaps() {
    var host = $('#gaps');
    host.innerHTML = '';

    var q = state.query.toLowerCase();
    var matches = function (g) {
      if (!q) return true;
      return (g.displayLabel + ' ' + g.id + ' ' + g.section).toLowerCase().indexOf(q) !== -1;
    };

    var byId = {};
    data.gaps.forEach(function (g) { byId[g.id] = g; });

    var drawn = 0;
    data.gapTiers.forEach(function (tier) {
      var members = tier.items.map(function (id) { return byId[id]; }).filter(matches);
      if (members.length === 0) return;
      drawn += members.length;

      var block = el('section', 'tier');
      var head = el('div', 'tier__head');
      head.appendChild(el('h3', 'tier__title',
        members.length + ' ' + plural(members.length, 'product') + ' — ' + tier.headline));
      head.appendChild(el('p', 'tier__note', tier.note));
      block.appendChild(head);

      var list = el('ul', 'tier__list');
      members.forEach(function (g) {
        var li = el('li', 'tier__item');
        li.appendChild(el('span', 'tier__name', g.displayLabel));
        li.appendChild(el('span', 'tier__where', g.section));
        list.appendChild(li);
      });
      block.appendChild(list);
      host.appendChild(block);
    });

    if (drawn === 0) {
      host.appendChild(el('p', 'empty__title', data.gaps.length === 0
        ? 'No gaps. Every documented product has a sample in all four languages.'
        : 'No gaps match that search.'));
    }

    // The note has to follow the filter. Left static it claimed 26 products above an
    // empty list, which reads as a bug in the page rather than an empty result.
    $('#gaps-note').textContent = state.query
      ? drawn + ' of ' + data.gaps.length + ' gaps match “' + state.query + '”.'
      : data.summary.productsMissing + ' of ' + data.summary.productsInScope +
        ' products have no runnable sample. They are grouped below by how much ' +
        'documentation points at them — the only signal this data has. Within a ' +
        'group the order means nothing, so choose by business priority.';
  }

  /* --------------------------------------------------------- undocumented */

  function renderUndocumented() {
    var host = $('#undocumented');
    host.innerHTML = '';
    if (data.undocumented.length === 0) {
      host.appendChild(el('p', 'empty__title', 'Every sample maps to a documented product.'));
      return;
    }
    data.undocumented.forEach(function (u) {
      var li = el('li');
      var left = el('div');
      var a = el('a', null, u.name);
      a.href = u.url;
      a.target = '_blank';
      a.rel = 'noopener';
      left.appendChild(a);
      left.appendChild(document.createTextNode(' '));
      var tag = el('span', 'tag', gatewayLabel(u.gateway));
      tag.dataset.gateway = u.gateway;
      left.appendChild(tag);
      li.appendChild(left);
      li.appendChild(el('div', 'why', u.reason));
      host.appendChild(li);
    });
  }

  /* -------------------------------------------------------------- hygiene */

  function renderHygiene() {
    var host = $('#hygiene');
    host.innerHTML = '';
    if (data.hygiene.length === 0) {
      host.appendChild(el('p', 'empty__title',
        'Every repository has a description, topics, and language folders that agree.'));
      return;
    }
    data.hygiene.forEach(function (h) {
      var li = el('li');
      var left = el('div');
      var a = el('a', null, h.name);
      a.href = h.url;
      a.target = '_blank';
      a.rel = 'noopener';
      left.appendChild(a);
      li.appendChild(left);
      li.appendChild(el('div', 'why', h.issues.join(' · ')));
      host.appendChild(li);
    });
  }

  /* -------------------------------------------------------------- colophon */

  function renderColophon() {
    var when = new Date(data.generatedAt);
    $('#generated').textContent = 'Data generated ' + when.toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short'
    });
    $('#colophon').hidden = false;
  }

  /* --------------------------------------------------------------- status */

  /* Sighted users read .matrix__status; screen readers hear #status. Same words. */
  function announce(shown, total) {
    var line = '';
    if (state.gateway !== 'all' || state.query) {
      var bits = [];
      if (state.gateway !== 'all') bits.push('on ' + gatewayLabel(state.gateway));
      if (state.query) bits.push('matching “' + state.query + '”');
      line = 'Showing ' + shown + ' of ' + total + ' ' + plural(total, 'product') +
        ' ' + bits.join(' and ') + '.';
    }
    var box = $('#matrix-status');
    box.textContent = '';
    if (line) {
      box.appendChild(document.createTextNode(line + ' '));
      var reset = el('button', 'linkbtn', 'Clear filters');
      reset.type = 'button';
      reset.addEventListener('click', clearFilters);
      box.appendChild(reset);
    }
    box.hidden = !line;
    $('#status').textContent = line;
  }

  function clearFilters() {
    state.gateway = 'all';
    state.query = '';
    $('#search').value = '';
    renderControls();
    renderLede();
    renderMatrix();
    renderGaps();
    writeHash();
    $('#search').focus();
  }

  /* ---------------------------------------------------------- deck export */

  function markdownSummary() {
    var s = data.summary;
    var lines = [];
    lines.push('# Sample coverage — ' + new Date(data.generatedAt).toLocaleDateString());
    lines.push('');
    lines.push('**' + s.coveragePercent + '%** — ' + s.band.label + '. ' +
      s.productsCovered + ' of ' + s.productsInScope +
      ' documented products have a runnable sample; ' + s.productsMissing + ' have none.');
    lines.push('');
    lines.push('## By section, worst first');
    lines.push('');
    data.sectionScores.forEach(function (sec) {
      lines.push('- **' + sec.name + '** — ' + sec.productsCovered + ' of ' +
        sec.productsInScope + ' (' + sec.coveragePercent + '%)');
    });
    lines.push('');
    lines.push('## Samples');
    lines.push('');
    lines.push('- ' + s.sampleRepos + ' repositories: ' +
      Object.keys(s.byGateway).sort().map(function (g) {
        return s.byGateway[g] + ' ' + gatewayLabel(g);
      }).join(', '));
    lines.push('- ' + s.undocumentedSamples + ' samples have no matching documentation page');
    lines.push('- ' + s.hygieneIssues + ' repositories have missing or contradictory metadata');
    lines.push('');
    lines.push('## What to build next');
    lines.push('');
    data.gapTiers.forEach(function (t) {
      lines.push('**' + t.count + ' ' + plural(t.count, 'product') + ' — ' + t.headline + '**');
      lines.push('');
      lines.push(t.note);
      lines.push('');
      t.items.forEach(function (id) {
        var g = data.gaps.filter(function (x) { return x.id === id; })[0];
        if (g) lines.push('- ' + g.displayLabel + ' (' + g.section + ')');
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  function wireExport() {
    var btn = $('#copy-summary');
    btn.addEventListener('click', function () {
      var text = markdownSummary();
      var done = function (ok) {
        btn.textContent = ok ? 'Copied as Markdown' : 'Copy failed — press Ctrl+C';
        setTimeout(function () { btn.textContent = 'Copy summary'; }, 2400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        window.prompt('Copy the summary:', text);
      }
    });
  }

  /* ------------------------------------------------------------- url state */

  /* The view lives in the URL so a filtered page can be sent to someone. Uses the
     hash rather than the query string so it also works from file://. */
  function writeHash() {
    var parts = [];
    if (state.gateway !== 'all') parts.push('gw=' + encodeURIComponent(state.gateway));
    if (state.query) parts.push('q=' + encodeURIComponent(state.query));
    if (state.showOutOfScope) parts.push('ref=1');
    if (state.open) parts.push('open=' + encodeURIComponent(state.open));
    var hash = parts.length ? '#' + parts.join('&') : '';
    if (hash === window.location.hash) return;
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search + hash);
    } catch (e) {
      // Some browsers refuse replaceState on file://, and this page is designed to
      // be double-clicked off disk. A shareable URL is a bonus there, not the point.
    }
  }

  function readHash() {
    var raw = window.location.hash.replace(/^#/, '');
    if (!raw) return;
    var known = {};
    gatewayOptions().forEach(function (o) { known[o.id] = true; });

    raw.split('&').forEach(function (pair) {
      var i = pair.indexOf('=');
      var key = i === -1 ? pair : pair.slice(0, i);
      var val = i === -1 ? '' : decodeURIComponent(pair.slice(i + 1));
      if (key === 'gw' && known[val]) state.gateway = val;
      else if (key === 'q') state.query = val;
      else if (key === 'ref') state.showOutOfScope = val === '1';
      else if (key === 'open') state.open = val;
    });

    $('#search').value = state.query;
    $('#show-out-of-scope').checked = state.showOutOfScope;
  }

  /* ------------------------------------------------------------------ boot */

  function wireControls() {
    var search = $('#search');
    var t;
    search.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.query = search.value.trim();
        state.open = null;
        renderMatrix();
        renderGaps();
        writeHash();
      }, 120);
    });

    $('#show-out-of-scope').addEventListener('change', function (e) {
      state.showOutOfScope = e.target.checked;
      renderLegend();
      renderMatrix();
      writeHash();
    });
  }

  function boot() {
    data = window.__COVERAGE__;

    if (!data) {
      $('#app').hidden = true;
      $('#load-error').hidden = false;
      return;
    }

    $('#load-error').hidden = true;
    $('#app').hidden = false;

    readHash();
    renderLede();
    renderControls();
    renderLegend();
    renderMatrix();
    renderGaps();
    renderUndocumented();
    renderHygiene();
    renderColophon();
    wireControls();
    wireExport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
