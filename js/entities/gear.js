// Your coins and gear (saved in this browser), the shop's buying rules, and coins in maps.
// Each player has their own wallet: 'p1' (this device's player, also on Wi-Fi) and 'p2' (the second
// player on this keyboard). Duels ignore all of this: they're fair fights.
(function () {
  const U = MG.U;
  const has = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
  const int = (v, lo, hi) => U.clamp(Math.floor(Number(v) || 0), lo, hi);
  const blank = () => { const b = { coins: 0, weapons: {}, weapon: null, armors: {}, armor: null }; for (const id of MG.UPGRADE_IDS) b[id] = 0; return b; };
  const maxLv = (id) => MG.UPGRADES[id].prices.length;

  // The shop's items, in the order shown, each with its section (MG.SHOP_CATS).
  const ITEMS = [].concat(
    MG.WEAPON_IDS.map((id) => ({ kind: 'weapon', id, cat: 'weapons' })),
    MG.ARMOR_IDS.map((id) => ({ kind: 'armor', id, cat: 'armour' })),
    MG.UPGRADE_IDS.map((id) => ({ kind: 'upgrade', id, cat: MG.UPGRADES[id].cat })),
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
      const prof = {
        coins: int(p.coins, 0, 9999999), weapons, armors,
        weapon: has(weapons, p.weapon) ? p.weapon : null, armor: has(armors, p.armor) ? p.armor : null,
      };
      for (const id of MG.UPGRADE_IDS) prof[id] = int(p[id], 0, maxLv(id));
      return prof;
    },
    set(pid, prof) { const a = this.all(); a[pid] = prof; MG.Save.set('gear', a); },
    coins(pid) { return this.get(pid).coins; },
    addCoins(pid, n) { const p = this.get(pid); p.coins = Math.max(0, Math.round(p.coins + n)); this.set(pid, p); return p.coins; },

    // What a player brings into a map: { w: weapon, wl: its level, a: armor, and each upgrade's
    // level by its short key: hp (bigger heart), rg (tonic), gb (grenade belt), bb (bigger bang),
    // js (joey snacks), mg (coin magnet) }
    loadout(pid) {
      const p = this.get(pid);
      const lo = { w: p.weapon, wl: p.weapon ? p.weapons[p.weapon] : 0, a: p.armor };
      for (const id of MG.UPGRADE_IDS) lo[MG.UPGRADES[id].key] = p[id];
      return lo;
    },
    // A Wi-Fi friend's loadout, checked: only real items, levels in range.
    clean(lo) {
      lo = lo && typeof lo === 'object' ? lo : {};
      const w = typeof lo.w === 'string' && has(MG.WEAPONS, lo.w) ? lo.w : null;
      const out = {
        w, wl: w ? int(lo.wl, 1, MG.MAX_WEAPON_LEVEL) : 0,
        a: typeof lo.a === 'string' && has(MG.ARMORS, lo.a) ? lo.a : null,
      };
      for (const id of MG.UPGRADE_IDS) { const k = MG.UPGRADES[id].key; out[k] = int(lo[k], 0, maxLv(id)); }
      return out;
    },
    // Gives a fighter its gear at the start of a map (or a checkpoint).
    apply(f, lo) {
      if (!lo) return;
      const U8 = MG.UPGRADES;
      if (lo.hp) { f.maxHp += U8.heart.per * lo.hp; f.hp = f.maxHp; }
      if (lo.a && has(MG.ARMORS, lo.a)) { f.armorMax = MG.ARMORS[lo.a].armor; f.armor = f.armorMax; f.armorId = lo.a; }
      if (lo.gb) f.grenades = Math.min(MG.MAX_GRENADES, f.grenades + lo.gb);
      if (lo.w && has(MG.WEAPONS, lo.w)) f.equip(lo.w, lo.wl || 1);
      f.regen = (lo.rg || 0) * U8.tonic.per;                 // health per second, after 4 s without a hit
      f.blastK = 1 + (lo.bb || 0) * U8.bang.per;             // grenade blast size and push
      f.joeyCool = Math.max(0.4, 1 - (lo.js || 0) * U8.snacks.per); // the joey's wait between jobs
      f.coinReach = 1 + (lo.mg || 0) * U8.magnet.per;        // how far lying coins come from
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

    // ---- selling back to the platypus: half of everything you paid for it
    //  weapons: the weapon and its levels; armour: the set; upgrades: one level at a time
    sellValue(pid, item) {
      const p = this.get(pid);
      let paid = 0;
      if (item.kind === 'weapon') {
        const lv = p.weapons[item.id] || 0;
        if (lv) { paid = MG.WEAPONS[item.id].price; for (let l = 2; l <= lv; l++) paid += MG.upgradePrice(item.id, l); }
      } else if (item.kind === 'armor') paid = p.armors[item.id] ? MG.ARMORS[item.id].price : 0;
      else { const lv = p[item.id] || 0; paid = lv ? MG.UPGRADES[item.id].prices[lv - 1] : 0; }
      return Math.floor(paid * MG.SELL_BACK);
    },
    // Sells it. Returns { said, coins } or null when there's nothing to sell.
    sell(pid, item) {
      const value = this.sellValue(pid, item);
      if (!value) return null;
      const p = this.get(pid);
      let said;
      if (item.kind === 'weapon') {
        delete p.weapons[item.id];
        if (p.weapon === item.id) p.weapon = null;
        said = 'SOLD ' + MG.WEAPONS[item.id].short;
      } else if (item.kind === 'armor') {
        delete p.armors[item.id];
        if (p.armor === item.id) p.armor = null;
        said = 'SOLD ' + MG.ARMORS[item.id].name;
      } else {
        p[item.id] -= 1;
        said = MG.UPGRADES[item.id].name + (p[item.id] ? ' NOW LEVEL ' + p[item.id] : ' SOLD');
      }
      p.coins += value;
      this.set(pid, p);
      return { said: said + ' +' + value, coins: value };
    },
    // Is there something new this player could buy right now? (the map's SHOP button says so)
    canBuySomething(pid) {
      return ITEMS.some((it) => { const o = this.offer(pid, it); return (o.action === 'buy' || o.action === 'upgrade') && o.can; });
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
      // (the Coin Magnet pulls lying coins from further away)
      let best = null, bd = Infinity;
      for (const f of alive) {
        const d = Math.hypot(f.x - this.x, f.y - f.h * 0.5 - this.y);
        const reach = (this.lying ? 150 : 260) * (this.lying ? f.coinReach || 1 : 1);
        if (d < reach && d < bd) { bd = d; best = f; }
      }
      return best;
    }
    draw(ctx) { MG.Art.coin(ctx, this.x, this.y + (this.lying && !this.target ? Math.sin(this.t * 3) * 3 : 0), this.t, this.v); }
  };
})();
