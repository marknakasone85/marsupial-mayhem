// Campaign: a side-scrolling brawl through a map to the finish line.
// 1 player, 2 on one keyboard, or 2-4 on home Wi-Fi (this computer hosts and runs the real game;
// friends' devices draw the snapshots it sends and send back their button presses).
(function () {
  const U = MG.U;
  const UI = MG.UI;
  const W = MG.W;
  const RESPAWN_TIME = 5;
  const SNAP_RATE = 1 / 30;   // Wi-Fi updates per second sent to friends

  MG.CampaignScene = class {
    // opts: { level, charId }                          one player
    //       { level, players: [{ id, cid, local }] }    local = 'SOLO' | 'P1' | 'P2', or null for a Wi-Fi player
    //       net: true                                    this computer hosts a Wi-Fi game
    constructor(opts) {
      this.opts = opts;
      this.levelIndex = opts.level || 0;
      this.diff = MG.difficulty(); // Settings: EASY / NORMAL / HARD (pests' damage and toughness)
      this.L = MG.LEVELS[this.levelIndex];
      this.net = !!opts.net;
      this.groundY = MG.GROUND_Y;
      this.gravity = this.L.gravity || 1;
      this.fx = new MG.FX();
      if (this.net) { MG.Sync.wrapFX(this.fx); MG.Sync.installAudioHook(); }
      this.platforms = this.L.platforms || [];
      this.t = 0;
      this.camX = 0;
      this.score = 0;
      this.state = 'play'; // play | paused | dead | won
      this.stateT = 0;
      this.menu = null;
      this.showControls = false;
      this.showStrip = MG.Save.get('keyStrip', true);
      this.uid = 0;
      this.syncT = 0;
      this.gid = Math.random().toString(36).slice(2, 10); // this game, for Wi-Fi friends' coin totals
      this.coins = (this.L.coins || []).map((c) => new MG.Coin(c.x, c.y, c.v || 1, null, true));
      this.water = MG.waterZones(this.L);
      this.npcs = (this.L.npcs || []).map((o) => new MG.NPC(o));
      this.flashT = 0;

      this.slots = [];
      const players = opts.players || [{ id: 0, cid: opts.charId || 'boomer', local: 'SOLO' }];
      players.forEach((pl, i) => this.addSlot(pl, 140 + i * 50));

      this.gates = (this.L.gates || []).map((g) => ({ x: g.x, opened: false, lift: 0 })).sort((a, b) => a.x - b.x);
      this.enemies = this.L.enemies.map((e) => this.addEnemy(e.type, e.x, e.y));
      this.crates = (this.L.crates || []).map((c) => new MG.Crate(c.x, c.loot, c.label));
      this.pickups = (this.L.pickups || []).map((p) => new MG.Pickup(p.type, p.x, p.y !== undefined ? p.y : this.groundY));
      this.projectiles = [];
      this.grenades = [];
      this.goalX = this.L.length - 160;
      this.boss = null;
      if (this.L.boss) {
        this.boss = this.addEnemy(this.L.boss.type, this.L.boss.x);
        this.enemies.push(this.boss);
        this.arenaX = this.L.boss.x - 380;
      }
      this.bossAwake = false;
      this.checkpoint = 0;
      this.placeHelpers();
      this.scaleForPlayers(players.length);
      // CPU champions fighting beside the players (Grin Isle)
      this.allies = (this.L.allies || []).map((cid, i) => this.makeAlly(cid, 80 + i * 40));
    }

    makeAlly(cid, x) {
      const f = new MG.Fighter(MG.charById(cid), x, { team: 'player', mercy: 0.8 });
      f.ai = new MG.AllyAI();
      f.isAlly = true;
      f.tag = f.def.name; // the champion's name over their head
      f.tagColor = '#9ef01a';
      f.reviveT = 0;
      return f;
    }
    updateAllies(dt) {
      for (let i = 0; i < this.allies.length; i++) {
        const f = this.allies[i];
        if (f.state === 'ko') {
          f.reviveT += dt;
          if (f.reviveT > 6 && this.state === 'play') {
            // back in the fight next to the team
            const lead = this.leader();
            const n = this.makeAlly(f.def.id, lead.x - 60);
            n.y = lead.y - 80; n.vy = -300; n.onGround = false; n.invuln = 2;
            this.allies[i] = n;
            this.fx.text(n.x, n.y - 120, n.def.name + ' IS BACK!', '#9ef01a', 20);
          }
          f.update(dt, {}, this);
          continue;
        }
        f.update(dt, this.state === 'play' ? f.ai.control(f, this, dt) : {}, this);
      }
    }

    // More players = tougher pests, so co-op stays a challenge.
    scaleForPlayers(n) {
      for (const e of this.enemies) {
        const base = MG.ENEMY_TYPES[e.type].hp;
        const k = (n <= 1 ? 1 : e.isBoss ? 1 + 0.5 * (n - 1) : 1 + 0.35 * (n - 1)) * this.diff.hp;
        const frac = e.hp / e.maxHp;
        e.maxHp = Math.round(base * k);
        e.hp = e.maxHp * frac;
      }
      this.scaledFor = n;
    }

    // ---------------- players ----------------
    get coop() { return this.slots.length > 1; }
    get fighters() { return this.slots.map((s) => s.f); }
    get player() { return this.slots[0].f; }
    aliveFighters() { return this.fighters.filter((f) => f.state !== 'ko'); }
    leader() {
      const alive = this.aliveFighters();
      const list = alive.length ? alive : this.fighters;
      return list.reduce((a, b) => (b.x > a.x ? b : a));
    }
    nearestFighter(x) {
      // pests ignore anyone playing dead (Dead Fred); CPU champions are fair game too
      const alive = this.aliveFighters().concat((this.allies || []).filter((f) => f.state !== 'ko')).filter((f) => !f.playingDead && !f.burrowed);
      if (!alive.length) return this.decoy || (this.decoy = { x: -99999, y: this.groundY, h: 1, state: 'ko', box: { x: -99999, y: 0, w: 0, h: 0 }, takeHit: () => 'miss' });
      return alive.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    }
    currentPlayers() { return this.slots.map((s) => ({ id: s.id, cid: s.cid, local: s.local })); }

    addSlot(pl, x) {
      const slot = {
        id: pl.id, cid: pl.cid, def: MG.charById(pl.cid), local: pl.local || null,
        respawnT: 0, waiting: false, held: {}, presses: {}, inSeq: 0,
      };
      this.slots.push(slot);
      this.spawnFighter(slot, x);
      return slot;
    }

    // Whose wallet: this keyboard's players are 'p1' and 'p2'; Wi-Fi friends keep their own.
    pidOf(slot) { return slot.local === 'P2' ? 'p2' : slot.local ? 'p1' : null; }
    loadoutFor(slot) {
      const pid = this.pidOf(slot);
      if (pid) return MG.Gear.loadout(pid);
      const g = MG.Gear.friends[slot.id];
      return g ? g.lo : null;
    }

    spawnFighter(slot, x, keep) {
      const def = slot.def;
      const coat = def.coats ? slot.id % def.coats.length : 0;
      const f = new MG.Fighter(def, x, { team: 'player', mercy: 0.8, coat, joeyLevel: MG.joeyLevel(slot.cid) });
      MG.Gear.apply(f, this.loadoutFor(slot)); // bought weapon, armor, bigger heart, grenade belt
      if (keep) {
        f.grenades = keep.grenades; f.pouch = keep.pouch;
        if (keep.weapon && !keep.weapon.own) f.weapon = keep.weapon; // a borrowed weapon stays until it's used up
        if (keep.joey && f.joey) f.joey.rescueUsed = keep.joey.rescueUsed; // the rescue is once per map
      }
      f.tagColor = MG.PLAYER_COLORS[slot.id % 4];
      slot.f = f;
      slot.respawnT = 0;
      slot.waiting = false;
      return f;
    }

    controlsFor(slot) {
      if (slot.local) return MG.readControls(MG.Controls[slot.local]);
      // a friend's messages stopped (connection trouble): let go of every key instead of walking on
      if (this.t - (slot.lastIn === undefined ? this.t : slot.lastIn) > 1.5) slot.held = {};
      const c = Object.assign({ left: false, right: false, down: false, shoot: false, jump: false }, slot.held, slot.presses);
      slot.presses = {};
      return c;
    }

    // A Wi-Fi player's buttons: held keys from the newest message, and every press counts.
    netInput(id, m) {
      const slot = this.slots.find((s) => s.id === id);
      if (!slot || !m) return;
      slot.lastIn = this.t;
      if (m.n > slot.inSeq) {
        slot.inSeq = m.n;
        slot.held = { left: !!m.l, right: !!m.r, down: !!m.d, shoot: !!m.s, jump: !!m.j };
      }
      for (const k of Array.isArray(m.p) ? m.p : []) if (MG.PRESS_KEYS.includes(k)) slot.presses[k] = true;
    }

    addEnemy(type, x, y) {
      const e = new MG.Enemy(type, x, y);
      e.uid = ++this.uid;
      e.zone = this.gates.filter((g) => g.x < x).length; // gates open when their zone is cleared
      return e;
    }

    // Hearts right after every gate and before the boss, plus two power-ups per map.
    placeHelpers() {
      const add = (type, x) => this.pickups.push(new MG.Pickup(type, x, this.groundY));
      for (const g of this.gates) add('heart', g.x + 140);
      if (this.boss) add('heart', this.arenaX - 120);
      const types = MG.POWER_TYPES;
      [0.3, 0.62].forEach((f, i) => {
        let x = this.L.length * f;
        for (const g of this.gates) if (Math.abs(g.x - x) < 90) x += 160;
        add(types[(this.levelIndex * 2 + i) % types.length], x);
      });
    }

    enter() {
      MG.Audio.playMusic(this.bossAwake ? 'boss' : this.L.music);
      if (this.net) MG.Net.onMessage = (m, from) => this.onNet(m, from);
    }

    // The Wi-Fi connection came back with the same code: friends rejoin and drop in again.
    onRehosted() {
      this.slots = this.slots.filter((s) => s.local);
      this.fx.text(this.leader().x, 200, `Wi-Fi is back! Friends rejoin by themselves (code ${MG.Net.code})`, '#9bf6ff', 20);
    }

    // ---------------- Wi-Fi messages (host side) ----------------
    onNet(m, from) {
      if (!m) return;
      if (from === 'server') {
        if (m.t === 'joined') {
          MG.Net.send({ t: 'welcome', inGame: true, mode: 'campaign', level: this.levelIndex }, m.id, true);
          this.fx.text(this.leader().x, 200, `P${m.id + 1} is joining...`, MG.PLAYER_COLORS[m.id % 4], 22);
        } else if (m.t === 'left') {
          const slot = this.slots.find((s) => s.id === m.id);
          if (slot) {
            this.slots = this.slots.filter((s) => s !== slot);
            this.fx.text(slot.f.x, slot.f.y - 140, `P${m.id + 1} left the game`, '#cccccc', 22);
          }
        }
        return;
      }
      if (m.t === 'gear' || m.t === 'pick') MG.Gear.note(from, m);
      if (m.t === 'in') this.netInput(from, m);
      else if (m.t === 'pick' && m.ready && typeof from === 'number' && !this.slots.some((s) => s.id === from) &&
        this.slots.length < 4 && MG.validCid(m.cid)) {
        // drop-in: appear next to the team
        const lead = this.leader();
        const slot = this.addSlot({ id: from, cid: m.cid, local: null }, lead.x - 50);
        slot.f.invuln = 2;
        if (this.slots.length > this.scaledFor) this.scaleForPlayers(this.slots.length);
        this.fx.text(slot.f.x, slot.f.y - 150, `P${from + 1} JOINED!`, MG.PLAYER_COLORS[from % 4], 28);
        MG.Audio.powerUp();
      }
    }

    // ---------------- world interface used by fighters, enemies and grenades ----------------
    limitsFor(x) {
      let min = 0, max = this.L.length;
      for (const g of this.gates) {
        if (g.opened) continue;
        if (g.x > x) max = Math.min(max, g.x - 26);
        else min = Math.max(min, g.x + 26);
      }
      return { min, max };
    }
    bounds(f) {
      const b = this.limitsFor(f.x);
      b.min = Math.max(b.min, this.camX - 10);
      if (this.coop) {
        b.min = Math.max(b.min, this.camX + 15);
        b.max = Math.min(b.max, this.camX + W - 15);
      }
      if (this.bossAwake && this.boss.alive) b.min = Math.max(b.min, this.arenaX);
      return b;
    }
    enemyBounds(e) {
      const b = this.limitsFor(e.x);
      if (e.isBoss) return { min: Math.max(b.min, this.arenaX) + 50, max: b.max - 50 };
      return { min: b.min + 20, max: b.max - 20 };
    }
    targets(team) {
      if (team === 'enemy') return this.aliveFighters();
      return this.enemies.filter((e) => e.alive).concat(this.crates.filter((c) => c.alive));
    }
    spawn(p) { this.projectiles.push(p); }
    spawnGrenade(g) { this.grenades.push(g); }
    walls() { return this.projectiles.filter((p) => p.wall); }
    view() { return { min: this.camX, max: this.camX + W }; }
    get radar() { return this.fighters.some((f) => f.has('earRadar') && f.state !== 'ko'); }
    faceTarget(f) {
      let best = null, bd = 400;
      for (const e of this.enemies) if (e.alive && !e.hidden && Math.abs(e.x - f.x) < bd) { bd = Math.abs(e.x - f.x); best = e.x; }
      return best;
    }
    // Stripes' tongue grabs a pickup and brings it straight to him.
    grabPickup(box, f) {
      const pk = this.pickups.find((p) => !p.taken && U.overlap(box, p.box) && (p.type !== 'scrap' || f.has('scavenger')));
      if (!pk || !f) return false;
      this.collect(pk, f);
      this.fx.text(f.x, f.y - f.h - 30, 'SLURP!', '#ff8fab', 22);
      return true;
    }
    grenadeNear(f) {
      let best = null, bd = 70;
      for (const g of this.grenades) {
        if (g.dead) continue;
        const d = Math.abs(g.x - f.x);
        if (d < bd && Math.abs(g.y - f.y) < 70) { bd = d; best = g; }
      }
      return best;
    }
    floorBelow(x, y) { return MG.floorBelow(this.platforms, this.groundY, x, y); }
    waterAt(x) { return MG.waterAt(this.water, x); }
    onHit(attacker, target, hit, result) {
      if (result === 'hit' && !target.isProp && this.fighters.includes(attacker)) this.score += 10;
    }
    onEnemyKilled(e, hit) {
      this.score += e.d.score;
      this.dropCoins(e.x, e.y - e.d.h * 0.6, MG.coinsFor(e), hit);
      // Chompers eats almost anything a pest leaves behind (bones included)
      if (!e.isBoss && this.fighters.some((f) => f.has('scavenger')) && Math.random() < 0.5) this.addPickup('scrap', e.x, this.groundY);
      if (e === this.boss) {
        this.fx.text(e.x, e.y - 220, e.d.defeatText || `${e.d.name} DEFEATED!`, '#ffd23f', 36);
        this.fx.shake(20);
        this.fx.finisher(e.x, e.y - e.d.h * 0.5, true);
        MG.Engine.slowmo(1.5, 0.25);
        MG.Audio.finisher();
        MG.Audio.win();
        // the rest of the warren scatters
        for (const r of this.enemies) if (r.alive && r !== e) r.takeHit({ dmg: 999, kbx: 400, kby: -500, big: true, dir: r.x > e.x ? 1 : -1 }, this);
      }
    }
    // Coins fly to whoever knocked the pest out (or broke the crate).
    dropCoins(x, y, total, hit) {
      const by = MG.killerOf(hit);
      const owner = by && this.fighters.includes(by) ? by : null;
      let left = Math.round(total);
      let n = 0;
      while (left > 0 && n < 12) {
        const v = left >= 10 && n < 10 ? 5 : 1;
        this.coins.push(new MG.Coin(x + MG.U.rand(-10, 10), y, n >= 11 ? left : v, owner));
        left -= n >= 11 ? left : v;
        n++;
      }
    }
    gainCoins(f, v) {
      const slot = this.slots.find((s) => s.f === f);
      if (!slot) return;
      slot.earned = (slot.earned || 0) + v;
      const pid = this.pidOf(slot);
      if (pid) MG.Gear.addCoins(pid, v);
      MG.Audio.coin();
      if (v >= 5 || Math.random() < 0.3) this.fx.text(f.x + MG.U.rand(-20, 20), f.y - f.h - 26, '+' + v, '#ffd23f', 14);
    }
    coinsOf(slot) {
      const pid = this.pidOf(slot);
      if (pid) return MG.Gear.coins(pid);
      const g = MG.Gear.friends[slot.id];
      return g ? g.coins : slot.earned || 0;
    }
    addPickup(type, x, y) { this.pickups.push(new MG.Pickup(type, x, y !== undefined ? y : this.groundY)); }
    // Rabbits eat power-ups and hearts they find (the pest they are!).
    edibles() { return this.pickups.filter((p) => !p.taken && MG.EDIBLE[p.type]); }
    eatPickup(pk, e) {
      if (pk.taken) return;
      pk.taken = true;
      MG.Audio.munch();
      this.fx.text(pk.x, pk.y - 50, 'MUNCH! A rabbit ate it!', '#ffffff', 18);
      this.fx.burst(pk.x, pk.y - 20, '#52e07a', 10, 160);
    }
    // A boss calls in help: rabbits from burrows (Big Buck, the Warren Warlord), cats (Big Tom),
    // toadlets (the Cane Toad King). They come in at the edges of the arena.
    spawnMinions(type, n, nearView) {
      if (!MG.ENEMY_TYPES[type]) return 0;
      const living = this.enemies.filter((e) => e.alive && e.type === type).length;
      const count = Math.min(n, 7 - living);
      // at the edges of the boss arena, or of the screen (a pademelon's thump)
      const edge = this.bossAwake && !nearView && this.arenaX !== undefined ? this.arenaX : this.camX;
      for (let i = 0; i < count; i++) {
        const left = i % 2 === 0;
        const x = left ? edge + 60 + i * 20 : edge + W - 60 - i * 20;
        const r = this.addEnemy(type, x);
        r.hidden = false;
        r.aggro = true;
        r.thumped = true; // a called-in pademelon doesn't call more (no endless chain)
        r.vy = -500;
        r.onGround = false;
        this.enemies.push(r);
        this.fx.burst(x, this.groundY, '#8a3520', 10, 200);
      }
      return count;
    }
    spawnWarren(n) { return this.spawnMinions('rabbit', n); }
    // The Grand Grinner calls an old boss back for a few seconds (a weak "echo").
    spawnEcho(type) {
      if (this.enemies.filter((e) => e.alive && e.echo).length >= 3) return null;
      const x = U.clamp(this.leader().x + U.rand(-300, 300), (this.arenaX || 0) + 80, (this.arenaX || 0) + W - 80);
      const e = this.addEnemy(type, x);
      e.hp = e.maxHp = 60;
      e.echo = 6;
      e.aggro = true;
      e.vy = -400; e.onGround = false;
      this.enemies.push(e);
      this.fx.burst(x, this.groundY - 40, '#bde0fe', 24, 300);
      return e;
    }
    screenFlash(secs) { this.flashT = secs; this.flashMax = secs; }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.stateT += dt;
      this.fx.update(dt);
      if (this.net) MG.Sync.capturing = true;
      try {
        this.step(dt);
      } finally {
        if (this.net) MG.Sync.capturing = false;
      }
      const realDt = MG.Engine.unscaled(dt); // Wi-Fi keeps real pace during slow motion
      if (this.net) MG.Net.maintain(realDt, () => this.onRehosted());
      if (this.net && MG.Engine.scene === this) {
        this.syncT += realDt;
        if (this.syncT >= SNAP_RATE) {
          this.syncT = 0;
          MG.Net.send(MG.Sync.snapshot(this));
        }
      }
    }

    step(dt) {
      if (this.showControls) {
        if (MG.Input.anyPressed()) { this.showControls = false; MG.Audio.select(); }
        return;
      }
      if (this.menu) {
        if (this.state === 'paused' && MG.Menu.pause()) { this.resume(); return; }
        if (this.state !== 'won' || this.stateT > 1.0) {
          const item = this.menu.update(dt);
          if (item) { item.act(); if (MG.Engine.scene !== this) return; }
        }
        if (this.state === 'paused') return;
      } else if (this.state === 'play' && MG.Menu.pause()) {
        this.pause();
        return;
      }

      for (const slot of this.slots) {
        const ctrl = this.state === 'play' ? this.controlsFor(slot) : {};
        slot.f.update(dt, ctrl, this);
        if (this.state === 'play') slot.f.meter = Math.min(MG.SPECIAL_COST, slot.f.meter + dt * 3);
      }
      this.updateAllies(dt);
      this.flashT = Math.max(0, this.flashT - dt);
      this.updateRevives(dt);

      for (const e of this.enemies) {
        if (e.alive && !e.aggro && (e.x < this.camX - 300 || e.x > this.camX + W + 300)) continue;
        if (e === this.boss && !this.bossAwake) continue;
        e.update(dt, this, this.nearestFighter(e.x));
      }
      this.enemies = this.enemies.filter((e) => e.alive || e.dying > 0);
      for (const c of this.crates) c.update(dt);
      for (const pr of this.projectiles) pr.update(dt, this);
      this.projectiles = this.projectiles.filter((pr) => !pr.dead);
      for (const g of this.grenades) g.update(dt, this);
      this.grenades = this.grenades.filter((g) => !g.dead);

      const alive = this.aliveFighters();
      for (const pk of this.pickups) {
        pk.update(dt, this);
        if (pk.taken) continue;
        const f = alive.find((a) => U.overlap(pk.box, a.box) && (pk.type !== 'scrap' || a.has('scavenger')));
        if (f) this.collect(pk, f);
      }
      this.pickups = this.pickups.filter((pk) => !pk.taken);
      for (const c of this.coins) c.update(dt, this);
      this.coins = this.coins.filter((c) => !c.taken);
      if (this.state === 'play') for (const n of this.npcs) n.update(dt, this);
      this.npcs = this.npcs.filter((n) => !n.gone);

      this.updateGates(dt);

      // boss arena
      if (this.boss && !this.bossAwake && this.leader().x > this.arenaX + 100) {
        this.bossAwake = true;
        this.fx.text(this.boss.x - 100, 200, `${this.boss.d.name} APPEARS!`, '#ff4d6d', 34);
        MG.Audio.gong();
        MG.Audio.playMusic('boss');
        for (const f of this.fighters) if (f.x < this.arenaX + 20) f.x = this.arenaX + 60;
      }

      // camera: follow the player (alone) or the middle of the group
      let target;
      if (this.coop) {
        const list = alive.length ? alive : this.fighters;
        target = list.reduce((s, f) => s + f.x, 0) / list.length - W / 2;
      } else {
        target = this.player.x - W * 0.38;
      }
      if (this.bossAwake && this.boss.alive) target = Math.max(target, this.arenaX);
      target = U.clamp(target, 0, this.L.length - W);
      this.camX = U.lerp(this.camX, target, 1 - Math.pow(0.001, dt));

      // win / lose
      const goalOpen = !this.boss || !this.boss.alive;
      if (this.state === 'play' && goalOpen && alive.some((f) => f.x > this.goalX - 40)) this.win();
      if (this.state === 'play' && alive.length === 0) {
        this.state = 'dead';
        this.stateT = 0;
      }
      if (this.state === 'dead' && this.stateT > 1.8 && !this.menu) {
        const items = [];
        if (this.checkpoint) items.push({ label: 'Continue from Checkpoint', act: () => this.respawn() });
        items.push({ label: 'Restart Map', act: () => this.restart() });
        items.push(this.shopItem('then try again'));
        items.push({ label: 'World Map', act: () => this.toWorldMap() });
        if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
        items.push({ label: this.net ? 'End Wi-Fi Game' : 'Main Menu', act: () => this.quit() });
        this.menu = new MG.MenuList(items, W / 2, 244, { w: 340, h: 36, gap: 6, fontSize: 20 });
      }
    }

    // Gates open once every pest in front of them is gone. Near a closed gate, hiding cats come out.
    pestsLeft(zone) { return this.enemies.filter((e) => e.alive && e.zone === zone).length; }
    updateGates(dt) {
      const lead = this.leader();
      this.gates.forEach((g, i) => {
        if (g.opened) { g.lift = Math.min(1, g.lift + dt * 1.5); return; }
        if (this.pestsLeft(i) === 0) {
          g.opened = true;
          this.checkpoint = Math.max(this.checkpoint, g.x + 60);
          this.fx.text(g.x, this.groundY - 280, 'GATE OPEN! CHECKPOINT!', '#9ef01a', 28);
          MG.Audio.gong();
        } else if (Math.abs(lead.x - g.x) < 320) {
          // the last pests in front of a closed gate come running (no one gets stuck at a gate)
          for (const e of this.enemies) {
            if (!e.alive || e.zone !== i) continue;
            e.aggro = true;
            if (e.hidden) e.wake(this);
          }
        }
      });
    }

    // Co-op: a knocked-out player pops back in next to a teammate after a few seconds.
    updateRevives(dt) {
      if (!this.coop || this.state !== 'play') return;
      const alive = this.aliveFighters();
      if (!alive.length) return;
      for (const slot of this.slots) {
        if (slot.f.state !== 'ko') continue;
        if (!slot.waiting) {
          slot.waiting = true;
          slot.respawnT = RESPAWN_TIME;
          this.fx.text(slot.f.x, slot.f.y - 120, `P${slot.id + 1} is down! Back in ${RESPAWN_TIME}...`, '#bde0fe', 20);
          continue;
        }
        slot.respawnT -= dt;
        if (slot.respawnT <= 0) {
          const mate = alive[Math.floor(Math.random() * alive.length)];
          const f = this.spawnFighter(slot, mate.x - 50 * mate.facing, slot.f);
          f.hp = f.maxHp * 0.5;
          f.y = mate.y - 60;
          f.vy = -300;
          f.onGround = false;
          f.invuln = 2;
          this.fx.text(f.x, f.y - 140, `P${slot.id + 1} IS BACK!`, MG.PLAYER_COLORS[slot.id % 4], 26);
          MG.Audio.powerUp();
        }
      }
    }

    collect(pk, f) {
      pk.taken = true;
      const say = (text, color, size = 22) => this.fx.text(pk.x, pk.y - 50, text, color, size);
      if (f.has('snackSpeed')) { f.powerUp('snack', 4); this.fx.text(f.x, f.y - f.h - 40, 'TERMITE SNACK! (speed)', '#ffb703', 16); }
      // the pouch saves what you don't need right now: a heart at full health, a power-up while one is running
      if (pk.type === 'heart' && f.hp >= f.maxHp && f.store('heart', this)) return;
      if (MG.POWER_TYPES.includes(pk.type) && MG.POWER_TYPES.some((k) => f.powers[k]) && f.store(pk.type, this)) return;

      if (pk.type === 'scrap') {
        f.heal(10);
        MG.Audio.munch();
        say('CRUNCH! Bones and all +10', '#ffd23f', 18);
        return;
      }
      if (pk.type === 'heart') {
        f.heal(40);
        MG.Audio.heal();
        say('+40 HP', '#ff4d6d', 24);
      } else if (MG.POWER_TYPES.includes(pk.type)) {
        f.powerUp(pk.type);
        MG.Audio.powerUp();
        this.fx.burst(pk.x, pk.y - 24, MG.Art.POWER_COLORS[pk.type], 20, 300);
        say(MG.POWER_NAMES[pk.type], MG.Art.POWER_COLORS[pk.type], 26);
      } else if (pk.type === 'grenades') {
        f.giveGrenades(2);
        MG.Audio.ammo();
        say('+2 GRENADES', '#9ef01a');
      } else if (pk.type === 'gatling') {
        f.giveWeapon('gatling', 100);
        MG.Audio.powerUp();
        say('GUMNUT GATLING! (hold shoot)', '#ffb703', 22);
      } else if (pk.type === 'gumnuts') {
        const had = f.weapon && f.weapon.id === 'gatling';
        if (had) f.weapon.ammo = Math.min(f.weapon.max, f.weapon.ammo + 30);
        else f.giveWeapon('gatling', 30);
        MG.Audio.ammo();
        say(had ? '+30 GUMNUTS' : 'GUMNUT GATLING! (hold shoot)', '#ffb703');
      } else if (pk.type === 'armor') {
        f.giveArmor(MG.ARMOR_PICKUP);
        MG.Audio.block();
        say('+' + MG.ARMOR_PICKUP + ' ARMOR', '#9bd0ff');
      } else if (MG.pickupWeapon(pk.type)) {
        const id = MG.pickupWeapon(pk.type);
        f.giveWeapon(id, MG.WEAPONS[id].pickupAmmo);
        MG.Audio.powerUp();
        say(MG.WEAPONS[id].name + '! (hold shoot)', '#ffb703', 20);
      }
    }

    win() {
      this.state = 'won';
      this.stateT = 0;
      const fs = this.fighters;
      for (const f of fs) { if (f.state !== 'ko') f.state = 'win'; f.vx = 0; f.move = null; }
      MG.Audio.win();
      MG.Audio.stopMusic();
      this.hpBonus = Math.round((fs.reduce((s, f) => s + Math.max(0, f.hp) / f.maxHp, 0) / fs.length) * 500);
      // every map cleared makes each character's joey a level stronger (saved in the browser)
      this.joeyGrew = [];
      // a secret character found here (Ghost, in the Time Rift)
      if (this.L.unlocks && MG.Unlocks.unlock(this.L.unlocks)) this.joeyGrew.push(MG.charById(this.L.unlocks).name + ' IS UNLOCKED! (pick them on the select screen)');
      for (const cid of new Set(this.slots.map((s) => s.cid))) {
        const lv = MG.growJoey(cid);
        if (lv) this.joeyGrew.push(`${MG.charById(cid).name}'S JOEY GREW! (level ${lv})`);
      }
      this.score += this.hpBonus;
      MG.Progress.clear(this.L.id); // opens the next stop on the Marsupial World map
      const best = MG.Save.get('best', {});
      if (!best[this.L.id] || this.score > best[this.L.id]) {
        best[this.L.id] = this.score;
        MG.Save.set('best', best);
        this.newBest = true;
      }
      // coins everyone picked up on this map
      this.coinLine = this.slots.map((s) => (this.coop ? `P${s.id + 1} ` : '') + '+' + (s.earned || 0)).join('   ') + ' coins';
      const items = [];
      const next = MG.Progress.next(this.levelIndex);
      if (next >= 0) items.push({ label: 'Next Map', act: () => this.goLevel(next) });
      items.push(this.shopItem());
      items.push({ label: 'World Map', act: () => this.toWorldMap() });
      items.push({ label: 'Play Again', act: () => this.restart() });
      if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
      items.push({ label: this.net ? 'End Wi-Fi Game' : 'Main Menu', act: () => this.quit() });
      this.menu = new MG.MenuList(items, W / 2, 330, { w: 320, h: 30, gap: 5, fontSize: 18 });
    }

    // Back to the Marsupial World map (same players). Story panels play there.
    toWorldMap() {
      MG.Engine.setScene(new MG.WorldMapScene({ net: this.net, players: this.currentPlayers(), at: this.levelIndex }));
    }

    // The platypus's shop. Afterwards: PLAY goes to the next map (or this one again), and WORLD MAP
    // back to this map's stop on the map. After a bonus or the last map there's no next one: back to the map.
    openShop() {
      const next = this.state === 'won' ? MG.Progress.next(this.levelIndex) : this.levelIndex;
      const players = this.currentPlayers();
      MG.Engine.setScene(new MG.ShopScene({
        net: this.net, level: next >= 0 ? next : this.levelIndex, players, gid: this.gid, mapAt: this.levelIndex, toMap: next < 0,
        earned: this.slots.map((s) => [s.id, s.earned || 0]),
      }));
    }
    // The menu's shop line stands out (and says how many coins you have to spend).
    shopItem(then) {
      const local = this.slots.filter((s) => s.local);
      const coins = local.length === 1 ? MG.Gear.coins(this.pidOf(local[0])) : null;
      const label = this.net ? 'Shop Together' : then ? 'Shop, ' + then : 'Shop: spend your coins';
      return { label, act: () => this.openShop(), accent: '#1f8a80', badge: coins !== null ? String(coins) : null };
    }

    pause() {
      this.state = 'paused';
      MG.Audio.select();
      const items = [
        { label: 'Resume', act: () => this.resume() },
        { label: 'Controls', act: () => { this.showControls = true; } },
        { label: () => MG.onscreenLabel(this), act: () => MG.cycleOnscreen(this) },
        { label: () => 'Blood: ' + (MG.Settings.blood ? 'ON' : 'OFF (confetti)'), act: () => MG.toggleBlood() },
        { label: 'Restart Map', act: () => this.restart() },
        { label: () => 'Sound: ' + (MG.Audio.muted ? 'OFF' : 'ON'), act: () => MG.Audio.toggleMute() },
      ];
      if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
      items.push({ label: this.net ? 'End Wi-Fi Game' : 'Quit to World Map', act: () => (this.net ? this.quit() : this.toWorldMap()) });
      this.menu = new MG.MenuList(items, W / 2, this.net ? 168 : 180, { w: 340, h: 36, gap: 6 });
    }
    resume() { this.state = 'play'; this.menu = null; }

    // Everyone comes back at the last opened gate with full health (costs some score).
    respawn() {
      this.slots.forEach((slot, i) => {
        const f = this.spawnFighter(slot, this.checkpoint + i * 50, slot.f);
        f.invuln = 1.5;
        f.meter = 50;
      });
      this.projectiles = [];
      this.grenades = [];
      this.score = Math.max(0, this.score - 300);
      const lead = this.leader();
      this.camX = U.clamp(lead.x - (this.coop ? W / 2 : W * 0.38), 0, this.L.length - W);
      this.state = 'play';
      this.menu = null;
      MG.Audio.playMusic(this.bossAwake && this.boss.alive ? 'boss' : this.L.music);
      this.fx.text(lead.x, lead.y - 160, 'BACK ON YOUR FEET!', '#ffd23f', 28);
    }
    goLevel(i) {
      MG.Engine.setScene(new MG.CampaignScene({ level: i, net: this.net, players: this.currentPlayers() }));
    }
    restart() { this.goLevel(this.levelIndex); }
    backToLobby() {
      MG.Net.send({ t: 'toLobby' }, 'all', true);
      MG.Engine.setScene(new MG.LobbyScene({
        resume: true, level: Math.min(this.levelIndex + (this.state === 'won' ? 1 : 0), MG.LEVELS.length - 1),
        players: this.slots.map((s) => ({ id: s.id, cid: s.cid, ready: true })),
      }));
    }
    quit() {
      if (this.net) MG.Net.leave();
      MG.Engine.setScene(new MG.MenuScene());
    }

    // touch buttons: only while actually playing
    wantsTouch() { return this.state === 'play' && !this.menu && !this.showControls; }
    touchPlayer() { const s = this.slots.find((x) => x.local); return s ? s.f : null; }

    // ---------------- draw ----------------
    hudModel() {
      const lead = this.leader();
      const players = this.slots.map((s) => {
        const f = s.f;
        return {
          tag: `P${s.id + 1}`, color: MG.PLAYER_COLORS[s.id % 4], name: s.def.name, cid: s.cid,
          joeyLevel: f.joey ? f.joey.level : 0, joeyCool: f.joey ? MG.U.clamp(f.joey.cool / 8, 0, 1) : 0, joeyReady: f.joeyReady, pouch: f.pouch,
          colors: f.coat ? MG.coatFor(s.def, f.coat) : null,
          hp: f.hp, mhp: f.maxHp, meter: f.meter, canSpecial: f.canSpecial, ammo: f.ammo, grenades: f.grenades,
          weapon: f.weapon ? f.weapon.id : null, ammoMax: f.weapon ? f.weapon.max : 0, armor: f.armor, armorMax: f.armorMax, coins: this.coinsOf(s),
          powers: Object.keys(f.powers).map((k) => [k, f.powers[k]]), respawnT: s.respawnT, ko: f.state === 'ko',
        };
      });
      const strips = [];
      if (this.showStrip && this.state === 'play' && !MG.Touch.enabled) {
        const locals = this.slots.filter((s) => s.local);
        if (locals.length === 1) strips.push({ fighter: locals[0].f, opts: this.net ? { tag: 'YOU (P1)', tagColor: MG.PLAYER_COLORS[0] } : {} });
        else {
          locals.forEach((s, i) => strips.push({
            fighter: s.f,
            opts: {
              layout: s.local === 'P2' ? 'p2' : 'p1', compact: true, x: i === 0 ? 16 : W - 16,
              align: i === 0 ? 'left' : 'right', tag: `P${s.id + 1}`, tagColor: MG.PLAYER_COLORS[s.id % 4],
            },
          }));
        }
      }
      const nextGate = this.gates.findIndex((g) => !g.opened);
      const g = nextGate >= 0 ? this.gates[nextGate] : null;
      return {
        t: this.t, coop: this.coop, players, score: this.score, mapName: this.L.name,
        net: this.net ? MG.Net.hudInfo() : null,
        progress: lead.x / this.goalX,
        boss: this.bossAwake && this.boss.alive ? { name: this.boss.d.name, frac: this.boss.hp / this.boss.maxHp } : null,
        gateLeft: g && g.x - lead.x < 260 && g.x > lead.x ? this.pestsLeft(nextGate) : 0,
        strips,
      };
    }

    draw(ctx) {
      for (const s of this.slots) s.f.tag = this.coop ? `P${s.id + 1}` : null;
      MG.drawCampaignWorld(ctx, {
        L: this.L, t: this.t, camX: this.camX, groundY: this.groundY, fx: this.fx, platforms: this.platforms,
        gates: this.gates.map((g, i) => ({ x: g.x, lift: g.lift, left: this.pestsLeft(i) })),
        crates: this.crates, pickups: this.pickups, enemies: this.enemies,
        players: this.slots.map((s) => s.f.renderState()).concat(this.allies.map((f) => f.renderState())),
        grenades: this.grenades, projectiles: this.projectiles, coins: this.coins, npcs: this.npcs,
        goalOpen: !this.boss || !this.boss.alive, world: this,
      });
      MG.CampaignHUD.draw(ctx, this.hudModel());
      MG.CampaignHUD.overlays(ctx, {
        state: this.state, stateT: this.stateT, t: this.t, L: this.L, score: this.score,
        hpBonus: this.hpBonus, newBest: this.newBest, coop: this.coop, showControls: this.showControls, joeyGrew: this.joeyGrew, coinLine: this.coinLine,
      });
      if (this.menu && !this.showControls) this.menu.draw(ctx);
      MG.drawScreenFlash(ctx, this.flashT / (this.flashMax || 1));
    }
  };

  // The Grand Grinner's camera flash: the whole screen goes white for a moment.
  MG.drawScreenFlash = function (ctx, k) {
    if (!(k > 0)) return;
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, k * 1.2)})`;
    ctx.fillRect(0, 0, MG.W, MG.H);
  };

  // The top surface under (x, y): the ground, or a platform.
  MG.floorBelow = function (platforms, groundY, x, y) {
    let best = groundY;
    for (const p of platforms) {
      if (x > p.x - 10 && x < p.x + p.w + 10 && p.y >= y - 1 && p.y < best) best = p.y;
    }
    return best;
  };

  // Draws the map and everything on it. Shared by the host (the real game) and Wi-Fi guests
  // (who draw from snapshots), so everyone sees the same thing.
  //  v: { L, t, camX, groundY, fx, platforms, gates: [{x, lift, left}], crates, pickups, enemies,
  //       players: [fighter renderState], grenades: [{ draw }], projectiles: [{ draw }], goalOpen, world }
  MG.drawCampaignWorld = function (ctx, v) {
    const W = MG.W;
    const A = MG.Art;
    const theme = v.L.theme || 'outback';
    const sh = v.fx.offset();
    ctx.save();
    v.fx.camera(ctx, v.camX);
    A.background(ctx, v.camX, v.t, v.groundY, v.L.sky, theme);
    if (A.groundDetail) A.groundDetail(ctx, theme, v.camX, v.groundY, v.t, v.L.sky === 'sunset');
    const lit = { theme, sunset: v.L.sky === 'sunset', camX: v.camX, t: v.t, groundY: v.groundY };
    if (MG.Light) MG.Light.back(ctx, lit);
    ctx.save();
    ctx.translate(-Math.round(v.camX) + sh.x, sh.y);
    const vis = (x, m = 200) => x > v.camX - m && x < v.camX + W + m;
    for (const d of v.L.decor || []) {
      if (!vis(d.x, (d.w || 0) + 260)) continue;
      if (d.type === 'mound') A.termiteMound(ctx, d.x, v.groundY, d.h);
      else if (d.type === 'sign') A.signpost(ctx, d.x, v.groundY, d.text);
      else if (A.decor) {
        // a quokka and a goanna chatting in the background... who freeze when you look straight at them
        if (d.type === 'quokkaGoanna') d.frozen = Math.abs(d.x - (v.camX + W / 2)) < 260;
        A.decor(ctx, d, v.groundY, v.t);
      }
    }
    for (let x = Math.floor(v.camX / 170) * 170; x < v.camX + W + 170; x += 170) {
      const r = Math.sin(x * 3.7) * 0.5 + 0.5;
      if (MG.waterAt(v.water || MG.waterZones(v.L), x + r * 90)) continue;
      if (theme === 'outback' || !A.groundPlant) A.spinifex(ctx, x + r * 90, v.groundY + 4 + r * 30, 0.8 + r * 0.6);
      else A.groundPlant(ctx, theme, x + r * 90, v.groundY + 4 + r * 30, 0.8 + r * 0.6);
    }
    for (const p of v.platforms) if (vis(p.x, p.w + 100)) A.platform(ctx, p, v.groundY, theme);
    const water = v.water || MG.waterZones(v.L);
    if (A.water) for (const z of water) if (vis(z.x, z.w + 100)) A.water(ctx, z.x, z.w, z.surface, v.groundY, v.t, false, theme);
    for (const n of v.npcs || []) if (n.kind === 'croc' && vis(n.x)) n.draw(ctx, v.world);
    for (const gr of v.L.grass || []) if (vis(gr.x, gr.w + 100)) A.grass(ctx, gr.x, gr.w, v.groundY, v.t, false);
    v.fx.drawDecals(ctx);
    const goalX = v.L.length - 160;
    if (v.goalOpen || vis(goalX)) A.finish(ctx, goalX + 60, v.groundY, v.t);
    for (const g of v.gates) if (vis(g.x)) A.gate(ctx, g.x, v.groundY, { open: g.lift, t: v.t, left: g.left });
    for (const c of v.crates) if (vis(c.x)) c.draw(ctx);
    for (const pk of v.pickups) if (vis(pk.x)) pk.draw(ctx);
    for (const n of v.npcs || []) if (n.kind !== 'croc' && vis(n.x)) n.draw(ctx, v.world);
    if (MG.Settings.contrast) {
      // high contrast: a bright ring under every pest (red) and player (their colour)
      ctx.lineWidth = 3;
      for (const e of v.enemies) if (e.alive && !e.hidden && vis(e.x)) { ctx.strokeStyle = '#ff2050'; ctx.beginPath(); ctx.ellipse(e.x, v.groundY, e.d.w * 0.55, 8, 0, 0, Math.PI * 2); ctx.stroke(); }
      for (const s of v.players) if (s.st !== 'ko') { ctx.strokeStyle = s.tc || '#ffffff'; ctx.beginPath(); ctx.ellipse(s.x, v.groundY, 30, 8, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    for (const e of v.enemies) if (vis(e.x) || !e.alive) e.draw(ctx, v.world);
    const order = v.players.slice().sort((a, b) => (b.st === 'ko') - (a.st === 'ko'));
    for (const s of order) MG.Fighter.drawState(ctx, s, v.world);
    for (const g of v.grenades) g.draw(ctx);
    for (const pr of v.projectiles) pr.draw(ctx);
    for (const c of v.coins || []) if (vis(c.x, 60)) c.draw(ctx);
    if (A.water) for (const z of water) if (vis(z.x, z.w + 100)) A.water(ctx, z.x, z.w, z.surface, v.groundY, v.t, true, theme);
    for (const gr of v.L.grass || []) if (vis(gr.x, gr.w + 100)) A.grass(ctx, gr.x - 6, gr.w + 12, v.groundY + 4, v.t, true);
    v.fx.draw(ctx);
    ctx.restore();
    ctx.restore();
    if (A.weather) A.weather(ctx, theme, v.camX, v.t);
    if (MG.Light) MG.Light.front(ctx, lit);
    v.fx.drawFinisher(ctx, v.camX);
  };

  // Water zones in a map: { x, w, depth } -> { x, w, surface }.
  MG.waterZones = function (L) {
    if (!L.water) return [];
    if (!L._water) L._water = L.water.map((z) => ({ x: z.x, w: z.w, surface: MG.GROUND_Y - (z.depth || 100) }));
    return L._water;
  };
  MG.waterAt = function (zones, x) {
    for (const z of zones || []) if (x > z.x && x < z.x + z.w) return z;
    return null;
  };

  // Campaign progress, saved in this browser: which maps are cleared. A map is open when it's the
  // first one or the one before it is cleared (and any map you've cleared can be replayed).
  MG.Progress = {
    cleared() { const c = MG.Save.get('cleared', {}); return c && typeof c === 'object' ? c : {}; },
    isCleared(id) { return !!this.cleared()[id] || this.best(id) > 0; }, // (a best score from before Milestone 6 counts too)
    clear(id) { const c = this.cleared(); if (!c[id]) { c[id] = 1; MG.Save.set('cleared', c); } },
    isOpen(i) {
      const L = MG.LEVELS[i];
      if (!L) return false;
      if (L.secret && !MG.Unlocks.has(L.secret)) return false; // e.g. Benny's Isle of Man
      if (this.isCleared(L.id) || i === 0) return true;
      return this.isCleared(L.after || MG.LEVELS[i - 1].id); // `after`: the map that opens it (branches)
    },
    best(id) { return (MG.Save.get('best', {}) || {})[id] || 0; },
    // The map that comes next on the path after map i (for "Next Map"), or -1: the following map
    // in the list, unless it starts a branch from somewhere else (a bonus world, a secret).
    next(i) {
      const L = MG.LEVELS[i], N = MG.LEVELS[i + 1];
      if (!L || !N || (N.after && N.after !== L.id) || !this.isOpen(i + 1)) return -1;
      return i + 1;
    },
  };
})();
