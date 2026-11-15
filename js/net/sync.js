// Wi-Fi sync (from Sloth Slap, rebuilt for Marsupial Mayhem).
// The host runs the real game and ~30 times a second sends a
// "snapshot" of everything guests need to draw, plus the effects and sounds that
// happened since the last one (recorded here so guests can replay them).
(function () {
  const FX_METHODS = ['burst', 'text', 'gore', 'splat', 'feathers', 'shake', 'hitText', 'finisher', 'ring'];
  const AUDIO_METHODS = ['tone', 'noise', 'wobble', 'hit', 'bigHit', 'whiff', 'jump', 'land', 'hurt', 'block',
    'pickup', 'heal', 'gong', 'crate', 'special', 'ko', 'win', 'shoot', 'emptyClick', 'ammo', 'powerUp',
    'funnyDeath', 'playMusic', 'finisher', 'jab', 'kick', 'hop', 'pin', 'punt', 'boom', 'gatling', 'munch',
    'thump', 'hiss', 'snort', 'screech', 'splash', 'bellow', 'weapon', 'coin', 'kaching'];
  const MAX_EVENTS = 300;
  const r1 = (v) => Math.round(v * 10) / 10;
  const r2 = (v) => Math.round(v * 100) / 100;
  // Leave out values that are zero/off (guests treat a missing value as 0), except the ones that must be there.
  const KEEP = { id: 1, x: 1, y: 1, hp: 1, cid: 1, st: 1, pose: 1 };
  const compact = (o) => {
    for (const k of Object.keys(o)) if (!KEEP[k] && (o[k] === 0 || o[k] === false || o[k] === '' || o[k] === null)) delete o[k];
    return o;
  };
  // What a Wi-Fi player can press (checked by the host, which ignores anything else)
  MG.PRESS_KEYS = ['jumpP', 'attackP', 'bigP', 'specialP', 'shootP', 'grenadeP', 'joeyP', 'pouchP'];
  let depth = 0; // only record the outermost call (e.g. hitText calls text internally)

  const S = (MG.Sync = {
    // One pest for the campaign snapshot: [uid, type, x, y, facing, flash, alive, spin, dizzy, t, pose bits,
    // pose name, pose amount, squash in hundredths]. Zeros at the end are left off (most pests have no
    // pose and stand still), so a guest reads a missing field as 0.
    enemyState(e) {
      const p = e.pose();
      const a = [e.uid, e.type, r1(e.x), r1(e.y), e.facing, e.flash > 0 ? 1 : 0, e.alive ? 1 : 0,
        r2(e.spin), e.hurt > 0.5 ? 1 : 0, r2(e.t), e.visualFlags(), p ? p[0] : 0, p ? r2(p[1]) : 0, Math.round(e.squash() * 100)];
      while (a.length > 7 && !a[a.length - 1]) a.pop();
      return a;
    },
    compact,
    // short names for things sent many times a second
    projState(p) {
      const a = [S.PROJ_CODE[p.kind] || p.kind, Math.round(p.x), Math.round(p.y), Math.round(p.vx), Math.round(p.vy)];
      if (p.wall) a.push(1); else if (p.kind === 'tongue') a.push(0, Math.round(p.x0));
      return a;
    },
    PROJ_CODE: { gumnut: 'g', dust: 'd', cube: 'c', stink: 's', wave: 'w', wallaby: 'y', bin: 'b', tongue: 't',
      pebble: 'p', snag: 'n', cricket: 'k', flame: 'f', dropbear: 'r', maul: 'm', magpie: 'q', claw: 'x', fruit: 'u', thong: 'h', water: 'o' },
    PROJ_KIND: { g: 'gumnut', d: 'dust', c: 'cube', s: 'stink', w: 'wave', y: 'wallaby', b: 'bin', t: 'tongue',
      p: 'pebble', n: 'snag', k: 'cricket', f: 'flame', r: 'dropbear', m: 'maul', q: 'magpie', x: 'claw', u: 'fruit', h: 'thong', o: 'water' },
    capturing: false,
    buffer: { fx: [], au: [] },
    seq: 0,

    record(kind, name, args) {
      const list = this.buffer[kind];
      // positions don't need more than one decimal place (keeps Wi-Fi updates small)
      list.push([name, args.map((a) => (typeof a === 'number' ? Math.round(a * 10) / 10 : a))]);
      if (list.length > MAX_EVENTS) list.shift();
    },

    wrap(obj, name, kind) {
      const orig = obj[name];
      obj[name] = function (...args) {
        const rec = S.capturing && depth === 0;
        depth++;
        try { return orig.apply(this, args); } finally {
          depth--;
          if (rec) S.record(kind, name, args);
        }
      };
    },

    // Make this FX instance's calls replayable on guests.
    wrapFX(fx) {
      for (const m of FX_METHODS) this.wrap(fx, m, 'fx');
      return fx;
    },

    installAudioHook() {
      if (this._audioHooked) return;
      this._audioHooked = true;
      for (const m of AUDIO_METHODS) this.wrap(MG.Audio, m, 'au');
    },

    takeBuffer() {
      const b = this.buffer;
      this.buffer = { fx: [], au: [] };
      return b;
    },

    // Guests: play back the host's effects and sounds locally.
    replay(fx, msg) {
      for (const [m, a] of msg.fx || []) if (FX_METHODS.includes(m)) fx[m](...a);
      for (const [m, a] of msg.au || []) if (AUDIO_METHODS.includes(m)) MG.Audio[m](...a);
    },

    // Guests: send held keys when they change, every press, and a heartbeat twice a second.
    // Held: left, right, down (block), shoot (rapid fire), jump (higher hops).
    sendInput(state, dt, c) {
      const presses = MG.PRESS_KEYS.filter((k) => c[k]);
      const held = [c.left ? 1 : 0, c.right ? 1 : 0, c.down ? 1 : 0, c.shoot ? 1 : 0, c.jump ? 1 : 0];
      const changed = !state.lastHeld || held.some((v, i) => v !== state.lastHeld[i]);
      state.heartbeat = (state.heartbeat || 0) - dt;
      if (presses.length || changed || state.heartbeat <= 0) {
        state.heartbeat = 0.5;
        state.lastHeld = held;
        state.inSeq = (state.inSeq || 0) + 1;
        MG.Net.send({ t: 'in', n: state.inSeq, l: held[0], r: held[1], d: held[2], s: held[3], j: held[4], p: presses }, 'host', true);
      }
    },

    // The campaign as the host sees it, small enough to send ~30 times a second (about 2-3 KB).
    snapshot(scene) {
      const b = this.takeBuffer();
      const powers = (p) => Object.keys(p).map((k) => [k, r2(p[k])]);
      return {
        t: 'snap', n: ++this.seq, gid: scene.gid, lv: scene.levelIndex, st: scene.state, stT: r2(scene.stateT), tm: r2(scene.t),
        cam: r1(scene.camX), sc: scene.score, hb: scene.hpBonus || 0, nb: scene.newBest ? 1 : 0, jg: scene.joeyGrew && scene.joeyGrew.length ? scene.joeyGrew : 0,
        bo: scene.boss ? [Math.max(0, Math.round(scene.boss.hp)), scene.boss.maxHp, scene.bossAwake ? 1 : 0, scene.boss.alive ? 1 : 0] : 0,
        pl: scene.slots.map((sl) => {
          const f = sl.f;
          return compact(Object.assign(f.renderState(), {
            id: sl.id, tag: scene.coop ? `P${sl.id + 1}` : 0, tc: MG.PLAYER_COLORS[sl.id % 4],
            hp: Math.max(0, Math.round(f.hp)), mhp: f.maxHp, me: Math.round(f.meter), cs: f.canSpecial ? 1 : 0,
            am: f.ammo, gr: f.grenades, pw: powers(f.powers), rt: r1(sl.respawnT),
            jr: f.joeyReady ? 1 : 0, jc: f.joey ? r2(MG.U.clamp(f.joey.cool / 8, 0, 1)) : 0,
            wpn: f.weapon ? f.weapon.id : 0, amx: f.weapon ? f.weapon.max : 0, co: sl.earned || 0, cn: scene.coinsOf(sl),
          }));
        }),
        en: scene.enemies.map(S.enemyState),
        al: (scene.allies || []).map((f) => compact(Object.assign(f.renderState(), { id: 100 + scene.allies.indexOf(f) }))),
        fl: scene.flashT > 0 ? r2(scene.flashT / (scene.flashMax || 1)) : 0,
        cr: scene.crates.map((c) => [c.alive ? 1 : 0, r2(c.wobble), c.flash > 0 ? 1 : 0]),
        ga: scene.gates.map((g, i) => [g.opened ? 1 : 0, r2(g.lift), scene.pestsLeft(i)]),
        pk: scene.pickups.map((p) => [p.type, r1(p.x), r1(p.y)]),
        pr: scene.projectiles.map(S.projState),
        gn: scene.grenades.map((g) => [r1(g.x), r1(g.y), r2(g.spin), r2(g.fuse), r2(g.t)]),
        cs: scene.coins.slice(0, 30).map((c) => [Math.round(c.x), Math.round(c.y), c.v, c.lying && !c.target ? 1 : 0]),
        np: scene.npcs.filter((n) => n.kind !== 'emus' && !n.hidden).map((n) => n.snap()),
        fx: b.fx, au: b.au,
      };
    },
  });
})();
