// The pests (docs/VILLAINS.md), crates and pickups. Pattern from Sloth Slap's enemies.
(function () {
  const U = MG.U;
  const GRAV = 1900;

  const TYPES = {
    // European rabbits: small, fast, hop in swarms, and eat power-ups they find
    rabbit: { art: 'rabbit', behavior: 'swarmer', hp: 11, speed: 185, w: 34, h: 34, dmg: 5, score: 100, eats: true },
    // feral cats: hide in long grass, then pounce
    cat: { art: 'cat', behavior: 'ambusher', hp: 26, speed: 170, w: 56, h: 40, dmg: 9, score: 250 },
    // feral pigs: snort, then charge
    pig: { art: 'pig', behavior: 'charger', hp: 46, speed: 95, w: 80, h: 56, dmg: 13, score: 350, weight: 2 },
    // cane toads (world 3): slow high hops; poisonous, so touching one stings and a knocked-out
    // toad leaves a little poison puff (Dead Fred doesn't mind)
    toad: { art: 'toad', behavior: 'hopper', hp: 18, speed: 120, w: 36, h: 30, dmg: 6, score: 150, poison: true },
    // mini-boss of the first map: a giant buck rabbit
    bigBuck: {
      art: 'rabbit', behavior: 'boss', boss: true, hp: 320, speed: 210, w: 96, h: 100, dmg: 14, score: 3000,
      scale: 3, weight: 3.5, name: 'BIG BUCK', colors: { fur: '#7d6a5a', dark: '#574739' }, bandana: true,
      moves: ['leap', 'thump', 'dash', 'leap', 'dash'], defeatText: 'BIG BUCK IS OUT FOR THE COUNT!',
    },
    // ---- world bosses (Milestone 6). minion = what they call in.
    warrenWarlord: {
      art: 'rabbit', behavior: 'boss', boss: true, hp: 520, speed: 220, w: 112, h: 118, dmg: 15, score: 6000,
      scale: 3.6, weight: 4, name: 'WARREN WARLORD', colors: { fur: '#8a8278', dark: '#5f574e' }, warlord: true, minion: 'rabbit',
      moves: ['leap', 'thump', 'dash', 'burrow', 'leap', 'dash', 'burrow'], defeatText: 'THE WARREN WARLORD IS DETHRONED!',
    },
    bigTom: {
      art: 'cat', behavior: 'boss', boss: true, hp: 560, speed: 230, w: 150, h: 108, dmg: 16, score: 7000,
      scale: 2.7, weight: 4, name: 'BIG TOM', bigTom: true, minion: 'cat',
      moves: ['pounce', 'swipe', 'yowl', 'hide', 'pounce', 'swipe', 'hide'], defeatText: 'BIG TOM USED UP ALL NINE LIVES!',
    },
    toadKing: {
      art: 'toad', behavior: 'boss', boss: true, hp: 640, speed: 160, w: 118, h: 96, dmg: 15, score: 8000,
      scale: 3.2, weight: 5, name: 'CANE TOAD KING', crown: true, minion: 'toad', poison: true,
      moves: ['hop', 'tongue', 'poison', 'spawn', 'hop', 'tongue', 'poison'], defeatText: 'THE CANE TOAD KING HAS CROAKED!',
    },
  };
  MG.ENEMY_TYPES = TYPES;

  // How each pest splatters and the silly noise it makes when it's knocked out.
  const GORE = {
    rabbit: { blood: '#d62828', sound: 'squeak', word: 'EEP!' },
    cat: { blood: '#d62828', sound: 'yowl', word: 'MROWR!' },
    pig: { blood: '#d62828', sound: 'oink', word: 'OINK?!' },
    toad: { blood: '#d62828', sound: 'bloop', word: 'CROAK!' },
  };

  MG.Enemy = class {
    constructor(type, x, y, opts = {}) {
      const d = (this.d = TYPES[type]);
      this.type = type;
      this.x = x;
      this.homeX = x;
      this.y = y !== undefined ? y : MG.GROUND_Y;
      this.vx = 0; this.vy = 0;
      this.hp = d.hp; this.maxHp = d.hp;
      this.facing = -1;
      this.alive = true;
      this.dying = 0;
      this.hurt = 0;
      this.flash = 0;
      this.cool = U.rand(0.4, 1.2);
      this.state = 'idle';
      this.stateT = 0;
      this.t = Math.random() * 10;
      this.spin = 0;
      this.isBoss = !!d.boss;
      this.team = 'enemy';
      this.onGround = true;
      this.hidden = d.behavior === 'ambusher' && opts.hidden !== false;
      this.offset = U.rand(-36, 36); // swarmers spread out around their target
      this.zone = 0;
    }

    get box() { return { x: this.x - this.d.w / 2, y: this.y - this.d.h, w: this.d.w, h: this.d.h }; }

    // A hiding cat comes out (when found, or when the players reach the gate).
    wake(world) {
      if (!this.hidden) return;
      this.hidden = false;
      this.state = 'crouch';
      this.stateT = 0;
      world.fx.text(this.x, this.y - 60, 'HISSS!', '#d4e157', 22);
      MG.Audio.hiss();
    }

    takeHit(hit, world) {
      if (!this.alive || this.burrowed || this.lurking) return 'miss'; // a boss underground or hiding can't be hit
      if (this.hidden) this.wake(world);
      if (hit.scare && !this.isBoss) { this.fleeT = hit.scare; this.fleeFrom = hit.from ? hit.from.x : this.x; }
      if (hit.poison && this.hp - hit.dmg > 0) {
        // a cough, not a knockdown (so they can still run away)
        this.hp -= hit.dmg;
        this.flash = 0.1;
        return 'hit';
      }
      this.hp -= hit.dmg;
      this.flash = 0.1;
      const w = this.d.weight || 1;
      if (this.isBoss) {
        // the boss shrugs off small hits (no knockback), big ones push it a little
        this.hurt = hit.big ? 0.18 : 0.05;
        if (hit.big) this.vx = hit.kbx / w;
      } else {
        this.hurt = hit.big ? 0.6 : 0.35;
        this.vx = hit.kbx / w;
        this.vy = hit.kby / w;
        this.onGround = false;
        this.state = 'idle';
      }
      const g = GORE[this.d.art] || GORE.rabbit;
      const cy = this.y - this.d.h * 0.55;
      world.fx.gore(this.x, cy, g.blood, hit.big ? 9 : 4, world.groundY);
      if (this.hp <= 0) {
        world.fx.gore(this.x, cy, g.blood, this.isBoss ? 60 : 22, world.groundY);
        world.fx.splat(this.x, world.groundY, g.blood, this.isBoss ? 60 : 24);
        world.fx.text(this.x + 30, cy - 40, g.word, '#ffffff', 26);
        MG.Audio.funnyDeath(g.sound);
        if (this.isBoss) MG.Audio.funnyDeath('boss');
        if (world.addPickup && !this.isBoss) {
          const r = Math.random();
          if (r < 0.07) world.addPickup('heart', this.x, world.groundY);
          else if (r < 0.13) world.addPickup('grenades', this.x, world.groundY);
        }
        // a cane toad's poison: a little cloud where it fell
        if (this.d.poison && !this.isBoss && world.spawn) {
          world.spawn(new MG.Projectile('stink', this.x, this.y - 20, 0, 0, 'enemy', { dmg: 2, poison: true, radius: 55, tick: 0.5, life: 1.8, still: true, pierce: true }));
        }
        this.alive = false;
        this.dying = 1.2;
        this.vx = (hit.dir || 1) * U.rand(500, 700);
        this.vy = -U.rand(600, 800);
        world.fx.text(this.x, this.y - this.d.h - 20, '+' + this.d.score, '#ffd23f', 24);
        if (world.onEnemyKilled) world.onEnemyKilled(this, hit);
      }
      return 'hit';
    }

    update(dt, world, player) {
      this.t += dt;
      this.flash -= dt;
      if (!this.alive) {
        this.dying -= dt;
        this.spin += dt * 14;
        this.vy += GRAV * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        return;
      }
      this.touchT = (this.touchT || 0) - dt;
      const dx = player.x - this.x;
      const dist = Math.abs(dx);
      if (this.hurt > 0) {
        this.hurt -= dt;
        if (!this.isBoss) this.vx *= Math.pow(0.02, dt);
      } else {
        this.cool -= dt;
        this.stateT += dt;
        this.think(dt, world, player, dx, dist);
      }
      this.physics(dt, world);
    }

    physics(dt, world) {
      const prevY = this.y;
      this.vy += GRAV * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const was = this.onGround;
      this.onGround = false;
      if (this.y >= world.groundY) { this.y = world.groundY; this.vy = 0; this.onGround = true; }
      else if (this.vy > 0 && this.d.behavior !== 'boss') {
        for (const p of world.platforms || []) {
          if (prevY <= p.y + 1 && this.y >= p.y && this.x > p.x && this.x < p.x + p.w) { this.y = p.y; this.vy = 0; this.onGround = true; break; }
        }
      }
      if (this.onGround && !was) this.onLand(world);
      const b = world.enemyBounds ? world.enemyBounds(this) : null;
      if (b) this.x = U.clamp(this.x, b.min, b.max);
      for (const w of world.walls ? world.walls() : []) {
        if (!this.alive || !U.overlap(this.box, w.box)) continue;
        if (this.isBoss) { w.life = 0; world.fx.burst(w.x, w.y - 13, '#6b4a2e', 10, 220); continue; }
        this.x = this.x < w.x ? w.box.x - this.d.w / 2 : w.box.x + w.box.w + this.d.w / 2;
        this.vx = 0;
      }
    }

    onLand(world) {
      if (this.d.behavior === 'swarmer' || this.d.behavior === 'ambusher' || this.d.behavior === 'hopper') this.vx *= 0.25;
      if (this.isBoss && this.state === 'pounce') { this.state = 'idle'; this.stateT = 0; this.vx = 0; this.cool = this.enraged ? 0.5 : 0.9; world.fx.shake(8); return; }
      if (this.isBoss && this.state === 'leap') {
        // Big Buck lands: shockwave
        this.state = 'idle';
        this.stateT = 0;
        this.cool = this.enraged ? 0.5 : 0.9;
        this.vx = 0;
        MG.Audio.thump();
        world.fx.shake(16);
        world.fx.ring(this.x, this.y, 240, '#c9b48a');
        world.fx.burst(this.x, this.y, '#d69669', 22, 380);
        for (const f of world.fighters || []) {
          if (f.state !== 'ko' && f.onGround && Math.abs(f.x - this.x) < 170) {
            f.takeHit({ dmg: this.d.dmg, kbx: (f.x >= this.x ? 1 : -1) * 480, kby: -480, stun: 0.5, big: true, from: this }, world);
          }
        }
        for (const d of [-1, 1]) {
          world.spawn(new MG.Projectile('dust', this.x + d * 70, this.y - 4, d * 480, 0, 'enemy',
            { dmg: 8, stun: 0.4, kbx: 300, kby: -360, pierce: true, ground: true, life: 0.6 }));
        }
      }
    }

    // Touching a player hurts them (its own timer, so it never delays the pest's next move).
    contact(world, player, mult = 1) {
      if (this.touchT > 0 || player.state === 'ko' || this.hidden) return;
      if (U.overlap(this.box, player.box)) {
        const res = player.takeHit({ dmg: this.d.dmg * mult, kbx: Math.sign(player.x - this.x || 1) * 320, kby: -260, stun: 0.4, from: this, poison: !!this.d.poison && !this.isBoss }, world);
        if (res !== 'miss') this.touchT = 0.9;
        // running into a block stops a charge or pounce dead (and sets up Boomer's Tail Counter)
        if (res === 'blocked' && ['charge', 'dash', 'pounce'].includes(this.state)) {
          this.state = 'idle';
          this.stateT = 0;
          this.vx = -Math.sign(player.x - this.x || 1) * 260;
          this.hurt = this.isBoss ? 0.3 : 0.6;
          world.fx.text(this.x, this.y - this.d.h - 10, 'BONK!', '#9bf6ff', 22);
        }
      }
    }

    think(dt, world, player, dx, dist) {
      const d = this.d;
      const dir = Math.sign(dx) || 1;
      // coughing in a stink cloud: run away from it
      if (this.fleeT > 0) {
        this.fleeT -= dt;
        const away = this.x >= this.fleeFrom ? 1 : -1;
        this.facing = away;
        this.vx = away * d.speed * 1.2;
        if (Math.random() < dt * 2) world.fx.text(this.x, this.y - d.h - 10, 'COUGH!', '#9ef01a', 16);
        return;
      }

      if (d.behavior === 'swarmer') {
        // small quick hops toward the player, or toward a power-up to eat
        let tx = player.x + this.offset;
        const food = d.eats && world.edibles ? world.edibles().find((p) => Math.abs(p.x - this.x) < 240 && Math.abs(p.x - this.x) < dist) : null;
        if (food) tx = food.x;
        const tdir = Math.sign(tx - this.x) || dir;
        this.facing = tdir;
        if (food && Math.abs(food.x - this.x) < 18 && Math.abs(food.y - this.y) < 40) world.eatPickup(food, this);
        this.hopT = (this.hopT || 0) - dt;
        if (this.onGround && this.hopT <= 0 && (dist < 640 || food || this.aggro)) {
          this.vy = -U.rand(250, 360);
          this.vx = tdir * d.speed * U.rand(0.8, 1.2);
          this.onGround = false;
          this.hopT = U.rand(0.15, 0.4);
        }
        this.contact(world, player);
      } else if (d.behavior === 'hopper') {
        // cane toads: big slow hops toward the player
        this.facing = dir;
        this.hopT = (this.hopT === undefined ? U.rand(0, 0.6) : this.hopT) - dt;
        if (this.onGround && this.hopT <= 0 && (dist < 600 || this.aggro)) {
          this.vy = -U.rand(360, 460);
          this.vx = dir * d.speed * U.rand(0.8, 1.3);
          this.onGround = false;
          this.hopT = U.rand(0.6, 1.1);
        }
        this.contact(world, player);
      } else if (d.behavior === 'ambusher') {
        if (this.hidden) {
          this.vx = 0;
          if (dist < 170 && Math.abs(player.y - this.y) < 120) this.wake(world);
          return;
        }
        if (this.state === 'crouch') {
          this.facing = dir;
          this.vx = 0;
          if (this.stateT > 0.35) {
            this.state = 'pounce';
            this.stateT = 0;
            this.vy = -540;
            this.vx = dir * Math.min(Math.max(dist * 2.1, 260), 640);
            this.onGround = false;
            MG.Audio.whiff();
          }
        } else if (this.state === 'pounce') {
          this.contact(world, player, 1.2);
          if (this.onGround && this.stateT > 0.1) { this.state = 'prowl'; this.stateT = 0; this.cool = U.rand(0.8, 1.4); }
        } else {
          this.state = 'prowl';
          this.facing = dir;
          this.vx = dist > 50 ? dir * d.speed : 0;
          if (this.cool <= 0 && dist > 90 && dist < 300) { this.state = 'crouch'; this.stateT = 0; }
          this.contact(world, player);
        }
      } else if (d.behavior === 'charger') {
        // stop, snort "!", then charge straight ahead (smashing crates on the way)
        if (this.state === 'windup') {
          this.vx = 0;
          if (this.stateT > 0.6) { this.state = 'charge'; this.stateT = 0; this.chargeDir = dir; MG.Audio.whiff(); }
        } else if (this.state === 'charge') {
          this.facing = this.chargeDir;
          this.vx = this.chargeDir * d.speed * 3.4;
          this.contact(world, player, 1.25);
          for (const c of world.crates || []) {
            if (c.alive && U.overlap(this.box, c.box)) c.takeHit({ dmg: 99, blast: true, dir: this.chargeDir }, world);
          }
          const b = world.enemyBounds ? world.enemyBounds(this) : null;
          if (this.stateT > 1.1 || (b && (this.x <= b.min + 1 || this.x >= b.max - 1))) {
            this.state = 'idle'; this.stateT = 0; this.vx = 0; this.cool = U.rand(1.2, 2);
          }
        } else {
          this.facing = dir;
          // called to a gate: trot over fast until close; otherwise amble toward the player
          this.vx = this.aggro && dist > 300 ? dir * d.speed * 1.6 : dist < 520 ? dir * d.speed * 0.45 : 0;
          if (dist < 420 && Math.abs(player.y - this.y) < 80 && this.cool <= 0) {
            this.state = 'windup';
            this.stateT = 0;
            world.fx.text(this.x, this.y - d.h - 16, '!', '#ff4d6d', 32);
            MG.Audio.snort();
          }
          this.contact(world, player, 0.7);
        }
      } else if (d.behavior === 'boss') {
        this.bossThink(dt, world, player, dx, dist, dir);
      }
    }

    // Big Buck: leap and slam, foot-thump to call the warren, and bounding dashes.
    bossThink(dt, world, player, dx, dist, dir) {
      const d = this.d;
      if (!this.enraged && this.hp < this.maxHp * 0.4) {
        this.enraged = true;
        world.fx.text(this.x, this.y - d.h - 40, d.name + ' IS FURIOUS!', '#ff4d6d', 30);
        MG.Audio.thump();
      }
      const fast = this.enraged ? 1.25 : 1;
      if (this.state === 'idle') {
        this.facing = dir;
        this.hopT = (this.hopT || 0) - dt;
        if (this.onGround && this.hopT <= 0 && dist > 120) {
          this.vy = -380;
          this.vx = dir * 200 * fast;
          this.onGround = false;
          this.hopT = 0.45;
        } else if (this.onGround) this.vx *= Math.pow(0.01, dt);
        this.contact(world, player);
        if (this.cool <= 0 && this.onGround) {
          this.moveI = ((this.moveI === undefined ? -1 : this.moveI) + 1) % d.moves.length;
          this.state = d.moves[this.moveI] + 'Wind';
          this.stateT = 0;
          this.vx = 0;
          const SAY = { leapWind: 'HUP!', hopWind: 'RIBBIT!', dashWind: '!', pounceWind: '!', burrowWind: 'DIG DIG DIG!', swipeWind: 'HISSS!', yowlWind: 'MROWWWL!', hideWind: '...', tongueWind: 'SLURP?', poisonWind: 'PUFF!', spawnWind: 'CROAK CROAK!' };
          const loud = this.state === 'dashWind' || this.state === 'pounceWind';
          if (SAY[this.state]) world.fx.text(this.x, this.y - d.h - 20, SAY[this.state], loud ? '#ff4d6d' : '#ffd23f', loud ? 40 : 26);
        }
      } else if (this.state === 'leapWind' || this.state === 'hopWind') {
        this.vx = 0;
        if (this.stateT > 0.45 / fast) {
          this.state = 'leap';
          this.stateT = 0;
          this.vy = -980;
          this.vx = U.clamp(dx / 1.0, -720, 720);
          this.onGround = false;
          MG.Audio.hop();
        }
      } else if (this.state === 'leap') {
        if (this.stateT > 3) this.state = 'idle'; // safety; landing is handled in onLand
      } else if (this.state === 'thumpWind') {
        // rabbits really thump a hind foot to warn the warren
        this.vx = 0;
        const beat = Math.floor(this.stateT / 0.3);
        if (beat !== this.beat && beat < 3) {
          this.beat = beat;
          MG.Audio.thump();
          world.fx.shake(6);
          world.fx.text(this.x - 30 * this.facing, this.y - 30, 'THUMP!', '#ffffff', 22);
        }
        if (this.stateT > 1.0) {
          this.beat = -1;
          const n = this.enraged ? 4 : 3;
          const made = world.spawnMinions ? world.spawnMinions(d.minion || 'rabbit', n) : world.spawnWarren ? world.spawnWarren(n) : 0;
          if (made) world.fx.text(this.x, this.y - d.h - 30, 'THE WARREN ANSWERS!', '#ffd23f', 24);
          this.state = 'idle';
          this.cool = this.enraged ? 0.8 : 1.4;
        }
      } else if (this.state === 'dashWind') {
        this.vx = 0;
        this.facing = dir;
        if (this.stateT > 0.5 / fast) { this.state = 'dash'; this.stateT = 0; this.dashDir = dir; MG.Audio.whiff(); }
      } else if (this.state === 'dash') {
        this.facing = this.dashDir;
        this.vx = this.dashDir * d.speed * 2.6 * fast;
        if (this.onGround && Math.random() < dt * 8) { this.vy = -220; this.onGround = false; }
        this.contact(world, player, 1.2);
        const b = world.enemyBounds ? world.enemyBounds(this) : null;
        if (this.stateT > 1.1 || (b && (this.x <= b.min + 1 || this.x >= b.max - 1))) {
          this.state = 'idle'; this.stateT = 0; this.vx = 0; this.cool = this.enraged ? 0.6 : 1.1;
        }
      } else if (!this.worldBossMove(dt, world, player, dx, dist, dir, fast)) {
        this.state = 'idle';
      }
    }

    // The world bosses' own moves (Milestone 6). Returns false when the state isn't one of them.
    worldBossMove(dt, world, player, dx, dist, dir, fast) {
      const d = this.d, s = this.state;
      const players = (world.fighters || []).filter((f) => f.state !== 'ko');
      if (s === 'burrowWind' || s === 'hideWind') {
        // dig in (the Warlord) or slink into the undergrowth (Big Tom)
        this.vx = 0;
        if (this.stateT > 0.4 / fast) {
          this.state = s === 'burrowWind' ? 'burrow' : 'hide';
          this.stateT = 0;
          if (s === 'burrowWind') this.burrowed = true; else this.lurking = true;
          world.fx.burst(this.x, this.y - 10, s === 'burrowWind' ? '#9c4a2a' : '#2d6a4f', 20, 300);
        }
      } else if (s === 'burrow') {
        // tunnels toward the player, then bursts up underneath
        this.vx = Math.sign(dx) * Math.min(dist * 3, 320 * fast);
        if (this.stateT > 1.4 || (this.stateT > 0.5 && dist < 30)) {
          this.burrowed = false;
          this.state = 'leap';
          this.stateT = 0;
          this.vy = -820; this.vx = 0; this.onGround = false;
          MG.Audio.thump();
          world.fx.burst(this.x, this.y, '#9c4a2a', 30, 420);
          world.fx.text(this.x, this.y - d.h - 30, 'SURPRISE!', '#ff4d6d', 30);
          for (const f of players) if (Math.abs(f.x - this.x) < 110) f.takeHit({ dmg: d.dmg * 1.2, kbx: (f.x >= this.x ? 1 : -1) * 300, kby: -900, stun: 0.7, big: true, from: this }, world);
        }
      } else if (s === 'hide') {
        // only glowing eyes in the dark... then he's right next to you
        this.vx = 0;
        if (this.stateT > 1.1 / fast) {
          const b = world.enemyBounds ? world.enemyBounds(this) : { min: this.x - 400, max: this.x + 400 };
          const side = Math.random() < 0.5 ? -1 : 1;
          this.x = U.clamp(player.x + side * 260, b.min, b.max);
          this.lurking = false;
          this.state = 'pounceWind';
          this.stateT = 0.2;
          world.fx.text(this.x, this.y - d.h - 20, 'GOTCHA!', '#ff4d6d', 30);
          MG.Audio.hiss();
        }
      } else if (s === 'pounceWind') {
        this.vx = 0; this.facing = dir;
        if (this.stateT > 0.45 / fast) {
          this.state = 'pounce'; this.stateT = 0;
          this.vy = -640; this.vx = U.clamp(dx / 0.7, -820, 820); this.onGround = false;
          MG.Audio.whiff();
        }
      } else if (s === 'pounce') {
        this.contact(world, player, 1.3);
        if (this.stateT > 2.5) this.state = 'idle';
      } else if (s === 'swipeWind') {
        this.vx = 0; this.facing = dir;
        if (this.stateT > 0.35 / fast) {
          for (const dy of this.enraged ? [-30, 10] : [-10]) {
            world.spawn(new MG.Projectile('claw', this.x + dir * d.w * 0.4, this.y - d.h * 0.45 + dy, dir * 560, 0, 'enemy',
              { dmg: 11, stun: 0.45, kbx: 420, kby: -300, pierce: true, fly: true, life: 0.7, big: true }));
          }
          MG.Audio.whiff();
          this.state = 'idle'; this.cool = this.enraged ? 0.6 : 1.0;
        }
      } else if (s === 'yowlWind' || s === 'spawnWind') {
        this.vx = 0;
        if (this.stateT > 0.9) {
          const n = s === 'yowlWind' ? (this.enraged ? 3 : 2) : (this.enraged ? 4 : 3);
          const made = world.spawnMinions ? world.spawnMinions(d.minion, n) : 0;
          if (made) world.fx.text(this.x, this.y - d.h - 30, s === 'yowlWind' ? 'THE CATS COME RUNNING!' : 'TOADLETS!', '#ffd23f', 24);
          MG.Audio.thump();
          this.state = 'idle'; this.cool = this.enraged ? 0.8 : 1.3;
        }
      } else if (s === 'tongueWind') {
        this.vx = 0; this.facing = dir;
        if (this.stateT > 0.5 / fast) { this.state = 'tongue'; this.stateT = 0; this.tongueHit = new Set(); }
      } else if (s === 'tongue') {
        // a long sticky tongue: hits and drags you in
        const reach = 360, out = this.stateT < 0.25 ? this.stateT / 0.25 : Math.max(0, 1 - (this.stateT - 0.35) / 0.3);
        this.tongueAmt = out;
        const mouthY = this.y - d.h * 0.45, tipX = this.x + this.facing * (d.w * 0.4 + reach * out);
        const box = { x: Math.min(this.x, tipX), y: mouthY - 18, w: Math.abs(tipX - this.x), h: 36 };
        for (const f of players) {
          if (this.tongueHit.has(f) || !U.overlap(box, f.box)) continue;
          this.tongueHit.add(f);
          const res = f.takeHit({ dmg: 12, kbx: -this.facing * 520, kby: -200, stun: 0.6, from: this }, world);
          if (res === 'hit') world.fx.text(f.x, f.y - f.h - 20, 'SLURRRP!', '#ff8fab', 22);
        }
        if (this.stateT > 0.7) { this.state = 'idle'; this.tongueAmt = 0; this.cool = this.enraged ? 0.6 : 1.0; }
      } else if (s === 'poisonWind') {
        this.vx = 0; this.puff = Math.min(1, this.stateT / 0.6);
        if (this.stateT > 0.6 / fast) {
          for (const ox of [-150, 0, 150]) {
            world.spawn(new MG.Projectile('stink', this.x + ox, this.y - 40, 0, 0, 'enemy', { dmg: 3, poison: true, radius: 85, tick: 0.5, life: 3, still: true, pierce: true }));
          }
          world.fx.text(this.x, this.y - d.h - 30, 'POISON PUFF!', '#9ef01a', 26);
          MG.Audio.hiss();
          this.puff = 0;
          this.state = 'idle'; this.cool = this.enraged ? 0.8 : 1.4;
        }
      } else return false;
      return true;
    }

    // Pose bits for drawing (and for Wi-Fi guests later): 1 crouching, 2 charging, 4 hidden, 8 in the air.
    visualFlags() {
      const s = this.state;
      return (s === 'crouch' || s === 'windup' || /Wind$/.test(s) ? 1 : 0)
        | (s === 'charge' || s === 'dash' || s === 'pounce' ? 2 : 0) | (this.hidden ? 4 : 0) | (!this.onGround ? 8 : 0)
        | (s === 'tongue' ? 16 : 0) | (s === 'poisonWind' ? 32 : 0) | (this.burrowed ? 64 : 0) | (this.lurking ? 128 : 0);
    }

    draw(ctx, world) {
      const d = this.d;
      // pose bits: from the host's snapshot on Wi-Fi guests, or worked out here
      const vf = this.remoteFlags !== undefined ? this.remoteFlags : this.visualFlags();
      if (vf & 64) { MG.Art.burrowMound(ctx, this.x, world.groundY, this.t); return; } // the Warlord, underground
      if (vf & 128) { // Big Tom in the undergrowth: just two big eyes
        ctx.save(); ctx.translate(this.x, this.y - 50); ctx.scale(2, 2); MG.Art.catEyes(ctx, 0, 0, this.t, this.facing); ctx.restore();
        return;
      }
      if (vf & 4) {
        if (world.radar) { ctx.save(); ctx.globalAlpha = 0.35; MG.Art[d.art](ctx, this.x, this.y, { t: this.t, facing: this.facing, crouch: true }); ctx.restore(); }
        MG.Art.catEyes(ctx, this.x, this.y - 30, this.t, this.facing);
        return;
      }
      if (this.alive) MG.Art.shadow(ctx, this.x, world.groundY, d.w * 0.55);
      ctx.save();
      if (!this.alive) {
        ctx.translate(this.x, this.y - d.h / 2);
        ctx.rotate(this.spin);
        ctx.translate(-this.x, -(this.y - d.h / 2));
      }
      const o = {
        t: this.t, facing: this.facing, flash: this.flash > 0, scale: d.scale || 1, colors: d.colors, bandana: d.bandana,
        crouch: !!(vf & 1), charging: !!(vf & 2), air: !!(vf & 8), moving: Math.abs(this.vx) > 10,
        warlord: d.warlord, bigTom: d.bigTom, crown: d.crown,
        tongue: vf & 16 ? (this.remoteFlags !== undefined ? 0.9 : this.tongueAmt || 0) : 0,
        puff: vf & 32 ? (this.remoteFlags !== undefined ? 0.8 : this.puff || 0) : 0,
      };
      MG.Art[d.art](ctx, this.x, this.y, o);
      if (this.alive && this.hurt > 0.5 && !this.isBoss) {
        MG.UI.outlineText(ctx, '@', this.x + 6, this.y - d.h - 8 - Math.sin(this.t * 6) * 3, 16, '#ffd23f', 'center');
      }
      ctx.restore();
    }
  };

  // ---------- Crates: smash them for grenades, gumnuts, hearts... ----------
  MG.Crate = class {
    constructor(x, loot, label) {
      this.x = x; this.y = MG.GROUND_Y; this.loot = loot || 'none'; this.label = label || '';
      this.hp = 2; this.alive = true; this.isProp = true; this.wobble = 0; this.flash = 0;
    }
    get box() { return { x: this.x - 23, y: this.y - 46, w: 46, h: 46 }; }
    takeHit(hit, world) {
      if (!this.alive) return 'miss';
      this.hp -= hit.big || hit.blast ? 2 : 1;
      this.wobble = 0.3;
      this.flash = 0.08;
      MG.Audio.crate();
      if (this.hp <= 0) {
        this.alive = false;
        world.fx.burst(this.x, this.y - 22, '#c68642', 16, 300);
        world.fx.text(this.x, this.y - 60, 'CRUNCH!', '#ffd23f', 26);
        if (this.loot !== 'none') world.addPickup(this.loot, this.x, this.y - 20);
        if (world.dropCoins) world.dropCoins(this.x, this.y - 30, MG.COINS.crate + Math.floor(Math.random() * 3), hit);
      }
      return 'hit';
    }
    update(dt) { this.wobble = Math.max(0, this.wobble - dt); this.flash -= dt; }
    draw(ctx) { if (this.alive) MG.Art.crate(ctx, this.x, this.y, { wobble: this.wobble, flash: this.flash > 0, label: this.label }); }
  };

  // ---------- Pickups ----------
  // heart (+40 HP), power-ups (shield, tea, super), grenades (+2), gatling (weapon), gumnuts (ammo),
  // 'w:<weapon id>' (a weapon to borrow for the map), armor (a bark patch: +20 armor)
  MG.EDIBLE = { heart: 1, shield: 1, tea: 1, super: 1 }; // what rabbits will eat
  // 'w:snag' -> 'snag' (only real weapons), else null
  MG.pickupWeapon = (type) => {
    if (typeof type !== 'string' || type.slice(0, 2) !== 'w:') return null;
    const id = type.slice(2);
    return Object.prototype.hasOwnProperty.call(MG.WEAPONS, id) ? id : null;
  };
  MG.Pickup = class {
    constructor(type, x, y) {
      this.type = type; this.x = x; this.y = y; this.vy = 0; this.t = Math.random() * 5; this.taken = false;
    }
    get box() { return { x: this.x - 18, y: this.y - 40, w: 36, h: 40 }; }
    update(dt, world) {
      this.t += dt;
      if (this.carried) return; // a joey is bringing it over
      const floor = world && world.floorBelow ? world.floorBelow(this.x, this.y) : this.y;
      if (this.y < floor) {
        this.vy += 1400 * dt;
        this.y = Math.min(floor, this.y + this.vy * dt);
      } else this.vy = 0;
    }
    draw(ctx) {
      if (this.taken) return;
      const A = MG.Art;
      if (this.type === 'heart') A.heart(ctx, this.x, this.y, this.t);
      else if (MG.POWER_TYPES.includes(this.type)) A.powerOrb(ctx, this.type, this.x, this.y, this.t);
      else if (this.type === 'grenades') A.grenadePack(ctx, this.x, this.y, this.t);
      else if (this.type === 'gatling') A.gatlingPickup(ctx, this.x, this.y, this.t);
      else if (this.type === 'armor') A.armorPickup(ctx, this.x, this.y, this.t);
      else if (MG.pickupWeapon(this.type)) A.weaponPickup(ctx, MG.pickupWeapon(this.type), this.x, this.y, this.t);
      else if (this.type === 'gumnuts') A.gumnutSack(ctx, this.x, this.y, this.t);
      else if (this.type === 'scrap') A.scrap(ctx, this.x, this.y, this.t);
    }
  };
})();
