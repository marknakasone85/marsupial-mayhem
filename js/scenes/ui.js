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
      const hc = MG.Settings && MG.Settings.contrast && /^rgba\(43,25,61/.test(color); // high contrast: solid dark panels
      ctx.fillStyle = hc ? 'rgba(8,4,18,0.97)' : color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.strokeStyle = hc ? '#ffffff' : 'rgba(255,255,255,0.25)';
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
      // the keys come from MG.Keys (they can be changed in Settings)
      const K = (p, a) => MG.Keys.label(p, a);
      const NAMES = { ',': ', (comma)', '.': '. (period)', '/': '/ (slash)', ';': '; (semicolon)', "'": "' (quote)" };
      const P2 = (a) => NAMES[K('P2', a)] || K('P2', a);
      const rows = [
        ['', 'Player 1', 'Player 2', 'Gamepad'],
        ['Move', K('P1', 'left') + ' / ' + K('P1', 'right'), K('P2', 'left') + ' / ' + K('P2', 'right'), 'D-pad / stick'],
        ['Jump', K('P1', 'up'), P2('up'), 'A'],
        ['Block (hold)', K('P1', 'down'), P2('down'), 'Down / LB'],
        ['Punch', K('P1', 'attack'), P2('attack'), 'X'],
        ['Kick (big attack)', K('P1', 'big'), P2('big'), 'Y'],
        ['Special', K('P1', 'special'), P2('special'), 'B'],
        ['Shoot (hold)', K('P1', 'shoot'), P2('shoot'), 'RB'],
        ['Grenade, then kick it', K('P1', 'grenade'), P2('grenade'), 'LT'],
        ['Joey (send it out)', K('P1', 'joey'), P2('joey'), 'Back / View'],
        ['Pouch (use saved item)', K('P1', 'pouch'), P2('pouch'), 'RT'],
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
      UI.text(ctx, `Playing alone? Arrows + J (punch) K (kick) L (special) ${K('P2', 'shoot')} (shoot) ${K('P2', 'grenade')} (grenade) ${K('P2', 'joey')} (joey) ${K('P2', 'pouch')} (pouch) work too.`, W / 2, 460, 14, '#cccccc', 'center');
      UI.text(ctx, 'Grenade: pull the pin and drop it, then send it flying with punch, kick or the grenade key.', W / 2, 478, 14, '#cccccc', 'center');
      UI.text(ctx, 'Special needs a full blue meter. Phones & tablets: touch buttons appear when you tap.', W / 2, 496, 14, '#cccccc', 'center');
      UI.text(ctx, 'Press any key to go back.', W / 2, 512, 13, '#9bf6ff', 'center');
    },

    // The key for an action on the controls the player is using now (keyboard keys follow Settings).
    keyName(action, layout = MG.Input.lastDevice) {
      const PAD = { left: '◀', right: '▶', up: 'A', down: 'LB', attack: 'X', big: 'Y', special: 'B', shoot: 'RB', grenade: 'LT', joey: 'Back', pouch: 'RT' };
      const SOLO = { attack: 'J', big: 'K', special: 'L' }; // playing alone with the arrow keys
      const TOUCH = { left: '◀', right: '▶', up: 'JUMP', down: 'BLOCK', attack: 'PUNCH', big: 'KICK', special: 'SUPER', shoot: 'SHOOT', grenade: 'BOOM', joey: 'JOEY', pouch: 'POUCH' };
      if (MG.Touch && MG.Touch.enabled && layout === MG.Input.lastDevice) return TOUCH[action] || null;
      if (layout === 'pad') return PAD[action] || null;
      if (layout === 'arrows') return SOLO[action] || MG.Keys.label('P2', action);
      return MG.Keys.label('P1', action);
    },
    // Hints can name a key as {action} (e.g. "Press {grenade}"): never a fixed letter, since keys change.
    fillKeys(str) {
      return String(str).replace(/\{(\w+)\}/g, (m, a) => UI.keyName(a) || m);
    },

    // Key-hint strip along the bottom edge: every control during play, each key with what it does written
    // underneath, in three groups (moving | fighting | gear) and pause. Lights up the move the player is doing,
    // dims what can't be used right now (no ammo, no grenades, empty pouch, joey resting), and shows the
    // joey's level (with a bar while it rests) and the pouch's saved item.
    //  opts.layout: 'wasd' | 'arrows' | 'pad' (solo, follows the keys in use) or 'p1' | 'p2' (duel)
    //  opts.x + opts.align ('left'|'right') to place it; centered otherwise
    //  opts.compact: for two strips side by side (each fits half the screen), no pause key
    //  opts.tag / opts.tagColor: e.g. 'P1' in the player's color
    // Returns where it went: { x, w, k } (left edge, width on screen, scale used to make it fit).
    keyStrip(ctx, player, t, opts = {}) {
      // keyboard layouts follow the keys chosen in Settings (MG.Keys)
      const K = (p, a) => MG.Keys.label(p, a);
      const kb = (p) => [[[K(p, 'left'), K(p, 'right')], 'move'], [[K(p, 'up')], 'jump'], [[K(p, 'down')], 'block'], [[K(p, 'attack')], 'attack'],
        [[K(p, 'big')], 'big'], [[K(p, 'special')], 'special'], [[K(p, 'shoot')], 'shoot'], [[K(p, 'grenade')], 'grenade'], [[K(p, 'joey')], 'joey'], [[K(p, 'pouch')], 'pouch']];
      const solo2 = kb('P2'); solo2[3] = [['J'], 'attack']; solo2[4] = [['K'], 'big']; solo2[5] = [['L'], 'special'];
      const LAYOUTS = {
        wasd: kb('P1').concat([[['Esc'], 'pause']]),
        arrows: solo2.concat([[['Esc'], 'pause']]),
        pad: [[['◀', '▶'], 'move'], [['A'], 'jump'], [['LB'], 'block'], [['X'], 'attack'], [['Y'], 'big'], [['B'], 'special'], [['RB'], 'shoot'], [['LT'], 'grenade'], [['Back'], 'joey'], [['RT'], 'pouch'], [['Start'], 'pause']],
        p1: kb('P1'),
        p2: kb('P2'),
      };
      const compact = !!opts.compact;
      // every marsupial punches (attack) and kicks (big attack)
      const joeyLv = player.joey ? player.joey.level : player.joeyLevel || 0;
      const joeyRest = player.joey ? MG.U.clamp(player.joey.cool / 8, 0, 1) : player.joeyCool || 0;
      const SHOW = { attack: 'punch', big: 'kick', joey: joeyLv ? 'joey Lv' + joeyLv : 'joey' };
      const GROUP = { attack: 1, shoot: 1, pause: 1 }; // a divider before each: moving | fighting | gear | pause
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
      const kfs = compact ? 12 : 15, lfs = compact ? 10 : 13;   // key letters, labels underneath
      const capH = compact ? 18 : 24, gap = compact ? 9 : 14, sep = compact ? 8 : 12;
      const slotW = compact ? 13 : 17;                          // room for the pouch's item after "pouch"
      const kfont = `bold ${kfs}px ${FONT}`, lfont = `bold ${lfs}px ${FONT}`;
      const textW = (str, f) => { ctx.font = f; return ctx.measureText(str).width; };
      const capW = (k) => Math.max(capH, textW(k, kfont) + (compact ? 9 : 12));
      const sizes = items.map(([keys, label]) => {
        const kw = keys.reduce((a, k) => a + capW(k) + 3, 0) - 3;
        const lw = textW(SHOW[label] || label, lfont) + (label === 'pouch' ? slotW : 0);
        return { kw, lw, w: Math.max(kw, lw) };
      });
      const tagW = opts.tag ? textW(opts.tag, kfont) + 12 : 0;
      const dividers = items.filter(([, label], i) => i > 0 && GROUP[label]).length;
      const total = tagW + sizes.reduce((a, m) => a + m.w, 0) + gap * (items.length - 1) + sep * dividers;
      // never wider than its room (a long key name chosen in Settings would otherwise run off the edge)
      const room = compact ? MG.W / 2 - 28 : MG.W - 28;
      const k = Math.min(1, room / total);
      const H = MG.H, bandH = compact ? 44 : 52;
      const capY = H - (compact ? 29 : 35), labY = H - (compact ? 10 : 12);
      let x = opts.x === undefined ? (MG.W - total * k) / 2 : opts.align === 'right' ? opts.x - total * k : opts.x;
      const where = { x: x - 10 * k, w: (total + 20) * k, k };
      ctx.save();
      if (!compact) {
        // one player: a dark band along the whole bottom edge
        ctx.fillStyle = 'rgba(16,8,26,0.8)';
        ctx.fillRect(0, H - bandH, MG.W, bandH);
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(0, H - bandH, MG.W, 2);
      }
      ctx.translate(x, H); ctx.scale(k, k); ctx.translate(-x, -H);
      if (compact) {
        ctx.fillStyle = 'rgba(16,8,26,0.8)';
        ctx.beginPath(); ctx.roundRect(x - 10, H - bandH, total + 20, bandH - 3, 12); ctx.fill();
      }
      if (opts.tag) {
        UI.text(ctx, opts.tag, x, H - bandH / 2 - 1, kfs, opts.tagColor || '#ffd23f');
        x += tagW;
      }
      items.forEach(([keys, label], i) => {
        if (i > 0 && GROUP[label]) {
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(x - gap / 2 + sep / 2 - 1, H - bandH + 8, 2, bandH - 14);
          x += sep;
        }
        const m = sizes[i];
        const ready = label === 'special' && player.canSpecial;
        const empty = (label === 'shoot' && !(player.ammo > 0)) || (label === 'grenade' && !(player.grenades > 0))
          || (label === 'pouch' && !player.pouch) || (label === 'joey' && player.joeyReady === false);
        const on = active[label];
        const glow = ready && Math.floor(t * 4) % 2 === 0;
        let kx = x + (m.w - m.kw) / 2;
        for (const key of keys) {
          const w = capW(key);
          ctx.fillStyle = on ? '#ffd23f' : glow ? '#00f5d4' : empty ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)';
          ctx.beginPath();
          ctx.roundRect(kx, capY - capH / 2, w, capH, 5);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(kx + 2, capY + capH / 2 - 3, w - 4, 2);
          UI.text(ctx, key, kx + w / 2, capY + 0.5, kfs, '#2b193d', 'center');
          kx += w + 3;
        }
        // the joey resting: a pink bar fills along the bottom of its key
        if (label === 'joey' && player.joeyReady === false && joeyRest > 0) {
          const w = capW(keys[0]), k0 = x + (m.w - m.kw) / 2;
          ctx.fillStyle = '#f6b3c4';
          ctx.fillRect(k0 + 2, capY + capH / 2 - 3, (w - 4) * (1 - joeyRest), 2);
        }
        const color = on ? '#ffd23f' : ready ? '#00f5d4' : empty ? '#b8b8b8' : label === 'joey' && player.joeyReady !== false && joeyLv ? '#f6b3c4' : '#ffffff';
        const text = SHOW[label] || label;
        const slot = label === 'pouch' ? slotW : 0;
        const tw = textW(text, lfont);
        const lx = x + (m.w - (tw + slot)) / 2;
        UI.text(ctx, text, lx + tw / 2, labY, lfs, color, 'center');
        if (slot) {
          // the pouch's saved item (or an empty slot)
          const cx = lx + tw + slot / 2 + 1, r = compact ? 5 : 6.5;
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          ctx.beginPath(); ctx.arc(cx, labY, r + 1, 0, Math.PI * 2); ctx.fill();
          if (player.pouch) UI.pouchItem(ctx, player.pouch, cx, labY, r);
        }
        x += m.w + gap;
      });
      ctx.restore();
      return where;
    },

    // A labelled key bar for the screens around the game (world map, shop, character select, story,
    // Settings, pause and other menus), with the same look as the key strip during play: each key with
    // what it does written underneath.
    //  items: [keys[], label] | '|' (a divider) | { tag, color } (starts a player's keys, e.g. 'P1')
    //  opts: { x, w } for a box of that width from x (left-aligned); otherwise a band along the bottom.
    // Returns { x, w, k } like keyStrip. Phones and tablets keep their tap hints instead (MG.Touch.enabled).
    keyBar(ctx, items, opts = {}) {
      const kfs = 14, lfs = 12, capH = 22, gap = 14, sep = 12, bandH = 44;
      const kfont = `bold ${kfs}px ${FONT}`, lfont = `bold ${lfs}px ${FONT}`;
      const textW = (str, f) => { ctx.font = f; return ctx.measureText(str).width; };
      const capW = (k) => Math.max(capH, textW(k, kfont) + 12);
      const parts = items.map((it) => {
        if (it === '|') return { div: true, w: sep };
        if (it && it.tag) return { tag: it.tag, color: it.color, w: textW(it.tag, kfont) + 10 };
        const [keys, label] = it;
        const kw = keys.reduce((a, k) => a + capW(k) + 3, 0) - 3;
        return { keys, label, kw, w: Math.max(kw, textW(label, lfont)) };
      });
      const total = parts.reduce((a, m) => a + m.w, 0) + gap * Math.max(0, parts.filter((m) => !m.div).length - 1);
      const room = (opts.w || MG.W) - 28;
      const k = Math.min(1, room / total);
      const H = MG.H, capY = H - 29, labY = H - 10;
      let x = opts.x !== undefined ? opts.x + 14 : (MG.W - total * k) / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(16,8,26,0.82)';
      if (opts.x !== undefined) { ctx.beginPath(); ctx.roundRect(opts.x, H - bandH - 2, Math.min(opts.w, total * k + 28), bandH, 12); ctx.fill(); }
      else { ctx.fillRect(0, H - bandH, MG.W, bandH); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(0, H - bandH, MG.W, 2); }
      const where = { x: x - 14 * k, w: (total + 28) * k, k };
      ctx.translate(x, H); ctx.scale(k, k); ctx.translate(-x, -H);
      parts.forEach((m, i) => {
        if (m.div) {
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(x + m.w / 2 - gap / 2 - 1, H - bandH + 8, 2, bandH - 14);
          x += m.w;
          return;
        }
        if (m.tag) UI.text(ctx, m.tag, x, H - bandH / 2, kfs, m.color || '#ffd23f');
        else {
          let kx = x + (m.w - m.kw) / 2;
          for (const key of m.keys) {
            const w = capW(key);
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath(); ctx.roundRect(kx, capY - capH / 2, w, capH, 5); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(kx + 2, capY + capH / 2 - 3, w - 4, 2);
            UI.text(ctx, key, kx + w / 2, capY + 0.5, kfs, '#2b193d', 'center');
            kx += w + 3;
          }
          UI.text(ctx, m.label, x + m.w / 2, labY, lfs, '#ffffff', 'center');
        }
        x += m.w + (i < parts.length - 1 && !(parts[i + 1] && parts[i + 1].div) ? gap : 0);
      });
      ctx.restore();
      return where;
    },
    // The usual menu keys, for the controls in use (keyboard or gamepad).
    menuKeys() {
      const pad = MG.Input.lastDevice === 'pad';
      return {
        pad,
        upDown: pad ? ['▲', '▼'] : ['↑', '↓'],
        leftRight: pad ? ['◀', '▶'] : ['←', '→'],
        arrows: pad ? ['D-pad'] : ['←', '↑', '↓', '→'],
        ok: pad ? ['A'] : ['Enter'],
        back: pad ? ['B'] : ['Esc'],
      };
    },
    // The bar for a plain list menu (pause, after a map, duel menus): choose, OK and, if given, Esc's job.
    menuBar(ctx, escLabel) {
      if (MG.Touch && MG.Touch.enabled) return null;
      const K = UI.menuKeys();
      const items = [[K.upDown, 'choose'], [K.ok, 'OK']];
      if (escLabel) items.push('|', [K.pad && escLabel === 'back to the game' ? ['Start'] : K.back, escLabel]);
      return UI.keyBar(ctx, items);
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
        // item.accent: a colour that makes a line stand out (the shop); item.badge: coins shown on the right
        ctx.fillStyle = on ? '#ffd23f' : item.accent || 'rgba(43,25,61,0.85)';
        ctx.beginPath();
        ctx.roundRect(r.x, r.y + bob, r.w, r.h, 14);
        ctx.fill();
        ctx.strokeStyle = on ? '#2b193d' : item.accent ? '#ffd23f' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        const label = typeof item.label === 'function' ? item.label() : item.label;
        const badge = typeof item.badge === 'function' ? item.badge() : item.badge;
        UI.text(ctx, label, r.x + r.w / 2 - (badge ? 18 : 0), r.y + r.h / 2 + bob + 1, this.fontSize, on ? '#2b193d' : '#ffffff', 'center');
        if (badge) {
          const fs = Math.max(11, this.fontSize - 4);
          UI.text(ctx, badge, r.x + r.w - 12, r.y + r.h / 2 + bob + 1, fs, on ? '#2b193d' : '#ffd23f', 'right');
          ctx.font = `bold ${fs}px ${UI.FONT}`;
          MG.Art.coinIcon(ctx, r.x + r.w - 20 - ctx.measureText(badge).width, r.y + r.h / 2 + bob, Math.min(8, r.h * 0.22));
        }
      });
    }
  };
})();
