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
    { key: 'TE', label: 'Tight End', desc: 'Catching, strength, blocking, speed, stamina' },
    { key: 'OL', label: 'Offensive Line', desc: 'Time in the pocket', unit: true },
    { key: 'DEF', label: 'Defense', desc: 'Stops simulated enemy drives', unit: true },
    { key: 'K', label: 'Kicker', desc: 'Wider sweet spot on kicks' },
  ];
  const FIRST = ['Dax', 'Milo', 'Otis', 'Rafe', 'Jett', 'Cole', 'Nico', 'Theo', 'Bram', 'Zeke', 'Arlo', 'Quinn', 'Remy', 'Sol', 'Tate', 'Vance', 'Wes', 'Idris', 'Kai', 'Luca',
    'Ezra', 'Jalen', 'Rory', 'Malik', 'Hugo', 'Desmond', 'Tobias', 'Emeka', 'Silas', 'Marcus', 'Joaquin', 'Darius', 'Felix', 'Omar', 'Beau', 'Kofi', 'Reggie', 'Anders', 'Tyrell', 'Cyrus'];
  const LAST = ['Okafor', 'Brandt', 'Salazar', 'Whitlock', 'Nakamura', 'Draper', 'Molina', 'Castellan', 'Pruitt', 'Vasquez', 'Hollis', 'Arden', 'Mbeki', 'Lindqvist', 'Rourke', 'Tanaka', 'Fairbanks', 'Osei', 'Kowalski', 'Delacroix',
    'Abernathy', 'Quist', 'Ferreira', 'Holloway', 'Adeyemi', 'Sorensen', 'Bellweather', 'Nkemelu', 'Ravel', 'Thibodeaux', 'Marchetti', 'Okonkwo', 'Strand', 'Villanueva', 'Pemberton', 'Iwu', 'Galloway', 'Haugen', 'Dumont', 'Achterberg'];

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
  GP.STATS.TE = [
    ['hands', 'Catching', 'Catch chance on throws to him'], ['pow', 'Strength', 'Contested catches, breaking tackles, falling forward'],
    ['blk', 'Blocking', 'How long he holds his man on run plays'], ['spd', 'Speed', 'Route and open-field speed'],
    ['sta', 'Stamina', 'How little he slows on long routes and runs']];
  GP.STATS.WR1 = GP.STATS.WR2 = [
    ['hands', 'Catching', 'Catch chance on every throw to him'], ['spd', 'Speed', 'Route and open-field speed'],
    ['agi', 'Agility', 'Sharper route cuts and jukes after the catch'], ['sta', 'Stamina', 'How little he slows on deep routes and long runs'],
    ['pow', 'Strength', 'Contested catches, breaking tackles, falling forward']];
  GP.STATS.WR = GP.STATS.WR1;
  GP.STATS.K = [
    ['leg', 'Kick distance', 'How far he can aim: 30 yards at 40, about 45 at 70, 60 at 99'],
    ['acc', 'Kick accuracy', 'Size of the green zone on the kick meter, and how slowly the marker moves']];
  GP.STATS.OL = [
    ['pow', 'Strength', 'Holding his ground: a weak lineman gets driven back into the quarterback'],
    ['pblk', 'Pass block', 'How long he holds his man on pass plays'],
    ['rblk', 'Run block', 'How long he holds his man on run plays'],
    ['spd', 'Speed', 'Getting into position; a faster rusher beats a slow lineman around the edge'],
    ['sta', 'Stamina', 'How slowly his blocking fades over a long drive']];
  GP.statsFor = (key) => GP.STATS[key] || [['ovr', 'Overall', '']];
  GP.derived = (key) => ['QB', 'RB', 'WR', 'WR1', 'WR2', 'TE', 'OL', 'K'].includes(key);   // overall is computed from the stats

  // The roster: up to 12 players at these positions (three linemen start). The defense is a team-wide unit.
  GP.ROSTER_MAX = 12;
  GP.PLAYER_POS = { QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver', TE: 'Tight End', OL: 'Offensive Lineman', K: 'Kicker' };
  GP.SLOTS = [['QB', 'QB'], ['RB', 'RB'], ['WR1', 'WR'], ['WR2', 'WR'], ['TE', 'TE'], ['OL1', 'OL'], ['OL2', 'OL'], ['OL3', 'OL'], ['K', 'K']];   // a game's starters
  GP.UNITS = [['DEF', 'Defense', 'Stops simulated enemy drives']];
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
        : key === 'TE' ? t.hands * 0.3 + t.blk * 0.25 + t.pow * 0.2 + t.spd * 0.15 + t.sta * 0.1
        : key === 'OL' ? t.pblk * 0.3 + t.rblk * 0.3 + t.pow * 0.2 + t.spd * 0.1 + t.sta * 0.1
        : key === 'K' ? (t.leg + t.acc) / 2
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
  function newPlayer(s, pos, stars, age) {
    const r = genPlayer(pos, stars, age);
    // avoid a name already on your roster, in the draft pool or on a trade block
    const taken = new Set([...(s.players || []), ...((s.draft && s.draft.pool) || []), ...Object.values(s.blocks || {}).flat()].map((p) => p.name));
    for (let i = 0; i < 20 && taken.has(r.name); i++) r.name = GP.pick(FIRST) + ' ' + GP.pick(LAST);
    r.id = s.nextId++; r.pos = pos;
    return r;
  }
  GP.newPlayer = newPlayer;
  // A nameless reserve fielded when no one on the roster plays a starting spot: 0-1 stars, stats
  // 40-55, at his caps so he can't be upgraded. A fresh one each season.
  function genFiller(pos) {
    const r = genPlayer(pos, GP.pick([0, 1]), 30);
    for (const k in r.stats) { r.stats[k] = GP.rint(40, 55); r.caps[k] = r.stats[k]; }
    r.name = 'Reserve ' + GP.PLAYER_POS[pos].toLowerCase(); r.filler = true; r.pos = pos;
    return GP.refresh(r, pos);
  }
  GP.depth = (s, pos) => s.players.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr);
  // The starters for a game: the best players at each position, a reserve wherever there is none.
  GP.lineup = function (s) {
    const L = { DEF: s.units.DEF }, used = new Set();
    s.fillers = s.fillers || {};
    for (const [slot, pos] of GP.SLOTS) {
      const best = GP.depth(s, pos).find((p) => !used.has(p.id));
      if (best) { L[slot] = best; used.add(best.id); }
      else L[slot] = s.fillers[slot] || (s.fillers[slot] = genFiller(pos));
    }
    // the line as a whole, for team ratings and simulated drives
    L.OL = { ovr: Math.round((L.OL1.ovr + L.OL2.ovr + L.OL3.ovr) / 3) };
    return L;
  };
  GP.findPlayer = (s, id) => s.units[id] || s.players.find((p) => p.id === id);
  GP.release = function (s, id) {
    s.players = s.players.filter((p) => p.id !== id);
    GP.syncUser(s); GP.save(s);
  };

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

  GP.DIFFICULTY = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
  GP.newCareer = function (teamId, difficulty) {
    const s = {
      v: 3, teamId, season: 1, week: 0, credits: 4, phase: 'regular', playoff: null, champion: null, history: [],
      players: [], nextId: 1, fillers: {}, news: [], difficulty: difficulty || 'normal',
      staff: { OC: genCoach('OC', 1), DC: genCoach('DC', 1) },
      units: { DEF: genPlayer('DEF', GP.pick([2, 2, 3, 3, 3]), null, true) },
      teams: GP.TEAMS.map((t) => ({ id: t.id, off: GP.rint(64, 84), def: GP.rint(64, 84), w: 0, l: 0, pf: 0, pa: 0 })),
      schedule: buildSchedule(1),
    };
    // a full set of starters, minus one (back, receiver or tight end) that you'll need to find
    const starters = ['QB', 'RB', 'WR', 'WR', 'TE', 'K'];
    starters.splice(GP.rint(1, 4), 1);
    for (const pos of starters.concat(['OL', 'OL', 'OL'])) s.players.push(newPlayer(s, pos, GP.pick([2, 2, 3, 3, 3]), GP.rint(22, 29)));
    GP.syncUser(s);
    return s;
  };

  // Keep the user's league entry in step with their roster.
  GP.syncUser = function (s) {
    const r = GP.lineup(s), me = GP.rec(s, s.teamId);
    me.off = Math.round((r.QB.ovr + r.RB.ovr + r.WR1.ovr + r.WR2.ovr + r.TE.ovr + r.OL.ovr) / 6);
    me.def = r.DEF.ovr + Math.round(((s.staff && s.staff.DC.stars) || 0) * 1.5);
  };
  GP.rec = (s, id) => s.teams.find((t) => t.id === id);
  const byRecord = (a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa);
  GP.standings = (s) => s.teams.slice().sort(byRecord);   // whole league, best first
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
    GP.startDraft(s);
  }

  // ---------- coaching staff ----------
  // An offensive and a defensive coordinator, each with 0-5 stars and special skills (one, or two at 4+
  // stars) drawn from a small set. Add new skills here and give them an effect in match.js.
  GP.SKILLS = {
    OC: {
      airraid: ['Air Raid', 'Throws land 15% closer to where you aim'],
      ground: ['Ground Game', 'Run blocks hold 20% longer'],
      twomin: ['Two-Minute Drill', 'Half the clock runs off between plays in the last minute of each half'],
    },
    DC: {
      ballhawk: ['Ball Hawk', 'Opponent drives end in a turnover more often'],
      bend: ["Bend Don't Break", 'Fewer touchdowns allowed; more drives end in field goals'],
      flip: ['Field Flipper', 'After a stop, your drive starts 8 yards further up the field'],
    },
  };
  GP.ROLES = { OC: 'Offensive Coordinator', DC: 'Defensive Coordinator' };
  GP.STAFF_COST = [0, 2, 4, 7, 10, 14];     // coaching points to hire, by stars
  function genCoach(role, stars) {
    const keys = Object.keys(GP.SKILLS[role]).sort(() => Math.random() - 0.5);
    return { role, name: GP.pick(FIRST) + ' ' + GP.pick(LAST), age: GP.rint(34, 63), stars, skills: keys.slice(0, stars >= 4 ? 2 : 1) };
  }
  GP.hasSkill = (staff, role, key) => !!(staff && staff[role] && staff[role].skills.includes(key));
  // three candidates for each job, new every season
  GP.staffPool = function (s) {
    if (!s.staffPool) {
      s.staffPool = { OC: [], DC: [] };
      for (const role of ['OC', 'DC']) for (let i = 0; i < 3; i++) s.staffPool[role].push(genCoach(role, GP.pick([0, 1, 1, 2, 2, 3, 3, 4, 5])));
      GP.save(s);
    }
    return s.staffPool;
  };
  GP.hire = function (s, role, i) {
    const pool = GP.staffPool(s)[role], c = pool[i];
    if (!c || s.credits < GP.STAFF_COST[c.stars]) return false;
    s.credits -= GP.STAFF_COST[c.stars];
    s.news = (s.news || []).concat(`You hired ${c.name} (${c.stars}★) as ${GP.ROLES[role].toLowerCase()}, replacing ${s.staff[role].name}.`);
    s.staff[role] = c; pool.splice(i, 1);
    GP.syncUser(s); GP.save(s);
    return true;
  };

  // ---------- trades ----------
  // Open in the offseason and during the regular season up to the deadline (after week 9 of 14).
  // Each team offers three players on its trade block each season, plus its picks in the next draft.
  GP.TRADE_DEADLINE = 9;
  GP.tradeStatus = function (s) {
    if (s.phase === 'offseason') return { open: true, note: 'Offseason — trades are open' };
    if (s.phase === 'regular' && s.week < GP.TRADE_DEADLINE) {
      const left = GP.TRADE_DEADLINE - s.week;
      return { open: true, note: `Trade deadline after week ${GP.TRADE_DEADLINE} (${left} week${left === 1 ? '' : 's'} left)` };
    }
    return { open: false, note: s.phase === 'playoffs' ? 'Trades reopen after the season' : 'The trade deadline has passed' };
  };
  // the draft whose picks can be traded right now
  GP.pickSeason = (s) => (s.phase === 'offseason' ? s.season + 1 : s.season);
  GP.teamBlock = function (s, teamId) {
    s.blocks = s.blocks || {};
    if (!s.blocks[teamId]) {
      const t = GP.rec(s, teamId), level = GP.clamp(Math.round(((t.off + t.def) / 2 - 58) / 6), 0, 5);
      s.blocks[teamId] = [0, 1, 2].map(() => newPlayer(s, GP.pick(['QB', 'RB', 'WR', 'WR', 'TE', 'OL', 'OL', 'K']),
        GP.clamp(level + GP.rint(-1, 1), 0, 5), GP.rint(23, 31)));
      GP.save(s);
    }
    return s.blocks[teamId];
  };
  // picks a team owns in the tradeable draft: [{key, round, from}]
  GP.ownedPicks = function (s, owner) {
    const season = GP.pickSeason(s), out = [];
    for (let round = 1; round <= GP.DRAFT_ROUNDS; round++)
      for (const t of GP.TEAMS) if (GP.pickOwner(s, season, round, t.id) === owner) out.push({ key: pickKey(season, round, t.id), round, from: t.id });
    return out;
  };
  // what things are worth, in one common currency
  const POS_WEIGHT = { QB: 1.3, RB: 1, WR: 1, TE: 0.9, OL: 0.8, K: 0.5 };   // quarterbacks matter most, kickers least
  GP.playerValue = (p) => (Math.max(0, p.ovr - 45) ** 1.6 * 0.5 + p.stars * 6 + (p.age <= 25 ? 6 : p.age >= 31 ? -8 : 0)) * (POS_WEIGHT[p.pos] || 1);
  GP.pickValue = function (s, key) {
    const [, round, team] = key.split('-'), order = GP.standings(s).reverse().map((t) => t.id);   // worst first
    // early in the season every pick is valued as mid-round; the standings count more as games are played
    const games = s.teams[0].w + s.teams[0].l, w = s.phase === 'offseason' ? 1 : Math.min(1, games / 8);
    const frac = 0.5 * (1 - w) + (order.indexOf(team) / (order.length - 1)) * w;
    return [130, 60, 28][+round - 1] * (1.25 - 0.5 * frac);
  };
  // offer: { partner, give: {players: [ids], picks: [keys]}, get: {players: [ids], picks: [keys]} }
  GP.evaluateTrade = function (s, o) {
    const block = GP.teamBlock(s, o.partner);
    const give = o.give.players.map((id) => GP.playerValue(s.players.find((p) => p.id === id))).reduce((a, b) => a + b, 0)
      + o.give.picks.reduce((a, k) => a + GP.pickValue(s, k), 0);
    const get = o.get.players.map((id) => GP.playerValue(block.find((p) => p.id === id))).reduce((a, b) => a + b, 0)
      + o.get.picks.reduce((a, k) => a + GP.pickValue(s, k), 0);
    const rosterAfter = s.players.length - o.give.players.length + o.get.players.length;
    let reason = null;
    if (!GP.tradeStatus(s).open) reason = GP.tradeStatus(s).note;
    else if (!o.give.players.length && !o.give.picks.length) reason = 'Offer something';
    else if (!o.get.players.length && !o.get.picks.length) reason = 'Ask for something';
    else if (rosterAfter > GP.ROSTER_MAX) reason = `That would put you at ${rosterAfter} players (max ${GP.ROSTER_MAX})`;
    else if (give < get * 1.1) reason = 'They want more in return';   // they only deal if they come out a little ahead
    return { give, get, ok: !reason, reason, need: get * 1.1 };
  };
  GP.executeTrade = function (s, o) {
    if (!GP.evaluateTrade(s, o).ok) return false;
    const block = GP.teamBlock(s, o.partner), name = GP.team(o.partner).abbr, lines = [];
    const out = s.players.filter((p) => o.give.players.includes(p.id)), inn = block.filter((p) => o.get.players.includes(p.id));
    s.players = s.players.filter((p) => !o.give.players.includes(p.id)).concat(inn);
    s.blocks[o.partner] = block.filter((p) => !o.get.players.includes(p.id)).concat(out);
    s.pickOwners = s.pickOwners || {};
    for (const k of o.give.picks) s.pickOwners[k] = o.partner;
    for (const k of o.get.picks) s.pickOwners[k] = s.teamId;
    const label = (k) => { const [season, round, team] = k.split('-'); return `${GP.team(team).abbr} round ${round} pick (season ${season} draft)`; };
    lines.push(`Trade with ${name}: you sent ${out.map((p) => p.name).concat(o.give.picks.map(label)).join(', ') || 'nothing'}; you got ${inn.map((p) => p.name).concat(o.get.picks.map(label)).join(', ')}.`);
    s.news = (s.news || []).concat(lines);
    GP.syncUser(s); GP.save(s);
    return true;
  };

  // ---------- the draft ----------
  // Three rounds between seasons; worst record picks first, the champion last. Prospects show only a
  // fuzzy star range and overall range until you scout them (1 coaching point each).
  GP.DRAFT_ROUNDS = 3;
  GP.SCOUT_COST = 1;
  const pickKey = (season, round, team) => `${season}-${round}-${team}`;
  GP.pickKey = pickKey;
  GP.pickOwner = (s, season, round, team) => (s.pickOwners && s.pickOwners[pickKey(season, round, team)]) || team;
  const weighted = (pairs) => { let r = Math.random() * pairs.reduce((a, p) => a + p[1], 0); for (const [v, w] of pairs) if ((r -= w) < 0) return v; return pairs[0][0]; };
  function genProspect(s) {
    const pos = weighted([['QB', 10], ['RB', 16], ['WR', 26], ['TE', 14], ['OL', 26], ['K', 8]]);
    const stars = weighted([[0, 10], [1, 20], [2, 30], [3, 22], [4, 12], [5, 6]]);
    const r = newPlayer(s, pos, stars, GP.rint(21, 23));
    // what your scouts can tell without a closer look
    let lo = GP.clamp(stars - GP.rint(0, 1), 0, 5), hi = GP.clamp(stars + GP.rint(0, 1), 0, 5);
    if (lo === hi) { if (Math.random() < 0.5 && lo > 0) lo--; else if (hi < 5) hi++; else lo--; }
    const c = r.ovr + GP.rint(-4, 4);
    r.est = { stars: [lo, hi], ovr: [c - 5, c + 5] };
    r.scouted = false;
    return r;
  }
  // how other teams rate a prospect: true quality seen through their own imperfect scouting
  const aiValue = (p) => p.stars * 9 + p.ovr * 0.6 + GP.rnd(-6, 6);
  GP.startDraft = function (s) {
    const order = s.teams.slice().sort((a, b) => a.w - b.w || (a.pf - a.pa) - (b.pf - b.pa)).map((t) => t.id);
    if (s.champion) { order.splice(order.indexOf(s.champion), 1); order.push(s.champion); }
    const picks = [];
    for (let round = 1; round <= GP.DRAFT_ROUNDS; round++)
      for (const team of order) picks.push({ no: picks.length + 1, round, team, owner: GP.pickOwner(s, s.season, round, team) });
    const pool = [];
    for (let i = 0; i < picks.length + 14; i++) pool.push(genProspect(s));
    s.draft = { season: s.season, picks, at: 0, pool, log: [], done: false };
    GP.save(s);
  };
  GP.draftCurrent = (s) => (s.draft && !s.draft.done ? s.draft.picks[s.draft.at] : null);
  GP.myPicks = (s) => (s.draft ? s.draft.picks.filter((p, i) => i >= s.draft.at && p.owner === s.teamId) : []);
  function draftTake(s, prospect) {
    const d = s.draft, pick = d.picks[d.at];
    d.pool = d.pool.filter((p) => p !== prospect);
    d.log.push({ no: pick.no, round: pick.round, owner: pick.owner, name: prospect.name, pos: prospect.pos, stars: prospect.stars });
    if (pick.owner === s.teamId) {
      delete prospect.est; prospect.scouted = true; prospect.rookie = true;
      s.players.push(prospect);
      s.news = (s.news || []).concat(`You drafted ${prospect.name} (${prospect.pos}, ${prospect.stars}★) with pick #${pick.no}.`);
    }
    d.at++;
    if (d.at >= d.picks.length) d.done = true;
  }
  // other teams pick until it's your turn (or the draft ends)
  GP.draftAdvance = function (s) {
    const d = s.draft;
    while (d && !d.done && d.picks[d.at].owner !== s.teamId) {
      let best = null, bv = -1e9;
      for (const p of d.pool) { const v = aiValue(p); if (v > bv) { bv = v; best = p; } }
      draftTake(s, best);
    }
    GP.save(s);
  };
  GP.draftPick = function (s, id) {
    const cur = GP.draftCurrent(s), p = s.draft && s.draft.pool.find((x) => x.id === id);
    if (!cur || cur.owner !== s.teamId || !p || s.players.length >= GP.ROSTER_MAX) return false;
    draftTake(s, p); GP.syncUser(s); GP.draftAdvance(s);
    return true;
  };
  GP.draftPass = function (s) {
    const d = s.draft, cur = GP.draftCurrent(s);
    if (!cur || cur.owner !== s.teamId) return;
    d.log.push({ no: cur.no, round: cur.round, owner: cur.owner, pass: true });
    d.at++; if (d.at >= d.picks.length) d.done = true;
    GP.draftAdvance(s);
  };
  GP.scout = function (s, id) {
    const p = s.draft && s.draft.pool.find((x) => x.id === id);
    if (!p || p.scouted || s.credits < GP.SCOUT_COST) return false;
    s.credits -= GP.SCOUT_COST; p.scouted = true; GP.save(s);
    return true;
  };

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
    if (s.draft && !s.draft.done) { while (!s.draft.done) { if (GP.draftCurrent(s).owner === s.teamId) GP.draftPass(s); else GP.draftAdvance(s); } }
    const drafted = (s.news || []).filter((n) => n.startsWith('You drafted'));
    s.draft = null;
    if (s.pickOwners) for (const k in s.pickOwners) if (+k.split('-')[0] <= s.season) delete s.pickOwners[k];
    s.season++; s.week = 0; s.phase = 'regular'; s.playoff = null; s.champion = null;
    s.news = drafted;
    s.players = s.players.filter((r) => {
      r.age++;
      if (r.age >= 36) { s.news.push(`${r.name} (${r.pos}) retired.`); return false; }   // his spot opens up
      for (const [k] of GP.statsFor(r.pos)) {
        let v = r.stats[k];
        if (r.age <= 26) v += GP.rint(0, 2);
        else if (r.age >= (PHYSICAL[k] ? 29 : 31)) v -= GP.rint(1, PHYSICAL[k] ? 3 : 4);
        r.stats[k] = GP.clamp(v, 35, r.caps[k]);
      }
      GP.refresh(r, r.pos);
      return true;
    });
    s.fillers = {};                          // new reserves each season
    s.blocks = {};                           // and new trade blocks
    s.staffPool = null;                      // and new coaching candidates
    for (const t of s.teams) {
      t.w = t.l = t.pf = t.pa = 0;
      if (t.id !== s.teamId) { t.off = GP.clamp(t.off + GP.rint(-3, 3), 60, 92); t.def = GP.clamp(t.def + GP.rint(-3, 3), 60, 92); }
    }
    s.schedule = buildSchedule(s.season);
    GP.syncUser(s); GP.save(s);
  };

  // Cost of +1 to a stat; Infinity once it reaches the player's cap for that stat.
  GP.upgradeCost = (val, cap) => (val >= (cap == null ? 99 : cap) ? Infinity : val >= 85 ? 2 : 1);
  GP.upgrade = function (s, id, stat) {
    const r = GP.findPlayer(s, id);
    if (!r || r.filler) return false;
    const c = GP.upgradeCost(r.stats[stat], r.caps[stat]);
    if (s.credits < c) return false;
    s.credits -= c; r.stats[stat]++; GP.refresh(r, r.pos || id); GP.syncUser(s); GP.save(s);
    return true;
  };

  const KEY = 'pocket-gridiron-save';
  GP.save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  GP.load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (!s || (s.v !== 2 && s.v !== 3)) return null;
      // saves from before agility existed: give the current back a rating near his overall
      if (s.v === 2 && s.roster.RB.agi == null && !s.roster.RB.stats) s.roster.RB.agi = GP.clamp(s.roster.RB.ovr + GP.rint(-6, 6), 40, 99);
      // saves from before stars and per-stat caps
      let changed = false;
      if (s.v === 2) {
        for (const p of GP.POS) changed = migratePlayer(s.roster[p.key], p.key) || changed;
        for (const p of GP.POS) addMissingStats(s.roster[p.key], p.key);
        // version 3: the fixed roster becomes a list of players plus the two units
        s.units = { OL: s.roster.OL, DEF: s.roster.DEF };
        s.players = []; s.nextId = 1; s.fillers = {}; s.news = [];
        for (const key of ['QB', 'RB', 'WR1', 'WR2', 'TE', 'K']) {
          const r = s.roster[key]; r.pos = key.startsWith('WR') ? 'WR' : key; r.id = s.nextId++; s.players.push(r);
        }
        delete s.roster; s.v = 3; changed = true;
      }
      if (s.units.OL) {
        const u = s.units.OL;
        for (let i = 0; i < 3; i++) {
          const r = newPlayer(s, 'OL', u.stars != null ? u.stars : 2, GP.rint(24, 30));
          for (const k in r.stats) {
            r.stats[k] = GP.clamp(u.ovr + GP.rint(-5, 5), 35, 99);
            r.caps[k] = Math.max(r.caps[k], r.stats[k]);
          }
          GP.refresh(r, 'OL'); s.players.push(r);
        }
        delete s.units.OL;
        s.news = (s.news || []).concat('Your offensive line is now three individual linemen on the roster.');
        changed = true;
      }
      if (!s.staff) { s.staff = { OC: genCoach('OC', 1), DC: genCoach('DC', 1) }; changed = true; }
      for (const r of s.players) changed = addMissingStats(r, r.pos) || changed;
      if (changed) { GP.syncUser(s); GP.save(s); }
      return s;
    } catch (e) { return null; }
  };
  GP.wipe = () => { try { localStorage.removeItem(KEY); } catch (e) {} };
})();
