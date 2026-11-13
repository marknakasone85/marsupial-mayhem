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
    }

    // More players = tougher pests, so co-op stays a challenge.
    scaleForPlayers(n) {
      for (const e of this.enemies) {
        const base = MG.ENEMY_TYPES[e.type].hp;
        const k = n <= 1 ? 1 : e.isBoss ? 1 + 0.5 * (n - 1) : 1 + 0.35 * (n - 1);
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
      const alive = this.aliveFighters();
      const list = alive.length ? alive : this.fighters;
      return list.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
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

    spawnFighter(slot, x, keep) {
      const def = slot.def;
      const coat = def.coats ? slot.id % def.coats.length : 0;
      const f = new MG.Fighter(def, x, { team: 'player', mercy: 0.8, coat });
      if (keep) { f.grenades = keep.grenades; f.weapon = keep.weapon; }
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
      if (m.t === 'in') this.netInput(from, m);
      else if (m.t === 'pick' && m.ready && typeof from === 'number' && !this.slots.some((s) => s.id === from) &&
        this.slots.length < 4 && MG.CHARACTERS.some((c) => c.id === m.cid)) {
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
    onHit(attacker, target, hit, result) {
      if (result === 'hit' && !target.isProp && this.fighters.includes(attacker)) this.score += 10;
    }
    onEnemyKilled(e) {
      this.score += e.d.score;
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
    // Big Buck's foot thump: rabbits pop out of burrows at the edges of the arena.
    spawnWarren(n) {
      const living = this.enemies.filter((e) => e.alive && e.type === 'rabbit').length;
      const count = Math.min(n, 7 - living);
      for (let i = 0; i < count; i++) {
        const left = i % 2 === 0;
        const x = left ? this.arenaX + 60 + i * 20 : this.arenaX + W - 60 - i * 20;
        const r = this.addEnemy('rabbit', x);
        r.vy = -500;
        r.onGround = false;
        this.enemies.push(r);
        this.fx.burst(x, this.groundY, '#8a3520', 10, 200);
      }
      return count;
    }

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
        const f = alive.find((a) => U.overlap(pk.box, a.box));
        if (f) this.collect(pk, f);
      }
      this.pickups = this.pickups.filter((pk) => !pk.taken);

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
        if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
        items.push({ label: this.net ? 'End Wi-Fi Game' : 'Main Menu', act: () => this.quit() });
        this.menu = new MG.MenuList(items, W / 2, 262, { w: 340, h: 42, gap: 8 });
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
        f.giveWeapon('gatling', 30);
        MG.Audio.ammo();
        say(f.weapon && f.weapon.ammo > 30 ? '+30 GUMNUTS' : 'GUMNUT GATLING! (hold shoot)', '#ffb703');
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
      this.score += this.hpBonus;
      const best = MG.Save.get('best', {});
      if (!best[this.L.id] || this.score > best[this.L.id]) {
        best[this.L.id] = this.score;
        MG.Save.set('best', best);
        this.newBest = true;
      }
      const items = [];
      if (this.levelIndex + 1 < MG.LEVELS.length) items.push({ label: 'Next Map', act: () => this.goLevel(this.levelIndex + 1) });
      items.push({ label: 'Play Again', act: () => this.restart() });
      if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
      items.push({ label: this.net ? 'End Wi-Fi Game' : 'Main Menu', act: () => this.quit() });
      this.menu = new MG.MenuList(items, W / 2, 290, { w: 320, h: 42, gap: 8 });
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
      items.push({ label: this.net ? 'End Wi-Fi Game' : 'Quit to Menu', act: () => this.quit() });
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
          tag: `P${s.id + 1}`, color: MG.PLAYER_COLORS[s.id % 4], name: s.def.name,
          colors: f.coat && s.def.coats ? s.def.coats[f.coat] : null,
          hp: f.hp, mhp: f.maxHp, meter: f.meter, canSpecial: f.canSpecial, ammo: f.ammo, grenades: f.grenades,
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
        players: this.slots.map((s) => s.f.renderState()),
        grenades: this.grenades, projectiles: this.projectiles,
        goalOpen: !this.boss || !this.boss.alive, world: this,
      });
      MG.CampaignHUD.draw(ctx, this.hudModel());
      MG.CampaignHUD.overlays(ctx, {
        state: this.state, stateT: this.stateT, t: this.t, L: this.L, score: this.score,
        hpBonus: this.hpBonus, newBest: this.newBest, coop: this.coop, showControls: this.showControls,
      });
      if (this.menu && !this.showControls) this.menu.draw(ctx);
    }
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
    const sh = v.fx.offset();
    ctx.save();
    v.fx.camera(ctx, v.camX);
    MG.Art.background(ctx, v.camX, v.t, v.groundY);
    ctx.save();
    ctx.translate(-Math.round(v.camX) + sh.x, sh.y);
    const vis = (x, m = 200) => x > v.camX - m && x < v.camX + W + m;
    for (const d of v.L.decor || []) {
      if (!vis(d.x)) continue;
      if (d.type === 'mound') MG.Art.termiteMound(ctx, d.x, v.groundY, d.h);
      else if (d.type === 'sign') MG.Art.signpost(ctx, d.x, v.groundY, d.text);
    }
    for (let x = Math.floor(v.camX / 170) * 170; x < v.camX + W + 170; x += 170) {
      const r = Math.sin(x * 3.7) * 0.5 + 0.5;
      MG.Art.spinifex(ctx, x + r * 90, v.groundY + 4 + r * 30, 0.8 + r * 0.6);
    }
    for (const p of v.platforms) if (vis(p.x, p.w + 100)) MG.Art.platform(ctx, p, v.groundY);
    for (const gr of v.L.grass || []) if (vis(gr.x, gr.w + 100)) MG.Art.grass(ctx, gr.x, gr.w, v.groundY, v.t, false);
    v.fx.drawDecals(ctx);
    const goalX = v.L.length - 160;
    if (v.goalOpen || vis(goalX)) MG.Art.finish(ctx, goalX + 60, v.groundY, v.t);
    for (const g of v.gates) if (vis(g.x)) MG.Art.gate(ctx, g.x, v.groundY, { open: g.lift, t: v.t, left: g.left });
    for (const c of v.crates) if (vis(c.x)) c.draw(ctx);
    for (const pk of v.pickups) if (vis(pk.x)) pk.draw(ctx);
    for (const e of v.enemies) if (vis(e.x) || !e.alive) e.draw(ctx, v.world);
    const order = v.players.slice().sort((a, b) => (b.st === 'ko') - (a.st === 'ko'));
    for (const s of order) MG.Fighter.drawState(ctx, s, v.world);
    for (const g of v.grenades) g.draw(ctx);
    for (const pr of v.projectiles) pr.draw(ctx);
    for (const gr of v.L.grass || []) if (vis(gr.x, gr.w + 100)) MG.Art.grass(ctx, gr.x - 6, gr.w + 12, v.groundY + 4, v.t, true);
    v.fx.draw(ctx);
    ctx.restore();
    ctx.restore();
    v.fx.drawFinisher(ctx, v.camX);
  };
})();
