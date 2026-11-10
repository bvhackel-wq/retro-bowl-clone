// Menu screens: title / team select, franchise hub, launching matches.
(function () {
  const GP = window.GP;
  const $ = (s) => document.querySelector(s);
  let S = null;

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
      act.append(h('button', { class: 'btn', onclick: () => { S = saved; renderHub(); } }, `Continue — ${full(t)}, season ${saved.season}`));
    }
    const grid = $('#team-grid'); grid.innerHTML = '';
    for (const t of GP.TEAMS) {
      grid.append(h('button', {
        class: 'team-card',
        onclick: () => {
          if (saved && !confirm('Start a new career? This replaces your current save.')) return;
          S = GP.newCareer(t.id); GP.save(S); renderHub();
        },
      }, badge(t), h('span', null, h('b', null, t.name), h('br'), h('small', null, t.city))));
    }
    show('title');
  }

  function renderHub() {
    const hub = $('#hub'); hub.innerHTML = '';
    const me = GP.team(S.teamId), rec = GP.rec(S, S.teamId), game = GP.currentGame(S);

    hub.append(h('div', { class: 'hub-head' },
      badge(me), h('h1', null, full(me)),
      h('span', { class: 'sp' }),
      h('span', { class: 'pill' }, `Season ${S.season} · ${rec.w}-${rec.l}`),
      h('span', { class: 'pill' }, 'Coaching points ', h('b', null, String(S.credits))),
      h('button', { class: 'btn ghost small', onclick: renderTitle }, 'Menu')));

    // next game / offseason
    if (game) {
      const o = GP.team(game.oppId), or = GP.rec(S, game.oppId);
      hub.append(h('h2', null, game.label), h('div', { class: 'card next' },
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
        h('button', { class: 'btn', onclick: () => { GP.newSeason(S); renderHub(); } }, 'Start next season')));
    }

    // roster
    const roster = h('div', { class: 'card' });
    for (const p of GP.POS) {
      const r = S.roster[p.key], cost = GP.upgradeCost(r.ovr);
      roster.append(h('div', { class: 'rost' },
        h('span', { class: 'pos' }, p.key.replace(/\d/, '')),
        h('div', null,
          h('div', null, p.unit ? p.label : r.name, p.unit ? null : h('span', { class: 'dim' }, `  age ${r.age}`)),
          h('div', { class: 'dim', style: 'font-size:13px' }, p.desc),
          h('div', { class: 'bar' }, h('i', { style: `width:${r.ovr}%` }))),
        h('span', { class: 'ovr' }, String(r.ovr)),
        h('button', {
          class: 'btn small', disabled: S.credits < cost,
          onclick: () => { if (GP.upgrade(S, p.key)) renderHub(); },
        }, cost === Infinity ? 'MAX' : `+1 (${cost})`)));
    }

    // standings
    const tb = h('tbody');
    GP.standings(S).forEach((t, i) => {
      const tm = GP.team(t.id);
      tb.append(h('tr', { class: (t.id === S.teamId ? 'me ' : '') + (i === 3 ? 'cut' : '') },
        h('td', null, String(i + 1)), h('td', null, full(tm)),
        h('td', null, String(t.w)), h('td', null, String(t.l)),
        h('td', null, String(t.pf)), h('td', null, String(t.pa))));
    });
    const table = h('table', null, h('thead', null, h('tr', null,
      ...['#', 'Team', 'W', 'L', 'PF', 'PA'].map((x) => h('th', null, x)))), tb);

    hub.append(h('div', { class: 'grid2' },
      h('div', null, h('h2', null, 'Roster'), roster),
      h('div', null, h('h2', null, 'Standings — top 4 make the playoffs'), h('div', { class: 'card' }, table),
        S.history.length ? h('h2', null, 'History') : null,
        S.history.length ? h('div', { class: 'card' }, ...S.history.map((x) => h('div', { class: 'dim' }, `Season ${x.season}: ${x.w}-${x.l} — ${x.note}`))) : null)));
    show('hub');
  }

  function startMatch(game) {
    const or = GP.rec(S, game.oppId);
    show('match');
    GP.match = new GP.Match($('#field'), {
      me: GP.team(S.teamId), opp: GP.team(game.oppId), roster: S.roster,
      oppOff: or.off, oppDef: or.def, label: game.label,
      onEnd: (my, opp) => { GP.match = null; GP.advance(S, my, opp); renderHub(); },
    });
  }

  renderTitle();
})();
