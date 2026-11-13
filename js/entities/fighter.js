// A playable marsupial (Boomer for now). Pattern from Sloth Slap's fighter, rewritten for kangaroo moves.
//
// The scene is the "world" and provides:
//   world.groundY, world.gravity, world.platforms, world.fx
//   world.bounds(f) -> { min, max }        world.targets(team) -> things to hit (box, alive, takeHit)
//   world.spawn(projectile)                 world.spawnGrenade(grenade)
//   world.grenadeNear(f) -> grenade or null world.floorBelow(x, y)
//   world.onHit(attacker, target, hit, result)   (optional: score)
(function () {
  const U = MG.U;
  const GRAV = 1900;
  const SPECIAL_COST = 100;
  MG.SPECIAL_COST = SPECIAL_COST;
  MG.POWER_TIME = 12;                         // seconds a power-up lasts
  MG.POWER_TYPES = ['shield', 'tea', 'super'];
  MG.POWER_NAMES = { shield: 'GUMLEAF SHIELD!', tea: 'BILLY TEA RUSH!', super: 'SUPER WALLOP!' };
  MG.MAX_GRENADES = 9;
  MG.START_GRENADES = 3;

  // Move timings (seconds) and hits. Jabs chain: jab, jab, then a hook.
  const MOVES = {
    jab: { startup: 0.05, active: 0.07, recover: 0.09, dmg: 6, kbx: 70, kby: -60, reach: 62, stun: 0.3 },
    hook: { startup: 0.08, active: 0.08, recover: 0.16, dmg: 10, kbx: 440, kby: -300, reach: 66, stun: 0.45 },
    kick: { startup: 0.2, active: 0.12, recover: 0.26, dmg: 16, kbx: 760, kby: -460, reach: 100, stun: 0.6, big: true },
  };
  const approach = (v, target, amt) => (v < target ? Math.min(target, v + amt) : Math.max(target, v - amt));

  function movesFor(def) {
    const k = def.atk || 1;
    const out = {};
    for (const [name, m] of Object.entries(MOVES)) {
      out[name] = Object.assign({}, m, { startup: m.startup / k, active: m.active / k, recover: m.recover / k });
    }
    return out;
  }

  MG.Fighter = class {
    constructor(def, x, opts = {}) {
      this.def = def;
      this.moves = movesFor(def);
      this.x = x;
      this.y = opts.y !== undefined ? opts.y : MG.GROUND_Y;
      this.vx = 0;
      this.vy = 0;
      this.facing = opts.facing || 1;
      this.team = opts.team || 'player';
      this.mercy = opts.mercy || 0;      // invulnerable for a moment after being hit
      this.colors = opts.colors || null; // e.g. player 2's sandy coat
      this.hp = def.hp;
      this.maxHp = def.hp;
      this.meter = 0;
      this.state = 'idle';
      this.move = null;
      this.onGround = true;
      this.jumping = false;
      this.hitstun = 0;
      this.invuln = 0;
      this.flash = 0;
      this.walk = 0;
      this.t = Math.random() * 10;
      this.w = 50;
      this.h = 120 * (def.scale / 0.84);
      this.hitList = new Set();
      this.combo = 0;
      this.comboT = 0;
      this.jabs = 0;          // jabs in a row (the third is a hook)
      this.jabT = 0;
      this.counterT = 0;      // Tail Counter: kicks back this many seconds after a block
      this.counterCool = 0;
      this.powers = {};       // power-up name -> seconds left
      this.weapon = null;     // { id: 'gatling', ammo, max }
      this.grenades = MG.START_GRENADES;
      this.fireT = 0;
      this.muzzleT = 0;
      this.spin = 0;
      this.firing = false;
      this.hintT = 0;
      this.alive = true;
    }

    get box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    get canSpecial() { return this.meter >= SPECIAL_COST; }
    get ammo() { return this.weapon ? this.weapon.ammo : 0; }

    powerUp(type) { this.powers[type] = MG.POWER_TIME; }
    heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }
    giveWeapon(id, ammo) {
      if (this.weapon && this.weapon.id === id) this.weapon.ammo = Math.min(this.weapon.max, this.weapon.ammo + ammo);
      else this.weapon = { id, ammo, max: Math.max(100, ammo) };
    }
    giveGrenades(n) { this.grenades = Math.min(MG.MAX_GRENADES, this.grenades + n); }

    say(world, text, color = '#ffffff', size = 18) { world.fx.text(this.x, this.y - this.h - 18, text, color, size); }

    // ------------------------------------------------------------------
    update(dt, ctrl, world) {
      this.t += dt;
      this.flash -= dt;
      this.invuln -= dt;
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
      this.jabT -= dt;
      if (this.jabT <= 0 && this.state !== 'attack') this.jabs = 0; // the combo ends after a pause
      this.counterCool -= dt;
      this.fireT -= dt;
      this.muzzleT -= dt;
      this.hintT -= dt;
      this.firing = false;
      for (const k of Object.keys(this.powers)) {
        this.powers[k] -= dt;
        if (this.powers[k] <= 0) delete this.powers[k];
      }

      if (this.state === 'ko' || this.state === 'win') {
        this.vx *= Math.pow(0.05, dt);
        this.physics(dt, world);
        return;
      }
      if (this.state === 'hurt') {
        this.hitstun -= dt;
        if (this.onGround) this.vx = approach(this.vx, 0, 1400 * dt);
        if (this.hitstun <= 0) this.state = 'idle';
        this.physics(dt, world);
        return;
      }

      ctrl = ctrl || {};
      // Tail Counter: a blocked hit is answered with an automatic tail kick
      if (this.counterT > 0) {
        this.counterT -= dt;
        if (this.counterT <= 0 && this.state !== 'attack') {
          this.startMove('kick');
          this.move.counter = true;
          this.move.def = Object.assign({}, this.moves.kick, { startup: 0.1 });
          this.counterCool = 0.9;
          this.say(world, 'TAIL COUNTER!', '#ffd23f', 22);
        }
      }

      if (this.state === 'attack') {
        this.updateMove(dt, ctrl, world);
      } else {
        const dir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
        const tea = this.powers.tea ? 1.45 : 1;
        if (ctrl.down && this.onGround) {
          this.state = 'block';
          this.vx = approach(this.vx, 0, 2500 * dt);
        } else {
          this.state = 'idle';
          const firing = ctrl.shoot && this.weapon;
          const speed = this.def.speed * tea * (firing ? 0.55 : 1);
          const accel = (this.onGround ? 2400 : 1500) * tea;
          this.vx = approach(this.vx, dir * speed, accel * dt);
          if (dir && !firing) this.facing = dir;
          else if (dir && firing && !this.onGround) this.facing = dir;
        }
        if (ctrl.jumpP && this.onGround && this.state !== 'block') {
          this.vy = -this.def.jump * (this.powers.tea ? 1.06 : 1);
          this.onGround = false;
          this.jumping = true;
          MG.Audio.hop();
        }
        // let go of jump early for a smaller hop
        if (this.jumping && !ctrl.jump && this.vy < -380) { this.vy = -380; this.jumping = false; }

        const g = (ctrl.attackP || ctrl.bigP || ctrl.grenadeP) && world.grenadeNear ? world.grenadeNear(this) : null;
        if (g) this.punt(g, ctrl.bigP ? 'long' : ctrl.attackP ? 'short' : 'mid', world);
        else if (ctrl.attackP) this.startJab();
        else if (ctrl.bigP) this.startMove('kick');
        else if (ctrl.specialP && this.canSpecial) this.startSpecial(world);
        else if (ctrl.specialP && this.hintT <= 0) { this.say(world, 'Special needs a full blue bar', '#9bf6ff', 15); this.hintT = 1.5; }
        else if (ctrl.grenadeP) this.tryGrenade(world);
        if (this.state === 'idle' && ctrl.shoot) this.tryFire(world, ctrl.shootP);
      }

      if (Math.abs(this.vx) > 20 && this.onGround) {
        const before = Math.floor(this.walk);
        this.walk += dt * Math.abs(this.vx) * 0.0046;
        if (Math.floor(this.walk) !== before) MG.Audio.land();
      }
      this.physics(dt, world);
    }

    physics(dt, world) {
      const prevY = this.y;
      this.vy += GRAV * (world.gravity || 1) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const wasGround = this.onGround;
      this.onGround = false;
      if (this.y >= world.groundY) {
        this.y = world.groundY;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy > 0 && world.platforms) {
        for (const p of world.platforms) {
          if (prevY <= p.y + 1 && this.y >= p.y && this.x > p.x - 6 && this.x < p.x + p.w + 6) {
            this.y = p.y;
            this.vy = 0;
            this.onGround = true;
            break;
          }
        }
      }
      if (this.onGround && !wasGround) this.onLand(world);
      const b = world.bounds(this);
      this.x = U.clamp(this.x, b.min + this.w / 2, b.max - this.w / 2);
    }

    onLand(world) {
      this.jumping = false;
      const m = this.move;
      if (m && m.kind === 'bound' && m.phase === 'air') {
        // Boomer Bound lands: ground pound + two dust shockwaves rolling out
        m.phase = 'impact';
        m.t = 0;
        MG.Audio.kick();
        MG.Audio.thump();
        world.fx.shake(18);
        world.fx.ring(this.x, this.y, 220, '#e3a072');
        world.fx.burst(this.x, this.y, '#d69669', 26, 420);
        world.fx.text(this.x, this.y - this.h - 24, 'KA-THUMP!', '#ff4d6d', 38);
        this.hitList.clear();
        this.doHits(world, { x: this.x - 190, y: this.y - 110, w: 380, h: 120 },
          { dmg: 22, kbx: 420, kby: -620, stun: 0.7, big: true }, true);
        for (const d of [-1, 1]) {
          world.spawn(new MG.Projectile('dust', this.x + d * 60, this.y - 4, d * 600, 0, this.team,
            { dmg: 12, stun: 0.5, kbx: 300, kby: -420, big: true, pierce: true, props: true, ground: true, life: 0.75 }));
        }
      } else if (Math.abs(this.vy) < 1) {
        MG.Audio.land();
      }
    }

    // ------------------------------------------------------------------ moves
    startMove(name) {
      this.state = 'attack';
      this.move = { kind: name, def: this.moves[name], t: 0 };
      this.hitList.clear();
      if (this.onGround) this.vx *= 0.3;
    }

    startJab() {
      this.jabs++;
      const hook = this.jabs >= 3;
      this.startMove(hook ? 'hook' : 'jab');
      this.move.kind = 'jab';            // same pose, the hook just hits harder
      this.move.arm = this.jabs % 2;     // left, right, left...
      if (hook) this.jabs = 0;
      if (this.onGround) this.vx = this.facing * 240; // a little lunge, so a combo keeps connecting
    }

    startSpecial(world) {
      this.meter -= SPECIAL_COST;
      this.state = 'attack';
      this.move = { kind: 'bound', t: 0, phase: 'crouch' };
      this.hitList.clear();
      MG.Audio.special();
      this.say(world, this.def.specialName + '!', '#00f5d4', 24);
    }

    tryGrenade(world) {
      if (this.grenades <= 0) {
        MG.Audio.emptyClick();
        if (this.hintT <= 0) { this.say(world, 'No grenades! Smash crates to find more', '#cccccc', 15); this.hintT = 1.5; }
        return;
      }
      this.startMove('pin');
    }

    // Kick a grenade lying near your feet (any player can kick any grenade).
    punt(g, kind, world) {
      this.startMove('punt');
      this.move.grenade = g;
      this.move.power = kind;
    }

    tryFire(world, pressed) {
      if (!this.weapon) {
        if (pressed) {
          MG.Audio.emptyClick();
          if (this.hintT <= 0) { this.say(world, 'No weapon yet! Look for one', '#cccccc', 15); this.hintT = 1.5; }
        }
        return;
      }
      this.firing = true;
      if (this.fireT > 0) return;
      this.fireT = 0.06;
      const s = this.def.scale;
      const by = this.y - 52 * s;
      const sup = this.powers.super ? 2 : 1;
      world.spawn(new MG.Projectile('gumnut', this.x + this.facing * 24 * s, by + U.rand(-3, 3),
        this.facing * 950, U.rand(-30, 30), this.team,
        { dmg: 3.5 * sup, stun: 0.12, kbx: 130, kby: -60, props: true, life: 0.7, gravity: 220 }));
      this.weapon.ammo--;
      this.muzzleT = 0.05;
      this.spin += 0.34;
      this.vx -= this.facing * 18;
      MG.Audio.gatling();
      if (this.weapon.ammo <= 0) {
        this.weapon = null;
        this.say(world, 'OUT OF GUMNUTS!', '#ffb703', 18);
      }
    }

    // Attack box in front of the fighter.
    reachBox(reach) {
      const r = reach * (this.def.scale / 0.84);
      return {
        x: this.facing > 0 ? this.x : this.x - r - this.w * 0.2,
        y: this.y - this.h * 0.85, w: r + this.w * 0.2, h: this.h * 0.75,
      };
    }

    doHits(world, box, h, omni = false) {
      let landed = false;
      for (const target of world.targets(this.team)) {
        if (!target.alive || this.hitList.has(target)) continue;
        if (!U.overlap(box, target.box)) continue;
        this.hitList.add(target);
        const dir = omni ? (target.x >= this.x ? 1 : -1) : this.facing;
        const sup = this.powers.super ? 1 : 0;
        const kb = Math.sqrt(this.def.power);
        const hit = {
          dmg: h.dmg * this.def.power * (sup ? 2 : 1), kbx: h.kbx * dir * kb * (sup ? 1.4 : 1),
          kby: h.kby * Math.sqrt(kb) * (sup ? 1.25 : 1), stun: h.stun, big: !!h.big, from: this, dir,
        };
        const result = target.takeHit(hit, world);
        if (result === 'miss') continue;
        landed = true;
        if (result !== 'blocked' && !target.isProp) {
          this.meter = Math.min(SPECIAL_COST, this.meter + (h.big ? 16 : 9));
          this.combo++;
          this.comboT = 1.2;
          const cx = (box.x + box.w / 2 + target.x) / 2;
          const cy = target.box.y + target.box.h * 0.35;
          world.fx.burst(cx, cy, h.big ? '#ff4d6d' : '#ffd23f', h.big ? 18 : 10);
          world.fx.hitText(cx, cy - 30, h.big);
          world.fx.shake(h.big ? 10 : 4);
          MG.Engine.freeze(h.big ? 0.08 : 0.035);
          if (h.big) MG.Audio.kick(); else MG.Audio.jab();
        }
        if (world.onHit) world.onHit(this, target, hit, result);
      }
      return landed;
    }

    updateMove(dt, ctrl, world) {
      const m = this.move;
      m.t += dt;
      if (this.onGround && m.kind !== 'bound') this.vx = approach(this.vx, 0, 1800 * dt);
      const finish = () => { this.state = 'idle'; this.move = null; };

      if (m.kind === 'jab' || m.kind === 'kick') {
        const d = m.def;
        if (m.kind === 'jab' && ctrl.attackP) m.queued = true; // mash away: the next punch is queued
        if (m.kind === 'kick' && m.t < d.startup && this.onGround) this.vx = approach(this.vx, this.facing * 60, 600 * dt);
        if (m.t >= d.startup && m.t < d.startup + d.active) {
          if (!m.swung) { m.swung = true; if (!this.doHits(world, this.reachBox(d.reach), d)) MG.Audio.whiff(); }
          else this.doHits(world, this.reachBox(d.reach), d);
        }
        if (m.t >= d.startup + d.active + d.recover) {
          if (m.kind === 'jab') this.jabT = 0.45;
          finish();
          if (m.queued) this.startJab();
        }
      } else if (m.kind === 'pin') {
        if (!m.fired && m.t >= 0.16) {
          m.fired = true;
          this.grenades--;
          world.spawnGrenade(new MG.Grenade(this.x + this.facing * 34, this.y - 24, this.facing * 50, -180, this));
          MG.Audio.pin();
          this.say(world, 'PIN PULLED! KICK IT!', '#9ef01a', 18);
        }
        if (m.t > 0.3) finish();
      } else if (m.kind === 'punt') {
        if (!m.fired && m.t >= 0.05) {
          m.fired = true;
          if (!m.grenade.dead) {
            m.grenade.kick(this.facing, m.power, this.def.kickPower || 1, this);
            MG.Audio.punt();
            world.fx.text(this.x + this.facing * 40, this.y - 60, 'BOOT!', '#9ef01a', 22);
          }
        }
        if (m.t > 0.26) finish();
      } else if (m.kind === 'bound') {
        if (m.phase === 'crouch') {
          this.invuln = Math.max(this.invuln, 0.05);
          if (m.t > 0.16) {
            m.phase = 'air';
            m.t = 0;
            this.vy = -1250;
            this.vx = this.facing * 340;
            this.onGround = false;
            MG.Audio.hop();
            world.fx.burst(this.x, this.y, '#d69669', 12, 220);
          }
        } else if (m.phase === 'air') {
          const dir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
          if (dir) this.vx = approach(this.vx, dir * 400, 900 * dt);
          if (m.t > 2.5) finish(); // safety
        } else if (m.phase === 'impact' && m.t > 0.3) finish();
      }
    }

    // ------------------------------------------------------------------ getting hit
    takeHit(hit, world) {
      if (this.state === 'ko' || this.invuln > 0) return 'miss';
      if (this.powers.shield) {
        this.vx = hit.kbx * 0.2;
        MG.Audio.tone(300, 0.2, 'sine', 0.3, 700);
        world.fx.burst(this.x, this.y - this.h * 0.5, '#52b788', 8, 200);
        this.say(world, 'BOING! (gumleaf shield)', '#b7e4c7', 16);
        return 'blocked';
      }
      const facingAttacker = hit.from ? (hit.from.x - this.x) * this.facing > 0 : true;
      if (this.state === 'block' && facingAttacker) {
        this.hp -= hit.dmg * 0.12;
        this.vx = hit.kbx * 0.3;
        MG.Audio.block();
        world.fx.burst(this.x + this.facing * 26, this.y - this.h * 0.6, '#9bf6ff', 6, 150);
        if (this.counterCool <= 0 && this.counterT <= 0) this.counterT = 0.1;
        else this.say(world, 'BLOCKED', '#9bf6ff', 16);
        if (this.hp <= 0) this.knockOut(world);
        return 'blocked';
      }
      this.hp -= hit.dmg;
      this.vx = hit.kbx / this.def.weight;
      this.vy = hit.kby / this.def.weight;
      this.onGround = false;
      this.flash = 0.1;
      this.meter = Math.min(SPECIAL_COST, this.meter + 6);
      this.move = null;
      this.counterT = 0;
      this.state = 'hurt';
      this.hitstun = hit.stun;
      MG.Audio.hurt();
      if (this.mercy) this.invuln = this.mercy;
      if (this.hp <= 0) this.knockOut(world);
      return 'hit';
    }

    knockOut(world) {
      this.hp = 0;
      this.state = 'ko';
      this.move = null;
      this.vy = -420;
      this.vx = (this.vx >= 0 ? 1 : -1) * 260;
      MG.Audio.ko();
      world.fx.shake(14);
    }

    // ------------------------------------------------------------------ drawing
    // How far the arm is out (jab) or the legs are up (kick, 0..1), for the art.
    swingAmount(d, t) {
      if (t < d.startup) return t / d.startup;
      if (t < d.startup + d.active) return 1;
      return Math.max(0, 1 - (t - d.startup - d.active) / d.recover);
    }

    // Everything needed to draw this fighter, as a small plain object (Wi-Fi guests get it too).
    renderState() {
      const m = this.move;
      const pose = this.state === 'ko' ? 'ko'
        : this.state === 'win' ? 'win'
        : this.state === 'hurt' ? 'hurt'
        : this.state === 'block' ? 'block'
        : !this.onGround ? 'jump'
        : Math.abs(this.vx) > 20 && this.state !== 'attack' ? 'walk'
        : 'idle';
      let jab = 0, kick = 0, crouch = 0;
      if (m && m.kind === 'jab') jab = this.swingAmount(m.def, m.t);
      if (m && m.kind === 'kick') kick = this.swingAmount(m.def, m.t);
      if (m && m.kind === 'punt') kick = m.t < 0.12 ? 0.75 : Math.max(0, 0.75 - (m.t - 0.12) * 5);
      if (m && m.kind === 'bound') crouch = m.phase === 'crouch' ? Math.min(1, m.t / 0.16) : m.phase === 'impact' ? Math.max(0, 1 - m.t / 0.3) : 0;
      const r2 = (v) => Math.round(v * 100) / 100;
      return {
        cid: this.def.id, x: Math.round(this.x * 10) / 10, y: Math.round(this.y * 10) / 10, f: this.facing,
        pose, t: r2(this.t), walk: r2(this.walk), jab: r2(jab), ja: m && m.kind === 'jab' ? m.arm : 0,
        kick: r2(kick), cr: r2(crouch),
        mo: this.state === 'attack' ? 'open' : this.state === 'hurt' ? 'ouch' : 0,
        fl: this.flash > 0 ? 1 : 0,
        gun: this.weapon && ['idle', 'block'].includes(this.state) ? 1 : 0, mz: this.muzzleT > 0 ? 1 : 0, sp: r2(this.spin),
        hold: m && m.kind === 'pin' && !m.fired ? 1 : 0,
        hide: this.invuln > 0.1 && Math.floor(this.t * 20) % 2 === 0 ? 1 : 0,
        ps: r2(this.powers.shield || 0), su: this.powers.super ? 1 : 0, tea: this.powers.tea ? 1 : 0,
        vx: Math.round(this.vx), st: this.state, tag: this.tag || 0, tc: this.tagColor || 0, p2: this.colors ? 1 : 0,
      };
    }

    draw(ctx, world) { MG.Fighter.drawState(ctx, this.renderState(), world); }

    static drawState(ctx, s, world) {
      const def = MG.charById(s.cid);
      const k = def.scale / 0.84;
      const h = 120 * k, w = 50 * k;
      const floor = world.floorBelow ? world.floorBelow(s.x, s.y) : world.groundY;
      MG.Art.shadow(ctx, s.x, floor, 36 * k * Math.max(0.4, 1 - (floor - s.y) / 400));
      if (s.tag && s.pose !== 'ko') {
        const ty = s.y - 158 * k + Math.sin(s.t * 4) * 3;
        ctx.fillStyle = s.tc;
        ctx.beginPath();
        ctx.moveTo(s.x - 7, ty + 8); ctx.lineTo(s.x + 7, ty + 8); ctx.lineTo(s.x, ty + 16);
        ctx.fill();
        MG.UI.outlineText(ctx, s.tag, s.x, ty - 2, 15, s.tc, 'center');
      }
      if (s.hide) return;
      if (s.su) {
        ctx.fillStyle = `rgba(255,77,109,${0.18 + Math.sin(s.t * 10) * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y - h * 0.5, w * 1.2, h * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.tea && Math.abs(s.vx) > 40) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const ly = s.y - h * (0.25 + i * 0.25);
          const lx = s.x - Math.sign(s.vx) * (w * 0.8 + i * 6);
          ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - Math.sign(s.vx) * 26, ly); ctx.stroke();
        }
      }
      MG.Art.kangaroo(ctx, {
        x: s.x, y: s.y, facing: s.f, scale: def.scale, t: s.t, pose: s.pose, walk: s.walk,
        jab: s.jab, jabArm: s.ja, kick: s.kick, crouch: s.cr, mouth: s.mo || undefined, flash: !!s.fl,
        gun: !!s.gun, muzzle: !!s.mz, spin: s.sp, holding: s.hold ? 'grenade' : null,
        colors: s.p2 ? def.p2colors : null,
      });
      if (s.ps && (s.ps > 2 || Math.floor(s.t * 8) % 2 === 0)) {
        const r = h * 0.62 + Math.sin(s.t * 6) * 3;
        ctx.fillStyle = 'rgba(82,183,136,0.18)';
        ctx.strokeStyle = 'rgba(183,228,199,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y - h * 0.5, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  };

  // ---------- Projectiles: gumnuts from the gatling, dust shockwaves ----------
  const PROJ_WORD = { gumnut: 'POK!', dust: 'WHUMP!' };
  MG.Projectile = class {
    constructor(kind, x, y, vx, vy, team, hit) {
      this.kind = kind;
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.team = team;
      this.hit = hit;
      this.gravity = hit.gravity || 0;
      this.life = hit.life || 3;
      this.t = 0;
      this.dead = false;
      this.hitList = new Set();
    }
    get box() {
      return this.kind === 'dust' ? { x: this.x - 22, y: this.y - 40, w: 44, h: 42 } : { x: this.x - 10, y: this.y - 14, w: 20, h: 28 };
    }

    update(dt, world) {
      this.t += dt;
      this.life -= dt;
      this.vy += this.gravity * (world.gravity || 1) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.life <= 0) this.dead = true;
      if (!this.hit.ground && this.y >= world.groundY - 4) {
        this.dead = true;
        world.fx.burst(this.x, world.groundY - 4, '#8a5a2b', 4, 120);
        return;
      }
      for (const target of world.targets(this.team)) {
        if (!target.alive || (target.isProp && !this.hit.props) || this.hitList.has(target)) continue;
        if (!U.overlap(this.box, target.box)) continue;
        this.hitList.add(target);
        const dir = this.vx !== 0 ? Math.sign(this.vx) : (target.x >= this.x ? 1 : -1);
        const h = this.hit;
        const res = target.takeHit({
          dmg: h.dmg, kbx: (h.kbx || 100) * dir, kby: h.kby || -100, stun: h.stun || 0.3, big: !!h.big, from: this, dir,
        }, world);
        if (res !== 'miss') {
          world.fx.burst(this.x, this.y, '#ffd23f', this.kind === 'gumnut' ? 5 : 12);
          if (this.kind !== 'gumnut' || Math.random() < 0.3) world.fx.text(this.x, this.y - 30, PROJ_WORD[this.kind] || 'BONK!', '#ffffff', this.kind === 'gumnut' ? 16 : 24);
          if (h.pierce) continue;
          this.dead = true;
          break;
        }
      }
    }

    draw(ctx) { MG.Art.projectile(ctx, this.kind, this.x, this.y, this.t, Math.sign(this.vx) || 1); }
  };
})();
