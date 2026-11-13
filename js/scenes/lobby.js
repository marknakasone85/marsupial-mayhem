// Home Wi-Fi: the WI-FI menu (host or join), the host's lobby (co-op or battle) and the join screen.
// Same design as Sloth Slap's lobby. The relay is tools/share_server.py (port 8020).
(function () {
  const UI = MG.UI;
  const I = MG.Input;
  const W = MG.W, H = MG.H;
  const MAX_PLAYERS = 4;
  // only the computer running share-on-network.command can host (the server checks this too)
  const isThisComputer = () => {
    const h = String(location.hostname || '').toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.localhost');
  };

  function bg(ctx, t) {
    MG.Art.background(ctx, t * 25, t, MG.GROUND_Y);
    ctx.fillStyle = 'rgba(20,10,30,0.5)';
    ctx.fillRect(0, 0, W, H);
  }

  // A player card: the character in that player's coat, their tag and status.
  function card(ctx, x, y, p, slotN, label, t, color) {
    UI.panel(ctx, x - 92, y - 168, 184, 216);
    UI.outlineText(ctx, p && p.cpu !== undefined && p.cpu !== null ? 'CPU' : `P${slotN + 1}`, x, y - 148, 20, color, 'center');
    if (p && p.cid) {
      const def = MG.charById(p.cid);
      MG.Art.character(ctx, def, { x: x + 4, y: y - 10, facing: 1, scale: def.scale * 0.78, t, pose: p.ready ? 'win' : 'idle', colors: MG.coatFor(def, slotN) });
      UI.outlineText(ctx, def.name, x, y + 8, 15, '#ffffff', 'center');
    } else {
      UI.outlineText(ctx, '?', x, y - 70, 60, 'rgba(255,255,255,0.4)', 'center');
    }
    UI.text(ctx, label, x, y + 30, 13, label === 'READY!' || label.startsWith('CPU') ? '#52e07a' : '#cccccc', 'center');
  }

  function infoPanel(ctx, lines) {
    UI.panel(ctx, 100, 170, W - 200, 70 + lines.length * 32);
    lines.forEach((line, i) => UI.text(ctx, line, W / 2, 205 + i * 32, i === 0 ? 22 : 17, i === 0 ? '#ffd23f' : '#ffffff', 'center'));
    UI.text(ctx, 'Press any key or tap to go back', W / 2, 220 + lines.length * 32, 13, '#9bf6ff', 'center');
  }

  // ---------------------------------------------------------------- WI-FI menu
  MG.WifiScene = class {
    constructor() {
      this.t = 0;
      this.info = null;
      this.menu = new MG.MenuList([
        { label: 'HOST CO-OP GAME', act: () => this.tryHost('campaign') },
        { label: 'HOST BATTLE', act: () => this.tryHost('battle') },
        { label: 'JOIN A GAME', act: () => this.tryJoin() },
        { label: 'BACK', act: () => MG.Engine.setScene(new MG.MenuScene()) },
      ], W / 2, 200, { w: 340, h: 46, gap: 12 });
    }
    enter() { MG.Audio.playMusic('title'); }

    tryHost(mode) {
      if (!MG.Net.available() || !isThisComputer()) {
        this.info = [
          'To host a Wi-Fi game:',
          '1. Double-click share-on-network.command in the game folder.',
          '2. On THAT computer, open  http://localhost:8020  in a web browser.',
          '3. Choose WI-FI, then HOST CO-OP GAME or HOST BATTLE.',
        ];
        return;
      }
      MG.Engine.setScene(new MG.LobbyScene({ mode }));
    }

    tryJoin() {
      if (!MG.Net.available()) {
        this.info = [
          'To join a Wi-Fi game:',
          'Open the address shown in the host\'s sharing window',
          '(it starts with  http://  and ends with  :8020 )',
          'then choose WI-FI, then JOIN A GAME.',
        ];
        return;
      }
      MG.Engine.setScene(new MG.JoinScene());
    }

    update(dt) {
      this.t += dt;
      if (this.info) {
        if (I.anyPressed() || UI.backTapped()) { this.info = null; MG.Audio.select(); }
        return;
      }
      if (MG.Menu.back() || UI.backTapped()) { MG.Engine.setScene(new MG.MenuScene()); return; }
      const item = this.menu.update(dt);
      if (item) item.act();
    }

    draw(ctx) {
      bg(ctx, this.t);
      UI.outlineText(ctx, 'WI-FI GAME', W / 2, 80, 54, '#ffd23f', 'center');
      UI.text(ctx, '2 to 4 players on the same home Wi-Fi: computers, phones and tablets', W / 2, 130, 17, '#ffffff', 'center');
      UI.text(ctx, 'CO-OP: play the maps together.    BATTLE: everyone against everyone.', W / 2, 156, 14, '#9bf6ff', 'center');
      if (this.info) { infoPanel(ctx, this.info); UI.backButton(ctx); return; }
      this.menu.draw(ctx);
      UI.text(ctx, 'The host plays on the computer that runs share-on-network.command.', W / 2, H - 40, 14, '#dddddd', 'center');
      UI.text(ctx, 'Only use it on your own home Wi-Fi.', W / 2, H - 20, 13, '#bbbbbb', 'center');
      UI.backButton(ctx);
    }
  };

  // ---------------------------------------------------------------- host lobby
  // opts: { mode: 'campaign' | 'battle' }   new game
  //       { mode, resume: true, players, level | stage }  back from a game (same join code)
  //       { stopped: 'why' }  another window on this computer took over hosting
  MG.LobbyScene = class {
    constructor(opts = {}) {
      this.mode = opts.mode || 'campaign';
      this.t = 0;
      const last = MG.Save.get('lastPicks', [0, 8])[0] % MG.CHARACTERS.length;
      this.players = opts.resume ? opts.players.map((p) => Object.assign({}, p)) : [{ id: 0, cid: MG.CHARACTERS[last].id, ready: true }];
      if (opts.resume) for (const p of this.players) if (p.id !== 0 && (p.cpu === undefined || p.cpu === null)) p.ready = false;
      this.level = Math.max(0, Math.min(MG.LEVELS.length - 1, opts.level || 0));
      this.stage = Math.max(0, Math.min(MG.STAGES.length - 1, opts.stage || 0));
      this.resume = !!opts.resume;
      this.stopped = opts.stopped || null;
      this.error = null;
      this.ready = false;
      this.syncT = 0;
    }

    get battle() { return this.mode === 'battle'; }
    get host() { return this.players.find((p) => p.id === 0); }

    enter() {
      MG.Audio.playMusic('title');
      if (this.stopped) { this.error = this.stopped; return; }
      MG.Net.onMessage = (m, from) => this.onNet(m, from);
      if (this.resume && MG.Net.role === 'host') { this.ready = true; this.broadcast(); return; }
      MG.Net.host().then(() => { this.ready = true; this.broadcast(); })
        .catch((e) => { this.error = e.message; });
    }

    onNet(m, from) {
      if (!m) return;
      if (from === 'server') {
        if (m.t === 'joined' && typeof m.id === 'number') {
          if (this.players.length >= MAX_PLAYERS) this.removeCpu(); // a real player beats a CPU
          if (!this.players.some((p) => p.id === m.id)) this.players.push({ id: m.id, cid: null, ready: false });
          MG.Net.send({ t: 'welcome', inGame: false, mode: this.mode }, m.id, true);
          MG.Audio.confirm();
        } else if (m.t === 'left') {
          this.players = this.players.filter((p) => p.id !== m.id);
        }
        this.broadcast();
        return;
      }
      if (m.t === 'pick' || m.t === 'gear') MG.Gear.note(from, m); // their bought gear comes along
      if (m.t === 'pick') {
        const p = this.players.find((q) => q.id === from && (q.cpu === undefined || q.cpu === null));
        if (p && MG.CHARACTERS.some((c) => c.id === m.cid)) {
          p.cid = m.cid;
          p.ready = !!m.ready;
          if (p.ready) MG.Audio.select();
          this.broadcast();
        }
      }
    }

    addCpu() {
      if (!this.battle || this.players.length >= MAX_PLAYERS) return;
      let id = 10;
      while (this.players.some((p) => p.id === id)) id++;
      this.players.push({ id, cid: MG.U.choice(MG.CHARACTERS).id, ready: true, cpu: 1 });
      MG.Audio.confirm();
      this.broadcast();
    }
    removeCpu() {
      const idx = this.players.map((p) => p.cpu !== undefined && p.cpu !== null).lastIndexOf(true);
      if (idx >= 0) { this.players.splice(idx, 1); MG.Audio.select(); this.broadcast(); }
    }

    // the host changes their own character with up/down
    changeHost(d) {
      const n = MG.CHARACTERS.length;
      const h = this.host;
      const i = MG.CHARACTERS.findIndex((c) => c.id === h.cid);
      h.cid = MG.CHARACTERS[(i + d + n) % n].id;
      MG.Audio.select();
      this.broadcast();
    }

    broadcast() {
      if (!this.ready) return;
      MG.Net.send({
        t: 'lobby', mode: this.mode, level: this.level,
        place: this.battle ? `Stage: ${MG.STAGES[this.stage].name}` : `Map ${this.level + 1}: ${MG.LEVELS[this.level].name}`,
        players: this.players.map((p) => ({ id: p.id, cid: p.cid, ready: p.ready, cpu: p.cpu !== undefined && p.cpu !== null })),
      }, 'all', true);
    }

    start() {
      const ready = this.players.filter((p) => p.ready && p.cid);
      if (this.battle) {
        if (ready.length < 2) { this.warn = 'You need at least 2 fighters. Wait for a friend or press C to add a CPU.'; this.warnT = 4; MG.Audio.hurt(); return; }
        MG.Net.send({ t: 'start', mode: 'battle' }, 'all', true);
        MG.Engine.setScene(new MG.DuelScene({
          net: true, stage: this.stage,
          players: ready.map((p) => ({ id: p.id, cid: p.cid, local: p.id === 0 ? 'SOLO' : null, cpu: p.cpu })),
        }));
        return;
      }
      MG.Net.send({ t: 'start', mode: 'campaign', level: this.level }, 'all', true);
      MG.Engine.setScene(new MG.CampaignScene({
        level: this.level, net: true,
        players: ready.map((p) => ({ id: p.id, cid: p.cid, local: p.id === 0 ? 'SOLO' : null })),
      }));
    }

    change(d) {
      if (this.battle) this.stage = (this.stage + d + MG.STAGES.length) % MG.STAGES.length;
      else if (MG.LEVELS.length > 1) this.level = (this.level + d + MG.LEVELS.length) % MG.LEVELS.length;
      else return;
      MG.Audio.select();
      this.broadcast();
    }

    update(dt) {
      this.t += dt;
      this.warnT = (this.warnT || 0) - dt;
      if (MG.Menu.back() || UI.backTapped()) {
        if (!this.stopped) MG.Net.leave();
        MG.Engine.setScene(new MG.WifiScene());
        return;
      }
      if (this.error || !this.ready) return;
      MG.Net.maintain(dt, () => {
        this.players = this.players.filter((p) => p.id === 0 || (p.cpu !== undefined && p.cpu !== null));
        this.broadcast();
      });
      if (MG.Menu.left()) this.change(-1);
      if (MG.Menu.right()) this.change(1);
      if (MG.Menu.up()) this.changeHost(-1);
      if (MG.Menu.down()) this.changeHost(1);
      if (I.hit('KeyC')) this.addCpu();
      if (I.hit('KeyX')) this.removeCpu();
      const p = I.pointer;
      if (p.pressed) {
        if (Math.abs(p.x - W / 2) < 150 && p.y > 476 && p.y < 520) { MG.Audio.confirm(); this.start(); return; }
        if (p.y > 232 && p.y < 448 && p.x > 58 && p.x < 242) this.changeHost(1); // tap your own card to change
        if (this.battle && p.y > 476 && p.y < 520 && p.x < 200) this.addCpu();
        if (this.battle && p.y > 476 && p.y < 520 && p.x > W - 200) this.removeCpu();
      }
      if (I.anyHit(['Enter', 'NumpadEnter', 'Pad0Start', 'Pad0A'])) { MG.Audio.confirm(); this.start(); return; }
      this.syncT += dt;
      if (this.syncT > 1) { this.syncT = 0; this.broadcast(); }
    }

    draw(ctx) {
      bg(ctx, this.t);
      UI.outlineText(ctx, this.battle ? 'WI-FI BATTLE LOBBY' : 'WI-FI CO-OP LOBBY', W / 2, 40, 34, '#ffd23f', 'center');
      if (this.error) {
        UI.panel(ctx, 110, 160, W - 220, 160);
        UI.outlineText(ctx, this.stopped ? 'This window stopped hosting' : 'Could not start the Wi-Fi game', W / 2, 200, 24, '#ff4d6d', 'center');
        UI.text(ctx, this.error, W / 2, 245, 16, '#ffffff', 'center');
        UI.text(ctx, this.stopped ? 'Only one window can host. Play in the newest one.   Esc = back'
          : 'Is the share-on-network window still open?   Esc = back', W / 2, 285, 14, '#cccccc', 'center');
        UI.backButton(ctx);
        return;
      }
      if (!this.ready) {
        UI.text(ctx, 'Starting...', W / 2, 220, 20, '#ffffff', 'center');
        return;
      }
      UI.panel(ctx, W / 2 - 340, 64, 680, 96);
      UI.outlineText(ctx, `JOIN CODE:  ${MG.Net.code}`, W / 2, 92, 32, '#00f5d4', 'center');
      UI.text(ctx, `On phones, tablets and other computers open:  ${String(MG.Net.address || '').replace(/^https?:\/\//, '')}`, W / 2, 124, 16, '#ffffff', 'center');
      UI.text(ctx, 'then press WI-FI, JOIN A GAME and type the code.', W / 2, 146, 14, '#cccccc', 'center');
      for (let i = 0; i < MAX_PLAYERS; i++) {
        const x = 150 + i * 220;
        // co-op: cards by player number; battle: in the order players and CPUs joined
        const p = this.battle ? this.players[i] || null : this.players.find((q) => q.id === i) || null;
        const cpu = p && p.cpu !== undefined && p.cpu !== null;
        const label = !p ? (this.battle ? 'waiting... (C = add CPU)' : 'waiting for a player...')
          : p.id === 0 ? 'READY!  (↑/↓ change)' : cpu ? 'CPU fighter' : p.ready ? 'READY!' : 'choosing...';
        card(ctx, x, 400, p, this.battle ? i : (p ? p.id : i), label, this.t + i, cpu ? '#ff4d6d' : MG.PLAYER_COLORS[i % 4]);
        if (p && p.id === 0) UI.text(ctx, 'you (host)', x, 446, 12, '#ffd23f', 'center');
      }
      const place = this.battle ? `STAGE: ${MG.STAGES[this.stage].name}   (←/→ to change)` : `MAP ${this.level + 1}: ${MG.LEVELS[this.level].name}` + (MG.LEVELS.length > 1 ? '   (←/→ to change)' : '');
      UI.text(ctx, place, W / 2, 462, 15, '#ffffff', 'center');
      const waiting = this.players.some((p) => p.id !== 0 && (p.cpu === undefined || p.cpu === null) && !p.ready);
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.roundRect(W / 2 - 150, 478, 300, 40, 12); ctx.fill();
      UI.text(ctx, waiting ? 'START (others can join later)' : 'START!', W / 2, 498, waiting ? 15 : 20, '#2b193d', 'center');
      if (this.battle) {
        for (const [bx, txt] of [[40, '+ CPU  (C)'], [W - 200, '- CPU  (X)']]) {
          ctx.fillStyle = 'rgba(43,25,61,0.9)';
          ctx.beginPath(); ctx.roundRect(bx, 478, 160, 40, 12); ctx.fill();
          UI.text(ctx, txt, bx + 80, 498, 15, '#ffffff', 'center');
        }
      }
      if (this.warnT > 0) UI.outlineText(ctx, this.warn, W / 2, 180, 15, '#ff4d6d', 'center');
      UI.text(ctx, 'Enter = start    ↑/↓ = your character    Esc = cancel', W / 2, H - 10, 12, '#9bf6ff', 'center');
    }
  };

  // ---------------------------------------------------------------- join (friends' devices)
  // opts.rejoin: already connected (the host went back to the lobby): just get ready again
  MG.JoinScene = class {
    constructor(opts = {}) {
      this.t = 0;
      this.phase = opts.rejoin && MG.Net.active ? 'pick' : 'code'; // code | connecting | pick
      this.code = '';
      this.error = null;
      const last = MG.Save.get('lastPicks', [0, 8])[0];
      this.cur = MG.Net.myCid ? Math.max(0, MG.CHARACTERS.findIndex((c) => c.id === MG.Net.myCid)) : last % MG.CHARACTERS.length;
      this.lobby = null;
      this.inGame = false;
      this.mode = null;
      this.isReady = false;
      // on-screen number pad for phones
      this.keys = [];
      for (let i = 0; i < 12; i++) {
        const label = i < 9 ? String(i + 1) : ['⌫', '0', 'OK'][i - 9];
        this.keys.push({ label, x: W / 2 - 105 + (i % 3) * 72, y: 232 + Math.floor(i / 3) * 60, w: 66, h: 52 });
      }
    }

    enter() {
      MG.Audio.playMusic('title');
      MG.Net.onMessage = (m, from) => this.onNet(m, from);
      if (this.phase === 'pick') this.sendPick(false);
    }

    onNet(m) {
      if (!m) return;
      if (m.t === 'hostLeft') {
        if (m.rehost && this.phase === 'pick') { MG.Net.status = 'closed'; return; } // host reconnecting: rejoin
        this.fail(m.reason || 'The host closed the game.');
        return;
      }
      if (m.t === 'welcome') { this.inGame = !!m.inGame; this.mode = m.mode || this.mode; this.phase = 'pick'; this.sendPick(false); }
      else if (m.t === 'lobby') { this.lobby = m; this.mode = m.mode; }
      else if (m.t === 'start') this.toGame(m.mode, m.level);
      else if (m.t === 'shop' && this.phase === 'pick' && this.isReady) { const shop = new MG.ShopScene({ guest: true }); MG.Engine.setScene(shop); shop.onNet(m); }
      else if (m.t === 'snap' && Array.isArray(m.pl) && m.pl.some((p) => p.id === MG.Net.id)) this.toGame(m.k === 'duel' ? 'battle' : 'campaign', m.lv, m);
    }

    toGame(mode, level, firstSnap) {
      const scene = mode === 'battle' ? new MG.RemoteDuelScene() : new MG.RemoteScene({ level: level || 0 });
      MG.Engine.setScene(scene);
      if (firstSnap) scene.onNet(firstSnap);
    }

    fail(msg) {
      MG.Net.leave();
      this.error = msg;
      this.phase = 'code';
      this.code = '';
    }

    sendPick(ready) {
      this.isReady = ready;
      MG.Net.myCid = MG.CHARACTERS[this.cur].id; // remembered for automatic rejoins
      MG.Net.send(Object.assign({ t: 'pick', cid: MG.Net.myCid, ready }, MG.Gear.mine()), 'host', true);
    }

    tryJoin() {
      if (this.code.length !== 4) return;
      this.phase = 'connecting';
      this.error = null;
      MG.Net.join(this.code).then(() => { /* wait for the host's welcome */ })
        .catch((e) => { this.phase = 'code'; this.error = e.message; this.code = ''; });
    }

    typeDigit(d) { if (this.code.length < 4) { this.code += d; MG.Audio.select(); } }

    update(dt) {
      this.t += dt;
      const typingBack = this.phase === 'code' && I.hit('Backspace') && this.code;
      if (UI.backTapped() || (MG.Menu.back() && !typingBack)) {
        MG.Net.leave();
        MG.Engine.setScene(new MG.WifiScene());
        return;
      }
      if (this.phase === 'code') {
        for (let d = 0; d <= 9; d++) if (I.hit('Digit' + d) || I.hit('Numpad' + d)) this.typeDigit(String(d));
        if (I.hit('Backspace')) this.code = this.code.slice(0, -1);
        const p = I.pointer;
        if (p.pressed) {
          for (const k of this.keys) {
            if (p.x < k.x || p.x > k.x + k.w || p.y < k.y || p.y > k.y + k.h) continue;
            if (k.label === 'OK') this.tryJoin();
            else if (k.label === '⌫') this.code = this.code.slice(0, -1);
            else this.typeDigit(k.label);
          }
        }
        if (I.anyHit(['Enter', 'NumpadEnter'])) this.tryJoin();
      } else if (this.phase === 'pick') {
        const n = MG.CHARACTERS.length;
        const pick = (d) => { this.cur = (this.cur + d + n) % n; MG.Audio.select(); if (this.isReady) this.sendPick(false); };
        if (MG.Menu.left()) pick(-1);
        if (MG.Menu.right()) pick(1);
        if (MG.Menu.confirm()) { MG.Audio.confirm(); this.sendPick(!this.isReady); }
        // taps: the arrows at the sides choose, the button gets ready
        const p = I.pointer;
        if (p.pressed && p.y > 140 && p.y < 380) {
          if (p.x < 70) pick(-1);
          else if (p.x > W - 70) pick(1);
        } else if (p.pressed && p.y >= 400 && p.y <= 448 && Math.abs(p.x - W / 2) < 200) { MG.Audio.confirm(); this.sendPick(!this.isReady); }
        MG.Net.maintain(dt, () => this.sendPick(this.isReady));
        this.lostT = MG.Net.lost ? (this.lostT || 0) + dt : 0;
        if (this.lostT > 90) this.fail('Could not reconnect to the host.');
      }
    }

    draw(ctx) {
      bg(ctx, this.t);
      UI.outlineText(ctx, 'JOIN A WI-FI GAME', W / 2, 44, 36, '#ffd23f', 'center');
      if (this.phase === 'code' || this.phase === 'connecting') {
        UI.text(ctx, 'Type the 4-digit join code shown on the host\'s screen:', W / 2, 108, 17, '#ffffff', 'center');
        for (let i = 0; i < 4; i++) {
          const x = W / 2 - 112 + i * 58;
          UI.panel(ctx, x, 132, 50, 66);
          UI.outlineText(ctx, this.code[i] || '', x + 25, 166, 34, '#00f5d4', 'center');
        }
        for (const k of this.keys) {
          ctx.fillStyle = k.label === 'OK' ? '#ffd23f' : 'rgba(43,25,61,0.88)';
          ctx.beginPath(); ctx.roundRect(k.x, k.y, k.w, k.h, 10); ctx.fill();
          UI.text(ctx, k.label, k.x + k.w / 2, k.y + k.h / 2, 22, k.label === 'OK' ? '#2b193d' : '#ffffff', 'center');
        }
        if (this.phase === 'connecting') UI.text(ctx, 'Connecting...', W / 2, 486, 18, '#9bf6ff', 'center');
        if (this.error) UI.outlineText(ctx, this.error, W / 2, 486, 16, '#ff4d6d', 'center');
        UI.text(ctx, 'Enter = join    Esc = back', W / 2, H - 14, 13, '#dddddd', 'center');
        UI.backButton(ctx);
        return;
      }
      // co-op: player number = your slot; battle: your place among the people in the lobby
      const people = this.lobby ? this.lobby.players.filter((p) => !p.cpu) : [];
      const idx = people.findIndex((p) => p.id === MG.Net.id);
      const me = this.mode === 'battle' && idx >= 0 ? idx : MG.Net.id || 0;
      const what = this.mode === 'battle' ? '  -  BATTLE' : this.mode === 'campaign' ? '  -  CO-OP' : '';
      UI.outlineText(ctx, `You are P${me + 1}${what}`, W / 2, 86, 24, MG.PLAYER_COLORS[me % 4], 'center');
      const def = MG.CHARACTERS[this.cur];
      UI.characterDetails(ctx, def, 80, 110, W - 160, 280, this.t, { ready: this.isReady, colors: MG.coatFor(def, me) });
      UI.outlineText(ctx, '◀', 40, 250, 40, '#ffd23f', 'center');
      UI.outlineText(ctx, '▶', W - 40, 250, 40, '#ffd23f', 'center');
      ctx.fillStyle = this.isReady ? 'rgba(82,224,122,0.25)' : '#ffd23f';
      ctx.beginPath(); ctx.roundRect(W / 2 - 200, 404, 400, 44, 12); ctx.fill();
      UI.text(ctx, this.isReady ? 'READY! Waiting for the host... (tap to change)' : 'I\'m ready!  (Enter or tap)',
        W / 2, 426, 17, this.isReady ? '#52e07a' : '#2b193d', 'center');
      if (this.inGame) UI.text(ctx, this.mode === 'battle' ? 'A battle is on: you\'ll jump in at the next round.' : 'A map is already being played: you\'ll drop in next to your team.', W / 2, 466, 14, '#cccccc', 'center');
      if (this.lobby) UI.text(ctx, `Players: ${this.lobby.players.length}/4     ${this.lobby.place || ''}`, W / 2, 488, 15, '#ffffff', 'center');
      if (MG.Net.lost) UI.outlineText(ctx, 'Connection lost - rejoining by itself...', W / 2, 510, 16, '#ff4d6d', 'center');
      UI.text(ctx, '←/→ (or tap the arrows) choose    Enter = ready    Esc = leave', W / 2, H - 10, 12, '#dddddd', 'center');
      UI.backButton(ctx);
    }
  };
})();
