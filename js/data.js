// League data, career state, season simulation.
(function () {
  const GP = (window.GP = window.GP || {});
  GP.rnd = (a, b) => a + Math.random() * (b - a);
  GP.rint = (a, b) => Math.floor(GP.rnd(a, b + 1));
  GP.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  GP.pick = (a) => a[Math.floor(Math.random() * a.length)];

  GP.CONFS = ['American', 'National'];
  GP.DIVS = ['North', 'East', 'South', 'West'];   // AFC/NFC North, East, South, West
  GP.TEAMS = [
    // Real NFL cities, conferences, divisions and colors (American = AFC, National = NFC). Teams go by
    // their city alone (name = city); where two share one, the AFC team takes its stadium's location
    // (New Jersey, Inglewood). Internal ids are kept from the earlier fictional league so careers carry over.
    { id: 'hbk', conf: 0, div: 0, city: 'Baltimore', name: 'Baltimore', abbr: 'BAL', c1: '#241773', c2: '#9e7c0c' },
    { id: 'dlr', conf: 0, div: 0, city: 'Cincinnati', name: 'Cincinnati', abbr: 'CIN', c1: '#fb4f14', c2: '#000000' },
    { id: 'tfo', conf: 0, div: 0, city: 'Cleveland', name: 'Cleveland', abbr: 'CLE', c1: '#311d00', c2: '#ff3c00' },
    { id: 'ivf', conf: 0, div: 0, city: 'Pittsburgh', name: 'Pittsburgh', abbr: 'PIT', c1: '#101820', c2: '#ffb612' },
    { id: 'gln', conf: 0, div: 1, city: 'Buffalo', name: 'Buffalo', abbr: 'BUF', c1: '#00338d', c2: '#ffffff' },
    { id: 'gss', conf: 0, div: 1, city: 'Miami', name: 'Miami', abbr: 'MIA', c1: '#008e97', c2: '#ffffff' },
    { id: 'cps', conf: 0, div: 1, city: 'Boston', name: 'Boston', abbr: 'BOS', c1: '#002244', c2: '#c60c30' },
    { id: 'gbg', conf: 0, div: 1, city: 'New Jersey', name: 'New Jersey', abbr: 'NJY', c1: '#125740', c2: '#ffffff' },
    { id: 'sba', conf: 0, div: 2, city: 'Houston', name: 'Houston', abbr: 'HOU', c1: '#03202f', c2: '#ffffff' },
    { id: 'opf', conf: 0, div: 2, city: 'Indianapolis', name: 'Indianapolis', abbr: 'IND', c1: '#002c5f', c2: '#ffffff' },
    { id: 'pmo', conf: 0, div: 2, city: 'Jacksonville', name: 'Jacksonville', abbr: 'JAX', c1: '#006778', c2: '#d7a22a' },
    { id: 'ozo', conf: 0, div: 2, city: 'Nashville', name: 'Nashville', abbr: 'NSH', c1: '#0c2340', c2: '#4b92db' },
    { id: 'smy', conf: 0, div: 3, city: 'Denver', name: 'Denver', abbr: 'DEN', c1: '#fb4f14', c2: '#002244' },
    { id: 'prt', conf: 0, div: 3, city: 'Kansas City', name: 'Kansas City', abbr: 'KAN', c1: '#e31837', c2: '#ffb81c' },
    { id: 'mgf', conf: 0, div: 3, city: 'Las Vegas', name: 'Las Vegas', abbr: 'LVG', c1: '#000000', c2: '#a5acaf' },
    { id: 'gcc', conf: 0, div: 3, city: 'Inglewood', name: 'Inglewood', abbr: 'ING', c1: '#0080c6', c2: '#ffc20e' },
    { id: 'fth', conf: 1, div: 0, city: 'Chicago', name: 'Chicago', abbr: 'CHI', c1: '#0b162a', c2: '#c83803' },
    { id: 'rvv', conf: 1, div: 0, city: 'Detroit', name: 'Detroit', abbr: 'DET', c1: '#0076b6', c2: '#ffffff' },
    { id: 'lsl', conf: 1, div: 0, city: 'Green Bay', name: 'Green Bay', abbr: 'GNB', c1: '#203731', c2: '#ffb612' },
    { id: 'tlm', conf: 1, div: 0, city: 'Minneapolis', name: 'Minneapolis', abbr: 'MIN', c1: '#4f2683', c2: '#ffc62f' },
    { id: 'dbc', conf: 1, div: 1, city: 'Dallas', name: 'Dallas', abbr: 'DAL', c1: '#041e42', c2: '#869397' },
    { id: 'lso', conf: 1, div: 1, city: 'New York', name: 'New York', abbr: 'NYC', c1: '#0b2265', c2: '#ffffff' },
    { id: 'byb', conf: 1, div: 1, city: 'Philadelphia', name: 'Philadelphia', abbr: 'PHI', c1: '#004c54', c2: '#a5acaf' },
    { id: 'twh', conf: 1, div: 1, city: 'Washington', name: 'Washington', abbr: 'WAS', c1: '#5a1414', c2: '#ffb612' },
    { id: 'msr', conf: 1, div: 2, city: 'Atlanta', name: 'Atlanta', abbr: 'ATL', c1: '#a71930', c2: '#000000' },
    { id: 'vce', conf: 1, div: 2, city: 'Charlotte', name: 'Charlotte', abbr: 'CHA', c1: '#0085ca', c2: '#101820' },
    { id: 'byg', conf: 1, div: 2, city: 'New Orleans', name: 'New Orleans', abbr: 'NOL', c1: '#101820', c2: '#d3bc8d' },
    { id: 'rwl', conf: 1, div: 2, city: 'Tampa', name: 'Tampa', abbr: 'TAM', c1: '#d50a0a', c2: '#ffffff' },
    { id: 'cys', conf: 1, div: 3, city: 'Phoenix', name: 'Phoenix', abbr: 'PHX', c1: '#97233f', c2: '#ffffff' },
    { id: 'nbc', conf: 1, div: 3, city: 'Los Angeles', name: 'Los Angeles', abbr: 'LAX', c1: '#003594', c2: '#ffd100' },
    { id: 'srp', conf: 1, div: 3, city: 'San Francisco', name: 'San Francisco', abbr: 'SFO', c1: '#aa0000', c2: '#b3995d' },
    { id: 'csq', conf: 1, div: 3, city: 'Seattle', name: 'Seattle', abbr: 'SEA', c1: '#002244', c2: '#69be28' },
  ];
  GP.team = (id) => GP.TEAMS.find((t) => t.id === id);
  // device preferences (not part of a career): camera zoom
  let prefCache = null;      // read once; the game asks every frame
  GP.prefs = () => { if (!prefCache) { try { prefCache = JSON.parse(localStorage.getItem('pg-prefs') || '{}'); } catch (e) { prefCache = {}; } } return prefCache; };
  GP.setPref = (k, v) => { const p = GP.prefs(); p[k] = v; try { localStorage.setItem('pg-prefs', JSON.stringify(p)); } catch (e) { /* private mode */ } };
  // An opponent's offense for a game, in the same shape as your lineup: each player's stats scattered around
  // the team's offense rating.
  GP.oppOffense = function (rating) {
    const v = () => GP.clamp(Math.round(rating + GP.rnd(-7, 7)), 40, 99), st = (keys) => Object.fromEntries(keys.map((k) => [k, v()]));
    const p = (keys) => ({ ovr: rating, stats: st(keys) });
    return { QB: p(['arm', 'acc', 'spd', 'agi', 'sta']), RB: p(['spd', 'agi', 'hands', 'pow', 'sta']),
      WR1: p(['hands', 'spd', 'agi', 'sta', 'pow']), WR2: p(['hands', 'spd', 'agi', 'sta', 'pow']), TE: p(['hands', 'pow', 'blk', 'spd', 'sta']),
      OL1: p(['pow', 'pblk', 'rblk', 'spd', 'sta']), OL2: p(['pow', 'pblk', 'rblk', 'spd', 'sta']), OL3: p(['pow', 'pblk', 'rblk', 'spd', 'sta']),
      K: p(['leg', 'acc']), DEF: { ovr: rating } };
  };

  GP.POS = [
    { key: 'QB', label: 'Quarterback', desc: 'Throw range and accuracy' },
    { key: 'RB', label: 'Running Back', desc: 'Speed, agility, catching, power, stamina' },
    { key: 'WR1', label: 'Wide Receiver', desc: 'Speed and hands' },
    { key: 'WR2', label: 'Wide Receiver', desc: 'Speed and hands' },
    { key: 'TE', label: 'Tight End', desc: 'Catching, strength, blocking, speed, stamina' },
    { key: 'OL', label: 'Offensive Line', desc: 'Time in the pocket', unit: true },
    { key: 'DEF', label: 'Defense', desc: 'Sets your defenders’ speed, coverage and tackling', unit: true },
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
    ['leg', 'Kick distance', 'Field goals: 30 yards at 40, about 45 at 70, 60 at 99. Punts travel about 47 yards past the line at 71'],
    ['acc', 'Kick accuracy', 'Size of the green zone on the kick meter, and how slowly the marker moves']];
  GP.STATS.OL = [
    ['pow', 'Strength', 'Holding his ground: a weak lineman gets driven back into the quarterback'],
    ['pblk', 'Pass block', 'How long he holds his man on pass plays'],
    ['rblk', 'Run block', 'How long he holds his man on run plays'],
    ['spd', 'Speed', 'Getting into position; a faster rusher beats a slow lineman around the edge'],
    ['sta', 'Stamina', 'How slowly his blocking fades over a long drive']];
  // the defense: every stat feeds something on the field
  GP.STATS.DL = [
    ['rush', 'Pass rush', 'How fast he beats his blocker on pass plays: sacks and pressure'],
    ['run', 'Run stop', 'How fast he sheds his blocker on runs'],
    ['pow', 'Strength', 'Driving his blocker back into the quarterback'],
    ['spd', 'Speed', 'Closing on the quarterback and chasing plays down'],
    ['tkl', 'Tackling', 'Finishing the tackle once he gets there']];
  GP.STATS.LB = [
    ['tkl', 'Tackling', 'Finishing tackles: head-on hits land, arm tackles miss'],
    ['run', 'Run stop', 'How fast he reads a run and fills his gap'],
    ['cov', 'Coverage', 'Staying with backs and tight ends, breaking up throws'],
    ['spd', 'Speed', 'Range in coverage and pursuit'],
    ['pow', 'Strength', 'Shedding blockers in the run game']];
  GP.STATS.CB = [
    ['cov', 'Coverage', 'Staying with his man through cuts, breaking up throws'],
    ['spd', 'Speed', 'Keeping up with fast receivers'],
    ['ball', 'Ball skills', 'Interceptions, and your swipe-up timing window when he plays the ball'],
    ['tkl', 'Tackling', 'Bringing the receiver down after the catch']];
  GP.STATS.S = [
    ['cov', 'Coverage', 'Covering deep and breaking up throws'],
    ['spd', 'Speed', 'Range over the top and in pursuit'],
    ['tkl', 'Tackling', 'The last line: tackles in the open field'],
    ['ball', 'Ball skills', 'Interceptions, and your swipe-up timing window when he plays the ball'],
    ['run', 'Run stop', 'How fast he reads a run and comes up to fill']];
  GP.statsFor = (key) => GP.STATS[key] || [['ovr', 'Overall', '']];
  GP.derived = (key) => ['QB', 'RB', 'WR', 'WR1', 'WR2', 'TE', 'OL', 'K', 'DL', 'LB', 'CB', 'S'].includes(key);   // overall is computed from the stats
  GP.DEF_POS = ['DL', 'LB', 'CB', 'S'];
  GP.isDef = (pos) => GP.DEF_POS.includes(pos);

  // The roster: up to 22 players, 18 of them starting (9 on offense with the kicker, 9 on defense).
  GP.ROSTER_MAX = 22;
  GP.PLAYER_POS = { QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver', TE: 'Tight End', OL: 'Offensive Lineman', K: 'Kicker',
                    DL: 'Defensive Lineman', LB: 'Linebacker', CB: 'Cornerback', S: 'Safety' };
  GP.SLOTS = [['QB', 'QB'], ['RB', 'RB'], ['WR1', 'WR'], ['WR2', 'WR'], ['TE', 'TE'], ['OL1', 'OL'], ['OL2', 'OL'], ['OL3', 'OL'], ['K', 'K']];   // a game's starters
  // the defense's starters (the second safety plays in two-deep coverages; otherwise a third lineman does)
  GP.DEF_SLOTS = [['DL1', 'DL'], ['DL2', 'DL'], ['DL3', 'DL'], ['LB1', 'LB'], ['LB2', 'LB'], ['CB1', 'CB'], ['CB2', 'CB'], ['S', 'S'], ['S2', 'S']];
  GP.UNITS = [];
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
        : key === 'DL' ? t.rush * 0.3 + t.run * 0.25 + t.pow * 0.2 + t.tkl * 0.15 + t.spd * 0.1
        : key === 'LB' ? t.tkl * 0.3 + t.run * 0.25 + t.cov * 0.2 + t.spd * 0.15 + t.pow * 0.1
        : key === 'CB' ? t.cov * 0.4 + t.spd * 0.3 + t.ball * 0.15 + t.tkl * 0.15
        : key === 'S' ? t.cov * 0.3 + t.spd * 0.2 + t.tkl * 0.2 + t.ball * 0.15 + t.run * 0.15
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
    r.face = GP.rint(0, 999999999);            // which portrait he gets (see Pixel.portrait)
    if (GP.isDef(pos)) r.num = jersey(s, pos);
    return r;
  }
  GP.newPlayer = newPlayer;
  // a defender's number, by position, not worn by anyone else on the roster
  function jersey(s, pos) {
    const [lo, hi] = { DL: [90, 99], LB: [50, 59], CB: [20, 29], S: [30, 39] }[pos], used = new Set((s.players || []).map((p) => p.num));
    for (let i = 0; i < 40; i++) { const n = GP.rint(lo, hi); if (!used.has(n)) return n; }
    return GP.rint(lo, hi);
  }
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
    const L = {}, used = new Set();
    s.fillers = s.fillers || {};
    for (const [slot, pos] of GP.SLOTS.concat(GP.DEF_SLOTS)) {
      const best = GP.depth(s, pos).find((p) => !used.has(p.id));
      if (best) { L[slot] = best; used.add(best.id); }
      else L[slot] = s.fillers[slot] || (s.fillers[slot] = genFiller(pos));
    }
    // the line as a whole, for team ratings and simulated drives
    L.OL = { ovr: Math.round((L.OL1.ovr + L.OL2.ovr + L.OL3.ovr) / 3) };
    // the defense as a whole: the average of its starters, for team ratings and simulated drives
    L.DEF = { ovr: Math.round(GP.DEF_SLOTS.reduce((a, [slot]) => a + L[slot].ovr, 0) / GP.DEF_SLOTS.length) };
    return L;
  };
  GP.findPlayer = (s, id) => (s.units || {})[id] || s.players.find((p) => p.id === id);
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
      units: {},
      teams: GP.TEAMS.map((t) => ({ id: t.id, off: GP.rint(64, 84), def: GP.rint(64, 84), w: 0, l: 0, pf: 0, pa: 0 })),
      schedule: buildSchedule(1),
    };
    // a full set of starters, minus one (back, receiver or tight end) that you'll need to find
    const starters = ['QB', 'RB', 'WR', 'WR', 'TE', 'K'];
    starters.splice(GP.rint(1, 4), 1);
    for (const pos of starters.concat(['OL', 'OL', 'OL'])) s.players.push(newPlayer(s, pos, GP.pick([2, 2, 3, 3, 3]), GP.rint(22, 29)));
    // the defense: a full set of starters minus one, anywhere on the field
    const defense = GP.DEF_SLOTS.map(([, pos]) => pos);
    defense.splice(GP.rint(0, defense.length - 1), 1);
    for (const pos of defense) s.players.push(newPlayer(s, pos, GP.pick([2, 2, 3, 3, 3]), GP.rint(22, 29)));
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
  // Every other team's defensive coordinator: 0-5 stars, kept for the career. Loosely follows the team's defense,
  // but a talented defense can have a poor coordinator (and the reverse). His stars set how often his players bust.
  // ---------- opponent identity: a scheme and a roster that hold for the whole season ----------
  GP.hash = (str) => { let x = 2166136261; for (const ch of String(str)) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0; return x; };
  // run fn with Math.random replaced by a seeded generator, so the same seed always gives the same draws
  GP.withSeed = function (seed, fn) {
    const save = Math.random; let a = seed >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    try { return fn(); } finally { Math.random = save; }
  };
  GP.oppSeed = (id, season, what) => GP.hash(`${id}|${season}|${what}`);
  // A team's scheme for the season, which their play calling and coverage calling follow (see match.js cpuCall
  // and callDefense). Offense: run lean and deep lean (-1..1), a favorite play type, a 3rd-and-long go-to and a
  // red-zone go-to. Defense: man (+) or zone (-) lean, blitz and disguise rates (0.5-2x), a 3rd-and-long call.
  GP.teamScheme = (id, season) => GP.withSeed(GP.oppSeed(id, season, 'scheme'), () => {
    const pick = (a) => a[Math.floor(Math.random() * a.length)], r2 = (x) => Math.round(x * 100) / 100;
    const lean = () => { const x = GP.rnd(-1, 1); return r2(Math.sign(x) * Math.max(Math.abs(x), 0.25)); };   // no team is perfectly neutral
    return {
      run: lean(), deep: lean(), fav: pick(['quick', 'deep', 'inside', 'outside', 'screen', 'pa']),
      third: pick(['quick', 'deep', 'screen', 'outside']), red: pick(['inside', 'quick', 'pa', 'outside']),
      man: lean(), blitz: r2(pick([0.5, 0.7, 1, 1.4, 1.9])), disguise: r2(pick([0.5, 0.8, 1.2, 2])),
      long3: pick(['cover4', '2man', 'cover2', 'firezone', 'cover0']),
    };
  });

  // ---------- opponent film ----------
  // What your coordinators can tell you about the next opponent: your DC on their offense, your OC on their
  // defense. Every tip is true: it comes from the team's scheme and from its roster for the season. Ordered by
  // how much it matters; how many you see grows through the season (see GP.filmReveal).
  const CAT = { quick: 'quick passes', deep: 'deep shots', inside: 'inside runs', outside: 'outside runs', screen: 'screens', pa: 'play action' };
  const CALL = { cover0: 'Cover 0', cover1: 'Cover 1', cover1p: 'Cover 1 Press', cover2: 'Cover 2', cover3: 'Cover 3', cover4: 'Cover 4', '2man': '2-Man', firezone: 'Fire Zone' };
  // what beats each coverage (from the measured play-vs-coverage results your OC uses)
  const BEAT = { cover0: 'Stick and Curls get it out before the rush', cover2: 'Dagger, Curls and Comeback sit in the holes',
    cover4: 'Comeback and Post work underneath and between the deep quarters', '2man': 'Verticals win against it',
    firezone: 'Post, Dagger and Comeback beat its three-deep shell', cover1: 'Verticals, Stick and play-action shots beat it' };
  // what stops each kind of play (your defensive call groups)
  const STOP = { inside: 'Blitz calls (Cover 0, Fire Zone) and Cover 1 load the box',
    outside: 'Zone keeps everyone facing the ball and turns runs inside; Cover 3 has the edges', quick: 'Cover 1 Press jams the quick routes',
    deep: 'two-high looks (Cover 4, 2-Man, Cover 2) keep it in front', screen: "zone; don't blitz into a screen", pa: 'Cover 4 or 2-Man, so the safeties stay deep' };
  GP.film = function (s, oppId) {
    const t = GP.team(oppId), r = GP.rec(s, oppId), sc = GP.teamScheme(oppId, s.season), nm = t.name;
    const off = GP.withSeed(GP.oppSeed(oppId, s.season, 'off'), () => GP.oppOffense(r.off));
    const def = GP.withSeed(GP.oppSeed(oppId, s.season, 'def'), () => GP.Match.defRoster(r.def));
    const st = (k, x) => off[k].stats[x], offTips = [], defTips = [];
    // ---- their offense (your DC) ----
    const runText = sc.run > 0 ? `${nm} want to run the ball${sc.run > 0.6 ? ' — a lot' : ''}.` : `${nm} would rather throw it${sc.run < -0.6 ? ' — they barely run' : ''}.`;
    offTips.push({ w: Math.abs(sc.run), head: sc.run > 0 ? 'Run-first offense' : 'Pass-first offense', text: runText,
      fix: sc.run > 0 ? `Early downs: ${STOP.inside}.` : `Sit in zone (Cover 3, Cover 4) and make them be patient.` });
    offTips.push({ w: Math.abs(sc.deep) * 0.9, head: sc.deep > 0 ? 'They take deep shots' : 'Short, quick passing game',
      text: sc.deep > 0 ? `When they throw, they look deep${sc.deep > 0.6 ? ' every chance they get' : ''}.` : `They throw short and quick${sc.deep < -0.6 ? ', almost nothing downfield' : ''}.`,
      fix: sc.deep > 0 ? `Play ${STOP.deep}.` : `${STOP.quick}, and you can take a chance with a blitz.` });
    offTips.push({ w: 0.8, head: `Favorite: ${CAT[sc.fav]}`, text: `They call ${CAT[sc.fav]} far more than a typical team.`, fix: `When you expect it: ${STOP[sc.fav]}.` });
    offTips.push({ w: 0.75, head: '3rd and long', text: `On 3rd and long they go to ${CAT[sc.third]}.`, fix: `${STOP[sc.third][0].toUpperCase() + STOP[sc.third].slice(1)}.` });
    offTips.push({ w: 0.6, head: 'In the red zone', text: `Inside your 20 they lean on ${CAT[sc.red]}.`, fix: `${STOP[sc.red][0].toUpperCase() + STOP[sc.red].slice(1)}.` });
    const wrs = ['WR1', 'WR2', 'TE'].map((k) => ({ k, spd: st(k, 'spd'), hands: st(k, 'hands') })).sort((a, b) => b.spd - a.spd);
    const lab = { WR1: 'their #1 receiver', WR2: 'their #2 receiver', TE: 'their tight end' };
    offTips.push({ w: 0.55, head: 'Deep threat', text: `${lab[wrs[0].k][0].toUpperCase() + lab[wrs[0].k].slice(1)} is their fastest target (speed ${wrs[0].spd}).`, fix: 'Keep a safety over the top of him on obvious passing downs.' });
    const qa = st('QB', 'arm'), qc = st('QB', 'acc');
    offTips.push({ w: 0.5, head: 'Quarterback', text: qa - qc >= 5 ? `Big arm (${qa}), shaky accuracy (${qc}): he'll throw into tight windows and miss.` : qc - qa >= 5 ? `Accurate (${qc}) more than strong (${qa}): he lives on short, on-time throws.` : `Balanced arm (${qa}) and accuracy (${qc}).`,
      fix: qa - qc >= 5 ? 'Play the ball in the air: go for the pick (swipe up) when he forces it.' : qc - qa >= 5 ? 'Pressure beats him: blitz and dive at him with your ringed lineman.' : 'Mix it up; nothing to exploit here.' });
    const rb = off.RB.stats;
    offTips.push({ w: 0.4, head: 'Running back', text: rb.pow - rb.spd >= 5 ? `Their back runs through people (power ${rb.pow}).` : rb.spd - rb.pow >= 5 ? `Their back has breakaway speed (${rb.spd}).` : `Their back is a little of everything.`,
      fix: rb.pow - rb.spd >= 5 ? 'Gang tackle; arm tackles slide off.' : rb.spd - rb.pow >= 5 ? 'Keep contain on outside runs.' : 'Fill your gaps.' });
    // ---- their defense (your OC) ----
    defTips.push({ w: Math.abs(sc.man), head: sc.man > 0 ? 'Man coverage team' : 'Zone coverage team', text: sc.man > 0 ? `${nm} love to play man${sc.man > 0.6 ? ' — Cover 1 most snaps' : ''}.` : `${nm} sit in zone${sc.man < -0.6 ? ' — mostly Cover 3 and Cover 2' : ''}.`,
      fix: sc.man > 0 ? `${BEAT.cover1}.` : 'Dagger, Post and Comeback find the holes; Outs get jumped by Cover 3.' });
    defTips.push({ w: Math.abs(Math.log(sc.blitz)) + 0.1, head: sc.blitz >= 1.4 ? 'They blitz a lot' : sc.blitz <= 0.7 ? 'They rarely blitz' : 'Average blitz rate',
      text: sc.blitz >= 1.4 ? `Expect Cover 0 and Fire Zone pressure, especially on 3rd down.` : sc.blitz <= 0.7 ? 'They rush four and drop everybody else.' : 'They pick their spots to bring pressure.',
      fix: sc.blitz >= 1.4 ? `${BEAT.cover0}; a screen can go a long way.` : sc.blitz <= 0.7 ? 'You will have time: let the deep routes develop.' : 'Have a quick throw ready on 3rd down.' });
    defTips.push({ w: 0.8, head: '3rd and long', text: `On 3rd and long they call ${CALL[sc.long3]}.`, fix: `${BEAT[sc.long3]}.` });
    defTips.push({ w: Math.abs(sc.disguise - 1) * 0.7 + 0.2, head: sc.disguise >= 1.2 ? 'They disguise coverages' : 'What you see is what you get',
      text: sc.disguise >= 1.2 ? `They show one shell and rotate to another at the snap${sc.disguise >= 2 ? ' — often' : ''}.` : 'The shell they show before the snap is usually what they play.',
      fix: sc.disguise >= 1.2 ? 'After the play, the banner shows what they really ran: check it before you trust a look.' : 'Read the pre-snap shell and pick the play that beats it.' });
    const cbs = Object.values(def).filter((d) => d.pos === 'CB').sort((a, b) => a.cov - b.cov);
    if (cbs.length > 1 && cbs[1].cov - cbs[0].cov >= 3) defTips.push({ w: 0.6, head: 'Weak corner', text: `Cornerback #${cbs[0].num} is their weak link in coverage (${cbs[0].cov}, against ${cbs[1].cov} for #${cbs[1].num}).`, fix: 'Throw at whichever receiver he covers.' });
    const saf = Object.values(def).filter((d) => d.pos === 'S').sort((a, b) => a.spd - b.spd);
    if (saf.length) defTips.push({ w: 0.45, head: 'Safeties', text: `Safety #${saf[0].num} is the slowest man in their secondary (speed ${saf[0].spd}).`, fix: 'Posts and deep middle throws test him.' });
    const lbs = Object.values(def).filter((d) => d.pos === 'LB'), lbSpd = Math.round(lbs.reduce((a, d) => a + d.spd, 0) / Math.max(1, lbs.length));
    defTips.push({ w: 0.35, head: 'Linebackers', text: lbSpd < r.def - 3 ? `Their linebackers are slow (speed ${lbSpd}).` : `Their linebackers can run (speed ${lbSpd}).`,
      fix: lbSpd < r.def - 3 ? 'Screens and crossers get outside of them.' : 'Attack the edges with outside runs instead.' });
    const order = (a) => a.sort((x, y) => y.w - x.w);
    return { off: order(offTips), def: order(defTips), scheme: sc };
  };
  // How much of the film your coordinator can show you: 1 tendency in week 1, one more every 3 weeks, plus 1 at
  // 3 stars and 1 at 5 stars; from week 6 (or with a 4-star coordinator) each comes with how to beat it.
  GP.filmReveal = (s, stars) => {
    const wk = s.phase === 'regular' ? s.week + 1 : (s.schedule ? s.schedule.length : 14) + 1;
    return { n: 1 + Math.floor((wk - 1) / 3) + (stars >= 3 ? 1 : 0) + (stars >= 5 ? 1 : 0), detail: wk >= 6 || stars >= 4, week: wk };
  };

  GP.oppDC = function (s, id) {
    const t = GP.rec(s, id);
    if (t.dc == null) { t.dc = GP.clamp(Math.round((t.def - 60) / 8) + GP.rint(-2, 2), 0, 5); GP.save(s); }
    return t.dc;
  };
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
    // home field: the first team of a pairing hosts the first meeting, the other hosts the rematch
    // (division opponents meet twice); in the playoffs the first team listed is the higher seed
    const first = pair[0] === s.teamId;
    let home = first;
    if (s.phase === 'regular') {
      const meet = s.schedule.slice(0, s.week).filter((wk) => wk.some((p) => p.includes(pair[0]) && p.includes(pair[1]))).length;
      if (meet % 2) home = !first;
    }
    return { oppId: first ? pair[1] : pair[0], label, home };
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
      s.blocks[teamId] = [0, 1, 2].map(() => newPlayer(s, GP.pick(['QB', 'RB', 'WR', 'WR', 'TE', 'OL', 'OL', 'K', 'DL', 'DL', 'LB', 'CB', 'CB', 'S']),
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
  const POS_WEIGHT = { QB: 1.3, RB: 1, WR: 1, TE: 0.9, OL: 0.8, K: 0.5, DL: 0.9, LB: 0.85, CB: 0.9, S: 0.85 };   // quarterbacks matter most, kickers least
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
    const pos = weighted([['QB', 6], ['RB', 9], ['WR', 14], ['TE', 8], ['OL', 14], ['K', 4], ['DL', 15], ['LB', 10], ['CB', 12], ['S', 8]]);
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
      if (s.news) s.news = s.news.filter((n) => !/three individual linemen/.test(n));   // an old one-time notice
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

        changed = true;
      }
      // the defense unit becomes nine real players at its level (they fit: the roster limit grew to 22)
      if (s.units && s.units.DEF) {
        const u = s.units.DEF, st = u.stars != null ? u.stars : 2;
        for (const [, pos] of GP.DEF_SLOTS) {
          const r = newPlayer(s, pos, st, GP.rint(23, 29));
          for (const k in r.stats) { r.stats[k] = GP.clamp(u.ovr + GP.rint(-5, 5), 35, 99); r.caps[k] = Math.max(r.caps[k], r.stats[k]); }
          GP.refresh(r, pos); s.players.push(r);
        }
        delete s.units.DEF;
        changed = true;
      }
      s.units = s.units || {};
      if (!s.staff) { s.staff = { OC: genCoach('OC', 1), DC: genCoach('DC', 1) }; changed = true; }
      for (const r of s.players) changed = addMissingStats(r, r.pos) || changed;
      // careers from before portraits: everyone gets a face now, saved so it never changes
      for (const r of [...s.players, ...Object.values(s.blocks || {}).flat(), ...((s.draft && s.draft.pool) || [])])
        if (r.face == null) { r.face = GP.rint(0, 999999999); changed = true; }
      if (changed) { GP.syncUser(s); GP.save(s); }
      return s;
    } catch (e) { return null; }
  };
  GP.wipe = () => { try { localStorage.removeItem(KEY); } catch (e) {} };
})();
