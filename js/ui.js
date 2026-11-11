// Menu screens: title / team select, franchise hub, launching matches.
(function () {
  const GP = window.GP;
  const $ = (s) => document.querySelector(s);
  let S = null, viewConf = 0, draftPos = 'ALL';

  function show(id) {
    document.querySelectorAll('.screen').forEach((e) => e.classList.toggle('on', e.id === id));
    window.scrollTo(0, 0);
  }
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else if (k.startsWith('on')) e[k] = attrs[k];
      else e[k] = attrs[k];
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c);
    return e;
  }
  const badge = (t) => h('span', { class: 'badge', style: `background:${t.c1};border-color:${t.c2};color:${t.c2}` });
  const full = (t) => `${t.city} ${t.name}`;

  function renderTitle() {
    const saved = GP.load();
    const act = $('#title-actions'); act.innerHTML = '';
    if (saved) {
      const t = GP.team(saved.teamId);
      act.append(h('button', { class: 'btn', onclick: () => { S = saved; viewConf = t.conf; renderHub(); } }, `Continue — ${full(t)}, season ${saved.season}`));
    }
    const grid = $('#team-grid'); grid.innerHTML = '';
    const start = (t) => {
      if (saved && !confirm('Start a new career? This replaces your current save.')) return;
      S = GP.newCareer(t.id); GP.save(S); viewConf = t.conf; renderHub();
    };
    GP.CONFS.forEach((cn, c) => {
      grid.append(h('h3', { class: 'conf' }, cn + ' Conference'));
      const row = h('div', { class: 'divs' });
      GP.DIVS.forEach((dn, d) => {
        row.append(h('div', { class: 'card' }, h('h2', null, dn),
          ...GP.TEAMS.filter((t) => t.conf === c && t.div === d).map((t) =>
            h('button', { class: 'team-card', onclick: () => start(t) }, badge(t), h('span', null, h('b', null, t.name), h('br'), h('small', null, t.city))))));
      });
      grid.append(row);
    });
    show('title');
  }

  const starText = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  // A stat bar with a marker at the player's cap for it.
  const capBar = (val, cap, color) => h('div', { class: 'bar capbar' },
    h('i', { style: `width:${val}%` + (color ? `;background:${color}` : '') }),
    h('u', { style: `left:${cap}%`, title: `Max ${cap}` }));
  // One upgradable stat under a player's name (id is a player id or a unit key).
  function statRow(r, id, stat, label, hint) {
    const val = r.stats[stat], cap = r.caps[stat], cost = GP.upgradeCost(val, cap);
    return h('div', { class: 'substat', title: hint || '' },
      h('span', { class: 'dim' }, label),
      capBar(val, cap, 'var(--accent)'),
      h('b', null, String(val), h('small', { class: 'dim' }, '/' + cap)),
      h('button', { class: 'btn small ghost', disabled: S.credits < cost, onclick: () => { if (GP.upgrade(S, id, stat)) renderHub(); } },
        cost === Infinity ? 'MAX' : `+1 (${cost})`));
  }
  // A roster row: a player (stats and upgrades), a unit, or the reserve filling an empty spot.
  function playerRow(r, posLabel, opts) {
    opts = opts || {};
    const key = opts.unit || r.pos, derived = GP.derived(key), id = opts.unit || r.id;
    if (r.filler) {
      return h('div', { class: 'rost reserve' },
        h('span', { class: 'pos' }, posLabel),
        h('div', null, h('div', null, h('i', null, `No ${GP.PLAYER_POS[r.pos].toLowerCase()} on the roster`)),
          h('div', { class: 'dim', style: 'font-size:13px' }, `A ${r.stars}★ reserve fills in. Draft or trade for a real one.`)),
        h('span', { class: 'ovr' }, String(r.ovr)), h('span'));
    }
    const cost = derived ? null : GP.upgradeCost(r.stats.ovr, r.caps.ovr);
    return h('div', { class: 'rost' },
      h('span', { class: 'pos' }, posLabel),
      h('div', null,
        h('div', null, opts.unit ? opts.label : r.name, opts.unit ? null : h('span', { class: 'dim' }, `  age ${r.age}`),
          h('span', { class: 'stars', title: `${r.stars}-star ceiling` }, ' ' + starText(r.stars)),
          opts.unit ? null : h('button', { class: 'link', title: 'Release him to open a roster spot', onclick: () => {
            if (confirm(`Release ${r.name}? He leaves the team for good.`)) { GP.release(S, r.id); renderHub(); }
          } }, 'Release')),
        h('div', { class: 'dim', style: 'font-size:13px' }, derived ? 'Overall comes from his stats' : opts.desc || ''),
        derived ? null : capBar(r.stats.ovr, r.caps.ovr),
        ...GP.statsFor(key).filter(([k]) => k !== 'ovr').map(([k, label, hint]) => statRow(r, id, k, label, hint))),
      h('span', { class: 'ovr' }, String(r.ovr)),
      derived ? h('span') : h('button', {
        class: 'btn small', disabled: S.credits < cost,
        onclick: () => { if (GP.upgrade(S, id, 'ovr')) renderHub(); },
      }, cost === Infinity ? 'MAX' : `+1 (${cost})`));
  }

  function renderHub() {
    if (S.phase === 'offseason' && !S.draft) GP.startDraft(S);     // saves made before the draft existed
    const hub = $('#hub'); hub.innerHTML = '';
    const me = GP.team(S.teamId), rec = GP.rec(S, S.teamId), game = GP.currentGame(S);

    hub.append(h('div', { class: 'hub-head' },
      badge(me), h('h1', null, full(me)),
      h('span', { class: 'sp' }),
      h('span', { class: 'pill' }, `Season ${S.season} · ${rec.w}-${rec.l}`),
      h('span', { class: 'pill' }, 'Coaching points ', h('b', null, String(S.credits))),
      h('button', { class: 'btn ghost small', onclick: renderTitle }, 'Menu')));

    if (S.news && S.news.length) hub.append(h('div', { class: 'card news' }, ...S.news.map((n) => h('div', null, n))));

    // next game / offseason
    if (game && game.bye) {
      hub.append(h('h2', null, 'Playoffs — ' + game.label), h('div', { class: 'card next' },
        h('div', null, h('div', { class: 'vs' }, 'First-round bye'),
          h('div', { class: 'dim' }, 'You earned a top-two seed. Rest up while the wild cards play.')),
        h('span', { style: 'flex:1' }),
        h('button', { class: 'btn', onclick: () => { GP.advance(S, null, null); renderHub(); } }, 'Advance')));
    } else if (game) {
      const o = GP.team(game.oppId), or = GP.rec(S, game.oppId);
      hub.append(h('h2', null, (S.phase === 'playoffs' ? 'Playoffs — ' : '') + game.label), h('div', { class: 'card next' },
        badge(o),
        h('div', null, h('div', { class: 'vs' }, 'vs ' + full(o)),
          h('div', { class: 'dim' }, `${or.w}-${or.l} · Offense ${or.off} · Defense ${or.def}`),
          h('div', { class: 'dim' }, `You: Offense ${rec.off} · Defense ${rec.def}`)),
        h('span', { style: 'flex:1' }),
        h('button', { class: 'btn', onclick: () => startMatch(game) }, 'Play game')));
    } else {
      const ch = GP.team(S.champion);
      hub.append(h('h2', null, `Season ${S.season} complete`), h('div', { class: 'card next' },
        badge(ch),
        h('div', null, h('div', { class: 'vs' }, S.champion === S.teamId ? 'You are the champions!' : `${full(ch)} win the title`),
          h('div', { class: 'dim' }, `Your season: ${rec.w}-${rec.l} · ${S.seasonNote}`),
          h('div', { class: 'dim' }, 'Young players develop and veterans decline over the offseason.')),
        h('span', { style: 'flex:1' }),
        h('div', { class: 'stack' },
          h('button', { class: 'btn', onclick: renderDraft }, S.draft && !S.draft.done ? 'Go to the draft' : 'Review the draft'),
          h('button', { class: 'btn ghost', onclick: () => {
            if (S.draft && !S.draft.done && GP.myPicks(S).length && !confirm('Skip the rest of the draft? Your remaining picks are passed.')) return;
            GP.newSeason(S); renderHub();
          } }, 'Start next season'))));
    }

    // roster: starters (a reserve wherever a spot is empty), bench, then the two units
    const lineup = GP.lineup(S), starterIds = new Set();
    const roster = h('div', { class: 'card' });
    roster.append(h('h3', { class: 'rhead' }, 'Starters'));
    for (const [slot, pos] of GP.SLOTS) {
      const r = lineup[slot];
      if (!r.filler) starterIds.add(r.id);
      roster.append(playerRow(r, pos));
    }
    const bench = S.players.filter((p) => !starterIds.has(p.id)).sort((a, b) => a.pos.localeCompare(b.pos) || b.ovr - a.ovr);
    roster.append(h('h3', { class: 'rhead' }, 'Bench', h('span', { class: 'dim' }, bench.length ? '' : '  nobody yet')));
    for (const r of bench) roster.append(playerRow(r, r.pos));
    roster.append(h('h3', { class: 'rhead' }, 'Units'));
    for (const [key, label, desc] of GP.UNITS) roster.append(playerRow(S.units[key], key, { unit: key, label, desc }));

    // standings: one table per division, with a conference switcher
    const seeds = S.phase === 'regular' ? GP.seeds(S, viewConf) : S.playoff.seeds[viewConf];
    const tabs = h('div', { class: 'tabs' }, ...GP.CONFS.map((cn, c) =>
      h('button', { class: 'btn small' + (c === viewConf ? '' : ' ghost'), onclick: () => { viewConf = c; renderHub(); } }, cn)));
    const tables = h('div', { class: 'card' }, tabs);
    GP.DIVS.forEach((dn, d) => {
      const tb = h('tbody');
      for (const t of GP.divStandings(S, viewConf, d)) {
        const tm = GP.team(t.id), seed = seeds.indexOf(t.id);
        tb.append(h('tr', { class: t.id === S.teamId ? 'me' : '' },
          h('td', null, seed >= 0 ? h('span', { class: 'seed' }, String(seed + 1)) : ''), h('td', null, full(tm)),
          h('td', null, String(t.w)), h('td', null, String(t.l)),
          h('td', null, String(t.pf)), h('td', null, String(t.pa))));
      }
      tables.append(h('table', null, h('thead', null, h('tr', null,
        ...['', dn, 'W', 'L', 'PF', 'PA'].map((x) => h('th', null, x)))), tb));
    });
    const table = tables;

    hub.append(h('div', { class: 'grid2' },
      h('div', null, h('h2', null, `Roster ${S.players.length}/${GP.ROSTER_MAX}`), roster),
      h('div', null, h('h2', null, 'Standings — numbered teams hold a playoff seed'), table,
        S.history.length ? h('h2', null, 'History') : null,
        S.history.length ? h('div', { class: 'card' }, ...S.history.map((x) => h('div', { class: 'dim' }, `Season ${x.season}: ${x.w}-${x.l} — ${x.note}`))) : null)));
    show('hub');
  }

  // ---------- draft ----------
  const starRange = ([lo, hi]) => (lo === hi ? starText(lo) : `${'★'.repeat(lo)}${'✩'.repeat(hi - lo)}${'☆'.repeat(5 - hi)}`);
  function renderDraft() {
    const d = S.draft, hub = $('#hub'); hub.innerHTML = '';
    GP.draftAdvance(S);                               // other teams pick up to your turn
    const cur = GP.draftCurrent(S), mine = cur && cur.owner === S.teamId, full = S.players.length >= GP.ROSTER_MAX;
    const myLeft = GP.myPicks(S);
    hub.append(h('div', { class: 'hub-head' },
      h('h1', null, `Season ${d.season} Draft`), h('span', { class: 'sp' }),
      h('span', { class: 'pill' }, `Roster ${S.players.length}/${GP.ROSTER_MAX}`),
      h('span', { class: 'pill' }, 'Coaching points ', h('b', null, String(S.credits))),
      h('button', { class: 'btn ghost small', onclick: renderHub }, 'Back to team')));

    let status;
    if (d.done) status = h('div', null, h('div', { class: 'vs' }, 'The draft is over'), h('div', { class: 'dim' }, 'Start the next season from your team page.'));
    else if (mine) status = h('div', null, h('div', { class: 'vs' }, `You're on the clock — pick #${cur.no} (round ${cur.round})`),
      h('div', { class: 'dim' }, full ? 'Your roster is full (12). Release a player from your team page, or pass this pick.' : 'Scout prospects to see their real stars and stats, then draft one.'));
    hub.append(h('div', { class: 'card next' }, status, h('span', { style: 'flex:1' }),
      mine ? h('button', { class: 'btn ghost', onclick: () => { GP.draftPass(S); renderDraft(); } }, 'Pass this pick') : null,
      h('div', { class: 'dim' }, myLeft.length ? 'Your picks: ' + myLeft.map((p) => `#${p.no}`).join(', ') : 'No picks left')));

    const tabs = h('div', { class: 'tabs' }, ...['ALL', 'QB', 'RB', 'WR', 'TE', 'K'].map((t) =>
      h('button', { class: 'btn small' + (t === draftPos ? '' : ' ghost'), onclick: () => { draftPos = t; renderDraft(); } }, t)));
    const list = h('div', { class: 'card' }, tabs);
    const est = (p) => (p.scouted ? p.stars * 10 + p.ovr / 10 : (p.est.stars[0] + p.est.stars[1]) * 5 + p.est.ovr[0] / 10);
    const pool = d.pool.filter((p) => draftPos === 'ALL' || p.pos === draftPos).sort((a, b) => est(b) - est(a)).slice(0, 40);
    for (const p of pool) {
      const stats = p.scouted ? GP.statsFor(p.pos).map(([k, label]) => `${label} ${p.stats[k]}/${p.caps[k]}`).join(' · ') : 'Not scouted';
      list.append(h('div', { class: 'prospect' },
        h('span', { class: 'pos' }, p.pos),
        h('div', null,
          h('div', null, p.name, h('span', { class: 'dim' }, `  age ${p.age}`),
            h('span', { class: 'stars', title: p.scouted ? `${p.stars} stars` : 'Estimated range — scout him to know' }, ' ' + (p.scouted ? starText(p.stars) : starRange(p.est.stars)))),
          h('div', { class: 'dim', style: 'font-size:13px' }, stats)),
        h('span', { class: 'ovr', title: p.scouted ? 'Overall' : 'Estimated overall range' }, p.scouted ? String(p.ovr) : `${p.est.ovr[0]}–${p.est.ovr[1]}`),
        h('div', { class: 'stack' },
          p.scouted ? null : h('button', { class: 'btn small ghost', disabled: S.credits < GP.SCOUT_COST || d.done,
            onclick: () => { if (GP.scout(S, p.id)) renderDraft(); } }, `Scout (${GP.SCOUT_COST})`),
          h('button', { class: 'btn small', disabled: !mine || full, onclick: () => { if (GP.draftPick(S, p.id)) renderDraft(); } }, 'Draft'))));
    }
    const log = h('div', { class: 'card' }, ...d.log.slice(-12).reverse().map((e) => h('div', { class: 'draftlog' + (e.owner === S.teamId ? ' me' : '') },
      `#${e.no} ${GP.team(e.owner).abbr}: ` + (e.pass ? 'passed' : `${e.name}, ${e.pos} ${starText(e.stars)}`))));
    hub.append(h('div', { class: 'grid2' },
      h('div', null, h('h2', null, 'Prospects'), list),
      h('div', null, h('h2', null, 'Latest picks'), d.log.length ? log : h('div', { class: 'card dim' }, 'No picks yet.'))));
    show('hub');
  }

  function startMatch(game) {
    const or = GP.rec(S, game.oppId);
    show('match');
    GP.match = new GP.Match($('#field'), {
      me: GP.team(S.teamId), opp: GP.team(game.oppId), roster: GP.lineup(S),
      oppOff: or.off, oppDef: or.def, label: game.label,
      onEnd: (my, opp) => { GP.match = null; GP.advance(S, my, opp); renderHub(); },
    });
  }

  renderTitle();
})();
