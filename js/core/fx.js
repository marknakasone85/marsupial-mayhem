// Visual juice: particles, comic "WHACK!" popups, blood or confetti, and screen shake.
(function () {
  const U = MG.U;
  const HIT_WORDS = ['WHACK!', 'THUMP!', 'BIFF!', 'POW!', 'BONK!', 'WALLOP!'];
  const BIG_WORDS = ['MEGA WALLOP!', 'KA-THUMP!', 'MAYHEM!', 'BIG BIFF!'];
  // every marsupial punches and kicks, and each has its own words
  const PUNCH_WORDS = ['POW!', 'BIFF!', 'WHAP!', 'BAM!', 'SMACK!'];
  const HOOK_WORDS = ['KA-POW!', 'BIG BIFF!', 'UPPERCUT!'];
  const KICK_WORDS = ['THWACK!', 'KA-THUMP!', 'BOOT!', 'WALLOP!', 'KICKED!'];

  // Player-facing settings. Blood is ON by default (the owner's choice); OFF swaps it for rainbow confetti.
  MG.Settings = { blood: MG.Save.get('blood', true) };
  MG.toggleBlood = () => {
    MG.Settings.blood = !MG.Settings.blood;
    MG.Save.set('blood', MG.Settings.blood);
  };
  const CONFETTI = ['#ff4d6d', '#ffd23f', '#00f5d4', '#9b5de5', '#3a86ff', '#52e07a'];

  MG.FX = class {
    constructor() {
      this.decals = [];
      this.parts = [];
      this.texts = [];
      this.shakeAmt = 0;
    }

    burst(x, y, color, n = 10, speed = 260) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = U.rand(speed * 0.3, speed);
        this.parts.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 80,
          life: U.rand(0.3, 0.7),
          max: 0.7,
          size: U.rand(3, 7),
          color,
          star: Math.random() < 0.4,
        });
      }
    }

    // Splatter when an enemy is hit or knocked out.
    //  style: a blood color like '#d62828', or 'oil' (robots), or 'confetti'
    gore(x, y, style, amount, floorY) {
      if (style !== 'oil' && !MG.Settings.blood) style = 'confetti';
      if (MG.Settings.gore && style !== 'confetti') amount = Math.round(amount * 2.2); // GORE: extra cartoon splatter
      for (let i = 0; i < amount; i++) {
        const a = -Math.PI / 2 + U.rand(-1.3, 1.3);
        const sp = U.rand(120, 420);
        const p = {
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.6, 1.1), max: 1.1,
          size: U.rand(2.5, 6), floor: floorY, rot: U.rand(0, 6), vr: U.rand(-12, 12),
        };
        if (style === 'confetti') {
          p.kind = 'confetti'; p.color = U.choice(CONFETTI); p.grav = 300; p.life += 0.6; p.max += 0.6;
        } else if (style === 'oil') {
          p.kind = i % 3 === 0 ? 'spark' : 'drop';
          p.color = p.kind === 'spark' ? '#ffd23f' : '#1d1d1d';
        } else {
          p.kind = 'drop'; p.color = style;
        }
        this.parts.push(p);
      }
    }

    // A splat stain on the ground that fades after a few seconds.
    splat(x, y, color, r) {
      if (color === 'confetti' || (!MG.Settings.blood && color !== 'oil')) return;
      if (color === 'oil') color = '#1d1d1d';
      if (MG.Settings.gore) r *= 1.5;
      const blobs = [];
      for (let i = 0; i < 5; i++) blobs.push([U.rand(-r, r), U.rand(-r * 0.15, r * 0.15), U.rand(r * 0.3, r * 0.7)]);
      this.decals.push({ x, y, r, color, blobs, life: 7 });
      if (this.decals.length > 80) this.decals.shift();
    }

    // Expanding shock ring (grenade blasts, ground pounds).
    ring(x, y, r, color = '#ffd23f') {
      this.rings = this.rings || [];
      this.rings.push({ x, y, r, color, life: 0.35, max: 0.35 });
    }

    feathers(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        this.parts.push({
          x: x + U.rand(-15, 15), y: y + U.rand(-10, 10), vx: U.rand(-120, 120), vy: U.rand(-220, -60),
          life: U.rand(1.2, 2), max: 2, size: U.rand(5, 8), color, kind: 'feather', grav: 120,
          rot: U.rand(0, 6), vr: U.rand(-4, 4),
        });
      }
    }

    drawDecals(ctx) {
      for (const d of this.decals) {
        ctx.globalAlpha = Math.min(0.85, d.life / 1.5);
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 2, d.r, d.r * 0.25, 0, 0, Math.PI * 2);
        for (const [bx, by, br] of d.blobs) {
          ctx.moveTo(d.x + bx + br, d.y + 2 + by);
          ctx.ellipse(d.x + bx, d.y + 2 + by, br, br * 0.3, 0, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    text(x, y, str, color = '#fff', size = 30) {
      this.texts.push({ x, y, str, color, size, life: 0.8, rot: U.rand(-0.25, 0.25) });
    }

    // kind: 'punch', 'hook' (a combo's third punch) or 'kick'; anything else uses the general words
    hitText(x, y, big, kind) {
      const list = kind === 'kick' ? KICK_WORDS : kind === 'hook' ? HOOK_WORDS : kind === 'punch' ? PUNCH_WORDS : big ? BIG_WORDS : HIT_WORDS;
      this.text(x, y, U.choice(list), big ? '#ff4d6d' : kind === 'hook' ? '#ffb703' : '#ffd23f', big ? 40 : kind === 'hook' ? 34 : 30);
    }

    // Where a blow lands, for a split second: a punch is a quick white star with streaks flying the way
    // the target goes (dir); a kick a bigger golden burst with a shock arc. heavy: a combo's hook.
    impact(x, y, kind, dir, heavy) {
      this.impacts = this.impacts || [];
      const kick = kind === 'kick', max = kick ? 0.2 : heavy ? 0.16 : 0.13;
      this.impacts.push({ x, y, kick, heavy: !!heavy, dir: dir < 0 ? -1 : 1, life: max, max, rot: U.rand(0, 1) });
      if (this.impacts.length > 24) this.impacts.shift();
    }

    // A puff of dust thrown up from the ground (behind the planted foot in a kick), going toward dir.
    dust(x, y, dir, n = 6) {
      for (let i = 0; i < n; i++) {
        this.parts.push({
          x: x + U.rand(-6, 6), y: y - U.rand(0, 6), vx: (dir < 0 ? -1 : 1) * U.rand(40, 170) + U.rand(-25, 25), vy: U.rand(-90, -20),
          life: U.rand(0.35, 0.6), max: 0.6, size: U.rand(4, 7), color: 'rgba(214,182,142,0.85)', kind: 'puff', grav: 60,
        });
      }
    }

    shake(amount) {
      this.shakeAmt = Math.max(this.shakeAmt, amount);
    }

    offset() {
      if (this.shakeAmt < 0.5) return { x: 0, y: 0 };
      return { x: U.rand(-1, 1) * this.shakeAmt, y: U.rand(-1, 1) * this.shakeAmt };
    }

    // Slow-motion finisher (round-winning hit, boss knockout): the view zooms toward (x, y) in world
    // coordinates, with cinema bars, speed lines and a flash. Timed in real seconds, so Wi-Fi guests
    // (who replay this call) see the same thing while the host slows the game down.
    finisher(x, y, big) {
      this.fin = { x, y, big: !!big, t0: MG.Engine.time, dur: big ? 1.75 : 1.2 };
      this.shake(big ? 16 : 10);
    }

    finAge() {
      const f = this.fin;
      if (!f) return null;
      const a = MG.Engine.time - f.t0;
      if (a < 0 || a > f.dur) { this.fin = null; return null; }
      return a;
    }

    // 0 = no finisher, 1 = full effect: snaps in, then eases out at the end.
    finAmount() {
      const a = this.finAge();
      if (a === null) return 0;
      const inn = Math.min(1, a / 0.16), out = Math.min(1, (this.fin.dur - a) / 0.45);
      return Math.min(1 - Math.pow(1 - inn, 3), out * out * (3 - 2 * out));
    }

    // Call after ctx.save() and before drawing the world. Zooming about a point on the screen never
    // shows anything past the edges.
    camera(ctx, camX = 0) {
      const k = this.finAmount();
      if (!k) return;
      const z = 1 + k * (this.fin.big ? 0.3 : 0.2);
      const px = U.clamp(this.fin.x - camX, 0, MG.W), py = U.clamp(this.fin.y, 0, MG.H);
      ctx.translate(px, py);
      ctx.scale(z, z);
      ctx.translate(-px, -py);
    }

    // Screen overlay for the finisher (draw after the world, before the HUD).
    drawFinisher(ctx, camX = 0) {
      const k = this.finAmount();
      if (!k) return;
      const W = MG.W, H = MG.H, a = MG.Engine.time - this.fin.t0;
      const cx = U.clamp(this.fin.x - camX, 0, W), cy = U.clamp(this.fin.y, 0, H);
      const R = Math.hypot(W, H);
      const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
      const seed = Math.floor(a * 14); // the comic speed lines jitter ~14 times a second
      ctx.save();
      ctx.globalAlpha = 0.3 * k;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const n = 28;
      for (let i = 0; i < n; i++) {
        const r1 = hash(seed * 31 + i), r2 = hash(seed * 17 + i * 7 + 3);
        const ang = ((i + r1 * 0.8) / n) * Math.PI * 2, wid = 0.01 + 0.018 * r2;
        const inner = R * (0.24 + 0.14 * r2);
        ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
        ctx.lineTo(cx + Math.cos(ang - wid) * R, cy + Math.sin(ang - wid) * R);
        ctx.lineTo(cx + Math.cos(ang + wid) * R, cy + Math.sin(ang + wid) * R);
        ctx.closePath();
      }
      ctx.fill();
      ctx.globalAlpha = 1;
      const bar = Math.round(44 * k);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, bar);
      ctx.fillRect(0, H - bar, W, bar);
      if (a < 0.2) {
        ctx.globalAlpha = 0.55 * (1 - a / 0.2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    update(dt) {
      this.shakeAmt *= Math.pow(0.002, dt);
      for (const p of this.parts) {
        if (p.kind === 'feather') p.vx = Math.sin(p.life * 5) * 70;
        if (p.kind === 'confetti') p.vx *= Math.pow(0.3, dt);
        if (p.kind === 'puff') { p.size += 16 * dt; p.vx *= Math.pow(0.05, dt); }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.grav !== undefined ? p.grav : 700) * dt;
        if (p.kind === 'feather' || p.kind === 'confetti') p.vy = Math.min(p.vy, 90);
        if (p.vr) p.rot += p.vr * dt;
        p.life -= dt;
        if (p.floor !== undefined && p.y >= p.floor) {
          if (p.kind === 'drop') {
            this.splat(p.x, p.floor, p.color, p.size * 1.6);
            p.life = 0;
          } else { p.y = p.floor; p.vy = 0; p.vx = 0; p.vr = 0; }
        }
      }
      this.parts = this.parts.filter((p) => p.life > 0);
      for (const d of this.decals) d.life -= dt;
      this.decals = this.decals.filter((d) => d.life > 0);
      for (const t of this.texts) {
        t.y -= 50 * dt;
        t.life -= dt;
      }
      this.texts = this.texts.filter((t) => t.life > 0);
      if (this.rings) {
        for (const r of this.rings) r.life -= dt;
        this.rings = this.rings.filter((r) => r.life > 0);
      }
      if (this.impacts) {
        for (const m of this.impacts) m.life -= dt;
        this.impacts = this.impacts.filter((m) => m.life > 0);
      }
    }

    // A spiky star: n points between radius r (tips) and r * inner.
    static spikes(ctx, x, y, r, n, inner, rot) {
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = rot + (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r * inner : r;
        if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
    }

    drawImpacts(ctx) {
      for (const m of this.impacts || []) {
        const k = 1 - m.life / m.max, fade = 1 - k * k;
        const R = (m.kick ? 34 : m.heavy ? 24 : 18) * (0.55 + 0.6 * Math.min(1, k * 2.2));
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.scale(m.dir, 1);
        ctx.globalAlpha = fade;
        ctx.lineCap = 'round';
        if (m.kick) {
          // the shock arc on the far side, thrown the way the target flies
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 9 * (1 - k) + 1.5;
          ctx.beginPath(); ctx.arc(R * 0.2, 0, R * (1.05 + k * 0.7), -0.95, 0.95); ctx.stroke();
          ctx.fillStyle = '#ffb703';
          MG.FX.spikes(ctx, 0, 0, R, 10, 0.45, m.rot); ctx.fill();
          ctx.fillStyle = '#fff6c2';
          MG.FX.spikes(ctx, 0, 0, R * 0.55, 10, 0.5, m.rot + 0.3); ctx.fill();
        } else {
          // streaks flying on, then the white star where the fist lands
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = m.heavy ? 3.5 : 2.5;
          ctx.beginPath();
          for (const a of [-0.38, 0, 0.38]) {
            const r0 = R * (0.8 + k * 0.6), r1 = R * (1.35 + k * 0.9);
            ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          }
          ctx.stroke();
          ctx.fillStyle = m.heavy ? '#ffd23f' : '#fff6c2';
          MG.FX.spikes(ctx, 0, 0, R, 8, 0.4, m.rot); ctx.fill();
          ctx.fillStyle = '#ffffff';
          MG.FX.spikes(ctx, 0, 0, R * 0.5, 8, 0.45, m.rot + 0.4); ctx.fill();
        }
        ctx.restore();
      }
    }

    draw(ctx) {
      this.drawImpacts(ctx);
      for (const r of this.rings || []) {
        const k = 1 - r.life / r.max;
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 10 * (1 - k) + 2;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r * (0.3 + 0.7 * k), r.r * (0.3 + 0.7 * k) * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const p of this.parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        if (p.kind === 'confetti' || p.kind === 'feather') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          if (p.kind === 'confetti') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          else {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-p.size * 1.4, 0); ctx.lineTo(p.size * 1.4, 0); ctx.stroke();
          }
          ctx.restore();
        } else if (p.star || p.kind === 'spark') MG.FX.star(ctx, p.x, p.y, p.size * 1.4);
        else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      for (const t of this.texts) {
        const age = 0.8 - t.life;
        const pop = age < 0.15 ? U.easeOutBack(age / 0.15) : 1;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.rot);
        ctx.scale(pop, pop);
        ctx.globalAlpha = Math.min(1, t.life * 3);
        MG.UI.outlineText(ctx, t.str, 0, 0, t.size, t.color, 'center');
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    static star(ctx, x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
    }
  };
})();
