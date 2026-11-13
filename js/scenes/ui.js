// Shared drawing helpers and a keyboard/mouse/touch friendly menu list (from Sloth Slap).
(function () {
  const FONT = '"Arial Rounded MT Bold", "Arial Black", "Trebuchet MS", sans-serif';

  const UI = (MG.UI = {
    FONT,

    outlineText(ctx, str, x, y, size, color = '#fff', align = 'left', outline = '#2b193d') {
      ctx.font = `bold ${size}px ${FONT}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, size / 5);
      ctx.strokeStyle = outline;
      ctx.strokeText(str, x, y);
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    },

    text(ctx, str, x, y, size, color = '#fff', align = 'left') {
      ctx.font = `bold ${size}px ${FONT}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    },

    panel(ctx, x, y, w, h, color = 'rgba(43,25,61,0.82)') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
    },

    // Health/meter bar. flip = drains toward the right (for player 2 side).
    bar(ctx, x, y, w, h, frac, color, flip = false, ghost = null) {
      frac = MG.U.clamp(frac, 0, 1);
      ctx.fillStyle = '#2b193d';
      ctx.beginPath();
      ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 6);
      ctx.fill();
      ctx.fillStyle = '#5a4870';
      ctx.fillRect(x, y, w, h);
      if (ghost !== null) {
        ctx.fillStyle = '#ffffff';
        const gw = w * MG.U.clamp(ghost, 0, 1);
        ctx.fillRect(flip ? x + w - gw : x, y, gw, h);
      }
      ctx.fillStyle = color;
      const fw = w * frac;
      ctx.fillRect(flip ? x + w - fw : x, y, fw, h);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(flip ? x + w - fw : x, y, fw, h * 0.35);
    },

    // Full controls page (title menu, pause menus).
    controlsPanel(ctx) {
      const W = MG.W;
      UI.panel(ctx, 110, 140, W - 220, 380);
      UI.outlineText(ctx, 'CONTROLS', W / 2, 168, 30, '#ffd23f', 'center');
      const rows = [
        ['', 'Player 1', 'Player 2', 'Gamepad'],
        ['Move', 'A / D', '← / →', 'D-pad / stick'],
        ['Jump', 'W', '↑', 'A'],
        ['Block (hold)', 'S', '↓', 'Down / LB'],
        ['Attack', 'F', ', (comma)', 'X'],
        ['Big Attack', 'G', '. (period)', 'Y'],
        ['Special', 'H', '/ (slash)', 'B'],
        ['Shoot (hold)', 'R', '; (semicolon)', 'RB'],
        ['Grenade, then kick it', 'E', "' (quote)", 'LT'],
        ['Joey (send it out)', 'Q', '[', 'Back / View'],
        ['Pouch (use saved item)', 'T', ']', 'RT'],
        ['Pause', 'Esc / P', 'Esc / P', 'Start'],
      ];
      rows.forEach((r, i) => {
        const y = 196 + i * 21.5;
        const col = i === 0 ? '#9bf6ff' : '#ffffff';
        UI.text(ctx, r[0], 140, y, 16, '#ffd23f');
        UI.text(ctx, r[1], 400, y, 17, col, 'center');
        UI.text(ctx, r[2], 570, y, 17, col, 'center');
        UI.text(ctx, r[3], 735, y, 17, col, 'center');
      });
      UI.text(ctx, 'Playing alone? Arrows + J (attack) K (big) L (special) ; (shoot) \' (grenade) [ (joey) ] (pouch) work too.', W / 2, 460, 14, '#cccccc', 'center');
      UI.text(ctx, 'Grenade: pull the pin and drop it, then kick it with attack, big attack or the grenade key.', W / 2, 478, 14, '#cccccc', 'center');
      UI.text(ctx, 'Special needs a full blue meter. Phones & tablets: touch buttons appear when you tap.', W / 2, 496, 14, '#cccccc', 'center');
      UI.text(ctx, 'Press any key to go back.', W / 2, 512, 13, '#9bf6ff', 'center');
    },

    // Key-hint strip along the bottom edge. Lights up the move the player is doing.
    //  opts.layout: 'wasd' | 'arrows' | 'pad' (solo, follows the keys in use) or 'p1' | 'p2' (duel)
    //  opts.x + opts.align ('left'|'right') to place it; centered otherwise
    //  opts.compact: for two strips side by side: each label sits under its key, no pause key
    //  opts.tag / opts.tagColor: e.g. 'P1' in the player's color
    keyStrip(ctx, player, t, opts = {}) {
      const LAYOUTS = {
        wasd: [[['A', 'D'], 'move'], [['W'], 'jump'], [['S'], 'block'], [['F'], 'attack'], [['G'], 'big'], [['H'], 'special'], [['R'], 'shoot'], [['E'], 'grenade'], [['Q'], 'joey'], [['T'], 'pouch'], [['Esc'], 'pause']],
        arrows: [[['←', '→'], 'move'], [['↑'], 'jump'], [['↓'], 'block'], [['J'], 'attack'], [['K'], 'big'], [['L'], 'special'], [[';'], 'shoot'], [["'"], 'grenade'], [['['], 'joey'], [[']'], 'pouch'], [['Esc'], 'pause']],
        pad: [[['◀', '▶'], 'move'], [['A'], 'jump'], [['LB'], 'block'], [['X'], 'attack'], [['Y'], 'big'], [['B'], 'special'], [['RB'], 'shoot'], [['LT'], 'grenade'], [['Back'], 'joey'], [['RT'], 'pouch'], [['Start'], 'pause']],
        p1: [[['A', 'D'], 'move'], [['W'], 'jump'], [['S'], 'block'], [['F'], 'attack'], [['G'], 'big'], [['H'], 'special'], [['R'], 'shoot'], [['E'], 'grenade'], [['Q'], 'joey'], [['T'], 'pouch']],
        p2: [[['←', '→'], 'move'], [['↑'], 'jump'], [['↓'], 'block'], [[','], 'attack'], [['.'], 'big'], [['/'], 'special'], [[';'], 'shoot'], [["'"], 'grenade'], [['['], 'joey'], [[']'], 'pouch']],
      };
      const compact = !!opts.compact;
      let items = LAYOUTS[opts.layout || MG.Input.lastDevice] || LAYOUTS.wasd;
      if (compact) items = items.filter(([, label]) => label !== 'pause');
      const kind = player.move ? player.move.kind : null;
      const active = {
        attack: kind === 'jab', big: kind === 'kick',
        special: kind === 'special',
        shoot: !!player.firing,
        grenade: kind === 'pin' || kind === 'punt',
        joey: !!player.joeyOut,
        block: player.state === 'block', jump: !player.onGround && player.state !== 'ko',
      };
      const fs = compact ? 11 : 12, lfs = compact ? 9 : 12;
      const font = `bold ${fs}px ${FONT}`, lfont = `bold ${lfs}px ${FONT}`;
      const textW = (str, f) => { ctx.font = f; return ctx.measureText(str).width; };
      const capW = (k) => Math.max(compact ? 16 : 20, textW(k, font) + (compact ? 8 : 10));
      const capH = compact ? 16 : 20;
      const gap = compact ? 8 : 10;
      // each item: its key caps, then the label beside them (or under them when compact)
      const sizes = items.map(([keys, label]) => {
        const kw = keys.reduce((a, k) => a + capW(k) + 3, 0) - 3;
        const lw = textW(label, lfont);
        return { kw, w: compact ? Math.max(kw, lw) : kw + 5 + lw };
      });
      const tagW = opts.tag ? textW(opts.tag, font) + 10 : 0;
      const total = tagW + sizes.reduce((a, m) => a + m.w, 0) + gap * (items.length - 1);
      const h = compact ? 34 : 28;
      const y = MG.H - (compact ? 19 : 20);
      let x = opts.x === undefined ? (MG.W - total) / 2 : opts.align === 'right' ? opts.x - total : opts.x;
      ctx.fillStyle = 'rgba(20,10,30,0.55)';
      ctx.beginPath();
      ctx.roundRect(x - 10, y - h / 2, total + 20, h, 14);
      ctx.fill();
      if (opts.tag) {
        UI.text(ctx, opts.tag, x, y, fs, opts.tagColor || '#ffd23f');
        x += tagW;
      }
      items.forEach(([keys, label], i) => {
        const m = sizes[i];
        const ready = label === 'special' && player.canSpecial;
        const empty = (label === 'shoot' && !(player.ammo > 0)) || (label === 'grenade' && !(player.grenades > 0))
          || (label === 'pouch' && !player.pouch) || (label === 'joey' && player.joeyReady === false);
        const on = active[label];
        const glow = ready && Math.floor(t * 4) % 2 === 0;
        const ky = compact ? y - 6 : y;
        let kx = compact ? x + (m.w - m.kw) / 2 : x;
        for (const k of keys) {
          const w = capW(k);
          ctx.fillStyle = on ? '#ffd23f' : glow ? '#00f5d4' : empty ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)';
          ctx.beginPath();
          ctx.roundRect(kx, ky - capH / 2, w, capH, 5);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(kx + 2, ky + capH / 2 - 3, w - 4, 2);
          UI.text(ctx, k, kx + w / 2, ky, fs, '#2b193d', 'center');
          kx += w + 3;
        }
        const color = on ? '#ffd23f' : ready ? '#00f5d4' : empty ? '#999999' : '#ffffff';
        if (compact) UI.text(ctx, label, x + m.w / 2, y + 10, lfs, color, 'center');
        else UI.text(ctx, label, kx + 2, y, fs, color);
        x += m.w + gap;
      });
    },

    // The pouch's saved item as a small icon (HUDs): a heart, or a power-up's colour and symbol.
    pouchItem(ctx, type, x, y, r = 8) {
      if (type === 'heart') { ctx.save(); ctx.translate(x, y + r * 1.1); ctx.scale(r / 16, r / 16); MG.Art.heart(ctx, 0, 0, 0); ctx.restore(); }
      else if (type) {
        ctx.fillStyle = MG.Art.POWER_COLORS[type] || '#ffffff';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        MG.Art.powerIcon(ctx, type, x, y, r * 0.62);
      }
    },

    // Row of bullet icons showing the fighter's ammo (+ refill progress).
    ammo(ctx, x, y, f, align = 'left') {
      const step = 13;
      const total = f.maxAmmo * step;
      const sx = align === 'right' ? x - total : x;
      for (let i = 0; i < f.maxAmmo; i++) {
        const full = i < f.ammo;
        ctx.fillStyle = full ? '#ffb703' : 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.roundRect(sx + i * step, y - 6, 7, 12, 3.5);
        ctx.fill();
        if (!full && i === f.ammo) {
          ctx.fillStyle = 'rgba(255,183,3,0.6)';
          const fh = 12 * (f.ammoT / f.ammoRegen);
          ctx.fillRect(sx + i * step, y + 6 - fh, 7, fh);
        }
      }
      UI.text(ctx, f.ammo > 0 ? 'ammo' : 'reloading...', align === 'right' ? sx - 8 : sx + total + 6, y, 11,
        f.ammo > 0 ? '#ffb703' : '#aaa', align === 'right' ? 'right' : 'left');
    },

    // "Back" button for touch screens (phones have no Esc key). Shown only in touch mode.
    BACK_RECT: { x: 12, y: 12, w: 96, h: 38 },
    backButton(ctx) {
      if (!MG.Touch.enabled) return;
      const r = UI.BACK_RECT;
      ctx.fillStyle = 'rgba(43,25,61,0.85)';
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 12);
      ctx.fill();
      UI.text(ctx, '\u25C0 Back', r.x + r.w / 2, r.y + r.h / 2 + 1, 16, '#ffffff', 'center');
    },
    backTapped() {
      const p = MG.Input.pointer, r = UI.BACK_RECT;
      return MG.Touch.enabled && p.pressed && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    },

    // Wi-Fi games: join code + address at the top of the screen (so anyone can rejoin any time).
    // net = { code, address, lost }
    netStrip(ctx, net) {
      const parts = [['WI-FI GAME', '#ffffff'], ['   JOIN CODE: ', '#9bf6ff'], [String(net.code), '#ffd23f'], [`   ${net.address}`, '#9bf6ff']];
      if (net.lost) parts.push(['   reconnecting...', '#ff4d6d']);
      ctx.font = `bold 13px ${FONT}`;
      const widths = parts.map(([txt]) => ctx.measureText(txt).width);
      const total = widths.reduce((a, b) => a + b, 0);
      let x = (MG.W - total) / 2;
      ctx.fillStyle = 'rgba(20,10,30,0.85)';
      ctx.beginPath();
      ctx.roundRect(x - 14, 2, total + 28, 20, 10);
      ctx.fill();
      parts.forEach(([txt, color], i) => {
        UI.text(ctx, txt, x, 12, 13, color);
        x += widths[i];
      });
    },

    // Fade overlay helper
    fade(ctx, a) {
      if (a <= 0) return;
      ctx.fillStyle = `rgba(20,10,30,${Math.min(1, a)})`;
      ctx.fillRect(0, 0, MG.W, MG.H);
    },
  });

  // A vertical menu of buttons. Keyboard, gamepad, mouse and touch all work.
  MG.MenuList = class {
    constructor(items, x, y, opts = {}) {
      this.items = items;
      this.x = x;
      this.y = y;
      this.w = opts.w || 320;
      this.h = opts.h || 52;
      this.gap = opts.gap || 14;
      this.cols = opts.cols || 1;       // 2+ = a grid (arrow keys move in all directions)
      this.gapX = opts.gapX || 20;
      this.fontSize = opts.fontSize || 22;
      this.sel = 0;
      this.t = 0;
    }

    rect(i) {
      const c = i % this.cols, r = Math.floor(i / this.cols);
      const total = this.cols * this.w + (this.cols - 1) * this.gapX;
      return { x: this.x - total / 2 + c * (this.w + this.gapX), y: this.y + r * (this.h + this.gap), w: this.w, h: this.h };
    }

    // Returns the chosen item (or null).
    update(dt) {
      this.t += dt;
      const n = this.items.length;
      if (this.cols > 1) {
        const c = this.cols;
        let s = this.sel;
        if (MG.Menu.up() && s - c >= 0) s -= c;
        if (MG.Menu.down() && s + c < n) s += c;
        if (MG.Menu.left() && s % c > 0) s--;
        if (MG.Menu.right() && s % c < c - 1 && s + 1 < n) s++;
        if (s !== this.sel) { this.sel = s; MG.Audio.select(); }
      } else {
        if (MG.Menu.up()) { this.sel = (this.sel - 1 + n) % n; MG.Audio.select(); }
        if (MG.Menu.down()) { this.sel = (this.sel + 1) % n; MG.Audio.select(); }
      }
      const p = MG.Input.pointer;
      for (let i = 0; i < n; i++) {
        const r = this.rect(i);
        const inside = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
        if (inside && (p.pressed || p.down) && this.sel !== i) { this.sel = i; }
        if (inside && p.pressed) { MG.Audio.confirm(); return this.items[i]; }
      }
      if (MG.Menu.confirm()) { MG.Audio.confirm(); return this.items[this.sel]; }
      return null;
    }

    draw(ctx) {
      this.items.forEach((item, i) => {
        const r = this.rect(i);
        const on = i === this.sel;
        const bob = on ? Math.sin(this.t * 6) * 3 : 0;
        ctx.fillStyle = on ? '#ffd23f' : 'rgba(43,25,61,0.85)';
        ctx.beginPath();
        ctx.roundRect(r.x, r.y + bob, r.w, r.h, 14);
        ctx.fill();
        ctx.strokeStyle = on ? '#2b193d' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        const label = typeof item.label === 'function' ? item.label() : item.label;
        UI.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + bob + 1, this.fontSize, on ? '#2b193d' : '#ffffff', 'center');
      });
    }
  };
})();
