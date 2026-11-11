// League data, career state, season simulation.
(function () {
  const GP = (window.GP = window.GP || {});
  GP.rnd = (a, b) => a + Math.random() * (b - a);
  GP.rint = (a, b) => Math.floor(GP.rnd(a, b + 1));
  GP.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  GP.pick = (a) => a[Math.floor(Math.random() * a.length)];

  GP.CONFS = ['American', 'National'];
  GP.DIVS = ['North', 'East', 'South', 'West'];
  GP.TEAMS = [
    { id: 'smy', conf: 0, div: 0, city: 'Summit', name: 'Yetis', abbr: 'SMY', c1: '#3a86ff', c2: '#e0fbfc' },
    { id: 'gln', conf: 0, div: 0, city: 'Glacier', name: 'Narwhals', abbr: 'GLN', c1: '#006d77', c2: '#ffddd2' },
    { id: 'ivf', conf: 0, div: 0, city: 'Iron Valley', name: 'Forgers', abbr: 'IVF', c1: '#4a4e69', c2: '#ff7b00' },
    { id: 'tlm', conf: 0, div: 0, city: 'Timberline', name: 'Moose', abbr: 'TLM', c1: '#5a3e2b', c2: '#e9c46a' },
    { id: 'hbk', conf: 0, div: 1, city: 'Harbor City', name: 'Krakens', abbr: 'HBK', c1: '#0e7c86', c2: '#f4d35e' },
    { id: 'cps', conf: 0, div: 1, city: 'Capital', name: 'Sentinels', abbr: 'CPS', c1: '#2b2d42', c2: '#ef233c' },
    { id: 'gbg', conf: 0, div: 1, city: 'Granite Bay', name: 'Gulls', abbr: 'GBG', c1: '#577590', c2: '#f9f9f9' },
    { id: 'opf', conf: 0, div: 1, city: 'Old Port', name: 'Foghorns', abbr: 'OPF', c1: '#283618', c2: '#fefae0' },
    { id: 'byg', conf: 0, div: 2, city: 'Bayou', name: 'Gators', abbr: 'BYG', c1: '#386641', c2: '#f2e8cf' },
    { id: 'mgf', conf: 0, div: 2, city: 'Magnolia', name: 'Fireflies', abbr: 'MGF', c1: '#3c096c', c2: '#e0ff4f' },
    { id: 'gss', conf: 0, div: 2, city: 'Gulfside', name: 'Stingrays', abbr: 'GSS', c1: '#0077b6', c2: '#ffd166' },
    { id: 'dlr', conf: 0, div: 2, city: 'Delta', name: 'Riverboats', abbr: 'DLR', c1: '#780000', c2: '#fdf0d5' },
    { id: 'cys', conf: 0, div: 3, city: 'Canyon', name: 'Scorpions', abbr: 'CYS', c1: '#c1121f', c2: '#fdf0d5' },
    { id: 'dbc', conf: 0, div: 3, city: 'Dustbowl', name: 'Coyotes', abbr: 'DBC', c1: '#b5651d', c2: '#fbe9d0' },
    { id: 'msr', conf: 0, div: 3, city: 'Mesa', name: 'Roadrunners', abbr: 'MSR', c1: '#e76f51', c2: '#264653' },
    { id: 'srp', conf: 0, div: 3, city: 'Sierra', name: 'Prospectors', abbr: 'SRP', c1: '#6b705c', c2: '#ffe8d6' },
    { id: 'prt', conf: 1, div: 0, city: 'Prairie', name: 'Stampede', abbr: 'PRT', c1: '#1d3557', c2: '#ffb703' },
    { id: 'lsl', conf: 1, div: 0, city: 'Lakeshore', name: 'Loons', abbr: 'LSL', c1: '#14213d', c2: '#e5e5e5' },
    { id: 'tfo', conf: 1, div: 0, city: 'Twin Forks', name: 'Otters', abbr: 'TFO', c1: '#7f5539', c2: '#ede0d4' },
    { id: 'fth', conf: 1, div: 0, city: 'Foundry Town', name: 'Hammers', abbr: 'FTH', c1: '#343a40', c2: '#f77f00' },
    { id: 'nbc', conf: 1, div: 1, city: 'Neon Bay', name: 'Comets', abbr: 'NBC', c1: '#7b2cbf', c2: '#5df2d6' },
    { id: 'lso', conf: 1, div: 1, city: 'Liberty Square', name: 'Owls', abbr: 'LSO', c1: '#22223b', c2: '#c9ada7' },
    { id: 'byb', conf: 1, div: 1, city: 'Brickyard', name: 'Bulldogs', abbr: 'BYB', c1: '#9b2226', c2: '#e9d8a6' },
    { id: 'twh', conf: 1, div: 1, city: 'Tidewater', name: 'Herons', abbr: 'TWH', c1: '#005f73', c2: '#94d2bd' },
    { id: 'sba', conf: 1, div: 2, city: 'Sunbelt', name: 'Armadillos', abbr: 'SBA', c1: '#bc6c25', c2: '#fefae0' },
    { id: 'pmo', conf: 1, div: 2, city: 'Palmetto', name: 'Ospreys', abbr: 'PMO', c1: '#2d6a4f', c2: '#d8f3dc' },
    { id: 'ozo', conf: 1, div: 2, city: 'Ozark', name: 'Outlaws', abbr: 'OZO', c1: '#3d0c11', c2: '#f4a261' },
    { id: 'rvv', conf: 1, div: 2, city: 'Rio Vista', name: 'Vaqueros', abbr: 'RVV', c1: '#8338ec', c2: '#ffbe0b' },
    { id: 'rwl', conf: 1, div: 3, city: 'Redwood', name: 'Lumberjacks', abbr: 'RWL', c1: '#9d0208', c2: '#ffd6a5' },
    { id: 'csq', conf: 1, div: 3, city: 'Cascade', name: 'Sasquatch', abbr: 'CSQ', c1: '#1b4332', c2: '#b7e4c7' },
    { id: 'vce', conf: 1, div: 3, city: 'Volcano Coast', name: 'Embers', abbr: 'VCE', c1: '#370617', c2: '#ffba08' },
    { id: 'gcc', conf: 1, div: 3, city: 'Golden Coast', name: 'Condors', abbr: 'GCC', c1: '#003049', c2: '#fcbf49' },
  ];
  GP.team = (id) => GP.TEAMS.find((t) => t.id === id);

  GP.POS = [
    { key: 'QB', label: 'Quarterback', desc: 'Throw range and accuracy' },
    { key: 'RB', label: 'Running Back', desc: 'Speed, agility, catching, power, stamina' },
    { key: 'WR1', label: 'Wide Receiver', desc: 'Speed and hands' },
    { key: 'WR2', label: 'Wide Receiver', desc: 'Speed and hands' },
    { key: 'TE', label: 'Tight End', desc: 'Hands and power' },
    { key: 'OL', label: 'Offensive Line', desc: 'Time in the pocket', unit: true },
    { key: 'DEF', label: 'Defense', desc: 'Stops simulated enemy drives', unit: true },
    { key: 'K', label: 'Kicker', desc: 'Wider sweet spot on kicks' },
  ];
  const FIRST = ['Dax', 'Milo', 'Otis', 'Rafe', 'Jett', 'Cole', 'Nico', 'Theo', 'Bram', 'Zeke', 'Arlo', 'Quinn', 'Remy', 'Sol', 'Tate', 'Vance', 'Wes', 'Idris', 'Kai', 'Luca'];
  const LAST = ['Okafor', 'Brandt', 'Salazar', 'Whitlock', 'Nakamura', 'Draper', 'Molina', 'Castellan', 'Pruitt', 'Vasquez', 'Hollis', 'Arden', 'Mbeki', 'Lindqvist', 'Rourke', 'Tanaka', 'Fairbanks', 'Osei', 'Kowalski', 'Delacroix'];

  const shuffle = (a) => a.slice().sort(() => Math.random() - 0.5);
  const RR4 = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
  // 14 games: 6 in-division (home and away), 4 against another division in the conference,
  // 4 against a division from the other conference. Pairings rotate by season.
  function buildSchedule(season) {
    const div = {};
    for (let c = 0; c < 2; c++) for (let d = 0; d < 4; d++)
      div[c + '' + d] = shuffle(GP.TEAMS.filter((t) => t.conf === c && t.div === d).map((t) => t.id));
    const weeks = [];
    for (let rep = 0; rep < 2; rep++) for (const round of RR4) {
      const wk = [];
      for (const k in div) for (const [i, j] of round) wk.push([div[k][i], div[k][j]]);
      weeks.push(wk);
    }
    const cross = (wk, A, B, r) => { for (let i = 0; i < 4; i++) wk.push([A[i], B[(i + r) % 4]]); };
    for (let r = 0; r < 4; r++) {
      const wk = [];
      for (let c = 0; c < 2; c++) for (const [a, b] of RR4[season % 3]) cross(wk, div[c + '' + a], div[c + '' + b], r);
      weeks.push(wk);
    }
    for (let r = 0; r < 4; r++) {
      const wk = [];
      for (let d = 0; d < 4; d++) cross(wk, div['0' + d], div['1' + ((d + season) % 4)], r);
      weeks.push(wk);
    }
    return shuffle(weeks);
  }

  // Per-position stats. A QB has five real stats and a derived overall; other positions have a single
  // overall stat for now (plus agility for the running back).
  GP.STATS = {
    QB: [['arm', 'Arm strength', 'How far and how fast he throws'], ['acc', 'Accuracy', 'How close throws land to the target'],
         ['spd', 'Speed', 'Scrambling speed'], ['agi', 'Agility', 'Juke window and recovery when scrambling'],
         ['sta', 'Stamina', 'How slowly he tires during a drive']],
    RB: [['spd', 'Speed', 'Top running speed'], ['agi', 'Agility', 'Juke window, recovery, beating tacklers'],
         ['hands', 'Catching', 'How reliably he catches passes'], ['pow', 'Power', 'Breaking tackles, falling forward, holding on to the ball'],
         ['sta', 'Stamina', 'How little he slows down on long runs']],
  };
  // both wide receivers share one stat list
  GP.STATS.WR1 = GP.STATS.WR2 = [
    ['hands', 'Catching', 'Catch chance on every throw to him'], ['spd', 'Speed', 'Route and open-field speed'],
    ['agi', 'Agility', 'Sharper route cuts and jukes after the catch'], ['sta', 'Stamina', 'How little he slows on deep routes and long runs'],
    ['pow', 'Strength', 'Contested catches, breaking tackles, falling forward']];
  GP.statsFor = (key) => GP.STATS[key] || [['ovr', 'Overall', '']];
  GP.derived = (key) => key === 'QB' || key === 'RB' || key === 'WR1' || key === 'WR2';   // overall is computed from the stats
  const PHYSICAL = { spd: 1, agi: 1, sta: 1 };      // fade from 29; skills (and overall) from 31

  // Stars (0-5, fixed for life) set the general level of a player's caps; each stat gets its own cap
  // scattered around that level, so two players with the same stars can have different strengths.
  GP.capLevel = (stars) => 52 + stars * 8.5;
  GP.refresh = function (r, key) {
    if (GP.derived(key)) {
      const t = r.stats;
      r.ovr = Math.round(key === 'QB'
        ? t.arm * 0.3 + t.acc * 0.35 + t.spd * 0.1 + t.agi * 0.05 + t.sta * 0.2
        : key === 'RB' ? t.spd * 0.3 + t.pow * 0.25 + t.agi * 0.2 + t.sta * 0.15 + t.hands * 0.1
        : t.hands * 0.3 + t.spd * 0.3 + t.agi * 0.15 + t.sta * 0.15 + t.pow * 0.1);
    } else r.ovr = r.stats.ovr;
    if (r.stats.agi != null) r.agi = r.stats.agi;
    return r;
  };
  function genPlayer(key, stars, age, unit) {
    const r = { name: unit ? 'Unit' : GP.pick(FIRST) + ' ' + GP.pick(LAST), age: unit ? null : age, stars, stats: {}, caps: {} };
    for (const [k] of GP.statsFor(key)) {
      const cap = GP.clamp(Math.round(GP.capLevel(stars) + GP.rnd(-7, 7)), 40, 99);
      r.caps[k] = cap;
      const young = age != null && age <= 24;      // young players start further below their caps
      r.stats[k] = GP.clamp(cap - GP.rint(young ? 6 : 2, young ? 16 : 10), 35, cap);
    }
    return GP.refresh(r, key);
  }
  // Older saves: give each player stars and caps that fit his current ratings, never lowering them.
  function migratePlayer(r, key) {
    if (r.stats) return false;
    const base = r.ovr, stars = GP.clamp(Math.round((base - 52) / 8.5) + 1, 0, 5);
    r.stars = stars; r.stats = {}; r.caps = {};
    for (const [k] of GP.statsFor(key)) {
      const v = k === 'agi' && r.agi != null ? r.agi : k === 'ovr' ? base : GP.clamp(base + GP.rint(-6, 6), 35, 99);
      r.stats[k] = v;
      r.caps[k] = GP.clamp(Math.max(Math.round(GP.capLevel(stars) + GP.rnd(-7, 7)), v + GP.rint(0, 4)), v, 99);
    }
    GP.refresh(r, key);
    return true;
  }

  // A position that gained stats since the save was made: fill the new ones from his old overall
  // (each with a cap at least as high), and drop the old overall stat if it is now derived.
  function addMissingStats(r, key) {
    let changed = false;
    const base = r.stats.ovr != null ? r.stats.ovr : r.ovr, baseCap = r.caps.ovr != null ? r.caps.ovr : GP.capLevel(r.stars);
    for (const [k] of GP.statsFor(key)) {
      if (r.stats[k] != null) continue;
      const v = GP.clamp(base + GP.rint(-6, 6), 35, 99);
      r.stats[k] = v; r.caps[k] = GP.clamp(Math.max(Math.round(baseCap + GP.rnd(-5, 5)), v), v, 99);
      changed = true;
    }
    if (GP.derived(key) && r.stats.ovr != null) { delete r.stats.ovr; delete r.caps.ovr; changed = true; }
    if (changed) GP.refresh(r, key);
    return changed;
  }

  GP.newCareer = function (teamId) {
    const roster = {};
    for (const p of GP.POS) roster[p.key] = genPlayer(p.key, GP.pick([2, 2, 3, 3, 3]), GP.rint(22, 29), p.unit);
    const s = {
      v: 2, teamId, season: 1, week: 0, credits: 4, roster, phase: 'regular', playoff: null, champion: null, history: [],
      teams: GP.TEAMS.map((t) => ({ id: t.id, off: GP.rint(64, 84), def: GP.rint(64, 84), w: 0, l: 0, pf: 0, pa: 0 })),
      schedule: buildSchedule(1),
    };
    GP.syncUser(s);
    return s;
  };

  // Keep the user's league entry in step with their roster.
  GP.syncUser = function (s) {
    const r = s.roster, me = GP.rec(s, s.teamId);
    me.off = Math.round((r.QB.ovr + r.RB.ovr + r.WR1.ovr + r.WR2.ovr + r.TE.ovr + r.OL.ovr) / 6);
    me.def = r.DEF.ovr;
  };
  GP.rec = (s, id) => s.teams.find((t) => t.id === id);
  const byRecord = (a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa);
  GP.divStandings = (s, conf, div) =>
    s.teams.filter((t) => { const m = GP.team(t.id); return m.conf === conf && m.div === div; }).sort(byRecord);
  // Six seeds per conference: four division winners, then two wild cards.
  GP.seeds = function (s, conf) {
    const winners = [0, 1, 2, 3].map((d) => GP.divStandings(s, conf, d)[0]).sort(byRecord);
    const rest = s.teams.filter((t) => GP.team(t.id).conf === conf && !winners.includes(t)).sort(byRecord);
    return [...winners, ...rest.slice(0, 2)].map((t) => t.id);
  };
  GP.ROUNDS = ['Wild Card', 'Divisional Round', 'Conference Championship', 'Championship Game'];
  function buildRound(p) {
    const g = [];
    if (p.round === 3) g.push([p.alive[0][0], p.alive[1][0]]);
    else for (const a of p.alive) {
      if (p.round === 0) g.push([a[2], a[5]], [a[3], a[4]]);
      else if (p.round === 1) g.push([a[0], a[3]], [a[1], a[2]]);
      else g.push([a[0], a[1]]);
    }
    p.games = g;
  }
  // Plays one playoff round; userWon is true/false for the user's game, null if they have none.
  function playRound(s, userWon) {
    const p = s.playoff, me = s.teamId, out = [];
    for (const [a, b] of p.games) {
      let w;
      if ((a === me || b === me) && userWon != null) w = userWon ? me : a === me ? b : a;
      else { const [pa, pb] = simGame(s, a, b); w = pa > pb ? a : b; }
      out.push(w === a ? b : a);
    }
    p.alive = p.alive.map((l) => l.filter((id) => !out.includes(id)));
    p.round++;
    if (p.round > 3) return p.alive.flat()[0];
    buildRound(p);
    return null;
  }

  function simPts(off, def) {
    let pts = 0;
    const pTD = GP.clamp(0.27 + (off - def) * 0.008, 0.08, 0.6);
    for (let i = 0; i < 8; i++) {
      const r = Math.random();
      if (r < pTD) pts += 7; else if (r < pTD + 0.14) pts += 3;
    }
    return pts;
  }
  function simGame(s, a, b) {
    const A = GP.rec(s, a), B = GP.rec(s, b);
    let pa = simPts(A.off, B.def), pb = simPts(B.off, A.def);
    if (pa === pb) Math.random() < 0.5 ? (pa += 3) : (pb += 3);
    return [pa, pb];
  }
  function record(s, a, b, pa, pb) {
    const A = GP.rec(s, a), B = GP.rec(s, b);
    A.pf += pa; A.pa += pb; B.pf += pb; B.pa += pa;
    if (pa > pb) { A.w++; B.l++; } else { B.w++; A.l++; }
  }

  GP.currentGame = function (s) {
    let pair, label;
    if (s.phase === 'regular') { pair = s.schedule[s.week].find((p) => p.includes(s.teamId)); label = `Week ${s.week + 1} of ${s.schedule.length}`; }
    else if (s.phase === 'playoffs') {
      label = GP.ROUNDS[s.playoff.round];
      pair = s.playoff.games.find((p) => p.includes(s.teamId));
      if (!pair) return { bye: true, label };
    } else return null;
    return { oppId: pair[0] === s.teamId ? pair[1] : pair[0], label };
  };

  function endSeason(s, champion, note) {
    s.champion = champion; s.phase = 'offseason'; s.seasonNote = note;
    const me = GP.rec(s, s.teamId);
    s.history.push({ season: s.season, w: me.w, l: me.l, note });
  }

  // Apply the user's result (pass nulls on a playoff bye) and simulate everything else that week.
  GP.advance = function (s, myPts, oppPts) {
    const g = GP.currentGame(s), me = s.teamId, played = myPts != null, won = played && myPts > oppPts;
    let earned = 0, champ = null;
    const simOut = () => { while (!champ) champ = playRound(s, null); };
    if (s.phase === 'regular') {
      for (const [a, b] of s.schedule[s.week]) {
        if (a === me || b === me) record(s, me, g.oppId, myPts, oppPts);
        else { const [pa, pb] = simGame(s, a, b); record(s, a, b, pa, pb); }
      }
      earned = won ? 2 : 1;
      s.week++;
      if (s.week >= s.schedule.length) {
        const seeds = [GP.seeds(s, 0), GP.seeds(s, 1)];
        s.playoff = { round: 0, seeds, alive: seeds.map((l) => l.slice()), games: [] };
        buildRound(s.playoff);
        s.phase = 'playoffs';
        if (!seeds.flat().includes(me)) { simOut(); endSeason(s, champ, 'Missed the playoffs'); }
      }
    } else {
      const label = GP.ROUNDS[s.playoff.round];
      if (played) earned = won ? 4 : 2;
      champ = playRound(s, played ? won : null);
      if (champ === me) { earned += 5; endSeason(s, me, 'CHAMPIONS'); }
      else if (champ || !s.playoff.alive.flat().includes(me)) { simOut(); endSeason(s, champ, 'Lost in the ' + label); }
    }
    s.credits += earned;
    GP.save(s);
    return earned;
  };

  GP.newSeason = function (s) {
    s.season++; s.week = 0; s.phase = 'regular'; s.playoff = null; s.champion = null;
    for (const p of GP.POS) {
      const r = s.roster[p.key];
      if (r.age == null) continue;
      r.age++;
      if (r.age >= 36) {                     // retirement: a rookie with fresh stars takes over
        const kid = genPlayer(p.key, GP.pick([0, 1, 1, 2, 2, 2, 3, 3, 4, 5]), 22);
        kid.rookie = true; s.roster[p.key] = kid; continue;
      }
      for (const [k] of GP.statsFor(p.key)) {
        let v = r.stats[k];
        if (r.age <= 26) v += GP.rint(0, 2);
        else if (r.age >= (PHYSICAL[k] ? 29 : 31)) v -= GP.rint(1, PHYSICAL[k] ? 3 : 4);
        r.stats[k] = GP.clamp(v, 35, r.caps[k]);
      }
      GP.refresh(r, p.key);
    }
    for (const t of s.teams) {
      t.w = t.l = t.pf = t.pa = 0;
      if (t.id !== s.teamId) { t.off = GP.clamp(t.off + GP.rint(-3, 3), 60, 92); t.def = GP.clamp(t.def + GP.rint(-3, 3), 60, 92); }
    }
    s.schedule = buildSchedule(s.season);
    GP.syncUser(s); GP.save(s);
  };

  // Cost of +1 to a stat; Infinity once it reaches the player's cap for that stat.
  GP.upgradeCost = (val, cap) => (val >= (cap == null ? 99 : cap) ? Infinity : val >= 85 ? 2 : 1);
  GP.upgrade = function (s, key, stat) {
    const r = s.roster[key], c = GP.upgradeCost(r.stats[stat], r.caps[stat]);
    if (s.credits < c) return false;
    s.credits -= c; r.stats[stat]++; GP.refresh(r, key); GP.syncUser(s); GP.save(s);
    return true;
  };

  const KEY = 'pocket-gridiron-save';
  GP.save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  GP.load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (!s || s.v !== 2) return null;
      // saves from before agility existed: give the current back a rating near his overall
      if (s.roster.RB.agi == null && !s.roster.RB.stats) s.roster.RB.agi = GP.clamp(s.roster.RB.ovr + GP.rint(-6, 6), 40, 99);
      // saves from before stars and per-stat caps
      let changed = false;
      for (const p of GP.POS) changed = migratePlayer(s.roster[p.key], p.key) || changed;
      for (const p of GP.POS) changed = addMissingStats(s.roster[p.key], p.key) || changed;
      if (changed) { GP.syncUser(s); GP.save(s); }
      return s;
    } catch (e) { return null; }
  };
  GP.wipe = () => { try { localStorage.removeItem(KEY); } catch (e) {} };
})();
