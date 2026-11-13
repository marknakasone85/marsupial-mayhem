// Wi-Fi sync (from Sloth Slap). The scene snapshots (campaign, duel) come back in Milestone 2.
// The host runs the real game and ~30 times a second sends a
// "snapshot" of everything guests need to draw, plus the effects and sounds that
// happened since the last one (recorded here so guests can replay them).
(function () {
  const FX_METHODS = ['burst', 'text', 'gore', 'splat', 'feathers', 'shake', 'hitText', 'finisher'];
  const AUDIO_METHODS = ['tone', 'noise', 'wobble', 'hit', 'bigHit', 'whiff', 'jump', 'land', 'hurt', 'block',
    'pickup', 'heal', 'gong', 'crate', 'special', 'ko', 'win', 'shoot', 'emptyClick', 'ammo', 'powerUp',
    'funnyDeath', 'playMusic', 'finisher'];
  const MAX_EVENTS = 300;
  const r2 = (v) => Math.round(v * 100) / 100;
  let depth = 0; // only record the outermost call (e.g. hitText calls text internally)

  const S = (MG.Sync = {
    capturing: false,
    buffer: { fx: [], au: [] },
    seq: 0,

    record(kind, name, args) {
      const list = this.buffer[kind];
      list.push([name, args]);
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
    sendInput(state, dt, c) {
      const keys = ['jumpP', 'attackP', 'bigP', 'specialP', 'shootP'];
      const presses = keys.filter((k) => c[k]);
      const held = [c.left ? 1 : 0, c.right ? 1 : 0, c.down ? 1 : 0];
      const changed = !state.lastHeld || held.some((v, i) => v !== state.lastHeld[i]);
      state.heartbeat = (state.heartbeat || 0) - dt;
      if (presses.length || changed || state.heartbeat <= 0) {
        state.heartbeat = 0.5;
        state.lastHeld = held;
        state.inSeq = (state.inSeq || 0) + 1;
        MG.Net.send({ t: 'in', n: state.inSeq, l: held[0], r: held[1], d: held[2], p: presses }, 'host', true);
      }
    },
  });
})();
