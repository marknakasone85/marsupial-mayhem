// Campaign heads-up display, drawn from a plain "model" (so Wi-Fi guests can draw it too, later).
(function () {
  const UI = MG.UI;
  const W = MG.W, H = MG.H;

  function portrait(ctx, cx, cy, p, t) {
    MG.Art.portrait(ctx, MG.charById(p.cid), cx, cy, 24, t, p.colors, p.ko);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.stroke();
  }

  // p.below: this player's joey and pouch show at the bottom of the screen (key strip or touch buttons),
  // so the panel leaves them out and is shorter
  function playerPanel(ctx, x, y, p, t, coop) {
    const ph = p.below ? 80 : 98;
    UI.panel(ctx, x, y, 262, ph, 'rgba(43,25,61,0.82)');
    portrait(ctx, x + 32, y + 38, p, t);
    UI.text(ctx, p.name, x + 64, y + 15, 15, '#ffffff');
    if (coop) UI.text(ctx, p.tag, x + 236, y + 15, 14, p.color, 'right');
    UI.bar(ctx, x + 64, y + 27, 184, 12, p.hp / p.mhp, '#ff4d6d');
    UI.text(ctx, Math.ceil(Math.max(0, p.hp)) + '', x + 244, y + 33, 10, '#ffffff', 'right');
    // armor: a blue bar that takes the hits before health does
    if (p.armorMax > 0) UI.bar(ctx, x + 64, y + 40, 184, 4, p.armor / p.armorMax, '#4ea8de');
    // coins (each player's own wallet)
    if (p.coins !== undefined && p.coins !== null) {
      const cx = coop ? x + 212 : x + 246;
      UI.text(ctx, String(p.coins), cx, y + 15, 12, '#ffd23f', 'right');
      ctx.font = `bold 12px ${UI.FONT || 'sans-serif'}`;
      MG.Art.coinIcon(ctx, cx - ctx.measureText(String(p.coins)).width - 9, y + 15, 6);
    }
    UI.bar(ctx, x + 64, y + 46, 184, 6, p.meter / MG.SPECIAL_COST, p.canSpecial ? '#00f5d4' : '#4cc9f0');
    // grenades, weapon ammo, power-ups
    let ix = x + 64;
    MG.Art.grenade(ctx, ix + 6, y + 67, { r: 6, pin: true });
    UI.text(ctx, 'x' + p.grenades, ix + 16, y + 67, 13, p.grenades ? '#9ef01a' : '#888888');
    ix += 44;
    if (p.weapon) {
      MG.Art.weaponIcon(ctx, p.weapon, ix + 16, y + 67, 0.62);
      UI.text(ctx, p.ammo > 0 ? String(p.ammo) : '...', ix + 38, y + 67, 13, p.ammo > 0 ? '#ffb703' : '#888888');
      ix += 70;
    }
    for (const [type, left] of p.powers) {
      const c = MG.Art.POWER_COLORS[type];
      const frac = left / MG.POWER_TIME;
      if (frac < 0.2 && Math.floor(t * 6) % 2 === 0) { ix += 26; continue; }
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ix + 10, y + 67, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(ix + 10, y + 67, 7, 0, Math.PI * 2); ctx.fill();
      MG.Art.powerIcon(ctx, type, ix + 10, y + 67, 5);
      ix += 26;
    }
    // the joey (with its cooldown ring and level) and the pouch's saved item
    if (p.joeyLevel && !p.below) {
      const jx = x + 74, jy = y + 87;
      ctx.fillStyle = p.joeyReady ? '#f6b3c4' : 'rgba(246,179,196,0.35)';
      ctx.beginPath(); ctx.arc(jx, jy, 7, 0, Math.PI * 2); ctx.fill();
      if (!p.joeyReady && p.joeyCool > 0) {
        ctx.strokeStyle = '#f6b3c4'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(jx, jy, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.joeyCool)); ctx.stroke();
      }
      UI.text(ctx, `JOEY Lv${p.joeyLevel}`, jx + 14, jy, 11, p.joeyReady ? '#f6b3c4' : '#a98a92');
      UI.text(ctx, 'POUCH', x + 166, jy, 11, '#ffd23f');
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(x + 220, jy, 9, 0, Math.PI * 2); ctx.fill();
      if (p.pouch) UI.pouchItem(ctx, p.pouch, x + 220, jy, 8);
    }
    if (p.canSpecial && Math.floor(t * 3) % 2 === 0) UI.outlineText(ctx, 'SPECIAL READY!', x + 156, y + 4, 11, '#00f5d4', 'center');
    if (p.ko) {
      ctx.fillStyle = 'rgba(20,10,30,0.6)';
      ctx.beginPath(); ctx.roundRect(x, y, 262, ph, 16); ctx.fill();
      UI.outlineText(ctx, p.respawnT > 0 ? 'Back in ' + Math.ceil(p.respawnT) + '...' : 'KNOCKED OUT', x + 131, y + ph / 2, 18, '#ffffff', 'center');
    }
  }

  MG.CampaignHUD = {
    draw(ctx, m) {
      // up to 4 panels: smaller when there are more than 2 players
      const k = m.players.length > 2 ? 0.86 : 1;
      m.players.forEach((p, i) => {
        ctx.save();
        ctx.translate(8 + i * (m.players.length > 2 ? 232 : 272), m.net ? 24 : 10);
        ctx.scale(k, k);
        playerPanel(ctx, 0, 0, p, m.t, m.coop);
        ctx.restore();
      });
      UI.outlineText(ctx, 'SCORE ' + m.score, W - 16, m.net ? 40 : 26, 20, '#ffd23f', 'right');
      if (m.net) UI.netStrip(ctx, m.net);
      if (m.boss) {
        UI.outlineText(ctx, m.boss.name, W / 2 + (m.coop ? 140 : 0), 102, 18, '#ff4d6d', 'center');
        UI.bar(ctx, W / 2 - 170 + (m.coop ? 140 : 0), 114, 340, 14, m.boss.frac, '#ff4d6d');
      } else if (!m.coop) {
        // how far along the map
        const x0 = 330, w = 360, y = 60;
        ctx.fillStyle = 'rgba(43,25,61,0.6)';
        ctx.beginPath(); ctx.roundRect(x0 - 8, y - 8, w + 16, 16, 8); ctx.fill();
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(x0, y - 2, w * MG.U.clamp(m.progress, 0, 1), 4);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x0 + w * MG.U.clamp(m.progress, 0, 1), y, 6, 0, Math.PI * 2); ctx.fill();
        UI.text(ctx, '⚑', x0 + w + 16, y, 16, '#ffffff', 'center');
        UI.text(ctx, m.mapName, x0 + w / 2, y - 20, 13, '#ffffff', 'center');
      }
      if (m.gateLeft) {
        UI.panel(ctx, W / 2 - 240, 140, 480, 34, 'rgba(43,25,61,0.85)');
        UI.text(ctx, 'Clear the pests to open the gate!  (' + m.gateLeft + ' left)', W / 2, 157, 16, '#ffd23f', 'center');
      }
      for (const s of m.strips) UI.keyStrip(ctx, s.fighter, m.t, s.opts);
    },

    overlays(ctx, o) {
      if (o.showControls) {
        UI.fade(ctx, 0.6);
        UI.controlsPanel(ctx);
        return;
      }
      if (o.state === 'play' && o.t < 3) {
        const a = Math.min(1, (3 - o.t) / 0.8);
        ctx.globalAlpha = a;
        UI.outlineText(ctx, o.L.world, W / 2, 210, 26, '#ffd23f', 'center');
        UI.outlineText(ctx, o.L.name, W / 2, 252, 46, '#ffffff', 'center');
        const tip = MG.Touch.enabled && o.L.tipTouch ? o.L.tipTouch : o.L.tip;
        if (tip) UI.outlineText(ctx, UI.fillKeys(tip), W / 2, 298, 17, '#9bf6ff', 'center');
        ctx.globalAlpha = 1;
      } else if (o.state === 'paused') {
        UI.fade(ctx, 0.55);
        UI.outlineText(ctx, 'PAUSED', W / 2, 142, 44, '#ffd23f', 'center');
        if (o.guest) UI.text(ctx, 'The host paused the game.', W / 2, 180, 18, '#ffffff', 'center');
      } else if (o.state === 'dead') {
        UI.fade(ctx, Math.min(0.6, o.stateT * 0.5));
        UI.outlineText(ctx, o.coop ? 'EVERYONE IS KNOCKED OUT!' : 'KNOCKED OUT!', W / 2, 200, 46, '#ff4d6d', 'center');
      } else if (o.state === 'won') {
        UI.fade(ctx, Math.min(0.6, o.stateT * 0.5));
        UI.outlineText(ctx, 'STAGE CLEAR!', W / 2, 150, 54, '#ffd23f', 'center');
        UI.outlineText(ctx, 'Health bonus +' + o.hpBonus + '     Score ' + o.score, W / 2, 206, 22, '#ffffff', 'center');
        if (o.newBest) UI.outlineText(ctx, 'NEW BEST SCORE!', W / 2, 240, 22, '#9ef01a', 'center');
        const grew = (o.joeyGrew || []).slice(0, 2);
        grew.forEach((txt, i) => UI.outlineText(ctx, txt, W / 2, 268 + i * 22, 17, '#f6b3c4', 'center'));
        if (o.coinLine) UI.outlineText(ctx, o.coinLine, W / 2, 268 + grew.length * 22, 17, '#ffd23f', 'center');
      }
    },
  };
})();
