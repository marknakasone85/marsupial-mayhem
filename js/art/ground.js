// More detail in the ground strip of every world, drawn in code right after the background (in screen
// space, scrolling with the camera like the ground itself):
//  - a soft shadow just under the ground's lit top edge, so the edge reads as a rounded lip
//  - layers of soil lower down (wavy bands)
//  - pebbles and stones that catch the light (a shadow, the stone, a highlight)
//  - cracks in dry ground, little tufts of grass along the edge
//  - in the Outback, kangaroo tracks in the red dirt (pairs of long hind-foot prints, hop after hop)
// Each world's own background already draws its ground; this only adds to it, so worlds that have a
// lot already (the city's kerb, the snow, the lair) get a little, and the Outback gets the most.
// Cheap: every feature is one batched path per frame and the only gradient is cached.
(function () {
  const A = MG.Art;
  const W = MG.W, H = MG.H;
  const TAU = Math.PI * 2;
  const hash = (n) => { const v = Math.sin(n * 91.7 + 13.3) * 43758.5453; return v - Math.floor(v); };

  // shade: the shadow under the lip [r,g,b, strength]; strata: soil layers [colour, strength];
  // stones: [cell width, chance, shadow, stone, highlight] (one stone at most per cell);
  // cracks: [cell, chance, colour, top, bottom] (how far below the edge they sit);
  // tufts: [cell, chance, colour, colour 2, height]; tracks: kangaroo prints [colour]
  const GROUND = {
    outback: {
      shade: ['80,24,10', 0.3], strata: ['110,38,18', 0.2],
      stones: [46, 0.62, 'rgba(70,22,10,0.45)', '#a9502f', 'rgba(255,190,150,0.75)'],
      cracks: [150, 0.7, 'rgba(78,24,10,0.5)', 10, 44], tufts: [90, 0.55, '#d9b44a', '#a8823a', 13],
      tracks: 'rgba(84,26,12,0.32)',
    },
    rainforest: {
      shade: ['20,12,6', 0.35],
      stones: [96, 0.5, 'rgba(15,10,5,0.5)', '#6f6d5c', 'rgba(150,200,110,0.7)'],
      tufts: [120, 0.5, '#4f9a3c', '#3a7a30', 10],
    },
    canefields: {
      shade: ['90,60,30', 0.24],
      stones: [88, 0.45, 'rgba(90,60,30,0.4)', '#b08a62', 'rgba(255,240,210,0.7)'],
      cracks: [170, 0.6, 'rgba(110,70,40,0.42)', 14, 28],
    },
    coast: {
      shade: ['110,85,50', 0.22],
      stones: [110, 0.45, 'rgba(110,85,50,0.35)', '#9c9488', 'rgba(255,255,255,0.7)'],
    },
    alps: {
      shade: ['90,120,170', 0.22],
      tufts: [110, 0.5, '#b8a46a', '#8f8050', 11],
    },
    tasmania: {
      shade: ['30,24,16', 0.3], strata: ['40,30,20', 0.18],
      tufts: [80, 0.5, '#a49a52', '#7d7a3e', 12],
    },
    city: {
      shade: ['70,65,60', 0.16],
      cracks: [190, 0.5, 'rgba(110,105,95,0.5)', 5, 26],
    },
    rift: {
      shade: ['30,10,6', 0.34], strata: ['40,16,10', 0.22],
      stones: [74, 0.6, 'rgba(10,4,4,0.5)', '#2e2630', 'rgba(255,170,110,0.8)'],
      tufts: [130, 0.45, '#6a8a3a', '#4f6e2a', 12],
    },
    grinisle: {
      shade: ['110,60,25', 0.18],
    },
    lair: {
      shade: ['5,5,12', 0.4],
      stones: [120, 0.45, 'rgba(0,0,0,0.5)', '#3c4050', 'rgba(140,255,200,0.45)'],
    },
    isleofman: {
      shade: ['30,70,20', 0.28],
      stones: [150, 0.4, 'rgba(30,60,20,0.4)', '#9a9a92', 'rgba(255,255,255,0.75)'],
      tufts: [44, 0.7, '#9ad66a', '#3f7a30', 14],
    },
    topend: {
      shade: ['70,25,10', 0.28],
      stones: [64, 0.6, 'rgba(70,25,10,0.42)', '#8e4a2c', 'rgba(255,200,160,0.7)'],
      cracks: [180, 0.55, 'rgba(80,28,12,0.45)', 14, 40],
    },
  };

  // the cells of width `cell` that show on screen: fn(screen x, cell number)
  function cells(camX, cell, margin, fn) {
    const first = Math.floor((camX - margin) / cell), last = Math.ceil((camX + W + margin) / cell);
    for (let i = first; i <= last; i++) fn(i * cell - camX, i);
  }
  const shades = new Map(); // the lip's shadow, cached per world and ground height
  function lipShade(ctx, g, gy) {
    const key = g.shade[0] + gy;
    let gr = shades.get(key);
    if (!gr || gr.ctx !== ctx) {
      gr = { ctx, fill: ctx.createLinearGradient(0, gy + 2, 0, gy + 20) };
      gr.fill.addColorStop(0, `rgba(${g.shade[0]},${g.shade[1]})`);
      gr.fill.addColorStop(1, `rgba(${g.shade[0]},0)`);
      shades.set(key, gr);
    }
    ctx.fillStyle = gr.fill;
    ctx.fillRect(0, gy + 2, W, 18);
  }

  MG.GROUND_DETAIL = GROUND;
  A.groundDetail = function (ctx, theme, camX, gy, t, sunset) {
    const g = GROUND[theme] || GROUND.outback;
    camX = camX || 0; t = t || 0; gy = gy || MG.GROUND_Y;
    const deep = H - gy; // how tall the ground strip is
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (g.shade) lipShade(ctx, g, gy);
    if (g.strata && deep > 40) {
      // two wavy bands of darker soil
      ctx.fillStyle = `rgba(${g.strata[0]},${g.strata[1]})`;
      for (const [top, th, seed] of [[0.42, 0.13, 3], [0.7, 0.16, 9]]) {
        const y0 = gy + deep * top, y1 = y0 + deep * th;
        ctx.beginPath();
        let first = true;
        cells(camX, 40, 40, (sx, i) => { const y = y0 + (hash(i + seed) - 0.5) * 5; if (first) { ctx.moveTo(sx, y); first = false; } else ctx.lineTo(sx, y); });
        const back = [];
        cells(camX, 40, 40, (sx, i) => back.push([sx, y1 + (hash(i + seed + 50) - 0.5) * 6]));
        for (let j = back.length - 1; j >= 0; j--) ctx.lineTo(back[j][0], back[j][1]);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (g.tracks) {
      // a kangaroo hopped through here: pairs of long prints, a hop apart, in a few stretches
      ctx.fillStyle = g.tracks;
      ctx.beginPath();
      cells(camX, 520, 700, (sx, i) => {
        if (hash(i + 71) < 0.35) return;
        const y = gy + 12 + hash(i + 72) * 14, x0 = sx + hash(i + 73) * 120;
        const n = 4 + Math.floor(hash(i + 74) * 4), hop = 52 + hash(i + 75) * 16, back = hash(i + 76) < 0.5 ? -1 : 1;
        for (let j = 0; j < n; j++) {
          const px = x0 + j * hop, py = y + Math.sin(j * 1.3 + i) * 1.5;
          for (const [dx, dy] of [[0, 0], [2.5, 4.5]]) { ctx.moveTo(px + dx + 5.5, py + dy); ctx.ellipse(px + dx, py + dy, 5.5, 1.6, back * 0.05, 0, TAU); }
        }
      });
      ctx.fill();
    }
    if (g.cracks) {
      // dry ground: a zigzag crack with a little side branch
      const [cell, chance, col, top, bottom] = g.cracks;
      ctx.strokeStyle = col; ctx.lineWidth = 1.3;
      ctx.beginPath();
      cells(camX, cell, 80, (sx, i) => {
        if (hash(i + 11) > chance) return;
        let x = sx + hash(i + 12) * cell * 0.6, y = gy + top + hash(i + 13) * (bottom - top);
        ctx.moveTo(x, y);
        const n = 3 + Math.floor(hash(i + 14) * 3);
        for (let j = 0; j < n; j++) {
          x += 7 + hash(i * 7 + j) * 9; y += (hash(i * 5 + j) - 0.5) * 7;
          ctx.lineTo(x, y);
          if (j === 1) { ctx.lineTo(x + 6, y + 5); ctx.moveTo(x, y); }
        }
      });
      ctx.stroke();
    }
    if (g.stones) {
      // pebbles: smaller near the top edge (further away), bigger nearer the front
      const [cell, chance, shadow, stone, hi] = g.stones;
      const list = [];
      cells(camX, cell, 30, (sx, i) => {
        if (hash(i + 21) > chance) return;
        const k = Math.pow(hash(i + 22), 1.4); // more of them near the top, where they show
        const y = gy + 7 + k * (deep - 14), r = (2.2 + k * 4.5) * (0.7 + hash(i + 23) * 0.6);
        list.push([sx + hash(i + 24) * cell * 0.8, y, r, (hash(i + 25) - 0.5) * 0.5]);
      });
      ctx.fillStyle = shadow;
      ctx.beginPath();
      for (const [x, y, r, a] of list) { ctx.moveTo(x + 1 + r * 1.3, y + 1.6); ctx.ellipse(x + 1, y + 1.6, r * 1.3, r * 0.6, a, 0, TAU); }
      ctx.fill();
      ctx.fillStyle = stone;
      ctx.beginPath();
      for (const [x, y, r, a] of list) { ctx.moveTo(x + r * 1.2, y); ctx.ellipse(x, y, r * 1.2, r * 0.7, a, 0, TAU); }
      ctx.fill();
      ctx.fillStyle = hi;
      ctx.globalAlpha = sunset ? 0.7 : 1;
      ctx.beginPath();
      for (const [x, y, r] of list) { ctx.moveTo(x - r * 0.25 + r * 0.5, y - r * 0.3); ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.5, r * 0.22, -0.2, 0, TAU); }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (g.tufts) {
      // little tufts of grass along the edge, swaying a touch
      const [cell, chance, c1, c2, hgt] = g.tufts;
      ctx.lineWidth = 1.6;
      for (const [col, pick] of [[c2, 0], [c1, 1]]) {
        ctx.strokeStyle = col;
        ctx.beginPath();
        cells(camX, cell, 30, (sx, i) => {
          if (hash(i + 31) > chance) return;
          const bx = sx + hash(i + 32) * cell * 0.7, by = gy + 2 + hash(i + 33) * 3, h = hgt * (0.6 + hash(i + 34) * 0.6);
          const sway = Math.sin(t * 1.5 + i * 0.9) * 1.5;
          for (let j = -2; j <= 2; j++) {
            if ((j + 2) % 2 !== pick) continue;
            const hh = h * (1 - Math.abs(j) * 0.18);
            ctx.moveTo(bx + j * 1.5, by);
            ctx.quadraticCurveTo(bx + j * 2.5, by - hh * 0.6, bx + j * 4 + sway, by - hh);
          }
        });
        ctx.stroke();
      }
    }
    ctx.restore();
  };
})();
