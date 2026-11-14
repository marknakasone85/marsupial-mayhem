// One drawing rig for the upright cartoon marsupials (everyone except the kangaroo family).
// Each species is a preset: body, head, snout, ears, eyes, tail, markings and colours.
// Facing right, feet at (0, 0), about 100-120 px tall at scale 1.
(function () {
  const A = MG.Art;
  const lerp = (a, b, k) => a + (b - a) * k;
  const LINE = '#2b1a14';

  // ---------------------------------------------------------------- species presets
  const LOOKS = (A.LOOKS = {
    wombat: {
      L: 14, rx: 31, ry: 26, hr: 17, armLen: 22, armW: 13, legW: 15, footLen: 20,
      fur: '#8b6f55', dark: '#6c543f', belly: '#a88d72',
      snout: { len: 7, w: 12, color: '#7a6450', nose: '#2b2622', noseW: 9, noseH: 7 },
      ears: { type: 'round', size: 6, inner: '#6c543f' }, eye: { r: 3, style: 'beady' },
      tail: null, marks: ['rumpPlate'],
    },
    devil: {
      L: 18, rx: 24, ry: 22, hr: 17, armLen: 22, armW: 11, legW: 12, footLen: 16,
      fur: '#231e1e', dark: '#151212', belly: '#2c2626', light: '#f4f1ea',
      snout: { len: 10, w: 10, color: '#2e2828', nose: '#d98b8b', noseW: 4.5, noseH: 3.5 },
      ears: { type: 'round', size: 9, inner: '#e98a8a', solid: '#e98a8a' }, eye: { r: 3.8, style: 'shiny' },
      tail: { type: 'thick', len: 30, w: 13, color: '#1a1616' }, marks: ['blaze'],
    },
    glider: {
      L: 18, rx: 16, ry: 18, hr: 14, armLen: 20, armW: 7, legW: 8, footLen: 12,
      fur: '#9aa0a8', dark: '#6f747c', belly: '#f1ece2', stripe: '#2b2b33',
      snout: { len: 6, w: 7, color: '#a3a9b1', nose: '#ff9eb5', noseW: 3, noseH: 2.4 },
      ears: { type: 'pointy', size: 10, inner: '#f2b8c6' }, eye: { r: 6, style: 'big' },
      tail: { type: 'fluffy', len: 46, w: 10, color: '#8a9098', tip: '#2b2b33' }, marks: ['stripe', 'eyeRing'], membrane: true,
    },
    numbat: {
      L: 17, rx: 21, ry: 16, hr: 13, armLen: 18, armW: 7, legW: 8, footLen: 13,
      fur: '#b5602f', dark: '#7a3e1e', belly: '#e8d2b0', light: '#f7efe2',
      snout: { len: 14, w: 6, color: '#b5602f', nose: '#2b1a14', noseW: 2.6, noseH: 2.2 },
      ears: { type: 'pointy', size: 7, inner: '#d9a07a' }, eye: { r: 3.4, style: 'normal' },
      tail: { type: 'brush', len: 36, w: 15, color: '#8a4a28', tip: '#cfa98a' }, marks: ['bands', 'eyeStripe'],
    },
    bilby: {
      L: 20, rx: 18, ry: 18, hr: 13, armLen: 18, armW: 7, legW: 9, footLen: 17,
      fur: '#a7a3b8', dark: '#7d7890', belly: '#f4f0f6',
      snout: { len: 16, w: 6, color: '#c9bfd6', nose: '#ff8fab', noseW: 2.8, noseH: 2.4 },
      ears: { type: 'long', size: 27, inner: '#f6b3c4' }, eye: { r: 3.4, style: 'normal' },
      tail: { type: 'crest', len: 32, w: 8, color: '#1e1e24', tip: '#f4f0f6' }, marks: [],
    },
    yapok: {
      L: 17, rx: 18, ry: 18, hr: 13, armLen: 19, armW: 7, legW: 9, footLen: 18,
      fur: '#9aa1a8', dark: '#262626', belly: '#e8e8e8', light: '#f2f2f2',
      snout: { len: 9, w: 7, color: '#d6d6d6', nose: '#2b2b2b', noseW: 3, noseH: 2.4 },
      ears: { type: 'round', size: 6, inner: '#262626', solid: '#262626' }, eye: { r: 3.4, style: 'normal' },
      tail: { type: 'naked', len: 44, w: 7, color: '#2a2a2a', tip: '#e8e2d6' }, marks: ['marbled', 'mask'], webbed: true,
    },
    koala: {
      L: 16, rx: 24, ry: 24, hr: 19, armLen: 22, armW: 10, legW: 12, footLen: 15,
      fur: '#9a9ea3', dark: '#7c8085', belly: '#eceae6', light: '#f6f5f2',
      snout: { len: 2, w: 9, color: '#9a9ea3', nose: '#2d2a2a', noseW: 7, noseH: 9.5 },
      ears: { type: 'fluffy', size: 13, inner: '#f6f5f2' }, eye: { r: 3.4, style: 'sleepy' },
      tail: null, marks: ['chin'],
    },
    brushtail: {
      L: 18, rx: 20, ry: 20, hr: 15, armLen: 20, armW: 8, legW: 10, footLen: 15,
      fur: '#8d8f93', dark: '#5d5f63', belly: '#efe6d6',
      snout: { len: 9, w: 8, color: '#a7a9ad', nose: '#f2a5b5', noseW: 3.4, noseH: 2.8 },
      ears: { type: 'pointy', size: 13, inner: '#f2b8c6' }, eye: { r: 5, style: 'big' },
      tail: { type: 'brush', len: 48, w: 17, color: '#1f1f22', tip: '#2e2e33' }, marks: ['darkMuzzle'],
    },
    opossum: {
      L: 18, rx: 20, ry: 19, hr: 14, armLen: 19, armW: 8, legW: 9, footLen: 15,
      fur: '#9b9b9b', dark: '#2b2b2b', belly: '#cfcfcf', head: '#f2efe9',
      snout: { len: 13, w: 7, color: '#f2efe9', nose: '#ff9eb5', noseW: 3.2, noseH: 2.6 },
      ears: { type: 'round', size: 8, inner: '#2b2b2b', solid: '#2b2b2b', tipColor: '#f2efe9' }, eye: { r: 3.4, style: 'shiny' },
      tail: { type: 'naked', len: 44, w: 7, color: '#f0b8b8', base: '#2b2b2b' }, marks: [],
    },
    // the secret two: Ghost the thylacine (sandy coat, dark stripes over the back and rump, a long jaw
    // and a stiff tail) and Cousin Cuscus (a cream spotted cuscus with blotches, big orange-red eyes,
    // tiny ears and a prehensile tail with a bare, curling tip)
    thylacine: {
      L: 21, rx: 20, ry: 21, hr: 14, armLen: 20, armW: 9, legW: 11, footLen: 18,
      fur: '#cfa46a', dark: '#a87d4a', belly: '#f0dfbb', stripe: '#3b281c',
      snout: { len: 19, w: 11, color: '#dcb886', nose: '#2b1a14', noseW: 3.8, noseH: 3 },
      ears: { type: 'erect', size: 10, inner: '#ecb9a2' }, eye: { r: 3.4, style: 'normal' },
      tail: { type: 'stiff', len: 52, w: 15, color: '#cfa46a', stripe: '#3b281c' }, marks: ['tigerStripes', 'paleEyes'],
    },
    cuscus: {
      L: 13, rx: 27, ry: 26, hr: 18, armLen: 25, armW: 11, legW: 13, footLen: 16,
      fur: '#f3ecda', dark: '#d8ccb2', belly: '#fffaf0', spot: '#8f7c68',
      snout: { len: 4, w: 11, color: '#f7dcc2', nose: '#e8968a', noseW: 5, noseH: 4 },
      ears: { type: 'tiny', size: 5, inner: '#e8c4ac' }, eye: { r: 5.8, style: 'round', iris: '#ee6a28' },
      tail: { type: 'prehensile', len: 46, w: 13, color: '#f3ecda', bare: '#e9c3a0', spot: '#8f7c68' }, marks: ['blotches', 'peachFace'],
    },
  });

  // A tapered spiral (a tail tip curling round): from (x, y) heading in direction a0, curling
  // `turn` radians (sign = which way), starting radius r, width w0 down to w1.
  function curlPath(ctx, x, y, a0, r, turn, w0, w1) {
    const N = 16, L = [], R = [];
    let px = x, py = y, a = a0;
    for (let i = 0; i <= N; i++) {
      const k = i / N, w = lerp(w0, w1, k) / 2;
      L.push([px - Math.sin(a) * w, py + Math.cos(a) * w]);
      R.push([px + Math.sin(a) * w, py - Math.cos(a) * w]);
      const step = (Math.abs(turn) * r * (1 - k * 0.55)) / N;
      a += turn / N;
      px += Math.cos(a) * step; py += Math.sin(a) * step;
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = N; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
  }

  // ---------------------------------------------------------------- pieces
  function tail(ctx, k, T, root, pose) {
    if (!T) return;
    // tip position: resting behind, lifted while hopping, swung forward for tail attacks
    const swing = pose.tailSwing || 0;          // 0 = behind, 1 = swung all the way forward
    const high = pose.tailHigh || 0;            // forward swing at chest height (whip) vs low (trip)
    const back = { x: root.x - T.len, y: root.y + 6 - (pose.air ? 14 : 0) + Math.sin(pose.t * 2) * 2 };
    const front = { x: root.x + T.len * 1.5, y: high ? root.y - 10 : -6 - (root.y + k.L) * 0 };
    const tip = { x: lerp(back.x, front.x, swing), y: lerp(back.y, swing ? lerp(-4, front.y, high) : back.y, swing) };
    const ctrl = { x: (root.x + tip.x) / 2 - 8 * (1 - swing), y: Math.min(root.y, tip.y) - T.len * 0.45 * (1 - swing * 0.7) };
    ctx.fillStyle = pose.flash ? '#ffffff' : T.color;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    if (T.type === 'naked') {
      if (T.base) {
        A.taper(ctx, root.x, root.y, (root.x * 2 + ctrl.x) / 3, (root.y * 2 + ctrl.y) / 3, (root.x + ctrl.x) / 2, (root.y + ctrl.y) / 2, T.w, T.w * 0.85);
        ctx.fillStyle = pose.flash ? '#ffffff' : T.base; ctx.fill(); ctx.stroke();
        ctx.fillStyle = pose.flash ? '#ffffff' : T.color;
      }
      A.taper(ctx, root.x, root.y, ctrl.x, ctrl.y, tip.x, tip.y, T.w, 2.5);
      ctx.fill(); ctx.stroke();
      if (T.tip) { A.oval(ctx, tip.x, tip.y, 3, 3, 0, pose.flash ? '#ffffff' : T.tip); }
    } else if (T.type === 'stiff') {
      // the thylacine's long, stiff tail: thick where it joins the body, held straight out behind
      // (flat along the floor when knocked out)
      const sx = pose.ko ? root.x - 4 : tip.x, sy = pose.ko ? root.y - T.len : tip.y + 8;
      const mx = (root.x + sx) / 2, my = (root.y + sy) / 2 + 3;
      A.taper(ctx, root.x + 4, root.y - 2, mx, my, sx, sy, T.w, 3.5);
      ctx.fill(); ctx.stroke();
      if (T.stripe && !pose.flash) {
        ctx.strokeStyle = T.stripe;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const q = 0.1 + i * 0.1, m = 1 - q;
          const x = m * m * (root.x + 4) + 2 * m * q * mx + q * q * sx, y = m * m * (root.y - 2) + 2 * m * q * my + q * q * sy;
          const hw = lerp(T.w, 3.5, q) * 0.42;
          ctx.beginPath(); ctx.moveTo(x + 1, y - hw); ctx.lineTo(x - 1, y + hw * 0.2); ctx.stroke();
        }
      }
    } else if (T.type === 'prehensile') {
      // the cuscus's grasping tail: furry at the base, then a bare tip that curls round
      // (lying along the ground, the tip curled up behind; up off the floor when knocked out)
      const gy = pose.ko ? root.y - T.len * 0.2 : Math.max(root.y + 4, (pose.ground || 14) - T.w * 0.45 - (pose.air ? 12 : 0));
      const mx = root.x - T.len * (pose.ko ? 0.2 : 0.5), my = pose.ko ? root.y - T.len * 0.55 : gy;
      A.taper(ctx, root.x, root.y, root.x - T.len * 0.3, pose.ko ? root.y - 4 : gy, mx, my, T.w, T.w * 0.68);
      ctx.fill(); ctx.stroke();
      if (T.spot && !pose.flash) {
        A.oval(ctx, lerp(root.x, mx, 0.35), lerp(root.y, my, 0.5) - 1, T.w * 0.28, T.w * 0.2, 0.4, T.spot);
        A.oval(ctx, lerp(root.x, mx, 0.72), lerp(root.y, my, 0.85) - 1, T.w * 0.2, T.w * 0.16, 0.9, T.spot);
      }
      ctx.fillStyle = pose.flash ? '#ffffff' : T.bare;
      ctx.strokeStyle = LINE;
      curlPath(ctx, mx + 2, my, pose.ko ? -Math.PI / 2 - 0.3 : Math.PI + 0.25, T.len * 0.3, 3.7 + Math.sin(pose.t * 1.5) * 0.25, T.w * 0.62, 2.4);
      ctx.fill(); ctx.stroke();
    } else if (T.type === 'thick') {
      A.taper(ctx, root.x, root.y, ctrl.x, ctrl.y + 6, tip.x, tip.y + 8, T.w, T.w * 0.45);
      ctx.fill(); ctx.stroke();
    } else {
      // fluffy, brush and crest tails: a fat, furry taper
      const w = T.type === 'brush' ? T.w : T.type === 'fluffy' ? T.w : T.w;
      A.taper(ctx, root.x, root.y, ctrl.x, ctrl.y, tip.x, tip.y, w * 0.55, w);
      ctx.fill(); ctx.stroke();
      A.oval(ctx, tip.x, tip.y, w * 0.55, w * 0.5, 0, pose.flash ? '#ffffff' : (T.tip || T.color));
      if (T.type === 'brush' && !pose.flash) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.5;
        for (let i = 1; i < 5; i++) {
          const q = i / 5;
          const x = lerp(root.x, tip.x, q), y = lerp(root.y, tip.y, q) - Math.sin(q * Math.PI) * T.len * 0.3;
          ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 3, y + 3); ctx.stroke();
        }
      }
      if (T.type === 'crest' && !pose.flash) {
        // the bilby's crest of stiff black hairs along the top of the tail
        ctx.strokeStyle = T.color;
        ctx.lineWidth = 2;
        for (let i = 2; i < 7; i++) {
          const q = i / 8;
          const x = lerp(root.x, tip.x, q), y = lerp(root.y, tip.y, q) - Math.sin(q * Math.PI) * T.len * 0.25;
          ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 2, y - 9); ctx.stroke();
        }
      }
    }
  }

  function ears(ctx, k, c, hr, pose) {
    const E = k.ears;
    const flap = pose.earFlap || 0;
    const fill = (col) => (pose.flash ? '#ffffff' : col);
    const base = [[-hr * 0.35, -hr * 0.75], [hr * 0.1, -hr * 0.85]];
    base.forEach(([ex, ey], i) => {
      const back = i === 0;
      ctx.save();
      ctx.translate(ex, ey);
      if (E.type === 'long') {
        // bilby: huge ears, swung forward for the ear-flap slap
        ctx.rotate(-0.35 + (back ? -0.15 : 0.05) + flap * 1.7 + Math.sin(pose.t * 1.4 + i) * 0.04);
        A.oval(ctx, 0, -E.size * 0.55, E.size * 0.27, E.size * 0.6, 0, fill(back ? c.dark : c.fur), LINE, 2);
        A.oval(ctx, 0.5, -E.size * 0.52, E.size * 0.14, E.size * 0.45, 0, fill(E.inner));
      } else if (E.type === 'pointy') {
        ctx.rotate(-0.2 + (back ? -0.25 : 0.05));
        ctx.fillStyle = fill(back ? c.dark : c.fur);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-E.size * 0.45, 2); ctx.quadraticCurveTo(-E.size * 0.2, -E.size, 0, -E.size * 1.15);
        ctx.quadraticCurveTo(E.size * 0.3, -E.size * 0.6, E.size * 0.45, 2); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = fill(E.inner);
        ctx.beginPath();
        ctx.moveTo(-E.size * 0.22, 0); ctx.quadraticCurveTo(-E.size * 0.08, -E.size * 0.7, 0, -E.size * 0.85);
        ctx.quadraticCurveTo(E.size * 0.15, -E.size * 0.45, E.size * 0.22, 0); ctx.closePath();
        ctx.fill();
      } else if (E.type === 'fluffy') {
        // koala: big round fluffy ears
        A.oval(ctx, back ? -2 : 0, -E.size * 0.3, E.size, E.size * 0.9, 0, fill(back ? c.dark : c.fur), LINE, 2);
        A.oval(ctx, back ? -1 : 1, -E.size * 0.25, E.size * 0.62, E.size * 0.55, 0, fill(E.inner));
        if (!pose.flash) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(j * 3, -E.size * 0.2); ctx.lineTo(j * 4, -E.size * 0.85); ctx.stroke(); }
        }
      } else if (E.type === 'erect') {
        // the thylacine's short, rounded, upright ears
        ctx.rotate(-0.15 + (back ? -0.3 : 0.05));
        A.oval(ctx, 0, -E.size * 0.62, E.size * 0.55, E.size * 0.85, 0, fill(back ? c.dark : c.fur), LINE, 2);
        A.oval(ctx, 0.6, -E.size * 0.55, E.size * 0.3, E.size * 0.58, 0, fill(E.inner));
      } else if (E.type === 'tiny') {
        // the cuscus's little ears, almost hidden in its fur
        A.oval(ctx, back ? -1 : 0, -E.size * 0.1, E.size * 0.8, E.size * 0.75, 0, fill(back ? c.dark : c.fur), LINE, 1.8);
        A.oval(ctx, back ? -0.5 : 0.5, -E.size * 0.05, E.size * 0.42, E.size * 0.38, 0, fill(E.inner));
      } else {
        A.oval(ctx, 0, -E.size * 0.4, E.size, E.size * 0.95, 0, fill(E.solid || (back ? c.dark : c.fur)), LINE, 2);
        if (!E.solid) A.oval(ctx, 0.5, -E.size * 0.35, E.size * 0.55, E.size * 0.5, 0, fill(E.inner));
        if (E.tipColor) A.oval(ctx, 0, -E.size * 1.0, E.size * 0.6, E.size * 0.35, 0, fill(E.tipColor));
      }
      ctx.restore();
    });
  }

  // The thylacine's enormous gape: the jaws hinge right open (o.basicStyle / o.bigStyle 'wideJaw').
  function wideJaw(ctx, k, S, sx, sy, wj, fill) {
    const J = S.len + S.w * 0.9, hx = sx - S.w * 0.45, hy = sy + 1;
    const up = -wj * 0.32, down = wj * 1.05;
    const pt = (a, x, y) => [hx + Math.cos(a) * x - Math.sin(a) * y, hy + Math.sin(a) * x + Math.cos(a) * y];
    // the inside of the mouth, between the two jaws
    const u = pt(up, J - 3, S.w * 0.3), l = pt(down, J * 0.9, -S.w * 0.05);
    ctx.fillStyle = '#5a1a1a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hx - 2, hy); ctx.lineTo(u[0], u[1]); ctx.quadraticCurveTo(hx + J * 1.0, hy + J * 0.45 * wj, l[0], l[1]); ctx.closePath(); ctx.fill();
    // lower jaw, teeth up and a pink tongue
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(down);
    A.oval(ctx, J * 0.42, S.w * 0.18, J * 0.36, S.w * 0.18, 0, '#e86a8a');
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const tx = 5 + i * ((J - 8) / 5); ctx.moveTo(tx, -1); ctx.lineTo(tx + 1.4, -4.2); ctx.lineTo(tx + 2.8, -1); }
    ctx.moveTo(J - 6, -1); ctx.lineTo(J - 4.6, -6.5); ctx.lineTo(J - 3, -1);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -S.w * 0.05); ctx.lineTo(J * 0.95, -S.w * 0.05); ctx.quadraticCurveTo(J * 1.02, S.w * 0.3, J * 0.85, S.w * 0.45);
    ctx.quadraticCurveTo(J * 0.4, S.w * 0.62, 0, S.w * 0.4); ctx.closePath();
    ctx.fillStyle = fill(S.color); ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    ctx.restore();
    // upper jaw, teeth down, nose on the end
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(up);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = LINE; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const tx = 6 + i * ((J - 9) / 5); ctx.moveTo(tx, S.w * 0.28); ctx.lineTo(tx + 1.4, S.w * 0.28 + 3.6); ctx.lineTo(tx + 2.8, S.w * 0.28); }
    ctx.moveTo(J - 7, S.w * 0.28); ctx.lineTo(J - 5.5, S.w * 0.28 + 6.5); ctx.lineTo(J - 4, S.w * 0.28);
    ctx.fill(); ctx.stroke();
    A.oval(ctx, J * 0.5, -S.w * 0.12, J * 0.5 + 1.5, S.w * 0.46, 0.02, fill(S.color), LINE, 2);
    A.oval(ctx, J - 0.5, -S.w * 0.3, S.noseW, S.noseH, 0, fill(S.nose));
    ctx.restore();
  }

  function head(ctx, k, c, pose) {
    const hr = k.hr, S = k.snout;
    const fill = (col) => (pose.flash ? '#ffffff' : col);
    const headCol = k.head || c.fur;
    ears(ctx, k, c, hr, pose);
    // skull
    A.oval(ctx, 0, 0, hr, hr * 0.92, 0, fill(headCol), LINE, 2.4);
    if (k.marks.includes('stripe') && !pose.flash) {
      ctx.strokeStyle = k.stripe; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(hr * 0.8, -hr * 0.2); ctx.quadraticCurveTo(hr * 0.2, -hr * 1.0, -hr * 0.8, -hr * 0.5); ctx.stroke();
    }
    // jaw opens for bites, screeches and grins
    const wj = pose.wideJaw || 0;
    const open = wj > 0 ? 0 : pose.mouth || 0;
    const sx = hr * 0.62, sy = hr * 0.18;
    if (k.marks.includes('peachFace') && !pose.flash) {
      // the cuscus's bare, peachy face around the nose and eyes
      A.oval(ctx, hr * 0.42, -hr * 0.02, hr * 0.62, hr * 0.5, 0.1, '#f9e2c6');
    }
    if (wj > 0) wideJaw(ctx, k, S, sx, sy, wj, fill);
    else if (open > 0) {
      A.oval(ctx, sx + S.len * 0.45, sy + 5 + open * 6, S.len * 0.55 + 3, S.w * 0.45 + open * 4, 0.15, fill(S.color), LINE, 2);
      A.oval(ctx, sx + S.len * 0.5, sy + 1 + open * 3, S.len * 0.5 + 2, Math.max(1, open * 6), 0.05, '#5a1a1a');
      // teeth (a whole row of them for Dead Fred's 50-tooth grin)
      ctx.fillStyle = '#ffffff';
      const n = pose.grin ? 9 : 4;
      for (let i = 0; i < n; i++) {
        const tx = sx + 2 + i * ((S.len + 6) / n);
        ctx.beginPath(); ctx.moveTo(tx, sy - 2 + open); ctx.lineTo(tx + 1.6, sy + 2 + open * 2); ctx.lineTo(tx + 3.2, sy - 2 + open); ctx.fill();
      }
    }
    // snout and nose
    if (!wj) {
      A.oval(ctx, sx + S.len * 0.5, sy - open * 2, S.len * 0.5 + S.w * 0.35, S.w * 0.55, 0.05, fill(S.color), LINE, 2);
      A.oval(ctx, sx + S.len + S.w * 0.2, sy - S.w * 0.15 - open * 2, S.noseW, S.noseH, 0, fill(S.nose));
    }
    if (k.marks.includes('darkMuzzle') && !pose.flash) A.oval(ctx, sx + S.len * 0.4, sy - 2 - open * 2, S.len * 0.35, S.w * 0.3, 0, 'rgba(40,40,45,0.45)');
    if (!open && !wj) {
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx + S.len * 0.9, sy + S.w * 0.35); ctx.quadraticCurveTo(sx + S.len * 0.5, sy + S.w * 0.55, sx + 2, sy + S.w * 0.3); ctx.stroke();
    }
    // face markings
    const ex = hr * 0.32, ey = -hr * 0.22;
    if (!pose.flash) {
      if (k.marks.includes('paleEyes')) A.oval(ctx, ex + 0.5, ey + 0.5, k.eye.r + 3.2, k.eye.r + 2.6, 0.2, '#f6ead0');
      if (k.marks.includes('mask')) { A.oval(ctx, ex, ey, hr * 0.42, hr * 0.2, -0.1, '#262626'); A.oval(ctx, ex - 2, ey - hr * 0.32, hr * 0.32, hr * 0.1, -0.1, '#f2f2f2'); }
      if (k.marks.includes('eyeStripe')) {
        ctx.strokeStyle = '#2b1a14'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx + S.len * 0.6, sy - 3); ctx.lineTo(ex, ey); ctx.lineTo(-hr * 0.6, ey - 3); ctx.stroke();
        ctx.strokeStyle = k.light; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(sx + S.len * 0.5, sy - 7); ctx.lineTo(ex, ey - 5); ctx.stroke();
      }
      if (k.marks.includes('eyeRing')) A.oval(ctx, ex, ey, k.eye.r + 2.5, k.eye.r + 2.5, 0, '#2b2b33');
      if (k.marks.includes('chin')) A.oval(ctx, sx - 2, sy + hr * 0.45, hr * 0.38, hr * 0.2, 0, '#f6f5f2');
    }
    // eyes
    const E = k.eye;
    if (pose.ko || pose.dead) {
      ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(ex - 3.5, ey - 3.5); ctx.lineTo(ex + 3.5, ey + 3.5); ctx.moveTo(ex + 3.5, ey - 3.5); ctx.lineTo(ex - 3.5, ey + 3.5); ctx.stroke();
    } else if (pose.hurt) {
      ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(ex - 3, ey - 3.5); ctx.lineTo(ex + 3, ey); ctx.lineTo(ex - 3, ey + 3.5); ctx.stroke();
    } else if (pose.nap) {
      ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
      const r = E.r;
      if (E.style === 'big') {
        A.oval(ctx, ex, ey, r, r * 1.05, 0, '#141418');
        A.oval(ctx, ex + r * 0.3, ey - r * 0.35, r * 0.32, r * 0.32, 0, '#ffffff');
      } else if (E.style === 'round') {
        // big round coloured eyes (the cuscus's are orange-red), with a sleepy lid
        A.oval(ctx, ex, ey, r + 0.8, r + 0.8, 0, E.iris, LINE, 1.5);
        A.oval(ctx, ex + 0.8, ey + 0.5, r * 0.5, r * 0.56, 0, '#141418');
        A.oval(ctx, ex + 2, ey - r * 0.3, r * 0.26, r * 0.26, 0, '#ffffff');
        A.oval(ctx, ex - r * 0.35, ey + r * 0.45, r * 0.12, r * 0.12, 0, '#ffffff');
        ctx.fillStyle = fill(k.marks.includes('peachFace') ? '#f9e2c6' : k.head || c.fur);
        ctx.beginPath(); ctx.ellipse(ex, ey, r + 1.8, r + 1.8, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(ex, ey, r + 0.8, r + 0.8, 0, Math.PI * 1.13, Math.PI * 1.87); ctx.stroke();
      } else if (E.style === 'shiny' || E.style === 'beady') {
        if (E.style === 'shiny') A.oval(ctx, ex, ey, r + 1.2, r + 1.4, 0, '#f4f1ea');
        A.oval(ctx, ex + 0.5, ey, r, r * 1.05, 0, '#141418');
        A.oval(ctx, ex + 1.3, ey - 1.2, 0.9, 0.9, 0, '#ffffff');
      } else {
        A.oval(ctx, ex, ey, r + 1.2, r + 1.5, 0, '#ffffff', LINE, 1.2);
        A.oval(ctx, ex + 1, ey + 0.3, r * 0.7, r * 0.8, 0, '#141418');
        A.oval(ctx, ex + 1.6, ey - 0.8, 0.8, 0.8, 0, '#ffffff');
        if (E.style === 'sleepy') {
          A.oval(ctx, ex, ey - r * 0.7, r + 1.6, r * 0.9, 0, pose.flash ? '#ffffff' : headCol);
          ctx.strokeStyle = LINE; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(ex - r - 1, ey - 0.6); ctx.lineTo(ex + r + 1, ey - 0.6); ctx.stroke();
        }
      }
      // a determined brow (a softer, raised one over big round eyes)
      ctx.strokeStyle = LINE; ctx.lineWidth = 2.2;
      if (E.style === 'round') { ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(ex, ey + 1, r + 4.5, Math.PI * 1.3, Math.PI * 1.62); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(ex - r - 2, ey - r - 4); ctx.lineTo(ex + r + 1, ey - r - 2); ctx.stroke(); }
    }
    if (pose.tongue && !pose.flash) {
      // the numbat's long sticky tongue (the special draws the rest of it)
      ctx.strokeStyle = '#e86a8a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx + S.len, sy + 2); ctx.lineTo(sx + S.len + 8, sy + 4); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- the critter
  // o: { x, y, facing, scale, look, t, pose ('idle'|'walk'|'jump'|'block'|'hurt'|'ko'|'win'),
  //      walk, basic (0..1), basicStyle, big (0..1), bigStyle, crouch, mouth, flash, gun, muzzle, spin,
  //      holding, glide, dive, dead, nap, tongue, scarf }
  A.critter = function (ctx, o) {
    const k = typeof o.look === 'string' ? LOOKS[o.look] : o.look;
    const c = { fur: k.fur, dark: k.dark, belly: k.belly };
    const s = o.scale || 1;
    const t = o.t || 0;
    let pose = o.pose || 'idle';
    if (o.dead) pose = 'ko';
    const flash = !!o.flash;
    const fill = (col) => (flash ? '#ffffff' : col);
    const basic = o.basic || 0, big = o.big || 0, bs = o.basicStyle, gs = o.bigStyle;
    // the secret characters' moves: a huge gape, a big open-paw slap and a two-handed overhead slap
    const amt = (st) => Math.min(1, (bs === st ? basic : 0) + (gs === st ? big : 0));
    const wj = amt('wideJaw'), slap = amt('slap'), mega = amt('megaSlap');
    const crouch = o.crouch || 0;
    let facing = o.facing || 1;
    let shove = 0;
    // the wombat turns round and shoves with its tough rump
    if (gs === 'bumBlock' && big > 0.25) { facing = -facing; shove = big * 14; }
    const air = pose === 'jump' ? 1 : 0;
    let bob = 0, swing = 0;
    if (pose === 'walk') { const ph = (o.walk || 0) * Math.PI * 2; swing = Math.sin(ph); bob = Math.abs(Math.cos(ph)) * 3; }
    if (pose === 'win') bob = Math.abs(Math.sin(t * 6)) * 10;
    let lean = pose === 'hurt' ? -0.3 : pose === 'block' ? 0.05 : air ? 0.2 : 0.08;
    if (bs === 'bite' || bs === 'headbutt') lean += basic * (bs === 'headbutt' ? 0.55 : 0.3);
    if (gs === 'crunch' || gs === 'grinChomp') lean += big * 0.35;
    if (gs === 'bumBlock') lean += big * 0.5;
    if (gs === 'treeHug') lean += big * 0.25;
    lean += wj * 0.4 + slap * 0.12;
    if (mega) lean += mega < 0.45 ? -0.22 * (mega / 0.45) : lerp(-0.22, 0.42, (mega - 0.45) / 0.55);
    if (o.dive) lean = 0.9;
    if (o.glide) lean = 1.15; // stretched out flat, like a little kite
    lean += crouch * 0.35;
    const L = k.L * (1 - crouch * 0.4);
    const pa = { t, air, flash, tailSwing: 0, tailHigh: 0, ko: pose === 'ko', ground: L };
    if (gs === 'tailFlick') { pa.tailSwing = big; }
    if (gs === 'tailSlap' || gs === 'tailWhip') { pa.tailSwing = big; pa.tailHigh = 1; }

    ctx.save();
    ctx.translate(o.x + (o.facing || 1) * shove, o.y - bob * s);
    if (pose === 'ko') { ctx.translate(-14 * facing * s, -10 * s); ctx.rotate(-1.45 * facing); }
    ctx.scale(facing * s, s);
    if (gs === 'spinKick' && big > 0) { ctx.translate(0, -L - k.ry); ctx.rotate(big * Math.PI * 2); ctx.translate(0, L + k.ry); }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // gliding membrane (sugar glider): a sheet of skin from wrist to ankle
    const spread = o.glide ? 1 : 0;

    // ---- legs (back one darker)
    const leg = (dx, col, phase) => {
      const kickOut = (bs === 'kick' ? basic : 0) * (phase > 0 ? 1 : 0);
      const fx = dx + swing * 9 * phase + kickOut * 22 - (air ? 6 : 0) + (o.dive ? -10 : 0);
      const fy = air || o.dive ? -6 : -Math.max(0, -swing * phase) * 6 - kickOut * (L + 6);
      ctx.fillStyle = fill(col);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      A.taper(ctx, dx * 0.6, -L - 4, (dx * 0.6 + fx) / 2, (-L + fy) / 2, fx, fy - 3, k.legW, k.legW * 0.8);
      ctx.fill(); ctx.stroke();
      A.oval(ctx, fx + k.footLen * 0.3, fy - 3, k.footLen * 0.55, 4.5, kickOut * -0.4, fill(c.dark), LINE, 1.8);
      if (k.webbed && !flash) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(fx + 2 + i * 4, fy - 5); ctx.lineTo(fx + 4 + i * 4, fy - 1); ctx.stroke(); }
      }
    };

    // body frame (rotates about the hip)
    const hipY = -L;
    const bodyC = { x: 2, y: -k.ry * 0.95 };
    const shoulder = (back) => ({ x: k.rx * 0.35 - (back ? 5 : 0), y: -k.ry * 1.55 });
    const pawRest = (back) => {
      let p = { x: k.rx * 0.7 - (back ? 6 : 0), y: -k.ry * 0.95 + (back ? 3 : 0) };
      if (pose === 'block') p = { x: k.rx * 0.85 - (back ? 6 : 0), y: -k.ry * 1.75 + (back ? 4 : 0) };
      else if (pose === 'win') p = { x: k.rx * 0.4, y: -k.ry * 2.6 - (back ? 0 : 4) };
      else if (pose === 'hurt' || pose === 'ko') p = { x: k.rx * 0.2, y: -k.ry * 0.7 };
      else if (o.holding && !back) p = { x: k.rx * 0.6, y: -k.ry * 2.1 };
      else if (o.gun) p = { x: k.rx * 0.9, y: -k.ry * 1.0 };
      if (spread) p = { x: k.rx * 1.2 + (back ? -4 : 6), y: -k.ry * 2.3 + (back ? 4 : 0) };
      if (o.dive) p = { x: -k.rx * 0.4, y: -k.ry * 1.6 };
      // basic attacks: a punch straight out, or a swipe in an arc
      if (!back && (bs === 'punch' || bs === 'swipe') && basic > 0) {
        if (bs === 'punch') p = { x: lerp(p.x, k.rx + k.armLen, basic), y: lerp(p.y, -k.ry * 1.3, basic) };
        else {
          const a = lerp(-2.2, 0.6, basic);
          p = { x: shoulder(false).x + Math.cos(a) * (k.armLen + 6), y: shoulder(false).y + Math.sin(a) * (k.armLen + 6) };
        }
      }
      if (gs === 'treeHug' && big > 0) p = { x: lerp(p.x, k.rx * 1.25, big), y: lerp(p.y, -k.ry * (1.2 - big * 0.3), big) };
      const sa = slapAngle(back);
      if (sa) {
        // wind the paw up overhead, then sweep it round and down in a big arc
        const sh = shoulder(back), R = k.armLen + 9;
        const at = (a) => ({ x: sh.x + Math.cos(a) * R, y: sh.y + Math.sin(a) * R });
        p = sa.windup < 1 ? { x: lerp(p.x, at(sa.a).x, sa.windup), y: lerp(p.y, at(sa.a).y, sa.windup) } : at(sa.a);
      }
      return p;
    };
    // slaps: { a: the arm's angle from the shoulder, windup: 0..1 while the paw goes up, sweep: 0..1 }
    function slapAngle(back) {
      const v = mega || (!back ? slap : 0);
      if (!v) return null;
      const top = mega ? (back ? -1.95 : -1.75) : -2.1, end = mega ? (back ? 0.32 : 0.45) : 0.32;
      const split = mega ? 0.45 : 0.35;
      if (v < split) return { a: top, windup: v / split, sweep: 0 };
      const q = (v - split) / (1 - split);
      return { a: lerp(top, end, q), windup: 1, sweep: q };
    }
    // an open paw with three long claws, plus whoosh lines while it sweeps
    function openPaw(back, p) {
      const sa = slapAngle(back), sh = shoulder(back), R = k.armLen + 9;
      if (sa.sweep > 0.35 && !flash) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(sh.x, sh.y, R + 5 + i * 5, sa.a - 1.05 + i * 0.12, sa.a - 0.15); ctx.stroke(); }
      }
      const d = Math.atan2(p.y - sh.y, p.x - sh.x);
      ctx.strokeStyle = LINE;
      for (const f of [-0.55, 0, 0.55]) {
        const fx = p.x + Math.cos(d + f) * k.armW * 0.75, fy = p.y + Math.sin(d + f) * k.armW * 0.75;
        A.oval(ctx, fx, fy, k.armW * 0.32, k.armW * 0.24, d + f, fill(c.dark), LINE, 1.4);
        if (!flash) {
          ctx.strokeStyle = '#f4e7c5'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(fx + Math.cos(d + f) * 2, fy + Math.sin(d + f) * 2);
          ctx.quadraticCurveTo(fx + Math.cos(d + f) * 7, fy + Math.sin(d + f) * 7, fx + Math.cos(d + f + 0.7) * 7, fy + Math.sin(d + f + 0.7) * 7); ctx.stroke();
        }
      }
      A.oval(ctx, p.x + 1, p.y, k.armW * 0.62, k.armW * 0.56, d, fill(c.dark), LINE, 1.6);
      if (!flash) A.oval(ctx, p.x + 1 + Math.cos(d) * 1.5, p.y + Math.sin(d) * 1.5, k.armW * 0.3, k.armW * 0.26, d, '#e9b8a4');
      if (sa.sweep > 0.92) {
        // SLAP! a little burst where the paw lands
        ctx.strokeStyle = flash ? '#ffffff' : '#ffd23f'; ctx.lineWidth = 2.5;
        const bx = p.x + Math.cos(d) * 14, by = p.y + Math.sin(d) * 14;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = d - 1.2 + i * 0.48; ctx.moveTo(bx + Math.cos(a) * 4, by + Math.sin(a) * 4); ctx.lineTo(bx + Math.cos(a) * 11, by + Math.sin(a) * 11); }
        ctx.stroke();
      }
    }
    const arm = (back) => {
      const sh = shoulder(back), p = pawRest(back);
      ctx.fillStyle = fill(back ? c.dark : c.fur);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      A.taper(ctx, sh.x, sh.y, (sh.x + p.x) / 2 + 2, (sh.y + p.y) / 2 + 4, p.x, p.y, k.armW, k.armW * 0.75);
      ctx.fill(); ctx.stroke();
      if (slapAngle(back)) openPaw(back, p);
      else A.oval(ctx, p.x + 1.5, p.y, k.armW * 0.55, k.armW * 0.5, 0, fill(c.dark), LINE, 1.6);
    };

    // tail (behind everything)
    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(lean * 0.5);
    tail(ctx, k, k.tail, { x: -k.rx * 0.8, y: -k.ry * 0.35 }, pa);
    ctx.restore();

    leg(-k.rx * 0.35, c.dark, -1);

    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(lean);
    if (spread && !flash) {
      // membrane between the arms and legs
      ctx.fillStyle = 'rgba(111,116,124,0.85)';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(k.rx * 1.3, -k.ry * 2.3);
      ctx.quadraticCurveTo(k.rx * 2.0, -k.ry * 0.9, k.rx * 0.2, k.ry * 0.9);
      ctx.lineTo(-k.rx * 0.5, k.ry * 0.7);
      ctx.quadraticCurveTo(-k.rx * 1.6, -k.ry * 0.6, -k.rx * 0.2, -k.ry * 2.0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    arm(true);
    // body, belly and markings
    A.oval(ctx, bodyC.x, bodyC.y, k.rx, k.ry, 0.08, fill(c.fur), LINE, 2.4);
    A.oval(ctx, bodyC.x + k.rx * 0.35, bodyC.y + 2, k.rx * 0.5, k.ry * 0.72, 0.1, fill(c.belly));
    if (!flash) {
      if (k.marks.includes('blaze')) {
        ctx.fillStyle = k.light;
        ctx.beginPath();
        ctx.ellipse(bodyC.x + k.rx * 0.4, bodyC.y - k.ry * 0.45, k.rx * 0.5, k.ry * 0.18, 0.35, 0, Math.PI);
        ctx.fill();
      }
      if (k.marks.includes('bands')) {
        ctx.fillStyle = k.light;
        for (let i = 0; i < 5; i++) {
          const bx = bodyC.x - k.rx * 0.85 + i * k.rx * 0.22;
          ctx.save();
          ctx.beginPath(); ctx.ellipse(bodyC.x, bodyC.y, k.rx - 1, k.ry - 1, 0.08, 0, Math.PI * 2); ctx.clip();
          ctx.fillRect(bx, bodyC.y - k.ry, 4, k.ry * 0.9);
          ctx.restore();
        }
      }
      if (k.marks.includes('marbled')) {
        ctx.fillStyle = k.dark;
        ctx.save();
        ctx.beginPath(); ctx.ellipse(bodyC.x, bodyC.y, k.rx - 1, k.ry - 1, 0.08, 0, Math.PI * 2); ctx.clip();
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(bodyC.x - k.rx * 0.7 + i * k.rx * 0.45, bodyC.y - k.ry * 0.55, k.rx * 0.16, k.ry * 0.6, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (k.marks.includes('stripe')) {
        ctx.strokeStyle = k.stripe; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(k.rx * 0.2, -k.ry * 1.85); ctx.quadraticCurveTo(-k.rx * 0.5, -k.ry * 1.6, -k.rx * 0.8, -k.ry * 0.6); ctx.stroke();
      }
      if (k.marks.includes('tigerStripes')) {
        // dark stripes across the back and rump (longest over the rump)
        ctx.save();
        ctx.beginPath(); ctx.ellipse(bodyC.x, bodyC.y, k.rx - 1, k.ry - 1, 0.08, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = k.stripe;
        for (let i = 0; i < 9; i++) {
          const q = i / 8, yy = bodyC.y - k.ry * 0.62 + q * k.ry * 1.42, len = k.rx * (0.42 + q * 0.5), x0 = bodyC.x - k.rx - 2;
          ctx.beginPath(); ctx.moveTo(x0, yy - 3); ctx.quadraticCurveTo(x0 + len * 0.6, yy - 3, x0 + len, yy + 1.4);
          ctx.quadraticCurveTo(x0 + len * 0.5, yy + 2, x0, yy + 3); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      if (k.marks.includes('blotches')) {
        // the spotted cuscus's grey-brown blotches
        ctx.save();
        ctx.beginPath(); ctx.ellipse(bodyC.x, bodyC.y, k.rx - 1, k.ry - 1, 0.08, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = k.spot;
        for (const [bx, by, brx, bry, br] of [[-0.6, -0.55, 0.3, 0.2, 0.5], [-0.15, -0.8, 0.22, 0.14, -0.3], [-0.85, 0.05, 0.22, 0.3, 0.2],
          [-0.42, -0.08, 0.17, 0.13, 0.7], [-0.55, 0.55, 0.26, 0.18, -0.25], [0.25, -0.78, 0.14, 0.1, 0.3], [-0.1, 0.62, 0.12, 0.09, 0]]) {
          ctx.beginPath();
          ctx.ellipse(bodyC.x + bx * k.rx, bodyC.y + by * k.ry, brx * k.rx, bry * k.ry, br, 0, Math.PI * 2);
          ctx.ellipse(bodyC.x + (bx + brx * 0.6) * k.rx, bodyC.y + (by + bry * 0.5) * k.ry, brx * 0.6 * k.rx, bry * 0.7 * k.ry, br + 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (k.marks.includes('rumpPlate') && (gs === 'bumBlock' && big > 0.25)) {
        A.oval(ctx, bodyC.x - k.rx * 0.75, bodyC.y + 2, k.rx * 0.3, k.ry * 0.7, 0, '#b39577', LINE, 2);
      }
    }
    if (o.scarf) {
      // player 2-4's scarf, when several players picked the same character
      ctx.fillStyle = o.scarf;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(k.rx * 0.3, -k.ry * 1.72, k.rx * 0.55, 5, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-k.rx * 0.1, -k.ry * 1.7); ctx.lineTo(-k.rx * 0.45 - Math.sin(t * 8) * 3, -k.ry * 1.45); ctx.lineTo(-k.rx * 0.2, -k.ry * 1.5); ctx.fill();
    }
    ctx.restore();

    leg(k.rx * 0.25, c.fur, 1);

    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(lean);
    // head (kept level whatever the body does)
    ctx.save();
    const lunge = (bs === 'bite' || bs === 'headbutt' ? basic : 0) * 8 + ((gs === 'crunch' || gs === 'grinChomp') ? big * 10 : 0) + wj * 10;
    ctx.translate(k.rx * 0.42 + k.hr * 0.3 + lunge, -k.ry * 1.72 - k.hr * 0.72);
    ctx.rotate(-lean * 0.8 + (pose === 'hurt' ? -0.2 : 0) + (o.screech ? -0.35 : 0));
    let mouth = bs === 'bite' ? basic : (gs === 'crunch' || gs === 'grinChomp') ? big : o.screech ? 1 : o.mouth === 'open' ? 0.4 : o.mouth === 'ouch' ? 0.5 : 0;
    if (!mouth && (slap > 0.6 || mega > 0.6)) mouth = 0.45;
    head(ctx, k, c, {
      wideJaw: wj,
      t, flash, mouth, grin: gs === 'grinChomp' && big > 0.2, ko: pose === 'ko', dead: !!o.dead, hurt: pose === 'hurt',
      nap: !!o.nap, tongue: !!o.tongue, earFlap: gs === 'earSlap' ? big : 0,
    });
    ctx.restore();
    if (o.gun) {
      const p = pawRest(false);
      ctx.save();
      ctx.translate(p.x - 4, p.y - 2);
      ctx.rotate(-lean);
      A.heldWeapon(ctx, o.gun, { muzzle: o.muzzle, spin: o.spin });
      ctx.restore();
    }
    arm(false);
    if (o.holding) {
      const p = pawRest(false);
      if (o.holding === 'grenade') A.grenade(ctx, p.x + 3, p.y - 9, { r: 6.5, spark: true, t });
      else if (o.holding === 'cube') A.oval(ctx, p.x + 3, p.y - 7, 6, 6, 0.3, '#6b4a2e');
    }
    ctx.restore();

    if (pose === 'ko' && !o.dead) {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + (i * Math.PI * 2) / 3;
        A.star(ctx, k.rx * 0.6 + Math.cos(a) * 16, -L - k.ry * 2.2 - k.hr + Math.sin(a) * 5, 4.5, '#ffd23f');
      }
    }
    ctx.restore();
  };

  // A dirt mound that moves along while a character is burrowing underground.
  A.burrowMound = function (ctx, x, y, t) {
    ctx.fillStyle = '#9c4a2a';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 26, 12, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c4552f';
    for (let i = 0; i < 3; i++) {
      const a = t * 9 + i * 2;
      ctx.beginPath(); ctx.arc(x - 14 + i * 14, y - 12 - Math.abs(Math.sin(a)) * 10, 3, 0, Math.PI * 2); ctx.fill();
    }
  };

  // A round head-and-shoulders portrait of any character (HUD panels).
  A.portrait = function (ctx, def, cx, cy, r, t, colors, hurt) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f6dcae'; ctx.fill();
    ctx.clip();
    const pose = hurt ? 'hurt' : 'idle';
    if (def.art === 'kangaroo') {
      A.character(ctx, def, { x: cx - 6, y: cy + 54, facing: 1, scale: 0.46, t, pose, colors });
    } else {
      const k = LOOKS[def.look], s = 0.62;
      const hx = (k.rx * 0.42 + k.hr * 0.3) * s, hy = (k.L + k.ry * 1.72 + k.hr * 0.72) * s;
      A.character(ctx, def, { x: cx - hx, y: cy + hy + 4, facing: 1, scale: s, t, pose, colors });
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- joeys
  // Where on its parent a joey rides, in the parent's own coordinates (feet at 0, 0, facing right).
  function joeySpot(def) {
    if (def.art === 'kangaroo') return { back: [-14, -104], pouch: [16, -52], backPouch: [-20, -52], mini: 0.3, h: 150 };
    const k = LOOKS[def.look];
    return {
      back: [-k.rx * 0.25, -(k.L + k.ry * 1.75)], pouch: [k.rx * 0.45, -(k.L + k.ry * 0.55)], backPouch: [-k.rx * 0.62, -(k.L + k.ry * 0.45)],
      mini: 0.36, h: k.L + k.ry * 2 + k.hr * 2,
    };
  }

  // A parent's joey: peeking out of the pouch, out of a backwards pouch, or riding on the back.
  //  s = the parent's render state; j = [x, y, out?, level, facing, carrying]
  A.joey = function (ctx, def, s, j) {
    if (!j) return;
    const spot = joeySpot(def);
    const grow = 1 + 0.05 * ((j[3] || 1) - 1);
    const ps = def.scale * spot.mini * grow;
    if (j[2]) {
      // out and about: a mini version of its parent, hopping
      A.shadow(ctx, j[0], j[1], 12);
      A.character(ctx, def, { x: j[0], y: j[1], facing: j[4] || 1, scale: ps, t: s.t * 1.3, pose: 'jump', colors: null });
      return;
    }
    if (s.pose === 'ko' || s.hide) return;
    const how = def.joey || 'back';
    const f = s.f || 1;
    const [lx, ly] = spot[how];
    const px = s.x + f * lx * def.scale, py = s.y + ly * def.scale - (s.pose === 'walk' ? Math.abs(Math.sin((s.walk || 0) * Math.PI)) * 10 * def.scale : 0);
    if (how === 'back') {
      // riding on the back, hanging on
      A.character(ctx, def, { x: px, y: py + 4, facing: f, scale: ps * 0.9, t: s.t, pose: 'idle', colors: null });
      return;
    }
    // peeking out of the pouch: only the head and shoulders show above the pouch's edge
    const mh = spot.h * ps;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px - 60, py - mh - 40, 120, mh + 42);
    ctx.clip();
    A.character(ctx, def, { x: px, y: py + mh * 0.5, facing: how === 'backPouch' ? -f : f, scale: ps, t: s.t, pose: 'idle', colors: null });
    ctx.restore();
    ctx.strokeStyle = '#2b1a14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(px, py + 1, 9 * def.scale, 3, 0, 0, Math.PI); ctx.stroke();
  };

  // Draws any playable character (portraits, select screen, lobby cards).
  A.character = function (ctx, def, o) {
    const coat = o.colors || null;
    if (def.art === 'kangaroo') {
      A.kangaroo(ctx, Object.assign({}, o, { colors: Object.assign({}, def.colors || {}, coat && !coat.tint ? coat : {}), scale: o.scale, scarf: coat && coat.tint }));
    } else {
      A.critter(ctx, Object.assign({}, o, { look: def.look, scarf: coat && coat.tint }));
    }
  };
})();
