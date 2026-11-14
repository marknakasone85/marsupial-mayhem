// The Marsupial World map (docs/DESIGN.md) and the story panels that play on it.
//  * Your champion walks between stops. Clearing a map opens the next; cleared maps show a tick and
//    the best score, and any open map can be replayed. The platypus's shop is a stop too.
//  * 2 players on one keyboard walk together. On Wi-Fi the host walks and picks, and friends see
//    the same map (and the same story panels) from { t: 'wmap' } messages.
(function () {
  const UI = MG.UI;
  const I = MG.Input;
  const W = MG.W, H = MG.H;
  const WALK_SPEED = 280;
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // ---------------- story panels ----------------
  MG.Story = {
    // Which story should play next on the map (once each), or null.
    pending() {
      const seen = MG.Save.get('story', {}) || {};
      const P = MG.Progress;
      if (!seen.opening) return 'opening';
      if (P.isCleared('outback-1') && !seen.invasion) return 'invasion';
      if (P.isCleared('outback-4') && !seen.rainforest) return 'rainforest';
      if (P.isCleared('rainforest-3') && !seen.canefields) return 'canefields';
      if (P.isCleared('cane-4') && !seen.world3done) return 'world3done';
      if (P.isCleared('cane-4') && !seen.tasmania) return 'tasmania';
      if (P.isCleared('alps-3') && !seen.quoll) return 'quoll';
      if (P.isCleared('alps-3') && !seen.city) return 'city';
      if (P.isCleared('city-4') && !seen.rift) return 'rift';
      if (P.isCleared('rift-3') && !seen.ghost) return 'ghost';
      if (P.isCleared('grin-4') && !seen.ending) return 'ending';
      return null;
    },
    markSeen(id) { const seen = MG.Save.get('story', {}) || {}; seen[id] = 1; MG.Save.set('story', seen); },

    drawPanel(ctx, id, page, t) {
      const panels = has(MG.STORY, id) ? MG.STORY[id] : null;
      const p = panels && panels[Math.max(0, Math.min(panels.length - 1, page | 0))];
      if (!p) return;
      const A = MG.Art;
      const gy = 452;
      A.background(ctx, 0, t, gy, 'day', p.theme || 'outback');
      for (const c of p.cast || []) {
        const x = c.x, y = c.y || gy, f = c.f || 1, s = c.s || 1;
        if (c.who !== 'treeKangaroo') A.shadow(ctx, x, gy, 30 * s);
        if (c.who === 'char') { const def = MG.charById(c.cid); A.character(ctx, def, { x, y, facing: f, scale: def.scale * 1.25 * s, t: t + x, pose: 'idle' }); }
        else if (c.who === 'quokka' && A.quokka) A.quokka(ctx, x, y, { t: t + x, facing: f, scale: 1.4 * s, sponsor: !!c.sponsor, shirt: !!c.shirt, wave: !c.angry, angry: !!c.angry });
        else if (c.who === 'platypus') A.platypus(ctx, x, y, 1.2 * s, t, { talk: Math.floor(t * 2) % 2 === 0 });
        else if (c.who === 'pest' && A[c.type]) A[c.type](ctx, x, y, Object.assign({ t: t + x, facing: c.f || -1, scale: 1.5 * s }, c, { scale: 1.5 * s, facing: c.f || -1 }));
        else if (c.who === 'cassowary' && A.cassowary) A.cassowary(ctx, x, y, { t, facing: f });
        else if (c.who === 'treeKangaroo' && A.treeKangaroo) A.treeKangaroo(ctx, x, y, { t, facing: f, sit: true });
        else if (c.who === 'quoll' && A.quoll) A.quoll(ctx, x, y, { t, facing: f, scared: !!c.scared, scale: 1.4 * s, spottedTail: !!c.champ, champ: !!c.champ });
        else if (A[c.who]) A[c.who](ctx, x, y, { t: t + x, facing: f, scale: (c.who === 'diprotodon' ? 1 : 1.4) * s });
      }
      UI.panel(ctx, 30, 18, W - 60, 40 + p.lines.length * 25 + 36, 'rgba(43,25,61,0.88)');
      UI.outlineText(ctx, p.title, W / 2, 46, p.title.length > 30 ? 24 : 30, '#ffd23f', 'center');
      p.lines.forEach((ln, i) => UI.text(ctx, ln, W / 2, 84 + i * 25, ln.length > 74 ? 14 : 17, '#ffffff', 'center'));
      // page dots
      panels.forEach((_, i) => {
        ctx.fillStyle = i === page ? '#ffd23f' : 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(W / 2 - (panels.length - 1) * 9 + i * 18, 64 + p.lines.length * 25 + 18, 4, 0, Math.PI * 2); ctx.fill();
      });
    },
  };

  MG.StoryScene = class {
    // opts: { id, after: () => scene, net }
    constructor(opts) {
      this.opts = opts;
      this.id = opts.id;
      this.page = 0;
      this.t = 0;
      this.sendT = 0;
    }
    enter() { MG.Audio.playMusic('title'); }
    get count() { return (MG.STORY[this.id] || []).length; }
    update(dt) {
      this.t += dt;
      if (this.opts.net) {
        MG.Net.maintain(dt);
        this.sendT -= dt;
        if (this.sendT <= 0) { this.sendT = 0.4; MG.Net.send({ t: 'wmap', story: this.id, page: this.page }, 'all', true); }
      }
      if (I.anyHit(['Escape'])) { MG.Audio.select(); this.finish(); return; }
      if (this.t < 0.35) return; // (so a key still held from before doesn't skip a page)
      if (I.anyPressed() || I.pointer.pressed) {
        MG.Audio.select();
        this.page++;
        this.t = 0.2;
        if (this.page >= this.count) this.finish();
      }
    }
    finish() {
      MG.Story.markSeen(this.id);
      MG.Engine.setScene(this.opts.after());
    }
    draw(ctx) {
      MG.Story.drawPanel(ctx, this.id, this.page, this.t);
      UI.text(ctx, MG.Touch.enabled ? 'Tap to continue' : 'Press any key to continue   (Esc skips the story)', W / 2, H - 14, 13, '#ffffff', 'center');
    }
  };

  // ---------------- the world map ----------------
  MG.WorldMapScene = class {
    // opts: { players: [{ id, cid, local }], net, at: level index or 'shop' }
    //       { guest: true }   a Wi-Fi friend (draws the host's { t: 'wmap' } messages)
    constructor(opts = {}) {
      this.opts = opts;
      this.guest = !!opts.guest;
      this.net = !!opts.net;
      this.players = opts.players || [{ id: 0, cid: MG.CHARACTERS[(MG.Save.get('lastPicks', [0])[0] || 0) % MG.CHARACTERS.length].id, local: 'SOLO' }];
      this.stops = ['shop'].concat(MG.WorldMapScene.walkOrder());
      this.t = 0;
      this.sendT = 0;
      this.msg = '';
      this.msgT = 0;
      this.view = null;
      this.cur = this.startStop(opts.at);
      this.pos = MG.MAP_STOPS[this.stops[this.cur]].slice();
      this.walk = null;
      this.storyChecked = false;
    }

    // The order the arrow keys walk through the stops: each map right after the one that opens it,
    // so a branch added later (the Top End after the Rainforest) is next to where its path starts.
    static walkOrder() {
      const order = [];
      for (let i = 0; i < MG.LEVELS.length; i++) {
        const L = MG.LEVELS[i];
        if (!has(MG.MAP_STOPS, L.id)) continue;
        const opener = i === 0 ? null : L.after || MG.LEVELS[i - 1].id;
        const at = opener ? order.indexOf(opener) : -1;
        if (at >= 0 && at < order.length - 1) order.splice(at + 1, 0, L.id); else order.push(L.id);
      }
      return order;
    }
    levelIndex(stop) { return MG.LEVELS.findIndex((l) => l.id === stop); }
    // a stop in a bonus world (the Time Rift, the Top End, the Isle of Man)
    isBonus(i) { const w = MG.WORLDS.find((x) => x.levels.includes(this.stops[i])); return !!(w && w.bonus); }
    isOpen(i) { const s = this.stops[i]; return s === 'shop' || MG.Progress.isOpen(this.levelIndex(s)); }
    // a secret stop (the Isle of Man) only shows once it's been found
    isShown(i) { const s = this.stops[i]; if (s === 'shop') return true; const L = MG.LEVELS[this.levelIndex(s)]; return !L.secret || MG.Unlocks.has(L.secret); }
    // the stop a path comes from: the map that opens this one
    fromStop(i) {
      const s = this.stops[i];
      if (s === 'shop') return null;
      const li = this.levelIndex(s), L = MG.LEVELS[li];
      if (li === 0) return 'shop';
      return L.after || MG.LEVELS[li - 1].id;
    }
    startStop(at) {
      if (at === 'shop') return 0;
      if (typeof at === 'number' && MG.LEVELS[at]) { const i = this.stops.indexOf(MG.LEVELS[at].id); if (i >= 0) return i; }
      // the first open map on the main path that isn't cleared yet (or the last open one)
      let best = 1;
      for (let i = 1; i < this.stops.length; i++) {
        if (!this.isShown(i) || !this.isOpen(i) || this.isBonus(i)) continue;
        best = i;
        if (!MG.Progress.isCleared(this.stops[i])) break;
      }
      return best;
    }

    enter() {
      this.storyChecked = false; // (stories can come one after another)
      MG.Audio.playMusic(MG.Audio.SONGS.map ? 'map' : 'title');
      if (this.net || this.guest) MG.Net.onMessage = (m, from) => this.onNet(m, from);
      if (this.net) this.broadcast();
    }

    // ---------------- Wi-Fi ----------------
    broadcast() {
      MG.Net.send({
        t: 'wmap', cur: this.cur, pos: [Math.round(this.pos[0]), Math.round(this.pos[1])],
        cl: MG.LEVELS.filter((l) => MG.Progress.isCleared(l.id)).map((l) => l.id),
        iom: MG.Unlocks.has('isleofman') ? 1 : 0,
        pl: this.players.map((p) => ({ id: p.id, cid: p.cid })),
      }, 'all', true);
      this.sendT = 0.25;
    }
    onNet(m, from) {
      if (!m) return;
      if (this.guest) {
        if (m.t === 'hostLeft') { if (m.rehost) { MG.Net.status = 'closed'; return; } MG.Net.leave(); MG.Engine.setScene(new MG.MenuScene()); return; }
        if (m.t === 'toLobby') { MG.Engine.setScene(new MG.JoinScene({ rejoin: true })); return; }
        if (m.t === 'shop') { const shop = new MG.ShopScene({ guest: true }); MG.Engine.setScene(shop); shop.onNet(m); return; }
        if (m.t === 'snap') {
          const scene = m.k === 'duel' ? new MG.RemoteDuelScene() : new MG.RemoteScene({ level: m.lv || 0 });
          MG.Engine.setScene(scene);
          scene.onNet(m);
          return;
        }
        if (m.t === 'wmap') this.view = m;
        return;
      }
      // host: friends joining or leaving while we look at the map
      if (from === 'server') {
        if (m.t === 'joined') MG.Net.send({ t: 'welcome', inGame: true, mode: 'campaign', level: 0 }, m.id, true);
        else if (m.t === 'left') this.players = this.players.filter((p) => p.id !== m.id || p.local);
        return;
      }
      if (m.t === 'gear' || m.t === 'pick') MG.Gear.note(from, m);
      if (m.t === 'pick' && m.ready && typeof from === 'number' && !this.players.some((p) => p.id === from) &&
        this.players.length < 4 && MG.validCid(m.cid)) {
        this.players.push({ id: from, cid: m.cid, local: null });
        MG.Audio.confirm();
      }
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.msgT -= dt;
      if (this.guest) { MG.Net.maintain(dt); return; }
      if (!this.storyChecked) {
        this.storyChecked = true;
        const story = MG.Story.pending();
        if (story) { MG.Engine.setScene(new MG.StoryScene({ id: story, net: this.net, after: () => this })); return; }
        // Benny knows a secret island (the Isle of Man bonus map)
        if (this.players.some((p) => p.cid === 'benny') && MG.Unlocks.unlock('isleofman')) { this.msg = 'Benny knows a secret island! (the Isle of Man)'; this.msgT = 4; MG.Audio.powerUp(); }
      }
      if (this.net) {
        MG.Net.maintain(dt);
        this.sendT -= dt;
        if (this.sendT <= 0) this.broadcast();
      }
      if (this.walk) {
        const w = this.walk;
        w.k = Math.min(1, w.k + (WALK_SPEED * dt) / w.len);
        this.pos = [w.from[0] + (w.to[0] - w.from[0]) * w.k, w.from[1] + (w.to[1] - w.from[1]) * w.k];
        if (w.k >= 1) this.walk = null;
        return;
      }
      if (MG.Menu.back()) { MG.Audio.select(); this.leave(); return; }
      if (I.anyHit(['KeyB', 'Pad0Y'])) { this.openShop(); return; }
      if (MG.Menu.left() || MG.Menu.up()) this.step(-1);
      else if (MG.Menu.right() || MG.Menu.down()) this.step(1);
      else if (MG.Menu.confirm()) this.choose();
      const p = I.pointer;
      if (p.pressed) {
        for (let i = 0; i < this.stops.length; i++) {
          const [sx, sy] = MG.MAP_STOPS[this.stops[i]];
          if (Math.hypot(p.x - sx, p.y - sy) > 26) continue;
          if (!this.isShown(i)) continue;
          if (i === this.cur) this.choose();
          else if (this.isOpen(i)) this.goTo(i);
          else this.say('Clear the map before it first!');
        }
        const r = this.playRect(), sr = this.shopRect();
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) this.choose();
        else if (p.x >= sr.x && p.x <= sr.x + sr.w && p.y >= sr.y && p.y <= sr.y + sr.h) this.openShop();
      }
    }
    say(msg) { this.msg = msg; this.msgT = 2; MG.Audio.emptyClick(); }
    step(d) {
      let i = this.cur + d;
      while (i >= 0 && i < this.stops.length && !this.isShown(i)) i += d;
      if (i < 0 || i >= this.stops.length) return;
      if (!this.isOpen(i)) {
        const from = this.fromStop(i), L = MG.LEVELS[this.levelIndex(from)];
        this.say('Clear ' + (L ? L.name : 'the map before it') + ' first!');
        return;
      }
      this.goTo(i);
    }
    goTo(i) {
      const to = MG.MAP_STOPS[this.stops[i]];
      this.walk = { from: this.pos.slice(), to, k: 0, len: Math.max(1, Math.hypot(to[0] - this.pos[0], to[1] - this.pos[1])) };
      this.cur = i;
      MG.Audio.hop();
    }
    choose() {
      const stop = this.stops[this.cur];
      MG.Audio.confirm();
      if (stop === 'shop') { this.openShop(true); return; }
      const i = this.levelIndex(stop), L = MG.LEVELS[i];
      const go = () => {
        if (this.net) MG.Net.send({ t: 'start', mode: 'campaign', level: i }, 'all', true);
        return new MG.CampaignScene({ level: i, net: this.net, players: this.players });
      };
      // some maps have a story first (the betrayal on Grin Isle...)
      const seen = MG.Save.get('story', {}) || {};
      if (L.storyBefore && !seen[L.storyBefore]) { MG.Engine.setScene(new MG.StoryScene({ id: L.storyBefore, net: this.net, after: go })); return; }
      MG.Engine.setScene(go());
    }
    leave() {
      if (this.net) {
        MG.Net.send({ t: 'toLobby' }, 'all', true);
        MG.Engine.setScene(new MG.LobbyScene({ resume: true, players: this.players.map((p) => ({ id: p.id, cid: p.cid, ready: true })) }));
        return;
      }
      MG.Engine.setScene(new MG.MenuScene());
    }
    // The platypus's shop, from any stop (the SHOP button or B). Afterwards you're back at the same stop.
    openShop(quiet) {
      if (!quiet) MG.Audio.confirm();
      const stop = this.stops[this.cur];
      const at = stop === 'shop' ? 'shop' : this.levelIndex(stop);
      const level = at === 'shop' ? Math.max(0, this.levelIndex(this.stops[this.startStop()])) : at;
      MG.Engine.setScene(new MG.ShopScene({ net: this.net, level, players: this.players, toMap: true, mapAt: at, gid: null, earned: [] }));
    }
    playRect() { return { x: W - 196, y: H - 74, w: 180, h: 54 }; }
    // top right, over the sea (the bottom of the map has Tasmania's stops)
    shopRect() { return { x: W - 186, y: this.net || this.guest ? 64 : 40, w: 170, h: 54 }; }
    // the SHOP button: the platypus, everyone's coins here, and a "!" when there's something new to afford
    drawShopButton(ctx) {
      const r = this.shopRect();
      const pids = this.players.filter((p) => p.local).map((p) => (p.local === 'P2' ? 'p2' : 'p1'));
      const news = pids.some((pid) => MG.Gear.canBuySomething(pid));
      const bob = news ? Math.sin(this.t * 4) * 2 : 0;
      ctx.fillStyle = '#2ec4b6';
      ctx.beginPath(); ctx.roundRect(r.x, r.y + bob, r.w, r.h, 14); ctx.fill();
      ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.roundRect(r.x, r.y + bob, r.w, r.h, 14); ctx.clip();
      MG.Art.platypus(ctx, r.x + 30, r.y + r.h + 4 + bob, 0.42, this.t, {});
      ctx.restore();
      UI.text(ctx, 'SHOP', r.x + 104, r.y + 19 + bob, 22, '#2b193d', 'center');
      const coins = pids.length ? pids.map((pid) => MG.Gear.coins(pid)).join(' / ') : '';
      if (coins) {
        UI.text(ctx, coins, r.x + 112, r.y + 41 + bob, 14, '#2b193d', 'center');
        ctx.font = `bold 14px ${UI.FONT}`;
        MG.Art.coinIcon(ctx, r.x + 112 - ctx.measureText(coins).width / 2 - 10, r.y + 41 + bob, 6);
      }
      if (news) {
        ctx.fillStyle = '#ff4d6d'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(r.x + r.w - 6, r.y + 4 + bob, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        UI.text(ctx, '!', r.x + r.w - 6, r.y + 5 + bob, 15, '#ffffff', 'center');
      }
    }

    // ---------------- draw ----------------
    draw(ctx) {
      const v = this.guest ? this.view : null;
      if (this.guest && v && v.story) {
        MG.Story.drawPanel(ctx, v.story, v.page || 0, this.t);
        UI.text(ctx, 'The host is reading the story...', W / 2, H - 14, 13, '#ffffff', 'center');
        return;
      }
      const cleared = v ? new Set(v.cl || []) : null;
      const isCleared = (id) => (cleared ? cleared.has(id) : MG.Progress.isCleared(id));
      const iom = v ? !!v.iom : MG.Unlocks.has('isleofman');
      const isShown = (i) => { const s = this.stops[i]; if (s === 'shop') return true; const L = MG.LEVELS[this.levelIndex(s)]; return !L.secret || iom; };
      const isOpen = (i) => {
        const s = this.stops[i];
        if (s === 'shop') return true;
        if (!isShown(i)) return false;
        const li = this.levelIndex(s);
        return li === 0 || isCleared(s) || isCleared(this.fromStop(i));
      };
      const cur = v ? v.cur || 0 : this.cur;
      const pos = v && v.pos ? v.pos : this.pos;
      const players = v && v.pl ? v.pl : this.players;

      if (MG.Art.worldMap) MG.Art.worldMap(ctx, this.t, { isleOfMan: iom });
      else { ctx.fillStyle = '#3a86c8'; ctx.fillRect(0, 0, W, H); }
      // worlds still to come
      for (const s of MG.WORLDS_SOON) UI.outlineText(ctx, 'coming soon', s.x, s.y, 10, '#ffd23f', 'center');
      // paths between the stops
      for (let i = 1; i < this.stops.length; i++) {
        if (!isShown(i)) continue;
        const [ax, ay] = MG.MAP_STOPS[this.fromStop(i)], [bx, by] = MG.MAP_STOPS[this.stops[i]];
        const open = isOpen(i);
        ctx.strokeStyle = open ? '#fff3c4' : 'rgba(255,255,255,0.35)';
        ctx.lineWidth = open ? 5 : 3;
        ctx.setLineDash(open ? [] : [6, 8]);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 - 18, bx, by); ctx.stroke();
        ctx.setLineDash([]);
      }
      // the stops
      this.stops.forEach((stop, i) => {
        if (!isShown(i)) return;
        const [x, y] = MG.MAP_STOPS[stop];
        const here = i === cur;
        if (stop === 'shop') {
          MG.Art.platypus(ctx, x, y + 14, 0.36, this.t, {});
          UI.outlineText(ctx, 'SHOP', x, y + 26, 12, '#ffd23f', 'center');
          if (here) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 6, 26 + Math.sin(this.t * 5) * 2, 0, Math.PI * 2); ctx.stroke(); }
          return;
        }
        const li = this.levelIndex(stop), L = MG.LEVELS[li];
        const open = isOpen(i), done = isCleared(stop);
        const r = L.boss && MG.ENEMY_TYPES[L.boss.type] && L.boss.type !== 'bigBuck' ? 17 : 14;
        ctx.fillStyle = done ? '#ffd23f' : open ? '#ffffff' : '#8d8d8d';
        ctx.strokeStyle = '#2b193d'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (here) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 6 + Math.sin(this.t * 5) * 2, 0, Math.PI * 2); ctx.stroke(); }
        if (!open) UI.text(ctx, '🔒', x, y + 1, 12, '#333333', 'center');
        else if (done) UI.text(ctx, '✓', x, y + 1, 16, '#2b193d', 'center');
        else UI.text(ctx, String(li + 1), x, y + 1, 13, '#2b193d', 'center');
        if (r > 14) UI.outlineText(ctx, 'BOSS', x, y - r - 9, 10, '#ff4d6d', 'center'); // a world boss map
      });
      // the champion(s), walking the map
      players.slice(0, 4).forEach((p, k) => {
        const def = MG.charById(p.cid);
        const bob = this.walk || (v && v.pos) ? Math.abs(Math.sin(this.t * 10)) * 4 : 0;
        const ox = (k - (Math.min(players.length, 4) - 1) / 2) * 20;
        MG.Art.shadow(ctx, pos[0] + ox, pos[1] - 12, 10);
        MG.Art.character(ctx, def, { x: pos[0] + ox, y: pos[1] - 12 - bob, facing: 1, scale: def.scale * 0.42, t: this.t + k, pose: this.walk ? 'walk' : 'idle', walk: this.t * 2 });
      });

      // title, info about the stop, and what to press
      const top = this.net || this.guest ? 46 : 24;
      UI.outlineText(ctx, 'MARSUPIAL WORLD', 16, top, 22, '#ffd23f');
      const stop = this.stops[cur];
      UI.panel(ctx, 16, H - 74, 470, 58);
      if (stop === 'shop') {
        UI.text(ctx, 'THE PLATYPUS\'S SHOP', 30, H - 56, 17, '#ffd23f');
        UI.text(ctx, 'Weapons, armor and upgrades. Egg-layers can sell stuff!', 30, H - 32, 12, '#ffffff');
      } else {
        const li = this.levelIndex(stop), L = MG.LEVELS[li];
        const world = MG.WORLDS.find((w) => w.levels.includes(stop));
        const label = `${world ? world.name : L.world}: ${L.name}`;
        UI.text(ctx, label, 30, H - 56, label.length > 44 ? 13 : 15, '#ffd23f');
        const best = MG.Progress.best(stop);
        const info = !isOpen(cur) ? 'Locked: clear the map before it first.'
          : (isCleared(stop) ? '✓ Cleared' + (best ? `   Best score ${best}` : '') : 'Not cleared yet') + (L.boss && L.boss.type !== 'bigBuck' ? '   Boss: ' + MG.ENEMY_TYPES[L.boss.type].name : '');
        UI.text(ctx, info, 30, H - 32, info.length > 60 ? 11 : 12, '#ffffff');
      }
      if (!this.guest) {
        const r = this.playRect();
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 14); ctx.fill();
        UI.text(ctx, stop === 'shop' ? 'SHOP' : 'PLAY ▶', r.x + r.w / 2, r.y + r.h / 2 + 1, 22, '#2b193d', 'center');
        this.drawShopButton(ctx);
        const hint = MG.Touch.enabled ? 'Tap a stop to walk there, tap again (or PLAY) to go' : 'Arrows / A D: walk     Enter / F: go     B: shop     Esc: ' + (this.net ? 'lobby' : 'title screen');
        UI.text(ctx, hint, W - 16, top, 12, '#ffffff', 'right');
      } else {
        UI.outlineText(ctx, 'The host picks the next map...', W - 110, H - 46, 15, '#ffffff', 'center');
      }
      if (this.msgT > 0) UI.outlineText(ctx, this.msg, W / 2, 60, 20, '#ff4d6d', 'center');
      if (this.net || this.guest) UI.netStrip(ctx, MG.Net.hudInfo());
    }
  };
})();
