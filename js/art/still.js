// Still layers (15 Nov 2026, for older phones). The parts of a picture that never change while you play
// (a sky's gradient, the sea, a band of mist, the soil, and the light and haze's glow, colour grade and
// vignette) are drawn once into a picture at the screen's real pixel size, then copied into place every
// frame. Without a graphics chip, filling a full-screen gradient took 0.93 ms and copying the finished
// picture 0.12 ms; a whole frame went from 6.5-10 ms to 3-6 ms. Anything that moves with the camera or
// with time is still drawn live, in the same order, so it all looks the same.
// When a picture can't be copied 1:1 (the slow-motion finisher's zoom, another canvas, no document to
// make pictures in), the layer is simply drawn directly. A.stillOff switches it all off.
(function () {
  const A = MG.Art;
  const W = MG.W, H = MG.H;
  const MAX = 16;                // pictures kept (a world needs up to 10, light included)
  const BUDGET = 20e6;           // ...and at most this many pixels in all (about 80 MB)
  const cache = new Map();       // key -> canvas, in order of last use (the oldest first)
  let pixels = 0, recent = [];   // pixels kept; when the last pictures were made
  A.stillStats = { copied: 0, made: 0, direct: 0 };
  A.stillCache = cache;
  A.stillOff = false;

  function canvasFor(w, h) {
    if (typeof document === 'undefined' || !document || typeof document.createElement !== 'function') return null;
    const c = document.createElement('canvas');
    if (!c || typeof c.getContext !== 'function') return null;
    c.width = w; c.height = h;
    return c.getContext('2d') ? c : null;
  }
  function forget(k) { const c = cache.get(k); if (c) { pixels -= c.width * c.height; cache.delete(k); } }
  A.stillClear = function () { for (const k of [...cache.keys()]) forget(k); recent = []; };

  // paint(ctx) draws the layer in game coordinates, inside (x, y, w, h); key names everything it depends on.
  A.still = function (ctx, key, x, y, w, h, paint) {
    const m = !A.stillOff && typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
    const base = (MG.Engine && MG.Engine.pixel) || 1;
    if (!m || m.b || m.c || Math.abs(m.a - base) > 1e-6 || Math.abs(m.d - base) > 1e-6) { A.stillStats.direct++; paint(ctx); return; }
    // only the part on screen is kept
    const cw = ctx.canvas && ctx.canvas.width ? ctx.canvas.width : W * m.a, ch = ctx.canvas && ctx.canvas.height ? ctx.canvas.height : H * m.d;
    const x0 = Math.max(x, -m.e / m.a), y0 = Math.max(y, -m.f / m.d), x1 = Math.min(x + w, (cw - m.e) / m.a), y1 = Math.min(y + h, (ch - m.f) / m.d);
    if (x1 <= x0 || y1 <= y0) return;
    // where it lands in real pixels; the picture keeps the fraction, so edges match exactly
    const dx = m.e + x0 * m.a, dy = m.f + y0 * m.d;
    const ox = Math.floor(dx), oy = Math.floor(dy), fx = dx - ox, fy = dy - oy;
    // (the part kept depends on the canvas's size, so it's in the key too)
    const k = key + '@' + m.a.toFixed(5) + ':' + fx.toFixed(3) + ',' + fy.toFixed(3) + ' ' + Math.round(x0) + ',' + Math.round(y0) + ',' + Math.round(x1) + ',' + Math.round(y1);
    let c = cache.get(k);
    if (c) cache.delete(k); // (put back at the end: the most recently used)
    else {
      c = canvasFor(Math.ceil(fx + (x1 - x0) * m.a) + 1, Math.ceil(fy + (y1 - y0) * m.d) + 1);
      if (!c) { A.stillStats.direct++; paint(ctx); return; }
      const g = c.getContext('2d');
      g.setTransform(m.a, 0, 0, m.d, fx - x0 * m.a, fy - y0 * m.d);
      paint(g);
      A.stillStats.made++;
      pixels += c.width * c.height;
      while (cache.size && (cache.size >= MAX || pixels > BUDGET)) forget(cache.keys().next().value);
      // safety net: if pictures keep being remade at the same size (something changing every frame, or
      // too little room to keep them), stop making them and draw directly
      const now = typeof performance !== 'undefined' ? performance.now() : 0;
      recent.push([now, m.a]);
      recent = recent.filter((r) => now - r[0] < 3000 && r[1] === m.a);
      if (recent.length > 40) { A.stillOff = true; A.stillClear(); }
    }
    cache.set(k, c);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, ox, oy);
    ctx.restore();
    A.stillStats.copied++;
  };

  // A gradient filling (x, y, w, h), drawn once and reused. g: [x0, y0, x1, y1] for a linear gradient or
  // [x0, y0, r0, x1, y1, r1] for a radial one; stops: [[at, colour], ...].
  A.band = function (ctx, x, y, w, h, g, stops) {
    let key = 'band ' + x + ',' + y + ',' + w + ',' + h + ' ' + g.join(',');
    for (const s of stops) key += ' ' + s[0] + '=' + s[1];
    A.still(ctx, key, x, y, w, h, (c) => {
      const gr = g.length === 6 ? c.createRadialGradient(g[0], g[1], g[2], g[3], g[4], g[5]) : c.createLinearGradient(g[0], g[1], g[2], g[3]);
      for (const s of stops) gr.addColorStop(s[0], s[1]);
      c.fillStyle = gr;
      c.fillRect(x, y, w, h);
    });
  };
})();
