// The platypus's shop (docs/DESIGN.md, "Weapons, shop and upgrades"). It can't enter the
// tournament (egg-layers can't!), so it sells to the animals who can.
//  * 1 or 2 players on this keyboard: each has their own cursor and their own coins.
//  * Wi-Fi: everyone shops on their own device with their own coins and sees everybody's wallets.
//    The host's PLAY starts the next map; friends press I'M READY.
(function () {
  const UI = MG.UI;
  const U = MG.U;
  const I = MG.Input;
  const W = MG.W, H = MG.H;
  const ITEMS = MG.Gear.ITEMS;
  const COLS = 6, CARD_W = 118, CARD_H = 112, GAP = 8, GRID_X = 196, GRID_Y = 50;
  const PLAY = ITEMS.length; // the cursor below the cards: the PLAY / BACK button
  const PLAY_RECT = { x: 766, y: 416, w: 178, h: 64 };
  const KEYS = {
    SOLO: { left: ['KeyA', 'ArrowLeft', 'Pad0Left'], right: ['KeyD', 'ArrowRight', 'Pad0Right'], up: ['KeyW', 'ArrowUp', 'Pad0Up'], down: ['KeyS', 'ArrowDown', 'Pad0Down'], ok: ['KeyF', 'Enter', 'Space', 'Pad0A', 'KeyJ'] },
    P1: { left: ['KeyA', 'Pad0Left'], right: ['KeyD', 'Pad0Right'], up: ['KeyW', 'Pad0Up'], down: ['KeyS', 'Pad0Down'], ok: ['KeyF', 'Space', 'Pad0A'] },
    P2: { left: ['ArrowLeft', 'Pad1Left'], right: ['ArrowRight', 'Pad1Right'], up: ['ArrowUp', 'Pad1Up'], down: ['ArrowDown', 'Pad1Down'], ok: ['Comma', 'Enter', 'Numpad1', 'Pad1A'] },
  };
  const LINES = [
    'G\'day! Egg-layers can\'t enter the tournament... so I sell stuff to those who can!',
    'Coins from pests, gear from me. Fair dinkum!',
    'No refunds on drop bears. They don\'t come back.',
    'Duels are fair fights: my gear stays out of the ring.',
    'Everything\'s top quality. Mostly.',
  ];
  const BOUGHT = ['That\'s a beauty!', 'Pleasure doing business!', 'You won\'t regret it. Probably.', 'Bonza choice!'];
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  function itemName(it) {
    return it.kind === 'weapon' ? MG.WEAPONS[it.id].name : it.kind === 'armor' ? MG.ARMORS[it.id].name : MG.UPGRADES[it.id].name;
  }
  function itemShort(it) {
    if (it.kind === 'weapon') return MG.WEAPONS[it.id].short;
    if (it.kind === 'armor') return MG.ARMORS[it.id].name.replace('CORRUGATED-IRON', 'IRON').replace(' PLATING', '');
    return MG.UPGRADES[it.id].name;
  }
  function itemIcon(ctx, it, x, y, s) {
    if (it.kind === 'weapon') MG.Art.weaponIcon(ctx, it.id, x, y, s);
    else if (it.kind === 'armor') MG.Art.armorPlate(ctx, it.id, x, y, s * 1.35);
    else MG.Art.upgradeIcon(ctx, it.id, x, y, s * 0.95);
  }

  MG.ShopScene = class {
    // opts: { players: [{ id, cid, local }], level, net, gid, earned: [[id, coins]] }  (after a map)
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
        color: MG.PLAYER_COLORS[(p.id || 0) % 4], cur: i === 0 ? 0 : 1, msg: '', msgT: 0,
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
        this.players.length < 4 && MG.CHARACTERS.some((c) => c.id === m.cid)) {
        this.players.push({ id: from, cid: m.cid, local: null }); // joined while we shop
        MG.Audio.confirm();
      }
      this.broadcast();
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.talkT -= dt;
      for (const s of this.shoppers) s.msgT -= dt;
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
      }
      if (I.anyHit(['Pad0Start'])) this.done();
      // mouse / touch: tap a card to look at it, tap the button under your coins to buy, tap PLAY to go
      const p = I.pointer;
      if (p.pressed) {
        const s = this.shoppers[0];
        for (let i = 0; i < ITEMS.length; i++) {
          const r = this.cardRect(i);
          if (inside(p, r)) {
            if (s.cur === i) this.press(s); else { s.cur = i; this.focus = s; MG.Audio.select(); }
          }
        }
        this.shoppers.forEach((sh, i) => { if (inside(p, this.buyRect(i))) { sh.cur = sh.cur === PLAY ? 0 : sh.cur; this.focus = sh; this.press(sh); } });
        if (inside(p, PLAY_RECT)) this.done();
      }
    }

    cardRect(i) {
      const c = i % COLS, r = Math.floor(i / COLS);
      return { x: GRID_X + c * (CARD_W + GAP), y: GRID_Y + r * (CARD_H + GAP), w: CARD_W, h: CARD_H };
    }
    cardWidth() { const n = Math.max(1, this.cardsShown().length); return Math.min(240, (PLAY_RECT.x - 24 - 8 * (n - 1)) / n); }
    walletRect(i) { const w = this.cardWidth(); return { x: 16 + i * (w + 8), y: 404, w, h: 88 }; }
    buyRect(i) { const r = this.walletRect(i); return { x: r.x + 8, y: r.y + 56, w: r.w - 16, h: 26 }; }

    move(s, dx, dy) {
      let c = s.cur;
      if (c === PLAY) { if (dy < 0) c = ITEMS.length - 1; }
      else if (dy > 0) c = c + COLS < ITEMS.length ? c + COLS : PLAY;
      else if (dy < 0) c = c - COLS >= 0 ? c - COLS : c;
      else c = U.clamp(c + dx, 0, ITEMS.length - 1);
      if (c !== s.cur) { s.cur = c; MG.Audio.select(); }
      this.focus = s;
    }

    press(s) {
      this.focus = s;
      if (s.cur === PLAY) { this.done(); return; }
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
      if (r.action === 'equip') MG.Audio.confirm();
      else { MG.Audio.kaching(); this.say(BOUGHT[Math.floor(Math.random() * BOUGHT.length)]); }
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
      if (this.net) MG.Net.send({ t: 'start', mode: 'campaign', level: this.level }, 'all', true);
      MG.Engine.setScene(new MG.CampaignScene({ level: this.level, net: this.net, players: this.players }));
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

      // the items
      ITEMS.forEach((it, i) => this.drawCard(ctx, it, i));
      this.drawDetails(ctx);
      this.cardsShown().forEach((c, i) => this.drawWallet(ctx, c, i));
      this.drawPlay(ctx);
      const hint = MG.Touch.enabled
        ? 'Tap an item to look at it, then the button under your coins to buy it.  Tap ' + (this.guest ? 'I\'M READY' : this.opts.fromMenu ? 'BACK' : 'PLAY') + ' when you\'re done.'
        : this.shoppers.length > 1
        ? 'P1: A D W S + F to buy     P2: arrows + , to buy     Go down to PLAY (or Esc).  Click / tap works too.'
        : this.guest ? 'Arrows / A D W S + F or Enter to buy.  Go down to I\'M READY.  Tap an item, then its button.'
          : 'Arrows / A D W S + F or Enter to buy.  Go down to ' + (this.opts.fromMenu ? 'BACK' : 'PLAY') + ' (or Esc).  Click / tap works too.';
      UI.text(ctx, hint, W / 2, H - 16, 13, '#9bf6ff', 'center');
      if (MG.Net.lost && (this.net || this.guest)) UI.outlineText(ctx, 'Connection lost - reconnecting...', W / 2, 30, 18, '#ff4d6d', 'center');
    }

    drawCard(ctx, it, i) {
      const r = this.cardRect(i);
      const lead = this.shoppers[0];
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
      UI.text(ctx, itemShort(it), r.x + r.w / 2, r.y + 14, 11, '#ffffff', 'center');
      itemIcon(ctx, it, r.x + r.w / 2, r.y + 50, 1);
      let label, color;
      if (o.equipped) { label = it.kind === 'armor' ? 'WEARING' : 'USING Lv' + o.level; color = '#9ef01a'; }
      else if (o.action === 'equip') { label = it.kind === 'weapon' ? 'OWNED Lv' + o.level : 'OWNED'; color = '#9ef01a'; }
      else if (o.action === 'maxed') { label = 'MAXED'; color = '#9ef01a'; }
      else { label = String(o.price); color = o.can ? '#ffd23f' : '#ff8fa3'; }
      if (it.kind === 'upgrade' && o.max) label = (o.action === 'maxed' ? 'MAXED' : o.price) + '';
      const priced = /^\d+$/.test(label);
      UI.text(ctx, label, r.x + r.w / 2 + (priced ? 7 : 0), r.y + r.h - 16, 14, color, 'center');
      if (priced) { ctx.font = `bold 14px ${UI.FONT}`; MG.Art.coinIcon(ctx, r.x + r.w / 2 - ctx.measureText(label).width / 2 - 4, r.y + r.h - 16, 6); }
      // level pips (weapons and upgrades)
      if (o.max) for (let k = 0; k < o.max; k++) {
        ctx.fillStyle = k < (o.level || 0) ? '#ffd23f' : 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(r.x + r.w / 2 - (o.max - 1) * 7 + k * 14, r.y + r.h - 32, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    drawDetails(ctx) {
      const s = this.focus;
      const x = 196, y = 292, w = W - 196 - 16, h = 104;
      UI.panel(ctx, x, y, w, h);
      if (s.cur === PLAY) {
        UI.outlineText(ctx, this.guest ? 'Ready when you are!' : this.opts.fromMenu ? 'Back to the title screen' : 'Off to the next map!', x + w / 2, y + h / 2, 22, '#ffd23f', 'center');
        return;
      }
      const it = ITEMS[s.cur];
      itemIcon(ctx, it, x + 52, y + 50, 1.5);
      UI.text(ctx, itemName(it), x + 104, y + 20, 18, '#ffd23f');
      const desc = it.kind === 'weapon' ? MG.WEAPONS[it.id].desc : it.kind === 'armor' ? MG.ARMORS[it.id].desc : MG.UPGRADES[it.id].desc;
      UI.wrap(desc, 58).slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, x + 104, y + 44 + i * 17, 13, '#ffffff'));
      const bx = x + w - 200;
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
        UI.outlineText(ctx, 'ARMOR +' + MG.ARMORS[it.id].armor, bx + 90, y + 40, 22, '#9bd0ff', 'center');
        UI.text(ctx, 'Takes the hits before health. Full again every map.', bx + 90, y + 70, 11, '#bde0fe', 'center');
      } else {
        const u = MG.UPGRADES[it.id], lv = MG.Gear.get(s.pid)[it.id];
        UI.outlineText(ctx, `LEVEL ${lv} / ${u.prices.length}`, bx + 90, y + 40, 22, '#9ef01a', 'center');
      }
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
        // this player's button for the item under their cursor
        const s = c.shopper, b = this.buyRect(i);
        let label = 'PLAY', can = true;
        if (s.cur !== PLAY) { const o = MG.Gear.offer(s.pid, ITEMS[s.cur]); label = o.label; can = o.can; }
        else if (this.guest) label = this.ready ? 'READY!' : 'I\'M READY';
        else if (this.opts.fromMenu) label = 'BACK';
        if (s.msgT > 0) { label = s.msg; can = true; }
        ctx.fillStyle = s.msgT > 0 ? '#2a9d8f' : can ? s.color : 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 9); ctx.fill();
        const key = MG.Touch.enabled || s.msgT > 0 ? '' : (s.keys === KEYS.P2 ? '  ( , )' : '  (F)');
        const text = label + key;
        UI.text(ctx, text, b.x + b.w / 2, b.y + b.h / 2 + 1, text.length > 20 ? 11 : 13, s.msgT > 0 || !can ? '#ffffff' : '#2b193d', 'center');
      } else {
        UI.text(ctx, ready ? 'READY!' : 'shopping...', r.x + r.w / 2, r.y + 70, 14, ready ? '#9ef01a' : '#cccccc', 'center');
      }
    }

    drawPlay(ctx) {
      const r = PLAY_RECT;
      const on = this.shoppers.some((s) => s.cur === PLAY);
      const bob = on ? Math.sin(this.t * 6) * 3 : 0;
      let label = this.opts.fromMenu ? 'BACK' : 'PLAY ▶';
      let sub = '';
      if (this.guest) { label = this.ready ? 'READY!' : 'I\'M READY'; sub = 'The host starts the map'; }
      else if (this.net) {
        const friends = this.players.filter((p) => !p.local);
        const ready = friends.filter((p) => MG.Gear.friends[p.id] && MG.Gear.friends[p.id].ready).length;
        if (friends.length) sub = `${ready}/${friends.length} friends ready`;
        label = 'START ▶';
      }
      ctx.fillStyle = on ? '#ffd23f' : this.guest && this.ready ? '#9ef01a' : 'rgba(43,25,61,0.9)';
      ctx.beginPath(); ctx.roundRect(r.x, r.y + bob, r.w, r.h, 16); ctx.fill();
      ctx.strokeStyle = on ? '#2b193d' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.stroke();
      UI.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + bob - (sub ? 7 : 0), 24, on || (this.guest && this.ready) ? '#2b193d' : '#ffffff', 'center');
      if (sub) UI.text(ctx, sub, r.x + r.w / 2, r.y + r.h / 2 + bob + 16, 11, on ? '#2b193d' : '#cccccc', 'center');
    }
  };

  function inside(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
})();
