// Art for Milestone 5, drawn in code: weapons in paws (and as icons and pickups), their shots,
// coins, armor plates, and the platypus who runs the shop.
(function () {
  const A = MG.Art;
  const LINE = '#2b193d';
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // ---------------------------------------------------------------- weapons in paws
  // Drawn at the grip, pointing right (+x), about 40 px long. o: { muzzle, spin }
  const HELD = {
    shanghai(ctx, o) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = LINE; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(10, 0); ctx.moveTo(10, 0); ctx.lineTo(22, -9); ctx.moveTo(10, 0); ctx.lineTo(22, 9); ctx.stroke();
      ctx.strokeStyle = '#a0703c'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(10, 0); ctx.moveTo(10, 0); ctx.lineTo(22, -9); ctx.moveTo(10, 0); ctx.lineTo(22, 9); ctx.stroke();
      // the rubber band and the pebble pouch (pulled back unless it just fired)
      const back = o.muzzle ? 22 : 4;
      ctx.strokeStyle = '#e63946'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(22, -9); ctx.lineTo(back, 0); ctx.lineTo(22, 9); ctx.stroke();
      A.oval(ctx, back, 0, 3.5, 3, 0, '#6c757d', LINE, 1.2);
    },
    snag(ctx, o) {
      ctx.lineWidth = 2; ctx.strokeStyle = LINE;
      ctx.fillStyle = '#d62828';
      ctx.beginPath(); ctx.roundRect(-12, -7, 40, 14, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-2 + i * 9, -6); ctx.lineTo(-6 + i * 9, 6); ctx.stroke(); }
      if (!o.muzzle) { A.oval(ctx, 31, 0, 7, 4, 0, '#9c4a2a', LINE, 1.5); }
      ctx.fillStyle = '#6c757d'; ctx.fillRect(-6, 6, 6, 8);
      if (o.muzzle) A.star(ctx, 36, 0, 8, '#ffb703');
    },
    gatling(ctx, o) { A.gatling(ctx, 0, 0, o); },
    bowler(ctx, o) {
      ctx.lineWidth = 2; ctx.strokeStyle = LINE;
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath(); ctx.roundRect(-12, -10, 34, 20, 4); ctx.fill(); ctx.stroke();
      // two spinning wheels that fling the ball
      for (const wy of [-10, 10]) {
        ctx.save(); ctx.translate(14, wy); ctx.rotate((o.spin || 0) * 6);
        A.oval(ctx, 0, 0, 6, 6, 0, '#adb5bd', LINE, 1.5);
        ctx.strokeStyle = LINE; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -3, 14, 6);
      if (!o.muzzle) { A.oval(ctx, 26, 0, 6, 6, 0, '#c1121f', LINE, 1.5); }
      else A.star(ctx, 30, 0, 9, '#ffd23f');
    },
    flamer(ctx, o) {
      ctx.lineWidth = 2; ctx.strokeStyle = LINE;
      // the oil tank with a gum leaf on it
      A.oval(ctx, -4, -9, 10, 8, 0, '#4cc9a0', LINE, 2);
      A.oval(ctx, -4, -9, 5, 2.5, -0.5, '#2d6a4f');
      ctx.fillStyle = '#8d99ae';
      ctx.beginPath(); ctx.roundRect(-8, -3, 44, 7, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#495057'; ctx.fillRect(30, -5, 8, 11);
      // the pilot light
      A.oval(ctx, 41, 0, 3 + Math.sin((o.spin || 0) * 40) * 0.8, 2.5, 0, '#ffb703');
    },
    dropbear(ctx, o) {
      ctx.lineWidth = 2; ctx.strokeStyle = LINE;
      ctx.save(); ctx.rotate(-0.35);
      ctx.fillStyle = '#5c677d';
      ctx.beginPath(); ctx.roundRect(-10, -9, 42, 18, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#33415c'; ctx.fillRect(28, -11, 8, 22); ctx.strokeRect(28, -11, 8, 22);
      // fluffy grey ears peeking out of the barrel
      if (!o.muzzle) for (const ey of [-7, 7]) A.oval(ctx, 38, ey, 5, 5, 0, '#adb5bd', LINE, 1.5);
      else A.star(ctx, 42, 0, 10, '#ffd23f');
      ctx.restore();
    },
    magpie(ctx, o) {
      ctx.lineWidth = 2; ctx.strokeStyle = LINE;
      // a black-and-white perch box with a magpie looking out
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(-10, -9, 30, 18, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#111111'; ctx.fillRect(-4, -9, 6, 18); ctx.fillRect(10, -9, 6, 18);
      if (!o.muzzle) {
        A.oval(ctx, 25, -2, 7, 6, 0, '#111111', LINE, 1.5);
        A.oval(ctx, 27, -4, 1.8, 1.8, 0, '#ff9f1c');
        ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.moveTo(31, -3); ctx.lineTo(39, -1); ctx.lineTo(31, 1); ctx.fill();
      } else A.star(ctx, 26, 0, 8, '#ffffff');
    },
  };
  A.heldWeapon = function (ctx, id, o = {}) {
    const fn = typeof id === 'string' && has(HELD, id) ? HELD[id] : HELD.gatling;
    ctx.save();
    fn(ctx, o);
    ctx.restore();
  };
  // A weapon as an icon (HUD, shop), centred on (x, y).
  A.weaponIcon = function (ctx, id, x, y, s = 1) {
    ctx.save();
    ctx.translate(x - 14 * s, y);
    ctx.scale(s, s);
    A.heldWeapon(ctx, id, {});
    ctx.restore();
  };
  A.weaponPickup = function (ctx, id, x, y, t) {
    const by = y - 22 + Math.sin(t * 3) * 4;
    ctx.fillStyle = 'rgba(255,210,63,0.35)';
    ctx.beginPath(); ctx.arc(x, by, 27 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.fill();
    A.weaponIcon(ctx, id, x, by, 0.95);
  };

  // ---------------------------------------------------------------- shots
  const SHOT = {
    pebble(ctx, x, y) { A.oval(ctx, x, y, 4.5, 4, 0, '#8d99ae', LINE, 1.3); },
    snag(ctx, x, y, t, dir, p) {
      ctx.save(); ctx.translate(x, y - 5);
      ctx.rotate(p && p.vy ? Math.atan2(p.vy, p.vx) * 0.5 : t * 10 * dir);
      ctx.fillStyle = '#9c4a2a'; ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-10, -4, 20, 8, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5c2a14';
      for (const sx of [-4, 1, 6]) { ctx.beginPath(); ctx.moveTo(sx, -3); ctx.lineTo(sx - 3, 3); ctx.stroke(); }
      ctx.restore();
    },
    cricket(ctx, x, y, t) {
      A.oval(ctx, x, y, 6.5, 6.5, 0, '#c1121f', LINE, 1.5);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, 4, t * 20, t * 20 + Math.PI); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
    },
    flame(ctx, x, y, t) {
      const k = Math.max(0, 1 - t * 2.3);
      const r = 9 + t * 34;
      ctx.save();
      ctx.globalAlpha = 0.25 + k * 0.6;
      ctx.fillStyle = k > 0.6 ? '#ffd23f' : k > 0.3 ? '#ff9f1c' : '#e85d04';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = k * 0.8;
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
    dropbear(ctx, x, y, t, dir) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 7 * dir);
      for (const ex of [-11, 11]) A.oval(ctx, ex, -11, 7, 7, 0, '#adb5bd', LINE, 1.6);
      A.oval(ctx, 0, 0, 14, 13, 0, '#8d99ae', LINE, 2);
      A.oval(ctx, 0, 4, 5, 4, 0, '#343a40');
      // angry eyes and fangs: it's a DROP BEAR
      ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-3, -3); ctx.moveTo(8, -6); ctx.lineTo(3, -3); ctx.stroke();
      A.oval(ctx, -5, -1, 1.8, 1.8, 0, '#ff4d6d'); A.oval(ctx, 5, -1, 1.8, 1.8, 0, '#ff4d6d');
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(-1.5, 12); ctx.lineTo(0, 8); ctx.moveTo(1, 8); ctx.lineTo(2.5, 12); ctx.lineTo(4, 8); ctx.fill();
      ctx.restore();
    },
    maul(ctx, x, y, t) {
      const r = 85;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#c8b6a6';
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + t * 3, d = r * 0.45;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y - 30 + Math.sin(a) * d * 0.35, r * 0.32, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const sx = x - 30 + i * 22 + Math.sin(t * 30 + i) * 6, sy = y - 60 + (i % 2) * 14;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 14, sy + 30); ctx.stroke();
      }
      // a glimpse of the drop bear in the dust
      ctx.globalAlpha = 1;
      SHOT.dropbear(ctx, x + Math.sin(t * 25) * 18, y - 34 + Math.abs(Math.sin(t * 18)) * -10, t * 0.3, 1);
      ctx.restore();
    },
    magpie(ctx, x, y, t, dir, p) {
      const ang = p && (p.vx || p.vy) ? Math.atan2(p.vy, p.vx) : 0;
      const flip = Math.cos(ang) < 0 ? -1 : 1;
      ctx.save(); ctx.translate(x, y); ctx.rotate(flip < 0 ? ang + Math.PI : ang); ctx.scale(flip, 1);
      const flap = Math.sin(t * 28);
      ctx.lineWidth = 1.5; ctx.strokeStyle = LINE;
      // wings (black with a white band), body, white nape, grey-white beak
      ctx.fillStyle = '#111111';
      ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-10, -2 - 14 * flap); ctx.lineTo(4, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
      A.oval(ctx, 0, 0, 11, 6, 0, '#111111', LINE, 1.5);
      ctx.fillStyle = '#111111'; ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(-19, -4); ctx.lineTo(-19, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -3, 6, 3);
      A.oval(ctx, 10, -3, 5.5, 5, 0, '#111111', LINE, 1.2);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(7, -6, 2.6, 0, Math.PI * 2); ctx.fill();
      A.oval(ctx, 12, -4, 1.4, 1.4, 0, '#ff9f1c');
      ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(22, -2); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  };
  // the tree-kangaroo's fruit (drawn in worlds.js)
  SHOT.fruit = function (ctx, x, y, t) { if (A.fruit) A.fruit(ctx, x, y, t); else A.oval(ctx, x, y, 6, 6, 0, '#7b2cbf', LINE, 1.5); };
  // Big Tom's claw swipe: three white slashes flying forward
  SHOT.claw = function (ctx, x, y, t, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const oy = -18 + i * 18;
      ctx.strokeStyle = 'rgba(255,77,109,0.5)'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(-24, oy - 10); ctx.quadraticCurveTo(4, oy - 4, 18, oy + 12); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-24, oy - 10); ctx.quadraticCurveTo(4, oy - 4, 18, oy + 12); ctx.stroke();
    }
    ctx.restore();
  };
  const baseProjectile = A.projectile;
  A.projectile = function (ctx, kind, x, y, t, dir, p) {
    if (has(SHOT, kind)) SHOT[kind](ctx, x, y, t, dir, p);
    else baseProjectile(ctx, kind, x, y, t, dir, p);
  };

  // ---------------------------------------------------------------- coins
  A.coin = function (ctx, x, y, t, v = 1, r) {
    r = r || (v >= 5 ? 9.5 : 6.5);
    const squash = Math.abs(Math.cos(t * 5)) * 0.75 + 0.25;
    ctx.save(); ctx.translate(x, y); ctx.scale(squash, 1);
    A.oval(ctx, 0, 0, r, r, 0, '#e9a23b', '#8a5a00', 1.6);
    A.oval(ctx, 0, 0, r * 0.68, r * 0.68, 0, '#ffd23f');
    if (v >= 5) { ctx.fillStyle = '#8a5a00'; ctx.font = `bold ${Math.round(r)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(v), 0, 1); }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  A.coinIcon = function (ctx, x, y, r = 7) { A.coin(ctx, x, y, 0, 1, r); };

  // ---------------------------------------------------------------- armor
  // A plate on the fighter's chest, by which armor they wear (or a bark patch found in a map).
  A.armorPlate = function (ctx, id, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineWidth = 1.6; ctx.strokeStyle = LINE;
    if (id === 'iron') {
      ctx.fillStyle = '#9aa5b1';
      ctx.beginPath(); ctx.roundRect(-11, -13, 22, 26, 5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5c677d'; ctx.lineWidth = 1.4;
      for (let i = -7; i <= 7; i += 4.5) { ctx.beginPath(); ctx.moveTo(i, -11); ctx.lineTo(i, 11); ctx.stroke(); }
    } else if (id === 'billy') {
      ctx.fillStyle = '#ced4da';
      ctx.beginPath(); ctx.roundRect(-10, -12, 20, 24, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6c757d';
      for (const [rx, ry] of [[-6, -8], [6, -8], [-6, 8], [6, 8]]) { ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-6, -6, 4, 10);
    } else {
      // bark vest (or a patch)
      const small = id === 'patch';
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath(); ctx.roundRect(small ? -7 : -10, small ? -8 : -12, small ? 14 : 20, small ? 16 : 24, 5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5c3a1a';
      for (let i = -5; i <= 5; i += 5) { ctx.beginPath(); ctx.moveTo(i, small ? -6 : -10); ctx.quadraticCurveTo(i + 2, 0, i, small ? 6 : 10); ctx.stroke(); }
    }
    ctx.restore();
  };
  A.armorOn = function (ctx, def, s) {
    const f = s.f || 1;
    const k = def.art === 'kangaroo' ? { x: 14, y: -64 } : { x: A.LOOKS[def.look].rx * 0.4, y: -(A.LOOKS[def.look].L + A.LOOKS[def.look].ry * 0.85) };
    const bob = s.pose === 'walk' ? Math.abs(Math.sin((s.walk || 0) * Math.PI)) * 6 : 0;
    A.armorPlate(ctx, s.ai, s.x + f * k.x * def.scale, s.y + k.y * def.scale - bob, def.scale * 0.95);
  };
  A.armorPickup = function (ctx, x, y, t) {
    const by = y - 20 + Math.sin(t * 3) * 4;
    ctx.fillStyle = 'rgba(155,208,255,0.35)';
    ctx.beginPath(); ctx.arc(x, by, 22 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.fill();
    A.armorPlate(ctx, 'bark', x, by, 1.1);
    MG.UI.outlineText(ctx, '+' + MG.ARMOR_PICKUP, x + 16, by - 18, 13, '#9bd0ff', 'center');
  };
  A.upgradeIcon = function (ctx, id, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (id === 'heart') {
      A.heart(ctx, 0, 18, 0);
      MG.UI.outlineText(ctx, '+', 12, -10, 18, '#9ef01a', 'center');
    } else {
      ctx.fillStyle = '#6b4226'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-20, -4, 40, 9, 3); ctx.fill(); ctx.stroke();
      for (const gx of [-12, 0, 12]) A.grenade(ctx, gx, -8, { r: 6, pin: true });
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- the platypus shopkeeper
  // An egg-layer: it can't enter the tournament, so it sells to the animals who can.
  A.platypus = function (ctx, x, y, s = 1, t = 0, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const talk = o.talk ? Math.abs(Math.sin(t * 14)) : 0;
    // broad flat tail
    ctx.save(); ctx.rotate(Math.sin(t * 2) * 0.08);
    A.oval(ctx, -42, -14, 26, 11, -0.2, '#5a3d2b', LINE, 2);
    ctx.strokeStyle = '#4a3122'; ctx.lineWidth = 1;
    for (let i = -56; i < -28; i += 6) { ctx.beginPath(); ctx.moveTo(i, -20); ctx.lineTo(i + 3, -8); ctx.stroke(); }
    ctx.restore();
    // body and apron
    A.oval(ctx, 0, -30, 30, 32, 0, '#7a5232', LINE, 2.5);
    ctx.fillStyle = '#2a9d8f';
    ctx.beginPath(); ctx.moveTo(-16, -44); ctx.lineTo(16, -44); ctx.lineTo(20, -2); ctx.lineTo(-20, -2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke();
    MG.UI.text(ctx, 'SHOP', 0, -24, 9, '#ffffff', 'center');
    // webbed feet
    for (const fx of [-14, 14]) A.oval(ctx, fx, -1, 12, 5, 0, '#3d405b', LINE, 1.8);
    // arms (one waving)
    ctx.lineCap = 'round'; ctx.strokeStyle = LINE; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-24, -40); ctx.lineTo(-34, -24); ctx.stroke();
    const wave = Math.sin(t * 5) * 0.4;
    ctx.beginPath(); ctx.moveTo(24, -42); ctx.lineTo(36 + wave * 8, -60); ctx.stroke();
    ctx.strokeStyle = '#7a5232'; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(-24, -40); ctx.lineTo(-34, -24); ctx.moveTo(24, -42); ctx.lineTo(36 + wave * 8, -60); ctx.stroke();
    // head with a flat, rubbery bill
    A.oval(ctx, 2, -70, 20, 17, 0, '#7a5232', LINE, 2.5);
    ctx.fillStyle = '#343a40'; ctx.strokeStyle = LINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(28, -66, 20, 7, 0.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (talk) { ctx.fillStyle = '#212529'; ctx.beginPath(); ctx.ellipse(30, -60 + talk * 3, 15, 3 + talk * 3, 0.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    A.oval(ctx, 40, -68, 1.6, 1.2, 0, '#6c757d');
    A.oval(ctx, 6, -76, 3.2, 3.2, 0, '#111111');
    A.oval(ctx, 7, -77, 1, 1, 0, '#ffffff');
    // a shopkeeper's green visor
    ctx.fillStyle = '#52b788';
    ctx.beginPath(); ctx.moveTo(-14, -84); ctx.quadraticCurveTo(4, -94, 22, -84); ctx.lineTo(30, -80); ctx.lineTo(-14, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
})();
