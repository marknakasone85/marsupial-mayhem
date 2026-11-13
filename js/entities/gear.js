// Your coins and gear (saved in this browser), the shop's buying rules, and coins in maps.
// Each player has their own wallet: 'p1' (this device's player, also on Wi-Fi) and 'p2' (the second
// player on this keyboard). Duels ignore all of this: they're fair fights.
(function () {
  const U = MG.U;
  const has = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
  const int = (v, lo, hi) => U.clamp(Math.floor(Number(v) || 0), lo, hi);
  const blank = () => ({ coins: 0, weapons: {}, weapon: null, armors: {}, armor: null, heart: 0, belt: 0 });

  // The shop's items, in the order shown.
  const ITEMS = [].concat(
    MG.WEAPON_IDS.map((id) => ({ kind: 'weapon', id })),
    MG.ARMOR_IDS.map((id) => ({ kind: 'armor', id })),
    Object.keys(MG.UPGRADES).map((id) => ({ kind: 'upgrade', id })),
  );

  MG.Gear = {
    PIDS: ['p1', 'p2'],
    ITEMS,

    // ---- the saved wallets
    all() { const a = MG.Save.get('gear', {}); return a && typeof a === 'object' ? a : {}; },
    get(pid) {
      const p = Object.assign(blank(), this.all()[pid] || {});
      // only real items survive (an old or edited save can't break the game)
      const weapons = {}, armors = {};
      for (const id of MG.WEAPON_IDS) if (has(p.weapons, id)) weapons[id] = int(p.weapons[id], 1, MG.MAX_WEAPON_LEVEL);
      for (const id of MG.ARMOR_IDS) if (has(p.armors, id)) armors[id] = 1;
      return {
        coins: int(p.coins, 0, 9999999), weapons, armors,
        weapon: has(weapons, p.weapon) ? p.weapon : null, armor: has(armors, p.armor) ? p.armor : null,
        heart: int(p.heart, 0, MG.UPGRADES.heart.prices.length), belt: int(p.belt, 0, MG.UPGRADES.belt.prices.length),
      };
    },
    set(pid, prof) { const a = this.all(); a[pid] = prof; MG.Save.set('gear', a); },
    coins(pid) { return this.get(pid).coins; },
    addCoins(pid, n) { const p = this.get(pid); p.coins = Math.max(0, Math.round(p.coins + n)); this.set(pid, p); return p.coins; },

    // What a player brings into a map: { w: weapon, wl: its level, a: armor, hp: heart level, gb: belt level }
    loadout(pid) {
      const p = this.get(pid);
      return { w: p.weapon, wl: p.weapon ? p.weapons[p.weapon] : 0, a: p.armor, hp: p.heart, gb: p.belt };
    },
    // A Wi-Fi friend's loadout, checked: only real items, levels in range.
    clean(lo) {
      lo = lo && typeof lo === 'object' ? lo : {};
      const w = typeof lo.w === 'string' && has(MG.WEAPONS, lo.w) ? lo.w : null;
      return {
        w, wl: w ? int(lo.wl, 1, MG.MAX_WEAPON_LEVEL) : 0,
        a: typeof lo.a === 'string' && has(MG.ARMORS, lo.a) ? lo.a : null,
        hp: int(lo.hp, 0, MG.UPGRADES.heart.prices.length), gb: int(lo.gb, 0, MG.UPGRADES.belt.prices.length),
      };
    },
    // Gives a fighter its gear at the start of a map (or a checkpoint).
    apply(f, lo) {
      if (!lo) return;
      if (lo.hp) { f.maxHp += MG.UPGRADES.heart.per * lo.hp; f.hp = f.maxHp; }
      if (lo.a && has(MG.ARMORS, lo.a)) { f.armorMax = MG.ARMORS[lo.a].armor; f.armor = f.armorMax; f.armorId = lo.a; }
      if (lo.gb) f.grenades = Math.min(MG.MAX_GRENADES, f.grenades + lo.gb);
      if (lo.w && has(MG.WEAPONS, lo.w)) f.equip(lo.w, lo.wl || 1);
    },

    // ---- the shop: what the button on an item does for this player
    //  { action: 'buy' | 'equip' | 'upgrade' | 'maxed', price, label, can, level, max, equipped }
    offer(pid, item) {
      const p = this.get(pid);
      if (item.kind === 'weapon') {
        const lv = p.weapons[item.id] || 0;
        const equipped = p.weapon === item.id;
        if (!lv) return this.priced('buy', MG.WEAPONS[item.id].price, p, { level: 0, max: MG.MAX_WEAPON_LEVEL });
        if (!equipped) return { action: 'equip', price: 0, label: 'USE IT', can: true, level: lv, max: MG.MAX_WEAPON_LEVEL };
        if (lv >= MG.MAX_WEAPON_LEVEL) return { action: 'maxed', price: 0, label: 'MAXED', can: false, level: lv, max: MG.MAX_WEAPON_LEVEL, equipped };
        return this.priced('upgrade', MG.upgradePrice(item.id, lv + 1), p, { level: lv, max: MG.MAX_WEAPON_LEVEL, equipped });
      }
      if (item.kind === 'armor') {
        if (!p.armors[item.id]) return this.priced('buy', MG.ARMORS[item.id].price, p, {});
        if (p.armor !== item.id) return { action: 'equip', price: 0, label: 'WEAR IT', can: true };
        return { action: 'maxed', price: 0, label: 'WEARING', can: false, equipped: true };
      }
      const u = MG.UPGRADES[item.id];
      const lv = p[item.id];
      if (lv >= u.prices.length) return { action: 'maxed', price: 0, label: 'MAXED', can: false, level: lv, max: u.prices.length };
      return this.priced('buy', u.prices[lv], p, { level: lv, max: u.prices.length });
    },
    priced(action, price, p, extra) {
      return Object.assign({ action, price, label: (action === 'upgrade' ? 'UPGRADE ' : 'BUY ') + price, can: p.coins >= price }, extra);
    },
    // Presses the item's button. Returns what happened (for the shop to say), or null.
    act(pid, item) {
      const o = this.offer(pid, item);
      if (!o.can) return null;
      const p = this.get(pid);
      p.coins -= o.price;
      let said = '';
      if (item.kind === 'weapon') {
        if (o.action === 'buy') { p.weapons[item.id] = 1; p.weapon = item.id; said = 'BOUGHT! ' + MG.WEAPONS[item.id].short; }
        else if (o.action === 'equip') { p.weapon = item.id; said = 'NOW USING ' + MG.WEAPONS[item.id].short; }
        else { p.weapons[item.id] = (p.weapons[item.id] || 1) + 1; said = MG.WEAPONS[item.id].short + ' LEVEL ' + p.weapons[item.id] + '!'; }
      } else if (item.kind === 'armor') {
        if (o.action === 'buy') { p.armors[item.id] = 1; said = 'BOUGHT! ' + MG.ARMORS[item.id].name; }
        else said = 'NOW WEARING ' + MG.ARMORS[item.id].name;
        p.armor = item.id;
      } else {
        p[item.id] += 1;
        said = MG.UPGRADES[item.id].name + ' ' + p[item.id] + '!';
      }
      this.set(pid, p);
      return { said, action: o.action };
    },

    // ---- Wi-Fi: the host remembers each friend's gear and coins from their messages
    // ({ t: 'pick' | 'gear', lo, coins }). Keyed by player number, no prototype.
    friends: Object.create(null),
    note(from, m) {
      if (typeof from !== 'number' || !m || !m.lo) return;
      this.friends[from] = { lo: this.clean(m.lo), coins: int(m.coins, 0, 9999999), ready: !!m.ready };
    },
    // What this device sends about itself.
    mine() { return { lo: this.loadout('p1'), coins: this.coins('p1') }; },

    // ---- Wi-Fi friends: coins they earn in the host's game are added to their own wallet.
    // The host sends a running total per game; we remember how much of it we already added
    // (in this tab, so a rejoin never counts it twice).
    netEarn(gid, id, total) {
      if (!gid || !(total > 0)) return 0;
      const key = 'marsupialmayhem.earned';
      const tag = gid + ':' + id;
      let seen = this.earnedSeen;
      if (!seen) { try { seen = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) { seen = null; } }
      if (!seen || typeof seen !== 'object') seen = {};
      const before = seen.tag === tag ? Number(seen.n) || 0 : 0;
      if (total <= before) return 0;
      this.addCoins('p1', total - before);
      this.earnedSeen = { tag, n: total };
      try { sessionStorage.setItem(key, JSON.stringify(this.earnedSeen)); } catch (e) { /* private mode: memory is enough */ }
      return total - before;
    },
  };

  // Who gets the coins for a knockout: the fighter, the owner of a shot, or whoever dropped the grenade.
  MG.killerOf = (hit) => {
    const from = hit && hit.from;
    if (!from) return null;
    if (from instanceof MG.Fighter) return from;
    if (from.hit && from.hit.owner instanceof MG.Fighter) return from.hit.owner;
    if (from.owner instanceof MG.Fighter) return from.owner;
    return null;
  };

  // ---------- Coins in maps ----------
  // Dropped coins fly to the player who knocked the pest out, like a black hole: they spiral in
  // faster and faster. Coins lying around fly to anyone who comes close.
  MG.Coin = class {
    constructor(x, y, v, owner, lying) {
      this.x = x; this.y = y; this.v = v; this.owner = owner || null;
      this.lying = !!lying;
      this.vx = lying ? 0 : U.rand(-170, 170);
      this.vy = lying ? 0 : U.rand(-560, -380);
      this.t = lying ? Math.random() * 5 : 0;
      this.flyT = 0;
      this.taken = false;
      this.target = null;
    }
    update(dt, world) {
      this.t += dt;
      if (!this.target || this.target.state === 'ko') this.target = this.pickTarget(world);
      if (this.target && (this.lying || this.t > 0.35)) {
        this.flyT += dt;
        const f = this.target;
        const dx = f.x - this.x, dy = (f.y - f.h * 0.5) - this.y, d = Math.hypot(dx, dy) || 1;
        const sp = 260 + this.flyT * 1100;
        if (d < 24 || d < sp * dt) { this.taken = true; world.gainCoins(f, this.v); return; }
        const swirl = Math.max(0, 0.6 - this.flyT * 0.5);
        this.vx = (dx / d - (dy / d) * swirl) * sp;
        this.vy = (dy / d + (dx / d) * swirl) * sp;
        this.x += this.vx * dt; this.y += this.vy * dt;
        return;
      }
      if (this.lying) return;
      this.vy += 1500 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      const floor = world.floorBelow ? world.floorBelow(this.x, this.y - 12) : world.groundY;
      if (this.y > floor - 7) {
        this.y = floor - 7;
        this.vy = Math.abs(this.vy) > 120 ? -Math.abs(this.vy) * 0.4 : 0;
        this.vx *= 0.7;
      }
    }
    pickTarget(world) {
      const alive = world.aliveFighters();
      if (this.owner && alive.includes(this.owner)) return this.owner;
      let best = null, bd = this.lying ? 150 : 260;
      for (const f of alive) {
        const d = Math.hypot(f.x - this.x, f.y - f.h * 0.5 - this.y);
        if (d < bd) { bd = d; best = f; }
      }
      return best;
    }
    draw(ctx) { MG.Art.coin(ctx, this.x, this.y + (this.lying && !this.target ? Math.sin(this.t * 3) * 3 : 0), this.t, this.v); }
  };
})();
