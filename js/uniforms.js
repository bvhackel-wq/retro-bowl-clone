// Each team's four uniforms, modeled on its NFL counterpart and drawn only from that team's official
// palette (hex values below). Parts: helmet, helmet decal/stripe, facemask, jersey, numbers, pants, socks.
// home: the dark jersey; away: white; alt: the team's alternate or throwback; rush: a Color Rush-style
// monochrome. No logos. The NFL team each set is modeled on is noted after its id.
(function () {
  const GP = (window.GP = window.GP || {});
  const U = {
    hbk: { // BAL
      home: ['#000000', '#9e7c0c', '#000000', '#241773', '#ffffff', '#ffffff', '#000000'],
      away: ['#000000', '#9e7c0c', '#000000', '#ffffff', '#241773', '#000000', '#000000'],
      alt: ['#000000', '#9e7c0c', '#000000', '#000000', '#ffffff', '#000000', '#000000'],
      rush: ['#000000', '#9e7c0c', '#000000', '#241773', '#ffffff', '#241773', '#241773'],
    },
    dlr: { // CIN
      home: ['#fb4f14', '#000000', '#000000', '#000000', '#fb4f14', '#ffffff', '#000000'],
      away: ['#fb4f14', '#000000', '#000000', '#ffffff', '#000000', '#ffffff', '#000000'],
      alt: ['#ffffff', '#000000', '#000000', '#ffffff', '#fb4f14', '#ffffff', '#ffffff'],
      rush: ['#fb4f14', '#000000', '#000000', '#fb4f14', '#000000', '#fb4f14', '#fb4f14'],
    },
    tfo: { // CLE
      home: ['#ff3c00', '#311d00', '#311d00', '#311d00', '#ffffff', '#ffffff', '#ff3c00'],
      away: ['#ff3c00', '#311d00', '#311d00', '#ffffff', '#311d00', '#ff3c00', '#311d00'],
      alt: ['#ffffff', '#311d00', '#311d00', '#ffffff', '#ff3c00', '#ffffff', '#ffffff'],
      rush: ['#ff3c00', '#311d00', '#311d00', '#311d00', '#ff3c00', '#311d00', '#311d00'],
    },
    ivf: { // PIT
      home: ['#101820', '#ffb612', '#101820', '#101820', '#ffb612', '#ffb612', '#101820'],
      away: ['#101820', '#ffb612', '#101820', '#ffffff', '#101820', '#ffb612', '#101820'],
      alt: ['#101820', '#ffb612', '#101820', '#101820', '#ffffff', '#ffb612', '#ffb612'],
      rush: ['#101820', '#ffb612', '#101820', '#101820', '#ffb612', '#101820', '#101820'],
    },
    gln: { // BUF
      home: ['#ffffff', '#c60c30', '#00338d', '#00338d', '#ffffff', '#ffffff', '#00338d'],
      away: ['#ffffff', '#c60c30', '#00338d', '#ffffff', '#00338d', '#00338d', '#00338d'],
      alt: ['#c60c30', '#ffffff', '#00338d', '#00338d', '#ffffff', '#ffffff', '#c60c30'],
      rush: ['#ffffff', '#c60c30', '#00338d', '#c60c30', '#ffffff', '#c60c30', '#c60c30'],
    },
    gss: { // MIA
      home: ['#ffffff', '#008e97', '#008e97', '#008e97', '#ffffff', '#ffffff', '#008e97'],
      away: ['#ffffff', '#008e97', '#008e97', '#ffffff', '#008e97', '#008e97', '#008e97'],
      alt: ['#ffffff', '#fc4c02', '#008e97', '#008e97', '#fc4c02', '#ffffff', '#fc4c02'],
      rush: ['#ffffff', '#008e97', '#008e97', '#008e97', '#ffffff', '#008e97', '#008e97'],
    },
    cps: { // NE
      home: ['#b0b7bc', '#c60c30', '#002244', '#002244', '#ffffff', '#002244', '#002244'],
      away: ['#b0b7bc', '#c60c30', '#002244', '#ffffff', '#002244', '#002244', '#002244'],
      alt: ['#ffffff', '#c60c30', '#c60c30', '#c60c30', '#ffffff', '#ffffff', '#c60c30'],
      rush: ['#b0b7bc', '#c60c30', '#002244', '#002244', '#c60c30', '#002244', '#002244'],
    },
    gbg: { // NYJ
      home: ['#125740', '#ffffff', '#125740', '#125740', '#ffffff', '#ffffff', '#125740'],
      away: ['#125740', '#ffffff', '#125740', '#ffffff', '#125740', '#ffffff', '#125740'],
      alt: ['#000000', '#125740', '#000000', '#000000', '#ffffff', '#000000', '#000000'],
      rush: ['#125740', '#ffffff', '#125740', '#125740', '#ffffff', '#125740', '#125740'],
    },
    sba: { // HOU
      home: ['#03202f', '#a71930', '#03202f', '#03202f', '#ffffff', '#ffffff', '#03202f'],
      away: ['#03202f', '#a71930', '#03202f', '#ffffff', '#03202f', '#03202f', '#a71930'],
      alt: ['#a71930', '#03202f', '#03202f', '#a71930', '#ffffff', '#a71930', '#a71930'],
      rush: ['#03202f', '#a71930', '#03202f', '#03202f', '#a71930', '#03202f', '#03202f'],
    },
    opf: { // IND
      home: ['#ffffff', '#002c5f', '#002c5f', '#002c5f', '#ffffff', '#ffffff', '#002c5f'],
      away: ['#ffffff', '#002c5f', '#002c5f', '#ffffff', '#002c5f', '#ffffff', '#002c5f'],
      alt: ['#002c5f', '#ffffff', '#a2aaad', '#002c5f', '#a2aaad', '#002c5f', '#002c5f'],
      rush: ['#ffffff', '#002c5f', '#002c5f', '#ffffff', '#002c5f', '#ffffff', '#ffffff'],
    },
    pmo: { // JAX
      home: ['#101820', '#d7a22a', '#101820', '#101820', '#ffffff', '#ffffff', '#101820'],
      away: ['#101820', '#d7a22a', '#101820', '#ffffff', '#006778', '#101820', '#101820'],
      alt: ['#006778', '#d7a22a', '#101820', '#006778', '#ffffff', '#ffffff', '#006778'],
      rush: ['#101820', '#d7a22a', '#101820', '#006778', '#d7a22a', '#006778', '#006778'],
    },
    ozo: { // TEN
      home: ['#0c2340', '#4b92db', '#8a8d8f', '#0c2340', '#ffffff', '#ffffff', '#0c2340'],
      away: ['#0c2340', '#4b92db', '#8a8d8f', '#ffffff', '#0c2340', '#0c2340', '#0c2340'],
      alt: ['#ffffff', '#c8102e', '#0c2340', '#4b92db', '#c8102e', '#ffffff', '#4b92db'],
      rush: ['#0c2340', '#4b92db', '#8a8d8f', '#4b92db', '#0c2340', '#4b92db', '#4b92db'],
    },
    smy: { // DEN
      home: ['#002244', '#fb4f14', '#002244', '#fb4f14', '#ffffff', '#ffffff', '#002244'],
      away: ['#002244', '#fb4f14', '#002244', '#ffffff', '#fb4f14', '#002244', '#002244'],
      alt: ['#ffffff', '#fb4f14', '#002244', '#ffffff', '#002244', '#ffffff', '#ffffff'],
      rush: ['#002244', '#fb4f14', '#002244', '#002244', '#fb4f14', '#002244', '#002244'],
    },
    prt: { // KC
      home: ['#e31837', '#ffffff', '#ffffff', '#e31837', '#ffffff', '#ffffff', '#e31837'],
      away: ['#e31837', '#ffffff', '#ffffff', '#ffffff', '#e31837', '#e31837', '#e31837'],
      alt: ['#e31837', '#ffffff', '#ffffff', '#ffffff', '#e31837', '#ffffff', '#ffffff'],
      rush: ['#e31837', '#ffffff', '#ffffff', '#e31837', '#ffb81c', '#e31837', '#e31837'],
    },
    mgf: { // LV
      home: ['#a5acaf', '#000000', '#000000', '#000000', '#ffffff', '#a5acaf', '#000000'],
      away: ['#a5acaf', '#000000', '#000000', '#ffffff', '#000000', '#a5acaf', '#000000'],
      alt: ['#a5acaf', '#000000', '#000000', '#000000', '#a5acaf', '#000000', '#000000'],
      rush: ['#a5acaf', '#000000', '#000000', '#ffffff', '#000000', '#ffffff', '#ffffff'],
    },
    gcc: { // LAC
      home: ['#ffffff', '#ffc20e', '#002a5e', '#0080c6', '#ffffff', '#ffffff', '#0080c6'],
      away: ['#ffffff', '#ffc20e', '#002a5e', '#ffffff', '#0080c6', '#0080c6', '#0080c6'],
      alt: ['#002a5e', '#ffc20e', '#002a5e', '#002a5e', '#ffffff', '#002a5e', '#002a5e'],
      rush: ['#ffffff', '#ffc20e', '#002a5e', '#0080c6', '#ffffff', '#0080c6', '#0080c6'],
    },
    fth: { // CHI
      home: ['#0b162a', '#c83803', '#0b162a', '#0b162a', '#ffffff', '#ffffff', '#0b162a'],
      away: ['#0b162a', '#c83803', '#0b162a', '#ffffff', '#0b162a', '#ffffff', '#0b162a'],
      alt: ['#c83803', '#0b162a', '#0b162a', '#c83803', '#0b162a', '#0b162a', '#c83803'],
      rush: ['#0b162a', '#c83803', '#0b162a', '#0b162a', '#c83803', '#0b162a', '#0b162a'],
    },
    rvv: { // DET
      home: ['#b0b7bc', '#0076b6', '#0076b6', '#0076b6', '#ffffff', '#b0b7bc', '#0076b6'],
      away: ['#b0b7bc', '#0076b6', '#0076b6', '#ffffff', '#0076b6', '#b0b7bc', '#0076b6'],
      alt: ['#000000', '#0076b6', '#0076b6', '#000000', '#0076b6', '#000000', '#000000'],
      rush: ['#b0b7bc', '#0076b6', '#0076b6', '#0076b6', '#b0b7bc', '#0076b6', '#0076b6'],
    },
    lsl: { // GB
      home: ['#ffb612', '#203731', '#203731', '#203731', '#ffffff', '#ffb612', '#203731'],
      away: ['#ffb612', '#203731', '#203731', '#ffffff', '#203731', '#ffb612', '#203731'],
      alt: ['#ffffff', '#203731', '#ffffff', '#203731', '#ffb612', '#ffb612', '#203731'],
      rush: ['#ffb612', '#203731', '#203731', '#ffffff', '#203731', '#ffffff', '#ffffff'],
    },
    tlm: { // MIN
      home: ['#4f2683', '#ffffff', '#4f2683', '#4f2683', '#ffffff', '#ffffff', '#4f2683'],
      away: ['#4f2683', '#ffffff', '#4f2683', '#ffffff', '#4f2683', '#4f2683', '#4f2683'],
      alt: ['#ffffff', '#4f2683', '#4f2683', '#ffffff', '#4f2683', '#ffffff', '#ffffff'],
      rush: ['#4f2683', '#ffffff', '#4f2683', '#4f2683', '#ffc62f', '#4f2683', '#4f2683'],
    },
    dbc: { // DAL
      home: ['#869397', '#003594', '#041e42', '#ffffff', '#003594', '#869397', '#003594'],
      away: ['#869397', '#003594', '#041e42', '#041e42', '#ffffff', '#869397', '#041e42'],
      alt: ['#ffffff', '#003594', '#041e42', '#003594', '#ffffff', '#ffffff', '#003594'],
      rush: ['#869397', '#003594', '#041e42', '#ffffff', '#003594', '#ffffff', '#ffffff'],
    },
    lso: { // NYG
      home: ['#0b2265', '#ffffff', '#a5acaf', '#0b2265', '#ffffff', '#a5acaf', '#0b2265'],
      away: ['#0b2265', '#ffffff', '#a5acaf', '#ffffff', '#0b2265', '#a5acaf', '#a71930'],
      alt: ['#0b2265', '#ffffff', '#a5acaf', '#a71930', '#ffffff', '#a5acaf', '#a71930'],
      rush: ['#0b2265', '#ffffff', '#a5acaf', '#ffffff', '#0b2265', '#ffffff', '#ffffff'],
    },
    byb: { // PHI
      home: ['#004c54', '#a5acaf', '#000000', '#004c54', '#ffffff', '#ffffff', '#000000'],
      away: ['#004c54', '#a5acaf', '#000000', '#ffffff', '#004c54', '#004c54', '#000000'],
      alt: ['#00843d', '#ffffff', '#a5acaf', '#00843d', '#ffffff', '#a5acaf', '#00843d'],
      rush: ['#000000', '#a5acaf', '#000000', '#000000', '#ffffff', '#000000', '#000000'],
    },
    twh: { // WAS
      home: ['#5a1414', '#ffb612', '#5a1414', '#5a1414', '#ffb612', '#ffb612', '#5a1414'],
      away: ['#5a1414', '#ffb612', '#5a1414', '#ffffff', '#5a1414', '#5a1414', '#5a1414'],
      alt: ['#000000', '#ffb612', '#000000', '#000000', '#ffb612', '#000000', '#000000'],
      rush: ['#5a1414', '#ffb612', '#5a1414', '#ffffff', '#5a1414', '#ffffff', '#ffffff'],
    },
    msr: { // ATL
      home: ['#000000', '#a71930', '#000000', '#000000', '#ffffff', '#ffffff', '#000000'],
      away: ['#000000', '#a71930', '#000000', '#ffffff', '#000000', '#000000', '#000000'],
      alt: ['#a71930', '#000000', '#a5acaf', '#a71930', '#ffffff', '#ffffff', '#a71930'],
      rush: ['#000000', '#a71930', '#000000', '#a71930', '#000000', '#a71930', '#a71930'],
    },
    vce: { // CAR
      home: ['#bfc0bf', '#0085ca', '#101820', '#0085ca', '#ffffff', '#bfc0bf', '#0085ca'],
      away: ['#bfc0bf', '#0085ca', '#101820', '#ffffff', '#0085ca', '#bfc0bf', '#0085ca'],
      alt: ['#101820', '#0085ca', '#101820', '#101820', '#0085ca', '#101820', '#101820'],
      rush: ['#bfc0bf', '#0085ca', '#101820', '#0085ca', '#ffffff', '#0085ca', '#0085ca'],
    },
    byg: { // NO
      home: ['#d3bc8d', '#101820', '#101820', '#101820', '#d3bc8d', '#d3bc8d', '#101820'],
      away: ['#d3bc8d', '#101820', '#101820', '#ffffff', '#101820', '#d3bc8d', '#101820'],
      alt: ['#101820', '#d3bc8d', '#101820', '#101820', '#d3bc8d', '#101820', '#101820'],
      rush: ['#d3bc8d', '#101820', '#101820', '#ffffff', '#d3bc8d', '#ffffff', '#ffffff'],
    },
    rwl: { // TB
      home: ['#34302b', '#d50a0a', '#0a0a08', '#d50a0a', '#ffffff', '#34302b', '#d50a0a'],
      away: ['#34302b', '#d50a0a', '#0a0a08', '#ffffff', '#d50a0a', '#34302b', '#d50a0a'],
      alt: ['#ffffff', '#ff7900', '#d50a0a', '#ff7900', '#d50a0a', '#ffffff', '#ff7900'],
      rush: ['#34302b', '#d50a0a', '#0a0a08', '#34302b', '#d50a0a', '#34302b', '#34302b'],
    },
    cys: { // ARI
      home: ['#ffffff', '#97233f', '#000000', '#97233f', '#ffffff', '#ffffff', '#97233f'],
      away: ['#ffffff', '#97233f', '#000000', '#ffffff', '#97233f', '#ffffff', '#97233f'],
      alt: ['#000000', '#97233f', '#000000', '#000000', '#ffffff', '#000000', '#000000'],
      rush: ['#ffffff', '#97233f', '#000000', '#97233f', '#ffffff', '#97233f', '#97233f'],
    },
    nbc: { // LAR
      home: ['#003594', '#ffd100', '#003594', '#003594', '#ffffff', '#ffffff', '#003594'],
      away: ['#003594', '#ffd100', '#003594', '#ffffff', '#003594', '#ffd100', '#003594'],
      alt: ['#003594', '#ffd100', '#ffffff', '#003594', '#ffd100', '#ffd100', '#003594'],
      rush: ['#003594', '#ffd100', '#003594', '#003594', '#ffd100', '#003594', '#003594'],
    },
    srp: { // SF
      home: ['#b3995d', '#aa0000', '#aa0000', '#aa0000', '#ffffff', '#b3995d', '#aa0000'],
      away: ['#b3995d', '#aa0000', '#aa0000', '#ffffff', '#aa0000', '#b3995d', '#aa0000'],
      alt: ['#ffffff', '#aa0000', '#aa0000', '#ffffff', '#aa0000', '#ffffff', '#ffffff'],
      rush: ['#b3995d', '#aa0000', '#aa0000', '#aa0000', '#b3995d', '#aa0000', '#aa0000'],
    },
    csq: { // SEA
      home: ['#002244', '#69be28', '#002244', '#002244', '#ffffff', '#a5acaf', '#002244'],
      away: ['#002244', '#69be28', '#002244', '#ffffff', '#002244', '#002244', '#002244'],
      alt: ['#002244', '#69be28', '#002244', '#a5acaf', '#002244', '#002244', '#002244'],
      rush: ['#002244', '#69be28', '#002244', '#69be28', '#002244', '#69be28', '#69be28'],
    },
  };
  GP.UNIFORM_TYPES = [['home', 'Home'], ['away', 'Away'], ['alt', 'Alternate'], ['rush', 'Color Rush']];
  const KEYS = ['helmet', 'decal', 'mask', 'jersey', 'number', 'pants', 'sock'];
  // a team's kit as named parts; a team without a set falls back to its two colors
  GP.kit = function (teamId, type) {
    const set = U[teamId], t = GP.team(teamId);
    const v = set ? set[type] || set.home : type === 'away'
      ? [t.c1, t.c2, '#d9dde3', '#f4f6f8', t.c1, t.c1, '#f4f6f8'] : [t.c1, t.c2, '#d9dde3', t.c1, t.c2, t.c2, t.c1];
    const k = {}; KEYS.forEach((key, i) => { k[key] = v[i]; }); return k;
  };
  // how far apart two colors look (0 = the same, ~1.7 = black against white)
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  GP.colorGap = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], (x[1] - y[1]) * 1.3, x[2] - y[2]); };
  // Which uniforms the two teams wear. Yours is your pick ('auto': home at home, away on the road); the
  // opponent wears home at home and white on the road, and if its jersey looks too much like yours it
  // switches (to its other main set, then its alternate, then its Color Rush).
  GP.matchKits = function (meId, oppId, iAmHome, myType) {
    const mt = !myType || myType === 'auto' ? (iAmHome ? 'home' : 'away') : myType, me = GP.kit(meId, mt);
    const first = iAmHome ? 'away' : 'home', order = [first, first === 'home' ? 'away' : 'home', 'alt', 'rush'];
    let ot = order[0];
    for (const t of order) if (GP.colorGap(me.jersey, GP.kit(oppId, t).jersey) >= 0.45) { ot = t; break; }
    return { me, opp: GP.kit(oppId, ot), myType: mt, oppType: ot };
  };
})();
