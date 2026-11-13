// The kick grenade: pull the pin, drop it, kick it. (The owner's idea, 13 Nov 2026.)
//  * A dropped grenade fizzes on the ground for a few seconds, then explodes.
//  * Anyone standing next to it can kick it: attack = short kick, big attack = long lob,
//    grenade key = in between. Kangaroos kick furthest (character kickPower).
//  * A kicked grenade that hits a pest in the air blows up right away.
//  * The blast hurts pests and smashes crates. Players are only bounced, never hurt.
(function () {
  const U = MG.U;
  const GRAV = 1900;
  // [speed forward, speed up]: short and mid kicks fly low enough to hit pests; the long one is a lob
  const KICKS = { short: [520, -260], mid: [680, -380], long: [860, -540] };
  MG.GRENADE = { fuse: 3.2, radius: 130, dmg: 42 };

  MG.Grenade = class {
    constructor(x, y, vx, vy, owner) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.owner = owner;
      this.team = owner ? owner.team : 'player';
      this.fuse = MG.GRENADE.fuse;
      this.t = 0;
      this.kicked = 0;     // number of kicks
      this.flying = false; // airborne after a kick
      this.onGround = false;
      this.dead = false;
      this.spin = 0;
    }
    get box() { return { x: this.x - 10, y: this.y - 22, w: 20, h: 22 }; }

    kick(dir, kind, power, by) {
      const k = KICKS[kind] || KICKS.mid;
      this.vx = dir * k[0] * power;
      this.vy = k[1] * Math.sqrt(power);
      this.kicked++;
      this.flying = true;
      this.onGround = false;
      this.kickedBy = by || null;
      this.y = Math.min(this.y, (by ? by.y : this.y) - 6);
    }

    update(dt, world) {
      if (this.dead) return;
      this.t += dt;
      this.fuse -= dt;
      const prevY = this.y;
      this.vy += GRAV * (world.gravity || 1) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.spin += this.vx * dt * 0.05;
      // land on the ground or a platform, bouncing a little
      let floor = null;
      if (this.y >= world.groundY) floor = world.groundY;
      else if (this.vy > 0) {
        for (const p of world.platforms || []) {
          if (prevY <= p.y + 1 && this.y >= p.y && this.x > p.x - 4 && this.x < p.x + p.w + 4) { floor = p.y; break; }
        }
      }
      if (floor !== null) {
        this.y = floor;
        if (this.vy > 260) {
          this.vy = -this.vy * 0.35;
          this.vx *= 0.65;
          MG.Audio.tone(900, 0.04, 'square', 0.06);
        } else {
          this.vy = 0;
          this.onGround = true;
          this.flying = false;
        }
      } else {
        this.onGround = false;
      }
      if (this.onGround) this.vx *= Math.pow(0.02, dt);
      // closed gates and the map edges bounce it back
      const lim = world.limitsFor ? world.limitsFor(this.x) : { min: 0, max: Infinity };
      if (this.x < lim.min + 8) { this.x = lim.min + 8; this.vx = Math.abs(this.vx) * 0.5; }
      if (this.x > lim.max - 8) { this.x = lim.max - 8; this.vx = -Math.abs(this.vx) * 0.5; }

      if (this.flying) {
        for (const e of world.targets(this.team)) {
          if (e.alive && !e.isProp && U.overlap(this.box, e.box)) { this.explode(world); return; }
        }
      }
      if (this.fuse <= 0) this.explode(world);
    }

    explode(world) {
      if (this.dead) return;
      this.dead = true;
      const R = MG.GRENADE.radius;
      const cy = this.y - 12;
      for (const tg of world.targets(this.team)) {
        if (!tg.alive) continue;
        const b = tg.box;
        const d = Math.hypot(tg.x - this.x, (b.y + b.h / 2) - cy) - Math.max(b.w, b.h) * 0.35;
        if (d > R) continue;
        const dir = tg.x >= this.x ? 1 : -1;
        const k = U.clamp(1 - Math.max(0, d) / (R * 1.6), 0.4, 1);
        tg.takeHit({ dmg: MG.GRENADE.dmg * k, kbx: 620 * dir, kby: -580, stun: 0.8, big: true, blast: true, from: this, dir }, world);
      }
      // friendly blasts just bounce players (cartoon rules)
      for (const f of world.fighters || []) {
        if (f.state === 'ko') continue;
        const d = Math.hypot(f.x - this.x, (f.y - f.h * 0.4) - cy);
        if (d > R * 0.9) continue;
        f.vy = Math.min(f.vy, -460);
        f.vx += (f.x >= this.x ? 1 : -1) * 280;
        f.onGround = false;
      }
      world.fx.ring(this.x, this.y - 6, R * 1.35, '#ffb703');
      world.fx.burst(this.x, cy, '#ff7b00', 26, 420);
      world.fx.burst(this.x, cy, '#ffd23f', 14, 300);
      world.fx.burst(this.x, cy, '#6c6c6c', 12, 180);
      world.fx.text(this.x, cy - 50, U.choice(['KA-BOOM!', 'KABLOOEY!', 'BOOM-A-RANG!']), '#ff7b00', 34);
      world.fx.shake(18);
      MG.Engine.freeze(0.05);
      MG.Audio.boom();
    }

    draw(ctx) { if (!this.dead) MG.Grenade.drawState(ctx, this.x, this.y, this.spin, this.fuse, this.t); }

    // Also used by Wi-Fi guests, who only know where each grenade is and how long its fuse has left.
    static drawState(ctx, x, y, spin, fuse, t) {
      const blink = fuse < 1.2 && Math.floor(t * 12) % 2 === 0;
      MG.Art.grenade(ctx, x, y - 11, { r: 9, rot: spin, spark: true, blink, t });
      // countdown over it, so everyone knows when to kick
      if (fuse < 3) MG.UI.outlineText(ctx, String(Math.max(1, Math.ceil(fuse))), x, y - 38, 16, blink ? '#ff4d6d' : '#ffffff', 'center');
    }
  };
})();
