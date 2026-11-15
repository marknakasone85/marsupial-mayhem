// The practice corner (15 Nov 2026): on a new player's first map, a training dummy stands just past
// the TOURNAMENT sign and a coach board walks through the moves one by one: punch it, kick it, jump,
// block, then drop a grenade and punch or kick it. The pests wait until the practice is done, or until
// a player walks on past the dummy (that skips it). It shows only when a map is started from the world
// map (opts.practice), on this computer (not Wi-Fi), until the first map is cleared or the practice
// has been done or skipped once (saved as 'practiced').
(function () {
  const U = MG.U;
  const DUMMY_X = 430;   // between the TOURNAMENT sign (330) and the first mound (520)
  const SKIP_X = 570;    // walk past here and the practice is over (the first rabbits sit at 640)

  // Each step: what to do, which actions to show keys for, and how many times.
  const STEPS = [
    { id: 'punch', say: 'PUNCH the dummy', keys: ['attack'], need: 3 },
    { id: 'kick', say: 'KICK it', keys: ['big'], need: 1 },
    { id: 'jump', say: 'JUMP', keys: ['up'], need: 1 },
    { id: 'block', say: 'BLOCK (hold it)', keys: ['down'], need: 1 },
    { id: 'grenade', say: 'Drop a GRENADE, then PUNCH or KICK it', keys: ['grenade'], need: 1 },
  ];

  // A straw-stuffed sack on a post: it rocks and puffs straw when hit, and never breaks.
  MG.Dummy = class {
    constructor(x) {
      this.x = x; this.y = MG.GROUND_Y; this.alive = true; this.noScore = true; this.practiceDummy = true;
      this.r = 0; this.vr = 0; this.flash = 0; this.t = 0; this.hits = 0;
    }
    get box() { return { x: this.x - 20, y: this.y - 82, w: 40, h: 82 }; }
    // hit.from is the fighter (its move says punch or kick) or a grenade (blast)
    takeHit(hit, world) {
      const dir = hit.dir || (hit.kbx >= 0 ? 1 : -1) || 1;
      const kind = hit.blast ? 'blast' : hit.from && hit.from.move ? (hit.from.move.kind === 'kick' ? 'kick' : hit.from.move.kind === 'jab' ? 'punch' : 'other') : 'other';
      this.vr += dir * (kind === 'kick' || kind === 'blast' ? 5.5 : 2.6);
      this.flash = 0.08;
      this.hits++;
      if (world && world.fx) world.fx.burst(this.x, this.y - 52, '#e9c46a', kind === 'kick' || kind === 'blast' ? 9 : 5, 220);
      if (world && world.practice) world.practice.dummyHit(kind);
      return 'hit';
    }
    update(dt) {
      this.t += dt;
      this.flash -= dt;
      // a springy rock back and forth on its stand
      this.vr += (-this.r * 70 - this.vr * 5.5) * dt;
      this.r = U.clamp(this.r + this.vr * dt, -0.6, 0.6);
    }
    draw(ctx) { MG.Art.dummy(ctx, this.x, this.y, { tilt: this.r, flash: this.flash > 0, t: this.t }); }
  };

  MG.Practice = class {
    // Should this map start with the practice corner?
    static wanted(scene) {
      const first = MG.LEVELS[0];
      return scene.levelIndex === 0 && !scene.net && !MG.Progress.isCleared(first.id) && !MG.Save.get('practiced', false);
    }
    constructor(scene) {
      this.scene = scene;
      this.dummy = new MG.Dummy(DUMMY_X);
      this.step = 0; this.n = 0; this.blockT = 0;
      this.done = false; this.doneT = 0; this.skipped = false;
    }
    get steps() { return STEPS; }
    get current() { return STEPS[this.step] || null; }
    // the dummy is something to hit only while practising
    target() { return this.done ? null : this.dummy; }

    update(dt) {
      this.dummy.update(dt);
      if (this.done) { this.doneT += dt; return; }
      const sc = this.scene, fs = sc.aliveFighters();
      if (sc.state !== 'play') return;
      if (sc.leader().x > SKIP_X) { this.finish(true); return; }
      const st = this.current;
      if (st.id === 'jump' && fs.some((f) => !f.onGround && f.vy < -150 && f.state !== 'hurt' && !f.swimming)) this.progress();
      else if (st.id === 'block') {
        if (fs.some((f) => f.state === 'block')) this.blockT += dt;
        if (this.blockT > 0.4) this.progress();
      } else if (st.id === 'grenade') {
        if (sc.grenades.some((g) => g.kicked > 0)) this.progress();
        // a spare grenade from the coach, so nobody gets stuck
        else if (!sc.grenades.length) for (const f of fs) if (f.grenades <= 0) { f.grenades = 1; sc.fx.text(f.x, f.y - f.h - 30, '+1 GRENADE', '#9ef01a', 18); }
      }
    }

    dummyHit(kind) {
      const st = this.current;
      if (!this.done && st && st.id === kind) this.progress();
    }

    progress() {
      const sc = this.scene, lead = sc.leader();
      this.n++;
      if (this.n < this.current.need) { MG.Audio.tone(700 + this.n * 120, 0.06, 'triangle', 0.15); return; }
      this.n = 0; this.blockT = 0; this.step++;
      MG.Audio.pickup();
      if (this.step >= STEPS.length) { this.finish(false); return; }
      sc.fx.text(lead.x, lead.y - lead.h - 40, U.choice(['NICE!', 'GOOD ONE!', 'BEAUTY!', 'TOO EASY!']), '#9ef01a', 24);
    }

    finish(skipped) {
      this.done = true; this.doneT = 0; this.skipped = skipped;
      MG.Save.set('practiced', true);
      if (!skipped) {
        const lead = this.scene.leader();
        this.scene.fx.text(lead.x + 120, lead.y - lead.h - 60, 'READY! GO GET THEM!', '#ffd23f', 30);
        MG.Audio.powerUp();
      }
    }

    // pests wait while the players practise
    holds() { return !this.done; }

    // For the HUD: the coach board (keys: one list per player on this computer)
    view() {
      if (this.done && (this.skipped || this.doneT > 3)) return null;
      if (this.done) return { done: true, t: this.doneT };
      const st = this.current;
      return { step: this.step + 1, of: STEPS.length, say: st.say, keys: st.keys, n: this.n, need: st.need };
    }
  };
  MG.Practice.DUMMY_X = DUMMY_X;
  MG.Practice.SKIP_X = SKIP_X;
})();
