// The pests: rabbits (and Big Buck), feral cats, feral pigs, plus the long grass cats hide in.
// Facing right, feet at (0, 0). o: { t, facing, scale, flash, air, crouch, charging, colors }
(function () {
  const A = MG.Art;
  const LINE = '#2b1a14';
  const white = (o, col) => (o.flash ? '#ffffff' : col);

  // ---------------------------------------------------------------- European rabbit
  const RABBIT = { fur: '#9c8a78', dark: '#6f5f52', belly: '#d9cbb8', ear: '#e8a9a0' };
  A.rabbit = function (ctx, x, y, o) {
    const c = Object.assign({}, RABBIT, o.colors || {});
    const s = o.scale || 1;
    const air = o.air ? 1 : 0;
    const crouch = o.crouch ? 1 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round';
    // tail puff, back foot, body, front paw
    A.oval(ctx, -17, -15 + crouch * 3, 6.5, 6, 0, white(o, '#ffffff'), LINE, 1.6);
    A.oval(ctx, air ? -14 : -6, air ? -6 : -3, 11, 4, air ? 0.5 : 0, white(o, c.dark), LINE, 1.6);
    A.oval(ctx, -2, -15 + crouch * 3, air ? 18 : 16, air ? 10 : 12.5, air ? -0.35 : -0.15, white(o, c.fur), LINE, 2);
    A.oval(ctx, 4, -11 + crouch * 3, 8, 7, 0, white(o, c.belly));
    A.oval(ctx, air ? 16 : 10, air ? -10 : -3, 4.5, 3, 0, white(o, c.dark), LINE, 1.4);
    // head and long ears (flattened back mid-hop)
    const hx = 12, hy = -25 + crouch * 4;
    const earTilt = air ? -0.9 : -0.35;
    A.oval(ctx, hx - 7, hy - 13, 3.8, 11.5, earTilt, white(o, c.fur), LINE, 1.6);
    A.oval(ctx, hx - 7, hy - 12, 1.6, 8, earTilt, white(o, c.ear));
    A.oval(ctx, hx - 2, hy - 14, 3.8, 11.5, earTilt + 0.25, white(o, c.fur), LINE, 1.6);
    A.oval(ctx, hx - 2, hy - 13, 1.6, 8, earTilt + 0.25, white(o, c.ear));
    A.oval(ctx, hx, hy, 9.5, 8.5, 0, white(o, c.fur), LINE, 2);
    // angry eye, pink nose, buck teeth, whiskers
    A.oval(ctx, hx + 3, hy - 2, 2.8, 3, 0, '#ffffff', LINE, 1);
    A.oval(ctx, hx + 3.8, hy - 1.6, 1.5, 1.7, 0, '#c1121f');
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(hx - 1, hy - 6); ctx.lineTo(hx + 6, hy - 4); ctx.stroke();
    A.oval(ctx, hx + 9, hy + 1, 1.8, 1.4, 0, '#e07a8a');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx + 6, hy + 4, 2.4, 3.6);
    ctx.fillRect(hx + 8.4, hy + 4, 2.4, 3.6);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx + 9, hy + 2); ctx.lineTo(hx + 17, hy);
    ctx.moveTo(hx + 9, hy + 3); ctx.lineTo(hx + 17, hy + 4);
    ctx.stroke();
    if (o.bandana) {
      // Big Buck's red bandana
      ctx.fillStyle = '#d62828';
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4, 10, 3.5, -0.15, Math.PI, Math.PI * 2);
      ctx.lineTo(hx + 10, hy - 2);
      ctx.lineTo(hx - 10, hy - 3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 9, hy - 4); ctx.lineTo(hx - 17, hy - 9 + Math.sin((o.t || 0) * 8) * 2); ctx.lineTo(hx - 16, hy - 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- feral cat
  const CAT = { fur: '#7d6e5d', stripe: '#4f4337', belly: '#b9aa94' };
  A.cat = function (ctx, x, y, o) {
    const c = Object.assign({}, CAT, o.colors || {});
    const s = o.scale || 1;
    const low = o.crouch ? 7 : 0;
    const air = o.air ? 1 : 0;
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // tail (flicks while crouching)
    ctx.fillStyle = white(o, c.fur);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.8;
    const flick = o.crouch ? Math.sin(t * 14) * 6 : Math.sin(t * 2) * 3;
    A.taper(ctx, -24, -22 + low, -40, -26 + low, -42 + flick, -44 + low, 7, 4);
    ctx.fill(); ctx.stroke();
    // legs: stretched out in a pounce, tucked when crouching
    const legs = air ? [[-18, -14, -34, -6], [-12, -14, -26, -4], [16, -18, 34, -12], [20, -16, 38, -6]]
      : [[-18, -12, -19, 0], [-12, -12, -11, 0], [14, -12, 13, 0], [20, -12, 21, 0]];
    legs.forEach(([x0, y0, x1, y1], i) => {
      ctx.fillStyle = white(o, i % 2 ? c.fur : c.stripe);
      A.taper(ctx, x0, y0 + low, (x0 + x1) / 2, (y0 + y1) / 2 + low * 0.5, x1, y1 + (air ? 0 : low * 0.1), 7, 5);
      ctx.fill(); ctx.stroke();
    });
    // body with tabby stripes
    A.oval(ctx, 0, -21 + low, 27, 12.5, air ? -0.1 : 0, white(o, c.fur), LINE, 2);
    A.oval(ctx, 4, -15 + low, 18, 6, 0, white(o, c.belly));
    if (!o.flash) {
      ctx.strokeStyle = c.stripe;
      ctx.lineWidth = 3;
      for (let i = -2; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 9 - 2, -32 + low);
        ctx.quadraticCurveTo(i * 9 + 2, -26 + low, i * 9, -21 + low);
        ctx.stroke();
      }
    }
    // head, ears, glaring eyes
    const hx = 25, hy = -30 + low * 1.2;
    ctx.fillStyle = white(o, c.fur);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.8;
    for (const ex of [-6, 4]) {
      ctx.beginPath();
      ctx.moveTo(hx + ex - 4, hy - 6); ctx.lineTo(hx + ex, hy - 17); ctx.lineTo(hx + ex + 5, hy - 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    A.oval(ctx, hx, hy, 11.5, 10, 0, white(o, c.fur), LINE, 2);
    A.oval(ctx, hx + 4, hy - 1, 3.6, 3.2, 0, '#d4e157', LINE, 1);
    A.oval(ctx, hx + 4.4, hy - 1, 0.9, 2.8, 0, '#111111');
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx - 1, hy - 6); ctx.lineTo(hx + 8, hy - 4); ctx.stroke();
    A.oval(ctx, hx + 10, hy + 3, 1.8, 1.3, 0, '#e07a8a');
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy + 4); ctx.lineTo(hx + 19, hy + 2);
    ctx.moveTo(hx + 10, hy + 5); ctx.lineTo(hx + 19, hy + 7);
    ctx.stroke();
    if (o.crouch || air) {
      // hissing mouth with fangs
      A.oval(ctx, hx + 7, hy + 6, 3.5, 2.5, 0, '#5a1a1a');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx + 5, hy + 4, 1.4, 2.5);
      ctx.fillRect(hx + 8, hy + 4, 1.4, 2.5);
    }
    ctx.restore();
  };

  // Only the eyes show while a cat hides in the long grass.
  A.catEyes = function (ctx, x, y, t, facing) {
    if (Math.sin(t * 1.7) > 0.93) return; // blink
    const dx = (facing || 1) * 6;
    ctx.fillStyle = '#d4e157';
    for (const ex of [-5, 5]) {
      ctx.beginPath(); ctx.ellipse(x + ex + dx, y, 3.6, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#111';
    for (const ex of [-5, 5]) ctx.fillRect(x + ex + dx - 0.6, y - 2.2, 1.2, 4.4);
  };

  // ---------------------------------------------------------------- feral pig
  const PIG = { hide: '#4a3b36', bristle: '#2e2421', snout: '#c98f84', tusk: '#fff8e7' };
  A.pig = function (ctx, x, y, o) {
    const c = Object.assign({}, PIG, o.colors || {});
    const s = o.scale || 1;
    const t = o.t || 0;
    const charge = o.charging ? 1 : 0;
    const trot = charge ? Math.sin(t * 30) * 4 : o.moving ? Math.sin(t * 14) * 2.5 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (charge) {
      // dust clouds kicked up behind
      ctx.fillStyle = 'rgba(210,150,110,0.55)';
      for (let i = 0; i < 3; i++) {
        const k = ((t * 3 + i / 3) % 1);
        ctx.beginPath(); ctx.arc(-46 - k * 40, -8 - k * 10, 6 + k * 10, 0, Math.PI * 2); ctx.fill();
      }
    }
    // curly tail
    ctx.strokeStyle = white(o, c.hide);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-44, -36, 5, 0, Math.PI * 1.6); ctx.stroke();
    // legs
    ctx.fillStyle = white(o, c.bristle);
    for (const [lx, ph] of [[-26, 0], [-14, 1], [18, 1], [28, 0]]) {
      const sw = ph ? trot : -trot;
      ctx.beginPath(); ctx.roundRect(lx - 4 + sw, -16, 8, 16, 3); ctx.fill();
    }
    // body and back bristles
    A.oval(ctx, -4, -29, 39, 21, charge ? 0.06 : 0, white(o, c.hide), LINE, 2.2);
    ctx.strokeStyle = white(o, c.bristle);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const bx = -34 + i * 6.5, by = -47 - Math.sin((i / 10) * Math.PI) * 3;
      ctx.moveTo(bx, by + 4); ctx.lineTo(bx + 2, by - 4);
    }
    ctx.stroke();
    // head (lowered for a charge), snout, tusks, ear, angry eye
    ctx.save();
    ctx.translate(30, -30 + charge * 8);
    ctx.rotate(0.25 + charge * 0.35);
    A.oval(ctx, 0, 0, 17, 14, 0, white(o, c.hide), LINE, 2);
    ctx.fillStyle = white(o, c.hide);
    ctx.strokeStyle = LINE;
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-4, -22); ctx.lineTo(4, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, 16, 2, 6, 8, 0, white(o, c.snout), LINE, 1.8);
    A.oval(ctx, 17, 0, 1.2, 2, 0, LINE);
    A.oval(ctx, 17, 4.5, 1.2, 2, 0, LINE);
    ctx.fillStyle = c.tusk;
    ctx.beginPath(); ctx.moveTo(9, 7); ctx.quadraticCurveTo(14, 5, 13, -2); ctx.lineTo(11, 7); ctx.fill();
    A.oval(ctx, 5, -4, 2.6, 2.4, 0, '#ffd23f');
    A.oval(ctx, 5.6, -3.8, 1.2, 1.4, 0, '#111');
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(9, -6); ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  // ---------------------------------------------------------------- long grass
  // Tall golden grass along x..x+w; front = the shorter fringe drawn over the characters.
  A.grass = function (ctx, x, w, groundY, t, front) {
    const n = Math.max(3, Math.floor(w / 7));
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const bx = x + (i / (n - 1)) * w;
      const seed = Math.sin(bx * 12.9898) * 43758.5453;
      const r = seed - Math.floor(seed);
      const h = (front ? 22 : 46) + r * (front ? 14 : 26);
      const sway = Math.sin(t * 1.6 + bx * 0.05) * (front ? 3 : 5);
      ctx.strokeStyle = r < 0.33 ? '#b8913a' : r < 0.66 ? '#d9b44a' : '#e8c86a';
      ctx.lineWidth = front ? 3 : 3.5;
      ctx.beginPath();
      ctx.moveTo(bx, groundY + 2);
      ctx.quadraticCurveTo(bx + sway * 0.4, groundY - h * 0.6, bx + sway + (r - 0.5) * 10, groundY - h);
      ctx.stroke();
    }
  };
})();
