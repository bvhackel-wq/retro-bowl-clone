// Menu screens: title / team select, franchise hub, launching matches.
(function () {
  const GP = window.GP;
  const $ = (s) => document.querySelector(s);
  let S = null, viewConf = 0, draftPos = 'ALL', newDiff = 'normal';
  let offer = null;   // trade being built: { partner, give: {players, picks}, get: {players, picks} }

  function show(id) {
    document.querySelectorAll('.screen').forEach((e) => e.classList.toggle('on', e.id === id));
    document.body.classList.toggle('playing', id === 'match');   // pins the page during a game
    window.scrollTo(0, 0);
  }
  // During a game, a drag anywhere but the play-call strip must not scroll, zoom or refresh the page.
  document.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('playing') && !e.target.closest('#panel .opts')) e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturestart', (e) => { if (document.body.classList.contains('playing')) e.preventDefault(); });
  // a real full-screen button where the browser allows it (not iPhone Safari: add to Home Screen there)
  const fsBtn = document.getElementById('fs-btn'), root = document.documentElement;
  const fsReq = root.requestFullscreen || root.webkitRequestFullscreen;
  if (fsReq && !navigator.standalone) {
    fsBtn.hidden = false;
    fsBtn.onclick = () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else fsReq.call(root).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
    };
  }
  document.getElementById('rotate-ok').onclick = () => document.body.classList.add('rotate-ok');
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
  const full = (t) => t.name;                 // teams go by their city

  function renderTitle() {
    const saved = GP.load();
    const act = $('#title-actions'); act.innerHTML = '';
    if (saved) {
      const t = GP.team(saved.teamId);
      act.append(h('button', { class: 'btn', onclick: () => { S = saved; viewConf = t.conf; renderHub(); } }, `Continue — ${full(t)}, season ${saved.season}`));
    }
    // iPhone Safari can't go full screen from a web page; the Home Screen version can
    const iphone = /iPhone|iPod/.test(navigator.userAgent) && !navigator.standalone;
    if (iphone) act.append(h('div', { class: 'card tip' },
      h('b', null, 'Play full screen'),
      h('div', { class: 'dim' }, 'In Safari tap Share, then "Add to Home Screen". Open the game from that icon and it runs with no browser bars.'),
      h('div', { class: 'dim', style: 'font-size:13px' }, 'The Home Screen version keeps its own save, separate from this one.')));
    // difficulty for a new career
    const diffDesc = { easy: 'Throws are led for you, a slower pass rush, fewer interceptions', normal: 'Light lead help, scaled by your quarterback’s accuracy', hard: 'No passing help, more interceptions' };
    act.append(h('div', { class: 'card tip' },
      h('b', null, 'Difficulty for a new career'),
      h('div', { class: 'tabs' }, ...Object.entries(GP.DIFFICULTY).map(([k, label]) =>
        h('button', { class: 'btn small' + (k === newDiff ? '' : ' ghost'), onclick: () => { newDiff = k; renderTitle(); } }, label))),
      h('div', { class: 'dim' }, diffDesc[newDiff])));
    const grid = $('#team-grid'); grid.innerHTML = '';
    const start = (t) => {
      if (saved && !confirm('Start a new career? This replaces your current save.')) return;
      S = GP.newCareer(t.id, newDiff); GP.save(S); viewConf = t.conf; renderHub();
    };
    GP.CONFS.forEach((cn, c) => {
      grid.append(h('h3', { class: 'conf' }, cn + ' Conference'));
      const row = h('div', { class: 'divs' });
      GP.DIVS.forEach((dn, d) => {
        row.append(h('div', { class: 'card' }, h('h2', null, dn),
          ...GP.TEAMS.filter((t) => t.conf === c && t.div === d).map((t) =>
            h('button', { class: 'team-card', onclick: () => start(t) }, badge(t), h('span', null, h('b', null, t.name), h('br'), h('small', null, t.abbr))))));
      });
      grid.append(row);
    });
    show('title');
  }

  // a player sprite in a given kit, scaled up crisply
  const kitSprite = (kit) => {
    const c = GP.Pixel.sprites(kit)[0].stand[0], img = document.createElement('canvas');
    img.width = c.width; img.height = c.height; img.getContext('2d').drawImage(c, 0, 0); img.className = 'kit';
    return img;
  };
  // Pick what you wear for the next game; shows each of your four uniforms and what the opponent wears against it.
  function uniformCard(game) {
    const cur = S.uniform || 'auto', home = game.home !== false;
    const pick = GP.matchKits(S.teamId, game.oppId, home, cur);
    const opt = (type, label) => {
      const k = type === 'auto' ? GP.kit(S.teamId, home ? 'home' : 'away') : GP.kit(S.teamId, type);
      return h('button', { class: 'kitopt' + (cur === type ? ' on' : ''), onclick: () => { S.uniform = type; GP.save(S); renderHub(); } },
        kitSprite(k), h('small', null, label));
    };
    const name = (t) => (GP.UNIFORM_TYPES.find((u) => u[0] === t) || [0, t])[1];
    return h('div', { class: 'card' },
      h('div', { class: 'dim' }, `Uniform · ${home ? 'home game' : 'road game'} · ${GP.team(game.oppId).name} wear ${name(pick.oppType).toLowerCase()}`),
      h('div', { class: 'kits' }, opt('auto', 'Auto'), ...GP.UNIFORM_TYPES.map(([t, l]) => opt(t, l)),
        h('span', { class: 'kitvs' }, 'vs'), h('span', { class: 'kitopt' }, kitSprite(pick.opp), h('small', null, GP.team(game.oppId).abbr))));
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
      h('button', { class: 'btn ghost small', title: 'Change difficulty', onclick: () => {
        const order = ['easy', 'normal', 'hard'], next = order[(order.indexOf(S.difficulty || 'normal') + 1) % 3];
        S.difficulty = next; GP.save(S); renderHub();
      } }, 'Difficulty: ' + GP.DIFFICULTY[S.difficulty || 'normal']),
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
        h('div', null, h('div', { class: 'vs' }, (game.home === false ? 'at ' : 'vs ') + full(o)),
          h('div', { class: 'dim' }, `${or.w}-${or.l} · Offense ${or.off} · Defense ${or.def} · DC ${starText(GP.oppDC(S, game.oppId))}`),
          h('div', { class: 'dim' }, `You: Offense ${rec.off} · Defense ${rec.def}`)),
        h('span', { style: 'flex:1' }),
        h('button', { class: 'btn', onclick: () => startMatch(game) }, 'Play game')));
      hub.append(uniformCard(game));
      // play your defense, or let it be simulated as before
      const pd = S.playDefense !== false, setPD = (v) => { S.playDefense = v; GP.save(S); renderHub(); };
      hub.append(h('div', { class: 'card next' }, h('div', null, h('b', null, 'Defense'),
        h('div', { class: 'dim' }, pd ? 'You call the coverage on every opponent snap' : 'Opponent drives are simulated')),
        h('span', { style: 'flex:1' }),
        h('div', { class: 'seg' }, h('button', { class: 'btn small' + (pd ? '' : ' ghost'), onclick: () => setPD(true) }, 'Play it'),
          h('button', { class: 'btn small' + (pd ? ' ghost' : ''), onclick: () => setPD(false) }, 'Simulate'))));
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

    // coaching staff
    const coachLine = (c) => h('div', null, h('b', null, `${c.role} `), c.name, h('span', { class: 'stars' }, ' ' + starText(c.stars)),
      h('span', { class: 'dim' }, ' · ' + c.skills.map((k) => GP.SKILLS[c.role][k][0]).join(', ')));
    hub.append(h('div', { class: 'card next tradecard' },
      h('div', null, h('b', null, 'Coaching staff'), coachLine(S.staff.OC), coachLine(S.staff.DC)),
      h('span', { style: 'flex:1' }),
      h('button', { class: 'btn ghost small', onclick: renderStaff }, 'Hire coordinators')));
    const ts = GP.tradeStatus(S);
    hub.append(h('div', { class: 'card next tradecard' },
      h('div', null, h('b', null, 'Trades'), h('div', { class: 'dim' }, ts.note)),
      h('span', { style: 'flex:1' }),
      h('button', { class: 'btn ghost small', disabled: !ts.open, onclick: () => renderTrade() }, 'Make a trade')));

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

  // ---------- coaching staff ----------
  function renderStaff() {
    const hub = $('#hub'); hub.innerHTML = '';
    const pool = GP.staffPool(S);
    hub.append(h('div', { class: 'hub-head' },
      h('h1', null, 'Coaching staff'), h('span', { class: 'sp' }),
      h('span', { class: 'pill' }, 'Coaching points ', h('b', null, String(S.credits))),
      h('button', { class: 'btn ghost small', onclick: renderHub }, 'Back to team')));
    const coachCard = (c, buy) => h('div', { class: 'coach' },
      h('div', null,
        h('div', null, h('b', null, c.name), h('span', { class: 'dim' }, `  age ${c.age}`), h('span', { class: 'stars' }, ' ' + starText(c.stars))),
        ...c.skills.map((k) => h('div', { class: 'skill' }, h('b', null, GP.SKILLS[c.role][k][0]), h('span', { class: 'dim' }, ' — ' + GP.SKILLS[c.role][k][1])))),
      buy || h('span', { class: 'dim' }, 'Current'));
    const what = {
      OC: 'Calls your plays before every snap; more stars means he reads the defense and the situation better. You can always change his call.',
      DC: 'Runs your defense while the other team has the ball; more stars means more stops and turnovers.',
    };
    const cols = ['OC', 'DC'].map((role) => {
      const card = h('div', { class: 'card' }, h('div', { class: 'dim', style: 'margin-bottom:8px' }, what[role]), coachCard(S.staff[role]),
        h('h3', { class: 'rhead' }, 'Available this season'));
      pool[role].forEach((c, i) => {
        const cost = GP.STAFF_COST[c.stars];
        card.append(coachCard(c, h('button', { class: 'btn small', disabled: S.credits < cost, onclick: () => {
          if (confirm(`Hire ${c.name} for ${cost} coaching point${cost === 1 ? '' : 's'}? ${S.staff[role].name} will leave.`) && GP.hire(S, role, i)) renderStaff();
        } }, cost ? `Hire (${cost})` : 'Hire (free)')));
      });
      if (!pool[role].length) card.append(h('div', { class: 'dim' }, 'Nobody else is available until next season.'));
      return h('div', null, h('h2', null, GP.ROLES[role]), card);
    });
    hub.append(h('div', { class: 'grid2' }, ...cols));
    show('hub');
  }

  // ---------- trades ----------
  function renderTrade(partner) {
    const others = GP.TEAMS.filter((t) => t.id !== S.teamId);
    if (!offer || (partner && offer.partner !== partner)) offer = { partner: partner || (offer && offer.partner) || others[0].id, give: { players: [], picks: [] }, get: { players: [], picks: [] } };
    const hub = $('#hub'); hub.innerHTML = '';
    const pt = GP.team(offer.partner), block = GP.teamBlock(S, offer.partner);
    const toggle = (arr, v) => { const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); renderTrade(); };
    const pickLabel = (pk) => `${GP.team(pk.from).abbr} round ${pk.round}`;
    const item = (checked, onclick, main, sub, value) => h('label', { class: 'titem' + (checked ? ' on' : '') },
      h('input', { type: 'checkbox', checked, onchange: onclick }),
      h('div', null, h('div', null, main), h('div', { class: 'dim', style: 'font-size:13px' }, sub)),
      h('span', { class: 'dim' }, value));
    const playerItem = (p, arr) => item(arr.includes(p.id), () => toggle(arr, p.id),
      [h('b', null, p.pos + ' '), p.name, h('span', { class: 'stars' }, ' ' + starText(p.stars))], `age ${p.age} · overall ${p.ovr}`, '');
    const pickItem = (pk, arr) => item(arr.includes(pk.key), () => toggle(arr, pk.key), pickLabel(pk), `Season ${GP.pickSeason(S)} draft`, '');

    const ev = GP.evaluateTrade(S, offer);
    const pct = ev.need > 0 ? Math.min(100, (ev.give / ev.need) * 100) : 0;
    const select = h('select', { class: 'teampick', onchange: (e) => renderTrade(e.target.value) },
      ...others.map((t) => h('option', { value: t.id, selected: t.id === offer.partner }, t.name)));

    hub.append(h('div', { class: 'hub-head' },
      h('h1', null, 'Make a trade'), h('span', { class: 'sp' }),
      h('span', { class: 'pill' }, `Roster ${S.players.length}/${GP.ROSTER_MAX}`),
      h('button', { class: 'btn ghost small', onclick: () => { offer = null; renderHub(); } }, 'Back to team')));
    hub.append(h('div', { class: 'card next' }, h('div', null, h('div', { class: 'dim' }, 'Trading with'), select),
      h('span', { style: 'flex:1' }),
      h('div', { class: 'meterbox' },
        h('div', { class: 'dim' }, ev.ok ? `${pt.name} would accept` : ev.reason),
        h('div', { class: 'bar meter' }, h('i', { style: `width:${pct}%;background:${ev.ok ? 'var(--good)' : 'var(--accent)'}` }))),
      h('button', { class: 'btn', disabled: !ev.ok, onclick: () => {
        if (GP.executeTrade(S, offer)) { offer = null; renderHub(); }
      } }, 'Propose trade')));

    const mineCol = h('div', { class: 'card' },
      h('h3', { class: 'rhead' }, 'Your players'), ...S.players.map((p) => playerItem(p, offer.give.players)),
      h('h3', { class: 'rhead' }, 'Your picks'), ...GP.ownedPicks(S, S.teamId).map((pk) => pickItem(pk, offer.give.picks)));
    const theirCol = h('div', { class: 'card' },
      h('h3', { class: 'rhead' }, `${pt.abbr} trade block`), ...block.map((p) => playerItem(p, offer.get.players)),
      h('h3', { class: 'rhead' }, `${pt.abbr} picks`), ...GP.ownedPicks(S, offer.partner).map((pk) => pickItem(pk, offer.get.picks)));
    hub.append(h('div', { class: 'grid2' }, h('div', null, h('h2', null, 'You give'), mineCol), h('div', null, h('h2', null, 'You get'), theirCol)));
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

    const tabs = h('div', { class: 'tabs' }, ...['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'K'].map((t) =>
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
      me: GP.team(S.teamId), opp: GP.team(game.oppId), roster: GP.lineup(S), staff: S.staff, difficulty: S.difficulty || 'normal',
      oppOff: or.off, oppDef: or.def, oppDC: GP.oppDC(S, game.oppId), home: game.home !== false, uniform: S.uniform || 'auto', playDefense: S.playDefense !== false, label: game.label,
      onEnd: (my, opp, st, info) => {
        GP.match = null; GP.advance(S, my, opp);
        if (info && info.forfeit) { S.news = (S.news || []).concat(`You forfeited against ${full(GP.team(game.oppId))}. It counts as a ${my}-${opp} loss.`); GP.save(S); }
        renderHub();
      },
    });
  }

  renderTitle();
})();
