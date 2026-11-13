// Wi-Fi game, friends' side: draws what the host sends (~30 times a second) and sends our
// button presses back. The host runs the real game, so everyone sees the same thing.
// Same design as Sloth Slap's guest view.
(function () {
  const UI = MG.UI;
  const W = MG.W, H = MG.H;
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  MG.RemoteScene = class {
    constructor(opts = {}) {
      this.t = 0;
      this.lastSeq = 0;
      this.snap = null;
      this.input = {};
      this.menu = null;
      this.showControls = false;
      this.showStrip = MG.Save.get('keyStrip', true);
      this.ended = null;
      this.setLevel(opts.level || 0);
    }

    setLevel(i) {
      this.levelIndex = Math.max(0, Math.min(MG.LEVELS.length - 1, i | 0));
      this.L = MG.LEVELS[this.levelIndex];
      this.groundY = MG.GROUND_Y;
      this.platforms = this.L.platforms || [];
      this.crates = (this.L.crates || []).map((c) => new MG.Crate(c.x, c.loot, c.label));
      this.gates = (this.L.gates || []).map((g) => ({ x: g.x, lift: 0, left: 0 })).sort((a, b) => a.x - b.x);
      this.goalX = this.L.length - 160;
      this.players = {};
      this.enemies = new Map();
      this.pickups = [];
      this.proj = [];
      this.nades = [];
      this.coins = [];
      this.fx = new MG.FX();
      this.camX = this.camTarget = 0;
      MG.Audio.playMusic(this.L.music);
    }

    enter() {
      MG.Net.onMessage = (m) => this.onNet(m);
      MG.Audio.playMusic(this.L.music);
    }

    floorBelow(x, y) { return MG.floorBelow(this.platforms, this.groundY, x, y); }

    // ---------------- messages from the host ----------------
    onNet(m) {
      if (!m) return;
      if (m.t === 'hostLeft') {
        if (m.rehost) { MG.Net.status = 'closed'; return; } // the host is reconnecting: we rejoin by ourselves
        this.end(m.reason || 'The host ended the game.');
        return;
      }
      if (m.t === 'toLobby') { MG.Engine.setScene(new MG.JoinScene({ rejoin: true })); return; }
      if (m.t === 'shop') { const shop = new MG.ShopScene({ guest: true }); MG.Engine.setScene(shop); shop.onNet(m); return; }
      if (m.t === 'snap' && m.k === 'duel') { // the host switched to a battle
        const scene = new MG.RemoteDuelScene();
        MG.Engine.setScene(scene);
        scene.onNet(m);
        return;
      }
      if (m.t !== 'snap' || !(m.n > this.lastSeq)) return;
      this.lastSeq = m.n;
      if (m.lv !== this.levelIndex) this.setLevel(m.lv);
      if (m.bo && m.bo[2] && this.snap && !(this.snap.bo && this.snap.bo[2])) MG.Audio.playMusic('boss');
      this.snap = m;
      this.snapAt = performance.now();
      const mine = (m.pl || []).find((p) => p.id === MG.Net.id);
      if (mine) MG.Net.myCid = mine.cid;
      // coins we picked up in the host's game go into our own wallet (counted once)
      if (mine && mine.co) MG.Gear.netEarn(m.gid, mine.id, mine.co);

      // players glide toward their newest spot (jumps of more than 220 px snap straight there)
      const seen = new Set();
      for (const p of m.pl || []) {
        seen.add(p.id);
        const cur = this.players[p.id];
        if (!cur || Math.abs(cur.x - p.x) > 220 || Math.abs(cur.y - p.y) > 220) this.players[p.id] = Object.assign({}, p, { tx: p.x, ty: p.y });
        else this.players[p.id] = Object.assign({}, p, { x: cur.x, y: cur.y, tx: p.x, ty: p.y }); // fresh state, smooth position
      }
      for (const id of Object.keys(this.players)) if (!seen.has(+id)) delete this.players[id];

      const ids = new Set();
      for (const [uid, type, x, y, facing, fl, alive, spin, dizzy, et, vf] of m.en || []) {
        if (!has(MG.ENEMY_TYPES, type)) continue;
        ids.add(uid);
        let e = this.enemies.get(uid);
        if (!e) { e = new MG.Enemy(type, x, y); this.enemies.set(uid, e); }
        Object.assign(e, { tx: x, ty: y, facing, flash: fl ? 0.1 : 0, alive: !!alive, spin, hurt: dizzy ? 0.6 : 0, t: et, remoteFlags: vf || 0, hidden: !!(vf & 4) });
      }
      for (const uid of [...this.enemies.keys()]) if (!ids.has(uid)) this.enemies.delete(uid);

      (m.cr || []).forEach(([alive, wobble, fl], i) => { const c = this.crates[i]; if (c) Object.assign(c, { alive: !!alive, wobble, flash: fl ? 0.08 : 0 }); });
      (m.ga || []).forEach(([, lift, left], i) => { const g = this.gates[i]; if (g) Object.assign(g, { lift, left }); });
      this.pickups = (m.pk || []).map(([type, x, y]) => new MG.Pickup(type, x, y));
      this.proj = (m.pr || []).map(([kind, x, y, vx, vy, wall, x0]) => {
        const p = new MG.Projectile(has(MG.Sync.PROJ_KIND, kind) ? MG.Sync.PROJ_KIND[kind] : kind, x, y, vx, vy, 'host', {});
        if (wall) { p.wall = true; p.vx = 0; p.vy = 0; }
        if (x0 !== undefined) p.x0 = x0;
        return p;
      });
      this.nades = (m.gn || []).map(([x, y, spin, fuse, t]) => ({ draw: (ctx) => MG.Grenade.drawState(ctx, x, y, spin, fuse, t) }));
      this.coins = (m.cs || []).map(([x, y, v, lying]) => ({ x, draw: (ctx) => MG.Art.coin(ctx, x, y + (lying ? Math.sin(this.t * 3 + x) * 3 : 0), this.t + x * 0.01, v) }));
      this.camTarget = m.cam;
      MG.Sync.replay(this.fx, m);
    }

    end(reason) {
      this.ended = reason;
      MG.Net.leave();
      this.menu = new MG.MenuList([
        { label: 'Back to Menu', act: () => MG.Engine.setScene(new MG.MenuScene()) },
      ], W / 2, 300, { w: 300, h: 48 });
    }

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      const k = 1 - Math.pow(0.0004, dt);
      for (const p of Object.values(this.players)) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; }
      for (const e of this.enemies.values()) {
        if (Math.abs(e.tx - e.x) > 220) { e.x = e.tx; e.y = e.ty; }
        e.x += (e.tx - e.x) * k;
        e.y += (e.ty - e.y) * k;
      }
      for (const p of this.pickups) p.t = this.t + p.x * 0.013;
      this.camX += (this.camTarget - this.camX) * k;

      if (this.ended) {
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }
      // lost the connection? rejoin by ourselves with the same code and character
      MG.Net.maintain(dt, () => {
        if (MG.Net.myCid) MG.Net.send(Object.assign({ t: 'pick', cid: MG.Net.myCid, ready: true }, MG.Gear.mine()), 'host', true);
      });
      // tell the host our gear and wallet now and then (it shows our coins and uses our gear)
      this.gearT = (this.gearT || 0) - dt;
      if (this.gearT <= 0 && MG.Net.active) { this.gearT = 2; MG.Net.send(Object.assign({ t: 'gear' }, MG.Gear.mine()), 'host', true); }
      this.lostT = MG.Net.lost ? (this.lostT || 0) + dt : 0;
      if (this.lostT > 90) { this.end('Could not reconnect to the host.'); return; }

      if (this.showControls) {
        if (MG.Input.anyPressed()) { this.showControls = false; MG.Audio.select(); }
        return;
      }
      if (this.menu) {
        if (MG.Menu.pause()) { this.menu = null; return; }
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }
      if (MG.Menu.pause()) { this.openMenu(); return; }
      MG.Sync.sendInput(this.input, dt, MG.readControls(MG.Controls.SOLO));
    }

    openMenu() {
      MG.Sync.sendInput(this.input, 0, {}); // let go of everything while the menu is open
      this.menu = new MG.MenuList([
        { label: 'Back to the game', act: () => { this.menu = null; } },
        { label: 'Controls', act: () => { this.showControls = true; } },
        { label: () => MG.onscreenLabel(this), act: () => MG.cycleOnscreen(this) },
        { label: () => 'Blood: ' + (MG.Settings.blood ? 'ON' : 'OFF (confetti)'), act: () => MG.toggleBlood() },
        { label: () => 'Sound: ' + (MG.Audio.muted ? 'OFF' : 'ON'), act: () => MG.Audio.toggleMute() },
        { label: 'Leave Wi-Fi Game', act: () => { MG.Net.leave(); MG.Engine.setScene(new MG.MenuScene()); } },
      ], W / 2, 190, { w: 340, h: 40, gap: 8 });
    }

    wantsTouch() { return !!this.snap && !this.menu && !this.ended && !this.showControls && this.snap.st === 'play'; }
    touchPlayer() {
      const me = this.snap && this.snap.pl.find((p) => p.id === MG.Net.id);
      return me ? { canSpecial: !!me.cs, ammo: me.am || 0, grenades: me.gr || 0, pouch: me.pu || null, joeyReady: !!me.jr } : null;
    }

    // ---------------- draw ----------------
    draw(ctx) {
      const s = this.snap;
      if (!s) {
        MG.Art.background(ctx, 0, this.t, this.groundY);
        UI.outlineText(ctx, 'Waiting for the host...', W / 2, H / 2, 30, '#ffffff', 'center');
        if (this.ended) { UI.text(ctx, this.ended, W / 2, H / 2 + 40, 16, '#ff4d6d', 'center'); this.menu.draw(ctx); }
        return;
      }
      // fast things (gumnuts, dust waves) are drawn a little ahead, since the snapshot is already old
      const ahead = Math.min(0.1, (performance.now() - this.snapAt) / 1000);
      const proj = this.proj.map((p) => ({ draw: (c) => { const x = p.x, y = p.y; p.x += p.vx * ahead; p.y += p.vy * ahead; p.draw(c); p.x = x; p.y = y; } }));
      MG.drawCampaignWorld(ctx, {
        L: this.L, t: this.t, camX: this.camX, groundY: this.groundY, fx: this.fx, platforms: this.platforms,
        gates: this.gates, crates: this.crates, pickups: this.pickups, enemies: [...this.enemies.values()],
        players: Object.values(this.players), grenades: this.nades, projectiles: proj, coins: this.coins,
        goalOpen: !(s.bo && s.bo[3]), world: this,
      });

      const me = s.pl.find((p) => p.id === MG.Net.id);
      const alive = s.pl.filter((p) => p.st !== 'ko');
      const leadX = (alive.length ? alive : s.pl).reduce((m, p) => Math.max(m, p.x), 0);
      const strips = [];
      if (this.showStrip && me && s.st === 'play' && !this.menu && !MG.Touch.enabled) {
        strips.push({
          fighter: { move: me.mk ? { kind: me.mk } : null, state: me.st, onGround: !!me.og, canSpecial: !!me.cs, ammo: me.am || 0, grenades: me.gr || 0, firing: !!me.fi,
            pouch: me.pu || null, joeyReady: !!me.jr, joeyOut: Array.isArray(me.jy) && !!me.jy[2] },
          opts: { tag: `YOU (P${me.id + 1})`, tagColor: MG.PLAYER_COLORS[me.id % 4] },
        });
      }
      const gi = this.gates.findIndex((g) => g.lift < 0.05 && g.x > leadX);
      const g = gi >= 0 ? this.gates[gi] : null;
      MG.CampaignHUD.draw(ctx, {
        t: this.t, coop: s.pl.length > 1, score: s.sc, mapName: this.L.name, progress: leadX / this.goalX,
        net: MG.Net.hudInfo(),
        boss: s.bo && s.bo[2] && s.bo[3] && this.L.boss ? { name: MG.ENEMY_TYPES[this.L.boss.type].name, frac: s.bo[0] / s.bo[1] } : null,
        gateLeft: g && g.x - leadX < 260 ? g.left : 0,
        players: s.pl.map((p) => {
          const def = MG.charById(p.cid);
          return {
            tag: `P${p.id + 1}`, color: MG.PLAYER_COLORS[p.id % 4], name: def.name, cid: p.cid,
            colors: p.coat ? MG.coatFor(def, p.coat) : null,
            hp: p.hp, mhp: p.mhp, meter: p.me || 0, canSpecial: !!p.cs, ammo: p.am || 0, grenades: p.gr || 0,
            powers: Array.isArray(p.pw) ? p.pw : [], respawnT: p.rt || 0, ko: p.st === 'ko',
            joeyLevel: Array.isArray(p.jy) ? p.jy[3] : 0, joeyCool: p.jc || 0, joeyReady: !!p.jr, pouch: p.pu || null,
            weapon: p.wpn || null, ammoMax: p.amx || 0, armor: p.ar || 0, armorMax: p.arm || 0,
            coins: p.id === MG.Net.id ? MG.Gear.coins('p1') : p.cn || 0,
          };
        }),
        strips,
      });
      MG.CampaignHUD.overlays(ctx, {
        state: s.st, stateT: s.stT, t: s.tm, L: this.L, score: s.sc,
        hpBonus: s.hb, newBest: s.nb, coop: s.pl.length > 1, guest: true, showControls: false, joeyGrew: s.jg || null,
      });
      if (!me && !this.ended) UI.outlineText(ctx, 'Joining the team...', W / 2, 200, 26, '#ffffff', 'center');
      if (me && this.t < 5 && s.st === 'play') UI.outlineText(ctx, `You are P${me.id + 1}`, W / 2, 340, 28, MG.PLAYER_COLORS[me.id % 4], 'center');
      if ((s.st === 'dead' || s.st === 'won') && !this.menu) UI.text(ctx, 'The host chooses what happens next...', W / 2, 300, 18, '#ffffff', 'center');
      if (MG.Net.lost && !this.ended) {
        UI.panel(ctx, W / 2 - 230, 230, 460, 64);
        UI.outlineText(ctx, 'Connection lost - rejoining...', W / 2, 254, 22, '#ff4d6d', 'center');
        UI.text(ctx, `Reconnecting by itself to code ${MG.Net.code}`, W / 2, 278, 13, '#ffffff', 'center');
      }
      if (this.showControls) { UI.fade(ctx, 0.55); UI.controlsPanel(ctx); return; }
      if (this.menu) {
        UI.fade(ctx, 0.55);
        if (this.ended) {
          UI.outlineText(ctx, 'GAME OVER', W / 2, 200, 48, '#ffd23f', 'center');
          UI.text(ctx, this.ended, W / 2, 250, 18, '#ffffff', 'center');
        } else {
          UI.outlineText(ctx, 'MENU', W / 2, 130, 44, '#ffd23f', 'center');
          UI.text(ctx, 'The game keeps going for everyone else!', W / 2, 166, 15, '#dddddd', 'center');
        }
        this.menu.draw(ctx);
      }
    }
  };
})();
