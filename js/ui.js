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
    // news (a trade, a hire, a draft pick, a retirement) pops up once, then it's gone
    if (id !== 'match' && S && S.news && S.news.length) {
      // at most three at once: past that, the rest are folded into the third
      const n = S.news, shown = n.length > 3 ? [n[0], n[1], `${n.length - 2} more: ` + n.slice(2).join(' · ')] : n;
      shown.forEach((x, i) => toast(x, i)); S.news = []; GP.save(S);
    }
  }
  // a short notice that slides in at the top and leaves by itself after 6 seconds, or on a tap (the × or anywhere on it)
  function toast(text, i) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.append(box); }
    const t = document.createElement('div'); t.className = 'toast';
    const msg = document.createElement('span'); msg.textContent = text;
    const x = document.createElement('button'); x.className = 'toast-x'; x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×';
    t.append(msg, x);
    let gone = false;
    const bye = () => { if (gone) return; gone = true; t.classList.add('out'); setTimeout(() => t.remove(), 300); };
    t.onclick = bye; box.append(t);
    setTimeout(bye, 6000 + Math.min(i || 0, 2) * 800);
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
    // New career: the team is picked during setup (not built yet); until then you get a random team
    act.append(h('button', { class: 'btn' + (saved ? ' ghost' : ''), onclick: () => {
      if (saved && !confirm('Start a new career? This replaces your current save.')) return;
      const t = GP.TEAMS[Math.floor(Math.random() * GP.TEAMS.length)];
      S = GP.newCareer(t.id, newDiff); GP.save(S); viewConf = t.conf; renderHub();
    } }, 'New career'));
    act.append(h('div', { class: 'dim', style: 'width:100%;font-size:13px' }, 'For now a new career gives you a random team; choosing one will be part of career setup.'));
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
    show('title');
  }

  // a player sprite in a given kit, scaled up crisply
  const kitSprite = (kit) => {
    const c = GP.Pixel.sprites(kit)[0].stand[0], img = document.createElement('canvas');
    img.width = c.width; img.height = c.height; img.getContext('2d').drawImage(c, 0, 0); img.className = 'kit';
    return img;
  };
  // Pick what you wear for the next game; shows each of your four uniforms and what the opponent wears against it.
  function uniformCard(game, rerender, noOpp) {
    const cur = S.uniform || 'auto', home = game.home !== false;
    const pick = GP.matchKits(S.teamId, game.oppId, home, cur);
    const opt = (type, label) => {
      const k = type === 'auto' ? GP.kit(S.teamId, home ? 'home' : 'away') : GP.kit(S.teamId, type);
      return h('button', { class: 'kitopt' + (cur === type ? ' on' : ''), onclick: () => { S.uniform = type; GP.save(S); (rerender || renderHub)(); } },
        kitSprite(k), h('small', null, label));
    };
    const name = (t) => (GP.UNIFORM_TYPES.find((u) => u[0] === t) || [0, t])[1];
    return h('div', { class: 'card' },
      h('div', { class: 'dim' }, `Uniform · ${home ? 'home game' : 'road game'} · ${GP.team(game.oppId).name} wear ${name(pick.oppType).toLowerCase()}`),
      h('div', { class: 'kits' }, opt('auto', 'Auto'), ...GP.UNIFORM_TYPES.map(([t, l]) => opt(t, l)),
        ...(noOpp ? [] : [h('span', { class: 'kitvs' }, 'vs'), h('span', { class: 'kitopt' }, kitSprite(pick.opp), h('small', null, GP.team(game.oppId).abbr))])));
  }
  const starText = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  // ---------- team screens: the dashboard, the roster grid, a player's card, the standings ----------
  const lastName = (n) => (n || '').split(' ').slice(-1)[0];
  const stars = (n) => h('span', { class: 'stars' }, '★'.repeat(n), h('span', { class: 'off' }, '★'.repeat(5 - n)));
  // a player's portrait: his own face (picked at random when he was created, and kept) in a team's home jersey
  const portrait = (r, teamId) => {
    if (r.face == null) r.face = GP.rint(0, 999999999);      // players from before portraits get one now
    const c = GP.Pixel.portrait(r.face, GP.kit(teamId || S.teamId, 'home'));
    const img = document.createElement('canvas'); img.width = c.width; img.height = c.height;
    img.getContext('2d').drawImage(c, 0, 0); img.className = 'portrait';
    return img;
  };
  // how close he is to his ceiling: his overall against the overall his caps would give
  const potential = (r) => { const ks = Object.keys(r.caps || {}).filter((k) => k !== 'ovr'); return ks.length ? Math.round(ks.reduce((a, k) => a + r.caps[k], 0) / ks.length) : (r.caps ? r.caps.ovr : r.ovr); };
  // the roster in screen order: starters by slot (a reserve in any empty spot), the bench, then the defense unit
  function rosterOrder() {
    const lineup = GP.lineup(S), ids = new Set(), out = [];
    for (const [slot, pos] of GP.SLOTS) { const r = lineup[slot]; if (!r.filler) ids.add(r.id); out.push({ r, pos, slot, starter: true, side: 'O' }); }
    for (const [slot, pos] of GP.DEF_SLOTS) { const r = lineup[slot]; if (!r.filler) ids.add(r.id); out.push({ r, pos, slot, starter: true, side: 'D' }); }
    S.players.filter((p) => !ids.has(p.id)).sort((a, b) => a.pos.localeCompare(b.pos) || b.ovr - a.ovr)
      .forEach((r) => out.push({ r, pos: r.pos, slot: null, starter: false }));
    for (const [key, label] of GP.UNITS) out.push({ r: S.units[key], pos: key, unit: key, label });
    return out;
  }
  const backBar = (title, back) => h('div', { class: 'hub-head' },
    h('button', { class: 'btn ghost small', onclick: back }, '‹ Back'), h('h1', { class: 'px' }, title), h('span', { class: 'sp' }),
    h('span', { class: 'pill' }, 'Coaching points ', h('b', null, String(S.credits))));

  // A roster card: position and portrait on your team color, then name, stars, overall and a bar showing how
  // far he's grown toward his ceiling. Tap for his card.
  function playerCard(e, i) {
    const me = GP.team(S.teamId), r = e.r;
    if (r.filler) return h('div', { class: 'pcard reserve' },
      h('div', { class: 'top', style: `background:${me.c1}` }, h('span', { class: 'pos' }, e.pos)),
      h('div', { class: 'nm' }, 'Empty'), h('div', { class: 'dim sub' }, `${r.stars}★ reserve fills in`), h('div', { class: 'ovr' }, String(r.ovr)));
    const pot = potential(r);
    return h('button', { class: 'pcard' + (e.starter === false ? ' bench' : ''), onclick: () => renderPlayer(i) },
      h('div', { class: 'top' + (GP.isDef(r.pos) ? ' def' : ''), style: `background-color:${e.unit ? me.c2 : me.c1};color:${e.unit ? me.c1 : me.c2}` },
        h('span', { class: 'pos' }, e.unit ? 'DEF' : e.pos), r.num ? h('span', { class: 'num' }, '#' + r.num) : null,
        e.unit ? h('span', { class: 'unitmark' }, 'UNIT') : portrait(r)),
      h('div', { class: 'nm' }, e.unit ? e.label : lastName(r.name)), stars(r.stars),
      h('div', { class: 'ovrline' }, h('span', { class: 'ovr' }, String(r.ovr)), h('span', { class: 'dim' }, ` / ${pot}`)),
      h('div', { class: 'bar grow' }, h('i', { style: `width:${clamp01(r.ovr / Math.max(1, pot)) * 100}%` })));
  }
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function renderRoster() {
    const hub = $('#hub'); hub.innerHTML = '';
    const order = rosterOrder();
    hub.append(backBar(`Roster ${S.players.length}/${GP.ROSTER_MAX}`, renderHub));
    const grid = (list) => h('div', { class: 'pcards' }, ...list.map(([e, i]) => playerCard(e, i)));
    const idx = order.map((e, i) => [e, i]);
    const avg = (side) => { const st = order.filter((e) => e.side === side); return Math.round(st.reduce((a, e) => a + e.r.ovr, 0) / st.length); };
    hub.append(h('h2', null, `Offense · ${avg('O')} avg`), grid(idx.filter(([e]) => e.starter && e.side === 'O')));
    hub.append(h('h2', null, `Defense · ${avg('D')} avg`), grid(idx.filter(([e]) => e.starter && e.side === 'D')));
    const bench = idx.filter(([e]) => e.starter === false);
    hub.append(h('h2', null, 'Bench'), bench.length ? grid(bench) : h('div', { class: 'card dim' }, 'Nobody on the bench yet.'));
    if (idx.some(([e]) => e.unit)) hub.append(h('h2', null, 'Units'), grid(idx.filter(([e]) => e.unit)));
    show('hub');
  }

  // A player's card: profile on the left, attributes on the right (each bar is his value, the outlined part
  // up to his ceiling), arrows to step through the roster.
  function renderPlayer(i) {
    const order = rosterOrder(), e = order[i];
    if (!e || e.r.filler) return renderRoster();
    const r = e.r, me = GP.team(S.teamId), key = e.unit || r.pos, id = e.unit || r.id;
    const hub = $('#hub'); hub.innerHTML = '';
    const step = (d) => { let j = i; do { j = (j + d + order.length) % order.length; } while (order[j].r.filler && j !== i); renderPlayer(j); };
    hub.append(backBar(e.unit ? e.label : `${e.pos} · ${r.name}`, renderRoster));
    const pot = potential(r);
    const profile = h('div', { class: 'card profile' },
      h('div', { class: 'phead', style: `background:${me.c1};color:${me.c2}` }, e.unit ? h('span', { class: 'unitmark big' }, 'UNIT') : portrait(r),
        h('div', null, h('div', { class: 'px' }, e.unit ? e.label : GP.PLAYER_POS[r.pos]), h('div', { class: 'role' }, e.unit ? 'Defense' : (r.num ? `#${r.num} · ` : '') + (e.starter ? `${e.side === 'D' ? 'Defense' : 'Offense'} starter · ${e.slot}` : 'Bench')))),
      h('div', { class: 'facts' },
        e.unit ? null : h('div', null, h('span', { class: 'dim' }, 'Age'), h('b', null, String(r.age))),
        h('div', null, h('span', { class: 'dim' }, 'Overall'), h('b', null, String(r.ovr))),
        h('div', null, h('span', { class: 'dim' }, 'Potential'), h('b', null, String(pot))),
        h('div', null, h('span', { class: 'dim' }, 'Stars'), stars(r.stars))),
      h('div', { class: 'dim note' }, e.unit ? (GP.UNITS.find((u) => u[0] === e.unit) || [])[2] : GP.derived(key) ? 'His overall comes from his attributes. Stars are fixed for life and set his ceilings.' + (GP.isDef(r.pos) ? ' On the field your coordinator\'s stars add to every defender.' : '') : ''),
      e.unit ? null : h('button', { class: 'btn ghost small', onclick: () => {
        if (confirm(`Release ${r.name}? He leaves the team for good.`)) { GP.release(S, r.id); renderRoster(); }
      } }, 'Release'));
    const attrs = h('div', { class: 'card attrs' }, h('h3', { class: 'px' }, 'Attributes'),
      ...GP.statsFor(key).filter(([k]) => !GP.derived(key) || k !== 'ovr').map(([k, label, hint]) => {
        const val = r.stats[k], cap = r.caps[k], cost = GP.upgradeCost(val, cap);
        return h('div', { class: 'attr', title: hint || '' },
          h('div', { class: 'alabel' }, h('span', null, label), h('b', null, String(val), h('small', { class: 'dim' }, ' / ' + cap))),
          h('div', { class: 'abar' }, h('u', { style: `width:${cap}%` }), h('i', { style: `width:${val}%` })),
          h('button', { class: 'btn small', disabled: S.credits < cost, onclick: () => { if (GP.upgrade(S, id, k)) renderPlayer(i); } },
            cost === Infinity ? 'MAX' : `+1 · ${cost}`));
      }));
    hub.append(h('div', { class: 'pview' },
      h('button', { class: 'arrow', title: 'Previous', onclick: () => step(-1) }, '‹'),
      h('div', { class: 'pbody' }, profile, attrs),
      h('button', { class: 'arrow', title: 'Next', onclick: () => step(1) }, '›')));
    show('hub');
  }

  function renderStandings() {
    const hub = $('#hub'); hub.innerHTML = '';
    hub.append(backBar('Standings', renderHub));
    const seeds = S.phase === 'regular' ? GP.seeds(S, viewConf) : S.playoff.seeds[viewConf];
    const tabs = h('div', { class: 'tabs' }, ...GP.CONFS.map((cn, c) =>
      h('button', { class: 'btn small' + (c === viewConf ? '' : ' ghost'), onclick: () => { viewConf = c; renderStandings(); } }, cn)));
    const tables = h('div', { class: 'card' }, tabs, h('div', { class: 'dim', style: 'font-size:13px;margin:4px 0 8px' }, 'Numbered teams hold a playoff seed'));
    GP.DIVS.forEach((dn, d) => {
      const tb = h('tbody');
      for (const t of GP.divStandings(S, viewConf, d)) {
        const tm = GP.team(t.id), seed = seeds.indexOf(t.id);
        tb.append(h('tr', { class: t.id === S.teamId ? 'me' : '' },
          h('td', null, seed >= 0 ? h('span', { class: 'seed' }, String(seed + 1)) : ''), h('td', null, full(tm)),
          h('td', null, String(t.w)), h('td', null, String(t.l)), h('td', null, String(t.t || 0)), h('td', null, String(t.pf)), h('td', null, String(t.pa))));
      }
      tables.append(h('table', null, h('thead', null, h('tr', null, ...['', dn, 'W', 'L', 'T', 'PF', 'PA'].map((x) => h('th', null, x)))), tb));
    });
    hub.append(tables);
    if (S.history.length) hub.append(h('h2', null, 'History'), h('div', { class: 'card' }, ...S.history.map((x) => h('div', { class: 'dim' }, `Season ${x.season}: ${GP.recText(x)} — ${x.note}`))));
    show('hub');
  }

  // The team page: next game up top, game-day settings, then a tile for each part of running the team.
  function renderHub() {
    if (S.phase === 'offseason' && !S.draft) GP.startDraft(S);     // saves made before the draft existed
    const hub = $('#hub'); hub.innerHTML = '';
    const me = GP.team(S.teamId), rec = GP.rec(S, S.teamId), game = GP.currentGame(S);

    hub.append(h('div', { class: 'hub-head teamhead', style: `--c1:${me.c1};--c2:${me.c2}` },
      badge(me), h('div', null, h('h1', { class: 'px' }, full(me)), h('div', { class: 'dim' }, `${GP.CONFS[me.conf]} ${GP.DIVS[me.div]} · Season ${S.season}`)),
      h('span', { class: 'sp' }),
      h('span', { class: 'pill big' }, h('b', null, GP.recText(rec))),
      h('span', { class: 'pill' }, 'Coaching points ', h('b', null, String(S.credits))),
      h('button', { class: 'btn ghost small', onclick: renderTitle }, 'Menu')));


    // next game / bye / offseason on the left, your team on the right (side by side in landscape)
    const L = h('div', { class: 'hub-col' }), Rt = h('div', { class: 'hub-col' });
    hub.append(h('div', { class: 'hub-cols' }, L, Rt));
    if (game && game.bye) {
      L.append(h('h2', null, (game.regular ? '' : 'Playoffs — ') + game.label), h('div', { class: 'card next' },
        h('div', null, h('div', { class: 'vs' }, game.regular ? 'Bye week' : 'First-round bye'),
          h('div', { class: 'dim' }, game.regular ? 'No game this week: the rest of the league plays, and you are back next week.' : 'You earned the top seed. Rest up while the wild cards play.')),
        h('span', { style: 'flex:1' }),
        h('button', { class: 'btn', onclick: () => { GP.advance(S, null, null); renderHub(); } }, 'Advance')));
    } else if (game) {
      const o = GP.team(game.oppId), or = GP.rec(S, game.oppId);
      // the matchup: you and them side by side, then a big Play button (uniform and defense come in the pre-game dialog)
      const side = (t, r, you) => h('div', { class: 'tm' }, badge(t), h('div', { class: 'tmn px' }, t.abbr),
        h('div', { class: 'dim' }, GP.recText(r)), h('div', { class: 'dim tmr' }, `OFF ${r.off} · DEF ${r.def}`),
        you ? null : h('div', { class: 'dim tmr' }, `DC ${starText(GP.oppDC(S, game.oppId))}`));
      L.append(h('h2', null, (S.phase === 'playoffs' ? 'Playoffs — ' : '') + game.label), h('div', { class: 'card gamecard' },
        h('div', { class: 'vsline px' }, (game.home === false ? 'at ' : 'vs ') + full(o)),
        h('div', { class: 'matchup' }, side(me, rec, true), h('div', { class: 'at px' }, game.home === false ? 'AT' : 'VS'), side(o, or, false)),
        h('button', { class: 'btn play big', onclick: () => pregame(game) }, 'Play game'),
        h('button', { class: 'btn ghost filmbtn', onclick: () => renderFilm(game) }, 'Watch opponent film')));
    } else {
      const ch = GP.team(S.champion);
      L.append(h('h2', null, `Season ${S.season} complete`), h('div', { class: 'card next' },
        badge(ch),
        h('div', null, h('div', { class: 'vs px' }, S.champion === S.teamId ? 'You are the champions!' : `${full(ch)} win the title`),
          h('div', { class: 'dim' }, `Your season: ${GP.recText(rec)} · ${S.seasonNote}`),
          h('div', { class: 'dim' }, 'Young players develop and veterans decline over the offseason.')),
        h('span', { style: 'flex:1' }),
        h('div', { class: 'stack' },
          h('button', { class: 'btn', onclick: renderDraft }, S.draft && !S.draft.done ? 'Go to the draft' : 'Review the draft'),
          h('button', { class: 'btn ghost', onclick: () => {
            if (S.draft && !S.draft.done && GP.myPicks(S).length && !confirm('Skip the rest of the draft? Your remaining picks are passed.')) return;
            GP.newSeason(S); renderHub();
          } }, 'Start next season'))));
    }

    // tiles
    const order = rosterOrder(), starters = order.filter((e) => e.starter && !e.r.filler);
    const avgStars = starters.length ? (starters.reduce((a, e) => a + e.r.stars, 0) / starters.length).toFixed(1) : '0';
    const holes = order.filter((e) => e.r.filler).length;
    const place = GP.divStandings(S, me.conf, me.div).findIndex((t) => t.id === S.teamId) + 1;
    const ts = GP.tradeStatus(S);
    const tile = (title, line, fn, opts) => h('button', { class: 'tile' + (opts && opts.off ? ' off' : ''), disabled: !!(opts && opts.off), onclick: fn },
      h('div', { class: 'tt px' }, title), h('div', { class: 'tl dim' }, line), h('span', { class: 'go' }, '›'));
    Rt.append(h('h2', null, 'Your team'), h('div', { class: 'tiles' },
      tile('Roster', `${S.players.length}/${GP.ROSTER_MAX} players · starters avg ${avgStars}★` + (holes ? ` · ${holes} empty spot${holes > 1 ? 's' : ''}` : ''), renderRoster),
      tile('Standings', `${['1st', '2nd', '3rd', '4th'][place - 1] || ''} in the ${GP.CONFS[me.conf]} ${GP.DIVS[me.div]}`, renderStandings),
      tile('Coaching staff', `OC ${starText(S.staff.OC.stars)} · DC ${starText(S.staff.DC.stars)}`, renderStaff),
      tile('Trades', ts.note, () => renderTrade(), { off: !ts.open }),
      S.phase === 'offseason' ? tile('Draft', S.draft && !S.draft.done ? 'On the clock soon' : 'Review the picks', renderDraft) : null,
      tile('Difficulty', GP.DIFFICULTY[S.difficulty || 'normal'] + ' · tap to change', () => {
        const ord = ['easy', 'normal', 'hard']; S.difficulty = ord[(ord.indexOf(S.difficulty || 'normal') + 1) % 3]; GP.save(S); renderHub();
      })));
    show('hub');
  }

  // ---------- coaching staff ----------
  // The coaching staff, laid out like the roster: your coordinators first, as cards with a portrait in your team
  // colors, then the coaches available for hire this season (in a plain gray polo until you hire them).
  const coachFace = (c) => {
    if (c.face != null) return c.face;
    let x = 7; for (const ch of c.name + c.role) x = (x * 31 + ch.charCodeAt(0)) >>> 0;   // the same face every time
    return x;
  };
  const coachPortrait = (c, kit) => {
    const src = GP.Pixel.portrait(coachFace(c), kit), img = document.createElement('canvas');
    img.width = src.width; img.height = src.height; img.getContext('2d').drawImage(src, 0, 0); img.className = 'portrait';
    return img;
  };
  function renderStaff() {
    const hub = $('#hub'); hub.innerHTML = '';
    const pool = GP.staffPool(S), me = GP.team(S.teamId);
    hub.append(backBar('Coaching staff', renderHub));
    const what = {
      OC: 'Marks his play call before every snap; more stars, the better he reads the defense and the situation.',
      DC: 'Marks his coverage call on defense and runs it when you simulate; more stars, more stops and turnovers.',
    };
    const card = (c, mine, foot) => h('div', { class: 'pcard ccard' + (mine ? '' : ' hire') },
      h('div', { class: 'top', style: mine ? `background-color:${me.c1};color:${me.c2}` : 'background-color:#3a455c;color:#cbd5e0' },
        h('span', { class: 'pos' }, c.role), h('span', { class: 'num' }, `age ${c.age}`),
        coachPortrait(c, mine ? { jersey: me.c2, number: me.c1 } : { jersey: '#5b6578', number: '#cbd5e0' })),   // a staff polo in the team's second color
      h('div', { class: 'nm' }, lastName(c.name)), h('div', { class: 'dim sub' }, c.name), stars(c.stars),
      h('div', { class: 'cskills' }, ...c.skills.map((k) => h('div', { class: 'skill' }, h('b', null, GP.SKILLS[c.role][k][0]), h('span', { class: 'dim' }, ' — ' + GP.SKILLS[c.role][k][1])))),
      foot);
    hub.append(h('h2', null, 'Your staff'), h('div', { class: 'ccards' },
      ...['OC', 'DC'].map((role) => card(S.staff[role], true, h('div', { class: 'dim cwhat' }, `${GP.ROLES[role]}. ${what[role]}`)))));
    hub.append(h('h2', null, 'Available for hire this season'));
    for (const role of ['OC', 'DC']) {
      hub.append(h('h3', { class: 'rhead' }, GP.ROLES[role] + 's'));
      if (!pool[role].length) { hub.append(h('div', { class: 'card dim' }, 'Nobody else is available until next season.')); continue; }
      hub.append(h('div', { class: 'ccards' }, ...pool[role].map((c, i) => {
        const cost = GP.STAFF_COST[c.stars];
        return card(c, false, h('button', { class: 'btn small chire', disabled: S.credits < cost, onclick: () => {
          if (confirm(`Hire ${c.name} for ${cost} coaching point${cost === 1 ? '' : 's'}? ${S.staff[role].name} will leave.`) && GP.hire(S, role, i)) renderStaff();
        } }, cost ? `Hire · ${cost} pt${cost === 1 ? '' : 's'}` : 'Hire · free'));
      })));
    }
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

    const tabs = h('div', { class: 'tabs' }, ...['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'K', 'DL', 'LB', 'CB', 'S'].map((t) =>
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

  // Film on the next opponent: your OC breaks down their defense, your DC their offense. Every tip is true for
  // this team this season; how many you see grows through the season and with your coordinators' stars.
  function renderFilm(game) {
    const hub = $('#hub'); hub.innerHTML = '';
    const o = GP.team(game.oppId), f = GP.film(S, game.oppId), me = GP.team(S.teamId);
    hub.append(backBar(`Film · ${o.name}`, renderHub));
    const total = f.off.length + f.def.length;
    const col = (role, tips, title) => {
      const c = S.staff[role], rv = GP.filmReveal(S, c.stars), shown = tips.slice(0, rv.n), locked = tips.length - shown.length;
      const nextWk = rv.week + (3 - ((rv.week - 1) % 3));
      return h('div', { class: 'filmcol' },
        h('div', { class: 'filmcoach' },
          h('div', { class: 'fc-pic', style: `background:${me.c1}` }, coachPortrait(c, { jersey: me.c2, number: me.c1 })),
          h('div', null, h('div', { class: 'px fc-role' }, `${role} · ${title}`), h('div', null, h('b', null, c.name), ' ', stars(c.stars)),
            h('div', { class: 'dim fc-say' }, shown.length ? `"Here's what I've got on ${o.name}${rv.detail ? ', and how we beat it' : ''}."` : '"Nothing yet."'))),
        ...shown.map((t, i) => h('div', { class: 'card tip filmtip' }, h('div', { class: 'ft-head px' }, `${i + 1}. ${t.head}`), h('div', null, t.text),
          rv.detail ? h('div', { class: 'ft-fix' }, '→ ' + t.fix) : null)),
        locked ? h('div', { class: 'card filmtip locked dim' }, `${locked} more on tape. ` + (rv.week < 14 ? `More by week ${Math.min(nextWk, 14)}` : 'A better coordinator would see more') + (c.stars < 5 ? `; a better ${role} sees more.` : '.')) : null,
        !rv.detail ? h('div', { class: 'dim ft-note' }, 'From week 6 (or with a 4-star coordinator) each tip comes with how to beat it.') : null);
    };
    const seen = GP.filmReveal(S, S.staff.OC.stars).n + GP.filmReveal(S, S.staff.DC.stars).n;
    hub.append(h('div', { class: 'dim film-sub' }, `${game.label} · ${game.home === false ? 'at' : 'vs'} ${full(o)} · ${Math.min(seen, total)} of ${total} tendencies on tape`));
    hub.append(h('div', { class: 'filmcols' }, col('DC', f.off, 'their offense'), col('OC', f.def, 'their defense')));
    hub.append(h('div', { class: 'film-go' }, h('button', { class: 'btn play', onclick: () => pregame(game) }, 'Play game')));
    show('hub');
  }
  // Between Play game and kickoff: pick the uniform and whether you play defense, then kick off.
  function pregame(game) {
    let box = document.getElementById('pregame');
    if (!box) { box = document.createElement('div'); box.id = 'pregame'; document.body.append(box); }
    const close = () => box.remove(), redraw = () => pregame(game);
    const o = GP.team(game.oppId), pd = S.playDefense !== false, setPD = (v) => { S.playDefense = v; GP.save(S); redraw(); };
    box.innerHTML = '';
    box.onclick = (e) => { if (e.target === box) close(); };          // a tap outside the dialog closes it
    box.append(h('div', { class: 'pg-box', role: 'dialog', 'aria-label': 'Game setup' },
      h('div', { class: 'pg-head' }, h('h3', { class: 'px' }, `${game.home === false ? 'at' : 'vs'} ${full(o)}`),
        h('span', { class: 'pg-opp' }, kitSprite(GP.matchKits(S.teamId, game.oppId, game.home !== false, S.uniform || 'auto').opp)), h('span', { class: 'sp' }),
        h('button', { class: 'btn ghost small', onclick: close }, 'Back')),
      h('div', { class: 'pg-body' },
        uniformCard(game, redraw, true),
        h('div', { class: 'card pg-def' }, h('div', null, h('b', null, 'Defense'),
          h('div', { class: 'dim' }, pd ? 'You call the coverage on every opponent snap' : 'Opponent drives are simulated')),
          h('div', { class: 'seg' }, h('button', { class: 'btn small' + (pd ? '' : ' ghost'), onclick: () => setPD(true) }, 'Play it'),
            h('button', { class: 'btn small' + (pd ? ' ghost' : ''), onclick: () => setPD(false) }, 'Simulate')),
          h('button', { class: 'btn play pg-go', onclick: () => { close(); startMatch(game); } }, 'Kick off')))));
  }
  function startMatch(game) {
    const or = GP.rec(S, game.oppId);
    show('match');
    GP.match = new GP.Match($('#field'), {
      me: GP.team(S.teamId), opp: GP.team(game.oppId), roster: GP.lineup(S), staff: S.staff, difficulty: S.difficulty || 'normal',
      oppOff: or.off, oppDef: or.def, oppDC: GP.oppDC(S, game.oppId),
      playoff: S.phase === 'playoffs', oppSeed: `${game.oppId}|${S.season}`, oppScheme: GP.teamScheme(game.oppId, S.season), home: game.home !== false, uniform: S.uniform || 'auto', playDefense: S.playDefense !== false, label: game.label,
      onEnd: (my, opp, st, info) => {
        GP.match = null; GP.advance(S, my, opp);
        if (info && info.forfeit) { S.news = (S.news || []).concat(`You forfeited against ${full(GP.team(game.oppId))}. It counts as a ${my}-${opp} loss.`); GP.save(S); }
        renderHub();
      },
    });
  }

  renderTitle();
})();
