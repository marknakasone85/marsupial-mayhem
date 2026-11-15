// Milestone 6 art (worlds 1-3), all drawn in code: backgrounds for the Rainforest, the Cane Fields
// and the Coast; their platforms, ground plants and river water; map decorations (with the quokka
// clues); the new animals and allies; and the Marsupial World map. Loaded after outback.js and gear.js.
// Animals are drawn facing right with their feet at (x, y). o: { t, facing, scale, flash, ... }
(function () {
  const A = MG.Art;
  const W = MG.W, H = MG.H;
  const LINE = '#2b1a14';
  const TAU = Math.PI * 2;
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const hash = (n) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
  const white = (o, col) => (o.flash ? '#ffffff' : col);
  const k01 = (v) => Math.max(0, Math.min(1, +v || 0));
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------------------------------------------------------------- little helpers
  // Sub-paths (no stray joining lines) so many shapes can share one fill.
  function circ(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  function ell(ctx, x, y, rx, ry, rot) {
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
  // skies and the other still gradient bands are drawn once and reused (A.band, js/art/still.js)
  function skyFill(ctx, bottom, c0, c1, c2) {
    A.band(ctx, 0, 0, W, bottom, [0, 0, 0, bottom], [[0, c0], [0.6, c1], [1, c2]]);
  }
  const CLOUD = [[0, 0, 22], [24, -8, 26], [52, 0, 20], [26, 6, 22]];
  function sunClouds(ctx, camX, t, gy, sunset, sunX) {
    const sunY = sunset ? gy - 190 : 82;
    ctx.fillStyle = sunset ? 'rgba(255,214,102,0.4)' : 'rgba(255,240,180,0.5)';
    ctx.beginPath(); ctx.arc(sunX, sunY, sunset ? 90 : 58, 0, TAU); ctx.fill();
    ctx.fillStyle = sunset ? '#ffd166' : '#fff3c4';
    ctx.beginPath(); ctx.arc(sunX, sunY, sunset ? 62 : 38, 0, TAU); ctx.fill();
    ctx.fillStyle = sunset ? 'rgba(255,196,170,0.85)' : 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 330 - camX * 0.06 - t * 6) % (W + 300) + W + 300) % (W + 300) - 150;
      for (const [dx, dy, r] of CLOUD) circ(ctx, cx + dx, 54 + i * 24 + dy, r);
    }
    ctx.fill();
  }
  function dusk(ctx) {
    ctx.fillStyle = 'rgba(255,110,60,0.14)';
    ctx.fillRect(0, 0, W, H);
  }
  function sweatDrop(ctx, x, y, r) {
    ctx.fillStyle = '#8fd3ff'; ctx.strokeStyle = '#2b6aa8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.8); ctx.quadraticCurveTo(x + r, y - r * 0.2, x, y + r * 0.6);
    ctx.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.8); ctx.fill(); ctx.stroke();
  }

  // ================================================================ backgrounds
  const BG = {};

  // ---- the Rainforest: misty canopy layers, tall trunks, vines, a far waterfall, dappled light
  const rfFar = (x) => 112 + Math.sin(x * 0.005) * 46 + Math.sin(x * 0.013 + 2) * 20;
  BG.rainforest = function (ctx, camX, t, gy, sunset) {
    skyFill(ctx, gy, sunset ? '#5a3a6a' : '#86cbbd', sunset ? '#f2a372' : '#d4eed6', sunset ? '#ffd79a' : '#eef6dc');
    A.band(ctx, 400, 0, 560, Math.min(gy, 370), [700, 70, 10, 700, 70, 300],
      [[0, sunset ? 'rgba(255,200,120,0.7)' : 'rgba(255,252,220,0.85)'], [1, 'rgba(255,252,220,0)']]);
    // far misty hills, and a waterfall off a cliff every so often
    ridge(ctx, camX, 0.06, gy - 140, gy - 170, '#a6d0bd', rfFar);
    each(camX, 0.06, 1500, 300, (sx, i) => {
      const cx = sx + 600, base = gy - 140 - rfFar(i * 1500 + 600);
      const top = base - 70;
      ctx.fillStyle = '#93bfaa';
      ctx.beginPath();
      ctx.moveTo(cx - 80, base + 40); ctx.lineTo(cx - 62, top + 8); ctx.quadraticCurveTo(cx - 40, top - 6, cx - 10, top);
      ctx.lineTo(cx + 30, top + 4); ctx.quadraticCurveTo(cx + 60, top - 2, cx + 74, top + 16); ctx.lineTo(cx + 90, base + 40);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#86b89c';
      ctx.beginPath();
      for (let j = 0; j < 6; j++) circ(ctx, cx - 60 + j * 26, top + 2 - hash(i + j) * 6, 12 + hash(i * 3 + j) * 6);
      ctx.fill();
      // the falling water, with streaks sliding down
      const len = gy - 150 - top;
      ctx.fillStyle = '#eef8f8';
      ctx.fillRect(cx - 12, top + 2, 20, len);
      ctx.strokeStyle = 'rgba(150,200,215,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const y = top + 4 + ((t * 60 + j * 31) % Math.max(20, len - 14));
        const lx = cx - 8 + (j % 3) * 6;
        ctx.moveTo(lx, y); ctx.lineTo(lx, y + 12);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      for (let j = 0; j < 4; j++) circ(ctx, cx - 18 + j * 12, gy - 150 + Math.sin(t * 2 + j) * 2, 10 + (j % 2) * 4);
      ctx.fill();
    });
    // mid canopy wall, with pale trunks
    ctx.fillStyle = '#74ab80';
    ctx.beginPath();
    each(camX, 0.15, 46, 80, (sx, i) => circ(ctx, sx, gy - 188 + hash(i + 3) * 40, 32 + hash(i) * 26));
    ctx.fill();
    ctx.fillRect(0, gy - 180, W, 182);
    ctx.fillStyle = '#93c49c';
    each(camX, 0.15, 120, 40, (sx, i) => { if (hash(i + 9) < 0.6) ctx.fillRect(sx + hash(i) * 40, gy - 168 + hash(i + 2) * 30, 5 + hash(i + 4) * 4, 200); });
    A.band(ctx, 0, gy - 200, W, 200, [0, gy - 200, 0, gy],
      [[0, 'rgba(240,250,240,0)'], [0.6, 'rgba(240,250,240,0.4)'], [1, 'rgba(240,250,240,0.15)']]);
    // near trunks with flared buttress roots
    each(camX, 0.35, 210, 140, (sx, i) => {
      if (hash(i * 1.7 + 3) < 0.25) return;
      const tx = sx + hash(i + 1) * 70, tw = 16 + hash(i + 2) * 16;
      ctx.fillStyle = '#4d6547';
      ctx.beginPath();
      ctx.moveTo(tx - tw / 2, 0); ctx.lineTo(tx + tw / 2, 0); ctx.lineTo(tx + tw / 2 + 3, gy - 46);
      ctx.quadraticCurveTo(tx + tw / 2 + 6, gy - 6, tx + tw / 2 + 30, gy + 2);
      ctx.lineTo(tx - tw / 2 - 30, gy + 2);
      ctx.quadraticCurveTo(tx - tw / 2 - 6, gy - 6, tx - tw / 2 - 3, gy - 46);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(210,240,180,0.13)';
      ctx.fillRect(tx - tw / 2 + 3, 0, 3, gy - 46);
      ctx.fillStyle = '#5f8f4a';
      ctx.beginPath();
      ell(ctx, tx - tw * 0.2, gy - 120 - hash(i + 5) * 120, tw * 0.35, 9, 0.3);
      ell(ctx, tx + tw * 0.2, gy - 260 - hash(i + 6) * 80, tw * 0.3, 7, -0.2);
      ctx.fill();
    });
    // the canopy roof across the top
    ctx.fillStyle = '#3a7448';
    ctx.beginPath();
    each(camX, 0.35, 58, 80, (sx, i) => circ(ctx, sx, -12 + hash(i + 6) * 26, 30 + hash(i + 5) * 26));
    ctx.fill();
    ctx.fillStyle = '#4f955a';
    ctx.beginPath();
    each(camX, 0.35, 58, 80, (sx, i) => circ(ctx, sx + 14, -20 + hash(i + 6) * 26, 14 + hash(i + 7) * 12));
    ctx.fill();
    // hanging vines (with a few leaves)
    ctx.strokeStyle = '#3f6e35'; ctx.lineWidth = 2.5;
    const leaves = [];
    ctx.beginPath();
    each(camX, 0.35, 95, 60, (sx, i) => {
      if (hash(i + 11) < 0.4) return;
      const len = 90 + hash(i + 12) * 170, vx = sx + hash(i + 13) * 40, sw = Math.sin(t * 0.9 + i) * 5;
      ctx.moveTo(vx, 20); ctx.quadraticCurveTo(vx + sw * 0.5, 20 + len * 0.6, vx + sw, 20 + len);
      for (let j = 1; j <= 4; j++) { const k = j / 4.4; leaves.push([vx + sw * k * k, 20 + len * k, j % 2 ? 0.7 : -0.7]); }
    });
    ctx.stroke();
    ctx.fillStyle = '#4f8d3e';
    ctx.beginPath();
    for (const [lx, ly, a] of leaves) ell(ctx, lx + Math.sign(a) * 5, ly, 6, 2.6, a);
    ctx.fill();
    // dappled light shafts
    each(camX, 0.2, 330, 260, (sx, i) => {
      if (hash(i + 21) < 0.35) return;
      const a = 0.07 + 0.04 * Math.sin(t * 0.7 + i * 2);
      ctx.fillStyle = 'rgba(255,248,200,' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx, 0); ctx.lineTo(sx + 56, 0); ctx.lineTo(sx - 40, gy); ctx.lineTo(sx - 160, gy);
      ctx.closePath(); ctx.fill();
    });
    // dark ferny undergrowth along the ground
    ctx.fillStyle = '#2f6a3c';
    ctx.beginPath();
    each(camX, 0.6, 80, 80, (sx, i) => {
      const bx = sx + hash(i + 31) * 30, hgt = 26 + hash(i + 32) * 34;
      for (let j = -3; j <= 3; j++) {
        const a = -Math.PI / 2 + j * 0.4;
        ell(ctx, bx + Math.cos(a) * hgt * 0.5, gy - 2 + Math.sin(a) * hgt * 0.5, hgt * 0.5, 5, a);
      }
    });
    ctx.fill();
    // dark soil and leaf litter, mossy edge, roots
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#5a3d27'], [1, '#2a1a10']]);
    const litter = ['#9a6a34', '#c0843a', '#6f8a3a', '#7a4a26'];
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = litter[c];
      ctx.beginPath();
      each(camX, 1, 22, 20, (sx, i) => {
        if (Math.floor(hash(i + 41) * 4) !== c) return;
        ell(ctx, sx + hash(i + 43) * 14, gy + 8 + hash(i + 42) * (H - gy - 12), 5 + hash(i + 44) * 3, 2.2, hash(i + 45) * 3);
      });
      ctx.fill();
    }
    ctx.fillStyle = '#4e8a3a';
    ctx.fillRect(0, gy, W, 4);
    ctx.lineCap = 'round';
    ctx.beginPath();
    each(camX, 1, 150, 140, (sx, i) => {
      if (hash(i + 51) < 0.45) return;
      const rx = sx + hash(i + 52) * 40, len = 70 + hash(i + 53) * 60;
      ctx.moveTo(rx, gy + 3); ctx.quadraticCurveTo(rx + len * 0.5, gy - 6, rx + len, gy + 14 + hash(i + 54) * 14);
    });
    ctx.strokeStyle = '#2e1d11'; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = '#7a5236'; ctx.lineWidth = 4.5; ctx.stroke();
    if (sunset) dusk(ctx);
  };

  // ---- the Cane Fields: bright sky, a far sugar mill, rolling rows of green-gold cane, a farm track
  const cfHills = (x) => 50 + Math.sin(x * 0.004) * 26 + Math.sin(x * 0.011 + 1) * 14;
  function sugarMill(ctx, mx, by, t) {
    // distant, so soft colours and thin outlines
    ctx.strokeStyle = 'rgba(43,26,20,0.35)'; ctx.lineWidth = 1.5;
    ctx.fillStyle = '#cfd6d8';
    ctx.fillRect(-0 + mx - 120, by - 34, 22, 34); ctx.strokeRect(mx - 120, by - 34, 22, 34);
    A.oval(ctx, mx - 109, by - 34, 11, 4, 0, '#dfe5e6', 'rgba(43,26,20,0.35)', 1.5);
    ctx.fillStyle = '#d8c8ae';
    ctx.fillRect(mx - 86, by - 52, 112, 52); ctx.strokeRect(mx - 86, by - 52, 112, 52);
    ctx.fillStyle = '#a3adb3';
    ctx.beginPath(); ctx.moveTo(mx - 92, by - 52); ctx.lineTo(mx - 30, by - 76); ctx.lineTo(mx + 32, by - 52); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c4ae92';
    ctx.fillRect(mx + 26, by - 36, 52, 36); ctx.strokeRect(mx + 26, by - 36, 52, 36);
    ctx.fillStyle = 'rgba(60,50,45,0.55)';
    for (let j = 0; j < 4; j++) ctx.fillRect(mx - 76 + j * 26, by - 40, 10, 12);
    ctx.fillRect(mx + 36, by - 26, 12, 26);
    // the tall brick chimney and its lazy smoke
    ctx.fillStyle = '#b8714f';
    ctx.beginPath(); ctx.moveTo(mx + 4, by - 52); ctx.lineTo(mx + 7, by - 162); ctx.lineTo(mx + 19, by - 162); ctx.lineTo(mx + 22, by - 52); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a4f36';
    ctx.fillRect(mx + 5, by - 168, 16, 7);
    ctx.fillRect(mx + 6, by - 120, 15, 3);
    for (let j = 0; j < 5; j++) {
      const k = (t * 0.12 + j / 5) % 1;
      ctx.fillStyle = 'rgba(245,245,245,' + (0.6 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(mx + 13 + k * 70, by - 172 - k * 80, 6 + k * 18, 0, TAU); ctx.fill();
    }
  }
  BG.canefields = function (ctx, camX, t, gy, sunset) {
    skyFill(ctx, gy, sunset ? '#3b2a5a' : '#3d95e0', sunset ? '#f08a5a' : '#a9dcff', sunset ? '#ffd08a' : '#fff1c4');
    sunClouds(ctx, camX, t, gy, sunset, 760);
    ridge(ctx, camX, 0.06, gy - 104, gy - 110, '#9cc8a8', cfHills);
    ridge(ctx, camX, 0.06, gy - 104, gy - 110, '#8dbd98', (x) => cfHills(x + 400) * 0.55);
    each(camX, 0.06, 1700, 400, (sx) => sugarMill(ctx, sx + 900, gy - 126, t));
    // far rows of cane, rolling over the hills
    const farTop = (x) => gy - 132 + Math.sin(x * 0.01) * 5;
    const off = camX * 0.15;
    ctx.fillStyle = '#b9c95e';
    ctx.beginPath(); ctx.moveTo(-10, gy - 78);
    for (let sx = -10; sx <= W + 10; sx += 6) ctx.lineTo(sx, farTop(sx + off) - ((sx + off) % 12 < 6 ? 3 : 0));
    ctx.lineTo(W + 10, gy - 78); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,150,50,0.4)'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let r = 0; r < 6; r++) {
      const ry = 10 + r * 11;
      ctx.moveTo(-10, farTop(off - 10) + ry);
      for (let sx = 20; sx <= W + 30; sx += 30) ctx.lineTo(sx, farTop(sx + off) + ry);
    }
    ctx.stroke();
    // feathery cane flowers poking up
    ctx.strokeStyle = 'rgba(240,232,245,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath();
    each(camX, 0.15, 64, 30, (sx, i) => {
      if (hash(i + 61) < 0.5) return;
      const px = sx + hash(i + 62) * 30, py = farTop(px + off) - 2;
      ctx.moveTo(px, py); ctx.lineTo(px + 2, py - 12);
      ctx.moveTo(px + 1, py - 6); ctx.lineTo(px + 5, py - 13);
    });
    ctx.stroke();
    // a little cane train trundling along the far fields
    const trainX = ((t * 26 - camX * 0.15) % 2400 + 2400) % 2400 - 400;
    {
      const ty = gy - 134;
      ctx.strokeStyle = 'rgba(43,26,20,0.4)'; ctx.lineWidth = 1.2;
      for (let j = 0; j < 6; j++) {
        const bx = trainX - 34 - j * 30;
        ctx.fillStyle = '#9aa0a6'; ctx.fillRect(bx, ty - 12, 26, 10); ctx.strokeRect(bx, ty - 12, 26, 10);
        ctx.fillStyle = '#8fb84a'; ctx.beginPath(); ctx.ellipse(bx + 13, ty - 12, 13, 4, 0, Math.PI, TAU); ctx.fill();
      }
      ctx.fillStyle = '#f2c14e'; ctx.fillRect(trainX - 30, ty - 20, 30, 18); ctx.strokeRect(trainX - 30, ty - 20, 30, 18);
      ctx.fillStyle = '#d0573a'; ctx.fillRect(trainX - 30, ty - 24, 14, 6);
      ctx.fillStyle = 'rgba(245,245,245,0.6)'; ctx.beginPath(); ctx.arc(trainX - 6 - (t * 20) % 12, ty - 30 - (t * 20) % 12, 4 + (t * 20) % 12 * 0.4, 0, TAU); ctx.fill();
    }
    // near cane: a dense wall of leaves with golden-green stalks below and drooping blades on top
    const off35 = camX * 0.35;
    const caneTop = (x) => gy - 108 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.11) * 4;
    ctx.fillStyle = '#5f8f30';
    ctx.beginPath(); ctx.moveTo(-14, gy);
    for (let i = Math.floor(off35 / 8) - 2; i * 8 - off35 < W + 16; i++) {
      const sx = i * 8 - off35;
      ctx.lineTo(sx, caneTop(i * 8) + (i & 1 ? 6 : -8 - hash(i + 70) * 18));
    }
    ctx.lineTo(W + 16, gy); ctx.closePath(); ctx.fill();
    A.band(ctx, 0, gy - 100, W, 100, [0, gy - 100, 0, gy], [[0, 'rgba(40,70,20,0)'], [1, 'rgba(40,70,20,0.55)']]);
    const stalks = [[], []];
    each(camX, 0.35, 13, 30, (sx, i) => stalks[i & 1].push([sx + hash(i + 71) * 6, gy - 70 - hash(i + 72) * 30, (hash(i + 73) - 0.5) * 5]));
    ['#b8c75a', '#d4c05e'].forEach((col, c) => {
      ctx.strokeStyle = col; ctx.lineWidth = 4.5;
      ctx.beginPath();
      for (const [x0, top, lean] of stalks[c]) { ctx.moveTo(x0, gy + 1); ctx.lineTo(x0 + lean, top); }
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(70,80,25,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const c of stalks) for (const [x0, top, lean] of c) {
      for (let y = gy - 14; y > top + 6; y -= 15) { const k = (gy - y) / (gy - top); ctx.moveTo(x0 + lean * k - 3, y); ctx.lineTo(x0 + lean * k + 3, y); }
    }
    ctx.stroke();
    ['#4f7f28', '#8cc04a'].forEach((col, c) => {
      ctx.strokeStyle = col; ctx.lineWidth = c ? 2.6 : 3;
      ctx.beginPath();
      each(camX, 0.35, 21, 50, (sx, i) => {
        if ((i & 1) !== c) return;
        const lx = sx + hash(i + 74) * 10, ly = caneTop(i * 21) + 6 + hash(i + 75) * 40;
        const d = hash(i + 76) < 0.5 ? -1 : 1, sw = Math.sin(t * 1.5 + i * 0.7) * 2.5;
        ctx.moveTo(lx, ly + 14); ctx.quadraticCurveTo(lx + d * 12, ly - 12, lx + d * 30 + sw, ly + 8 + hash(i + 77) * 14);
      });
      ctx.stroke();
    });
    // a farm fence along the track
    ctx.strokeStyle = 'rgba(70,60,50,0.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, gy - 28); ctx.lineTo(W, gy - 28); ctx.moveTo(0, gy - 16); ctx.lineTo(W, gy - 16); ctx.stroke();
    ctx.fillStyle = '#7a5a3a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
    each(camX, 0.6, 120, 20, (sx) => { ctx.fillRect(sx, gy - 38, 6, 38); ctx.strokeRect(sx, gy - 38, 6, 38); });
    // the dirt farm track: grass verge, two wheel ruts, pebbles
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#c9a06a'], [1, '#94693f']]);
    ctx.fillStyle = 'rgba(110,70,40,0.3)';
    ctx.fillRect(0, gy + 16, W, 9);
    ctx.fillRect(0, gy + 44, W, 10);
    ctx.fillStyle = '#8db04a';
    ctx.fillRect(0, gy, W, 5);
    ctx.strokeStyle = '#7fa43e'; ctx.lineWidth = 2;
    ctx.beginPath();
    each(camX, 1, 9, 10, (sx, i) => {
      const h = 4 + hash(i + 81) * 6;
      ctx.moveTo(sx, gy + 4); ctx.lineTo(sx - 2 + hash(i + 82) * 4, gy - h);
    });
    each(camX, 1, 26, 10, (sx, i) => {
      if (hash(i + 83) < 0.5) return;
      ctx.moveTo(sx, gy + 36); ctx.lineTo(sx - 3, gy + 29); ctx.moveTo(sx, gy + 36); ctx.lineTo(sx + 3, gy + 30);
    });
    ctx.stroke();
    ['#e2c79a', '#8a6a48'].forEach((col, c) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      each(camX, 1, 31, 10, (sx, i) => { if ((i & 1) === c) ell(ctx, sx + hash(i + 84) * 20, gy + 10 + hash(i + 85) * (H - gy - 14), 2.5 + hash(i + 86) * 2, 1.8, 0); });
      ctx.fill();
    });
    if (sunset) dusk(ctx);
  };

  // ---- the Coast: the sea and a far reef, a little jetty, mangroves in the shallows, sand and mud
  function farJetty(ctx, jx, dy, t) {
    ctx.strokeStyle = '#6b5440'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = jx; px <= jx + 300; px += 22) { ctx.moveTo(px, dy); ctx.lineTo(px, dy + 16); }
    ctx.stroke();
    ctx.fillStyle = '#9a7a58';
    ctx.fillRect(jx - 4, dy - 3, 308, 5);
    // the boat shed at the end, and a little boat
    ctx.fillStyle = '#f1e6d0'; ctx.fillRect(jx + 262, dy - 22, 34, 19);
    ctx.fillStyle = '#d0573a';
    ctx.beginPath(); ctx.moveTo(jx + 258, dy - 22); ctx.lineTo(jx + 279, dy - 34); ctx.lineTo(jx + 300, dy - 22); ctx.closePath(); ctx.fill();
    const bob = Math.sin(t * 1.6) * 1.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(jx + 200, dy + 8 + bob); ctx.lineTo(jx + 232, dy + 8 + bob); ctx.lineTo(jx + 226, dy + 14 + bob); ctx.lineTo(jx + 205, dy + 14 + bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a86ff'; ctx.fillRect(jx + 202, dy + 9 + bob, 28, 2);
  }
  function mangroveTree(ctx, x, base, s, i, far) {
    // stilt roots arching down into the water from a short trunk (some start higher up)
    ctx.strokeStyle = far ? '#55615a' : '#5a4a3a'; ctx.lineCap = 'round';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    for (let j = -4; j <= 4; j++) {
      const hy = base - (40 + hash(i + j * 3) * 22) * s, ex = x + j * (9 + hash(i - j) * 5) * s;
      ctx.moveTo(x + j * 1.5 * s, hy); ctx.quadraticCurveTo(x + j * 9 * s, hy - 6 * s, ex, base + 2);
    }
    ctx.stroke();
    ctx.lineWidth = 5 * s;
    ctx.beginPath(); ctx.moveTo(x, base - 40 * s); ctx.quadraticCurveTo(x - 2 * s, base - 70 * s, x + 3 * s, base - 86 * s); ctx.stroke();
    // a wide, dense, lumpy crown
    const lumps = 6 + Math.floor(hash(i + 7) * 3), span = 26 + hash(i + 8) * 14;
    ctx.fillStyle = far ? '#4a7a5e' : '#2b6a42';
    ctx.beginPath();
    for (let j = 0; j < lumps; j++) {
      const k = j / (lumps - 1) - 0.5;
      circ(ctx, x + k * span * 2.4 * s, base - (92 - Math.abs(k) * 22 + Math.sin(j * 1.7 + i) * 6) * s, (18 + hash(i * 5 + j) * 10) * s);
    }
    ctx.fill();
    ctx.fillStyle = far ? '#5f8f70' : '#3f8a50';
    ctx.beginPath();
    for (let j = 0; j < lumps - 2; j++) {
      const k = j / (lumps - 3) - 0.5;
      circ(ctx, x + k * span * 1.9 * s - 4 * s, base - (104 - Math.abs(k) * 22 + Math.sin(j * 1.7 + i) * 6) * s, (9 + hash(i * 3 + j) * 5) * s);
    }
    ctx.fill();
  }
  BG.coast = function (ctx, camX, t, gy, sunset) {
    const hz = gy - 175;
    skyFill(ctx, hz + 2, sunset ? '#3b2a5a' : '#2f9fe0', sunset ? '#f08a5a' : '#9fe0ff', sunset ? '#ffd08a' : '#e8f9ff');
    sunClouds(ctx, camX, t, gy, sunset, 230);
    // gulls gliding about
    ctx.strokeStyle = sunset ? '#3b2a3a' : '#ffffff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const gx = ((i * 380 + t * (14 + i * 4) - camX * 0.08) % (W + 200) + W + 200) % (W + 200) - 100;
      const gyy = 120 + i * 34 + Math.sin(t * 0.8 + i * 2) * 10, f = Math.sin(t * 5 + i * 1.7) * 4;
      ctx.moveTo(gx - 11, gyy - f); ctx.quadraticCurveTo(gx - 5, gyy - 6 - f * 0.5, gx, gyy); ctx.quadraticCurveTo(gx + 5, gyy - 6 - f * 0.5, gx + 11, gyy - f);
    }
    ctx.stroke();
    // far islands on the horizon
    ctx.fillStyle = '#5a9f84';
    ctx.beginPath();
    each(camX, 0.04, 1300, 300, (sx) => {
      ctx.moveTo(sx + 180, hz + 1); ctx.ellipse(sx + 300, hz + 1, 120, 24, 0, Math.PI, TAU);
      ctx.moveTo(sx + 830, hz + 1); ctx.ellipse(sx + 900, hz + 1, 70, 14, 0, Math.PI, TAU);
    });
    ctx.fill();
    // the sea
    A.band(ctx, 0, hz, W, gy - hz, [0, hz, 0, gy],
      [[0, sunset ? '#2a5a90' : '#1f6fae'], [0.45, sunset ? '#4a8ab0' : '#2a9cc8'], [1, sunset ? '#7ab8b8' : '#5fd3c6']]);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, hz, W, 2);
    // the reef: irregular turquoise shallows with surf breaking along the seaward edge
    each(camX, 0.1, 260, 240, (sx, i) => {
      if (hash(i + 91) < 0.3) return;
      const rx = 70 + hash(i + 92) * 80, ry = 4 + hash(i + 94) * 3, cy = hz + 22 + hash(i + 93) * 30;
      ctx.fillStyle = 'rgba(100,225,210,0.5)';
      ctx.beginPath();
      for (let j = 0; j < 5; j++) ell(ctx, sx - rx * 0.7 + j * rx * 0.35, cy + ((j * 7) % 3) - 1, rx * (0.26 + hash(i * 4 + j) * 0.16), ry * (0.8 + hash(i * 3 + j) * 0.6), 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(150,240,225,0.55)';
      ctx.beginPath();
      for (let j = 0; j < 3; j++) ell(ctx, sx - rx * 0.4 + j * rx * 0.4, cy + 1, rx * 0.14, ry * 0.45, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 + 0.3 * Math.sin(t * 2 + i)).toFixed(3) + ')'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const dx = sx - rx * 0.85 + j * rx * 0.32 + Math.sin(t * 1.2 + j + i) * 3;
        ctx.moveTo(dx, cy - ry - 1); ctx.lineTo(dx + rx * 0.18, cy - ry - 1.5);
      }
      ctx.stroke();
    });
    // little wavelets
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 0.15, 55, 40, (sx, i) => {
      const wy = hz + 12 + hash(i + 101) * (gy - hz - 70), wx = sx + hash(i + 102) * 30 + Math.sin(t * 1.5 + i) * 4;
      ctx.moveTo(wx - 7, wy); ctx.quadraticCurveTo(wx, wy - 3, wx + 7, wy);
    });
    ctx.stroke();
    each(camX, 0.12, 1900, 400, (sx) => farJetty(ctx, sx + 1100, hz + 62, t));
    // a sailboat far out at sea
    each(camX, 0.06, 1500, 100, (sx) => {
      const bx = sx + 520 + Math.sin(t * 0.2) * 30, by = hz + 14 + Math.sin(t * 1.4) * 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(bx, by - 2); ctx.lineTo(bx, by - 24); ctx.lineTo(bx + 14, by - 3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx - 2, by - 3); ctx.lineTo(bx - 2, by - 18); ctx.lineTo(bx - 10, by - 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d0573a';
      ctx.beginPath(); ctx.moveTo(bx - 12, by - 2); ctx.lineTo(bx + 16, by - 2); ctx.lineTo(bx + 11, by + 3); ctx.lineTo(bx - 8, by + 3); ctx.closePath(); ctx.fill();
    });
    // shallows (fading in from the sea) with mangroves standing in them
    A.band(ctx, 0, gy - 80, W, 82, [0, gy - 80, 0, gy],
      [[0, sunset ? 'rgba(138,176,160,0)' : 'rgba(99,199,180,0)'], [0.45, sunset ? '#8ab0a0' : '#63c7b4'], [1, '#7f9a72']]);
    each(camX, 0.25, 110, 120, (sx, i) => {
      if (hash(i + 115) < 0.5) return;
      mangroveTree(ctx, sx + hash(i + 116) * 50, gy - 40, 0.5 + hash(i + 117) * 0.2, i + 50, true);
    });
    each(camX, 0.35, 150, 160, (sx, i) => {
      if (hash(i + 111) < 0.35) return;
      mangroveTree(ctx, sx + hash(i + 112) * 60, gy - 30, 0.8 + hash(i + 113) * 0.35, i, false);
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 0.35, 40, 20, (sx, i) => { const wy = gy - 28 + hash(i + 114) * 18; ctx.moveTo(sx, wy); ctx.lineTo(sx + 12 + Math.sin(t * 2 + i) * 3, wy); });
    ctx.stroke();
    // sand and mud: wet sheen, ripples, shells and crab holes
    A.band(ctx, 0, gy, W, H - gy, [0, gy, 0, H], [[0, '#d9c08a'], [0.35, '#e6d29e'], [1, '#a88c5a']]);
    ctx.fillStyle = 'rgba(110,90,60,0.28)';
    ctx.fillRect(0, gy, W, 12);
    ctx.strokeStyle = 'rgba(150,115,70,0.45)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    each(camX, 1, 60, 30, (sx, i) => {
      const ry = gy + 20 + hash(i + 121) * (H - gy - 28);
      ctx.moveTo(sx, ry); ctx.quadraticCurveTo(sx + 8, ry - 3, sx + 16, ry); ctx.quadraticCurveTo(sx + 24, ry + 3, sx + 32, ry);
    });
    ctx.stroke();
    ctx.fillStyle = '#5a4630';
    ctx.beginPath();
    each(camX, 1, 47, 20, (sx, i) => { if (hash(i + 122) < 0.4) ell(ctx, sx, gy + 16 + hash(i + 123) * 40, 3, 1.6, 0); });
    ctx.fill();
    ctx.fillStyle = '#fbe9e0';
    ctx.beginPath();
    each(camX, 1, 83, 20, (sx, i) => {
      if (hash(i + 124) < 0.5) return;
      const cx = sx + hash(i + 125) * 40, cy = gy + 20 + hash(i + 126) * 40;
      ctx.moveTo(cx, cy); ctx.arc(cx, cy, 4, Math.PI, TAU); ctx.closePath();
    });
    ctx.fill();
    ctx.fillStyle = '#c9b07a';
    ctx.fillRect(0, gy, W, 2);
    if (sunset) dusk(ctx);
  };

  const baseBackground = A.background;
  A.background = function (ctx, camX, t, groundY, skyKind, theme) {
    if (typeof theme === 'string' && has(BG, theme)) BG[theme](ctx, camX, t, groundY, skyKind === 'sunset');
    else baseBackground(ctx, camX, t, groundY, skyKind);
  };

  // ================================================================ ground plants
  const PLANTS = {
    // a fern: arching fronds with leaflets
    rainforest(ctx, x, y, s) {
      ctx.lineCap = 'round';
      const fronds = [];
      for (const [a, L, droop] of [[-2.75, 26, 10], [-2.2, 30, 6], [-1.57, 32, 2], [-0.94, 30, 6], [-0.39, 26, 10]]) {
        const ex = x + Math.cos(a) * L * s, ey = y + Math.sin(a) * L * 0.75 * s + droop * s;
        const cx = x + Math.cos(a) * L * 0.5 * s, cy = y + Math.sin(a) * L * 1.0 * s;
        fronds.push([cx, cy, ex, ey]);
      }
      // leaflets along each frond, getting smaller toward the tip
      ['#3f8f42', '#5fb055'].forEach((col, c) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        for (const [cx, cy, ex, ey] of fronds) {
          for (let k = 0.18; k < 0.96; k += 0.13) {
            const m = 1 - k;
            const px = m * m * x + 2 * m * k * cx + k * k * ex, py = m * m * y + 2 * m * k * cy + k * k * ey;
            const dx = 2 * m * (cx - x) + 2 * k * (ex - cx), dy = 2 * m * (cy - y) + 2 * k * (ey - cy);
            const ang = Math.atan2(dy, dx), ll = ((1 - k) * 5 + 1.6) * s, side = c ? 1 : -1;
            const la = ang + side * 1.15;
            ell(ctx, px + Math.cos(la) * ll * 0.9, py + Math.sin(la) * ll * 0.9, ll, ll * 0.38, la);
          }
        }
        ctx.fill();
      });
      ctx.strokeStyle = '#2b6a33'; ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      for (const [cx, cy, ex, ey] of fronds) { ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, ex, ey); }
      ctx.stroke();
    },
    // a short tuft of young sugar cane
    canefields(ctx, x, y, s) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#b7c556'; ctx.lineWidth = 3.5 * s;
      ctx.beginPath();
      for (let j = -1.5; j <= 1.5; j++) { ctx.moveTo(x + j * 5 * s, y); ctx.lineTo(x + j * 6 * s, y - (24 + (2 - Math.abs(j)) * 6) * s); }
      ctx.stroke();
      ctx.strokeStyle = '#6fa83a'; ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      for (let j = -1.5; j <= 1.5; j++) {
        const tx = x + j * 6 * s, ty = y - (24 + (2 - Math.abs(j)) * 6) * s, d = j < 0 ? -1 : 1;
        ctx.moveTo(tx, ty + 4 * s); ctx.quadraticCurveTo(tx + d * 10 * s, ty - 8 * s, tx + d * 20 * s, ty + 10 * s);
        ctx.moveTo(tx, ty + 10 * s); ctx.quadraticCurveTo(tx - d * 8 * s, ty, tx - d * 14 * s, ty + 14 * s);
      }
      ctx.stroke();
    },
    // beach grass, or a mangrove seedling sprouting in the mud
    coast(ctx, x, y, s) {
      ctx.lineCap = 'round';
      if (hash(Math.round(x) * 0.37) < 0.5) {
        ctx.lineWidth = 2 * s;
        for (let j = -3; j <= 3; j++) {
          ctx.strokeStyle = j % 2 ? '#b9bd6a' : '#94b45c';
          const L = (16 + (3 - Math.abs(j)) * 4) * s;
          ctx.beginPath(); ctx.moveTo(x + j * 1.5 * s, y);
          ctx.quadraticCurveTo(x + j * 4 * s, y - L * 0.8, x + j * 9 * s, y - L + Math.abs(j) * 3 * s);
          ctx.stroke();
        }
      } else {
        // a mangrove seedling: a long seed pod stuck in the mud, sprouting two pairs of leaves
        ctx.strokeStyle = '#6b7a3a'; ctx.lineWidth = 3 * s;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1 * s, y - 20 * s); ctx.stroke();
        ctx.strokeStyle = '#4a3a26'; ctx.lineWidth = 3.4 * s;
        ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + 0.3 * s, y - 6 * s); ctx.stroke();
        for (const [a, l] of [[-1.1, 6], [1.1, 6], [-0.42, 9], [0.42, 9]]) {
          A.oval(ctx, x + 1 * s + Math.sin(a) * l * 0.85 * s, y - 20 * s - Math.cos(a) * l * 0.85 * s, 2.2 * s, l * s, a, '#3f8a4a', LINE, 1);
        }
      }
    },
  };
  A.groundPlant = function (ctx, theme, x, y, s) {
    s = s || 1;
    if (typeof theme === 'string' && has(PLANTS, theme)) PLANTS[theme](ctx, x, y, s);
    else A.spinifex(ctx, x, y, s);
  };

  // ================================================================ platforms
  // p = { x, y, w }: the walkable top is y (about 14 px thick); supports reach down to groundY.
  const PLAT = {
    // a mossy fallen log hung from the canopy by thick vines
    rainforest(ctx, p, gy) {
      ctx.lineCap = 'round';
      for (const vx of [p.x + 18, p.x + p.w - 18]) {
        ctx.strokeStyle = LINE; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(vx, p.y + 8); ctx.quadraticCurveTo(vx - 8, p.y / 2, vx + 4, -20); ctx.stroke();
        ctx.strokeStyle = '#4f7a2f'; ctx.lineWidth = 4;
        ctx.stroke();
        for (let ly = p.y - 30; ly > 0; ly -= 34) {
          const k = (p.y + 8 - ly) / (p.y + 28);
          A.oval(ctx, vx - 8 * 2 * k * (1 - k) + 4 * k * k + 5, ly, 6, 2.6, 0.5, '#5fa043', LINE, 1);
        }
      }
      // the log
      ctx.fillStyle = '#7a5232'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(p.x - 4, p.y, p.w + 8, 20, 9); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(50,25,10,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = p.x + 14; x < p.x + p.w - 20; x += 26) { ctx.moveTo(x, p.y + 8 + (x % 3)); ctx.lineTo(x + 18, p.y + 10 + (x % 4)); }
      ctx.stroke();
      // cut ends with tree rings
      for (const ex of [p.x - 2, p.x + p.w + 2]) {
        A.oval(ctx, ex, p.y + 10, 6, 9.5, 0, '#d8b07a', LINE, 2);
        A.oval(ctx, ex, p.y + 10, 3, 5, 0, null, '#a87a48', 1.2);
      }
      // the vine loops around it
      ctx.strokeStyle = '#4f7a2f'; ctx.lineWidth = 3.5;
      for (const vx of [p.x + 18, p.x + p.w - 18]) { ctx.beginPath(); ctx.ellipse(vx, p.y + 10, 4, 11, 0, 0, TAU); ctx.stroke(); }
      // moss on top, dripping down in places, and a little orange fungus
      ctx.fillStyle = '#5fa84a';
      ctx.beginPath();
      for (let x = p.x + 2; x < p.x + p.w - 2; x += 9) circ(ctx, x, p.y + 1 + Math.sin(x * 0.7) * 1, 5);
      ctx.fill();
      ctx.beginPath();
      for (let x = p.x + 20; x < p.x + p.w - 10; x += 47) ell(ctx, x, p.y + 10, 3, 8, 0);
      ctx.fill();
      A.oval(ctx, p.x + p.w * 0.6, p.y + 14, 6, 2.5, 0, '#ff9f1c', LINE, 1.2);
    },
    // hay bales on a farm trailer (low) or a timber stand (high)
    canefields(ctx, p, gy) {
      const gap = gy - p.y;
      ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      if (gap <= 120) {
        const wr = 15, wy = gy - wr;
        ctx.fillStyle = '#6c757d';
        for (const wx of [p.x + 28, p.x + p.w - 28]) {
          ctx.fillRect(wx - 3, p.y + 24, 6, wy - p.y - 24);
          A.oval(ctx, wx, wy, wr, wr, 0, '#2b2d42', LINE, 2);
          A.oval(ctx, wx, wy, 6, 6, 0, '#adb5bd', LINE, 1.5);
        }
        ctx.strokeStyle = '#495057'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(p.x - 2, p.y + 30); ctx.lineTo(p.x - 24, p.y + 38); ctx.stroke();
        ctx.fillStyle = '#c1121f'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(p.x - 4, p.y + 18, p.w + 8, 12, 3); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#8a7a6a';
        for (const lx of [p.x + 10, p.x + p.w - 20]) { ctx.fillRect(lx, p.y + 18, 10, gy - p.y - 18); ctx.strokeRect(lx, p.y + 18, 10, gy - p.y - 18); }
        ctx.strokeStyle = '#6b5e50'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x + 18, p.y + 26); ctx.lineTo(p.x + p.w - 16, gy - 8);
        ctx.moveTo(p.x + p.w - 18, p.y + 26); ctx.lineTo(p.x + 16, gy - 8);
        ctx.stroke();
        ctx.fillStyle = '#6b4a2e'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(p.x, p.y + 17, p.w, 8, 2); ctx.fill(); ctx.stroke();
      }
      // the bales
      const n = Math.max(1, Math.round(p.w / 52)), bw = p.w / n;
      for (let j = 0; j < n; j++) {
        const bx = p.x + j * bw;
        ctx.fillStyle = '#e8c45a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(bx + 1, p.y - 2, bw - 2, 21, 4); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#c49a32'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = 0; k < 7; k++) {
          const sx = bx + 5 + hash(j * 7 + k + p.x) * (bw - 12), sy = p.y + 2 + hash(j * 5 + k + p.y) * 13;
          ctx.moveTo(sx, sy); ctx.lineTo(sx + 5, sy + 1.5);
        }
        ctx.stroke();
        ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(bx + bw * 0.3, p.y - 1); ctx.lineTo(bx + bw * 0.3, p.y + 18); ctx.moveTo(bx + bw * 0.7, p.y - 1); ctx.lineTo(bx + bw * 0.7, p.y + 18); ctx.stroke();
      }
    },
    // weathered jetty planks on round posts, with weed and barnacles at the waterline
    coast(ctx, p, gy) {
      const n = Math.max(2, Math.round(p.w / 56) + 1);
      for (let j = 0; j < n; j++) {
        const px = p.x + 8 + (j / (n - 1)) * (p.w - 16);
        ctx.fillStyle = '#7a5a40'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px - 5, p.y + 10, 10, gy - p.y - 4, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4f7a4a';
        ctx.fillRect(px - 4, gy - 22, 8, 16);
        ctx.fillStyle = '#efe6d6';
        ctx.beginPath(); circ(ctx, px - 2, gy - 16, 1.6); circ(ctx, px + 2, gy - 10, 1.4); circ(ctx, px - 1, gy - 26, 1.2); ctx.fill();
      }
      ctx.fillStyle = '#5a3e28'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.fillRect(p.x + 2, p.y + 12, p.w - 4, 6); ctx.strokeRect(p.x + 2, p.y + 12, p.w - 4, 6);
      ctx.fillStyle = '#b08a5a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 13, 3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,45,20,0.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = p.x + 16; x < p.x + p.w - 4; x += 16) { ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + 12); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 2);
      // a rope coiled round the end post
      ctx.strokeStyle = '#d9b77a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x + p.w - 13, p.y + 24); ctx.lineTo(p.x + p.w - 3, p.y + 21); ctx.moveTo(p.x + p.w - 13, p.y + 30); ctx.lineTo(p.x + p.w - 3, p.y + 27); ctx.stroke();
    },
  };
  const basePlatform = A.platform;
  A.platform = function (ctx, p, groundY, theme) {
    if (typeof theme === 'string' && has(PLAT, theme)) { ctx.save(); PLAT[theme](ctx, p, groundY); ctx.restore(); }
    else basePlatform(ctx, p, groundY);
  };

  // ================================================================ river water
  // Spans x..x+w from the water line surfaceY down past groundY. Called twice: front=false before the
  // characters (the murky water and the river bed), front=true after them (see-through, wavy surface).
  A.water = function (ctx, x, w, surfaceY, groundY, t, front) {
    if (!(w > 0)) return;
    t = t || 0;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, -100, w, H + 200); ctx.clip();
    const seed = Math.round(x);
    if (!front) {
      const g = ctx.createLinearGradient(0, surfaceY, 0, H);
      g.addColorStop(0, '#6b8a58'); g.addColorStop(0.5, '#4a6440'); g.addColorStop(1, '#2e3e28');
      ctx.fillStyle = g;
      ctx.fillRect(x, surfaceY, w, H - surfaceY);
      // light wobbling through the water
      ctx.strokeStyle = 'rgba(200,230,170,0.16)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let j = 0; j < w / 40; j++) {
        const lx = x + j * 40 + Math.sin(t + j) * 6;
        ctx.moveTo(lx, surfaceY + 10); ctx.lineTo(lx - 30, groundY - 10);
      }
      ctx.stroke();
      // the muddy river bed with pebbles and swaying weed
      ctx.fillStyle = '#3d3424';
      ctx.fillRect(x, groundY, w, H - groundY);
      ctx.fillStyle = '#5a4c36';
      ctx.beginPath();
      for (let j = 0; j < w / 26; j++) ell(ctx, x + j * 26 + hash(seed + j) * 18, groundY + 4 + hash(seed + j * 3) * 30, 4 + hash(seed + j * 7) * 4, 2.5, 0);
      ctx.fill();
      ctx.strokeStyle = '#4f7a3a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j < w / 55; j++) {
        const wx = x + 20 + j * 55 + hash(seed + j * 11) * 20, wh = 22 + hash(seed + j * 13) * 26, sw = Math.sin(t * 1.4 + j) * 6;
        ctx.moveTo(wx, groundY + 2); ctx.quadraticCurveTo(wx + sw, groundY - wh * 0.5, wx + sw * 0.6, groundY - wh);
        ctx.moveTo(wx + 6, groundY + 2); ctx.quadraticCurveTo(wx + 6 - sw, groundY - wh * 0.4, wx + 4 - sw * 0.5, groundY - wh * 0.7);
      }
      ctx.stroke();
      // reeds at both banks (their stems disappear under the front water)
      for (const rx of [x + 10, x + w - 10]) {
        ctx.strokeStyle = '#6b8a3a'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let j = -2; j <= 2; j++) { ctx.moveTo(rx + j * 4, groundY); ctx.lineTo(rx + j * 5 + Math.sin(t + j) * 2, surfaceY - 34 - (2 - Math.abs(j)) * 8); }
        ctx.stroke();
        for (const j of [-1, 1]) A.oval(ctx, rx + j * 5 + Math.sin(t + j) * 2, surfaceY - 44, 3, 8, 0, '#7a4a26', LINE, 1.2);
      }
    } else {
      // see-through front layer with a wavy top
      const wave = (sx) => surfaceY + Math.sin(sx * 0.05 + t * 2.2) * 2.5 + Math.sin(sx * 0.11 - t * 1.3) * 1.2;
      const g = ctx.createLinearGradient(0, surfaceY, 0, H);
      g.addColorStop(0, 'rgba(96,135,84,0.42)'); g.addColorStop(1, 'rgba(46,64,40,0.72)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, H);
      for (let sx = x; sx <= x + w + 10; sx += 10) ctx.lineTo(sx, wave(sx));
      ctx.lineTo(x + w + 10, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(200,230,180,0.18)';
      ctx.fillRect(x, surfaceY + 3, w, 7);
      ctx.strokeStyle = 'rgba(225,245,210,0.85)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, wave(x));
      for (let sx = x + 10; sx <= x + w + 10; sx += 10) ctx.lineTo(sx, wave(sx));
      ctx.stroke();
      // ripples spreading on the surface
      ctx.lineWidth = 1.5;
      for (let j = 0; j < w / 120; j++) {
        const k = (t * 0.6 + hash(seed + j * 5)) % 1;
        const rx = x + 40 + j * 120 + hash(seed + j) * 50;
        ctx.strokeStyle = 'rgba(235,250,225,' + (0.7 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(rx, surfaceY + 4, 6 + k * 24, 2 + k * 4, 0, 0, TAU); ctx.stroke();
      }
      // floating leaves and a few bubbles
      for (let j = 0; j < w / 170; j++) {
        const lx = x + ((hash(seed + j * 9) * w + t * 12) % w);
        A.oval(ctx, lx, wave(lx) + 1, 6, 2.5, 0.2, '#8aa83a', LINE, 1);
      }
      ctx.strokeStyle = 'rgba(230,250,230,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let j = 0; j < w / 60; j++) {
        const k = (t * 0.4 + hash(seed + j * 17)) % 1;
        const bx = x + 20 + j * 60 + Math.sin(t * 3 + j) * 3, by = lerp(groundY - 6, surfaceY + 12, k);
        circ(ctx, bx, by, 1.5 + k * 1.5);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // ================================================================ decorations
  // d = { type, x, ... } in world space (the camera is already applied). d.x is the centre.
  const DECOR = {};

  // a giant rainforest tree: buttress roots, a trunk off the top of the screen (or d.h tall), leaves
  function canopy(ctx, cx, cy, rx, ry, seed) {
    const cols = ['#2f6e3c', '#3f8a4a', '#5fae5a'];
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = cols[c];
      ctx.beginPath();
      const n = c === 2 ? 5 : 8;
      for (let j = 0; j < n; j++) {
        const a = (j / n) * TAU + hash(seed + j) * 0.6;
        const k = c === 0 ? 0.75 : c === 1 ? 0.5 : 0.35;
        circ(ctx, cx + Math.cos(a) * rx * k - c * 6, cy + Math.sin(a) * ry * k - c * 10, (c === 2 ? 0.22 : 0.4) * Math.min(rx, ry * 1.6) * (0.8 + hash(seed + j * 3) * 0.4));
      }
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(30,60,30,0.35)'; ctx.lineWidth = 2;
  }
  DECOR.tree = function (ctx, d, gy, t) {
    const x = d.x, tw = 54;
    const top = d.h ? gy - d.h : -30;
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    // trunk, flaring out at the foot into buttress roots
    ctx.fillStyle = '#8a7052';
    ctx.beginPath();
    ctx.moveTo(x - tw / 2 + 7, top); ctx.lineTo(x - tw / 2, gy - 120);
    ctx.quadraticCurveTo(x - tw / 2 - 2, gy - 22, x - 96, gy + 2);
    ctx.lineTo(x + 90, gy + 2);
    ctx.quadraticCurveTo(x + tw / 2 + 2, gy - 22, x + tw / 2, gy - 120);
    ctx.lineTo(x + tw / 2 - 7, top);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,40,20,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let j = -2; j <= 2; j++) { ctx.moveTo(x + j * 8, top + 20); ctx.lineTo(x + j * 9 + 2, gy - 30); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,210,0.15)';
    ctx.fillRect(x + tw / 2 - 16, top, 6, gy - top);
    // a strangler vine spiralling up, moss and a bird's-nest fern
    ctx.strokeStyle = '#5a6b2a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - tw / 2, gy - 20);
    for (let y = gy - 20, k = 0; y > top + 20; y -= 30, k++) ctx.quadraticCurveTo(x + (k % 2 ? -1 : 1) * tw * 0.7, y - 15, x + (k % 2 ? 1 : -1) * tw * 0.45, y - 30);
    ctx.stroke();
    ctx.fillStyle = '#6aa84f';
    ctx.beginPath(); ell(ctx, x - 12, gy - 150, 10, 16, 0.2); ell(ctx, x + 14, gy - 230, 8, 12, -0.2); ell(ctx, x - 6, gy - 320, 9, 13, 0); ctx.fill();
    const fy = Math.max(top + 60, gy - 270);
    for (let j = -3; j <= 3; j++) A.oval(ctx, x + 18 + Math.sin(j * 0.5) * 16, fy - Math.cos(j * 0.5) * 12, 4, 15, j * 0.45, '#4fa04a', LINE, 1.2);
    // the buttress fins: lit ridges with a shadow line beside each
    ctx.lineCap = 'round';
    for (const [a, b, hgt] of [[-16, -66, 100], [-6, -30, 76], [8, 26, 80], [17, 60, 104]]) {
      ctx.beginPath(); ctx.moveTo(x + a, gy - hgt); ctx.quadraticCurveTo(x + a + (b - a) * 0.15, gy - hgt * 0.3, x + b, gy + 1);
      ctx.strokeStyle = '#a88a66'; ctx.lineWidth = 7; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + a + 4, gy - hgt + 4); ctx.quadraticCurveTo(x + a + 4 + (b - a) * 0.15, gy - hgt * 0.3, x + b + 5, gy + 1);
      ctx.strokeStyle = 'rgba(43,26,20,0.75)'; ctx.lineWidth = 2; ctx.stroke();
    }
    // branches and leaves at the top
    ctx.strokeStyle = LINE; ctx.lineWidth = 8; ctx.lineCap = 'round';
    const by = d.h ? top + 20 : 70;
    ctx.beginPath(); ctx.moveTo(x, by + 30); ctx.quadraticCurveTo(x - 50, by, x - 90, by - 30); ctx.moveTo(x, by + 10); ctx.quadraticCurveTo(x + 50, by - 10, x + 86, by - 40); ctx.stroke();
    ctx.strokeStyle = '#8a7052'; ctx.lineWidth = 5; ctx.stroke();
    canopy(ctx, x, d.h ? top - 20 : -10, 150, 75, Math.round(x));
  };

  // hanging vines from the top of the screen, gently swaying
  DECOR.vines = function (ctx, d, gy, t) {
    const L0 = d.h || 200 + hash(d.x) * 80;
    ctx.lineCap = 'round';
    [[-14, 0.8], [0, 1], [12, 0.65]].forEach(([dx, k], i) => {
      const vx = d.x + dx, L = L0 * k, sw = Math.sin(t * 1.2 + i * 1.7 + d.x) * 7;
      ctx.strokeStyle = LINE; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(vx, -10); ctx.quadraticCurveTo(vx + sw * 0.3, L * 0.55, vx + sw, L); ctx.stroke();
      ctx.strokeStyle = '#4a7a2a'; ctx.lineWidth = 3; ctx.stroke();
      for (let j = 1; j * 22 < L; j++) {
        const q = (j * 22) / L, m = 1 - q;
        const px = m * m * vx + 2 * m * q * (vx + sw * 0.3) + q * q * (vx + sw), py = 2 * m * q * L * 0.55 + q * q * L - 10 * m * m;
        const side = j % 2 ? 1 : -1;
        A.oval(ctx, px + side * 6, py, 6.5, 3, side * 0.6, j % 3 ? '#5fa043' : '#4f8d3e', LINE, 1);
      }
      ctx.strokeStyle = '#4a7a2a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(vx + sw + 4, L, 4, Math.PI, Math.PI * 2.6); ctx.stroke();
    });
  };

  // a small waterfall off a mossy rock ledge into a foamy pool
  DECOR.waterfall = function (ctx, d, gy, t) {
    const x = d.x, h = d.h || 120, top = gy - h;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // a mossy rock outcrop
    ctx.fillStyle = '#76847f'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 84, gy + 2);
    ctx.quadraticCurveTo(x - 82, top + 34, x - 56, top + 8);
    ctx.quadraticCurveTo(x - 30, top - 8, x - 2, top - 4);
    ctx.quadraticCurveTo(x + 32, top - 10, x + 58, top + 10);
    ctx.quadraticCurveTo(x + 84, top + 36, x + 86, gy + 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,50,48,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 60, top + 30); ctx.lineTo(x - 48, top + 54); ctx.lineTo(x - 56, top + 80);
    ctx.moveTo(x + 50, top + 26); ctx.lineTo(x + 62, top + 60);
    ctx.moveTo(x + 40, gy - 30); ctx.lineTo(x + 58, gy - 40);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath(); ctx.ellipse(x - 50, top + 26, 12, 22, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5fa84a';
    ctx.beginPath();
    for (let j = 0; j < 9; j++) circ(ctx, x - 58 + j * 14, top - 2 + Math.abs(j - 4) * 2.5 + (j % 2) * 2, 7 + (j % 3) * 2);
    ell(ctx, x - 70, top + 40, 6, 12, 0.3); ell(ctx, x + 70, top + 50, 5, 10, -0.3);
    ctx.fill();
    // pool
    A.oval(ctx, x, gy - 3, 70, 10, 0, '#5fb8d8', LINE, 2);
    // the water pouring over the lip
    ctx.fillStyle = '#a8e2f2'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 18, top - 3); ctx.quadraticCurveTo(x, top - 7, x + 18, top - 3); ctx.lineTo(x + 26, gy - 6); ctx.lineTo(x - 26, gy - 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(43,26,20,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 18, top - 3); ctx.lineTo(x - 26, gy - 6); ctx.moveTo(x + 18, top - 3); ctx.lineTo(x + 26, gy - 6); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let j = 0; j < 8; j++) {
      const lx = x - 13 + (j % 4) * 9, y = top + 4 + ((t * 120 + j * 37) % Math.max(10, h - 24));
      ctx.moveTo(lx, y); ctx.lineTo(lx + (lx - x) * 0.06, y + 14);
    }
    ctx.stroke();
    // boulders at the foot
    for (const [bx, r] of [[-56, 20], [-34, 13], [52, 18], [30, 11]]) {
      A.oval(ctx, x + bx, gy - r * 0.55, r, r * 0.75, 0, '#8d9a96', LINE, 2.2);
      A.oval(ctx, x + bx - r * 0.25, gy - r * 1.0, r * 0.55, r * 0.22, 0, '#6aa84f');
    }
    // foam and splashes
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    for (let j = 0; j < 6; j++) circ(ctx, x - 28 + j * 11, gy - 8 + Math.sin(t * 6 + j * 2) * 2, 5 + Math.abs(Math.sin(t * 4 + j)) * 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,240,255,0.9)';
    for (let j = 0; j < 4; j++) {
      const k = (t * 1.6 + j / 4) % 1;
      ctx.beginPath(); ctx.arc(x + (j % 2 ? 1 : -1) * (20 + k * 30), gy - 12 - Math.sin(k * Math.PI) * 22, 2.4, 0, TAU); ctx.fill();
    }
  };

  // a tall clump of sugar cane
  DECOR.cane = function (ctx, d, gy, t) {
    const h = d.h || 180, x = d.x;
    ctx.lineCap = 'round';
    const tops = [];
    for (let j = 0; j < 9; j++) {
      const bx = x - 28 + j * 7, sh = h * (0.75 + hash(x + j) * 0.25);
      const tx = bx + (j - 4) * 4 + Math.sin(t * 1.3 + j) * 2.5, ty = gy - sh;
      ctx.strokeStyle = LINE; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.strokeStyle = j % 3 === 1 ? '#c9b04a' : j % 3 === 2 ? '#a2b44a' : '#8fb84a'; ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(70,60,20,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0.12; k < 0.95; k += 0.12) { const nx = lerp(bx, tx, k), ny = lerp(gy, ty, k); ctx.moveTo(nx - 3, ny); ctx.lineTo(nx + 3, ny); }
      ctx.stroke();
      tops.push([tx, ty, j]);
    }
    // long arching leaves from the tops
    for (const [tx, ty, j] of tops) {
      for (const [dx, dy, len] of [[-1, 0, 46], [1, 4, 50], [-1, 22, 38], [1, 30, 34]]) {
        const sw = Math.sin(t * 1.5 + j + dx) * 3;
        ctx.fillStyle = (j + dy) % 2 ? '#6fae3a' : '#88c24a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
        A.taper(ctx, tx, ty + dy, tx + dx * len * 0.5, ty + dy - 22, tx + dx * len + sw, ty + dy + 14, 5, 0.5);
        ctx.fill(); ctx.stroke();
      }
    }
  };

  // a mangrove tree on arching stilt roots
  DECOR.mangrove = function (ctx, d, gy, t) {
    const x = d.x, s = (d.h || 210) / 210;
    ctx.lineCap = 'round';
    // little breathing roots poking up from the mud
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let j = -5; j <= 5; j++) { const px = x + j * 15 + hash(x + j) * 6; ctx.moveTo(px, gy + 2); ctx.lineTo(px + 1, gy - 6 - hash(x - j) * 6); }
    ctx.stroke();
    const roots = [];
    for (let j = -4; j <= 4; j++) roots.push([x + j * 3 * s, gy - (70 + Math.abs(j) * 4) * s, x + j * 20 * s, gy - (86 - Math.abs(j) * 6) * s, x + j * 20 * s + j * 4 * s, gy + 2]);
    ctx.strokeStyle = LINE; ctx.lineWidth = 7 * s;
    ctx.beginPath();
    for (const r of roots) { ctx.moveTo(r[0], r[1]); ctx.quadraticCurveTo(r[2], r[3], r[4], r[5]); }
    ctx.moveTo(x, gy - 72 * s); ctx.lineTo(x + 3 * s, gy - 150 * s);
    ctx.stroke();
    ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = 4.5 * s; ctx.stroke();
    ctx.strokeStyle = LINE; ctx.lineWidth = 14 * s;
    ctx.beginPath(); ctx.moveTo(x, gy - 66 * s); ctx.lineTo(x + 3 * s, gy - 150 * s); ctx.stroke();
    ctx.strokeStyle = '#7a6854'; ctx.lineWidth = 10 * s; ctx.stroke();
    // leafy crown
    const sway = Math.sin(t * 0.8 + x) * 2;
    const blobs = [[-62, -150, 34], [-30, -178, 40], [8, -190, 42], [46, -172, 38], [72, -146, 30], [-8, -150, 40], [34, -140, 30], [-44, -132, 26]];
    ctx.fillStyle = '#2f6e40'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const [bx, by, r] of blobs) circ(ctx, x + bx * s + sway, gy + by * s, r * s);
    ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#3f8a4a';
    ctx.beginPath();
    for (const [bx, by, r] of blobs) circ(ctx, x + (bx - 4) * s + sway, gy + (by - 6) * s, r * 0.7 * s);
    ctx.fill();
    ctx.fillStyle = '#5fa85a';
    ctx.beginPath();
    for (const [bx, by, r] of blobs.slice(0, 5)) circ(ctx, x + (bx - 10) * s + sway, gy + (by - 14) * s, r * 0.3 * s);
    ctx.fill();
    // long green seed pods hanging under the leaves
    ctx.strokeStyle = '#6a8a2a'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (const px of [-40, -6, 30, 56]) { ctx.moveTo(x + px * s + sway, gy - 122 * s); ctx.lineTo(x + px * s + sway + 1, gy - 104 * s); }
    ctx.stroke();
  };

  // a rusty corrugated-iron farm shed with a rainwater tank
  DECOR.shed = function (ctx, d, gy, t) {
    const w = d.w || 200, h = 110, x0 = d.x - w / 2;
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    // the tank
    const tx = x0 + w + 34;
    ctx.fillStyle = '#b8c0c4';
    ctx.beginPath(); ctx.roundRect(tx - 26, gy - 74, 52, 74, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,90,95,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let y = gy - 66; y < gy; y += 7) { ctx.moveTo(tx - 25, y); ctx.lineTo(tx + 25, y); } ctx.stroke();
    A.oval(ctx, tx - 8, gy - 30, 10, 14, 0, 'rgba(176,96,58,0.55)');
    ctx.fillStyle = '#9aa4a8'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(tx, gy - 74, 27, 6, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
    // walls with corrugations and rust
    ctx.fillStyle = '#a3abab';
    ctx.fillRect(x0, gy - h, w, h); ctx.strokeRect(x0, gy - h, w, h);
    ctx.lineWidth = 2;
    for (let x = x0 + 4; x < x0 + w - 2; x += 6) {
      ctx.strokeStyle = (x - x0) % 12 < 6 ? 'rgba(255,255,255,0.35)' : 'rgba(60,60,60,0.25)';
      ctx.beginPath(); ctx.moveTo(x, gy - h + 2); ctx.lineTo(x, gy - 1); ctx.stroke();
    }
    // rust: streaks running down from the roof and a ragged band along the bottom
    ctx.fillStyle = 'rgba(170,88,48,0.5)';
    ctx.beginPath();
    for (let j = 0; j < 7; j++) {
      const rx = x0 + 8 + hash(d.x + j) * (w - 24), len = 18 + hash(d.x - j) * 46, rw = 4 + hash(j * 7 + d.x) * 6;
      ctx.moveTo(rx, gy - h + 1); ctx.lineTo(rx + rw, gy - h + 1); ctx.lineTo(rx + rw * 0.7, gy - h + len);
      ctx.quadraticCurveTo(rx + rw * 0.4, gy - h + len + 6, rx + rw * 0.2, gy - h + len); ctx.closePath();
    }
    ctx.moveTo(x0 + 1, gy - 1);
    for (let k = 0; k <= 12; k++) ctx.lineTo(x0 + 1 + (k / 12) * (w - 2), gy - 8 - hash(d.x + k * 3) * 18);
    ctx.lineTo(x0 + w - 1, gy - 1); ctx.closePath();
    ctx.fill();
    // a dark open doorway with a hay bale inside, and a little window
    const dx = x0 + w * 0.55;
    ctx.fillStyle = '#2b2420'; ctx.strokeStyle = LINE;
    ctx.fillRect(dx, gy - 76, 56, 76); ctx.strokeRect(dx, gy - 76, 56, 76);
    ctx.fillStyle = '#c9a23a';
    ctx.beginPath(); ctx.roundRect(dx + 8, gy - 20, 34, 20, 3); ctx.fill();
    ctx.fillStyle = '#3a4a52';
    ctx.fillRect(x0 + 22, gy - 74, 30, 22); ctx.strokeRect(x0 + 22, gy - 74, 30, 22);
    ctx.beginPath(); ctx.moveTo(x0 + 37, gy - 74); ctx.lineTo(x0 + 37, gy - 52); ctx.stroke();
    // the sloping roof, one sheet hanging loose
    ctx.fillStyle = '#8f989a';
    ctx.beginPath(); ctx.moveTo(x0 - 14, gy - h + 4); ctx.lineTo(x0 + 10, gy - h - 26); ctx.lineTo(x0 + w + 6, gy - h - 26); ctx.lineTo(x0 + w + 16, gy - h + 4); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,60,60,0.3)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = x0; x < x0 + w + 6; x += 8) { ctx.moveTo(x - 6, gy - h + 2); ctx.lineTo(x + 8 + (x - x0) * 0.05, gy - h - 24); }
    ctx.stroke();
    ctx.fillStyle = '#b0603a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.save(); ctx.translate(x0 + w + 16, gy - h + 4); ctx.rotate(0.35 + Math.sin(t * 2) * 0.03);
    ctx.fillRect(-26, -2, 26, 8); ctx.strokeRect(-26, -2, 26, 8);
    ctx.restore();
  };

  // a generic giant flat-topped red rock: a lumpy mesa with ledges, not any real landmark
  DECOR.redrock = function (ctx, d, gy, t) {
    const w = d.w || 420, h = Math.min(220, w * 0.42), x0 = d.x - w / 2;
    const top = [[0.02, 0.08], [0.06, 0.55], [0.1, 0.62], [0.14, 0.86], [0.24, 0.92], [0.3, 0.97], [0.42, 0.95],
      [0.46, 1.0], [0.6, 0.98], [0.66, 0.9], [0.72, 0.93], [0.82, 0.88], [0.86, 0.66], [0.9, 0.62], [0.95, 0.3], [0.99, 0.06]];
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#c4573a'; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0, gy);
    for (const [px, py] of top) ctx.lineTo(x0 + px * w, gy - py * h);
    ctx.lineTo(x0 + w, gy); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // shaded cliff face on the right and lit ledges (horizontal rock layers)
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(110,30,20,0.28)';
    ctx.beginPath(); ctx.moveTo(x0 + w * 0.62, gy - h); ctx.lineTo(x0 + w, gy - h); ctx.lineTo(x0 + w, gy); ctx.lineTo(x0 + w * 0.7, gy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,140,0.45)'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (const [k, a, b] of [[0.28, 0.08, 0.5], [0.45, 0.2, 0.88], [0.62, 0.05, 0.6], [0.78, 0.3, 0.75]]) {
      ctx.moveTo(x0 + w * a, gy - h * k); ctx.lineTo(x0 + w * b, gy - h * k + 3);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,25,15,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [k, a, b] of [[0.26, 0.3, 0.7], [0.43, 0.55, 0.95], [0.6, 0.12, 0.4], [0.76, 0.6, 0.85]]) {
      ctx.moveTo(x0 + w * a, gy - h * k + 4); ctx.lineTo(x0 + w * b, gy - h * k + 6);
    }
    ctx.stroke();
    ctx.restore();
    // scrubby bushes on top and fallen boulders at the foot
    ctx.fillStyle = '#7d8a3a';
    ctx.beginPath(); circ(ctx, x0 + w * 0.27, gy - h * 0.95, 7); circ(ctx, x0 + w * 0.31, gy - h * 0.97, 5); circ(ctx, x0 + w * 0.56, gy - h * 1.0, 6); circ(ctx, x0 + w * 0.76, gy - h * 0.92, 6); ctx.fill();
    for (const [bx, r] of [[0.08, 16], [0.15, 10], [0.88, 20], [0.97, 11], [0.5, 9]]) {
      A.oval(ctx, x0 + w * bx, gy - r * 0.6, r, r * 0.75, 0, '#b04a30', LINE, 2);
      A.oval(ctx, x0 + w * bx - r * 0.3, gy - r * 0.9, r * 0.35, r * 0.18, 0, 'rgba(255,190,140,0.5)');
    }
  };

  // clue: a pale, papery shed snake skin lying on the ground
  DECOR.snakeSkin = function (ctx, d, gy, t) {
    const x = d.x, y = gy - 3;
    ctx.save();
    ctx.globalAlpha = 0.92;
    const pts = [];
    for (let k = 0; k <= 20; k++) pts.push([x - 40 + k * 4.2, y - Math.sin(k * 0.55) * 7, 6 * (1 - k / 24) + 1.5]);
    ctx.fillStyle = '#efe6cf'; ctx.strokeStyle = 'rgba(120,100,70,0.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    pts.forEach(([px, py, r], k) => (k ? ctx.lineTo(px, py - r) : ctx.moveTo(px, py - r)));
    for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k][0], pts[k][1] + pts[k][2]);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // the head end, split open where the snake wriggled out
    ctx.beginPath(); ctx.moveTo(x - 40, y - 6); ctx.lineTo(x - 50, y - 11); ctx.lineTo(x - 46, y - 2); ctx.lineTo(x - 52, y + 4); ctx.lineTo(x - 40, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // a scaly diamond pattern
    ctx.strokeStyle = 'rgba(150,130,95,0.6)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let k = 1; k < pts.length - 1; k++) {
      const [px, py, r] = pts[k];
      ctx.moveTo(px - 2, py - r * 0.7); ctx.lineTo(px + 2, py); ctx.lineTo(px - 2, py + r * 0.7);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); for (let k = 2; k < 16; k += 3) ell(ctx, pts[k][0], pts[k][1] - pts[k][2] * 0.5, 2.5, 1, 0); ctx.fill();
    ctx.restore();
  };

  // clue: a trail of scaly three-toed lizard footprints with a tail-drag line
  DECOR.footprints = function (ctx, d, gy, t) {
    const w = d.w || 160, x0 = d.x - w / 2, y = gy + 10;
    ctx.save();
    ctx.strokeStyle = 'rgba(70,30,15,0.45)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y);
    for (let x = x0; x <= x0 + w; x += 10) ctx.lineTo(x, y + Math.sin((x - x0) * 0.08) * 3);
    ctx.stroke();
    const n = 5;
    for (let j = 0; j < n; j++) {
      const px = x0 + 12 + (j / (n - 1)) * (w - 24), py = y + (j % 2 ? 9 : -9);
      ctx.fillStyle = 'rgba(70,30,15,0.42)';
      ctx.beginPath(); ctx.ellipse(px, py, 4, 3, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(70,30,15,0.5)'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const a of [-0.6, 0, 0.6]) {
        const ex = px + Math.cos(a) * 9, ey = py + Math.sin(a) * 6;
        ctx.moveTo(px + 2, py); ctx.lineTo(ex, ey); ctx.lineTo(ex + 2, ey + (a > 0 ? 1.5 : a < 0 ? -1.5 : 0));
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // clue: a quokka helper and a goanna chatting in the background; d.frozen = caught, both freeze
  DECOR.quokkaGoanna = function (ctx, d, gy, t) {
    const x = d.x, fr = !!d.frozen;
    ctx.save();
    ctx.globalAlpha = 0.78;
    A.goanna(ctx, x + 16, gy - 2, { facing: -1, scale: 0.6, t, frozen: fr, talk: !fr });
    A.quokka(ctx, x - 26, gy - 2, { facing: 1, scale: 0.6, t, frozen: fr, talk: !fr, shirt: true });
    if (!fr) {
      // little speech dots, taking turns
      const who = Math.floor(t * 0.8) % 2;
      const bx = who ? x + 4 : x - 26, by = gy - 46;
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(bx - 13, by - 8, 26, 14, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = LINE;
      for (let j = 0; j < 3; j++) { if ((t * 4) % 4 > j) { ctx.beginPath(); ctx.arc(bx - 6 + j * 6, by - 1, 1.6, 0, TAU); ctx.fill(); } }
    }
    ctx.restore();
  };

  A.decor = function (ctx, d, groundY, t) {
    if (!d || typeof d.type !== 'string' || !has(DECOR, d.type)) return;
    ctx.save();
    DECOR[d.type](ctx, d, groundY, t || 0);
    ctx.restore();
  };

  // ================================================================ pests and bosses
  // Cane toad, about 30 px tall. o: { crouch, air, crown, tongue (0..1), puff (0..1) }
  const TOAD = { skin: '#8a7a42', dark: '#5f5530', belly: '#e2d4a2', gland: '#a8904e', wart: '#6b5f32' };
  A.toad = function (ctx, x, y, o) {
    o = o || {};
    const c = Object.assign({}, TOAD, o.colors || {});
    const s = o.scale || 1, t = o.t || 0, puff = k01(o.puff), tongue = k01(o.tongue);
    const air = o.air ? 1 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    if (o.crouch && !air) ctx.scale(1.12, 0.84);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (air) { ctx.translate(0, -6); ctx.rotate(-0.22); }
    const bx = 1.08 + puff * 0.32, by = 1 + puff * 0.45;
    // back leg: folded at the side, or stretched out behind in a hop
    ctx.fillStyle = white(o, c.dark); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    if (air) {
      A.taper(ctx, -12, -10, -26, -6, -36, 2, 9, 5); ctx.fill(); ctx.stroke();
      A.oval(ctx, -40, 3, 8, 3, 0.4, white(o, c.dark), LINE, 1.6);
    } else {
      A.oval(ctx, -6, -1.5, 11, 3, 0, white(o, c.dark), LINE, 1.6);
    }
    // body, belly and warts
    A.oval(ctx, -2, -13 * by, 20 * bx, 12.5 * by, -0.05, white(o, c.skin), LINE, 2);
    A.oval(ctx, 4, -6 * by, 14 * bx, 5 * by, 0, white(o, c.belly));
    if (!air) A.oval(ctx, -13, -9, 9, 7, -0.4, white(o, c.skin), LINE, 1.6);
    if (!o.flash) {
      ctx.fillStyle = c.wart;
      ctx.beginPath();
      for (const [wx, wy, r] of [[-14, -18, 2], [-8, -22, 1.8], [-2, -19, 2.2], [4, -23, 1.5], [-18, -12, 1.6], [-6, -14, 1.4], [6, -16, 1.6], [-11, -6, 1.3]]) circ(ctx, wx * bx, wy * by, r);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,190,0.35)';
      ctx.beginPath(); circ(ctx, -9 * bx, -21 * by, 1); circ(ctx, 1 * bx, -21.5 * by, 0.9); ctx.fill();
    }
    // front leg
    ctx.fillStyle = white(o, c.skin);
    if (air) { A.taper(ctx, 10, -8, 18, -2, 24, 2, 6, 4); ctx.fill(); ctx.stroke(); A.oval(ctx, 26, 2, 4, 2, 0, white(o, c.skin), LINE, 1.4); }
    else { A.taper(ctx, 10, -9 * by, 13, -4, 14, -1, 6, 4); ctx.fill(); ctx.stroke(); A.oval(ctx, 16, -1, 4.5, 2, 0, white(o, c.skin), LINE, 1.4); }
    // head with the big poison gland, golden eye and wide mouth
    const hx = 14, hy = -15 * by;
    A.oval(ctx, hx, hy, 12, 8.5, 0.08, white(o, c.skin), LINE, 2);
    A.oval(ctx, hx - 9, hy - 7, 8, 4.5, 0.25, white(o, c.gland), LINE, 1.6);
    if (puff && !o.flash) {
      // green poison drips from the gland
      for (let j = 0; j < 3; j++) {
        const k = (t * 1.5 + j / 3) % 1;
        ctx.globalAlpha = puff * (1 - k * 0.6);
        A.oval(ctx, hx - 14 + j * 5, hy - 3 + k * 16, 1.8, 2.6, 0, '#9ef01a', '#4a7a10', 1);
        ctx.globalAlpha = 1;
      }
    }
    A.oval(ctx, hx + 1, hy - 7, 5, 4.6, 0, white(o, c.skin), LINE, 1.6);
    A.oval(ctx, hx + 1.5, hy - 7.5, 3.8, 3.4, 0, white(o, '#e8b93a'));
    A.oval(ctx, hx + 2, hy - 7.5, 2.4, 1, 0, '#1b1430');
    A.oval(ctx, hx + 0.5, hy - 9, 0.9, 0.9, 0, '#ffffff');
    ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx - 3, hy - 11); ctx.lineTo(hx + 5, hy - 10.5); ctx.stroke();
    A.oval(ctx, hx + 10, hy - 3.5, 0.9, 0.7, 0, LINE);
    if (tongue > 0) {
      // a long sticky tongue shooting out
      const L = tongue * 168;
      A.oval(ctx, hx + 6, hy + 2.5, 6, 2.6, 0, '#5a1a1a');
      ctx.strokeStyle = LINE; ctx.lineWidth = 6.5;
      ctx.beginPath(); ctx.moveTo(hx + 8, hy + 2.5); ctx.quadraticCurveTo(hx + 8 + L * 0.5, hy + 2.5 - L * 0.06, hx + 8 + L, hy + 1); ctx.stroke();
      ctx.strokeStyle = '#ff7aa2'; ctx.lineWidth = 4; ctx.stroke();
      A.oval(ctx, hx + 9 + L, hy + 1, 5.5, 4.5, 0, '#ff8fab', LINE, 1.6);
    } else {
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(hx + 11, hy + 1); ctx.quadraticCurveTo(hx + 3, hy + 4, hx - 6, hy + 1.5); ctx.stroke();
    }
    if (o.crown) {
      // the Cane Toad King's little gold crown
      ctx.save(); ctx.translate(hx - 3, hy - 11); ctx.rotate(-0.12);
      ctx.fillStyle = white(o, '#ffd23f'); ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, -4); ctx.lineTo(0, -10); ctx.lineTo(4, -4); ctx.lineTo(8, -8); ctx.lineTo(7, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      A.oval(ctx, 0, -2.5, 1.5, 1.5, 0, '#e63946'); A.oval(ctx, -4.5, -2, 1, 1, 0, '#3a86ff'); A.oval(ctx, 4.5, -2, 1, 1, 0, '#52b788');
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); circ(ctx, 0, -10, 1); circ(ctx, -8, -8, 0.8); circ(ctx, 8, -8, 0.8); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  // ================================================================ hazards and neutral animals
  // Emu, about 110 px tall. o: { run }
  A.emu = function (ctx, x, y, o) {
    o = o || {};
    const s = o.scale || 1, t = o.t || 0, run = !!o.run;
    const ph = t * 13;
    const bob = run ? -Math.abs(Math.sin(ph)) * 4 : Math.sin(t * 2) * 0.8;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const hip = { x: 2, y: -54 + bob };
    const leg = (p, col) => {
      const fx = run ? 4 + Math.sin(p) * 28 : (p ? 10 : -6);
      const fy = run ? -Math.max(0, Math.cos(p)) * 18 : 0;
      const dx = fx - hip.x, dy = fy - hip.y, dd = Math.hypot(dx, dy) || 1;
      const off = Math.sqrt(Math.max(0, 29 * 29 - (dd / 2) * (dd / 2)));
      let px = -dy / dd, py = dx / dd;
      if (px > 0) { px = -px; py = -py; }
      const kx = (hip.x + fx) / 2 + px * off, ky = (hip.y + fy) / 2 + py * off;
      ctx.strokeStyle = LINE; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.strokeStyle = white(o, col); ctx.lineWidth = 6.5; ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 11, fy); ctx.moveTo(fx, fy); ctx.lineTo(fx + 8, fy - 3); ctx.moveTo(fx, fy); ctx.lineTo(fx - 4, fy); ctx.stroke();
      ctx.strokeStyle = white(o, col); ctx.lineWidth = 1.8; ctx.stroke();
    };
    leg(ph + Math.PI, '#6f6458');
    // shaggy body: a feathery mop with a ragged fringe
    const bodyCol = white(o, '#6b5a48');
    ctx.fillStyle = bodyCol; ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(24, -74 + bob);
    ctx.quadraticCurveTo(10, -96 + bob, -20, -88 + bob);
    ctx.quadraticCurveTo(-42, -80 + bob, -38, -58 + bob);
    for (let j = 0; j <= 8; j++) ctx.lineTo(-38 + j * 7.5 + (j % 2) * 2, -48 + bob + (j % 2 ? -5 : 4) + Math.sin(t * 9 + j) * (run ? 1.5 : 0.4));
    ctx.quadraticCurveTo(30, -60 + bob, 24, -74 + bob);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.strokeStyle = '#4a3c30'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let j = 0; j < 7; j++) { const fx = -30 + j * 8; ctx.moveTo(fx, -80 + bob + (j % 2) * 4); ctx.quadraticCurveTo(fx - 3, -68 + bob, fx - 2, -56 + bob); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,220,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-24, -84 + bob); ctx.quadraticCurveTo(-4, -92 + bob, 12, -84 + bob); ctx.stroke();
    }
    // the long neck, leaning forward when running
    const hx = run ? 50 : 32, hy = (run ? -92 : -110) + bob;
    ctx.fillStyle = white(o, '#5a4a3c'); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    A.taper(ctx, 16, -76 + bob, run ? 40 : 18, run ? -74 + bob : -94 + bob, hx - 2, hy + 4, 14, 8);
    ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.fillStyle = '#86a8cf';
      A.taper(ctx, 22, -80 + bob, run ? 42 : 24, run ? -80 + bob : -96 + bob, hx + 1, hy + 6, 5, 3); ctx.fill();
    }
    // goofy head: big round eye, flat beak (open and honking while running), a wild tuft
    A.oval(ctx, hx, hy, 9, 7.5, 0, white(o, '#5a4a3c'), LINE, 2);
    ctx.strokeStyle = white(o, '#3a3028'); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 6); ctx.lineTo(hx - 7, hy - 13); ctx.moveTo(hx - 1, hy - 7); ctx.lineTo(hx + 1, hy - 14); ctx.moveTo(hx - 6, hy - 4); ctx.lineTo(hx - 12, hy - 9); ctx.stroke();
    const gape = run ? 3 + Math.abs(Math.sin(t * 7)) * 3 : 0;
    ctx.fillStyle = white(o, '#4a4a4a'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hx + 6, hy - 1); ctx.quadraticCurveTo(hx + 14, hy - 3, hx + 19, hy + 1); ctx.lineTo(hx + 6, hy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (gape) {
      A.oval(ctx, hx + 11, hy + 2 + gape * 0.4, 5, gape * 0.5, 0.1, '#5a1a1a');
      ctx.fillStyle = white(o, '#4a4a4a');
      ctx.beginPath(); ctx.moveTo(hx + 6, hy + 2); ctx.lineTo(hx + 17, hy + 3 + gape); ctx.lineTo(hx + 6, hy + 4 + gape * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    A.oval(ctx, hx + 2, hy - 2, 4.6, 4.8, 0, '#ffffff', LINE, 1.4);
    A.oval(ctx, hx + 3.2 + (run ? 1 : 0), hy - 2.6, 1.6, 1.6, 0, '#1b1430');
    leg(ph, '#8a7a6a');
    ctx.restore();
  };

  // Cassowary, about 120 px tall. o: { kick (0..1), angry }
  A.cassowary = function (ctx, x, y, o) {
    o = o || {};
    const s = o.scale || 1, t = o.t || 0, kick = k01(o.kick), angry = !!o.angry;
    const breathe = Math.sin(t * 2.5) * 1.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const hip = { x: 0, y: -52 };
    const leg = (fx, fy, col, claw) => {
      const dx = fx - hip.x, dy = fy - hip.y, dd = Math.hypot(dx, dy) || 1;
      const off = Math.sqrt(Math.max(0, 29 * 29 - (dd / 2) * (dd / 2)));
      let px = -dy / dd, py = dx / dd;
      if (px > 0) { px = -px; py = -py; }
      const kx = (hip.x + fx) / 2 + px * off, ky = (hip.y + fy) / 2 + py * off;
      ctx.strokeStyle = LINE; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.strokeStyle = white(o, col); ctx.lineWidth = 8.5; ctx.stroke();
      const up = fy < -4 ? -0.5 * kick : 0;
      const toe = (a, l) => [fx + Math.cos(a + up) * l, fy + Math.sin(a + up) * l];
      ctx.strokeStyle = LINE; ctx.lineWidth = 5.5;
      ctx.beginPath();
      for (const [a, l] of [[0, 13], [-0.15, 9], [Math.PI, 5]]) { const [ex, ey] = toe(a, l); ctx.moveTo(fx, fy); ctx.lineTo(ex, ey); }
      ctx.stroke();
      ctx.strokeStyle = white(o, col); ctx.lineWidth = 3; ctx.stroke();
      // the dagger claw on the inner toe
      const [cx, cy] = toe(0.08, 9);
      const L = claw ? 14 + kick * 6 : 10;
      ctx.fillStyle = white(o, '#f1e8d6'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx - 3, cy - 2); ctx.quadraticCurveTo(cx + L * 0.6, cy - 3 + up * 10, cx + L, cy + 1 + up * 12); ctx.lineTo(cx - 1, cy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    leg(-8, 0, '#5d5e56', false);
    // big black shaggy body (puffed up when angry), leaning back into a kick
    ctx.save();
    ctx.translate(hip.x, hip.y); ctx.rotate(-0.18 * kick); ctx.translate(-hip.x, -hip.y);
    const pf = angry ? 1.12 : 1;
    ctx.fillStyle = white(o, '#1d1d22'); ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(22, -86);
    ctx.quadraticCurveTo(8, -106 * pf + breathe, -24 * pf, -98 * pf + breathe);
    ctx.quadraticCurveTo(-48 * pf, -88, -44 * pf, -62);
    for (let j = 0; j <= 9; j++) {
      const fx = -44 * pf + j * 8.4 * pf, long = angry ? (j % 2 ? -10 : 8) : (j % 2 ? -4 : 6);
      ctx.lineTo(fx, -44 + long + Math.sin(t * 6 + j) * 0.8);
    }
    ctx.quadraticCurveTo(34, -64, 22, -86);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.strokeStyle = '#3c3c48'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let j = 0; j < 8; j++) {
        const fx = -36 + j * 8;
        ctx.moveTo(fx, -90 + (j % 3) * 5); ctx.quadraticCurveTo(fx - 3, -70, fx - (angry ? 6 : 2), -52);
      }
      ctx.stroke();
    }
    // the bright blue neck with red wattles, and a horn-like casque on the head
    const hx = 30, hy = -114 + breathe * 0.5;
    ctx.fillStyle = white(o, '#2a7fd4'); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    A.taper(ctx, 16, -86, 22, -100, hx - 2, hy + 4, 16, 10); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.fillStyle = '#c03a7a';
      A.taper(ctx, 12, -88, 16, -100, hx - 6, hy + 2, 6, 3); ctx.fill();
      ctx.fillStyle = '#5fc4f0';
      A.taper(ctx, 22, -88, 28, -98, hx + 3, hy + 6, 4, 2); ctx.fill();
    }
    const sw = Math.sin(t * 3) * 1.5;
    A.oval(ctx, hx + 4 + sw * 0.3, hy + 20, 3.4, 7, 0.15, white(o, '#e63946'), LINE, 1.4);
    A.oval(ctx, hx + 9 + sw * 0.5, hy + 18, 3, 6, -0.1, white(o, '#e63946'), LINE, 1.4);
    A.oval(ctx, hx, hy, 9, 7.5, 0, white(o, '#2a7fd4'), LINE, 2);
    ctx.fillStyle = white(o, '#a8834e'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(hx - 8, hy - 4); ctx.quadraticCurveTo(hx - 8, hy - 20, hx - 1, hy - 24); ctx.quadraticCurveTo(hx + 6, hy - 20, hx + 9, hy - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!o.flash) { ctx.strokeStyle = 'rgba(255,230,170,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx - 4, hy - 8); ctx.quadraticCurveTo(hx - 3, hy - 18, hx, hy - 20); ctx.stroke(); }
    // beak (open and hissing when angry)
    const gape = angry ? 3 + Math.abs(Math.sin(t * 10)) * 1.5 : 0;
    ctx.fillStyle = white(o, '#2b2b30'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(hx + 6, hy - 2); ctx.quadraticCurveTo(hx + 16, hy - 2, hx + 21, hy + 3); ctx.lineTo(hx + 7, hy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (gape) {
      A.oval(ctx, hx + 11, hy + 3 + gape * 0.3, 5, gape * 0.5, 0.2, '#e86a8a');
      ctx.fillStyle = white(o, '#2b2b30');
      ctx.beginPath(); ctx.moveTo(hx + 7, hy + 2); ctx.lineTo(hx + 18, hy + 4 + gape); ctx.lineTo(hx + 6, hy + 4 + gape * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let j = 0; j < 3; j++) { const k = (t * 3 + j / 3) % 1; ctx.moveTo(hx + 24 + k * 14, hy - 4 + j * 4); ctx.lineTo(hx + 30 + k * 14, hy - 5 + j * 4); }
      ctx.stroke();
    }
    A.oval(ctx, hx + 3, hy - 2, 2.6, 2.4, 0, '#ffb703', LINE, 1);
    A.oval(ctx, hx + 3.5, hy - 2, 1.1, 1.3, 0, '#1b1430');
    ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx - 2, hy - (angry ? 7 : 6)); ctx.lineTo(hx + 7, hy - (angry ? 3 : 5)); ctx.stroke();
    ctx.restore();
    // the near leg: standing, or a big forward kick with the claw out
    leg(lerp(10, 58, kick), lerp(0, -48, kick), '#6f7066', true);
    if (kick > 0.55) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(20, -40, 46, -0.9, 0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(20, -40, 36, -0.7, 0.2); ctx.stroke();
    }
    ctx.restore();
  };

  // Saltwater crocodile in the water. lunge 0: only eyes and nostrils above the surface (watching);
  // lunge 0..1: the head rises and the jaws snap (open at 0.5, shut at 1).
  A.croc = function (ctx, x, surfaceY, o) {
    o = o || {};
    const s = o.scale || 1, t = o.t || 0, lunge = k01(o.lunge);
    const C = { hide: white(o, '#5d7a3a'), dark: white(o, '#3e5426'), belly: white(o, '#d8d49a') };
    ctx.save();
    ctx.translate(x, surfaceY);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (lunge < 0.02) {
      const bob = Math.sin(t * 1.5) * 1.2;
      // ripples
      ctx.strokeStyle = 'rgba(230,245,220,0.6)'; ctx.lineWidth = 1.5;
      for (let j = 0; j < 2; j++) {
        const k = (t * 0.5 + j / 2) % 1;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath(); ctx.ellipse(30, 2, 40 + k * 40, 4 + k * 4, 0, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // back ridges, nostrils, then the two watching eyes
      ctx.fillStyle = C.dark; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      for (const bx of [-60, -46, -32]) { ctx.beginPath(); ctx.moveTo(bx - 5, 1); ctx.lineTo(bx, -4 + bob * 0.5); ctx.lineTo(bx + 5, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = C.hide;
      ctx.beginPath(); ctx.ellipse(100, 1 + bob, 11, 7, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
      A.oval(ctx, 97, -2.5 + bob, 1.8, 1.3, 0, LINE); A.oval(ctx, 103, -2.5 + bob, 1.8, 1.3, 0, LINE);
      const blink = Math.sin(t * 0.9) > 0.96;
      const look = 2.2;
      for (const ex of [0, 19]) {
        ctx.fillStyle = C.hide; ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.ellipse(ex, 3 + bob, 12.5, 15, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (blink) { ctx.beginPath(); ctx.moveTo(ex - 6, -4 + bob); ctx.lineTo(ex + 6, -4 + bob); ctx.stroke(); continue; }
        A.oval(ctx, ex + 0.5, -4 + bob, 7, 5.6, 0, white(o, '#d4e157'), LINE, 1.4);
        A.oval(ctx, ex + look, -4 + bob, 1.5, 4.8, 0, '#1b1430');
        // heavy lid: a sly, watching look
        ctx.fillStyle = C.hide;
        ctx.beginPath(); ctx.ellipse(ex + 0.5, -4 + bob, 7.6, 6.2, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ex - 7.2, -5.6 + bob); ctx.lineTo(ex + 7.8, -4.6 + bob); ctx.stroke();
      }
      ctx.restore();
      return;
    }
    const rise = Math.min(1, lunge * 2.2), open = Math.sin(lunge * Math.PI);
    const ease = 1 - (1 - rise) * (1 - rise);
    // the neck coming up out of the water
    ctx.save();
    ctx.translate(-10, 34 - ease * 66);
    ctx.rotate(-0.75 * ease);
    ctx.fillStyle = C.hide; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(-46, -14, 60, 120, 22); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.dark;
    for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(-40, 6 + j * 22); ctx.lineTo(-52, 14 + j * 22); ctx.lineTo(-40, 22 + j * 22); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // lower jaw (hinged at the back), with teeth pointing up
    ctx.save();
    ctx.translate(0, 4); ctx.rotate(open * 0.62);
    ctx.fillStyle = C.belly;
    ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(104, -2); ctx.quadraticCurveTo(114, 2, 108, 10); ctx.lineTo(-4, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (open > 0.05) {
      A.oval(ctx, 50, 0, 50, 3.5 * open, 0, '#e8a0a0');
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let tx = 10; tx < 102; tx += 11) { ctx.moveTo(tx, -1); ctx.lineTo(tx + 3, -9); ctx.lineTo(tx + 6, -1); }
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    // upper jaw and skull: eye mound, nostrils, teeth pointing down
    ctx.fillStyle = C.hide; ctx.strokeStyle = LINE; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, 6); ctx.lineTo(-10, -12); ctx.quadraticCurveTo(0, -30, 16, -28); ctx.quadraticCurveTo(26, -27, 32, -18);
    ctx.lineTo(96, -12); ctx.quadraticCurveTo(110, -12, 114, -4); ctx.quadraticCurveTo(114, 4, 104, 4); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let tx = 14; tx < 104; tx += 11) { ctx.moveTo(tx, 3); ctx.lineTo(tx + 3, 10 + (tx % 22 ? 0 : 3)); ctx.lineTo(tx + 6, 3); }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.dark;
    ctx.beginPath(); circ(ctx, 46, -12, 2); circ(ctx, 62, -11, 2.4); circ(ctx, 78, -10, 2); circ(ctx, 30, -8, 2.2); ctx.fill();
    A.oval(ctx, 104, -12, 6, 3.5, 0, C.hide, LINE, 1.6);
    A.oval(ctx, 105, -13, 1.4, 1, 0, LINE);
    A.oval(ctx, 12, -26, 7, 6, 0, C.hide, LINE, 2);
    A.oval(ctx, 13, -27, 4.6, 3.8, 0, white(o, '#d4e157'), LINE, 1.2);
    A.oval(ctx, 14, -27, 1.1, 3.4, 0, '#1b1430');
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(6, -31); ctx.lineTo(20, -28); ctx.stroke();
    ctx.restore();
    // splash where it bursts out of the water
    if (lunge < 0.75) {
      const k = lunge / 0.75;
      ctx.fillStyle = 'rgba(235,250,240,' + (0.9 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath();
      for (let j = 0; j < 7; j++) {
        const a = Math.PI + (j / 6) * Math.PI;
        circ(ctx, 10 + Math.cos(a) * (30 + k * 50), -Math.abs(Math.sin(a)) * (10 + k * 40) + k * k * 20, 4 + (j % 2) * 2);
      }
      ctx.fill();
    }
    ctx.restore();
  };

  // ================================================================ allies and story characters
  // Quokka, about 50 px tall: round, brown, rounded ears, short tail and a HUGE friendly smile.
  // o: { wave, hop, frozen, sponsor (sash and medal), shirt (teal SMILE SQUAD vest), talk,
  //      grin (0..1: the Hypnotic Grin: spiral eyes, an impossibly wide sparkly smile, rings radiating out),
  //      evil (the revealed army: narrowed eyes, a sharp-toothed grin, a dark sash), angry (the smile dropped) }
  const QK = { fur: '#8f7558', dark: '#6b5640', belly: '#c9b394', face: '#a68a6a', ear: '#d9a08a' };
  A.quokka = function (ctx, x, y, o) {
    o = o || {};
    const s = o.scale || 1, t = o.t || 0, fr = !!o.frozen, hop = o.hop && !fr ? 1 : 0;
    const talk = o.talk && !fr ? Math.abs(Math.sin(t * 9)) : 0;
    const grin = fr ? 0 : k01(o.grin), evil = !!o.evil, angry = !!o.angry && !fr;
    ctx.save();
    ctx.translate(x + (fr ? Math.sin(t * 40) * 0.4 : 0), y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fill = (col) => white(o, col);
    if (grin > 0 && !angry && !o.flash) {
      // the Hypnotic Grin: rings radiating out from the face
      ctx.lineWidth = 2.2;
      for (let j = 0; j < 4; j++) {
        const k = (t * 0.9 + j / 4) % 1;
        ctx.strokeStyle = j % 2 ? 'rgba(255,79,163,' + (grin * (1 - k) * 0.8).toFixed(3) + ')' : 'rgba(157,78,221,' + (grin * (1 - k) * 0.8).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(6, -36, 12 + k * 38, 0, TAU); ctx.stroke();
      }
    }
    // short tail and long hind feet
    ctx.fillStyle = fill(QK.dark); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    A.taper(ctx, -9, -10, -18, -6 - hop * 6, -24, -2 - hop * 10, 6, 2); ctx.fill(); ctx.stroke();
    if (hop) {
      A.oval(ctx, -10, -4, 9, 3, 0.6, fill(QK.dark), LINE, 1.6);
      A.oval(ctx, -5, -2, 9, 3, 0.45, fill(QK.fur), LINE, 1.6);
    } else {
      A.oval(ctx, -3, -2.5, 9, 3, 0, fill(QK.dark), LINE, 1.6);
      A.oval(ctx, 5, -2.5, 9, 3, 0, fill(QK.fur), LINE, 1.6);
    }
    ctx.save();
    if (hop) { ctx.translate(0, -16); ctx.rotate(0.3); ctx.translate(0, 16); }
    // body (with the SMILE SQUAD vest or the sponsor's sash)
    A.oval(ctx, 0, -18, 13, 15.5, 0, fill(QK.fur), LINE, 2);
    A.oval(ctx, 3, -15, 8, 11, 0, fill(QK.belly));
    if (o.shirt) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -18, 13, 15.5, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = fill('#2ec4b6'); ctx.fillRect(-16, -34, 32, 28);
      ctx.fillStyle = fill('#1f9e93'); ctx.fillRect(-16, -8, 32, 3);
      ctx.restore();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, -18, 13, 15.5, 0, 0, TAU); ctx.stroke();
      if (!o.flash) {
        ctx.font = 'bold 4.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
        ctx.fillText('SMILE', fr ? 0 : 1.5, -11);
      }
    }
    if (o.sponsor) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -18, 13, 15.5, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = fill('#2a6fdb'); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-12, -32); ctx.lineTo(12, -6); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = fill('#e63946'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-3, -29); ctx.lineTo(2, -20); ctx.lineTo(8, -29); ctx.stroke();
      A.oval(ctx, 2, -18, 4.4, 4.4, 0, fill('#ffd23f'), '#8a5a00', 1.2);
      A.star(ctx, 2, -18, 2.6, fill('#fff3b0'));
    }
    if (evil) {
      // the revealed army's dark sash, with a gold buckle
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -18, 13, 15.5, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = fill('#2d1b3d'); ctx.lineWidth = 6.5;
      ctx.beginPath(); ctx.moveTo(12, -32); ctx.lineTo(-12, -6); ctx.stroke();
      if (!o.flash) { ctx.strokeStyle = '#8a1c2b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14.5, -30); ctx.lineTo(-9.5, -4); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = fill('#ffd23f'); ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-2.6, -21.5, 5.2, 5, 1.2); ctx.fill(); ctx.stroke();
    }
    // arms: resting, waving, gesturing, or stiff at the sides when caught
    const arm = (sx, sy, px, py, col) => {
      ctx.fillStyle = fill(col); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      A.taper(ctx, sx, sy, (sx + px) / 2 + 1, (sy + py) / 2 + 1, px, py, 5.5, 4); ctx.fill(); ctx.stroke();
      A.oval(ctx, px, py, 3, 2.6, 0, fill(QK.dark), LINE, 1.2);
    };
    if (fr) {
      arm(-9, -26, -12, -12, QK.dark);
      arm(9, -26, 12, -12, QK.fur);
    } else {
      arm(-2, -27, 6, -18, QK.dark);
      if (o.wave) {
        const w = Math.sin(t * 10);
        arm(7, -28, 16 + w * 3, -46 + Math.abs(w), QK.fur);
      } else if (talk) {
        arm(7, -27, 17, -30 - talk * 4, QK.fur);
      } else {
        arm(7, -27, 13, -17, QK.fur);
      }
    }
    // the head: rounded ears, a little face and that huge smile
    const hx = 3, hy = -38;
    const fx = fr ? 0 : 3;
    for (const [ex, ey] of [[-6, -9], [6, -10]]) {
      A.oval(ctx, hx + ex, hy + ey, 4.6, 4.6, 0, fill(QK.fur), LINE, 1.6);
      A.oval(ctx, hx + ex, hy + ey + 0.5, 2.4, 2.4, 0, fill(QK.ear));
    }
    A.oval(ctx, hx, hy, 11, 10, 0, fill(QK.fur), LINE, 2);
    A.oval(ctx, hx + fx + 1, hy + 4, 7, 5, 0, fill(QK.belly));
    // rosy cheeks
    if (!o.flash && !angry) { A.oval(ctx, hx + fx - 7, hy + 3, 2.6, 1.8, 0, 'rgba(240,130,130,0.55)'); A.oval(ctx, hx + fx + 8, hy + 3, 2.6, 1.8, 0, 'rgba(240,130,130,0.55)'); }
    if (fr) {
      // staring straight at you, too innocently
      for (const ex of [-3.8, 3.8]) {
        A.oval(ctx, hx + ex, hy - 2, 2.9, 3.2, 0, '#ffffff', LINE, 1);
        A.oval(ctx, hx + ex, hy - 1.6, 1.2, 1.3, 0, '#141418');
      }
      A.oval(ctx, hx, hy + 1.6, 1.8, 1.3, 0, LINE);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(hx - 6.5, hy + 3); ctx.quadraticCurveTo(hx, hy + 10, hx + 6.5, hy + 3); ctx.quadraticCurveTo(hx, hy + 5.5, hx - 6.5, hy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 3, hy + 4.4); ctx.lineTo(hx - 3, hy + 6.6); ctx.moveTo(hx, hy + 4.8); ctx.lineTo(hx, hy + 7.2); ctx.moveTo(hx + 3, hy + 4.4); ctx.lineTo(hx + 3, hy + 6.6); ctx.stroke();
      sweatDrop(ctx, hx - 12, hy - 4, 2.2);
    } else if (angry) {
      // the smile dropped: a furious red frown
      if (!o.flash) A.oval(ctx, hx + 2, hy - 1, 10, 8, 0, 'rgba(230,57,70,0.35)');
      for (const ex of [-0.5, 6.5]) {
        A.oval(ctx, hx + ex, hy - 2.2, 1.8, 1.5, 0, '#141418');
        A.oval(ctx, hx + ex + 0.4, hy - 2.2, 0.6, 0.6, 0, '#ff3b3b');
      }
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(hx - 3.5, hy - 6.5); ctx.lineTo(hx + 2, hy - 4); ctx.moveTo(hx + 4, hy - 4); ctx.lineTo(hx + 9.5, hy - 6.8); ctx.stroke();
      A.oval(ctx, hx + 9.5, hy + 1.2, 2.3, 1.6, 0, LINE);
      ctx.fillStyle = '#5a1a1a'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(hx - 0.5, hy + 7); ctx.quadraticCurveTo(hx + 5, hy + 1.5, hx + 10.5, hy + 6.5); ctx.quadraticCurveTo(hx + 5, hy + 4.6, hx - 0.5, hy + 7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(hx + 1.5, hy + 5.4); ctx.quadraticCurveTo(hx + 5, hy + 3.2, hx + 8.8, hy + 5.1); ctx.lineTo(hx + 8.5, hy + 5.8); ctx.quadraticCurveTo(hx + 5, hy + 4.2, hx + 1.8, hy + 6.1); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!o.flash) {
        for (let j = 0; j < 2; j++) {
          const k = (t * 1.5 + j * 0.5) % 1;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(hx - 8 - k * 4, hy - 12 - k * 10, 1.8 + k * 2.4, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(hx + 11 + k * 4, hy - 13 - k * 10, 1.8 + k * 2.4, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    } else if (grin > 0 || evil) {
      // eyes: spirals for the Hypnotic Grin, narrowed and mean for the army
      for (const ex of [-0.5, 6.5]) {
        if (grin > 0.25) {
          const r = 2.2 + grin * 0.9;
          A.oval(ctx, hx + ex, hy - 2.5, r, r, 0, '#ffffff', LINE, 0.8);
          ctx.strokeStyle = evil ? '#c1121f' : '#9d4edd'; ctx.lineWidth = 0.8;
          ctx.beginPath();
          for (let i = 0; i <= 20; i++) { const k = i / 20, a = t * 7 + k * TAU * 2, rr = k * r * 0.85; if (i) ctx.lineTo(hx + ex + Math.cos(a) * rr, hy - 2.5 + Math.sin(a) * rr); else ctx.moveTo(hx + ex, hy - 2.5); }
          ctx.stroke();
        } else {
          A.oval(ctx, hx + ex, hy - 2.2, 1.9, 1.4, 0, '#141418');
          A.oval(ctx, hx + ex + 0.5, hy - 2.5, 0.55, 0.55, 0, '#ff3b3b');
          ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(hx + ex - 2.6, hy - (ex < 3 ? 5.2 : 3.6)); ctx.lineTo(hx + ex + 2.6, hy - (ex < 3 ? 3.6 : 5.2)); ctx.stroke();
        }
      }
      A.oval(ctx, hx + 9.5, hy + 1.2, 2.3, 1.6, 0, LINE);
      // the grin: wider and wider (sparkling) for the Hypnotic Grin, sharp teeth for the army
      const l = hx - 1 - grin * 6, r = hx + 11 + grin * 5, m = 3.5 + grin * 3;
      ctx.fillStyle = '#5a1a1a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(l, hy + 2.5 - grin * 2); ctx.quadraticCurveTo(hx + 5, hy + 3.5, r, hy + 2 - grin * 2.5);
      ctx.quadraticCurveTo(hx + 6, hy + 3 + m * 1.6, l, hy + 2.5 - grin * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.lineWidth = 0.6;
      ctx.beginPath();
      if (evil) {
        for (let i = 0; i < 6; i++) { const tx = lerp(l + 1.5, r - 2.5, i / 5); ctx.moveTo(tx - 0.9, hy + 2.7); ctx.lineTo(tx, hy + 4.8); ctx.lineTo(tx + 0.9, hy + 2.7); }
      } else {
        ctx.moveTo(l + 1.4, hy + 2.6 - grin * 1.6); ctx.quadraticCurveTo(hx + 5, hy + 3.6, r - 1.4, hy + 2.2 - grin * 2); ctx.lineTo(r - 2, hy + 3.6 - grin * 1.2); ctx.quadraticCurveTo(hx + 5, hy + 5.4, l + 2, hy + 3.9 - grin);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(l - 1.2, hy + 1.2 - grin * 2); ctx.lineTo(l, hy + 2.5 - grin * 2); ctx.moveTo(r + 1.2, hy + 0.8 - grin * 2.5); ctx.lineTo(r, hy + 2 - grin * 2.5); ctx.stroke();
      if (grin > 0.3 && !o.flash) {
        // twinkles round the smile
        for (let j = 0; j < 3; j++) {
          const k = (t * 2 + j / 3) % 1, a = j * 2.1 + t;
          A.star(ctx, hx + 5 + Math.cos(a) * (9 + grin * 6), hy + 5 + Math.sin(a) * (5 + grin * 3), (1.2 + grin * 1.6) * (1 - Math.abs(k - 0.5)), '#fff3b0');
        }
        A.star(ctx, r - 3, hy + 3, 1.6 * grin + 0.4, '#ffffff');
      }
    } else {
      for (const ex of [-0.5, 6.5]) {
        A.oval(ctx, hx + ex, hy - 2.5, 1.9, 2.2, 0, '#141418');
        A.oval(ctx, hx + ex + 0.6, hy - 3.3, 0.7, 0.7, 0, '#ffffff');
      }
      A.oval(ctx, hx + 9.5, hy + 1.2, 2.3, 1.6, 0, LINE);
      // the huge smile (opening wider while chatting)
      const m = 3.5 + talk * 2;
      ctx.fillStyle = '#5a1a1a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(hx - 1, hy + 2.5); ctx.quadraticCurveTo(hx + 5, hy + 3.5, hx + 11, hy + 2);
      ctx.quadraticCurveTo(hx + 6, hy + 3 + m * 1.6, hx - 1, hy + 2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      A.oval(ctx, hx + 5, hy + 3.5 + m * 0.6, 2.6, 1.2, 0, '#ff8fab');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 2.2, hy + 1.2); ctx.lineTo(hx - 1, hy + 2.5); ctx.moveTo(hx + 12.2, hy + 0.8); ctx.lineTo(hx + 11, hy + 2); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  // Goanna (a monitor lizard), about 25 px tall and 120 long. o: { frozen, talk, walk }
  A.goanna = function (ctx, x, y, o) {
    o = o || {};
    const s = o.scale || 1, t = o.t || 0, fr = !!o.frozen;
    const fill = (col) => white(o, col);
    const sway = fr ? 0 : Math.sin(t * 2) * 4;
    const step = o.walk && !fr ? Math.sin(t * 10) : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // long tapering tail with pale bands
    ctx.fillStyle = fill('#5b5646'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    A.taper(ctx, -18, -10, -46, -6 + sway * 0.3, -74, -2 + sway, 11, 2); ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.strokeStyle = '#d8c784'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let j = 1; j < 6; j++) { const k = j / 6, tx = lerp(-22, -70, k), ty = lerp(-10, -2, k) + sway * k * k, hw = (11 - 9 * k) / 2; ctx.moveTo(tx, ty - hw); ctx.lineTo(tx - 1, ty + hw); }
      ctx.stroke();
    }
    // splayed legs
    const lg = (lx, ph, col, gesture) => {
      ctx.fillStyle = fill(col); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      const sw = ph * 4;
      if (gesture) { A.taper(ctx, lx, -8, lx + 8, -14, lx + 13, -18 - gesture * 3, 5, 3.5); ctx.fill(); ctx.stroke(); return; }
      A.taper(ctx, lx, -8, lx + 6 + sw, -8, lx + 6 + sw, 0, 5, 3.5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); for (const a of [-0.3, 0, 0.3]) { ctx.moveTo(lx + 6 + sw, 0); ctx.lineTo(lx + 6 + sw + Math.cos(a) * 5, Math.sin(a) * 2 - 0.5); } ctx.stroke();
    };
    lg(-14, -step, '#4a4538'); lg(14, step, '#4a4538');
    // long low body with pale spots
    A.oval(ctx, 0, -11, 25, 8.5, 0, fill('#5b5646'), LINE, 2);
    A.oval(ctx, 2, -6.5, 18, 3, 0, fill('#cbbf8a'));
    if (!o.flash) {
      ctx.fillStyle = '#d8c784';
      ctx.beginPath();
      for (let j = 0; j < 6; j++) { circ(ctx, -18 + j * 7, -14 + (j % 2) * 2, 1.6); circ(ctx, -15 + j * 7, -9 - (j % 2) * 2, 1.2); }
      ctx.fill();
    }
    const gest = o.talk && !fr ? Math.abs(Math.sin(t * 6)) : 0;
    lg(-10, step, '#5b5646'); lg(18, -step, '#5b5646', gest);
    // neck and pointed head (lifted and staring when caught)
    ctx.save();
    ctx.translate(20, -12);
    ctx.rotate(fr ? -0.35 : gest * -0.15 + Math.sin(t * 8) * 0.03 * (o.talk ? 1 : 0));
    ctx.fillStyle = fill('#5b5646'); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
    A.taper(ctx, -4, 0, 8, -2, 16, -4, 12, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -9); ctx.quadraticCurveTo(24, -11, 34, -5); ctx.quadraticCurveTo(36, -3, 33, -1); ctx.quadraticCurveTo(22, 2, 10, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!fr && !o.flash && (t * 1.3) % 1 < 0.3) {
      // forked tongue flick
      ctx.strokeStyle = '#d65a8a'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(34, -3); ctx.lineTo(42, -3); ctx.lineTo(45, -5); ctx.moveTo(42, -3); ctx.lineTo(45, -1); ctx.stroke();
    }
    A.oval(ctx, 32, -5, 0.8, 0.6, 0, LINE);
    if (fr) {
      A.oval(ctx, 19, -6, 3.4, 3.4, 0, '#ffffff', LINE, 1);
      A.oval(ctx, 19, -5.8, 1.4, 1.5, 0, '#141418');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(32, -1); ctx.quadraticCurveTo(26, 2.5, 19, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(18, -1.5); ctx.stroke();
      sweatDrop(ctx, 14, -14, 2);
    } else {
      A.oval(ctx, 20, -5.5, 2.2, 2, 0, fill('#e8a33a'), LINE, 0.8);
      A.oval(ctx, 20.4, -5.5, 0.8, 1.2, 0, '#141418');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(33, -1.5); ctx.quadraticCurveTo(26, 0.5, 18, -1); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  // Matschie's tree-kangaroo: reddish-chestnut fur, golden belly and face, a long thick tail.
  // About 75 px tall standing. o: { sit (sitting on a branch at y, tail hanging), throwing (0..1), branch }
  const TK = { fur: '#9c3f22', dark: '#7a2e18', gold: '#f2c14e', goldDark: '#d9a03a', nose: '#e58a96' };
  A.treeKangaroo = function (ctx, x, y, o) {
    o = o || {};
    const s = o.scale || 1, t = o.t || 0, sit = !!o.sit, th = k01(o.throwing);
    const fill = (col) => white(o, col);
    const breathe = Math.sin(t * 2.4) * 0.8;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (sit && o.branch) {
      ctx.fillStyle = '#6b4a2e'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-60, 0, 120, 10, 5); ctx.fill(); ctx.stroke();
      for (const lx of [-50, 44]) A.oval(ctx, lx, -3, 8, 3.5, lx > 0 ? -0.4 : 0.4, '#4f9a3a', LINE, 1.2);
    }
    // the long golden tail: along the ground, or hanging down from the branch
    ctx.fillStyle = fill(TK.goldDark); ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    const sw = Math.sin(t * 1.4) * 4;
    if (sit) A.taper(ctx, -8, -6, -18, 30, -10 + sw, 68, 11, 6);
    else A.taper(ctx, -12, -16, -34, -4, -62, -3 + sw * 0.3, 12, 6);
    ctx.fill(); ctx.stroke();
    if (!o.flash) {
      ctx.fillStyle = TK.fur;
      if (sit) A.taper(ctx, -8, -6, -12, 6, -14, 18, 10, 7); else A.taper(ctx, -12, -16, -18, -10, -26, -8, 11, 8);
      ctx.fill();
    }
    const by = sit ? -20 : -34, hy = sit ? -47 : -61;
    // hind leg and big foot
    if (sit) {
      A.oval(ctx, 2, -10, 13, 9, 0.2, fill(TK.fur), LINE, 2);
      A.oval(ctx, 14, 4, 9, 3.5, 0.9, fill(TK.gold), LINE, 1.6);
    } else {
      A.oval(ctx, -2, -15, 13, 11, -0.3, fill(TK.fur), LINE, 2);
      A.oval(ctx, 7, -3, 12, 3.6, 0, fill(TK.gold), LINE, 1.6);
    }
    // back arm
    const arm = (sx, sy, px, py, col) => {
      ctx.fillStyle = fill(col); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
      A.taper(ctx, sx, sy, (sx + px) / 2 + 2, (sy + py) / 2 + 2, px, py, 8, 6); ctx.fill(); ctx.stroke();
      A.oval(ctx, px, py, 4, 3.6, 0, fill(TK.dark), LINE, 1.4);
    };
    arm(4, by - 12, 14, by + 6, TK.goldDark);
    // body and golden belly
    A.oval(ctx, 0, by + breathe * 0.3, 16, 21, 0.05, fill(TK.fur), LINE, 2.2);
    A.oval(ctx, 6, by + 2, 9, 15, 0.08, fill(TK.gold));
    // the head: small rounded ears, golden face, pink nose
    const hx = 9;
    for (const [ex, ey] of [[-7, -10], [1, -12]]) {
      A.oval(ctx, hx + ex, hy + ey, 4.4, 4.6, 0, fill(TK.fur), LINE, 1.6);
      A.oval(ctx, hx + ex, hy + ey + 0.6, 2.2, 2.4, 0, fill(TK.gold));
    }
    A.oval(ctx, hx, hy, 12, 11, 0, fill(TK.fur), LINE, 2);
    A.oval(ctx, hx + 5, hy + 2, 8.5, 8, 0, fill(TK.gold));
    A.oval(ctx, hx + 11, hy + 3, 6, 4.4, 0, fill('#f7d77a'), LINE, 1.4);
    A.oval(ctx, hx + 16, hy + 1.6, 2.6, 2, 0, fill(TK.nose));
    A.oval(ctx, hx + 6, hy - 3, 2.6, 2.8, 0, '#141418');
    A.oval(ctx, hx + 6.8, hy - 3.8, 0.9, 0.9, 0, '#ffffff');
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(hx + 15, hy + 5); ctx.quadraticCurveTo(hx + 12, hy + 7, hx + 9, hy + 5.5); ctx.stroke();
    // front arm: resting, or winding up and throwing a fruit
    let px = 18, py = by + 4;
    if (th > 0) {
      if (th < 0.5) { const k = th / 0.5; px = lerp(18, -10, k); py = lerp(by + 4, by - 30, k); }
      else { const k = (th - 0.5) / 0.5; px = lerp(-10, 28, k); py = lerp(by - 30, by - 8, k); }
    }
    arm(8, by - 12, px, py, TK.gold);
    if (th > 0 && th < 0.6) A.fruit(ctx, px + 1, py - 5, t);
    ctx.restore();
  };

  // Northern quoll: small, brown with white spots, pink nose, about 35 px tall. o: { run, bite (0..1), scared,
  //   spottedTail (a spotted-tailed quoll: about 20% bigger, rich chestnut, white spots right down its tail),
  //   champ (a rival champion's red-and-gold sash and medal), crouch (winding up), air (leaping, legs out) }
  const QUOLL = { tail: '#4a3a2c', far: '#5a3a26', fur: '#8a5a3a', belly: '#e8d8c0', snout: '#a7764f', ear: '#e8a0a0', foot: '#e8b5a0' };
  const SPOTTED = { tail: '#7a3a1e', far: '#5c2a15', fur: '#8e4424', belly: '#ecd6bc', snout: '#a85a35', ear: '#e8a0a0', foot: '#e8b5a0' };
  A.quoll = function (ctx, x, y, o) {
    o = o || {};
    const s = o.scale || 1, t = o.t || 0, bite = k01(o.bite), scared = !!o.scared;
    const C = o.spottedTail ? SPOTTED : QUOLL;
    const fill = (col) => white(o, col);
    const air = o.air ? 1 : 0;
    const run = o.run && !air ? Math.sin(t * 18) : 0;
    const bob = (o.run && !air ? -Math.abs(Math.sin(t * 18)) * 2 : 0) + (o.crouch && !air ? 3 : 0);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((o.facing || 1) * s, s);
    if (o.spottedTail) ctx.scale(1.2, 1.2);
    if (air) { ctx.translate(0, -10); ctx.rotate(-0.15); }
    if (scared) { ctx.rotate(-0.18); ctx.translate(Math.sin(t * 30) * 0.5, 0); }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // long tail (the spotted-tailed quoll's is longer, chestnut and spotted)
    ctx.fillStyle = fill(C.tail); ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
    if (o.spottedTail) {
      const tx = -50, ty = -14 + bob + (scared ? 12 : 0) - air * 8, cx = -32, cy = -26 + bob - run * 3 + (scared ? 8 : 0);
      A.taper(ctx, -16, -15 + bob, cx, cy, tx, ty, 7.5, 2.4); ctx.fill(); ctx.stroke();
      if (!o.flash) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (const k of [0.25, 0.42, 0.58, 0.74, 0.88]) { const m = 1 - k, px = m * m * -16 + 2 * m * k * cx + k * k * tx, py = m * m * (-15 + bob) + 2 * m * k * cy + k * k * ty; circ(ctx, px, py - 0.6, 1.3 - k * 0.5); }
        ctx.fill();
      }
    } else {
      A.taper(ctx, -16, -15 + bob, -30, -24 + bob - run * 3 + (scared ? 8 : 0), -44, -16 + bob + (scared ? 12 : 0), 6, 2); ctx.fill(); ctx.stroke();
    }
    // legs (back pair darker)
    const leg = (lx, ph, col) => {
      ctx.fillStyle = fill(col); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      if (air) {
        const fx = lx < 0 ? lx - 9 : lx + 9;
        A.taper(ctx, lx, -13 + bob, (lx + fx) / 2, -9, fx, -5, 5, 4); ctx.fill(); ctx.stroke();
        A.oval(ctx, fx + (lx < 0 ? -1 : 1.5), -4.5, 3.5, 1.6, lx < 0 ? 0.4 : -0.3, fill(C.foot), LINE, 1);
        return;
      }
      ctx.beginPath(); ctx.roundRect(lx - 2.5 + ph * 5, -12 + bob, 5, 12 - bob, 2); ctx.fill(); ctx.stroke();
      A.oval(ctx, lx + 1.5 + ph * 5, -1, 3.5, 1.6, 0, fill(C.foot), LINE, 1);
    };
    leg(-12, run, C.far); leg(10, -run, C.far);
    // body with white spots
    A.oval(ctx, -2, -16 + bob, 18, 10, 0, fill(C.fur), LINE, 2);
    A.oval(ctx, 1, -10 + bob, 12, 3.5, 0, fill(C.belly));
    if (!o.flash) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (const [sx, sy, r] of [[-12, -20, 1.8], [-6, -23, 1.6], [0, -19, 1.9], [6, -22, 1.5], [-9, -15, 1.5], [3, -15, 1.4], [-15, -14, 1.3], [10, -17, 1.3]]) circ(ctx, sx, sy + bob, r);
      ctx.fill();
    }
    leg(-8, -run, C.fur); leg(14, run, C.fur);
    if (o.champ) {
      // the champion's sash over the shoulder, with a gold star medal
      ctx.save();
      ctx.beginPath(); ctx.ellipse(-2, -16 + bob, 17.5, 9.5, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = fill('#ffd23f'); ctx.lineWidth = 6.4;
      ctx.beginPath(); ctx.moveTo(4, -27 + bob); ctx.lineTo(12, -5 + bob); ctx.stroke();
      ctx.strokeStyle = fill('#d62828'); ctx.lineWidth = 4.4; ctx.stroke();
      ctx.restore();
      A.oval(ctx, 9.5, -11 + bob, 3, 3, 0, fill('#ffd23f'), '#8a5a00', 1);
      A.star(ctx, 9.5, -11 + bob, 1.9, fill('#fff3b0'));
    }
    // head: rounded ears, pointed snout, pink nose; jaws open for a bite
    ctx.save();
    ctx.translate(16 + bite * 6, -21 + bob);
    for (const [ex, ey] of [[-3, -9], [2, -10]]) {
      const back = scared ? -0.8 : 0;
      A.oval(ctx, ex + back * 2, ey + Math.abs(back) * 2, 3.6, 4, back, fill(C.fur), LINE, 1.4);
      A.oval(ctx, ex + back * 2, ey + 0.6 + Math.abs(back) * 2, 1.8, 2.2, back, fill(C.ear));
    }
    A.oval(ctx, 0, -1, 8.5, 7.5, 0, fill(C.fur), LINE, 1.8);
    if (bite > 0.05) {
      ctx.save(); ctx.translate(4, 2); ctx.rotate(bite * 0.5);
      ctx.fillStyle = fill(C.snout); ctx.strokeStyle = LINE; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(11, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(6, -0.6); ctx.lineTo(7, -3); ctx.lineTo(8, -0.4); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = fill(C.snout); ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(4, -5); ctx.quadraticCurveTo(10, -4, 15, 0 - bite * 2); ctx.quadraticCurveTo(10, 3, 3, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.oval(ctx, 15, -bite * 2, 2, 1.6, 0, fill('#ff9eb5'), LINE, 0.8);
    if (scared) {
      A.oval(ctx, 2.5, -3, 2.4, 2.6, 0, '#ffffff', LINE, 1);
      A.oval(ctx, 3.3, -3, 1, 1.1, 0, '#141418');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(6, 2.5); ctx.lineTo(7.5, 1.5); ctx.lineTo(9, 2.5); ctx.lineTo(10.5, 1.5); ctx.stroke();
      sweatDrop(ctx, -7, -10, 2);
    } else {
      A.oval(ctx, 3, -3, 1.8, 2, 0, '#141418');
      A.oval(ctx, 3.6, -3.7, 0.6, 0.6, 0, '#ffffff');
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5.5, -5.2); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  // A small purple-blue rainforest fruit (like a blue quandong or a lilly pilly).
  A.fruit = function (ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((t || 0) * 8);
    A.oval(ctx, 0, 0, 6, 6, 0, '#5a48c8', LINE, 1.6);
    A.oval(ctx, -1.8, -2, 1.8, 1.4, -0.5, '#b8b0ff');
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(1, -9); ctx.stroke();
    A.oval(ctx, 3.5, -9, 3, 1.4, -0.3, '#4f9a3a');
    ctx.restore();
  };

  // ================================================================ the Marsupial World map
  // A made-up, friendly blobby continent (loosely after Australia's regions), the ocean,
  // Grin Isle off the west coast and Tasmania-ish to the south. Region centres:
  // Outback (430,270), Rainforest (690,120), Cane Fields & Coast (770,250) with the reef at (880,230),
  // the City (650,390), the Alps (600,420), Tasmania (690,490), the Time Rift (330,180), Grin Isle (90,310).
  const LAND = [[200, 330], [178, 268], [196, 206], [246, 154], [306, 118], [372, 96], [440, 86], [506, 98], [562, 92],
    [598, 116], [626, 148], [648, 110], [662, 60], [694, 36], [724, 62], [740, 120], [772, 166], [806, 206], [828, 252],
    [822, 300], [794, 344], [754, 380], [714, 406], [668, 426], [622, 442], [570, 448], [520, 430], [478, 406], [430, 394],
    [372, 400], [312, 390], [256, 380], [214, 360]];
  function smooth(ctx, pts) {
    const n = pts.length;
    ctx.beginPath();
    ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
  }
  function softBlob(ctx, cx, cy, rx, ry, seed, n) {
    n = n || 12;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, k = 0.86 + hash(seed + i) * 0.28;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    smooth(ctx, pts);
  }
  function island(ctx, cx, cy, rx, ry, seed, land) {
    softBlob(ctx, cx, cy, rx, ry, seed, 10);
    ctx.strokeStyle = 'rgba(140,220,240,0.6)'; ctx.lineWidth = 16; ctx.stroke();
    ctx.fillStyle = '#f2dfa0'; ctx.fill();
    ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 2.5; ctx.stroke();
    softBlob(ctx, cx, cy - 2, rx * 0.8, ry * 0.72, seed + 5, 10);
    ctx.fillStyle = land; ctx.fill();
  }
  function label(ctx, str, x, y) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    MG.UI.outlineText(ctx, str, x, y, 13, '#fff6d8', 'center', 'rgba(43,25,61,0.85)');
    ctx.restore();
  }
  // o (optional): { isleOfMan: true } adds the bonus island in the open sea to the north-west.
  A.worldMap = function (ctx, t, o) {
    t = t || 0;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the ocean with little bobbing waves
    const sea = ctx.createRadialGradient(480, 270, 120, 480, 270, 620);
    sea.addColorStop(0, '#3fa7e0'); sea.addColorStop(1, '#1d5f9e');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let gy = 0; gy < 10; gy++) for (let gx = 0; gx < 13; gx++) {
      const i = gy * 13 + gx;
      const wx = gx * 78 + hash(i) * 50 + Math.sin(t * 0.8 + i) * 5, wy = gy * 58 + 14 + hash(i + 300) * 30 + Math.cos(t * 1.1 + i) * 2;
      ctx.moveTo(wx - 8, wy); ctx.quadraticCurveTo(wx - 4, wy - 4, wx, wy); ctx.quadraticCurveTo(wx + 4, wy - 4, wx + 8, wy);
    }
    ctx.stroke();
    // shallows, beach and land
    smooth(ctx, LAND);
    ctx.strokeStyle = 'rgba(120,210,240,0.55)'; ctx.lineWidth = 34; ctx.stroke();
    ctx.strokeStyle = 'rgba(160,230,245,0.7)'; ctx.lineWidth = 16; ctx.stroke();
    ctx.fillStyle = '#93c66a'; ctx.fill();
    ctx.save();
    ctx.clip();
    // the dry interior and the red-orange Outback with spinifex dots and a tiny red rock
    softBlob(ctx, 395, 262, 250, 160, 11, 14); ctx.fillStyle = '#e8bd72'; ctx.fill();
    softBlob(ctx, 430, 272, 175, 112, 23, 14); ctx.fillStyle = '#de7f45'; ctx.fill();
    softBlob(ctx, 440, 276, 95, 60, 31, 10); ctx.fillStyle = '#cf6a38'; ctx.fill();
    ctx.fillStyle = '#c9c060';
    ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const a = hash(i + 500) * TAU, r = Math.sqrt(hash(i + 600));
      circ(ctx, 430 + Math.cos(a) * r * 165, 272 + Math.sin(a) * r * 100, 1.8);
    }
    ctx.fill();
    ctx.fillStyle = '#b5452a'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(446, 262); ctx.lineTo(450, 253); ctx.lineTo(456, 251); ctx.lineTo(461, 253); ctx.lineTo(468, 252); ctx.lineTo(472, 256); ctx.lineTo(476, 262); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the Rainforest: deep green treetops
    softBlob(ctx, 688, 112, 64, 78, 41, 12); ctx.fillStyle = '#2f8a4a'; ctx.fill();
    for (let i = 0; i < 16; i++) {
      const tx = 652 + hash(i + 700) * 74, ty = 64 + hash(i + 710) * 96;
      A.oval(ctx, tx, ty, 8, 7, 0, i % 3 ? '#3fa05a' : '#4fb468', 'rgba(20,60,30,0.6)', 1.2);
    }
    ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(710, 104); ctx.quadraticCurveTo(716, 128, 740, 140); ctx.stroke();
    // Cane Fields & Coast: a green-gold strip down the east coast, with cane rows
    ctx.save();
    ctx.beginPath(); ctx.ellipse(784, 252, 30, 104, -0.22, 0, TAU);
    ctx.fillStyle = '#c8cc58'; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(150,160,50,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let k = -10; k < 14; k++) { ctx.moveTo(740, 130 + k * 12); ctx.lineTo(830, 150 + k * 12); } ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#2f6e40';
    ctx.beginPath(); for (let i = 0; i < 6; i++) circ(ctx, 806 + i * 2, 276 + i * 12, 4); ctx.fill();
    // the City: grey blocks and a little bridge over the harbour
    softBlob(ctx, 650, 394, 44, 26, 51, 10); ctx.fillStyle = '#b8bcc4'; ctx.fill();
    A.oval(ctx, 688, 410, 20, 9, 0.1, '#4fb0e0');
    for (const [bx, bh, col] of [[624, 18, '#8d99ae'], [634, 28, '#6c7a91'], [645, 22, '#9aa5b1'], [655, 34, '#5c677d'], [666, 20, '#8d99ae']]) {
      ctx.fillStyle = col; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.2;
      ctx.fillRect(bx, 398 - bh, 9, bh); ctx.strokeRect(bx, 398 - bh, 9, bh);
      ctx.fillStyle = '#ffe9a0';
      for (let wy = 398 - bh + 4; wy < 395; wy += 6) ctx.fillRect(bx + 2, wy, 2, 2), ctx.fillRect(bx + 5.5, wy, 2, 2);
    }
    ctx.strokeStyle = '#4a4e69'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(670, 410); ctx.quadraticCurveTo(688, 392, 706, 410); ctx.moveTo(668, 410); ctx.lineTo(708, 410); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath(); for (let k = 0; k < 5; k++) { const bx = 675 + k * 6.5; ctx.moveTo(bx, 410); ctx.lineTo(bx, 410 - Math.sin(((bx - 670) / 36) * Math.PI) * 13); } ctx.stroke();
    // the Alps: snowy mountains
    for (const [mx, mh, mw] of [[580, 26, 18], [602, 34, 22], [626, 24, 17], [560, 18, 13]]) {
      ctx.fillStyle = '#8a9aa8'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(mx - mw, 432); ctx.lineTo(mx, 432 - mh); ctx.lineTo(mx + mw, 432); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(mx - mw * 0.36, 432 - mh * 0.64); ctx.lineTo(mx, 432 - mh); ctx.lineTo(mx + mw * 0.36, 432 - mh * 0.64); ctx.lineTo(mx + mw * 0.12, 432 - mh * 0.56); ctx.lineTo(mx - mw * 0.1, 432 - mh * 0.68); ctx.closePath(); ctx.fill();
    }
    // a scatter of gum trees on the greener coasts, and dunes in the dry west
    for (const [gx, gyy] of [[700, 222], [724, 262], [690, 300], [744, 318], [660, 338], [650, 204], [738, 204], [604, 382], [536, 410], [214, 248], [236, 352], [574, 122]]) {
      A.oval(ctx, gx, gyy, 6, 5, 0, '#4f9a4a', 'rgba(30,70,30,0.6)', 1.2);
      ctx.fillStyle = '#7a5232'; ctx.fillRect(gx - 0.8, gyy + 4, 1.6, 4);
    }
    ctx.strokeStyle = 'rgba(190,130,60,0.5)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const [dx, dy] of [[232, 288], [262, 312], [246, 336], [282, 270], [214, 316]]) { ctx.moveTo(dx - 9, dy); ctx.quadraticCurveTo(dx, dy - 5, dx + 9, dy); }
    ctx.stroke();
    // the Time Rift: a glowing purple crack in the land
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    const glow = ctx.createRadialGradient(330, 180, 4, 330, 180, 70);
    glow.addColorStop(0, 'rgba(200,120,255,' + (0.75 * pulse).toFixed(3) + ')'); glow.addColorStop(1, 'rgba(160,80,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(250, 100, 160, 160);
    ctx.fillStyle = '#2a0f45'; ctx.strokeStyle = '#e8c4ff'; ctx.lineWidth = 2;
    ctx.beginPath();
    const crack = [[292, 166], [306, 172], [312, 162], [326, 178], [336, 170], [348, 188], [360, 182], [370, 196]];
    crack.forEach(([px, py], i) => (i ? ctx.lineTo(px, py - 3) : ctx.moveTo(px, py)));
    for (let i = crack.length - 1; i >= 0; i--) ctx.lineTo(crack[i][0] + 1, crack[i][1] + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = t * 1.5 + i * 1.26;
      A.star(ctx, 330 + Math.cos(a) * 34, 180 + Math.sin(a) * 18, 3 + Math.sin(t * 5 + i), '#f3d9ff');
    }
    // the Top End: green floodplains with wetland pools, dark mangroves along the north coast and a few
    // little magnetic termite mounds (its map stop sits at (466, 116))
    softBlob(ctx, 468, 114, 58, 30, 81, 12); ctx.fillStyle = '#6fae5a'; ctx.fill();
    for (const [px, py, rx, ry] of [[434, 125, 9, 4.2], [500, 130, 9, 4], [508, 112, 7, 3.2], [446, 137, 6, 2.6]]) A.oval(ctx, px, py, rx, ry, 0, '#74c6dc', 'rgba(30,70,90,0.55)', 1.2);
    ctx.fillStyle = '#2b6a3e';
    ctx.beginPath(); for (let i = 0; i < 14; i++) circ(ctx, 412 + i * 9 + hash(i + 900) * 4, 95 + Math.abs(i - 6.5) * 0.9 + hash(i + 910) * 3, 5 + hash(i + 920) * 2); ctx.fill();
    ctx.fillStyle = '#3f8a50';
    ctx.beginPath(); for (let i = 0; i < 14; i++) circ(ctx, 411 + i * 9 + hash(i + 900) * 4, 93 + Math.abs(i - 6.5) * 0.9 + hash(i + 910) * 3, 2.4); ctx.fill();
    ctx.fillStyle = '#9a8c78'; ctx.strokeStyle = 'rgba(43,25,61,0.7)'; ctx.lineWidth = 1;
    for (const [mx, mh] of [[418, 9], [425, 6.5], [431, 8]]) { ctx.beginPath(); ctx.moveTo(mx - 2.2, 112); ctx.lineTo(mx - 1.6, 112 - mh); ctx.lineTo(mx + 0.6, 112 - mh - 1); ctx.lineTo(mx + 2.2, 112); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    smooth(ctx, LAND);
    ctx.strokeStyle = '#f2dfa0'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 2.5; ctx.stroke();
    // the reef offshore: turquoise shallows dotted with coral, surf on the seaward side
    ctx.fillStyle = 'rgba(110,235,215,0.75)';
    ctx.beginPath();
    for (const [rx, ry, a, b, r] of [[866, 196, 16, 7, -0.9], [878, 218, 14, 8, -0.6], [888, 240, 17, 7, -0.4], [882, 262, 13, 6, -0.3], [894, 280, 10, 5, -0.2]]) ell(ctx, rx, ry, a, b, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [rx, ry] of [[880, 188], [893, 210], [904, 234], [900, 258], [906, 278]]) { ctx.moveTo(rx - 5 + Math.sin(t * 2 + ry) * 1.5, ry - 6); ctx.quadraticCurveTo(rx + 1, ry, rx - 2, ry + 7); }
    ctx.stroke();
    for (let i = 0; i < 12; i++) A.oval(ctx, 862 + hash(i + 800) * 34, 192 + i * 7.5, 2, 1.6, 0, ['#ff8fab', '#ffb703', '#c77dff'][i % 3]);
    // a saltwater croc lurking off the Top End: just its eyes and snout above the water, and a ripple
    const cb = Math.sin(t * 1.4) * 0.8;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
    for (let j = 0; j < 2; j++) { const k = (t * 0.45 + j / 2) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(474, 52, 18 + k * 16, 4 + k * 3, 0, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#4f7a3a'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(489, 52 + cb, 5, 3, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const ex of [462, 470]) { ctx.beginPath(); ctx.ellipse(ex, 53 + cb, 4.2, 5, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    for (const ex of [462, 470]) { A.oval(ctx, ex + 0.6, 50.4 + cb, 2.2, 1.7, 0, '#d4e157'); A.oval(ctx, ex + 1.2, 50.4 + cb, 0.6, 1.5, 0, '#1b1430'); }
    A.oval(ctx, 488, 50.6 + cb, 0.8, 0.6, 0, '#2b193d'); A.oval(ctx, 491, 50.6 + cb, 0.8, 0.6, 0, '#2b193d');
    // Tasmania-ish island with a snowy peak
    island(ctx, 690, 490, 38, 27, 61, '#5fa860');
    ctx.fillStyle = '#8a9aa8'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(676, 494); ctx.lineTo(688, 476); ctx.lineTo(700, 494); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(684, 482); ctx.lineTo(688, 476); ctx.lineTo(692, 482); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f7a40'; ctx.beginPath(); circ(ctx, 706, 498, 4); circ(ctx, 672, 500, 3.5); circ(ctx, 700, 506, 3); ctx.fill();
    // Grin Isle: a sunny island whose hill is ALWAYS smiling, with a lighthouse and a palm
    const sun = 0.5 + 0.5 * Math.sin(t * 2);
    ctx.strokeStyle = 'rgba(255,230,120,' + (0.35 + sun * 0.3).toFixed(3) + ')'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + t * 0.2; ctx.moveTo(90 + Math.cos(a) * 54, 306 + Math.sin(a) * 44); ctx.lineTo(90 + Math.cos(a) * 64, 306 + Math.sin(a) * 52); }
    ctx.stroke();
    island(ctx, 90, 314, 50, 34, 71, '#8fd06a');
    A.oval(ctx, 88, 306, 24, 18, 0, '#b8e070', '#2b193d', 2);
    A.oval(ctx, 80, 300, 2.4, 3, 0, '#2b193d'); A.oval(ctx, 96, 300, 2.4, 3, 0, '#2b193d');
    A.oval(ctx, 81, 299, 0.8, 0.8, 0, '#ffffff'); A.oval(ctx, 97, 299, 0.8, 0.8, 0, '#ffffff');
    A.oval(ctx, 74, 307, 3.4, 2, 0, 'rgba(255,120,140,0.6)'); A.oval(ctx, 102, 307, 3.4, 2, 0, 'rgba(255,120,140,0.6)');
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(76, 306); ctx.quadraticCurveTo(88, 324, 100, 306); ctx.quadraticCurveTo(88, 312, 76, 306); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath(); for (const tx of [82, 88, 94]) { ctx.moveTo(tx, 308 + (tx === 88 ? 1.5 : 0.5)); ctx.lineTo(tx, 313 + (tx === 88 ? 2 : 0)); } ctx.stroke();
    // lighthouse with a sweeping beam
    const beam = t * 1.2;
    ctx.fillStyle = 'rgba(255,240,150,0.35)';
    ctx.beginPath(); ctx.moveTo(124, 286); ctx.lineTo(124 + Math.cos(beam - 0.15) * 60, 286 + Math.sin(beam - 0.15) * 30); ctx.lineTo(124 + Math.cos(beam + 0.15) * 60, 286 + Math.sin(beam + 0.15) * 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(120, 306); ctx.lineTo(121.5, 289); ctx.lineTo(126.5, 289); ctx.lineTo(128, 306); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946'; ctx.fillRect(120.6, 300, 6.8, 3); ctx.fillRect(121.2, 294, 5.6, 3);
    A.oval(ctx, 124, 286, 3, 3, 0, '#ffd23f', '#2b193d', 1.2);
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(120.5, 284); ctx.lineTo(124, 279); ctx.lineTo(127.5, 284); ctx.closePath(); ctx.fill(); ctx.stroke();
    // palm tree
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(58, 322); ctx.quadraticCurveTo(54, 308, 58, 296); ctx.stroke();
    for (const a of [-2.6, -1.9, -1.2, -0.5, 0.2]) A.oval(ctx, 58 + Math.cos(a) * 7, 296 + Math.sin(a) * 4, 8, 2.4, a, '#3f9a4a');
    // a little sailboat and a compass
    const bob = Math.sin(t * 2) * 1.5;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(300, 470 + bob); ctx.lineTo(300, 452 + bob); ctx.lineTo(312, 468 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(290, 471 + bob); ctx.lineTo(316, 471 + bob); ctx.lineTo(311, 477 + bob); ctx.lineTo(294, 477 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(58, 480);
    A.oval(ctx, 0, 0, 20, 20, 0, 'rgba(255,246,216,0.85)', '#2b193d', 1.5);
    ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b193d'; ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(4, 0); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    MG.UI.text(ctx, 'N', 0, -25, 10, '#fff6d8', 'center');
    ctx.restore();
    // faint region names
    label(ctx, 'THE OUTBACK', 430, 322);
    label(ctx, 'RAINFOREST', 676, 172);
    label(ctx, 'CANE FIELDS', 878, 300); label(ctx, '& COAST', 878, 315);
    label(ctx, 'THE CITY', 728, 364);
    label(ctx, 'THE ALPS', 560, 458);
    label(ctx, 'TASMANIA', 690, 528);
    label(ctx, 'TIME RIFT', 330, 146);
    label(ctx, 'TOP END', 390, 126);
    label(ctx, 'GRIN ISLE', 90, 362);
    // the bonus Isle of Man: a little green island with a hill, a stone wall, a cottage and sheep
    if (o && o.isleOfMan) {
      island(ctx, 150, 96, 30, 18, 91, '#7cc464');
      A.oval(ctx, 142, 92, 15, 7, 0, '#68b052');
      ctx.strokeStyle = 'rgba(80,90,70,0.8)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(130, 99); ctx.quadraticCurveTo(146, 94, 168, 100); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(156, 87, 8, 5);
      ctx.fillStyle = '#4f5866'; ctx.beginPath(); ctx.moveTo(155, 87.5); ctx.lineTo(160, 84); ctx.lineTo(165, 87.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ell(ctx, 138, 101, 2.2, 1.5, 0); ell(ctx, 145, 103, 2.2, 1.5, 0); ctx.fill();
      label(ctx, 'ISLE OF MAN', 150, 126);
    }
    ctx.restore();
  };
})();
