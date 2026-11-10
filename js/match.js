// On-field game: play calling, live play simulation, kicking, clock and drives.
(function () {
  const GP = window.GP;
  const { rnd, clamp } = GP;

  const W = 960, H = 540;          // logical canvas size
  const FW = 36;                   // field width in yards
  const PPY = 13;                  // pixels per yard
  const TOP = (H - FW * PPY) / 2;
  const VIEW = W / PPY;            // yards visible horizontally
  const MID = FW / 2;
  const QLEN = 120;                // seconds per quarter
  const RUNOFF = 8;                // extra clock burned after an in-bounds play

  // Route points are [yards downfield, yards toward the middle of the field] from the receiver's start.
  const PLAYS = [
    { id: 'slants', name: 'Quick Slants', type: 'pass', desc: 'Fast throws inside',
      routes: { WR1: { pts: [[3, 0], [13, 10]] }, WR2: { pts: [[3, 0], [13, 10]] }, TE: { pts: [[6, 0]], stop: true }, RB: { pts: [[0, -6], [5, -9]] } } },
    { id: 'verts', name: 'Verticals', type: 'pass', desc: 'Everybody deep',
      routes: { WR1: { pts: [[45, 0]] }, WR2: { pts: [[45, 0]] }, TE: { pts: [[10, 0], [45, 3]] }, RB: { pts: [[2, -5]], stop: true } } },
    { id: 'post', name: 'Post & Cross', type: 'pass', desc: 'Deep post, TE crossing',
      routes: { WR1: { pts: [[12, 0], [40, 12]] }, WR2: { pts: [[10, 0], [12, -2]], stop: true }, TE: { pts: [[5, 0], [9, 16]] }, RB: { pts: [[1, -6], [14, -10]] } } },
    { id: 'curls', name: 'Curls', type: 'pass', desc: 'Receivers stop at 11',
      routes: { WR1: { pts: [[13, 0], [11, 1.5]], stop: true }, WR2: { pts: [[13, 0], [11, 1.5]], stop: true }, TE: { pts: [[6, 0], [8, -6]] }, RB: { pts: [[4, 3]], stop: true } } },
    { id: 'run', name: 'HB Run', type: 'run', desc: 'Hand off and steer' },
  ];

  const hyp = Math.hypot;
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.15;
  const ord = (n) => ['', '1st', '2nd', '3rd', '4th'][n];

  function go(p, tx, ty, sp, dt, acc) {
    const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy);
    let vx = 0, vy = 0;
    if (d > 0.15) { vx = (dx / d) * sp; vy = (dy / d) * sp; }
    const k = Math.min(1, acc * dt);
    p.vx += (vx - p.vx) * k; p.vy += (vy - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }

  class Match {
    // cfg: { me, opp (team objects), roster, oppOff, oppDef, label, onEnd(myPts, oppPts, stats) }
    constructor(canvas, cfg) {
      this.cv = canvas; this.g = canvas.getContext('2d'); this.cfg = cfg;
      this.el = {};
      for (const id of ['hud-me', 'hud-opp', 'hud-q', 'hud-clock', 'hud-down', 'hud-me-name', 'hud-opp-name', 'panel'])
        this.el[id] = document.getElementById(id);
      this.el['hud-me-name'].textContent = cfg.me.abbr;
      this.el['hud-opp-name'].textContent = cfg.opp.abbr;
      this.hudCache = {};

      const r = cfg.roster;
      this.maxRange = 30 + (r.QB.ovr - 60) * 0.6;
      this.scatter = Math.max(0.015, 0.085 - (r.QB.ovr - 60) * 0.0015);

      this.q = 1; this.clock = QLEN;
      this.score = { me: 0, opp: 0 };
      this.stats = { att: 0, comp: 0, pyd: 0, ptd: 0, int: 0, ryd: 0, rtd: 0, sack: 0 };
      this.keys = {}; this.pointer = null; this.aim = null; this.banner = null; this.kick = null;
      this.camX = 0; this.off = []; this.def = []; this.ball = { state: 'held' };

      this.onDown = (e) => this.pDown(e); this.onMove = (e) => this.pMove(e); this.onUp = (e) => this.pUp(e);
      this.onKey = (e) => this.key(e, true); this.onKeyUp = (e) => this.key(e, false);
      canvas.addEventListener('pointerdown', this.onDown);
      canvas.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp);
      window.addEventListener('pointercancel', this.onUp);
      window.addEventListener('keydown', this.onKey);
      window.addEventListener('keyup', this.onKeyUp);

      this.startDrive(35);
      this.last = performance.now();
      this.frame = (now) => {
        if (this.dead) return;
        const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
        this.update(dt); this.draw();
        this.raf = requestAnimationFrame(this.frame);
      };
      this.raf = requestAnimationFrame(this.frame);
    }

    destroy() {
      this.dead = true; cancelAnimationFrame(this.raf);
      this.cv.removeEventListener('pointerdown', this.onDown);
      this.cv.removeEventListener('pointermove', this.onMove);
      window.removeEventListener('pointerup', this.onUp);
      window.removeEventListener('pointercancel', this.onUp);
      window.removeEventListener('keydown', this.onKey);
      window.removeEventListener('keyup', this.onKeyUp);
      this.hidePanel();
    }

    // ---------- input ----------
    pos(e) {
      const r = this.cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    pDown(e) {
      e.preventDefault();
      const p = this.pos(e);
      if (this.phase === 'presnap') return this.snap();
      if (this.phase === 'kick') return this.doKick();
      if (this.phase !== 'live') return;
      if (this.carrier === this.qb && this.play.type === 'pass') this.aim = { sx: p.x, sy: p.y, cx: p.x, cy: p.y };
      else this.pointer = p;
    }
    pMove(e) {
      const p = this.pos(e);
      if (this.aim) { this.aim.cx = p.x; this.aim.cy = p.y; }
      else if (this.pointer) this.pointer = p;
    }
    pUp() {
      if (this.aim && this.phase === 'live' && this.carrier === this.qb) {
        const a = this.aim;
        if (hyp(a.sx - a.cx, a.sy - a.cy) > 14) { const t = this.aimTarget(); this.throwBall(t.x, t.y); }
      }
      this.aim = null; this.pointer = null;
    }
    key(e, down) {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      this.keys[k] = down;
      if (down && k === ' ' && !e.repeat) {
        if (this.phase === 'presnap') this.snap();
        else if (this.phase === 'kick') this.doKick();
      }
    }
    aimTarget() {
      const a = this.aim, qb = this.qb;
      let vx = ((a.sx - a.cx) / PPY) * 2.2, vy = ((a.sy - a.cy) / PPY) * 2.2;
      const d = hyp(vx, vy);
      if (d > this.maxRange) { vx *= this.maxRange / d; vy *= this.maxRange / d; }
      return { x: qb.x + vx, y: qb.y + vy };
    }

    // ---------- panels ----------
    showPanel(title, text, opts, modal) {
      const p = this.el.panel;
      p.className = modal ? 'modal' : '';
      p.innerHTML = '';
      const h = document.createElement('h3'); h.textContent = title; p.appendChild(h);
      if (text) { const t = document.createElement('p'); t.textContent = text; p.appendChild(t); }
      const row = document.createElement('div'); row.className = 'opts'; p.appendChild(row);
      for (const o of opts) {
        const b = document.createElement('button');
        b.className = modal ? 'btn' : 'opt' + (o.kick ? ' kick' : '');
        if (modal) b.textContent = o.label;
        else { const n = document.createElement('b'); n.textContent = o.label; const s = document.createElement('small'); s.textContent = o.sub || ''; b.append(n, s); }
        b.onclick = () => { this.hidePanel(); o.fn(); };
        row.appendChild(b);
      }
      p.hidden = false;
    }
    hidePanel() { this.el.panel.hidden = true; }

    // ---------- drive / down flow ----------
    startDrive(x) {
      this.los = clamp(x, 11, 105); this.down = 1; this.fdx = Math.min(this.los + 10, 110);
      this.toChoose();
    }
    downText() {
      const togo = this.fdx >= 110 ? 'Goal' : Math.max(1, Math.round(this.fdx - this.los));
      const yl = Math.round(this.los - 10);
      const on = yl === 50 ? '50' : yl < 50 ? 'own ' + yl : 'opp ' + (100 - yl);
      return `${ord(this.down)} & ${togo} · ${on}`;
    }
    toChoose() {
      this.phase = 'choose'; this.kick = null;
      this.setupFormation();
      const opts = PLAYS.map((p) => ({ label: p.name, sub: p.desc, fn: () => this.pickPlay(p) }));
      if (this.down === 4) {
        const dist = Math.round(110 - this.los + 17);
        if (dist <= 57) opts.push({ label: `Field Goal`, sub: `${dist} yards`, kick: true, fn: () => this.startKick('fg') });
        opts.push({ label: 'Punt', sub: 'Flip the field', kick: true, fn: () => this.punt() });
      }
      this.showPanel('Call a play — ' + this.downText(), '', opts);
    }
    pickPlay(p) {
      this.play = p; this.setupFormation(); this.phase = 'presnap';
    }
    snap() {
      if (this.play.type === 'run') for (const d of this.def) { d.shed *= 1.7; d.react = (d.react || 0) + 0.25; }
      this.phase = 'live'; this.t = 0; this.caught = false; this.pointer = null; this.aim = null;
    }

    mk(team, role, x, y, spd) {
      return { team, role, x, y, vx: 0, vy: 0, spd, wp: 0, dir: [1, 0], stun: 0, eng: 0, shed: rnd(0.7, 1.5), blocking: false };
    }
    setupFormation() {
      const L = this.los, r = this.cfg.roster, d = this.cfg.oppDef, M = (...a) => this.mk(...a);
      const wr = (o) => 6.6 + (o - 60) * 0.035;
      this.qb = M('O', 'QB', L - 5, MID, 5.5);
      const rb = M('O', 'RB', L - 5, MID + 3, wr(r.RB.ovr) + 0.1); rb.ovr = r.RB.ovr;
      const w1 = M('O', 'WR1', L - 0.6, 3, wr(r.WR1.ovr)); w1.ovr = r.WR1.ovr;
      const w2 = M('O', 'WR2', L - 0.6, FW - 3, wr(r.WR2.ovr)); w2.ovr = r.WR2.ovr;
      const te = M('O', 'TE', L - 0.6, MID - 7, 6.2 + (r.TE.ovr - 60) * 0.03); te.ovr = r.TE.ovr + 6;
      const ol = [-2.6, 0, 2.6].map((o) => M('O', 'OL', L - 0.6, MID + o, 5));
      this.off = [...ol, this.qb, rb, w1, w2, te];
      this.rb = rb;

      const db = 6.7 + (d - 60) * 0.03, lb = 6.3 + (d - 60) * 0.03, dls = 5.8 + (d - 60) * 0.02;
      const dl = [-2.6, 0, 2.6].map((o, i) => {
        const p = M('D', 'DL', L + 1, MID + o, dls); p.job = 'rush';
        p.shed = clamp(2.6 + rnd(0, 2.4) + (r.OL.ovr - d) * 0.05, 1.5, 7);
        ol[i].mark = p; return p;
      });
      const lb1 = M('D', 'LB', L + 5, MID - 5, lb); lb1.job = 'man'; lb1.mark = te; lb1.react = 0.3;
      const lb2 = M('D', 'LB', L + 5, MID + 4, lb); lb2.react = 0.3;
      if (Math.random() < 0.2) { lb2.job = 'rush'; lb2.shed = 0.5; } else { lb2.job = 'man'; lb2.mark = rb; }
      const c1 = M('D', 'CB', L + 6, 3.5, db); c1.job = 'man'; c1.mark = w1; c1.react = 0.7;
      const c2 = M('D', 'CB', L + 6, FW - 3.5, db); c2.job = 'man'; c2.mark = w2; c2.react = 0.7;
      const s = M('D', 'S', L + 13, MID, db); s.job = 'deep'; s.react = 0.6;
      for (const p of dl) p.react = 0;
      this.def = [...dl, lb1, lb2, c1, c2, s];

      if (this.play && this.play.type === 'pass') {
        for (const p of this.off) {
          const rt = this.play.routes[p.role];
          if (!rt) continue;
          const inS = p.y < MID ? 1 : -1;
          p.route = { stop: rt.stop, pts: rt.pts.map(([dx, dy]) => [Math.min(p.x + dx, 118), clamp(p.y + dy * inS, 1.2, FW - 1.2)]) };
        }
      }
      this.carrier = this.qb;
      this.ball = { state: 'held' };
    }

    // ---------- live play ----------
    tick(dt) { if (this.clock !== Infinity) this.clock = Math.max(0, this.clock - dt); }

    throwBall(tx, ty) {
      const qb = this.qb;
      const d = hyp(tx - qb.x, ty - qb.y), sd = d * this.scatter;
      tx += gauss() * sd; ty += gauss() * sd;
      this.ball = { state: 'air', sx: qb.x, sy: qb.y, tx, ty, u: 0, dur: 0.3 + d / 32, t0: this.t, dist: d };
      this.carrier = null; this.stats.att++;
      let best = null, bd = 12;
      for (const p of this.off) {
        if (p.role === 'OL' || p.role === 'QB') continue;
        const dd = hyp(p.x - tx, p.y - ty);
        if (dd < bd) { bd = dd; best = p; }
      }
      this.ball.intended = best;
    }

    blockFactor(d, dt) {
      if (d.eng >= d.shed) return 1;
      for (const o of this.off) {
        if (!o.blocking) continue;
        if (hyp(o.x - d.x, o.y - d.y) < 1.5) { d.eng += dt; return 0.15; }
      }
      return 1;
    }

    followRoute(p, dt) {
      const r = p.route;
      if (p.wp < r.pts.length) {
        const [tx, ty] = r.pts[p.wp];
        const d = hyp(tx - p.x, ty - p.y);
        if (d < 0.5) { p.wp++; return; }
        p.dir = [(tx - p.x) / d, (ty - p.y) / d];
        go(p, tx, ty, p.spd, dt, 14);
      } else if (r.stop) go(p, p.x, p.y, 0, dt, 10);
      else go(p, p.x + p.dir[0] * 5, p.y + p.dir[1] * 5, p.spd, dt, 14);
      p.x = Math.min(p.x, 118.5); p.y = clamp(p.y, 1, FW - 1);
    }

    blockTarget(p, ref) {
      let best = null, bs = 1e9;
      for (const d of this.def) {
        if (d.stun > 0 || d.eng >= d.shed) continue;
        const s = hyp(d.x - p.x, d.y - p.y) + 0.5 * hyp(d.x - ref.x, d.y - ref.y);
        if (s < bs) { bs = s; best = d; }
      }
      return best;
    }

    updateLive(dt) {
      const L = this.los, qb = this.qb, b = this.ball, isPass = this.play.type === 'pass';
      this.t += dt; this.tick(dt);
      if (!isPass && this.carrier === qb && this.t >= 0.25) this.carrier = this.rb;
      const c = this.carrier;
      const runPhase = !!c && c !== qb;
      const ref = c || this.rb;      // who blockers protect / defenders chase

      // offense
      for (const p of this.off) {
        p.blocking = false;
        if (p === c && runPhase) { this.steerRunner(p, dt); continue; }
        if (p.role === 'QB') {
          if (c === qb && this.t < 0.8) go(p, L - 7.5, MID, 4, dt, 8); else go(p, p.x, p.y, 0, dt, 8);
          continue;
        }
        const mustBlock = runPhase || !isPass;
        if (p.role === 'OL' || mustBlock) {
          p.blocking = true;
          let d = !mustBlock && p.mark && p.mark.eng < p.mark.shed ? p.mark : this.blockTarget(p, mustBlock ? ref : qb);
          if (!d) { go(p, p.x, p.y, 0, dt, 6); continue; }
          const tr = mustBlock ? ref : qb;
          const dd = hyp(tr.x - d.x, tr.y - d.y) || 1;
          go(p, d.x + ((tr.x - d.x) / dd) * 0.9, d.y + ((tr.y - d.y) / dd) * 0.9, p.spd * (p.role === 'OL' ? 1 : 0.9), dt, 8);
        } else if (b.state === 'air' && p === b.intended) go(p, b.tx, b.ty, p.spd, dt, 14);
        else if (p.route) this.followRoute(p, dt);
      }

      // defense
      let deepX = L + 12, deepY = MID;
      for (const p of this.off) if (p.route && p.x + 4 > deepX) { deepX = p.x + 4; deepY = (MID + p.y) / 2; }
      for (const d of this.def) {
        if (d.stun > 0) { d.stun -= dt; continue; }
        const f = this.blockFactor(d, dt);
        d.held = f < 1;                // a blocked defender can't make the tackle
        let tx, ty, sp = d.spd;
        if (runPhase || (!isPass && this.t > d.react)) {
          const lead = Math.min(0.8, (hyp(ref.x - d.x, ref.y - d.y) / d.spd) * 0.6);
          tx = ref.x + ref.vx * lead; ty = ref.y + ref.vy * lead;
        } else if (b.state === 'air' && this.t - b.t0 > 0.25 && hyp(d.x - b.tx, d.y - b.ty) < 9) {
          tx = b.tx; ty = b.ty;
        } else if (d.job === 'rush') { tx = qb.x; ty = qb.y; }
        else if (d.job === 'man') {
          const m = d.mark;
          if (d.x - m.x > 2.5) { tx = m.x + 3.5; ty = m.y; sp *= 0.6; } else { tx = m.x + m.vx * 0.1; ty = m.y + m.vy * 0.1; }
        } else { tx = Math.min(deepX, 117); ty = deepY; }
        go(d, tx, ty, sp * f, dt, 5);
        d.y = clamp(d.y, 0.5, FW - 0.5);
      }

      // ball in the air
      if (b.state === 'air') {
        b.u += dt / b.dur;
        if (b.u >= 1) return this.resolvePass();
        return;
      }

      // tackles
      for (const d of this.def) {
        if (d.stun > 0 || d.held || hyp(d.x - c.x, d.y - c.y) > 1.15) continue;
        if (c === qb) {
          if (Math.random() < 0.05) { d.stun = 1; continue; }
          this.stats.sack++;
          return this.gainResult(c.x, `SACKED — loss of ${Math.max(0, Math.round(L - c.x))}`);
        }
        if (Math.random() < clamp(0.08 + ((c.ovr || 65) - 60) * 0.004, 0.05, 0.3)) { d.stun = 1.1; continue; }
        return this.finishRun(c.x, false);
      }
      if (runPhase) {
        if (c.x >= 110) return this.touchdown();
        if (c.y <= 0.3 || c.y >= FW - 0.3) return this.finishRun(c.x, true);
      }
    }

    steerRunner(p, dt) {
      let dx = 1, dy = 0;
      const k = this.keys;
      if (this.pointer) {
        dx = this.pointer.x - (p.x - this.camX) * PPY; dy = this.pointer.y - (TOP + p.y * PPY);
        const l = hyp(dx, dy) || 1; dx /= l; dy /= l;
        if (dx < 0.25) { dx = 0.25; dy = Math.sign(dy) * 0.97; }
      } else {
        const ky = (k.arrowdown || k.s ? 1 : 0) - (k.arrowup || k.w ? 1 : 0);
        dx = k.arrowleft || k.a ? 0.3 : 1; dy = ky * 0.9;
        const l = hyp(dx, dy); dx /= l; dy /= l;
      }
      go(p, p.x + dx * 5, p.y + dy * 5, p.spd, dt, 10);
    }

    resolvePass() {
      const b = this.ball; b.state = 'dead';
      const oob = b.ty < 0 || b.ty > FW || b.tx > 120 || b.tx < 0;
      let o = null, od = 1.9, d = null, dd = 1.7;
      for (const p of this.off) {
        if (p.role === 'OL' || p.role === 'QB') continue;
        const x = hyp(p.x - b.tx, p.y - b.ty); if (x < od) { od = x; o = p; }
      }
      for (const p of this.def) { const x = hyp(p.x - b.tx, p.y - b.ty); if (x < dd) { dd = x; d = p; } }
      if (oob) return this.incomplete('Out of bounds — incomplete');
      if (d && (!o || dd < od) && Math.random() < (o ? 0.22 : 0.35)) return this.intercepted(b.tx);
      if (!o) return this.incomplete(d ? 'Broken up' : 'Incomplete');
      let pc = 0.8 + (o.ovr - 60) * 0.004 - (od / 1.9) * 0.15;
      if (d) pc -= 0.4 * (1 - dd / 1.7);
      if (Math.random() > pc) return this.incomplete(d ? 'Broken up' : 'Dropped');
      // caught
      this.stats.comp++; this.caught = true; this.carrier = o; b.state = 'held';
      o.x = b.tx; o.y = clamp(b.ty, 0.4, FW - 0.4);
      if (o.x >= 110) return this.touchdown();
    }

    incomplete(msg) {
      if (this.down >= 4) return this.endPlay(msg + ' — TURNOVER ON DOWNS', () => this.checkClock(() => this.oppDrive(this.los - 10, 'They take over on downs.')));
      this.down++;
      this.endPlay(msg, () => this.checkClock(() => this.toChoose()));
    }
    intercepted(x) {
      this.stats.int++;
      const dist = clamp(x - 10, 20, 95);
      this.endPlay('INTERCEPTED!', () => this.checkClock(() => this.oppDrive(dist, 'They take over after the pick.')));
    }
    credit(x) {
      const y = Math.round(Math.min(x, 110) - this.los);
      if (this.caught) this.stats.pyd += y; else if (this.carrier !== this.qb) this.stats.ryd += y;
    }
    touchdown() {
      this.credit(110);
      if (this.caught) this.stats.ptd++; else this.stats.rtd++;
      this.score.me += 6;
      this.endPlay('TOUCHDOWN!', () => (this.q === 5 ? this.final() : this.startKick('pat')), 2);
    }
    finishRun(x, oob) {
      this.credit(x);
      this.gainResult(x, null, oob);
    }
    gainResult(x, label, oob) {
      const gain = Math.round(x - this.los);
      if (x <= 10) {
        this.score.opp += 2;
        return this.endPlay('SAFETY', () => this.checkClock(() => this.oppDrive(65, 'They get the ball after the safety.')));
      }
      this.los = Math.min(x, 109.5);
      let msg = label || (gain > 0 ? `Gain of ${gain}` : gain < 0 ? `Loss of ${-gain}` : 'No gain');
      if (oob) msg += ' (out of bounds)';
      else if (this.clock !== Infinity) this.clock = Math.max(0, this.clock - RUNOFF);
      if (this.los >= this.fdx) {
        this.down = 1; this.fdx = Math.min(this.los + 10, 110);
        this.endPlay(msg + ' — FIRST DOWN', () => this.checkClock(() => this.toChoose()));
      } else if (this.down >= 4) {
        this.endPlay(msg + ' — TURNOVER ON DOWNS', () => this.checkClock(() => this.oppDrive(this.los - 10, 'They take over on downs.')));
      } else {
        this.down++;
        this.endPlay(msg, () => this.checkClock(() => this.toChoose()));
      }
    }
    endPlay(msg, after, hold) {
      this.phase = 'dead'; this.deadT = hold || 1.5; this.banner = { text: msg, t: this.deadT };
      this.after = after; this.aim = null; this.pointer = null;
    }

    // ---------- kicking ----------
    startKick(type) {
      const dist = type === 'pat' ? 33 : Math.round(110 - this.los + 17);
      const tol = clamp(0.26 - (dist - 20) * 0.005 + (this.cfg.roster.K.ovr - 70) * 0.003, 0.05, 0.4);
      this.kick = { type, dist, tol, pos: 0, dir: 1, done: false };
      this.phase = 'kick';
    }
    doKick() {
      const k = this.kick; if (!k || k.done) return;
      k.done = true;
      const good = Math.abs(k.pos - 0.5) <= k.tol;
      if (k.type === 'pat') {
        if (good) this.score.me += 1;
        this.endPlay(good ? 'Extra point is GOOD' : 'Extra point NO GOOD', () => this.checkClock(() => this.oppDrive(75, 'You kick off.')));
      } else if (good) {
        this.score.me += 3;
        this.endPlay(`${k.dist}-yard field goal is GOOD`, () => this.checkClock(() => this.oppDrive(75, 'You kick off.')));
      } else {
        const dist = this.los - 10;
        this.endPlay('Field goal NO GOOD', () => this.checkClock(() => this.oppDrive(dist, 'They take over after the miss.')));
      }
    }
    punt() {
      const dist = Math.min(this.los + rnd(34, 46), 90) - 10;
      this.phase = 'dead';
      this.endPlay('Punt', () => this.checkClock(() => this.oppDrive(dist, 'They field the punt.')));
    }

    // ---------- opponent possession (simulated) ----------
    oppDrive(dist, lead) {
      this.phase = 'opp'; this.kick = null;
      const o = this.cfg.opp, myDef = this.cfg.roster.DEF.ovr;
      const pTD = clamp(0.24 + (this.cfg.oppOff - myDef) * 0.008 + (75 - dist) * 0.004, 0.08, 0.75);
      const pFG = dist < 45 ? 0.25 : 0.14;
      let need = (25 + rnd(0, 30)) * clamp(dist / 75, 0.35, 1.1);
      let text, nextX;
      const r = Math.random();
      if (this.q <= 4 && this.clock < 12) { text = 'The clock runs out on their drive.'; need = this.clock; nextX = 35; }
      else if (r < pTD) { this.score.opp += 7; text = `TOUCHDOWN ${o.name}. They march ${Math.round(dist)} yards and kick the extra point.`; nextX = 35; }
      else if (r < pTD + pFG) { this.score.opp += 3; text = `${o.name} settle for a field goal.`; nextX = 35; }
      else if (r < pTD + pFG + 0.13) { text = Math.random() < 0.5 ? 'Your defense forces a fumble!' : 'Your defense picks it off!'; nextX = rnd(45, 65); }
      else { text = 'Your defense holds. They punt it away.'; nextX = rnd(28, 40); }
      if (this.q <= 4) this.clock = Math.max(0, this.clock - need);
      this.showPanel(`${o.city} ${o.name} possession`, `${lead}\n${text}\n\n${this.cfg.me.abbr} ${this.score.me} — ${this.score.opp} ${o.abbr}`,
        [{ label: 'Continue', fn: () => this.checkClock(() => this.startDrive(nextX)) }], true);
    }

    checkClock(next) {
      const s = this.score;
      if (this.q === 5) return s.me !== s.opp ? this.final() : next();
      if (this.clock > 0) return next();
      if (this.q === 1 || this.q === 3) { this.q++; this.clock = QLEN; this.banner = { text: `Start of Q${this.q}`, t: 1.5 }; return next(); }
      const line = `${this.cfg.me.abbr} ${s.me} — ${s.opp} ${this.cfg.opp.abbr}`;
      if (this.q === 2) {
        this.q = 3; this.clock = QLEN; this.phase = 'opp';
        return this.showPanel('Halftime', line, [{ label: 'Start 2nd half', fn: () => this.oppDrive(75, 'They receive the second-half kickoff.') }], true);
      }
      if (s.me === s.opp) {
        this.q = 5; this.clock = Infinity; this.phase = 'opp';
        return this.showPanel('Overtime', 'Sudden death — next score wins. You get the ball first.', [{ label: 'Go', fn: () => this.startDrive(35) }], true);
      }
      this.final();
    }

    final() {
      this.phase = 'final'; this.kick = null;
      const s = this.score, st = this.stats, won = s.me > s.opp;
      this.showPanel(won ? 'VICTORY' : 'DEFEAT',
        `${this.cfg.me.abbr} ${s.me} — ${s.opp} ${this.cfg.opp.abbr}\n\nPassing ${st.comp}/${st.att}, ${st.pyd} yds, ${st.ptd} TD, ${st.int} INT\nRushing ${st.ryd} yds, ${st.rtd} TD · Sacked ${st.sack}x`,
        [{ label: 'Continue', fn: () => { this.destroy(); this.cfg.onEnd(s.me, s.opp, st); } }], true);
    }

    // ---------- frame update ----------
    update(dt) {
      if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
      if (this.phase === 'live') this.updateLive(dt);
      else if (this.phase === 'dead') {
        if ((this.deadT -= dt) <= 0) { const f = this.after; this.after = null; f(); }
      } else if (this.phase === 'kick') {
        const k = this.kick;
        k.pos += k.dir * dt * 1.25;
        if (k.pos > 1) { k.pos = 1; k.dir = -1; } else if (k.pos < 0) { k.pos = 0; k.dir = 1; }
      }
      // camera
      let fx = this.los;
      if (this.phase === 'live' || this.phase === 'dead') {
        const b = this.ball;
        if (b.state === 'air' || b.state === 'dead') fx = b.sx + (b.tx - b.sx) * Math.min(1, b.u);
        else if (this.carrier) fx = this.carrier.x;
      }
      const target = clamp(fx - VIEW * 0.36, -3, 123 - VIEW);
      this.camX += (target - this.camX) * Math.min(1, dt * 5);
      this.hud();
    }
    hud() {
      const c = this.clock, set = (id, v) => { if (this.hudCache[id] !== v) { this.hudCache[id] = v; this.el[id].textContent = v; } };
      set('hud-me', this.score.me); set('hud-opp', this.score.opp);
      set('hud-q', this.q === 5 ? 'OT' : 'Q' + this.q);
      set('hud-clock', c === Infinity ? '–:––' : Math.floor(Math.ceil(c) / 60) + ':' + String(Math.ceil(c) % 60).padStart(2, '0'));
      set('hud-down', this.phase === 'opp' || this.phase === 'final' ? '' : this.downText());
    }

    // ---------- rendering ----------
    sx(x) { return (x - this.camX) * PPY; }
    sy(y) { return TOP + y * PPY; }

    draw() {
      const g = this.g, me = this.cfg.me, opp = this.cfg.opp;
      g.setTransform(this.cv.width / W, 0, 0, this.cv.height / H, 0, 0);
      g.fillStyle = '#16303a'; g.fillRect(0, 0, W, H);
      // turf
      for (let i = 0; i < 24; i++) {
        const x0 = this.sx(i * 5);
        if (x0 > W || x0 + 5 * PPY < 0) continue;
        g.fillStyle = i < 2 ? me.c1 : i >= 22 ? opp.c1 : i % 2 ? '#2e8f5c' : '#288352';
        g.fillRect(x0, TOP, 5 * PPY + 1, FW * PPY);
      }
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5;
      g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '700 18px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let x = 10; x <= 110; x += 5) {
        const X = this.sx(x); if (X < -20 || X > W + 20) continue;
        g.beginPath(); g.moveTo(X, TOP); g.lineTo(X, TOP + FW * PPY); g.stroke();
        if (x % 10 === 0 && x > 10 && x < 110) {
          const n = 50 - Math.abs(60 - x);
          g.fillText(n, X, TOP + 3.2 * PPY); g.fillText(n, X, TOP + (FW - 3.2) * PPY);
        }
      }
      g.lineWidth = 3; g.strokeStyle = '#f4f6f8';
      g.strokeRect(this.sx(0), TOP, 120 * PPY, FW * PPY);
      // end zone lettering
      for (const [x, t] of [[5, me], [115, opp]]) {
        g.save(); g.translate(this.sx(x), TOP + MID * PPY); g.rotate(x < 60 ? -Math.PI / 2 : Math.PI / 2);
        g.fillStyle = t.c2; g.font = '900 44px ui-rounded, system-ui, sans-serif'; g.fillText(t.name.toUpperCase(), 0, 0); g.restore();
      }
      // goal posts
      g.fillStyle = '#ffd84a';
      for (const x of [0, 120]) g.fillRect(this.sx(x) - 2, this.sy(MID - 3), 4, 6 * PPY);

      const showLines = this.phase !== 'opp' && this.phase !== 'final';
      if (showLines) {
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(80,170,255,.9)'; g.beginPath(); g.moveTo(this.sx(this.los), TOP); g.lineTo(this.sx(this.los), TOP + FW * PPY); g.stroke();
        if (this.fdx < 110) { g.strokeStyle = 'rgba(255,216,74,.95)'; g.beginPath(); g.moveTo(this.sx(this.fdx), TOP); g.lineTo(this.sx(this.fdx), TOP + FW * PPY); g.stroke(); }
      }

      // route preview
      if (this.phase === 'presnap' && this.play.type === 'pass') {
        g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.8)'; g.setLineDash([7, 6]);
        for (const p of this.off) {
          if (!p.route) continue;
          g.beginPath(); g.moveTo(this.sx(p.x), this.sy(p.y));
          let lx = p.x, ly = p.y, px = p.x, py = p.y;
          for (const [x, y] of p.route.pts) { g.lineTo(this.sx(x), this.sy(y)); px = lx; py = ly; lx = x; ly = y; }
          g.stroke();
          const a = Math.atan2(ly - py, lx - px), X = this.sx(lx), Y = this.sy(ly);
          g.setLineDash([]); g.fillStyle = '#fff'; g.beginPath();
          if (p.route.stop) g.arc(X, Y, 5, 0, 7);
          else { g.moveTo(X + Math.cos(a) * 10, Y + Math.sin(a) * 10); g.lineTo(X + Math.cos(a + 2.5) * 9, Y + Math.sin(a + 2.5) * 9); g.lineTo(X + Math.cos(a - 2.5) * 9, Y + Math.sin(a - 2.5) * 9); }
          g.fill(); g.setLineDash([7, 6]);
        }
        g.setLineDash([]);
      }

      if (showLines) {
        const all = [...this.def, ...this.off].sort((a, b) => a.y - b.y);
        for (const p of all) this.drawPlayer(p);
        this.drawBall();
      }
      if (this.aim && this.carrier === this.qb) this.drawAim();
      if (this.kick) this.drawKick();

      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (this.phase === 'presnap') this.hint('TAP THE FIELD OR PRESS SPACE TO SNAP');
      else if (this.phase === 'live' && this.carrier === this.qb && this.play.type === 'pass' && !this.aim) this.hint('DRAG BACK AND RELEASE TO THROW');
      else if (this.phase === 'kick' && !this.kick.done) this.hint('TAP WHEN THE MARKER IS IN THE GREEN');
      if (this.banner) {
        g.font = '900 30px ui-rounded, system-ui, sans-serif';
        const w = g.measureText(this.banner.text).width + 44;
        g.fillStyle = 'rgba(12,18,30,.88)'; this.rr(W / 2 - w / 2, 58, w, 52, 12); g.fill();
        g.fillStyle = '#ffb43a'; g.fillText(this.banner.text, W / 2, 85);
      }
    }
    rr(x, y, w, h, r) { const g = this.g; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
    hint(t) {
      const g = this.g; g.font = '800 15px ui-rounded, system-ui, sans-serif';
      const w = g.measureText(t).width + 28;
      g.fillStyle = 'rgba(12,18,30,.75)'; this.rr(W / 2 - w / 2, 8, w, 26, 13); g.fill();
      g.fillStyle = '#fff'; g.fillText(t, W / 2, 21.5);
    }
    drawPlayer(p) {
      const g = this.g, X = this.sx(p.x), Y = this.sy(p.y), R = 9.5;
      if (X < -20 || X > W + 20) return;
      const t = p.team === 'O' ? this.cfg.me : this.cfg.opp;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(X + 2, Y + 4, R, R * 0.8, 0, 0, 7); g.fill();
      if (p === this.carrier) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, R + 5, 0, 7); g.stroke(); }
      g.globalAlpha = p.stun > 0 ? 0.45 : 1;
      g.fillStyle = p.team === 'O' ? t.c1 : '#f1f3f5';
      g.strokeStyle = p.team === 'O' ? t.c2 : t.c1; g.lineWidth = 3.5;
      g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill(); g.stroke();
      // helmet stripe facing downfield
      g.fillStyle = p.team === 'O' ? t.c2 : t.c1;
      g.fillRect(X - 5, Y - 1.5, 10, 3);
      g.globalAlpha = 1;
      if (p.team === 'O' && p.route && this.phase !== 'dead') {
        g.font = '800 11px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = 'rgba(12,18,30,.7)'; g.fillText(p.role.replace(/\d/, ''), X + 1, Y - 17 + 1);
        g.fillStyle = '#fff'; g.fillText(p.role.replace(/\d/, ''), X, Y - 17);
      }
    }
    drawBall() {
      const g = this.g, b = this.ball;
      let x, y, z = 0;
      if (b.state === 'air' || b.state === 'dead') {
        const u = Math.min(1, b.u); x = b.sx + (b.tx - b.sx) * u; y = b.sy + (b.ty - b.sy) * u;
        z = b.state === 'air' ? Math.sin(Math.PI * u) * b.dist * 0.22 : 0;
      } else if (this.carrier) { x = this.carrier.x + 0.45; y = this.carrier.y + 0.35; }
      else return;
      const X = this.sx(x), Y = this.sy(y);
      if (z > 0) { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X, Y, 5, 3, 0, 0, 7); g.fill(); }
      g.fillStyle = '#8a4b22'; g.strokeStyle = '#fff'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(X, Y - z * PPY * 0.5, 5.5 + z * 0.25, 3.6 + z * 0.15, 0, 0, 7); g.fill(); g.stroke();
    }
    drawAim() {
      const g = this.g, t = this.aimTarget(), qb = this.qb;
      const X0 = this.sx(qb.x), Y0 = this.sy(qb.y), X1 = this.sx(t.x), Y1 = this.sy(t.y);
      const d = hyp(t.x - qb.x, t.y - qb.y);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.5; g.setLineDash([6, 7]);
      g.beginPath(); g.moveTo(X0, Y0); g.quadraticCurveTo((X0 + X1) / 2, (Y0 + Y1) / 2 - d * PPY * 0.22, X1, Y1); g.stroke();
      g.setLineDash([]);
      g.strokeStyle = '#ffd84a'; g.lineWidth = 3; g.beginPath(); g.arc(X1, Y1, 1.9 * PPY * 0.6, 0, 7); g.stroke();
      g.fillStyle = 'rgba(255,216,74,.25)'; g.fill();
      // pull-back line
      const a = this.aim; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(a.sx, a.sy); g.lineTo(a.cx, a.cy); g.stroke();
    }
    drawKick() {
      const g = this.g, k = this.kick, bw = 420, bx = W / 2 - bw / 2, by = H - 96;
      g.fillStyle = 'rgba(12,18,30,.88)'; this.rr(bx - 20, by - 44, bw + 40, 100, 14); g.fill();
      g.fillStyle = '#fff'; g.font = '800 16px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(k.type === 'pat' ? 'EXTRA POINT' : `${k.dist}-YARD FIELD GOAL`, W / 2, by - 22);
      g.fillStyle = '#3a455c'; this.rr(bx, by, bw, 26, 8); g.fill();
      g.fillStyle = '#4fd18b'; this.rr(bx + (0.5 - k.tol) * bw, by, k.tol * 2 * bw, 26, 8); g.fill();
      g.fillStyle = '#fff'; g.fillRect(bx + k.pos * bw - 3, by - 6, 6, 38);
    }
  }

  GP.Match = Match;
  GP.PLAYS = PLAYS;
})();
