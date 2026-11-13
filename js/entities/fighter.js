// A playable marsupial. Pattern from Sloth Slap's fighter; each character's moves come from its data
// (js/data/characters.js), its special from js/entities/specials.js and its traits from abilities.js.
//
// The scene is the "world" and provides:
//   world.groundY, world.gravity, world.platforms, world.fx
//   world.bounds(f) -> { min, max }        world.targets(team) -> things to hit (box, alive, takeHit)
//   world.spawn(projectile)                 world.spawnGrenade(grenade)
//   world.grenadeNear(f) -> grenade or null world.floorBelow(x, y)
//   world.faceTarget(f) -> x or null        world.onHit(attacker, target, hit, result)   (optional)
//   world.walls() -> settled cube walls     world.view() -> { min, max } (what's on screen)
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

  // Starting points for each build's attack; a character's data can change any of them.
  const BASIC = {
    FAST: { startup: 0.045, active: 0.06, recover: 0.07, dmg: 4.5, kbx: 60, kby: -50, reach: 54, stun: 0.25 },
    BALANCED: { startup: 0.05, active: 0.07, recover: 0.09, dmg: 5.5, kbx: 70, kby: -60, reach: 58, stun: 0.3 },
    POWER: { startup: 0.05, active: 0.07, recover: 0.09, dmg: 6, kbx: 70, kby: -60, reach: 62, stun: 0.3 },
  };
  const HOOK = { startup: 0.08, active: 0.08, recover: 0.16, dmg: 10, kbx: 440, kby: -300, reach: 66, stun: 0.45 };
  const BIG = { startup: 0.2, active: 0.12, recover: 0.26, dmg: 16, kbx: 760, kby: -460, reach: 100, stun: 0.6, big: true };
  const approach = (v, target, amt) => (v < target ? Math.min(target, v + amt) : Math.max(target, v - amt));

  // A character's moves, timed by its attack speed (fast characters wind up and recover quicker).
  function movesFor(def) {
    const k = def.atk || 1;
    const time = (m) => Object.assign(m, { startup: m.startup / k, active: m.active / k, recover: m.recover / k });
    const pick = (o) => {
      const out = {};
      for (const key of ['startup', 'active', 'recover', 'dmg', 'kbx', 'kby', 'reach', 'stun', 'guardBreak', 'hits']) if (o && o[key] !== undefined) out[key] = o[key];
      return out;
    };
    return {
      jab: time(Object.assign({}, BASIC[def.build] || BASIC.BALANCED, pick(def.basic))),
      hook: time(Object.assign({}, HOOK)),
      kick: time(Object.assign({}, BIG, pick(def.big))),
    };
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
      this.autoFace = !!opts.autoFace;     // duels: always face the nearest opponent
      this.mercy = opts.mercy || 0;        // invulnerable for a moment after being hit
      this.coat = opts.coat || 0;          // player 2-4's coat or scarf when several pick the same character
      this.hp = def.hp;
      this.maxHp = def.hp;
      this.meter = 0;
      this.state = 'idle';
      this.move = null;
      this.onGround = true;
      this.jumping = false;
      this.airJumps = this.has('doubleJump') ? 1 : 0;
      this.hitstun = 0;
      this.invuln = 0;
      this.flash = 0;
      this.walk = 0;
      this.t = Math.random() * 10;
      const k = def.scale / 0.84;
      this.w = def.art === 'kangaroo' ? 50 * k : 46 * def.scale;
      this.h = def.art === 'kangaroo' ? 120 * k : 92 * def.scale;
      this.hitList = new Set();
      this.combo = 0;
      this.comboT = 0;
      this.jabs = 0;          // punches in a row (combo characters: the third is a hook)
      this.jabT = 0;
      this.counterT = 0;      // Tail Counter: kicks back this many seconds after a block
      this.counterCool = 0;
      this.powers = {};       // power-up name -> seconds left
      this.weapon = null;     // { id: 'gatling', ammo, max }
      this.grenades = opts.grenades !== undefined ? opts.grenades : MG.START_GRENADES;
      this.fireT = 0;
      this.muzzleT = 0;
      this.spin = 0;
      this.firing = false;
      this.hintT = 0;
      this.ctrl = {};
      this.alive = true;
    }

    has(ability) { return (this.def.abilities || []).includes(ability); }
    get box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    get canSpecial() { return this.meter >= SPECIAL_COST; }
    get ammo() { return this.weapon ? this.weapon.ammo : 0; }

    powerUp(type, secs) { this.powers[type] = secs || MG.POWER_TIME; }
    heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }
    giveWeapon(id, ammo) {
      if (this.weapon && this.weapon.id === id) this.weapon.ammo = Math.min(this.weapon.max, this.weapon.ammo + ammo);
      else this.weapon = { id, ammo, max: Math.max(100, ammo) };
    }
    giveGrenades(n) { this.grenades = Math.min(MG.MAX_GRENADES, this.grenades + n); }

    say(world, text, color = '#ffffff', size = 18) { world.fx.text(this.x, this.y - this.h - 18, text, color, size); }

    // ------------------------------------------------------------------
    update(dt, ctrl, world) {
      ctrl = ctrl || {};
      this.ctrl = ctrl;
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

      MG.Abilities.update(this, dt, ctrl, world);

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
        if (ctrl.down && this.onGround && !this.napping) {
          this.state = 'block';
          this.vx = approach(this.vx, 0, 2500 * dt);
        } else if (this.napping) {
          this.state = 'block';
          this.vx = 0;
        } else {
          this.state = 'idle';
          const firing = ctrl.shoot && this.weapon;
          const speed = this.def.speed * tea * (firing ? 0.55 : 1) * MG.Abilities.speed(this);
          const accel = (this.onGround ? 2400 : 1500) * tea * (this.sprintT > 0 ? 2 : 1);
          this.vx = approach(this.vx, dir * speed, accel * dt);
          if (dir && !firing && !this.autoFace) this.facing = dir;
          else if (dir && firing && !this.onGround && !this.autoFace) this.facing = dir;
        }
        if (ctrl.jumpP && this.state !== 'block') {
          if (this.onGround) {
            this.vy = -this.def.jump * (this.powers.tea ? 1.06 : 1);
            this.onGround = false;
            this.jumping = true;
            MG.Audio.hop();
          } else MG.Abilities.jump(this, ctrl, world);
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

      if (this.autoFace && this.state !== 'attack' && world.faceTarget) {
        const tx = world.faceTarget(this);
        if (tx !== null && Math.abs(tx - this.x) > 4) this.facing = tx > this.x ? 1 : -1;
      }

      if (Math.abs(this.vx) > 20 && this.onGround) {
        const before = Math.floor(this.walk);
        this.walk += dt * Math.abs(this.vx) * 0.0046;
        if (Math.floor(this.walk) !== before && this.def.art === 'kangaroo') MG.Audio.land();
      }
      this.physics(dt, world);
    }

    physics(dt, world) {
      const prevY = this.y;
      this.vy += GRAV * (world.gravity || 1) * dt;
      MG.Abilities.physics(this, dt, this.ctrl || {}, world);
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
      // cube-poo walls block the other side
      for (const w of world.walls ? world.walls() : []) {
        if (w.team === this.team || !U.overlap(this.box, w.box)) continue;
        this.x = this.x < w.x ? w.box.x - this.w / 2 : w.box.x + w.box.w + this.w / 2;
        this.vx = 0;
      }
    }

    onLand(world) {
      this.jumping = false;
      this.airJumps = this.has('doubleJump') ? 1 : 0;
      const m = this.move;
      const spec = m && m.kind === 'special' ? MG.SPECIALS[m.id] : null;
      if (spec && spec.land) spec.land(this, world, m);
      else if (Math.abs(this.vy) < 1 && this.def.art === 'kangaroo') MG.Audio.land();
    }

    // ------------------------------------------------------------------ moves
    startMove(name) {
      this.state = 'attack';
      this.move = { kind: name, def: this.moves[name], t: 0 };
      this.hitList.clear();
      if (this.onGround) this.vx *= 0.3;
    }

    startJab() {
      const combo = this.def.basic && this.def.basic.combo;
      this.jabs++;
      const hook = combo && this.jabs >= 3;
      this.startMove(hook ? 'hook' : 'jab');
      this.move.kind = 'jab';            // same pose; the hook just hits harder
      this.move.arm = this.jabs % 2;     // left, right, left...
      if (hook) this.jabs = 0;
      if (this.onGround) this.vx = this.facing * 240; // a little lunge, so a combo keeps connecting
    }

    startSpecial(world) {
      const spec = MG.SPECIALS[this.def.special];
      if (!spec) return;
      this.meter -= SPECIAL_COST;
      this.state = 'attack';
      this.move = { kind: 'special', id: this.def.special, t: 0, phase: 'start' };
      this.hitList.clear();
      MG.Audio.special();
      this.say(world, this.def.specialName + '!', '#00f5d4', 24);
      if (spec.start) spec.start(this, world, this.move);
    }

    tryGrenade(world) {
      if (this.grenades <= 0) {
        MG.Audio.emptyClick();
        if (this.hintT <= 0) { this.say(world, 'No grenades! Look for more', '#cccccc', 15); this.hintT = 1.5; }
        return;
      }
      this.startMove('pin');
    }

    // Kick a grenade lying near your feet (any player can kick any grenade).
    punt(g, kind) {
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
      const by = this.y - this.h * 0.36;
      const sup = this.powers.super ? 2 : 1;
      world.spawn(new MG.Projectile('gumnut', this.x + this.facing * 20, by + U.rand(-3, 3),
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
      const r = reach * Math.max(0.75, this.h / 120);
      return {
        x: this.facing > 0 ? this.x : this.x - r - this.w * 0.2,
        y: this.y - this.h * 0.85, w: r + this.w * 0.2, h: this.h * 0.8,
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
        const bane = this.has('rabbitBane') && target.type === 'rabbit' ? 1.5 : 1;
        const hit = {
          dmg: h.dmg * this.def.power * (sup ? 2 : 1) * bane, kbx: h.kbx * dir * kb * (sup ? 1.4 : 1),
          kby: h.kby * Math.sqrt(kb) * (sup ? 1.25 : 1), stun: h.stun, big: !!h.big, guardBreak: !!h.guardBreak, from: this, dir,
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
          if (bane > 1 && Math.random() < 0.3) world.fx.text(cx, cy - 60, 'BILBY BEATS BUNNY!', '#f6b3c4', 16);
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
      const finish = () => { this.state = 'idle'; this.move = null; };
      if (m.kind === 'special') {
        const spec = MG.SPECIALS[m.id];
        if (this.onGround && !['bound', 'diveBomb', 'burrow', 'screech'].includes(m.id)) this.vx = approach(this.vx, 0, 1800 * dt);
        if (!spec || spec.update(this, dt, ctrl, world, m)) { this.burrowed = false; this.playingDead = false; finish(); }
        return;
      }
      if (this.onGround) this.vx = approach(this.vx, 0, 1800 * dt);

      if (m.kind === 'jab' || m.kind === 'kick') {
        const d = m.def;
        if (m.kind === 'jab' && ctrl.attackP) m.queued = true; // mash away: the next punch is queued
        if (m.kind === 'kick' && m.t < d.startup && this.onGround) this.vx = approach(this.vx, this.facing * 60, 600 * dt);
        // some big moves hit twice (Benny's hopping double kick)
        const hits = d.hits || 1;
        const span = d.active / hits;
        if (m.t >= d.startup && m.t < d.startup + d.active) {
          const n = Math.min(hits - 1, Math.floor((m.t - d.startup) / span));
          if (n !== m.hitN) { if (m.hitN !== undefined) { this.hitList.clear(); MG.Audio.whiff(); } m.hitN = n; }
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
      }
    }

    // ------------------------------------------------------------------ getting hit
    takeHit(hit, world) {
      if (this.state === 'ko' || this.invuln > 0 || this.playingDead || this.burrowed) return 'miss';
      if (this.powers.shield) {
        this.vx = hit.kbx * 0.2;
        MG.Audio.tone(300, 0.2, 'sine', 0.3, 700);
        world.fx.burst(this.x, this.y - this.h * 0.5, '#52b788', 8, 200);
        this.say(world, 'BOING! (gumleaf shield)', '#b7e4c7', 16);
        return 'blocked';
      }
      hit = MG.Abilities.hit(this, Object.assign({}, hit), world);
      if (hit === 'miss') return 'miss';
      if (hit.wakeUp) { this.napT = 0; this.napping = false; this.say(world, 'WHA-? I\'M AWAKE!', '#bde0fe', 16); }
      const facingAttacker = hit.from ? (hit.from.x - this.x) * this.facing > 0 : true;
      if (this.state === 'block' && !hit.wakeUp && facingAttacker && !hit.poison) {
        if (hit.guardBreak) {
          this.say(world, 'GUARD CRUNCHED!', '#ff4d6d', 18);
        } else {
          this.hp -= hit.dmg * 0.12;
          this.vx = hit.kbx * 0.3;
          MG.Audio.block();
          world.fx.burst(this.x + this.facing * 26, this.y - this.h * 0.6, '#9bf6ff', 6, 150);
          if (this.has('tailCounter') && this.counterCool <= 0 && this.counterT <= 0) this.counterT = 0.1;
          else this.say(world, 'BLOCKED', '#9bf6ff', 16);
          if (this.hp <= 0) this.knockOut(world);
          return 'blocked';
        }
      }
      if (hit.armour) {
        // super armour: it hurts, but it doesn't stop him
        this.hp -= hit.dmg;
        this.vx += hit.kbx * 0.12 / this.def.weight;
        this.flash = 0.1;
        this.meter = Math.min(SPECIAL_COST, this.meter + 6);
        MG.Audio.hurt();
        if (Math.random() < 0.3) this.say(world, U.choice(['*shrug*', 'TICKLES!', 'IS THAT ALL?']), '#ffd23f', 16);
        if (this.mercy) this.invuln = this.mercy;
        if (this.hp <= 0) this.knockOut(world);
        return 'hit';
      }
      this.hp -= hit.dmg;
      if (hit.poison) {
        // a cough, not a knockdown
        this.flash = 0.1;
        if (this.hp <= 0) this.knockOut(world);
        return 'hit';
      }
      this.vx = hit.kbx / this.def.weight;
      this.vy = hit.kby / this.def.weight;
      this.onGround = false;
      this.flash = 0.1;
      this.meter = Math.min(SPECIAL_COST, this.meter + 6);
      this.move = null;
      this.burrowed = false;
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
      this.burrowed = false;
      this.playingDead = false;
      this.vy = -420;
      this.vx = (this.vx >= 0 ? 1 : -1) * 260;
      MG.Audio.ko();
      world.fx.shake(14);
    }

    // ------------------------------------------------------------------ drawing
    // How far an attack is out (0..1) at time t.
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
      let jab = 0, kick = 0, crouch = 0, sp = null;
      if (m && m.kind === 'jab') jab = this.swingAmount(m.def, m.t);
      if (m && m.kind === 'kick') kick = this.swingAmount(m.def, m.t);
      if (m && m.kind === 'punt') kick = m.t < 0.12 ? 0.75 : Math.max(0, 0.75 - (m.t - 0.12) * 5);
      if (m && m.kind === 'special') {
        const spec = MG.SPECIALS[m.id];
        sp = spec && spec.pose ? spec.pose(this, m) : null;
        if (sp && sp.crouch) crouch = sp.crouch;
      }
      // Benny's double kick: the legs go out twice
      if (m && m.kind === 'kick' && m.def.hits > 1 && kick === 1) kick = 0.6 + 0.4 * Math.abs(Math.cos((m.t - m.def.startup) / m.def.active * Math.PI * m.def.hits));
      const r2 = (v) => Math.round(v * 100) / 100;
      return {
        cid: this.def.id, x: Math.round(this.x * 10) / 10, y: Math.round(this.y * 10) / 10, f: this.facing,
        pose, t: r2(this.t), walk: r2(this.walk), jab: r2(jab), ja: m && m.kind === 'jab' ? m.arm : 0,
        kick: r2(kick), cr: r2(crouch),
        mo: this.state === 'attack' ? 'open' : this.state === 'hurt' ? 'ouch' : 0,
        fl: this.flash > 0 ? 1 : 0,
        gun: this.weapon && ['idle', 'block'].includes(this.state) ? 1 : 0, mz: this.muzzleT > 0 ? 1 : 0, sp: r2(this.spin),
        hold: m && m.kind === 'pin' && !m.fired ? 1 : 0,
        hide: this.invuln > 0.1 && !this.burrowed && !(m && m.kind === 'special') && Math.floor(this.t * 20) % 2 === 0 ? 1 : 0,
        ps: r2(this.powers.shield || 0), su: this.powers.super ? 1 : 0, tea: this.powers.tea || this.sprintT > 0 ? 1 : 0,
        vx: Math.round(this.vx), st: this.state, tag: this.tag || 0, tc: this.tagColor || 0, coat: this.coat || 0,
        mk: m ? m.kind : 0, og: this.onGround ? 1 : 0, fi: this.firing ? 1 : 0,
        // art hints for specials and traits
        x1: sp ? JSON.stringify(sp) : 0,
        gl: this.gliding ? 1 : 0, np: this.napping ? 1 : 0, cl: this.cling || 0,
      };
    }

    draw(ctx, world) { MG.Fighter.drawState(ctx, this.renderState(), world); }

    static drawState(ctx, s, world) {
      const def = MG.charById(s.cid);
      const h = def.art === 'kangaroo' ? 120 * def.scale / 0.84 : 92 * def.scale;
      const w = def.art === 'kangaroo' ? 50 * def.scale / 0.84 : 46 * def.scale;
      const floor = world.floorBelow ? world.floorBelow(s.x, s.y) : world.groundY;
      s = Object.assign({ t: 0, walk: 0, vx: 0, f: 1 }, s); // Wi-Fi updates leave out zeros
      let sp = {};
      if (s.x1) { try { sp = JSON.parse(s.x1); } catch (e) { sp = {}; } }
      if (sp.hidden) { MG.Art.burrowMound(ctx, s.x, floor, s.t); return; }
      MG.Art.shadow(ctx, s.x, floor, 36 * (w / 50) * Math.max(0.4, 1 - (floor - s.y) / 400));
      if (s.tag && s.pose !== 'ko') {
        const ty = s.y - h * 1.32 + Math.sin(s.t * 4) * 3;
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
      const coat = s.coat ? MG.coatFor(def, s.coat) : null;
      const basicStyle = sp.basicStyle || (def.basic && def.basic.style) || 'punch';
      const bigStyle = sp.bigStyle || (def.big && def.big.style) || 'kick';
      const basicAmt = sp.basic !== undefined ? sp.basic : s.jab;
      const bigAmt = sp.big !== undefined ? sp.big : s.kick;
      const common = {
        x: s.x, y: s.y, facing: s.f, scale: def.scale, t: s.t, pose: s.np ? 'block' : s.pose, walk: s.walk,
        mouth: s.mo || sp.mouth || undefined, flash: !!s.fl, gun: !!s.gun, muzzle: !!s.mz, spin: s.sp,
        holding: s.hold ? 'grenade' : sp.holding || null, crouch: s.cr || 0, colors: coat,
      };
      if (def.art === 'kangaroo') {
        // kangaroo family: punches use the arms, kicks lean back on the tail
        const punchy = basicStyle === 'punch';
        const haymaker = bigStyle === 'haymaker';
        MG.Art.character(ctx, def, Object.assign(common, {
          jab: punchy ? basicAmt : haymaker ? bigAmt : 0, jabArm: haymaker ? 1 : s.ja,
          kick: sp.kick !== undefined ? sp.kick : (!punchy ? basicAmt * 0.7 : 0) + (!haymaker ? bigAmt : 0),
          mouth: sp.screech ? 'open' : common.mouth,
        }));
      } else {
        MG.Art.character(ctx, def, Object.assign(common, {
          basic: basicAmt, basicStyle, big: bigAmt, bigStyle,
          glide: !!s.gl || !!sp.glide, dive: !!sp.dive, dead: !!sp.dead, nap: !!s.np, screech: !!sp.screech, tongue: !!sp.tongue,
        }));
      }
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

  // ---------- Projectiles: gumnuts, shockwaves, and the things specials throw ----------
  // hit options: dmg, stun, kbx, kby, big, pierce, props (can hit crates), life, gravity,
  //   ground (rolls along the ground), still (doesn't move), radius + tick (an area that hits
  //   again every tick seconds), bounce + friction (bounces, then rolls), wall (becomes a little
  //   wall for that many seconds once it stops), pull (yanks what it hits toward that fighter),
  //   grab (pulls pickups too), poison, scare (pests run away)
  const PROJ_WORD = { gumnut: 'POK!', dust: 'WHUMP!', cube: 'PLOP!', wave: 'SPLOOSH!', wallaby: 'STAMPEDE!', bin: 'CLANG!', tongue: 'SLURP!', stink: 'COUGH!' };
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
      this.hitAt = new Map();
      this.wall = false;
      this.x0 = x; this.y0 = y;
    }
    get box() {
      if (this.wall || this.kind === 'cube') return { x: this.x - 13, y: this.y - 26, w: 26, h: 26 };
      if (this.kind === 'bin') return { x: this.x - 20, y: this.y - 48, w: 40, h: 48 };
      if (this.kind === 'wallaby') return { x: this.x - 26, y: this.y - 80, w: 52, h: 80 };
      if (this.kind === 'dust' || this.kind === 'wave') return { x: this.x - 24, y: this.y - 46, w: 48, h: 48 };
      if (this.hit.radius) return { x: this.x - this.hit.radius, y: this.y - this.hit.radius * 0.7, w: this.hit.radius * 2, h: this.hit.radius * 1.4 };
      return { x: this.x - 10, y: this.y - 14, w: 20, h: 28 };
    }

    update(dt, world) {
      this.t += dt;
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        if (this.kind === 'bin') { world.fx.burst(this.x, this.y - 20, '#52b788', 14, 260); world.fx.text(this.x, this.y - 60, 'RUBBISH!', '#ffffff', 20); }
        return;
      }
      if (this.wall) return;   // a settled cube is just a little wall now
      if (!this.hit.still) {
        this.vy += this.gravity * (world.gravity || 1) * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
      }
      if (this.hit.bounce !== undefined) {
        const floor = world.groundY;
        if (this.y >= floor) {
          this.y = floor;
          if (this.vy > 200) { this.vy = -this.vy * this.hit.bounce; this.vx *= 0.75; MG.Audio.tone(220, 0.05, 'square', 0.08); }
          else this.vy = 0;
          this.vx *= Math.pow(0.02, dt * (this.hit.friction || 1));
          if (this.hit.wall && Math.abs(this.vx) < 30 && this.vy === 0) { this.wall = true; this.life = this.hit.wall; return; }
        }
      } else if (!this.hit.ground && !this.hit.still && this.y >= world.groundY - 4) {
        this.dead = true;
        world.fx.burst(this.x, world.groundY - 4, '#8a5a2b', 4, 120);
        return;
      }
      // the tongue grabs pickups on the way
      if (this.hit.grab && world.grabPickup && world.grabPickup(this.box, this.hit.pull)) { this.dead = true; return; }
      for (const target of world.targets(this.team)) {
        if (!target.alive || (target.isProp && !this.hit.props)) continue;
        if (this.hit.tick) {
          const last = this.hitAt.get(target);
          if (last !== undefined && this.t - last < this.hit.tick) continue;
        } else if (this.hitList.has(target)) continue;
        const b = target.box;
        const inside = this.hit.radius
          ? Math.hypot(target.x - this.x, (b.y + b.h / 2) - this.y) < this.hit.radius + b.w * 0.4
          : U.overlap(this.box, b);
        if (!inside) continue;
        this.hitList.add(target);
        this.hitAt.set(target, this.t);
        const dir = this.vx !== 0 ? Math.sign(this.vx) : (target.x >= this.x ? 1 : -1);
        const h = this.hit;
        const res = target.takeHit({
          dmg: h.dmg, kbx: (h.kbx || 0) * dir, kby: h.kby || 0, stun: h.stun || 0.3, big: !!h.big, from: this, dir,
          poison: !!h.poison, scare: h.scare || 0,
        }, world);
        if (res === 'miss') continue;
        if (h.pull) {
          // yank it over to the tongue's owner
          target.vx = (h.pull.x + h.pull.facing * 55 - target.x) * 4.5;
          if (target.vy !== undefined) target.vy = -220;
        }
        if (!h.tick || Math.random() < 0.15) {
          world.fx.burst(this.x, this.y, h.poison ? '#9ef01a' : '#ffd23f', this.kind === 'gumnut' ? 5 : 10);
          if (this.kind !== 'gumnut' || Math.random() < 0.3) world.fx.text(target.x, b.y - 10, PROJ_WORD[this.kind] || 'BONK!', '#ffffff', this.kind === 'gumnut' ? 16 : 22);
        }
        if (h.pierce || h.tick) continue;
        this.dead = true;
        break;
      }
    }

    draw(ctx) { MG.Art.projectile(ctx, this.kind, this.x, this.y, this.t, Math.sign(this.vx) || 1, this); }
  };
})();
