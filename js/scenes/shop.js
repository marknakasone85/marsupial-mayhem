// The platypus's shop (docs/DESIGN.md, "Weapons, shop and upgrades"). It can't enter the
// tournament (egg-layers can't!), so it sells to the animals who can.
//  * Sections (tabs): WEAPONS, ARMOUR, HEALTH, GRENADES, EXTRAS, each with a line saying what
//    that kind of gear does. Everything can be sold back for half of what you paid.
//  * 1 or 2 players on this keyboard: each has their own cursor and their own coins.
//  * Wi-Fi: everyone shops on their own device with their own coins and sees everybody's wallets.
//    The host's PLAY starts the next map; friends press I'M READY.
//  * Where it goes afterwards: from the title screen BACK; from the world map back to the same
//    stop; after a map PLAY (the next map, or this one again), with WORLD MAP as the other way out.
(function () {
  const UI = MG.UI;
  const I = MG.Input;
  const W = MG.W, H = MG.H;
  const ITEMS = MG.Gear.ITEMS;
  const CATS = MG.SHOP_CATS;
  // the layout: tabs, the section's explanation, its cards, the item's details, wallets + buttons
  const AREA_X = 196, AREA_W = W - AREA_X - 16;
  const TAB_Y = 8, TAB_H = 32, TAB_GAP = 7;
  const NOTE_Y = 46, NOTE_H = 40;
  const CARDS_Y = 92, CARDS_H = 194, GAP = 8;
  const DETAIL_Y = 292, DETAIL_H = 104;
  // cursor values besides an item's index
  const PLAY = ITEMS.length;      // the big button: PLAY / MAP / BACK / I'M READY
  const MAPB = ITEMS.length + 1;  // after a map: the WORLD MAP button above it
  const TABS = -1;                // on the row of tabs
  const KEYS = {
    SOLO: { left: ['KeyA', 'ArrowLeft', 'Pad0Left'], right: ['KeyD', 'ArrowRight', 'Pad0Right'], up: ['KeyW', 'ArrowUp', 'Pad0Up'], down: ['KeyS', 'ArrowDown', 'Pad0Down'], ok: ['KeyF', 'Enter', 'Space', 'Pad0A', 'KeyJ'], sell: ['KeyX', 'Delete', 'Pad0Y'] },
    P1: { left: ['KeyA', 'Pad0Left'], right: ['KeyD', 'Pad0Right'], up: ['KeyW', 'Pad0Up'], down: ['KeyS', 'Pad0Down'], ok: ['KeyF', 'Space', 'Pad0A'], sell: ['KeyX', 'Pad0Y'] },
    P2: { left: ['ArrowLeft', 'Pad1Left'], right: ['ArrowRight', 'Pad1Right'], up: ['ArrowUp', 'Pad1Up'], down: ['ArrowDown', 'Pad1Down'], ok: ['Comma', 'Enter', 'Numpad1', 'Pad1A'], sell: ['Period', 'Pad1Y'] },
  };
  const LINES = [
    'G\'day! Egg-layers can\'t enter the tournament... so I sell stuff to those who can!',
    'Coins from pests, gear from me. Fair dinkum!',
    'No refunds on drop bears. They don\'t come back. (You can sell them back, though.)',
    'Duels are fair fights: my gear stays out of the ring.',
    'Everything\'s top quality. Mostly.',
    'Changed your mind? I buy things back for half price!',
  ];
  const BOUGHT = ['That\'s a beauty!', 'Pleasure doing business!', 'You won\'t regret it. Probably.', 'Bonza choice!'];
  const SOLD = ['I\'ll give it a good home!', 'Half price, no worries.', 'Back on the shelf it goes!'];
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // the items in each section (indices into ITEMS) and how they're laid out
  const CAT_ITEMS = CATS.map((c) => ITEMS.map((it, i) => (it.cat === c.id ? i : -1)).filter((i) => i >= 0));
  const catOf = (i) => CATS.findIndex((c) => c.id === ITEMS[i].cat);
  function grid(c) {
    const n = CAT_ITEMS[c].length;
    const cols = n > 4 ? 5 : n, rows = Math.ceil(n / cols);
    const w = Math.min(n > 4 ? 999 : 230, (AREA_W - (cols - 1) * GAP) / cols);
    const h = rows > 1 ? (CARDS_H - GAP * (rows - 1)) / rows : CARDS_H;
    const x0 = AREA_X + (AREA_W - (cols * w + (cols - 1) * GAP)) / 2;
    return { n, cols, rows, w, h, x0 };
  }

  function itemName(it) {
    return it.kind === 'weapon' ? MG.WEAPONS[it.id].name : it.kind === 'armor' ? MG.ARMORS[it.id].name : MG.UPGRADES[it.id].name;
  }
  function itemShort(it) {
    if (it.kind === 'weapon') return MG.WEAPONS[it.id].short;
    if (it.kind === 'armor') return MG.ARMORS[it.id].name.replace('CORRUGATED-IRON', 'IRON').replace(' PLATING', '').replace(' ARMOUR', '');
    return MG.UPGRADES[it.id].name;
  }
  function itemDesc(it) {
    return it.kind === 'weapon' ? MG.WEAPONS[it.id].desc : it.kind === 'armor' ? MG.ARMORS[it.id].desc : MG.UPGRADES[it.id].desc;
  }
  function itemIcon(ctx, it, x, y, s) {
    if (it.kind === 'weapon') MG.Art.weaponIcon(ctx, it.id, x, y, s);
    else if (it.kind === 'armor') MG.Art.armorPlate(ctx, it.id, x, y, s * 1.35);
    else MG.Art.upgradeIcon(ctx, it.id, x, y, s * 0.95);
  }
  // a little picture on each tab
  function tabIcon(ctx, c, x, y) {
    const id = CATS[c].id;
    if (id === 'weapons') MG.Art.weaponIcon(ctx, 'shanghai', x, y, 0.55);
    else if (id === 'armour') MG.Art.armorPlate(ctx, 'billy', x, y, 0.7);
    else if (id === 'health') { ctx.save(); ctx.translate(x, y); ctx.scale(0.6, 0.6); MG.Art.heart(ctx, 0, 18, 0); ctx.restore(); }
    else if (id === 'grenades') MG.Art.grenade(ctx, x, y + 2, { r: 7, pin: true });
    else MG.Art.upgradeIcon(ctx, 'snacks', x, y, 0.5);
  }

  MG.ShopScene = class {
    // opts: { players: [{ id, cid, local }], level, net, gid, earned: [[id, coins]], mapAt }  (after a map:
    //         PLAY starts `level`; WORLD MAP goes back to the map at mapAt)
    //       { toMap: true, mapAt, level, players, net }  from the world map (back to the stop mapAt: a map's index or 'shop')
    //       { fromMenu: true }   from the title screen (one player)
    //       { guest: true }      a Wi-Fi friend (the host sends { t: 'shop' } messages)
    constructor(opts = {}) {
      this.opts = opts;
      this.t = 0;
      this.guest = !!opts.guest;
      this.net = !!opts.net;
      this.level = opts.level || 0;
      this.players = (opts.players || []).slice();
      const locals = this.guest || opts.fromMenu ? [{ local: 'SOLO', id: this.guest ? MG.Net.id : 0 }] : this.players.filter((p) => p.local);
      const solo = locals.length === 1;
      // the shoppers on this device
      this.shoppers = locals.map((p, i) => ({
        id: p.id, pid: p.local === 'P2' ? 'p2' : 'p1', keys: KEYS[solo ? 'SOLO' : p.local === 'P2' ? 'P2' : 'P1'],
        tag: this.guest ? `P${(MG.Net.id || 0) + 1}` : solo && !this.net ? '' : `P${p.id + 1}`,
        color: MG.PLAYER_COLORS[(p.id || 0) % 4], cur: i === 0 ? 0 : 1, tab: 0, msg: '', msgT: 0, sellArm: null, sellT: 0,
      }));
      this.focus = this.shoppers[0];
      this.line = LINES[Math.floor(Math.random() * LINES.length)];
      this.talkT = 2;
      this.ready = false;   // a friend's I'M READY
      this.view = null;     // a friend's copy of the host's shop message
      this.sendT = 0;
      if (this.net && !this.guest) {
        // coins earned in the map that just ended: friends add them to their own wallets
        this.gid = opts.gid || null;
        this.earned = new Map(opts.earned || []);
      }
    }

    enter() {
      MG.Audio.playMusic('title');
      if (this.net || this.guest) MG.Net.onMessage = (m, from) => this.onNet(m, from);
      if (this.net) this.broadcast();
      if (this.guest) this.sendGear();
    }

    // ---------------- Wi-Fi ----------------
    broadcast() {
      const pl = this.players.map((p) => {
        const g = p.local ? null : MG.Gear.friends[p.id];
        const lo = p.local ? MG.Gear.loadout('p1') : g ? g.lo : {};
        return {
          id: p.id, cid: p.cid, coins: p.local ? MG.Gear.coins('p1') : g ? g.coins : 0, ready: p.local ? 1 : g && g.ready ? 1 : 0,
          w: lo.w || 0, wl: lo.wl || 0, a: lo.a || 0, co: this.earned.get(p.id) || 0,
        };
      });
      MG.Net.send({ t: 'shop', lv: this.level, gid: this.gid, pl }, 'all', true);
    }
    sendGear() { MG.Net.send(Object.assign({ t: 'gear', ready: this.ready }, MG.Gear.mine()), 'host', true); this.sendT = 1.5; }

    onNet(m, from) {
      if (!m) return;
      if (this.guest) {
        if (m.t === 'hostLeft') {
          if (m.rehost) { MG.Net.status = 'closed'; return; }
          MG.Net.leave(); MG.Engine.setScene(new MG.MenuScene()); return;
        }
        if (m.t === 'toLobby') { MG.Engine.setScene(new MG.JoinScene({ rejoin: true })); return; }
        if (m.t === 'snap') { // the host started the next map (or a battle)
          const scene = m.k === 'duel' ? new MG.RemoteDuelScene() : new MG.RemoteScene({ level: m.lv || 0 });
          MG.Engine.setScene(scene);
          scene.onNet(m);
          return;
        }
        if (m.t === 'wmap') { const map = new MG.WorldMapScene({ guest: true }); MG.Engine.setScene(map); map.onNet(m); return; }
        if (m.t === 'shop') {
          this.view = m;
          const mine = (m.pl || []).find((p) => p.id === MG.Net.id);
          if (mine && mine.co) MG.Gear.netEarn(m.gid, mine.id, mine.co);
        }
        return;
      }
      // host
      if (from === 'server') {
        if (m.t === 'joined') MG.Net.send({ t: 'welcome', inGame: true, mode: 'campaign', level: this.level }, m.id, true);
        else if (m.t === 'left') this.players = this.players.filter((p) => p.id !== m.id || p.local);
        this.broadcast();
        return;
      }
      if (m.t === 'gear' || m.t === 'pick') MG.Gear.note(from, m);
      if (m.t === 'pick' && m.ready && typeof from === 'number' && !this.players.some((p) => p.id === from) &&
        this.players.length < 4 && MG.validCid(m.cid)) {
        this.players.push({ id: from, cid: m.cid, local: null }); // joined while we shop
        MG.Audio.confirm();
      }
      this.broadcast();
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.talkT -= dt;
      for (const s of this.shoppers) { s.msgT -= dt; s.sellT -= dt; if (s.sellT <= 0) s.sellArm = null; }
      if (this.net || this.guest) {
        MG.Net.maintain(dt, () => { if (this.net) this.broadcast(); else this.sendGear(); });
        this.sendT -= dt;
        if (this.sendT <= 0) { if (this.net) { this.broadcast(); this.sendT = 0.5; } else this.sendGear(); }
      }
      if (I.anyHit(['Escape', 'Backspace'])) { MG.Audio.select(); this.done(); return; } // phones use the big button
      for (const s of this.shoppers) {
        const k = s.keys;
        if (I.anyHit(k.left)) this.move(s, -1, 0);
        if (I.anyHit(k.right)) this.move(s, 1, 0);
        if (I.anyHit(k.up)) this.move(s, 0, -1);
        if (I.anyHit(k.down)) this.move(s, 0, 1);
        if (I.anyHit(k.ok)) this.press(s);
        if (I.anyHit(k.sell)) this.sell(s);
        if (MG.Engine.scene !== this) return;
      }
      if (I.anyHit(['Pad0Start'])) this.done();
      // mouse / touch: tap a tab or a card to look, tap the buttons under your coins to buy or sell
      const p = I.pointer;
      if (p.pressed) {
        const s = this.focus || this.shoppers[0];
        CATS.forEach((_, c) => { if (inside(p, this.tabRect(c))) { s.tab = c; s.cur = CAT_ITEMS[c][0]; MG.Audio.select(); } });
        for (const i of CAT_ITEMS[this.shownCat()]) {
          if (!inside(p, this.cardRect(i))) continue;
          if (s.cur === i) this.press(s); else { s.cur = i; MG.Audio.select(); }
        }
        this.shoppers.forEach((sh, i) => {
          if (inside(p, this.buyRect(i, sh))) { if (sh.cur === PLAY || sh.cur === MAPB || sh.cur === TABS) sh.cur = CAT_ITEMS[sh.tab][0]; this.focus = sh; this.press(sh); }
          else if (this.canSell(sh) && inside(p, this.sellRect(i, sh))) { this.focus = sh; this.sell(sh); }
        });
        if (MG.Engine.scene !== this) return;
        if (this.hasMapButton() && inside(p, this.mapRect())) { this.mapExit(); return; }
        if (inside(p, this.playRect())) this.done();
      }
    }

    // which section the screen shows: the one the last player to move is looking at
    shownCat() { const s = this.focus || this.shoppers[0]; return s.tab; }
    tabRect(c) {
      const w = (AREA_W - (CATS.length - 1) * TAB_GAP) / CATS.length;
      return { x: AREA_X + c * (w + TAB_GAP), y: TAB_Y, w, h: TAB_H };
    }
    cardRect(i) {
      const c = catOf(i), g = grid(c), k = CAT_ITEMS[c].indexOf(i);
      const col = k % g.cols, row = Math.floor(k / g.cols);
      return { x: g.x0 + col * (g.w + GAP), y: CARDS_Y + row * (g.h + GAP), w: g.w, h: g.h };
    }
    cardWidth() { const n = Math.max(1, this.cardsShown().length); return Math.min(240, (766 - 24 - 8 * (n - 1)) / n); }
    walletRect(i) { const w = this.cardWidth(); return { x: 16 + i * (w + 8), y: 404, w, h: 88 }; }
    canSell(s) { return s.cur >= 0 && s.cur < ITEMS.length && MG.Gear.sellValue(s.pid, ITEMS[s.cur]) > 0; }
    buyRect(i, s) {
      const r = this.walletRect(i), full = r.w - 16;
      return { x: r.x + 8, y: r.y + 56, w: s && this.canSell(s) ? Math.round(full * 0.56) : full, h: 26 };
    }
    sellRect(i, s) { const r = this.walletRect(i), b = this.buyRect(i, s); return { x: b.x + b.w + 6, y: b.y, w: r.x + r.w - 8 - (b.x + b.w + 6), h: 26 }; }
    // after a map there are two ways out: PLAY (the next map) and WORLD MAP
    hasMapButton() { return !this.guest && !this.opts.fromMenu && !this.opts.toMap; }
    mapRect() { return { x: 766, y: 404, w: 178, h: 30 }; }
    playRect() { return this.hasMapButton() ? { x: 766, y: 440, w: 178, h: 52 } : { x: 766, y: 416, w: 178, h: 64 }; }

    move(s, dx, dy) {
      const before = s.cur, tabBefore = s.tab;
      if (s.cur === TABS) {
        if (dx) s.tab = (s.tab + dx + CATS.length) % CATS.length;
        if (dy > 0) s.cur = CAT_ITEMS[s.tab][0];
      } else if (s.cur === PLAY || s.cur === MAPB) {
        if (dy < 0) {
          if (s.cur === PLAY && this.hasMapButton()) s.cur = MAPB;
          else { const g = grid(s.tab); s.cur = CAT_ITEMS[s.tab][(g.rows - 1) * g.cols]; }
        } else if (dy > 0 && s.cur === MAPB) s.cur = PLAY;
      } else {
        const c = catOf(s.cur), list = CAT_ITEMS[c], k = list.indexOf(s.cur), g = grid(c);
        const row = Math.floor(k / g.cols);
        if (dx < 0) s.cur = k > 0 ? list[k - 1] : CAT_ITEMS[(c - 1 + CATS.length) % CATS.length].slice(-1)[0]; // into the section before
        else if (dx > 0) s.cur = k < list.length - 1 ? list[k + 1] : CAT_ITEMS[(c + 1) % CATS.length][0];       // into the next section
        else if (dy < 0) s.cur = row > 0 ? list[k - g.cols] : TABS;
        else if (dy > 0) s.cur = k + g.cols < list.length ? list[k + g.cols] : row < g.rows - 1 ? list[list.length - 1] : PLAY;
        if (s.cur >= 0 && s.cur < ITEMS.length) s.tab = catOf(s.cur);
      }
      if (s.cur !== before || s.tab !== tabBefore) { MG.Audio.select(); s.sellArm = null; }
      this.focus = s;
    }

    press(s) {
      this.focus = s;
      if (s.cur === TABS) { s.cur = CAT_ITEMS[s.tab][0]; MG.Audio.select(); return; }
      if (s.cur === PLAY) { this.done(); return; }
      if (s.cur === MAPB) { this.mapExit(); return; }
      const item = ITEMS[s.cur];
      const o = MG.Gear.offer(s.pid, item);
      if (o.action === 'maxed') { s.msg = o.equipped && item.kind !== 'upgrade' ? 'Already using it' : 'Already maxed out'; s.msgT = 1.6; MG.Audio.emptyClick(); return; }
      if (!o.can) {
        s.msg = 'Need ' + (o.price - MG.Gear.coins(s.pid)) + ' more coins';
        s.msgT = 1.8;
        this.say('Need more coins, mate! Pests drop \'em.');
        MG.Audio.emptyClick();
        return;
      }
      const r = MG.Gear.act(s.pid, item);
      if (!r) return;
      s.msg = r.said;
      s.msgT = 2;
      s.sellArm = null;
      if (r.action === 'equip') MG.Audio.confirm();
      else { MG.Audio.kaching(); this.say(BOUGHT[Math.floor(Math.random() * BOUGHT.length)]); }
      this.changed();
    }
    // Selling back: the first press asks "SURE?", the second (within a few seconds) sells.
    sell(s) {
      this.focus = s;
      if (!this.canSell(s)) {
        if (s.cur >= 0 && s.cur < ITEMS.length) { s.msg = 'Nothing to sell'; s.msgT = 1.2; MG.Audio.emptyClick(); }
        return;
      }
      if (s.sellArm !== s.cur || s.sellT <= 0) { s.sellArm = s.cur; s.sellT = 3; MG.Audio.select(); return; }
      const r = MG.Gear.sell(s.pid, ITEMS[s.cur]);
      s.sellArm = null;
      if (!r) return;
      s.msg = r.said; s.msgT = 2;
      MG.Audio.kaching();
      this.say(SOLD[Math.floor(Math.random() * SOLD.length)]);
      this.changed();
    }
    changed() {
      if (this.guest) this.sendGear();
      if (this.net) this.broadcast();
    }
    say(line) { this.line = line; this.talkT = 1.5; }

    done() {
      if (this.guest) {
        this.ready = !this.ready;
        MG.Audio.confirm();
        this.sendGear();
        return;
      }
      if (this.opts.fromMenu) { MG.Engine.setScene(new MG.MenuScene()); return; }
      if (this.opts.toMap) { this.mapExit(); return; }
      if (this.net) MG.Net.send({ t: 'start', mode: 'campaign', level: this.level }, 'all', true);
      MG.Engine.setScene(new MG.CampaignScene({ level: this.level, net: this.net, players: this.players, practice: true }));
    }
    // Back to the Marsupial World map, standing where we were.
    mapExit() {
      const at = this.opts.mapAt !== undefined ? this.opts.mapAt : this.opts.toMap ? 'shop' : this.level;
      MG.Engine.setScene(new MG.WorldMapScene({ net: this.net, players: this.players, at }));
      if (this.net) MG.Engine.scene.broadcast();
    }

    // Everyone's wallet: this device's shoppers, then (Wi-Fi) the friends.
    cardsShown() {
      const cards = this.shoppers.map((s) => ({ shopper: s }));
      if (this.net) {
        for (const p of this.players) if (!p.local) cards.push({ friend: p, info: MG.Gear.friends[p.id] || null });
      } else if (this.guest && this.view) {
        for (const p of this.view.pl || []) if (p.id !== MG.Net.id) cards.push({ friend: p, info: { coins: p.coins, ready: p.ready, lo: { w: p.w, wl: p.wl, a: p.a } } });
      }
      return cards;
    }
    // a key's name for this shopper (none on phones)
    keyName(s, action) {
      if (MG.Touch.enabled) return '';
      return MG.Keys.label(s.keys === KEYS.P2 ? 'P2' : 'P1', action);
    }
    exitLabel() { return this.guest ? 'I\'M READY' : this.opts.fromMenu ? 'BACK' : this.opts.toMap ? 'MAP' : 'PLAY'; }
    // what each section is for
    catNote(c, s) {
      const key = (a) => { const k = this.keyName(s, a); return k ? ` (${k})` : ''; };
      switch (CATS[c].id) {
        case 'weapons': return `Hold SHOOT${key('shoot')} to fire. You carry one weapon at a time and it refills by itself. Buy it again to level it up (up to level 3).`;
        case 'armour': return 'Armour is a blue bar over your health that takes the hits first. It\'s full again at every map and checkpoint. Wear one set at a time.';
        case 'health': return 'More health and healing for every marsupial you play. Upgrades last for good.';
        case 'grenades': return `Drop a grenade with GRENADE${key('grenade')}, then kick it at the pests! Grenades never hurt you or your friends.`;
        default: return 'Handy extras for you and your joey. They last for good.';
      }
    }

    // ---------------- draw ----------------
    draw(ctx) {
      MG.Art.background(ctx, 0, this.t, MG.GROUND_Y);
      UI.fade(ctx, 0.35);
      UI.outlineText(ctx, 'THE PLATYPUS\'S SHOP', 100, 24, 16, '#ffd23f', 'center');
      // the shopkeeper and what it's saying
      UI.panel(ctx, 12, 44, 176, 112, 'rgba(255,255,255,0.92)');
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath(); ctx.moveTo(110, 156); ctx.lineTo(126, 156); ctx.lineTo(112, 172); ctx.fill();
      UI.wrap(this.line, 24).slice(0, 5).forEach((ln, i) => UI.text(ctx, ln, 100, 60 + i * 19, 13, '#2b193d', 'center'));
      MG.Art.platypus(ctx, 92, 290, 1.12, this.t, { talk: this.talkT > 0 });

      const c = this.shownCat(), s = this.focus || this.shoppers[0];
      this.drawTabs(ctx, c);
      // what this section is for
      UI.panel(ctx, AREA_X, NOTE_Y, AREA_W, NOTE_H);
      UI.wrap(this.catNote(c, s), 104).slice(0, 2).forEach((ln, i) => UI.text(ctx, ln, AREA_X + AREA_W / 2, NOTE_Y + 13 + i * 15, 12.5, '#bde0fe', 'center'));
      for (const i of CAT_ITEMS[c]) this.drawCard(ctx, ITEMS[i], i);
      this.drawDetails(ctx);
      this.cardsShown().forEach((cd, i) => this.drawWallet(ctx, cd, i));
      this.drawPlay(ctx);
      const ex = this.exitLabel();
      const hint = MG.Touch.enabled
        ? 'Tap a tab, then an item. Tap BUY under your coins to buy it, SELL to sell it back for half.  ' + ex + ' when you\'re done.'
        : this.shoppers.length > 1
        ? 'P1: W A S D move, F buy, X sell     P2: arrows move, , buy, . sell     Up from the top row: the tabs'
        : 'Arrows / W A S D: look (up at the top row picks a tab)    F / Enter: buy    X: sell back    Esc: ' + ex;
      UI.text(ctx, hint, W / 2, H - 16, 12.5, '#9bf6ff', 'center');
      if (MG.Net.lost && (this.net || this.guest)) UI.outlineText(ctx, 'Connection lost - reconnecting...', W / 2, 30, 18, '#ff4d6d', 'center');
    }

    drawTabs(ctx, shown) {
      CATS.forEach((cat, c) => {
        const r = this.tabRect(c), on = c === shown;
        ctx.fillStyle = on ? '#ffd23f' : 'rgba(43,25,61,0.9)';
        ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 10); ctx.fill();
        // a shopper whose cursor is on the tabs
        this.shoppers.forEach((s, k) => {
          if (s.cur !== TABS || s.tab !== c) return;
          ctx.strokeStyle = s.color; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.roundRect(r.x - 2 - k * 3, r.y - 2 - k * 3, r.w + 4 + k * 6, r.h + 4 + k * 6, 12); ctx.stroke();
        });
        tabIcon(ctx, c, r.x + 22, r.y + r.h / 2);
        UI.text(ctx, cat.name, r.x + r.w / 2 + 12, r.y + r.h / 2 + 1, 14, on ? '#2b193d' : '#ffffff', 'center');
      });
    }

    drawCard(ctx, it, i) {
      const r = this.cardRect(i), tall = r.h > 150;
      const lead = this.focus || this.shoppers[0];
      const o = MG.Gear.offer(lead.pid, it);
      const owned = o.action !== 'buy' || (it.kind === 'upgrade' && o.level > 0);
      ctx.fillStyle = owned ? 'rgba(46,90,70,0.92)' : 'rgba(43,25,61,0.9)';
      ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill();
      // cursors (one colour per player)
      this.shoppers.forEach((s, k) => {
        if (s.cur !== i) return;
        ctx.strokeStyle = s.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(r.x - 2 - k * 4, r.y - 2 - k * 4, r.w + 4 + k * 8, r.h + 4 + k * 8, 14); ctx.stroke();
      });
      UI.text(ctx, tall ? itemName(it) : itemShort(it), r.x + r.w / 2, r.y + 14, tall && itemName(it).length > 20 ? 11 : 12, '#ffffff', 'center');
      itemIcon(ctx, it, r.x + r.w / 2, r.y + (tall ? 58 : 44), tall ? 1.25 : 1);
      // the explanation, on the big cards
      if (tall) UI.wrap(itemDesc(it), Math.max(18, Math.floor(r.w / 6.4))).slice(0, 4).forEach((ln, k) => UI.text(ctx, ln, r.x + r.w / 2, r.y + 100 + k * 15, 11.5, '#d8e2ff', 'center'));
      let label, color;
      if (o.equipped) { label = it.kind === 'armor' ? 'WEARING' : 'USING Lv' + o.level; color = '#9ef01a'; }
      else if (o.action === 'equip') { label = it.kind === 'weapon' ? 'OWNED Lv' + o.level : 'OWNED'; color = '#9ef01a'; }
      else if (o.action === 'maxed') { label = 'MAXED'; color = '#9ef01a'; }
      else { label = String(o.price); color = o.can ? '#ffd23f' : '#ff8fa3'; }
      if (it.kind === 'upgrade' && o.max) label = (o.action === 'maxed' ? 'MAXED' : o.price) + '';
      const priced = /^\d+$/.test(label);
      UI.text(ctx, label, r.x + r.w / 2 + (priced ? 7 : 0), r.y + r.h - 14, 14, color, 'center');
      if (priced) { ctx.font = `bold 14px ${UI.FONT}`; MG.Art.coinIcon(ctx, r.x + r.w / 2 - ctx.measureText(label).width / 2 - 4, r.y + r.h - 14, 6); }
      // level pips (weapons and upgrades)
      if (o.max) for (let k = 0; k < o.max; k++) {
        ctx.fillStyle = k < (o.level || 0) ? '#ffd23f' : 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(r.x + r.w / 2 - (o.max - 1) * 7 + k * 14, r.y + r.h - 30, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    drawDetails(ctx) {
      const s = this.focus || this.shoppers[0];
      const x = AREA_X, y = DETAIL_Y, w = AREA_W, h = DETAIL_H;
      UI.panel(ctx, x, y, w, h);
      if (s.cur === PLAY || s.cur === MAPB) {
        const text = this.guest ? 'Ready when you are!' : this.opts.fromMenu ? 'Back to the title screen'
          : s.cur === MAPB || this.opts.toMap ? 'Back to the Marsupial World map' : 'Off to the next map!';
        UI.outlineText(ctx, text, x + w / 2, y + h / 2, 22, '#ffd23f', 'center');
        return;
      }
      if (s.cur === TABS) {
        UI.outlineText(ctx, CATS[s.tab].name, x + w / 2, y + 30, 24, '#ffd23f', 'center');
        UI.wrap(this.catNote(s.tab, s), 90).slice(0, 2).forEach((ln, i) => UI.text(ctx, ln, x + w / 2, y + 58 + i * 17, 13, '#ffffff', 'center'));
        UI.text(ctx, '← → pick a section    ↓ look at its items', x + w / 2, y + h - 10, 11, '#9bf6ff', 'center');
        return;
      }
      const it = ITEMS[s.cur];
      itemIcon(ctx, it, x + 52, y + 50, 1.5);
      UI.text(ctx, itemName(it), x + 104, y + 20, 18, '#ffd23f');
      UI.wrap(itemDesc(it), 58).slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, x + 104, y + 44 + i * 17, 13, '#ffffff'));
      const bx = x + w - 200;
      const value = MG.Gear.sellValue(s.pid, it);
      if (it.kind === 'weapon') {
        const d = MG.WEAPONS[it.id];
        ['POWER', 'SPEED', 'RANGE'].forEach((label, i) => {
          UI.text(ctx, label, bx, y + 22 + i * 26, 12, '#9bf6ff');
          for (let k = 0; k < 5; k++) {
            ctx.fillStyle = k < d.bars[i] ? '#ffb703' : 'rgba(255,255,255,0.18)';
            ctx.beginPath(); ctx.roundRect(bx + 62 + k * 24, y + 16 + i * 26, 20, 12, 3); ctx.fill();
          }
        });
        UI.text(ctx, `${d.mag} shots, refills by itself.  Levels 2-3: more damage and shots.`, x + 104, y + h - 12, 11, '#bde0fe');
      } else if (it.kind === 'armor') {
        UI.outlineText(ctx, 'ARMOUR +' + MG.ARMORS[it.id].armor, bx + 90, y + 34, 22, '#9bd0ff', 'center');
        UI.text(ctx, 'Full again at every map', bx + 90, y + 62, 11, '#bde0fe', 'center');
      } else {
        const u = MG.UPGRADES[it.id], lv = MG.Gear.get(s.pid)[it.id];
        UI.outlineText(ctx, `LEVEL ${lv} / ${u.prices.length}`, bx + 90, y + 40, 22, '#9ef01a', 'center');
      }
      if (value) UI.text(ctx, `Sell it back for ${value} coins${MG.Touch.enabled ? ' (the SELL button)' : ` (${s.keys === KEYS.P2 ? '.' : 'X'})`}`, bx + 90, y + h - 12, 11, '#ffd23f', 'center');
    }

    drawWallet(ctx, c, i) {
      const r = this.walletRect(i);
      UI.panel(ctx, r.x, r.y, r.w, r.h);
      let tag, color, coins, lo, ready = null;
      if (c.shopper) {
        const s = c.shopper;
        tag = s.tag || 'YOU'; color = s.color; coins = MG.Gear.coins(s.pid); lo = MG.Gear.loadout(s.pid);
        if (this.guest) ready = this.ready;
      } else {
        tag = `P${c.friend.id + 1}`; color = MG.PLAYER_COLORS[c.friend.id % 4];
        coins = c.info ? c.info.coins : 0; lo = c.info ? c.info.lo : {}; ready = !!(c.info && c.info.ready);
      }
      UI.text(ctx, tag, r.x + 10, r.y + 16, 15, color);
      UI.text(ctx, String(coins), r.x + r.w - 10, r.y + 16, 16, '#ffd23f', 'right');
      ctx.font = `bold 16px ${UI.FONT}`;
      MG.Art.coinIcon(ctx, r.x + r.w - 18 - ctx.measureText(String(coins)).width, r.y + 16, 7);
      // what they'll bring: weapon, armor
      if (lo && lo.w && has(MG.WEAPONS, lo.w)) { MG.Art.weaponIcon(ctx, lo.w, r.x + 26, r.y + 40, 0.6); UI.text(ctx, 'Lv' + (lo.wl || 1), r.x + 50, r.y + 40, 11, '#ffb703'); }
      else UI.text(ctx, 'no weapon', r.x + 10, r.y + 40, 11, '#999999');
      if (lo && lo.a && has(MG.ARMORS, lo.a)) MG.Art.armorPlate(ctx, lo.a, r.x + 92, r.y + 40, 0.7);
      if (c.shopper) {
        // this player's buttons for the item under their cursor: buy (or use / upgrade), and sell back
        const s = c.shopper, b = this.buyRect(i, s), onItem = s.cur >= 0 && s.cur < ITEMS.length;
        let label = this.exitLabel(), can = true;
        if (onItem) { const o = MG.Gear.offer(s.pid, ITEMS[s.cur]); label = o.label; can = o.can; }
        else if (s.cur === TABS) label = 'PICK A SECTION';
        else if (s.cur === MAPB) label = 'WORLD MAP';
        else if (this.guest) label = this.ready ? 'READY!' : 'I\'M READY';
        if (s.msgT > 0) { label = s.msg; can = true; }
        ctx.fillStyle = s.msgT > 0 ? '#2a9d8f' : can ? s.color : 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
        const key = MG.Touch.enabled || s.msgT > 0 ? '' : (s.keys === KEYS.P2 ? ' (,)' : ' (F)');
        const text = label + key;
        UI.text(ctx, text, b.x + b.w / 2, b.y + b.h / 2 + 1, text.length > (b.w > 150 ? 22 : 16) ? 10 : 12, s.msgT > 0 || !can ? '#ffffff' : '#2b193d', 'center');
        if (this.canSell(s)) {
          const sr = this.sellRect(i, s), armed = s.sellArm === s.cur && s.sellT > 0;
          const v = MG.Gear.sellValue(s.pid, ITEMS[s.cur]);
          ctx.fillStyle = armed ? '#ff4d6d' : 'rgba(255,255,255,0.18)';
          ctx.beginPath(); ctx.roundRect(sr.x, sr.y, sr.w, sr.h, 9); ctx.fill();
          ctx.strokeStyle = armed ? '#ffffff' : '#ffd23f'; ctx.lineWidth = 1.5; ctx.stroke();
          const sk = MG.Touch.enabled ? '' : (s.keys === KEYS.P2 ? ' (.)' : ' (X)');
          UI.text(ctx, (armed ? 'SURE? +' : 'SELL +') + v + sk, sr.x + sr.w / 2, sr.y + sr.h / 2 + 1, 10.5, '#ffffff', 'center');
        }
      } else {
        UI.text(ctx, ready ? 'READY!' : 'shopping...', r.x + r.w / 2, r.y + 70, 14, ready ? '#9ef01a' : '#cccccc', 'center');
      }
    }

    drawPlay(ctx) {
      const r = this.playRect();
      const on = this.shoppers.some((s) => s.cur === PLAY);
      const bob = on ? Math.sin(this.t * 6) * 3 : 0;
      let label = this.opts.fromMenu ? 'BACK' : this.opts.toMap ? 'MAP ▶' : 'PLAY ▶';
      let sub = '';
      if (this.guest) { label = this.ready ? 'READY!' : 'I\'M READY'; sub = 'The host starts the map'; }
      else if (this.net) {
        const friends = this.players.filter((p) => !p.local);
        const ready = friends.filter((p) => MG.Gear.friends[p.id] && MG.Gear.friends[p.id].ready).length;
        if (friends.length) sub = `${ready}/${friends.length} friends ready`;
        if (!this.opts.toMap) label = 'START ▶';
      }
      ctx.fillStyle = on ? '#ffd23f' : this.guest && this.ready ? '#9ef01a' : 'rgba(43,25,61,0.9)';
      ctx.beginPath(); ctx.roundRect(r.x, r.y + bob, r.w, r.h, 16); ctx.fill();
      ctx.strokeStyle = on ? '#2b193d' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.stroke();
      UI.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + bob - (sub ? 7 : 0), r.h > 56 ? 24 : 21, on || (this.guest && this.ready) ? '#2b193d' : '#ffffff', 'center');
      if (sub) UI.text(ctx, sub, r.x + r.w / 2, r.y + r.h / 2 + bob + 15, 11, on ? '#2b193d' : '#cccccc', 'center');
      if (this.hasMapButton()) {
        const m = this.mapRect(), onM = this.shoppers.some((s) => s.cur === MAPB);
        ctx.fillStyle = onM ? '#ffd23f' : 'rgba(43,25,61,0.9)';
        ctx.beginPath(); ctx.roundRect(m.x, m.y, m.w, m.h, 10); ctx.fill();
        ctx.strokeStyle = onM ? '#2b193d' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
        UI.text(ctx, '◀ WORLD MAP', m.x + m.w / 2, m.y + m.h / 2 + 1, 15, onM ? '#2b193d' : '#ffffff', 'center');
      }
    }
  };
  MG.ShopScene.CAT_ITEMS = CAT_ITEMS;
  MG.ShopScene.CURSOR = { PLAY, MAPB, TABS };

  function inside(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
})();
