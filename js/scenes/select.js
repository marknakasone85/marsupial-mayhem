// Character select: 12 marsupials + 2 locked "?" tiles, stat bars, build, special, trait and a true fact.
// Modes: 'campaign' (1 player), 'coop' (2 on one keyboard), 'duelCpu' (you vs the CPU), 'duel2' (2 players).
// Then: the CPU's character and difficulty (duelCpu), and a stage (duels).
(function () {
  const UI = MG.UI;
  const I = MG.Input;
  const W = MG.W, H = MG.H;
  const PER_ROW = 7, TILE_W = 122, TILE_H = 112, GAP = 8, TOP = 62;
  const COUNT = MG.CHARACTERS.length + MG.SECRETS.length;

  // Stat bars, scaled to the strongest in each stat.
  MG.STAT_BARS = [
    ['Speed', (c) => c.speed / 400],
    ['Attack speed', (c) => ((c.atk || 1) - 0.6) / 0.8],
    ['Power', (c) => c.power / 1.8],
    ['Health', (c) => c.hp / 150],
  ];

  // Duel stages (single-screen arenas).
  MG.STAGES = [
    { name: 'TOURNAMENT RING', sky: 'day', platforms: [] },
    { name: 'TANK STAND SHOWDOWN', sky: 'day', platforms: [{ x: 120, y: 350, w: 170 }, { x: 670, y: 350, w: 170 }] },
    { name: 'SUNSET MESA', sky: 'sunset', platforms: [{ x: 385, y: 330, w: 190 }] },
  ];

  MG.CPU_NAMES = ['JOEY (easy)', 'CHAMPION (medium)', 'LEGEND (hard)'];

  const P1 = { left: ['KeyA', 'Pad0Left'], right: ['KeyD', 'Pad0Right'], up: ['KeyW', 'Pad0Up'], down: ['KeyS', 'Pad0Down'], ok: ['KeyF', 'Space', 'Pad0A'], back: ['KeyE', 'Pad0B'] };
  const P2 = { left: ['ArrowLeft', 'Pad1Left'], right: ['ArrowRight', 'Pad1Right'], up: ['ArrowUp', 'Pad1Up'], down: ['ArrowDown', 'Pad1Down'], ok: ['Comma', 'Enter', 'Numpad1', 'Pad1A'], back: ['Period', 'Pad1B'] };

  UI.buildChip = function (ctx, build, x, y) {
    const w = build.length * 8 + 14;
    ctx.fillStyle = MG.BUILD_COLORS[build] || '#ffffff';
    ctx.beginPath(); ctx.roundRect(x, y, w, 18, 9); ctx.fill();
    UI.text(ctx, build, x + w / 2, y + 9.5, 11, '#2b193d', 'center');
    return w;
  };

  // Wrap text onto lines of about `chars` characters.
  UI.wrap = function (text, chars) {
    const lines = [];
    for (const word of String(text || '').split(' ')) {
      if (lines.length && (lines[lines.length - 1] + ' ' + word).length <= chars) lines[lines.length - 1] += ' ' + word;
      else lines.push(word);
    }
    return lines;
  };

  // The details of one character: picture, name, build, stats, special, trait and fact.
  UI.characterDetails = function (ctx, def, x, y, w, h, t, opts = {}) {
    UI.panel(ctx, x, y, w, h);
    const narrow = w < 600;
    const pic = { x: x + (narrow ? 70 : 110), y: y + h - 20 };
    MG.Art.shadow(ctx, pic.x, pic.y, 34);
    MG.Art.character(ctx, def, { x: pic.x, y: pic.y, facing: 1, scale: def.scale * (narrow ? 1.0 : 1.25), t, pose: opts.ready ? 'win' : 'idle', colors: opts.colors });
    const tx = x + (narrow ? 140 : 220);
    if (opts.tag) UI.outlineText(ctx, opts.tag, x + 14, y + 18, 16, opts.tagColor, 'left');
    UI.outlineText(ctx, def.name, tx, y + 22, narrow ? 22 : 26, '#ffffff', 'left');
    ctx.font = `bold ${narrow ? 22 : 26}px ${UI.FONT}`;
    const nw = ctx.measureText(def.name).width;
    UI.buildChip(ctx, def.build, tx + nw + 12, y + 13);
    UI.text(ctx, def.species, tx, y + 46, 13, '#cccccc');
    UI.text(ctx, 'SPECIAL: ' + def.specialName, tx, y + 66, 14, '#00f5d4');
    const lines = UI.wrap(def.trait, narrow ? 38 : 52);
    lines.slice(0, 2).forEach((ln, i) => UI.text(ctx, ln, tx, y + 86 + i * 17, 13, '#9bf6ff'));
    if (!narrow) {
      UI.wrap('Fact: ' + def.fact, 52).slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, tx, y + 130 + i * 17, 13, '#ffd23f'));
      MG.STAT_BARS.forEach(([label, f], i) => {
        const sy = y + 22 + i * 40;
        UI.text(ctx, label, x + w - 210, sy, 13, '#ffd23f');
        UI.bar(ctx, x + w - 210, sy + 10, 190, 10, Math.max(0.06, Math.min(1, f(def))), MG.BUILD_COLORS[def.build]);
      });
    } else {
      MG.STAT_BARS.forEach(([label, f], i) => {
        const sy = y + 128 + i * 15;
        UI.text(ctx, label, tx, sy, 11, '#ffd23f');
        UI.bar(ctx, tx + 82, sy - 4, w - (tx - x) - 96, 7, Math.max(0.06, Math.min(1, f(def))), MG.BUILD_COLORS[def.build]);
      });
    }
  };

  MG.SelectScene = class {
    constructor(opts = {}) {
      this.mode = opts.mode || 'campaign';
      this.t = 0;
      this.phase = 'char';         // char | cpuChar | level | stage
      const last = MG.Save.get('lastPicks', [0, 8]);
      this.cur = [last[0] % MG.CHARACTERS.length, last[1] % MG.CHARACTERS.length];
      this.locked = [false, false];
      this.menu = null;
      this.cpuLevel = MG.Save.get('cpuLevel', 1);
      this.hint = null;
    }

    get twoPickers() { return this.mode === 'coop' || this.mode === 'duel2'; }
    get duel() { return this.mode === 'duelCpu' || this.mode === 'duel2'; }

    enter() { MG.Audio.playMusic('title'); }

    tileRect(i) {
      const row = Math.floor(i / PER_ROW);
      const startX = (W - (PER_ROW * TILE_W + (PER_ROW - 1) * GAP)) / 2;
      return { x: startX + (i % PER_ROW) * (TILE_W + GAP), y: TOP + row * (TILE_H + GAP), w: TILE_W, h: TILE_H };
    }
    // the 2 secret tiles: locked "?" until found, then playable like the rest
    isSecret(i) { return i >= MG.CHARACTERS.length && !MG.Unlocks.has(MG.SECRETS[i - MG.CHARACTERS.length].id); }
    defAt(i) { return i < MG.CHARACTERS.length ? MG.CHARACTERS[i] : MG.SECRETS[i - MG.CHARACTERS.length]; }

    move(p, d, vertical) {
      const n = COUNT;
      let c = this.cur[p];
      if (vertical) { const t = c + d * PER_ROW; if (t >= 0 && t < n) c = t; }
      else c = (c + d + n) % n;
      this.cur[p] = c;
      this.hint = null;
      MG.Audio.select();
    }

    tryLock(p) {
      if (this.isSecret(this.cur[p])) {
        this.hint = MG.SECRETS[this.cur[p] - MG.CHARACTERS.length].hint + ' (locked for now)';
        MG.Audio.emptyClick();
        return false;
      }
      this.locked[p] = true;
      MG.Audio.confirm();
      return true;
    }

    clickedTile() {
      const p = I.pointer;
      if (!p.pressed) return -1;
      for (let i = 0; i < COUNT; i++) {
        const r = this.tileRect(i);
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
      }
      return -1;
    }

    goBack() {
      if (this.phase === 'char') { MG.Engine.setScene(this.duel ? new MG.DuelMenuScene() : new MG.MenuScene()); return; }
      if (this.phase === 'cpuChar') { this.phase = 'char'; this.locked = [false, false]; return; }
      // from a menu: back to choosing characters
      this.menu = null;
      this.phase = this.mode === 'duelCpu' ? 'cpuChar' : 'char';
      this.locked = [this.mode === 'duelCpu', false];
    }

    update(dt) {
      this.t += dt;
      if (UI.backTapped()) { MG.Audio.select(); this.goBack(); return; }
      if (this.menu) {
        if (MG.Menu.back()) { MG.Audio.select(); this.goBack(); return; }
        const item = this.menu.update(dt);
        if (item) item.act();
        return;
      }
      if (this.twoPickers && this.phase === 'char') {
        [P1, P2].forEach((k, p) => {
          if (I.anyHit(k.back) && this.locked[p]) { this.locked[p] = false; MG.Audio.select(); }
          if (this.locked[p]) return;
          if (I.anyHit(k.left)) this.move(p, -1);
          if (I.anyHit(k.right)) this.move(p, 1);
          if (I.anyHit(k.up)) this.move(p, -1, true);
          if (I.anyHit(k.down)) this.move(p, 1, true);
          if (I.anyHit(k.ok)) this.tryLock(p);
        });
        const c = this.clickedTile();
        if (c >= 0) {
          const p = !this.locked[0] ? 0 : !this.locked[1] ? 1 : -1;
          if (p >= 0) { this.cur[p] = c; this.tryLock(p); }
        }
        if (I.anyHit(['Escape', 'Backspace'])) { this.goBack(); return; }
        if (this.locked[0] && this.locked[1]) this.next();
        return;
      }
      // one chooser: player 1 (also picks the CPU's character)
      const p = this.phase === 'cpuChar' ? 1 : 0;
      if (MG.Menu.left()) this.move(p, -1);
      if (MG.Menu.right()) this.move(p, 1);
      if (MG.Menu.up()) this.move(p, -1, true);
      if (MG.Menu.down()) this.move(p, 1, true);
      const c = this.clickedTile();
      if (c >= 0) this.cur[p] = c;
      if (MG.Menu.back()) { MG.Audio.select(); this.goBack(); return; }
      if ((c >= 0 || MG.Menu.confirm()) && this.tryLock(p)) {
        if (this.phase === 'char' && this.mode === 'duelCpu') { this.phase = 'cpuChar'; this.hint = null; return; }
        this.next();
      }
    }

    pickId(p) { return this.defAt(this.cur[p]).id; }

    next() {
      MG.Save.set('lastPicks', this.cur.map((c) => (this.isSecret(c) ? 0 : c)));
      if (this.mode === 'campaign' || this.mode === 'coop') {
        const players = this.mode === 'coop'
          ? [{ id: 0, cid: this.pickId(0), local: 'P1' }, { id: 1, cid: this.pickId(1), local: 'P2' }]
          : [{ id: 0, cid: this.pickId(0), local: 'SOLO' }];
        // the champions set off on the Marsupial World map (story panels play there)
        MG.Engine.setScene(new MG.WorldMapScene({ players }));
        return;
      }
      if (this.mode === 'duelCpu' && this.phase !== 'cpuLevel') {
        this.phase = 'cpuLevel';
        this.menu = new MG.MenuList(MG.CPU_NAMES.map((name, i) => ({
          label: name, act: () => { this.cpuLevel = i; MG.Save.set('cpuLevel', i); this.openStages(); },
        })), W / 2, 200, { w: 380, h: 50, gap: 12 });
        this.menu.sel = this.cpuLevel;
        return;
      }
      this.openStages();
    }

    openStages() {
      this.phase = 'stage';
      this.menu = new MG.MenuList(MG.STAGES.map((st, i) => ({ label: st.name, act: () => this.startDuel(i) }))
        .concat([{ label: 'RANDOM STAGE', act: () => this.startDuel(Math.floor(Math.random() * MG.STAGES.length)) }]),
      W / 2, 170, { w: 400, h: 46, gap: 10 });
    }

    startDuel(stage) {
      const cpu = this.mode === 'duelCpu';
      MG.Engine.setScene(new MG.DuelScene({
        stage,
        players: [
          { id: 0, cid: this.pickId(0), local: cpu ? 'SOLO' : 'P1' },
          { id: 1, cid: this.pickId(1), local: cpu ? null : 'P2', cpu: cpu ? this.cpuLevel : undefined },
        ],
      }));
    }

    draw(ctx) {
      MG.Art.background(ctx, this.t * 30, this.t, MG.GROUND_Y);
      ctx.fillStyle = 'rgba(20,10,30,0.55)';
      ctx.fillRect(0, 0, W, H);
      const title = this.phase === 'cpuChar' ? 'CHOOSE YOUR OPPONENT'
        : this.phase === 'cpuLevel' ? 'HOW TOUGH IS THE CPU?'
        : this.phase === 'stage' ? 'CHOOSE A STAGE'
        : this.phase === 'level' ? 'CHOOSE A MAP'
        : this.twoPickers ? 'CHOOSE YOUR MARSUPIALS' : 'CHOOSE YOUR MARSUPIAL';
      UI.outlineText(ctx, title, W / 2, 32, 30, '#ffd23f', 'center');
      if (this.menu) {
        // the picks so far, then the menu
        this.drawDetails(ctx, true);
        this.menu.draw(ctx);
        UI.text(ctx, 'Arrows + Enter, or click / tap.   Esc = back', W / 2, H - 14, 13, '#9bf6ff', 'center');
        UI.backButton(ctx);
        return;
      }
      for (let i = 0; i < COUNT; i++) this.drawTile(ctx, i);
      this.drawDetails(ctx, false);
      if (this.hint) UI.outlineText(ctx, this.hint, W / 2, 312, 16, '#ff4d6d', 'center');
      const help = this.twoPickers
        ? 'P1: W A S D + F to pick, G to change     P2: arrows + , or Enter, . to change     Esc = back'
        : this.phase === 'cpuChar' ? 'Pick who you\'ll fight: arrows + Enter, or click / tap.   Esc = back'
        : 'Arrows + Enter, or click / tap a marsupial.   Esc = back';
      UI.text(ctx, help, W / 2, H - 12, 13, '#9bf6ff', 'center');
      UI.backButton(ctx);
    }

    drawTile(ctx, i) {
      const r = this.tileRect(i);
      const secret = this.isSecret(i);
      const on = [0, 1].filter((p) => (p === 0 || this.twoPickers || this.phase === 'cpuChar') && this.cur[p] === i);
      ctx.fillStyle = 'rgba(43,25,61,0.88)';
      ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill();
      if (secret) {
        UI.outlineText(ctx, '?', r.x + r.w / 2, r.y + 46, 46, 'rgba(255,255,255,0.45)', 'center');
        UI.text(ctx, 'SECRET', r.x + r.w / 2, r.y + r.h - 14, 12, '#aaaaaa', 'center');
      } else {
        const def = this.defAt(i);
        ctx.fillStyle = MG.BUILD_COLORS[def.build];
        ctx.fillRect(r.x + 10, r.y + 4, r.w - 20, 4);
        ctx.save();
        ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.clip();
        MG.Art.character(ctx, def, { x: r.x + r.w / 2 - 4, y: r.y + r.h - 24, facing: 1, scale: def.scale * 0.62, t: this.t + i, pose: 'idle' });
        ctx.restore();
        UI.text(ctx, def.name, r.x + r.w / 2, r.y + r.h - 12, 12, '#ffffff', 'center');
      }
      on.forEach((p, k) => {
        const color = this.phase === 'cpuChar' && p === 1 ? '#ff4d6d' : MG.PLAYER_COLORS[p];
        ctx.strokeStyle = color;
        ctx.lineWidth = this.locked[p] ? 5 : 3;
        ctx.beginPath(); ctx.roundRect(r.x - 2 - k * 4, r.y - 2 - k * 4, r.w + 4 + k * 8, r.h + 4 + k * 8, 14); ctx.stroke();
        const tag = this.phase === 'cpuChar' && p === 1 ? 'CPU' : `P${p + 1}`;
        UI.outlineText(ctx, tag + (this.locked[p] ? ' ✓' : ''), p === 0 ? r.x + 18 : r.x + r.w - 18, r.y + 18, 13, color, 'center');
      });
    }

    drawDetails(ctx, compact) {
      const y = compact ? 330 : 318, h = compact ? 170 : 190;
      const showTwo = this.twoPickers || this.mode === 'duelCpu' && (this.phase !== 'char');
      const pick = (p) => (this.isSecret(this.cur[p]) ? null : this.defAt(this.cur[p]));
      if (!showTwo) {
        const def = pick(0);
        if (def) UI.characterDetails(ctx, def, 40, y, W - 80, h, this.t, { ready: this.locked[0] });
        else {
          UI.panel(ctx, 40, y, W - 80, h);
          const s = MG.SECRETS[this.cur[0] - MG.CHARACTERS.length];
          UI.outlineText(ctx, '???', W / 2, y + 60, 40, '#aaaaaa', 'center');
          UI.text(ctx, s.hint, W / 2, y + 110, 16, '#cccccc', 'center');
        }
        return;
      }
      [0, 1].forEach((p) => {
        const def = pick(p);
        const x = p === 0 ? 30 : W / 2 + 10;
        if (!def) { UI.panel(ctx, x, y, W / 2 - 40, h); UI.outlineText(ctx, '???', x + (W / 2 - 40) / 2, y + h / 2, 36, '#aaaaaa', 'center'); return; }
        const cpu = this.mode === 'duelCpu' && p === 1;
        UI.characterDetails(ctx, def, x, y, W / 2 - 40, h, this.t + p, {
          ready: this.locked[p], tag: cpu ? 'CPU' : `P${p + 1}`, tagColor: cpu ? '#ff4d6d' : MG.PLAYER_COLORS[p],
          colors: p === 1 && this.cur[0] === this.cur[1] ? MG.coatFor(def, 1) : null,
        });
      });
    }
  };

  // ---------------------------------------------------------------- Tournament Duel menu
  MG.DuelMenuScene = class {
    constructor() {
      this.t = 0;
      this.menu = new MG.MenuList([
        { label: 'VS CPU', act: () => MG.Engine.setScene(new MG.SelectScene({ mode: 'duelCpu' })) },
        { label: '2 PLAYERS (one keyboard)', act: () => MG.Engine.setScene(new MG.SelectScene({ mode: 'duel2' })) },
        { label: 'BACK', act: () => MG.Engine.setScene(new MG.MenuScene()) },
      ], W / 2, 220, { w: 380, h: 50, gap: 12 });
    }
    enter() { MG.Audio.playMusic('title'); }
    update(dt) {
      this.t += dt;
      if (MG.Menu.back() || UI.backTapped()) { MG.Engine.setScene(new MG.MenuScene()); return; }
      const item = this.menu.update(dt);
      if (item) item.act();
    }
    draw(ctx) {
      MG.Art.background(ctx, this.t * 30, this.t, MG.GROUND_Y);
      ctx.fillStyle = 'rgba(20,10,30,0.5)';
      ctx.fillRect(0, 0, W, H);
      UI.outlineText(ctx, 'TOURNAMENT DUEL', W / 2, 90, 50, '#ffd23f', 'center');
      UI.text(ctx, 'The fight for marsupial supremacy! First to win 2 rounds.', W / 2, 140, 17, '#ffffff', 'center');
      this.menu.draw(ctx);
      UI.text(ctx, 'Fair fights: everyone starts equal. Grab the pickups that drop onto the stage!', W / 2, H - 40, 14, '#9bf6ff', 'center');
      UI.text(ctx, 'Wi-Fi battles for 2-4 players: WI-FI on the title screen.', W / 2, H - 20, 13, '#cccccc', 'center');
      UI.backButton(ctx);
    }
  };
})();
