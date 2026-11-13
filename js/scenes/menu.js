// Title screen: an Outback sunset, a hopping kangaroo with a joey in its pouch, and the menu.
(function () {
  const W = MG.W, H = MG.H;
  const UI = MG.UI;
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
        { label: 'PLAY', act: () => MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 })) },
        { label: '2 PLAYERS', act: () => MG.Engine.setScene(new MG.CampaignScene({ level: 0, players: [
          { id: 0, cid: 'boomer', local: 'P1' }, { id: 1, cid: 'boomer', local: 'P2' },
        ] })) },
      ];
      // No WI-FI button on public web pages (GitHub Pages): they can't reach a home share.
      if (!MG.Net.webOnly()) items.push({ label: 'WI-FI', act: () => this.say(this.wifiInfo()) });
      items.push(
        { label: 'CONTROLS', act: () => { this.page = 'controls'; this.pageT = 0; } },
        { label: () => 'BLOOD: ' + (MG.Settings.blood ? 'ON' : 'OFF'), act: () => MG.toggleBlood() },
        { label: () => 'SOUND: ' + (MG.Audio.muted ? 'OFF' : 'ON'), act: () => MG.Audio.toggleMute() },
      );
      this.menu = new MG.MenuList(items, W / 2, 226, { w: 270, h: 38, gap: 7, fontSize: 20 });
    }

    wifiInfo() {
      if (MG.Net.available()) {
        return ['Wi-Fi games for 2-4 players are coming soon.', 'This computer is sharing the game, so friends can already open it.'];
      }
      return ['Wi-Fi games for 2-4 players are coming soon.',
        'To share the game at home, double-click', 'share-on-network.command in the game folder.'];
    }

    say(lines) { this.info = lines; this.infoT = 0; }

    enter() { MG.Audio.playMusic('title'); }

    update(dt) {
      this.t += dt;
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
      // setting sun
      ctx.fillStyle = 'rgba(255,214,102,0.35)';
      ctx.beginPath(); ctx.arc(690, HORIZON, 120, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(690, HORIZON, 82, 0, Math.PI * 2); ctx.fill();
      // mesas
      ctx.fillStyle = '#9c3d2c';
      for (const m of MESAS) {
        ctx.beginPath();
        m.forEach(([x, y], i) => (i ? ctx.lineTo(x, HORIZON + y) : ctx.moveTo(x, HORIZON + y)));
        ctx.closePath();
        ctx.fill();
      }
      // red dirt
      const dirt = ctx.createLinearGradient(0, HORIZON, 0, H);
      dirt.addColorStop(0, '#c4552f');
      dirt.addColorStop(1, '#7a2e1d');
      ctx.fillStyle = dirt;
      ctx.fillRect(0, HORIZON, W, H - HORIZON);
      for (const [x, y, s] of SPINIFEX) drawSpinifex(ctx, x, y, s, '#c9b458');

      // Boomer-to-be hops across the front, left to right, again and again
      const cycle = 0.62;
      const hop = (t % cycle) / cycle;
      const air = Math.sin(hop * Math.PI);
      const rx = ((t * 150) % (W + 260)) - 130;
      const groundY = 500;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(rx, groundY + 2, 46 - air * 16, 7, 0, 0, Math.PI * 2); ctx.fill();
      drawRoo(ctx, rx, groundY - air * 70, 0.95, air, '#2b193d');

      // title
      const wob = Math.sin(t * 2.2) * 0.03;
      ctx.save();
      ctx.translate(W / 2, 74);
      ctx.rotate(-0.04 + wob);
      UI.outlineText(ctx, 'MARSUPIAL', 0, 0, 68, '#ffd23f', 'center');
      ctx.restore();
      ctx.save();
      ctx.translate(W / 2, 146);
      ctx.rotate(0.03 - wob);
      UI.outlineText(ctx, 'MAYHEM™', 0, 0, 76, '#ff4d6d', 'center');
      ctx.restore();
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
