// Title screen: an Outback sunset with the whole cast (and their joeys) lined up on both sides of the
// menu, doing a Mexican wave now and then, a logo that drops in letter by letter, a kangaroo hopping
// along the horizon, galahs, and a Smile Squad quokka grinning from the top of a mesa.
(function () {
  const W = MG.W, H = MG.H;
  const UI = MG.UI;
  const A = MG.Art;
  const HORIZON = 372;
  const FOOTER = 'Marsupial Mayhem™ © 2026 Mark A. Nakasone. All rights reserved.';

  // Flat-topped red mesas on the horizon (generic outback hills, not any real landmark).
  const MESAS = [
    [[30, 0], [62, -46], [150, -50], [176, 0]],
    [[150, 0], [170, -24], [228, -26], [246, 0]],
    [[560, 0], [592, -62], [700, -66], [724, -38], [790, -40], [812, 0]],
    [[820, 0], [842, -30], [910, -32], [940, 0]],
  ];
  // Spinifex clumps on the red dirt: [x, y, size].
  const SPINIFEX = [[40, 420, 1], [120, 470, 1.3], [250, 408, 0.8], [700, 430, 1.1], [860, 470, 1.4], [930, 400, 0.8], [520, 505, 1]];
  const STARS = Array.from({ length: 40 }, (_, i) => [(i * 197) % W, (i * 89) % 150, (i % 3) + 1]);

  // The cast: [id, x, feet y, size, facing]. Drawn in this order (back rows first). The two secret
  // characters stand at the very back once they're unlocked on this device.
  const CAST = [
    ['ghost', 186, 402, 0.52, 1], ['cuscus', 778, 402, 0.52, -1],
    ['stripes', 40, 448, 0.72, 1], ['zip', 130, 448, 0.72, 1], ['stinker', 236, 448, 0.72, 1],
    ['earl', 726, 448, 0.72, -1], ['paddles', 828, 448, 0.72, -1], ['deadfred', 922, 448, 0.72, -1],
    ['chompers', 62, 514, 0.92, 1], ['tank', 172, 514, 0.92, 1], ['boomer', 284, 514, 0.95, 1],
    ['benny', 676, 514, 0.95, -1], ['drowsy', 784, 514, 0.92, -1], ['bins', 892, 514, 0.92, -1],
  ];
  const WAVE = 9;       // seconds between Mexican waves
  const HOP = 0.55;     // how long one hop takes
  const BIRDS = [[0, 132, 1], [70, 118, 0.8], [130, 140, 0.9], [520, 96, 0.7], [580, 108, 0.6]];
  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  function bounce(k) { // ease-out bounce: fall, then two little bounces
    if (k < 1 / 2.75) return 7.5625 * k * k;
    if (k < 2 / 2.75) { k -= 1.5 / 2.75; return 7.5625 * k * k + 0.75; }
    if (k < 2.5 / 2.75) { k -= 2.25 / 2.75; return 7.5625 * k * k + 0.9375; }
    k -= 2.625 / 2.75; return 7.5625 * k * k + 0.984375;
  }
  let logoShown = false; // the logo drops in once per visit to the page

  // One word of the logo, letter by letter: dropping in (intro: seconds since it started, or null),
  // a gentle wave, a chunky 3D edge, and a shine that sweeps across now and then.
  function drawWord(ctx, word, cx, cy, size, color, edge, t, intro, delay, tilt) {
    ctx.save();
    ctx.font = `bold ${size}px ${UI.FONT}`;
    const chars = Array.from(word);
    const ws = chars.map((c) => ctx.measureText(c).width * 1.02);
    const total = ws.reduce((a, b) => a + b, 0);
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    let x = -total / 2;
    chars.forEach((c, i) => {
      const w = ws[i], lx = x + w / 2;
      x += w;
      const k = intro === null ? 1 : clamp01((intro - delay - i * 0.07) / 0.6);
      if (k <= 0) return;
      const ly = (1 - bounce(k)) * -300 + Math.sin(t * 3 - i * 0.55) * 3;
      UI.outlineText(ctx, c, lx, ly + 7, size, '#2b193d', 'center');
      UI.outlineText(ctx, c, lx, ly + 3.5, size, edge, 'center', edge);
      UI.outlineText(ctx, c, lx, ly, size, color, 'center');
      const shine = clamp01(1 - Math.abs(((t * 7) % 34) - delay * 10 - i) / 1.5);
      if (shine > 0) {
        ctx.globalAlpha = shine * 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c, lx, ly);
        ctx.globalAlpha = 1;
      }
    });
    ctx.restore();
  }

  // A member of the cast, with their joey; hops in the Mexican wave, cheers now and then.
  function drawMember(ctx, def, x, y, size, f, t, i) {
    const d = Object.assign({}, def, { scale: def.scale * size });
    const u = ((t - 1.2 - x / W * 1.3) % WAVE + WAVE) % WAVE; // time since the wave reached them
    const roo = def.art === 'kangaroo';
    let lift = 0, pose = 'idle';
    if (u < HOP) { lift = Math.sin(u / HOP * Math.PI) * (roo ? 34 : 22) * size; pose = roo ? 'jump' : 'win'; }
    else if (i % 3 === 1 && u > 4.6 && u < 5.6) pose = 'win'; // a little cheer
    A.shadow(ctx, x, y + 2, (34 - lift * 0.3) * size * def.scale * 1.3);
    if (u >= HOP && u < HOP + 0.4) {
      // a puff of red dust where they land
      const k = (u - HOP) / 0.4;
      ctx.fillStyle = `rgba(232,160,110,${(0.55 * (1 - k)).toFixed(3)})`;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * (14 + k * 26) * size, y - 4 - k * 6, (8 + k * 8) * size, (5 + k * 4) * size, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    const st = { x, y: y - lift, f, pose, t: t + i * 0.7 };
    if (def.ghostly) ctx.globalAlpha = 0.7 + 0.15 * Math.sin(t * 2 + i);
    A.character(ctx, def, { x, y: y - lift, facing: f, scale: d.scale, t: st.t, pose });
    if (A.joey && def.joey) A.joey(ctx, d, st, [0, 0, false, 1, f]);
    ctx.globalAlpha = 1;
  }

  // A kangaroo silhouette facing right, feet at (0, 0). air = 0 on the ground, 1 at the top of a hop.
  function drawRoo(ctx, x, y, s, air, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    const lean = 0.25 + air * 0.25;
    // tail: long and thick, the kangaroo's fifth leg
    ctx.beginPath();
    ctx.moveTo(-8, -34);
    ctx.quadraticCurveTo(-46, -26 + air * 6, -78, -6 + air * 10);
    ctx.lineTo(-74, 2 + air * 10);
    ctx.quadraticCurveTo(-42, -12 + air * 6, -4, -20);
    ctx.closePath();
    ctx.fill();
    // body, thigh, big feet
    ctx.beginPath(); ctx.ellipse(2, -48, 24, 36, -lean, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6, -24, 20, 15, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -4 - air * 4, 24, 5, air * 0.35, 0, Math.PI * 2); ctx.fill();
    // neck and head, snout, ears
    ctx.beginPath(); ctx.ellipse(18, -78, 9, 14, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(26, -92, 11, 9, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(36, -88, 9, 5.5, 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(19, -106, 4, 12, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(25, -107, 4, 12, -0.1, 0, Math.PI * 2); ctx.fill();
    // little arm
    ctx.beginPath(); ctx.ellipse(26, -60, 3.5, 11, -0.7, 0, Math.PI * 2); ctx.fill();
    // joey peeking out of the pouch
    ctx.beginPath(); ctx.arc(22, -42, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(19, -51, 2.5, 6, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawSpinifex(ctx, x, y, s, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = -5; i <= 5; i++) {
      const a = -Math.PI / 2 + i * 0.22;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 18 * s, y + Math.sin(a) * (14 + (5 - Math.abs(i)) * 2) * s);
    }
    ctx.stroke();
  }

  MG.MenuScene = class {
    constructor(opts = {}) {
      this.t = 0;
      this.page = null;                  // 'controls' while the controls page is open
      this.info = opts.notice ? [opts.notice] : null; // a message panel (lines of text)
      this.notice = opts.notice || null;
      const items = [
        { label: 'PLAY', act: () => MG.Engine.setScene(new MG.SelectScene({ mode: 'campaign' })) },
        { label: '2 PLAYERS', act: () => MG.Engine.setScene(new MG.SelectScene({ mode: 'coop' })) },
        { label: 'TOURNAMENT DUEL', act: () => MG.Engine.setScene(new MG.DuelMenuScene()) },
        { label: 'SHOP', act: () => MG.Engine.setScene(new MG.ShopScene({ fromMenu: true })) },
      ];
      // No WI-FI button on public web pages (GitHub Pages): they can't reach a home share.
      if (!MG.Net.webOnly()) items.push({ label: 'WI-FI', act: () => MG.Engine.setScene(new MG.WifiScene()) });
      items.push(
        { label: 'CONTROLS', act: () => { this.page = 'controls'; this.pageT = 0; } },
        { label: 'SETTINGS', act: () => MG.Engine.setScene(new MG.SettingsScene()) },
      );
      this.menu = new MG.MenuList(items, W / 2, 222, { w: 290, h: 30, gap: 5, fontSize: 18 });
    }

    say(lines) { this.info = lines; this.infoT = 0; }

    enter() { MG.Audio.playMusic('title'); }

    update(dt) {
      this.t += dt;
      if (this.intro === undefined) this.intro = logoShown ? null : 0;
      if (this.intro !== null) { this.intro += dt; if (this.intro > 2.4) { this.intro = null; logoShown = true; } }
      if (this.page) {
        this.pageT += dt;
        if (this.pageT > 0.1 && (MG.Input.anyPressed() || UI.backTapped())) this.page = null;
        return;
      }
      if (this.info) {
        this.infoT = (this.infoT || 0) + dt;
        if (this.infoT > 0.1 && (MG.Input.anyPressed() || UI.backTapped())) this.info = null;
        return;
      }
      const chosen = this.menu.update(dt);
      if (chosen) chosen.act();
    }

    draw(ctx) {
      const t = this.t;
      // sunset sky
      const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
      sky.addColorStop(0, '#1b1430');
      sky.addColorStop(0.45, '#6a2c70');
      sky.addColorStop(0.8, '#f08a4b');
      sky.addColorStop(1, '#ffc15e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, HORIZON);
      ctx.fillStyle = '#ffffff';
      for (const [x, y, r] of STARS) {
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + x);
        ctx.fillRect(x, y, r, r);
      }
      ctx.globalAlpha = 1;
      // setting sun, with slow rays fanning out behind the mesas
      ctx.save();
      ctx.translate(690, HORIZON);
      ctx.rotate(t * 0.04);
      ctx.fillStyle = 'rgba(255,214,140,0.10)';
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(560, -40); ctx.lineTo(560, 40); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      const glow = ctx.createRadialGradient(690, HORIZON, 60, 690, HORIZON, 300);
      glow.addColorStop(0, 'rgba(255,200,120,0.5)');
      glow.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(390, HORIZON - 300, 600, 300);
      ctx.fillStyle = 'rgba(255,214,102,0.35)';
      ctx.beginPath(); ctx.arc(690, HORIZON, 120, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(690, HORIZON, 82, 0, Math.PI * 2); ctx.fill();
      // galahs flapping across the sky
      ctx.strokeStyle = 'rgba(43,25,61,0.75)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const [bx, by, bs] of BIRDS) {
        const x = ((bx + t * 22 * bs) % (W + 120)) - 60, y = by + Math.sin(t * 1.3 + bx) * 6, fl = Math.sin(t * 9 + bx) * 5 * bs;
        ctx.beginPath(); ctx.moveTo(x - 9 * bs, y - fl); ctx.quadraticCurveTo(x - 4 * bs, y - 4 * bs, x, y); ctx.quadraticCurveTo(x + 4 * bs, y - 4 * bs, x + 9 * bs, y - fl); ctx.stroke();
      }
      // mesas
      ctx.fillStyle = '#9c3d2c';
      for (const m of MESAS) {
        ctx.beginPath();
        m.forEach(([x, y], i) => (i ? ctx.lineTo(x, HORIZON + y) : ctx.moveTo(x, HORIZON + y)));
        ctx.closePath();
        ctx.fill();
      }
      // a Smile Squad quokka on top of the far mesa, waving... and grinning now and then
      if (A.quokka) {
        const grin = clamp01(Math.sin(((t % 11) - 7.5) / 2.2 * Math.PI) * 3) * (t % 11 > 7.5 && t % 11 < 9.7 ? 1 : 0);
        A.quokka(ctx, 112, HORIZON - 48, { t, facing: 1, scale: 0.5, shirt: true, wave: grin < 0.2, grin });
        if (grin > 0.6) {
          ctx.fillStyle = '#ffffff';
          const sp = 3 + Math.sin(t * 20) * 1.5;
          ctx.beginPath(); ctx.moveTo(128, HORIZON - 74 - sp); ctx.lineTo(129.5, HORIZON - 74); ctx.lineTo(128, HORIZON - 74 + sp); ctx.lineTo(126.5, HORIZON - 74); ctx.closePath(); ctx.fill();
        }
      }
      // red dirt
      const dirt = ctx.createLinearGradient(0, HORIZON, 0, H);
      dirt.addColorStop(0, '#c4552f');
      dirt.addColorStop(1, '#7a2e1d');
      ctx.fillStyle = dirt;
      ctx.fillRect(0, HORIZON, W, H - HORIZON);
      // warm light across the dirt from the sun
      const lit = ctx.createRadialGradient(690, HORIZON, 20, 690, HORIZON, 420);
      lit.addColorStop(0, 'rgba(255,190,110,0.35)');
      lit.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = lit;
      ctx.fillRect(270, HORIZON, 690, H - HORIZON);
      for (const [x, y, s] of SPINIFEX) drawSpinifex(ctx, x, y, s, '#c9b458');

      // a kangaroo far away, hopping along the horizon, left to right, again and again
      const cycle = 0.62;
      const hop = (t % cycle) / cycle;
      const air = Math.sin(hop * Math.PI);
      const rx = ((t * 60) % (W + 160)) - 80;
      const groundY = HORIZON + 22;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(rx, groundY + 1, 18 - air * 6, 3, 0, 0, Math.PI * 2); ctx.fill();
      drawRoo(ctx, rx, groundY - air * 26, 0.36, air, '#5a2438');

      // the cast
      CAST.forEach(([id, x, y, size, f], i) => {
        const def = MG.charById(id);
        if (!def || (MG.SECRETS.some((c) => c.id === id) && !MG.Unlocks.has(id))) return;
        drawMember(ctx, def, x, y, size, f, t, i);
      });

      // title: a soft glow, then the letters
      const lg = ctx.createRadialGradient(W / 2, 110, 20, W / 2, 110, 300);
      lg.addColorStop(0, 'rgba(255,170,90,0.35)');
      lg.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(W / 2 - 300, 0, 600, 260);
      const intro = this.intro === undefined ? (logoShown ? null : 0) : this.intro;
      const wob = Math.sin(t * 2.2) * 0.03;
      drawWord(ctx, 'MARSUPIAL', W / 2, 74, 68, '#ffd23f', '#e08a1e', t, intro, 0, -0.04 + wob);
      drawWord(ctx, 'MAYHEM™', W / 2, 146, 76, '#ff4d6d', '#b8203f', t, intro, 0.55, 0.03 - wob);
      UI.outlineText(ctx, 'The Great Pouch Tournament is about to begin...', W / 2, 202, 18, '#ffffff', 'center');

      this.menu.draw(ctx);
      UI.text(ctx, FOOTER, W / 2, H - 12, 12, 'rgba(255,255,255,0.75)', 'center');

      if (this.page === 'controls') {
        UI.fade(ctx, 0.5);
        UI.controlsPanel(ctx);
        UI.backButton(ctx);
      } else if (this.info) {
        UI.fade(ctx, 0.5);
        const h = 70 + this.info.length * 30;
        UI.panel(ctx, 150, H / 2 - h / 2, W - 300, h);
        this.info.forEach((line, i) => {
          UI.text(ctx, line, W / 2, H / 2 - h / 2 + 34 + i * 30, i === 0 ? 24 : 18, i === 0 ? '#ffd23f' : '#ffffff', 'center');
        });
        UI.text(ctx, 'Press any key or tap to go back.', W / 2, H / 2 + h / 2 - 22, 13, '#9bf6ff', 'center');
        UI.backButton(ctx);
      }
    }
  };
  MG.MenuScene.FOOTER = FOOTER;
})();
