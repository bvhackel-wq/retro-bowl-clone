// League data, career state, season simulation.
(function () {
  const GP = (window.GP = window.GP || {});
  GP.rnd = (a, b) => a + Math.random() * (b - a);
  GP.rint = (a, b) => Math.floor(GP.rnd(a, b + 1));
  GP.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  GP.pick = (a) => a[Math.floor(Math.random() * a.length)];

  GP.TEAMS = [
    { id: 'hbk', city: 'Harbor City', name: 'Krakens', abbr: 'HBK', c1: '#0e7c86', c2: '#f4d35e' },
    { id: 'dbc', city: 'Dustbowl', name: 'Coyotes', abbr: 'DBC', c1: '#b5651d', c2: '#fbe9d0' },
    { id: 'ivf', city: 'Iron Valley', name: 'Forgers', abbr: 'IVF', c1: '#4a4e69', c2: '#ff7b00' },
    { id: 'smy', city: 'Summit', name: 'Yetis', abbr: 'SMY', c1: '#3a86ff', c2: '#e0fbfc' },
    { id: 'nbc', city: 'Neon Bay', name: 'Comets', abbr: 'NBC', c1: '#7b2cbf', c2: '#5df2d6' },
    { id: 'rwl', city: 'Redwood', name: 'Lumberjacks', abbr: 'RWL', c1: '#9d0208', c2: '#ffd6a5' },
    { id: 'prt', city: 'Prairie', name: 'Thunder', abbr: 'PRT', c1: '#1d3557', c2: '#ffb703' },
    { id: 'gln', city: 'Glacier', name: 'Narwhals', abbr: 'GLN', c1: '#006d77', c2: '#ffddd2' },
    { id: 'cps', city: 'Capital', name: 'Sentinels', abbr: 'CPS', c1: '#2b2d42', c2: '#ef233c' },
    { id: 'cys', city: 'Canyon', name: 'Scorpions', abbr: 'CYS', c1: '#c1121f', c2: '#fdf0d5' },
  ];
  GP.team = (id) => GP.TEAMS.find((t) => t.id === id);

  GP.POS = [
    { key: 'QB', label: 'Quarterback', desc: 'Throw range and accuracy' },
    { key: 'RB', label: 'Running Back', desc: 'Speed and broken tackles' },
    { key: 'WR1', label: 'Wide Receiver', desc: 'Speed and hands' },
    { key: 'WR2', label: 'Wide Receiver', desc: 'Speed and hands' },
    { key: 'TE', label: 'Tight End', desc: 'Hands and power' },
    { key: 'OL', label: 'Offensive Line', desc: 'Time in the pocket', unit: true },
    { key: 'DEF', label: 'Defense', desc: 'Stops simulated enemy drives', unit: true },
    { key: 'K', label: 'Kicker', desc: 'Wider sweet spot on kicks' },
  ];
  const FIRST = ['Dax', 'Milo', 'Otis', 'Rafe', 'Jett', 'Cole', 'Nico', 'Theo', 'Bram', 'Zeke', 'Arlo', 'Quinn', 'Remy', 'Sol', 'Tate', 'Vance', 'Wes', 'Idris', 'Kai', 'Luca'];
  const LAST = ['Okafor', 'Brandt', 'Salazar', 'Whitlock', 'Nakamura', 'Draper', 'Molina', 'Castellan', 'Pruitt', 'Vasquez', 'Hollis', 'Arden', 'Mbeki', 'Lindqvist', 'Rourke', 'Tanaka', 'Fairbanks', 'Osei', 'Kowalski', 'Delacroix'];

  function roundRobin(ids) {
    const a = ids.slice().sort(() => Math.random() - 0.5), n = a.length, weeks = [];
    for (let w = 0; w < n - 1; w++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) pairs.push([a[i], a[n - 1 - i]]);
      weeks.push(pairs);
      a.splice(1, 0, a.pop());
    }
    return weeks;
  }

  GP.newCareer = function (teamId) {
    const roster = {};
    for (const p of GP.POS) {
      roster[p.key] = {
        name: p.unit ? 'Unit' : GP.pick(FIRST) + ' ' + GP.pick(LAST),
        age: p.unit ? null : GP.rint(22, 29),
        ovr: GP.rint(63, 72),
      };
    }
    const s = {
      v: 1, teamId, season: 1, week: 0, credits: 4, roster, phase: 'regular', playoff: null, champion: null, history: [],
      teams: GP.TEAMS.map((t) => ({ id: t.id, off: GP.rint(64, 84), def: GP.rint(64, 84), w: 0, l: 0, pf: 0, pa: 0 })),
      schedule: roundRobin(GP.TEAMS.map((t) => t.id)),
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
  GP.standings = (s) => s.teams.slice().sort((a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa));

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
    if (s.phase === 'regular') { pair = s.schedule[s.week].find((p) => p.includes(s.teamId)); label = 'Week ' + (s.week + 1); }
    else if (s.phase === 'playoffs') {
      pair = s.playoff.round === 0 ? s.playoff.semis.find((p) => p.includes(s.teamId)) : s.playoff.final;
      label = s.playoff.round === 0 ? 'Semifinal' : 'Championship';
    } else return null;
    return { oppId: pair[0] === s.teamId ? pair[1] : pair[0], label };
  };

  function endSeason(s, champion, note) {
    s.champion = champion; s.phase = 'offseason'; s.seasonNote = note;
    const me = GP.rec(s, s.teamId);
    s.history.push({ season: s.season, w: me.w, l: me.l, note });
  }

  // Apply the user's result, simulate everything else that week. Returns credits earned.
  GP.advance = function (s, myPts, oppPts) {
    const g = GP.currentGame(s), me = s.teamId, won = myPts > oppPts;
    let earned;
    if (s.phase === 'regular') {
      for (const [a, b] of s.schedule[s.week]) {
        if (a === me || b === me) record(s, me, g.oppId, myPts, oppPts);
        else { const [pa, pb] = simGame(s, a, b); record(s, a, b, pa, pb); }
      }
      earned = won ? 3 : 1;
      s.week++;
      if (s.week >= s.schedule.length) {
        const seeds = GP.standings(s).slice(0, 4).map((t) => t.id);
        s.playoff = { round: 0, seeds, semis: [[seeds[0], seeds[3]], [seeds[1], seeds[2]]], final: null };
        s.phase = 'playoffs';
        if (!seeds.includes(me)) {
          const w = s.playoff.semis.map(([a, b]) => { const [pa, pb] = simGame(s, a, b); return pa > pb ? a : b; });
          const [pa, pb] = simGame(s, w[0], w[1]);
          endSeason(s, pa > pb ? w[0] : w[1], 'Missed the playoffs');
        }
      }
    } else {
      earned = won ? 5 : 2;
      if (s.playoff.round === 0) {
        const other = s.playoff.semis.find((p) => !p.includes(me));
        const [pa, pb] = simGame(s, other[0], other[1]);
        const otherW = pa > pb ? other[0] : other[1];
        if (won) { s.playoff.round = 1; s.playoff.final = [me, otherW]; }
        else {
          const [fa, fb] = simGame(s, g.oppId, otherW);
          endSeason(s, fa > fb ? g.oppId : otherW, 'Lost in the semifinal');
        }
      } else if (won) { earned += 5; endSeason(s, me, 'CHAMPIONS'); }
      else endSeason(s, g.oppId, 'Lost the championship');
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
      if (r.age <= 26) r.ovr += GP.rint(0, 2);
      else if (r.age >= 31) r.ovr -= GP.rint(1, 4);
      if (r.age >= 36) { // retirement: a rookie takes over
        r.name = GP.pick(FIRST) + ' ' + GP.pick(LAST); r.age = 22; r.ovr = GP.rint(60, 68); r.rookie = true;
      }
      r.ovr = GP.clamp(r.ovr, 50, 99);
    }
    for (const t of s.teams) {
      t.w = t.l = t.pf = t.pa = 0;
      if (t.id !== s.teamId) { t.off = GP.clamp(t.off + GP.rint(-3, 3), 60, 92); t.def = GP.clamp(t.def + GP.rint(-3, 3), 60, 92); }
    }
    s.schedule = roundRobin(s.teams.map((t) => t.id));
    GP.syncUser(s); GP.save(s);
  };

  GP.upgradeCost = (ovr) => (ovr >= 99 ? Infinity : ovr >= 85 ? 2 : 1);
  GP.upgrade = function (s, key) {
    const r = s.roster[key], c = GP.upgradeCost(r.ovr);
    if (s.credits < c) return false;
    s.credits -= c; r.ovr++; GP.syncUser(s); GP.save(s);
    return true;
  };

  const KEY = 'pocket-gridiron-save';
  GP.save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  GP.load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } };
  GP.wipe = () => { try { localStorage.removeItem(KEY); } catch (e) {} };
})();
