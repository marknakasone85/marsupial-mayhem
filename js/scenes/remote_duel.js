// Wi-Fi battle, friends' side: draws the host's duel snapshots and sends button presses back.
// Same design as Sloth Slap's guest battle view.
(function () {
  const UI = MG.UI;
  const W = MG.W, H = MG.H;
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  MG.RemoteDuelScene = class {
    constructor() {
      this.t = 0;
      this.lastSeq = 0;
      this.snap = null;
      this.input = {};
      this.menu = null;
      this.showControls = false;
      this.showStrip = MG.Save.get('keyStrip', true);
      this.ended = null;
      this.players = {};
      this.proj = [];
      this.nades = [];
      this.pickups = [];
      this.fx = new MG.FX();
      this.groundY = MG.GROUND_Y;
      this.setStage(0);
    }

    setStage(i) {
      this.stageIndex = Math.max(0, Math.min(MG.STAGES.length - 1, i | 0));
      this.stage = MG.STAGES[this.stageIndex];
      this.platforms = this.stage.platforms || [];
    }

    enter() {
      MG.Net.onMessage = (m) => this.onNet(m);
      MG.Audio.playMusic('boss');
    }

    floorBelow(x, y) { return MG.floorBelow(this.platforms, this.groundY, x, y); }

    onNet(m) {
      if (!m) return;
      if (m.t === 'hostLeft') {
        if (m.rehost) { MG.Net.status = 'closed'; return; }
        this.end(m.reason || 'The host ended the game.');
        return;
      }
      if (m.t === 'toLobby') { MG.Engine.setScene(new MG.JoinScene({ rejoin: true })); return; }
      if (m.t === 'snap' && m.k !== 'duel') { // the host switched to the campaign
        const scene = new MG.RemoteScene({ level: m.lv || 0 });
        MG.Engine.setScene(scene);
        scene.onNet(m);
        return;
      }
      if (m.t !== 'snap' || !(m.n > this.lastSeq)) return;
      this.lastSeq = m.n;
      if (m.stg !== this.stageIndex) this.setStage(m.stg);
      this.snap = m;
      this.snapAt = performance.now();
      const seen = new Set();
      for (const p of m.pl || []) {
        seen.add(p.id);
        const cur = this.players[p.id];
        if (!cur || Math.abs(cur.x - p.x) > 220 || Math.abs(cur.y - p.y) > 220) this.players[p.id] = Object.assign({}, p, { tx: p.x, ty: p.y });
        else this.players[p.id] = Object.assign({}, p, { x: cur.x, y: cur.y, tx: p.x, ty: p.y });
      }
      for (const id of Object.keys(this.players)) if (!seen.has(+id)) delete this.players[id];
      this.proj = (m.pr || []).map(([kind, x, y, vx, vy, wall, x0]) => {
        const p = new MG.Projectile(has(MG.Sync.PROJ_KIND, kind) ? MG.Sync.PROJ_KIND[kind] : kind, x, y, vx, vy, 'host', {});
        if (wall) { p.wall = true; p.vx = 0; p.vy = 0; }
        if (x0 !== undefined) p.x0 = x0;
        return p;
      });
      this.nades = (m.gn || []).map(([x, y, spin, fuse, t]) => ({ draw: (ctx) => MG.Grenade.drawState(ctx, x, y, spin, fuse, t) }));
      this.pickups = (m.pk || []).map(([type, x, y]) => new MG.Pickup(type, x, y));
      MG.Sync.replay(this.fx, m);
    }

    end(reason) {
      this.ended = reason;
      MG.Net.leave();
      this.menu = new MG.MenuList([{ label: 'Back to Menu', act: () => MG.Engine.setScene(new MG.MenuScene()) }], W / 2, 300, { w: 300, h: 48 });
    }

    update(dt) {
      this.t += dt;
      this.fx.update(dt);
      const k = 1 - Math.pow(0.0004, dt);
      for (const p of Object.values(this.players)) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; }
      for (const p of this.pickups) p.t = this.t + p.x * 0.013;
      if (this.ended) { const item = this.menu.update(dt); if (item) item.act(); return; }
      MG.Net.maintain(dt, () => { if (MG.Net.myCid) MG.Net.send({ t: 'pick', cid: MG.Net.myCid, ready: true }, 'host', true); });
      this.lostT = MG.Net.lost ? (this.lostT || 0) + dt : 0;
      if (this.lostT > 90) { this.end('Could not reconnect to the host.'); return; }
      if (this.showControls) { if (MG.Input.anyPressed()) { this.showControls = false; MG.Audio.select(); } return; }
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
      MG.Sync.sendInput(this.input, 0, {});
      this.menu = new MG.MenuList([
        { label: 'Back to the battle', act: () => { this.menu = null; } },
        { label: 'Controls', act: () => { this.showControls = true; } },
        { label: () => MG.onscreenLabel(this), act: () => MG.cycleOnscreen(this) },
        { label: () => 'Blood: ' + (MG.Settings.blood ? 'ON' : 'OFF (confetti)'), act: () => MG.toggleBlood() },
        { label: () => 'Sound: ' + (MG.Audio.muted ? 'OFF' : 'ON'), act: () => MG.Audio.toggleMute() },
        { label: 'Leave Wi-Fi Game', act: () => { MG.Net.leave(); MG.Engine.setScene(new MG.MenuScene()); } },
      ], W / 2, 190, { w: 340, h: 40, gap: 8 });
    }

    me() { return this.snap && this.snap.pl.find((p) => p.id === MG.Net.id); }
    wantsTouch() { return !!this.snap && !this.menu && !this.ended && !this.showControls && (this.snap.st === 'fight' || this.snap.st === 'intro'); }
    touchPlayer() { const me = this.me(); return me ? { canSpecial: !!me.cs, ammo: me.am || 0, grenades: me.gr || 0, pouch: me.pu || null, joeyReady: !!me.jr } : null; }

    draw(ctx) {
      const s = this.snap;
      if (!s) {
        MG.Art.background(ctx, 0, this.t, this.groundY, this.stage.sky);
        UI.outlineText(ctx, 'Waiting for the host...', W / 2, H / 2, 30, '#ffffff', 'center');
        if (this.ended) { UI.text(ctx, this.ended, W / 2, H / 2 + 40, 16, '#ff4d6d', 'center'); this.menu.draw(ctx); }
        return;
      }
      const ahead = Math.min(0.1, (performance.now() - this.snapAt) / 1000);
      const proj = this.proj.map((p) => ({ draw: (c) => { const x = p.x, y = p.y; p.x += p.vx * ahead; p.y += p.vy * ahead; p.draw(c); p.x = x; p.y = y; } }));
      MG.drawDuelStage(ctx, {
        stage: this.stage, t: this.t, fx: this.fx, groundY: this.groundY, platforms: this.platforms,
        pickups: this.pickups, players: Object.values(this.players), grenades: this.nades, projectiles: proj, world: this,
      });
      const me = this.me();
      const strips = [];
      if (this.showStrip && me && (s.st === 'fight' || s.st === 'intro') && !this.menu && !MG.Touch.enabled) {
        strips.push({
          fighter: { move: me.mk ? { kind: me.mk } : null, state: me.st, onGround: !!me.og, canSpecial: !!me.cs, ammo: me.am || 0, grenades: me.gr || 0, firing: !!me.fi,
            pouch: me.pu || null, joeyReady: !!me.jr, joeyOut: Array.isArray(me.jy) && !!me.jy[2], joeyLevel: Array.isArray(me.jy) ? me.jy[3] : 0, joeyCool: me.jc || 0 },
          opts: { tag: `YOU (${me.tag})`, tagColor: me.tc },
        });
      }
      MG.DuelHUD.draw(ctx, {
        t: this.t, timer: s.timer, net: MG.Net.hudInfo(), strips,
        sides: s.pl.map((p) => ({
          tag: p.tag, color: p.tc, name: MG.charById(p.cid).name, hp: p.hp, mhp: p.mhp, ghost: p.gh === undefined ? 0 : p.gh,
          meter: p.me || 0, canSpecial: !!p.cs, ammo: p.am || 0, grenades: p.gr || 0, wins: p.wins || 0, ko: p.st === 'ko',
          joeyReady: !!p.jr, pouch: p.pu || null, weapon: p.wpn || null, armor: p.ar || 0, armorMax: p.arm || 0,
          below: me === p && (strips.length > 0 || MG.Touch.visible()),
        })),
      });
      MG.DuelHUD.banner(ctx, s.bn || null, s.ba);
      if (s.st === 'matchEnd') MG.DuelHUD.matchEnd(ctx, s.ttl || '', s.sub || '', s.stT);
      if (s.st === 'matchEnd' && !this.menu) UI.text(ctx, 'The host chooses what happens next...', W / 2, 300, 18, '#ffffff', 'center');
      if (!me && !this.ended) UI.outlineText(ctx, 'You join at the next round!', W / 2, 330, 24, '#9bf6ff', 'center');
      if (MG.Net.lost && !this.ended) {
        UI.panel(ctx, W / 2 - 230, 230, 460, 64);
        UI.outlineText(ctx, 'Connection lost - rejoining...', W / 2, 254, 22, '#ff4d6d', 'center');
      }
      if (this.showControls) { UI.fade(ctx, 0.55); UI.controlsPanel(ctx); return; }
      if (this.menu) {
        UI.fade(ctx, 0.55);
        if (this.ended) {
          UI.outlineText(ctx, 'GAME OVER', W / 2, 200, 48, '#ffd23f', 'center');
          UI.text(ctx, this.ended, W / 2, 250, 18, '#ffffff', 'center');
        } else {
          UI.outlineText(ctx, 'MENU', W / 2, 130, 44, '#ffd23f', 'center');
          UI.text(ctx, 'The battle keeps going for everyone else!', W / 2, 166, 15, '#dddddd', 'center');
        }
        this.menu.draw(ctx);
      }
    }
  };
})();
