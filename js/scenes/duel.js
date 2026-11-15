// Tournament Duel: the fight for marsupial supremacy. Best of 3 rounds (first to 2 wins).
//  * One computer: you vs the CPU, or 2 players on one keyboard.
//  * Wi-Fi battle: 2-4 players (and CPU fillers), free-for-all; last one standing wins the round.
// Fair fights: everyone starts equal; grenades, weapons and power-ups only come from supply drops.
// Same design as Sloth Slap's Slapdown Duel.
(function () {
  const UI = MG.UI;
  const U = MG.U;
  const W = MG.W, H = MG.H;
  const ROUND_TIME = 60;
  const WINS_NEEDED = 2;
  const SNAP_RATE = 1 / 30;
  MG.DUEL_WINS = WINS_NEEDED;

  // ---------------------------------------------------------------- HUD (shared with Wi-Fi guests)
  // side = { tag, color, name, hp, mhp, ghost, meter, canSpecial, ammo, grenades, wins, ko }
  MG.DuelHUD = {
    draw(ctx, m) {
      const top = m.net ? 22 : 0;
      ctx.save();
      ctx.translate(0, top);
      if (m.sides.length === 2) this.classic(ctx, m);
      else this.compact(ctx, m);
      ctx.restore();
      if (m.net) UI.netStrip(ctx, m.net);
      for (const s of m.strips || []) UI.keyStrip(ctx, s.fighter, m.t, s.opts);
    },

    extras(ctx, s, x, y, align) {
      const r = align === 'right';
      let ix = r ? x - 10 : x + 10;
      // the joey (pink when ready) and the pouch's saved item, unless they show at the bottom of the screen
      if (!s.below) {
        ctx.fillStyle = s.joeyReady ? '#f6b3c4' : 'rgba(246,179,196,0.3)';
        ctx.beginPath(); ctx.arc(ix, y, 6, 0, Math.PI * 2); ctx.fill();
        UI.text(ctx, 'JOEY', r ? ix - 10 : ix + 10, y, 11, s.joeyReady ? '#f6b3c4' : '#a98a92', r ? 'right' : 'left');
        ix += r ? -52 : 52;
        if (s.pouch) {
          UI.pouchItem(ctx, s.pouch, ix, y, 7);
          ix += r ? -22 : 22;
        }
      }
      if (s.grenades > 0) {
        MG.Art.grenade(ctx, ix, y, { r: 6, pin: true });
        UI.text(ctx, 'x' + s.grenades, r ? ix - 10 : ix + 10, y, 12, '#9ef01a', r ? 'right' : 'left');
        ix += r ? -50 : 50;
      }
      if (s.weapon && MG.WEAPONS[s.weapon]) UI.text(ctx, MG.WEAPONS[s.weapon].short + ' ' + s.ammo, ix, y, 12, '#ffb703', r ? 'right' : 'left');
    },

    classic(ctx, m) {
      const bw = 360;
      m.sides.forEach((s, i) => {
        const flip = i === 1;
        const x = flip ? W - 30 - bw : 30;
        const frac = s.hp / s.mhp;
        UI.bar(ctx, x, 22, bw, 22, frac, frac > 0.3 ? '#52e07a' : '#ff4d6d', flip, s.ghost);
        if (s.armorMax > 0) UI.bar(ctx, x, 46, bw, 4, s.armor / s.armorMax, '#4ea8de', flip);
        UI.outlineText(ctx, `${s.tag}  ${s.name}`, flip ? x + bw : x, 62, 18, s.color, flip ? 'right' : 'left');
        const mx = flip ? x + bw - 200 : x;
        UI.bar(ctx, mx, 78, 200, 8, s.meter / MG.SPECIAL_COST, s.canSpecial ? (Math.floor(m.t * 6) % 2 ? '#00f5d4' : '#ffffff') : '#00b4d8', flip);
        if (s.canSpecial) UI.text(ctx, 'SPECIAL READY', flip ? mx - 10 : mx + 210, 82, 12, '#00f5d4', flip ? 'right' : 'left');
        this.extras(ctx, s, flip ? x + bw : x, 100, flip ? 'right' : 'left');
        // round wins: stars at the far end of the name line
        for (let k = 0; k < WINS_NEEDED; k++) {
          const px = flip ? x + 12 + k * 22 : x + bw - 12 - k * 22;
          MG.Art.star(ctx, px, 62, 9, k < s.wins ? '#ffd23f' : 'rgba(255,255,255,0.25)');
        }
      });
      UI.panel(ctx, W / 2 - 38, 12, 76, 52);
      UI.outlineText(ctx, String(Math.max(0, Math.ceil(m.timer))), W / 2, 39, 32, m.timer < 10 ? '#ff4d6d' : '#ffffff', 'center');
    },

    compact(ctx, m) {
      m.sides.forEach((s, i) => {
        const x = 12 + i * 236, w = 228;
        UI.panel(ctx, x, 8, w, 84);
        UI.outlineText(ctx, `${s.tag} ${s.name}`, x + 12, 24, 14, s.color);
        for (let k = 0; k < WINS_NEEDED; k++) MG.Art.star(ctx, x + w - 40 + k * 20, 24, 8, k < s.wins ? '#ffd23f' : 'rgba(255,255,255,0.25)');
        if (s.ko) {
          UI.text(ctx, 'KNOCKED OUT!', x + 12, 52, 14, '#ff4d6d');
        } else {
          const frac = s.hp / s.mhp;
          UI.bar(ctx, x + 12, 38, 170, 11, frac, frac > 0.3 ? '#52e07a' : '#ff4d6d', false, s.ghost);
          if (s.armorMax > 0) UI.bar(ctx, x + 12, 50, 170, 3, s.armor / s.armorMax, '#4ea8de');
          UI.text(ctx, `${Math.ceil(s.hp)}`, x + 190, 44, 12, '#ffffff');
          UI.bar(ctx, x + 12, 56, 170, 6, s.meter / MG.SPECIAL_COST, s.canSpecial ? (Math.floor(m.t * 6) % 2 ? '#00f5d4' : '#ffffff') : '#00b4d8');
          this.extras(ctx, s, x + 2, 76, 'left');
        }
      });
      UI.panel(ctx, W / 2 - 34, 98, 68, 40);
      UI.outlineText(ctx, String(Math.max(0, Math.ceil(m.timer))), W / 2, 119, 26, m.timer < 10 ? '#ff4d6d' : '#ffffff', 'center');
    },

    banner(ctx, text, age) {
      if (!text) return;
      const s = age < 0.25 ? U.easeOutBack(Math.max(0, age) / 0.25) : 1;
      ctx.save();
      ctx.translate(W / 2, 230);
      ctx.scale(s, s);
      ctx.rotate(-0.05);
      const big = text === 'FIGHT!';
      UI.outlineText(ctx, text, 0, 0, big ? 96 : text.length > 16 ? 48 : 66, big ? '#ff4d6d' : '#ffd23f', 'center');
      ctx.restore();
    },

    matchEnd(ctx, title, subtitle, stateT) {
      UI.fade(ctx, Math.min(0.5, stateT * 0.5));
      UI.outlineText(ctx, title, W / 2, 150, 56, '#ffd23f', 'center');
      UI.text(ctx, subtitle, W / 2, 200, 20, '#ffffff', 'center');
    },
  };

  // The coat for each slot: a second (third...) player with the same character gets a different one.
  function coatIndex(slots, s) {
    let n = 0;
    for (const o of slots) { if (o === s) break; if (o.cid === s.cid) n++; }
    return n;
  }

  // ---------------------------------------------------------------- the match
  MG.DuelScene = class {
    // opts: { stage, players: [{ id, cid, local, cpu }], net }
    //   local = 'SOLO' | 'P1' | 'P2' (keys here), null = a Wi-Fi player; cpu = CPU level (0-2)
    constructor(opts) {
      this.opts = opts;
      this.net = !!opts.net;
      this.stageIndex = Math.max(0, Math.min(MG.STAGES.length - 1, opts.stage || 0));
      this.stage = MG.STAGES[this.stageIndex];
      this.groundY = MG.GROUND_Y;
      this.gravity = 1;
      this.platforms = this.stage.platforms || [];
      this.fx = new MG.FX();
      if (this.net) { MG.Sync.wrapFX(this.fx); MG.Sync.installAudioHook(); }
      this.slots = opts.players.map((p) => this.makeSlot(p));
      this.pending = [];
      this.round = 0;
      this.t = 0;
      this.syncT = 0;
      this.showStrip = MG.Save.get('keyStrip', true);
      this.startRound();
    }

    makeSlot(p) {
      return {
        id: p.id, cid: p.cid, def: MG.charById(p.cid), local: p.local || null,
        cpuLevel: p.cpu, cpu: p.cpu !== undefined && p.cpu !== null ? new MG.CPU(p.cpu) : null,
        wins: 0, held: {}, presses: {}, inSeq: 0, ghost: 1, f: null,
      };
    }

    get vsCpu() { return !this.net && this.slots.some((s) => s.cpu); }
    get fighters() { return this.slots.map((s) => s.f); }
    currentPlayers() { return this.slots.map((s) => ({ id: s.id, cid: s.cid, local: s.local, cpu: s.cpuLevel })); }
    // CPUs are "CPU"; people are numbered among people only (P1 = host, P2 = the first friend...)
    tagOf(s) {
      if (s.cpu) return 'CPU';
      if (!this.net && this.vsCpu) return 'YOU';
      return `P${this.slots.filter((o) => !o.cpu).indexOf(s) + 1}`;
    }
    colorOf(s) { return MG.PLAYER_COLORS[this.slots.indexOf(s) % 4]; }

    enter() {
      MG.Audio.playMusic('boss');
      if (this.net) MG.Net.onMessage = (m, from) => this.onNet(m, from);
    }

    startRound() {
      for (const p of this.pending) {
        if (this.slots.length < 4 && !this.slots.some((s) => s.id === p.id)) this.slots.push(this.makeSlot(p));
      }
      this.pending = [];
      this.round++;
      const n = this.slots.length;
      this.slots.forEach((s, i) => {
        const x = n === 2 ? (i === 0 ? 260 : W - 260) : 140 + i * ((W - 280) / Math.max(1, n - 1));
        s.f = new MG.Fighter(s.def, x, { team: 'd' + s.id, facing: x < W / 2 ? 1 : -1, autoFace: true, grenades: 0, coat: coatIndex(this.slots, s),
          joeyLevel: 1, joeyRescue: false }); // fair fights: level-1 joeys, no rescue
        s.f.tag = this.tagOf(s);
        s.f.tagColor = this.colorOf(s);
        s.ghost = 1;
        s.held = {};
        s.presses = {};
      });
      this.projectiles = [];
      this.grenades = [];
      this.pickups = [];
      this.dropT = 6;
      this.timer = ROUND_TIME + (n > 2 ? 15 : 0);
      this.state = 'intro';
      this.stateT = 0;
      this.menu = null;
      this.banner = null;
      this.bannerAt = 0;
    }

    setBanner(text) { this.banner = text; this.bannerAt = this.stateT; }

    // ---------------- world interface ----------------
    bounds() { return { min: 20, max: W - 20 }; }
    view() { return { min: 0, max: W }; }
    targets(team) { return this.slots.filter((s) => s.f.team !== team && s.f.state !== 'ko').map((s) => s.f); }
    spawn(p) { this.projectiles.push(p); }
    spawnGrenade(g) { this.grenades.push(g); }
    walls() { return this.projectiles.filter((p) => p.wall); }
    grenadeNear(f) {
      let best = null, bd = 70;
      for (const g of this.grenades) {
        if (g.dead) continue;
        const d = Math.abs(g.x - f.x);
        if (d < bd && Math.abs(g.y - f.y) < 70) { bd = d; best = g; }
      }
      return best;
    }
    opponentOf(f) {
      let best = null, bd = Infinity;
      for (const s of this.slots) {
        const o = s.f;
        if (o === f) continue;
        const d = Math.abs(o.x - f.x) + (o.state === 'ko' ? 5000 : 0) + (o.playingDead ? 3000 : 0);
        if (d < bd) { bd = d; best = o; }
      }
      return best;
    }
    faceTarget(f) { const o = this.opponentOf(f); return o ? o.x : null; }
    floorBelow(x, y) { return MG.floorBelow(this.platforms, this.groundY, x, y); }
    addPickup(type, x, y) { this.pickups.push(new MG.Pickup(type, x, y)); }
    grabPickup(box, f) {
      const pk = this.pickups.find((p) => !p.taken && U.overlap(box, p.box));
      if (!pk || !f) return false;
      this.collect(pk, f);
      return true;
    }

    controlsFor(s, dt) {
      if (s.cpu) return s.cpu.control(s.f, this.opponentOf(s.f), dt, this);
      if (s.local) return MG.readControls(MG.Controls[s.local]);
      if (this.t - (s.lastIn === undefined ? this.t : s.lastIn) > 1.5) s.held = {};
      const c = Object.assign({ left: false, right: false, down: false, shoot: false, jump: false }, s.held, s.presses);
      s.presses = {};
      return c;
    }

    // ---------------- Wi-Fi messages (host side) ----------------
    onNet(m, from) {
      if (!m) return;
      if (from === 'server') {
        if (m.t === 'joined') {
          MG.Net.send({ t: 'welcome', inGame: true, mode: 'battle' }, m.id, true);
          this.fx.text(W / 2, 170, 'A new player is joining...', '#9bf6ff', 22);
        } else if (m.t === 'left') {
          const s = this.slots.find((q) => q.id === m.id);
          this.pending = this.pending.filter((p) => p.id !== m.id);
          if (s && this.slots.length > 1) {
            this.slots = this.slots.filter((q) => q !== s);
            this.fx.text(s.f.x, s.f.y - 150, `${s.def.name} left the battle`, '#cccccc', 20);
          }
        }
        return;
      }
      if (m.t === 'in') {
        const s = this.slots.find((q) => q.id === from);
        if (!s) return;
        s.lastIn = this.t;
        if (m.n > s.inSeq) { s.inSeq = m.n; s.held = { left: !!m.l, right: !!m.r, down: !!m.d, shoot: !!m.s, jump: !!m.j }; }
        for (const k of Array.isArray(m.p) ? m.p : []) if (MG.PRESS_KEYS.includes(k)) s.presses[k] = true;
      } else if (m.t === 'pick' && m.ready && typeof from === 'number' && MG.validCid(m.cid) &&
        !this.slots.some((s) => s.id === from) && !this.pending.some((p) => p.id === from)) {
        if (this.slots.length + this.pending.length >= 4) return;
        this.pending.push({ id: from, cid: m.cid, local: null });
        this.fx.text(W / 2, 170, `${MG.charById(m.cid).name} joins next round!`, '#9bf6ff', 22);
      }
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.stateT += dt;
      this.fx.update(dt);
      if (this.net) MG.Sync.capturing = true;
      try { this.step(dt); } finally { if (this.net) MG.Sync.capturing = false; }
      const realDt = MG.Engine.unscaled(dt);
      if (this.net) MG.Net.maintain(realDt, () => {
        this.slots = this.slots.filter((s) => s.local || s.cpu);
        this.fx.text(W / 2, 190, `Wi-Fi is back! Friends jump in next round (code ${MG.Net.code})`, '#9bf6ff', 20);
      });
      if (this.net && MG.Engine.scene === this) {
        this.syncT += realDt;
        if (this.syncT >= SNAP_RATE) { this.syncT = 0; MG.Net.send(MG.Sync.duelSnapshot(this)); }
      }
    }

    step(dt) {
      if (this.showControls) {
        if (MG.Input.anyPressed()) { this.showControls = false; MG.Audio.select(); }
        return;
      }
      if (this.state === 'paused') {
        if (MG.Menu.pause()) { this.state = this.prevState; this.menu = null; return; }
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }
      if (this.menu && this.stateT > 0.8) {
        const item = this.menu.update(dt);
        if (item) { item.act(); return; }
      }
      if ((this.state === 'fight' || this.state === 'intro') && MG.Menu.pause()) { this.pause(); return; }

      const fighting = this.state === 'fight';
      for (const s of this.slots) {
        const c = fighting ? this.controlsFor(s, dt) : (s.presses = {}, {});
        s.f.update(dt, c, this);
        if (fighting) s.f.meter = Math.min(MG.SPECIAL_COST, s.f.meter + dt * 4);
      }
      this.separate();
      for (const p of this.projectiles) p.update(dt, this);
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      for (const g of this.grenades) g.update(dt, this);
      this.grenades = this.grenades.filter((g) => !g.dead);

      // supply drops: the only way to get grenades, a weapon or power-ups
      if (fighting) {
        this.dropT -= dt;
        if (this.dropT <= 0 && this.pickups.length < 3) { this.dropT = U.rand(9, 13); this.supplyDrop(); }
      }
      const standing = this.slots.filter((s) => s.f.state !== 'ko').map((s) => s.f);
      for (const pk of this.pickups) {
        pk.update(dt, this);
        if (pk.taken || pk.y < this.floorBelow(pk.x, pk.y) - 2) continue;
        const f = standing.find((a) => U.overlap(pk.box, a.box));
        if (f) this.collect(pk, f);
      }
      this.pickups = this.pickups.filter((pk) => !pk.taken);

      // trailing "ghost" health for juicy damage feedback
      for (const s of this.slots) {
        const frac = Math.max(0, s.f.hp) / s.f.maxHp;
        s.ghost = frac < s.ghost ? Math.max(frac, s.ghost - dt * 0.4) : frac;
      }

      if (this.state === 'intro') {
        if (this.stateT > 0.1 && !this.banner) { this.setBanner(`ROUND ${this.round}`); MG.Audio.gong(); }
        if (this.stateT > 1.3 && this.banner !== 'FIGHT!') { this.setBanner('FIGHT!'); MG.Audio.kick(); }
        if (this.stateT > 1.9) { this.state = 'fight'; this.stateT = 0; this.banner = null; }
      } else if (fighting) {
        this.timer -= dt;
        const alive = this.slots.filter((s) => s.f.state !== 'ko');
        if (alive.length <= 1) this.endRound(alive.length ? alive[0] : null, 'ko');
        else if (this.timer <= 0) {
          const frac = (s) => s.f.hp / s.f.maxHp;
          const sorted = alive.slice().sort((a, b) => frac(b) - frac(a));
          const tie = Math.abs(frac(sorted[0]) - frac(sorted[1])) < 0.001;
          this.endRound(tie ? null : sorted[0], 'time');
        }
      } else if (this.state === 'roundEnd') {
        if (this.stateT > 1.2 && this.roundWinner) {
          const w = this.roundWinner.f;
          if (w.state !== 'ko' && w.onGround) { w.state = 'win'; w.move = null; }
        }
        if (this.stateT > 3) {
          if (this.slots.some((s) => s.wins >= WINS_NEEDED)) this.endMatch();
          else this.startRound();
        }
      }
    }

    supplyDrop() {
      const r = Math.random();
      // a weapon to borrow (any of them, fair for everyone), armor, or the usual
      const type = r < 0.25 ? 'heart' : r < 0.45 ? 'grenades' : r < 0.63 ? 'w:' + U.choice(MG.WEAPON_IDS) : r < 0.73 ? 'armor' : U.choice(MG.POWER_TYPES);
      const x = U.rand(120, W - 120);
      this.addPickup(type, x, -30);
      this.fx.text(x, 140, 'SUPPLY DROP!', '#ffd23f', 20);
      MG.Audio.pickup();
    }

    collect(pk, f) {
      pk.taken = true;
      const say = (text, color) => this.fx.text(pk.x, pk.y - 50, text, color, 20);
      if (f.has('snackSpeed')) f.powerUp('snack', 4);
      // the pouch saves what you don't need right now: a heart at full health, a power-up while one is running
      if (pk.type === 'heart' && f.hp >= f.maxHp && f.store('heart', this)) return;
      if (MG.POWER_TYPES.includes(pk.type) && MG.POWER_TYPES.some((k) => f.powers[k]) && f.store(pk.type, this)) return;
      if (pk.type === 'heart') { f.heal(30); MG.Audio.heal(); say('+30 HP', '#ff4d6d'); }
      else if (pk.type === 'grenades') { f.giveGrenades(2); MG.Audio.ammo(); say('+2 GRENADES', '#9ef01a'); }
      else if (pk.type === 'gatling') { f.giveWeapon('gatling', 50); MG.Audio.powerUp(); say('GUMNUT GATLING!', '#ffb703'); }
      else if (pk.type === 'armor') { f.giveArmor(MG.ARMOR_PICKUP); MG.Audio.block(); say('+' + MG.ARMOR_PICKUP + ' ARMOR', '#9bd0ff'); }
      else if (MG.pickupWeapon(pk.type)) {
        const id = MG.pickupWeapon(pk.type);
        f.giveWeapon(id, Math.ceil(MG.WEAPONS[id].pickupAmmo / 2)); // half a map's worth: duels are short
        MG.Audio.powerUp(); say(MG.WEAPONS[id].name + '!', '#ffb703');
      }
      else if (MG.POWER_TYPES.includes(pk.type)) { f.powerUp(pk.type, 8); MG.Audio.powerUp(); say(MG.POWER_NAMES[pk.type], MG.Art.POWER_COLORS[pk.type]); }
    }

    // keep fighters from walking through each other
    separate() {
      const fs = this.slots.map((s) => s.f).filter((f) => f.state !== 'ko' && !f.burrowed);
      for (let i = 0; i < fs.length; i++) {
        for (let j = i + 1; j < fs.length; j++) {
          const a = fs[i], b = fs[j];
          const minD = (a.w + b.w) * 0.42;
          const dx = b.x - a.x;
          const vertical = Math.abs(a.y - b.y) < Math.min(a.h, b.h) * 0.7;
          if (Math.abs(dx) < minD && vertical) {
            const push = (minD - Math.abs(dx)) / 2;
            const sgn = dx >= 0 ? 1 : -1;
            a.x = U.clamp(a.x - push * sgn, 20 + a.w / 2, W - 20 - a.w / 2);
            b.x = U.clamp(b.x + push * sgn, 20 + b.w / 2, W - 20 - b.w / 2);
          }
        }
      }
    }

    endRound(winner, how) {
      this.state = 'roundEnd';
      this.stateT = 0;
      this.roundWinner = winner;
      if (winner) winner.wins++;
      if (how === 'time') this.setBanner(winner ? 'TIME!' : 'DRAW!');
      else {
        this.setBanner('K.O.!');
        const loser = this.slots.find((s) => s !== winner && s.f.state === 'ko');
        if (loser) { this.fx.finisher(loser.f.x, loser.f.y - loser.f.h * 0.5, false); MG.Engine.slowmo(1.1, 0.3); MG.Audio.finisher(); }
      }
      MG.Audio.win();
    }

    matchTitle() {
      const w = this.matchWinner;
      if (!w) return 'DRAW!';
      if (this.vsCpu) return w.cpu ? 'THE CPU WINS!' : 'YOU WIN!';
      return `${this.tagOf(w)} WINS!`;
    }

    endMatch() {
      this.state = 'matchEnd';
      this.stateT = 0;
      this.matchWinner = this.slots.find((s) => s.wins >= WINS_NEEDED) || null;
      MG.Audio.stopMusic();
      MG.Audio.win();
      const items = [{ label: 'Rematch', act: () => this.rematch() }];
      if (!this.net) items.push({ label: 'Change Characters', act: () => MG.Engine.setScene(new MG.SelectScene({ mode: this.vsCpu ? 'duelCpu' : 'duel2' })) });
      if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
      items.push({ label: this.net ? 'End Wi-Fi Game' : 'Main Menu', act: () => this.quit() });
      this.menu = new MG.MenuList(items, W / 2, 260, { w: 320, h: 44, gap: 10 });
    }

    rematch() { MG.Engine.setScene(new MG.DuelScene({ stage: this.stageIndex, net: this.net, players: this.currentPlayers() })); }

    pause() {
      this.prevState = this.state;
      this.state = 'paused';
      MG.Audio.select();
      const items = [
        { label: 'Resume', act: () => { this.state = this.prevState; this.menu = null; } },
        { label: 'Controls', act: () => { this.showControls = true; } },
        { label: () => MG.onscreenLabel(this), act: () => MG.cycleOnscreen(this) },
        { label: () => 'Blood: ' + (MG.Settings.blood ? 'ON' : 'OFF (confetti)'), act: () => MG.toggleBlood() },
        { label: () => 'Sound: ' + (MG.Audio.muted ? 'OFF' : 'ON'), act: () => MG.Audio.toggleMute() },
      ];
      if (this.net) items.push({ label: 'Back to Lobby', act: () => this.backToLobby() });
      items.push({ label: this.net ? 'End Wi-Fi Game' : 'Quit to Menu', act: () => this.quit() });
      this.menu = new MG.MenuList(items, W / 2, 180, { w: 340, h: 38, gap: 7 });
    }

    backToLobby() {
      MG.Net.send({ t: 'toLobby' }, 'all', true);
      MG.Engine.setScene(new MG.LobbyScene({
        mode: 'battle', resume: true, stage: this.stageIndex,
        players: this.slots.map((s) => ({ id: s.id, cid: s.cid, ready: true, cpu: s.cpuLevel })),
      }));
    }

    quit() {
      if (this.net) MG.Net.leave();
      MG.Engine.setScene(new MG.MenuScene());
    }

    wantsTouch() { return (this.state === 'fight' || this.state === 'intro') && !this.menu && !this.showControls; }
    touchPlayer() { const s = this.slots.find((x) => x.local); return s ? s.f : null; }

    // ---------------- draw ----------------
    hudModel() {
      const strips = [];
      if (this.showStrip && (this.state === 'fight' || this.state === 'intro') && !MG.Touch.enabled) {
        const locals = this.slots.filter((s) => s.local);
        if (locals.length === 1) strips.push({ fighter: locals[0].f, opts: {} });
        else locals.forEach((s, i) => strips.push({
          fighter: s.f,
          opts: { layout: s.local === 'P2' ? 'p2' : 'p1', compact: true, x: i === 0 ? 16 : W - 16, align: i === 0 ? 'left' : 'right', tag: this.tagOf(s), tagColor: this.colorOf(s) },
        }));
      }
      return {
        t: this.t, timer: this.timer, net: this.net ? MG.Net.hudInfo() : null, strips,
        sides: this.slots.map((s) => ({
          tag: this.tagOf(s), color: this.colorOf(s), name: s.def.name, hp: Math.max(0, s.f.hp), mhp: s.f.maxHp, ghost: s.ghost,
          meter: s.f.meter, canSpecial: s.f.canSpecial, ammo: s.f.ammo, grenades: s.f.grenades, wins: s.wins, ko: s.f.state === 'ko',
          joeyReady: s.f.joeyReady, pouch: s.f.pouch,
          below: strips.some((st) => st.fighter === s.f) || (MG.Touch.visible() && s.f === this.touchPlayer()),
          weapon: s.f.weapon ? s.f.weapon.id : null, armor: s.f.armor, armorMax: s.f.armorMax,
        })),
      };
    }

    draw(ctx) {
      MG.drawDuelStage(ctx, {
        stage: this.stage, t: this.t, fx: this.fx, groundY: this.groundY, platforms: this.platforms,
        pickups: this.pickups, players: this.slots.map((s) => s.f.renderState()), grenades: this.grenades,
        projectiles: this.projectiles, world: this,
      });
      MG.DuelHUD.draw(ctx, this.hudModel());
      MG.DuelHUD.banner(ctx, this.banner, this.stateT - this.bannerAt);
      if (this.state === 'matchEnd') {
        const w = this.matchWinner;
        MG.DuelHUD.matchEnd(ctx, this.matchTitle(), w ? `${w.def.name} is the Marsupial Champion!` : 'Nobody wins this time.', this.stateT);
      }
      if (this.showControls) { UI.fade(ctx, 0.6); UI.controlsPanel(ctx); return; }
      if (this.state === 'paused') { UI.fade(ctx, 0.55); UI.outlineText(ctx, 'PAUSED', W / 2, 140, 44, '#ffd23f', 'center'); }
      if (this.menu && (this.state === 'paused' || this.stateT > 0.8)) this.menu.draw(ctx);
    }
  };

  // Draws a duel stage and everything on it (shared by the host and Wi-Fi guests).
  MG.drawDuelStage = function (ctx, v) {
    const sh = v.fx.offset();
    ctx.save();
    v.fx.camera(ctx, 0);
    MG.Art.background(ctx, 0, v.t, v.groundY, v.stage.sky);
    if (MG.Art.groundDetail) MG.Art.groundDetail(ctx, 'outback', 0, v.groundY, v.t, v.stage.sky === 'sunset');
    const lit = { theme: 'outback', sunset: v.stage.sky === 'sunset', camX: 0, t: v.t, groundY: v.groundY };
    if (MG.Light) MG.Light.back(ctx, lit);
    ctx.save();
    ctx.translate(sh.x, sh.y);
    // a little tournament banner on the back wall
    ctx.fillStyle = 'rgba(43,25,61,0.6)';
    ctx.beginPath(); ctx.roundRect(W / 2 - 170, v.groundY - 64, 340, 30, 10); ctx.fill();
    UI.text(ctx, 'GREAT POUCH TOURNAMENT', W / 2, v.groundY - 49, 15, '#ffd23f', 'center');
    for (const p of v.platforms) MG.Art.platform(ctx, p, v.groundY);
    v.fx.drawDecals(ctx);
    for (const pk of v.pickups) pk.draw(ctx);
    const order = v.players.slice().sort((a, b) => (b.st === 'ko') - (a.st === 'ko'));
    for (const s of order) MG.Fighter.drawState(ctx, s, v.world);
    for (const g of v.grenades) g.draw(ctx);
    for (const p of v.projectiles) p.draw(ctx);
    v.fx.draw(ctx);
    ctx.restore();
    ctx.restore();
    if (MG.Light) MG.Light.front(ctx, lit);
    v.fx.drawFinisher(ctx, 0);
  };

  // ---------------------------------------------------------------- the snapshot for Wi-Fi guests
  MG.Sync.duelSnapshot = function (scene) {
    const b = this.takeBuffer();
    const r1 = (v) => Math.round(v * 10) / 10;
    const r2 = (v) => Math.round(v * 100) / 100;
    return {
      t: 'snap', k: 'duel', n: ++this.seq, st: scene.state, stT: r2(scene.stateT), timer: r2(scene.timer),
      rd: scene.round, bn: scene.banner || 0, ba: r2(scene.stateT - scene.bannerAt), stg: scene.stageIndex,
      ttl: scene.state === 'matchEnd' ? scene.matchTitle() : 0,
      sub: scene.state === 'matchEnd' && scene.matchWinner ? `${scene.matchWinner.def.name} is the Marsupial Champion!` : 0,
      pl: scene.slots.map((s) => this.compact(Object.assign(s.f.renderState(), {
        id: s.id, tag: scene.tagOf(s), tc: scene.colorOf(s), hp: Math.max(0, Math.round(s.f.hp)), mhp: s.f.maxHp,
        gh: r2(s.ghost), me: Math.round(s.f.meter), cs: s.f.canSpecial ? 1 : 0, am: s.f.ammo, gr: s.f.grenades, jr: s.f.joeyReady ? 1 : 0,
        wins: s.wins, cpu: s.cpu ? 1 : 0, wpn: s.f.weapon ? s.f.weapon.id : 0,
      }))),
      pr: scene.projectiles.map(this.projState),
      gn: scene.grenades.map((g) => [r1(g.x), r1(g.y), r2(g.spin), r2(g.fuse), r2(g.t)]),
      pk: scene.pickups.map((p) => [p.type, r1(p.x), r1(p.y)]),
      fx: b.fx, au: b.au,
    };
  };
})();
