// The Settings page (Milestone 8): volumes, blood, difficulty, touch buttons, high contrast,
// the key hints, and changing the keys for player 1 and player 2. Saved in this browser.
(function () {
  const UI = MG.UI;
  const I = MG.Input;
  const W = MG.W, H = MG.H;
  const S = MG.Settings;
  const pct = (v) => Math.round(v * 100) + '%';
  const step = (v, d) => Math.round(MG.U.clamp(v + d * 0.1, 0, 1) * 10) / 10;
  const DIFFS = ['easy', 'normal', 'hard'];

  MG.SettingsScene = class {
    // opts: { back: () => scene } (default: the title screen)
    constructor(opts = {}) {
      this.opts = opts;
      this.t = 0;
      this.sel = 0;
      this.page = 'main';     // main | keys
      this.player = 'P1';
      this.keySel = 0;
      this.waiting = false;   // waiting for a key press for the chosen action
      this.items = [
        { label: () => 'Music volume: ' + pct(S.music), change: (d) => MG.setSetting('music', step(S.music, d), 'musicVol') },
        { label: () => 'Sound effects volume: ' + pct(S.effects), change: (d) => MG.setSetting('effects', step(S.effects, d), 'effectsVol') },
        { label: () => 'Sound: ' + (MG.Audio.muted ? 'OFF' : 'ON'), change: () => MG.Audio.toggleMute() },
        { label: () => 'Blood: ' + MG.bloodLabel(), change: () => MG.cycleBlood() },
        { label: () => 'Difficulty (campaign): ' + MG.difficulty().name, change: (d) => MG.setSetting('difficulty', DIFFS[(DIFFS.indexOf(S.difficulty) + (d || 1) + 3) % 3]) },
        { label: () => 'Touch buttons: ' + (S.bigTouch ? 'BIG' : 'NORMAL'), change: () => MG.setSetting('bigTouch', !S.bigTouch) },
        { label: () => 'High contrast: ' + (S.contrast ? 'ON' : 'OFF'), change: () => MG.setSetting('contrast', !S.contrast) },
        { label: () => 'Light and haze: ' + (S.lighting ? 'ON' : 'OFF (faster on old phones)'), change: () => MG.setSetting('lighting', !S.lighting) },
        { label: () => 'Key hints at the bottom: ' + (MG.Save.get('keyStrip', true) ? 'ON' : 'OFF'), change: () => MG.Save.set('keyStrip', !MG.Save.get('keyStrip', true)) },
        { label: 'Change keys: player 1', act: () => { this.page = 'keys'; this.player = 'P1'; this.keySel = 0; } },
        { label: 'Change keys: player 2', act: () => { this.page = 'keys'; this.player = 'P2'; this.keySel = 0; } },
        { label: 'Back', act: () => this.back() },
      ];
    }

    enter() { MG.Audio.playMusic('title'); }
    back() { MG.Engine.setScene(this.opts.back ? this.opts.back() : new MG.MenuScene()); }
    rect(i) { return { x: W / 2 - 230, y: 74 + i * 35, w: 460, h: 31 }; }
    keyRect(i) { return { x: W / 2 - 230, y: 86 + i * 33, w: 460, h: 29 }; }

    update(dt) {
      this.t += dt;
      if (this.page === 'keys') { this.updateKeys(); return; }
      const n = this.items.length;
      if (MG.Menu.back()) { MG.Audio.select(); this.back(); return; }
      if (MG.Menu.up()) { this.sel = (this.sel - 1 + n) % n; MG.Audio.select(); }
      if (MG.Menu.down()) { this.sel = (this.sel + 1) % n; MG.Audio.select(); }
      const it = this.items[this.sel];
      if (it.change && MG.Menu.left()) { it.change(-1); MG.Audio.select(); }
      if (it.change && MG.Menu.right()) { it.change(1); MG.Audio.select(); }
      if (MG.Menu.confirm()) this.activate(this.sel);
      const p = I.pointer;
      if (p.pressed) for (let i = 0; i < n; i++) { const r = this.rect(i); if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) { this.sel = i; this.activate(i, p.x < r.x + r.w * 0.25 ? -1 : 1); } }
    }
    activate(i, d = 1) {
      const it = this.items[i];
      MG.Audio.confirm();
      if (it.act) it.act(); else if (it.change) it.change(d);
    }

    // ---- the keys page: pick an action, then press the new key for it
    updateKeys() {
      const A = MG.Keys.ACTIONS;
      const n = A.length + 2; // + reset + back
      if (this.waiting) {
        if (I.anyHit(['Escape'])) { this.waiting = false; MG.Audio.select(); return; }
        const code = Object.keys(I.pressed).find((c) => I.pressed[c] && !/^(Pad|Touch|Pointer)/.test(c) && c !== 'Escape');
        if (code) {
          this.waiting = false;
          if (MG.Keys.set(this.player, A[this.keySel], code)) MG.Audio.confirm(); else { MG.Audio.emptyClick(); this.msg = 'That key can\'t be used'; this.msgT = 2; }
        }
        return;
      }
      this.msgT = (this.msgT || 0) - 1 / 60;
      if (MG.Menu.back()) { this.page = 'main'; MG.Audio.select(); return; }
      if (MG.Menu.up()) { this.keySel = (this.keySel - 1 + n) % n; MG.Audio.select(); }
      if (MG.Menu.down()) { this.keySel = (this.keySel + 1) % n; MG.Audio.select(); }
      const choose = (i) => {
        if (i < A.length) { this.keySel = i; this.waiting = true; MG.Audio.confirm(); }
        else if (i === A.length) { MG.Keys.reset(); this.msg = 'Keys reset to the defaults'; this.msgT = 2; MG.Audio.confirm(); }
        else { this.page = 'main'; MG.Audio.select(); }
      };
      if (I.anyHit(['Enter', 'Space'])) choose(this.keySel);
      const p = I.pointer;
      if (p.pressed) for (let i = 0; i < n; i++) { const r = this.keyRect(i); if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) choose(i); }
    }

    draw(ctx) {
      MG.Art.background(ctx, 0, this.t, MG.GROUND_Y, 'sunset');
      UI.fade(ctx, 0.45);
      if (this.page === 'keys') { this.drawKeys(ctx); return; }
      UI.outlineText(ctx, 'SETTINGS', W / 2, 42, 34, '#ffd23f', 'center');
      this.items.forEach((it, i) => {
        const r = this.rect(i), on = i === this.sel;
        ctx.fillStyle = on ? '#ffd23f' : 'rgba(43,25,61,0.9)';
        ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 10); ctx.fill();
        const label = typeof it.label === 'function' ? it.label() : it.label;
        UI.text(ctx, (it.change ? '◀  ' : '') + label + (it.change ? '  ▶' : ''), r.x + r.w / 2, r.y + r.h / 2 + 1, 17, on ? '#2b193d' : '#ffffff', 'center');
      });
      UI.text(ctx, MG.Touch.enabled ? 'Tap a setting to change it (tap its left side to go back a step).' : '↑ ↓ choose   ← → or Enter change   Esc back', W / 2, H - 16, 13, '#9bf6ff', 'center');
    }
    drawKeys(ctx) {
      const A = MG.Keys.ACTIONS, p = this.player;
      UI.outlineText(ctx, `KEYS: PLAYER ${p === 'P1' ? 1 : 2}`, W / 2, 46, 30, MG.PLAYER_COLORS[p === 'P1' ? 0 : 1], 'center');
      const rows = A.map((a) => [MG.Keys.ACTION_NAMES[a], MG.Keys.label(p, a)]).concat([['Reset all keys to the defaults', ''], ['Back', '']]);
      rows.forEach(([name, key], i) => {
        const r = this.keyRect(i), on = i === this.keySel;
        ctx.fillStyle = on ? '#ffd23f' : 'rgba(43,25,61,0.9)';
        ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 9); ctx.fill();
        UI.text(ctx, name, r.x + 16, r.y + r.h / 2 + 1, 16, on ? '#2b193d' : '#ffffff');
        if (key) UI.text(ctx, this.waiting && on ? 'press a key...' : key, r.x + r.w - 16, r.y + r.h / 2 + 1, 16, on ? '#2b193d' : '#ffd23f', 'right');
      });
      const hint = this.waiting ? 'Press the new key (Esc cancels). If another action had it, they swap.' : '↑ ↓ choose   Enter: change the key   Esc back   (gamepads and touch buttons stay the same)';
      UI.text(ctx, hint, W / 2, H - 16, 13, '#9bf6ff', 'center');
      if (this.msgT > 0) UI.outlineText(ctx, this.msg, W / 2, 74, 16, '#9ef01a', 'center');
    }
  };
})();
