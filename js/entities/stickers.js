// The sticker book (15 Nov 2026): stickers for things you do, collected in this browser (saved as
// 'stickers'; no server). Earning one shows a pop-up at the top of the screen. Stickers for clearing
// worlds, joey levels, shop upgrades and secrets are also checked from the saves (check()), so players
// who got there before the book existed get theirs too.
// Only the people playing on this computer earn them: never the CPU, CPU champions or Wi-Fi friends'
// fighters on the host (each friend's own device gives them the "Mates" sticker after a map).
(function () {
  // id, name, how to get it; world: cleared every map of that world; hidden: shown as ??? until earned
  // (spoilers). icon: what the sticker shows (drawn by MG.StickerArt).
  const LIST = [
    { id: 'outback', name: 'Outback Champ', how: 'Clear every map in the Outback.', world: 'outback', icon: { theme: 'outback' } },
    { id: 'rainforest', name: 'Rainforest Ranger', how: 'Clear every map in the Rainforest.', world: 'rainforest', icon: { theme: 'rainforest' } },
    { id: 'canefields', name: 'Toad Buster', how: 'Clear every map in the Cane Fields & Coast.', world: 'canefields', icon: { theme: 'canefields' } },
    { id: 'tasmania', name: 'Snow Gum Survivor', how: 'Clear every map in Tasmania & the Alps.', world: 'tasmania', icon: { theme: 'alps' } },
    { id: 'city', name: 'City Slicker', how: 'Clear every map in the City.', world: 'city', icon: { theme: 'city' } },
    { id: 'rift', name: 'Time Traveller', how: 'Clear every map in the Time Rift.', world: 'rift', icon: { theme: 'rift' } },
    { id: 'topend', name: 'Croc Wrangler', how: 'Clear Darwin Harbour, up in the Top End.', world: 'topend', icon: { theme: 'topend' } },
    { id: 'grinisle', name: 'Party Crasher', how: 'Finish the whole adventure.', world: 'grinisle', hidden: true, icon: { theme: 'grinisle' } },
    { id: 'isleofman', name: 'Island Hopper', how: 'Find the secret bonus map, and clear it.', world: 'isleofman', hidden: true, icon: { theme: 'isleofman' } },
    { id: 'practice', name: 'Top Student', how: 'Finish the practice corner on the first map.', icon: { art: 'dummy' } },
    { id: 'combo', name: 'One-Two-Three', how: 'Land a punch, punch, hook combo (Boomer, Chompers, Bins or Dead Fred).', icon: { cid: 'boomer', pose: 'punch' } },
    { id: 'tenhits', name: 'Mayhem Maker', how: 'Land 10 hits in a row without a break.', icon: { art: 'ten' } },
    { id: 'grenade', name: 'Footy Star', how: 'Knock out a pest with a grenade you kicked.', icon: { art: 'grenade' } },
    { id: 'special', name: 'Super Duper', how: 'Use a special (fill the blue bar first).', icon: { art: 'special' } },
    { id: 'joeyrush', name: 'Go Get \'Em, Joey!', how: 'Send your joey out with the JOEY key to hit a pest.', icon: { art: 'joey' } },
    { id: 'pouch', name: 'Saved for Later', how: 'Use something you saved in your pouch.', icon: { art: 'pouch' } },
    { id: 'flawless', name: 'Not a Scratch', how: 'Clear a map without getting knocked out.', icon: { art: 'shield' } },
    { id: 'joey5', name: 'Proud Parent', how: 'Grow a joey to level 5 (each map you clear makes it grow).', icon: { art: 'joey5' } },
    { id: 'shopper', name: 'First Purchase', how: 'Buy something from the platypus\'s shop.', icon: { art: 'coin' } },
    { id: 'maxed', name: 'Fully Loaded', how: 'Upgrade a weapon to level 3.', icon: { art: 'weapon' } },
    { id: 'team6', name: 'Mob of Six', how: 'Clear maps with 6 different marsupials. (A group of kangaroos is called a mob.)', icon: { cids: ['tank', 'zip', 'drowsy'] } },
    { id: 'team12', name: 'The Whole Mob', how: 'Clear maps with all 12 marsupials.', icon: { cids: ['chompers', 'earl', 'bins', 'stripes'] } },
    { id: 'mates', name: 'Mates', how: 'Clear a map with a friend (2 players, or on Wi-Fi).', icon: { cids: ['boomer', 'benny'] } },
    { id: 'duel', name: 'Duel Winner', how: 'Win a Tournament Duel.', icon: { art: 'trophy' } },
    { id: 'legend', name: 'Legend Slayer', how: 'Beat the LEGEND CPU in a Tournament Duel.', icon: { art: 'crown' } },
    { id: 'ghost', name: 'Ghostly Friend', how: 'Unlock a secret marsupial in a strange place.', hidden: true, icon: { cid: 'ghost' } },
    { id: 'cuscus', name: 'Long-Lost Cousin', how: 'Unlock the other secret marsupial.', hidden: true, icon: { cid: 'cuscus' } },
  ];
  const byId = Object.create(null);
  for (const s of LIST) byId[s.id] = s;
  const SHOW_T = 3.2; // seconds a pop-up shows

  const ST = (MG.Stickers = {
    LIST,
    byId,
    toasts: [],           // pop-ups waiting: { ids, t }
    got() { const g = MG.Save.get('stickers', {}); return g && typeof g === 'object' ? g : {}; },
    has(id) { return !!this.got()[id]; },
    count() { const g = this.got(); return LIST.filter((s) => g[s.id]).length; },
    // Is this fighter a person playing on this computer? (no fighter: something this device did, like shopping)
    local(who, world) {
      if (!who) return true;
      if (who.isAlly || who.ai) return false;
      return !world || typeof world.isLocalHuman !== 'function' || world.isLocalHuman(who);
    },
    // Earn a sticker (once). quiet: no pop-up of its own (check() gathers several into one)
    earn(id, who, world, quiet) {
      if (!byId[id] || this.has(id) || !this.local(who, world)) return false;
      const g = this.got();
      g[id] = 1;
      MG.Save.set('stickers', g);
      if (!quiet) { this.toasts.push({ ids: [id], t: 0 }); if (MG.Audio && MG.Audio.pickup) { MG.Audio.pickup(); MG.Audio.tone(1320, 0.18, 'triangle', 0.18, null, 0.16); } }
      return true;
    },
    // Stickers that come from what's saved: worlds cleared, joey level 5, a weapon at level 3, secrets,
    // and how many marsupials have cleared a map. Returns the new ones (one pop-up for all of them).
    check() {
      const fresh = [];
      const add = (id) => { if (this.earn(id, null, null, true)) fresh.push(id); };
      for (const s of LIST) {
        if (!s.world) continue;
        const w = MG.WORLDS.find((x) => x.id === s.world);
        if (w && w.levels.every((lid) => MG.Progress.isCleared(lid))) add(s.id);
      }
      const jl = MG.Save.get('joeyLevels', {}) || {};
      if (Object.keys(jl).some((cid) => (jl[cid] || 0) >= MG.JOEY_MAX_LEVEL)) add('joey5');
      for (const pid of ['p1', 'p2']) {
        const p = MG.Gear.get(pid);
        if (p && p.weapons && Object.keys(p.weapons).some((w) => p.weapons[w] >= MG.MAX_WEAPON_LEVEL)) add('maxed');
      }
      if (MG.Unlocks.has('ghost')) add('ghost');
      if (MG.Unlocks.has('cuscus')) add('cuscus');
      const team = this.team();
      if (team >= 6) add('team6');
      if (team >= MG.CHARACTERS.length) add('team12');
      if (fresh.length) this.toasts.push({ ids: fresh, t: 0 });
      return fresh;
    },
    // How many of the 12 have cleared a map on this computer (saved as 'teamCleared')
    team() { const t = MG.Save.get('teamCleared', {}) || {}; return MG.CHARACTERS.filter((c) => t[c.id]).length; },
    cleared(cid) {
      if (!MG.CHARACTERS.some((c) => c.id === cid)) return;
      const t = MG.Save.get('teamCleared', {}) || {};
      if (!t[cid]) { t[cid] = 1; MG.Save.set('teamCleared', t); }
    },

    // ---- the pop-up, drawn over any screen (MG.Engine calls it after the scene)
    update(dt) {
      const top = this.toasts[0];
      if (!top) return;
      top.t += dt;
      if (top.t > SHOW_T) this.toasts.shift();
    },
    drawToast(ctx) {
      const top = this.toasts[0];
      if (!top) return;
      const W = MG.W, UI = MG.UI;
      const k = Math.min(1, top.t / 0.3, (SHOW_T - top.t) / 0.3); // slides down, then back up
      const y = -70 + 82 * Math.max(0, k);
      const one = top.ids.length === 1 ? byId[top.ids[0]] : null;
      ctx.save();
      UI.panel(ctx, W / 2 - 200, y, 400, 62, 'rgba(43,25,61,0.95)');
      if (MG.StickerArt) MG.StickerArt.draw(ctx, one || byId[top.ids[0]], W / 2 - 160, y + 31, 24, true, top.t);
      UI.text(ctx, one ? 'NEW STICKER!' : top.ids.length + ' NEW STICKERS!', W / 2 - 122, y + 19, 14, '#9ef01a');
      UI.text(ctx, one ? one.name : 'Have a look in the STICKER BOOK', W / 2 - 122, y + 42, one ? 19 : 15, '#ffffff');
      ctx.restore();
    },
  });
})();
