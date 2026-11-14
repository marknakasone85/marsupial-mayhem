// Animals in the maps that aren't pests (docs/VILLAINS.md, "Hazards and neutral animals"; the allies).
// None of them can be hit. Placed in a map's `npcs` list: { kind, x, ... }.
//  * emus:         an emu stampede runs across the screen when the players reach x (jump!)
//  * cassowary:    wanders near x and kicks anyone who comes too close
//  * croc:         lives in the water at x; its eyes watch you, and it snaps at swimmers
//                  (it never bothers the pests... a clue)
//  * quokka:       a Smile Squad helper: gives a heart, a supply drop or a tip, then hops off.
//                  late: 'boss' or a gate number: turns up only after that fight is over ("just too late")
//  * treeKangaroo: Matschie's tree-kangaroo on a branch (y): throws fruit at pests
//  * quoll:        a northern quoll that runs with the team and bites pests, but keeps away from cane toads
(function () {
  const U = MG.U;
  const W = MG.W;
  const CODE = { emu: 'e', emus: 'E', cassowary: 'c', croc: 'k', quokka: 'q', treeKangaroo: 't', quoll: 'o' };
  const KIND = { e: 'emu', E: 'emus', c: 'cassowary', k: 'croc', q: 'quokka', t: 'treeKangaroo', o: 'quoll' };
  const alive = (world) => (world.fighters || []).filter((f) => f.state !== 'ko');
  const near = (world, x, r) => alive(world).filter((f) => Math.abs(f.x - x) < r);
  const QUOKKA_LINES = [
    'G\'day, champs! The Smile Squad\'s got your back!',
    'Keep smiling! Here, take this!',
    'Those pests won\'t know what hit \'em! Smile!',
    'Compliments of Grin Isle Holidays!',
  ];

  MG.NPC = class {
    constructor(o) {
      this.o = o;
      this.kind = o.kind;
      this.x = o.x;
      this.y = o.y !== undefined ? o.y : MG.GROUND_Y;
      this.homeX = o.x;
      this.facing = -1;
      this.t = Math.random() * 5;
      this.state = 'idle';
      this.stateT = 0;
      this.a = 0;          // how far an action is (kick, lunge, throw, bite): 0..1, for drawing
      this.cool = U.rand(0.5, 1.5);
      this.gone = false;
      this.hitList = new Set();
      this.said = false;
      this.mode = 0;       // drawing hints (quokka: 1 waving, 2 hopping; quoll: 1 running, 2 scared)
      this.speech = '';    // a speech bubble, for speechT seconds
      this.speechT = 0;
    }
    say(text, secs = 3.5) { this.speech = text; this.speechT = secs; }

    update(dt, world) {
      this.t += dt;
      this.stateT += dt;
      this.cool -= dt;
      this.speechT -= dt;
      const fn = this[this.kind];
      if (fn) fn.call(this, dt, world);
    }

    // ---------------- emus ----------------
    emus(dt, world) {
      if (this.state === 'idle') {
        const lead = world.leader();
        if (lead.x > this.x - 260) {
          this.state = 'warn'; this.stateT = 0;
          world.fx.text(lead.x, 150, 'EMU STAMPEDE! JUMP!', '#ff4d6d', 32);
          world.fx.text(lead.x, 186, '(Emus "won" the Emu War of 1932. Don\'t mess with them.)', '#ffffff', 15);
          MG.Audio.gong();
        }
      } else if (this.state === 'warn' && this.stateT > 1.3) {
        // the herd comes in from the right edge of the screen
        const n = this.o.count || 5;
        for (let i = 0; i < n; i++) {
          const e = new MG.NPC({ kind: 'emu', x: world.camX + W + 80 + i * U.rand(70, 110) });
          e.speed = U.rand(560, 660);
          world.npcs.push(e);
        }
        this.state = 'done';
        this.gone = true;
      }
    }
    emu(dt, world) {
      this.mode = 1;
      this.x -= this.speed * dt;
      const box = { x: this.x - 26, y: this.y - 80, w: 52, h: 80 };
      for (const f of alive(world)) {
        if (this.hitList.has(f) || !U.overlap(box, f.box)) continue;
        this.hitList.add(f);
        f.takeHit({ dmg: 8, kbx: -560, kby: -420, stun: 0.5, big: true, from: this }, world);
        world.fx.text(f.x, f.y - f.h - 20, 'TRAMPLED!', '#ffd23f', 20);
      }
      for (const e of world.enemies || []) {
        if (!e.alive || this.hitList.has(e) || e.isBoss || !U.overlap(box, e.box)) continue;
        this.hitList.add(e);
        e.takeHit({ dmg: 12, kbx: -500, kby: -400, big: true, dir: -1, from: this }, world);
      }
      if (this.x < world.camX - 220) this.gone = true;
    }

    // ---------------- cassowary ----------------
    cassowary(dt, world) {
      const targets = near(world, this.x, 520);
      const t = targets.length ? targets.reduce((a, b) => (Math.abs(b.x - this.x) < Math.abs(a.x - this.x) ? b : a)) : null;
      if (t && !this.said && Math.abs(t.x - this.x) < 420) {
        this.said = true;
        this.say('HISSS! (A cassowary has a dagger-like claw on each foot. Keep your distance!)', 5);
      }
      if (this.state === 'idle') {
        this.a = Math.max(0, this.a - dt * 4);
        // wander up and down its patch of forest
        if (this.stateT > 1.6) { this.stateT = 0; this.wander = U.rand(-1, 1) * 120; }
        const tx = this.homeX + (this.wander || 0);
        this.x += U.clamp(tx - this.x, -60 * dt, 60 * dt);
        if (Math.abs(tx - this.x) > 2) this.facing = tx > this.x ? 1 : -1;
        if (t && Math.abs(t.x - this.x) < 125 && Math.abs(t.y - this.y) < 90 && this.cool <= 0) {
          this.facing = t.x > this.x ? 1 : -1;
          this.state = 'wind'; this.stateT = 0;
          world.fx.text(this.x, this.y - 140, 'HISSS!', '#4cc9f0', 22);
          MG.Audio.hiss();
        }
      } else if (this.state === 'wind') {
        this.a = 0.15;
        if (this.stateT > 0.4) { this.state = 'kick'; this.stateT = 0; this.hitList = new Set(); MG.Audio.whiff(); }
      } else if (this.state === 'kick') {
        this.a = Math.min(1, this.stateT / 0.12);
        const box = { x: this.facing > 0 ? this.x : this.x - 140, y: this.y - 90, w: 140, h: 90 };
        for (const f of alive(world)) {
          if (this.hitList.has(f) || !U.overlap(box, f.box)) continue;
          this.hitList.add(f);
          f.takeHit({ dmg: 14, kbx: this.facing * 720, kby: -520, stun: 0.6, big: true, from: this }, world);
          world.fx.text(f.x, f.y - f.h - 20, 'CASSO-WHACKED!', '#4cc9f0', 22);
        }
        if (this.stateT > 0.35) { this.state = 'idle'; this.stateT = 0; this.cool = 2.2; }
      }
    }

    // ---------------- crocodile ----------------
    croc(dt, world) {
      const zone = world.waterAt ? world.waterAt(this.homeX) : null;
      if (!zone) return;
      this.y = zone.surface;
      const swimmers = alive(world).filter((f) => f.x > zone.x && f.x < zone.x + zone.w && f.y > zone.surface - 10);
      const watch = alive(world).reduce((a, b) => (!a || Math.abs(b.x - this.x) < Math.abs(a.x - this.x) ? b : a), null);
      if (watch) this.facing = watch.x > this.x ? 1 : -1; // the eyes follow you...
      if (this.state === 'idle') {
        this.a = Math.max(0, this.a - dt * 3);
        const prey = swimmers.length ? swimmers.reduce((a, b) => (Math.abs(b.x - this.x) < Math.abs(a.x - this.x) ? b : a)) : null;
        if (prey) this.x += U.clamp(prey.x - this.x, -90 * dt, 90 * dt);
        this.x = U.clamp(this.x, zone.x + 40, zone.x + zone.w - 40);
        if (prey && Math.abs(prey.x - this.x) < 150 && this.cool <= 0) {
          this.state = 'wind'; this.stateT = 0;
          world.fx.text(this.x, this.y - 60, '!', '#ff4d6d', 40);
        }
      } else if (this.state === 'wind') {
        this.a = Math.min(0.25, this.stateT * 0.5);
        if (this.stateT > 0.55) { this.state = 'snap'; this.stateT = 0; this.hitList = new Set(); MG.Audio.bigHit(); }
      } else if (this.state === 'snap') {
        this.a = Math.min(1, 0.25 + this.stateT / 0.25);
        const box = { x: this.x - 110, y: this.y - 120, w: 220, h: 170 };
        for (const f of alive(world)) {
          if (this.hitList.has(f) || !U.overlap(box, f.box)) continue;
          this.hitList.add(f);
          f.takeHit({ dmg: 18, kbx: (f.x >= this.x ? 1 : -1) * 420, kby: -820, stun: 0.7, big: true, from: this }, world);
          world.fx.text(f.x, f.y - f.h - 24, 'SNAP!', '#ff4d6d', 30);
        }
        if (this.stateT > 0.5) { this.state = 'idle'; this.stateT = 0; this.cool = 3; }
      }
    }

    // ---------------- Smile Squad quokka ----------------
    quokka(dt, world) {
      const o = this.o;
      if (o.late !== undefined && this.state === 'idle') {
        // turns up only once the fight is already over
        const over = o.late === 'boss' ? world.boss && !world.boss.alive : world.gates && world.gates[o.late] && world.gates[o.late].opened;
        if (!over) { this.hidden = true; return; }
        this.hidden = false;
        this.state = 'arrive'; this.stateT = 0;
        this.x = world.camX + W + 40;
        this.facing = -1;
      }
      if (this.state === 'arrive') {
        this.mode = 2;
        const lead = world.leader();
        const tx = lead.x + 140;
        this.x -= 260 * dt;
        this.y = MG.GROUND_Y - Math.abs(Math.sin(this.t * 9)) * 26;
        if (this.x <= tx) { this.x = tx; this.y = MG.GROUND_Y; this.state = 'idle2'; this.stateT = 0; this.give(world, true); }
        return;
      }
      if (this.state === 'idle') {
        this.mode = 1;
        const f = near(world, this.x, 150)[0];
        if (f) { this.facing = f.x > this.x ? 1 : -1; this.give(world, false); }
      } else if (this.state === 'idle2') {
        this.mode = 1;
        if (this.stateT > 2.2) { this.state = 'leave'; this.stateT = 0; }
      } else if (this.state === 'leave') {
        this.mode = 2;
        this.facing = 1;
        this.x += 240 * dt;
        this.y = MG.GROUND_Y - Math.abs(Math.sin(this.t * 9)) * 26;
        if (this.x > world.camX + W + 80) this.gone = true;
      }
    }
    give(world, late) {
      const o = this.o;
      const line = o.line || (late ? 'Oh! Did I miss all the action? Sorry, champs! Here, have a heart.' : U.choice(QUOKKA_LINES));
      this.say(line, 4);
      const gives = late ? 'heart' : o.gives || 'heart';
      if (gives === 'heart') world.addPickup('heart', this.x + this.facing * 30, MG.GROUND_Y);
      else if (gives === 'supply') {
        world.addPickup(U.choice(['grenades', 'heart', 'armor'].concat(MG.POWER_TYPES)), this.x + this.facing * 30, MG.GROUND_Y - 260);
        world.fx.text(this.x, this.y - 116, 'SUPPLY DROP!', '#ffd23f', 20);
      }
      MG.Audio.pickup();
      this.state = late ? 'idle2' : 'idle2';
      this.stateT = 0;
    }

    // ---------------- Matschie's tree-kangaroo ----------------
    treeKangaroo(dt, world) {
      this.a = Math.max(0, this.a - dt * 3);
      const lead = world.leader();
      if (!this.said && Math.abs(lead.x - this.x) < 360) {
        this.said = true;
        this.say('G\'day! Tree-kangaroos live up in the rainforest trees. I\'ll cover you!', 4.5);
      }
      let target = null, bd = 420;
      for (const e of world.enemies || []) {
        if (!e.alive || e.hidden || e.burrowed || e.lurking) continue;
        const d = Math.abs(e.x - this.x);
        if (d < bd) { bd = d; target = e; }
      }
      if (target) this.facing = target.x > this.x ? 1 : -1;
      if (target && this.cool <= 0) {
        // lob a fruit at it
        const dx = target.x - this.x, t = 0.7;
        const vy = ((target.y - target.d.h * 0.5) - (this.y - 30) - 0.5 * 900 * t * t) / t;
        world.spawn(new MG.Projectile('fruit', this.x + this.facing * 16, this.y - 30, dx / t, vy, 'player',
          { dmg: 8, stun: 0.4, kbx: 220, kby: -200, gravity: 900, life: 1.4 }));
        this.a = 1;
        this.cool = 2.2;
        MG.Audio.whiff();
      }
    }

    // ---------------- northern quoll ----------------
    quoll(dt, world) {
      const team = alive(world);
      if (!team.length) return;
      const lead = world.leader();
      this.a = Math.max(0, this.a - dt * 4);
      // cane toads are poison to quolls: keep well away from them
      const toad = (world.enemies || []).find((e) => e.alive && e.type === 'toad' && Math.abs(e.x - this.x) < 170);
      if (toad) {
        this.mode = 2;
        this.facing = this.x < toad.x ? -1 : 1;
        this.x += this.facing * 280 * dt;
        if (!this.said || this.stateT > 6) { this.said = true; this.stateT = 0; this.say('Yikes, a cane toad! They\'re poison to quolls!', 3); }
        return;
      }
      let target = null, bd = 230;
      for (const e of world.enemies || []) {
        if (!e.alive || e.isBoss || e.hidden || e.type === 'toad') continue;
        const d = Math.abs(e.x - this.x);
        if (d < bd) { bd = d; target = e; }
      }
      let tx;
      if (target) tx = target.x - Math.sign(target.x - this.x) * 24;
      else tx = lead.x - lead.facing * 70;
      if (Math.abs(tx - this.x) > 600) this.x = lead.x - 80; // caught up with the team
      const step = 330 * dt;
      this.mode = Math.abs(tx - this.x) > 6 ? 1 : 0;
      if (this.mode) this.facing = tx > this.x ? 1 : -1;
      this.x += U.clamp(tx - this.x, -step, step);
      if (target && Math.abs(target.x - this.x) < 40 && this.cool <= 0) {
        target.takeHit({ dmg: 5, kbx: this.facing * 160, kby: -140, stun: 0.3, dir: this.facing, from: this }, world);
        world.fx.text(target.x, target.y - target.d.h - 10, 'NIP!', '#ffd6a5', 16);
        this.a = 1;
        this.cool = 0.8;
      }
    }

    // ---------------- drawing (also from Wi-Fi snapshots) ----------------
    snap() {
      const a = [CODE[this.kind], Math.round(this.x), Math.round(this.y), this.facing, Math.round(this.a * 100) / 100, this.mode, Math.round(this.t * 100) / 100, this.hidden ? 1 : 0];
      if (this.speechT > 0) a.push(this.speech);
      return a;
    }
    draw(ctx, world) {
      if (this.hidden || this.kind === 'emus') return;
      MG.NPC.drawState(ctx, this.kind, this.x, this.y, this.facing, this.a, this.mode, this.t, world, this.speechT > 0 ? this.speech : '');
    }

    static fromSnap(a) {
      return { kind: Object.prototype.hasOwnProperty.call(KIND, a[0]) ? KIND[a[0]] : null, x: a[1], y: a[2], facing: a[3], a: a[4], mode: a[5], t: a[6], hidden: !!a[7], speech: typeof a[8] === 'string' ? a[8].slice(0, 120) : '' };
    }
    // A speech bubble above an animal, kept on screen.
    static bubble(ctx, x, top, text, world) {
      const UI = MG.UI;
      const lines = UI.wrap(text, 30).slice(0, 4);
      ctx.font = `bold 13px ${UI.FONT}`;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22, h = lines.length * 17 + 14;
      const camX = world && world.camX !== undefined ? world.camX : x - W / 2;
      const bx = U.clamp(x - w / 2, camX + 8, camX + W - w - 8), by = Math.max(110, top - h - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx, by, w, h, 10); ctx.fill(); ctx.stroke();
      const tx = U.clamp(x, bx + 14, bx + w - 14);
      ctx.beginPath(); ctx.moveTo(tx - 7, by + h - 1); ctx.lineTo(tx, Math.min(top, by + h + 12)); ctx.lineTo(tx + 7, by + h - 1); ctx.fill();
      lines.forEach((ln, i) => UI.text(ctx, ln, bx + w / 2, by + 15 + i * 17, 13, '#2b193d', 'center'));
    }
    static drawState(ctx, kind, x, y, facing, a, mode, t, world, speech) {
      const HEAD = { cassowary: 150, croc: 40, quokka: 66, treeKangaroo: 80, quoll: 50, emu: 120 };
      if (speech) MG.NPC.bubble(ctx, x, y - (HEAD[kind] || 70), speech, world);
      const A = MG.Art;
      const o = { t, facing };
      if (kind === 'emu') { A.shadow(ctx, x, MG.GROUND_Y, 30); A.emu(ctx, x, y, Object.assign(o, { run: true })); }
      else if (kind === 'cassowary') { A.shadow(ctx, x, MG.GROUND_Y, 34); A.cassowary(ctx, x, y, Object.assign(o, { kick: a, angry: a > 0 })); }
      else if (kind === 'croc') A.croc(ctx, x, y, Object.assign(o, { lunge: a }));
      else if (kind === 'quokka') { A.shadow(ctx, x, MG.GROUND_Y, 18); A.quokka(ctx, x, y, Object.assign(o, { shirt: true, wave: mode === 1, hop: mode === 2 })); }
      else if (kind === 'treeKangaroo') A.treeKangaroo(ctx, x, y, Object.assign(o, { sit: true, throwing: a }));
      else if (kind === 'quoll') { A.shadow(ctx, x, MG.GROUND_Y, 16); A.quoll(ctx, x, y, Object.assign(o, { run: mode === 1, scared: mode === 2, bite: a })); }
    }
  };
})();
