// Kangaroos (Boomer first), drawn in code. Facing right, feet at (0, 0), about 150 px tall at scale 1.
// Also the shared art helpers (MG.Art.taper, oval, shadow) the other art files use.
(function () {
  const A = (MG.Art = MG.Art || {});
  const lerp = (a, b, k) => a + (b - a) * k;

  // A limb or tail along a curve: w0 thick at the start, w1 at the end.
  A.taper = function (ctx, x0, y0, cx, cy, x1, y1, w0, w1) {
    const N = 10, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const k = i / N, m = 1 - k;
      const x = m * m * x0 + 2 * m * k * cx + k * k * x1;
      const y = m * m * y0 + 2 * m * k * cy + k * k * y1;
      const dx = 2 * m * (cx - x0) + 2 * k * (x1 - cx);
      const dy = 2 * m * (cy - y0) + 2 * k * (y1 - cy);
      const len = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1, k) / 2;
      L.push([x - (dy / len) * w, y + (dx / len) * w]);
      R.push([x + (dy / len) * w, y - (dx / len) * w]);
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = N; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
  };

  A.oval = function (ctx, x, y, rx, ry, rot, fill, stroke, lw) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  };

  A.shadow = function (ctx, x, y, r) {
    ctx.fillStyle = 'rgba(60,20,10,0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, Math.max(4, r), Math.max(2, r * 0.22), 0, 0, Math.PI * 2);
    ctx.fill();
  };

  A.star = function (ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  };

  // ---------------------------------------------------------------- weapons in paws
  A.gatling = function (ctx, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    const spin = o.spin || 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2b193d';
    // wooden stock and gumnut hopper
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.roundRect(-14, -5, 18, 11, 4); ctx.fill(); ctx.stroke();
    A.oval(ctx, -2, -11, 8, 7, 0, '#6b4226', '#2b193d', 2);
    A.oval(ctx, -4, -14, 2.5, 2, 0, '#c58b4a');
    A.oval(ctx, 1, -13, 2.5, 2, 0, '#c58b4a');
    // three spinning barrels
    ctx.fillStyle = '#8d99ae';
    ctx.beginPath(); ctx.roundRect(2, -6, 34, 12, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a4e69';
    for (let i = 0; i < 3; i++) {
      const yy = -3 + ((i + spin * 3) % 3) * 3;
      ctx.beginPath(); ctx.moveTo(4, yy); ctx.lineTo(35, yy); ctx.stroke();
    }
    ctx.fillStyle = '#4a4e69';
    ctx.fillRect(16, -7, 4, 14);
    if (o.muzzle) A.star(ctx, 42, 0, 9, '#ffd23f');
    ctx.restore();
  };

  A.grenade = function (ctx, x, y, o = {}) {
    const r = o.r || 9;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.lineWidth = 2;
    A.oval(ctx, 0, 0, r, r * 1.15, 0, o.blink ? '#e63946' : '#5f7d38', '#1e2a12', 2);
    ctx.strokeStyle = 'rgba(30,42,18,0.6)';
    ctx.beginPath();
    ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
    ctx.moveTo(0, -r * 1.1); ctx.lineTo(0, r * 1.1);
    ctx.stroke();
    // top: cap and lever, and the pin ring until it's pulled
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(-r * 0.45, -r * 1.45, r * 0.9, r * 0.45);
    ctx.strokeStyle = '#555';
    ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 1.3); ctx.lineTo(r * 0.9, -r * 0.4); ctx.stroke();
    if (o.pin) {
      ctx.strokeStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(-r * 0.75, -r * 1.35, r * 0.38, 0, Math.PI * 2); ctx.stroke();
    } else if (o.spark) {
      A.star(ctx, 0, -r * 1.7, r * 0.5, Math.floor((o.t || 0) * 20) % 2 ? '#ffd23f' : '#ff7b00');
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- kangaroo
  const ROO = { fur: '#c4552f', dark: '#8f3a20', belly: '#f3d6b5', muzzle: '#e8b58f', ear: '#f2a7a0', nose: '#2b193d', line: '#3b1a10' };
  const FLASH = { fur: '#ffffff', dark: '#eeeeee', belly: '#ffffff', muzzle: '#ffffff', ear: '#ffffff', nose: '#999999', line: '#aaaaaa' };
  A.ROO_COLORS = ROO;

  // o: { x, y, facing, scale, pose ('idle'|'walk'|'jump'|'block'|'hurt'|'ko'|'win'), t, walk,
  //      jab (0..1 arm out), jabArm (0 front | 1 back), kick (0..1 tail kick), crouch (0..1),
  //      mouth ('open'|'ouch'), flash, gun, muzzle, spin, holding ('grenade'), colors }
  A.kangaroo = function (ctx, o) {
    const c = o.flash ? FLASH : Object.assign({}, ROO, o.colors || {});
    const s = o.scale || 1;
    const pose = o.pose || 'idle';
    const t = o.t || 0;
    const kick = o.kick || 0;
    const crouch = o.crouch || 0;
    let air = pose === 'jump' ? 1 : 0;
    let bob = 0;
    if (pose === 'walk') {
      const ph = (o.walk || 0) % 1;
      air = Math.sin(ph * Math.PI);
      bob = air * 16;
    }
    if (pose === 'win') bob = Math.abs(Math.sin(t * 6)) * 14;
    let lean = pose === 'block' ? 0.05 : pose === 'hurt' ? -0.35 : pose === 'jump' || pose === 'walk' ? 0.5 : 0.2;
    if (pose === 'win') lean = -0.05;
    lean = lean * (1 - kick) - 0.62 * kick + crouch * 0.45;
    const breathe = pose === 'idle' ? Math.sin(t * 3) * 1.2 : 0;
    const f = o.facing || 1;

    ctx.save();
    ctx.translate(o.x, o.y - bob * s);
    if (pose === 'ko') { ctx.translate(-20 * f * s, -16 * s); ctx.rotate(-1.45 * f); }
    ctx.scale(f * s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const hipX = -6, hipY = -38 + crouch * 12;

    // ---- tail: resting on the ground, lifted while hopping, or straight down as a prop in a tail kick
    const tipX = lerp(lerp(-82, -86, air), -34, kick), tipY = lerp(lerp(-3, -36, air), 0, kick);
    ctx.fillStyle = c.fur;
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 2.5;
    A.taper(ctx, hipX - 6, hipY + 4, lerp(-44, -50, air) * (1 - kick) + kick * -30, lerp(-12, -26, air) * (1 - kick) + kick * -20, tipX, tipY, 22, 5);
    ctx.fill(); ctx.stroke();

    // ---- legs (back one darker and a little behind)
    const leg = (dx, color) => {
      // heel and toe for standing, mid-hop (feet trailing) and tail kick (feet thrust forward)
      const heelX = lerp(lerp(hipX - 6, hipX - 22, air), hipX + 26, kick) + dx;
      const heelY = lerp(lerp(-6, hipY + 14, air), hipY - 8, kick);
      const ang = lerp(lerp(0.02, 0.62, air), -0.12, kick);
      const len = 46;
      const toeX = heelX + Math.cos(ang) * len, toeY = heelY + Math.sin(ang) * len * (1 - kick * 0.2);
      ctx.fillStyle = color;
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 2.5;
      // shin from the thigh down to the heel, then the long foot
      A.taper(ctx, hipX + 6 + dx, hipY + 8, lerp(hipX + 4, hipX + 20, kick) + dx, lerp(hipY + 22, hipY, kick), heelX, heelY, 15, 11);
      ctx.fill(); ctx.stroke();
      A.taper(ctx, heelX, heelY, (heelX + toeX) / 2, (heelY + toeY) / 2 - 2, toeX, toeY, 12, 8);
      ctx.fill(); ctx.stroke();
      // big thigh
      A.oval(ctx, hipX + 6 + dx + kick * 10, hipY + 6 - kick * 8, 22, 16, lerp(-0.35, -0.95, kick), color, c.line, 2.5);
    };
    leg(-5, c.dark);

    // ---- body frame (rotates about the hip)
    const shoulder = (dx) => ({ x: 14 + dx, y: -58 });
    const paw = (back) => {
      const d = back ? -7 : 0;
      let p = { x: 26 + d, y: -38 + (back ? 3 : 0) };
      if (pose === 'block') p = { x: 30 + d, y: -64 + (back ? 6 : 0) };
      else if (pose === 'win') p = { x: 18 + d, y: -90 + (back ? 4 : 0) };
      else if (pose === 'hurt' || pose === 'ko') p = { x: 6 + d, y: -30 };
      else if (o.holding === 'grenade' && !back) p = { x: 22, y: -76 };
      else if (o.gun) p = { x: 32 + d, y: -26 + (back ? 2 : 0) };
      const out = (o.jabArm === 1) === back ? (o.jab || 0) : 0;
      if (out) p = { x: lerp(p.x, 64 + d * 0.5, out), y: lerp(p.y, -60, out) };
      return p;
    };
    const arm = (back) => {
      const sh = shoulder(back ? -6 : 0), p = paw(back);
      ctx.fillStyle = back ? c.dark : c.fur;
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 2.2;
      A.taper(ctx, sh.x, sh.y, (sh.x + p.x) / 2 + 4, (sh.y + p.y) / 2 + 6, p.x, p.y, 11, 8);
      ctx.fill(); ctx.stroke();
      A.oval(ctx, p.x + 2, p.y, 6, 5.5, 0, c.dark, c.line, 2);
    };

    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(lean);
    arm(true);
    A.oval(ctx, 7, -36 - breathe * 0.5, 23, 38, 0.05, c.fur, c.line, 2.5);
    A.oval(ctx, 14, -32, 11, 26, 0.1, c.belly);
    ctx.restore();

    leg(0, c.fur);

    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(lean);
    // ---- head (kept fairly level whatever the body does)
    ctx.save();
    ctx.translate(14, -68);
    ctx.rotate(-lean * 0.7 + (pose === 'hurt' ? -0.2 : 0));
    const twitch = Math.sin(t * 1.3) > 0.97 ? 0.25 : 0;
    for (const [ex, ey, er] of [[-7, -36, -0.4 - twitch], [0, -38, -0.12]]) {
      A.oval(ctx, ex, ey, 6, 16, er, c.fur, c.line, 2.2);
      A.oval(ctx, ex + 1, ey + 2, 2.8, 10, er, c.ear);
    }
    A.oval(ctx, 4, -14, 14, 12.5, 0, c.fur, c.line, 2.5);
    A.oval(ctx, 18, -10, 13, 8, 0.1, c.muzzle, c.line, 2.2);
    A.oval(ctx, 30, -13, 4.5, 3.4, 0.2, c.nose);
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 2;
    if (o.mouth === 'open' || o.mouth === 'ouch') {
      A.oval(ctx, 23, -4, 4.5, o.mouth === 'ouch' ? 4 : 3, 0, '#5a1a1a');
    } else {
      ctx.beginPath(); ctx.moveTo(29, -6); ctx.quadraticCurveTo(24, -4, 19, -6); ctx.stroke();
    }
    if (pose === 'ko') {
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(3, -22); ctx.lineTo(10, -15); ctx.moveTo(10, -22); ctx.lineTo(3, -15);
      ctx.stroke();
    } else if (pose === 'hurt') {
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(3, -22); ctx.lineTo(10, -18); ctx.lineTo(3, -15); ctx.stroke();
    } else {
      A.oval(ctx, 7, -18, 4.8, 5.6, 0, '#ffffff', c.line, 1.6);
      A.oval(ctx, 8.6, -17.6, 2.6, 2.9, 0, '#1b1430');
      A.oval(ctx, 9.4, -18.8, 0.9, 0.9, 0, '#ffffff');
      // determined brow
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(1, -26); ctx.lineTo(12, -23); ctx.stroke();
    }
    ctx.restore();

    if (o.gun) {
      const p = paw(false);
      ctx.save();
      ctx.translate(p.x - 4, p.y - 2);
      ctx.rotate(-lean);
      A.gatling(ctx, 0, 0, { muzzle: o.muzzle, spin: o.spin });
      ctx.restore();
    }
    arm(false);
    if (o.holding === 'grenade') {
      const p = paw(false);
      A.grenade(ctx, p.x + 4, p.y - 10, { r: 7, pin: false, spark: true, t });
    }
    ctx.restore();

    if (pose === 'ko') {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + (i * Math.PI * 2) / 3;
        A.star(ctx, 30 + Math.cos(a) * 20, -118 + Math.sin(a) * 6, 5, '#ffd23f');
      }
    }
    ctx.restore();
  };
})();
