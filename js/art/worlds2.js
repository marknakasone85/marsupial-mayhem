// Milestone 7 scenery (worlds 4-7 and the bonus Isle of Man map), all drawn in code: backgrounds for
// the Alps, Tasmania, the City, the Time Rift, Grin Isle, the reptilians' lair and a generic green
// island; their platforms, ground plants and water; weather drawn over the screen; and decorations.
// Loaded right after worlds.js. It wraps A.background, A.groundPlant, A.platform, A.water and A.decor
// once more (other themes and types fall through to the earlier versions) and adds A.weather.
// No real landmarks: the bridge, towers, lighthouse and island are all generic.
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
  // Sub-paths (no stray joining lines) so many shapes can share one fill.
  // (radii are clamped: a negative one would make the canvas throw)
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
  // The same, hanging from the top of the screen (cave ceilings): reaches down to h(layerX).
  function ceiling(ctx, camX, f, color, h) {
    const off = camX * f;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    for (let sx = -10; sx <= W + 20; sx += 15) ctx.lineTo(sx, h(sx + off));
    ctx.lineTo(W + 20, -10);
    ctx.closePath();
    ctx.fill();
  }
  // the top half of an ellipse as its own sub-path (snow caps, domes)
  function cap(ctx, x, y, rx, ry) { rx = Math.max(0.1, rx); ry = Math.max(0.1, ry); ctx.moveTo(x - rx, y); ctx.ellipse(x, y, rx, ry, 0, Math.PI, TAU); ctx.closePath(); }
  // a frothy line of surf along y from x0 to x1
  function foamLine(ctx, x0, x1, y, t, seed, alpha) {
    const n = Math.max(2, Math.round((x1 - x0) / 16));
    ctx.fillStyle = 'rgba(255,255,255,' + (alpha || 0.85) + ')';
    ctx.beginPath(); ctx.moveTo(x0, y + 3); ctx.lineTo(x0, y);
    for (let j = 0; j < n; j++) {
      const a = lerp(x0, x1, j / n), b = lerp(x0, x1, (j + 1) / n);
      const up = 4 + Math.abs(Math.sin(t * 1.7 + j * 1.31 + seed)) * 7;
      ctx.quadraticCurveTo((a + b) / 2, y - up * 1.6, b, y);
    }
    ctx.lineTo(x1, y + 3); ctx.closePath(); ctx.fill();
  }
  // skies and the other still gradient bands are drawn once and reused (A.band, js/art/still.js)
  function skyFill(ctx, bottom, c0, c1, c2) {
    A.band(ctx, 0, 0, W, bottom, [0, 0, 0, bottom], [[0, c0], [0.6, c1], [1, c2]]);
  }
  const CLOUD = [[0, 0, 22], [24, -8, 26], [52, 0, 20], [26, 6, 22]];
  // n puffy clouds drifting with the wind (speed) and a little with the camera (f); s = size
  function clouds(ctx, camX, t, n, y0, dy, f, speed, color, s) {
    const span = W + 320 * s;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const cx = mod(i * (span / n) + hash(i + 5) * 120 - camX * f - t * speed, span) - 160 * s;
      const cy = y0 + i * dy + hash(i + 9) * 12;
      for (const [dx, ey, r] of CLOUD) circ(ctx, cx + dx * s, cy + ey * s, r * s);
    }
    ctx.fill();
  }
  function sun(ctx, x, y, sunset) {
    ctx.fillStyle = sunset ? 'rgba(255,214,102,0.4)' : 'rgba(255,240,180,0.5)';
    ctx.beginPath(); ctx.arc(x, y, sunset ? 86 : 56, 0, TAU); ctx.fill();
    ctx.fillStyle = sunset ? '#ffd166' : '#fff3c4';
    ctx.beginPath(); ctx.arc(x, y, sunset ? 60 : 37, 0, TAU); ctx.fill();
  }
  function dusk(ctx, a) {
    ctx.fillStyle = 'rgba(255,110,60,' + (a || 0.14) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  // A mountain: a lit left face, a shaded right face and a zigzag snow cap down to snowK of its height.
  // cols: [rock, rock shade, snow, snow shade]
  function peak(ctx, x, base, w, h, skew, cols, snowK, seed) {
    const ax = x + skew, ay = base - h, lx = x - w / 2, rx = x + w / 2;
    ctx.fillStyle = cols[0];
    ctx.beginPath(); ctx.moveTo(lx, base); ctx.lineTo(ax, ay); ctx.lineTo(rx, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cols[1];
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(rx, base); ctx.lineTo(ax + w * 0.1, base); ctx.lineTo(ax + w * 0.05, ay + h * 0.45); ctx.closePath(); ctx.fill();
    if (!(snowK > 0)) return;
    const ly = ay + h * snowK, p0 = lerp(ax, lx, snowK), p1 = lerp(ax, rx, snowK);
    ctx.fillStyle = cols[2];
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(p0, ly);
    for (let j = 1; j < 6; j++) ctx.lineTo(lerp(p0, p1, j / 6), ly + (j % 2 ? -0.09 : 0.06) * h * (0.6 + hash(seed + j) * 0.8));
    ctx.lineTo(p1, ly); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cols[3];
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(p1, ly); ctx.lineTo(lerp(p0, p1, 0.84), ly + 0.06 * h); ctx.lineTo(ax + w * 0.04, ay + h * snowK * 0.7); ctx.closePath(); ctx.fill();
  }
  // Smoke puffs rising from (x, y), drifting right and fading.
  function smoke(ctx, x, y, t, n, size, rgb, alpha, rise) {
    for (let j = 0; j < n; j++) {
      const k = mod(t * 0.18 + j / n, 1);
      ctx.fillStyle = 'rgba(' + rgb + ',' + (alpha * (1 - k)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x + k * rise * 0.8 + Math.sin(t + j) * 3, y - k * rise, size * (0.4 + k), 0, TAU); ctx.fill();
    }
  }
  // Fits a line of text into maxW (a rough width estimate, so it also works without measureText).
  function fitText(ctx, str, x, y, maxW, maxSize, color, outline) {
    const size = Math.max(7, Math.min(maxSize, maxW / (str.length * 0.66)));
    if (outline) MG.UI.outlineText(ctx, str, x, y, size, color, 'center', outline);
    else MG.UI.text(ctx, str, x, y, size, color, 'center');
  }

  // ================================================================ backgrounds
  const BG = {};

  // ---- the Alps: snowy peaks, rolling snowy high plains with snow-gum woods and a far hut
  const ALP_FAR = ['#b4c3d6', '#a0b2c9', '#f3f7fd', '#d9e3f0'];
  const ALP_NEAR = ['#8597b2', '#6f829f', '#ffffff', '#d3dfee'];
  const alpHill = (x) => 30 + Math.sin(x * 0.006) * 16 + Math.sin(x * 0.017 + 1) * 8;
  const alpDrift = (x) => 12 + Math.sin(x * 0.011) * 7 + Math.sin(x * 0.029 + 2) * 4;
  // a little hut far away on the snow: timber walls, red roof under snow, a curl of smoke
  function farHut(ctx, x, y, t, s) {
    ctx.fillStyle = '#8f7356'; ctx.fillRect(x - 14 * s, y - 13 * s, 28 * s, 13 * s);
    ctx.fillStyle = '#7d8a96'; ctx.fillRect(x + 6 * s, y - 24 * s, 5 * s, 10 * s);
    ctx.fillStyle = '#b5493c';
    ctx.beginPath(); ctx.moveTo(x - 18 * s, y - 12 * s); ctx.lineTo(x, y - 24 * s); ctx.lineTo(x + 18 * s, y - 12 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x - 15 * s, y - 14 * s); ctx.lineTo(x, y - 25 * s); ctx.lineTo(x + 15 * s, y - 14 * s); ctx.lineTo(x, y - 20 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(x - 8 * s, y - 9 * s, 5 * s, 4 * s);
    smoke(ctx, x + 8.5 * s, y - 26 * s, t, 4, 4 * s, '235,240,245', 0.7, 40 * s);
  }
  // a soft background snow gum: pale twisting trunks and grey-green crowns (with snow on top)
  function farGum(ctx, x, base, s, i, snow) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#d9d2c6'; ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(x, base); ctx.bezierCurveTo(x - 16 * s, base - 40 * s, x + 16 * s, base - 70 * s, x - 6 * s, base - 108 * s);
    ctx.moveTo(x + 1 * s, base - 26 * s); ctx.quadraticCurveTo(x + 30 * s, base - 54 * s, x + 30 * s, base - 92 * s);
    ctx.moveTo(x - 4 * s, base - 50 * s); ctx.quadraticCurveTo(x - 30 * s, base - 64 * s, x - 34 * s, base - 84 * s);
    ctx.stroke();
    const blobs = [[-6, -112, 22], [-30, -90, 16], [30, -96, 18], [12, -118, 15], [-20, -110, 14], [44, -86, 11]];
    ctx.fillStyle = '#86a08a';
    ctx.beginPath();
    for (const [bx, by, r] of blobs) circ(ctx, x + bx * s, base + by * s, r * s * (0.85 + hash(i + bx) * 0.3));
    ctx.fill();
    if (snow) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (const [bx, by, r] of blobs) cap(ctx, x + bx * s, base + (by - r * 0.55) * s, r * 0.8 * s, r * 0.38 * s);
      ctx.fill();
    }
  }
  BG.alps = function (ctx, camX, t, gy, sunset) {
    skyFill(ctx, gy, sunset ? '#38305a' : '#3b8ad6', sunset ? '#e8907a' : '#a6d4f2', sunset ? '#ffd6a8' : '#eaf6ff');
    sun(ctx, 190, sunset ? gy - 200 : 80, sunset);
    clouds(ctx, camX, t, 3, 60, 34, 0.05, 5, sunset ? 'rgba(255,200,180,0.8)' : 'rgba(255,255,255,0.9)', 0.9);
    // two rows of snowy peaks, then haze at their feet
    each(camX, 0.03, 330, 320, (sx, i) => peak(ctx, sx + hash(i + 1) * 100, gy - 128, 300 + hash(i + 2) * 170, 110 + hash(i + 3) * 80, (hash(i + 4) - 0.5) * 70, ALP_FAR, 0.42, i));
    each(camX, 0.05, 430, 320, (sx, i) => peak(ctx, sx + hash(i + 11) * 140, gy - 118, 340 + hash(i + 12) * 180, 150 + hash(i + 13) * 90, (hash(i + 14) - 0.5) * 90, ALP_NEAR, 0.36, i + 40));
    A.band(ctx, 0, gy - 220, W, 110, [0, gy - 220, 0, gy - 110],
      [[0, sunset ? 'rgba(255,214,190,0)' : 'rgba(236,245,253,0)'], [1, sunset ? 'rgba(255,214,190,0.8)' : 'rgba(236,245,253,0.85)']]);
    // rolling snowy high plains with dark clumps of snow-gum woodland and a little hut
    const off12 = camX * 0.12;
    ridge(ctx, camX, 0.12, gy - 112, gy, '#eef3fa', alpHill);
    ridge(ctx, camX, 0.12, gy - 96, gy, '#dfe8f3', (x) => alpHill(x + 260) * 0.6);
    ctx.fillStyle = '#7f988a';
    ctx.beginPath();
    each(camX, 0.12, 8, 20, (sx, i) => {
      if (hash(Math.floor(i / 12) + 3) < 0.5) return;
      const r = 3 + hash(i + 6) * 4;
      circ(ctx, sx, gy - 112 - alpHill(sx + off12) + 4 + r + hash(i + 5) * 6, r);
    });
    ctx.fill();
    each(camX, 0.12, 1900, 60, (sx) => farHut(ctx, sx + 700, gy - 112 - alpHill(sx + 700 + off12) + 6, t, 1));
    // nearer snowdrifts with snow gums standing in them
    const off3 = camX * 0.3;
    ridge(ctx, camX, 0.3, gy - 46, gy, '#f6f9fd', alpDrift);
    each(camX, 0.3, 240, 160, (sx, i) => {
      if (hash(i + 21) < 0.3) return;
      const tx = sx + hash(i + 22) * 90;
      farGum(ctx, tx, gy - 42 - alpDrift(tx + off3), 0.75 + hash(i + 23) * 0.4, i, true);
    });
    ctx.strokeStyle = 'rgba(160,185,215,0.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, gy - 44 - alpDrift(off3 - 10));
    for (let sx = 5; sx <= W + 20; sx += 15) ctx.lineTo(sx, gy - 44 - alpDrift(sx + off3));
    ctx.stroke();
    // snowy rocks and golden snow-grass tussocks just behind the path
    each(camX, 0.6, 150, 80, (sx, i) => {
      if (hash(i + 31) < 0.45) return;
      const rx = sx + hash(i + 32) * 50, r = 12 + hash(i + 33) * 12;
      A.oval(ctx, rx, gy - r * 0.45, r, r * 0.7, 0, '#8d96a3');
      A.oval(ctx, rx - r * 0.25, gy - r * 0.62, r * 0.4, r * 0.25, 0, '#a9b2bd');
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(rx, gy - r * 0.9, r * 0.8, r * 0.32, 0, Math.PI, TAU); ctx.fill();
    });
    ctx.strokeStyle = '#c9b778'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    each(camX, 0.6, 70, 40, (sx, i) => {
      if (hash(i + 35) < 0.4) return;
      const bx = sx + hash(i + 36) * 30;
      for (let j = -3; j <= 3; j++) { ctx.moveTo(bx + j * 1.5, gy); ctx.quadraticCurveTo(bx + j * 3, gy - 12, bx + j * 7, gy - 16 + Math.abs(j) * 2); }
    });
    ctx.stroke();
    // the snowy ground: blue hollows, rocks poking through and twinkling glints
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#fbfdff'], [1, '#c9d7e6']]);
    ctx.fillStyle = 'rgba(140,170,210,0.28)';
    ctx.beginPath();
    each(camX, 1, 90, 70, (sx, i) => ell(ctx, sx + hash(i + 41) * 40, gy + 14 + hash(i + 42) * 44, 24 + hash(i + 43) * 30, 3.5 + hash(i + 44) * 3, 0));
    ctx.fill();
    ctx.fillStyle = '#7f8894';
    ctx.beginPath();
    each(camX, 1, 130, 30, (sx, i) => { if (hash(i + 45) < 0.5) ell(ctx, sx + hash(i + 46) * 60, gy + 18 + hash(i + 47) * 40, 6 + hash(i + 48) * 5, 3, 0); });
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    each(camX, 1, 130, 30, (sx, i) => { if (hash(i + 45) < 0.5) cap(ctx, sx + hash(i + 46) * 60, gy + 16 + hash(i + 47) * 40, 6 + hash(i + 48) * 4, 2.2); });
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 1, 47, 20, (sx, i) => {
      const k = Math.sin(t * 3 + i * 1.7);
      if (k < 0.6) return;
      const gx = sx + hash(i + 49) * 30, gyy = gy + 10 + hash(i + 50) * 50, r = (k - 0.6) * 9;
      ctx.moveTo(gx - r, gyy); ctx.lineTo(gx + r, gyy); ctx.moveTo(gx, gyy - r); ctx.lineTo(gx, gyy + r);
    });
    ctx.stroke();
    ctx.fillStyle = '#d4e1ef';
    ctx.fillRect(0, gy, W, 3);
    if (sunset) dusk(ctx, 0.12);
  };

  // ---- Tasmania: a wild southern coast. Cloudy sky, misty mountains, a cold sea with surf
  // around dark cliffs and sea stacks, button-grass plains and a peaty track
  const tasMtn = (x) => 70 + Math.sin(x * 0.004) * 30 + Math.abs(Math.sin(x * 0.011 + 1)) * 34 + Math.sin(x * 0.031) * 6;
  const tasPlain = (x) => 26 + Math.sin(x * 0.007) * 10 + Math.sin(x * 0.019 + 3) * 6;
  // a dark rocky headland rising from the sea, with a grassy top and surf breaking at its foot
  function headland(ctx, x, sea, w, h, t, i) {
    ctx.fillStyle = '#4f5257';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, sea + 4);
    ctx.lineTo(x - w * 0.44, sea - h * 0.55); ctx.lineTo(x - w * 0.38, sea - h * 0.62); ctx.lineTo(x - w * 0.3, sea - h * 0.92);
    ctx.lineTo(x - w * 0.1, sea - h); ctx.lineTo(x + w * 0.15, sea - h * 0.96); ctx.lineTo(x + w * 0.34, sea - h * 0.8);
    ctx.lineTo(x + w * 0.4, sea - h * 0.5); ctx.lineTo(x + w * 0.5, sea + 4);
    ctx.closePath(); ctx.fill();
    // rock columns
    ctx.strokeStyle = 'rgba(120,125,130,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let j = 0; j < 9; j++) {
      const cx = x - w * 0.4 + j * w * 0.1;
      ctx.moveTo(cx, sea - h * (0.5 + 0.4 * Math.sin((j / 8) * Math.PI))); ctx.lineTo(cx + 2, sea);
    }
    ctx.stroke();
    ctx.fillStyle = '#6b7448';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.31, sea - h * 0.9); ctx.lineTo(x - w * 0.1, sea - h - 3); ctx.lineTo(x + w * 0.15, sea - h * 0.96 - 3); ctx.lineTo(x + w * 0.33, sea - h * 0.8);
    ctx.lineTo(x + w * 0.2, sea - h * 0.86); ctx.lineTo(x - w * 0.1, sea - h * 0.9); ctx.closePath(); ctx.fill();
    foamLine(ctx, x - w * 0.54, x + w * 0.54, sea + 3, t, i * 3, 0.9);
  }
  BG.tasmania = function (ctx, camX, t, gy, sunset) {
    const hz = gy - 168;
    skyFill(ctx, hz + 2, sunset ? '#3a3050' : '#7894ab', sunset ? '#c97a6a' : '#b4c6d3', sunset ? '#f0b48a' : '#e0e8ee');
    if (sunset) sun(ctx, 760, hz - 40, true);
    // heavy cloud banks
    clouds(ctx, camX, t, 4, 40, 18, 0.03, 3, sunset ? 'rgba(150,110,130,0.75)' : 'rgba(150,165,180,0.75)', 1.6);
    clouds(ctx, camX + 400, t, 4, 70, 22, 0.05, 6, sunset ? 'rgba(255,200,180,0.75)' : 'rgba(236,241,245,0.9)', 1.2);
    // misty mountains, layered
    ridge(ctx, camX, 0.02, hz + 2, hz + 4, '#9fb0be', (x) => tasMtn(x) + 20);
    ridge(ctx, camX, 0.04, hz + 2, hz + 4, '#8a9dad', (x) => tasMtn(x + 900) * 0.7);
    A.band(ctx, 0, hz - 60, W, 62, [0, hz - 60, 0, hz], [[0, 'rgba(225,233,238,0)'], [1, 'rgba(225,233,238,0.8)']]);
    // the cold sea, with whitecaps
    A.band(ctx, 0, hz, W, gy - hz, [0, hz, 0, gy], [[0, sunset ? '#4a5a78' : '#4c6b81'], [1, sunset ? '#7a8aa0' : '#6f8d9f']]);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, hz, W, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    each(camX, 0.1, 48, 40, (sx, i) => {
      const k = mod(t * 0.5 + hash(i + 61), 1);
      if (k > 0.6) return;
      const wy = hz + 10 + hash(i + 62) * 80, wx = sx + hash(i + 63) * 30;
      ctx.moveTo(wx - 8 * k - 3, wy); ctx.lineTo(wx + 8 * k + 3, wy);
    });
    ctx.stroke();
    // headlands and sea stacks
    each(camX, 0.08, 1100, 300, (sx, i) => {
      headland(ctx, sx + 300, hz + 40, 260 + hash(i + 64) * 120, 70 + hash(i + 65) * 40, t, i);
      const st = sx + 620 + hash(i + 66) * 140, sh = 34 + hash(i + 67) * 26;
      ctx.fillStyle = '#5a5d62';
      ctx.beginPath(); ctx.moveTo(st - 16, hz + 52); ctx.lineTo(st - 12, hz + 52 - sh); ctx.lineTo(st + 4, hz + 50 - sh - 4); ctx.lineTo(st + 13, hz + 52 - sh * 0.7); ctx.lineTo(st + 17, hz + 52); ctx.closePath(); ctx.fill();
      foamLine(ctx, st - 22, st + 22, hz + 53, t, i * 5 + 1, 0.85);
    });
    // surf washing onto the near shore, dark boulders, then the button-grass plains
    foamLine(ctx, -mod(camX * 0.25, 32) - 16, W + 32, gy - 70, t, 0, 0.8);
    each(camX, 0.25, 90, 60, (sx, i) => {
      if (hash(i + 68) < 0.35) return;
      const bx = sx + hash(i + 69) * 40, r = 12 + hash(i + 70) * 14;
      A.oval(ctx, bx, gy - 62, r, r * 0.6, 0, '#53565b');
      A.oval(ctx, bx - r * 0.3, gy - 62 - r * 0.25, r * 0.45, r * 0.2, 0, '#6e7278');
    });
    const off3 = camX * 0.3;
    ridge(ctx, camX, 0.3, gy - 30, gy, '#a49a5c', tasPlain);
    // tussock clumps and button seed heads
    ['#8c8446', '#c4b872'].forEach((col, c) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath();
      each(camX, 0.3, 22, 30, (sx, i) => {
        if ((i & 1) !== c) return;
        const bx = sx + hash(i + 71) * 10, by = gy - 28 - tasPlain(bx + off3) + 6 + hash(i + 72) * 18;
        for (let j = -2; j <= 2; j++) { ctx.moveTo(bx + j * 1.5, by + 6); ctx.quadraticCurveTo(bx + j * 3.5, by - 6, bx + j * 7, by - 9 + Math.abs(j) * 2); }
      });
      ctx.stroke();
    });
    ctx.strokeStyle = '#7a6a3e'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    const buttons = [];
    each(camX, 0.3, 23, 30, (sx, i) => {
      if (hash(i + 73) < 0.4) return;
      const bx = sx + hash(i + 74) * 12, by = gy - 28 - tasPlain(bx + off3) + 4, hh = 18 + hash(i + 75) * 12, sw = Math.sin(t * 1.2 + i) * 1.5;
      ctx.moveTo(bx, by); ctx.lineTo(bx + 2 + sw, by - hh);
      buttons.push([bx + 2 + sw, by - hh]);
    });
    ctx.stroke();
    ctx.fillStyle = '#5a4430';
    ctx.beginPath(); for (const [bx, by] of buttons) circ(ctx, bx, by, 2.4); ctx.fill();
    // a peaty track with flat grey stones and moss
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#6a5a44'], [1, '#3b3127']]);
    ctx.fillStyle = '#8b8a84';
    ctx.beginPath();
    each(camX, 1, 70, 40, (sx, i) => { if (hash(i + 81) < 0.55) ell(ctx, sx + hash(i + 82) * 30, gy + 14 + hash(i + 83) * 44, 9 + hash(i + 84) * 9, 3.5 + hash(i + 85) * 2, (hash(i + 86) - 0.5) * 0.3); });
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    each(camX, 1, 70, 40, (sx, i) => { if (hash(i + 81) < 0.55) ell(ctx, sx + hash(i + 82) * 30 - 2, gy + 13 + hash(i + 83) * 44, 5 + hash(i + 84) * 4, 1.4, 0); });
    ctx.fill();
    ctx.fillStyle = '#6f7d3e';
    ctx.beginPath();
    each(camX, 1, 41, 20, (sx, i) => { if (hash(i + 87) < 0.5) ell(ctx, sx + hash(i + 88) * 20, gy + 8 + hash(i + 89) * 50, 6 + hash(i + 90) * 5, 2.2, 0); });
    ctx.fill();
    ctx.fillStyle = '#8a8446';
    ctx.fillRect(0, gy, W, 4);
    if (sunset) dusk(ctx, 0.12);
  };

  // ---- the City: a harbour city. Far towers and a generic steel arch bridge (a single red rib with
  // hangers, no stone towers), ferries and sailboats, a row of terrace houses with lacy balconies,
  // then a footpath, kerb and road
  const TOWERS = ['#a9bccf', '#b9c8d6', '#98aec4', '#c4d0dc', '#8ea5bd'];
  const TERRACE = ['#f2cc8f', '#f4a99a', '#a8d5d8', '#cdb4db', '#f6efe0', '#b8d8a8', '#f7b267'];
  function bridgeArch(ctx, L, deck, span, t) {
    const rise = span * 0.24, R = L + span;
    const archY = (k, r) => deck - r * 4 * k * (1 - k);
    ctx.fillStyle = '#7d8794';
    for (const px of [L - 70, R + 70]) ctx.fillRect(px - 4, deck, 8, 26);
    ctx.fillRect(L - 7, deck, 14, 30); ctx.fillRect(R - 7, deck, 14, 30);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // the rib behind (fainter), the hangers, then the front rib with a highlight
    ctx.strokeStyle = 'rgba(180,80,64,0.55)'; ctx.lineWidth = 5;
    ctx.beginPath();
    for (let j = 0; j <= 24; j++) { const k = j / 24, x = L + 10 + k * (span - 20), y = archY(k, rise - 10) - 4; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let j = 1; j < 16; j++) { const k = j / 16, x = L + k * span; ctx.moveTo(x, archY(k, rise)); ctx.lineTo(x, deck); }
    ctx.stroke();
    ctx.strokeStyle = '#c9503e'; ctx.lineWidth = 7;
    ctx.beginPath();
    for (let j = 0; j <= 28; j++) { const k = j / 28, x = L + k * span; if (j) ctx.lineTo(x, archY(k, rise)); else ctx.moveTo(x, archY(k, rise)); }
    ctx.stroke();
    ctx.strokeStyle = '#ef8a72'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#5f6875'; ctx.fillRect(L - 110, deck - 3, span + 220, 7);
    const cars = ['#ffd23f', '#e63946', '#ffffff', '#3a86ff', '#52b788'];
    for (let j = 0; j < 5; j++) {
      const dir = j % 2 ? 1 : -1, cx = L - 110 + mod(t * 36 * dir + j * 137, span + 220);
      ctx.fillStyle = cars[j]; ctx.fillRect(cx - 4, deck - 7, 8, 4);
    }
  }
  function ferry(ctx, x, y, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-34, 3); ctx.lineTo(-60, 4); ctx.moveTo(-34, 0); ctx.lineTo(-52, -1); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-32, -6); ctx.lineTo(32, -6); ctx.lineTo(26, 4); ctx.lineTo(-28, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e05a47'; ctx.fillRect(-29, -3, 57, 3);
    ctx.fillStyle = '#f4f1e8'; ctx.fillRect(-20, -15, 38, 9); ctx.fillRect(-10, -21, 22, 6);
    ctx.fillStyle = '#3d5a80';
    for (let j = 0; j < 6; j++) ctx.fillRect(-17 + j * 6, -13, 3.5, 4);
    ctx.fillStyle = '#e05a47'; ctx.fillRect(4, -27, 5, 6);
    ctx.restore();
  }
  function sailboat(ctx, x, y, col) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x, y - 24); ctx.lineTo(x + 14, y - 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 2, y - 3); ctx.lineTo(x - 2, y - 18); ctx.lineTo(x - 10, y - 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x - 12, y - 2); ctx.lineTo(x + 16, y - 2); ctx.lineTo(x + 11, y + 3); ctx.lineTo(x - 8, y + 3); ctx.closePath(); ctx.fill();
  }
  // a row of n two-storey terrace houses: lacy iron balconies, curved veranda roofs, little parapets
  function terraces(ctx, x0, base, n, seed) {
    const hw = 62;
    ctx.lineJoin = 'round';
    for (let j = 0; j < n; j++) {
      const x = x0 + j * hw, s = seed * 7 + j, h = 126 + (hash(s + 2) < 0.35 ? 14 : 0);
      ctx.fillStyle = TERRACE[Math.floor(hash(s + 1) * TERRACE.length)];
      ctx.strokeStyle = 'rgba(43,26,20,0.5)'; ctx.lineWidth = 1.5;
      ctx.fillRect(x, base - h, hw, h); ctx.strokeRect(x, base - h, hw, h);
      // parapet with a little rounded pediment
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x, base - h, hw, 7);
      ctx.beginPath(); ctx.moveTo(x + hw / 2 - 14, base - h); ctx.quadraticCurveTo(x + hw / 2, base - h - 16, x + hw / 2 + 14, base - h); ctx.closePath(); ctx.fill(); ctx.stroke();
      // upstairs: french door behind the balcony, the veranda roof and its lace frieze
      ctx.fillStyle = '#4a5a6a'; ctx.fillRect(x + 20, base - h + 22, 22, 34);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 22, base - h + 24, 4, 30);
      const vy = base - 66;
      ctx.fillStyle = ['#7a8a9a', '#5a7a6a', '#8a5a5a'][Math.floor(hash(s + 3) * 3)];
      ctx.beginPath(); ctx.moveTo(x - 2, base - h + 12); ctx.quadraticCurveTo(x + hw / 2, base - h + 2, x + hw + 2, base - h + 12); ctx.lineTo(x + hw + 2, base - h + 18); ctx.lineTo(x - 2, base - h + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) { const lx = x + 4 + k * 7.5; ctx.moveTo(lx, base - h + 19); ctx.quadraticCurveTo(lx + 3.7, base - h + 26, lx + 7.5, base - h + 19); }
      // the balcony railing, posts and lace
      ctx.moveTo(x + 2, vy); ctx.lineTo(x + hw - 2, vy); ctx.moveTo(x + 2, vy - 14); ctx.lineTo(x + hw - 2, vy - 14);
      for (let k = 0; k < 10; k++) { const lx = x + 4 + k * 6; ctx.moveTo(lx, vy); ctx.lineTo(lx + 3, vy - 14); ctx.lineTo(lx + 6, vy); }
      ctx.moveTo(x + 3, vy); ctx.lineTo(x + 3, base); ctx.moveTo(x + hw - 3, vy); ctx.lineTo(x + hw - 3, base);
      ctx.stroke();
      ctx.fillStyle = 'rgba(43,26,20,0.18)'; ctx.fillRect(x, vy, hw, 4);
      // downstairs: front door with a fanlight, and a window
      ctx.fillStyle = ['#2d6a4f', '#9d2c2c', '#264653', '#6a4c93'][Math.floor(hash(s + 4) * 4)];
      ctx.strokeStyle = 'rgba(43,26,20,0.5)'; ctx.lineWidth = 1.5;
      ctx.fillRect(x + 8, base - 44, 18, 44); ctx.strokeRect(x + 8, base - 44, 18, 44);
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + 9, base - 50, 16, 5);
      ctx.fillStyle = '#4a5a6a'; ctx.fillRect(x + 34, base - 46, 20, 28); ctx.strokeRect(x + 34, base - 46, 20, 28);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 36, base - 44, 4, 24);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 32, base - 18, 24, 3);
    }
  }
  function streetTree(ctx, x, base, s) {
    ctx.fillStyle = '#6b5440'; ctx.fillRect(x - 3 * s, base - 70 * s, 6 * s, 70 * s);
    ctx.fillStyle = '#4f8a4a';
    ctx.beginPath(); circ(ctx, x, base - 92 * s, 30 * s); circ(ctx, x - 22 * s, base - 76 * s, 20 * s); circ(ctx, x + 22 * s, base - 78 * s, 22 * s); ctx.fill();
    ctx.fillStyle = '#65a35a';
    ctx.beginPath(); circ(ctx, x - 8 * s, base - 102 * s, 14 * s); circ(ctx, x + 14 * s, base - 88 * s, 10 * s); ctx.fill();
  }
  BG.city = function (ctx, camX, t, gy, sunset) {
    const hz = gy - 196;
    skyFill(ctx, hz + 2, sunset ? '#33285a' : '#3b8fe0', sunset ? '#ea8a6a' : '#a6d6f7', sunset ? '#ffd29a' : '#eaf5ff');
    sun(ctx, 820, sunset ? hz - 30 : 78, sunset);
    clouds(ctx, camX, t, 4, 50, 24, 0.05, 6, sunset ? 'rgba(255,196,170,0.85)' : 'rgba(255,255,255,0.88)', 1);
    // the far skyline: a cluster of towers, then the bridge, repeating
    each(camX, 0.05, 1300, 560, (sx, i) => {
      for (let j = 0; j < 15; j++) {
        const lowrise = j >= 11, k = j / 10, tw = 26 + hash(i * 31 + j) * 22, env = 1 - Math.abs(k - 0.5) * 1.3;
        const th = lowrise ? 18 + hash(i * 17 + j) * 22 : 40 + env * (60 + hash(i * 17 + j) * 90);
        const tx = lowrise ? sx + 1000 + (j - 11) * 50 : sx + 20 + j * 44 + hash(i + j) * 10;
        ctx.fillStyle = TOWERS[Math.floor(hash(i * 13 + j) * TOWERS.length)];
        ctx.fillRect(tx, hz - th, tw, th + 2);
        const top = hash(i * 7 + j);
        if (top < 0.25) { ctx.fillRect(tx + tw / 2 - 1, hz - th - 22, 2, 22); }
        else if (top < 0.45) { ctx.beginPath(); ctx.moveTo(tx, hz - th); ctx.lineTo(tx + tw, hz - th - 14); ctx.lineTo(tx + tw, hz - th); ctx.closePath(); ctx.fill(); }
        else if (top < 0.6) ctx.fillRect(tx + 4, hz - th - 8, tw - 8, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let y = hz - th + 6; y < hz - 4; y += 7) ctx.fillRect(tx + 3, y, tw - 6, 2);
      }
      // a construction crane on the skyline
      const cx = sx + 300;
      ctx.strokeStyle = '#e8a33d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, hz - 60); ctx.lineTo(cx, hz - 190); ctx.moveTo(cx - 30, hz - 182); ctx.lineTo(cx + 70, hz - 182); ctx.moveTo(cx + 56, hz - 182); ctx.lineTo(cx + 56, hz - 150 + Math.sin(t * 0.6) * 10); ctx.stroke();
      bridgeArch(ctx, sx + 580, hz - 8, 400, t);
    });
    // the harbour
    A.band(ctx, 0, hz, W, gy - 100 - hz, [0, hz, 0, gy - 100], [[0, sunset ? '#3a5a8a' : '#2a7fc0'], [1, sunset ? '#6a8ab0' : '#4fb0d8']]);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, hz, W, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 0.1, 50, 30, (sx, i) => {
      const wy = hz + 8 + hash(i + 101) * 76, wx = sx + hash(i + 102) * 30 + Math.sin(t * 1.5 + i) * 4;
      ctx.moveTo(wx - 7, wy); ctx.quadraticCurveTo(wx, wy - 3, wx + 7, wy);
    });
    ctx.stroke();
    ferry(ctx, mod(t * 16 - camX * 0.1, W + 300) - 120, hz + 42, 1);
    ferry(ctx, W + 150 - mod(t * 11 + camX * 0.1 + 500, W + 300), hz + 70, -1);
    each(camX, 0.08, 700, 60, (sx, i) => sailboat(ctx, sx + 200 + Math.sin(t * 0.3 + i) * 20, hz + 24 + hash(i + 103) * 30 + Math.sin(t * 1.5 + i), ['#d0573a', '#3a86ff', '#ffd23f'][i & 1 ? 1 : 0]));
    // the sandstone sea wall and the harbourside walk
    ctx.fillStyle = '#d8bf8a'; ctx.fillRect(0, gy - 100, W, 14);
    ctx.strokeStyle = 'rgba(140,110,60,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    each(camX, 0.2, 34, 10, (sx) => { ctx.moveTo(sx, gy - 100); ctx.lineTo(sx, gy - 86); });
    ctx.moveTo(0, gy - 93); ctx.lineTo(W, gy - 93);
    ctx.stroke();
    ctx.fillStyle = '#c9c2b4'; ctx.fillRect(0, gy - 86, W, 86);
    ctx.strokeStyle = '#4a5560'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, gy - 112); ctx.lineTo(W, gy - 112);
    each(camX, 0.2, 24, 10, (sx) => { ctx.moveTo(sx, gy - 112); ctx.lineTo(sx, gy - 100); });
    ctx.stroke();
    // terrace rows, with street trees in the gaps
    each(camX, 0.35, 560, 420, (sx, i) => {
      const n = 3 + Math.floor(hash(i + 111) * 3);
      terraces(ctx, sx + 20, gy, n, i);
      streetTree(ctx, sx + 20 + n * 62 + 60 + hash(i + 112) * 60, gy, 0.9 + hash(i + 113) * 0.3);
    });
    // footpath, kerb and road
    const kerb = gy + 34;
    ctx.fillStyle = '#d3cfc7'; ctx.fillRect(0, gy, W, kerb - gy);
    ctx.strokeStyle = 'rgba(120,115,105,0.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 1, 56, 20, (sx) => { ctx.moveTo(sx, gy + 1); ctx.lineTo(sx - 5, kerb); });
    ctx.moveTo(0, gy + 17); ctx.lineTo(W, gy + 17);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,115,105,0.25)';
    ctx.beginPath(); each(camX, 1, 61, 20, (sx, i) => { if (hash(i + 121) < 0.4) circ(ctx, sx + hash(i + 122) * 40, gy + 6 + hash(i + 123) * 24, 1.8); }); ctx.fill();
    ctx.fillStyle = '#ebe7df'; ctx.fillRect(0, kerb, W, 6);
    ctx.fillStyle = '#7f7a72'; ctx.fillRect(0, kerb + 6, W, 3);
    A.band(ctx, 0, kerb + 9, W, H - kerb - 9, [0, kerb + 9, 0, H], [[0, '#50545d'], [1, '#3b3e46']]);
    ctx.fillStyle = '#f2f0e8';
    each(camX, 1, 96, 50, (sx) => ctx.fillRect(sx, kerb + 21, 46, 4));
    ctx.fillStyle = '#e6e2da'; ctx.fillRect(0, gy, W, 3);
    if (sunset) dusk(ctx, 0.12);
  };

  // ---- the Time Rift: prehistoric Australia. A glowing purple tear in a warm hazy sky, smoking
  // volcanoes, giant tree ferns and cycads, dark volcanic soil
  const riftHill = (x) => 38 + Math.sin(x * 0.005) * 20 + Math.sin(x * 0.013 + 2) * 10;
  function skyTear(ctx, cx, cy, t) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.2);
    if (cx < -260 || cx > W + 260) return;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 210);
    g.addColorStop(0, 'rgba(215,140,255,' + (0.55 * pulse).toFixed(3) + ')'); g.addColorStop(1, 'rgba(170,90,255,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 210, Math.max(0, cy - 210), 420, cy + 210 - Math.max(0, cy - 210));
    const top = [], bot = [];
    for (let j = 0; j <= 12; j++) {
      const k = j / 12, px = cx - 180 + k * 360, py = cy - 36 + k * 72 + (j % 2 ? -12 : 10) * hash(j + 400);
      const w = 22 * Math.sin(Math.PI * k) * (0.8 + 0.2 * pulse) + 1;
      top.push([px, py - w]); bot.push([px + 3, py + w]);
    }
    ctx.beginPath();
    top.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let j = bot.length - 1; j >= 0; j--) ctx.lineTo(bot[j][0], bot[j][1]);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(220,160,255,0.45)'; ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#1f0838'; ctx.fill();
    ctx.save(); ctx.clip();
    for (let j = 0; j < 14; j++) A.star(ctx, cx - 160 + hash(j + 410) * 320, cy - 30 + hash(j + 420) * 60 + (hash(j + 410) - 0.5) * 60, 2 + Math.abs(Math.sin(t * 3 + j)) * 2.5, j % 3 ? '#f3d9ff' : '#9fe8ff');
    ctx.restore();
    ctx.strokeStyle = '#f2dcff'; ctx.lineWidth = 2.5; ctx.stroke();
    // little forks of light off the edges
    ctx.strokeStyle = 'rgba(240,215,255,' + (0.5 + 0.4 * pulse).toFixed(3) + ')'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [j, d] of [[3, -1], [6, 1], [9, -1]]) {
      const [x, y] = d < 0 ? top[j] : bot[j];
      ctx.moveTo(x, y); ctx.lineTo(x + 10, y + d * 14); ctx.lineTo(x + 4, y + d * 22); ctx.lineTo(x + 14, y + d * 34);
    }
    ctx.stroke();
  }
  function farVolcano(ctx, x, base, w, h, t, i) {
    ctx.fillStyle = '#8b5868';
    ctx.beginPath(); ctx.moveTo(x - w / 2, base); ctx.lineTo(x - 24, base - h); ctx.lineTo(x + 24, base - h); ctx.lineTo(x + w / 2, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a4a5c';
    ctx.beginPath(); ctx.moveTo(x + 4, base - h); ctx.lineTo(x + 24, base - h); ctx.lineTo(x + w / 2, base); ctx.lineTo(x + w * 0.12, base); ctx.closePath(); ctx.fill();
    const glow = 0.6 + 0.4 * Math.sin(t * 3 + i);
    ctx.strokeStyle = 'rgba(255,140,60,' + (0.5 + 0.3 * glow).toFixed(3) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 8, base - h + 2); ctx.quadraticCurveTo(x - 20, base - h * 0.6, x - 34, base - h * 0.3); ctx.moveTo(x + 10, base - h + 2); ctx.quadraticCurveTo(x + 16, base - h * 0.7, x + 30, base - h * 0.45); ctx.stroke();
    A.oval(ctx, x, base - h, 24, 5, 0, 'rgba(255,170,80,' + (0.7 + 0.3 * glow).toFixed(3) + ')');
    smoke(ctx, x, base - h - 6, t + i * 2, 6, 16, '120,95,110', 0.55, 120);
  }
  // tree fern: a trunk and a crown of arching fronds with drooping leaflets (soft, no outline)
  function fernSil(ctx, x, base, h, s, trunk, leaf, t, i, far) {
    const tx = x + Math.sin(i * 1.7) * 10 * s, ty = base - h;
    ctx.lineCap = 'round';
    ctx.strokeStyle = trunk; ctx.lineWidth = 10 * s;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - 6 * s, base - h * 0.5, tx, ty); ctx.stroke();
    ctx.lineWidth = 15 * s;
    ctx.beginPath(); ctx.moveTo(tx, ty + 4 * s); ctx.lineTo(tx, ty + 16 * s); ctx.stroke();
    const fr = [];
    for (let j = 0; j < 9; j++) {
      const a = -Math.PI / 2 + (j - 4) * 0.4, L = (62 + hash(i + j) * 22) * s, sw = Math.sin(t * 0.8 + i + j) * 2 * s;
      fr.push([tx + Math.cos(a) * L * 0.7, ty + Math.sin(a) * L * 0.8, tx + Math.cos(a) * L * 1.3 + sw, ty + Math.sin(a) * L * 0.3 + L * 0.5]);
    }
    ctx.strokeStyle = leaf; ctx.lineWidth = (far ? 7 : 3.2) * s;
    ctx.beginPath();
    for (const [cx, cy, ex, ey] of fr) { ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx, cy, ex, ey); }
    ctx.stroke();
    if (far) return;
    ctx.lineWidth = 2.6 * s; ctx.lineCap = 'butt';
    ctx.beginPath();
    for (const [cx, cy, ex, ey] of fr) {
      for (let k = 0.2; k < 0.95; k += 0.15) {
        const m = 1 - k, px = m * m * tx + 2 * m * k * cx + k * k * ex, py = m * m * ty + 2 * m * k * cy + k * k * ey;
        const ll = ((1 - k) * 11 + 3) * s;
        ctx.moveTo(px - 3 * s, py + ll); ctx.lineTo(px, py); ctx.lineTo(px + 3 * s, py + ll);
      }
    }
    ctx.stroke();
  }
  // cycad: a stout scaly trunk and a crown of stiff, straight fronds
  function cycad(ctx, x, base, s, leaf, trunk, t, i) {
    ctx.fillStyle = trunk;
    ctx.beginPath(); ctx.moveTo(x - 10 * s, base); ctx.lineTo(x - 8 * s, base - 46 * s); ctx.lineTo(x + 8 * s, base - 46 * s); ctx.lineTo(x + 10 * s, base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,25,15,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = base - 6 * s; y > base - 44 * s; y -= 7 * s) { ctx.moveTo(x - 9 * s, y); ctx.lineTo(x, y - 4 * s); ctx.lineTo(x + 9 * s, y); }
    ctx.stroke();
    const fr = [], top = base - 46 * s;
    for (let j = 0; j < 9; j++) {
      const a = -Math.PI + 0.25 + j * ((Math.PI - 0.5) / 8), L = (44 + hash(i + j * 3) * 12) * s;
      fr.push([a, x + Math.cos(a) * L + Math.sin(t + i + j) * 1.2, top + Math.sin(a) * L * 0.8 + Math.abs(Math.cos(a)) * 10 * s]);
    }
    ctx.strokeStyle = leaf; ctx.lineCap = 'round';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    for (const [, ex, ey] of fr) { ctx.moveTo(x, top); ctx.lineTo(ex, ey); }
    ctx.stroke();
    ctx.lineWidth = 2 * s; ctx.lineCap = 'butt';
    ctx.beginPath();
    for (const [a, ex, ey] of fr) {
      for (let k = 0.25; k < 1; k += 0.18) {
        const px = lerp(x, ex, k), py = lerp(top, ey, k);
        ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a - 1) * 8 * s, py + Math.sin(a - 1) * 8 * s);
        ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 1) * 8 * s, py + Math.sin(a + 1) * 8 * s);
      }
    }
    ctx.stroke();
  }
  BG.rift = function (ctx, camX, t, gy, sunset) {
    skyFill(ctx, gy, sunset ? '#28153e' : '#4b2f6e', sunset ? '#b84a5a' : '#d27c6c', sunset ? '#ff9a5a' : '#ffcf8f');
    ctx.fillStyle = 'rgba(255,200,130,0.35)'; ctx.beginPath(); ctx.arc(250, gy - 200, 84, 0, TAU); ctx.fill();
    ctx.fillStyle = sunset ? '#ffb36a' : '#ffdca0'; ctx.beginPath(); ctx.arc(250, gy - 200, 54, 0, TAU); ctx.fill();
    each(camX, 0.02, 1400, 500, (sx) => skyTear(ctx, sx + 640, 108, t));
    // far volcanoes, dusty hills and haze
    each(camX, 0.04, 820, 300, (sx, i) => farVolcano(ctx, sx + 200 + hash(i + 1) * 300, gy - 110, 260 + hash(i + 2) * 120, 110 + hash(i + 3) * 60, t, i));
    ridge(ctx, camX, 0.08, gy - 104, gy, '#b46f68', riftHill);
    A.band(ctx, 0, gy - 200, W, 140, [0, gy - 200, 0, gy - 60], [[0, 'rgba(255,190,140,0)'], [1, 'rgba(255,190,140,0.55)']]);
    // misty tree-fern forest
    ridge(ctx, camX, 0.18, gy - 66, gy, '#9a7c62', (x) => 8 + Math.sin(x * 0.02) * 5);
    each(camX, 0.18, 120, 120, (sx, i) => {
      if (hash(i + 11) < 0.3) return;
      fernSil(ctx, sx + hash(i + 12) * 40, gy - 60, 100 + hash(i + 13) * 70, 0.8, '#94776a', '#8c9364', t, i, true);
    });
    // near cycads and tree ferns
    each(camX, 0.35, 190, 160, (sx, i) => {
      const r = hash(i + 21);
      if (r < 0.2) return;
      if (r < 0.55) cycad(ctx, sx + hash(i + 22) * 60, gy - 18, 1 + hash(i + 23) * 0.4, '#3f7a3e', '#6a4a30', t, i);
      else fernSil(ctx, sx + hash(i + 22) * 60, gy - 14, 170 + hash(i + 23) * 90, 1.25, '#5a3e2c', '#3f7a3a', t, i + 30);
    });
    // ferny undergrowth
    ctx.fillStyle = '#4f7a36';
    ctx.beginPath();
    each(camX, 0.6, 70, 80, (sx, i) => {
      const bx = sx + hash(i + 31) * 30, hgt = 20 + hash(i + 32) * 28;
      for (let j = -2; j <= 2; j++) { const a = -Math.PI / 2 + j * 0.5; ell(ctx, bx + Math.cos(a) * hgt * 0.5, gy - 2 + Math.sin(a) * hgt * 0.5, hgt * 0.5, 5, a); }
    });
    ctx.fill();
    // dark volcanic soil with black rocks and glowing cracks
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#7a4a32'], [1, '#3a2018']]);
    ctx.strokeStyle = 'rgba(255,130,50,' + (0.35 + 0.2 * Math.sin(t * 2)).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    each(camX, 1, 210, 60, (sx, i) => {
      if (hash(i + 41) < 0.5) return;
      const cx = sx + hash(i + 42) * 80, cy = gy + 20 + hash(i + 43) * 30;
      ctx.moveTo(cx, cy); ctx.lineTo(cx + 12, cy + 4); ctx.lineTo(cx + 20, cy + 1); ctx.lineTo(cx + 32, cy + 6);
    });
    ctx.stroke();
    ctx.fillStyle = '#3a2a26';
    ctx.beginPath();
    each(camX, 1, 53, 20, (sx, i) => { if (hash(i + 44) < 0.5) ell(ctx, sx + hash(i + 45) * 30, gy + 10 + hash(i + 46) * 50, 4 + hash(i + 47) * 5, 2.6, 0); });
    ctx.fill();
    ctx.fillStyle = '#6a8a3a';
    ctx.fillRect(0, gy, W, 4);
    if (sunset) dusk(ctx, 0.1);
  };

  // ---- Grin Isle: a sunny holiday island with a HUGE smiling sun (its eyes follow you...), a
  // turquoise sea, a striped lighthouse far off, souvenir shops and bunting, a white beach and a boardwalk
  function smileSun(ctx, x, y, r, t, camX, sunset) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.1);
    ctx.fillStyle = sunset ? 'rgba(255,170,90,0.55)' : 'rgba(255,224,90,0.6)';
    ctx.beginPath();
    for (let j = 0; j < 14; j++) {
      const a = (j / 14) * TAU;
      ctx.moveTo(Math.cos(a - 0.1) * r * 1.12, Math.sin(a - 0.1) * r * 1.12);
      ctx.lineTo(Math.cos(a) * r * (1.55 + 0.08 * Math.sin(t * 3 + j)), Math.sin(a) * r * (1.55 + 0.08 * Math.sin(t * 3 + j)));
      ctx.lineTo(Math.cos(a + 0.1) * r * 1.12, Math.sin(a + 0.1) * r * 1.12);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
    A.oval(ctx, x, y, r, r, 0, sunset ? '#ffc35a' : '#ffe14d', '#e09a12', 3);
    A.oval(ctx, x - r * 0.55, y + r * 0.2, r * 0.17, r * 0.1, 0, 'rgba(255,120,120,0.55)');
    A.oval(ctx, x + r * 0.55, y + r * 0.2, r * 0.17, r * 0.1, 0, 'rgba(255,120,120,0.55)');
    // eyes that slide over to watch the players
    const lx = -0.32 - 0.12 * Math.sin(camX * 0.002), ly = 0.12;
    for (const ex of [-0.32, 0.32]) {
      A.oval(ctx, x + ex * r, y - r * 0.22, r * 0.17, r * 0.2, 0, '#ffffff', '#5a3a12', 2);
      A.oval(ctx, x + (ex + lx * 0.3) * r, y + (-0.22 + ly * 0.4) * r, r * 0.08, r * 0.1, 0, '#2b1a14');
    }
    // a big toothy grin, just a little too wide
    ctx.fillStyle = '#9a2c2c'; ctx.strokeStyle = '#5a3a12'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - r * 0.68, y + r * 0.08); ctx.quadraticCurveTo(x, y + r * 0.95, x + r * 0.68, y + r * 0.08); ctx.quadraticCurveTo(x, y + r * 0.34, x - r * 0.68, y + r * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * 0.13); ctx.quadraticCurveTo(x, y + r * 0.42, x + r * 0.6, y + r * 0.13); ctx.quadraticCurveTo(x, y + r * 0.56, x - r * 0.6, y + r * 0.13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,58,18,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let j = -3; j <= 3; j++) { const tx = x + j * r * 0.15; ctx.moveTo(tx, y + r * (0.2 + 0.2 * (1 - Math.abs(j) / 4))); ctx.lineTo(tx, y + r * (0.32 + 0.18 * (1 - Math.abs(j) / 4))); } ctx.stroke();
  }
  function farLighthouse(ctx, x, y, t) {
    ctx.fillStyle = '#8a8478';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 36, 10, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x - 4, y - 44); ctx.lineTo(x + 4, y - 44); ctx.lineTo(x + 6, y - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e63946'; ctx.fillRect(x - 5.4, y - 16, 10.8, 6); ctx.fillRect(x - 4.7, y - 32, 9.4, 6);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 4, y - 50, 8, 6);
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(x - 5, y - 50); ctx.lineTo(x, y - 56); ctx.lineTo(x + 5, y - 50); ctx.closePath(); ctx.fill();
    const a = t * 1.3, L = 90;
    ctx.fillStyle = 'rgba(255,245,170,' + (0.25 + 0.2 * Math.max(0, Math.sin(a))).toFixed(3) + ')';
    ctx.beginPath(); ctx.moveTo(x, y - 47); ctx.lineTo(x + Math.cos(a) * L, y - 47 - 8); ctx.lineTo(x + Math.cos(a) * L, y - 47 + 8); ctx.closePath(); ctx.fill();
  }
  const SHOP_COLS = ['#ffb3c6', '#a0e7e5', '#ffd6a5', '#cdb4db', '#b9fbc0', '#fff1a8'];
  const AWNING = ['#e63946', '#3a86ff', '#ff8fab', '#2ec4b6', '#ff9f1c'];
  function tinyShop(ctx, x, base, w, h, i) {
    ctx.fillStyle = SHOP_COLS[i % SHOP_COLS.length]; ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 4, base - h - 9, w - 8, 9);
    A.oval(ctx, x + w / 2, base - h - 4.5, 3.5, 3.5, 0, '#ffd23f');
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x + w / 2 - 3, base - h - 6, 1.5, 1.5); ctx.fillRect(x + w / 2 + 1.5, base - h - 6, 1.5, 1.5);
    const col = AWNING[i % AWNING.length];
    for (let j = 0; j < w / 6; j++) { ctx.fillStyle = j % 2 ? '#ffffff' : col; ctx.fillRect(x - 2 + j * 6, base - h + 6, 6, 8); }
    ctx.fillStyle = '#3d5a80'; ctx.fillRect(x + 5, base - h + 18, w * 0.4, h - 22);
    ctx.fillStyle = '#7a5a4a'; ctx.fillRect(x + w - 15, base - 16, 9, 16);
  }
  function palm(ctx, x, base, h, s, t, i, soft) {
    const lean = (hash(i + 3) - 0.5) * 40 * s, tx = x + lean, ty = base - h;
    ctx.lineCap = 'round';
    ctx.strokeStyle = soft ? '#b08a5a' : '#9a6a3a'; ctx.lineWidth = 9 * s;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * 0.1, base - h * 0.5, tx, ty); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,50,20,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let k = 0.1; k < 0.95; k += 0.09) { const px = lerp(x, tx, k * k), py = lerp(base, ty, k); ctx.moveTo(px - 4 * s, py); ctx.lineTo(px + 4 * s, py - 2); } ctx.stroke();
    ctx.fillStyle = soft ? '#5fb070' : '#3f9a4a';
    for (let j = 0; j < 7; j++) {
      const a = -Math.PI / 2 + (j - 3) * 0.55 + Math.sin(t * 1.3 + i + j) * 0.04, L = (52 + hash(i + j) * 14) * s;
      const ex = tx + Math.cos(a) * L * 1.2, ey = ty + Math.sin(a) * L * 0.4 + L * 0.45;
      A.taper(ctx, tx, ty, tx + Math.cos(a) * L * 0.7, ty + Math.sin(a) * L * 0.8, ex, ey, 11 * s, 2 * s);
      ctx.fill();
    }
    A.oval(ctx, tx - 4 * s, ty + 6 * s, 5 * s, 5 * s, 0, '#7a5a2a'); A.oval(ctx, tx + 4 * s, ty + 7 * s, 5 * s, 5 * s, 0, '#7a5a2a');
  }
  function umbrella(ctx, x, base, col, s) {
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x - 4 * s, base - 50 * s); ctx.stroke();
    ctx.save(); ctx.translate(x - 4 * s, base - 50 * s); ctx.rotate(-0.12);
    ctx.beginPath(); ctx.moveTo(-34 * s, 4 * s); ctx.quadraticCurveTo(0, -30 * s, 34 * s, 4 * s); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = col;
    for (let j = -3; j <= 3; j += 2) { ctx.beginPath(); ctx.moveTo(0, -24 * s); ctx.lineTo((j * 10 - 5) * s, 6 * s); ctx.lineTo((j * 10 + 5) * s, 6 * s); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }
  BG.grinisle = function (ctx, camX, t, gy, sunset) {
    const hz = gy - 200;
    skyFill(ctx, hz + 2, sunset ? '#4a2a6a' : '#2fb0ff', sunset ? '#ff8a7a' : '#8ee4ff', sunset ? '#ffd59a' : '#fff6cc');
    smileSun(ctx, 780, 108, 62, t, camX, sunset);
    clouds(ctx, camX, t, 3, 50, 40, 0.04, 7, sunset ? 'rgba(255,200,190,0.9)' : 'rgba(255,255,255,0.95)', 0.9);
    // the sea
    A.band(ctx, 0, hz, W, gy - 60 - hz, [0, hz, 0, gy - 60],
      [[0, sunset ? '#2a6a9a' : '#139fd0'], [0.5, sunset ? '#4a9ab0' : '#22c4d6'], [1, sunset ? '#8ac8c0' : '#7ff0e0']]);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(0, hz, W, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    each(camX, 0.12, 46, 30, (sx, i) => {
      const wy = hz + 10 + hash(i + 131) * 80, wx = sx + hash(i + 132) * 30 + Math.sin(t * 1.5 + i) * 4;
      ctx.moveTo(wx - 7, wy); ctx.quadraticCurveTo(wx, wy - 3, wx + 7, wy);
    });
    ctx.stroke();
    each(camX, 0.03, 1500, 120, (sx) => farLighthouse(ctx, sx + 260, hz + 6, t));
    each(camX, 0.06, 900, 60, (sx, i) => sailboat(ctx, sx + 620 + Math.sin(t * 0.25 + i) * 30, hz + 26 + Math.sin(t * 1.4 + i), i & 1 ? '#ff8fab' : '#ffd23f'));
    // the promenade: a sandy spit with souvenir shops, palms and bunting
    ctx.fillStyle = '#f6e7bf'; ctx.fillRect(0, gy - 112, W, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, gy - 113, W, 2);
    each(camX, 0.15, 620, 200, (sx, i) => {
      const shops = 3 + Math.floor(hash(i + 141) * 2), sw = 46;
      for (let j = 0; j < shops; j++) tinyShop(ctx, sx + j * (sw + 8), gy - 104, sw, 40 + hash(i * 5 + j) * 14, i * 3 + j);
      ctx.strokeStyle = 'rgba(60,40,40,0.6)'; ctx.lineWidth = 1;
      const bx0 = sx - 4, bx1 = sx + shops * (sw + 8) - 4, by = gy - 160;
      ctx.beginPath(); ctx.moveTo(bx0, by); ctx.quadraticCurveTo((bx0 + bx1) / 2, by + 16, bx1, by); ctx.stroke();
      for (let k = 1; k < 14; k++) {
        const q = k / 14, m = 1 - q, fx = m * m * bx0 + 2 * m * q * (bx0 + bx1) / 2 + q * q * bx1, fy = m * m * by + 2 * m * q * (by + 16) + q * q * by;
        ctx.fillStyle = AWNING[k % AWNING.length];
        ctx.beginPath(); ctx.moveTo(fx - 3.5, fy); ctx.lineTo(fx + 3.5, fy); ctx.lineTo(fx, fy + 8 + Math.sin(t * 4 + k) * 1); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx0 - 1, by, 2, 56); ctx.fillRect(bx1 - 1, by, 2, 56);
      palm(ctx, sx + shops * (sw + 8) + 60, gy - 102, 96, 0.6, t, i, true);
      palm(ctx, sx + 440 + hash(i + 142) * 80, gy - 102, 84, 0.55, t, i + 9, true);
    });
    // the white beach with umbrellas, towels and palms
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath(); ctx.moveTo(0, gy);
    for (let sx = 0; sx <= W + 15; sx += 15) ctx.lineTo(sx, gy - 78 + Math.sin((sx + camX * 0.3) * 0.01) * 6);
    ctx.lineTo(W + 15, gy); ctx.closePath(); ctx.fill();
    foamLine(ctx, -mod(camX * 0.3, 32) - 16, W + 32, gy - 82 + 3, t, 0, 0.75);
    each(camX, 0.3, 230, 120, (sx, i) => {
      if (hash(i + 151) < 0.12) return;
      if (hash(i + 153) < 0.3) {
        // a sandcastle with a little flag
        const cx = sx + hash(i + 152) * 80 + 40, cy = gy - 26;
        ctx.fillStyle = '#e8c98a';
        ctx.fillRect(cx - 16, cy - 12, 32, 12); ctx.fillRect(cx - 9, cy - 22, 18, 10);
        for (const dx of [-16, -8, 0, 8]) ctx.fillRect(cx + dx + 1, cy - 15, 5, 3);
        ctx.fillStyle = '#c9a868'; ctx.fillRect(cx - 2, cy - 8, 4, 8);
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy - 22); ctx.lineTo(cx, cy - 34); ctx.stroke();
        ctx.fillStyle = '#ff6fa0'; ctx.beginPath(); ctx.moveTo(cx, cy - 34); ctx.lineTo(cx + 9, cy - 31); ctx.lineTo(cx, cy - 28); ctx.closePath(); ctx.fill();
        A.oval(ctx, cx + 34, cy + 4, 7, 7, 0, '#ffffff'); A.oval(ctx, cx + 32, cy + 2, 4, 7, 0.4, '#3a86ff'); A.oval(ctx, cx + 37, cy + 6, 3, 6, 0.4, '#e63946');
        return;
      }
      const ux = sx + hash(i + 152) * 80;
      ctx.fillStyle = AWNING[(i + 2) % AWNING.length];
      ctx.save(); ctx.translate(ux + 24, gy - 30); ctx.rotate(-0.05); ctx.fillRect(-20, -5, 40, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-20, -1, 40, 2); ctx.restore();
      umbrella(ctx, ux, gy - 24, AWNING[i % AWNING.length], 1);
    });
    each(camX, 0.35, 330, 160, (sx, i) => { if (hash(i + 161) > 0.3) palm(ctx, sx + hash(i + 162) * 120, gy - 36, 150 + hash(i + 163) * 50, 1, t, i + 20, false); });
    // the boardwalk on the sand
    const bw = gy + 24;
    ctx.fillStyle = '#d29a5c'; ctx.fillRect(0, gy, W, bw - gy);
    ctx.strokeStyle = 'rgba(110,60,25,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); each(camX, 1, 15, 10, (sx) => { ctx.moveTo(sx, gy); ctx.lineTo(sx - 3, bw); }); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,210,0.3)'; ctx.fillRect(0, gy + 2, W, 3);
    A.band(ctx, 0, bw, W, H - bw, [0, bw, 0, H], [[0, '#f7e3b5'], [1, '#e2c58a']]);
    ctx.fillStyle = '#a8703c'; ctx.fillRect(0, bw, W, 6);
    ctx.fillStyle = '#8a5a2e';
    each(camX, 1, 120, 20, (sx) => ctx.fillRect(sx, bw + 6, 8, 14));
    ctx.fillStyle = 'rgba(160,120,60,0.35)';
    ctx.beginPath(); each(camX, 1, 43, 20, (sx, i) => { if (hash(i + 171) < 0.5) ell(ctx, sx + hash(i + 172) * 30, bw + 22 + hash(i + 173) * 18, 3, 1.4, 0); }); ctx.fill();
    ctx.fillStyle = '#ffd9c9';
    ctx.beginPath(); each(camX, 1, 97, 20, (sx, i) => { if (hash(i + 174) < 0.5) { const cx = sx + hash(i + 175) * 40, cy = bw + 26 + hash(i + 176) * 14; ctx.moveTo(cx, cy); ctx.arc(cx, cy, 4, Math.PI, TAU); ctx.closePath(); } }); ctx.fill();
    ctx.fillStyle = '#efc184'; ctx.fillRect(0, gy, W, 3);
    if (sunset) dusk(ctx, 0.1);
  };

  // ---- the lair under Grin Isle: a cave with faint scale patterns in the rock, glowing green
  // crystals, wall torches, stalactites and a rocky floor. Spooky, but not too dark to play in.
  const lairRoof = (x) => 34 + Math.sin(x * 0.009) * 14 + Math.abs(Math.sin(x * 0.023)) * 16;
  // overlapping scales carved faintly into the rock, fading out towards the edge of the patch
  function scalePatch(ctx, cx, cy, rx, ry, s) {
    if (cx + rx < 0 || cx - rx > W) return;
    ctx.lineWidth = 2;
    const a0 = 0.12 * Math.PI, ca = Math.cos(a0) * s, sa = Math.sin(a0) * s;
    for (const [k0, k1, a] of [[0.7, 1, 0.035], [0.42, 0.7, 0.07], [0, 0.42, 0.11]]) {
      ctx.strokeStyle = 'rgba(150,215,185,' + a + ')';
      ctx.beginPath();
      for (let r = 0, y = cy - ry; y < cy + ry; r++, y += s * 0.7) {
        for (let x = cx - rx - (r % 2 ? s : 0); x < cx + rx; x += s * 2) {
          const q = Math.hypot((x - cx) / rx, (y - cy) / ry);
          if (q < k0 || q >= k1) continue;
          ctx.moveTo(x + ca, y + sa); ctx.arc(x, y, s, a0, Math.PI - a0);
        }
      }
      ctx.stroke();
    }
  }
  function glowSpot(ctx, x, y, r, rgb, a) {
    if (!(a > 0.005)) return;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // a small cluster of glowing crystals (also used by platforms and decor)
  function crystals(ctx, x, y, s, t, seed, outline) {
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.4 + seed);
    glowSpot(ctx, x, y - 14 * s, 46 * s, '90,255,170', 0.35 * pulse);
    const shards = [[-12, 0.7, -0.35], [-4, 1.15, -0.1], [6, 0.9, 0.2], [13, 0.55, 0.45], [0, 0.5, 0.05]];
    for (const [dx, k, a] of shards) {
      const hgt = 34 * s * k * (0.85 + hash(seed + dx) * 0.3), wd = 6.5 * s;
      ctx.save(); ctx.translate(x + dx * s, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-wd, 0); ctx.lineTo(-wd, -hgt * 0.75); ctx.lineTo(0, -hgt); ctx.lineTo(wd, -hgt * 0.75); ctx.lineTo(wd, 0); ctx.closePath();
      ctx.fillStyle = '#3ee6a0'; ctx.fill();
      if (outline) { ctx.strokeStyle = '#0d3a2a'; ctx.lineWidth = 1.6; ctx.stroke(); }
      ctx.fillStyle = '#20a874';
      ctx.beginPath(); ctx.moveTo(wd * 0.1, 0); ctx.lineTo(wd * 0.1, -hgt * 0.78); ctx.lineTo(0, -hgt); ctx.lineTo(wd, -hgt * 0.75); ctx.lineTo(wd, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(230,255,240,' + (0.6 * pulse).toFixed(3) + ')';
      ctx.fillRect(-wd * 0.6, -hgt * 0.7, wd * 0.35, hgt * 0.55);
      ctx.restore();
    }
  }
  function torch(ctx, x, y, t, i) {
    const fl = Math.sin(t * 13 + i * 2) * 0.12 + Math.sin(t * 7.3 + i) * 0.08;
    glowSpot(ctx, x, y - 14, 92, '255,170,80', 0.3 + fl * 0.4);
    ctx.fillStyle = '#3a3030'; ctx.fillRect(x - 7, y - 2, 14, 4); ctx.fillRect(x - 2, y - 2, 4, 14);
    ctx.fillStyle = '#6a4a30';
    ctx.beginPath(); ctx.moveTo(x - 4, y - 14); ctx.lineTo(x + 4, y - 14); ctx.lineTo(x + 2, y + 6); ctx.lineTo(x - 2, y + 6); ctx.closePath(); ctx.fill();
    const fh = 20 * (1 + fl);
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath(); ctx.moveTo(x - 7, y - 14); ctx.quadraticCurveTo(x - 8, y - 14 - fh * 0.6, x + Math.sin(t * 9 + i) * 2, y - 14 - fh); ctx.quadraticCurveTo(x + 8, y - 14 - fh * 0.6, x + 7, y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.moveTo(x - 3.5, y - 14); ctx.quadraticCurveTo(x - 4, y - 14 - fh * 0.4, x, y - 14 - fh * 0.62); ctx.quadraticCurveTo(x + 4, y - 14 - fh * 0.4, x + 3.5, y - 14); ctx.closePath(); ctx.fill();
  }
  BG.lair = function (ctx, camX, t, gy) {
    A.band(ctx, 0, 0, W, gy, [0, 0, 0, gy], [[0, '#151b26'], [0.55, '#26324a'], [1, '#1d2636']]);
    // the far wall: big lumpy rock shapes with faint scale patterns and a green glow here and there
    ctx.fillStyle = '#212b3e';
    ctx.beginPath();
    each(camX, 0.06, 150, 120, (sx, i) => { circ(ctx, sx + hash(i + 1) * 40, gy - 120 - hash(i + 2) * 120, 70 + hash(i + 3) * 50); });
    ctx.fill();
    each(camX, 0.06, 760, 300, (sx, i) => {
      if (sx + 380 > -170 && sx + 380 < W + 170) glowSpot(ctx, sx + 380, gy - 180, 170, '60,220,150', 0.12 + 0.05 * Math.sin(t * 1.5 + i));
      scalePatch(ctx, sx + 200 + hash(i + 4) * 200, gy - 210 + hash(i + 5) * 60, 170, 80, 15);
    });
    // stone pillars where stalactites have grown down to the floor
    each(camX, 0.15, 420, 80, (sx, i) => {
      if (hash(i + 11) < 0.35) return;
      const px = sx + hash(i + 12) * 120, w1 = 26 + hash(i + 13) * 18;
      ctx.fillStyle = '#2a3548';
      ctx.beginPath(); ctx.moveTo(px - w1 * 1.6, 0); ctx.quadraticCurveTo(px - w1 * 0.4, gy * 0.45, px - w1, gy); ctx.lineTo(px + w1, gy); ctx.quadraticCurveTo(px + w1 * 0.4, gy * 0.45, px + w1 * 1.6, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(120,160,190,0.12)';
      ctx.beginPath(); ctx.moveTo(px - w1 * 1.2, 0); ctx.quadraticCurveTo(px - w1 * 0.3, gy * 0.45, px - w1 * 0.7, gy); ctx.lineTo(px - w1 * 0.45, gy); ctx.quadraticCurveTo(px - w1 * 0.05, gy * 0.45, px - w1 * 0.8, 0); ctx.closePath(); ctx.fill();
    });
    each(camX, 0.15, 330, 80, (sx, i) => { if (hash(i + 14) > 0.35) crystals(ctx, sx + hash(i + 15) * 100, gy - 60 - hash(i + 16) * 150, 0.75 + hash(i + 17) * 0.3, t, i, false); });
    // wall torches, the ceiling and its stalactites
    each(camX, 0.3, 380, 140, (sx, i) => { if (hash(i + 21) > 0.25) torch(ctx, sx + hash(i + 22) * 120, gy - 170 - hash(i + 23) * 40, t, i); });
    ceiling(ctx, camX, 0.35, '#141a26', lairRoof);
    const off35 = camX * 0.35;
    ctx.fillStyle = '#1c2434';
    ctx.beginPath();
    each(camX, 0.35, 46, 60, (sx, i) => {
      if (hash(i + 31) < 0.3) return;
      const x = sx + hash(i + 32) * 20, top = lairRoof(x + off35) - 6, len = 26 + hash(i + 33) * 90, w2 = 9 + hash(i + 34) * 9;
      ctx.moveTo(x - w2, top); ctx.quadraticCurveTo(x - w2 * 0.4, top + len * 0.6, x, top + len); ctx.quadraticCurveTo(x + w2 * 0.4, top + len * 0.6, x + w2, top); ctx.closePath();
    });
    ctx.fill();
    ctx.fillStyle = 'rgba(140,180,210,0.14)';
    ctx.beginPath();
    each(camX, 0.35, 46, 60, (sx, i) => {
      if (hash(i + 31) < 0.3) return;
      const x = sx + hash(i + 32) * 20, top = lairRoof(x + off35) - 6, len = 26 + hash(i + 33) * 90, w2 = 9 + hash(i + 34) * 9;
      ctx.moveTo(x - w2 * 0.6, top); ctx.quadraticCurveTo(x - w2 * 0.3, top + len * 0.5, x - 1, top + len * 0.9); ctx.lineTo(x - w2 * 0.1, top); ctx.closePath();
    });
    ctx.fill();
    // rubble along the foot of the walls
    ctx.fillStyle = '#2c3446';
    ctx.beginPath();
    each(camX, 0.6, 60, 60, (sx, i) => { const r = 10 + hash(i + 41) * 18; ell(ctx, sx + hash(i + 42) * 30, gy - r * 0.3, r, r * 0.6, 0); });
    ctx.fill();
    // the rocky floor
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#4a4e5e'], [1, '#23252f']]);
    ctx.fillStyle = '#5c6072';
    ctx.beginPath();
    each(camX, 1, 58, 30, (sx, i) => { if (hash(i + 51) < 0.6) ell(ctx, sx + hash(i + 52) * 30, gy + 10 + hash(i + 53) * 50, 7 + hash(i + 54) * 8, 3 + hash(i + 55) * 2, 0); });
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,15,22,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 1, 140, 60, (sx, i) => { const cx = sx + hash(i + 56) * 60, cy = gy + 16 + hash(i + 57) * 34; ctx.moveTo(cx, cy); ctx.lineTo(cx + 14, cy + 3); ctx.lineTo(cx + 22, cy - 1); ctx.lineTo(cx + 36, cy + 4); });
    ctx.stroke();
    ctx.fillStyle = 'rgba(90,255,170,' + (0.45 + 0.3 * Math.sin(t * 3)).toFixed(3) + ')';
    ctx.beginPath(); each(camX, 1, 77, 20, (sx, i) => { if (hash(i + 58) < 0.4) circ(ctx, sx + hash(i + 59) * 40, gy + 8 + hash(i + 60) * 54, 1.6); }); ctx.fill();
    ctx.fillStyle = '#6a7084'; ctx.fillRect(0, gy, W, 3);
    // darker edges
    for (const [x0, x1] of [[0, 150], [W, W - 150]]) {
      A.band(ctx, Math.min(x0, x1), 0, 150, H, [x0, 0, x1, 0], [[0, 'rgba(5,8,14,0.4)'], [1, 'rgba(5,8,14,0)']]);
    }
  };

  // ---- a generic green island (the bonus Isle of Man map): rolling green hills with dry-stone
  // walls, white cottages and sheep, a grey-blue sky and the sea at the horizon. No landmarks or symbols.
  const iomFar = (x) => 40 + Math.sin(x * 0.0045) * 26 + Math.sin(x * 0.012 + 1) * 10;
  const iomMid = (x) => 46 + Math.sin(x * 0.006 + 2) * 30 + Math.sin(x * 0.017) * 8;
  const iomNear = (x) => 22 + Math.sin(x * 0.009 + 4) * 14 + Math.sin(x * 0.023) * 5;
  function tinyCottage(ctx, x, y, s) {
    ctx.fillStyle = '#f4f2ea'; ctx.fillRect(x - 10 * s, y - 8 * s, 20 * s, 8 * s);
    ctx.fillStyle = '#56606e'; ctx.fillRect(x - 11 * s, y - 12 * s, 22 * s, 5 * s);
    ctx.fillRect(x - 10 * s, y - 15 * s, 2.5 * s, 4 * s); ctx.fillRect(x + 7.5 * s, y - 15 * s, 2.5 * s, 4 * s);
  }
  // a hill with field walls running down it, cottages and sheep dotted about (soft colours)
  function fieldHill(ctx, camX, f, baseY, h, green, green2, wallCol, seed, s) {
    const off = camX * f;
    ridge(ctx, camX, f, baseY, baseY + 200, green, h);
    // patchwork: every other field a shade lighter, divided by walls running down the slope
    const gap = 150 * s;
    each(camX, f, gap, gap, (sx, i) => {
      const lean = (hash(i + seed) - 0.5) * 50 * s, x0 = sx, x1 = sx + gap;
      if (hash(i + seed + 1) < 0.5) {
        ctx.fillStyle = green2;
        ctx.beginPath(); ctx.moveTo(x0, baseY - h(x0 + off) + 2);
        for (let x = x0 + 15; x <= x1; x += 15) ctx.lineTo(x, baseY - h(x + off) + 2);
        ctx.lineTo(x1 + lean, baseY + 200); ctx.lineTo(x0 + lean, baseY + 200); ctx.closePath(); ctx.fill();
      }
    });
    ctx.strokeStyle = wallCol; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
    ctx.beginPath();
    each(camX, f, gap, gap, (sx, i) => { const lean = (hash(i + seed) - 0.5) * 50 * s; ctx.moveTo(sx, baseY - h(sx + off) + 2); ctx.lineTo(sx + lean, baseY + 200); });
    // and a wall following the hillside
    ctx.moveTo(-10, baseY - h(off - 10) + 26 * s);
    for (let x = 5; x <= W + 20; x += 15) ctx.lineTo(x, baseY - h(x + off) + 26 * s + Math.sin((x + off) * 0.01) * 6 * s);
    ctx.stroke();
    each(camX, f, 520 * s, 60, (sx, i) => { if (hash(i + seed + 2) < 0.6) tinyCottage(ctx, sx + 80 * s, baseY - h(sx + 80 * s + off) + 18 * s, s); });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    each(camX, f, 37 * s, 20, (sx, i) => { if (hash(i + seed + 3) < 0.3) ell(ctx, sx, baseY - h(sx + off) + (20 + hash(i + seed + 4) * 40) * s, 3 * s, 2 * s, 0); });
    ctx.fill();
  }
  BG.isleofman = function (ctx, camX, t, gy, sunset) {
    const hz = gy - 238;
    skyFill(ctx, hz + 2, sunset ? '#463c62' : '#6f93b4', sunset ? '#d99a8a' : '#a9c0d3', sunset ? '#f5d0a0' : '#dde7ee');
    if (sunset) sun(ctx, 300, hz - 30, true);
    clouds(ctx, camX, t, 4, 30, 16, 0.03, 4, sunset ? 'rgba(170,130,150,0.7)' : 'rgba(150,170,190,0.75)', 1.5);
    clouds(ctx, camX + 300, t, 4, 58, 22, 0.05, 7, sunset ? 'rgba(255,215,200,0.85)' : 'rgba(245,248,250,0.92)', 1.1);
    clouds(ctx, camX + 650, t, 5, 150, 10, 0.07, 9, sunset ? 'rgba(255,225,205,0.6)' : 'rgba(236,242,246,0.75)', 0.75);
    // the sea at the horizon, with a little fishing boat
    A.band(ctx, 0, hz, W, 90, [0, hz, 0, hz + 60], [[0, sunset ? '#5a6a8a' : '#6a8aa6'], [1, sunset ? '#8a9ab0' : '#8aa6bb']]);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, hz, W, 2);
    each(camX, 0.03, 1300, 60, (sx, i) => {
      const bx = sx + 500 + Math.sin(t * 0.2 + i) * 20, by = hz + 12 + Math.sin(t * 1.3) * 0.8;
      ctx.fillStyle = '#4a5a6a'; ctx.beginPath(); ctx.moveTo(bx - 12, by - 2); ctx.lineTo(bx + 12, by - 2); ctx.lineTo(bx + 9, by + 2); ctx.lineTo(bx - 9, by + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4f2ea'; ctx.fillRect(bx - 2, by - 8, 7, 6);
      ctx.strokeStyle = '#4a5a6a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 6, by - 2); ctx.lineTo(bx - 6, by - 14); ctx.stroke();
    });
    // rolling hills, far to near
    ridge(ctx, camX, 0.03, hz + 50, gy, '#a3bdac', (x) => Math.max(0, iomFar(x + 500) * 1.5 - 22));
    fieldHill(ctx, camX, 0.07, gy - 122, iomFar, '#8db07e', '#a0c08a', 'rgba(95,110,95,0.6)', 300, 0.6);
    fieldHill(ctx, camX, 0.14, gy - 66, iomMid, '#74a65e', '#88b86c', 'rgba(80,90,75,0.65)', 400, 1);
    // the near hillside: a long dry-stone wall with gorse bushes along it
    const offN = camX * 0.3;
    ridge(ctx, camX, 0.3, gy - 18, gy, '#64a04e', iomNear);
    const wallTop = (sx) => gy - 18 - iomNear(sx + offN) - 2;
    ctx.fillStyle = '#7f8078';
    ctx.beginPath(); ctx.moveTo(-10, wallTop(-10) + 24);
    for (let sx = -10; sx <= W + 20; sx += 10) ctx.lineTo(sx, wallTop(sx) + 4);
    for (let sx = W + 20; sx >= -10; sx -= 10) ctx.lineTo(sx, wallTop(sx) + 24);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9c9d94';
    ctx.beginPath();
    each(camX, 0.3, 14, 20, (sx, i) => { const y = wallTop(sx); ell(ctx, sx, y + 10, 5.6, 3, 0); ell(ctx, sx + 7, y + 18, 5.6, 3, 0); });
    ctx.fill();
    ctx.fillStyle = '#6a6b64';
    ctx.beginPath();
    each(camX, 0.3, 6, 20, (sx, i) => { const y = wallTop(sx); ctx.rect(sx - 2.5, y - 1.5 + (i % 3 === 1 ? 1 : 0), 6, 8); });
    ctx.fill();
    ctx.fillStyle = '#aeafa5';
    ctx.beginPath();
    each(camX, 0.3, 6, 20, (sx, i) => { const y = wallTop(sx); ctx.rect(sx - 1.5, y - 0.5 + (i % 3 === 1 ? 1 : 0), 4, 6); });
    ctx.fill();
    each(camX, 0.3, 170, 80, (sx, i) => {
      if (hash(i + 181) < 0.4) return;
      const bx = sx + hash(i + 182) * 60, by = gy - 18 - iomNear(bx + offN) + 12, r = 14 + hash(i + 183) * 8;
      ctx.fillStyle = '#3f6e38';
      ctx.beginPath(); circ(ctx, bx, by - r * 0.6, r); circ(ctx, bx - r * 0.8, by - r * 0.3, r * 0.7); circ(ctx, bx + r * 0.8, by - r * 0.35, r * 0.75); ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); for (let j = 0; j < 9; j++) circ(ctx, bx + (hash(i * 9 + j) - 0.5) * r * 2, by - r * 0.4 - hash(i * 7 + j) * r, 1.8); ctx.fill();
    });
    // grassy ground with clover and daisies
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#6db04c'], [1, '#3f7a30']]);
    ctx.strokeStyle = '#4f8a3a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    each(camX, 1, 13, 10, (sx, i) => { const y = gy + 8 + hash(i + 191) * 54; ctx.moveTo(sx, y); ctx.lineTo(sx - 2, y - 6); ctx.moveTo(sx + 3, y); ctx.lineTo(sx + 4, y - 5); });
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); each(camX, 1, 71, 20, (sx, i) => { if (hash(i + 193) < 0.45) circ(ctx, sx + hash(i + 194) * 40, gy + 10 + hash(i + 195) * 50, 2.2); }); ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); each(camX, 1, 71, 20, (sx, i) => { if (hash(i + 193) < 0.45) circ(ctx, sx + hash(i + 194) * 40, gy + 10 + hash(i + 195) * 50, 0.9); }); ctx.fill();
    ctx.fillStyle = '#8acb5e'; ctx.fillRect(0, gy, W, 4);
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
    // a golden snow-grass tussock poking out of the snow
    alps(ctx, x, y, s) {
      ctx.lineCap = 'round'; ctx.lineWidth = 2 * s;
      for (let j = -4; j <= 4; j++) {
        ctx.strokeStyle = j % 2 ? '#cbb66c' : '#a8964e';
        const L = (14 + (4 - Math.abs(j)) * 3) * s;
        ctx.beginPath(); ctx.moveTo(x + j * 1.2 * s, y); ctx.quadraticCurveTo(x + j * 3 * s, y - L * 0.8, x + j * 6.5 * s, y - L + Math.abs(j) * 2 * s); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(150,175,210,0.45)'; ctx.beginPath(); ctx.ellipse(x + 3 * s, y + 3 * s, 13 * s, 2.2 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); cap(ctx, x, y + 2 * s, 11 * s, 5 * s); ctx.fill();
    },
    // button grass: a dense olive tussock with thin stalks topped by round "buttons"
    tasmania(ctx, x, y, s) {
      ctx.lineCap = 'round'; ctx.lineWidth = 1.6 * s;
      for (let j = -5; j <= 5; j++) {
        ctx.strokeStyle = j % 2 ? '#9a914e' : '#bdb06a';
        const L = (12 + (5 - Math.abs(j)) * 2.4) * s;
        ctx.beginPath(); ctx.moveTo(x + j * 0.9 * s, y); ctx.quadraticCurveTo(x + j * 2.5 * s, y - L * 0.7, x + j * 5 * s, y - L + Math.abs(j) * 1.6 * s); ctx.stroke();
      }
      const stalks = [[-4, 30], [1, 38], [5, 33]];
      ctx.strokeStyle = '#7a6a3e'; ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      for (const [dx, hh] of stalks) { ctx.moveTo(x + dx * s * 0.4, y); ctx.lineTo(x + dx * s, y - hh * s); }
      ctx.stroke();
      ctx.fillStyle = '#5a4430';
      ctx.beginPath(); for (const [dx, hh] of stalks) circ(ctx, x + dx * s, y - hh * s, 2.6 * s); ctx.fill();
    },
    // a weed growing out of a crack in the footpath, or a little drain grate
    city(ctx, x, y, s) {
      if (hash(Math.round(x) * 0.37) < 0.6) {
        ctx.strokeStyle = 'rgba(90,85,78,0.7)'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x - 16 * s, y + 2); ctx.lineTo(x - 6 * s, y - 1); ctx.lineTo(x, y + 1); ctx.lineTo(x + 9 * s, y - 2); ctx.lineTo(x + 18 * s, y + 1); ctx.stroke();
        for (const [a, l] of [[-0.9, 7], [0.9, 7], [-0.3, 9], [0.35, 8]]) A.oval(ctx, x + Math.sin(a) * l * 0.8 * s, y - Math.cos(a) * l * 0.8 * s, 2.4 * s, l * 0.55 * s, a, '#5fa04a', LINE, 1);
        if (hash(Math.round(x) * 0.71) < 0.5) {
          ctx.strokeStyle = '#5fa04a'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1 * s, y - 13 * s); ctx.stroke();
          A.oval(ctx, x + 1 * s, y - 14 * s, 3 * s, 3 * s, 0, '#ffd23f', LINE, 1);
        }
      } else {
        ctx.fillStyle = '#5a5e66'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(x - 14 * s, y - 4 * s, 28 * s, 8 * s, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#23252b';
        for (let j = 0; j < 6; j++) ctx.fillRect(x - 11.5 * s + j * 4.2 * s, y - 2.5 * s, 2 * s, 5 * s);
      }
    },
    // a small fern with a curled-up fiddlehead
    rift(ctx, x, y, s) {
      ctx.lineCap = 'round';
      const fr = [[-2.6, 22], [-2.0, 26], [-1.15, 24], [-0.5, 20]];
      ctx.fillStyle = '#5a9a3c';
      ctx.beginPath();
      for (const [a, L] of fr) {
        for (let k = 0.2; k < 1; k += 0.16) {
          const px = x + Math.cos(a) * L * k * s, py = y + Math.sin(a) * L * k * s * 0.8 + k * k * 8 * s, ll = (1 - k) * 5 * s + 1.5 * s;
          ell(ctx, px, py - ll * 0.6, ll * 0.4, ll, a + 1.4); ell(ctx, px, py + ll * 0.4, ll * 0.4, ll, a - 1.4);
        }
      }
      ctx.fill();
      ctx.strokeStyle = '#3f7a2a'; ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      for (const [a, L] of fr) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.5 * s, y + Math.sin(a) * L * 0.6 * s, x + Math.cos(a) * L * s, y + Math.sin(a) * L * 0.8 * s + 8 * s); }
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 3 * s, y - 16 * s, x + 7 * s, y - 20 * s);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 4 * s, y - 21 * s, 3.2 * s, 0, Math.PI * 1.6); ctx.stroke();
    },
    // beach grass with a shell in the sand; on the boardwalk just a shell or a starfish
    grinisle(ctx, x, y, s) {
      if (y < MG.GROUND_Y + 22) {
        if (hash(Math.round(x) * 0.53) < 0.5) A.star(ctx, x, y - 1, 6 * s, '#ff8a5c');
        else { ctx.fillStyle = '#ffd9c9'; ctx.strokeStyle = 'rgba(160,90,70,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 5 * s, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        return;
      }
      ctx.lineCap = 'round'; ctx.lineWidth = 2 * s;
      for (let j = -3; j <= 3; j++) {
        ctx.strokeStyle = j % 2 ? '#c9c06a' : '#9cbd5c';
        const L = (16 + (3 - Math.abs(j)) * 4) * s;
        ctx.beginPath(); ctx.moveTo(x + j * 1.5 * s, y); ctx.quadraticCurveTo(x + j * 4 * s, y - L * 0.8, x + j * 9 * s, y - L + Math.abs(j) * 3 * s); ctx.stroke();
      }
      ctx.fillStyle = '#ffc2d1'; ctx.strokeStyle = 'rgba(160,90,70,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 12 * s, y + 2); ctx.arc(x + 12 * s, y + 2, 4.5 * s, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
    },
    // a cluster of glowing toadstools, or a few pebbles
    lair(ctx, x, y, s) {
      if (hash(Math.round(x) * 0.29) < 0.55) {
        glowSpot(ctx, x, y - 8 * s, 24 * s, '90,255,190', 0.3);
        for (const [dx, hh, r] of [[-6, 9, 5], [2, 14, 6.5], [9, 7, 4]]) {
          ctx.fillStyle = '#d8f5e8'; ctx.fillRect(x + (dx - 1.2) * s, y - hh * s, 2.4 * s, hh * s);
          ctx.fillStyle = '#4dffb0'; ctx.strokeStyle = '#0d3a2a'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x + (dx - r) * s, y - hh * s); ctx.quadraticCurveTo(x + dx * s, y - (hh + r * 1.5) * s, x + (dx + r) * s, y - hh * s); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x + (dx - r * 0.3) * s, y - (hh + r * 0.5) * s, 1 * s, 0, TAU); ctx.fill();
        }
      } else {
        for (const [dx, r] of [[-7, 5], [2, 7], [10, 4]]) {
          A.oval(ctx, x + dx * s, y - r * 0.5 * s, r * s, r * 0.7 * s, 0, '#6a6f80', LINE, 1.4);
          A.oval(ctx, x + (dx - r * 0.3) * s, y - r * 0.8 * s, r * 0.35 * s, r * 0.18 * s, 0, 'rgba(255,255,255,0.3)');
        }
      }
    },
    // a grass tuft with clover leaves, and sometimes a daisy
    isleofman(ctx, x, y, s) {
      ctx.lineCap = 'round'; ctx.lineWidth = 1.8 * s;
      for (let j = -3; j <= 3; j++) {
        ctx.strokeStyle = j % 2 ? '#4f8f3a' : '#7cbf55';
        const L = (11 + (3 - Math.abs(j)) * 3) * s;
        ctx.beginPath(); ctx.moveTo(x + j * 1.5 * s, y); ctx.quadraticCurveTo(x + j * 2.5 * s, y - L * 0.8, x + j * 5 * s, y - L); ctx.stroke();
      }
      for (const [cx, cy] of [[-8, -4], [9, -5]]) {
        ctx.strokeStyle = '#3f7a30'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + cx * s, y); ctx.lineTo(x + cx * s, y + cy * s); ctx.stroke();
        ctx.fillStyle = '#5aa83f';
        ctx.beginPath(); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * (TAU / 3); circ(ctx, x + cx * s + Math.cos(a) * 2.6 * s, y + cy * s + Math.sin(a) * 2.6 * s, 2.5 * s); } ctx.fill();
      }
      if (hash(Math.round(x) * 0.61) < 0.45) {
        ctx.strokeStyle = '#4f8f3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 2 * s, y); ctx.lineTo(x + 3 * s, y - 17 * s); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * (TAU / 8); ell(ctx, x + 3 * s + Math.cos(a) * 3 * s, y - 17 * s + Math.sin(a) * 3 * s, 2.2 * s, 1.1 * s, a); } ctx.fill();
        A.oval(ctx, x + 3 * s, y - 17 * s, 1.7 * s, 1.7 * s, 0, '#ffd23f');
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
  // a lumpy white layer of snow along a top edge from x0 to x1, with a few icicles under it
  function snowTop(ctx, x0, x1, y, icicles) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(110,140,180,0.85)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0 - 3, y + 6);
    const n = Math.max(2, Math.round((x1 - x0) / 18));
    for (let j = 0; j < n; j++) {
      const a = lerp(x0, x1, j / n), b = lerp(x0, x1, (j + 1) / n);
      ctx.quadraticCurveTo((a + b) / 2, y - 7 - hash(x0 + j) * 3, b, y - 1);
    }
    ctx.lineTo(x1 + 3, y + 6);
    for (let j = n; j > 0; j--) { const a = lerp(x0, x1, j / n), b = lerp(x0, x1, (j - 1) / n); ctx.quadraticCurveTo((a + b) / 2, y + 9 + (j % 2) * 4, b, y + 6); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!icicles) return;
    ctx.fillStyle = '#d6ecff'; ctx.strokeStyle = 'rgba(110,140,180,0.85)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x0 + 10; x < x1 - 6; x += 17) { const L = icicles + hash(x) * 8; ctx.moveTo(x - 2.5, y + 6); ctx.lineTo(x, y + 6 + L); ctx.lineTo(x + 2.5, y + 6); }
    ctx.fill(); ctx.stroke();
  }
  function rockPile(ctx, x, top, gy, cols, seed, snow) {
    const n = Math.max(1, Math.ceil((gy - top) / 30));
    for (let k = 0; k < n; k++) {
      const r = 24 - k * 1.5, y = gy - 14 - k * ((gy - top - 14) / n), dx = (k % 2 ? 5 : -5) + (hash(seed + k) - 0.5) * 6;
      A.oval(ctx, x + dx, y, r, 16, (hash(seed + k * 3) - 0.5) * 0.3, cols[0], LINE, 2);
      A.oval(ctx, x + dx - r * 0.3, y - 6, r * 0.4, 4, 0, cols[1]);
    }
    if (snow) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); cap(ctx, x, gy - 14 - (n - 1) * ((gy - top - 14) / n) - 12, 16, 6); ctx.fill(); }
  }
  // a dry-stone wall from bottom up to top: tapered, stones in rows, coping stones on edge along the top
  const STONES = ['#9a9b92', '#8a8b83', '#a8a99f', '#7f8079', '#b0afa4'];
  function stoneWall(ctx, x0, w, top, bottom, seed) {
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#6f706a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x0, bottom); ctx.lineTo(x0 + 3, top + 9); ctx.lineTo(x0 + w - 3, top + 9); ctx.lineTo(x0 + w, bottom); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    const stones = [];
    let row = 0;
    for (let y = bottom - 12; y > top + 4; y -= 11, row++) {
      let x = x0 - (row % 2 ? 9 : 0) - 4, j = 0;
      while (x < x0 + w + 4) {
        const sw = 15 + hash(seed + row * 17 + j) * 13;
        stones.push([x + 1, y + 1, sw - 2, Math.floor(hash(seed + row * 7 + j * 3) * STONES.length)]);
        x += sw; j++;
      }
    }
    for (let c = 0; c < STONES.length; c++) {
      ctx.fillStyle = STONES[c];
      ctx.beginPath();
      for (const st of stones) if (st[3] === c) ctx.rect(st[0], st[1], st[2], 10);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(43,26,20,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const st of stones) ctx.rect(st[0], st[1], st[2], 10);
    ctx.stroke();
    ctx.restore();
    // coping stones standing on edge
    for (let c = 0; c < 2; c++) {
      ctx.fillStyle = STONES[c ? 2 : 0];
      ctx.beginPath();
      for (let x = x0 + 1, j = 0; x < x0 + w - 4; x += 7, j++) if ((j % 2) === c) ctx.roundRect(x, top + (j % 3 === 1 ? 1 : 0), 7, 12, 2);
      ctx.fill();
    }
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = x0 + 1, j = 0; x < x0 + w - 4; x += 7, j++) ctx.roundRect(x, top + (j % 3 === 1 ? 1 : 0), 7, 12, 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(110,160,70,0.8)';
    ctx.beginPath();
    for (let j = 0; j < w / 50; j++) ell(ctx, x0 + 14 + j * 50 + hash(seed + j * 9) * 20, top + 14 + hash(seed + j * 4) * (bottom - top - 24), 6, 3, 0);
    ctx.fill();
  }
  const PLAT = {
    // low: a snowy log resting on rock piles; high: a little timber hut, its roof edge under thick snow
    alps(ctx, p, gy) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (gy - p.y > 140) {
        const x0 = p.x + 8, x1 = p.x + p.w - 8;
        ctx.fillStyle = '#8f6c4c'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.fillRect(x0, p.y + 12, x1 - x0, gy - p.y - 12); ctx.strokeRect(x0, p.y + 12, x1 - x0, gy - p.y - 12);
        ctx.strokeStyle = 'rgba(60,35,15,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); for (let y = p.y + 26; y < gy - 4; y += 13) { ctx.moveTo(x0 + 2, y); ctx.lineTo(x1 - 2, y + (y % 3) - 1); } ctx.stroke();
        ctx.fillStyle = '#ffd27a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.fillRect(x0 + 16, p.y + 38, 34, 28); ctx.strokeRect(x0 + 16, p.y + 38, 34, 28);
        ctx.beginPath(); ctx.moveTo(x0 + 33, p.y + 38); ctx.lineTo(x0 + 33, p.y + 66); ctx.moveTo(x0 + 16, p.y + 52); ctx.lineTo(x0 + 50, p.y + 52); ctx.stroke();
        snowTop(ctx, x0 + 14, x0 + 52, p.y + 34, 0);
        ctx.fillStyle = '#5a3a22'; ctx.fillRect(x1 - 46, gy - 66, 32, 66); ctx.strokeRect(x1 - 46, gy - 66, 32, 66);
        A.oval(ctx, x1 - 20, gy - 32, 2.5, 2.5, 0, '#ffd23f');
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); cap(ctx, p.x + 24, gy + 2, 26, 12); cap(ctx, x1 - 6, gy + 2, 18, 8); ctx.fill();
        // the iron roof edge
        ctx.fillStyle = '#a8423a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(p.x - 2, p.y + 3, p.w + 4, 13, 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(60,15,10,0.4)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); for (let x = p.x + 6; x < p.x + p.w; x += 7) { ctx.moveTo(x, p.y + 5); ctx.lineTo(x, p.y + 14); } ctx.stroke();
        snowTop(ctx, p.x - 2, p.x + p.w + 2, p.y + 1, 8);
      } else {
        for (const [rx, k] of [[p.x + 26, 1], [p.x + p.w - 26, 2]]) rockPile(ctx, rx, p.y + 16, gy, ['#8d96a3', '#aab3be'], p.x + k, true);
        ctx.fillStyle = '#7a5232'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(p.x - 4, p.y + 1, p.w + 8, 18, 8); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(50,25,10,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); for (let x = p.x + 14; x < p.x + p.w - 20; x += 26) { ctx.moveTo(x, p.y + 10 + (x % 3)); ctx.lineTo(x + 18, p.y + 12 + (x % 4)); } ctx.stroke();
        for (const ex of [p.x - 2, p.x + p.w + 2]) { A.oval(ctx, ex, p.y + 10, 5.5, 8.5, 0, '#d8b07a', LINE, 2); A.oval(ctx, ex, p.y + 10, 2.6, 4.4, 0, null, '#a87a48', 1.2); }
        snowTop(ctx, p.x, p.x + p.w, p.y + 1, 6);
      }
    },
    // a rocky ledge on a column of stacked angular blocks, with orange lichen and tussocks
    tasmania(ctx, p, gy) {
      ctx.lineJoin = 'round';
      const cx = p.x + p.w / 2, cw = Math.min(p.w * 0.5, 84);
      let y = gy, k = 0;
      while (y > p.y + 16) {
        const bh = Math.min(y - (p.y + 14), 24 + hash(p.x + k) * 16), jx = (hash(p.x + k * 3) - 0.5) * 12, bw = cw * (0.85 + hash(p.x + k * 5) * 0.3);
        ctx.fillStyle = '#5f5b58'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + jx - bw / 2, y); ctx.lineTo(cx + jx - bw / 2 + 3, y - bh); ctx.lineTo(cx + jx + bw / 2 - 2, y - bh + 2); ctx.lineTo(cx + jx + bw / 2, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(cx + jx - bw / 2 + 4, y - bh + 3, bw * 0.3, bh - 6);
        y -= bh; k++;
      }
      ctx.fillStyle = '#6f6a66'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 3); ctx.lineTo(p.x + 7, p.y); ctx.lineTo(p.x + p.w - 6, p.y); ctx.lineTo(p.x + p.w, p.y + 4); ctx.lineTo(p.x + p.w - 5, p.y + 15);
      ctx.lineTo(p.x + p.w * 0.68, p.y + 20); ctx.lineTo(p.x + p.w * 0.32, p.y + 17); ctx.lineTo(p.x + 5, p.y + 14); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#918b85'; ctx.fillRect(p.x + 6, p.y + 2, p.w - 12, 4);
      ctx.fillStyle = 'rgba(232,138,58,0.85)';
      ctx.beginPath(); for (let j = 0; j < p.w / 30; j++) ell(ctx, p.x + 14 + j * 30 + hash(p.x + j) * 12, p.y + 9 + hash(p.y + j) * 6, 4 + hash(j + p.x) * 3, 2.2, 0); ctx.fill();
      ctx.strokeStyle = '#a69c56'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const tx of [p.x + 8, p.x + p.w - 10]) for (let j = -2; j <= 2; j++) { ctx.moveTo(tx + j * 1.5, p.y + 1); ctx.quadraticCurveTo(tx + j * 3, p.y - 7, tx + j * 6, p.y - 9 + Math.abs(j) * 2); }
      ctx.stroke();
    },
    // low: a shop awning on two poles; high: a builder's scaffold with boards on top
    city(ctx, p, gy) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (gy - p.y <= 140) {
        const cols = hash(p.x * 0.13) < 0.5 ? ['#e63946', '#ffffff'] : ['#2a9d8f', '#ffffff'];
        for (const px of [p.x + 10, p.x + p.w - 10]) {
          ctx.strokeStyle = LINE; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px, p.y + 14); ctx.lineTo(px, gy); ctx.stroke();
          ctx.strokeStyle = '#5c6470'; ctx.lineWidth = 3.5; ctx.stroke();
        }
        ctx.save();
        ctx.beginPath(); ctx.rect(p.x, p.y, p.w, 14);
        const n = Math.ceil(p.w / 16);
        for (let j = 0; j < n; j++) ctx.arc(p.x + 8 + j * 16, p.y + 14, 8, 0, Math.PI);
        ctx.clip();
        for (let j = 0; j < n; j++) { ctx.fillStyle = cols[j % 2]; ctx.fillRect(p.x + j * 16, p.y, 16, 24); }
        ctx.restore();
        ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y + 14); ctx.lineTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.lineTo(p.x + p.w, p.y + 14);
        for (let j = n - 1; j >= 0; j--) { const cx = p.x + 8 + j * 16; if (cx + 8 <= p.x + p.w + 0.5) ctx.arc(cx, p.y + 14, 8, 0, Math.PI); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(p.x + 2, p.y + 10, p.w - 4, 4);
      } else {
        const xs = [p.x + 8, p.x + p.w / 2, p.x + p.w - 8], top = p.y + 12;
        const tubes = () => {
          ctx.beginPath();
          for (const x of xs) { ctx.moveTo(x, top); ctx.lineTo(x, gy - 2); }
          for (let y = gy - 50; y > top + 10; y -= 48) { ctx.moveTo(p.x + 2, y); ctx.lineTo(p.x + p.w - 2, y); }
          for (let y = gy - 2, k = 0; y > top + 20; y -= 48, k++) {
            const y1 = Math.max(top + 4, y - 48);
            if (k % 2) { ctx.moveTo(xs[0], y); ctx.lineTo(xs[1], y1); ctx.moveTo(xs[1], y); ctx.lineTo(xs[2], y1); }
            else { ctx.moveTo(xs[0], y1); ctx.lineTo(xs[1], y); ctx.moveTo(xs[1], y1); ctx.lineTo(xs[2], y); }
          }
        };
        tubes(); ctx.strokeStyle = LINE; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = '#a3acb6'; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.fillStyle = '#3a3f47'; for (const x of xs) ctx.fillRect(x - 7, gy - 4, 14, 4);
        ctx.fillStyle = '#c8955a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 11, 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(90,50,20,0.5)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); for (let x = p.x + 40; x < p.x + p.w - 8; x += 40) { ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + 10); } ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y + 11, p.w, 6); ctx.clip();
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(p.x, p.y + 11, p.w, 6);
        ctx.fillStyle = '#2b2d42';
        for (let x = p.x - 6; x < p.x + p.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, p.y + 17); ctx.lineTo(x + 6, p.y + 11); ctx.lineTo(x + 12, p.y + 11); ctx.lineTo(x + 6, p.y + 17); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; ctx.strokeRect(p.x, p.y + 11, p.w, 6);
      }
    },
    // low: a ledge of dark volcanic rock with ferns; high: a giant fern frond on a tree-fern trunk
    rift(ctx, p, gy) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (gy - p.y > 140) {
        const cx = p.x + p.w * 0.5;
        ctx.fillStyle = '#5a3e2a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx - 13, gy); ctx.quadraticCurveTo(cx - 6, (gy + p.y) / 2, cx - 10, p.y + 8); ctx.lineTo(cx + 10, p.y + 8); ctx.quadraticCurveTo(cx + 14, (gy + p.y) / 2, cx + 13, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(30,18,10,0.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); for (let y = gy - 10; y > p.y + 20; y -= 12) { const o = (y % 24 < 12) ? -1 : 1; ctx.moveTo(cx - 8 * o, y); ctx.lineTo(cx + 4 * o, y - 6); } ctx.stroke();
        // leaflets hanging under the frond
        for (let x = p.x + 4, j = 0; x < p.x + p.w - 2; x += 11, j++) {
          A.oval(ctx, x, p.y + 15, 4, 11, (j % 2 ? 0.25 : -0.15), j % 2 ? '#4f8a34' : '#5f9a3c', LINE, 1.2);
        }
        ctx.fillStyle = '#6aa84a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(p.x - 4, p.y, p.w + 8, 10, 5); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x + 4, p.y + 3); ctx.lineTo(p.x + p.w - 4, p.y + 3); ctx.stroke();
        // a curled fiddlehead at the tip
        ctx.strokeStyle = LINE; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(p.x + p.w + 8, p.y + 2, 7, Math.PI * 0.9, Math.PI * 2.6); ctx.stroke();
        ctx.strokeStyle = '#6aa84a'; ctx.lineWidth = 4; ctx.stroke();
      } else {
        rockPile(ctx, p.x + p.w * 0.3, p.y + 16, gy, ['#4a3a36', '#6a5650'], p.x, false);
        rockPile(ctx, p.x + p.w * 0.72, p.y + 16, gy, ['#4a3a36', '#6a5650'], p.x + 9, false);
        ctx.fillStyle = '#5a4642'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y + 2); ctx.lineTo(p.x + 5, p.y); ctx.lineTo(p.x + p.w - 5, p.y); ctx.lineTo(p.x + p.w, p.y + 3); ctx.lineTo(p.x + p.w - 8, p.y + 17); ctx.lineTo(p.x + 10, p.y + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7a6460'; ctx.fillRect(p.x + 6, p.y + 2, p.w - 12, 4);
        ctx.fillStyle = 'rgba(255,140,60,0.7)'; ctx.fillRect(p.x + p.w * 0.4, p.y + 11, 18, 2);
        PLANTS.rift(ctx, p.x + 6, p.y + 2, 0.6);
        ctx.save(); ctx.translate(p.x + p.w - 6, p.y + 2); ctx.scale(-1, 1); PLANTS.rift(ctx, 0, 0, 0.55); ctx.restore();
      }
    },
    // low: a boardwalk deck with a lifebuoy; high: a souvenir stall under a striped awning
    grinisle(ctx, p, gy) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (gy - p.y <= 140) {
        const n = Math.max(2, Math.round(p.w / 54) + 1);
        for (let j = 0; j < n; j++) {
          const px = p.x + 8 + (j / (n - 1)) * (p.w - 16);
          ctx.fillStyle = '#8a5a2e'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect(px - 5, p.y + 8, 10, gy - p.y - 6, 3); ctx.fill(); ctx.stroke();
        }
        ctx.strokeStyle = '#6e4622'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(p.x + 10, p.y + 20); ctx.lineTo(p.x + p.w - 10, gy - 10); ctx.moveTo(p.x + p.w - 10, p.y + 20); ctx.lineTo(p.x + 10, gy - 10); ctx.stroke();
        ctx.fillStyle = '#d29a5c'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 13, 3); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(110,60,25,0.5)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); for (let x = p.x + 14; x < p.x + p.w - 4; x += 14) { ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + 12); } ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,210,0.35)'; ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 2);
        // a lifebuoy on the post
        const bx = p.x + 8 + (p.w - 16) * (n > 2 ? 1 / (n - 1) : 0.5), by = p.y + 36;
        A.oval(ctx, bx, by, 13, 13, 0, '#ffffff', LINE, 2);
        ctx.strokeStyle = '#e63946'; ctx.lineWidth = 6;
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(bx, by, 9.5, k * Math.PI / 2 + 0.2, k * Math.PI / 2 + 0.75); ctx.stroke(); }
        A.oval(ctx, bx, by, 6, 6, 0, '#8a5a2e', LINE, 1.5);
      } else {
        const cols = ['#ff8fab', '#ffffff'];
        for (const px of [p.x + 6, p.x + p.w - 6]) {
          ctx.strokeStyle = LINE; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px, p.y + 14); ctx.lineTo(px, gy); ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.stroke();
        }
        // the sign and the counter with its wares
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(p.x + 16, p.y + 26, p.w - 32, 20, 4); ctx.fill(); ctx.stroke();
        fitText(ctx, 'SOUVENIRS', p.x + p.w / 2, p.y + 36.5, p.w - 44, 13, '#e63946');
        ctx.fillStyle = '#a0e7e5'; ctx.lineWidth = 2.5;
        ctx.fillRect(p.x + 12, gy - 46, p.w - 24, 46); ctx.strokeRect(p.x + 12, gy - 46, p.w - 24, 46);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x + 12, gy - 46, p.w - 24, 7); ctx.strokeRect(p.x + 12, gy - 46, p.w - 24, 7);
        for (let j = 0; j < Math.floor((p.w - 40) / 26); j++) {
          const sx = p.x + 30 + j * 26, sy = gy - 52;
          if (j % 2) { A.oval(ctx, sx, sy, 8, 8, 0, '#ffd23f', LINE, 1.5); smiley(ctx, sx, sy, 8); }
          else { A.oval(ctx, sx, sy + 1, 9, 7, 0, '#b0855a', LINE, 1.5); A.oval(ctx, sx - 6, sy - 5, 3, 3, 0, '#b0855a', LINE, 1.2); A.oval(ctx, sx + 6, sy - 5, 3, 3, 0, '#b0855a', LINE, 1.2); smiley(ctx, sx, sy + 1, 7); }
        }
        // the striped awning (the walkable top) with a scalloped edge
        ctx.save();
        ctx.beginPath(); ctx.rect(p.x - 6, p.y, p.w + 12, 14);
        const n = Math.ceil((p.w + 12) / 16);
        for (let j = 0; j < n; j++) ctx.arc(p.x - 6 + 8 + j * 16, p.y + 14, 8, 0, Math.PI);
        ctx.clip();
        for (let j = 0; j < n; j++) { ctx.fillStyle = cols[j % 2]; ctx.fillRect(p.x - 6 + j * 16, p.y, 16, 24); }
        ctx.restore();
        ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(p.x - 6, p.y + 14); ctx.lineTo(p.x - 6, p.y); ctx.lineTo(p.x + p.w + 6, p.y); ctx.lineTo(p.x + p.w + 6, p.y + 14);
        for (let j = n - 1; j >= 0; j--) { const cx = p.x - 6 + 8 + j * 16; if (cx + 8 <= p.x + p.w + 6.5) ctx.arc(cx, p.y + 14, 8, 0, Math.PI); }
        ctx.stroke();
      }
    },
    // a stone ledge on a rough rock column, with glowing crystals growing under its edges
    lair(ctx, p, gy) {
      ctx.lineJoin = 'round';
      const cx = p.x + p.w / 2;
      ctx.fillStyle = '#353c4c'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - 30, gy); ctx.lineTo(cx - 24, gy - (gy - p.y) * 0.4); ctx.lineTo(cx - 28, gy - (gy - p.y) * 0.7); ctx.lineTo(cx - 20, p.y + 12);
      ctx.lineTo(cx + 22, p.y + 12); ctx.lineTo(cx + 27, gy - (gy - p.y) * 0.6); ctx.lineTo(cx + 23, gy - (gy - p.y) * 0.3); ctx.lineTo(cx + 32, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(140,170,200,0.12)'; ctx.fillRect(cx - 18, p.y + 16, 9, gy - p.y - 20);
      for (const [dx, s] of [[16, 0.42], [p.w - 18, 0.5]]) { ctx.save(); ctx.translate(p.x + dx, p.y + 14); ctx.scale(1, -1); crystals(ctx, 0, 0, s, p.x * 0.01, p.x + dx, true); ctx.restore(); }
      ctx.fillStyle = '#4a5163'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y + 3); ctx.lineTo(p.x + 6, p.y); ctx.lineTo(p.x + p.w - 6, p.y); ctx.lineTo(p.x + p.w, p.y + 4); ctx.lineTo(p.x + p.w - 6, p.y + 16); ctx.lineTo(p.x + p.w * 0.6, p.y + 19); ctx.lineTo(p.x + p.w * 0.25, p.y + 16); ctx.lineTo(p.x + 5, p.y + 15); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6a7286'; ctx.fillRect(p.x + 6, p.y + 2, p.w - 12, 4);
      ctx.fillStyle = 'rgba(90,255,170,0.8)';
      ctx.beginPath(); for (let j = 0; j < p.w / 40; j++) circ(ctx, p.x + 20 + j * 40 + hash(p.x + j) * 14, p.y + 10, 1.4); ctx.fill();
    },
    // a dry-stone wall, its coping stones on top; a little sheep hole at the bottom of tall walls
    isleofman(ctx, p, gy) {
      stoneWall(ctx, p.x, p.w, p.y, gy, p.x);
      if (gy - p.y > 70) {
        const hx = p.x + p.w * 0.35;
        ctx.fillStyle = '#2b2a28'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.fillRect(hx, gy - 34, 34, 34); ctx.strokeRect(hx, gy - 34, 34, 34);
        ctx.fillStyle = '#a8a99f'; ctx.beginPath(); ctx.roundRect(hx - 6, gy - 44, 46, 11, 3); ctx.fill(); ctx.stroke();
      }
      ctx.strokeStyle = '#5f9a44'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); for (let x = p.x + 4; x < p.x + p.w; x += 9) { ctx.moveTo(x, gy + 1); ctx.lineTo(x - 2 + hash(x) * 4, gy - 5 - hash(x + 1) * 6); } ctx.stroke();
    },
  };
  // a little smiley face on merch
  function smiley(ctx, x, y, r) {
    ctx.fillStyle = LINE;
    ctx.beginPath(); circ(ctx, x - r * 0.33, y - r * 0.2, r * 0.13); circ(ctx, x + r * 0.33, y - r * 0.2, r * 0.13); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = Math.max(1, r * 0.13); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.5, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  const basePlatform = A.platform;
  A.platform = function (ctx, p, groundY, theme) {
    if (typeof theme === 'string' && has(PLAT, theme)) { ctx.save(); PLAT[theme](ctx, p, groundY); ctx.restore(); }
    else basePlatform(ctx, p, groundY, theme);
  };

  // ================================================================ water
  // Same two passes as the river in worlds.js (front=false behind the characters, front=true over
  // them), in three new looks picked by the 8th argument: 'tasmania', 'grinisle' or 'lair'.
  const WATER = {
    tasmania: {
      deep: ['#3a5a72', '#22384a', '#101c26'], shaft: 'rgba(180,210,230,0.12)', bed: '#2f2f33', pebble: '#4a4a50',
      front: ['rgba(70,105,130,0.45)', 'rgba(20,35,50,0.75)'], band: 'rgba(200,225,240,0.2)', line: 'rgba(235,245,250,0.95)',
      back(ctx, x, w, sy, gy, t, seed) {
        // kelp swaying up from the bottom
        for (let j = 0; j < w / 46; j++) {
          const kx = x + 16 + j * 46 + hash(seed + j * 3) * 20, kh = (gy - sy) * (0.55 + hash(seed + j * 5) * 0.35);
          const sw = Math.sin(t * 1.1 + j) * 10;
          ctx.strokeStyle = '#6a6424'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(kx, gy + 2); ctx.bezierCurveTo(kx + sw, gy - kh * 0.3, kx - sw, gy - kh * 0.7, kx + sw * 0.6, gy - kh); ctx.stroke();
          ctx.fillStyle = j % 2 ? '#8a7a2e' : '#7a6e28';
          ctx.beginPath();
          for (let k = 0.2; k < 1; k += 0.2) { const ky = gy - kh * k, kxx = kx + Math.sin(t * 1.1 + j + k * 3) * 8 * k; ell(ctx, kxx + (k * 10 % 2 < 1 ? 7 : -7), ky, 8, 3, k * 10 % 2 < 1 ? -0.5 : 0.5); }
          ctx.fill();
        }
      },
      frontExtra(ctx, x, w, sy, gy, t, seed, wave) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        for (let j = 0; j < w / 70; j++) { const fx = x + mod(hash(seed + j * 7) * w + t * 14, w); for (let k = 0; k < 3; k++) circ(ctx, fx + k * 6, wave(fx) + 1 - (k % 2) * 2, 3 + (k % 2)); }
        ctx.fill();
      },
    },
    grinisle: {
      deep: ['#3fe0d8', '#1bb0c8', '#0d7a9a'], shaft: 'rgba(255,255,255,0.18)', bed: '#f2e2b0', pebble: '#e4cf94',
      front: ['rgba(90,235,225,0.35)', 'rgba(20,140,170,0.6)'], band: 'rgba(255,255,255,0.25)', line: 'rgba(255,255,255,0.95)',
      back(ctx, x, w, sy, gy, t, seed) {
        for (let j = 0; j < w / 90; j++) A.star(ctx, x + 30 + j * 90 + hash(seed + j) * 40, gy + 10 + hash(seed + j * 3) * 20, 7, j % 2 ? '#ff8a5c' : '#ff6fa0');
        ctx.fillStyle = '#ffd9c9';
        ctx.beginPath(); for (let j = 0; j < w / 60; j++) { const cx = x + 10 + j * 60 + hash(seed + j * 5) * 30, cy = gy + 28 + hash(seed + j * 7) * 20; ctx.moveTo(cx, cy); ctx.arc(cx, cy, 4, Math.PI, TAU); ctx.closePath(); } ctx.fill();
        // little fish darting back and forth
        for (let j = 0; j < Math.max(1, w / 120); j++) {
          const k = mod(t * 0.12 + hash(seed + j * 11), 1), dir = k < 0.5 ? 1 : -1, q = k < 0.5 ? k * 2 : 2 - k * 2;
          const fx = x + 20 + q * (w - 40), fy = sy + 30 + hash(seed + j * 13) * (gy - sy - 50) + Math.sin(t * 3 + j) * 4;
          ctx.fillStyle = j % 2 ? '#ffb703' : '#ff6f59';
          ctx.beginPath(); ctx.ellipse(fx, fy, 8, 4.5, 0, 0, TAU); ctx.moveTo(fx - dir * 6, fy); ctx.lineTo(fx - dir * 13, fy - 5); ctx.lineTo(fx - dir * 13, fy + 5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); circ(ctx, fx + dir * 4, fy - 1, 1.6); ctx.fill();
        }
      },
      frontExtra(ctx, x, w, sy, gy, t, seed, wave) {
        ctx.fillStyle = '#ffffff';
        for (let j = 0; j < w / 50; j++) { const k = Math.sin(t * 4 + j * 2.3); if (k > 0.5) { const sx = x + 10 + j * 50 + hash(seed + j) * 30; A.star(ctx, sx, wave(sx) + 3, (k - 0.5) * 7, '#ffffff'); } }
      },
    },
    lair: {
      deep: ['#13484a', '#0b2a30', '#041416'], shaft: 'rgba(110,255,210,0.08)', bed: '#1a1d26', pebble: '#2a2f3c', glow: true,
      front: ['rgba(30,150,135,0.38)', 'rgba(5,40,45,0.78)'], band: 'rgba(120,255,210,0.18)', line: 'rgba(150,255,220,0.95)',
      back(ctx, x, w, sy, gy, t, seed) {
        for (let j = 0; j < w / 110; j++) crystals(ctx, x + 40 + j * 110 + hash(seed + j) * 40, gy + 6, 0.45, t, seed + j, false);
        ctx.fillStyle = 'rgba(110,255,200,0.5)';
        ctx.beginPath();
        for (let j = 0; j < w / 30; j++) { const k = mod(t * 0.2 + hash(seed + j * 3), 1); circ(ctx, x + hash(seed + j) * w, lerp(gy - 4, sy + 10, k), 1.2 + hash(seed + j * 5) * 1.5); }
        ctx.fill();
      },
      frontExtra(ctx, x, w, sy, gy, t, seed, wave) {},
    },
  };
  function themedWater(ctx, o, x, w, surfaceY, groundY, t, front) {
    const seed = Math.round(x);
    if (!front) {
      const g = ctx.createLinearGradient(0, surfaceY, 0, H);
      g.addColorStop(0, o.deep[0]); g.addColorStop(0.5, o.deep[1]); g.addColorStop(1, o.deep[2]);
      ctx.fillStyle = g; ctx.fillRect(x, surfaceY, w, H - surfaceY);
      ctx.strokeStyle = o.shaft; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let j = 0; j < w / 40; j++) { const lx = x + j * 40 + Math.sin(t + j) * 6; ctx.moveTo(lx, surfaceY + 10); ctx.lineTo(lx - 30, groundY - 10); }
      ctx.stroke();
      ctx.fillStyle = o.bed; ctx.fillRect(x, groundY, w, H - groundY);
      ctx.fillStyle = o.pebble;
      ctx.beginPath();
      for (let j = 0; j < w / 26; j++) ell(ctx, x + j * 26 + hash(seed + j) * 18, groundY + 4 + hash(seed + j * 3) * 30, 4 + hash(seed + j * 7) * 4, 2.5, 0);
      ctx.fill();
      o.back(ctx, x, w, surfaceY, groundY, t, seed);
    } else {
      const wave = (sx) => surfaceY + Math.sin(sx * 0.05 + t * 2.2) * 2.5 + Math.sin(sx * 0.11 - t * 1.3) * 1.2;
      const g = ctx.createLinearGradient(0, surfaceY, 0, H);
      g.addColorStop(0, o.front[0]); g.addColorStop(1, o.front[1]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, H);
      for (let sx = x; sx <= x + w + 10; sx += 10) ctx.lineTo(sx, wave(sx));
      ctx.lineTo(x + w + 10, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = o.band; ctx.fillRect(x, surfaceY + 3, w, 7);
      ctx.beginPath(); ctx.moveTo(x, wave(x));
      for (let sx = x + 10; sx <= x + w + 10; sx += 10) ctx.lineTo(sx, wave(sx));
      if (o.glow) { ctx.strokeStyle = 'rgba(110,255,210,0.22)'; ctx.lineWidth = 10; ctx.stroke(); }
      ctx.strokeStyle = o.line; ctx.lineWidth = 3; ctx.stroke();
      ctx.lineWidth = 1.5;
      for (let j = 0; j < w / 120; j++) {
        const k = mod(t * 0.6 + hash(seed + j * 5), 1), rx = x + 40 + j * 120 + hash(seed + j) * 50;
        ctx.strokeStyle = o.glow ? 'rgba(150,255,220,' + (0.7 * (1 - k)).toFixed(3) + ')' : 'rgba(255,255,255,' + (0.7 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(rx, surfaceY + 4, 6 + k * 24, 2 + k * 4, 0, 0, TAU); ctx.stroke();
      }
      o.frontExtra(ctx, x, w, surfaceY, groundY, t, seed, wave);
    }
  }
  const baseWater = A.water;
  A.water = function (ctx, x, w, surfaceY, groundY, t, front, theme) {
    if (typeof theme === 'string' && has(WATER, theme)) {
      if (!(w > 0)) return;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, -100, w, H + 200); ctx.clip();
      themedWater(ctx, WATER[theme], x, w, surfaceY, groundY, t || 0, front);
      ctx.restore();
    } else baseWater(ctx, x, w, surfaceY, groundY, t, front);
  };

  // ================================================================ weather (screen space, over everything)
  const WEATHER = {
    // gentle falling snow: small far flakes and a few bigger near ones
    alps(ctx, camX, t) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      for (let i = 0; i < 64; i++) {
        const near = i < 16, f = near ? 0.6 : 0.3, sp = near ? 62 : 34;
        const r = near ? 2.4 + hash(i + 3) * 1.3 : 1.1 + hash(i + 3) * 1.1;
        const x = mod(hash(i) * (W + 60) - camX * f + Math.sin(t * 0.9 + i * 1.3) * 16, W + 60) - 30;
        const y = mod(hash(i + 1) * (H + 30) + t * sp * (0.8 + hash(i + 2) * 0.4), H + 30) - 15;
        circ(ctx, x, y, r);
      }
      ctx.fill();
    },
    // slow banks of sea mist drifting past, and flecks of spray
    tasmania(ctx, camX, t) {
      ctx.fillStyle = 'rgba(232,240,244,0.09)';
      for (let i = 0; i < 4; i++) {
        const x = mod(i * 380 - camX * 0.5 - t * (10 + i * 4), W + 700) - 350, y = 200 + i * 70 + Math.sin(t * 0.3 + i) * 12;
        ctx.beginPath(); ell(ctx, x, y, 280, 30, 0); ell(ctx, x + 140, y + 12, 200, 22, 0); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      for (let i = 0; i < 22; i++) {
        const k = mod(t * 0.22 + hash(i), 1);
        const x = mod(hash(i + 1) * W - camX * 0.5 + k * 90, W + 40) - 20, y = H - 70 - k * 240 + Math.sin(t + i) * 6;
        circ(ctx, x, y, 1 + hash(i + 2) * 1.2);
      }
      ctx.fill();
    },
    // glowing embers floating up
    rift(ctx, camX, t) {
      const cols = ['#ffd27a', '#ff8a3d', '#ffb347'];
      ctx.globalAlpha = 0.8;
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = cols[c];
        ctx.beginPath();
        for (let i = c; i < 33; i += 3) {
          const k = mod(t * (0.05 + hash(i + 2) * 0.05) + hash(i), 1);
          const x = mod(hash(i + 1) * (W + 40) - camX * 0.45 + Math.sin(t * 1.3 + i) * 16, W + 40) - 20, y = H + 10 - k * (H + 20);
          circ(ctx, x, y, (1.1 + hash(i + 3) * 1.5) * (0.65 + 0.35 * Math.sin(t * 6 + i)) + 0.3);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    // drips falling from the ceiling, and a few green motes floating in the air
    lair(ctx, camX, t) {
      const gy = MG.GROUND_Y;
      ctx.fillStyle = 'rgba(170,230,255,0.75)';
      ctx.beginPath();
      each(camX, 0.5, 150, 20, (sx, i) => {
        if (hash(i + 71) < 0.45) return;
        const k = mod(t * 0.5 + hash(i + 72), 1), x = sx + hash(i + 73) * 60, y = 40 + k * k * (gy - 40);
        ctx.moveTo(x, y - 7); ctx.quadraticCurveTo(x + 3.2, y, x, y + 2.5); ctx.quadraticCurveTo(x - 3.2, y, x, y - 7);
      });
      ctx.fill();
      ctx.fillStyle = 'rgba(120,255,190,0.5)';
      ctx.beginPath();
      for (let i = 0; i < 24; i++) {
        const x = mod(hash(i) * (W + 40) - camX * 0.4 + Math.sin(t * 0.4 + i) * 30, W + 40) - 20;
        const y = 80 + hash(i + 1) * 360 + Math.sin(t * 0.6 + i * 1.7) * 18;
        circ(ctx, x, y, 1 + hash(i + 2) * 1.4);
      }
      ctx.fill();
    },
  };
  A.weather = function (ctx, theme, camX, t) {
    if (typeof theme !== 'string' || !has(WEATHER, theme)) return;
    ctx.save();
    WEATHER[theme](ctx, camX || 0, t || 0);
    ctx.restore();
  };

  // ================================================================ decorations
  // d = { type, x, ... } in world space (the camera is already applied). d.x is the centre.
  // Each stays within d.x ± (d.w / 2 + 260), so the campaign's visibility check never cuts one off.
  const DECOR = {};

  // ---- the Alps and Tasmania
  // a snow gum: twisting stems with streaky white, cream and red-brown bark, grey-green leaves.
  // d.h (220); d.snow: false for no snow on it
  DECOR.snowgum = function (ctx, d, gy, t) {
    const x = d.x, s = (d.h || 220) / 220, snow = d.snow !== false;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (snow) { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(110,140,180,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); cap(ctx, x, gy + 3, 62 * s, 13 * s); ctx.fill(); ctx.stroke(); }
    const stems = [
      [x - 8 * s, gy, x - 46 * s, gy - 84 * s, x - 34 * s, gy - 160 * s, 24 * s, 9 * s],
      [x + 6 * s, gy, x + 40 * s, gy - 70 * s, x + 50 * s, gy - 146 * s, 22 * s, 8 * s],
      [x, gy, x + 14 * s, gy - 120 * s, x - 4 * s, gy - 196 * s, 26 * s, 10 * s],
    ];
    const branches = [
      [x - 32 * s, gy - 122 * s, x - 62 * s, gy - 130 * s, x - 80 * s, gy - 160 * s, 9 * s, 4 * s],
      [x + 40 * s, gy - 112 * s, x + 72 * s, gy - 116 * s, x + 86 * s, gy - 150 * s, 8 * s, 4 * s],
      [x + 4 * s, gy - 150 * s, x + 26 * s, gy - 170 * s, x + 24 * s, gy - 200 * s, 8 * s, 3.5 * s],
    ];
    ctx.fillStyle = '#eee8dc'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    for (const b of branches.concat(stems)) { A.taper(ctx, b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]); ctx.fill(); ctx.stroke(); }
    // the colourful "scribbly" streaks snow gum bark is known for
    const streak = ['rgba(201,150,90,0.8)', 'rgba(140,165,100,0.65)', 'rgba(205,105,75,0.65)', 'rgba(140,140,165,0.65)'];
    ctx.lineWidth = 2.2 * s;
    stems.forEach((st, j) => {
      for (let k = 0; k < 5; k++) {
        const q = 0.12 + k * 0.17, m = 1 - q;
        const px = m * m * st[0] + 2 * m * q * st[2] + q * q * st[4], py = m * m * st[1] + 2 * m * q * st[3] + q * q * st[5];
        ctx.strokeStyle = streak[(j + k) % 4];
        ctx.beginPath(); ctx.moveTo(px - 5 * s, py + 6 * s); ctx.quadraticCurveTo(px + (k % 2 ? 3 : -3) * s, py, px + 3 * s, py - 9 * s); ctx.stroke();
      }
    });
    const sway = Math.sin(t * 0.8 + x) * 2;
    const clumps = [[-80, -166, 26], [-48, -182, 30], [-10, -212, 32], [26, -206, 28], [58, -172, 30], [88, -156, 22], [-26, -152, 22], [32, -150, 20]];
    ctx.fillStyle = '#6f8f6a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); for (const [bx, by, r] of clumps) circ(ctx, x + bx * s + sway, gy + by * s, r * s); ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#8dac82';
    ctx.beginPath(); for (const [bx, by, r] of clumps) circ(ctx, x + (bx - 4) * s + sway, gy + (by - 6) * s, r * 0.62 * s); ctx.fill();
    ctx.fillStyle = '#5d7d5a';
    ctx.beginPath(); for (const [bx, by, r] of clumps) ell(ctx, x + (bx + r * 0.4) * s + sway, gy + (by + r * 0.75) * s, 2.5 * s, 7 * s, 0.3); ctx.fill();
    if (snow) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); for (const [bx, by, r] of clumps) cap(ctx, x + bx * s + sway, gy + (by - r * 0.42) * s, r * 0.85 * s, r * 0.45 * s); ctx.fill();
    }
  };

  // an alpine hut: timber slab walls, a stone chimney puffing smoke, a red iron roof under snow,
  // skis leaning by the door and a woodpile. d.w (200); d.snow: false for none
  DECOR.hut = function (ctx, d, gy, t) {
    const w = Math.max(140, d.w || 200), h = 96, x0 = d.x - w / 2, snow = d.snow !== false;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const cx = x0 + 10;
    smoke(ctx, cx + 14, gy - h - 66, t, 5, 9, '235,238,242', 0.75, 70);
    ctx.fillStyle = '#8d8a84'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(cx, gy - h - 62, 28, h + 62); ctx.strokeRect(cx, gy - h - 62, 28, h + 62);
    ctx.strokeStyle = 'rgba(43,26,20,0.4)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let y = gy - h - 52, r = 0; y < gy; y += 12, r++) { ctx.moveTo(cx + 1, y); ctx.lineTo(cx + 27, y); const vx = cx + (r % 2 ? 9 : 18); ctx.moveTo(vx, y); ctx.lineTo(vx, y + 12); } ctx.stroke();
    // walls, door and a warm window
    ctx.fillStyle = '#9a7552'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(x0 + 34, gy - h, w - 38, h); ctx.strokeRect(x0 + 34, gy - h, w - 38, h);
    ctx.strokeStyle = 'rgba(60,35,15,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let y = gy - h + 12; y < gy - 2; y += 12) { ctx.moveTo(x0 + 36, y); ctx.lineTo(x0 + w - 6, y + ((y / 12) % 2 ? 1 : -1)); } ctx.stroke();
    const dx = x0 + w * 0.62;
    ctx.fillStyle = '#3d5a40'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(dx, gy - 70, 34, 70); ctx.strokeRect(dx, gy - 70, 34, 70);
    A.oval(ctx, dx + 27, gy - 36, 2.5, 2.5, 0, '#ffd23f');
    const wx = x0 + 52;
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(wx, gy - 74, 36, 28); ctx.strokeRect(wx, gy - 74, 36, 28);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + 18, gy - 74); ctx.lineTo(wx + 18, gy - 46); ctx.moveTo(wx, gy - 60); ctx.lineTo(wx + 36, gy - 60); ctx.stroke();
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(wx - 4, gy - 46, 44, 4);
    // a woodpile under the window
    for (let r = 0; r < 3; r++) for (let j = 0; j < 4 - r; j++) A.oval(ctx, wx + 4 + j * 10 + r * 5, gy - 6 - r * 9, 5, 4.5, 0, '#c9965a', LINE, 1.5);
    // skis leaning by the door
    for (const [ox, col] of [[0, '#e63946'], [9, '#3a86ff']]) {
      ctx.save(); ctx.translate(dx + 46 + ox, gy); ctx.rotate(0.18);
      ctx.fillStyle = col; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-3, -78, 6, 78, 3); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // the roof
    ctx.fillStyle = '#b5483a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0 + 22, gy - h + 4); ctx.lineTo(x0 + 38, gy - h - 34); ctx.lineTo(x0 + w - 6, gy - h - 34); ctx.lineTo(x0 + w + 12, gy - h + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,15,10,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let x = x0 + 34; x < x0 + w + 4; x += 8) { ctx.moveTo(x - 10, gy - h + 2); ctx.lineTo(x + 4 + (x - x0) * 0.04, gy - h - 32); } ctx.stroke();
    if (snow) {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(110,140,180,0.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0 + 26, gy - h - 6);
      for (let j = 0; j <= 10; j++) { const px = lerp(x0 + 34, x0 + w - 2, j / 10); ctx.quadraticCurveTo(px - 6, gy - h - 46 - (j % 2) * 3, px, gy - h - 38); }
      ctx.lineTo(x0 + w + 6, gy - h - 4);
      for (let j = 10; j >= 0; j--) { const px = lerp(x0 + 30, x0 + w + 4, j / 10); ctx.lineTo(px, gy - h - 8 + (j % 3 === 0 ? 6 : 0)); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      snowTop(ctx, x0 + 26, x0 + w + 6, gy - h + 2, 7);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); cap(ctx, cx + 14, gy - h - 62, 18, 6); ctx.fill();
      ctx.fillStyle = '#f6f9fd'; ctx.strokeStyle = 'rgba(110,140,180,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); cap(ctx, x0 + w * 0.3, gy + 3, w * 0.36, 10); cap(ctx, x0 + w - 4, gy + 3, 26, 12); ctx.fill(); ctx.stroke();
    }
  };

  // a rocky outcrop: stacked rock columns with orange lichen, grass (or snow) on top. d.w (260), d.h (200), d.snow
  DECOR.cliff = function (ctx, d, gy, t) {
    const w = d.w || 260, h = d.h || 200, x0 = d.x - w / 2, seed = Math.round(d.x);
    const top = [[0, 0], [0.04, 0.42], [0.1, 0.5], [0.13, 0.8], [0.22, 0.92], [0.3, 0.9], [0.38, 1], [0.55, 0.97], [0.62, 0.86], [0.7, 0.9], [0.8, 0.78], [0.86, 0.55], [0.94, 0.48], [1, 0]];
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#6d6862'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0, gy);
    for (const [px, py] of top) ctx.lineTo(x0 + px * w, gy - py * h);
    ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    const cols = Math.max(4, Math.round(w / 30)), cw = w / cols;
    for (let j = 0; j < cols; j++) {
      const cx = x0 + j * cw;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.06 + hash(seed + j) * 0.1).toFixed(3) + ')';
      ctx.fillRect(cx + 2, gy - h, cw * 0.45, h);
    }
    ctx.strokeStyle = 'rgba(30,25,20,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let j = 1; j < cols; j++) { const cx = x0 + j * cw + (hash(seed + j * 3) - 0.5) * 4; ctx.moveTo(cx, gy - h); ctx.lineTo(cx + 2, gy); }
    for (let j = 0; j < cols; j++) { const cx = x0 + j * cw, cy = gy - h * (0.2 + hash(seed + j * 7) * 0.6); ctx.moveTo(cx, cy); ctx.lineTo(cx + cw, cy + 4); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,25,20,0.25)';
    ctx.beginPath(); ctx.moveTo(x0 + w * 0.6, gy - h); ctx.lineTo(x0 + w, gy - h); ctx.lineTo(x0 + w, gy); ctx.lineTo(x0 + w * 0.7, gy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(232,138,58,0.85)';
    ctx.beginPath();
    for (let j = 0; j < w / 22; j++) ell(ctx, x0 + 10 + hash(seed + j * 11) * (w - 20), gy - h * (0.15 + hash(seed + j * 13) * 0.7), 4 + hash(seed + j) * 6, 2.5 + hash(seed + j * 2) * 2, 0);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0, gy); for (const [px, py] of top) ctx.lineTo(x0 + px * w, gy - py * h); ctx.stroke();
    if (d.snow) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let j = 1; j < top.length - 2; j++) { const [ax, ay] = top[j], [bx, by] = top[j + 1]; const mx = x0 + (ax + bx) / 2 * w, my = gy - (ay + by) / 2 * h; cap(ctx, mx, my + 3, Math.abs(bx - ax) * w * 0.7 + 6, 7); }
      ctx.fill();
    } else {
      ctx.strokeStyle = '#a69c56'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 2; j < top.length - 2; j += 2) {
        const tx = x0 + top[j][0] * w, ty = gy - top[j][1] * h;
        for (let k = -3; k <= 3; k++) { ctx.moveTo(tx + k * 1.5, ty + 2); ctx.quadraticCurveTo(tx + k * 3, ty - 8, tx + k * 6, ty - 11 + Math.abs(k) * 2); }
      }
      ctx.stroke();
    }
    for (const [bx, r] of [[0.06, 16], [0.14, 10], [0.9, 20], [0.98, 11]]) {
      A.oval(ctx, x0 + w * bx, gy - r * 0.6, r, r * 0.75, 0, '#5f5a55', LINE, 2);
      A.oval(ctx, x0 + w * bx - r * 0.3, gy - r * 0.9, r * 0.35, r * 0.18, 0, 'rgba(255,255,255,0.25)');
    }
  };

  // a big clump of button grass: a tussock of thin blades and tall stalks with round seed "buttons"
  DECOR.buttongrass = function (ctx, d, gy, t) {
    const x = d.x, s = d.s || 1;
    ctx.lineCap = 'round';
    ['#7f7a3a', '#a39a52', '#c4b872'].forEach((col, c) => {
      ctx.strokeStyle = col; ctx.lineWidth = (2.6 - c * 0.4) * s;
      ctx.beginPath();
      for (let j = -9 + c; j <= 9; j += 3) {
        const L = (30 + (9 - Math.abs(j)) * 3.4) * s, sw = Math.sin(t * 1.2 + j) * 1.5;
        ctx.moveTo(x + j * 1.6 * s, gy); ctx.quadraticCurveTo(x + j * 4 * s, gy - L * 0.8, x + j * 8 * s + sw, gy - L + Math.abs(j) * 2.4 * s);
      }
      ctx.stroke();
    });
    const stalks = [[-14, 74], [-6, 88], [2, 96], [9, 84], [16, 70], [-20, 60], [22, 62]];
    ctx.strokeStyle = '#6a5a34'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    for (const [dx, hh] of stalks) { const sw = Math.sin(t * 1.1 + dx) * 2; ctx.moveTo(x + dx * 0.4 * s, gy); ctx.quadraticCurveTo(x + dx * 0.8 * s, gy - hh * 0.5 * s, x + dx * s + sw, gy - hh * s); }
    ctx.stroke();
    for (const [dx, hh] of stalks) { const sw = Math.sin(t * 1.1 + dx) * 2; A.oval(ctx, x + dx * s + sw, gy - hh * s, 4 * s, 4 * s, 0, '#5a4430', LINE, 1.2); A.oval(ctx, x + dx * s + sw - 1.2 * s, gy - (hh + 1.2) * s, 1.3 * s, 1.3 * s, 0, 'rgba(255,240,200,0.6)'); }
    if (d.snow) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); cap(ctx, x, gy + 3, 30 * s, 8 * s); ctx.fill(); }
  };

  // ---- the City
  const BUILD = ['#c46a4a', '#d9a066', '#8fa3b8', '#b58db6', '#7fa88a', '#e3c58a'];
  // a building front: cornice, rows of windows (some lit, some with flower boxes), a shop with an awning
  // at street level and something on the roof. d.w (200), d.h (280), d.color
  DECOR.building = function (ctx, d, gy, t) {
    const w = Math.max(100, d.w || 200), h = Math.max(140, d.h || 280), x0 = d.x - w / 2, top = gy - h, seed = Math.round(d.x);
    const col = d.color || BUILD[Math.floor(hash(seed * 0.01) * BUILD.length)];
    ctx.lineJoin = 'round';
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    if (hash(seed + 1) < 0.5) {
      // a rooftop water tank on legs
      const tx = x0 + w * 0.7;
      ctx.strokeStyle = LINE; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tx - 14, top); ctx.lineTo(tx - 12, top - 22); ctx.moveTo(tx + 14, top); ctx.lineTo(tx + 12, top - 22); ctx.stroke();
      ctx.fillStyle = '#9a6a44'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(tx - 18, top - 52, 36, 32, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7a5032'; ctx.beginPath(); ctx.moveTo(tx - 20, top - 52); ctx.lineTo(tx, top - 64); ctx.lineTo(tx + 20, top - 52); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.strokeStyle = '#4a4e57'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + w * 0.25, top); ctx.lineTo(x0 + w * 0.25, top - 40); ctx.moveTo(x0 + w * 0.25 - 12, top - 32); ctx.lineTo(x0 + w * 0.25 + 12, top - 32); ctx.moveTo(x0 + w * 0.25 - 8, top - 24); ctx.lineTo(x0 + w * 0.25 + 8, top - 24); ctx.stroke();
      ctx.fillStyle = '#c9ccd2'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillRect(x0 + w * 0.6, top - 18, 34, 18); ctx.strokeRect(x0 + w * 0.6, top - 18, 34, 18);
      A.oval(ctx, x0 + w * 0.6 + 12, top - 9, 6, 6, 0, '#8a8f99', LINE, 1.5);
    }
    ctx.fillStyle = col; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(x0, top, w, h); ctx.strokeRect(x0, top, w, h);
    ctx.strokeStyle = 'rgba(60,30,20,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let y = top + 22; y < gy - 70; y += 8) { ctx.moveTo(x0 + 2, y); ctx.lineTo(x0 + w - 2, y); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.fillRect(x0 - 5, top, w + 10, 10); ctx.strokeRect(x0 - 5, top, w + 10, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x0, top + 10, w, 6);
    // the windows
    const cols = Math.max(2, Math.floor((w - 20) / 46)), rows = Math.max(1, Math.floor((h - 112) / 56));
    const gapX = (w - cols * 30) / (cols + 1);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const wx = x0 + gapX + c * (30 + gapX), wy = top + 30 + r * 56, k = hash(seed + r * 7 + c * 13);
      ctx.fillStyle = '#f4f1e8'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillRect(wx - 3, wy - 3, 36, 44); ctx.strokeRect(wx - 3, wy - 3, 36, 44);
      ctx.fillStyle = k < 0.3 ? '#ffe9a0' : '#8fb8d8'; ctx.fillRect(wx, wy, 30, 38);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.moveTo(wx + 4, wy + 30); ctx.lineTo(wx + 18, wy + 4); ctx.lineTo(wx + 24, wy + 4); ctx.lineTo(wx + 10, wy + 30); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f4f1e8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx, wy + 19); ctx.lineTo(wx + 30, wy + 19); ctx.stroke();
      if (k > 0.75) { ctx.fillStyle = '#ff8fab'; ctx.fillRect(wx, wy, 9, 38); ctx.fillRect(wx + 21, wy, 9, 38); }
      if (k > 0.45 && k < 0.65) {
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(wx - 4, wy + 38, 38, 7);
        ctx.fillStyle = '#4f9a4a'; ctx.beginPath(); for (let j = 0; j < 5; j++) circ(ctx, wx - 1 + j * 8, wy + 37, 4); ctx.fill();
        ctx.fillStyle = '#e63946'; ctx.beginPath(); for (let j = 0; j < 4; j++) circ(ctx, wx + 3 + j * 8, wy + 34, 2); ctx.fill();
      }
    }
    // the shop at street level
    const awn = AWNING[Math.floor(hash(seed + 2) * AWNING.length)], sw = Math.max(40, w - 86);
    ctx.fillStyle = '#3d4a5a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(x0 + 12, gy - 58, sw, 50); ctx.strokeRect(x0 + 12, gy - 58, sw, 50);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0 + 16, gy - 54, sw * 0.25, 42);
    ctx.fillStyle = '#7a5a4a'; ctx.fillRect(x0 + 12, gy - 8, sw, 8); ctx.strokeRect(x0 + 12, gy - 8, sw, 8);
    ctx.fillStyle = '#2b2d42'; ctx.fillRect(x0 + w - 56, gy - 64, 36, 64); ctx.strokeRect(x0 + w - 56, gy - 64, 36, 64);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x0 + w - 50, gy - 58, 24, 20);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0 + 6, gy - 82, sw + 12, 16);
    for (let j = 0; j < Math.ceil((sw + 12) / 14); j++) ctx.arc(x0 + 13 + j * 14, gy - 66, 7, 0, Math.PI);
    ctx.clip();
    for (let j = 0; j < Math.ceil((sw + 12) / 14); j++) { ctx.fillStyle = j % 2 ? '#ffffff' : awn; ctx.fillRect(x0 + 6 + j * 14, gy - 82, 14, 26); }
    ctx.restore();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.strokeRect(x0 + 6, gy - 82, sw + 12, 16);
  };

  // a green wheelie bin with a yellow lid (flies optional: d.flies)
  DECOR.bin = function (ctx, d, gy, t) {
    const x = d.x;
    ctx.save(); ctx.translate(x, gy);
    if (d.facing === -1) ctx.scale(-1, 1);
    ctx.lineJoin = 'round';
    A.shadow(ctx, 0, -2, 20);
    ctx.fillStyle = '#2d6a4f'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-17, -56); ctx.lineTo(17, -56); ctx.lineTo(14, -3); ctx.lineTo(-14, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (const vx of [-8, 0, 8]) { ctx.moveTo(vx, -50); ctx.lineTo(vx * 0.85, -8); } ctx.stroke();
    ctx.fillStyle = '#f4f1e8'; ctx.fillRect(-7, -40, 14, 9);
    A.oval(ctx, -13, -4, 6.5, 6.5, 0, '#22252b', LINE, 2); A.oval(ctx, -13, -4, 2.2, 2.2, 0, '#8a8f99');
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(-20, -64, 40, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b2d42'; ctx.fillRect(14, -62, 8, 4);
    ctx.restore();
    if (d.flies || hash(Math.round(x) * 0.17) < 0.35) {
      ctx.fillStyle = LINE;
      for (let j = 0; j < 2; j++) { const a = t * (5 + j) + j * 3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 12, gy - 76 + Math.sin(a * 1.3) * 6, 1.6, 0, TAU); ctx.fill(); }
    }
  };

  // an old-fashioned street lamp on a curved arm, softly glowing. d.h (190)
  DECOR.streetlight = function (ctx, d, gy, t) {
    const x = d.x, h = d.h || 190;
    glowSpot(ctx, x + 34, gy - h + 16, 70, '255,230,150', 0.28);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const arm = () => { ctx.beginPath(); ctx.moveTo(x, gy - 18); ctx.lineTo(x, gy - h + 10); ctx.quadraticCurveTo(x, gy - h - 6, x + 18, gy - h - 4); ctx.quadraticCurveTo(x + 32, gy - h - 2, x + 34, gy - h + 6); };
    arm(); ctx.strokeStyle = LINE; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#2f4f4a'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#2f4f4a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x - 9, gy - 24, 18, 24, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 22, gy - h + 14); ctx.lineTo(x + 26, gy - h + 4); ctx.lineTo(x + 42, gy - h + 4); ctx.lineTo(x + 46, gy - h + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, x + 34, gy - h + 18, 7, 5, 0, '#fff3b0', LINE, 1.5);
  };

  // an alley between two brick buildings: bins, a fire escape, string lights and a puddle. d.w (150), d.h (260)
  DECOR.laneway = function (ctx, d, gy, t) {
    const w = Math.max(110, d.w || 150), h = d.h || 260, x0 = d.x - w / 2, top = gy - h, wall = Math.round(w * 0.2);
    const ix0 = x0 + wall, ix1 = x0 + w - wall, iw = ix1 - ix0;
    const fx0 = ix0 + iw * 0.28, fx1 = ix1 - iw * 0.28, fy = gy - 34;
    ctx.lineJoin = 'round';
    // the far wall with a door and a lamp
    ctx.fillStyle = '#6a5a62'; ctx.fillRect(ix0, top, iw, h);
    ctx.fillStyle = '#4a3a40'; ctx.fillRect(fx0 + (fx1 - fx0) * 0.3, fy - 44, (fx1 - fx0) * 0.4, 44);
    glowSpot(ctx, (fx0 + fx1) / 2, fy - 54, 40, '255,220,140', 0.45);
    // side walls in perspective, and the floor
    ctx.fillStyle = '#7a4234';
    ctx.beginPath(); ctx.moveTo(ix0, top); ctx.lineTo(fx0, top + 30); ctx.lineTo(fx0, fy); ctx.lineTo(ix0, gy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5e3229';
    ctx.beginPath(); ctx.moveTo(ix1, top); ctx.lineTo(fx1, top + 30); ctx.lineTo(fx1, fy); ctx.lineTo(ix1, gy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4550';
    ctx.beginPath(); ctx.moveTo(ix0, gy); ctx.lineTo(fx0, fy); ctx.lineTo(fx1, fy); ctx.lineTo(ix1, gy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,15,20,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let k = 1; k < 5; k++) { const q = k / 5, y = lerp(gy, fy, q); ctx.moveTo(lerp(ix0, fx0, q), y); ctx.lineTo(lerp(ix1, fx1, q), y); } ctx.stroke();
    A.oval(ctx, (ix0 + ix1) / 2 + 6, gy - 8, iw * 0.22, 3.5, 0, 'rgba(150,200,240,0.55)');
    // the fire escape zigzagging up the left side wall
    ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0, ly = gy - 70; ly > top + 40; ly -= 56, k++) {
      ctx.moveTo(ix0 + 2, ly); ctx.lineTo(fx0 - 2, ly + 10);
      ctx.moveTo(ix0 + 2, ly - 10); ctx.lineTo(fx0 - 2, ly);
      for (let j = 0; j <= 3; j++) { const px = lerp(ix0 + 2, fx0 - 2, j / 3); ctx.moveTo(px, ly + j * 3.3); ctx.lineTo(px, ly - 10 + j * 3.3); }
      if (ly - 56 > top + 40) { const sx0 = k % 2 ? ix0 + 4 : fx0 - 4, sx1 = k % 2 ? fx0 - 4 : ix0 + 4; ctx.moveTo(sx0, ly - 2); ctx.lineTo(sx1, ly - 56); }
    }
    ctx.stroke();
    // bins and a rubbish bag
    ctx.save(); ctx.translate(fx1 - 4, fy + 14); ctx.scale(0.55, 0.55); DECOR.bin(ctx, { x: 0, flies: false }, 0, t); ctx.restore();
    A.oval(ctx, fx0 + 14, fy + 18, 12, 9, 0, '#2b2d42', LINE, 1.5);
    ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx0 + 12, fy + 9); ctx.lineTo(fx0 + 16, fy + 4); ctx.stroke();
    // string lights across the top
    ctx.strokeStyle = 'rgba(30,25,30,0.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(ix0, top + 40); ctx.quadraticCurveTo((ix0 + ix1) / 2, top + 66, ix1, top + 40); ctx.stroke();
    for (let j = 1; j < 8; j++) {
      const q = j / 8, m = 1 - q, bx = m * m * ix0 + 2 * m * q * (ix0 + ix1) / 2 + q * q * ix1, by = m * m * (top + 40) + 2 * m * q * (top + 66) + q * q * (top + 40);
      const on = Math.sin(t * 3 + j * 1.7) > -0.6;
      A.oval(ctx, bx, by + 4, 3, 4, 0, on ? ['#ffd23f', '#ff8fab', '#9ef01a', '#4cc9f0'][j % 4] : '#6a6470');
    }
    // the brick building edges framing it
    for (const [wx, shade] of [[x0, 0], [ix1, 1]]) {
      ctx.fillStyle = shade ? '#a8583f' : '#b5654a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.fillRect(wx, top - 10, wall, h + 10); ctx.strokeRect(wx, top - 10, wall, h + 10);
      ctx.strokeStyle = 'rgba(60,20,10,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = top - 2, r = 0; y < gy; y += 8, r++) { ctx.moveTo(wx + 1, y); ctx.lineTo(wx + wall - 1, y); for (let bx = wx + (r % 2 ? 6 : 12); bx < wx + wall - 2; bx += 14) { ctx.moveTo(bx, y); ctx.lineTo(bx, y + 8); } }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(ix0, top - 10, 5, h + 10);
  };

  // a cheerful billboard on legs with a sunburst; d.text is painted on it (otherwise a big smiley). d.w (240)
  DECOR.billboard = function (ctx, d, gy, t) {
    const bw = Math.max(140, d.w || 240), bh = 110, x0 = d.x - bw / 2, by = gy - 290;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = LINE; ctx.lineWidth = 7;
    const legs = () => { ctx.beginPath(); for (const lx of [x0 + bw * 0.25, x0 + bw * 0.75]) { ctx.moveTo(lx, gy); ctx.lineTo(lx, by + bh); } ctx.moveTo(x0 + bw * 0.25, gy - 60); ctx.lineTo(x0 + bw * 0.75, by + bh + 20); ctx.moveTo(x0 + bw * 0.75, gy - 60); ctx.lineTo(x0 + bw * 0.25, by + bh + 20); };
    legs(); ctx.stroke();
    ctx.strokeStyle = '#5c6470'; ctx.lineWidth = 4; ctx.stroke();
    // the catwalk and lamps
    ctx.fillStyle = '#5c6470'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.fillRect(x0 + 6, by + bh + 4, bw - 12, 5); ctx.strokeRect(x0 + 6, by + bh + 4, bw - 12, 5);
    for (let j = 0; j < 3; j++) { const lx = x0 + bw * (0.2 + j * 0.3); ctx.beginPath(); ctx.moveTo(lx, by + bh + 4); ctx.lineTo(lx + 4, by + bh - 4); ctx.stroke(); }
    // the board
    ctx.fillStyle = '#f4f1e8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x0, by, bw, bh, 6); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.rect(x0 + 7, by + 7, bw - 14, bh - 14); ctx.clip();
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x0 + 7, by + 7, bw - 14, bh - 14);
    ctx.fillStyle = '#ffb703';
    const cx = d.x, cy = by + bh / 2;
    ctx.beginPath();
    for (let j = 0; j < 16; j++) { const a = (j / 16) * TAU + t * 0.15; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - 0.09) * bw, cy + Math.sin(a - 0.09) * bw); ctx.lineTo(cx + Math.cos(a + 0.09) * bw, cy + Math.sin(a + 0.09) * bw); ctx.closePath(); }
    ctx.fill();
    ctx.restore();
    if (d.text) {
      let lines = [String(d.text)];
      const str = lines[0];
      if (str.length > 14 && str.indexOf(' ') > 0) {
        let best = -1;
        for (let i = 0; i < str.length; i++) if (str[i] === ' ' && (best < 0 || Math.abs(i - str.length / 2) < Math.abs(best - str.length / 2))) best = i;
        lines = [str.slice(0, best), str.slice(best + 1)];
      }
      lines.forEach((ln, i) => fitText(ctx, ln, cx, cy + (i - (lines.length - 1) / 2) * 30, bw - 30, 28, '#ffffff', '#c1121f'));
    } else {
      A.oval(ctx, cx, cy, 34, 34, 0, '#fff3b0', LINE, 3);
      smiley(ctx, cx, cy + 2, 30);
      for (const sx of [-1, 1]) { A.star(ctx, cx + sx * 70, cy - 16, 11, '#ffffff'); A.star(ctx, cx + sx * 92, cy + 20, 8, '#ffffff'); }
    }
  };

  // ---- the Time Rift
  // a giant tree fern: a shaggy trunk and a crown of huge arching fronds. d.h (240)
  DECOR.fern = function (ctx, d, gy, t) {
    const x = d.x, h = d.h || 240, s = h / 240;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const tx = x + 4 * s, ty = gy - h;
    ctx.fillStyle = '#5a3e2a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    A.taper(ctx, x, gy + 2, x - 10 * s, gy - h * 0.5, tx, ty, 32 * s, 22 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3e2a1c';
    ctx.beginPath();
    for (let y = gy - 14 * s, k = 0; y > ty + 10 * s; y -= 13 * s, k++) {
      const q = (gy - y) / h, cx = lerp(x, tx, q) - Math.sin(q * Math.PI) * 6 * s, hw = lerp(16, 11, q) * s;
      for (const side of [-1, 1]) { const ex = cx + side * hw * (k % 2 ? 0.3 : 0.75); ctx.moveTo(ex - 4 * s, y); ctx.lineTo(ex + side * 7 * s, y - 9 * s); ctx.lineTo(ex + 4 * s, y + 1); ctx.closePath(); }
    }
    ctx.fill();
    // the fronds, back ones darker
    const fr = [];
    for (let j = 0; j < 10; j++) {
      const a = -Math.PI / 2 + (j - 4.5) * 0.34 + Math.sin(t * 0.7 + j) * 0.02, L = (100 + hash(x + j) * 30) * s;
      fr.push([a, tx + Math.cos(a) * L * 0.7, ty + Math.sin(a) * L * 0.75, tx + Math.cos(a) * L * 1.35, ty + Math.sin(a) * L * 0.25 + L * 0.55, j]);
    }
    const leaflets = (dx, dy, grow) => {
      ctx.beginPath();
      for (const [, cx, cy, ex, ey] of fr) {
        for (let k = 0.14; k < 0.97; k += 0.12) {
          const m = 1 - k, px = m * m * tx + 2 * m * k * cx + k * k * ex, py = m * m * ty + 2 * m * k * cy + k * k * ey;
          const ddx = 2 * m * (cx - tx) + 2 * k * (ex - cx), ddy = 2 * m * (cy - ty) + 2 * k * (ey - cy), ang = Math.atan2(ddy, ddx);
          const ll = ((1 - k) * 12 + 4.5) * s;
          for (const side of [-1, 1]) { const la = ang + side * 1.25; ell(ctx, px + Math.cos(la) * ll * 0.9 + dx, py + Math.sin(la) * ll * 0.9 + dy, ll + grow, ll * 0.34 + grow, la); }
        }
      }
      ctx.fill();
    };
    ctx.fillStyle = LINE; leaflets(0, 0, 1.4);
    ctx.fillStyle = '#4a9638'; leaflets(0, 0, 0);
    ctx.strokeStyle = '#2e5a24'; ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); for (const [, cx, cy, ex, ey] of fr) { ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx, cy, ex, ey); } ctx.stroke();
    // a new frond uncurling in the middle
    ctx.strokeStyle = LINE; ctx.lineWidth = 6 * s;
    const fh = ty - 26 * s;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + 2 * s, ty - 14 * s, tx + 4 * s, fh); ctx.arc(tx + 10 * s, fh, 6 * s, Math.PI, Math.PI * 2.7); ctx.stroke();
    ctx.strokeStyle = '#7ab84a'; ctx.lineWidth = 3.5 * s; ctx.stroke();
  };

  // a small smoking volcano with glowing lava streams and a few blobs of lava. d.w (300)
  DECOR.volcano = function (ctx, d, gy, t) {
    const w = d.w || 300, s = w / 300, h = 180 * s, x = d.x, cw = 30 * s, seed = Math.round(x);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    smoke(ctx, x, gy - h - 10 * s, t, 7, 22 * s, '110,90,100', 0.6, 170 * s);
    const glow = 0.7 + 0.3 * Math.sin(t * 3 + seed);
    glowSpot(ctx, x, gy - h, 70 * s, '255,140,60', 0.35 * glow);
    ctx.fillStyle = '#6a4a46'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - w / 2, gy + 2); ctx.quadraticCurveTo(x - w * 0.18, gy - h * 0.35, x - cw, gy - h); ctx.lineTo(x + cw, gy - h); ctx.quadraticCurveTo(x + w * 0.18, gy - h * 0.35, x + w / 2, gy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,200,0.12)';
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 10, gy); ctx.quadraticCurveTo(x - w * 0.18, gy - h * 0.35, x - cw + 4, gy - h + 4); ctx.lineTo(x - cw * 0.2, gy - h + 4); ctx.quadraticCurveTo(x - w * 0.08, gy - h * 0.4, x - w * 0.22, gy); ctx.closePath(); ctx.fill();
    // lava streams
    const streams = [[-0.3, -0.75, 0.62], [0.2, 0.6, 0.45], [-0.05, -0.15, 0.88]];
    for (const [a, b, k] of streams) {
      ctx.beginPath(); ctx.moveTo(x + a * cw * 2, gy - h + 3); ctx.quadraticCurveTo(x + b * w * 0.2, gy - h * (1 - k * 0.5), x + b * w * 0.36, gy - h * (1 - k));
      ctx.strokeStyle = LINE; ctx.lineWidth = 9 * s; ctx.stroke();
      ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 6 * s; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,230,120,' + (0.6 * glow).toFixed(3) + ')'; ctx.lineWidth = 2.5 * s; ctx.stroke();
    }
    A.oval(ctx, x, gy - h, cw, 7 * s, 0, '#ffb347', LINE, 2.5);
    A.oval(ctx, x, gy - h + 1, cw * 0.7, 4 * s, 0, 'rgba(255,240,150,' + glow.toFixed(3) + ')');
    for (let j = 0; j < 3; j++) {
      const k = mod(t * 0.55 + j / 3 + hash(seed + j), 1), dir = j % 2 ? 1 : -1;
      if (k > 0.85) continue;
      A.oval(ctx, x + dir * k * (50 + j * 16) * s, gy - h - Math.sin(k * Math.PI) * (70 + j * 14) * s + k * k * 40 * s, 5 * s, 5 * s, 0, '#ff8a3a', LINE, 1.5);
    }
    for (const [bx, r] of [[-0.42, 16], [-0.32, 10], [0.4, 18], [0.48, 10]]) A.oval(ctx, x + bx * w, gy - r * 0.5, r * s, r * 0.7 * s, 0, '#4a3a36', LINE, 2);
  };

  // a glowing purple tear in time hanging over a cracked patch of ground, with rocks floating round it. d.h (200)
  DECOR.riftCrack = function (ctx, d, gy, t) {
    const x = d.x, h = d.h || 200, pulse = 0.6 + 0.4 * Math.sin(t * 2.6), mid = gy - 14 - h * 0.45;
    glowSpot(ctx, x, mid, h * 0.85, '190,110,255', 0.45 * pulse);
    // the cracked ground beneath
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 70, gy + 8); ctx.lineTo(x - 40, gy + 4); ctx.lineTo(x - 26, gy + 12); ctx.lineTo(x, gy + 3); ctx.lineTo(x + 24, gy + 11); ctx.lineTo(x + 46, gy + 5); ctx.lineTo(x + 74, gy + 10);
    ctx.moveTo(x - 26, gy + 12); ctx.lineTo(x - 30, gy + 26); ctx.moveTo(x + 24, gy + 11); ctx.lineTo(x + 32, gy + 24);
    ctx.strokeStyle = 'rgba(200,140,255,' + (0.5 * pulse).toFixed(3) + ')'; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#1f0838'; ctx.lineWidth = 3; ctx.stroke();
    // the tear
    const L = [], R = [];
    for (let j = 0; j <= 12; j++) {
      const k = j / 12, py = lerp(gy - 14, gy - 14 - h, k), px = x + (j % 2 ? -7 : 6) * hash(j + 500), wd = 30 * Math.sin(Math.PI * k) * (0.85 + 0.15 * pulse) + 1;
      L.push([px - wd, py]); R.push([px + wd + (j % 3 ? 3 : -2), py]);
    }
    ctx.beginPath();
    L.forEach(([px, py], j) => (j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    for (let j = R.length - 1; j >= 0; j--) ctx.lineTo(R[j][0], R[j][1]);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(220,160,255,0.5)'; ctx.lineWidth = 12; ctx.stroke();
    ctx.fillStyle = '#1f0838'; ctx.fill();
    ctx.save(); ctx.clip();
    for (let j = 0; j < 14; j++) {
      const a = t * 0.8 + j * 0.9, r = 6 + hash(j + 520) * 26;
      A.star(ctx, x + Math.cos(a) * r * 0.8, mid + Math.sin(a) * r * 2.6, 1.8 + Math.abs(Math.sin(t * 3 + j)) * 2.2, j % 3 ? '#f3d9ff' : '#9fe8ff');
    }
    ctx.restore();
    ctx.strokeStyle = '#f2dcff'; ctx.lineWidth = 3; ctx.stroke();
    // bits of rock floating around it
    for (let j = 0; j < 5; j++) {
      const a = t * 1.1 + j * 1.26, rx = x + Math.cos(a) * (46 + j * 6), ry = mid + Math.sin(a) * h * 0.32, r = 5 + hash(j + 530) * 4;
      ctx.fillStyle = '#5a4a5a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(rx - r, ry); ctx.lineTo(rx - r * 0.3, ry - r * 0.9); ctx.lineTo(rx + r, ry - r * 0.4); ctx.lineTo(rx + r * 0.6, ry + r * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(220,170,255,0.8)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(rx - r * 0.3, ry - r * 0.9); ctx.lineTo(rx + r, ry - r * 0.4); ctx.stroke();
    }
  };

  // ---- Grin Isle
  // a quokka plush toy (round body and ears, a little smile)
  const PLUSH = ['#b0855a', '#c49a6c', '#a87a50', '#d4a373'];
  function plush(ctx, x, y, s, col, extra) {
    A.oval(ctx, x, y, 15 * s, 13 * s, 0, col, LINE, 2);
    A.oval(ctx, x, y + 2 * s, 9 * s, 8 * s, 0, '#f1dcc0');
    for (const ex of [-1, 1]) { A.oval(ctx, x + ex * 8 * s, y - 24 * s, 4.2 * s, 4.6 * s, ex * 0.3, col, LINE, 1.6); A.oval(ctx, x + ex * 8 * s, y - 24 * s, 2 * s, 2.4 * s, ex * 0.3, '#e8a3a3'); }
    A.oval(ctx, x, y - 15 * s, 12.5 * s, 10.5 * s, 0, col, LINE, 2);
    A.oval(ctx, x, y - 11 * s, 6.5 * s, 4.5 * s, 0, '#f1dcc0');
    A.oval(ctx, x - 4.5 * s, y - 17 * s, 1.6 * s, 1.9 * s, 0, LINE); A.oval(ctx, x + 4.5 * s, y - 17 * s, 1.6 * s, 1.9 * s, 0, LINE);
    A.oval(ctx, x, y - 13 * s, 2 * s, 1.4 * s, 0, LINE);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.2 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - 12 * s, 3.4 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    A.oval(ctx, x - 8 * s, y - 12 * s, 2.2 * s, 1.3 * s, 0, 'rgba(255,120,140,0.6)'); A.oval(ctx, x + 8 * s, y - 12 * s, 2.2 * s, 1.3 * s, 0, 'rgba(255,120,140,0.6)');
    if (extra === 1) { A.oval(ctx, x - 5 * s, y - 24 * s, 4 * s, 2.6 * s, 0.5, '#ff6fa0', LINE, 1); A.oval(ctx, x + 1 * s, y - 24 * s, 4 * s, 2.6 * s, -0.5, '#ff6fa0', LINE, 1); }
    if (extra === 2) { ctx.fillStyle = '#2b2d42'; ctx.beginPath(); ctx.roundRect(x - 9 * s, y - 20 * s, 7.5 * s, 4.5 * s, 2); ctx.roundRect(x + 1.5 * s, y - 20 * s, 7.5 * s, 4.5 * s, 2); ctx.fill(); ctx.fillRect(x - 2 * s, y - 19 * s, 4 * s, 1.2 * s); }
  }
  // a souvenir shop: "GRIN ISLE SOUVENIRS", smiley merch in the window, a striped awning and a postcard rack. d.w (260)
  DECOR.souvenirShop = function (ctx, d, gy, t) {
    const w = Math.max(200, d.w || 260), h = 150, x0 = d.x - w / 2, top = gy - h;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#ffc8d6'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(x0, top, w, h); ctx.strokeRect(x0, top, w, h);
    ctx.strokeStyle = 'rgba(160,60,90,0.18)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let y = top + 10; y < gy; y += 10) { ctx.moveTo(x0 + 2, y); ctx.lineTo(x0 + w - 2, y); } ctx.stroke();
    // the sign
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x0 + 8, top - 50, w - 16, 54, 10); ctx.fill(); ctx.stroke();
    fitText(ctx, 'GRIN ISLE', d.x, top - 31, w - 90, 26, '#ff4d8d', '#7a1c3c');
    fitText(ctx, 'SOUVENIRS', d.x, top - 8, w - 110, 15, '#2a9d8f');
    for (const sx of [x0 + 30, x0 + w - 30]) {
      ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 2;
      ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = j * TAU / 8 + t * 0.5; ctx.moveTo(sx + Math.cos(a) * 15, top - 24 + Math.sin(a) * 15); ctx.lineTo(sx + Math.cos(a) * 19, top - 24 + Math.sin(a) * 19); } ctx.stroke();
      A.oval(ctx, sx, top - 24, 12, 12, 0, '#ffd23f', LINE, 2); smiley(ctx, sx, top - 23, 11);
    }
    // the shop window with smiley T-shirts, mugs and a plush
    const ww = w * 0.58, wx = x0 + 14, wy = top + 42;
    ctx.fillStyle = '#bfe9f5'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(wx, wy, ww, 92); ctx.strokeRect(wx, wy, ww, 92);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(wx, wy + 62, ww, 5);
    const shirts = ['#ffd23f', '#ff8fab', '#4cc9f0'];
    for (let j = 0; j < 3; j++) {
      const sx = wx + ww * (0.2 + j * 0.3), sy = wy + 12;
      ctx.fillStyle = shirts[j]; ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx - 8, sy); ctx.lineTo(sx - 17, sy + 7); ctx.lineTo(sx - 13, sy + 13); ctx.lineTo(sx - 10, sy + 11); ctx.lineTo(sx - 10, sy + 36); ctx.lineTo(sx + 10, sy + 36); ctx.lineTo(sx + 10, sy + 11); ctx.lineTo(sx + 13, sy + 13); ctx.lineTo(sx + 17, sy + 7); ctx.lineTo(sx + 8, sy); ctx.quadraticCurveTo(sx, sy + 5, sx - 8, sy); ctx.closePath(); ctx.fill(); ctx.stroke();
      A.oval(ctx, sx, sy + 21, 6.5, 6.5, 0, '#ffffff'); smiley(ctx, sx, sy + 21, 6);
    }
    for (let j = 0; j < 2; j++) {
      const mx = wx + 16 + j * 22, my = wy + 62;
      ctx.fillStyle = j ? '#ff8fab' : '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.fillRect(mx - 7, my - 14, 14, 14); ctx.strokeRect(mx - 7, my - 14, 14, 14);
      ctx.beginPath(); ctx.arc(mx + 8, my - 7, 4, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      smiley(ctx, mx, my - 7, 4.5);
    }
    plush(ctx, wx + ww - 22, wy + 58, 0.75, PLUSH[0], 1);
    // door
    const dx = x0 + w - 62;
    ctx.fillStyle = '#2ec4b6'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(dx, gy - 92, 44, 92); ctx.strokeRect(dx, gy - 92, 44, 92);
    ctx.fillStyle = '#bfe9f5'; ctx.fillRect(dx + 8, gy - 84, 28, 30); ctx.strokeRect(dx + 8, gy - 84, 28, 30);
    ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(dx + 8, gy - 64 + Math.sin(t * 2) * 1, 28, 11, 2); ctx.fill(); ctx.stroke();
    MG.UI.text(ctx, 'OPEN', dx + 22, gy - 58 + Math.sin(t * 2) * 1, 8, '#e63946', 'center');
    A.oval(ctx, dx + 36, gy - 44, 2.5, 2.5, 0, '#ffd23f');
    // the striped awning over the window and door
    ctx.save();
    const ax = x0 - 4, aw = w + 8, ay = top + 14;
    ctx.beginPath(); ctx.moveTo(ax + 6, ay - 4); ctx.lineTo(ax + aw - 6, ay - 4); ctx.lineTo(ax + aw, ay + 16); ctx.lineTo(ax, ay + 16);
    const n = Math.ceil(aw / 16);
    for (let j = 0; j < n; j++) ctx.arc(ax + 8 + j * 16, ay + 16, 8, 0, Math.PI);
    ctx.clip();
    for (let j = 0; j < n; j++) { ctx.fillStyle = j % 2 ? '#ffffff' : '#ff4d8d'; ctx.fillRect(ax + j * 16, ay - 6, 16, 32); }
    ctx.restore();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(ax, ay + 16); ctx.lineTo(ax + 6, ay - 4); ctx.lineTo(ax + aw - 6, ay - 4); ctx.lineTo(ax + aw, ay + 16); ctx.stroke();
    // a postcard rack outside
    const px = x0 + w + 26;
    ctx.strokeStyle = LINE; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, gy - 74); ctx.moveTo(px - 12, gy); ctx.lineTo(px + 12, gy); ctx.stroke();
    const cards = ['#4cc9f0', '#ffd23f', '#ff8fab', '#9ef01a', '#ffffff', '#ffb703'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const cx = px - 15 + c * 16, cy = gy - 72 + r * 20;
      ctx.fillStyle = cards[(r * 2 + c) % 6]; ctx.lineWidth = 1.2;
      ctx.fillRect(cx, cy, 14, 17); ctx.strokeRect(cx, cy, 14, 17);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(cx + 2, cy + 11, 10, 2);
    }
  };

  // a painted cut-out board of a quokka holding a "SMILE!" sign, with a hole to put your face in
  DECOR.selfieBoard = function (ctx, d, gy, t) {
    const x = d.x, fy = gy - 152, fr = 21;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#8a5a2e'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.fillRect(x - 36, gy - 60, 9, 60); ctx.strokeRect(x - 36, gy - 60, 9, 60);
    ctx.fillRect(x + 27, gy - 60, 9, 60); ctx.strokeRect(x + 27, gy - 60, 9, 60);
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 120, gy - 260, 240, 262); ctx.moveTo(x + fr, fy); ctx.arc(x, fy, fr, 0, TAU);
    ctx.clip('evenodd');
    const fur = '#a8805c';
    for (const ex of [-1, 1]) { A.oval(ctx, x + ex * 28, fy - 33, 11, 12, ex * 0.3, fur, LINE, 3); A.oval(ctx, x + ex * 28, fy - 33, 5, 6, ex * 0.3, '#e8a3a3'); }
    A.oval(ctx, x, gy - 78, 52, 62, 0, fur, LINE, 3);
    A.oval(ctx, x, fy, 40, 36, 0, fur, LINE, 3);
    A.oval(ctx, x, fy + 2, 30, 28, 0, '#d9b48a');
    A.oval(ctx, x, gy - 70, 34, 42, 0, '#f1dcc0');
    // painted arms holding the sign
    ctx.fillStyle = fur; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    for (const ex of [-1, 1]) { A.taper(ctx, x + ex * 40, gy - 116, x + ex * 60, gy - 98, x + ex * 50, gy - 80, 16, 12); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = LINE; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, fy, fr, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x - 50, gy - 96, 100, 30, 6); ctx.fill(); ctx.stroke();
    fitText(ctx, 'SMILE!', x, gy - 80, 80, 20, '#ff4d8d');
    for (const ex of [-1, 1]) A.oval(ctx, x + ex * 50, gy - 80, 7, 6, 0, '#a8805c', LINE, 2);
  };

  // a striped lighthouse whose lamp is a smiling face; d.evil = true: a red glow, a red beam and a
  // sinister grin. d.h (300)
  DECOR.lighthouse = function (ctx, d, gy, t) {
    const x = d.x, s = (d.h || 300) / 300, evil = !!d.evil;
    const tt = gy - 222 * s, lampY = tt - 28 * s;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the beam, sweeping round
    const a = t * (evil ? 1.6 : 1.1), front = Math.max(0, Math.sin(a)), L = 230;
    ctx.fillStyle = evil ? 'rgba(255,50,50,' + (0.22 + 0.25 * front).toFixed(3) + ')' : 'rgba(255,245,170,' + (0.22 + 0.25 * front).toFixed(3) + ')';
    ctx.beginPath(); ctx.moveTo(x, lampY); ctx.lineTo(x + Math.cos(a) * L, lampY - (10 + 26 * front) * s); ctx.lineTo(x + Math.cos(a) * L, lampY + (10 + 26 * front) * s); ctx.closePath(); ctx.fill();
    if (evil) glowSpot(ctx, x, lampY, 90 * s, '255,40,40', 0.45 + 0.15 * Math.sin(t * 4));
    // rocks at the foot
    for (const [bx, r] of [[-40, 18], [-20, 13], [34, 20], [52, 11]]) A.oval(ctx, x + bx * s, gy - r * 0.5 * s, r * s, r * 0.7 * s, 0, '#8a8478', LINE, 2);
    // the tower with its stripes
    const bw = 38 * s, tw = 24 * s;
    ctx.beginPath(); ctx.moveTo(x - bw, gy); ctx.lineTo(x - tw, tt); ctx.lineTo(x + tw, tt); ctx.lineTo(x + bw, gy); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = evil ? '#a8323a' : '#e63946';
    for (let j = 0; j < 4; j++) ctx.fillRect(x - bw, gy - (j * 2 + 1) * 222 * s / 8, bw * 2, 222 * s / 8);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + tw * 0.3, tt, bw, gy - tt);
    ctx.restore();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#4a3a3a';
    ctx.beginPath(); ctx.moveTo(x - 9 * s, gy); ctx.lineTo(x - 9 * s, gy - 22 * s); ctx.arc(x, gy - 22 * s, 9 * s, Math.PI, TAU); ctx.lineTo(x + 9 * s, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const wy of [0.42, 0.68]) { ctx.fillStyle = evil ? '#ff6b6b' : '#7ab8e0'; ctx.beginPath(); ctx.roundRect(x - 5 * s, gy - wy * 222 * s - 8 * s, 10 * s, 14 * s, 4 * s); ctx.fill(); ctx.stroke(); }
    // the gallery and lamp room
    ctx.fillStyle = '#3a3f47';
    ctx.beginPath(); ctx.roundRect(x - 34 * s, tt - 6 * s, 68 * s, 8 * s, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 32 * s, tt - 20 * s); ctx.lineTo(x + 32 * s, tt - 20 * s);
    for (let j = 0; j <= 6; j++) { const px = x - 32 * s + j * (64 * s / 6); ctx.moveTo(px, tt - 6 * s); ctx.lineTo(px, tt - 20 * s); }
    ctx.stroke();
    ctx.fillStyle = evil ? 'rgba(255,170,170,0.75)' : 'rgba(210,240,255,0.75)'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(x - 20 * s, tt - 50 * s, 40 * s, 44 * s); ctx.strokeRect(x - 20 * s, tt - 50 * s, 40 * s, 44 * s);
    // the face in the lamp
    const fr = 15 * s;
    A.oval(ctx, x, lampY, fr, fr, 0, evil ? '#ff4040' : '#ffe066', LINE, 2);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.8 * s; ctx.fillStyle = LINE;
    if (!evil) {
      ctx.beginPath(); circ(ctx, x - 5 * s, lampY - 4 * s, 1.9 * s); circ(ctx, x + 5 * s, lampY - 4 * s, 1.9 * s); ctx.fill();
      ctx.beginPath(); ctx.arc(x, lampY + 1 * s, 8 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      A.oval(ctx, x - 9 * s, lampY + 2 * s, 2.6 * s, 1.6 * s, 0, 'rgba(255,120,140,0.7)'); A.oval(ctx, x + 9 * s, lampY + 2 * s, 2.6 * s, 1.6 * s, 0, 'rgba(255,120,140,0.7)');
    } else {
      // narrowed eyes under angry brows, and a wide pointy grin
      ctx.beginPath(); ctx.moveTo(x - 10 * s, lampY - 9 * s); ctx.lineTo(x - 2 * s, lampY - 5 * s); ctx.moveTo(x + 10 * s, lampY - 9 * s); ctx.lineTo(x + 2 * s, lampY - 5 * s); ctx.stroke();
      ctx.fillStyle = '#ffee88';
      ctx.beginPath(); ctx.moveTo(x - 9 * s, lampY - 4 * s); ctx.lineTo(x - 3 * s, lampY - 2.5 * s); ctx.lineTo(x - 9 * s, lampY - 1.5 * s); ctx.closePath(); ctx.moveTo(x + 9 * s, lampY - 4 * s); ctx.lineTo(x + 3 * s, lampY - 2.5 * s); ctx.lineTo(x + 9 * s, lampY - 1.5 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a0a0a';
      ctx.beginPath(); ctx.moveTo(x - 11 * s, lampY + 1 * s); ctx.quadraticCurveTo(x, lampY + 14 * s, x + 11 * s, lampY + 1 * s); ctx.quadraticCurveTo(x, lampY + 6 * s, x - 11 * s, lampY + 1 * s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); for (let j = -2; j <= 2; j++) { const tx = x + j * 4 * s, ty = lampY + 3.6 * s + (2 - Math.abs(j)) * 0.8 * s; ctx.moveTo(tx - 1.8 * s, ty); ctx.lineTo(tx, ty + 3.5 * s); ctx.lineTo(tx + 1.8 * s, ty); ctx.closePath(); } ctx.fill();
    }
    ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 7 * s, tt - 50 * s); ctx.lineTo(x - 7 * s, tt - 6 * s); ctx.moveTo(x + 7 * s, tt - 50 * s); ctx.lineTo(x + 7 * s, tt - 6 * s); ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
    // the domed roof
    ctx.fillStyle = evil ? '#a8323a' : '#e63946'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 25 * s, tt - 50 * s); ctx.quadraticCurveTo(x - 20 * s, tt - 74 * s, x, tt - 76 * s); ctx.quadraticCurveTo(x + 20 * s, tt - 74 * s, x + 25 * s, tt - 50 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, x, tt - 80 * s, 5 * s, 5 * s, 0, '#ffd23f', LINE, 2);
  };

  // a heap of quokka plush toys with a SALE tag
  DECOR.plushies = function (ctx, d, gy, t) {
    const x = d.x;
    const pos = [[-48, 0], [-16, 3], [16, 0], [48, 3], [-32, -26], [0, -28], [32, -25], [-16, -53], [16, -52], [0, -78]];
    A.shadow(ctx, x, gy - 2, 70);
    pos.forEach(([px, py], i) => plush(ctx, x + px, gy - 13 + py, 1, PLUSH[(i * 3 + Math.round(x)) % PLUSH.length], i % 4 === 1 ? 1 : i === 9 ? 2 : 0));
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
    const sw = Math.sin(t * 1.5) * 3;
    ctx.beginPath(); ctx.moveTo(x + 58, gy - 18); ctx.lineTo(x + 70 + sw, gy - 38); ctx.stroke();
    ctx.save(); ctx.translate(x + 70 + sw, gy - 38); ctx.rotate(0.2 + sw * 0.02);
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(24, -12); ctx.lineTo(24, 2); ctx.lineTo(-6, 2); ctx.lineTo(-12, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    MG.UI.text(ctx, 'SALE', 9, -4.5, 9, '#c1121f', 'center');
    ctx.restore();
  };

  // bunting and a "VICTORY PARTY!" banner strung between two poles, with balloons. d.w (360)
  DECOR.partyBanner = function (ctx, d, gy, t) {
    const w = Math.max(200, d.w || 360), x0 = d.x - w / 2, x1 = d.x + w / 2, top = gy - 200;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // balloons tied to the poles
    const balloons = [['#ff4d8d', -14, -36], ['#ffd23f', 10, -46], ['#4cc9f0', -2, -58]];
    for (const px of [x0, x1]) {
      balloons.forEach(([col, bx, by], j) => {
        const bob = Math.sin(t * 1.6 + j + px * 0.01) * 3, cx = px + bx, cy = top + by + bob;
        ctx.strokeStyle = 'rgba(43,26,20,0.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, top + 6); ctx.quadraticCurveTo(cx + 4, cy + 30, cx, cy + 17); ctx.stroke();
        A.oval(ctx, cx, cy, 13, 16, 0, col, LINE, 2);
        A.oval(ctx, cx - 4, cy - 6, 3, 5, 0.4, 'rgba(255,255,255,0.6)');
      });
    }
    for (const px of [x0, x1]) {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillRect(px - 4, top, 8, gy - top); ctx.strokeRect(px - 4, top, 8, gy - top);
      ctx.fillStyle = '#ff4d8d'; for (let y = top + 20; y < gy - 10; y += 40) ctx.fillRect(px - 4, y, 8, 12);
      A.oval(ctx, px, top - 2, 6, 6, 0, '#ffd23f', LINE, 2);
    }
    // two swoops of bunting
    const flags = ['#e63946', '#ffd23f', '#3a86ff', '#52b788', '#ff8fab', '#ff9f1c'];
    for (const [y0, sag, n] of [[top + 8, 46, 14], [top + 30, 70, 16]]) {
      ctx.strokeStyle = 'rgba(43,26,20,0.8)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(d.x, y0 + sag * 2, x1, y0); ctx.stroke();
      for (let k = 1; k < n; k++) {
        const q = k / n, m = 1 - q, fx = m * m * x0 + 2 * m * q * d.x + q * q * x1, fy = m * m * y0 + 2 * m * q * (y0 + sag * 2) + q * q * y0;
        ctx.fillStyle = flags[k % flags.length]; ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx - 7, fy); ctx.lineTo(fx + 7, fy); ctx.lineTo(fx + Math.sin(t * 3 + k) * 1.5, fy + 15); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    // the banner in the middle, swinging gently
    const bw = Math.min(w - 50, 250), by = top + 64;
    ctx.save(); ctx.translate(d.x, by); ctx.rotate(Math.sin(t * 1.2) * 0.02);
    ctx.strokeStyle = 'rgba(43,26,20,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-bw / 2 + 10, 0); ctx.lineTo(-bw / 2 + 24, -24); ctx.moveTo(bw / 2 - 10, 0); ctx.lineTo(bw / 2 - 24, -24); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-bw / 2, 0); ctx.lineTo(bw / 2, 0); ctx.lineTo(bw / 2 - 10, 21); ctx.lineTo(bw / 2, 42); ctx.lineTo(-bw / 2, 42); ctx.lineTo(-bw / 2 + 10, 21); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flags[3];
    for (let j = 0; j < 9; j++) { ctx.fillStyle = flags[j % flags.length]; ctx.fillRect(-bw / 2 + 18 + hash(j + 600) * (bw - 36), 4 + hash(j + 610) * 34, 3, 3); }
    fitText(ctx, 'VICTORY PARTY!', 0, 21, bw - 40, 22, '#ff4d8d', '#5a1030');
    ctx.restore();
  };

  // ---- the lair
  // a rock spike rising from the floor: ridged, damp, with glowing moss at its foot. d.h (160)
  DECOR.stalagmite = function (ctx, d, gy, t) {
    const x = d.x, h = d.h || 160, w = Math.max(18, h * 0.3), seed = Math.round(x);
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#4a5062'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - w, gy + 2);
    ctx.quadraticCurveTo(x - w * 0.9, gy - h * 0.25, x - w * 0.55, gy - h * 0.35);
    ctx.quadraticCurveTo(x - w * 0.62, gy - h * 0.55, x - w * 0.3, gy - h * 0.7);
    ctx.quadraticCurveTo(x - w * 0.22, gy - h * 0.9, x + 2, gy - h);
    ctx.quadraticCurveTo(x + w * 0.24, gy - h * 0.86, x + w * 0.3, gy - h * 0.62);
    ctx.quadraticCurveTo(x + w * 0.62, gy - h * 0.5, x + w * 0.56, gy - h * 0.3);
    ctx.quadraticCurveTo(x + w * 0.95, gy - h * 0.2, x + w, gy + 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(150,180,215,0.2)';
    ctx.beginPath(); ctx.moveTo(x - w, gy); ctx.quadraticCurveTo(x - w * 0.5, gy - h * 0.5, x - 2, gy - h); ctx.lineTo(x - w * 0.15, gy - h * 0.6); ctx.quadraticCurveTo(x - w * 0.35, gy - h * 0.3, x - w * 0.55, gy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(15,20,30,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0.15; k < 0.9; k += 0.14) { const y = gy - h * k, hw = w * (1 - k) * 1.1; ctx.moveTo(x - hw, y + 3); ctx.quadraticCurveTo(x, y - 4 + hash(seed + k * 10) * 4, x + hw, y + 3); }
    ctx.stroke();
    ctx.restore();
    A.oval(ctx, x - 1, gy - h + 8, 2, 4, 0, 'rgba(255,255,255,0.7)');
    glowSpot(ctx, x, gy - 6, w * 1.6, '90,255,170', 0.28);
    ctx.fillStyle = '#3ee6a0';
    ctx.beginPath(); for (let j = 0; j < 7; j++) ell(ctx, x - w + (j / 6) * w * 2, gy - 3 - hash(seed + j) * 6, 4 + hash(seed + j * 2) * 3, 2.5, 0); ctx.fill();
  };

  // a glowing green crystal cluster on a few rocks. d.h (90)
  DECOR.crystal = function (ctx, d, gy, t) {
    const x = d.x, s = (d.h || 90) / 52, seed = Math.round(x);
    for (const [bx, r] of [[-30, 14], [26, 16], [-6, 12]]) A.oval(ctx, x + bx * s, gy - r * 0.4, r * s, r * 0.6 * s, 0, '#3a4252', LINE, 2);
    crystals(ctx, x - 26 * s, gy - 4, 0.6 * s, t + 1, seed + 1, true);
    crystals(ctx, x + 28 * s, gy - 4, 0.5 * s, t + 2, seed + 2, true);
    crystals(ctx, x, gy - 2, 1 * s, t, seed, true);
  };

  // the Croc Emperor's stone throne: steps, a cushion, carved scales and a crocodile head on top
  // with a glowing green eye. d.h (260)
  DECOR.throne = function (ctx, d, gy, t) {
    const x = d.x, s = (d.h || 260) / 260, stone = '#5a6070', dark = '#454a58';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    const glow = 0.7 + 0.3 * Math.sin(t * 2.2);
    glowSpot(ctx, x, gy - 120 * s, 150 * s, '90,255,170', 0.16 * glow);
    // the back slab with carved scales
    const by = gy - 200 * s, bw = 64 * s;
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.moveTo(x - bw, gy - 70 * s); ctx.lineTo(x - bw, by + 20 * s); ctx.quadraticCurveTo(x - bw, by, x - bw + 20 * s, by); ctx.lineTo(x + bw - 20 * s, by); ctx.quadraticCurveTo(x + bw, by, x + bw, by + 20 * s); ctx.lineTo(x + bw, gy - 70 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(25,30,40,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    const sc = 11 * s;
    for (let r = 0, y = by + 26 * s; y < gy - 70 * s; r++, y += sc * 0.8) for (let px = x - bw - (r % 2 ? sc : 0); px < x + bw + sc; px += sc * 2) { ctx.moveTo(px + Math.cos(0.12 * Math.PI) * sc, y + Math.sin(0.12 * Math.PI) * sc); ctx.arc(px, y, sc, 0.12 * Math.PI, 0.88 * Math.PI); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,180,210,0.15)'; ctx.fillRect(x - bw, by, 14 * s, 200 * s);
    ctx.restore();
    // the carved crocodile head on top, facing right
    const hx = x - 20 * s, hy = by + 4 * s;
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.moveTo(hx - 34 * s, hy); ctx.quadraticCurveTo(hx - 34 * s, hy - 30 * s, hx - 6 * s, hy - 34 * s);
    ctx.lineTo(hx + 96 * s, hy - 24 * s); ctx.quadraticCurveTo(hx + 112 * s, hy - 22 * s, hx + 112 * s, hy - 12 * s); ctx.lineTo(hx + 104 * s, hy - 8 * s); ctx.lineTo(hx + 10 * s, hy - 6 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.moveTo(hx + 4 * s, hy + 6 * s); ctx.lineTo(hx + 98 * s, hy + 4 * s); ctx.quadraticCurveTo(hx + 104 * s, hy + 6 * s, hx + 100 * s, hy + 12 * s); ctx.lineTo(hx + 6 * s, hy + 18 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1a1a'; ctx.fillRect(hx + 10 * s, hy - 6 * s, 90 * s, 11 * s);
    ctx.fillStyle = '#efe6cf'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let j = 0; j < 9; j++) { const tx = hx + 16 * s + j * 10 * s; ctx.moveTo(tx - 3 * s, hy - 6 * s); ctx.lineTo(tx, hy + 1 * s); ctx.lineTo(tx + 3 * s, hy - 6 * s); ctx.closePath(); ctx.moveTo(tx + 2 * s, hy + 5 * s); ctx.lineTo(tx + 5 * s, hy - 1 * s); ctx.lineTo(tx + 8 * s, hy + 5 * s); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.5;
    // bumps along the top, the nostril and the glowing eye
    ctx.fillStyle = dark;
    ctx.beginPath(); for (let j = 0; j < 5; j++) { const bx = hx + 30 * s + j * 14 * s; ctx.moveTo(bx - 5 * s, hy - 30 * s + j * 1.2 * s); ctx.arc(bx, hy - 30 * s + j * 1.2 * s, 5 * s, Math.PI, TAU); } ctx.fill(); ctx.stroke();
    A.oval(ctx, hx + 104 * s, hy - 24 * s, 6 * s, 4 * s, 0, dark, LINE, 2);
    A.oval(ctx, hx + 104 * s, hy - 25 * s, 2 * s, 1.4 * s, 0, LINE);
    A.oval(ctx, hx + 6 * s, hy - 38 * s, 14 * s, 11 * s, 0, dark, LINE, 2.5);
    glowSpot(ctx, hx + 8 * s, hy - 38 * s, 26 * s, '90,255,170', 0.6 * glow);
    A.oval(ctx, hx + 8 * s, hy - 38 * s, 8 * s, 6 * s, 0, '#7dffc4', LINE, 1.8);
    A.oval(ctx, hx + 8 * s, hy - 38 * s, 1.8 * s, 5 * s, 0, '#0d3a2a');
    // armrests, seat and cushion, steps
    for (const sx of [-1, 1]) {
      ctx.fillStyle = stone;
      ctx.beginPath(); ctx.roundRect(x + sx * (bw + 8 * s) - 16 * s, gy - 110 * s, 32 * s, 76 * s, 6 * s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.roundRect(x + sx * (bw + 8 * s) - 20 * s, gy - 118 * s, 40 * s, 14 * s, 6 * s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#efe6cf';
      ctx.beginPath(); for (let j = -1; j <= 1; j++) { const cx = x + sx * (bw + 8 * s) + j * 9 * s + sx * 6 * s; ctx.moveTo(cx - 3 * s, gy - 105 * s); ctx.lineTo(cx, gy - 96 * s); ctx.lineTo(cx + 3 * s, gy - 105 * s); ctx.closePath(); } ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.roundRect(x - bw - 6 * s, gy - 76 * s, (bw + 6 * s) * 2, 40 * s, 5 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7b2d8b';
    ctx.beginPath(); ctx.roundRect(x - bw + 4 * s, gy - 88 * s, (bw - 4 * s) * 2, 16 * s, 8 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; for (const tx of [x - bw + 6 * s, x + bw - 6 * s]) { ctx.beginPath(); circ(ctx, tx, gy - 80 * s, 3.5 * s); ctx.fill(); ctx.stroke(); }
    for (const [sw, sh, sy] of [[150, 18, 36], [180, 18, 18]]) {
      ctx.fillStyle = sy === 18 ? dark : stone;
      ctx.beginPath(); ctx.roundRect(x - sw / 2 * s, gy - sy * s, sw * s, sh * s, 3); ctx.fill(); ctx.stroke();
    }
  };

  // a nest of leathery reptile eggs (a clue); one keeps wobbling and has a crack in it
  DECOR.eggs = function (ctx, d, gy, t) {
    const x = d.x;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    A.oval(ctx, x, gy - 16, 64, 15, 0, '#6a4a2e', LINE, 2.5);
    const wob = Math.sin(t * 16) * Math.max(0, Math.sin(t * 1.3)) * 0.22;
    const eggs = [[-36, -16, -0.22], [-12, -19, -0.06], [12, -19, 0.06], [36, -16, 0.22], [-24, -8, -0.1], [0, -7, 0], [24, -8, 0.12]];
    eggs.forEach(([ex, ey, r], i) => {
      ctx.save(); ctx.translate(x + ex, gy + ey); ctx.rotate(r + (i === 5 ? wob : 0));
      A.oval(ctx, 0, -15, 12, 15.5, 0, '#f2ead6', LINE, 2.2);
      ctx.fillStyle = 'rgba(150,130,100,0.4)';
      ctx.beginPath(); for (let j = 0; j < 5; j++) circ(ctx, -6 + hash(i * 5 + j) * 12, -24 + hash(i * 7 + j) * 16, 1.3); ctx.fill();
      A.oval(ctx, -5, -21, 2.6, 4.5, 0.35, 'rgba(255,255,255,0.8)');
      if (i === 5) {
        ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-11, -20); ctx.lineTo(-5, -17); ctx.lineTo(-2, -22); ctx.lineTo(3, -18); ctx.lineTo(6, -23); ctx.moveTo(-2, -22); ctx.lineTo(-1, -26); ctx.stroke();
      }
      ctx.restore();
    });
    // the front of the nest: a bowl of sand and twigs
    ctx.fillStyle = '#9c7a56'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 68, gy - 16); ctx.quadraticCurveTo(x, gy - 2, x + 68, gy - 16); ctx.lineTo(x + 60, gy + 1); ctx.quadraticCurveTo(x, gy + 8, x - 60, gy + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let j = 0; j < 9; j++) { const q = j / 8, px = lerp(x - 58, x + 58, q), py = gy - 6 + Math.sin(q * Math.PI) * 4; ctx.moveTo(px - 11, py - 3 + (j % 2) * 4); ctx.lineTo(px + 11, py + 1 - (j % 2) * 4); }
    ctx.stroke();
  };

  // ---- the Isle of Man (a generic green island)
  // a dry-stone wall. d.w (240), d.h (48)
  DECOR.stonewall = function (ctx, d, gy, t) {
    const w = d.w || 240, h = d.h || 48, x0 = d.x - w / 2;
    stoneWall(ctx, x0, w, gy - h, gy + 2, Math.round(d.x));
    ctx.strokeStyle = '#5f9a44'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); for (let x = x0 + 3; x < x0 + w; x += 8) { ctx.moveTo(x, gy + 3); ctx.lineTo(x - 2 + hash(x) * 4, gy - 4 - hash(x + 1) * 7); } ctx.stroke();
  };

  // a white cottage with a slate roof, chimneys at both ends, little windows and a red door. d.w (200)
  DECOR.cottage = function (ctx, d, gy, t) {
    const w = Math.max(140, d.w || 200), wh = 72, rh = 50, x0 = d.x - w / 2, wy = gy - wh;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    smoke(ctx, x0 + 22, wy - rh - 22, t, 5, 8, '235,238,242', 0.7, 60);
    for (const cx of [x0 + 12, x0 + w - 32]) {
      ctx.fillStyle = '#f2efe6'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.fillRect(cx, wy - rh - 18, 20, 30); ctx.strokeRect(cx, wy - rh - 18, 20, 30);
      ctx.fillStyle = '#4f5866'; ctx.fillRect(cx - 2, wy - rh - 22, 24, 5); ctx.strokeRect(cx - 2, wy - rh - 22, 24, 5);
    }
    ctx.fillStyle = '#f6f3ea'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(x0, wy, w, wh); ctx.strokeRect(x0, wy, w, wh);
    ctx.fillStyle = 'rgba(120,110,95,0.25)';
    ctx.beginPath(); for (let j = 0; j < w / 6; j++) circ(ctx, x0 + 4 + hash(d.x + j) * (w - 8), wy + 6 + hash(d.x + j * 3) * (wh - 12), 0.9); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x0, wy, w, 8);
    // the slate roof
    ctx.fillStyle = '#4f5866'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0 - 8, wy + 4); ctx.lineTo(x0 + 8, wy - rh); ctx.lineTo(x0 + w - 8, wy - rh); ctx.lineTo(x0 + w + 8, wy + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,25,35,0.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let r = 1; r < 6; r++) { const y = wy - rh + r * ((rh + 4) / 6), k = r / 6; ctx.moveTo(x0 + 8 - 16 * k, y); ctx.lineTo(x0 + w - 8 + 16 * k, y); for (let sx = x0 + (r % 2 ? 6 : 14); sx < x0 + w; sx += 16) { ctx.moveTo(sx, y); ctx.lineTo(sx, y - (rh + 4) / 6); } }
    ctx.stroke();
    ctx.fillStyle = '#6a7484'; ctx.fillRect(x0 + 8, wy - rh - 2, w - 16, 5);
    // windows and the door
    const win = (wx) => {
      ctx.fillStyle = '#2d5a3a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillRect(wx - 2, wy + 16, 30, 32); ctx.strokeRect(wx - 2, wy + 16, 30, 32);
      ctx.fillStyle = '#6a8aa0'; ctx.fillRect(wx + 2, wy + 20, 22, 24);
      ctx.strokeStyle = '#f6f3ea'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + 13, wy + 20); ctx.lineTo(wx + 13, wy + 44); ctx.moveTo(wx + 2, wy + 32); ctx.lineTo(wx + 24, wy + 32); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(wx - 4, wy + 47, 34, 4);
    };
    win(x0 + 20); win(x0 + w - 48);
    const dx = d.x - 16;
    ctx.fillStyle = '#a83232'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.fillRect(dx, gy - 54, 32, 54); ctx.strokeRect(dx, gy - 54, 32, 54);
    ctx.strokeStyle = 'rgba(60,10,10,0.4)'; ctx.lineWidth = 1.5; ctx.strokeRect(dx + 5, gy - 48, 22, 18); ctx.strokeRect(dx + 5, gy - 26, 22, 20);
    A.oval(ctx, dx + 26, gy - 28, 2.2, 2.2, 0, '#ffd23f');
    // flower pots by the door
    for (const [px, col] of [[dx - 12, '#ff6fa0'], [dx + 44, '#ffd23f']]) {
      ctx.fillStyle = '#c0603a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px - 7, gy - 12); ctx.lineTo(px + 7, gy - 12); ctx.lineTo(px + 5, gy); ctx.lineTo(px - 5, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4f9a4a'; ctx.beginPath(); circ(ctx, px - 4, gy - 16, 4); circ(ctx, px + 4, gy - 16, 4); circ(ctx, px, gy - 20, 4); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); circ(ctx, px - 3, gy - 19, 2); circ(ctx, px + 3, gy - 17, 2); circ(ctx, px, gy - 22, 2); ctx.fill();
    }
    ctx.strokeStyle = '#5f9a44'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let x = x0 - 6; x < x0 + w + 6; x += 7) { ctx.moveTo(x, gy + 2); ctx.lineTo(x - 2 + hash(x) * 4, gy - 3 - hash(x + 1) * 6); } ctx.stroke();
  };

  // a fluffy sheep that keeps putting its head down to graze. d.facing (1 / -1), d.scale
  DECOR.sheep = function (ctx, d, gy, t) {
    const x = d.x, f = d.facing === 1 || d.facing === -1 ? d.facing : (hash(Math.round(x) * 0.1) < 0.5 ? -1 : 1), s = d.scale || 1;
    const graze = Math.max(0, Math.min(1, Math.sin(t * 0.6 + x * 0.013) * 1.6));
    const chew = graze > 0.8 ? Math.sin(t * 10) * 0.8 : 0;
    ctx.save(); ctx.translate(x, gy); ctx.scale(f * s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    A.shadow(ctx, 0, -2, 30);
    ctx.strokeStyle = LINE; ctx.lineWidth = 6;
    ctx.beginPath(); for (const lx of [-16, -7, 9, 17]) { ctx.moveTo(lx, -16); ctx.lineTo(lx + (lx % 2 ? 1 : -1), -1); } ctx.stroke();
    ctx.strokeStyle = '#3a3634'; ctx.lineWidth = 3.5; ctx.stroke();
    const fluff = [[-20, -30, 11], [-10, -38, 12], [3, -39, 12], [15, -34, 11], [21, -26, 9], [-22, -21, 9], [-8, -19, 11], [7, -19, 11], [18, -19, 9], [-2, -28, 13]];
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); for (const [bx, by, r] of fluff) circ(ctx, bx, by, r); ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#e6e4dc';
    ctx.beginPath(); for (const [bx, by, r] of fluff) circ(ctx, bx + 2, by + 3, r * 0.55); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); for (const [bx, by, r] of fluff) circ(ctx, bx - 1, by - 2, r * 0.5); ctx.fill();
    A.oval(ctx, -29, -31, 5, 4, 0, '#ffffff', LINE, 2);
    // the head: up and looking about, or down to the grass
    const hx = lerp(30, 32, graze), hy = lerp(-38, -14, graze) + chew, rot = lerp(-0.25, 0.9, graze);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot);
    A.oval(ctx, -6, -2, 6, 3, -0.5, '#2f2b29', LINE, 1.8);
    A.oval(ctx, 2, 0, 8, 11, 0, '#2f2b29', LINE, 2.2);
    A.oval(ctx, -3, -9, 8, 5, 0, '#ffffff', LINE, 2);
    A.oval(ctx, 4, -3, 2.4, 2.4, 0, '#ffffff'); A.oval(ctx, 4.6, -3, 1.2, 1.4, 0, LINE);
    ctx.restore();
    ctx.restore();
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
  A.DECOR_TYPES_M7 = Object.keys(DECOR);
})();
