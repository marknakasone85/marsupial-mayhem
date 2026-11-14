// The level editor's rules (no page needed, so the tests can check them). See tools/editor.html.
// A map is the same plain object as an entry in MG.LEVELS (js/data/levels.js).
(function () {
  const U = MG.U;
  const THEMES = ['outback', 'rainforest', 'canefields', 'coast', 'alps', 'tasmania', 'city', 'rift', 'grinisle', 'lair', 'isleofman', 'topend'];
  const DECOR = ['sign', 'mound', 'tree', 'vines', 'waterfall', 'cane', 'mangrove', 'shed', 'redrock', 'snakeSkin', 'footprints', 'quokkaGoanna',
    'snowgum', 'hut', 'cliff', 'buttongrass', 'building', 'bin', 'streetlight', 'laneway', 'billboard', 'fern', 'volcano', 'riftCrack',
    'souvenirShop', 'selfieBoard', 'lighthouse', 'plushies', 'partyBanner', 'stalagmite', 'crystal', 'throne', 'eggs', 'stonewall', 'cottage', 'sheep',
    'termiteMound', 'pandanus', 'bigMangrove', 'crocSign', 'wharf', 'boatWreck'];
  const NPCS = ['quokka', 'emus', 'cassowary', 'croc', 'treeKangaroo', 'quoll', 'pygmyPossum', 'wallaby', 'sloth'];
  const LOOT = ['grenades', 'heart', 'armor', 'gumnuts', 'gatling', 'none'];
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const lists = ['platforms', 'grass', 'enemies', 'crates', 'pickups', 'gates', 'decor', 'coins', 'npcs', 'water'];

  MG.EditorCore = {
    THEMES, DECOR, NPCS, LOOT,
    pests() { return Object.keys(MG.ENEMY_TYPES).filter((t) => !MG.ENEMY_TYPES[t].boss); },
    bosses() { return Object.keys(MG.ENEMY_TYPES).filter((t) => MG.ENEMY_TYPES[t].boss); },
    pickups() { return ['heart', 'grenades', 'armor', 'gatling', 'gumnuts'].concat(MG.POWER_TYPES, MG.WEAPON_IDS.map((w) => 'w:' + w)); },

    // A fresh empty map to start from.
    blank(id) {
      return {
        id: id || 'custom-' + Math.floor(Math.random() * 1e6), world: 'MY WORLD', name: 'NEW MAP', theme: 'outback', music: 'outback',
        tip: 'Made with the level editor!', length: 4000,
        platforms: [], grass: [], enemies: [], crates: [], pickups: [], gates: [], decor: [], coins: [], npcs: [],
      };
    },
    copy(L) {
      const c = JSON.parse(JSON.stringify(L, (k, v) => (k === '_water' ? undefined : v)));
      for (const k of lists) if (!Array.isArray(c[k]) && k !== 'water') c[k] = c[k] || [];
      return c;
    },

    // Adds something at world position (x, y). tool: 'platform' | 'pest' | 'crate' | 'coin' | 'decor' |
    // 'npc' | 'gate' | 'water' | 'pickup' | 'grass' | 'boss'; o: { type, w, v, loot, y } as the tool needs.
    place(L, tool, x, y, o = {}) {
      x = Math.round(x); y = Math.round(y);
      const G = MG.GROUND_Y;
      if (tool === 'platform') { const w = Math.max(60, Math.round(o.w || 170)); const p = { x: Math.round(x - w / 2), y: U.clamp(y, 200, G - 60), w }; L.platforms.push(p); return p; }
      if (tool === 'pest') { const e = { type: o.type || 'rabbit', x }; if (e.type === 'laceMonitor' && y < G - 60) e.y = y; L.enemies.push(e); return e; }
      if (tool === 'crate') { const c = { x, loot: o.loot || 'grenades' }; if (o.label) c.label = o.label; L.crates.push(c); return c; }
      if (tool === 'coin') { const c = { x, y: U.clamp(y, 120, G - 20) }; if (o.v === 5) c.v = 5; L.coins.push(c); return c; }
      if (tool === 'decor') { const d = { type: o.type || 'sign', x }; if (d.type === 'sign') d.text = o.text || 'THIS WAY  →'; L.decor.push(d); return d; }
      if (tool === 'npc') { const n = { kind: o.type || 'quokka', x }; if (n.kind === 'treeKangaroo' || n.kind === 'sloth') n.y = U.clamp(y, 200, G); L.npcs.push(n); return n; }
      if (tool === 'gate') { const g = { x }; L.gates.push(g); L.gates.sort((a, b) => a.x - b.x); return g; }
      if (tool === 'water') { L.water = L.water || []; const z = { x: Math.round(x - (o.w || 400) / 2), w: Math.round(o.w || 400), depth: 100 }; L.water.push(z); delete L._water; return z; }
      if (tool === 'grass') { const g = { x: Math.round(x - (o.w || 240) / 2), w: Math.round(o.w || 240) }; L.grass.push(g); return g; }
      if (tool === 'pickup') { const p = { type: o.type || 'heart', x }; if (y < G - 30) p.y = U.clamp(y, 200, G); L.pickups.push(p); return p; }
      if (tool === 'boss') { L.boss = { type: o.type || 'bigBuck', x }; L.length = Math.max(L.length, x + 600); return L.boss; }
      return null;
    },

    // The thing nearest to (x, y), as { list, item } (list null for the boss), or null.
    pick(L, x, y) {
      let best = null, bd = 40;
      const consider = (list, item, ix, iy) => { const d = Math.hypot(ix - x, (iy === undefined ? MG.GROUND_Y - 20 : iy) - y); if (d < bd) { bd = d; best = { list, item }; } };
      for (const p of L.platforms) if (x >= p.x - 10 && x <= p.x + p.w + 10 && Math.abs(y - p.y) < 24) { bd = 0; best = { list: 'platforms', item: p }; }
      for (const z of L.water || []) if (x >= z.x && x <= z.x + z.w && y > MG.GROUND_Y - z.depth - 10 && bd > 20) best = { list: 'water', item: z };
      for (const g of L.grass) if (x >= g.x && x <= g.x + g.w && y > MG.GROUND_Y - 40 && bd > 30) best = { list: 'grass', item: g };
      for (const e of L.enemies) consider('enemies', e, e.x, e.y === undefined ? MG.GROUND_Y - 20 : e.y);
      for (const c of L.crates) consider('crates', c, c.x, MG.GROUND_Y - 23);
      for (const c of L.coins) consider('coins', c, c.x, c.y);
      for (const p of L.pickups) consider('pickups', p, p.x, (p.y === undefined ? MG.GROUND_Y : p.y) - 20);
      for (const n of L.npcs) consider('npcs', n, n.x, (n.y === undefined ? MG.GROUND_Y : n.y) - 30);
      for (const g of L.gates) consider('gates', g, g.x, MG.GROUND_Y - 80);
      for (const d of L.decor) consider('decor', d, d.x, MG.GROUND_Y - 40);
      if (L.boss) consider(null, L.boss, L.boss.x, MG.GROUND_Y - 60);
      return best;
    },
    move(L, sel, dx, dy) {
      const it = sel.item;
      it.x = Math.round(it.x + dx);
      if (it.y !== undefined && (sel.list === 'platforms' || sel.list === 'coins' || sel.list === 'pickups' || sel.list === 'npcs' || sel.list === 'enemies')) it.y = Math.round(U.clamp(it.y + dy, 150, MG.GROUND_Y));
      if (sel.list === 'gates') L.gates.sort((a, b) => a.x - b.x);
      if (sel.list === 'water') delete L._water;
    },
    remove(L, sel) {
      if (!sel) return;
      if (sel.list === null) { delete L.boss; return; }
      const list = L[sel.list];
      const i = list ? list.indexOf(sel.item) : -1;
      if (i >= 0) list.splice(i, 1);
      if (sel.list === 'water') { delete L._water; if (!L.water.length) delete L.water; }
    },

    // Problems that would make the map unfair or broken.
    check(L) {
      const out = [];
      const water = (x) => (L.water || []).some((z) => x > z.x && x < z.x + z.w);
      if (!L.id || !/^[a-z0-9-]+$/.test(L.id)) out.push('The id should be lowercase letters, numbers and dashes.');
      if (MG.LEVELS.some((M) => M.id === L.id && M !== L)) out.push('Another map already uses the id "' + L.id + '".');
      if (!THEMES.includes(L.theme)) out.push('Unknown theme: ' + L.theme);
      if (!MG.Audio.SONGS[L.music]) out.push('Unknown music: ' + L.music);
      if (L.boss && L.length < L.boss.x + 580) out.push('Too short for the boss: the length must be at least ' + (L.boss.x + 580) + '.');
      if (L.boss && !has(MG.ENEMY_TYPES, L.boss.type)) out.push('Unknown boss: ' + L.boss.type);
      for (const g of L.gates) { if (water(g.x)) out.push('A gate at x=' + g.x + ' is in the water.'); if (L.boss && g.x > L.boss.x - 400) out.push('A gate at x=' + g.x + ' is inside the boss arena.'); }
      for (const e of L.enemies) if (!has(MG.ENEMY_TYPES, e.type)) out.push('Unknown pest: ' + e.type);
      for (const d of L.decor) if (!DECOR.includes(d.type)) out.push('Unknown decor: ' + d.type);
      for (const n of L.npcs) { if (!NPCS.includes(n.kind)) out.push('Unknown animal: ' + n.kind); if (n.kind === 'croc' && !water(n.x)) out.push('A croc at x=' + n.x + ' is out of the water.'); }
      for (const p of L.platforms) if (L.platforms.some((q) => q !== p && Math.abs(q.y - p.y) < 20 && q.x < p.x + p.w && p.x < q.x + q.w)) { out.push('Two platforms overlap near x=' + p.x + '.'); break; }
      const everything = [].concat(L.enemies, L.crates, L.coins, L.npcs, L.decor, L.gates, L.pickups);
      if (everything.some((o) => o.x < 0 || o.x > L.length)) out.push('Something is outside the map (0 to ' + L.length + ').');
      if (!L.enemies.length && !L.boss) out.push('No pests yet!');
      return out;
    },

    // The map as text to paste into MG.LEVELS (a plain object; JSON is valid JavaScript).
    serialize(L) {
      const c = this.copy(L);
      if (Array.isArray(c.water) && !c.water.length) delete c.water; // every other list stays (the game expects them)
      const lines = JSON.stringify(c, null, 2).split('\n').map((ln) => '  ' + ln);
      return lines.join('\n') + ',';
    },
  };
})();
