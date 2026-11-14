// Light and atmosphere for every world, all drawn in code (no pictures), in screen space:
//  - back(): a soft haze over the far scenery, so the action in front stands out
//  - front(): shafts of light, the sun's glow, a colour grade for the world's mood (warm on the
//    sun's side, cool on the other), lava glow in the Time Rift, and a soft vignette at the edges.
// Settings → "Light and haze" switches it off (for slow phones). High contrast keeps only the haze.
(function () {
  const W = MG.W, H = MG.H;
  const S = MG.Settings;

  // Each world's look. haze: colour (r,g,b) and strength; sun: where its glow sits on screen;
  // glow: its colour and strength; warm/cool: the colour grade (soft light) and its strength gr;
  // shade: the canopy's (or cave roof's) shadow over the top of the screen, which makes the rays show;
  // rays: shafts of light through trees or cracks; under: a glow from below (lava); vig: vignette.
  const LOOKS = {
    outback: { haze: '255,222,184', hz: 0.3, sun: [780, 90], glow: '255,228,150', gl: 0.5, warm: '#ff9a30', cool: '#5a78d0', gr: 0.36, vig: 0.3 },
    rainforest: { haze: '214,240,206', hz: 0.3, shade: '40,90,50', sh: 0.55, rays: '255,246,170', ra: 0.42, motes: 1, warm: '#e2ff7a', cool: '#1d6a5c', gr: 0.28, vig: 0.36 },
    canefields: { haze: '255,238,200', hz: 0.26, sun: [760, 85], glow: '255,232,160', gl: 0.46, warm: '#ffbe50', cool: '#4f8fd0', gr: 0.26, vig: 0.26 },
    coast: { haze: '222,240,255', hz: 0.26, sun: [220, 60], glow: '255,244,196', gl: 0.42, warm: '#ffcf70', cool: '#2f9fc4', gr: 0.22, vig: 0.26 },
    alps: { haze: '236,244,255', hz: 0.34, sun: [800, 70], glow: '255,255,232', gl: 0.32, warm: '#fff0c8', cool: '#5b82d6', gr: 0.24, vig: 0.24 },
    tasmania: { haze: '214,226,226', hz: 0.36, shade: '70,90,100', sh: 0.3, rays: '236,246,255', ra: 0.24, warm: '#d6e6cf', cool: '#34587a', gr: 0.26, vig: 0.34 },
    city: { haze: '214,230,250', hz: 0.3, sun: [800, 80], glow: '255,232,172', gl: 0.44, warm: '#ffbb60', cool: '#4a6ed0', gr: 0.26, vig: 0.28 },
    rift: { haze: '255,172,146', hz: 0.24, under: '255,110,40', un: 0.3, warm: '#ff8a3d', cool: '#5b2a8a', gr: 0.32, vig: 0.38 },
    grinisle: { haze: '255,242,228', hz: 0.24, sun: [780, 95], glow: '255,238,164', gl: 0.46, warm: '#ffc85e', cool: '#3fa6d8', gr: 0.24, vig: 0.24 },
    lair: { haze: '40,28,70', hz: 0.32, shade: '30,20,60', sh: 0.5, rays: '170,255,210', ra: 0.18, warm: '#7dffc4', cool: '#2a1a5e', gr: 0.3, vig: 0.52 },
    isleofman: { haze: '230,240,250', hz: 0.28, sun: [210, 40], glow: '255,246,208', gl: 0.36, warm: '#ffdf90', cool: '#5a8cc6', gr: 0.22, vig: 0.26 },
    topend: { haze: '255,236,204', hz: 0.28, sun: [730, 180], glow: '255,218,140', gl: 0.5, warm: '#ffa64c', cool: '#3d86b2', gr: 0.28, vig: 0.28 },
  };
  // A sunset sky (some Outback, City and Time Rift maps, the duel's Sunset Mesa): the sun sits low
  // and everything turns orange.
  const SUNSET = { haze: '255,176,128', hz: 0.28, glow: '255,164,84', gl: 0.58, warm: '#ff7030', cool: '#5e3592', gr: 0.36, vig: 0.34 };

  // v: { theme, sunset, camX, t, groundY }
  function look(v) {
    const base = LOOKS[v.theme] || LOOKS.outback;
    if (!v.sunset) return base;
    return Object.assign({}, base, SUNSET, { sun: [780, (v.groundY || MG.GROUND_Y) - 60] });
  }
  const on = () => S.lighting !== false;
  const rgba = (c, a) => `rgba(${c},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  const mod = (a, n) => ((a % n) + n) % n;

  // A gradient drawn into the rectangle (x, y, dw, dh): draw() paints a w x h box in its own units.
  function layer(ctx, w, h, draw, x, y, dw, dh) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dw / w, dh / h); draw(ctx, w, h); ctx.restore();
  }
  // a top-to-bottom gradient through the given [stop, colour] pairs
  const vertical = (stops) => (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    for (const [at, col] of stops) gr.addColorStop(at, col);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  };

  MG.Light = {
    LOOKS, SUNSET, look, on,

    // After the background: haze over the far scenery (strongest just above the horizon).
    back(ctx, v) {
      if (!on()) return;
      const k = look(v), gy = v.groundY || MG.GROUND_Y;
      layer(ctx, 4, 68, vertical([[0, rgba(k.haze, 0)], [0.62, rgba(k.haze, k.hz)], [0.9, rgba(k.haze, k.hz * 0.6)], [1, rgba(k.haze, 0)]]),
        -40, gy - 340, W + 80, 340);
    },

    // Safety net for slow devices (no graphics chip for the canvas): if most frames take longer than
    // 25 ms for two 2-second stretches in a row while the light is on, switch it off for this visit.
    // Only when the player hasn't chosen in Settings (choosing ON there keeps it on).
    autoOff: false,
    watch() {
      const now = performance.now(), dt = now - (this.lastT || now);
      this.lastT = now;
      if (!(dt > 0) || dt > 250) return; // the first frame, or the game was paused or hidden
      this.n = (this.n || 0) + 1;
      this.slowN = (this.slowN || 0) + (dt > 25 ? 1 : 0);
      if (this.n < 90) return;
      const slow = this.slowN > this.n * 0.7;
      this.n = 0; this.slowN = 0;
      this.slowRuns = slow ? (this.slowRuns || 0) + 1 : 0;
      if (this.slowRuns >= 2 && MG.Save.get('lighting', null) === null) { S.lighting = false; this.autoOff = true; }
    },

    // Over the finished picture (before the HUD): light, colour and the vignette.
    front(ctx, v) {
      if (!on()) return;
      this.watch();
      if (S.contrast) return;
      const k = look(v), gy = v.groundY || MG.GROUND_Y, t = v.t || 0, camX = v.camX || 0;
      ctx.save();
      if (k.shade) {
        // the canopy's shadow (or the cave roof's), so the shafts of light show
        ctx.globalCompositeOperation = 'multiply';
        layer(ctx, 4, 60, vertical([[0, rgba(k.shade, k.sh)], [1, rgba(k.shade, 0)]]), -20, -10, W + 40, 310);
      }
      if (k.rays) this.rays(ctx, k, gy, t, camX);
      if (k.under) {
        // lava light from below, flickering
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 1.7);
        layer(ctx, 4, 60, vertical([[0, rgba(k.under, 0)], [1, rgba(k.under, k.un)]]), -20, gy - 220, W + 40, H - gy + 230);
        ctx.globalAlpha = 1;
      }
      if (k.sun && k.gl) {
        // the sun's glow spilling over everything near it
        ctx.globalCompositeOperation = 'screen';
        const [sx, sy] = k.sun, r = 380;
        layer(ctx, 64, 64, (g, w) => {
          const gr = g.createRadialGradient(w / 2, w / 2, w / 76, w / 2, w / 2, w / 2);
          gr.addColorStop(0, rgba(k.glow, k.gl));
          gr.addColorStop(0.35, rgba(k.glow, k.gl * 0.45));
          gr.addColorStop(1, rgba(k.glow, 0));
          g.fillStyle = gr; g.fillRect(0, 0, w, w);
        }, sx - r, sy - r, r * 2, r * 2);
      }
      if (k.gr) {
        // colour grade: warm light from the sun's side, cooler shade on the other
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = k.gr;
        const [sx, sy] = k.sun || [W / 2, -100];
        layer(ctx, 96, 54, (g, w, h) => {
          const gr = g.createLinearGradient(sx * w / W, sy * h / H, (W - sx) * w / W, h);
          gr.addColorStop(0, k.warm); gr.addColorStop(1, k.cool);
          g.fillStyle = gr; g.fillRect(0, 0, w, h);
        }, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      if (k.vig) {
        ctx.globalCompositeOperation = 'source-over';
        layer(ctx, 160, 90, (g, w, h) => {
          const vg = g.createRadialGradient(w / 2, h * 0.52, h * 0.42, w / 2, h * 0.52, w * 0.66);
          vg.addColorStop(0, 'rgba(18,8,30,0)');
          vg.addColorStop(1, rgba('18,8,30', k.vig));
          g.fillStyle = vg; g.fillRect(0, 0, w, h);
        }, -6, -6, W + 12, H + 12);
      }
      ctx.restore();
    },

    // Slanting shafts of light (through the rainforest canopy, the Tasmanian mist, the lair's cracks),
    // drifting slowly with the camera, with specks of dust or pollen floating in them.
    rays(ctx, k, gy, t, camX) {
      ctx.globalCompositeOperation = 'screen';
      const span = W + 500;
      for (let i = 0; i < 4; i++) {
        const x = mod(i * 290 + 90 - camX * 0.22, span) - 250 + Math.sin(t * 0.3 + i * 1.7) * 26;
        const w = 60 + (i % 2) * 50, a = k.ra * (0.62 + 0.38 * Math.sin(t * 0.45 + i * 2.1));
        const g = ctx.createLinearGradient(0, -10, 0, gy + 10);
        g.addColorStop(0, rgba(k.rays, a));
        g.addColorStop(0.75, rgba(k.rays, a * 0.6));
        g.addColorStop(1, rgba(k.rays, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, -10);
        ctx.lineTo(x + w / 2, -10);
        ctx.lineTo(x + 150 + w * 0.9, gy + 10);
        ctx.lineTo(x + 150 - w * 0.9, gy + 10);
        ctx.closePath();
        ctx.fill();
        if (k.motes) {
          ctx.fillStyle = rgba(k.rays, 0.75);
          for (let m = 0; m < 5; m++) {
            const f = mod(t * 0.05 + m * 0.21 + i * 0.13, 1), y = 40 + f * (gy - 60);
            const mx = x + f * 150 + Math.sin(t * 0.9 + m * 2 + i) * w * 0.4;
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2.3 + m + i * 3);
            ctx.fillRect(mx, y, 2, 2);
          }
          ctx.globalAlpha = 1;
        }
      }
    },
  };
})();
