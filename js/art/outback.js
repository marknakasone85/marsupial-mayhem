// The Outback: sky, flat-topped red hills (generic, not any real landmark), red dirt, props and pickups.
(function () {
  const A = MG.Art;
  const W = MG.W, H = MG.H;
  const LINE = '#2b1a14';

  // ---------------------------------------------------------------- background (parallax)
  const FAR = [[0, 0], [40, -70], [210, -76], [250, 0], [420, 0], [450, -40], [560, -44], [600, 0], [780, 0], [830, -96], [1010, -100], [1060, -56], [1150, -58], [1190, 0]];
  const NEAR = [[0, 0], [70, -38], [190, -42], [230, 0], [520, 0], [560, -30], [640, -32], [690, 0], [900, 0], [940, -50], [1080, -54], [1110, 0]];
  const hash = (n) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };

  function range(ctx, pts, span, offset, baseY, color) {
    ctx.fillStyle = color;
    const start = Math.floor(offset / span) - 1;
    for (let k = start; k <= start + Math.ceil(W / span) + 2; k++) {
      const ox = k * span - offset;
      ctx.beginPath();
      ctx.moveTo(ox, baseY);
      for (const [x, y] of pts) ctx.lineTo(ox + x, baseY + y);
      ctx.lineTo(ox + span, baseY);
      ctx.closePath();
      ctx.fill();
    }
  }

  A.background = function (ctx, camX, t, groundY) {
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#3d8fd6');
    sky.addColorStop(0.65, '#8fcfee');
    sky.addColorStop(1, '#f6dcae');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, groundY);
    // sun and a few lazy clouds
    ctx.fillStyle = 'rgba(255,240,180,0.5)';
    ctx.beginPath(); ctx.arc(780, 90, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(780, 90, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 330 - camX * 0.06 - t * 6) % (W + 300) + W + 300) % (W + 300) - 150;
      const cy = 60 + i * 28;
      for (const [dx, dy, r] of [[0, 0, 22], [24, -8, 26], [52, 0, 20], [26, 6, 22]]) {
        ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    const hy = groundY - 40;
    range(ctx, FAR, 1190, camX * 0.15, hy, '#c77b5c');
    range(ctx, NEAR, 1110, camX * 0.35, hy + 18, '#b5543a');
    ctx.fillStyle = '#d06a3d';
    ctx.fillRect(0, hy + 18, W, groundY - hy - 18);
    // red dirt
    const dirt = ctx.createLinearGradient(0, groundY, 0, H);
    dirt.addColorStop(0, '#c4552f');
    dirt.addColorStop(1, '#8a3520');
    ctx.fillStyle = dirt;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = 'rgba(90,30,15,0.35)';
    const first = Math.floor(camX / 37);
    for (let i = first; i < first + W / 37 + 2; i++) {
      const px = i * 37 - camX + hash(i) * 30;
      const py = groundY + 8 + hash(i + 7) * (H - groundY - 14);
      ctx.fillRect(px, py, 3 + hash(i + 3) * 4, 2);
    }
    ctx.fillStyle = '#e07b48';
    ctx.fillRect(0, groundY, W, 3);
  };

  // ---------------------------------------------------------------- decorations (world space)
  A.spinifex = function (ctx, x, y, s) {
    ctx.strokeStyle = '#c9b458';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = -5; i <= 5; i++) {
      const a = -Math.PI / 2 + i * 0.22;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 18 * s, y + Math.sin(a) * (14 + (5 - Math.abs(i)) * 2) * s);
    }
    ctx.stroke();
  };

  A.termiteMound = function (ctx, x, y, h) {
    ctx.fillStyle = '#b5652f';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.28, y);
    ctx.quadraticCurveTo(x - h * 0.22, y - h * 0.6, x - h * 0.06, y - h);
    ctx.quadraticCurveTo(x + h * 0.04, y - h * 1.04, x + h * 0.1, y - h * 0.8);
    ctx.quadraticCurveTo(x + h * 0.24, y - h * 0.5, x + h * 0.3, y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,30,10,0.4)';
    ctx.beginPath();
    ctx.moveTo(x - h * 0.1, y - h * 0.2); ctx.lineTo(x - h * 0.02, y - h * 0.7);
    ctx.moveTo(x + h * 0.12, y - h * 0.1); ctx.lineTo(x + h * 0.06, y - h * 0.5);
    ctx.stroke();
  };

  A.signpost = function (ctx, x, y, text) {
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x - 4, y - 90, 8, 90);
    ctx.font = 'bold 15px ' + MG.UI.FONT;
    const w = ctx.measureText(text).width + 30;
    ctx.fillStyle = '#f1e0b5';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 112); ctx.lineTo(x + w / 2 - 12, y - 112); ctx.lineTo(x + w / 2, y - 98);
    ctx.lineTo(x + w / 2 - 12, y - 84); ctx.lineTo(x - w / 2, y - 84); ctx.closePath();
    ctx.fill(); ctx.stroke();
    MG.UI.text(ctx, text, x - 6, y - 97, 15, '#5a2a12', 'center');
  };

  // Wooden stand (water-tank stand style): a plank top you can jump up through, legs to the ground.
  A.platform = function (ctx, p, groundY) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#7a4a28';
    for (const lx of [p.x + 10, p.x + p.w - 20]) {
      ctx.fillRect(lx, p.y + 12, 10, groundY - p.y - 12);
      ctx.strokeRect(lx, p.y + 12, 10, groundY - p.y - 12);
    }
    ctx.strokeStyle = '#5a3418';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x + 18, p.y + 20); ctx.lineTo(p.x + p.w - 16, groundY - 8);
    ctx.moveTo(p.x + p.w - 18, p.y + 20); ctx.lineTo(p.x + 16, groundY - 8);
    ctx.stroke();
    ctx.fillStyle = '#a0683a';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 14, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,10,0.45)';
    ctx.lineWidth = 1.5;
    for (let x = p.x + 30; x < p.x + p.w - 10; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, p.y + 2); ctx.lineTo(x, p.y + 12); ctx.stroke();
    }
  };

  // ---------------------------------------------------------------- crates and gates
  A.crate = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (o.wobble) ctx.rotate(Math.sin(o.wobble * 60) * 0.08);
    ctx.fillStyle = o.flash ? '#ffffff' : '#c68642';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2.5;
    ctx.fillRect(-23, -46, 46, 46);
    ctx.strokeRect(-23, -46, 46, 46);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, -43); ctx.lineTo(20, -3);
    ctx.moveTo(-23, -23); ctx.lineTo(23, -23);
    ctx.stroke();
    if (o.label) MG.UI.text(ctx, o.label, 0, -32, 8, 'rgba(60,30,10,0.75)', 'center');
    ctx.restore();
  };

  // A stockyard gate across the path; a sign counts the pests still to clear. open: 0..1 (lifts up).
  A.gate = function (ctx, x, groundY, o = {}) {
    const lift = (o.open || 0) * 170;
    ctx.fillStyle = '#6b4226';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.fillRect(x - 30, groundY - 190, 12, 190); ctx.strokeRect(x - 30, groundY - 190, 12, 190);
    ctx.fillRect(x + 18, groundY - 190, 12, 190); ctx.strokeRect(x + 18, groundY - 190, 12, 190);
    ctx.save();
    ctx.translate(0, -lift);
    ctx.strokeStyle = '#9aa5b1';
    ctx.lineWidth = 7;
    for (let i = 0; i < 5; i++) {
      const ry = groundY - 18 - i * 30;
      ctx.beginPath(); ctx.moveTo(x - 18, ry); ctx.lineTo(x + 18, ry); ctx.stroke();
    }
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - 16, groundY - 18); ctx.lineTo(x + 16, groundY - 138); ctx.stroke();
    ctx.restore();
    // checkpoint flag on top: red while closed, green once open
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x + 22, groundY - 236, 4, 46);
    ctx.fillStyle = o.open ? '#52b788' : '#e63946';
    ctx.beginPath();
    ctx.moveTo(x + 26, groundY - 236); ctx.lineTo(x + 56, groundY - 226 + Math.sin((o.t || 0) * 5) * 2); ctx.lineTo(x + 26, groundY - 216);
    ctx.fill();
    if (!o.open && o.left !== undefined) {
      MG.UI.panel(ctx, x - 62, groundY - 262, 124, 30, 'rgba(43,25,61,0.9)');
      MG.UI.text(ctx, o.left === 1 ? '1 PEST LEFT' : o.left + ' PESTS LEFT', x, groundY - 246, 14, '#ffd23f', 'center');
    }
  };

  // The stage's finish line: a banner between two poles, with bunting.
  A.finish = function (ctx, x, groundY, t) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    for (const px of [x - 70, x + 70]) { ctx.fillRect(px - 5, groundY - 200, 10, 200); ctx.strokeRect(px - 5, groundY - 200, 10, 200); }
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.roundRect(x - 80, groundY - 214, 160, 40, 8); ctx.fill(); ctx.stroke();
    MG.UI.text(ctx, 'FINISH', x, groundY - 193, 22, '#2b193d', 'center');
    const cols = ['#e63946', '#3a86ff', '#52b788', '#ffd23f'];
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = cols[i % 4];
      const fx = x - 66 + i * 17, fy = groundY - 168 + Math.sin(t * 4 + i) * 2;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 14, fy); ctx.lineTo(fx + 7, fy + 14); ctx.fill();
    }
  };

  // ---------------------------------------------------------------- pickups
  A.POWER_COLORS = { shield: '#52b788', tea: '#ff9f1c', super: '#ff4d6d' };

  // Small icon for each power-up: a gum leaf, a billy can of tea, a fist.
  A.powerIcon = function (ctx, type, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    if (type === 'shield') {
      ctx.rotate(-0.6);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r * 0.95, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.lineTo(0, r * 0.9); ctx.stroke();
    } else if (type === 'tea') {
      ctx.fillRect(-r * 0.55, -r * 0.45, r * 1.1, r * 1.1);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -r * 0.45, r * 0.55, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(-r * 0.2, -r * 1.25, 3, r * 0.5);
    } else {
      ctx.beginPath(); ctx.roundRect(-r * 0.6, -r * 0.55, r * 1.2, r * 1.1, r * 0.3); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(-r * 0.6 + i * r * 0.3, -r * 0.55); ctx.lineTo(-r * 0.6 + i * r * 0.3, -r * 0.1); ctx.stroke();
      }
    }
    ctx.restore();
  };

  A.powerOrb = function (ctx, type, x, y, t) {
    const by = y - 22 + Math.sin(t * 3) * 4;
    const col = A.POWER_COLORS[type];
    ctx.fillStyle = col + '55';
    ctx.beginPath(); ctx.arc(x, by, 21 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, by, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    A.powerIcon(ctx, type, x, by, 9);
  };

  A.heart = function (ctx, x, y, t) {
    const by = y - 18 + Math.sin(t * 3) * 3;
    const s = 1 + Math.sin(t * 6) * 0.06;
    ctx.save();
    ctx.translate(x, by);
    ctx.scale(s, s);
    ctx.fillStyle = '#ff4d6d';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-22, -2, -12, -20, 0, -8);
    ctx.bezierCurveTo(12, -20, 22, -2, 0, 12);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  A.grenadePack = function (ctx, x, y, t) {
    const by = y - 16 + Math.sin(t * 3) * 3;
    A.grenade(ctx, x - 7, by, { r: 8, pin: true });
    A.grenade(ctx, x + 7, by + 2, { r: 8, pin: true });
    MG.UI.outlineText(ctx, '+2', x + 18, by - 16, 13, '#9ef01a', 'center');
  };

  A.gatlingPickup = function (ctx, x, y, t) {
    const by = y - 20 + Math.sin(t * 3) * 4;
    ctx.fillStyle = 'rgba(255,210,63,0.35)';
    ctx.beginPath(); ctx.arc(x, by, 26 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.fill();
    A.gatling(ctx, x - 12, by, { spin: t });
  };

  A.gumnutSack = function (ctx, x, y, t) {
    const by = y + Math.sin(t * 3) * 2;
    A.oval(ctx, x, by - 14, 13, 14, 0, '#d8c08a', LINE, 2);
    ctx.fillStyle = '#d8c08a';
    ctx.beginPath(); ctx.moveTo(x - 6, by - 26); ctx.lineTo(x, by - 32); ctx.lineTo(x + 6, by - 26); ctx.fill();
    for (const [dx, dy] of [[-4, -16], [4, -12], [0, -8]]) A.oval(ctx, x + dx, by + dy, 3.4, 3, 0, '#8a5a2b');
  };

  // ---------------------------------------------------------------- projectiles
  A.projectile = function (ctx, kind, x, y, t, dir) {
    if (kind === 'gumnut') {
      A.oval(ctx, x, y, 5.5, 4.5, 0, '#8a5a2b', LINE, 1.5);
      ctx.fillStyle = '#5a3418';
      ctx.fillRect(x - 3 * dir - 1, y - 4, 2, 8);
    } else if (kind === 'dust') {
      ctx.fillStyle = 'rgba(214,150,105,0.8)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(x - dir * i * 12, y - 8 - (i % 2) * 6, 14 - i * 2 + Math.sin(t * 20 + i) * 2, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      A.oval(ctx, x, y, 6, 6, 0, '#ffd23f');
    }
  };
})();
