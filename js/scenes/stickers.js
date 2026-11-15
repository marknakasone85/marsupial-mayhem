// The sticker book (title screen > STICKER BOOK): every sticker on a scrapbook page, the ones you have
// stuck on at a little tilt, the rest as dashed outlines. Pick one to read how to get it.
(function () {
  const UI = MG.UI, A = MG.Art;
  const W = MG.W, H = MG.H;
  const COLS = 9, CELL = 98, X0 = (W - COLS * CELL) / 2, Y0 = 108, ROW_H = 96, R = 37;

  // ---------------------------------------------------------------- the stickers' pictures
  const thumbs = new Map(); // a world's look, drawn once (its background, small)
  function worldThumb(theme) {
    if (thumbs.has(theme)) return thumbs.get(theme);
    let c = null;
    if (typeof document !== 'undefined' && document && typeof document.createElement === 'function') {
      c = document.createElement('canvas');
      if (c && c.getContext) {
        c.width = 240; c.height = 135;
        const g = c.getContext('2d');
        if (g) { g.scale(0.25, 0.25); A.background(g, 300, 3, MG.GROUND_Y, theme === 'rift' ? 'sunset' : null, theme); } else c = null;
      } else c = null;
    }
    thumbs.set(theme, c);
    return c;
  }
  const SKY = { outback: '#8fcfee', rainforest: '#6fae7a', canefields: '#a6d8f0', alps: '#dfe9f5', city: '#9cc4ea', rift: '#e0794a', topend: '#f6c58a', grinisle: '#7fd3f0', isleofman: '#b8d7ec' };

  function trophy(ctx, x, y, s, star) {
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 13 * s, y - 14 * s); ctx.lineTo(x + 13 * s, y - 14 * s); ctx.quadraticCurveTo(x + 12 * s, y + 4 * s, x, y + 6 * s);
    ctx.quadraticCurveTo(x - 12 * s, y + 4 * s, x - 13 * s, y - 14 * s); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 14 * s, y - 7 * s, 5 * s, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 14 * s, y - 7 * s, 5 * s, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    ctx.fillRect(x - 3 * s, y + 6 * s, 6 * s, 6 * s);
    ctx.beginPath(); ctx.roundRect(x - 9 * s, y + 12 * s, 18 * s, 5 * s, 2); ctx.fill(); ctx.stroke();
    if (star) { ctx.fillStyle = '#ffffff'; MG.FX.star(ctx, x, y - 6 * s, 6 * s); }
  }

  // What each sticker shows, inside a circle of radius r at (x, y).
  function icon(ctx, s, x, y, r, t) {
    const ic = s.icon || {};
    if (ic.theme) {
      const th = worldThumb(ic.theme);
      if (th) ctx.drawImage(th, x - r * 1.78, y - r * 1.25, r * 3.56, r * 2.0);
      else { ctx.fillStyle = SKY[ic.theme] || '#8fcfee'; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
      return;
    }
    ctx.fillStyle = '#fff4d6'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const def = (id) => MG.charById(id);
    if (ic.cid) {
      if (ic.pose === 'punch') {
        const d = def(ic.cid);
        A.character(ctx, d, { x: x - r * 0.25, y: y + r * 0.85, facing: 1, scale: r / 95, t: 1, pose: 'idle', jab: 1, jabArm: 0 });
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        for (const dy of [-0.38, -0.25, -0.12]) { ctx.beginPath(); ctx.moveTo(x + r * 0.35, y + dy * r); ctx.lineTo(x + r * 0.8, y + dy * r); ctx.stroke(); }
      } else A.portrait(ctx, def(ic.cid), x, y + r * 0.08, r * 0.86, t || 0);
      return;
    }
    if (ic.cids) {
      const n = ic.cids.length;
      ic.cids.forEach((cid, i) => A.portrait(ctx, def(cid), x + (i - (n - 1) / 2) * r * (n > 2 ? 0.55 : 0.75), y + (i % 2 ? r * 0.14 : -r * 0.06), r * (n > 2 ? 0.5 : 0.62), t || 0));
      return;
    }
    switch (ic.art) {
      case 'dummy': ctx.save(); ctx.translate(x, y + r * 0.95); ctx.scale(r / 62, r / 62); A.dummy(ctx, 0, 0, { tilt: 0.1, t: t || 0 }); ctx.restore(); break;
      case 'ten':
        ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.fillStyle = '#ff4d6d';
        for (let i = 0; i < 5; i++) { const a = i * 1.257 + 0.3; MG.FX.star(ctx, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.16); }
        UI.outlineText(ctx, '10', x, y + 2, r * 0.9, '#ffd23f', 'center');
        break;
      case 'grenade':
        A.grenade(ctx, x + r * 0.15, y + r * 0.05, { r: r * 0.36, pin: true });
        ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 2.5;
        for (const dy of [-0.25, 0, 0.25]) { ctx.beginPath(); ctx.moveTo(x - r * 0.75, y + dy * r); ctx.lineTo(x - r * 0.35, y + dy * r); ctx.stroke(); }
        break;
      case 'special':
        ctx.fillStyle = '#00f5d4'; MG.FX.star(ctx, x, y, r * 0.8);
        UI.outlineText(ctx, 'SUPER', x, y + 1, r * 0.34, '#ffffff', 'center');
        break;
      case 'joey': {
        const d = def('benny');
        A.character(ctx, d, { x, y: y + r * 0.8, facing: 1, scale: r / 120, t: 1, pose: 'jump' });
        ctx.strokeStyle = '#f6b3c4'; ctx.lineWidth = 2.5;
        for (const dy of [-0.45, -0.25]) { ctx.beginPath(); ctx.moveTo(x - r * 0.85, y + dy * r); ctx.lineTo(x - r * 0.45, y + dy * r); ctx.stroke(); }
        break;
      }
      case 'pouch':
        ctx.fillStyle = '#c4876a'; ctx.strokeStyle = '#6b3f2a'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.05); ctx.quadraticCurveTo(x, y + r * 0.95, x + r * 0.6, y - r * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(x, y - r * 0.05); ctx.scale(r / 50, r / 50); A.heart(ctx, 0, 0, 0); ctx.restore();
        break;
      case 'shield': {
        // a shield with a tick: not a scratch
        const k = r * 0.62;
        ctx.fillStyle = '#4cc9f0'; ctx.strokeStyle = '#1d5f86'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y - k);
        ctx.quadraticCurveTo(x + k * 0.9, y - k * 0.8, x + k * 0.85, y - k * 0.2); ctx.quadraticCurveTo(x + k * 0.7, y + k * 0.6, x, y + k);
        ctx.quadraticCurveTo(x - k * 0.7, y + k * 0.6, x - k * 0.85, y - k * 0.2); ctx.quadraticCurveTo(x - k * 0.9, y - k * 0.8, x, y - k);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - k * 0.38, y); ctx.lineTo(x - k * 0.08, y + k * 0.3); ctx.lineTo(x + k * 0.42, y - k * 0.3); ctx.stroke();
        break;
      }
      case 'joey5':
        ctx.fillStyle = '#ffd6e2'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        A.portrait(ctx, def('benny'), x - r * 0.18, y + r * 0.05, r * 0.55, t || 0);
        UI.outlineText(ctx, 'Lv5', x + r * 0.38, y + r * 0.42, r * 0.36, '#ff4d6d', 'center');
        break;
      case 'coin': A.coinIcon(ctx, x, y, r * 0.5); break;
      case 'weapon':
        A.weaponIcon(ctx, 'flamer', x, y - r * 0.1, r / 34);
        UI.outlineText(ctx, 'LV3', x, y + r * 0.5, r * 0.32, '#ffd23f', 'center');
        break;
      case 'trophy': trophy(ctx, x, y + r * 0.05, r / 30, false); break;
      case 'crown':
        trophy(ctx, x, y + r * 0.12, r / 34, true);
        UI.outlineText(ctx, 'LEGEND', x, y - r * 0.62, r * 0.24, '#ff4d6d', 'center');
        break;
      default: break;
    }
  }

  MG.StickerArt = {
    // A sticker at (x, y), radius r: a die-cut circle with a white edge and a shine; got = false draws
    // the empty spot (a dashed outline with a ?), hidden ones stay a mystery until you have them.
    draw(ctx, s, x, y, r, got, t) {
      if (!s) return;
      ctx.save();
      if (!got) {
        ctx.strokeStyle = 'rgba(90,60,40,0.5)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        UI.text(ctx, '?', x, y + 2, r * 0.8, 'rgba(90,60,40,0.45)', 'center');
        ctx.restore();
        return;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.arc(x + 2, y + 3, r + 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.clip();
      icon(ctx, s, x, y, r, t);
      // a shine across the top
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.55, r * 0.7, r * 0.28, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.restore();
    },
  };

  // ---------------------------------------------------------------- the book
  MG.StickerScene = class {
    constructor(opts = {}) {
      this.opts = opts;
      this.t = 0;
      this.sel = 0;
      MG.Stickers.check();
      // the ones that are new since the book was last opened get a NEW! tag
      const seen = MG.Save.get('stickersSeen', {}) || {};
      const got = MG.Stickers.got();
      this.fresh = Object.create(null);
      for (const s of MG.Stickers.LIST) if (got[s.id] && !seen[s.id]) this.fresh[s.id] = 1;
      MG.Save.set('stickersSeen', Object.assign({}, got));
      MG.Stickers.toasts.length = 0; // (no pop-up over the book itself)
    }
    enter() { MG.Audio.playMusic('title'); }
    cell(i) { return { x: X0 + (i % COLS) * CELL + CELL / 2, y: Y0 + Math.floor(i / COLS) * ROW_H + ROW_H / 2 }; }
    back() { MG.Audio.select(); MG.Engine.setScene(this.opts.back ? this.opts.back() : new MG.MenuScene()); }

    update(dt) {
      this.t += dt;
      const n = MG.Stickers.LIST.length, M = MG.Menu, I = MG.Input;
      if (M.back() || UI.backTapped()) { this.back(); return; }
      const move = (d) => { this.sel = (this.sel + d + n) % n; MG.Audio.select(); };
      if (M.left()) move(-1);
      if (M.right()) move(1);
      if (M.up()) move(-COLS);
      if (M.down()) move(COLS);
      const p = I.pointer;
      if (p.pressed) {
        for (let i = 0; i < n; i++) {
          const c = this.cell(i);
          if (Math.hypot(p.x - c.x, p.y - c.y) < R + 6) { this.sel = i; MG.Audio.select(); }
        }
      }
    }

    draw(ctx) {
      A.background(ctx, this.t * 20, this.t, MG.GROUND_Y);
      ctx.fillStyle = 'rgba(20,10,30,0.45)'; ctx.fillRect(0, 0, W, H);
      const got = MG.Stickers.got(), list = MG.Stickers.LIST;
      UI.outlineText(ctx, 'STICKER BOOK', W / 2, 36, 34, '#ffd23f', 'center');
      UI.text(ctx, `${MG.Stickers.count()} of ${list.length} stickers`, W / 2, 70, 16, '#ffffff', 'center');
      // the scrapbook page
      ctx.fillStyle = '#f4e3c3';
      ctx.beginPath(); ctx.roundRect(X0 - 14, Y0 - 12, COLS * CELL + 28, ROW_H * 3 + 22, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(150,110,70,0.18)'; ctx.lineWidth = 1;
      for (let ly = Y0 + 18; ly < Y0 + ROW_H * 3; ly += 24) { ctx.beginPath(); ctx.moveTo(X0, ly); ctx.lineTo(X0 + COLS * CELL, ly); ctx.stroke(); }
      list.forEach((s, i) => {
        const c = this.cell(i), have = !!got[s.id];
        if (i === this.sel) {
          ctx.fillStyle = 'rgba(255,210,63,0.45)';
          ctx.beginPath(); ctx.arc(c.x, c.y, R + 9 + Math.sin(this.t * 5) * 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.save();
        ctx.translate(c.x, c.y); ctx.rotate(have ? Math.sin(i * 12.9898) * 0.12 : 0); ctx.translate(-c.x, -c.y);
        MG.StickerArt.draw(ctx, s, c.x, c.y, R, have, this.t);
        ctx.restore();
        if (this.fresh[s.id]) UI.outlineText(ctx, 'NEW!', c.x + R - 4, c.y - R + 4, 12, '#ff4d6d', 'center');
      });
      // the chosen sticker: its name and how to get it
      const s = list[this.sel], have = !!got[s.id];
      const py = Y0 + ROW_H * 3 + 22;
      UI.panel(ctx, 60, py, W - 120, 70);
      const name = have || !s.hidden ? s.name : '???';
      UI.text(ctx, name + (have ? '   ✓ got it!' : ''), 82, py + 22, 20, have ? '#9ef01a' : '#ffd23f');
      UI.text(ctx, have || !s.hidden ? s.how : 'A secret. Keep exploring Marsupial World!', 82, py + 50, 14, '#ffffff');
      if (MG.Touch.enabled) UI.text(ctx, 'Tap a sticker to read about it.', W / 2, H - 14, 13, '#9bf6ff', 'center');
      else {
        const K = UI.menuKeys();
        UI.keyBar(ctx, [[K.arrows, 'look at a sticker'], '|', [K.back, 'back']]);
      }
      UI.backButton(ctx);
    }
  };
})();
