// Creatures for worlds 4-7, drawn in code: red foxes and Foxy Roxy, hypnotised pademelons, the reptilians
// (perentie, lace monitor, inland taipan, death adder, frilled lizard, thorny devil, the saltwater crocodile
// on land and the Croc Emperor), the Grand Grinner on his throne of quokka plushies, the Time Rift giants
// (Diprotodon, Thylacoleo, Procoptodon) and two friends (a mountain pygmy possum and a sloth cameo from
// The Sloth Slap Game).
// Like pests.js: facing right, drawn at the feet (x, y).
// o: { t (seconds), facing (1 | -1), scale, flash (white hit flash), crouch, charging, air, moving, colors, ... }
(function () {
  const A = MG.Art;
  const LINE = '#2b1a14';
  const TAU = Math.PI * 2;
  const white = (o, col) => (o.flash ? '#ffffff' : col);
  const k01 = (v) => Math.max(0, Math.min(1, +v || 0));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => k * k * (3 - 2 * k);

  // ---------------------------------------------------------------- little helpers
  function begin(ctx, x, y, o) {
    const s = o.scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }
  function circ(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  // Points along a quadratic or cubic curve.
  function quad(x0, y0, cx, cy, x1, y1, n) {
    const P = [];
    for (let i = 0; i <= n; i++) { const k = i / n, m = 1 - k; P.push([m * m * x0 + 2 * m * k * cx + k * k * x1, m * m * y0 + 2 * m * k * cy + k * k * y1]); }
    return P;
  }
  function cubic(p0, p1, p2, p3, n) {
    const P = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, m = 1 - k;
      P.push([m * m * m * p0[0] + 3 * m * m * k * p1[0] + 3 * m * k * k * p2[0] + k * k * k * p3[0],
        m * m * m * p0[1] + 3 * m * m * k * p1[1] + 3 * m * k * k * p2[1] + k * k * k * p3[1]]);
    }
    return P;
  }
  // A band along a polyline: w0 wide at the first point, w1 at the last (wf(k) overrides the width).
  function strip(ctx, pts, w0, w1, wf) {
    const n = pts.length - 1, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const w = (wf ? wf(i / n) : lerp(w0, w1, i / n)) / 2;
      L.push([pts[i][0] - (dy / len) * w, pts[i][1] + (dx / len) * w]);
      R.push([pts[i][0] + (dy / len) * w, pts[i][1] - (dx / len) * w]);
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i <= n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
  }
  // Short marks across a polyline (bands on tails and snakes): at fractions ks, half-width hw(k).
  function bands(ctx, pts, ks, hw) {
    const n = pts.length - 1;
    ctx.beginPath();
    for (const k of ks) {
      const i = Math.min(n - 1, Math.floor(k * n)), a = pts[i], b = pts[i + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, w = hw(k);
      ctx.moveTo(a[0] - (dy / len) * w, a[1] + (dx / len) * w);
      ctx.lineTo(a[0] + (dy / len) * w, a[1] - (dx / len) * w);
    }
    ctx.stroke();
  }
  // A tapered spiral (a tail tip curling round), heading off in direction a0.
  function curl(ctx, x, y, a0, r, turn, w0, w1) {
    const P = [];
    let px = x, py = y, a = a0;
    for (let i = 0; i <= 16; i++) {
      P.push([px, py]);
      const step = (Math.abs(turn) * r * (1 - (i / 16) * 0.55)) / 16;
      a += turn / 16;
      px += Math.cos(a) * step; py += Math.sin(a) * step;
    }
    strip(ctx, P, w0, w1);
  }
  // A hypnotised eye: a white disc with a turning purple spiral.
  function spiralEye(ctx, x, y, r, t, col) {
    A.oval(ctx, x, y, r, r, 0, '#ffffff', LINE, Math.max(0.8, r * 0.22));
    ctx.strokeStyle = col || '#9d4edd';
    ctx.lineWidth = Math.max(0.7, r * 0.2);
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const k = i / 26, a = t * 7 + k * TAU * 2.2, rr = k * r * 0.82;
      if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  // Swoosh arcs round (cx, cy) between two angles (clockwise from the smaller one).
  function whoosh(ctx, cx, cy, r, a0, a1, n, lw) {
    while (a1 - a0 > Math.PI) a1 -= TAU;
    while (a0 - a1 > Math.PI) a1 += TAU;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = lw || 2.5;
    for (let i = 0; i < (n || 3); i++) { ctx.beginPath(); ctx.arc(cx, cy, r + i * 6, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); }
  }
  function dust(ctx, x, y, t, n, dir, size) {
    ctx.fillStyle = 'rgba(205,165,125,0.55)';
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const k = (t * 3 + i / n) % 1; circ(ctx, x - dir * k * 36, y - 4 - k * 10, (size || 5) + k * 9); }
    ctx.fill();
  }
  function rays(ctx, x, y, r0, r1, n, col, lw, rot) {
    ctx.strokeStyle = col; ctx.lineWidth = lw || 2.5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = (rot || 0) + (i * TAU) / n; ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); }
    ctx.stroke();
  }
  function puff(ctx, x, y, r, col) {
    ctx.fillStyle = col || 'rgba(255,255,255,0.85)';
    ctx.beginPath(); circ(ctx, x, y, r); circ(ctx, x + r * 0.9, y - r * 0.3, r * 0.75); circ(ctx, x - r * 0.8, y - r * 0.2, r * 0.7); ctx.fill();
  }
  // A clawed foot: claws fanning forward from (x, y).
  function claws(ctx, x, y, n, len, spread, col, lw) {
    ctx.strokeStyle = col || LINE; ctx.lineWidth = lw || 1.2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * spread; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.6); }
    ctx.stroke();
  }
  // A two-segment limb (hip -> knee -> foot) as one tapered shape.
  function limb(ctx, x0, y0, kx, ky, x1, y1, w0, w1, fill) {
    ctx.fillStyle = fill; ctx.strokeStyle = LINE;
    A.taper(ctx, x0, y0, kx * 2 - (x0 + x1) / 2, ky * 2 - (y0 + y1) / 2, x1, y1, w0, w1);
    ctx.fill(); ctx.stroke();
  }

  // ================================================================ pests
  // ---------------------------------------------------------------- red fox (about 45 px tall, 88 long)
  // o.pounce 0..1 (a leap: nose up as it takes off, paws first as it lands). o.roxy: Foxy Roxy, the City's
  // fox-gang boss (drawn at scale ~2.6): sunglasses, a hot-pink bandana, a gold earring and a cocky grin.
  const FOX = { fur: '#e2692b', dark: '#b84a1d', light: '#fff3e2', sock: '#2e211c', nose: '#1d1412' };
  A.fox = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, FOX, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, pounce = k01(o.pounce), roxy = !!o.roxy;
    const air = !!o.air || pounce > 0;
    const run = !!o.charging && !air;
    const low = o.crouch && !air ? 6 : 0;
    const step = run ? t * 22 : o.moving ? t * 14 : 0;
    begin(ctx, x, y, o);
    ctx.scale(0.82, 0.82);
    if (run && !o.flash) dust(ctx, -30, 0, t, 3, 1, 4);
    if (air) {
      const rot = pounce > 0 ? lerp(-0.4, 0.5, pounce) : -0.12;
      ctx.translate(0, -16); ctx.rotate(rot); ctx.translate(0, 16);
    }
    // bushy tail with a white tip (straight out behind at speed, flicking while it crouches)
    const flick = o.crouch ? Math.sin(t * 14) * 5 : Math.sin(t * 2.2) * 2;
    const stretch = run || air;
    const cx = -36, cy = (stretch ? -30 : -36) + low;
    const tx = stretch ? -54 : -47, ty = (stretch ? -27 : -13 + flick) + low;
    ctx.fillStyle = f(c.fur); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    A.taper(ctx, -16, -25 + low, cx, cy, tx, ty, 8, 13);
    ctx.fill(); ctx.stroke();
    const ta = Math.atan2(ty - cy, tx - cx);
    A.oval(ctx, tx + Math.cos(ta) * 2, ty + Math.sin(ta) * 2, 6.5, 5.5, ta, f(c.light), LINE, 1.6);
    if (!o.flash) {
      ctx.strokeStyle = c.dark; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-26, -29 + low); ctx.lineTo(-30, -26 + low); ctx.moveTo(lerp(cx, tx, 0.4), lerp(cy, ty, 0.4) - 3); ctx.lineTo(lerp(cx, tx, 0.4) - 4, lerp(cy, ty, 0.4) + 1); ctx.stroke();
    }
    // legs with black socks: trotting, galloping, or stretched out in a leap
    const leg = (lx, ph, far, front) => {
      let fx = lx + (step ? Math.sin(step + ph) * (run ? 9 : 5) : 0), fy = step ? -Math.max(0, -Math.sin(step + ph)) * (run ? 7 : 4) : 0;
      if (air) {
        if (front) { fx = lx + 15; fy = lerp(-17, -5, pounce > 0 ? pounce : 0.3); } else { fx = lx - 17; fy = -9; }
      }
      const top = -16 + low, mx = (lx + fx) / 2 + (front ? 1 : -2), my = (top + fy) / 2;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = f(c.sock); ctx.strokeStyle = LINE;
      A.taper(ctx, lx, top, mx, my, fx, fy - 2, 6.5, 4.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = f(far ? c.dark : c.fur);
      A.taper(ctx, lx, top - 1, (lx + mx) / 2, (top + my) / 2, mx, my, 7, 5.4); ctx.fill();
      A.oval(ctx, fx + 1.5, fy - 1.6, 3.4, 2, 0, f(c.sock), LINE, 1.2);
    };
    leg(-15, 0, true, false); leg(13, Math.PI, true, true);
    // body, white chest and belly
    A.oval(ctx, 0, -22 + low, 22, 9.5, 0, f(c.fur), LINE, 2);
    A.oval(ctx, 4, -15.5 + low, 14, 3.2, 0, f(c.light));
    A.oval(ctx, 15, -19 + low, 7, 6.5, -0.4, f(c.light));
    leg(-9, Math.PI, false, false); leg(18, 0, false, true);
    // head: big pointed ears with black tips, a long snout and a sly amber eye
    const hx = 25, hy = -29 + low * 1.1;
    ctx.save();
    ctx.translate(hx - 4, hy + 4); ctx.scale(1.2, 1.2); ctx.translate(4 - hx, -4 - hy);
    if (roxy) {
      // Roxy's hot-pink bandana, knotted at the back of the neck
      const fl = Math.sin(t * 9) * 2;
      ctx.fillStyle = f('#ff2e88'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(hx - 9, hy + 3); ctx.lineTo(hx - 17, hy - 1 + fl); ctx.lineTo(hx - 15, hy + 5 + fl * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 9, hy + 4); ctx.lineTo(hx - 16, hy + 8 - fl * 0.5); ctx.lineTo(hx - 11, hy + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.lineWidth = 1.6; ctx.strokeStyle = LINE;
    ctx.fillStyle = f(c.dark);
    ctx.beginPath(); ctx.moveTo(hx - 8, hy - 4); ctx.lineTo(hx - 8, hy - 17); ctx.lineTo(hx - 2, hy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, hx, hy, 8.5, 7.5, 0, f(c.fur), LINE, 2);
    ctx.fillStyle = f(c.fur);
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 5); ctx.lineTo(hx - 1.5, hy - 19); ctx.lineTo(hx + 4, hy - 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.fillStyle = c.light;
      ctx.beginPath(); ctx.moveTo(hx - 2.2, hy - 6); ctx.lineTo(hx - 1.4, hy - 14); ctx.lineTo(hx + 1.8, hy - 6.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.sock;
      ctx.beginPath(); ctx.moveTo(hx - 2.6, hy - 14.5); ctx.lineTo(hx - 1.5, hy - 19); ctx.lineTo(hx + 0.6, hy - 14.6); ctx.closePath(); ctx.fill();
    }
    if (roxy) {
      // a punky fringe and a gold hoop earring
      ctx.fillStyle = f(c.dark); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 5, hy - 5.5); ctx.lineTo(hx - 4, hy - 12); ctx.lineTo(hx - 1, hy - 7.5); ctx.lineTo(hx + 1, hy - 11.5); ctx.lineTo(hx + 2.5, hy - 6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = f('#ffd23f'); ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(hx + 3.3, hy - 3.5, 1.8, 0, TAU); ctx.stroke();
    }
    // cheek ruff, snout and white lower jaw
    A.oval(ctx, hx + 0.5, hy + 3.6, 6.5, 4, 0.1, f(c.light));
    const gape = roxy ? 0 : air ? 3.5 : o.crouch ? 1.5 : 0;
    if (gape) {
      ctx.save(); ctx.translate(hx + 4, hy + 2.5); ctx.rotate(gape * 0.1);
      A.oval(ctx, 6, 0.5, 7, 2.2, 0, '#5a1a1a');
      ctx.fillStyle = f(c.light); ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.lineTo(12, 1); ctx.lineTo(10, 3.2); ctx.lineTo(0, 3.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(9, 0.6); ctx.lineTo(9.8, -1.6); ctx.lineTo(10.6, 0.7); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = f(c.fur); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hx + 3, hy - 4.5); ctx.quadraticCurveTo(hx + 12, hy - 3.5, hx + 18.5, hy + 0.5); ctx.lineTo(hx + 17.5, hy + 2.6);
    ctx.quadraticCurveTo(hx + 10, hy + 4, hx + 3, hy + 3.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.fillStyle = c.light;
      ctx.beginPath(); ctx.moveTo(hx + 4, hy + 1.6); ctx.lineTo(hx + 16.5, hy + 2.2); ctx.quadraticCurveTo(hx + 10, hy + 3.7, hx + 4, hy + 3.3); ctx.closePath(); ctx.fill();
    }
    A.oval(ctx, hx + 18.3, hy + 0.6, 2.1, 1.7, 0, c.nose);
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(hx + 13, hy + 1.5); ctx.lineTo(hx + 21, hy - 0.5); ctx.moveTo(hx + 13, hy + 2.3); ctx.lineTo(hx + 21, hy + 3.5); ctx.stroke();
    if (roxy) {
      // the cocky grin (with one fang), then the sunglasses and a raised brow
      ctx.fillStyle = '#5a1a1a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(hx + 17, hy + 2.4); ctx.quadraticCurveTo(hx + 9, hy + 8, hx + 2, hy - 0.5); ctx.quadraticCurveTo(hx + 9, hy + 3.6, hx + 17, hy + 2.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(hx + 5, hy + 1.8); ctx.quadraticCurveTo(hx + 10, hy + 4.4, hx + 15.5, hy + 2.9); ctx.lineTo(hx + 14.5, hy + 4.2); ctx.quadraticCurveTo(hx + 10, hy + 5.6, hx + 6, hy + 3.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx + 12.5, hy + 4.4); ctx.lineTo(hx + 13.3, hy + 6.8); ctx.lineTo(hx + 14.2, hy + 4.1); ctx.fill();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 3); ctx.lineTo(hx + 1, hy - 3.3); ctx.stroke();
      ctx.fillStyle = '#1d1d28'; ctx.strokeStyle = f('#ff4fa3'); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 5.6); ctx.lineTo(hx + 9.5, hy - 5); ctx.quadraticCurveTo(hx + 9.6, hy - 0.6, hx + 5.2, hy - 0.5); ctx.quadraticCurveTo(hx + 1, hy - 0.8, hx + 0.5, hy - 5.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(hx + 2.6, hy - 4.4); ctx.lineTo(hx + 4.6, hy - 2.2); ctx.moveTo(hx + 5, hy - 4.6); ctx.lineTo(hx + 6, hy - 3.4); ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(hx + 1.5, hy - 7.6); ctx.quadraticCurveTo(hx + 5, hy - 9.6, hx + 9, hy - 7.2); ctx.stroke();
    } else {
      A.oval(ctx, hx + 4, hy - 2.4, 2.7, 2.3, 0, '#ffb703', LINE, 1);
      A.oval(ctx, hx + 4.7, hy - 2.4, 0.7, 2, 0, '#111111');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 6); ctx.lineTo(hx + 7.5, hy - 4.6); ctx.stroke();
      if (!gape) { ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx + 15, hy + 2.8); ctx.quadraticCurveTo(hx + 10, hy + 3.8, hx + 6.5, hy + 2.2); ctx.stroke(); }
    }
    if (roxy) {
      // the bandana's front, with white polka dots
      ctx.fillStyle = f('#ff2e88'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(hx - 9, hy + 2); ctx.quadraticCurveTo(hx - 2, hy + 7, hx + 5, hy + 4.5); ctx.lineTo(hx + 2, hy + 11); ctx.quadraticCurveTo(hx - 5, hy + 10, hx - 9, hy + 6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); circ(ctx, hx - 4, hy + 6.5, 0.9); circ(ctx, hx, hy + 8.5, 0.9); circ(ctx, hx + 1.5, hy + 5.6, 0.8); circ(ctx, hx - 7, hy + 4.6, 0.8); ctx.fill(); }
    }
    ctx.restore();
    ctx.restore();
  };

  // ---------------------------------------------------------------- Tasmanian pademelon (about 41 px tall)
  // A small, stocky, dark-brown wallaby with a short thick tail. o.hypno: spiral hypnotised eyes;
  // o.thump: thumping a hind foot (its alarm call).
  const PADDY = { fur: '#5e4636', dark: '#45332a', belly: '#c08c62', face: '#735643', ear: '#d9a08c', nose: '#2b1a14' };
  A.pademelon = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, PADDY, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, air = !!o.air, hyp = !!o.hypno;
    const low = o.crouch && !air ? 4 : 0;
    const hop = (o.moving || o.charging) && !air ? Math.abs(Math.sin(t * (o.charging ? 13 : 9))) : 0;
    const th = o.thump && !air ? (t * 2.6) % 1 : -1;
    const lift = th < 0 ? 0 : th < 0.7 ? Math.sin((th / 0.7) * Math.PI * 0.5) * 8 : Math.max(0, 8 - ((th - 0.7) / 0.07) * 8);
    begin(ctx, x, y, o);
    ctx.scale(0.85, 0.85);
    if (th >= 0.76 && th < 0.95 && !o.flash) {
      // THUMP: dust and shock lines where the foot hits the ground
      const k = (th - 0.76) / 0.19;
      ctx.globalAlpha = 1 - k;
      dust(ctx, 12, 0, k * 0.3, 2, -1, 3);
      ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 2;
      ctx.beginPath(); for (const a of [-2.6, -2.1, -1.0, -0.5]) { ctx.moveTo(5 + Math.cos(a) * (8 + k * 6), -1 + Math.sin(a) * (6 + k * 5)); ctx.lineTo(5 + Math.cos(a) * (13 + k * 8), -1 + Math.sin(a) * (10 + k * 6)); } ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.translate(0, -hop * 8);
    if (air) { ctx.translate(0, -14); ctx.rotate(0.3); ctx.translate(0, 14); }
    // short thick tail, then the far hind foot
    ctx.fillStyle = f(c.dark); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    A.taper(ctx, -8, -10 + low, -19, air ? -9 : -5, -28, air ? -11 : -1.5, 9, 4); ctx.fill(); ctx.stroke();
    if (air) A.oval(ctx, -12, -4, 10, 3, 0.5, f(c.dark), LINE, 1.5);
    else A.oval(ctx, -1, -2.5, 10, 3, 0, f(c.dark), LINE, 1.5);
    // big haunch and the near hind foot (lifted for a thump)
    A.oval(ctx, -3, -12 + low * 0.6, 10.5, 8.5, -0.35, f(c.fur), LINE, 2);
    if (air) A.oval(ctx, -7, -2, 10.5, 3.2, 0.45, f(c.fur), LINE, 1.6);
    else A.oval(ctx, 4, -2.8 - lift, 10.5, 3.2, -lift * 0.02, f(c.fur), LINE, 1.6);
    // hunched body and reddish belly
    A.oval(ctx, 3, -20 + low, 11, 13.5, 0.35, f(c.fur), LINE, 2);
    A.oval(ctx, 7, -17 + low, 6, 9.5, 0.35, f(c.belly));
    // little forearms
    ctx.fillStyle = f(c.dark); ctx.lineWidth = 1.4;
    A.taper(ctx, 8, -25 + low, 13, -18 + low, 14, -11 + low, 4.5, 3.4); ctx.fill(); ctx.stroke();
    A.oval(ctx, 14.5, -10.5 + low, 2.4, 2, 0, f(c.dark), LINE, 1);
    // head: short rounded ears, a blunt muzzle
    const wob = hyp ? Math.sin(t * 3) * 0.12 : 0;
    ctx.save();
    ctx.translate(13, -31 + low * 1.4);
    ctx.rotate(wob);
    for (const [ex, ey, r] of [[-6, -8, -0.4], [-2, -9, -0.1]]) {
      A.oval(ctx, ex, ey, 3.4, 5.4, r, f(ex < -4 ? c.dark : c.fur), LINE, 1.4);
      A.oval(ctx, ex + 0.3, ey + 0.6, 1.7, 3.4, r, f(c.ear));
    }
    A.oval(ctx, 0, 0, 8, 7, 0, f(c.fur), LINE, 1.8);
    A.oval(ctx, 6.5, 1.6, 5.6, 3.9, 0.15, f(c.face), LINE, 1.5);
    A.oval(ctx, 11.6, 0.6, 1.9, 1.5, 0, c.nose);
    if (hyp) {
      spiralEye(ctx, 3, -1.8, 2.9, t, '#c03ad6');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(4, 4.4); ctx.lineTo(5.5, 3.6); ctx.lineTo(7, 4.4); ctx.lineTo(8.5, 3.6); ctx.stroke();
    } else {
      A.oval(ctx, 3, -1.6, 2.1, 2.3, 0, '#141418');
      A.oval(ctx, 3.7, -2.4, 0.8, 0.8, 0, '#ffffff');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -5.2); ctx.lineTo(5.5, (o.thump || o.crouch) ? -5.6 : -4.4); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10.5, 3.4); ctx.quadraticCurveTo(8.5, 4.4, 6.5, 3.6); ctx.stroke();
    }
    ctx.restore();
    if (hyp && !o.flash) {
      // a little purple swirl of hypnosis over its head
      ctx.strokeStyle = 'rgba(192,58,214,0.75)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) { const k = i / 18, a = -t * 5 + k * TAU * 1.6; const px = 10 + Math.cos(a) * k * 6, py = -50 + Math.sin(a) * k * 2.4; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.restore();
  };

  // ================================================================ the reptilians (the quokkas' allies)
  // ---------------------------------------------------------------- monitor lizards (goannas), side view
  // Shared by the perentie and the lace monitor. Body centre (0, -20), snout ~ +66, tail tip ~ -90.
  // P: colours and pattern ('spots' or 'bands'). o.tailWhip 0..1: the tail coils up over the back, then
  // cracks out straight behind (the strike lands BEHIND it, about 60-110 px back at tail height).
  function monitorSide(ctx, o, P) {
    const f = (col) => white(o, col);
    const t = o.t || 0, whip = k01(o.tailWhip), fall = !!o.fall;
    const run = !!o.charging && !fall;
    const low = fall ? 0 : (o.crouch ? 4 : 0) + (run ? 2 : 0);
    const step = fall ? 0 : run ? t * 24 : o.moving ? t * 11 : 0;
    const sway = Math.sin(t * 2) * 3;
    if (run && !o.flash) dust(ctx, -40, 0, t, 3, 1, 4);
    if (fall && !o.flash) {
      // falling fast: speed lines above it
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [lx, l] of [[-30, 16], [-8, 22], [14, 14], [36, 20]]) { ctx.moveTo(lx, -48 - l); ctx.lineTo(lx, -40); }
      ctx.stroke();
    }
    // ---- the tail: resting, coiled up for a whip, cracked out behind (or flung up while falling)
    const root = [-26, -20 + low];
    const REST = fall ? [-56, -36, -82, -52] : [-58, -7 + low, -90, -3 + sway];
    const WIND = [-50, -60, -22, -66], CRACK = [-64, -26, -106, -32];
    let T = REST;
    if (whip > 0) {
      const a = whip < 0.4 ? REST : WIND, b = whip < 0.4 ? WIND : CRACK, k = ease(whip < 0.4 ? whip / 0.4 : (whip - 0.4) / 0.6);
      T = a.map((v, i) => lerp(v, b[i], k));
    }
    if (whip > 0.45 && !o.flash) {
      const a0 = Math.atan2(WIND[3] - root[1], WIND[2] - root[0]), a1 = Math.atan2(T[3] - root[1], T[2] - root[0]);
      whoosh(ctx, root[0], root[1], Math.hypot(T[2] - root[0], T[3] - root[1]) - 6, a0, a1, 3, 2.5);
    }
    const tp = quad(root[0], root[1], T[0], T[1], T[2], T[3], 18);
    ctx.fillStyle = f(P.hide); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    strip(ctx, tp, 17, 2.5); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      if (P.pattern === 'bands') {
        ctx.strokeStyle = P.mark;
        for (let i = 0; i < 6; i++) { ctx.lineWidth = 2 + i * 0.5; bands(ctx, tp, [0.2 + i * 0.12], (k) => lerp(17, 2.5, k) * 0.42); }
      } else {
        ctx.fillStyle = P.mark;
        ctx.beginPath();
        for (let i = 1; i < 8; i++) { const p = tp[Math.round(i * 2.1)], w = lerp(17, 2.5, i / 8.5) * 0.2; circ(ctx, p[0], p[1] - w, Math.max(0.8, w * 0.9)); circ(ctx, p[0] + 3, p[1] + w, Math.max(0.6, w * 0.7)); }
        ctx.fill();
      }
    }
    if (whip > 0.85 && !o.flash) { A.star(ctx, T[2] - 4, T[3], 9, '#fff3b0'); rays(ctx, T[2] - 4, T[3], 10, 16, 6, '#ffffff', 2); }
    // ---- legs: sprawled out to the sides, scurrying, or spread wide while falling
    const leg = (lx, ph, col, front) => {
      const sw = step ? Math.sin(step + ph) * (run ? 9 : 6) : 0, up = step ? Math.max(0, -Math.cos(step + ph)) * (run ? 5 : 3) : 0;
      const top = -16 + low;
      let fx = lx + (front ? 7 : 2) + sw, fy = -up, kx = lx + (front ? 9 : -3) + sw * 0.4, ky = top + 9;
      if (fall) { fx = lx + (front ? 22 : -18); fy = top + 9; kx = lx + (front ? 12 : -9); ky = top + 10; }
      limb(ctx, lx, top, kx, ky, fx, fy - 2, 10, 6.5, f(col));
      A.oval(ctx, fx + 2, fy - 1.8, 5, 2.3, 0, f(col), LINE, 1.2);
      claws(ctx, fx + 5.5, fy - 1.4, 3, 5, 0.35, LINE, 1.1);
    };
    leg(-22, Math.PI, P.dark, false); leg(18, 0, P.dark, true);
    // ---- the long body and its pattern
    A.oval(ctx, 0, -20 + low, 31, 11.5, run ? 0.03 : -0.02, f(P.hide), LINE, 2.2);
    A.oval(ctx, 3, -12 + low, 24, 3.6, 0, f(P.belly));
    if (!o.flash) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -20 + low, 30, 10.5, 0, 0, TAU); ctx.clip();
      if (P.pattern === 'bands') {
        ctx.strokeStyle = P.mark; ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const bx = -23 + i * 9; ctx.moveTo(bx - 1, -31 + low); ctx.quadraticCurveTo(bx + 2, -22 + low, bx, -13 + low); }
        ctx.stroke();
        ctx.fillStyle = P.mark;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) { circ(ctx, -18 + i * 9, -25 + low, 1.1); circ(ctx, -17 + i * 9, -19 + low, 1); }
        ctx.fill();
      } else {
        for (let j = 0; j < 3; j++) {
          for (let i = 0; i < 7; i++) {
            const sx = -25 + i * 8.2 + (j % 2) * 4, sy = -27 + j * 5.5 + low;
            A.oval(ctx, sx, sy, 2.7, 2.1, 0, P.mark);
            A.oval(ctx, sx, sy, 1.1, 0.9, 0, P.dark);
          }
        }
      }
      ctx.restore();
    }
    leg(-16, 0, P.hide, false); leg(24, Math.PI, P.hide, true);
    // ---- neck and head: lifted and watching, low and forward for a charge, hissing when it winds up
    const hx = fall ? 50 : run ? 52 : o.crouch ? 44 : 48, hy = (fall ? -27 : run ? -29 : o.crouch ? -40 : -36) + low * (o.crouch ? 0 : 1);
    ctx.fillStyle = f(P.hide); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    A.taper(ctx, 20, -22 + low, (20 + hx) / 2, (hy + (-22 + low)) / 2 - 2, hx - 7, hy + 1, 17, 12); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.fillStyle = P.mark;
      ctx.beginPath(); circ(ctx, 28, hy * 0.35 - 17, 1.3); circ(ctx, 34, hy * 0.6 - 12, 1.2); circ(ctx, 31, hy * 0.5 - 12, 1); ctx.fill();
    }
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(fall ? 0.3 : run ? 0.1 : 0);
    const gape = fall ? 0.8 : o.crouch ? 0.9 : run ? 0.45 : 0;
    if (gape) {
      ctx.save(); ctx.translate(-7, 2); ctx.rotate(gape * 0.45);
      A.oval(ctx, 12, -0.5, 12, 2.5, 0, '#e86a8a');
      ctx.fillStyle = f(P.head); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(24, 0); ctx.quadraticCurveTo(25, 3, 21, 4); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = f(P.head); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, -5); ctx.quadraticCurveTo(0, -10.5, 10, -7); ctx.quadraticCurveTo(18, -4.5, 21, -1); ctx.quadraticCurveTo(20, 3, 12, 3.5);
    ctx.lineTo(-8, 5.5); ctx.quadraticCurveTo(-13, 0, -11, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      if (P.pattern === 'bands') {
        ctx.strokeStyle = P.mark; ctx.lineWidth = 1.3;
        ctx.beginPath(); for (const bx of [4, 9, 14]) { ctx.moveTo(bx, 3.4); ctx.lineTo(bx + 0.5, 0.8); } ctx.stroke();
      } else {
        ctx.fillStyle = P.mark;
        ctx.beginPath(); circ(ctx, -6, -3, 1); circ(ctx, 5, -6, 0.9); circ(ctx, 10, -4.2, 0.8); circ(ctx, -3, 1.5, 0.8); ctx.fill();
      }
    }
    // tongue: a quick forked flick
    if (!o.flash && (run || (t * 1.2) % 1 < 0.22)) {
      ctx.strokeStyle = P.tongue; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(20, 0.5); ctx.lineTo(29, 1); ctx.lineTo(32, -1.5); ctx.moveTo(29, 1); ctx.lineTo(32, 3); ctx.stroke();
    }
    A.oval(ctx, 17, -3.5, 0.9, 0.7, 0, LINE);
    A.oval(ctx, -1, -3.6, 2.8, 2.5, 0, white(o, '#e8a33a'), LINE, 1);
    A.oval(ctx, -0.3, -3.5, 1.2, 1.4, 0, '#141418');
    ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-5.5, -7.5); ctx.lineTo(3.5, -6); ctx.stroke();
    if (!gape) { ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(19, 1.4); ctx.quadraticCurveTo(8, 3.2, -6, 2.2); ctx.lineTo(-7.5, 0.5); ctx.stroke(); }
    ctx.restore();
  }

  // Perentie, Australia's biggest lizard: about 155 px long, 45 px tall. Dark with rows of cream spots.
  // o.tailWhip 0..1, o.charging (scurrying, mouth open), o.crouch (rearing back to hiss), o.moving.
  const PERENTIE = { hide: '#4b3a2b', dark: '#33281e', belly: '#d9c28c', mark: '#f0d79a', head: '#57432f', tongue: '#d65a8a', pattern: 'spots' };
  A.perentie = function (ctx, x, y, o) {
    o = o || {};
    begin(ctx, x, y, o);
    ctx.scale(0.92, 0.92);
    monitorSide(ctx, o, Object.assign({}, PERENTIE, o.colors || {}));
    ctx.restore();
  };

  // Lace monitor: a dark goanna with pale bands, about 110 px long, 32 tall.
  // o.cling: clinging head-down to a tree trunk (seen from behind): its snout tip is at (x, y) and the
  //   body goes up about 115 px (o.trunk also draws a piece of trunk behind it).
  // o.drop: falling, legs spread wide and mouth open (drawn at its feet, like walking).
  const LACE = { hide: '#2c2f36', dark: '#1d1f24', belly: '#cfc79a', mark: '#e7dda2', head: '#31343b', tongue: '#b0508a', pattern: 'bands' };
  A.laceMonitor = function (ctx, x, y, o) {
    o = o || {};
    const P = Object.assign({}, LACE, o.colors || {});
    if (o.cling) { laceCling(ctx, x, y, o, P); return; }
    begin(ctx, x, y, o);
    ctx.scale(0.74, 0.74);
    monitorSide(ctx, Object.assign({}, o, { fall: !!o.drop }), P);
    ctx.restore();
  };
  function laceCling(ctx, x, y, o, P) {
    const f = (col) => white(o, col);
    const t = o.t || 0;
    begin(ctx, x, y, o);
    if (o.trunk) {
      ctx.fillStyle = '#6b4a2e'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(-20, -150, 40, 166); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#4f3520'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [bx, by, l] of [[-12, -140, 30], [8, -118, 34], [-4, -84, 26], [12, -60, 30], [-14, -40, 28], [2, -14, 22]]) { ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + 3, by + l / 2, bx - 1, by + l); }
      ctx.stroke();
    }
    // seen from behind, pointing down: local +x is down the trunk
    ctx.rotate(Math.PI / 2);
    const g = Math.sin(t * 3) * 1.2;
    // tail up the trunk, swaying
    const tp = quad(-56, 0, -84, Math.sin(t * 1.5) * 6, -114, Math.sin(t * 1.5 + 1) * 10, 16);
    ctx.fillStyle = f(P.hide); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    strip(ctx, tp, 10, 1.6); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.strokeStyle = P.mark;
      for (let i = 0; i < 5; i++) { ctx.lineWidth = 1.8 + i * 0.4; bands(ctx, tp, [0.15 + i * 0.16], (k) => lerp(10, 1.6, k) * 0.42); }
    }
    // four legs gripping the bark, toes spread
    const foot = (sx, sy, kx, ky, fx, fy) => {
      limb(ctx, sx, sy, kx, ky, fx, fy, 6, 4.4, f(P.dark));
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const a of [-0.6, 0, 0.6]) { const d = Math.atan2(fy - ky, fx - kx) + a; ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(d) * 4.5, fy + Math.sin(d) * 4.5); }
      ctx.stroke();
    };
    for (const side of [-1, 1]) {
      foot(-24, side * 5, -30, side * (13 + g), -19, side * (18 + g));
      foot(-50, side * 6, -45, side * (14 - g), -57, side * (19 - g));
    }
    // body, neck and head
    A.oval(ctx, -38, 0, 22, 8.5, 0, f(P.hide), LINE, 2);
    if (!o.flash) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(-38, 0, 21, 7.5, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = P.mark; ctx.lineWidth = 2.2;
      ctx.beginPath(); for (let i = 0; i < 5; i++) { const bx = -52 + i * 7; ctx.moveTo(bx, -9); ctx.quadraticCurveTo(bx + 2, 0, bx, 9); } ctx.stroke();
      ctx.fillStyle = P.mark;
      ctx.beginPath(); for (let i = 0; i < 4; i++) { circ(ctx, -48 + i * 7, -3.5, 0.9); circ(ctx, -48 + i * 7, 3.5, 0.9); } ctx.fill();
      ctx.restore();
    }
    A.oval(ctx, -16, 0, 8.5, 5.6, 0, f(P.hide), LINE, 1.8);
    ctx.fillStyle = f(P.head); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-14, -5); ctx.quadraticCurveTo(-5, -6.5, 0, -1.6); ctx.quadraticCurveTo(1.2, 0, 0, 1.6); ctx.quadraticCurveTo(-5, 6.5, -14, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash && (t * 1.1) % 1 < 0.25) {
      ctx.strokeStyle = P.tongue; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, 0); ctx.lineTo(10.5, -2); ctx.moveTo(8, 0); ctx.lineTo(10.5, 2); ctx.stroke();
    }
    for (const side of [-1, 1]) {
      A.oval(ctx, -9, side * 4.6, 2.4, 2.1, 0, white(o, '#e8a33a'), LINE, 0.9);
      A.oval(ctx, -8.4, side * 4.6, 1, 1, 0, '#141418');
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- inland taipan (coiled, about 34 px tall)
  // Olive-brown with a darker, glossy head. o.strike 0..1: the neck shoots forward about 40 px, fangs out.
  // o.moving: slithering along (about 70 px long).
  const TAIPAN = { body: '#8e7b4c', dark: '#6b5a36', belly: '#eadca8', head: '#2f2721', eye: '#e8b13a' };
  function snakeHead(ctx, o, c, open, len, fangs) {
    // a snake's head facing right from its neck at (0, 0); open 0..1
    const f = (col) => white(o, col);
    const L = len || 13;
    if (open > 0) {
      ctx.save(); ctx.rotate(open * 0.55);
      A.oval(ctx, L * 0.5, 1.5, L * 0.45, 1.6, 0, '#e86a8a');
      ctx.fillStyle = f(c.head); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(L, 1); ctx.quadraticCurveTo(L + 1, 3, L - 2, 4); ctx.lineTo(0, 4.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.rotate(-open * 0.3);
    }
    ctx.fillStyle = f(c.head); ctx.strokeStyle = LINE; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(-2, -4.2); ctx.quadraticCurveTo(L * 0.5, -6.6, L - 1, -3.6); ctx.quadraticCurveTo(L + 2, -1.6, L + 1, 0.6);
    ctx.quadraticCurveTo(L * 0.6, 3.6, -2, 3.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (open > 0 && fangs) {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(L - 4, 1.6); ctx.lineTo(L - 3.2, 5.5); ctx.lineTo(L - 2.4, 1.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L - 7.5, 2.4); ctx.lineTo(L - 6.8, 5.6); ctx.lineTo(L - 6, 2.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (!o.flash) { ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1, -3.2); ctx.quadraticCurveTo(L * 0.4, -5, L * 0.7, -3.6); ctx.stroke(); }
    A.oval(ctx, L * 0.42, -1.6, 2, 1.8, 0, white(o, c.eye), LINE, 0.8);
    A.oval(ctx, L * 0.45, -1.5, 0.75, 1.5, 0, '#141418');
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L * 0.42 - 2.6, -4.6); ctx.lineTo(L * 0.42 + 2.6, -3.4); ctx.stroke();
    A.oval(ctx, L - 0.5, -1.8, 0.6, 0.5, 0, LINE);
    if (!open) {
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, 1); ctx.quadraticCurveTo(L * 0.6, 2.4, 1, 1.6); ctx.stroke();
      if (!o.flash && (o.t * 1.3) % 1 < 0.25) {
        ctx.strokeStyle = '#d6405a'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(L + 1, 0.6); ctx.lineTo(L + 7, 0.8); ctx.lineTo(L + 9, -1); ctx.moveTo(L + 7, 0.8); ctx.lineTo(L + 9, 2.4); ctx.stroke();
      }
    }
  }
  A.taipan = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, TAIPAN, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, strike = k01(o.strike), sk = ease(strike);
    const open = strike > 0.3 ? Math.min(1, (strike - 0.3) / 0.5) : 0;
    begin(ctx, x, y, o);
    const tube = (pts, w0, w1, wf) => {
      ctx.fillStyle = f(c.body); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
      strip(ctx, pts, w0, w1, wf); ctx.fill(); ctx.stroke();
      if (!o.flash) { ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.4; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - 2) : ctx.moveTo(p[0], p[1] - 2))); ctx.stroke(); }
    };
    if (o.moving && !strike) {
      // slithering: a long wavy body with the head raised a little at the front
      const pts = [];
      for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push([lerp(-44, 16, k), -4.5 - Math.sin(k * TAU * 1.4 - t * 9) * 2.6 * (0.3 + 0.7 * k) - Math.max(0, k - 0.85) * 30]); }
      tube(pts, 0, 0, (k) => (k < 0.3 ? lerp(1.5, 7.5, k / 0.3) : 7.5));
      const e = pts[24], d = pts[22];
      ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(Math.atan2(e[1] - d[1], e[0] - d[0]) * 0.3); ctx.scale(1.2, 1.2); snakeHead(ctx, o, c, 0, 13, true); ctx.restore();
      ctx.restore();
      return;
    }
    // the tail tip peeking out of the coils
    ctx.fillStyle = f(c.dark); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
    A.taper(ctx, -16, -4, -24, -1, -31, -2 + Math.sin(t * 3) * 1.5, 5, 1.2); ctx.fill(); ctx.stroke();
    // two stacked coils
    const ring = (cx, cy, rx, ry, w) => {
      ctx.lineWidth = w + 3.4; ctx.strokeStyle = LINE;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
      ctx.lineWidth = w; ctx.strokeStyle = f(c.body); ctx.stroke();
      if (!o.flash) {
        A.oval(ctx, cx, cy, rx - w * 0.5, Math.max(0.5, ry - w * 0.5), 0, c.dark);
        ctx.lineWidth = 1.8; ctx.strokeStyle = c.belly;
        ctx.beginPath(); ctx.ellipse(cx, cy + w * 0.32, rx, ry, 0, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.ellipse(cx, cy - w * 0.25, rx, ry, 0, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
      }
    };
    ring(-1, -6, 20, 6, 8);
    ring(-3, -12.5, 14.5 - sk * 2, 4.8, 7.5);
    // the neck rises in an S, then shoots forward for a strike
    const P0 = [9, -13], P1 = [lerp(23, 26, sk), lerp(-13, -10, sk)], P2 = [lerp(4, 38, sk), lerp(-29, -20, sk)], P3 = [lerp(14, 54, sk), lerp(-33, -19, sk)];
    const neck = cubic(P0, P1, P2, P3, 16);
    tube(neck, 7.5, 6.5);
    ctx.save();
    ctx.translate(P3[0], P3[1]);
    ctx.rotate(lerp(-0.1, 0.12, sk));
    ctx.scale(1.2, 1.2);
    snakeHead(ctx, o, c, open, 13, true);
    ctx.restore();
    if (strike > 0.6 && !o.flash) whoosh(ctx, 18, -14, 30, -1.2, -0.25, 2, 2);
    ctx.restore();
  };

  // ---------------------------------------------------------------- death adder (lying low, about 16 px tall)
  // A short, thick, banded snake. o.lure: curled round, wiggling the pale tip of its tail like a little grub
  // in front of it; o.strike 0..1: lunges forward about 30 px.
  const ADDER = { body: '#8b6a50', band: '#5b4131', belly: '#e3cba2', head: '#7c5c44', lure: '#f4e6c0', eye: '#e8c35a' };
  A.deathAdder = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, ADDER, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, strike = k01(o.strike), sk = ease(strike), lure = !!o.lure;
    const open = strike > 0.3 ? Math.min(1, (strike - 0.3) / 0.5) : 0;
    begin(ctx, x, y, o);
    const body = (pts, wf) => {
      ctx.fillStyle = f(c.body); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
      strip(ctx, pts, 0, 0, wf); ctx.fill();
      if (!o.flash) {
        ctx.save(); ctx.clip();
        ctx.strokeStyle = c.band; ctx.lineWidth = 3.4;
        const ks = []; for (let k = 0.06; k < 0.98; k += 0.085) ks.push(k);
        bands(ctx, pts, ks, (k) => wf(k) * 0.6);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - wf(i / (pts.length - 1)) * 0.25) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
        ctx.restore();
      }
      strip(ctx, pts, 0, 0, wf); ctx.stroke();
    };
    let neckEnd, neckPrev;
    if (lure) {
      // the upper body loops back, the tail lies along the front with its grub-like tip wiggling
      A.oval(ctx, -25, -6, 5.6, 5.2, 0, f(c.body), LINE, 1.8);
      const up = cubic([-24, -6], [-36, -14], [lerp(-12, 0, sk), lerp(-17, -14, sk)], [lerp(8, 36, sk), lerp(-10, -11, sk)], 18);
      body(up, (k) => (k < 0.8 ? lerp(9.5, 10.5, k / 0.8) : lerp(10.5, 6.5, (k - 0.8) / 0.2)));
      neckEnd = up[18]; neckPrev = up[16];
      const lo = cubic([-24, -5], [-14, -1], [0, -1.5], [16, -3], 14);
      body(lo, (k) => lerp(9, 2.2, k));
      const w = Math.sin(t * 12);
      for (let i = 0; i < 4; i++) {
        const gx = 17 + i * 2.6, gy = -3 + Math.sin(t * 12 + i * 1.3) * (0.6 + i * 0.5) - w * 0.3;
        A.oval(ctx, gx, gy, 2.2 - i * 0.25, 1.8 - i * 0.2, 0, f(c.lure), LINE, 0.8);
      }
    } else {
      const pts = cubic([-34, -3.5], [lerp(-18, -16, sk), lerp(-13, -8, sk)], [lerp(-2, 12, sk), lerp(2, -6, sk)], [lerp(12, 40, sk), lerp(-6, -10, sk)], 22);
      body(pts, (k) => (k < 0.35 ? lerp(2, 10.5, k / 0.35) : k < 0.85 ? 10.5 : lerp(10.5, 6.5, (k - 0.85) / 0.15)));
      A.oval(ctx, -34, -3.5, 1.8, 1.3, 0, f(c.lure), LINE, 0.8);
      neckEnd = pts[22]; neckPrev = pts[20];
    }
    // the broad, triangular head with its pale-barred lips
    ctx.save();
    ctx.translate(neckEnd[0], neckEnd[1]);
    ctx.rotate(Math.atan2(neckEnd[1] - neckPrev[1], neckEnd[0] - neckPrev[0]) * 0.5);
    ctx.scale(1.3, 1.3);
    if (open > 0) {
      ctx.save(); ctx.rotate(open * 0.6);
      A.oval(ctx, 5, 2, 5, 1.8, 0, '#e86a8a');
      ctx.fillStyle = f(c.head); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-3, 1.5); ctx.lineTo(10, 1.5); ctx.quadraticCurveTo(10.5, 4, 7, 4.6); ctx.lineTo(-3, 4.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.rotate(-open * 0.3);
    }
    ctx.fillStyle = f(c.head); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(5, -5.6); ctx.quadraticCurveTo(11, -3.6, 11.6, -0.4); ctx.quadraticCurveTo(10.4, 2.6, 4.5, 3.8);
    ctx.lineTo(-3, 4.4); ctx.quadraticCurveTo(-6, 0, -3, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.strokeStyle = c.lure; ctx.lineWidth = 1.2;
      ctx.beginPath(); for (const lx of [1, 4, 7]) { ctx.moveTo(lx, 3.6); ctx.lineTo(lx + 0.4, 1.6); } ctx.stroke();
    }
    if (open > 0) {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(8.4, 1.6); ctx.lineTo(9, 5.2); ctx.lineTo(9.8, 1.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    A.oval(ctx, 4.2, -2.2, 2.1, 1.9, 0, white(o, c.eye), LINE, 0.8);
    A.oval(ctx, 4.4, -2.1, 0.55, 1.6, 0, '#141418');
    ctx.fillStyle = f(c.head); ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(1.5, -4.6); ctx.lineTo(4.6, -6.6); ctx.lineTo(7, -4.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  // ---------------------------------------------------------------- frilled lizard (about 30 px tall, 90 long)
  // o.frill 0..1: rears up, spreads its frill and hisses with its yellow mouth wide open.
  // o.run (or o.charging): sprinting upright on its hind legs (about 50 px tall).
  const FRILL = { body: '#8a6c45', dark: '#5f4a2f', belly: '#d8c29a', frill: '#e9772b', inner: '#d6402b', hi: '#ffd23f', edge: '#4a2c1c', mouth: '#f7d66a' };
  A.frilledLizard = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, FRILL, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, fr = k01(o.frill), run = !!(o.run || o.charging);
    const rear = run ? 1.0 : fr * 0.32 + (o.crouch ? 0.08 : 0);
    const hip = run ? [-2, -22] : [-10, -11];
    const step = run ? t * 17 : o.moving ? t * 12 : 0;
    begin(ctx, x, y, o);
    if (run && !o.flash) dust(ctx, -16, 0, t, 3, 1, 3);
    // long thin tail
    const tp = run ? quad(hip[0] - 3, hip[1] + 2, -34, -18 + Math.sin(t * 16) * 2, -64, -9, 14) : quad(-15, -11, -38, -4 + Math.sin(t * 2), -70, -2, 14);
    ctx.fillStyle = f(c.body); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    strip(ctx, tp, 8, 1.4); ctx.fill(); ctx.stroke();
    if (!o.flash) { ctx.strokeStyle = c.dark; ctx.lineWidth = 1.8; bands(ctx, tp, [0.25, 0.4, 0.55, 0.7, 0.85], (k) => lerp(8, 1.4, k) * 0.45); }
    // hind legs: a sprinter's long strides, or sprawled
    const hindLeg = (ph, col) => {
      if (run) {
        const p = step + ph, fx = hip[0] + Math.sin(p) * 13, fy = -Math.max(0, Math.cos(p)) * 9;
        limb(ctx, hip[0], hip[1], hip[0] + 7 + Math.sin(p) * 5, (hip[1] + fy) / 2 - 2, fx, fy - 1, 7.5, 4.5, f(col));
        ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(fx, fy - 1); ctx.lineTo(fx + 9, fy - 0.5); ctx.moveTo(fx, fy - 1); ctx.lineTo(fx + 7, fy - 3); ctx.stroke();
      } else {
        const sw = step ? Math.sin(step + ph) * 5 : 0, lx = hip[0] + (ph ? -4 : 2);
        limb(ctx, lx, -10, lx - 4, -8, lx + 4 + sw, -1, 6.5, 4, f(col));
        claws(ctx, lx + 5 + sw, -1, 3, 6, 0.3, LINE, 1.1);
      }
    };
    hindLeg(Math.PI, c.dark);
    // shoulder, in the world frame (the front of the body rotates up about the hip)
    const sh = [hip[0] + 22 * Math.cos(rear) + 3 * Math.sin(rear), hip[1] - 22 * Math.sin(rear) + 3 * Math.cos(rear)];
    const frontLeg = (ph, col) => {
      if (run) {
        const sw = Math.sin(step + ph) * 2.5;
        limb(ctx, sh[0], sh[1], sh[0] + 4 + sw, sh[1] + 6, sh[0] + 8 + sw, sh[1] + 11, 5, 3.5, f(col));
      } else {
        const sw = step ? Math.sin(step + ph) * 5 : 0;
        limb(ctx, sh[0] - 1, sh[1], sh[0] + 6, (sh[1] - 1) / 2, sh[0] + 6 + sw, -1, 5.5, 3.6, f(col));
        claws(ctx, sh[0] + 7 + sw, -1, 3, 5, 0.3, LINE, 1.1);
      }
    };
    frontLeg(0, c.dark);
    ctx.save();
    ctx.translate(hip[0], hip[1]);
    ctx.rotate(-rear);
    A.oval(ctx, 13, 0, 19, 7.2, 0, f(c.body), LINE, 2);
    A.oval(ctx, 15, 3.4, 14, 2.5, 0, f(c.belly));
    if (!o.flash) {
      ctx.fillStyle = c.dark;
      ctx.beginPath(); for (let i = 0; i < 4; i++) circ(ctx, 2 + i * 7, -3 + (i % 2), 1.6); ctx.fill();
    }
    // the frill and head at the neck, kept fairly level
    ctx.save();
    ctx.translate(33, -3);
    ctx.rotate(rear * 0.78);
    if (fr < 0.06) {
      // folded flat over the shoulders, like a little cape
      ctx.fillStyle = f('#a85a2c'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-1, -6); ctx.quadraticCurveTo(-9, -8, -14, -2); ctx.quadraticCurveTo(-12, 4, -6, 7); ctx.quadraticCurveTo(-1, 6, 2, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) { ctx.strokeStyle = c.frill; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.quadraticCurveTo(-10, -1, -8, 5); ctx.moveTo(-2, -4); ctx.quadraticCurveTo(-6, 0, -4, 5); ctx.stroke(); }
    } else {
      // spread wide: a big ribbed, scalloped disc
      const R = 6 + 20 * fr, cx = -2, cy = 0;
      const edge = (r) => {
        ctx.beginPath();
        for (let i = 0; i <= 28; i++) { const a = (i / 28) * TAU, rr = r * (1 + (i % 2 ? 0.06 : -0.04)); const px = cx + Math.cos(a) * rr * 0.92, py = cy + Math.sin(a) * rr * 1.1; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath();
      };
      ctx.fillStyle = f(c.edge); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8; edge(R); ctx.fill(); ctx.stroke();
      if (!o.flash) {
        ctx.fillStyle = c.frill; edge(R * 0.84); ctx.fill();
        ctx.fillStyle = c.inner; edge(R * 0.58); ctx.fill();
        ctx.fillStyle = c.hi; edge(R * 0.32); ctx.fill();
        rays(ctx, cx, cy, R * 0.3, R * 0.96, 14, 'rgba(74,44,28,0.55)', 1.2, (t * 0.3) % 1 * 0);
      }
    }
    // head: open-mouthed hiss when the frill is up
    const gape = fr > 0.2 ? fr : run ? 0.3 : 0;
    if (gape) {
      ctx.save(); ctx.translate(0, 2); ctx.rotate(gape * 0.75);
      A.oval(ctx, 8, 0.5, 8, 2.6 + gape, 0, white(o, c.mouth));
      ctx.fillStyle = f(c.body); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(15, 1); ctx.quadraticCurveTo(15.5, 3.4, 12, 4); ctx.lineTo(0, 4.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.rotate(-gape * 0.2);
      if (gape > 0.5 && !o.flash) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); for (let j = 0; j < 3; j++) { const k = (t * 3 + j / 3) % 1; ctx.moveTo(20 + k * 12, -3 + j * 4); ctx.lineTo(24 + k * 12, -3.5 + j * 4); } ctx.stroke();
      }
    }
    ctx.fillStyle = f(c.body); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-3, -5); ctx.quadraticCurveTo(7, -8, 14, -3.4); ctx.quadraticCurveTo(17, -0.6, 15, 1.8); ctx.lineTo(0, 3.6); ctx.quadraticCurveTo(-5, 0, -3, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (gape) { ctx.fillStyle = white(o, c.mouth); ctx.beginPath(); ctx.moveTo(1, 2.2); ctx.lineTo(14, 1.4); ctx.lineTo(13, 2.6); ctx.lineTo(1, 3.4); ctx.closePath(); ctx.fill(); }
    A.oval(ctx, 5, -2.4, 2.4, 2.2, 0, white(o, '#e8a33a'), LINE, 0.9);
    A.oval(ctx, 5.5, -2.3, 1, 1.3, 0, '#141418');
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(1.5, -5.4); ctx.lineTo(8, -4.4); ctx.stroke();
    if (!gape) { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14.5, 1.4); ctx.quadraticCurveTo(8, 2.6, 1, 2); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
    frontLeg(Math.PI, c.body);
    hindLeg(0, c.body);
    ctx.restore();
  };

  // ---------------------------------------------------------------- thorny devil (about 22 px tall, 45 long)
  // A small orange-brown lizard covered in thorns, with a spiky "false head" on its neck.
  // o.moving: its jerky, rocking walk; o.crouch: tucks its real head down and shows the false head.
  const THORNY = { base: '#c9893f', dark: '#8b4b22', light: '#f3d59b', spike: '#de9b52' };
  function spikes(ctx, cx, cy, rx, ry, a0, a1, n, len, fill) {
    ctx.fillStyle = fill; ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = lerp(a0, a1, n > 1 ? i / (n - 1) : 0.5);
      const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
      let nx = Math.cos(a) / rx, ny = Math.sin(a) / ry; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      ctx.moveTo(px - ny * 2, py + nx * 2); ctx.lineTo(px + nx * len, py + ny * len); ctx.lineTo(px + ny * 2, py - nx * 2); ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
  }
  A.thornyDevil = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, THORNY, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, tuck = o.crouch ? 1 : 0;
    const rock = o.moving || o.charging ? Math.sin(t * (o.charging ? 16 : 8)) : 0;
    begin(ctx, x, y, o);
    ctx.translate(rock * 1.4, 0);
    ctx.rotate(rock * 0.04);
    // spiky tail, held up
    const tp = quad(-10, -10, -19, -13, -25, -19 + Math.sin(t * 2) * 0.8, 10);
    ctx.fillStyle = f(c.base); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
    strip(ctx, tp, 6.5, 1.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = f(c.spike); ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const i of [2, 4, 6, 8]) { const p = tp[i], w = lerp(6.5, 1.6, i / 10) * 0.5; ctx.moveTo(p[0] - 1.5, p[1] - w); ctx.lineTo(p[0] - 0.5, p[1] - w - 3); ctx.lineTo(p[0] + 1.2, p[1] - w); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    // short splayed legs
    const leg = (lx, ph, col) => {
      const sw = rock ? Math.sin(t * 8 + ph) * 2 : 0;
      limb(ctx, lx, -7, lx + 4, -4, lx + 3 + sw, -1, 4.5, 3, f(col));
      claws(ctx, lx + 3.5 + sw, -1, 3, 3.6, 0.4, LINE, 0.9);
    };
    leg(-9, 0, c.dark); leg(7, Math.PI, c.dark);
    // body: thorns all over, a cream stripe down the back and dark blotches
    spikes(ctx, 0, -10, 12.5, 7.5, Math.PI * 1.02, Math.PI * 1.98, 8, 3.8, f(c.spike));
    A.oval(ctx, 0, -10, 12.5, 7.5, 0, f(c.base), LINE, 1.8);
    if (!o.flash) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -10, 12, 7, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = c.dark;
      ctx.beginPath(); for (const [bx, by, r] of [[-7, -14, 3], [1, -15, 2.6], [8, -13, 2.2], [-4, -8, 2.4], [5, -8, 2], [-10, -7, 1.8]]) circ(ctx, bx, by, r); ctx.fill();
      ctx.strokeStyle = c.light; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-12, -13.5); ctx.quadraticCurveTo(0, -18.5, 12, -12.5); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = c.spike; ctx.strokeStyle = LINE; ctx.lineWidth = 0.8;
      ctx.beginPath(); for (const [sx, sy] of [[-5, -11], [2, -11.5], [-1, -7], [7, -9], [-8, -9.5]]) { ctx.moveTo(sx - 1.3, sy + 1); ctx.lineTo(sx, sy - 2.2); ctx.lineTo(sx + 1.3, sy + 1); ctx.closePath(); } ctx.fill(); ctx.stroke();
    }
    leg(-5, Math.PI, c.base); leg(10, 0, c.base);
    // the false head: a spiky knob on the neck (raised when it tucks its real head down)
    const kn = [8.5, -16.5 - tuck * 2];
    A.oval(ctx, kn[0], kn[1], 3.8, 3.4, 0, f(c.base), LINE, 1.4);
    spikes(ctx, kn[0], kn[1], 3.8, 3.4, Math.PI * 1.2, Math.PI * 1.8, 2, 3.4, f(c.spike));
    // the small real head, with a big thorn over each eye
    ctx.save();
    ctx.translate(14, -10 + tuck * 3.5);
    ctx.rotate(tuck * 0.7);
    A.oval(ctx, 2.5, 0, 5.8, 4.3, 0, f(c.base), LINE, 1.5);
    spikes(ctx, 0.5, -1, 4.6, 3.6, Math.PI * 1.35, Math.PI * 1.7, 2, 4, f(c.spike));
    if (!o.flash) { ctx.strokeStyle = c.light; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(1, 2.2); ctx.lineTo(7, 1.6); ctx.stroke(); }
    A.oval(ctx, 3.2, -0.8, 1.5, 1.5, 0, '#141418');
    A.oval(ctx, 3.6, -1.3, 0.5, 0.5, 0, '#ffffff');
    ctx.restore();
    ctx.restore();
  };

  // ---------------------------------------------------------------- saltwater crocodile on land
  // About 50 px tall and 170 long (60 tall with the crown). o.chomp 0..1 (jaws open at 0.5, snap shut at 1), o.roll 0..1 (a death
  // roll: one full spin round its long axis, belly up halfway), o.tail 0..1 (the tail lifts, then sweeps
  // down and out behind, along the ground). o.emperor: the Croc Emperor (scale ~2.4): crown, royal cape
  // with ermine trim, a gold tooth and a bigger, meaner grin. o.captain: the Top End boss (scale ~2): a
  // white tour-boat captain's cap with a black peak and a gold anchor badge (he "found" it after eating a
  // tour boat's lunch), and a couple of stitched-up scars on his snout.
  const CROC = { hide: '#5d7a3a', dark: '#3e5426', belly: '#d8d49a', scute: '#4a6630' };
  A.crocLand = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, CROC, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, chomp = k01(o.chomp), roll = k01(o.roll), tl = k01(o.tail), emp = !!o.emperor;
    const run = !!o.charging, low = o.crouch ? 5 : run ? 3 : 0;
    const open = chomp > 0 ? Math.sin(chomp * Math.PI) : run ? 0.18 : o.crouch ? 0.3 : 0;
    const step = run ? t * 18 : o.moving ? t * 8 : 0;
    begin(ctx, x, y, o);
    ctx.scale(0.93, 0.93);
    if (run && !o.flash) dust(ctx, -50, 0, t, 3, 1, 6);
    ctx.save();
    if (roll > 0) {
      const sy = Math.cos(roll * TAU);
      ctx.translate(0, -26); ctx.scale(1, (sy < 0 ? -1 : 1) * Math.max(0.3, Math.abs(sy))); ctx.translate(0, 26);
    }
    // ---- tail with a ridge of scutes: resting, lifted, then swept out behind
    const root = [-40, -28 + low];
    const REST = [-74, -14 + low, -98, -4 + Math.sin(t * 1.5) * 2], RAISE = [-70, -62, -46, -84], SWEEP = [-88, -8, -126, -6];
    let T = REST;
    if (tl > 0) {
      const a = tl < 0.4 ? REST : RAISE, b = tl < 0.4 ? RAISE : SWEEP, k = ease(tl < 0.4 ? tl / 0.4 : (tl - 0.4) / 0.6);
      T = a.map((v, i) => lerp(v, b[i], k));
    }
    if (tl > 0.45 && !o.flash) {
      whoosh(ctx, root[0], root[1], Math.hypot(T[2] - root[0], T[3] - root[1]) - 8, Math.atan2(RAISE[3] - root[1], RAISE[2] - root[0]), Math.atan2(T[3] - root[1], T[2] - root[0]), 3, 3);
      if (tl > 0.85) dust(ctx, T[2] + 10, 0, t, 3, 1, 6);
    }
    const tp = quad(root[0], root[1], T[0], T[1], T[2], T[3], 18);
    const tw = (k) => lerp(27, 3, k);
    ctx.fillStyle = f(c.scute); ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 1; i < 16; i += 1.5) {
      const j = Math.floor(i), a = tp[j], b = tp[j + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const nx = dy / l, ny = -dx / l, w = tw(j / 18) / 2, h = 3 + (1 - j / 18) * 3;
      ctx.moveTo(a[0] - (dx / l) * 2.6 + nx * (w - 1), a[1] - (dy / l) * 2.6 + ny * (w - 1));
      ctx.lineTo(a[0] + nx * (w + h), a[1] + ny * (w + h));
      ctx.lineTo(a[0] + (dx / l) * 2.6 + nx * (w - 1), a[1] + (dy / l) * 2.6 + ny * (w - 1)); ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = f(c.hide); ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    strip(ctx, tp, 0, 0, tw); ctx.fill(); ctx.stroke();
    if (!o.flash) { ctx.strokeStyle = c.dark; ctx.lineWidth = 2.6; bands(ctx, tp, [0.3, 0.45, 0.6, 0.75], (k) => tw(k) * 0.4); }
    // ---- legs: the high walk (back legs bigger)
    const leg = (lx, ph, col, back) => {
      const sw = step ? Math.sin(step + ph) * (run ? 10 : 6) : 0, up = step ? Math.max(0, -Math.cos(step + ph)) * (run ? 6 : 3) : 0;
      const top = -24 + low, fx = lx + (back ? -2 : 4) + sw, fy = -up;
      limb(ctx, lx, top, lx + (back ? -7 : 5), (top + fy) / 2 + 1, fx, fy - 3, back ? 17 : 13, back ? 10 : 8.5, f(col));
      A.oval(ctx, fx + 4, fy - 3, back ? 9.5 : 8, 3.6, 0, f(col), LINE, 1.6);
      claws(ctx, fx + 10, fy - 2.6, 4, 4.5, 0.3, LINE, 1.2);
    };
    leg(-30, 0, c.dark, true); leg(20, Math.PI, c.dark, false);
    // ---- body: armoured back, pale belly scales
    A.oval(ctx, -4, -27 + low, 42, 15, 0, f(c.hide), LINE, 2.4);
    A.oval(ctx, -2, -17 + low, 34, 4.6, 0, f(c.belly));
    if (!o.flash) {
      ctx.strokeStyle = 'rgba(120,120,60,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = 0; i < 9; i++) { const bx = -30 + i * 7; ctx.moveTo(bx, -20.5 + low); ctx.lineTo(bx, -13 + low); } ctx.stroke();
      ctx.fillStyle = c.dark;
      ctx.beginPath(); for (const [bx, by, r] of [[-26, -28, 4], [-12, -26, 3.4], [4, -29, 3.8], [18, -27, 3]]) circ(ctx, bx, by + low, r); ctx.fill();
      ctx.fillStyle = c.scute; ctx.strokeStyle = LINE; ctx.lineWidth = 1.1;
      ctx.beginPath(); for (let i = 0; i < 8; i++) { const bx = -34 + i * 8.5, by = -40.5 + low + Math.pow((bx + 4) / 42, 2) * 8; ctx.moveTo(bx - 3, by + 2); ctx.quadraticCurveTo(bx, by - 3.5, bx + 3, by + 2); ctx.closePath(); } ctx.fill(); ctx.stroke();
    }
    leg(-22, Math.PI, c.hide, true); leg(28, 0, c.hide, false);
    // ---- the Croc Emperor's royal cape, draped over his back
    if (emp) {
      const wv = Math.sin(t * 3) * 1.5;
      ctx.fillStyle = f('#5b2a86'); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, -38 + low); ctx.quadraticCurveTo(0, -50 + low, -36, -38 + low); ctx.lineTo(-42, -17 + low + wv);
      for (let i = 0; i < 6; i++) { const x0 = -42 + i * 11.5; ctx.quadraticCurveTo(x0 + 5.75, -13 + low + (i % 2 ? wv : -wv), x0 + 11.5, -17 + low + (i % 2 ? -wv : wv)); }
      ctx.lineTo(30, -38 + low); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) {
        ctx.strokeStyle = '#7d45b0'; ctx.lineWidth = 1.6;
        ctx.beginPath(); for (const fx of [-24, -6, 12]) { ctx.moveTo(fx, -44 + low); ctx.quadraticCurveTo(fx - 3, -30 + low, fx - 1, -18 + low); } ctx.stroke();
      }
      // ermine trim and a gold clasp
      ctx.strokeStyle = LINE; ctx.lineWidth = 7.5;
      ctx.beginPath(); ctx.moveTo(-42, -18 + low); for (let i = 0; i < 6; i++) { const x0 = -42 + i * 11.5; ctx.quadraticCurveTo(x0 + 5.75, -14 + low, x0 + 11.5, -18 + low); } ctx.stroke();
      ctx.strokeStyle = f('#fbf8f0'); ctx.lineWidth = 5; ctx.stroke();
      if (!o.flash) { ctx.fillStyle = '#1d1d24'; ctx.beginPath(); for (let i = 0; i < 6; i++) circ(ctx, -38 + i * 11.5, -16.5 + low, 0.9); ctx.fill(); }
      A.oval(ctx, 30, -36 + low, 4.2, 4.2, 0, f('#ffd23f'), '#8a5a00', 1.4);
    }
    // ---- head: hinged jaws with the famous toothy grin
    ctx.save();
    ctx.translate(34, -26 + low);
    ctx.rotate((run ? 0.05 : o.crouch ? -0.08 : 0) - open * 0.08);
    // lower jaw
    ctx.save();
    ctx.rotate(open * 0.55);
    if (open > 0.04) A.oval(ctx, 20, -0.5, 19, 3.2 * open + 0.5, 0, '#e89aa0');
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    ctx.beginPath(); for (let tx = 7; tx < 40; tx += 5.5) { ctx.moveTo(tx, 0); ctx.lineTo(tx + 1.8, -4.2); ctx.lineTo(tx + 3.6, 0); } ctx.fill(); ctx.stroke();
    ctx.fillStyle = f(c.hide); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(41, -0.5); ctx.quadraticCurveTo(47, 1.5, 43, 6); ctx.lineTo(2, 10); ctx.quadraticCurveTo(-6, 8, -4, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) { ctx.fillStyle = c.belly; ctx.beginPath(); ctx.moveTo(4, 7.6); ctx.lineTo(40, 4.6); ctx.quadraticCurveTo(38, 7, 34, 7.2); ctx.lineTo(4, 9.6); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // upper jaw and skull
    ctx.save();
    ctx.rotate(-open * 0.22);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    ctx.beginPath(); for (let tx = 5; tx < 43; tx += 5.5) { const big = tx % 11 < 5.5 ? 1.6 : 0; ctx.moveTo(tx, 1); ctx.lineTo(tx + 1.8, 5.2 + big); ctx.lineTo(tx + 3.6, 1); } ctx.fill(); ctx.stroke();
    if (emp) { ctx.fillStyle = f('#ffd23f'); ctx.beginPath(); ctx.moveTo(21.5, 1); ctx.lineTo(23.3, 6.8); ctx.lineTo(25.1, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = f(c.hide); ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-6, 2); ctx.lineTo(-8, -10); ctx.quadraticCurveTo(-2, -20, 8, -19); ctx.quadraticCurveTo(14, -19, 18, -13);
    ctx.lineTo(40, -9); ctx.quadraticCurveTo(48, -9, 48, -3); ctx.quadraticCurveTo(48, 2, 41, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.fillStyle = c.dark;
      ctx.beginPath(); circ(ctx, 24, -9, 1.4); circ(ctx, 30, -8, 1.2); circ(ctx, 35, -7.5, 1.2); circ(ctx, 2, -10, 1.6); circ(ctx, 12, -11, 1.3); ctx.fill();
      if (o.captain) {
        // two old scars on the snout, stitched up (comically badly)
        ctx.strokeStyle = '#e9b4a4'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(25.5, -10.2); ctx.lineTo(31.5, -3); ctx.moveTo(36.5, -9.4); ctx.quadraticCurveTo(39, -7, 42, -7.2); ctx.stroke();
        ctx.strokeStyle = LINE; ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (const k of [0.25, 0.5, 0.75]) { const sx = lerp(25.5, 31.5, k), sy = lerp(-10.2, -3, k); ctx.moveTo(sx - 1.6, sy + 1.2); ctx.lineTo(sx + 1.6, sy - 1.2); }
        ctx.moveTo(38, -9.6); ctx.lineTo(37.6, -6.6); ctx.moveTo(40.2, -8.6); ctx.lineTo(40.4, -5.8);
        ctx.stroke();
      }
    }
    // the grin: the jaw line curls up at the back (bigger and meaner for the Emperor)
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(44, 1); ctx.quadraticCurveTo(20, 3.2, 2, 1.6);
    if (emp) { ctx.quadraticCurveTo(-4, 0.5, -5, -7); ctx.moveTo(-5, -7); ctx.lineTo(-7.5, -6); } else ctx.quadraticCurveTo(-3, 0.8, -3.5, -3.5);
    ctx.stroke();
    A.oval(ctx, 44, -8.5, 3.4, 2.2, 0, f(c.hide), LINE, 1.4);
    A.oval(ctx, 44.5, -9, 1.1, 0.8, 0, LINE);
    // eye on its bump: yellow, slit pupil, heavy lid, mean brow
    A.oval(ctx, 7, -17.5, 6.4, 5.6, 0, f(c.hide), LINE, 2);
    A.oval(ctx, 7.6, -18.4, 4.2, 3.4, 0, white(o, '#d4e157'), LINE, 1.1);
    A.oval(ctx, 8.6, -18.2, 1, 3, 0, '#1b1430');
    ctx.fillStyle = f(c.hide);
    ctx.beginPath(); ctx.ellipse(7.6, -18.4, 4.8, 4, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(2.6, emp ? -24 : -22.6); ctx.lineTo(12.6, -19.6); ctx.stroke();
    if (emp) {
      // the crown, tipped at a jaunty angle
      ctx.save(); ctx.translate(0, -21); ctx.rotate(-0.18);
      ctx.fillStyle = f('#ffd23f'); ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-9.5, -9); ctx.lineTo(-4.5, -4); ctx.lineTo(-1, -12); ctx.lineTo(2.5, -4); ctx.lineTo(7.5, -9); ctx.lineTo(6.5, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) {
        A.oval(ctx, -1, -2, 1.7, 1.7, 0, '#e63946'); A.oval(ctx, -5.5, -1.6, 1.1, 1.1, 0, '#3a86ff'); A.oval(ctx, 3.6, -1.6, 1.1, 1.1, 0, '#52b788');
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); circ(ctx, -1, -12, 1.1); circ(ctx, -9.5, -9, 0.9); circ(ctx, 7.5, -9, 0.9); ctx.fill();
      }
      ctx.restore();
    }
    if (o.captain) {
      // the captain's cap, pulled down over his brow at a jaunty angle (its peak points along the snout)
      ctx.save(); ctx.translate(-3, -19); ctx.rotate(-0.12);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.fillStyle = f('#fbfbf6');
      ctx.beginPath(); ctx.moveTo(-9.5, -2.5); ctx.quadraticCurveTo(-13, -10.5, -3, -12.2); ctx.quadraticCurveTo(9, -13.4, 11.5, -6.5); ctx.quadraticCurveTo(11, -4, 7.5, -2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) { ctx.fillStyle = 'rgba(150,160,175,0.35)'; ctx.beginPath(); ctx.moveTo(-9, -3.5); ctx.quadraticCurveTo(0, -6.5, 10.5, -5); ctx.quadraticCurveTo(10, -3.2, 7.5, -2.8); ctx.lineTo(-9, -2.8); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = f('#1d2433');
      ctx.beginPath(); ctx.roundRect(-9.5, -3.6, 17.5, 5.6, 1.2); ctx.fill(); ctx.stroke();
      // the black peak, with a gold braid along its top
      ctx.fillStyle = f('#141418');
      ctx.beginPath(); ctx.moveTo(4, -0.6); ctx.quadraticCurveTo(11, -1.6, 16.5, 1.6); ctx.quadraticCurveTo(11, 3, 3.5, 1.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(6.5, -0.2); ctx.quadraticCurveTo(11, -0.6, 14.5, 1); ctx.stroke();
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-8.6, -0.8); ctx.lineTo(7.2, -0.8); ctx.stroke();
      }
      // the gold anchor badge on the front
      A.oval(ctx, 2.6, -7.2, 3, 2.7, 0, f('#ffd23f'), '#8a5a00', 0.9);
      if (!o.flash) {
        ctx.strokeStyle = '#6a4400'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(2.6, -9.2); ctx.lineTo(2.6, -5.4); ctx.moveTo(1.3, -8.4); ctx.lineTo(3.9, -8.4); ctx.moveTo(1, -6.6); ctx.quadraticCurveTo(2.6, -4.6, 4.2, -6.6); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
    ctx.restore();
    if (roll > 0 && roll < 1 && !o.flash) {
      // spin lines above and below
      whoosh(ctx, -4, -26, 36, -2.7, -0.45, 2, 2.5);
      whoosh(ctx, -4, -26, 36, 0.45, 2.7, 2, 2.5);
    }
    ctx.restore();
  };

  // ================================================================ the Grand Grinner (the giant quokka boss)
  // A.grandGrinner(ctx, x, y, o): the throne's base on the ground at (x, y), about 220 px tall and 150 wide at scale 1.
  //  o.selfie 0..1 (also o.flash as a NUMBER 0..1): holds up a selfie stick, and from 0.55 a big white
  //    camera-flash burst at the phone (o.flash === true is still the white hit flash)
  //  o.summon: arms raised, glowing purple; o.angry: the smile drops, furious (red face, steam)
  //  o.jump: out of the throne, leaping, feet at (x, y), about 195 px tall (draw the empty throne
  //    where it stands with A.grinThrone(ctx, x, y, o)), about 200 px tall
  const QK = { fur: '#8f7558', dark: '#6b5640', belly: '#c9b394', face: '#a68a6a', ear: '#d9a08a' };
  const PLUSH = ['#b28c62', '#9e7c58', '#c49c6e', '#a8845e'];
  // A souvenir quokka plushie: button eyes, a stitched smile and a seam down the tummy.
  function plush(ctx, px, py, r, rot, i, o) {
    const f = (col) => white(o, col);
    const col = PLUSH[i % PLUSH.length];
    ctx.save();
    ctx.translate(px, py); ctx.rotate(rot);
    A.oval(ctx, -r * 0.5, r * 0.95, r * 0.3, r * 0.18, 0, f(col), LINE, 1.2);
    A.oval(ctx, r * 0.5, r * 0.95, r * 0.3, r * 0.18, 0, f(col), LINE, 1.2);
    A.oval(ctx, 0, r * 0.38, r * 0.8, r * 0.68, 0, f(col), LINE, 1.6);
    for (const ex of [-0.42, 0.42]) {
      A.oval(ctx, r * ex, -r * 0.92, r * 0.25, r * 0.25, 0, f(col), LINE, 1.3);
      A.oval(ctx, r * ex, -r * 0.9, r * 0.13, r * 0.13, 0, f('#e8a8a0'));
    }
    A.oval(ctx, 0, -r * 0.42, r * 0.62, r * 0.54, 0, f(col), LINE, 1.6);
    A.oval(ctx, 0, -r * 0.24, r * 0.34, r * 0.22, 0, f('#e6cfaa'));
    if (!o.flash) {
      ctx.fillStyle = '#1d1d24';
      ctx.beginPath(); circ(ctx, -r * 0.22, -r * 0.52, r * 0.085); circ(ctx, r * 0.22, -r * 0.52, r * 0.085); circ(ctx, 0, -r * 0.32, r * 0.07); ctx.fill();
      ctx.strokeStyle = '#5a1a1a'; ctx.lineWidth = Math.max(0.8, r * 0.07);
      ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.2, 0.25, Math.PI - 0.25); ctx.stroke();
      ctx.strokeStyle = 'rgba(43,26,20,0.45)'; ctx.lineWidth = 0.9; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(0, r * 0.02); ctx.lineTo(0, r * 0.95); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  // The throne: part 'back' (frame, crest, plushies piled up the back, seat, far armrest) or 'front'
  // (the near armrest and the plushies along the front of the seat).
  function throne(ctx, o, part) {
    const f = (col) => white(o, col);
    const t = o.t || 0;
    if (part === 'back') {
      // the gold smiley-sun crest on top
      const cy = -214;
      if (!o.flash) rays(ctx, 0, cy, 15, 24 + Math.sin(t * 3) * 2, 12, '#ffd23f', 3, t * 0.4);
      A.oval(ctx, 0, cy, 14, 14, 0, f('#ffd23f'), '#8a5a00', 2);
      ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(0, cy + 1, 8, 0.3, Math.PI - 0.3); ctx.stroke();
      A.oval(ctx, -4.5, cy - 3.5, 1.5, 2, 0, '#8a5a00'); A.oval(ctx, 4.5, cy - 3.5, 1.5, 2, 0, '#8a5a00');
      // the tall arched back in pink velvet, trimmed with gold
      ctx.fillStyle = f('#c2306e'); ctx.strokeStyle = LINE; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(-68, -56); ctx.lineTo(-64, -168); ctx.quadraticCurveTo(-60, -204, 0, -204); ctx.quadraticCurveTo(60, -204, 64, -168); ctx.lineTo(68, -56); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = f('#ffd23f'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-60, -60); ctx.lineTo(-57, -166); ctx.quadraticCurveTo(-54, -196, 0, -196); ctx.quadraticCurveTo(54, -196, 57, -166); ctx.lineTo(60, -60); ctx.stroke();
      // plushies piled up the back
      let i = 0;
      for (const [px, py, r, rot] of [[-44, -100, 15, -0.2], [44, -102, 15, 0.2], [-16, -96, 15, 0.05], [16, -98, 15, -0.08],
        [-38, -130, 15, 0.15], [0, -128, 15, 0], [38, -132, 15, -0.12], [-24, -160, 15, -0.1], [24, -160, 15, 0.12], [0, -184, 14, 0.04]]) plush(ctx, px, py, r, rot, i++, o);
      // the seat cushion and its base
      ctx.fillStyle = f('#a8235a'); ctx.strokeStyle = LINE; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.roundRect(-74, -66, 148, 66, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = f('#e04a8a');
      ctx.beginPath(); ctx.roundRect(-78, -72, 156, 16, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = f('#ffd23f'); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-70, -48); ctx.lineTo(70, -48); ctx.stroke();
      // the far armrest: two plushies stacked
      plush(ctx, -72, -80, 14, -0.15, 1, o);
      plush(ctx, -70, -108, 12, 0.1, 2, o);
    } else {
      plush(ctx, 72, -82, 14, 0.15, 3, o);
      plush(ctx, 70, -110, 12, -0.1, 0, o);
      let i = 0;
      for (const px of [-54, -24, 6, 36]) plush(ctx, px, -18, 15, (i % 2 ? 0.08 : -0.08), i++ + 1, o);
    }
  }
  A.grinThrone = function (ctx, x, y, o) {
    o = o || {};
    begin(ctx, x, y, o);
    ctx.scale(0.91, 0.91);
    throne(ctx, o, 'back');
    throne(ctx, o, 'front');
    ctx.restore();
  };
  function bigQuokka(ctx, o, sit, cam) {
    const f = (col) => white(o, col);
    const t = o.t || 0, angry = !!o.angry, summon = !!o.summon && !angry;
    const shake = angry ? Math.sin(t * 40) * 1.4 : 0;
    const B = sit ? { x: 4, y: -112, rx: 42, ry: 50 } : { x: 2, y: -86, rx: 38, ry: 46 };
    const H = sit ? { x: 16 + shake * 0.5, y: -182 } : { x: 18, y: -154 };
    ctx.save();
    if (!sit) { ctx.rotate(-0.1); }
    // a purple glow while summoning
    const shR = { x: B.x + 24, y: B.y - 36 }, shL = { x: B.x - 22, y: B.y - 36 };
    let pL = sit ? { x: -56, y: -88 } : { x: -44, y: -150 }, pR = sit ? { x: 62, y: -86 } : { x: 60, y: -160 };
    if (summon) { pL = { x: B.x - 34, y: H.y - 62 + Math.sin(t * 6) * 4 }; pR = { x: B.x + 46, y: H.y - 68 - Math.sin(t * 6) * 4 }; }
    if (angry && sit) { pL = { x: -40, y: -106 + shake }; pR = { x: 56, y: -112 - shake }; }
    if (cam > 0) pR = { x: lerp(pR.x, B.x + 50, Math.min(1, cam * 2)), y: lerp(pR.y, B.y - 76, Math.min(1, cam * 2)) };
    if (summon && !o.flash) {
      for (let i = 0; i < 4; i++) A.oval(ctx, B.x, B.y - 30, B.rx + 26 + i * 14 + Math.sin(t * 5 + i) * 4, B.ry + 50 + i * 14, 0, 'rgba(170,90,255,0.11)');
      for (const p of [pL, pR]) {
        A.oval(ctx, p.x, p.y, 24 + Math.sin(t * 8) * 3, 24 + Math.sin(t * 8) * 3, 0, 'rgba(200,140,255,0.35)');
        for (let i = 0; i < 4; i++) { const a = t * 3 + (i * TAU) / 4; A.star(ctx, p.x + Math.cos(a) * 28, p.y + Math.sin(a) * 28, 5, '#f0d8ff'); }
      }
    }
    // tail and feet (leaping: stretched out behind)
    ctx.fillStyle = f(QK.dark); ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    if (sit) {
      A.oval(ctx, 40, -57, 18, 6.5, 0.3, f(QK.dark), LINE, 2);
      A.oval(ctx, 22, -76, 27, 15, 0.08, f(QK.fur), LINE, 2.4);
    } else {
      A.taper(ctx, B.x - 30, B.y + 24, B.x - 48, B.y + 36, B.x - 62, B.y + 30, 14, 5); ctx.fill(); ctx.stroke();
      A.oval(ctx, -18, -14, 19, 7, 0.9, f(QK.dark), LINE, 2);
      A.oval(ctx, -6, -44, 17, 24, 0.55, f(QK.fur), LINE, 2.4);
    }
    // back arm
    const arm = (sh, p, col, fist) => {
      ctx.fillStyle = f(col); ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
      A.taper(ctx, sh.x, sh.y, (sh.x + p.x) / 2 + 3, (sh.y + p.y) / 2 + 4, p.x, p.y, 15, 11); ctx.fill(); ctx.stroke();
      A.oval(ctx, p.x, p.y, fist ? 8.5 : 7.5, fist ? 8 : 6.5, 0, f(QK.dark), LINE, 2);
      if (fist) { ctx.strokeStyle = LINE; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x + 2, p.y - 6); ctx.lineTo(p.x + 3, p.y + 5); ctx.stroke(); }
    };
    arm(shL, pL, QK.dark, angry);
    // body, belly, the sponsor's sash and medal
    A.oval(ctx, B.x, B.y, B.rx, B.ry, 0, f(QK.fur), LINE, 2.6);
    A.oval(ctx, B.x + 10, B.y + 8, B.rx * 0.6, B.ry * 0.72, 0, f(QK.belly));
    ctx.save();
    ctx.beginPath(); ctx.ellipse(B.x, B.y, B.rx - 1, B.ry - 1, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = f('#2a6fdb'); ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(B.x - 38, B.y - 44); ctx.lineTo(B.x + 40, B.y + 36); ctx.stroke();
    if (!o.flash) { ctx.strokeStyle = '#1f55ad'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B.x - 44, B.y - 38); ctx.lineTo(B.x + 34, B.y + 42); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = f('#e63946'); ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(B.x - 4, B.y - 34); ctx.lineTo(B.x + 6, B.y - 10); ctx.lineTo(B.x + 20, B.y - 34); ctx.stroke();
    A.oval(ctx, B.x + 6, B.y - 6, 10, 10, 0, f('#ffd23f'), '#8a5a00', 2);
    A.star(ctx, B.x + 6, B.y - 6, 6.5, f('#fff3b0'));
    // the head: round ears, a crown, the face
    const hx = H.x, hy = H.y;
    for (const [ex, ey] of [[-20, -28], [16, -31]]) {
      A.oval(ctx, hx + ex, hy + ey, 13, 13, 0, f(QK.fur), LINE, 2.2);
      A.oval(ctx, hx + ex, hy + ey + 1.5, 7, 7, 0, f(QK.ear));
    }
    A.oval(ctx, hx, hy, 36, 32, 0, f(QK.fur), LINE, 2.8);
    A.oval(ctx, hx + 12, hy + 12, 23, 16, 0, f(QK.belly));
    if (angry && !o.flash) A.oval(ctx, hx + 6, hy - 2, 32, 26, 0, 'rgba(230,57,70,0.35)');
    if (!o.flash && !angry) { A.oval(ctx, hx - 10, hy + 9, 7, 5, 0, 'rgba(240,130,130,0.55)'); A.oval(ctx, hx + 34, hy + 9, 6, 5, 0, 'rgba(240,130,130,0.55)'); }
    // the crown (hopping off his head mid-leap)
    ctx.save();
    ctx.translate(hx - 2, hy - 30 - (sit ? 0 : 10)); ctx.rotate(sit ? -0.15 : -0.4);
    ctx.fillStyle = f('#ffd23f'); ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-13, 2); ctx.lineTo(-15, -13); ctx.lineTo(-7, -6); ctx.lineTo(0, -17); ctx.lineTo(7, -6); ctx.lineTo(15, -13); ctx.lineTo(13, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) { A.oval(ctx, 0, -2.5, 2.6, 2.6, 0, '#e63946'); A.oval(ctx, -7.5, -2, 1.7, 1.7, 0, '#3a86ff'); A.oval(ctx, 7.5, -2, 1.7, 1.7, 0, '#52b788'); }
    ctx.restore();
    // eyes
    const eyes = [[hx - 1, hy - 8], [hx + 21, hy - 9]];
    ctx.strokeStyle = LINE;
    if (angry) {
      for (const [ex, ey] of eyes) {
        A.oval(ctx, ex, ey, 6, 4.5, 0, '#ffffff', LINE, 1.6);
        A.oval(ctx, ex + 1.5, ey + 0.5, 2.4, 2.6, 0, '#c1121f');
        ctx.fillStyle = f(QK.fur);
        ctx.beginPath(); ctx.moveTo(ex - 8, ey - 10); ctx.lineTo(ex + 8, ey - 10); ctx.lineTo(ex + 8, ey + (ex < hx ? -3 : -1)); ctx.lineTo(ex - 8, ey + (ex < hx ? -1 : -3)); ctx.closePath(); ctx.fill();
      }
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(hx - 10, hy - 18); ctx.lineTo(hx + 6, hy - 10); ctx.moveTo(hx + 12, hy - 10); ctx.lineTo(hx + 30, hy - 19); ctx.stroke();
    } else if (cam > 0.4) {
      // "say cheese!": eyes squeezed into happy arcs
      ctx.lineWidth = 3;
      for (const [ex, ey] of eyes) { ctx.beginPath(); ctx.arc(ex, ey + 2, 5.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    } else if (summon) {
      for (const [ex, ey] of eyes) {
        A.oval(ctx, ex, ey, 7, 7, 0, o.flash ? '#ffffff' : '#f0d8ff', LINE, 1.6);
        A.oval(ctx, ex, ey, 3.5, 3.5, 0, '#b04dff');
        if (!o.flash) rays(ctx, ex, ey, 9, 13, 8, 'rgba(200,140,255,0.8)', 1.6, t * 2);
      }
    } else {
      // unsettlingly happy: wide eyes, tiny pupils, a twinkle
      for (const [ex, ey] of eyes) {
        A.oval(ctx, ex, ey, 6.2, 7, 0, '#ffffff', LINE, 1.6);
        A.oval(ctx, ex + 1.4, ey + 0.5, 2.4, 2.6, 0, '#141418');
        A.oval(ctx, ex + 2.2, ey - 0.4, 0.9, 0.9, 0, '#ffffff');
      }
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(hx - 1, hy - 12, 8, Math.PI * 1.2, Math.PI * 1.75); ctx.moveTo(hx + 15, hy - 18); ctx.arc(hx + 21, hy - 13, 8, Math.PI * 1.25, Math.PI * 1.8); ctx.stroke();
    }
    A.oval(ctx, hx + 31, hy + 2, 6.5, 4.6, 0, LINE);
    // the mouth: the huge grin (wider still for the camera), or the dropped smile
    if (angry) {
      ctx.fillStyle = '#5a1a1a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(hx + 1, hy + 24); ctx.quadraticCurveTo(hx + 16, hy + 8, hx + 33, hy + 22); ctx.quadraticCurveTo(hx + 16, hy + 17, hx + 1, hy + 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx + 6, hy + 19); ctx.quadraticCurveTo(hx + 16, hy + 11, hx + 28, hy + 18); ctx.lineTo(hx + 27, hy + 20.5); ctx.quadraticCurveTo(hx + 16, hy + 15, hx + 7, hy + 21.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      // steam from the ears and an angry vein
      if (!o.flash) {
        for (let i = 0; i < 2; i++) { const k = (t * 1.6 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; puff(ctx, hx - 30 - k * 10, hy - 40 - k * 26, 5 + k * 6); puff(ctx, hx + 30 + k * 10, hy - 44 - k * 26, 5 + k * 6); }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#e63946'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) { const a = i * (Math.PI / 2) + 0.785, vx = hx + 22 + Math.cos(a) * 4, vy = hy - 24 + Math.sin(a) * 4; ctx.moveTo(vx + Math.cos(a + 1.9) * 3, vy + Math.sin(a + 1.9) * 3); ctx.arc(vx, vy, 3, a + 1.9, a + 4.4); }
        ctx.stroke();
      }
    } else {
      const w = cam > 0.4 ? 1.25 : 1;
      ctx.fillStyle = '#5a1a1a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(hx - 6 * w, hy + 9); ctx.quadraticCurveTo(hx + 16, hy + 13, hx + 36 + 4 * (w - 1), hy + 8);
      ctx.quadraticCurveTo(hx + 18, hy + 36 * w, hx - 6 * w, hy + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx - 3 * w, hy + 10); ctx.quadraticCurveTo(hx + 16, hy + 14, hx + 33, hy + 9.6); ctx.lineTo(hx + 31, hy + 14); ctx.quadraticCurveTo(hx + 16, hy + 18, hx - 1, hy + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); for (let tx = 4; tx < 30; tx += 6) { ctx.moveTo(hx + tx, hy + 12.4); ctx.lineTo(hx + tx, hy + 15.6); } ctx.stroke();
      A.oval(ctx, hx + 16, hy + 22 * w, 8, 4, 0, '#ff8fab');
      ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx - 9 * w, hy + 5); ctx.lineTo(hx - 6 * w, hy + 9); ctx.moveTo(hx + 39, hy + 4); ctx.lineTo(hx + 36, hy + 8); ctx.stroke();
    }
    // the near arm, with the selfie stick
    if (cam > 0) {
      const sx = pR.x + 26, sy = pR.y - 76;
      ctx.strokeStyle = LINE; ctx.lineWidth = 5.5;
      ctx.beginPath(); ctx.moveTo(pR.x, pR.y); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.strokeStyle = f('#9aa3ad'); ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.33);
      ctx.fillStyle = f('#ff4fa3'); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-9, -15, 18, 28, 4); ctx.fill(); ctx.stroke();
      A.oval(ctx, -3.5, -9, 2.6, 2.6, 0, '#1d1d24');
      ctx.restore();
      if (cam > 0.55 && !o.flash) {
        const k = (cam - 0.55) / 0.45;
        A.oval(ctx, sx, sy, 30 + k * 70, 30 + k * 70, 0, 'rgba(255,255,255,' + (0.25 + k * 0.35).toFixed(3) + ')');
        rays(ctx, sx, sy, 16, 40 + k * 60, 14, 'rgba(255,250,210,0.9)', 3, t);
        A.star(ctx, sx, sy, 16 + k * 22, '#ffffff');
        A.star(ctx, sx, sy, 8 + k * 10, '#fff3b0');
      }
    }
    arm(shR, pR, QK.fur, angry);
    ctx.restore();
  }
  A.grandGrinner = function (ctx, x, y, o) {
    o = o || {};
    const cam = k01(o.selfie !== undefined ? o.selfie : typeof o.flash === 'number' ? o.flash : 0);
    const q = Object.assign({}, o, { flash: o.flash === true });
    begin(ctx, x, y, q);
    ctx.scale(0.91, 0.91);
    if (o.jump) {
      bigQuokka(ctx, q, false, cam);
    } else {
      throne(ctx, q, 'back');
      bigQuokka(ctx, q, true, cam);
      throne(ctx, q, 'front');
    }
    ctx.restore();
  };

  // ================================================================ the Time Rift giants (grumpy, confused, not evil)
  // A few "?" and dizzy stars over a confused giant's head (o.confused).
  function confused(ctx, x, y, t, s) {
    ctx.save();
    ctx.font = 'bold ' + Math.round(14 * s) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3 * s; ctx.strokeStyle = LINE; ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.8 + i * 0.5) % 1, qx = x + (i ? 14 : -10) * s, qy = y - k * 16 * s;
      ctx.globalAlpha = Math.min(1, (1 - k) * 2);
      ctx.strokeText('?', qx, qy); ctx.fillText('?', qx, qy);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const a = t * 4 + (i * TAU) / 3; A.star(ctx, x + Math.cos(a) * 18 * s, y + 12 * s + Math.sin(a) * 5 * s, 4 * s, '#fff3b0'); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- Diprotodon (about 120 px tall, 215 long)
  // The largest marsupial that ever lived: a rhino-sized, wombat-like giant. o.charging (head down, galloping,
  // snorting), o.stomp 0..1 (rears up, then slams its front feet down: shock rings from 0.8), o.confused.
  const DIPRO = { fur: '#7d6650', dark: '#5e4b3a', belly: '#a08670', snout: '#9a8068', nose: '#3a2e26' };
  A.diprotodon = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, DIPRO, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, stomp = k01(o.stomp), run = !!o.charging;
    const low = o.crouch ? 6 : 0;
    const step = run ? t * 14 : o.moving ? t * 6 : 0;
    const rear = stomp < 0.55 ? ease(stomp / 0.55) : stomp < 0.8 ? 1 - ease((stomp - 0.55) / 0.25) : 0;
    begin(ctx, x, y, o);
    if (run && !o.flash) dust(ctx, -96, 0, t, 4, 1, 8);
    if (stomp >= 0.8 && !o.flash) {
      // the ground shakes where the front feet land
      const k = (stomp - 0.8) / 0.2;
      ctx.strokeStyle = 'rgba(255,243,176,' + (1 - k).toFixed(3) + ')'; ctx.lineWidth = 3;
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(56, 0, 30 + k * 60 + i * 18, 6 + k * 8 + i * 3, 0, Math.PI, TAU); ctx.stroke(); }
      dust(ctx, 80, 0, k * 0.3, 3, -1, 8); dust(ctx, 30, 0, k * 0.3, 3, 1, 8);
    }
    ctx.save();
    // rearing up: pivot on the back feet
    ctx.translate(-56, 0); ctx.rotate(-0.3 * rear); ctx.translate(56, 0);
    const leg = (lx, ph, col, front) => {
      const sw = step ? Math.sin(step + ph) * (run ? 9 : 5) : 0, up = step ? Math.max(0, -Math.cos(step + ph)) * (run ? 7 : 3) : 0;
      const top = -46 + low, fx = lx + sw + (front ? 3 : 0), fy = -up - (front ? rear * 6 : 0);
      ctx.fillStyle = f(col); ctx.strokeStyle = LINE; ctx.lineWidth = 2.4;
      A.taper(ctx, lx, top, lx + sw * 0.5, (top + fy) / 2, fx, fy - 4, 27, 21); ctx.fill(); ctx.stroke();
      A.oval(ctx, fx + 4, fy - 4, 14, 5.5, 0, f(col), LINE, 2);
      ctx.fillStyle = f('#e8dcc0'); ctx.lineWidth = 1.1;
      ctx.beginPath(); for (const cx of [10, 14, 18]) { ctx.moveTo(fx + cx - 2, fy - 2); ctx.lineTo(fx + cx + 2.5, fy - 1); ctx.lineTo(fx + cx - 1, fy + 0.4); ctx.closePath(); } ctx.fill(); ctx.stroke();
    };
    leg(-50, Math.PI, c.dark, false); leg(56, 0, c.dark, true);
    // tiny stub of a tail, the huge barrel body, shaggy fur
    A.oval(ctx, -92, -66 + low, 7, 5, 0.4, f(c.dark), LINE, 2);
    A.oval(ctx, -8, -68 + low, 84, 45, 0, f(c.fur), LINE, 3);
    A.oval(ctx, 0, -38 + low, 62, 14, 0, f(c.belly));
    if (!o.flash) {
      ctx.strokeStyle = c.dark; ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) { const bx = -76 + i * 17, by = -102 + low + Math.pow((bx + 8) / 84, 2) * 26; ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - 4, by + 9, bx - 2, by + 16); }
      for (const [bx, by] of [[-60, -64], [-34, -58], [-6, -66], [22, -60], [-46, -82], [6, -86]]) { ctx.moveTo(bx, by + low); ctx.lineTo(bx - 4, by + 8 + low); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,220,0.22)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-60, -100 + low); ctx.quadraticCurveTo(-10, -114 + low, 40, -102 + low); ctx.stroke();
    }
    leg(-62, 0, c.fur, false); leg(44, Math.PI, c.fur, true);
    // the big blunt wombat-like head: small ears, little eyes, a grumpy frown
    ctx.save();
    ctx.translate(78, -72 + low);
    ctx.rotate(run ? 0.18 : o.crouch ? 0.1 : 0);
    if (run) ctx.translate(4, 8);
    A.oval(ctx, -14, -24, 8, 8.5, -0.3, f(c.dark), LINE, 2);
    A.oval(ctx, -13, -23, 4, 4.5, -0.3, f('#c9a48a'));
    A.oval(ctx, 0, 0, 31, 28, 0, f(c.fur), LINE, 2.8);
    A.oval(ctx, 26, 10, 19, 16, 0.1, f(c.snout), LINE, 2.4);
    A.oval(ctx, 38, 4, 10, 11, 0.1, f(c.nose), LINE, 1.6);
    if (!o.flash) { A.oval(ctx, 40, 1, 2.4, 3, 0.3, '#1d1612'); A.oval(ctx, 41, 9, 2.2, 2.6, 0.3, '#1d1612'); A.oval(ctx, 35, -1, 2, 1.4, 0.3, 'rgba(255,255,255,0.35)'); }
    // two chunky front teeth peeking out
    ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(28, 22, 5, 7, 1.5); ctx.roundRect(33.5, 21.5, 5, 7, 1.5); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, 22); ctx.quadraticCurveTo(22, 18, 28, 22); ctx.stroke();
    if (o.confused) {
      A.oval(ctx, 10, -8, 4.8, 5, 0, '#ffffff', LINE, 1.4);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); for (let i = 0; i <= 14; i++) { const k = i / 14, a = t * 6 + k * TAU * 1.8; if (i) ctx.lineTo(10 + Math.cos(a) * k * 4, -8 + Math.sin(a) * k * 4); else ctx.moveTo(10, -8); } ctx.stroke();
    } else {
      A.oval(ctx, 10, -8, 3.6, 3.8, 0, '#ffffff', LINE, 1.4);
      A.oval(ctx, 11.2, -7.6, 1.8, 2, 0, '#141418');
    }
    ctx.strokeStyle = LINE; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(2, -16); ctx.quadraticCurveTo(10, -12, 18, -15); ctx.stroke();
    if (run && !o.flash) {
      // snort!
      for (let i = 0; i < 2; i++) { const k = (t * 2.5 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; puff(ctx, 52 + k * 18, 2 + k * 6, 3 + k * 5); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.restore();
    if (o.confused) confused(ctx, 84, -118, t, 1);
    ctx.restore();
  };

  // ---------------------------------------------------------------- Thylacoleo, the marsupial lion
  // About 90 px tall and 170 long: a muscular, leopard-sized hunter with a short, deep face, bladed teeth
  // and a huge hooked claw on each thumb. o.pounce (a leap, claws out), o.bite 0..1 (lunges, jaws wide),
  // o.crouch (winding up), o.charging, o.moving, o.confused.
  const LEO = { fur: '#b88a52', dark: '#8f6534', belly: '#ead4a8', saddle: '#a27443', nose: '#3a2a22' };
  A.thylacoleo = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, LEO, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, bite = k01(o.bite), air = !!(o.pounce || o.air), run = !!o.charging && !air;
    const low = o.crouch && !air ? 10 : 0;
    const step = run ? t * 16 : o.moving ? t * 9 : 0;
    begin(ctx, x, y, o);
    ctx.scale(0.91, 0.91);
    if (run && !o.flash) dust(ctx, -70, 0, t, 3, 1, 6);
    if (air) { ctx.translate(0, -24); ctx.rotate(-0.18); }
    // the long, strong tail
    const tsw = Math.sin(t * 2) * 4;
    ctx.fillStyle = f(c.fur); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    A.taper(ctx, -48, -60 + low, -80, air ? -66 : -56 + low + tsw * 0.3, air ? -110 : -100, air ? -60 : -24 + tsw, 15, 6); ctx.fill(); ctx.stroke();
    if (!o.flash) { ctx.fillStyle = c.dark; A.oval(ctx, air ? -110 : -100, air ? -60 : -24 + tsw, 4, 4, 0, c.dark); }
    // legs: hind legs with big thighs, heavy forelegs with the thumb claw
    const hind = (lx, ph, col) => {
      const sw = step ? Math.sin(step + ph) * (run ? 12 : 7) : 0, up = step ? Math.max(0, -Math.cos(step + ph)) * (run ? 8 : 4) : 0;
      let fx = lx - 4 + sw, fy = -up;
      if (air) { fx = lx - 34; fy = -24; }
      A.oval(ctx, lx + 2, -50 + low, 17, 22, -0.25, f(col), LINE, 2.2);
      limb(ctx, lx - 4, -38 + low, lx - 14 + sw * 0.4, -22 + low * 0.5, fx, fy - 3, 11, 8, f(col));
      A.oval(ctx, fx + 6, fy - 3, 9, 3.6, air ? 0.5 : 0, f(col), LINE, 1.8);
    };
    const front = (lx, ph, col, near) => {
      const sw = step ? Math.sin(step + ph) * (run ? 12 : 7) : 0, up = step ? Math.max(0, -Math.cos(step + ph)) * (run ? 8 : 4) : 0;
      let fx = lx + 2 + sw, fy = -up;
      if (air) { fx = lx + 42; fy = -50; }
      limb(ctx, lx, -56 + low, lx + (air ? 18 : 4) + sw * 0.3, (-56 + low + fy) / 2 + (air ? -8 : 0), fx, fy - 4, 19, 13, f(col));
      A.oval(ctx, fx + 5, fy - 4, 10, 5, air ? -0.3 : 0, f(col), LINE, 1.8);
      // the great hooked thumb claw (bigger, out and gleaming when pouncing or winding up)
      const cl = air || o.crouch ? 1.5 : 1.15;
      ctx.fillStyle = f('#f6efe0'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(fx - 1, fy - 8); ctx.quadraticCurveTo(fx + 6 * cl, fy - 18 * cl, fx + 14 * cl, fy - 9 * cl); ctx.quadraticCurveTo(fx + 8, fy - 10, fx + 4, fy - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = f('#e8dcc0');
      ctx.beginPath(); for (const cx of [11, 14]) { ctx.moveTo(fx + cx - 2, fy - 2); ctx.lineTo(fx + cx + 2.5, fy - 1); ctx.lineTo(fx + cx - 1, fy + 0.4); ctx.closePath(); } ctx.fill(); ctx.stroke();
    };
    hind(-30, Math.PI, c.dark); front(34, 0, c.dark);
    // body: a deep, muscular chest, darker saddle, pale belly
    A.oval(ctx, -6, -54 + low, 46, 21, air ? -0.05 : 0, f(c.fur), LINE, 2.6);
    A.oval(ctx, 26, -50 + low, 22, 23, 0, f(c.fur), LINE, 2.6);
    A.oval(ctx, -6, -54 + low, 44.5, 19.5, 0, f(c.fur));
    A.oval(ctx, 2, -38 + low, 34, 6, 0, f(c.belly));
    if (!o.flash) {
      ctx.fillStyle = c.saddle;
      ctx.beginPath(); ctx.ellipse(-10, -66 + low, 34, 8, -0.02, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(80,50,20,0.4)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(20, -64 + low); ctx.quadraticCurveTo(30, -56 + low, 28, -44 + low); ctx.moveTo(-26, -58 + low); ctx.quadraticCurveTo(-18, -50 + low, -20, -42 + low); ctx.stroke();
    }
    hind(-38, 0, c.fur); front(26, Math.PI, c.fur, true);
    // the short, deep, powerful head
    ctx.save();
    ctx.translate(52 + bite * 12, -68 + low + (air ? 4 : 0));
    ctx.rotate((run ? 0.12 : 0) + (o.crouch ? 0.15 : 0) - bite * 0.1);
    ctx.scale(1.2, 1.2);
    for (const [ex, ey] of [[-12, -15], [-5, -17]]) { A.oval(ctx, ex, ey, 5.5, 6, -0.2, f(ex < -8 ? c.dark : c.fur), LINE, 1.8); A.oval(ctx, ex + 0.5, ey + 1, 2.8, 3.2, -0.2, f('#d9a08a')); }
    A.oval(ctx, 0, 0, 18, 16, 0, f(c.fur), LINE, 2.4);
    const gape = Math.max(bite, air ? 0.7 : o.crouch ? 0.35 : run ? 0.25 : 0);
    // lower jaw (opens wide for a bite)
    ctx.save(); ctx.translate(4, 6); ctx.rotate(gape * 0.75);
    if (gape > 0.05) A.oval(ctx, 9, -1, 9, 2.6, 0, '#5a1a1a');
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(15.5, -7); ctx.lineTo(17.5, -1); ctx.closePath(); ctx.moveTo(6, -1); ctx.lineTo(9, -4); ctx.lineTo(12, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = f(c.belly); ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(19, -1); ctx.quadraticCurveTo(20, 4, 15, 6); ctx.lineTo(-2, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // the short, deep muzzle with big front teeth
    ctx.save(); ctx.rotate(-gape * 0.15);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(17, 6); ctx.lineTo(19, 13); ctx.lineTo(21, 6); ctx.closePath(); ctx.moveTo(10, 7); ctx.lineTo(13, 11); ctx.lineTo(16, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, 13, 2, 12, 9, 0.05, f(c.belly), LINE, 2.2);
    A.oval(ctx, 23, -2, 4.4, 3.4, 0.2, c.nose);
    if (!gape) { ctx.strokeStyle = LINE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(22, 6); ctx.quadraticCurveTo(14, 9, 6, 7); ctx.stroke(); }
    ctx.restore();
    // amber eye and a heavy, grumpy brow
    if (o.confused) {
      A.oval(ctx, 3, -6, 4, 4, 0, '#ffffff', LINE, 1.2);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = 0; i <= 14; i++) { const k = i / 14, a = t * 6 + k * TAU * 1.8; if (i) ctx.lineTo(3 + Math.cos(a) * k * 3.4, -6 + Math.sin(a) * k * 3.4); else ctx.moveTo(3, -6); } ctx.stroke();
    } else {
      A.oval(ctx, 4, -6, 3.6, 3, 0, white(o, '#f2b33a'), LINE, 1.2);
      A.oval(ctx, 5, -5.8, 1.5, 2.2, 0, '#141418');
    }
    ctx.strokeStyle = LINE; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-3, -11); ctx.lineTo(10, -8); ctx.stroke();
    ctx.restore();
    if (bite > 0.6 && !o.flash) whoosh(ctx, 40, -66, 40, -0.6, 0.2, 2, 2.5);
    if (o.confused) confused(ctx, 50, -104, t, 1);
    ctx.restore();
  };

  // ---------------------------------------------------------------- Procoptodon, the giant short-faced kangaroo
  // About 2 m tall: 200 px at scale 1. A flat, short face, long arms with two long-clawed fingers, and a
  // single big hoof-like toe on each foot. o.kick 0..1 (leans back on its tail, both feet forward), o.air
  // (hopping), o.moving (hops along), o.crouch, o.confused.
  const PROC = { fur: '#b5703f', dark: '#8a4f2a', belly: '#ecc9a0', face: '#7a5236', ear: '#e3a08a', hoof: '#3d2d24', line: '#3b1a10' };
  A.procoptodon = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, PROC, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, kick = k01(o.kick);
    let air = o.air ? 1 : 0, bob = 0;
    if (o.moving && !air) { air = Math.abs(Math.sin(t * 5)); bob = air * 18; }
    const crouch = o.crouch ? 1 : 0;
    let lean = air ? 0.4 : 0.12;
    lean = lean * (1 - kick) - 0.6 * kick + crouch * 0.35;
    const breathe = Math.sin(t * 2.5) * 1.5;
    begin(ctx, x, y, o);
    ctx.translate(0, -bob);
    ctx.scale(1.3, 1.3);
    const hipX = -6, hipY = -40 + crouch * 12;
    // the tail: resting on the ground, lifted mid-hop, or a prop for a kick
    const tipX = lerp(lerp(-78, -84, air), -36, kick), tipY = lerp(lerp(-3, -34, air), 0, kick);
    ctx.fillStyle = f(c.fur); ctx.strokeStyle = c.line; ctx.lineWidth = 2.5;
    A.taper(ctx, hipX - 6, hipY + 4, lerp(-42, -48, air) * (1 - kick) - 30 * kick, lerp(-12, -26, air) * (1 - kick) - 20 * kick, tipX, tipY, 24, 6);
    ctx.fill(); ctx.stroke();
    // legs: the long foot ends in one big hoof-like toe
    const leg = (dx, col) => {
      const heelX = lerp(lerp(hipX - 6, hipX - 22, air), hipX + 26, kick) + dx;
      const heelY = lerp(lerp(-6, hipY + 14, air), hipY - 8, kick);
      const ang = lerp(lerp(0.02, 0.62, air), -0.12, kick);
      const toeX = heelX + Math.cos(ang) * 38, toeY = heelY + Math.sin(ang) * 38 * (1 - kick * 0.2);
      ctx.fillStyle = f(col); ctx.strokeStyle = c.line; ctx.lineWidth = 2.5;
      A.taper(ctx, hipX + 6 + dx, hipY + 8, lerp(hipX + 4, hipX + 20, kick) + dx, lerp(hipY + 22, hipY, kick), heelX, heelY, 17, 12);
      ctx.fill(); ctx.stroke();
      A.taper(ctx, heelX, heelY, (heelX + toeX) / 2, (heelY + toeY) / 2 - 2, toeX, toeY, 13, 10);
      ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(toeX, toeY); ctx.rotate(ang);
      ctx.fillStyle = f(c.hoof); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-3, -6); ctx.quadraticCurveTo(10, -7, 12, 0); ctx.quadraticCurveTo(10, 5, -3, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) { ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1, -3.5); ctx.quadraticCurveTo(7, -4.5, 9, -1); ctx.stroke(); }
      ctx.restore();
      A.oval(ctx, hipX + 6 + dx + kick * 10, hipY + 6 - kick * 8, 24, 17, lerp(-0.35, -0.95, kick), f(col), c.line, 2.5);
    };
    leg(-5, c.dark);
    // arms: long, with two long curved claws on each hand
    const paw = (back) => {
      const d = back ? -7 : 0;
      let p = { x: 24 + d, y: -30 + (back ? 3 : 0) };
      if (crouch) p = { x: 30 + d, y: -40 };
      if (kick) p = { x: lerp(p.x, 14 + d, kick), y: lerp(p.y, -66, kick) };
      return p;
    };
    const arm = (back) => {
      const sh = { x: 14 + (back ? -6 : 0), y: -64 }, p = paw(back);
      ctx.fillStyle = f(back ? c.dark : c.fur); ctx.strokeStyle = c.line; ctx.lineWidth = 2.2;
      A.taper(ctx, sh.x, sh.y, (sh.x + p.x) / 2 + 5, (sh.y + p.y) / 2 + 4, p.x, p.y, 13, 9);
      ctx.fill(); ctx.stroke();
      A.oval(ctx, p.x + 2, p.y, 6, 5.5, 0, f(c.dark), c.line, 2);
      ctx.strokeStyle = c.line; ctx.lineWidth = 4;
      ctx.beginPath(); for (const fy of [-2, 3]) { ctx.moveTo(p.x + 5, p.y + fy); ctx.quadraticCurveTo(p.x + 14, p.y + fy + 1, p.x + 13, p.y + fy + 9); } ctx.stroke();
      ctx.strokeStyle = f('#f1e8d6'); ctx.lineWidth = 2; ctx.stroke();
    };
    ctx.save();
    ctx.translate(hipX, hipY); ctx.rotate(lean);
    arm(true);
    A.oval(ctx, 7, -38 - breathe * 0.5, 26, 40, 0.05, f(c.fur), c.line, 2.5);
    A.oval(ctx, 14, -34, 13, 28, 0.1, f(c.belly));
    ctx.restore();
    leg(0, c.fur);
    ctx.save();
    ctx.translate(hipX, hipY); ctx.rotate(lean);
    // the head: short rounded ears, a deep skull and a flat, short, dark face
    ctx.save();
    ctx.translate(16, -72);
    ctx.rotate(-lean * 0.7);
    for (const [ex, ey, er] of [[-8, -30, -0.45], [-1, -32, -0.15]]) {
      A.oval(ctx, ex, ey, 6, 11, er, f(c.fur), c.line, 2.2);
      A.oval(ctx, ex + 1, ey + 2, 2.8, 6.5, er, f(c.ear));
    }
    A.oval(ctx, 4, -14, 16, 15, 0, f(c.fur), c.line, 2.5);
    A.oval(ctx, 15, -8, 9, 9.5, 0.1, f(c.face), c.line, 2.2);
    A.oval(ctx, 21, -11, 4.4, 3.4, 0.2, f('#2b1a14'));
    ctx.strokeStyle = c.line; ctx.lineWidth = 2;
    if (kick || o.crouch) A.oval(ctx, 17, -2, 4, 2.6, 0, '#5a1a1a');
    else { ctx.beginPath(); ctx.moveTo(21, -3); ctx.quadraticCurveTo(17, -1, 13, -3); ctx.stroke(); }
    if (o.confused) {
      A.oval(ctx, 8, -19, 4.6, 5, 0, '#ffffff', c.line, 1.5);
      ctx.strokeStyle = c.line; ctx.lineWidth = 1.2;
      ctx.beginPath(); for (let i = 0; i <= 14; i++) { const k = i / 14, a = t * 6 + k * TAU * 1.8; if (i) ctx.lineTo(8 + Math.cos(a) * k * 4, -19 + Math.sin(a) * k * 4); else ctx.moveTo(8, -19); } ctx.stroke();
    } else {
      A.oval(ctx, 8, -19, 4.4, 4.8, 0, '#ffffff', c.line, 1.5);
      A.oval(ctx, 9.4, -18.6, 2.3, 2.6, 0, '#1b1430');
      A.oval(ctx, 10, -19.6, 0.8, 0.8, 0, '#ffffff');
    }
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(2, -26); ctx.lineTo(13, -23.5); ctx.stroke();
    ctx.restore();
    arm(false);
    ctx.restore();
    if (o.confused) confused(ctx, 26, -166 + crouch * 12, t, 0.8);
    ctx.restore();
  };

  // ================================================================ allies and cameos
  // ---------------------------------------------------------------- mountain pygmy possum (about 27 px tall)
  // Tiny and grey-brown, with big dark eyes and a long, thin, curling tail. Sits up like a little mouse.
  // o.wave (waves a paw), o.moving / o.air (scampering, hopping), o.crouch.
  const PYGMY = { fur: '#8c7d6c', dark: '#6b5e51', belly: '#ece2d2', ear: '#f0b4ac', nose: '#f29aa8', tail: '#b9a597' };
  A.pygmyPossum = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, PYGMY, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, air = !!o.air;
    const hop = (o.moving || o.charging) && !air ? Math.abs(Math.sin(t * 12)) * 3 : air ? 5 : 0;
    const low = o.crouch ? 2.5 : 0;
    begin(ctx, x, y, o);
    ctx.scale(0.78, 0.78);
    ctx.translate(0, -hop);
    // the long thin tail, its tip curling up
    const sw = Math.sin(t * 2) * 1.5;
    ctx.fillStyle = f(c.tail); ctx.strokeStyle = LINE; ctx.lineWidth = 1.1;
    strip(ctx, quad(-5, -5, -14, 2, -21, -3 + sw, 10), 2.8, 2.1); ctx.fill(); ctx.stroke();
    curl(ctx, -21, -3 + sw, -2.2, 4.5, -3.8, 2.1, 0.8); ctx.fill(); ctx.stroke();
    // feet, body, belly
    A.oval(ctx, 1, -1.6, 4.6, 1.8, 0, f(c.ear), LINE, 1);
    A.oval(ctx, 5, -1.4, 4.6, 1.8, 0, f(c.ear), LINE, 1);
    A.oval(ctx, 0, -9 + low * 0.5, 8, 9.2, 0.1, f(c.fur), LINE, 1.6);
    A.oval(ctx, 2.6, -8 + low * 0.5, 4.8, 6.8, 0.1, f(c.belly));
    // little arms: one holding its tummy, one waving
    ctx.fillStyle = f(c.dark); ctx.lineWidth = 1.1;
    const wv = Math.sin(t * 10);
    if (o.wave) { A.taper(ctx, 5, -13 + low, 9, -18, 10 + wv * 2, -24 + Math.abs(wv), 3, 2.4); ctx.fill(); ctx.stroke(); A.oval(ctx, 10 + wv * 2, -24.5 + Math.abs(wv), 1.8, 1.6, 0, f(c.ear), LINE, 0.8); }
    else { A.taper(ctx, 5, -13 + low, 8, -11, 8, -8 + low, 3, 2.4); ctx.fill(); ctx.stroke(); A.oval(ctx, 8.4, -7.6 + low, 1.7, 1.4, 0, f(c.ear), LINE, 0.8); }
    // head: big round ears, enormous dark eyes, a pointy pink nose
    const hx = 4, hy = -20 + low;
    for (const [ex, ey] of [[-5, -5.5], [1.2, -7]]) {
      A.oval(ctx, hx + ex, hy + ey, 3.4, 3.6, 0, f(ex < -2 ? c.dark : c.fur), LINE, 1.2);
      A.oval(ctx, hx + ex + 0.3, hy + ey + 0.3, 1.9, 2.1, 0, f(c.ear));
    }
    A.oval(ctx, hx, hy, 7.2, 6.4, 0, f(c.fur), LINE, 1.6);
    ctx.fillStyle = f(c.fur); ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(hx + 4, hy - 2.5); ctx.quadraticCurveTo(hx + 9, hy - 1, hx + 10.5, hy + 1); ctx.quadraticCurveTo(hx + 8, hy + 3.2, hx + 4, hy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, hx + 10.4, hy + 0.8, 1.4, 1.1, 0, f(c.nose));
    A.oval(ctx, hx + 3, hy - 1.4, 3.2, 3.2, 0, '#22180f');
    A.oval(ctx, hx + 2.8, hy - 1.4, 2.7, 2.8, 0, '#141418');
    A.oval(ctx, hx + 3.8, hy - 2.5, 1, 1, 0, '#ffffff');
    A.oval(ctx, hx + 2.2, hy - 0.2, 0.45, 0.45, 0, '#ffffff');
    ctx.strokeStyle = LINE; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(hx + 9.6, hy + 2.4); ctx.quadraticCurveTo(hx + 8, hy + 3.4, hx + 6.4, hy + 2.6); ctx.stroke();
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(hx + 8, hy + 1); ctx.lineTo(hx + 14, hy - 0.5); ctx.moveTo(hx + 8, hy + 1.8); ctx.lineTo(hx + 14, hy + 2.6); ctx.stroke();
    ctx.restore();
  };

  // ---------------------------------------------------------------- the sloth (a cameo from The Sloth Slap Game)
  // A sleepy cartoon sloth in its top hat. Sitting: about 85 px tall (105 with the hat), feet at (x, y).
  // o.hang: hanging upside-down from a branch whose top is at y (the branch is drawn; its hat sits on the
  // branch). o.wave (a slow, sleepy wave), o.sleep (eyes shut, zzz), o.hat === false (no top hat).
  const SLOTH = { fur: '#9c7a54', dark: '#6e5236', face: '#f1dfbd', mask: '#4a3424', belly: '#b8976c', claw: '#f4e7c5' };
  function slothClaws(ctx, x, y, a, o, curlDown) {
    ctx.strokeStyle = white(o, SLOTH.claw); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      const bx = x + Math.cos(a + Math.PI / 2) * i * 3, by = y + Math.sin(a + Math.PI / 2) * i * 3;
      const ex = bx + Math.cos(a) * 7, ey = by + Math.sin(a) * 7;
      ctx.moveTo(bx, by); ctx.quadraticCurveTo(ex, ey, ex + Math.cos(a + (curlDown ? 1.4 : -1.4)) * 4, ey + Math.sin(a + (curlDown ? 1.4 : -1.4)) * 4);
    }
    ctx.stroke();
  }
  function topHat(ctx, o) {
    const f = (col) => white(o, col);
    ctx.fillStyle = f('#1d1d24'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.roundRect(-9, -22, 18, 21, 2); ctx.fill(); ctx.stroke();
    A.oval(ctx, 0, -1, 15, 3.4, 0, f('#1d1d24'), LINE, 1.8);
    ctx.fillStyle = f('#e63946'); ctx.fillRect(-8.2, -7.5, 16.4, 4);
  }
  function slothHead(ctx, c, o, t) {
    const f = (col) => white(o, col);
    // messy tuft, head, pale face, the dark eye-stripes, pink cheeks
    ctx.fillStyle = f(c.fur); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(-10, -22); ctx.lineTo(-5, -15); ctx.lineTo(-1, -24); ctx.lineTo(3, -15); ctx.lineTo(8, -21); ctx.lineTo(8, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, 0, 0, 19, 17, 0, f(c.fur), LINE, 2.2);
    A.oval(ctx, 4, 2, 15, 11.5, 0, f(c.face));
    A.oval(ctx, -3, 0, 6.6, 3.8, 0.55, f(c.mask));
    A.oval(ctx, 11, 0, 6.6, 3.8, -0.55, f(c.mask));
    if (!o.flash) { A.oval(ctx, -6, 7, 3.4, 2.2, 0, 'rgba(255,120,140,0.45)'); A.oval(ctx, 15, 7, 3.4, 2.2, 0, 'rgba(255,120,140,0.45)'); }
    // sleepy eyes: half shut (or closed when asleep, with a slow blink)
    const shut = o.sleep || (t % 4.1) < 0.25;
    for (const ex of [-2.5, 10.5]) {
      if (shut) { ctx.strokeStyle = f(c.face); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(ex, -0.5, 2.6, 0.3, Math.PI - 0.3); ctx.stroke(); continue; }
      A.oval(ctx, ex, 0, 2.8, 2.9, 0, '#ffffff');
      A.oval(ctx, ex + 0.8, 0.6, 1.6, 1.8, 0, '#1a0f08');
      ctx.fillStyle = f(c.mask);
      ctx.beginPath(); ctx.ellipse(ex, 0, 3.1, 3.2, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    }
    A.oval(ctx, 4, 4.5, 3.6, 2.6, 0, '#2a1a10');
    ctx.strokeStyle = '#3a2015'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(4, 7.5, 4, 0.3, Math.PI - 0.3); ctx.stroke();
  }
  A.sloth = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, SLOTH, o.colors || {});
    const f = (col) => white(o, col);
    const t = o.t || 0, hat = o.hat !== false;
    begin(ctx, x, y, o);
    if (o.hang) {
      // the branch, with the top hat parked on it
      ctx.fillStyle = '#6b4a2e'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-64, 0, 128, 10, 5); ctx.fill(); ctx.stroke();
      for (const [lx, r] of [[-56, 0.5], [48, -0.5], [-6, 0.3]]) A.oval(ctx, lx, -3, 8, 3.5, r, '#4f9a3a', LINE, 1.2);
      if (hat) { ctx.save(); ctx.translate(-40, 0); ctx.rotate(-0.08); topHat(ctx, o); ctx.restore(); }
      const sway = Math.sin(t * 1.2) * 0.04;
      ctx.rotate(sway);
      const limbTo = (sx, sy, hx, col, claw) => {
        ctx.fillStyle = f(col); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
        A.taper(ctx, sx, sy, (sx + hx) / 2 + 2, (sy + 3) / 2, hx, 4, 10, 8); ctx.fill(); ctx.stroke();
        A.oval(ctx, hx, 4, 5, 4.5, 0, f(c.dark), LINE, 1.4);
        if (claw) slothClaws(ctx, hx - 1, 1, -Math.PI / 2, o, false);
      };
      // far limbs, body (belly up), near limbs
      limbTo(-12, 30, -18, c.dark, true);
      limbTo(12, 28, 16, c.dark, true);
      A.oval(ctx, 0, 36, 27, 19, 0, f(c.fur), LINE, 2.2);
      A.oval(ctx, 2, 28, 18, 9, 0, f(c.belly));
      if (!o.flash) {
        ctx.strokeStyle = c.dark; ctx.lineWidth = 1.6;
        ctx.beginPath(); for (const [sx, sy] of [[-18, 40], [-6, 48], [8, 47], [-20, 30]]) { ctx.moveTo(sx, sy); ctx.lineTo(sx - 3, sy + 6); } ctx.stroke();
      }
      limbTo(-20, 32, -28, c.fur, true);
      if (!o.wave) limbTo(20, 30, 26, c.fur, true);
      // the head hangs upside-down at the front
      ctx.save(); ctx.translate(30, 44); ctx.scale(1, -1); ctx.rotate(0.15);
      slothHead(ctx, c, o, t);
      ctx.restore();
      if (o.wave) {
        // one arm lets go for a slow, dangly wave
        const a = 0.8 + Math.sin(t * 3) * 0.3, px = 18 + Math.cos(a) * 40, py = 30 + Math.sin(a) * 40;
        ctx.fillStyle = f(c.fur); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
        A.taper(ctx, 18, 30, (18 + px) / 2 + 2, (30 + py) / 2 + 3, px, py, 10, 8); ctx.fill(); ctx.stroke();
        A.oval(ctx, px, py, 5, 4.5, 0, f(c.dark), LINE, 1.4);
        slothClaws(ctx, px + 1, py + 2, a, o, true);
      }
      if (o.sleep && !o.flash) zzz(ctx, 46, 58, t);
      ctx.restore();
      return;
    }
    // sitting: back arm, legs, body, head, near arm
    ctx.fillStyle = f(c.dark); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    A.taper(ctx, -10, -46, -22, -26, -16, -8, 11, 8); ctx.fill(); ctx.stroke();
    A.oval(ctx, -15, -7, 5, 4.5, 0, f(c.dark), LINE, 1.4);
    slothClaws(ctx, -12, -5, 0.3, o, true);
    A.oval(ctx, -4, -9, 13, 9, 0, f(c.dark), LINE, 1.8);
    A.oval(ctx, 18, -5, 10, 5, 0, f(c.dark), LINE, 1.6);
    slothClaws(ctx, 26, -6, 0, o, true);
    A.oval(ctx, 0, -33, 22, 27, 0, f(c.fur), LINE, 2.2);
    A.oval(ctx, 5, -29, 13, 18, 0.05, f(c.belly));
    if (!o.flash) {
      ctx.strokeStyle = c.dark; ctx.lineWidth = 1.8;
      ctx.beginPath(); for (const [sx, sy] of [[-16, -46], [-19, -30], [-14, -16], [-6, -54], [16, -46]]) { ctx.moveTo(sx, sy); ctx.lineTo(sx - 3, sy + 7); } ctx.stroke();
    }
    A.oval(ctx, 8, -12, 14, 9.5, -0.1, f(c.fur), LINE, 2);
    ctx.save(); ctx.translate(6, -66); ctx.rotate(Math.sin(t * 1.3) * 0.04);
    slothHead(ctx, c, o, t);
    if (hat) { ctx.save(); ctx.translate(2, -15); ctx.rotate(-0.12); topHat(ctx, o); ctx.restore(); }
    ctx.restore();
    // near arm: resting on the knee, or a slow wave
    let px = 22, py = -18;
    const a = -1.25 + Math.sin(t * 3) * 0.35;
    if (o.wave) { px = 10 + Math.cos(a) * 34; py = -46 + Math.sin(a) * 34; }
    ctx.fillStyle = f(c.fur); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    A.taper(ctx, 10, -46, (10 + px) / 2 + 3, (-46 + py) / 2 + 2, px, py, 11, 8.5); ctx.fill(); ctx.stroke();
    A.oval(ctx, px, py, 5.5, 5, 0, f(c.dark), LINE, 1.4);
    slothClaws(ctx, px + 2, py + (o.wave ? -2 : 1), o.wave ? a : 0.4, o, !o.wave);
    if (o.sleep && !o.flash) zzz(ctx, 22, -88, t);
    ctx.restore();
  };
  function zzz(ctx, x, y, t) {
    ctx.save();
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 2.5; ctx.strokeStyle = LINE; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.5 + i / 3) % 1;
      ctx.globalAlpha = Math.min(1, (1 - k) * 2);
      ctx.strokeText('z', x + k * 10 + i * 2, y - k * 18); ctx.fillText('z', x + k * 10 + i * 2, y - k * 18);
    }
    ctx.restore();
  }
})();
