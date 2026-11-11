// Pixel-art helpers: a 5x7 bitmap font, player sprites, and the pre-rendered field.
// Everything here draws whole "art pixels" onto a low-resolution canvas that is scaled up without smoothing.
(function () {
  const GP = (window.GP = window.GP || {});

  // ---------- 5x7 font ----------
  const FONT = {
    A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
    C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
    E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
    G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
    I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
    K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
    M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001',
    O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
    Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
    S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
    U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
    W: '10001 10001 10001 10101 10101 11011 10001', X: '10001 10001 01010 00100 01010 10001 10001',
    Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
    0: '01110 10001 10001 10001 10001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
    2: '01110 10001 00001 00010 00100 01000 11111', 3: '11110 00001 00001 01110 00001 00001 11110',
    4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
    6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
    8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
    '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000',
    '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100',
    '#': '01010 01010 11111 01010 11111 01010 01010', '-': '00000 00000 00000 11111 00000 00000 00000',
    '·': '00000 00000 00000 00100 00000 00000 00000', '/': '00001 00010 00010 00100 01000 01000 10000',
    '(': '00010 00100 01000 01000 01000 00100 00010', ')': '01000 00100 00010 00010 00010 00100 01000',
    ':': '00000 01100 01100 00000 01100 01100 00000', "'": '00100 00100 01000 00000 00000 00000 00000',
    '%': '11001 11010 00010 00100 01000 01011 10011', '+': '00000 00100 00100 11111 00100 00100 00000',
    '…': '00000 00000 00000 00000 00000 00000 10101', '&': '01100 10010 10100 01000 10101 10010 01101',
    '*': '00000 10101 01110 11111 01110 10101 00000',
  };
  const GLYPH = {};
  for (const c in FONT) GLYPH[c] = FONT[c].split(' ').map((r) => parseInt(r, 2));
  const ALIAS = { '—': '-', '–': '-', '★': '*', '’': "'" };
  const glyph = (ch) => GLYPH[ALIAS[ch] || ch] || GLYPH[(ALIAS[ch] || ch).toUpperCase()];

  const P = (GP.Pixel = {});
  P.width = (str, scale) => (String(str).length * 6 - 1) * (scale || 1);
  // rot: 0 upright; -1 reads bottom-to-top; 1 reads top-to-bottom. (x, y) is the top-left of the text,
  // or its centre along the reading direction when o.center is set.
  P.text = function (g, str, x, y, color, scale, o) {
    str = String(str); scale = scale || 1; o = o || {};
    const rot = o.rot || 0, w = P.width(str, scale);
    if (o.center) { if (rot === 0) x -= Math.floor(w / 2); else y += rot === -1 ? Math.floor(w / 2) : -Math.floor(w / 2); }
    const put = (px, py) => {
      if (rot === 0) g.fillRect(x + px, y + py, scale, scale);
      else if (rot === -1) g.fillRect(x + py, y - px - scale, scale, scale);
      else g.fillRect(x - py - scale, y + px, scale, scale);
    };
    const pass = (dx, dy, col) => {
      g.fillStyle = col;
      for (let i = 0; i < str.length; i++) {
        const gl = glyph(str[i]); if (!gl) continue;
        for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++)
          if (gl[r] & (16 >> c)) put((i * 6 + c) * scale + dx, r * scale + dy);
      }
    };
    if (o.shadow) pass(1, 1, o.shadow);
    pass(0, 0, color);
  };
  P.box = function (g, x, y, w, h, fill, border) {
    g.fillStyle = border || fill; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle = fill; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  };
  // a row of single pixels from (x0,y0) to (x1,y1), one every `gap` pixels
  P.dots = function (g, x0, y0, x1, y1, color, gap, size) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.floor(d / (gap || 3)));
    g.fillStyle = color; size = size || 1;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), size, size);
  };
  P.ring = function (g, cx, cy, rx, ry, color) {
    g.fillStyle = color;
    const n = Math.ceil((rx + ry) * 3.2);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); }
  };

  // ---------- player sprites (10x14 plus a 1px dark outline, facing right) ----------
  // H helmet, h helmet decal, F face, M facemask, J jersey, N number, S skin, P pants, L sock, B boot
  const HEAD = ['...HHHH...', '..HHHHHH..', '..HhhHFFM.', '..HHHHFFM.'];
  const POSES = {
    stand: [...HEAD, '..JJJJJJ..', '.SJJJJJJS.', '.SJJNNJJS.', '..JJJJJJ..', '..PPPPPP..', '..PP..PP..', '..PP..PP..', '..LL..LL..', '..LL..LL..', '..BB..BBB.'],
    run1: [...HEAD, '..JJJJJJ..', '..JJJJJJSS', 'SSJJNNJJ..', '..JJJJJJ..', '..PPPPPP..', '.PPP..PPP.', 'PP......PP', 'LL......LL', 'BB......BB', '..........'],
    run2: [...HEAD, '..JJJJJJ..', 'SSJJJJJJ..', '..JJNNJJSS', '..JJJJJJ..', '..PPPPPP..', '...PPPP...', '...PPPP...', '...LLLL...', '..LLL.L...', '..BBB.BB..'],
  };
  const SKIN = ['#f1c9a5', '#c68e5f', '#7a4a2a'], OUTLINE = '#10182a';
  function render(rows, pal, flip, lying) {
    const w = rows[0].length, hgt = rows.length, c = document.createElement('canvas');
    const W2 = (lying ? hgt : w) + 2, H2 = (lying ? w : hgt) + 2;
    c.width = W2; c.height = H2;
    const grid = Array.from({ length: H2 }, () => Array(W2).fill(null));
    for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
      const col = pal[rows[y][flip ? w - 1 - x : x]]; if (!col) continue;
      if (lying) grid[x + 1][(flip ? y : hgt - 1 - y) + 1] = col; else grid[y + 1][x + 1] = col;
    }
    const g = c.getContext('2d');
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      let col = grid[y][x];
      if (!col) {
        const near = (grid[y - 1] && grid[y - 1][x]) || (grid[y + 1] && grid[y + 1][x]) || grid[y][x - 1] || grid[y][x + 1];
        if (!near) continue;
        col = OUTLINE;
      }
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    return c;
  }
  // kit: { helmet, decal, jersey, number, pants, sock }. Returns sprites[skin][pose][0 right | 1 left].
  P.sprites = function (kit) {
    return SKIN.map((skin) => {
      const pal = { H: kit.helmet, h: kit.decal, F: skin, M: '#d9dde3', J: kit.jersey, N: kit.number, S: skin, P: kit.pants, L: kit.sock, B: '#1b1b22' };
      const set = {};
      for (const k in POSES) set[k] = [render(POSES[k], pal, false), render(POSES[k], pal, true)];
      set.down = [render(POSES.stand, pal, false, true), render(POSES.stand, pal, true, true)];
      return set;
    });
  };

  // ---------- the field, drawn once ----------
  // ya: art pixels per yard; top: height of the band above and below the field; fw: field width in yards.
  // The canvas covers x from -pad to 120+pad yards.
  P.field = function (me, opp, ya, top, fw, pad) {
    const X = (yd) => Math.round((yd + pad) * ya), fh = Math.round(fw * ya), c = document.createElement('canvas');
    c.width = X(120 + pad); c.height = fh + top * 2;
    const g = c.getContext('2d');
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // stands and crowd, top and bottom
    const crowd = [me.c1, me.c2, opp.c1, opp.c2, '#e9e4d8', '#c68e5f', '#7a4a2a', '#f1c9a5', '#3b4252'];
    for (const y0 of [0, top + fh + 4]) {
      g.fillStyle = '#1c2434'; g.fillRect(0, y0, c.width, top - 4);
      for (let y = y0 + 1; y < y0 + top - 6; y += 3) for (let x = (y % 2) * 2; x < c.width; x += 4) {
        if (rnd() < 0.12) continue;
        g.fillStyle = crowd[Math.floor(rnd() * crowd.length)]; g.fillRect(x, y, 2, 2);
      }
    }
    g.fillStyle = '#8b93a3'; g.fillRect(0, top - 5, c.width, 1); g.fillRect(0, top + fh + 4, c.width, 1);   // rails
    g.fillStyle = '#1f6b47'; g.fillRect(0, top - 4, c.width, fh + 8);                                       // apron
    // turf: alternating five-yard stripes, coloured end zones
    for (let i = 0; i < 24; i++) {
      g.fillStyle = i < 2 ? me.c1 : i >= 22 ? opp.c1 : i % 2 ? '#2f9460' : '#28855a';
      g.fillRect(X(i * 5), top, X(i * 5 + 5) - X(i * 5), fh);
    }
    // mowing texture
    for (let i = 0; i < 2600; i++) {
      const x = X(10) + Math.floor(rnd() * (X(110) - X(10))), y = top + Math.floor(rnd() * fh);
      g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.07)'; g.fillRect(x, y, 1, 1);
    }
    // yard lines, hash marks, numbers
    for (let yd = 10; yd <= 110; yd++) {
      if (yd % 5 === 0) { g.fillStyle = '#dff3e6'; g.fillRect(X(yd), top, 1, fh); }
      else { g.fillStyle = '#cfe8d8'; for (const y of [top + 1, top + Math.round(fh / 3), top + Math.round((fh * 2) / 3), top + fh - 3]) g.fillRect(X(yd), y, 1, 2); }
    }
    for (let yd = 20; yd <= 100; yd += 10) {
      const n = 50 - Math.abs(60 - yd);
      for (const y of [top + 20, top + fh - 34]) P.text(g, n, X(yd) + 1, y, 'rgba(255,255,255,.6)', 2, { center: true });
    }
    // midfield mark and end-zone lettering
    P.ring(g, X(60), top + Math.round(fh / 2), 17, 17, 'rgba(255,255,255,.45)');
    P.text(g, 'PG', X(60) + 1, top + Math.round(fh / 2) - 7, 'rgba(255,255,255,.5)', 2, { center: true });
    const mid = top + Math.round(fh / 2);
    P.text(g, me.name, X(5) - 10, mid, me.c2, 3, { rot: -1, center: true, shadow: 'rgba(0,0,0,.35)' });
    P.text(g, opp.name, X(115) + 11, mid, opp.c2, 3, { rot: 1, center: true, shadow: 'rgba(0,0,0,.35)' });
    // boundary lines and goal posts
    g.fillStyle = '#f4f6f8';
    g.fillRect(X(0), top - 1, X(120) - X(0) + 1, 2); g.fillRect(X(0), top + fh - 1, X(120) - X(0) + 1, 2);
    for (const yd of [0, 10, 110, 120]) g.fillRect(X(yd), top, yd === 0 || yd === 120 ? 2 : 1, fh);
    g.fillStyle = '#ffd84a';
    for (const yd of [0, 120]) {
      const x = X(yd) + (yd ? 2 : -3), y0 = mid - Math.round(3 * ya), y1 = mid + Math.round(3 * ya);
      g.fillRect(x, y0, 2, y1 - y0); g.fillRect(x - 1, y0 - 1, 4, 2); g.fillRect(x - 1, y1 - 1, 4, 2);
    }
    return c;
  };
})();
