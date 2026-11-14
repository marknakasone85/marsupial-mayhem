// THE TOP END bonus world (a tropical harbour in Australia's far north), all drawn in code: the 'topend'
// background (a hot tropical sky with far-off monsoon thunderheads, a generic low harbour town and a jetty
// across the water, a line of mangroves, palms and pandanus, red-brown earth with a strip of green grass),
// its ground plant, wharf platforms, murky estuary water, humid weather, and decorations: magnetic termite
// mounds, pandanus palms, a big mangrove tree, a croc warning sign, a background wharf with a tour boat
// and a half-sunken dinghy.
// Loaded right after creatures.js. It wraps A.background, A.groundPlant, A.platform, A.water, A.weather and
// A.decor once more (other themes and types fall through to the earlier versions).
// No real landmarks or brands: the town, the port, the jetties, the boats and the sign are all generic.
(function () {
  const A = MG.Art;
  const W = MG.W, H = MG.H;
  const LINE = '#2b1a14';
  const TAU = Math.PI * 2;
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const hash = (n) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const mod = (a, n) => ((a % n) + n) % n;

  // ---------------------------------------------------------------- little helpers
  // Sub-paths (no stray joining lines) so many shapes can share one fill. Radii are clamped.
  function circ(ctx, x, y, r) { r = Math.max(0.1, r); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  function ell(ctx, x, y, rx, ry, rot) {
    rx = Math.max(0.1, rx); ry = Math.max(0.1, ry);
    ctx.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
    ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  }
  // Items spaced `gap` apart in a parallax layer moving at `f` of the camera: fn(screenX, index).
  function each(camX, f, gap, margin, fn) {
    const off = camX * f;
    const first = Math.floor((off - margin) / gap), last = Math.ceil((off + W + margin) / gap);
    for (let i = first; i <= last; i++) fn(i * gap - off, i);
  }
  // A filled skyline: height above baseY is h(layerX), filled down to bottomY.
  function ridge(ctx, camX, f, baseY, bottomY, color, h) {
    const off = camX * f;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, bottomY);
    for (let sx = -10; sx <= W + 20; sx += 15) ctx.lineTo(sx, baseY - h(sx + off));
    ctx.lineTo(W + 20, bottomY);
    ctx.closePath();
    ctx.fill();
  }
  function skyFill(ctx, bottom, c0, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, bottom);
    g.addColorStop(0, c0); g.addColorStop(0.62, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, bottom);
  }
  const CLOUD = [[0, 0, 22], [24, -8, 26], [52, 0, 20], [26, 6, 22]];
  // n puffy clouds drifting with the wind (speed) and a little with the camera (f); s = size
  function clouds(ctx, camX, t, n, y0, dy, f, speed, color, s) {
    const span = W + 320 * s;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const cx = mod(i * (span / n) + hash(i + 15) * 120 - camX * f - t * speed, span) - 160 * s;
      const cy = y0 + i * dy + hash(i + 19) * 12;
      for (const [dx, ey, r] of CLOUD) circ(ctx, cx + dx * s, cy + ey * s, r * s);
    }
    ctx.fill();
  }
  // a white-hot tropical sun with a wide glow (low and orange at sunset)
  function sun(ctx, x, y, sunset) {
    ctx.fillStyle = sunset ? 'rgba(255,190,110,0.14)' : 'rgba(255,252,222,0.16)';
    ctx.beginPath(); ctx.arc(x, y, sunset ? 120 : 92, 0, TAU); ctx.fill();
    ctx.fillStyle = sunset ? 'rgba(255,200,120,0.4)' : 'rgba(255,252,230,0.5)';
    ctx.beginPath(); ctx.arc(x, y, sunset ? 82 : 56, 0, TAU); ctx.fill();
    ctx.fillStyle = sunset ? '#ffb24a' : '#fffcec';
    ctx.beginPath(); ctx.arc(x, y, sunset ? 54 : 34, 0, TAU); ctx.fill();
  }
  function dusk(ctx, a) {
    ctx.fillStyle = 'rgba(255,110,60,' + (a || 0.12) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  // Fits a line of text into maxW (a rough width estimate, so it also works without measureText).
  function fitText(ctx, str, x, y, maxW, maxSize, color) {
    const size = Math.max(7, Math.min(maxSize, maxW / (str.length * 0.66)));
    MG.UI.text(ctx, str, x, y, size, color, 'center');
  }
  // Splits a short sign text into one or two balanced lines.
  function twoLines(str) {
    const words = String(str).split(' ').filter(Boolean);
    if (words.length < 2 || str.length <= 12) return [String(str)];
    let best = 1, bestD = 1e9;
    for (let k = 1; k < words.length; k++) {
      const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length);
      if (d < bestD) { bestD = d; best = k; }
    }
    return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }
  // A toothy bite mark along a path from (x0, y0) to (x1, y1): little scallops bulging towards (cx, cy).
  function biteEdge(ctx, x0, y0, x1, y1, cx, cy, n) {
    for (let j = 1; j <= n; j++) {
      const a = lerp(x0, x1, (j - 0.5) / n), b = lerp(y0, y1, (j - 0.5) / n);
      ctx.quadraticCurveTo(lerp(a, cx, 0.22), lerp(b, cy, 0.22), lerp(x0, x1, j / n), lerp(y0, y1, j / n));
    }
  }

  // ================================================================ the background
  const BG = {};

  // A towering monsoon thunderhead far off over the sea: lumps [dx, dy, r] above its base (about
  // 290 wide and 230 tall at s = 1), an anvil blown out at the top, and now and then a soft glow
  // deep inside it (a far-off storm: no flashes across the screen).
  const STORM = [[-124, -24, 34], [-80, -36, 46], [-26, -44, 54], [36, -42, 50], [92, -32, 40], [128, -20, 28],
    [-62, -88, 44], [-6, -100, 54], [52, -86, 44], [-34, -142, 40], [18, -150, 46], [-8, -186, 36], [30, -190, 32]];
  const ANVIL = [[-22, -214, 70, 14], [52, -222, 104, 13], [118, -216, 46, 9]];
  function thunderhead(ctx, x, base, s, t, i, sunset) {
    const C = sunset ? ['#6a4c70', '#b98094', '#ffd3a8'] : ['#7d88a6', '#c6cddd', '#fdfcf7'];
    const fx = hash(i + 41) < 0.5 ? -1 : 1, sy = 0.85 + hash(i + 43) * 0.35;
    const X = (dx) => x + dx * s * fx, Y = (dy) => base + dy * s * sy;
    // a grey curtain of rain under some of them
    if (hash(i + 45) < 0.6) {
      const g = ctx.createLinearGradient(0, base, 0, base + 60);
      g.addColorStop(0, sunset ? 'rgba(106,76,112,0.45)' : 'rgba(110,122,156,0.42)'); g.addColorStop(1, sunset ? 'rgba(106,76,112,0)' : 'rgba(110,122,156,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let j = 0; j < 3; j++) { const rx = X(-70 + j * 45 + hash(i + j) * 20); ctx.moveTo(rx - 16 * s, base); ctx.lineTo(rx + 16 * s, base); ctx.lineTo(rx + 2 * s, base + 60); ctx.lineTo(rx - 30 * s, base + 60); ctx.closePath(); }
      ctx.fill();
    }
    // the dark underside and shadowed side, with a flat base
    ctx.fillStyle = C[0];
    ctx.beginPath();
    for (const [dx, dy, r] of STORM) if (dy > -160) circ(ctx, X(dx) - 5 * s, Y(dy) + 7 * s, r * s);
    for (const [dx, dy, rx, ry] of ANVIL) ell(ctx, X(dx) - 4 * s, Y(dy) + 5 * s, rx * s, ry * s, 0);
    ctx.rect(Math.min(X(-138), X(132)), base - 12 * s, 270 * s, 14 * s);
    ctx.fill();
    // the body, then the sunlit tops (lit from the upper right, where the sun is)
    ctx.fillStyle = C[1];
    ctx.beginPath();
    for (const [dx, dy, r] of STORM) if (dy < -30) circ(ctx, X(dx), Y(dy), r * 0.9 * s);
    for (const [dx, dy, rx, ry] of ANVIL) ell(ctx, X(dx), Y(dy), rx * s, ry * s, 0);
    ctx.fill();
    // now and then (each cloud about once every 12 s, for under a second) a soft glow deep in its lower
    // part: a far-off storm, kept inside the cloud, with no flash across the screen
    const k = mod(t * 0.085 + hash(i + 31) * 5.7, 1);
    if (k < 0.07) {
      const a = Math.pow(Math.sin((k / 0.07) * Math.PI), 2) * 0.5;
      const gx = x + (hash(i + 33) - 0.5) * 90 * s, gy = base - 44 * s;
      ctx.save();
      ctx.beginPath();
      for (const [dx, dy, r] of STORM) if (dy > -120) circ(ctx, X(dx), Y(dy), r * 0.9 * s);
      ctx.clip();
      const g = ctx.createRadialGradient(gx, gy, 4, gx, gy, 85 * s);
      g.addColorStop(0, 'rgba(255,250,230,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,250,230,0)');
      ctx.fillStyle = g; ctx.fillRect(gx - 85 * s, gy - 85 * s, 170 * s, 170 * s);
      ctx.restore();
    }
    ctx.fillStyle = C[2];
    ctx.beginPath();
    for (const [dx, dy, r] of STORM) if (dy < -80) circ(ctx, X(dx) + r * 0.2 * s, Y(dy) - r * 0.24 * s, r * 0.68 * s);
    for (const [dx, dy, rx, ry] of ANVIL) ell(ctx, X(dx) + 6 * s, Y(dy) - 4 * s, rx * 0.85 * s, ry * 0.6 * s, 0);
    ctx.fill();
  }

  // the far shore: a generic low town (pale boxes in the heat haze, a few palms) and a small port
  const TOWN = ['#e9e3d6', '#d6dce0', '#f1e5c8', '#cdd8cf', '#e8d3c2', '#dfe6ea'];
  function farTown(ctx, x0, hz, i, t) {
    for (let j = 0; j < 17; j++) {
      const s = i * 37 + j, bw = 16 + hash(s + 1) * 22;
      const tall = hash(s + 2) < 0.16, bh = tall ? 34 + hash(s + 3) * 28 : 9 + hash(s + 4) * 18;
      const bx = x0 + j * 30 + hash(s + 5) * 8;
      ctx.fillStyle = TOWN[Math.floor(hash(s + 6) * TOWN.length)];
      ctx.fillRect(bx, hz - bh, bw, bh + 2);
      ctx.fillStyle = 'rgba(90,110,130,0.28)';
      for (let y = hz - bh + 4; y < hz - 3; y += 6) ctx.fillRect(bx + 2, y, bw - 4, 2);
      if (!tall && hash(s + 7) < 0.4) { ctx.fillStyle = '#b9897a'; ctx.beginPath(); ctx.moveTo(bx - 2, hz - bh); ctx.lineTo(bx + bw / 2, hz - bh - 6); ctx.lineTo(bx + bw + 2, hz - bh); ctx.closePath(); ctx.fill(); }
    }
    // palms poking up between the houses
    ctx.strokeStyle = '#6f8a74'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const px = x0 + 20 + j * 86 + hash(i * 11 + j) * 30, top = hz - 24 - hash(i * 13 + j) * 10;
      ctx.moveTo(px, hz); ctx.quadraticCurveTo(px - 2, (hz + top) / 2, px + 2, top);
      for (const a of [-2.7, -2.1, -1.0, -0.4]) { ctx.moveTo(px + 2, top); ctx.quadraticCurveTo(px + 2 + Math.cos(a) * 6, top + Math.sin(a) * 5, px + 2 + Math.cos(a) * 10, top + 4); }
    }
    ctx.stroke();
    // two port cranes and a stack of shipping containers at the end of the town
    const cx = x0 + 560;
    ctx.fillStyle = '#c9a07a';
    ctx.fillRect(cx - 4, hz - 9, 40, 9);
    ctx.fillStyle = '#9fb2b8'; ctx.fillRect(cx + 8, hz - 15, 22, 6);
    ctx.strokeStyle = '#c47a5a'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (const kx of [cx + 50, cx + 84]) {
      ctx.moveTo(kx, hz); ctx.lineTo(kx, hz - 46); ctx.moveTo(kx + 14, hz); ctx.lineTo(kx + 14, hz - 46);
      ctx.moveTo(kx - 22, hz - 46); ctx.lineTo(kx + 40, hz - 46); ctx.moveTo(kx, hz - 24); ctx.lineTo(kx + 14, hz - 24);
      ctx.moveTo(kx + 7, hz - 46); ctx.lineTo(kx + 7, hz - 56);
    }
    ctx.stroke();
  }
  // a long jetty out on the water: posts, a deck, a shelter at the end and a boat tied up
  function farJetty(ctx, jx, dy, t) {
    ctx.strokeStyle = '#6a5a4c'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = jx; px <= jx + 380; px += 19) { ctx.moveTo(px, dy); ctx.lineTo(px, dy + 14); }
    ctx.stroke();
    ctx.fillStyle = '#a08a70';
    ctx.fillRect(jx - 4, dy - 3, 390, 4);
    ctx.fillStyle = '#e9e4d8'; ctx.fillRect(jx + 340, dy - 18, 38, 15);
    ctx.fillStyle = '#4a8a8a';
    ctx.beginPath(); ctx.moveTo(jx + 334, dy - 18); ctx.lineTo(jx + 359, dy - 27); ctx.lineTo(jx + 384, dy - 18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6a5a4c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let px = jx + 40; px < jx + 330; px += 72) { ctx.moveTo(px, dy - 3); ctx.lineTo(px, dy - 15); } ctx.stroke();
    const bob = Math.sin(t * 1.4) * 1.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(jx + 250, dy + 7 + bob); ctx.lineTo(jx + 292, dy + 7 + bob); ctx.lineTo(jx + 286, dy + 13 + bob); ctx.lineTo(jx + 255, dy + 13 + bob); ctx.closePath(); ctx.fill();
    ctx.fillRect(jx + 262, dy + 1 + bob, 16, 6);
    ctx.fillStyle = '#e0703a'; ctx.fillRect(jx + 252, dy + 8 + bob, 38, 1.6);
  }
  // a little boat crossing the harbour with its wake
  function harbourBoat(ctx, x, y, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-20, 3); ctx.lineTo(-48, 4); ctx.moveTo(-20, 0); ctx.lineTo(-38, -1); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(22, -4); ctx.lineTo(16, 4); ctx.lineTo(-18, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a7f9e'; ctx.fillRect(-19, -1, 38, 2);
    ctx.fillStyle = '#f2efe6'; ctx.fillRect(-10, -12, 18, 8);
    ctx.fillStyle = '#e0703a'; ctx.fillRect(-12, -14, 22, 3);
    ctx.fillStyle = '#3d5a80'; ctx.fillRect(-7, -10, 4, 3); ctx.fillRect(0, -10, 4, 3);
    ctx.restore();
  }

  // a stilt-rooted mangrove for the shoreline (no outline: it's in the distance). Fills arrays so a whole
  // row of them shares a few fills: roots (strokes), dark crowns, light crowns.
  function shoreMangrove(x, base, s, i, R, D, L) {
    for (let j = -2; j <= 2; j++) {
      if (!j) continue;
      const hy = base - (24 + hash(i + j * 3) * 14) * s;
      R.push([x + j * 2 * s, hy, x + j * 11 * s, hy - 4 * s, x + j * (13 + hash(i - j) * 5) * s, base + 2]);
    }
    R.push([x, base - 26 * s, x - 1 * s, base - 42 * s, x + 2 * s, base - 52 * s]);
    const n = 4 + Math.floor(hash(i + 7) * 2), span = 24 + hash(i + 8) * 12;
    for (let j = 0; j < n; j++) {
      const k = j / (n - 1) - 0.5;
      D.push([x + k * span * 2.2 * s, base - (58 - Math.abs(k) * 18 + Math.sin(j * 1.7 + i) * 5) * s, (18 + hash(i * 5 + j) * 8) * s]);
      if (j < n - 1) L.push([x + k * span * 1.8 * s - 4 * s, base - (70 - Math.abs(k) * 18 + Math.sin(j * 1.3 + i) * 5) * s, (8 + hash(i * 3 + j) * 4) * s]);
    }
  }
  // a little egret wading in the shallows (no outline: it's in the distance)
  function egret(ctx, x, y, t, i) {
    const peck = Math.max(0, Math.sin(t * 0.9 + i * 2.3) * 3 - 2), f = hash(i + 85) < 0.5 ? -1 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    ctx.strokeStyle = '#3a3430'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-1, -9); ctx.lineTo(-2, 0); ctx.moveTo(1.5, -9); ctx.lineTo(2, 0); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ell(ctx, 0, -12, 7, 3.6, -0.25); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    const hx = 6 + peck * 4, hy = -24 + peck * 14;
    ctx.beginPath(); ctx.moveTo(4, -13); ctx.quadraticCurveTo(8, -18, hx, hy); ctx.stroke();
    ctx.beginPath(); ell(ctx, hx, hy, 2.4, 2, 0); ctx.fill();
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(hx + 1.5, hy); ctx.lineTo(hx + 7, hy + 1 + peck * 2); ctx.stroke();
    ctx.restore();
  }
  // background palms on the grassy bank: a coconut palm, or a pandanus on its prop roots
  function bankPalm(ctx, x, base, s, i, T, F, P) {
    if (hash(i + 61) < 0.5) {
      const lean = (hash(i + 62) - 0.5) * 30 * s, top = base - (96 + hash(i + 63) * 30) * s;
      T.push([x, base, x + lean * 0.2, (base + top) / 2, x + lean, top, 5 * s]);
      for (let j = 0; j < 8; j++) {
        const a = -Math.PI + (j / 7) * Math.PI + (hash(i * 9 + j) - 0.5) * 0.3, L = (30 + hash(i * 7 + j) * 10) * s;
        F.push([x + lean, top, x + lean + Math.cos(a) * L * 0.6, top + Math.sin(a) * L * 0.5 - 6 * s, x + lean + Math.cos(a) * L, top + Math.sin(a) * L * 0.3 + 14 * s]);
      }
    } else {
      const top = base - (60 + hash(i + 64) * 22) * s;
      T.push([x, base - 12 * s, x - 2 * s, (base + top) / 2, x, top + 18 * s, 4.5 * s]);
      for (const d of [-1, 1]) T.push([x, top + 20 * s, x + d * 8 * s, top + 10 * s, x + d * 16 * s, top + (d < 0 ? 4 : 0) * s, 3.5 * s]);
      for (const d of [-1, -0.4, 0.4, 1]) T.push([x + d * 3 * s, base - 14 * s, x + d * 8 * s, base - 8 * s, x + d * 14 * s, base, 2 * s]);
      for (const [tx, ty] of [[x - 16 * s, top + 4 * s], [x + 16 * s, top], [x, top + 12 * s]]) P.push([tx, ty, 14 * s]);
    }
  }

  const tpBank = (x) => 10 + Math.sin(x * 0.006) * 5 + Math.sin(x * 0.017 + 2) * 3;
  BG.topend = function (ctx, camX, t, gy, sunset) {
    const hz = gy - 172, shoreY = gy - 84;
    skyFill(ctx, hz + 2, sunset ? '#2b2150' : '#1f78cc', sunset ? '#e37c5c' : '#86c8ee', sunset ? '#ffcb8c' : '#f5edcf');
    sun(ctx, sunset ? 700 : 780, sunset ? hz - 44 : 70, sunset);
    // monsoon thunderheads towering far off over the sea, and a few fair-weather clouds
    each(camX, 0.02, 760, 420, (sx, i) => {
      if (hash(i + 1) < 0.2) return;
      thunderhead(ctx, sx + hash(i + 2) * 280, hz - 22 - hash(i + 3) * 26, 0.7 + hash(i + 4) * 0.45, t, i, sunset);
    });
    clouds(ctx, camX, t, 3, 40, 26, 0.05, 5, sunset ? 'rgba(255,196,170,0.8)' : 'rgba(255,255,255,0.9)', 0.75);
    // a pair of far birds circling
    ctx.strokeStyle = sunset ? 'rgba(50,30,50,0.7)' : 'rgba(40,50,70,0.55)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let j = 0; j < 2; j++) {
      const a = t * 0.35 + j * 2.4, bx = mod(300 + j * 90 - camX * 0.04, W + 200) - 100 + Math.cos(a) * 40, by = 150 + Math.sin(a) * 14, f = Math.sin(t * 4 + j) * 2;
      ctx.moveTo(bx - 8, by - f); ctx.quadraticCurveTo(bx - 4, by - 4, bx, by); ctx.quadraticCurveTo(bx + 4, by - 4, bx + 8, by - f);
    }
    ctx.stroke();
    // the far shore: bush, then the town and its port, all in the heat haze
    const shore = (x) => 4 + Math.sin(x * 0.012) * 3 + Math.sin(x * 0.037 + 1) * 2;
    const off05 = camX * 0.05;
    ctx.fillStyle = sunset ? '#7a7a78' : '#7f9c88';
    ctx.beginPath(); ctx.moveTo(-10, hz + 3);
    const b0 = Math.floor((off05 - 10) / 12);
    for (let k = b0; k * 12 - off05 <= W + 24; k++) { const bx = k * 12 - off05; ctx.quadraticCurveTo(bx - 6, hz - shore(bx + off05) - 8 - hash(k + 71) * 8, bx, hz - shore(bx + off05)); }
    ctx.lineTo(W + 24, hz + 3); ctx.closePath(); ctx.fill();
    each(camX, 0.05, 1500, 700, (sx, i) => farTown(ctx, sx + 120 + hash(i + 72) * 200, hz + 1, i, t));
    ctx.fillStyle = sunset ? 'rgba(255,200,150,0.2)' : 'rgba(245,240,220,0.22)';
    ctx.fillRect(0, hz - 64, W, 66); ctx.fillRect(0, hz - 34, W, 36); ctx.fillRect(0, hz - 14, W, 16);
    // the harbour: warm tropical water with wavelets and glints
    ctx.fillStyle = sunset ? '#647090' : '#4ea8bc';
    ctx.fillRect(0, hz, W, shoreY - hz + 4);
    ctx.fillStyle = sunset ? 'rgba(160,140,120,0.35)' : 'rgba(120,180,140,0.35)';
    ctx.fillRect(0, hz + 40, W, shoreY - hz - 36);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, hz, W, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 0.1, 46, 30, (sx, i) => {
      const wy = hz + 8 + hash(i + 81) * (shoreY - hz - 20), wx = sx + hash(i + 82) * 30 + Math.sin(t * 1.5 + i) * 4;
      ctx.moveTo(wx - 7, wy); ctx.quadraticCurveTo(wx, wy - 3, wx + 7, wy);
    });
    ctx.stroke();
    each(camX, 0.1, 1700, 420, (sx, i) => farJetty(ctx, sx + 500 + hash(i + 83) * 300, hz + 26, t));
    harbourBoat(ctx, mod(t * 14 - camX * 0.1, W + 260) - 100, hz + 52, 1);
    // the near shore: wet mud and a line of mangroves standing in it
    ctx.fillStyle = '#6f604c';
    ctx.fillRect(0, shoreY, W, gy - shoreY);
    ctx.fillStyle = 'rgba(200,215,220,0.25)';
    ctx.beginPath(); each(camX, 0.22, 60, 30, (sx, i) => ell(ctx, sx + hash(i + 91) * 30, shoreY + 6 + hash(i + 92) * 8, 14 + hash(i + 93) * 16, 1.6, 0)); ctx.fill();
    ctx.fillStyle = sunset ? 'rgba(255,190,150,0.5)' : 'rgba(170,215,232,0.55)';
    ctx.beginPath(); each(camX, 0.22, 90, 40, (sx, i) => { if (hash(i + 98) < 0.6) ell(ctx, sx + hash(i + 99) * 40, shoreY + 24 + hash(i + 100) * 14, 12 + hash(i + 89) * 18, 2.6, 0); }); ctx.fill();
    const R = [], D = [], L = [];
    each(camX, 0.22, 78, 120, (sx, i) => {
      if (hash(Math.floor(i / 5) + 94) < 0.22 && hash(i + 95) < 0.7) return;
      shoreMangrove(sx + hash(i + 96) * 30, shoreY + 6, 0.8 + hash(i + 97) * 0.4, i, R, D, L);
    });
    ctx.strokeStyle = '#4e4436'; ctx.lineWidth = 2.2;
    ctx.beginPath(); for (const r of R) { ctx.moveTo(r[0], r[1]); ctx.quadraticCurveTo(r[2], r[3], r[4], r[5]); } ctx.stroke();
    ctx.fillStyle = sunset ? '#3a5040' : '#2f5f40';
    ctx.beginPath(); for (const c of D) circ(ctx, c[0], c[1], c[2]); ctx.fill();
    ctx.fillStyle = sunset ? '#4d6a4c' : '#3f7a4c';
    ctx.beginPath(); for (const c of L) circ(ctx, c[0], c[1], c[2]); ctx.fill();
    // white egrets wading on the mud flats, now and then stabbing at a crab
    each(camX, 0.22, 560, 40, (sx, i) => { if (hash(i + 88) < 0.55) egret(ctx, sx + hash(i + 87) * 200, shoreY + 30 + hash(i + 86) * 6, t, i); });
    // the grassy bank of red earth, with palms and pandanus standing on it
    const off35 = camX * 0.35;
    ridge(ctx, camX, 0.35, gy - 36, gy, '#8fa04a', (x) => tpBank(x) - 2);
    ctx.strokeStyle = '#9a5434'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-10, gy - 37 - tpBank(off35 - 10));
    for (let sx = 5; sx <= W + 20; sx += 15) ctx.lineTo(sx, gy - 37 - tpBank(sx + off35));
    ctx.stroke();
    const T = [], F = [], P = [];
    each(camX, 0.35, 150, 160, (sx, i) => {
      if (hash(i + 101) < 0.35) return;
      const px = sx + hash(i + 102) * 70;
      bankPalm(ctx, px, gy - 36 - tpBank(px + off35) + 6, 0.95 + hash(i + 103) * 0.4, i, T, F, P);
    });
    ctx.strokeStyle = '#7a6450'; ctx.lineCap = 'round';
    const byWidth = {};
    for (const tr of T) { const k = Math.max(2, Math.round(tr[6])); (byWidth[k] || (byWidth[k] = [])).push(tr); }
    for (const k in byWidth) { ctx.lineWidth = +k; ctx.beginPath(); for (const tr of byWidth[k]) { ctx.moveTo(tr[0], tr[1]); ctx.quadraticCurveTo(tr[2], tr[3], tr[4], tr[5]); } ctx.stroke(); }
    ctx.strokeStyle = sunset ? '#3f6440' : '#3f7d3c'; ctx.lineWidth = 3.5;
    ctx.beginPath(); for (const f of F) { ctx.moveTo(f[0], f[1]); ctx.quadraticCurveTo(f[2], f[3], f[4], f[5]); } ctx.stroke();
    ctx.strokeStyle = sunset ? '#4f7a48' : '#5a9a48'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [px, py, r] of P) for (let j = 0; j < 9; j++) { const a = -Math.PI * 1.08 + (j / 8) * Math.PI * 1.16; ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.8 + (Math.abs(Math.cos(a)) > 0.8 ? 5 : 0)); }
    ctx.stroke();
    // small magnetic termite mounds out on the bank, all facing the same way
    ctx.fillStyle = '#9a8c78';
    ctx.beginPath();
    each(camX, 0.35, 410, 60, (sx, i) => {
      if (hash(i + 105) < 0.45) return;
      const mx = sx + hash(i + 106) * 120, mb = gy - 36 - tpBank(mx + off35) + 8, mh = 18 + hash(i + 107) * 14;
      ctx.moveTo(mx - 6, mb); ctx.lineTo(mx - 5, mb - mh * 0.7); ctx.lineTo(mx - 2, mb - mh); ctx.lineTo(mx + 2, mb - mh * 0.85); ctx.lineTo(mx + 5, mb - mh * 0.9); ctx.lineTo(mx + 6, mb); ctx.closePath();
    });
    ctx.fill();
    // tall spear grass along the path, then the red-brown earth with a strip of green grass
    ['#b8a24e', '#8faa48'].forEach((col, c) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath();
      each(camX, 0.6, 34, 30, (sx, i) => {
        if ((i & 1) !== c || hash(i + 111) < 0.25) return;
        const bx = sx + hash(i + 112) * 14, hh = 18 + hash(i + 113) * 16, sw = Math.sin(t * 1.3 + i) * 2;
        for (let j = -1.5; j <= 1.5; j++) { ctx.moveTo(bx + j * 2, gy + 1); ctx.quadraticCurveTo(bx + j * 4, gy - hh * 0.6, bx + j * 8 + sw, gy - hh + Math.abs(j) * 3); }
      });
      ctx.stroke();
    });
    ctx.fillStyle = '#a2552f'; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = 'rgba(80,30,15,0.18)'; ctx.fillRect(0, gy + 30, W, H - gy - 30); ctx.fillRect(0, gy + 52, W, H - gy - 52);
    ctx.fillStyle = 'rgba(70,25,10,0.35)';
    ctx.beginPath(); each(camX, 1, 53, 20, (sx, i) => { if (hash(i + 121) < 0.6) ell(ctx, sx + hash(i + 122) * 30, gy + 16 + hash(i + 123) * 50, 4 + hash(i + 124) * 4, 2.6, 0); }); ctx.fill();
    ctx.fillStyle = 'rgba(240,170,110,0.3)';
    ctx.beginPath(); each(camX, 1, 37, 20, (sx, i) => { if (hash(i + 125) < 0.5) ell(ctx, sx + hash(i + 126) * 20, gy + 12 + hash(i + 127) * 54, 6 + hash(i + 128) * 8, 1.5, 0); }); ctx.fill();
    ctx.fillStyle = '#5fa63c';
    ctx.fillRect(0, gy, W, 6);
    ctx.fillStyle = 'rgba(40,80,20,0.4)';
    ctx.fillRect(0, gy + 6, W, 2);
    ctx.strokeStyle = '#6fb848'; ctx.lineWidth = 1.6;
    ctx.beginPath(); each(camX, 1, 12, 10, (sx, i) => { const hh = 3 + hash(i + 131) * 5; ctx.moveTo(sx, gy + 2); ctx.lineTo(sx + (hash(i + 132) - 0.5) * 4, gy - hh); }); ctx.stroke();
    if (sunset) dusk(ctx, 0.12);
  };

  const baseBackground = A.background;
  A.background = function (ctx, camX, t, groundY, skyKind, theme) {
    if (typeof theme === 'string' && has(BG, theme)) {
      ctx.save();
      BG[theme](ctx, camX || 0, t || 0, groundY, skyKind === 'sunset');
      ctx.restore();
    } else baseBackground(ctx, camX, t, groundY, skyKind, theme);
  };

  // ================================================================ ground plants
  const PLANTS = {
    // a clump of spear grass with dark twisted seed awns, or a tuft of green grass by an ironstone pebble
    topend(ctx, x, y, s) {
      ctx.lineCap = 'round';
      if (hash(Math.round(x) * 0.43) < 0.55) {
        ctx.lineWidth = 1.8 * s;
        for (let j = -4; j <= 4; j++) {
          ctx.strokeStyle = j % 2 ? '#c4ad5a' : '#9db04e';
          const L = (16 + (4 - Math.abs(j)) * 4) * s;
          ctx.beginPath(); ctx.moveTo(x + j * 1.2 * s, y); ctx.quadraticCurveTo(x + j * 2.6 * s, y - L * 0.8, x + j * 6.5 * s, y - L + Math.abs(j) * 2 * s); ctx.stroke();
        }
        ctx.strokeStyle = '#a89048'; ctx.lineWidth = 1.2 * s;
        ctx.beginPath(); ctx.moveTo(x - 1 * s, y); ctx.lineTo(x - 4 * s, y - 34 * s); ctx.moveTo(x + 1 * s, y); ctx.lineTo(x + 5 * s, y - 38 * s); ctx.stroke();
        ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1 * s;
        ctx.beginPath();
        for (const [ax, ay, d] of [[-4, -34, -1], [5, -38, 1]]) { ctx.moveTo(x + ax * s, y + ay * s); ctx.quadraticCurveTo(x + (ax + d * 4) * s, y + (ay - 2) * s, x + (ax + d * 9) * s, y + (ay + 3) * s); }
        ctx.stroke();
      } else {
        A.oval(ctx, x + 9 * s, y - 2 * s, 7 * s, 4.5 * s, 0, '#7a3a22', LINE, 1.4);
        A.oval(ctx, x + 7 * s, y - 4 * s, 3 * s, 1.4 * s, 0, 'rgba(255,190,140,0.45)');
        ctx.lineWidth = 2 * s;
        for (let j = -3; j <= 3; j++) {
          ctx.strokeStyle = j % 2 ? '#4f9a36' : '#78bf4c';
          const L = (11 + (3 - Math.abs(j)) * 3) * s;
          ctx.beginPath(); ctx.moveTo(x + j * 1.4 * s, y); ctx.quadraticCurveTo(x + j * 2.5 * s, y - L * 0.8, x + j * 5 * s, y - L); ctx.stroke();
        }
      }
    },
  };
  const baseGroundPlant = A.groundPlant;
  A.groundPlant = function (ctx, theme, x, y, s) {
    if (typeof theme === 'string' && has(PLANTS, theme)) { ctx.save(); PLANTS[theme](ctx, x, y, s || 1); ctx.restore(); }
    else baseGroundPlant(ctx, theme, x, y, s);
  };

  // ================================================================ platforms
  // p = { x, y, w }: the walkable top is y (about 14 px thick); supports reach down to groundY.
  const PLAT = {
    // a section of weathered wharf on round pylons: cross-braced, weed and barnacles at the tide line,
    // an old tyre hung on the side as a fender
    topend(ctx, p, gy) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const n = Math.max(2, Math.round(p.w / 62) + 1), top = p.y + 12;
      const xs = [];
      for (let j = 0; j < n; j++) xs.push(p.x + 10 + (j / (n - 1)) * (p.w - 20));
      // cross braces between the pylons, in storeys of about 60 px
      if (gy - top > 30) {
        const levels = Math.max(1, Math.round((gy - top - 10) / 62)), lh = (gy - top - 10) / levels;
        const braces = () => {
          ctx.beginPath();
          for (let j = 0; j < n - 1; j++) for (let k = 0; k < levels; k++) {
            const y0 = top + 4 + k * lh, y1 = y0 + lh;
            if ((j + k) % 2) { ctx.moveTo(xs[j], y0); ctx.lineTo(xs[j + 1], y1); } else { ctx.moveTo(xs[j], y1); ctx.lineTo(xs[j + 1], y0); }
          }
        };
        braces(); ctx.strokeStyle = LINE; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = '#7b6650'; ctx.lineWidth = 3.5; ctx.stroke();
      }
      for (const px of xs) {
        ctx.fillStyle = '#7d6652'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px - 6, top, 12, gy - top + 2, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,215,0.18)'; ctx.fillRect(px - 4, top + 2, 3, gy - top - 2);
        // the tide line: green weed, then barnacles
        const tl = Math.max(top + 4, gy - 30);
        ctx.fillStyle = 'rgba(74,110,58,0.85)'; ctx.fillRect(px - 5, tl, 10, gy - tl);
        ctx.fillStyle = '#eee6d2';
        ctx.beginPath(); circ(ctx, px - 2, gy - 9, 1.6); circ(ctx, px + 2.5, gy - 15, 1.4); circ(ctx, px - 1.5, gy - 22, 1.2); circ(ctx, px + 2, gy - 4, 1.5); ctx.fill();
      }
      // the stringer under the deck, then the deck itself: grey, weathered planks
      ctx.fillStyle = '#5c4634'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillRect(p.x + 2, p.y + 11, p.w - 4, 7); ctx.strokeRect(p.x + 2, p.y + 11, p.w - 4, 7);
      ctx.fillStyle = '#a99278'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 13, 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,50,30,0.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = p.x + 13; x < p.x + p.w - 4; x += 13) { ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + 12); }
      ctx.moveTo(p.x + 2, p.y + 7); ctx.lineTo(p.x + p.w - 2, p.y + 7);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,248,230,0.3)'; ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 2);
      ctx.fillStyle = 'rgba(60,40,25,0.55)';
      ctx.beginPath(); for (let x = p.x + 6; x < p.x + p.w - 4; x += 13) { circ(ctx, x, p.y + 4, 0.9); circ(ctx, x, p.y + 10, 0.9); } ctx.fill();
      // an old car tyre hung on the side as a fender, on a rope
      if (gy - p.y > 44 && n > 2) {
        const tx = (xs[0] + xs[1]) / 2, ty = p.y + 30;
        ctx.strokeStyle = '#d4b47a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx - 4, p.y + 14); ctx.lineTo(tx - 6, ty - 8); ctx.moveTo(tx + 4, p.y + 14); ctx.lineTo(tx + 6, ty - 8); ctx.stroke();
        A.oval(ctx, tx, ty, 10, 10, 0, '#2c2b2e', LINE, 2);
        A.oval(ctx, tx, ty, 4.2, 4.2, 0, '#5c4634', LINE, 1.5);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx, ty, 7.2, 3.6, 5.2); ctx.stroke();
      }
    },
  };
  const basePlatform = A.platform;
  A.platform = function (ctx, p, groundY, theme) {
    if (typeof theme === 'string' && has(PLAT, theme)) { ctx.save(); PLAT[theme](ctx, p, groundY); ctx.restore(); }
    else basePlatform(ctx, p, groundY, theme);
  };

  // ================================================================ water
  // Same two passes as the river in worlds.js (front=false behind the characters, front=true over them):
  // murky green-brown tidal water over a mud bed, with mud banks and mangrove roots at both edges, silt
  // and a barramundi or two; on top, a scummy surface with floating leaves.
  function estuary(ctx, x, w, sy, gy, t, front) {
    const seed = Math.round(x);
    if (!front) {
      const g = ctx.createLinearGradient(0, sy, 0, H);
      g.addColorStop(0, '#7c7d44'); g.addColorStop(0.45, '#56572f'); g.addColorStop(1, '#2d2c1a');
      ctx.fillStyle = g; ctx.fillRect(x, sy, w, H - sy);
      ctx.strokeStyle = 'rgba(230,220,160,0.1)'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let j = 0; j < w / 46; j++) { const lx = x + j * 46 + Math.sin(t + j) * 6; ctx.moveTo(lx, sy + 10); ctx.lineTo(lx - 26, sy + (gy - sy) * 0.6); }
      ctx.stroke();
      // the mud bed
      ctx.fillStyle = '#4a3b2a'; ctx.fillRect(x, gy, w, H - gy);
      ctx.fillStyle = '#5e4a35';
      ctx.beginPath(); for (let j = 0; j < w / 30; j++) ell(ctx, x + j * 30 + hash(seed + j) * 20, gy + 5 + hash(seed + j * 3) * 30, 6 + hash(seed + j * 7) * 6, 2.2, 0); ctx.fill();
      // a sunken log
      if (w > 220) {
        const lx = x + w * (0.3 + hash(seed + 5) * 0.3);
        ctx.save(); ctx.translate(lx, gy - 6); ctx.rotate(-0.06);
        ctx.fillStyle = '#3e3324'; ctx.strokeStyle = 'rgba(25,18,10,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-46, -7, 92, 14, 7); ctx.fill(); ctx.stroke();
        A.oval(ctx, 44, 0, 4, 6.5, 0, '#5a4a34', 'rgba(25,18,10,0.8)', 1.5);
        ctx.strokeStyle = '#4f6a34'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-20, -6); ctx.quadraticCurveTo(-18 + Math.sin(t * 1.2) * 4, -20, -22, -30); ctx.moveTo(10, -6); ctx.quadraticCurveTo(14 + Math.sin(t * 1.2 + 1) * 4, -16, 10, -24); ctx.stroke();
        ctx.restore();
      }
      // mud banks sloping up at both edges, with breathing roots poking out and stilt roots arching in
      ctx.fillStyle = '#5e4c38';
      ctx.beginPath();
      ctx.moveTo(x - 2, sy + (gy - sy) * 0.55); ctx.quadraticCurveTo(x + 30, gy - 16, x + 66, gy + 2); ctx.lineTo(x - 2, gy + 2); ctx.closePath();
      ctx.moveTo(x + w + 2, sy + (gy - sy) * 0.55); ctx.quadraticCurveTo(x + w - 30, gy - 16, x + w - 66, gy + 2); ctx.lineTo(x + w + 2, gy + 2); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4a3c2c'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const [ex, d] of [[x, 1], [x + w, -1]]) {
        for (let j = 0; j < 5; j++) { const px = ex + d * (8 + j * 11), base = lerp(sy + (gy - sy) * 0.6, gy, (j + 1) / 6); ctx.moveTo(px, base); ctx.lineTo(px + d, base - 8 - hash(seed + j) * 6); }
        for (let j = 0; j < 3; j++) { const top = sy - 30 - j * 6, fx = ex + d * (12 + j * 22); ctx.moveTo(ex - d * 4, top); ctx.quadraticCurveTo(fx - d * 4, top - 6, fx + d * 6, lerp(sy + (gy - sy) * 0.55, gy, j / 3) + 6); }
      }
      ctx.stroke();
      // silt drifting about, and a barramundi or two cruising slowly
      ctx.fillStyle = 'rgba(210,200,140,0.35)';
      ctx.beginPath(); for (let j = 0; j < w / 24; j++) { const k = mod(t * 0.05 + hash(seed + j * 3), 1); circ(ctx, x + mod(hash(seed + j) * w + t * 6, w), lerp(gy - 8, sy + 8, k), 1 + hash(seed + j * 5) * 1.4); } ctx.fill();
      for (let j = 0; j < Math.max(1, Math.floor(w / 200)); j++) {
        const k = mod(t * 0.05 + hash(seed + j * 11), 1), dir = k < 0.5 ? 1 : -1, q = k < 0.5 ? k * 2 : 2 - k * 2;
        const fx = x + 50 + q * (w - 100), fy = sy + 34 + hash(seed + j * 13) * Math.max(10, gy - sy - 60) + Math.sin(t * 2 + j) * 3;
        ctx.fillStyle = 'rgba(150,160,150,0.7)';
        ctx.beginPath(); ctx.ellipse(fx, fy, 15, 6, 0, 0, TAU); ctx.moveTo(fx - dir * 12, fy); ctx.lineTo(fx - dir * 22, fy - 6); ctx.lineTo(fx - dir * 22, fy + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,130,120,0.7)'; ctx.beginPath(); ctx.moveTo(fx - dir * 4, fy - 5); ctx.lineTo(fx - dir * 10, fy - 10); ctx.lineTo(fx - dir * 12, fy - 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(240,190,90,0.9)'; ctx.beginPath(); circ(ctx, fx + dir * 9, fy - 1.5, 2); ctx.fill();
      }
    } else {
      const wave = (sx) => sy + Math.sin(sx * 0.045 + t * 1.8) * 2.2 + Math.sin(sx * 0.1 - t * 1.1) * 1;
      const g = ctx.createLinearGradient(0, sy, 0, H);
      g.addColorStop(0, 'rgba(128,124,64,0.5)'); g.addColorStop(1, 'rgba(48,46,24,0.82)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, H);
      for (let sx = x; sx <= x + w + 10; sx += 10) ctx.lineTo(sx, wave(sx));
      ctx.lineTo(x + w + 10, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(225,215,150,0.18)'; ctx.fillRect(x, sy + 3, w, 7);
      ctx.beginPath(); ctx.moveTo(x, wave(x));
      for (let sx = x + 10; sx <= x + w + 10; sx += 10) ctx.lineTo(sx, wave(sx));
      ctx.strokeStyle = 'rgba(232,226,180,0.9)'; ctx.lineWidth = 3; ctx.stroke();
      // lazy ripples, scummy foam and floating mangrove leaves
      ctx.lineWidth = 1.5;
      for (let j = 0; j < w / 130; j++) {
        const k = mod(t * 0.45 + hash(seed + j * 5), 1), rx = x + 40 + j * 130 + hash(seed + j) * 50;
        ctx.strokeStyle = 'rgba(240,235,200,' + (0.6 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(rx, sy + 4, 6 + k * 22, 2 + k * 3.5, 0, 0, TAU); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(236,230,196,0.55)';
      ctx.beginPath();
      for (let j = 0; j < w / 90; j++) { const fx = x + mod(hash(seed + j * 7) * w + t * 8, w); for (let k = 0; k < 3; k++) ell(ctx, fx + k * 5, wave(fx) + 2 + (k % 2), 3.5, 1.4, 0); }
      ctx.fill();
      for (let j = 0; j < w / 160; j++) {
        const lx = x + mod(hash(seed + j * 9) * w + t * 10, w);
        A.oval(ctx, lx, wave(lx) + 1, 6, 2.4, 0.3 + j, j % 2 ? '#9a8a3a' : '#5f8a3a', LINE, 1);
      }
    }
  }
  const baseWater = A.water;
  A.water = function (ctx, x, w, surfaceY, groundY, t, front, theme) {
    if (theme === 'topend') {
      if (!(w > 0)) return;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, -100, w, H + 200); ctx.clip();
      ctx.lineJoin = 'round';
      estuary(ctx, x, w, surfaceY, groundY, t || 0, front);
      ctx.restore();
    } else baseWater(ctx, x, w, surfaceY, groundY, t, front, theme);
  };

  // ================================================================ weather (screen space, over everything)
  // humid air: faint warm bands of haze drifting by, little swarms of midges and a dragonfly or two
  const baseWeather = A.weather;
  A.weather = function (ctx, theme, camX, t) {
    if (theme !== 'topend') { if (baseWeather) baseWeather(ctx, theme, camX, t); return; }
    camX = camX || 0; t = t || 0;
    ctx.save();
    ctx.fillStyle = 'rgba(255,246,222,0.07)';
    for (let i = 0; i < 3; i++) {
      const x = mod(i * 430 - camX * 0.3 - t * 7, W + 900) - 450, y = 130 + i * 120 + Math.sin(t * 0.25 + i) * 12;
      ctx.beginPath(); ell(ctx, x, y, 330, 24, 0); ell(ctx, x + 210, y + 12, 230, 17, 0); ctx.fill();
    }
    ctx.fillStyle = 'rgba(40,30,20,0.6)';
    ctx.beginPath();
    for (let sw = 0; sw < 3; sw++) {
      const cx = mod(hash(sw + 3) * W + sw * 330 - camX * 0.85 + Math.sin(t * 0.3 + sw) * 60, W + 200) - 100;
      const cy = 170 + hash(sw + 5) * 200 + Math.sin(t * 0.5 + sw * 2) * 24;
      for (let j = 0; j < 7; j++) circ(ctx, cx + Math.sin(t * (3 + j * 0.7) + j * 2) * 13, cy + Math.cos(t * (2.4 + j * 0.9) + j) * 8, 1.1);
    }
    ctx.fill();
    // dragonflies: hover, then dart somewhere else
    for (let i = 0; i < 2; i++) {
      const hop = Math.floor(t * 0.4 + i * 0.5), k = mod(t * 0.4 + i * 0.5, 1), dart = Math.min(1, k * 6);
      const ax = hash(hop * 3 + i), bx = hash(hop * 3 + i + 3), ay = hash(hop * 5 + i + 1), by = hash(hop * 5 + i + 4);
      const x = mod(lerp(ax, bx, dart) * (W - 100) + 50 - camX * 0.9, W + 80) - 40, y = 150 + lerp(ay, by, dart) * 230 + Math.sin(t * 7 + i) * 2;
      const dir = bx > ax ? 1 : -1, flap = Math.sin(t * 60 + i) * 0.35;
      ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
      ctx.fillStyle = 'rgba(220,240,255,0.55)';
      ctx.beginPath(); ell(ctx, -1, -4, 9, 2.4, -0.35 + flap); ell(ctx, 3, -4, 8, 2.2, 0.35 - flap); ell(ctx, -1, 3, 8, 2.2, 0.3 - flap); ell(ctx, 3, 3, 7, 2, -0.3 + flap); ctx.fill();
      ctx.strokeStyle = '#c8402a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke();
      A.oval(ctx, 7, 0, 2.4, 2.2, 0, '#7a2a1a');
      ctx.restore();
    }
    ctx.restore();
  };

  // ================================================================ decorations
  // d = { type, x, ... } in world space (the camera is already applied). d.x is the centre.
  // Each stays within d.x ± (d.w / 2 + 260), so the campaign's visibility check never cuts one off.
  const DECOR = {};

  // A magnetic termite mound: a tall, thin, flat slab like a tombstone (they all stand facing the same
  // way, broad sides east and west). d.h (170). A smaller one stands behind it, lined up the same way.
  function magSlab(ctx, x, gy, h, seed, far) {
    const w = h * 0.52, dp = Math.max(4, h * 0.05), bump = h / 60;
    // the outline: up the left side, along a ragged top of rounded pinnacles, down the right side, every
    // stretch bulging out in a knobbly lump of dried mud
    const key = [[-0.49, -0.16], [-0.47, -0.36], [-0.45, -0.56], [-0.41, -0.72], [-0.32, -0.85], [-0.2, -0.96], [-0.1, -0.99], [-0.02, -0.93],
      [0.04, -0.86], [0.12, -0.9], [0.22, -0.88], [0.3, -0.78], [0.36, -0.64], [0.42, -0.46], [0.46, -0.28], [0.49, -0.12]];
    const path = (ox, oy) => {
      const P = key.map(([px, py], j) => [x + ox + px * w + (hash(seed + j) - 0.5) * w * 0.04, gy + oy + py * h]);
      ctx.beginPath();
      ctx.moveTo(x + ox - w * 0.5, gy + oy); ctx.lineTo(P[0][0], P[0][1]);
      for (let j = 0; j < P.length - 1; j++) {
        const [ax, ay] = P[j], [bx, by] = P[j + 1], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, k = bump * (1 + hash(seed + j * 3) * 1.6);
        ctx.quadraticCurveTo((ax + bx) / 2 + (dy / l) * k, (ay + by) / 2 - (dx / l) * k, bx, by);
      }
      ctx.lineTo(x + ox + w * 0.5, gy + oy); ctx.closePath();
    };
    // the thin side, set back a little, then the broad face
    path(dp, -dp * 0.35); ctx.fillStyle = far ? '#7c6e5c' : '#6f604d'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke();
    path(0, 0); ctx.fillStyle = far ? '#a3947e' : '#9a8a72'; ctx.fill();
    ctx.save(); ctx.clip();
    // vertical flutes, lumps of mud in rough layers, a lit left edge and a shaded right one
    ctx.strokeStyle = 'rgba(70,52,36,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let j = 0; j < 6; j++) { const fx = x - w * 0.36 + j * w * 0.15 + (hash(seed + j * 3) - 0.5) * 6; ctx.moveTo(fx, gy); ctx.quadraticCurveTo(fx + (hash(seed + j) - 0.5) * 10, gy - h * 0.5, fx + (hash(seed + j * 5) - 0.5) * 8, gy - h * (0.7 + hash(seed + j * 7) * 0.25)); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(70,52,36,0.22)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let j = 1; j < 7; j++) { const ly = gy - j * h * 0.13; ctx.moveTo(x - w * 0.5, ly + (hash(seed + j * 13) - 0.5) * 6); for (let k = 1; k <= 4; k++) ctx.quadraticCurveTo(x - w * 0.5 + (k - 0.5) * w * 0.25, ly + (k % 2 ? 4 : -2), x - w * 0.5 + k * w * 0.25, ly + (hash(seed + j + k) - 0.5) * 6); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,210,0.16)'; ctx.fillRect(x - w * 0.55, gy - h, w * 0.2, h);
    ctx.fillStyle = 'rgba(60,40,25,0.16)'; ctx.fillRect(x + w * 0.3, gy - h, w * 0.3, h);
    ctx.fillStyle = 'rgba(120,100,78,0.6)';
    ctx.beginPath(); for (let j = 0; j < 12; j++) ell(ctx, x + (hash(seed + j * 9) - 0.5) * w * 0.8, gy - hash(seed + j * 11) * h * 0.85, 3 + hash(seed + j) * 3, 2, 0); ctx.fill();
    ctx.fillStyle = 'rgba(70,52,36,0.5)';
    ctx.beginPath(); for (let j = 0; j < 8; j++) circ(ctx, x + (hash(seed + j * 17) - 0.5) * w * 0.7, gy - (0.15 + hash(seed + j * 19) * 0.7) * h, 1.2); ctx.fill();
    // red earth splashed up round its foot
    ctx.fillStyle = 'rgba(160,80,45,0.45)'; ctx.fillRect(x - w, gy - h * 0.12, w * 2, h * 0.12);
    ctx.restore();
    path(0, 0); ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.stroke();
  }
  DECOR.termiteMound = function (ctx, d, gy, t) {
    const x = d.x, h = d.h || 170;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    magSlab(ctx, x + h * 0.36, gy, h * 0.52, Math.round(x) + 7, true);
    magSlab(ctx, x, gy, h, Math.round(x), false);
    ctx.strokeStyle = '#a99a4e'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let j = 0; j < 9; j++) { const bx = x - h * 0.32 + j * h * 0.09; ctx.moveTo(bx, gy + 2); ctx.quadraticCurveTo(bx + 2, gy - 8, bx + (j % 2 ? 6 : -4), gy - 12 - hash(x + j) * 6); }
    ctx.stroke();
  };

  // A pandanus palm: a ringed trunk standing on stilt-like prop roots, forking into branches that end in
  // spiralled tufts of long spiky leaves, with an orange pineapple-like fruit. d.h (200)
  function spikyTuft(ctx, x, y, r, seed, sway) {
    const leaves = [];
    for (let j = 0; j < 11; j++) {
      const a = -Math.PI * 1.12 + (j / 10) * Math.PI * 1.24 + (hash(seed + j) - 0.5) * 0.18, L = r * (0.8 + hash(seed + j * 3) * 0.35);
      const droop = Math.abs(Math.cos(a)) * L * 0.42;
      leaves.push([x + Math.cos(a) * L * 0.55 + sway * 0.5, y + Math.sin(a) * L * 0.55 - 4, x + Math.cos(a) * L + sway, y + Math.sin(a) * L * 0.8 + droop, a]);
    }
    const leaf = (wf) => {
      ctx.beginPath();
      for (const [cx, cy, ex, ey, a] of leaves) {
        const nx = -Math.sin(a) * 4 * wf, ny = Math.cos(a) * 4 * wf;
        ctx.moveTo(x - nx, y - ny); ctx.quadraticCurveTo(cx - nx, cy - ny, ex, ey); ctx.quadraticCurveTo(cx + nx, cy + ny, x + nx, y + ny); ctx.closePath();
      }
    };
    leaf(1); ctx.strokeStyle = LINE; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = '#4f8f3e'; ctx.fill();
    leaf(0.45); ctx.fillStyle = '#76b456'; ctx.fill();
    // little spines along the edges
    ctx.strokeStyle = 'rgba(30,60,20,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [cx, cy, ex, ey] of leaves) { const px = lerp(cx, ex, 0.6), py = lerp(cy, ey, 0.6); ctx.moveTo(px, py); ctx.lineTo(px + 2, py - 3); }
    ctx.stroke();
  }
  DECOR.pandanus = function (ctx, d, gy, t) {
    const x = d.x, s = (d.h || 200) / 200, sway = Math.sin(t * 0.9 + x * 0.01) * 2.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fork = [x + 4 * s, gy - 110 * s];
    // prop roots: straight stilts from the lower trunk splaying out to the ground
    ctx.fillStyle = '#8a7258'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    for (const [dx, hy, w] of [[-34, 46, 6], [-18, 56, 6.5], [-3, 40, 5.5], [14, 52, 6.5], [30, 44, 6]]) {
      A.taper(ctx, x + dx * 0.12 * s, gy - hy * s, x + dx * 0.6 * s, gy - hy * 0.55 * s, x + dx * s, gy + 2, w * s, (w + 1.5) * s); ctx.fill(); ctx.stroke();
    }
    // the branches and the trunk, with ring scars
    const limbs = [
      [x, gy - 40 * s, x - 2 * s, gy - 80 * s, fork[0], fork[1], 15 * s, 12 * s],
      [fork[0], fork[1] + 4 * s, x - 30 * s, gy - 136 * s, x - 52 * s + sway * 0.4, gy - 168 * s, 10 * s, 7 * s],
      [fork[0], fork[1] + 4 * s, x + 26 * s, gy - 140 * s, x + 46 * s + sway * 0.4, gy - 186 * s, 10 * s, 7 * s],
      [x + 30 * s, gy - 150 * s, x + 50 * s, gy - 150 * s, x + 66 * s + sway * 0.4, gy - 140 * s, 6 * s, 5 * s],
    ];
    ctx.fillStyle = '#9a7f60'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    for (const b of limbs) { A.taper(ctx, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(60,40,22,0.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const b of limbs) for (let k = 0.15; k < 0.95; k += 0.14) {
      const m = 1 - k, px = m * m * b[0] + 2 * m * k * b[2] + k * k * b[4], py = m * m * b[1] + 2 * m * k * b[3] + k * k * b[5], hw = lerp(b[6], b[7], k) * 0.45;
      ctx.moveTo(px - hw, py + 1); ctx.quadraticCurveTo(px, py + 3, px + hw, py - 1);
    }
    ctx.stroke();
    // the fruit hanging under the right-hand tuft, then the three leaf tufts
    const fx = x + 42 * s + sway * 0.4, fy = gy - 168 * s;
    A.oval(ctx, fx, fy, 11 * s, 13 * s, 0.2, '#e8742e', LINE, 2);
    ctx.strokeStyle = 'rgba(120,40,10,0.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let j = -2; j <= 2; j++) { ctx.moveTo(fx - 9 * s, fy + j * 4.5 * s); ctx.lineTo(fx + 9 * s, fy + j * 4.5 * s + 3 * s); ctx.moveTo(fx + j * 4.5 * s, fy - 11 * s); ctx.lineTo(fx + j * 4.5 * s - 2 * s, fy + 12 * s); } ctx.stroke();
    spikyTuft(ctx, x + 66 * s + sway * 0.4, gy - 142 * s, 34 * s, Math.round(x) + 3, sway);
    spikyTuft(ctx, x - 52 * s + sway * 0.4, gy - 170 * s, 46 * s, Math.round(x) + 1, sway);
    spikyTuft(ctx, x + 46 * s + sway * 0.4, gy - 188 * s, 48 * s, Math.round(x) + 2, sway);
  };

  // A big mangrove tree on arching stilt roots in a patch of mud, with breathing roots poking up and a
  // fiddler crab waving its big claw. d.w (220): the crown's width (the tree is about as tall as wide).
  // (The Coast's smaller 'mangrove' in worlds.js is a different decoration and is left as it is.)
  DECOR.bigMangrove = function (ctx, d, gy, t) {
    const x = d.x, w = Math.max(120, d.w || 220), s = w / 220;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the mud
    ctx.fillStyle = '#6a5642'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - w * 0.58, gy + 3); ctx.quadraticCurveTo(x, gy - 16 * s, x + w * 0.58, gy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, x - w * 0.18, gy - 3 * s, w * 0.12, 2 * s, 0, 'rgba(200,220,230,0.35)');
    ctx.strokeStyle = '#4a3c2c'; ctx.lineWidth = 3;
    ctx.beginPath(); for (let j = -6; j <= 6; j++) { const px = x + j * w * 0.075 + hash(x + j) * 6; ctx.moveTo(px, gy + 1); ctx.lineTo(px + 1, gy - 7 - hash(x - j) * 7); } ctx.stroke();
    // arching stilt roots from the trunk down into the mud
    const roots = [];
    for (let j = -4; j <= 4; j++) {
      const hy = gy - (58 + Math.abs(j) * 3 + hash(x + j * 7) * 10) * s, ex = x + j * w * 0.105 + (hash(x + j) - 0.5) * 8 * s;
      roots.push([x + j * 3 * s, hy, x + j * w * 0.085, hy - 18 * s, ex, gy + 1]);
    }
    const trunkPath = () => {
      ctx.beginPath();
      for (const r of roots) { ctx.moveTo(r[0], r[1]); ctx.quadraticCurveTo(r[2], r[3], r[4], r[5]); }
    };
    trunkPath(); ctx.strokeStyle = LINE; ctx.lineWidth = 7 * s + 2; ctx.stroke();
    ctx.strokeStyle = '#7a6a56'; ctx.lineWidth = 7 * s - 1.5; ctx.stroke();
    // the trunk and branches up into the crown
    const limbs = [
      [x, gy - 50 * s, x + 2 * s, gy - 90 * s, x - 2 * s, gy - 128 * s, 20 * s, 14 * s],
      [x - 1 * s, gy - 104 * s, x - 34 * s, gy - 126 * s, x - 56 * s, gy - 150 * s, 10 * s, 6 * s],
      [x + 1 * s, gy - 110 * s, x + 34 * s, gy - 124 * s, x + 58 * s, gy - 146 * s, 10 * s, 6 * s],
    ];
    ctx.fillStyle = '#7a6a56'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    for (const b of limbs) { A.taper(ctx, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(50,38,26,0.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let j = 0; j < 5; j++) { const py = gy - 60 * s - j * 13 * s; ctx.moveTo(x - 6 * s, py); ctx.lineTo(x + 5 * s, py - 4 * s); } ctx.stroke();
    // the dense dark-green crown
    const sway = Math.sin(t * 0.7 + x * 0.01) * 2;
    const blobs = [];
    for (let j = 0; j < 9; j++) {
      const k = j / 8 - 0.5;
      blobs.push([x + k * w * 0.82 + sway, gy - (150 + (0.25 - k * k) * 120 + Math.sin(j * 2.1 + x) * 8) * s, (30 + hash(x + j * 3) * 12) * s]);
    }
    for (let j = 0; j < 5; j++) blobs.push([x + (j / 4 - 0.5) * w * 0.55 + sway, gy - (196 + Math.sin(j * 1.7 + x) * 8) * s, (28 + hash(x + j * 5) * 10) * s]);
    ctx.fillStyle = '#285a36'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); for (const [bx, by, r] of blobs) circ(ctx, bx, by, r); ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#367a46';
    ctx.beginPath(); for (const [bx, by, r] of blobs) circ(ctx, bx - r * 0.12, by - r * 0.2, r * 0.7); ctx.fill();
    ctx.fillStyle = '#4f9a54';
    ctx.beginPath(); for (const [bx, by, r] of blobs) if (by < gy - 170 * s) circ(ctx, bx - r * 0.3, by - r * 0.38, r * 0.32); ctx.fill();
    ctx.fillStyle = '#1f4a2c';
    ctx.beginPath(); for (const [bx, by, r] of blobs) if (by > gy - 175 * s) ell(ctx, bx + r * 0.3, by + r * 0.62, 3 * s, 7 * s, 0.3); ctx.fill();
    // a red fiddler crab beside the mud, waving its one big claw
    const cx = x + w * 0.36, cy = gy - 2, wave = Math.max(0, Math.sin(t * 2.4 + x)) * 0.9;
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (const lx of [-5, -2, 2, 5]) { ctx.moveTo(cx + lx, cy - 3); ctx.lineTo(cx + lx * 1.8, cy + 1); } ctx.stroke();
    A.oval(ctx, cx, cy - 5, 7, 4.2, 0, '#d8452e', LINE, 1.5);
    ctx.save(); ctx.translate(cx + 6, cy - 7); ctx.rotate(-0.4 - wave);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, -4); ctx.stroke();
    A.oval(ctx, 7, -6, 5, 3.2, -0.5, '#f2d6a0', LINE, 1.4);
    ctx.restore();
    A.oval(ctx, cx - 2, cy - 10, 1.2, 1.2, 0, LINE); A.oval(ctx, cx + 2, cy - 10, 1.2, 1.2, 0, LINE);
  };

  // A generic yellow croc warning sign on two posts: a black crocodile with its jaws open, a short
  // message, and (of course) a bite taken out of the top corner. d.text ('CROCS! KEEP CLEAR')
  DECOR.crocSign = function (ctx, d, gy, t) {
    const x = d.x, bw = 124, bh = 92, x0 = x - bw / 2, y0 = gy - 150, x1 = x0 + bw, y1 = y0 + bh;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const px of [x0 + 22, x1 - 22]) {
      ctx.fillStyle = '#8a8f96'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(px - 3.5, y1 - 6, 7, gy - y1 + 7); ctx.fill(); ctx.stroke();
    }
    // the board, with a toothy bite out of the top right corner
    const board = (inset) => {
      const a = x0 + inset, b = y0 + inset, c = x1 - inset, e = y1 - inset;
      ctx.beginPath();
      ctx.moveTo(a + 6, b); ctx.lineTo(c - 30, b);
      biteEdge(ctx, c - 30, b, c, b + 26, c - 26, b + 24, 4);
      ctx.lineTo(c, e - 6); ctx.quadraticCurveTo(c, e, c - 6, e); ctx.lineTo(a + 6, e); ctx.quadraticCurveTo(a, e, a, e - 6); ctx.lineTo(a, b + 6); ctx.quadraticCurveTo(a, b, a + 6, b); ctx.closePath();
    };
    board(0); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.stroke();
    board(5); ctx.strokeStyle = '#1d1a18'; ctx.lineWidth = 2.5; ctx.stroke();
    // the crocodile, side on, jaws open
    ctx.save(); ctx.translate(x - 4, y0 + 36);
    ctx.fillStyle = '#1d1a18';
    ctx.beginPath();
    ctx.moveTo(-46, -2); ctx.quadraticCurveTo(-30, -10, -14, -9); ctx.lineTo(10, -10); ctx.quadraticCurveTo(16, -16, 22, -11);
    ctx.lineTo(44, -18); ctx.quadraticCurveTo(48, -17, 46, -14); ctx.lineTo(24, -5); ctx.lineTo(44, 2); ctx.quadraticCurveTo(46, 5, 42, 5);
    ctx.lineTo(16, 2); ctx.quadraticCurveTo(0, 6, -16, 3); ctx.lineTo(-30, 3); ctx.quadraticCurveTo(-40, 2, -46, -2); ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#1d1a18';
    ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-11, 10); ctx.moveTo(8, 2); ctx.lineTo(11, 10); ctx.moveTo(-26, 2); ctx.lineTo(-29, 9); ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); for (let j = 0; j < 4; j++) { const tx = 28 + j * 4.5; ctx.moveTo(tx, -12 + j * -1.5); ctx.lineTo(tx + 1.4, -9 - j * 1.5); ctx.lineTo(tx + 2.8, -13 - j * 1.5); ctx.closePath(); } ctx.fill();
    A.oval(ctx, 16, -12, 1.8, 1.8, 0, '#ffd23f');
    ctx.restore();
    // the message, on one or two lines
    const lines = twoLines(d.text || 'CROCS! KEEP CLEAR');
    if (lines.length === 1) fitText(ctx, lines[0], x, y0 + 68, bw - 22, 15, '#1d1a18');
    else { fitText(ctx, lines[0], x, y0 + 59, bw - 22, 14, '#1d1a18'); fitText(ctx, lines[1], x, y0 + 75, bw - 22, 14, '#1d1a18'); }
    // tooth marks round the bite
    ctx.fillStyle = 'rgba(60,40,10,0.35)';
    ctx.beginPath(); for (let j = 0; j < 4; j++) circ(ctx, x1 - 26 + j * 6.5, y0 + 8 + j * 5.5, 1.3); ctx.fill();
  };

  // A wooden jetty behind the path, standing in a creek, with a little tour boat tied up beside it and an
  // esky left open (and very empty) on the deck. d.w (300)
  DECOR.wharf = function (ctx, d, gy, t) {
    const w = Math.max(200, d.w || 300), x0 = d.x - w / 2, x1 = d.x + w / 2, deck = gy - 58, wy = gy - 24;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the creek behind the path: murky water between muddy banks
    ctx.fillStyle = '#6e5c46'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 - 40, gy + 2); ctx.quadraticCurveTo(x0 - 20, wy - 8, x0 + 10, wy - 4); ctx.lineTo(x1 + 20, wy - 4); ctx.quadraticCurveTo(x1 + 50, wy - 6, x1 + 70, gy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    const creek = ctx.createLinearGradient(0, wy, 0, gy);
    creek.addColorStop(0, '#7c7d48'); creek.addColorStop(1, '#55552f');
    ctx.fillStyle = creek;
    ctx.beginPath(); ctx.moveTo(x0 - 6, gy - 4); ctx.quadraticCurveTo(x0 + 2, wy, x0 + 20, wy); ctx.lineTo(x1 + 30, wy); ctx.quadraticCurveTo(x1 + 46, wy + 2, x1 + 50, gy - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(240,235,200,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let j = 0; j < w / 40; j++) { const rx = x0 + 20 + j * 40 + Math.sin(t * 1.3 + j) * 4, ry = wy + 6 + (j % 3) * 5; ctx.moveTo(rx - 6, ry); ctx.lineTo(rx + 6, ry); } ctx.stroke();
    // pylons and the deck
    const posts = [];
    for (let px = x0 + 12; px <= x1 - 8; px += 46) posts.push(px);
    for (const px of posts) {
      ctx.fillStyle = '#6f5a46'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(px - 5, deck - 14, 10, gy - 6 - deck + 14, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(74,110,58,0.85)'; ctx.fillRect(px - 4, wy - 6, 8, 8);
    }
    ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); for (let j = 0; j < posts.length - 1; j++) { ctx.moveTo(posts[j], deck - 12); ctx.lineTo(posts[j + 1], deck - 12); } ctx.stroke();
    ctx.strokeStyle = '#a8916f'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(posts[0] + 5, deck - 12); ctx.lineTo(posts[posts.length - 1] - 5, deck - 12); ctx.stroke();
    ctx.fillStyle = '#5a4634'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.fillRect(x0, deck + 8, w, 6); ctx.strokeRect(x0, deck + 8, w, 6);
    ctx.fillStyle = '#ab9476'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x0 - 4, deck, w + 8, 10, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,50,30,0.5)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let x = x0 + 10; x < x1; x += 12) { ctx.moveTo(x, deck + 1); ctx.lineTo(x, deck + 9); } ctx.stroke();
    // steps down to the bank at the land end
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = '#9a8468'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x0 - 22 - k * 12, deck + 14 + k * 13, 24, 6, 2); ctx.fill(); ctx.stroke();
    }
    // a lamp post and the open, empty esky with a few crumbs
    const lx = x0 + w * 0.2;
    ctx.strokeStyle = LINE; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(lx, deck); ctx.lineTo(lx, deck - 62); ctx.quadraticCurveTo(lx, deck - 70, lx + 10, deck - 70); ctx.stroke();
    ctx.strokeStyle = '#3e5560'; ctx.lineWidth = 2.8; ctx.stroke();
    A.oval(ctx, lx + 12, deck - 66, 5, 3.6, 0, '#fff1b0', LINE, 1.5);
    const ex = x0 + w * 0.42;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(ex - 16, deck - 18, 32, 18, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a86ff'; ctx.fillRect(ex - 15, deck - 9, 30, 3);
    ctx.save(); ctx.translate(ex - 16, deck - 18); ctx.rotate(-1.9);
    ctx.fillStyle = '#3a86ff'; ctx.beginPath(); ctx.roundRect(-2, -3, 34, 6, 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#d9b27a'; ctx.beginPath(); circ(ctx, ex + 22, deck - 1.5, 1.6); circ(ctx, ex + 28, deck - 1.2, 1.2); circ(ctx, ex - 22, deck - 1.4, 1.3); ctx.fill();
    // the little tour boat, bobbing, tied to the end post
    const bob = Math.sin(t * 1.5 + d.x) * 1.6, bx = x0 + w * 0.68, by = wy + 4 + bob, bl = Math.min(150, w * 0.48);
    ctx.strokeStyle = '#d4b47a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(posts[posts.length - 1], deck - 8); ctx.quadraticCurveTo(bx + bl * 0.5, deck + 10, bx + bl * 0.42, by - 18); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bx - bl * 0.5, by - 20); ctx.lineTo(bx + bl * 0.42, by - 20); ctx.quadraticCurveTo(bx + bl * 0.56, by - 22, bx + bl * 0.6, by - 26); ctx.lineTo(bx + bl * 0.5, by + 2); ctx.lineTo(bx - bl * 0.44, by + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0703a'; ctx.fillRect(bx - bl * 0.48, by - 12, bl * 0.98, 4);
    ctx.fillStyle = '#2a7f9e'; ctx.fillRect(bx - bl * 0.45, by - 6, bl * 0.94, 3);
    // its canopy roof on poles, seats under it, and a lifebuoy
    ctx.strokeStyle = LINE; ctx.lineWidth = 3;
    ctx.beginPath(); for (const k of [-0.36, 0, 0.28]) { ctx.moveTo(bx + bl * k, by - 20); ctx.lineTo(bx + bl * k, by - 50); } ctx.stroke();
    ctx.strokeStyle = '#e8e4da'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#5a7a8a'; ctx.fillRect(bx - bl * 0.32, by - 28, bl * 0.56, 7);
    ctx.fillStyle = '#2a9d8f'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx - bl * 0.42, by - 50); ctx.lineTo(bx + bl * 0.34, by - 50); ctx.lineTo(bx + bl * 0.38, by - 56); ctx.lineTo(bx - bl * 0.4, by - 56); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 6; k++) ctx.fillRect(bx - bl * 0.4 + k * bl * 0.13, by - 55, bl * 0.06, 4.5);
    A.oval(ctx, bx - bl * 0.18, by - 15, 6.5, 6.5, 0, '#ffffff', LINE, 1.6);
    ctx.strokeStyle = '#e63946'; ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(bx - bl * 0.18, by - 15, 4.6, k * Math.PI / 2 + 0.2, k * Math.PI / 2 + 0.75); ctx.stroke(); }
    A.oval(ctx, bx - bl * 0.18, by - 15, 2.4, 2.4, 0, '#2a7f9e');
    // the water lapping over the bottom of its hull
    ctx.fillStyle = 'rgba(110,112,62,0.75)';
    ctx.beginPath(); ctx.moveTo(bx - bl * 0.55, gy - 4); ctx.lineTo(bx - bl * 0.55, by - 2);
    for (let k = 0; k <= 8; k++) ctx.lineTo(bx - bl * 0.55 + k * bl * 0.14, by - 2 + Math.sin(t * 2 + k) * 1.2);
    ctx.lineTo(bx + bl * 0.57, gy - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(240,235,200,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx - bl * 0.5, by - 1); ctx.lineTo(bx + bl * 0.5, by - 1); ctx.stroke();
  };

  // A small, old wooden dinghy half sunk in the mud: tilted bow-up, a croc-sized bite out of its side,
  // a broken oar stuck in the mud, and a gull standing on it looking unimpressed. (About 180 px wide.)
  DECOR.boatWreck = function (ctx, d, gy, t) {
    const x = d.x, S = 1.25, R = -0.24, ox = x - 2, oy = gy - 6;
    const at = (lx, ly) => [ox + (lx * Math.cos(R) - ly * Math.sin(R)) * S, oy + (lx * Math.sin(R) + ly * Math.cos(R)) * S];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the muddy puddle it's stuck in
    A.oval(ctx, x, gy - 1, 96, 10, 0, '#5e4c38', LINE, 2);
    A.oval(ctx, x + 6, gy - 2, 62, 5, 0, '#6f6a46');
    A.oval(ctx, x - 6, gy - 3, 24, 1.5, 0, 'rgba(230,235,220,0.5)');
    // the broken oar, stuck in the mud by the stern
    ctx.save(); ctx.translate(x - 62, gy - 3); ctx.rotate(-0.42);
    ctx.fillStyle = '#c99a5e'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-2.5, -58, 5, 58, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2.5, -58); ctx.lineTo(-1, -64); ctx.lineTo(1, -59); ctx.lineTo(2.5, -63); ctx.lineTo(2.5, -58); ctx.stroke();
    ctx.restore();
    // the hull, tipped bow-up and sunk at the stern, with a bite out of its side
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(R); ctx.scale(S, S);
    const hull = () => {
      ctx.beginPath();
      ctx.moveTo(-56, -22); ctx.lineTo(-10, -22);
      biteEdge(ctx, -10, -22, 16, -22, 3, -6, 4);
      ctx.lineTo(52, -24); ctx.quadraticCurveTo(64, -26, 66, -34);
      ctx.quadraticCurveTo(58, 2, 30, 8); ctx.lineTo(-48, 8); ctx.quadraticCurveTo(-58, 0, -56, -22); ctx.closePath();
    };
    hull(); ctx.fillStyle = '#9a7650'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(50,32,18,0.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(-60, -14 + k * 7); ctx.quadraticCurveTo(10, -10 + k * 7, 66, -28 + k * 9); } ctx.stroke();
    ctx.fillStyle = 'rgba(70,150,150,0.85)'; ctx.fillRect(-60, -24, 130, 5);
    ctx.fillStyle = 'rgba(60,90,50,0.6)'; ctx.fillRect(-60, 0, 130, 10);
    ctx.fillStyle = 'rgba(240,230,210,0.85)';
    ctx.beginPath(); circ(ctx, 30, -2, 1.5); circ(ctx, 36, 1, 1.2); circ(ctx, 24, 2, 1.3); ctx.fill();
    ctx.restore();
    hull(); ctx.strokeStyle = LINE; ctx.lineWidth = 2.2; ctx.stroke();
    // the dark inside showing through the bite, and the bow's mooring ring
    ctx.fillStyle = '#3a2a1c';
    ctx.beginPath(); ctx.moveTo(-8, -21); biteEdge(ctx, -8, -21, 14, -21, 3, -9, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a8f96'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(58, -22, 2.6, 0, TAU); ctx.stroke();
    ctx.restore();
    // mud and water over the sunken stern
    ctx.fillStyle = '#5e4c38'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 94, gy + 2); ctx.quadraticCurveTo(x - 76, gy - 16, x - 46, gy - 9); ctx.quadraticCurveTo(x - 10, gy - 3, x + 30, gy - 1); ctx.quadraticCurveTo(x + 60, gy, x + 70, gy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,235,220,0.75)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let j = 0; j < 3; j++) { const k = mod(t * 0.5 + j / 3, 1); circ(ctx, x - 86 + j * 7, gy - 8 - k * 12, 1.2 + k * 1.5); } ctx.stroke();
    // a silver gull on the gunwale, blinking and turning its head
    const [fx, fy] = at(42, -24), gx = fx, gyy = fy - 15, look = Math.sin(t * 0.7 + x) > 0.3 ? -1 : 1, blink = Math.sin(t * 1.3 + x) > 0.96;
    ctx.strokeStyle = '#e0503a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(gx - 2, gyy + 8); ctx.lineTo(gx - 3, fy + 1); ctx.moveTo(gx + 3, gyy + 8); ctx.lineTo(gx + 3, fy - 1); ctx.stroke();
    A.oval(ctx, gx, gyy, 12, 8, 0.1, '#ffffff', LINE, 2);
    A.oval(ctx, gx - 2, gyy - 2, 9, 4.5, 0.15, '#a9b4bf', LINE, 1.5);
    ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.moveTo(gx - 10, gyy - 2); ctx.lineTo(gx - 19, gyy + 1); ctx.lineTo(gx - 9, gyy + 3); ctx.closePath(); ctx.fill();
    A.oval(ctx, gx + 7 * look, gyy - 10, 6.5, 6, 0, '#ffffff', LINE, 2);
    ctx.fillStyle = '#e0503a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(gx + 12 * look, gyy - 11); ctx.lineTo(gx + 20 * look, gyy - 9.5); ctx.lineTo(gx + 12 * look, gyy - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (blink) { ctx.strokeStyle = LINE; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(gx + 7 * look, gyy - 12); ctx.lineTo(gx + 11 * look, gyy - 12); ctx.stroke(); }
    else { A.oval(ctx, gx + 9 * look, gyy - 12, 1.6, 1.6, 0, '#ffffff', LINE, 1); A.oval(ctx, gx + 9.4 * look, gyy - 12, 0.8, 0.8, 0, LINE); }
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(gx + 6 * look, gyy - 15); ctx.lineTo(gx + 11 * look, gyy - 14); ctx.stroke();
  };

  const baseDecor = A.decor;
  A.decor = function (ctx, d, groundY, t) {
    if (d && typeof d.type === 'string' && has(DECOR, d.type)) {
      ctx.save();
      DECOR[d.type](ctx, d, groundY, t || 0);
      ctx.restore();
    } else baseDecor(ctx, d, groundY, t);
  };
  // the decoration types added here (for the map checks in the tests)
  A.DECOR_TYPES_TOPEND = Object.keys(DECOR);
})();
