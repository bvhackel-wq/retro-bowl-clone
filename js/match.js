// On-field game: play calling, live play simulation, kicking, clock and drives.
(function () {
  const GP = window.GP;
  const { rnd, clamp } = GP;

  // logical canvas size: the height is fixed; the width follows the screen's shape (see Match.resize)
  let W = 960; const H = 540;
  const FW = 36;                   // field width in yards
  const PPY = 13;                  // pixels per yard
  const TOP = (H - FW * PPY) / 2;
  let VIEW = W / PPY;              // yards visible horizontally
  const MID = FW / 2;
  // pixel-art canvas: half the logical size, so one art pixel is 2 logical pixels
  let AW = W / 2; const AH = H / 2, YA = PPY / 2, TOPA = TOP / 2, PAD = 4;
  const setArtWidth = (aw) => { AW = aw; W = aw * 2; VIEW = W / PPY; };
  const QLEN = 120;                // seconds per quarter
  const RUNOFF = 8;                // extra clock burned after an in-bounds play
  const CUT_TIME = 0.5;            // seconds a swipe angles the runner toward a sideline
  const TAP_WINDOW = 450;          // ms between a tap and a swipe for it to count as a juke
  const JUKE_WINDOW = 0.3;         // seconds a juke is live at 65 agility (longer for agile runners)
  const JUKE_RECOVER = 0.3;        // seconds of planting after the sidestep
  const JUKE_COOLDOWN = 0.8;       // seconds before another juke is possible
  const FALL_TIME = 0.35;          // seconds the tackle animation takes (runner falls forward)
  // Opponent defensive slots in the order setupFormation builds them, with a tackling offset vs team defense.
  const DSLOTS = [['DL1', 'DL', 0], ['DL2', 'DL', 0], ['DL3', 'DL', 0], ['LB1', 'LB', 5], ['LB2', 'LB', 5],
                  ['CB1', 'CB', -4], ['CB2', 'CB', -4], ['S', 'S', 2], ['S2', 'S', 2]];   // S2 plays only in two-high calls

  // Route points are [yards downfield, yards toward the middle of the field] from the receiver's start.
  const PLAYS = [
    { id: 'slants', name: 'Quick Slants', type: 'pass', cat: 'quick', desc: 'Fast throws inside',
      routes: { WR1: { pts: [[3, 0], [13, 10]] }, WR2: { pts: [[3, 0], [13, 10]] }, TE: { pts: [[6, 0]], stop: true }, RB: { pts: [[0, -6], [3, -9]], stop: true } } },
    { id: 'verts', name: 'Verticals', type: 'pass', cat: 'deep', desc: 'Everybody deep',
      routes: { WR1: { pts: [[45, 0]] }, WR2: { pts: [[45, 0]] }, TE: { pts: [[10, 0], [45, 3]] }, RB: { pts: [[2, -5]], stop: true } } },
    { id: 'post', name: 'Post & Cross', type: 'pass', cat: 'deep', desc: 'Deep post, TE crossing',
      routes: { WR1: { pts: [[12, 0], [40, 12]] }, WR2: { pts: [[10, 0], [12, -2]], stop: true }, TE: { pts: [[5, 0], [9, 16]] }, RB: { pts: [[1, -6], [14, -10]] } } },
    { id: 'curls', name: 'Curls', type: 'pass', cat: 'quick', desc: 'Receivers stop at 11',
      routes: { WR1: { pts: [[13, 0], [11, 1.5]], stop: true }, WR2: { pts: [[13, 0], [11, 1.5]], stop: true }, TE: { pts: [[6, 0], [8, -6]] }, RB: { pts: [[4, 3]], stop: true } } },
    { id: 'run', name: 'HB Off Tackle', type: 'run', cat: 'inside', side: 1, rbY: 4.4, desc: 'Behind the tight end' },
    // --- added plays (route points: [yards downfield, yards toward the middle]) ---
    { id: 'outs', name: 'Quick Outs', type: 'pass', cat: 'quick', desc: 'Receivers break to the sideline at 5',
      routes: { WR1: { pts: [[5, 0], [5, -4]], stop: true }, WR2: { pts: [[5, 0], [5, -4]], stop: true }, TE: { pts: [[4, 0], [7, 5]] }, RB: { pts: [[1, -6]], stop: true } } },
    { id: 'stick', name: 'Stick', type: 'pass', cat: 'quick', desc: 'Tight end sits at 6, back to the flat',
      routes: { WR1: { pts: [[12, 0]] }, WR2: { pts: [[6, 0], [6, 2]], stop: true }, TE: { pts: [[6, 0]], stop: true }, RB: { pts: [[0, -7], [2, -10]], stop: true } } },
    { id: 'dagger', name: 'Dagger', type: 'pass', cat: 'deep', desc: 'Seam clears out a deep dig',
      routes: { WR1: { pts: [[30, 2]] }, WR2: { pts: [[14, 0], [14, 12]] }, TE: { pts: [[25, 1]] }, RB: { pts: [[2, -5]], stop: true } } },
    { id: 'comeback', name: 'Comebacks', type: 'pass', cat: 'deep', desc: 'Push to 16, turn back to the sideline',
      routes: { WR1: { pts: [[16, 0], [13, -2.5]], stop: true }, WR2: { pts: [[16, 0], [13, -2.5]], stop: true }, TE: { pts: [[8, 0], [10, 6]] }, RB: { pts: [[3, -6]], stop: true } } },
    { id: 'dive', name: 'HB Dive', type: 'run', cat: 'inside', side: 1, rbY: 1.3, desc: 'Straight up the middle' },
    { id: 'power', name: 'HB Power', type: 'run', cat: 'inside', side: 1, rbY: 3.4, rbX: 6.5, pull: true, desc: 'Backside guard pulls and leads' },
    { id: 'toss_r', name: 'Toss Right', type: 'run', cat: 'outside', side: 1, rbY: 3, sweep: true, desc: 'Pitch, run for the sideline, turn up' },
    { id: 'toss_l', name: 'Toss Left', type: 'run', cat: 'outside', side: -1, rbY: 3, sweep: true, desc: 'The same to the other side' },
    { id: 'rb_screen', name: 'RB Screen', type: 'pass', cat: 'screen', screen: 'rb', desc: 'Let the rush in, dump it to the back',
      routes: { WR1: { pts: [[12, 0]] }, WR2: { pts: [[12, 0]] }, TE: { pts: [[6, 0]], stop: true }, RB: { pts: [[-1, -4], [0, -7]], stop: true } } },
    { id: 'wr_screen', name: 'WR Screen', type: 'pass', cat: 'screen', screen: 'wr', desc: 'Quick throw behind blockers',
      routes: { WR1: { pts: [[-1, 1.5]], stop: true }, WR2: { block: true }, TE: { block: true }, RB: { pts: [[1, -5]], stop: true } } },
    { id: 'pa_post', name: 'PA Post', type: 'pass', cat: 'pa', pa: true, desc: 'Fake the run, post behind the linebackers',
      routes: { WR1: { pts: [[12, 0], [32, 10]] }, WR2: { pts: [[12, 0], [12, 10]] }, TE: { pts: [[8, 0], [20, 2]] }, RB: { block: true } } },
    { id: 'pa_cross', name: 'PA Crossers', type: 'pass', cat: 'pa', pa: true, desc: 'Fake the run, receivers cross at 12',
      routes: { WR1: { pts: [[10, 0], [13, 22]] }, WR2: { pts: [[6, 0], [8, 20]] }, TE: { pts: [[14, 0]], stop: true }, RB: { block: true } } },
    { id: 'pa_shot', name: 'PA Deep Shot', type: 'pass', cat: 'pa', pa: true, desc: 'Fake the run, take the top off',
      routes: { WR1: { pts: [[40, 2]] }, WR2: { pts: [[40, 2]] }, TE: { pts: [[3, 0], [4, 8]], stop: true }, RB: { block: true } } },
  ];
  // play types shown when you change the call; the coordinator picks the play within a type
  const PLAY_TYPES = [['quick', 'Quick pass', 'Short, fast throws'], ['deep', 'Deep pass', 'Push the ball downfield'],
                      ['inside', 'Inside run', 'Between the tackles'], ['outside', 'Outside run', 'Get to the edge'],
                      ['screen', 'Screen', 'Let the rush come, throw behind blockers'], ['pa', 'Play action', 'Fake the run, throw deep']];

  // Defensive calls and how often they come (percent).
  // The defensive playbook. Two-high calls (Cover 4, 2-Man, Prevent) take a lineman off the field for a
  // second safety, so they rush only two and are soft against the run.
  const COVERAGES = { cover0: 'Cover 0', cover1: 'Cover 1', cover1p: 'Cover 1 Press', cover2: 'Cover 2', cover3: 'Cover 3',
                      cover4: 'Cover 4', '2man': '2-Man', firezone: 'Fire Zone', prevent: 'Prevent' };
  const TWO_HIGH = { cover2: 1, cover4: 1, '2man': 1, prevent: 1 };
  // what each play gains against each coverage, relative to that coverage's average (measured in testing);
  // the offensive coordinator uses it to read the defense
  let OC_FIT = {
    cover0: { slants: 1, verts: -1, post: -1, curls: 2, run: 0, outs: 0, stick: 4, dagger: -2, comeback: -2, dive: 0, power: 1, toss_r: 0, toss_l: 0, rb_screen: 1, wr_screen: 0, pa_post: -1, pa_cross: -1, pa_shot: -2 },
    cover1: { slants: 1, verts: 4, post: 1, curls: -1, run: -2, outs: -2, stick: 3, dagger: 1, comeback: -2, dive: -2, power: 0, toss_r: -1, toss_l: -1, rb_screen: -1, wr_screen: -2, pa_post: 1, pa_cross: -1, pa_shot: 4 },
    cover1p: { slants: 0, verts: 4, post: 1, curls: -1, run: -2, outs: -2, stick: 3, dagger: 1, comeback: -2, dive: -2, power: 0, toss_r: -1, toss_l: -1, rb_screen: -1, wr_screen: -2, pa_post: 0, pa_cross: 0, pa_shot: 4 },
    cover2: { slants: 1, verts: 2, post: -2, curls: 2, run: -1, outs: 0, stick: 2, dagger: 2, comeback: 2, dive: -1, power: -1, toss_r: -1, toss_l: -1, rb_screen: -2, wr_screen: -4, pa_post: 2, pa_cross: 0, pa_shot: 2 },
    cover3: { slants: -1, verts: 2, post: 2, curls: 1, run: -1, outs: -3, stick: 1, dagger: 2, comeback: 2, dive: -1, power: -1, toss_r: -2, toss_l: -2, rb_screen: -2, wr_screen: -1, pa_post: 2, pa_cross: 0, pa_shot: 2 },
    cover4: { slants: -1, verts: 1, post: 2, curls: 1, run: -1, outs: -2, stick: 1, dagger: 1, comeback: 2, dive: -1, power: -1, toss_r: -1, toss_l: -1, rb_screen: -1, wr_screen: -1, pa_post: 1, pa_cross: 0, pa_shot: 1 },
    '2man': { slants: -1, verts: 3, post: 1, curls: 0, run: 0, outs: -2, stick: 2, dagger: 1, comeback: -2, dive: 1, power: 0, toss_r: 0, toss_l: -1, rb_screen: -1, wr_screen: -2, pa_post: 1, pa_cross: -1, pa_shot: 2 },
    firezone: { slants: -1, verts: 2, post: 2, curls: 1, run: -1, outs: -3, stick: 1, dagger: 2, comeback: 2, dive: -2, power: -1, toss_r: -1, toss_l: -1, rb_screen: -1, wr_screen: -1, pa_post: 2, pa_cross: 0, pa_shot: 2 },
    prevent: { slants: 0, verts: 1, post: 1, curls: 1, run: -1, outs: -2, stick: 1, dagger: 1, comeback: 1, dive: -1, power: -1, toss_r: -1, toss_l: -1, rb_screen: -1, wr_screen: 0, pa_post: 1, pa_cross: 0, pa_shot: 1 },
  };
  const COVER_ALIAS = { man: 'cover1', press: 'cover1p', blitz: 'cover0' };   // older names
  const coverKey = (t) => COVER_ALIAS[t] || t;

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
      for (const id of ['hud-me', 'hud-opp', 'hud-q', 'hud-clock', 'hud-down', 'hud-me-name', 'hud-opp-name', 'panel', 'chip'])
        this.el[id] = document.getElementById(id);
      this.el['hud-me-name'].textContent = cfg.me.abbr;
      this.el['hud-opp-name'].textContent = cfg.opp.abbr;
      this.hudCache = {};

      const r = cfg.roster;
      // QB stats (older rosters without them fall back to his overall)
      const qs = r.QB.stats || {}, qv = (k) => (qs[k] != null ? qs[k] : r.QB.ovr);
      this.qbs = { arm: qv('arm'), acc: qv('acc'), spd: qv('spd'), agi: qv('agi'), sta: qv('sta') };
      this.maxRange = 30 + (this.qbs.arm - 60) * 0.6;                       // arm: how far
      this.ballSpeed = 26 + this.qbs.arm * 0.09;                            // arm: how fast (yards/second)
      this.scatter = Math.max(0.015, 0.085 - (this.qbs.acc - 60) * 0.0015); // accuracy
      if (GP.hasSkill(cfg.staff, 'OC', 'airraid')) this.scatter *= 0.85;   // OC skill: Air Raid
      // difficulty: Easy throws straighter, tires less, gets more time and a bigger catch window; Hard the reverse
      this.dif = { easy: { scatter: 0.7, tire: 0.5, rush: 1.3, window: 0.4, pick: 0.6 }, normal: { scatter: 1, tire: 1, rush: 1, window: 0, pick: 1 },
                   hard: { scatter: 1.15, tire: 1, rush: 1, window: 0, pick: 1.2 } }[cfg.difficulty || 'normal'];
      this.scatter *= this.dif.scatter;
      this.energy = 100;
      // kicker: distance sets how far he can aim, accuracy the meter's green zone and speed
      const kst = r.K.stats || {}, kv = (k) => (kst[k] != null ? kst[k] : r.K.ovr);
      this.ks = { leg: kv('leg'), acc: kv('acc') };
      this.kickRange = Math.round(clamp(30 + (this.ks.leg - 40) * (30 / 59), 25, 60));

      this.q = 1; this.clock = QLEN;
      this.score = { me: 0, opp: 0 };
      this.stats = { att: 0, comp: 0, pyd: 0, ptd: 0, int: 0, ryd: 0, rtd: 0, sack: 0, jukes: 0, broken: 0, jbroken: 0, yac: 0, fum: 0 };
      // Each opposing defender has a jersey number and a tackling rating (TKL) drawn from the team's defense.
      const nums = { DL: [90, 99], LB: [50, 59], CB: [20, 29], S: [30, 39] }, used = new Set();
      this.dRoster = {};
      for (const [slot, pos, off] of DSLOTS) {
        let n; do { n = GP.rint(...nums[pos]); } while (used.has(n)); used.add(n);
        // speed and coverage by position: corners fastest and best in coverage, then safeties, then linebackers
        const so = { DL: [-10, -15], LB: [-4, -6], CB: [4, 4], S: [1, 2] }[pos];
        this.dRoster[slot] = { slot, pos, num: n, tkl: clamp(Math.round(cfg.oppDef + off + rnd(-5, 5)), 45, 99), tk: 0,
          spd: clamp(Math.round(cfg.oppDef + so[0] + rnd(-6, 6)), 40, 99), cov: clamp(Math.round(cfg.oppDef + so[1] + rnd(-6, 6)), 40, 99) };
        const r = this.dRoster[slot];          // stars follow his ratings, measured against his position
        r.stars = clamp(Math.round(((r.tkl - off) + (r.spd - so[0]) + (r.cov - so[1])) / 3 / 6 - 58 / 6), 0, 5);
      }
      this.oppDC = cfg.oppDC != null ? cfg.oppDC : 2;   // their defensive coordinator's stars
      this.keys = {}; this.gesture = null; this.lastTap = -1e9; this.popup = null; this.aim = null; this.banner = null; this.kick = null;
      this.camX = 0; this.off = []; this.def = []; this.ball = { state: 'held' };

      this.onDown = (e) => this.pDown(e); this.onMove = (e) => this.pMove(e); this.onUp = (e) => this.pUp(e);
      this.onKey = (e) => this.key(e, true); this.onKeyUp = (e) => this.key(e, false);
      canvas.addEventListener('pointerdown', this.onDown);
      canvas.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp);
      window.addEventListener('pointercancel', this.onUp);
      window.addEventListener('keydown', this.onKey);
      window.addEventListener('keyup', this.onKeyUp);

      this.paused = false; this.initPause();
      this.tend = { run: 0, short: 0, deep: 0, n: 0 };
      this.el.chip.onclick = () => { if (this.phase === 'presnap' && !this.paused) this.playList('Change the play — ' + this.downText()); };
      this.onResize = () => this.resize();
      window.addEventListener('resize', this.onResize);
      window.addEventListener('orientationchange', this.onResize);
      this.resize();
      this.startDrive(35);
      this.last = performance.now();
      this.frame = (now) => {
        if (this.dead) return;
        const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
        if (!this.paused) this.update(dt);   // a paused game freezes: no clock, no movement
        this.draw();
        this.raf = requestAnimationFrame(this.frame);
      };
      this.raf = requestAnimationFrame(this.frame);
    }

    // ---------- pause ----------
    initPause() {
      const $ = (id) => document.getElementById(id);
      this.pz = { box: $('pause'), main: $('pause-main'), confirm: $('pause-confirm'), score: $('pause-score'), btn: $('pause-btn') };
      this.pz.btn.onclick = () => this.pause();
      $('pause-resume').onclick = () => this.resume();
      $('pause-quit').onclick = () => { this.pz.main.hidden = true; this.pz.confirm.hidden = false; };
      $('pause-back').onclick = () => this.resume();
      $('pause-forfeit').onclick = () => this.forfeit();
      // switching apps or locking the phone pauses the game
      this.onHide = () => { if (document.hidden) this.pause(); };
      document.addEventListener('visibilitychange', this.onHide);
      this.pz.btn.hidden = false;
    }
    pause() {
      if (this.paused || this.dead || this.phase === 'final') return;
      this.paused = true; this.aim = null; this.gesture = null; this.keys = {};
      const s = this.score, q = this.q === 5 ? 'Overtime' : `Quarter ${this.q}`;
      this.pz.score.textContent = `${this.cfg.me.abbr} ${s.me} — ${s.opp} ${this.cfg.opp.abbr} · ${q}`;
      this.pz.main.hidden = false; this.pz.confirm.hidden = true; this.pz.box.hidden = false;
    }
    resume() {
      if (!this.paused) return;
      this.paused = false; this.pz.box.hidden = true;
      this.last = performance.now();          // don't count the paused time as one long frame
    }
    // Quitting forfeits: the game is recorded as a loss (by one point if you were level or ahead).
    forfeit() {
      const me = this.score.me, opp = Math.max(this.score.opp, me + 1), st = this.stats;
      this.destroy();
      this.cfg.onEnd(me, opp, st, { forfeit: true });
    }

    destroy() {
      this.dead = true; cancelAnimationFrame(this.raf);
      if (this.pz) { this.pz.box.hidden = true; this.pz.btn.hidden = true; document.removeEventListener('visibilitychange', this.onHide); }
      this.el.chip.hidden = true;
      this.cv.removeEventListener('pointerdown', this.onDown);
      this.cv.removeEventListener('pointermove', this.onMove);
      window.removeEventListener('pointerup', this.onUp);
      window.removeEventListener('pointercancel', this.onUp);
      window.removeEventListener('keydown', this.onKey);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('orientationchange', this.onResize);
      this.hidePanel();
    }

    // The QB is "throwing" while he holds the ball in the pocket on a pass play.
    // Anyone else with the ball (including a scrambling QB) follows the run rules.
    passing() { return this.carrier === this.qb && this.play && this.play.type === 'pass' && !this.scramble; }
    running(c) { return !!c && (c !== this.qb || this.scramble); }
    tuck() {
      if (this.phase !== 'live' || !this.passing() || this.ball.state !== 'held') return;
      // speed sets scramble pace; fatigue takes a little off it
      this.scramble = true; this.aim = null; this.qb.spd = (5.9 + (this.qbs.spd - 60) * 0.03) * (1 - this.fatigue() * 0.15);
      this.energy = Math.max(0, this.energy - 3);
      this.pop('SCRAMBLE!');
    }

    // ---------- input ----------
    pos(e) {
      const r = this.cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    pDown(e) {
      e.preventDefault();
      const p = this.pos(e);
      if (this.phase === 'presnap') { this.hidePanel(); return this.snap(); }
      if (this.phase === 'kick') return this.kickTap(p);
      if (this.phase !== 'live') return;
      if (this.passing()) this.aim = { sx: p.x, sy: p.y, cx: p.x, cy: p.y };
      else this.gesture = { x: p.x, y: p.y, t: performance.now(), done: false };
    }
    pMove(e) {
      const p = this.pos(e);
      if (this.kaim) { this.kaim.cx = p.x; this.kaim.cy = p.y; return; }
      if (this.aim) { this.aim.cx = p.x; this.aim.cy = p.y; return; }
      const g = this.gesture;
      if (!g || g.done) return;
      // a swipe of 22px+ counts as soon as it happens, no need to lift the finger:
      // up/down cuts (or jukes after a tap), forward lunges, back stops for a moment
      const dy = p.y - g.y, dx = p.x - g.x;
      if (Math.abs(dy) > 22 && Math.abs(dy) > Math.abs(dx) * 0.8) { g.done = true; this.swipe(Math.sign(dy)); }
      else if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.2) { g.done = true; dx > 0 ? this.lunge() : this.hesitate(); }
    }
    pUp() {
      if (this.kaim) return this.kickRelease();
      if (this.aim && this.phase === 'live' && this.passing()) {
        const a = this.aim, dx = a.cx - a.sx, dy = a.cy - a.sy;
        if (dx > 30 && dx > Math.abs(dy)) this.tuck();          // swiped toward the end zone: run it
        else if (hyp(dx, dy) > 14) { const t = this.leadAssist(this.aimTarget()); this.throwBall(t.x, t.y); }
      }
      const g = this.gesture;
      if (g && !g.done && performance.now() - g.t < 300) this.lastTap = performance.now();
      this.aim = null; this.gesture = null;
    }
    // Swipe toward a sideline: a juke if it closely follows a tap, otherwise a cut.
    swipe(dir) {
      const c = this.carrier;
      if (this.phase !== 'live' || !this.running(c)) return;
      const now = performance.now();
      if (c.lunge) return;
      c.stop = null;                                  // any move ends a stop
      if (now - (this.lastTap || -1e9) < TAP_WINDOW) { this.lastTap = -1e9; this.juke(c, dir); }
      else if (!c.juke || c.juke.t <= -JUKE_RECOVER) {
        c.cut = { dir, t: CUT_TIME };
        // a sudden cut can leave close pursuers a step behind, depending on how well they track (coverage)
        for (const d of this.def) if (hyp(d.x - c.x, d.y - c.y) < 5 && d.info)
          d.lag = Math.max(d.lag || 0, clamp(0.1 + ((c.agi || 60) - d.info.cov) * 0.01, 0, 0.35));
      }
    }
    // Lunge: dive forward about two yards and go down where he lands. Tacklers can't stop the dive itself.
    // Distance comes from his best athletic stat (speed, power or agility): runners dive head first,
    // 1 yard at 50 up to 2 yards at 90+; quarterbacks slide feet first, 0.75 up to 1.5 yards.
    lunge() {
      const c = this.carrier;
      if (this.phase !== 'live' || !this.running(c) || c.lunge) return;
      const best = Math.max(c.sStat || 60, c.pow || 0, c.agi || 0), u = clamp((best - 50) / 40, 0, 1);
      const slide = c === this.qb;
      c.lunge = { x0: c.x, dist: slide ? 0.75 + 0.75 * u : 1 + u, t: 0.5, slide };
      c.stop = null; c.cut = null; c.juke = null;
      this.pop(slide ? 'SLIDE!' : 'LUNGE!', '#ffd84a');
    }
    // Stop: plant and wait about a second (blockers set up, a defender may overrun him).
    hesitate() {
      const c = this.carrier;
      if (this.phase !== 'live' || !this.running(c) || c.lunge || c.stop) return;
      c.stop = { t: 1.0 }; c.cut = null;
      this.pop('Hold up…');
    }
    juke(c, dir) {
      if (c.jukeCd > 0) return;                 // still recovering from the last one
      // agility (AGI) lengthens the window and shortens the recovery
      const agi = c.agi || 60;
      const win = clamp(JUKE_WINDOW + (agi - 65) * 0.004, 0.16, 0.4);
      c.juke = { dir, t: win, hit: false };
      c.jukeCd = clamp(JUKE_COOLDOWN - (agi - 65) * 0.006, 0.55, 1.05); c.cut = null;
      this.stats.jukes++;
    }
    pop(text, color) { this.popup = { text, color: color || '#fff', t: 0.9 }; }
    key(e, down) {
      const k = e.key.toLowerCase();
      if (down && !e.repeat && (k === 'escape' || k === 'p')) { this.paused ? this.resume() : this.pause(); return; }
      if (this.paused) return;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      this.keys[k] = down;
      if (down && !e.repeat) {
        if (k === ' ') {
          if (this.phase === 'presnap') this.snap();
          else if (this.phase === 'kick') { if (this.kick.stage === 'set') { this.kick.stage = 'aim'; this.kick.started = true; } else this.doKick(); }
          else this.lastTap = performance.now();       // space then up/down = juke
        } else if (k === 'arrowright' || k === 'd') {
          if (this.passing()) this.tuck(); else this.lunge();
        } else if (k === 'arrowleft' || k === 'a') {
          this.hesitate();
        } else if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') {
          if (performance.now() - (this.lastTap || -1e9) < TAP_WINDOW) this.swipe(k === 'arrowup' || k === 'w' ? -1 : 1);
        }
      }
    }
    aimTarget() {
      const a = this.aim, qb = this.qb;
      let vx = ((a.sx - a.cx) / PPY) * 2.2, vy = ((a.sy - a.cy) / PPY) * 2.2;
      const d = hyp(vx, vy), max = this.maxRange * (1 - this.fatigue() * 0.3);   // tired arm: less range
      if (d > max) { vx *= max / d; vy *= max / d; }
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
        b.className = modal ? 'btn' : 'opt' + (o.kick ? ' kick' : '') + (o.rec ? ' rec' : '');
        if (modal) b.textContent = o.label;
        else { const n = document.createElement('b'); n.textContent = o.label; const s = document.createElement('small'); s.textContent = o.rec ? "OC's call" : o.sub || ''; b.append(n, s); }
        b.onclick = () => { this.hidePanel(); o.fn(); };
        row.appendChild(b);
      }
      p.hidden = false;
    }
    hidePanel() { this.el.panel.hidden = true; }

    // ---------- drive / down flow ----------
    // Stamina: every snap drains the QB's energy (faster with low stamina); he's fresh each drive.
    fatigue() { return (100 - this.energy) / 100; }
    startDrive(x) {
      this.energy = 100; this.olEnergy = [100, 100, 100];
      this.los = clamp(x, 11, 105); this.down = 1; this.fdx = Math.min(this.los + 10, 110);
      this.toChoose();
    }
    downText() {
      const togo = this.fdx >= 110 ? 'Goal' : Math.max(1, Math.round(this.fdx - this.los));
      const yl = Math.round(this.los - 10);
      const on = yl === 50 ? '50' : yl < 50 ? 'own ' + yl : 'opp ' + (100 - yl);
      return `${ord(this.down)} & ${togo} · ${on}`;
    }
    // ---------- offensive coordinator ----------
    // Which plays beat which looks (from testing): quick throws beat the blitz, curls and runs beat
    // three-deep, verticals beat press, slants beat man and two-deep.
    ocCall() {
      const st = this.cfg.staff, stars = st ? st.OC.stars : 1;
      const togo = this.fdx >= 110 ? 110 - this.los : this.fdx - this.los, diff = this.score.me - this.score.opp;
      const late = (this.q === 2 || this.q === 4) && this.clock < 60;
      // the situation, by play type
      const sit = { quick: 0, deep: 0, inside: 0, outside: 0, screen: 0, pa: 0 };
      if (togo <= 2) { sit.inside += 3; sit.outside += 1; sit.quick += 1; sit.pa += 1; }
      else if ((this.down >= 2 && togo >= 7) || togo >= 13) { sit.deep += 2; sit.screen += 1; sit.inside -= 2; sit.outside -= 1; if (this.down <= 2) sit.pa += 1; }
      else if (this.down >= 2) sit.quick += 1;
      else { sit.inside += 0.5; sit.pa += 0.5; }                                                          // 1st & 10: balanced
      if (this.los >= 90) { sit.deep -= 3; sit.pa -= 1; sit.quick += 1; sit.inside += 1; }                 // red zone: no room deep
      if (late && diff < 0) { sit.inside -= 3; sit.outside -= 2; sit.screen -= 1; sit.deep += 1; sit.quick += 0.5; }   // hurry
      if (this.q >= 4 && diff > 0 && !late) { sit.inside += 3; sit.outside += 2; }                         // protect the lead
      const runShare = this.tend && this.tend.n ? this.tend.run / this.tend.n : 0.35;
      sit.pa += clamp(runShare - 0.35, -0.3, 0.4) * 4;                                                     // play action works after you've run
      // his read of the coverage the defense shows (a better coordinator reads it more often)
      const reads = Math.random() < 0.1 + stars * 0.18, fit = OC_FIT[coverKey(this.dcall.shown || this.dcall.type)] || {};
      this.ocScores = {};
      for (const p of PLAYS) this.ocScores[p.id] = sit[p.cat] + (reads ? (fit[p.id] || 0) * 1.5 : 0) + gauss() * (5.2 - stars) * 0.9;
      const best = PLAYS.slice().sort((a, b) => this.ocScores[b.id] - this.ocScores[a.id])[0];
      let call = { play: best };
      if (this.down === 4) {
        const fg = Math.round(110 - this.los + 17), desperate = this.q >= 4 && this.clock < 120 && diff < 0 && diff >= -8;
        if (desperate || (togo <= 1 && this.los >= 55)) call.kick = null;
        else if (fg <= this.kickRange - 1) call.kick = 'fg';
        else if (this.los < 75) call.kick = 'punt';
      }
      return call;
    }
    // You picked a play type: the coordinator's best play of that type; the same type again gives his next one.
    pickType(cat) {
      const list = PLAYS.filter((p) => p.cat === cat).sort((a, b) => this.ocScores[b.id] - this.ocScores[a.id]);
      const i = this.typePick && this.typePick.cat === cat ? (this.typePick.i + 1) % list.length : 0;
      this.typePick = { cat, i };
      this.pickPlay(list[i]);
    }
    // the "Play: ... · Change" button over the field before the snap
    chip() {
      const c = this.el.chip, show = this.phase === 'presnap' && this.el.panel.hidden && !this.paused;
      if (c.hidden === !show && c.dataset.play === (this.play && this.play.id)) return;
      c.hidden = !show; c.dataset.play = this.play ? this.play.id : '';
      const type = (PLAY_TYPES.find((t) => t[0] === (this.play && this.play.cat)) || [0, ''])[1];
      if (show) c.innerHTML = `<small>${this.play === this.ocPick ? "OC's call" : 'Your call'} · ${type}</small><b>${this.play.name}</b><span>Change</span>`;
      // where the button ends, in art pixels, so the bottom hint can sit to its right
      const bw = this.cv.getBoundingClientRect().width;
      this.chipEnd = show && bw ? Math.ceil(((c.offsetLeft + c.offsetWidth) / bw) * AW) + 6 : 0;
    }
    playList(title) {
      const call = this.ocLast;
      // play types; the coordinator fills in the play
      const opts = PLAY_TYPES.map(([cat, label, desc]) => ({ label, sub: this.play && this.play.cat === cat ? `Now: ${this.play.name} · tap for another` : desc,
        rec: !call.kick && call.play.cat === cat, fn: () => this.pickType(cat) }));
      // a field goal on any down once you're past midfield; a punt on 4th down
      if (this.los > 60) {
        const dist = Math.round(110 - this.los + 17), far = dist > this.kickRange;
        opts.push({ label: 'Field Goal', sub: `${dist} yds · range ${this.kickRange}${far ? ' · a long shot' : ''}`, kick: true, rec: call.kick === 'fg', fn: () => this.startKick('fg') });
      }
      if (this.down === 4) opts.push({ label: 'Punt', sub: 'Flip the field', kick: true, rec: call.kick === 'punt', fn: () => this.punt() });
      this.showPanel(title, '', opts);
    }

    toChoose() {
      this.phase = 'choose'; this.kick = null; this.play = null;
      this.dcall = this.callDefense(); this.defNote = null; this.typePick = null;
      this.setupFormation();
      // the offensive coordinator calls the play; on 4th down he only recommends (you decide)
      const call = this.ocLast = this.ocCall();
      this.ocPick = call.play;
      if (this.down === 4) return this.playList('4th down — your call');
      this.pickPlay(call.play);
    }
    pickPlay(p) {
      this.play = p; this.setupFormation(); this.phase = 'presnap';
      this.hidePanel();
    }
    snap() {
      // on runs the second level reacts a beat late; linemen's hold times are already set by run blocking
      // deep defenders guard against the pass first, so they read the run late
      // defensive backs in man watch their receiver, not the backfield, so they find the run late too;
      // linebackers in man play pass first and are a step slow to fill
      if (this.play.type === 'run') for (const d of this.def) {
        if (d.role !== 'DL') d.shed *= 1.7;
        // safeties: with one high, he's the run-support player and comes fast (the rotated-down safety of a real
        // one-high shell); with two high, both read pass first and come late, which is why you run against them
        const twoHigh = TWO_HIGH[this.dcall.type];
        d.react = (d.react || 0) + 0.25 + (d.role === 'S' && d.job === 'deep' ? (twoHigh ? 1.1 : 0.1) : d.job === 'deep' ? 0.6 : d.job === 'zone' && d.anchor && d.anchor[0] - this.los >= 8 ? 0.3
          : d.job === 'man' && d.role !== 'LB' && d.mark && d.mark.role !== 'RB' ? 0.45 : d.job === 'man' ? 0.35 : 0);
      }
      // a man defender whose man stays in to block drops into the hole over the middle (where slants are caught)
      for (const d of this.def) if (d.job === 'man' && d.mark && d.mark.route && d.mark.route.block) {
        d.job = 'zone'; d.anchor = [this.los + 6, MID]; d.mark = null;
      }
      this.rollBusts();
      this.phase = 'live'; this.t = 0; this.caught = false; this.scramble = false; this.gesture = null; this.aim = null;
      // play action: linebackers and safeties step up on the fake; good cover men barely bite, and the more
      // you've run the ball this game, the harder they bite
      if (this.play.pa) {
        const runShare = this.tend.n ? this.tend.run / this.tend.n : 0.3;
        for (const d of this.def) if ((d.role === 'LB' || d.role === 'S') && d.info)
          d.bite = clamp((0.15 + Math.max(0, 85 - d.info.cov) * 0.012) * (0.6 + runShare), 0.05, 0.8) * (d.bust ? 2 : 1);
      }
      // what the offense called, so the defense can adjust to its tendencies
      const cat = this.play.cat; this.tend.n++; this.tend[cat === 'inside' || cat === 'outside' ? 'run' : cat === 'deep' || cat === 'pa' ? 'deep' : 'short']++;
      // a disguised coverage rotates to the real call now
      const dc = this.dcall, shown = coverKey(dc.shown || dc.type), real = coverKey(dc.type);
      if (shown !== real) {
        const reuse = Object.assign({}, this.cov);
        this.cov = this.buildCoverage(dc.type, Object.assign({ L: this.los, M: (...a) => this.mk(...a), w1: this.off.find((p) => p.role === 'WR1'), w2: this.off.find((p) => p.role === 'WR2'),
          te: this.off.find((p) => p.role === 'TE'), rb: this.rb, db: 7, lb: 7, dl1: this.def[1], lbBlitz: dc.lbBlitz }, { reuse }));
      }
      this.defNoteNext = `DEFENSE: ${COVERAGES[real].toUpperCase()}` + (shown !== real ? ` (SHOWED ${COVERAGES[shown].toUpperCase()})` : '');
      this.energy = Math.max(0, this.energy - (3 + (100 - this.qbs.sta) * 0.07));
      // the line tires too, each man by his own stamina
      for (const p of this.off) if (p.role === 'OL') this.olEnergy[p.slot] = Math.max(0, this.olEnergy[p.slot] - (3 + (100 - p.sta) * 0.06));
    }

    mk(team, role, x, y, spd) {
      return { team, role, x, y, vx: 0, vy: 0, spd, wp: 0, dir: [1, 0], stun: 0, eng: 0, shed: rnd(0.7, 1.5), blocking: false };
    }
    // Positions and jobs for one coverage call. With ctx.reuse (a disguise rotating at the snap), the players
    // already on the field keep their spots and take the new jobs.
    buildCoverage(type, ctx) {
      type = coverKey(type);
      const { L, M, w1, w2, te, rb, db, lb, dl1 } = ctx, reuse = ctx.reuse;
      const D = (key, role, x, y, sp, react) => { if (reuse) { const p = reuse[key]; p.react = react; return p; } const p = M('D', role, L + x, y, sp); p.react = react; return p; };
      const clear = (p) => { p.job = null; p.mark = null; p.anchor = null; p.lane = null; p.delay = 0; return p; };
      const man = (p, m, lev) => { clear(p); p.job = 'man'; p.mark = m; p.lev = lev || 1; };
      const deep = (p, ax, ay, y0, y1) => { clear(p); p.job = 'deep'; p.anchor = [L + ax, ay]; p.lane = [y0, y1]; };
      const zone = (p, ax, ay) => { clear(p); p.job = 'zone'; p.anchor = [L + ax, ay]; };
      const rush = (p, delay) => { clear(p); p.job = 'rush'; p.shed = 0.5; p.delay = delay || 0; };
      const c = {};
      if (TWO_HIGH[type]) {            // the middle lineman becomes a second safety
        c.s2 = dl1;
        if (!reuse) { dl1.x = L + 11; dl1.y = MID + 5; }
      } else if (reuse && reuse.s2) { rush(dl1, 0.3); }                       // a "safety" who was a lineman comes on a blitz
      // man defenders line up over their man (the tight end moves to the run side on runs)
      const teSide = te.y < MID ? -1 : 1, rbSide = rb.y < MID ? -1 : 1;
      if (type === 'cover0') {         // pressure, man on every receiver, nobody deep
        // the blitzing linebacker comes off the tight end's edge and keeps the runner inside (contain)
        c.lb1 = D('lb1', 'LB', 4, MID + teSide * 5, lb, 0.2); rush(c.lb1, 0.4); c.lb1.contain = teSide;
        c.lb2 = D('lb2', 'LB', 4, MID + rbSide * 4, lb, 0.2); man(c.lb2, rb);  // every eligible receiver has a man
        c.c1 = D('c1', 'CB', 5, 3.5, db, 0.7); man(c.c1, w1, 1);
        c.c2 = D('c2', 'CB', 5, FW - 3.5, db, 0.7); man(c.c2, w2, 1);
        c.s = D('s', 'S', 7, te.y - teSide * 1, db, 0.5); man(c.s, te);
      } else if (type === 'cover1' || type === 'cover1p') {   // man free: one deep safety; press walks the corners up
        const off = type === 'cover1p' ? 1.6 : 6;
        const lev = type === 'cover1p' ? 1 : -1;
        c.c1 = D('c1', 'CB', off, 3.5, db, 0.7); man(c.c1, w1, lev);
        c.c2 = D('c2', 'CB', off, FW - 3.5, db, 0.7); man(c.c2, w2, lev);
        c.lb1 = D('lb1', 'LB', 5, te.y - teSide * 1.5, lb, 0.3); man(c.lb1, te);
        c.lb2 = D('lb2', 'LB', 5, MID + rbSide * 4, lb, 0.3); if (ctx.lbBlitz) rush(c.lb2, 0.2); else man(c.lb2, rb);
        c.s = D('s', 'S', type === 'cover1p' ? 15 : 13, MID, db, 0.6); deep(c.s, 12, MID, 0, FW);
      } else if (type === 'cover2') {  // two safeties split the deep halves; the corners squat in the flats
        c.c1 = D('c1', 'CB', 4, 4, db, 0.7); zone(c.c1, 4, 4);
        c.c2 = D('c2', 'CB', 4, FW - 4, db, 0.7); zone(c.c2, 4, FW - 4);
        c.lb1 = D('lb1', 'LB', 5, MID - 5, lb, 0.3); zone(c.lb1, 6, MID - 6);
        c.lb2 = D('lb2', 'LB', 5, MID + 5, lb, 0.3); zone(c.lb2, 6, MID + 6);
        c.s = D('s', 'S', 14, 10, db, 0.6); deep(c.s, 15, 10, 0, MID);
        deep(c.s2, 15, FW - 10, MID, FW);
        if (!reuse) { c.s2.x = L + 14; c.s2.y = FW - 10; }
      } else if (type === 'cover3' || type === 'firezone') {  // three deep; fire zone sends a linebacker and drops a lineman
        c.c1 = D('c1', 'CB', 8, 4, db, 0.7); deep(c.c1, 13, 6, 0, 12);
        c.c2 = D('c2', 'CB', 8, FW - 4, db, 0.7); deep(c.c2, 13, FW - 6, 24, FW);
        c.s = D('s', 'S', 14, MID, db, 0.6); deep(c.s, 14, MID, 12, 24);
        c.lb1 = D('lb1', 'LB', 5, MID - 6, lb, 0.3); zone(c.lb1, 5.5, type === 'firezone' ? MID - 3 : MID - 7);
        c.lb2 = D('lb2', 'LB', type === 'firezone' ? 4 : 5, MID + 6, lb, 0.3);
        if (type === 'firezone') { rush(c.lb2, 0.25); zone(dl1, 3.5, MID + 6); } else zone(c.lb2, 5.5, MID + 7);
      } else if (type === 'cover4') {  // quarters: four deep, two underneath
        c.c1 = D('c1', 'CB', 7, 4, db, 0.7); deep(c.c1, 13, 4.5, 0, 9);
        c.s = D('s', 'S', 11, MID - 5, db, 0.6); deep(c.s, 13, MID - 4.5, 9, MID);
        deep(c.s2, 13, MID + 4.5, MID, 27);
        c.c2 = D('c2', 'CB', 7, FW - 4, db, 0.7); deep(c.c2, 13, FW - 4.5, 27, FW);
        c.lb1 = D('lb1', 'LB', 5, MID - 6, lb, 0.3); zone(c.lb1, 5.5, MID - 6);
        c.lb2 = D('lb2', 'LB', 5, MID + 6, lb, 0.3); zone(c.lb2, 5.5, MID + 6);
      } else if (type === '2man') {    // two deep halves, man underneath
        c.c1 = D('c1', 'CB', 3, 3.5, db, 0.7); man(c.c1, w1);
        c.c2 = D('c2', 'CB', 3, FW - 3.5, db, 0.7); man(c.c2, w2);
        c.lb1 = D('lb1', 'LB', 5, te.y - teSide * 1.5, lb, 0.3); man(c.lb1, te);
        c.lb2 = D('lb2', 'LB', 5, MID + rbSide * 4, lb, 0.3); man(c.lb2, rb);
        c.s = D('s', 'S', 14, 10, db, 0.6); deep(c.s, 15, 10, 0, MID);
        deep(c.s2, 15, FW - 10, MID, FW);
        if (!reuse) { c.s2.x = L + 14; c.s2.y = FW - 10; }
      } else {                         // prevent: everyone deep, rush two
        c.c1 = D('c1', 'CB', 12, 5, db, 0.7); deep(c.c1, 18, 5, 0, 12);
        c.c2 = D('c2', 'CB', 12, FW - 5, db, 0.7); deep(c.c2, 18, FW - 5, 24, FW);
        c.s = D('s', 'S', 18, MID - 3, db, 0.6); deep(c.s, 22, MID - 3, 12, MID);
        deep(c.s2, 22, MID + 3, MID, 24);
        c.lb1 = D('lb1', 'LB', 7, MID - 6, lb, 0.3); zone(c.lb1, 9, MID - 6);
        c.lb2 = D('lb2', 'LB', 7, MID + 6, lb, 0.3); zone(c.lb2, 9, MID + 6);
      }
      return c;
    }

    // ---------- the defense's play caller ----------
    // Calls a coverage the way an NFL coordinator would: by down and distance, field position, clock and score,
    // and the offense's tendencies so far this game. Better defenses adapt more and disguise more.
    callDefense() {
      const d = this.cfg.oppDef, smart = clamp((d - 60) / 30, 0, 1);
      const togo = this.fdx >= 110 ? 110 - this.los : this.fdx - this.los, lead = this.score.opp - this.score.me;   // the defense's lead
      let w;
      if (this.down >= 3 && togo <= 3) w = { cover1p: 25, cover0: 25, cover1: 25, firezone: 15, cover3: 10 };
      else if (this.down === 3 && togo >= 8) w = { cover4: 20, '2man': 20, cover2: 18, firezone: 15, cover1: 12, cover3: 10, cover0: 5 };
      else if (this.down === 3) w = { cover1: 25, firezone: 18, '2man': 15, cover3: 15, cover0: 12, cover2: 10, cover1p: 5 };
      else if (this.down === 2 && togo >= 7) w = { cover3: 22, cover4: 20, cover2: 20, cover1: 15, firezone: 10, '2man': 8, cover0: 5 };
      else if (this.down === 2 && togo <= 3) w = { cover1: 25, cover1p: 20, cover3: 20, cover0: 15, firezone: 10, cover2: 10 };
      else w = { cover3: 30, cover1: 22, cover2: 15, cover4: 15, firezone: 6, cover0: 4, '2man': 4, cover1p: 4 };
      const mul = (k, f) => { if (w[k] != null) w[k] *= f; };
      if (this.los >= 90) { mul('cover1', 1.6); mul('cover1p', 1.6); mul('cover0', 1.6); mul('cover2', 1.2); mul('cover4', 0.6); mul('cover3', 0.8); }   // red zone: tight man
      if (this.los >= 105) { mul('cover0', 2); mul('cover1p', 2); }                                                                        // goal line
      const late = (this.q === 4 && this.clock < 60) || (this.q === 2 && this.clock < 25);
      if (late && lead > 0 && lead <= 8 && this.los < 85) w = { prevent: 50, cover4: 30, cover2: 20 };                                     // protect the lead, keep it in front
      else if (this.q === 2 && this.clock < 25 && this.los < 70) w = { prevent: 40, cover4: 35, cover2: 25 };                              // end of the half
      if (this.q >= 4 && this.clock < 120 && lead < 0) { mul('cover0', 2); mul('firezone', 1.5); }                                        // trailing late: bring it
      // tendencies: a run-heavy offense sees loaded boxes; a deep-throwing one sees two-high shells
      const t = this.tend;
      if (t.n >= 4) {
        const run = t.run / t.n, dp = t.deep / t.n, sh = t.short / t.n;
        const f = (x) => 1 + smart * x;
        if (run > 0.45) { for (const k of ['cover1', 'cover0', 'firezone', 'cover3', 'cover1p']) mul(k, f((run - 0.45) * 3)); for (const k of ['cover4', '2man', 'prevent']) mul(k, 1 / f((run - 0.45) * 3)); }
        if (dp > 0.35) for (const k of ['cover2', 'cover4', '2man']) mul(k, f((dp - 0.35) * 4));
        if (sh > 0.4) { mul('cover1p', f((sh - 0.4) * 4)); mul('cover2', f((sh - 0.4) * 2)); }
      }
      let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0), type = 'cover3';
      for (const k in w) { if ((r -= w[k]) < 0) { type = k; break; } }
      // disguise: show one shell and rotate to the real call at the snap
      let shown = type;
      if (type !== 'prevent' && Math.random() < 0.08 + smart * 0.17) {
        const looks = ['cover1', 'cover2', 'cover3', 'cover4'].filter((x) => x !== type);
        shown = looks[Math.floor(Math.random() * looks.length)];
      }
      return { type, shown, lbBlitz: type === 'cover1' && Math.random() < (this.down >= 3 ? 0.3 : 0.12) };
    }

    setupFormation() {
      const L = this.los, r = this.cfg.roster, d = this.cfg.oppDef, M = (...a) => this.mk(...a);
      const wr = (o) => 6.6 + (o - 60) * 0.035;
      this.qb = M('O', 'QB', L - 5, MID, 5.5); this.qb.agi = this.qbs.agi; this.qb.sta = this.qbs.sta; this.qb.sStat = this.qbs.spd;
      // on a run the back sets up in the off-tackle gap, so running straight hits a lane, not a lineman
      const rs = r.RB.stats || {}, rv = (k) => (rs[k] != null ? rs[k] : r.RB.ovr);
      const pl = this.play, runSide = pl && pl.type === 'run' ? pl.side || 1 : 1;
      const rb = M('O', 'RB', L - (pl && pl.rbX || 5), MID + (pl && pl.type === 'run' ? runSide * (pl.rbY || 4.4) : 3), wr(rv('spd')) + 0.1); rb.ovr = r.RB.ovr;
      rb.sweep = pl && pl.sweep ? runSide : 0;          // outside runs head for the sideline first
      rb.agi = rv('agi'); rb.hands = rv('hands'); rb.pow = rv('pow'); rb.sta = rv('sta'); rb.sStat = rv('spd');
      const recv = (key, y) => {
        const st = r[key].stats || {}, v = (k) => (st[k] != null ? st[k] : r[key].ovr);
        const p = M('O', key, L - 0.6, y, wr(v('spd')));
        Object.assign(p, { ovr: r[key].ovr, hands: v('hands'), agi: v('agi'), sta: v('sta'), pow: v('pow'), sStat: v('spd') });
        return p;
      };
      const w1 = recv('WR1', 3), w2 = recv('WR2', FW - 3);
      const ts = r.TE.stats || {}, tv = (k) => (ts[k] != null ? ts[k] : r.TE.ovr);
      // on runs the tight end lines up on the run side, just outside the hole, and leads the way
      const te = M('O', 'TE', L - 0.6, MID + (this.play && this.play.type === 'run' ? runSide * 6.6 : -7), 6.2 + (tv('spd') - 60) * 0.03);
      Object.assign(te, { ovr: r.TE.ovr, hands: tv('hands') + (ts.hands != null ? 0 : 6), pow: tv('pow') + (ts.pow != null ? 0 : 6),
                          blk: tv('blk'), sta: tv('sta'), agi: 55, sStat: tv('spd') });
      // three linemen, each with his own stats; tired linemen block up to 25% worse
      const isRun = this.play && this.play.type === 'run';
      const ol = [-2.6, 0, 2.6].map((o, i) => {
        const lr = r['OL' + (i + 1)] || r.OL || { ovr: 65 }, st = lr.stats || {}, v = (k) => (st[k] != null ? st[k] : lr.ovr);
        const p = M('O', 'OL', L - 0.6, MID + o, 4.4 + (v('spd') - 50) * 0.025);
        const fat = (100 - (this.olEnergy ? this.olEnergy[i] : 100)) / 100;
        Object.assign(p, { slot: i, pow: v('pow'), sta: v('sta'), blk: (isRun ? v('rblk') : v('pblk')) * (1 - fat * 0.25) });
        if (pl && pl.pull && o * runSide < 0) p.pull = runSide;     // Power: the backside lineman pulls
        return p;
      });
      this.off = [...ol, this.qb, rb, w1, w2, te];
      this.rb = rb;

      const db = 6.7 + (d - 60) * 0.03, lb = 6.6 + (d - 60) * 0.03, dls = 5.8 + (d - 60) * 0.02;
      const dl = [-2.6, 0, 2.6].map((o, i) => {
        const p = M('D', 'DL', L + 1, MID + o, dls); p.job = 'rush'; p.pow = d + rnd(-6, 6);
        // how long the lineman across from him holds him. Passes: his pass-block stat. Runs are decided in
        // about 1.5s, so there run block (with a quarter strength) sets a hold of ~1-3s that varies block to block.
        if (isRun) p.shed = clamp(2.2 + ((ol[i].blk * 0.75 + ol[i].pow * 0.25) - d) * 0.06, 0.4, 4) * rnd(0.5, 1.5)
          * (GP.hasSkill(this.cfg.staff, 'OC', 'ground') ? 1.2 : 1);                              // OC skill: Ground Game
        else p.shed = clamp(2.6 + rnd(0, 2.4) + (ol[i].blk - d) * 0.05, 1.5, 7) * (this.dif ? this.dif.rush : 1);
        ol[i].mark = p; return p;
      });
      // the back seven line up according to the coverage they show; the alignment is the pre-snap tell
      const cov = this.buildCoverage(this.dcall.shown || this.dcall.type, { L, M, w1, w2, te, rb, db, lb, dl1: dl[1], lbBlitz: this.dcall.lbBlitz });
      const { lb1, lb2, c1, c2, s } = cov;
      if (cov.s2) ol[1].mark = null;               // the middle lineman dropped out: his blocker finds someone else
      this.cov = cov;
      for (const p of dl) p.react = 0;
      this.def = [...dl, lb1, lb2, c1, c2, s];
      this.def.forEach((p, i) => {
        p.info = this.dRoster[DSLOTS[i][0]]; p.skin = (i * 5 + 1) % 3;
        // defensive backs and linebackers run on the same speed scale as receivers, so speed matchups are real
        if (p.role !== 'DL') p.spd = (6.6 + (p.info.spd - 60) * 0.035) * (p.role === 'LB' ? 0.98 : 1);
      });
      if (this.cov.s2) {                            // the second safety takes the middle lineman's place
        const p = this.cov.s2; p.info = this.dRoster.S2; p.role = 'S'; p.spd = 6.6 + (p.info.spd - 60) * 0.035;
      }
      this.off.forEach((p, i) => { p.skin = (i * 7 + 2) % 3; });
      this.downed = null;

      if (this.play && this.play.type === 'pass') {
        for (const p of this.off) {
          const rt = this.play.routes[p.role];
          if (!rt) continue;
          const inS = p.y < MID ? 1 : -1;
          if (rt.block) { p.route = { block: true, pts: [] }; continue; }      // stays in to block
          p.route = { stop: rt.stop, pts: rt.pts.map(([dx, dy]) => [Math.min(p.x + dx, 118), clamp(p.y + dy * inS, 1.2, FW - 1.2)]) };
        }
      }
      this.carrier = this.qb;
      this.ball = { state: 'held' };
    }

    // ---------- live play ----------
    tick(dt) { if (this.clock !== Infinity) this.clock = Math.max(0, this.clock - dt); }

    // Lead assist: nudge a throw released near a receiver toward the right lead for where he'll be when the
    // ball arrives. Normal: partial, stronger for more accurate quarterbacks. Easy: full. Hard: none.
    leadAssist(t) {
      const diff = this.cfg.difficulty || 'normal';
      const s = diff === 'hard' ? 0 : diff === 'easy' ? 0.9 : clamp(0.35 + (this.qbs.acc - 60) * 0.012, 0.25, 0.8);
      if (!s) return t;
      const qb = this.qb; let best = null, bd = 5;
      for (const p of this.off) {
        if (!['WR1', 'WR2', 'TE', 'RB'].includes(p.role)) continue;
        let lx = p.x, ly = p.y;
        for (let i = 0; i < 3; i++) { const T = 0.3 + hyp(lx - qb.x, ly - qb.y) / this.ballSpeed; lx = p.x + p.vx * T; ly = p.y + p.vy * T; }
        const miss = hyp(lx - t.x, ly - t.y);
        if (miss < bd) { bd = miss; best = { x: lx, y: ly }; }
      }
      if (!best) return t;
      let x = t.x + (best.x - t.x) * s, y = t.y + (best.y - t.y) * s;
      const d = hyp(x - qb.x, y - qb.y), max = this.maxRange * (1 - this.fatigue() * 0.3);
      if (d > max) { x = qb.x + (x - qb.x) * max / d; y = qb.y + (y - qb.y) * max / d; }
      return { x, y };
    }
    // Mistakes. Before each snap every defender behind the line may bust his assignment. How often depends on
    // his stars and on his coordinator's: 1.5% a play for a 5-star player under a 5-star coordinator, 6% for
    // 2-3 stars under an average one, 10.5% for a 0-star player under a 0-star one. What goes wrong depends on his job:
    //   man   - he loses his man on the first break           deep - he jumps a short route and leaves the deep ball
    //   zone  - he drops to the wrong spot                    play action - he bites twice as hard on the fake
    //   runs  - he misreads it, comes late and overruns the play
    rollBusts() {
      const dc = this.oppDC, isRun = this.play.type === 'run';
      for (const d of this.def) {
        d.bust = null; d.bustHit = false;
        if (d.role === 'DL' || !d.info || d.job === 'rush') continue;
        const st = d.info.stars != null ? d.info.stars : 2;
        if (Math.random() > 0.015 + (5 - st) * 0.01 + (5 - dc) * 0.008) continue;
        if (isRun) { d.bust = 'run'; d.react += 0.35; }
        else if (d.job === 'man') d.bust = 'man';
        else if (d.job === 'deep') { d.bust = 'deep'; d.jumpAt = rnd(0.45, 0.8); }
        else { d.bust = 'zone'; d.anchor = [d.anchor[0] + rnd(-1, 2), clamp(d.anchor[1] + (Math.random() < 0.5 ? -6 : 6), 2, FW - 2)]; }
        if (this.play.pa && (d.role === 'LB' || d.role === 'S')) d.bust = d.bust || 'pa';
      }
    }
    // A defender breaks on a thrown ball once he reads it: a strong cover man reacts sooner and from farther
    // away (about 0.25s and 8.5 yds at 90 coverage, 0.55s and 7 yds at 60). Easy slows the read; Hard speeds it up.
    ballReact(d, b) {
      const cov = d.info ? d.info.cov : 70, diff = this.cfg.difficulty || 'normal';
      const react = 0.25 + (90 - cov) * 0.01 + (diff === 'easy' ? 0.25 : diff === 'hard' ? -0.1 : 0);
      const reach = (4 + cov * 0.05) * (diff === 'easy' ? 0.75 : diff === 'hard' ? 1.15 : 1);
      return this.t - b.t0 > react && hyp(d.x - b.tx, d.y - b.ty) < reach;
    }
    throwBall(tx, ty) {
      const qb = this.qb;
      const d = hyp(tx - qb.x, ty - qb.y), sd = d * this.scatter * (1 + this.fatigue() * 0.9 * this.dif.tire);  // tired: less accurate
      tx += gauss() * sd; ty += gauss() * sd;
      this.ball = { state: 'air', sx: qb.x, sy: qb.y, tx, ty, u: 0, dur: 0.3 + d / this.ballSpeed, t0: this.t, dist: d };
      this.carrier = null; this.stats.att++;
      let best = null, bd = 12;
      for (const p of this.off) {
        if (p.role === 'OL' || p.role === 'QB') continue;
        const dd = hyp(p.x - tx, p.y - ty);
        if (dd < bd) { bd = dd; best = p; }
      }
      this.ball.intended = best;
    }

    // Linemen lock a defender up; a receiver's block only slows him and he can still tackle.
    blockFactor(d, dt) {
      d.held = false;
      if (d.eng >= d.shed) return 1;
      let f = 1;
      for (const o of this.off) {
        if (!o.blocking) continue;
        const line = o.role === 'OL' || (o.role === 'TE' && this.play.type === 'run');
        // a lineman (or a run-blocking tight end) holds only the man he's blocking, not everyone near him
        if (line && o.otarget !== d && o.btarget !== d && o.mark !== d) continue;
        if (hyp(o.x - d.x, o.y - d.y) < (line ? 1.5 : 1.2)) {
          if (line && o.role === 'OL') {
            const pass = this.play.type === 'pass';
            // speed: on pass plays a quicker rusher works around a slower lineman sooner
            const rate = pass ? clamp(1 + (d.spd - o.spd - 1.2) * 0.4, 0.7, 1.6) : 1;
            d.eng += dt * rate; d.held = true;
            // strength: a stronger defender drives a lineman back toward the quarterback (on runs, strength
            // also counts for a quarter of how long the block holds; see setupFormation)
            const diff = (d.pow || 70) - (o.pow || 70);
            return 0.15 * clamp(1 + diff * 0.025, 0.25, 2);
          }
          if (line) {
            // a tight end's blocking stat sets how long he holds the man he engages, on average about
            // 0.5s at 50, 1.4s at 70, 2.3s at 90, varying from block to block (40%-160% of that).
            // Runs are decided in about 1.5s, so better blockers lose their man less often.
            if (o.blk != null && d.blockedBy !== o) {
              d.blockedBy = o; d.shed = d.eng + clamp(0.5 + (o.blk - 50) * 0.045, 0.3, 2.5) * rnd(0.4, 1.6);
            }
            d.eng += dt; d.held = true; return 0.15;
          }
          f = 0.5;
        }
      }
      if (f < 1) d.eng += dt;
      return f;
    }

    // How sharply a receiver changes direction on his route: agile receivers separate on cuts.
    cutAcc(p) { return p.agi != null && p.role !== 'RB' ? clamp(14 + (p.agi - 70) * 0.15, 9, 18) : 14; }
    // Stamina: after 3s of running (route time counts for receivers) a player starts to slow,
    // slowly if he has stamina, at most 10%. Returns the speed multiplier.
    runFade(p, dt) {
      p.runT = (p.runT || 0) + dt;
      const rate = Math.max(0.004, 0.05 - ((p.sta != null ? p.sta : 70) - 50) * 0.001);
      const start = p.role === 'WR1' || p.role === 'WR2' || p.role === 'TE' ? 2 : 3;   // receivers run all play long
      return 1 - clamp((p.runT - start) * rate, 0, 0.1);
    }
    followRoute(p, dt) {
      const r = p.route;
      if (p.wp < r.pts.length) {
        const [tx, ty] = r.pts[p.wp];
        const d = hyp(tx - p.x, ty - p.y);
        if (d < 0.5) {
          p.wp++;
          // breaking on his route: a man defender loses track of him for a moment. Breaking away from the
          // defender's leverage (or back toward the quarterback) costs him most; breaking into it, almost nothing.
          // Agility against the defender's coverage adds or takes away from that; a busted defender loses him.
          const nx = r.pts[p.wp];
          if (nx && p.agi != null && p.role !== 'RB') {
            const ddx = nx[0] - p.x, ddy = nx[1] - p.y, len = hyp(ddx, ddy) || 1, lat = Math.abs(ddy) / len;
            const inward = Math.sign(ddy) === (p.y < MID ? 1 : -1) ? 1 : -1;
            for (const dd of this.def) if (dd.job === 'man' && dd.mark === p) {
              const base = ddx < 0 ? 0.14 : inward === dd.lev ? 0 : 0.14;
              dd.lag = dd.bust === 'man' ? 0.8 : clamp((base + (p.agi - dd.info.cov) * 0.012) * (ddx < 0 ? 1 : 0.4 + 0.6 * lat), 0, 0.45);
              if (dd.bust === 'man') dd.bustHit = true;
            }
          }
          return;
        }
        p.dir = [(tx - p.x) / d, (ty - p.y) / d];
        go(p, tx, ty, p.spd * this.runFade(p, dt), dt, this.cutAcc(p));
      } else if (r.stop) go(p, p.x, p.y, 0, dt, 10);
      else go(p, p.x + p.dir[0] * 5, p.y + p.dir[1] * 5, p.spd * this.runFade(p, dt), dt, this.cutAcc(p));
      p.x = Math.min(p.x, 118.5); p.y = clamp(p.y, 1, FW - 1);
    }

    blockTarget(p, ref) {
      const lineman = p.role === 'OL';
      // backs, tight ends and receivers stick with the man they picked, and look for defenders who are
      // free and still in front of the ball carrier instead of doubling a lineman who is already blocked
      // (the line handles the defensive linemen; everyone else climbs to linebackers and safeties)
      const ok = (d) => d.stun <= 0 && d.eng < d.shed && (lineman || (d.role !== 'DL' && d.x > ref.x - 1));
      if (!lineman && p.btarget && ok(p.btarget)) return p.btarget;
      // inside runs: the tight end blocks the man covering him (he lines up over him)
      if (p.role === 'TE' && this.play.type === 'run' && !this.play.sweep && !p.btarget) {
        const mine = this.def.find((d) => d.job === 'man' && d.mark === p && ok(d));
        if (mine) { p.btarget = mine; return mine; }
      }
      // outside runs: the tight end kicks out the widest defender near the line on the run side (the edge man)
      if (p.role === 'TE' && this.play.sweep && !p.btarget) {
        const side = this.rb.sweep || 1; let edge = null;
        for (const d of this.def) if (d.role !== 'DL' && d.x < this.los + 6 && ok(d) && Math.abs(d.y - p.y) < 6
          && !(d.job === 'man' && d.mark && d.mark.role.startsWith('WR')) && (!edge || (d.y - edge.y) * side > 0)) edge = d;
        if (edge && (edge.y - MID) * side > 0) { p.btarget = edge; return edge; }
      }
      let best = null, bs = 1e9;
      // a lineman takes a man nobody else on the line has; with a spare lineman (a two-high shell has one fewer
      // down lineman), the spare climbs to a linebacker instead of doubling
      const taken = lineman ? new Set(this.off.filter((o) => o !== p && o.role === 'OL' && o.otarget).map((o) => o.otarget)) : null;
      for (const d of this.def) {
        if (!ok(d) || (!lineman && d.held) || (taken && taken.has(d))) continue;
        const s = hyp(d.x - p.x, d.y - p.y) + 0.5 * hyp(d.x - ref.x, d.y - ref.y);
        if (s < bs) { bs = s; best = d; }
      }
      if (!lineman) p.btarget = best; else p.otarget = best;
      return best;
    }

    updateLive(dt) {
      const L = this.los, qb = this.qb, b = this.ball, isPass = this.play.type === 'pass';
      this.t += dt; this.tick(dt);
      if (!isPass && this.carrier === qb && this.t >= 0.25) this.carrier = this.rb;
      const c = this.carrier;
      const runPhase = this.running(c);
      const ref = c || this.rb;      // who blockers protect / defenders chase

      // offense
      for (const p of this.off) {
        p.blocking = false;
        if (p === c && runPhase) { this.steerRunner(p, dt); continue; }
        if (p.role === 'QB') {
          if (c === qb && this.t < 0.8) go(p, L - 7.5, MID, 4, dt, 8); else go(p, p.x, p.y, 0, dt, 8);
          continue;
        }
        // RB screen: the line holds briefly, then releases to lead-block in the flat
        // Power: the pulling lineman runs behind the line to the hole, then turns up and blocks the first
        // free defender there (usually the linebacker who'd otherwise be unblocked); his own man is left
        // alone on the backside, where he has to chase the play
        if (p.pull && !isPass) {
          const hole = [L + 1, MID + p.pull * 4];
          if (this.t < 0.4) { p.blocking = true; go(p, L - 1.2, MID + p.pull * 3, p.spd * 1.3, dt, 10); continue; }
          if (!p.otarget || p.otarget.stun > 0 || p.otarget.eng >= p.otarget.shed) {
            let best = null, bs = 1e9;
            for (const d of this.def) {
              if (d.role === 'DL' || d.stun > 0 || d.eng >= d.shed || this.off.some((o) => o !== p && (o.otarget === d || (o.role === 'TE' && o.btarget === d)))) continue;
              const x = hyp(d.x - hole[0], d.y - hole[1]); if (x < bs && x < 9) { bs = x; best = d; }
            }
            p.otarget = best;
          }
          const d = p.otarget; p.blocking = true;
          if (!d) { go(p, hole[0] + 2, hole[1], p.spd, dt, 8); continue; }
          const tr = ref, dd = hyp(tr.x - d.x, tr.y - d.y) || 1;
          go(p, d.x + ((tr.x - d.x) / dd) * 0.9, d.y + ((tr.y - d.y) / dd) * 0.9, p.spd * 1.25, dt, 8);
          continue;
        }
        if (p.role === 'OL' && isPass && this.play.screen === 'rb' && !runPhase && this.t > 0.75) { go(p, L + 1.5, MID + 7, p.spd, dt, 8); continue; }
        const mustBlock = runPhase || !isPass || (p.route && p.route.block);
        if (p.role === 'OL' || mustBlock) {
          p.blocking = true;
          let d = !mustBlock && p.mark && p.mark.eng < p.mark.shed ? p.mark : this.blockTarget(p, mustBlock ? ref : qb);
          if (!d) { go(p, p.x, p.y, 0, dt, 6); continue; }
          const tr = mustBlock ? ref : qb;
          const dd = hyp(tr.x - d.x, tr.y - d.y) || 1;
          go(p, d.x + ((tr.x - d.x) / dd) * 0.9, d.y + ((tr.y - d.y) / dd) * 0.9, p.spd * (p.role === 'OL' ? 1 : 0.9), dt, 8);
        } else if (b.state === 'air' && p === b.intended) go(p, b.tx, b.ty, p.spd * this.runFade(p, dt), dt, this.cutAcc(p));
        else if (p.route) this.followRoute(p, dt);
      }

      // defense
      const recs = this.off.filter((p) => p.route);
      for (const d of this.def) {
        if (d.stun > 0) { d.stun -= dt; continue; }
        if (d.bite > 0 && !runPhase) { d.bite -= dt; go(d, this.los + 1, d.y, d.spd * 0.8, dt, 6); continue; }   // biting on the fake
        const f = this.blockFactor(d, dt);
        let tx, ty, sp = d.spd;
        if (runPhase || (!isPass && this.t > d.react)) {
          const lead = d.bust === 'run' ? Math.min(2, (hyp(ref.x - d.x, ref.y - d.y) / d.spd) * 1.6)   // busted: overruns it
            : Math.min(0.8, (hyp(ref.x - d.x, ref.y - d.y) / d.spd) * 0.6);
          tx = ref.x + ref.vx * lead; ty = ref.y + ref.vy * lead;
          // contain: closing in, he stays outside the runner on his side so the runner can't get the edge; then he tackles
          if (d.contain && (ref.y - MID) * d.contain > 0 && hyp(ref.x - d.x, ref.y - d.y) > 2.2) ty = d.contain > 0 ? Math.max(ty, ref.y + 1.2) : Math.min(ty, ref.y - 1.2);
        } else if (b.state === 'air' && this.ballReact(d, b)) {
          tx = b.tx; ty = b.ty;
        } else if (d.job === 'rush') { tx = qb.x; ty = qb.y; if (this.t < (d.delay || 0)) sp = 0; }
        else if (d.job === 'man') {
          const m = d.mark;
          // a yard to his leverage side while he's still in front of his man; once he's trailing he squeezes onto him
          const shade = (d.lev || 0) * (m.y < MID ? 1 : -1) * 0.9 * clamp((d.x - m.x + 1) / 2, 0, 1);
          // keep a cushion on a receiver; against a back swinging to the flat he comes downhill to where the back is going
          if (d.x - m.x > 2.5 && (m.role !== 'RB' || m.vx > 2)) { tx = m.x + 3.5; ty = m.y + shade; sp *= 0.6; }
          else if (d.x - m.x > 2.5) { const ld = clamp(hyp(m.x - d.x, m.y - d.y) / d.spd * 0.6, 0.1, 0.7); tx = m.x + m.vx * ld; ty = m.y + m.vy * ld + shade; }
          else { tx = m.x + m.vx * 0.1; ty = m.y + m.vy * 0.1 + shade; }
        } else if (d.job === 'deep' && d.bust === 'deep' && this.t > d.jumpAt && this.t < d.jumpAt + 0.9) {
          tx = this.los + 6; ty = d.y; d.bustHit = true;                 // busted: he jumps the short route
        } else if (d.job === 'deep') {     // stay on top of the deepest route in my lane
          let r = null;
          for (const p of recs) if (p.y >= d.lane[0] && p.y <= d.lane[1] && (!r || p.x > r.x)) r = p;
          tx = d.anchor[0]; ty = d.anchor[1];
          if (r) { tx = Math.min(Math.max(tx, r.x + 3), 117); ty = (ty + r.y) / 2; }
        } else {                           // underneath zone: sit on a spot, squeeze the nearest route
          let r = null, rd = 7;
          for (const p of recs) { const x = hyp(p.x - d.anchor[0], p.y - d.anchor[1]); if (x < rd) { rd = x; r = p; } }
          tx = d.anchor[0]; ty = d.anchor[1];
          if (r) { tx += (r.x - tx) * 0.65; ty += (r.y - ty) * 0.65; }
        }
        if (d.lag > 0) { d.lag -= dt; sp *= 0.35; }
        go(d, tx, ty, sp * f, dt, 5);
        d.y = clamp(d.y, 0.5, FW - 0.5);
      }

      // ball in the air
      if (b.state === 'air') {
        b.u += dt / b.dur;
        if (b.u >= 1) return this.resolvePass();
        return;
      }

      // tackles (none while he's in the air on a lunge)
      for (const d of (runPhase && c.lunge ? [] : this.def)) {
        if (d.stun > 0 || d.held || hyp(d.x - c.x, d.y - c.y) > 1.15) continue;
        const tkl = d.info.tkl;
        if (c === qb && !this.scramble) {
          if (Math.random() > clamp(0.86 + (tkl - 70) * 0.006, 0.75, 0.97)) { d.stun = 1; this.pop('Slipped the sack!'); continue; }
          this.stats.sack++; d.info.tk++; this.downed = c; this.energy = Math.max(0, this.energy - 4);
          return this.gainResult(c.x, `SACKED by #${d.info.num} — loss of ${Math.max(0, Math.round(L - c.x))}`);
        }
        if (c.juke && c.juke.t > 0 && !c.juke.read) {
          // a well-timed juke is agility against the tackler: agile backs eat up poor tacklers
          if (Math.random() < clamp(0.75 + ((c.agi || 60) - tkl) * 0.025, 0.3, 0.99)) {
            d.stun = 1.0; c.juke.hit = true; this.stats.broken++; this.stats.jbroken++;
            this.pop('BROKEN TACKLE!', '#ffd84a'); continue;
          }
          c.juke.read = true;              // he read it; the tackle resolves normally below
          this.pop(`#${d.info.num} read the juke!`, '#ff8a5c');
        }
        const hit = this.contact(d, c);
        if (Math.random() > hit.p) {
          d.stun = 1.1; this.stats.broken++;
          this.pop(hit.angle < -0.3 ? 'Outran the tackle!' : 'Missed tackle!');
          continue;
        }
        return this.startTackle(d, c, hit);
      }
      if (runPhase) {
        if (c.x >= 110) return this.touchdown();
        if (c.y <= 0.3 || c.y >= FW - 0.3) return this.finishRun(c.x, true);
        if (c.landed) { this.downed = c; c.slid = !!c.lunge.slide; return this.finishRun(c.x, false); }
      }
    }

    // The ball carrier runs straight downfield. A cut angles him toward a sideline for a moment;
    // a juke is a hard sidestep with a short window in which he slips the next tackle.
    // How a tackle attempt plays out. angle: +1 defender meets the runner head-on, 0 from the side,
    // -1 from behind. Head-on hits by good tacklers land; side and rear arm-tackles on a fast runner often miss.
    contact(d, c) {
      const cs = hyp(c.vx, c.vy) || 0.01, ds = hyp(d.vx, d.vy);
      const dist = hyp(d.x - c.x, d.y - c.y) || 0.01;
      const angle = (c.vx * (d.x - c.x) + c.vy * (d.y - c.y)) / (cs * dist);
      const power = c.pow != null ? c.pow : (c.ovr || 65) + (c.role === 'TE' ? 6 : c.role === 'QB' ? -6 : 0);
      let p = 0.72 + (d.info.tkl - 70) * 0.012 - (power - 65) * 0.006;
      p += angle * 0.18;                                    // head-on +0.18, from behind -0.18
      p += Math.min(ds / 7, 1) * 0.06;                      // defender arriving at speed
      if (angle < 0.3) p -= Math.min(cs / 7, 1) * 0.07;     // a fast runner pulls away from side/rear grabs
      // a "big hit": defender at speed, square-on; only these can jar the ball loose
      const big = angle > 0.4 && ds > 4.5;
      return { p: clamp(p, 0.25, 0.97), angle, big, power, cs };
    }
    startTackle(d, c, hit) {
      // fall forward: more with momentum and power, less when stood up by a head-on hit
      const fwd = Math.max(0, c.vx);
      let fall = fwd * 0.22 * (1 - 0.6 * Math.max(0, hit.angle)) * (1 + (hit.power - 65) * 0.015);
      fall = clamp(fall + rnd(-0.2, 0.3), 0, 2.6);
      const fumble = hit.big && Math.random() < clamp(0.012 + (d.info.tkl - 70) * 0.0006 - (hit.power - 65) * 0.0006, 0.005, 0.02);
      d.info.tk++;
      this.phase = 'tackling'; this.downed = c;
      this.tk = { d, c, x0: c.x, fall, t: 0, ox: d.x - c.x, oy: d.y - c.y, fumble };
      this.pop(hit.big ? `BIG HIT by #${d.info.num}!` : `Tackled by #${d.info.num} ${d.info.pos}`, hit.big ? '#ff8a5c' : '#fff');
    }
    updateTackle(dt) {
      const k = this.tk; k.t += dt;
      const u = Math.min(1, k.t / FALL_TIME), e = 1 - (1 - u) * (1 - u);
      k.c.x = k.x0 + k.fall * e; k.c.vx = k.c.vy = 0;
      k.d.x = k.c.x + k.ox * (1 - e * 0.5); k.d.y = k.c.y + k.oy * (1 - e * 0.5);
      if (u < 1) return;
      this.tk = null;
      const x = k.c.x;
      this.stats.yac += Math.max(0, Math.round(x - k.x0));
      if (k.fumble) return this.fumble(x);
      if (x >= 110) return this.touchdown();
      this.finishRun(x, false);
    }
    fumble(x) {
      this.credit(x);
      if (Math.random() < 0.6) {          // defense recovers
        this.stats.fum++;
        const dist = clamp(x - 10, 1, 99);
        return this.endPlay(`FUMBLE! ${this.cfg.opp.abbr} recover`, () => this.checkClock(() => this.oppDrive(dist, 'They recovered the fumble.')));
      }
      const g = Math.round(x - this.los);
      this.gainResult(x, `Fumble — you recover${g ? (g > 0 ? `, gain of ${g}` : `, loss of ${-g}`) : ''}`);
    }

    steerRunner(p, dt) {
      if (p.lunge) {                                  // diving or sliding straight ahead, then down
        const L = p.lunge, end = L.x0 + L.dist;
        L.t -= dt;
        go(p, end, p.y, L.slide ? 7 : 9, dt, 40);
        p.vy = 0;
        if (p.x >= end - 0.05 || L.t <= 0) { if (p.x >= end - 0.05) p.x = end; p.landed = true; }   // lands at the full distance
        return;
      }
      if (p.stop) {
        p.stop.t -= dt;
        if (p.stop.t > 0) { go(p, p.x, p.y, 0, dt, 14); return; }
        p.stop = null;
      }
      const k = this.keys;
      let dy = 0, sp = p.spd * 0.97, acc = 10;       // a touch slower with the ball
      const f = this.runFade(p, dt);
      if (f < 0.94 && !p.tired) { p.tired = true; this.pop('Running out of gas…', '#ffb43a'); }
      sp *= f;
      if (p.jukeCd > 0) p.jukeCd -= dt;
      const j = p.juke;
      if (j && j.t > -JUKE_RECOVER) {
        j.t -= dt;
        if (j.t > 0) { dy = j.dir * 0.95; acc = 22; }                // the sidestep itself
        else { dy = j.dir * 0.2; sp *= j.hit ? 0.92 : 0.7; }        // planting: slower if he juked air
      } else if (p.cut && p.cut.t > 0) {
        p.cut.t -= dt; dy = p.cut.dir * 0.75;
      } else {
        dy = ((k.arrowdown || k.s ? 1 : 0) - (k.arrowup || k.w ? 1 : 0)) * 0.75;
        if (!dy && p.sweep && (p.runT || 0) < 0.9) dy = p.sweep * 0.85;      // outside run: to the edge, then up
      }
      const dx = Math.sqrt(1 - dy * dy);
      go(p, p.x + dx * 5, p.y + dy * 5, sp, dt, acc);
    }

    resolvePass() {
      const b = this.ball; b.state = 'dead';
      const oob = b.ty < 0 || b.ty > FW || b.tx > 120 || b.tx < 0;
      let o = null, od = 1.9 + this.dif.window, d = null, dd = 1.7;
      for (const p of this.off) {
        if (p.role === 'OL' || p.role === 'QB') continue;
        const x = hyp(p.x - b.tx, p.y - b.ty); if (x < od) { od = x; o = p; }
      }
      for (const p of this.def) { const x = hyp(p.x - b.tx, p.y - b.ty); if (x < dd) { dd = x; d = p; } }
      if (oob) return this.incomplete('Out of bounds — incomplete');
      // how much a nearby defender disrupts the catch depends on his coverage
      const dcov = d && d.info ? d.info.cov : 70, dskill = clamp(0.6 + (dcov - 60) * 0.015, 0.4, 1.2) * ((this.cfg.difficulty || 'normal') === 'hard' ? 1.15 : 1);
      if (d && (!o || dd < od) && Math.random() < (o ? 0.22 : 0.35) * this.dif.pick * dskill) return this.intercepted(b.tx);
      if (!o) return this.incomplete(d ? 'Broken up' : 'Incomplete');
      let pc = 0.8 + ((o.hands != null ? o.hands : o.ovr) - 60) * 0.004 - (od / 1.9) * 0.15;   // a back's catching stat
      // a defender on him makes it a contested catch; strength helps him win it
      if (d) pc -= 0.4 * dskill * (this.dif.pick < 1 ? 0.75 : 1) * (1 - dd / 1.7) * (o.pow != null ? clamp(1 - (o.pow - 65) * 0.008, 0.75, 1.2) : 1);
      if (Math.random() > pc) return this.incomplete(d ? 'Broken up' : 'Dropped');
      // caught
      this.stats.comp++; this.caught = true; this.carrier = o; b.state = 'held';
      const bust = this.def.find((x) => x.bust && x.bust !== 'run' && (x.bustHit || x.bust === 'zone' || x.bust === 'pa')
        && (x.mark === o || hyp(x.x - b.tx, x.y - b.ty) < 9));
      if (bust && o.x - this.los > 8) this.pop(`Busted coverage! #${bust.info.num} blew it`, '#ffd84a');
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
      if (this.caught) this.stats.pyd += y; else if (this.running(this.carrier)) this.stats.ryd += y;
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
      else if (this.clock !== Infinity) {
        const hurry = GP.hasSkill(this.cfg.staff, 'OC', 'twomin') && (this.q === 2 || this.q === 4) && this.clock < 60;   // OC skill
        this.clock = Math.max(0, this.clock - RUNOFF * (hurry ? 0.5 : 1));
      }
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
      this.defNote = this.defNoteNext || null; this.defNoteNext = null;
      this.phase = 'dead'; this.deadT = hold || 1.5; this.banner = { text: msg, t: this.deadT };
      this.after = after; this.aim = null; this.gesture = null;
    }

    // ---------- kicking ----------
    // ---------- kicking ----------
    // Stages: 'set' (tap to start) -> 'aim' (drag back like a pass; reach limited by kick distance)
    // -> 'meter' (accuracy sets the green zone and marker speed) -> 'flight' -> result.
    startKick(type) {
      if (type === 'pat') { this.los = 95; this.fdx = 110; }
      const punt = type === 'punt';
      // field goals: from the hold spot to the uprights. Punts: from 13 yards behind the line, judged at about 40 yards.
      const dist = punt ? 40 : Math.round(127 - this.los);
      const acc = this.ks.acc, u = clamp((acc - 40) / 59, 0, 1);
      // half-width of the green zone; a punt's is wider (direction and distance are forgiving, a shank isn't)
      const tol = punt ? clamp(0.065 + u * 0.075, 0.065, 0.14) : clamp(0.035 + u * 0.07 - (dist - 20) * 0.0012, 0.035, 0.1);
      const yel = tol + Math.max(0.035, tol * 0.9);                               // and of the yellow around it
      const sx = punt ? Math.max(this.los - 13, 2) : 120 - dist;
      // punt reach from the punter's spot: 61 yards at 71 kick distance (a 3-star punter), so a full punt
      // travels about 47 yards past the line, the NFL average; about 46 at 40 and 73 at 99
      const range = punt ? Math.round(clamp(61 + (this.ks.leg - 71) * 0.45, 40, 75)) : this.kickRange;
      this.kick = { type, dist, tol, yel, range, speed: 1.1 + (1 - u) * 1.1, pos: 0, dir: 1, stage: 'set', sx, sy: MID, target: null, rt: 0, started: false };
      this.phase = 'kick'; this.kaim = null; this.carrier = null; this.ball = { state: 'held' };
      this.setupKickFormation();
    }
    // The kicking unit: seven blockers on the line, the holder kneeling at the spot, the kicker behind him;
    // seven rushers, each across from a blocker, and two returners deep.
    setupKickFormation() {
      const k = this.kick, L = this.los, r = this.cfg.roster, d = this.cfg.oppDef, M = (...a) => this.mk(...a);
      const blk = (key, stat) => { const p = r[key]; return p && p.stats && p.stats[stat] != null ? p.stats[stat] : 55; };
      // the edges of a kick unit are filled by backs and receivers: half as good as the line, half a flat 55
      const olAvg = (blk('OL1', 'pblk') + blk('OL2', 'pblk') + blk('OL3', 'pblk')) / 3, edge = (olAvg + 55) / 2;
      const line = [['WR1', -3.9, edge], ['RB', -2.6, edge], ['OL1', -1.3, blk('OL1', 'pblk')], ['OL2', 0, blk('OL2', 'pblk')],
                    ['OL3', 1.3, blk('OL3', 'pblk')], ['TE', 2.6, (blk('TE', 'blk') + olAvg) / 2], ['WR2', 3.9, edge]];
      this.off = []; this.def = [];
      line.forEach(([role, y, b], i) => {
        const o = M('O', role.replace(/\d/, ''), L - 0.6, MID + y, 5); o.skin = (i * 7 + 2) % 3; this.off.push(o);
        const ru = M('D', i === 0 || i === 6 ? 'CB' : i === 3 ? 'DL' : 'LB', L + 0.9, MID + y * 1.15, 2.6 * rnd(0.85, 1.15) + (d - 75) * 0.02);
        ru.skin = (i * 5 + 1) % 3; ru.face = 1;
        // how long his man holds him: the blocker's pass-block (or blocking) stat against the defense
        ru.shed = clamp(1.4 + (b - d) * 0.05, 0.4, 4) * rnd(0.55, 1.6); ru.blocker = o; ru.info = { num: 0, pos: ru.role, tkl: 70 };
        this.def.push(ru);
      });
      for (const y of [MID - 6, MID + 6]) { const p = M('D', 'S', Math.min(L + 25, 118), y, 5); p.face = 1; p.idle = true; this.def.push(p); }
      if (k.type === 'punt') {
        this.kicker = M('O', 'K', k.sx - 0.8, k.sy + 0.3, 5); this.kicker.skin = 0; this.holder = null;
        this.off.push(this.kicker); this.qb = this.kicker;
      } else {
        this.holder = M('O', 'QB', k.sx + 0.3, k.sy - 0.7, 5); this.holder.pose = 'kneel'; this.holder.skin = 2;
        this.kicker = M('O', 'K', k.sx - 2.6, k.sy + 1.1, 5); this.kicker.skin = 0;
        this.off.push(this.holder, this.kicker); this.qb = this.holder;
      }
      this.downed = null;
    }
    // After the snap the line holds its men, then they break free and charge the spot.
    kickRush(dt) {
      const k = this.kick, spot = { x: k.sx + 0.8, y: k.sy };
      k.rt += dt;
      let nearest = 99;
      for (const ru of this.def) {
        if (ru.idle) continue;
        if (k.rt < ru.shed) {
          go(ru, ru.x - 1, ru.y, 0.55, dt, 6);                        // pushing the pile
          ru.blocker.x = ru.x - 0.9; ru.blocker.y += (ru.y - ru.blocker.y) * Math.min(1, dt * 4); ru.blocker.vx = ru.vx;
        } else go(ru, spot.x, spot.y, ru.spd, dt, 10);                // free and charging
        nearest = Math.min(nearest, hyp(ru.x - spot.x, ru.y - spot.y));
      }
      k.nearest = nearest;
      // a rusher who gets to the ball before it's kicked blocks it
      if (nearest < 0.5 && k.stage !== 'flight' && k.stage !== 'blocked') this.kickBlocked();
    }
    kickBlocked() {
      const k = this.kick; k.stage = 'blocked'; k.res = { blocked: true };
      this.pop('BLOCKED!', '#ff6b6b');
      const ex = k.sx + rnd(-4, 2), ey = k.sy + rnd(-4, 4);
      this.ball = { state: 'air', sx: k.sx, sy: k.sy, tx: ex, ty: ey, u: 0, dur: 0.6, t0: 0, dist: 3 };
    }
    kickTap(p) {
      const k = this.kick; if (!k) return;
      if (k.stage === 'set') { k.stage = 'aim'; k.started = true; }
      else if (k.stage === 'aim') this.kaim = { sx: p.x, sy: p.y, cx: p.x, cy: p.y };
      else if (k.stage === 'meter') this.doKick();
    }
    kickAimTarget() {
      const a = this.kaim, k = this.kick;
      let vx = ((a.sx - a.cx) / PPY) * 2.2, vy = ((a.sy - a.cy) / PPY) * 2.2;
      const d = hyp(vx, vy);
      if (d > k.range) { vx *= k.range / d; vy *= k.range / d; }
      return { x: k.sx + vx, y: k.sy + vy };
    }
    kickRelease() {
      const a = this.kaim, k = this.kick;
      if (!a || hyp(a.cx - a.sx, a.cy - a.sy) < 14 || k.stage !== 'aim') { this.kaim = null; return; }
      k.target = this.kickAimTarget(); this.kaim = null;          // read the aim before clearing it
      k.stage = 'meter'; k.pos = 0; k.dir = 1;
    }
    doKick() {
      const k = this.kick; if (!k || k.stage !== 'meter') return;
      // Green: exactly where you aimed. Yellow: a chance (75% at the green's edge down to 25% at its outer
      // edge) of the same; otherwise, and outside the yellow, the kick is pushed wide.
      const off = k.pos - 0.5, a = Math.abs(off);
      let clean = a <= k.tol;
      if (!clean && a <= k.yel) clean = Math.random() < 0.75 - 0.5 * ((a - k.tol) / (k.yel - k.tol));
      k.zone = a <= k.tol ? 'green' : a <= k.yel ? 'yellow' : 'red';
      if (k.type === 'punt') return this.puntResult(clean, Math.sign(off) || 1);
      const dev = clean ? 0 : Math.sign(off) * (3.5 + Math.max(0, a - k.tol) * k.dist * 0.9);
      const t = k.target, dx = t.x - k.sx, reach = hyp(dx, t.y - k.sy), toPosts = 120 - k.sx;
      let res;
      if (dx <= 0.5) res = { good: false, why: 'short', ex: t.x, ey: t.y + dev };
      else {
        const yAt = k.sy + (t.y - k.sy) * (toPosts / dx) + dev, need = hyp(toPosts, yAt - k.sy);
        if (reach < need) res = { good: false, why: 'short', ex: k.sx + dx, ey: t.y + dev * (dx / toPosts) };
        else res = { good: Math.abs(yAt - MID) <= 3.1, why: yAt < MID ? 'wide left' : 'wide right', ex: 121.5, ey: yAt + (yAt - k.sy) * (1.5 / toPosts) };
      }
      k.res = res; k.stage = 'approach'; k.ap = 0.3;               // the kicker's steps to the ball
    }
    // the moment of contact: a rusher close to the ball may get a hand on it
    kickContact() {
      const k = this.kick, res = k.res;
      if (k.started && k.nearest < 2 && Math.random() < ((2 - k.nearest) / 2) * 0.85) return this.kickBlocked();
      k.stage = 'flight'; this.kicker.pose = 'kick'; this.kicker.poseT = 0.5;
      const d = hyp(res.ex - k.sx, res.ey - k.sy);
      this.ball = { state: 'air', sx: k.sx, sy: k.sy, tx: res.ex, ty: res.ey, u: 0, dur: res.punt ? 3 : 0.7 + d / 45, t0: 0, dist: d * (res.punt ? 1.7 : 1.3) };
      if (res.punt) {
        this.puntSetup();
        // hang time: long enough that the fastest gunner gets within 2-14 yards of the catch (a good punt
        // hangs; a line drive outkicks the coverage), held to 2.2-5 seconds
        const run = Math.max(0, res.ex - this.los - rnd(2, 14)), g = Math.max(...this.kick.cover.map((c) => c.spd));
        this.ball.dur = clamp(run / g + 0.45, 2.2, 5);
      }
    }
    // A clean punt lands where you aimed; a shank falls short (45-70% of the way) and veers sideways.
    puntResult(clean, side) {
      const k = this.kick, t = k.target;
      let ex = t.x, ey = t.y;
      if (!clean) { const f = rnd(0.45, 0.7); ex = k.sx + (t.x - k.sx) * f; ey = k.sy + (t.y - k.sy) * f + side * rnd(2, 7); }
      k.res = { punt: true, clean, ex, ey }; k.stage = 'approach'; k.ap = 0.2;
    }
    // ---------- the punt after the kick: coverage, the catch, bounces and the return ----------
    // At the kick the punting team releases downfield (gunners fastest), the return team peels back to
    // block, and the returner drifts under the ball. Where it lands decides what happens next.
    puntSetup() {
      const k = this.kick, r = k.res, d = this.cfg.oppDef;
      const rets = this.def.filter((p) => p.idle);
      rets.sort((a, b) => hyp(a.x - r.ex, a.y - r.ey) - hyp(b.x - r.ex, b.y - r.ey));
      k.ret = rets[0]; k.lead = rets[1];
      k.ret.spd = 6.7 + (d - 70) * 0.03; k.lead.spd = 6.4;
      k.cover = this.off.filter((p) => p !== this.kicker);
      // jammers hold the gunners up at the line for a moment; the interior men release sooner
      for (const c of k.cover) { c.spd = c.role === 'WR' ? 8 : c.role === 'RB' ? 7.2 : 6.5; c.lane = c.y - MID; c.stun = 0; c.hold = c.role === 'WR' ? rnd(0, 1.1) : rnd(0, 0.5); }
      k.fairAt = rnd(7, 14);                                    // how close the coverage gets before he calls for a fair catch
      this.kicker.spd = 6.2; this.kicker.lane = 0; this.kicker.hold = 0;
      for (const p of this.def) if (!p.idle) p.spd = 6;
      k.retX = r.ex >= 100 ? Math.min(r.ex, 100) - 3 : r.ex;    // deep in his own end he backs off and lets it go
    }
    // every frame of the flight: coverage runs its lanes, the return team turns to block, the returner sets up
    puntRun(dt) {
      const k = this.kick, r = k.res, R = k.ret;
      for (const c of k.cover) {
        if (c.hold > 0) { c.hold -= dt; go(c, c.x, c.y, 0, dt, 8); continue; }
        if (c.stun > 0) { c.stun -= dt; continue; }
        go(c, r.ex, clamp(r.ey + c.lane * 1.6, 1, FW - 1), c.spd, dt, 8);
      }
      go(this.kicker, Math.max(this.los + 2, r.ex - 18), MID + (r.ey - MID) * 0.5, this.kicker.spd, dt, 8);   // the punter: last line
      this.returnBlocks(dt);
      const catchable = r.ex < 100 && r.ey > 0 && r.ey < FW;
      go(R, catchable ? r.ex : k.retX, catchable ? r.ey : clamp(r.ey, 3, FW - 3), R.spd, dt, 9);
      go(k.lead, R.x - 5, R.y + (R.y < MID ? 3 : -3), k.lead.spd, dt, 9);
    }
    // the return team's blockers each take a coverage man coming downfield and hold him a moment
    returnBlocks(dt) {
      const k = this.kick, R = this.carrier || k.ret;
      for (const b of this.def) {
        if (b === k.ret || b.stun > 0) continue;
        let t = b.btarget;
        if (!t || t.hold > 0.05 || t.stun > 0) {
          t = null; let bd = 1e9;
          for (const c of k.cover) { if (c.hold > 0 || c.stun > 0 || c.x < R.x - 2) continue; const x = hyp(c.x - b.x, c.y - b.y); if (x < bd) { bd = x; t = c; } }
          b.btarget = t;
        }
        // during the flight, blockers drop back into a wall about 9 yards in front of the returner and only
        // take on a cover man who gets close; once he has the ball they take on whoever's coming
        if (k.stage === 'flight' && (!t || hyp(t.x - b.x, t.y - b.y) > 3)) {
          if (b.wall == null) b.wall = clamp(MID + (b.y - MID) * 1.8 + rnd(-1.5, 1.5), 2, FW - 2);
          go(b, k.retX - 9, b.wall, b.spd, dt, 8); continue;
        }
        if (!t) { go(b, R.x + 4, b.y, b.spd * 0.6, dt, 8); continue; }
        go(b, t.x - 0.9, t.y + (R.y - t.y) * 0.1, b.spd, dt, 9);
        if (hyp(t.x - b.x, t.y - b.y) < 1.2 && !(t.hold > 0)) { t.hold = rnd(0.3, 0.85); b.btarget = null; }
      }
    }
    // the ball comes down: out of bounds, into the end zone, into the returner's hands, or onto the turf
    puntLand() {
      const k = this.kick, r = k.res, R = k.ret;
      this.ball = { state: 'held' };
      if (r.ey < 0 || r.ey > FW) return this.puntOver(clamp(r.ex, 11, 109), `Punt out of bounds at ${this.spot(clamp(r.ex, 11, 109))}`);
      if (r.ex >= 110) return this.puntOver(100, 'Punt into the end zone — touchback');
      if (hyp(R.x - r.ex, R.y - r.ey) < 1.8 && r.ex < 100) {
        const near = Math.min(...k.cover.map((c) => hyp(c.x - R.x, c.y - R.y)));
        if (near < k.fairAt) { R.pose = null; return this.puntOver(r.ex, `Punt — fair catch at ${this.spot(r.ex)}`); }
        this.carrier = R; R.x = r.ex; R.y = r.ey; k.stage = 'return'; k.rt0 = 0;
        // he picks a lane: toward the side of the field with fewer cover men, a few yards over
        const side = k.cover.reduce((a, c) => a + Math.sign(c.y - R.y), 0) > 0 ? -1 : 1;
        k.laneY = clamp(R.y + side * rnd(3, 9), 3, FW - 3);
        this.pop('Returned!'); return;
      }
      // nobody under it: it hits the turf and bounces, carrying on the way it was going
      const dx = r.ex - k.sx, dy = r.ey - k.sy, len = hyp(dx, dy) || 1;
      const sp = rnd(2.5, 6.5) * (r.clean ? 1 : 0.7);
      this.ball = { state: 'bounce', x: r.ex, y: r.ey, z: 0, vx: (dx / len) * sp, vy: (dy / len) * sp + rnd(-1.2, 1.2), vz: rnd(2.6, 4.2), spin: 0, t: 0 };
      k.stage = 'bounce';
    }
    // Hops and a roll, with the odd bad hop that kicks it sideways or back; the coverage downs it,
    // or it dies, rolls into the end zone (touchback) or out of bounds.
    puntBounce(dt) {
      const k = this.kick, b = this.ball;
      b.t += dt; b.spin += dt * (6 + hyp(b.vx, b.vy) * 2);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.vz || b.z > 0) {
        b.vz -= 14 * dt; b.z += b.vz * dt;
        if (b.z <= 0) {
          b.z = 0;
          if (Math.abs(b.vz) < 1) b.vz = 0;                       // done hopping: it rolls
          else {
            b.vz = Math.abs(b.vz) * 0.5; b.vx *= rnd(0.55, 0.9); b.vy += rnd(-1.8, 1.8);
            if (Math.random() < 0.18) { b.vx *= -rnd(0.2, 0.6); b.vy += rnd(-1.5, 1.5); }   // bad hop
          }
        }
      } else { const f = Math.exp(-2.4 * dt); b.vx *= f; b.vy *= f; }
      for (const c of [...k.cover, this.kicker]) {
        if (c.hold > 0) { c.hold -= dt; continue; }
        go(c, b.x, b.y, c.spd, dt, 8);
      }
      this.returnBlocks(dt);
      go(k.ret, Math.min(b.x + 6, 108), k.ret.y, k.ret.spd * 0.6, dt, 8);   // the returner stays away from it
      if (b.x >= 110) return this.puntOver(100, 'Punt bounces into the end zone — touchback');
      if (b.y < 0 || b.y > FW) { const x = clamp(b.x, 11, 109); return this.puntOver(x, `Punt rolls out of bounds at ${this.spot(x)}`); }
      const x = clamp(b.x, 11, 109);
      if (b.z < 0.5 && b.t > 0.3 && [...k.cover, this.kicker].some((c) => hyp(c.x - b.x, c.y - b.y) < 0.9)) return this.puntOver(x, `Punt downed at ${this.spot(x)}`);
      if (b.z === 0 && hyp(b.vx, b.vy) < 0.25) return this.puntOver(x, `Punt rolls dead at ${this.spot(x)}`);
    }
    // The return: the returner heads upfield (toward your end zone) and slides away from the nearest
    // cover man, his blockers take on the coverage, and the coverage tries to bring him down.
    puntReturn(dt) {
      const k = this.kick, R = this.carrier;
      let push = 0;
      for (const c of k.cover) {
        if (c.hold > 0 || c.stun > 0) continue;
        const ax = R.x - c.x, ay = R.y - c.y, d = hyp(ax, ay);
        if (d < 7 && c.x < R.x + 1) push += (Math.sign(ay) || 1) / Math.max(d, 1);
      }
      const ty = clamp(R.y + (k.laneY - R.y) * 0.5 + clamp(push * 6, -5, 5) + (R.y < 4 ? 2 : R.y > FW - 4 ? -2 : 0), 1.5, FW - 1.5);
      go(R, R.x - 5, ty, R.spd, dt, 9);
      for (const c of [...k.cover, this.kicker]) {
        if (c.hold > 0) { c.hold -= dt; go(c, c.x, c.y, 0, dt, 8); continue; }
        if (c.stun > 0) { c.stun -= dt; continue; }
        // a pursuit angle: aim for where he'll be, further ahead the further away he is, and cut him off
        // rather than chase him (cover men behind him have to run him down)
        const lead = Math.min(1.4, hyp(R.x - c.x, R.y - c.y) / c.spd * 0.9);
        go(c, Math.max(R.x + R.vx * lead, 0), R.y + R.vy * lead, c.spd, dt, 9);
      }
      this.returnBlocks(dt);
      if (R.x <= 10) {
        this.score.opp += 7; this.carrier = null;
        return this.puntOver(null, `Punt returned for a TOUCHDOWN by ${this.cfg.opp.name}`);
      }
      if (R.y <= 0.4 || R.y >= FW - 0.4) return this.puntOver(R.x, `Punt — returned ${Math.round(k.res.ex - R.x)} out of bounds at ${this.spot(R.x)}`);
      for (const c of [...k.cover, this.kicker]) {
        if (c.hold > 0 || c.stun > 0 || hyp(c.x - R.x, c.y - R.y) > 1.15) continue;
        if (Math.random() < (c === this.kicker ? 0.5 : 0.76)) {
          this.downed = R;
          return this.puntOver(R.x, `Punt — returned ${Math.max(0, Math.round(k.res.ex - R.x))} to ${this.spot(R.x)}`);
        }
        c.stun = 0.6; this.pop('Missed tackle!');
      }
    }
    // a spot named the way a broadcast would: "their 12", "midfield", "your 47"
    spot(x) { const yd = Math.round(x - 10); return yd === 50 ? 'midfield' : yd > 50 ? `their ${100 - yd}` : `your ${yd}`; }
    // the punt is over: they take over at startX (our 0-120 scale), or after a return touchdown they kick off
    puntOver(startX, msg) {
      const k = this.kick, r = k.res;
      if (!r.clean) msg = 'Shanked! ' + msg;
      this.kick = null; this.carrier = null; this.ball = { state: 'held' };
      if (startX == null) return this.endPlay(msg, () => this.checkClock(() => this.startDrive(35)), 2.4);
      const net = Math.round(Math.min(startX, 110) - this.los), dist = Math.round(startX - 10);
      this.endPlay(msg, () => this.checkClock(() => this.oppDrive(dist, `Your punt netted ${net} yards.`)), 2);
    }
    kickResult() {
      const k = this.kick, r = k.res; this.ball = { state: 'held' };
      const after = () => this.checkClock(() => this.oppDrive(75, 'You kick off.'));
      if (r.punt && !r.blocked) return this.puntLand();
      if (r.blocked) {
        this.kick = null;
        if (k.type === 'pat') return this.endPlay('Extra point BLOCKED', after);
        if (k.type === 'punt') return this.endPlay('Punt BLOCKED', () => this.checkClock(() => this.oppDrive(clamp(k.sx - 10, 5, 95), 'They recovered the blocked punt.')));
        const dist = clamp(k.sx - 10, 5, 95);                     // they take over at the spot
        return this.endPlay('Field goal BLOCKED', () => this.checkClock(() => this.oppDrive(dist, 'They recovered the blocked kick.')));
      }
      if (k.type === 'pat') {
        if (r.good) this.score.me += 1;
        this.endPlay(r.good ? 'Extra point is GOOD' : `Extra point NO GOOD (${r.why})`, after);
      } else if (r.good) {
        this.score.me += 3;
        this.endPlay(`${k.dist}-yard field goal is GOOD`, after);
      } else {
        const dist = Math.max(this.los - 10, 20);
        this.endPlay(`Field goal NO GOOD (${r.why})`, () => this.checkClock(() => this.oppDrive(dist, 'They take over after the miss.')));
      }
      this.kick = null;
    }
    punt() { this.startKick('punt'); }

    // ---------- opponent possession (simulated) ----------
    oppDrive(dist, lead) {
      this.phase = 'opp'; this.kick = null;
      // the defense: its unit rating plus the defensive coordinator's stars and skills
      const st = this.cfg.staff, dc = (s) => GP.hasSkill(st, 'DC', s);
      const o = this.cfg.opp, myDef = this.cfg.roster.DEF.ovr + (st ? st.DC.stars * 1.5 : 0);
      let pTD = clamp(0.24 + (this.cfg.oppOff - myDef) * 0.008 + (75 - dist) * 0.004, 0.08, 0.75);
      let pFG = dist < 45 ? 0.25 : 0.14;
      if (dc('bend')) { pTD *= 0.75; pFG += 0.12; }
      const pTO = dc('ballhawk') ? 0.2 : 0.13;
      let need = (25 + rnd(0, 30)) * clamp(dist / 75, 0.35, 1.1);
      let text, nextX;
      const r = Math.random();
      if (this.q <= 4 && this.clock < 12) { text = 'The clock runs out on their drive.'; need = this.clock; nextX = 35; }
      else if (r < pTD) { this.score.opp += 7; text = `TOUCHDOWN ${o.name}. They march ${Math.round(dist)} yards and kick the extra point.`; nextX = 35; }
      else if (r < pTD + pFG) { this.score.opp += 3; text = `${o.name} settle for a field goal.`; nextX = 35; }
      else if (r < pTD + pFG + pTO) { text = Math.random() < 0.5 ? 'Your defense forces a fumble!' : 'Your defense picks it off!'; nextX = rnd(45, 65); }
      else { text = 'Your defense holds. They punt it away.'; nextX = rnd(28, 40) + (dc('flip') ? 8 : 0); }
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

    tacklers() {
      const top = Object.values(this.dRoster).filter((r) => r.tk > 0).sort((a, b) => b.tk - a.tk).slice(0, 3);
      return top.length ? top.map((r) => `#${r.num} ${r.pos} (TKL ${r.tkl}) ${r.tk}`).join(' · ') : 'none';
    }
    final() {
      this.phase = 'final'; this.kick = null; if (this.pz) this.pz.btn.hidden = true;
      const s = this.score, st = this.stats, won = s.me > s.opp;
      this.showPanel(won ? 'VICTORY' : 'DEFEAT',
        `${this.cfg.me.abbr} ${s.me} — ${s.opp} ${this.cfg.opp.abbr}\n\nPassing ${st.comp}/${st.att}, ${st.pyd} yds, ${st.ptd} TD, ${st.int} INT\nRushing ${st.ryd} yds, ${st.rtd} TD · Sacked ${st.sack}x\nBroken tackles ${st.broken} (${st.jbroken} on jukes) · Yards after contact ${st.yac} · Fumbles lost ${st.fum}\n\n${this.cfg.opp.abbr} tacklers: ${this.tacklers()}`,
        [{ label: 'Continue', fn: () => { this.destroy(); this.cfg.onEnd(s.me, s.opp, st); } }], true);
    }

    // ---------- frame update ----------
    update(dt) {
      if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
      if (this.popup && (this.popup.t -= dt) <= 0) this.popup = null;
      this.animT = (this.animT || 0) + dt;
      if (this.phase === 'live') this.updateLive(dt);
      else if (this.phase === 'tackling') { this.tick(dt); this.updateTackle(dt); }
      else if (this.phase === 'dead') {
        if ((this.deadT -= dt) <= 0) { const f = this.after; this.after = null; f(); }
      } else if (this.phase === 'kick') {
        const k = this.kick;
        if (k.started && (k.stage === 'aim' || k.stage === 'meter' || k.stage === 'approach')) this.kickRush(dt);
        if (this.kicker.poseT > 0 && (this.kicker.poseT -= dt) <= 0) this.kicker.pose = null;
        if (k.stage === 'meter') {
          k.pos += k.dir * dt * k.speed;
          if (k.pos > 1) { k.pos = 1; k.dir = -1; } else if (k.pos < 0) { k.pos = 0; k.dir = 1; }
        } else if (k.stage === 'approach') {
          if (k.type !== 'punt') go(this.kicker, k.sx - 0.4, k.sy + 0.3, 7, dt, 30);
          else go(this.kicker, k.sx, k.sy, 3, dt, 30);                 // a punter's two steps forward
          if ((k.ap -= dt) <= 0) this.kickContact();
        } else if (k.stage === 'flight' || k.stage === 'blocked') {
          if (k.type === 'punt' && k.stage === 'flight') this.puntRun(dt);
          this.ball.u += dt / this.ball.dur;
          if (this.ball.u >= 1) this.kickResult();
        } else if (k.stage === 'bounce') this.puntBounce(dt);
        else if (k.stage === 'return') this.puntReturn(dt);
      }
      // camera
      let fx = this.los;
      if (this.phase === 'live' || this.phase === 'dead' || this.phase === 'tackling') {
        const b = this.ball;
        if (b.state === 'air' || b.state === 'dead') fx = b.sx + (b.tx - b.sx) * Math.min(1, b.u);
        else if (this.carrier) fx = this.carrier.x;
      }
      let target = clamp(fx - VIEW * 0.36, -3, 123 - VIEW);
      if (this.phase === 'kick' && this.kick) {
        const k = this.kick;
        if (k.type !== 'punt') target = 123 - VIEW;                 // keep the uprights in view for a kick
        else if (k.stage === 'bounce') target = clamp(this.ball.x - VIEW * 0.5, -3, 123 - VIEW);
        else if (k.stage === 'return' && this.carrier) target = clamp(this.carrier.x - VIEW * 0.55, -3, 123 - VIEW);
        else if (k.stage === 'flight' || k.stage === 'blocked') target = clamp(this.ball.sx + (this.ball.tx - this.ball.sx) * Math.min(1, this.ball.u) - VIEW * 0.5, -3, 123 - VIEW);
        else target = clamp(k.sx - 8, -3, 123 - VIEW);
      }
      this.camX += (target - this.camX) * Math.min(1, dt * 5);
      this.hud(); this.chip(); this.placePause();
    }
    // keep the (invisible) pause button over the icon drawn in the scoreboard strip
    placePause() {
      if (!this.pz || this.pauseX == null) return;
      const b = this.pz.btn, k = this.cv.getBoundingClientRect().width / AW;
      const left = Math.round((this.pauseX - 4) * k) + 'px';
      if (b.style.left !== left) { b.style.left = left; b.style.width = Math.round(20 * k) + 'px'; }
    }
    hud() {
      const c = this.clock, set = (id, v) => { if (this.hudCache[id] !== v) { this.hudCache[id] = v; this.el[id].textContent = v; } };
      set('hud-me', this.score.me); set('hud-opp', this.score.opp);
      set('hud-q', this.q === 5 ? 'OT' : 'Q' + this.q);
      set('hud-clock', c === Infinity ? '–:––' : Math.floor(Math.ceil(c) / 60) + ':' + String(Math.ceil(c) % 60).padStart(2, '0'));
      set('hud-down', this.phase === 'opp' || this.phase === 'final' ? '' : this.downText());
    }

    // ---------- rendering (pixel art) ----------
    // Everything is drawn in whole "art pixels" on a 480x270 canvas, then scaled up without smoothing.
    ax(x) { return Math.round(x * YA) - this.camPx; }
    ay(y) { return TOPA + Math.round(y * YA); }
    initArt() {
      const me = this.cfg.me, opp = this.cfg.opp;
      this.art = this.art || document.createElement('canvas'); this.art.width = AW; this.art.height = AH;
      this.ag = this.art.getContext('2d');
      this.fieldImg = GP.Pixel.field(me, opp, YA, TOPA, FW, PAD);
      // home kit: team-colour helmet and jersey, pants in the second colour. Away kit: white jersey, coloured pants.
      this.kits = {
        O: GP.Pixel.sprites({ helmet: me.c1, decal: me.c2, jersey: me.c1, number: me.c2, pants: me.c2, sock: me.c1 }),
        D: GP.Pixel.sprites({ helmet: opp.c1, decal: opp.c2, jersey: '#f4f6f8', number: opp.c1, pants: opp.c1, sock: '#f4f6f8' }),
      };
    }

    // Fit the board (canvas + play strip) to the screen: as wide a view as the screen's shape allows.
    resize() {
      const st = document.getElementById('stage'), board = document.getElementById('board');
      const r = st && st.getBoundingClientRect();
      if (!r || !r.width || !r.height) return;
      const aspect = clamp(r.width / r.height, 1.5, 2.3);
      let w = r.width, h = w / aspect;
      if (h > r.height) { h = r.height; w = h * aspect; }
      board.style.width = Math.floor(w) + 'px'; board.style.height = Math.floor(h) + 'px';
      const aw = Math.round(AH * aspect);
      if (aw !== AW || this.cv.width !== aw * 4) {
        setArtWidth(aw); this.cv.width = AW * 4; this.cv.height = AH * 4;
        if (this.art) this.art.width = AW;
      }
    }
    // Score, quarter, clock and down & distance, drawn across the top stands.
    drawScoreboard(g) {
      const Px = GP.Pixel, me = this.cfg.me, opp = this.cfg.opp, c = this.clock;
      g.fillStyle = 'rgba(10,14,24,.92)'; g.fillRect(0, 0, AW, 13);
      g.fillStyle = '#ffb43a'; g.fillRect(0, 13, AW, 1);
      const side = (t, pts, x, right) => {
        const label = `${t.abbr} ${pts}`, w = Px.width(label) + 8, x0 = right ? x - w : x;
        g.fillStyle = t.c1; g.fillRect(x0, 2, w, 10); g.fillStyle = t.c2; g.fillRect(x0, 11, w, 1);
        Px.text(g, label, x0 + 4, 3, '#ffffff', 1, { shadow: '#10182a' });
      };
      side(me, this.score.me, 4, false); side(opp, this.score.opp, AW - 4, true);
      // pause icon, just left of the opponent's score
      const oppW = Px.width(`${opp.abbr} ${this.score.opp}`) + 8, px = AW - 4 - oppW - 16;
      if (this.pz && !this.pz.btn.hidden) {
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(px, 2, 12, 10);
        g.fillStyle = '#ffffff'; g.fillRect(px + 3, 4, 2, 6); g.fillRect(px + 7, 4, 2, 6);
      }
      this.pauseX = px;
      const clock = c === Infinity ? '-:--' : Math.floor(Math.ceil(c) / 60) + ':' + String(Math.ceil(c) % 60).padStart(2, '0');
      const q = this.q === 5 ? 'OT' : 'Q' + this.q;
      const down = this.phase === 'opp' || this.phase === 'final' ? '' : '   ' + this.downText().replace(' · ', '  ');
      const mid = `${q} ${clock}${down}`;
      Px.text(g, `${q} ${clock}`, AW / 2 - Px.width(mid) / 2, 3, '#ffffff', 1);
      if (down) Px.text(g, down, AW / 2 - Px.width(mid) / 2 + Px.width(`${q} ${clock}`) + 1, 3, '#ffd84a', 1);
    }

    draw() {
      if (!this.art) this.initArt();
      const g = this.ag, Px = GP.Pixel, FH = Math.round(FW * YA);
      this.camPx = Math.round(this.camX * YA);
      g.drawImage(this.fieldImg, -(this.camPx + Math.round(PAD * YA)), 0);

      const show = this.phase !== 'opp' && this.phase !== 'final';
      if (show) {
        g.fillStyle = '#58b0ff'; g.fillRect(this.ax(this.los), TOPA, 2, FH);
        if (this.fdx < 110) { g.fillStyle = '#ffd84a'; g.fillRect(this.ax(this.fdx), TOPA, 2, FH); }
      }

      // route preview
      if (this.phase === 'presnap' && this.play.type === 'pass') {
        for (const p of this.off) {
          if (!p.route) continue;
          let lx = this.ax(p.x), ly = this.ay(p.y) - 3;
          for (const [x, y] of p.route.pts) {
            const nx = this.ax(x), ny = this.ay(y) - 3;
            Px.dots(g, lx, ly, nx, ny, '#ffffff', 3); lx = nx; ly = ny;
          }
          g.fillStyle = '#ffffff';
          if (p.route.stop) g.fillRect(lx - 1, ly - 1, 3, 3);
          else { g.fillRect(lx - 2, ly, 5, 1); g.fillRect(lx, ly - 2, 1, 5); }
        }
      }

      // a thrown ball: a small marker on the turf where it will come down (drawn under the players)
      if (show && this.phase === 'live' && this.ball.state === 'air') {
        const b = this.ball, X = this.ax(b.tx), Y = this.ay(b.ty), r = 6 + (Math.floor(this.animT * 8) % 2);
        Px.ring(g, X, Y + 1, r, r - 3, '#10182a'); Px.ring(g, X, Y, r, r - 3, '#ffd84a');
        g.fillStyle = '#ffd84a'; g.fillRect(X - 2, Y, 5, 1); g.fillRect(X, Y - 2, 1, 5);
      }
      if (show) {
        const all = [...this.def, ...this.off].sort((a, b) => a.y - b.y);
        for (const p of all) this.drawPlayer(p);
        this.drawBall();
      }
      if (this.aim && this.passing()) this.drawAim();
      if (this.kick) this.drawKick();

      if (this.phase === 'presnap') this.hint('TAP THE FIELD TO SNAP');
      else if (this.phase === 'live' && this.passing() && !this.aim) this.hint('DRAG BACK TO THROW · SWIPE TOWARD THE END ZONE TO RUN');
      else if (this.phase === 'kick' && this.kick) this.hint({ set: 'TAP THE FIELD TO START THE KICK', aim: 'DRAG BACK TO AIM · RELEASE TO KICK',
        meter: 'TAP WHEN THE MARKER IS IN THE GREEN', flight: '' }[this.kick.stage] || '');
      else if (this.phase === 'live' && this.running(this.carrier)) this.hint(`UP/DOWN: CUT · TAP+SWIPE: JUKE · FORWARD: ${this.carrier === this.qb ? 'SLIDE' : 'LUNGE'} · BACK: STOP`);
      if (this.popup && this.carrier) {
        const c = this.carrier, w = Px.width(this.popup.text);
        const x = clamp(this.ax(c.x), Math.ceil(w / 2) + 2, AW - Math.ceil(w / 2) - 2);
        g.globalAlpha = Math.min(1, this.popup.t * 2.5);
        Px.text(g, this.popup.text, x, this.ay(c.y) - 33, this.popup.color, 1, { center: true, shadow: '#10182a' });
        g.globalAlpha = 1;
      }
      if (this.banner) {
        const t = this.banner.text, sc = Px.width(t, 2) > AW - 24 ? 1 : 2, w = Px.width(t, sc) + 14, h = 7 * sc + 10;
        Px.box(g, Math.round(AW / 2 - w / 2), 30, w, h, '#10182a', '#ffb43a');
        Px.text(g, t, AW / 2, 35, '#ffb43a', sc, { center: true });
        if (this.defNote) {
          const w2 = Px.width(this.defNote) + 10;
          Px.box(g, Math.round(AW / 2 - w2 / 2), 30 + h + 2, w2, 12, 'rgba(16,24,42,.85)');
          Px.text(g, this.defNote, AW / 2, 30 + h + 5, '#9fd3ff', 1, { center: true });
        }
      }

      this.drawScoreboard(g);
      const m = this.g;
      m.setTransform(1, 0, 0, 1, 0, 0); m.imageSmoothingEnabled = false;
      m.drawImage(this.art, 0, 0, this.cv.width, this.cv.height);
    }
    hint(t) {
      const g = this.ag, Px = GP.Pixel, w = Px.width(t) + 10;
      // centred, or in the space right of the play button when it's showing
      const cx = this.chipEnd ? Math.max(AW / 2, this.chipEnd + w / 2) : AW / 2;
      Px.box(g, Math.round(cx - w / 2), AH - 15, w, 13, 'rgba(16,24,42,.85)');
      Px.text(g, t, Math.round(cx), AH - 12, '#ffffff', 1, { center: true });
    }
    drawPlayer(p) {
      const g = this.ag, Px = GP.Pixel, X = this.ax(p.x), Y = this.ay(p.y);
      if (X < -12 || X > AW + 12) return;
      if (Math.abs(p.vx) > 0.6) p.face = p.vx > 0 ? 0 : 1; else if (p.face == null) p.face = p.team === 'O' ? 0 : 1;
      const down = p.stun > 0 || p === this.downed || !!p.lunge;
      const moving = (this.phase === 'live' || this.phase === 'tackling' || this.phase === 'kick') && hyp(p.vx, p.vy) > 0.8;
      const sliding = p.lunge && p.lunge.slide || (p === this.downed && p.slid);
      const pose = p.pose || (sliding ? 'slide' : down ? 'down' : moving ? (Math.floor(this.animT * 9 + (p.skin || 0)) % 2 ? 'run1' : 'run2') : 'stand');
      const img = this.kits[p.team][p.skin || 0][pose][p.face];
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(X - 4, Y + 1, 9, 2); g.fillRect(X - 3, Y + 3, 7, 1);
      if (p === this.carrier && !down) {
        // ring at the ball carrier's feet; yellow and doubled while a juke is live
        // solid white with a dark edge so it reads on any grass; yellow and doubled while a juke is live
        const live = p.juke && p.juke.t > 0, col = live ? '#ffd84a' : '#ffffff';
        Px.ring(g, X, Y + 2, 9, 4, 'rgba(16,24,42,.55)'); Px.ring(g, X, Y + 1, 9, 4, col); Px.ring(g, X, Y + 1, 8, 3, col);
        if (live) Px.ring(g, X, Y + 1, 11, 5, '#ffd84a');
      }
      if (p.pose) g.drawImage(img, X - Math.floor(img.width / 2), Y - img.height + 3);
      else if (sliding) g.drawImage(img, X - 8, Y - 9); else if (down) g.drawImage(img, X - 8, Y - 8); else g.drawImage(img, X - 6, Y - 13);
      if (p === this.carrier && !down && this.ball.state === 'held') {
        const bx = X + (p.face ? -6 : 3);
        g.fillStyle = '#10182a'; g.fillRect(bx - 1, Y - 7, 5, 4);
        g.fillStyle = '#8a4b22'; g.fillRect(bx, Y - 6, 3, 2); g.fillStyle = '#ffffff'; g.fillRect(bx + 1, Y - 6, 1, 1);
      }
      if (p === this.qb && (this.phase === 'presnap' || this.phase === 'live' || this.phase === 'choose')) {
        // stamina bar above the QB's head
        const e = this.energy / 100;
        g.fillStyle = '#10182a'; g.fillRect(X - 8, Y - 19, 17, 4);
        g.fillStyle = e > 0.6 ? '#4fd18b' : e > 0.3 ? '#ffd84a' : '#ff6b6b'; g.fillRect(X - 7, Y - 18, Math.round(15 * e), 2);
      }
      if (p.team === 'O' && p.route && this.phase !== 'dead')
        Px.text(g, p.role.replace(/\d/, ''), X, Y - 23, '#ffffff', 1, { center: true, shadow: '#10182a' });
    }
    drawBall() {
      const g = this.ag, b = this.ball;
      if (this.phase === 'kick' && this.kick && b.state === 'held') {   // on the spot under the holder's hand
        const X = this.ax(this.kick.sx), Y = this.ay(this.kick.sy);
        g.fillStyle = '#10182a'; g.fillRect(X - 1, Y - 4, 3, 5); g.fillStyle = '#8a4b22'; g.fillRect(X, Y - 3, 1, 3);
        return;
      }
      if (b.state === 'bounce') {                                 // a punt hopping and rolling on the turf
        const X = this.ax(b.x), Y = this.ay(b.y), lift = Math.round(b.z * YA * 0.5), tumble = Math.floor(b.spin) % 2;
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X - 1, Y + 1, 3, 1);
        g.fillStyle = '#8a4b22';
        if (tumble) { g.fillRect(X - 1, Y - lift - 3, 2, 4); g.fillRect(X - 2, Y - lift - 2, 4, 2); }
        else { g.fillRect(X - 1, Y - lift - 2, 3, 2); g.fillRect(X - 2, Y - lift - 1, 5, 1); }
        g.fillStyle = '#ffffff'; g.fillRect(X, Y - lift - 2, 1, 1);
        return;
      }
      if (b.state !== 'air' && b.state !== 'dead') return;      // a held ball is drawn with its carrier
      const u = Math.min(1, b.u), x = b.sx + (b.tx - b.sx) * u, y = b.sy + (b.ty - b.sy) * u;
      const z = b.state === 'air' ? Math.sin(Math.PI * u) * b.dist * 0.22 : 0;
      const X = this.ax(x), Y = this.ay(y), lift = Math.round(z * YA * 0.5);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X - 1, Y + 1, 3, 1);
      g.fillStyle = '#8a4b22'; g.fillRect(X - 1, Y - lift - 2, 3, 2); g.fillRect(X - 2, Y - lift - 1, 5, 1);
      g.fillStyle = '#ffffff'; g.fillRect(X, Y - lift - 2, 1, 1);
    }
    drawAim() {
      const g = this.ag, Px = GP.Pixel, t = this.aimTarget(), qb = this.qb;
      const X0 = this.ax(qb.x), Y0 = this.ay(qb.y) - 8, X1 = this.ax(t.x), Y1 = this.ay(t.y);
      const peak = hyp(t.x - qb.x, t.y - qb.y) * YA * 0.11, n = Math.max(5, Math.floor(hyp(X1 - X0, Y1 - Y0) / 5));
      g.fillStyle = '#ffffff';
      for (let i = 1; i < n; i++) {
        const u = i / n;
        g.fillRect(Math.round(X0 + (X1 - X0) * u), Math.round(Y0 + (Y1 - Y0) * u - 4 * peak * u * (1 - u)), 2, 2);
      }
      Px.ring(g, X1, Y1, 7, 7, '#ffd84a'); Px.ring(g, X1, Y1, 6, 6, '#ffd84a');
      g.fillStyle = '#ffd84a'; g.fillRect(X1, Y1, 1, 1);
      // pull-back line
      const a = this.aim;
      Px.dots(g, a.sx / 2, a.sy / 2, a.cx / 2, a.cy / 2, 'rgba(255,255,255,.55)', 4);
    }
    drawKick() {
      const g = this.ag, Px = GP.Pixel, k = this.kick, X0 = this.ax(k.sx), Y0 = this.ay(k.sy);
      if (k.stage === 'flight' || k.stage === 'bounce' || k.stage === 'return') return;   // the ball's away: just watch
      const title = k.type === 'punt' ? `PUNT · RANGE ${k.range}` : `${k.type === 'pat' ? 'EXTRA POINT' : k.dist + '-YARD FIELD GOAL'} · RANGE ${this.kickRange}`;
      Px.box(g, Math.round(AW / 2 - Px.width(title) / 2) - 6, 18, Px.width(title) + 12, 12, 'rgba(16,24,42,.85)');
      Px.text(g, title, AW / 2, 21, k.type !== 'punt' && k.dist > this.kickRange ? '#ff8a5c' : '#ffffff', 1, { center: true });
      // the hold spot and the uprights
      g.fillStyle = '#ffd84a'; g.fillRect(X0 - 1, Y0 - 1, 3, 3);
      const aimLine = (t, col) => {
        const X1 = this.ax(t.x), Y1 = this.ay(t.y), n = Math.max(5, Math.floor(hyp(X1 - X0, Y1 - Y0) / 5)), peak = hyp(t.x - k.sx, t.y - k.sy) * YA * 0.14;
        g.fillStyle = col;
        for (let i = 1; i < n; i++) { const u = i / n; g.fillRect(Math.round(X0 + (X1 - X0) * u), Math.round(Y0 + (Y1 - Y0) * u - 4 * peak * u * (1 - u)), 2, 2); }
        Px.ring(g, X1, Y1, 6, 6, '#ffd84a'); Px.ring(g, X1, Y1, 5, 5, '#ffd84a');
      };
      if (k.stage === 'aim') {
        // the kicker's reach, drawn as an arc around the hold spot
        Px.ring(g, X0, Y0, Math.round(k.range * YA), Math.round(k.range * YA), 'rgba(255,255,255,.35)');
        if (this.kaim) { aimLine(this.kickAimTarget(), '#ffffff'); const a = this.kaim; Px.dots(g, a.sx / 2, a.sy / 2, a.cx / 2, a.cy / 2, 'rgba(255,255,255,.55)', 4); }
      }
      if (k.stage === 'meter') {
        aimLine(k.target, 'rgba(255,255,255,.6)');
        const bw = 210, bx = Math.round(AW / 2 - bw / 2), by = AH - 52;
        Px.box(g, bx - 10, by - 12, bw + 20, 34, '#10182a', '#3a455c');
        g.fillStyle = '#3a455c'; g.fillRect(bx, by, bw, 12);
        g.fillStyle = '#ffd84a'; g.fillRect(bx + Math.round((0.5 - k.yel) * bw), by, Math.round(k.yel * 2 * bw), 12);   // yellow: a chance
        g.fillStyle = '#4fd18b'; g.fillRect(bx + Math.round((0.5 - k.tol) * bw), by, Math.max(2, Math.round(k.tol * 2 * bw)), 12);
        g.fillStyle = '#ffffff'; g.fillRect(bx + Math.round(k.pos * bw) - 1, by - 3, 3, 18);
      }
    }
  }

  GP.Match = Match;
  GP.PLAYS = PLAYS;
  GP.PLAY_TYPES = PLAY_TYPES;
  GP.setOcFit = (f) => { OC_FIT = f; };
})();
