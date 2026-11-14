// The level editor page (tools/editor.html). The rules are in editor-core.js; this file is the page:
// drawing the map with the game's own art, the mouse and keys, the side panel, test play and export.
(function () {
  const E = MG.EditorCore;
  const W = MG.W, H = MG.H, G = MG.GROUND_Y;
  const $ = (id) => document.getElementById(id);
  const view = $('view'), vctx = view.getContext('2d');
  const strip = $('strip'), sctx = strip.getContext('2d');
  const DRAFT = 'marsupialmayhem.editorDraft';
  let L = null, idx = 0, camX = 0, sel = null, drag = null, preview = null, t = 0, playing = false;
  const history = [];

  // ---------------- loading a map ----------------
  function open(i) {
    idx = i;
    L = E.copy(MG.LEVELS[i]);
    MG.LEVELS[i] = L;
    camX = 0; sel = null; history.length = 0;
    fillForm(); rebuild();
  }
  function newMap() {
    L = E.blank();
    idx = MG.LEVELS.length;
    MG.LEVELS.push(L);
    camX = 0; sel = null; history.length = 0;
    fillMaps(); fillForm(); rebuild();
  }
  function fillMaps() {
    $('mapSel').innerHTML = MG.LEVELS.map((M, i) => `<option value="${i}">${i + 1}. ${M.name}${M.id.startsWith('custom-') ? ' (new)' : ''}</option>`).join('');
    $('mapSel').value = idx;
  }
  function fillForm() {
    $('fId').value = L.id; $('fWorld').value = L.world || ''; $('fName').value = L.name; $('fTheme').value = L.theme || 'outback';
    $('fMusic').value = L.music || 'outback'; $('fSky').value = L.sky || ''; $('fLength').value = L.length; $('fTip').value = L.tip || '';
  }
  function save() { try { localStorage.setItem(DRAFT, JSON.stringify({ L: E.copy(L), idx, isNew: idx >= MG.LEVELS.length - 1 && L.id.startsWith('custom-') })); } catch (e) { /* storage off */ } }
  function snapshot() { history.push(JSON.stringify(E.copy(L))); if (history.length > 80) history.shift(); }
  function undo() {
    if (!history.length) return;
    const prev = JSON.parse(history.pop());
    Object.keys(L).forEach((k) => delete L[k]);
    Object.assign(L, prev);
    sel = null; fillForm(); rebuild();
  }

  // The game's own campaign scene, built from the map (it's only drawn, never run).
  function rebuild() {
    delete L._water;
    MG.LEVELS[idx] = L;
    try { preview = new MG.CampaignScene({ charId: 'boomer', level: idx }); } catch (e) { preview = null; $('checks').textContent = 'Error: ' + e; return; }
    camX = MG.U.clamp(camX, 0, Math.max(0, L.length - W));
    const problems = E.check(L);
    $('checks').textContent = problems.length ? problems.join('\n') : 'All good!';
    $('checks').className = problems.length ? '' : 'ok';
    save();
  }

  // ---------------- drawing ----------------
  function draw() {
    if (!preview) return;
    const p = preview;
    MG.drawCampaignWorld(vctx, {
      L, t, camX, groundY: G, fx: p.fx, platforms: L.platforms, water: MG.waterZones(L),
      gates: p.gates.map((g) => ({ x: g.x, lift: 0, left: 0 })), crates: p.crates, pickups: p.pickups, enemies: p.enemies,
      players: [], grenades: [], projectiles: [], coins: p.coins, npcs: p.npcs.filter((n) => n.kind !== 'emus'), goalOpen: true, world: p,
    });
    vctx.save();
    vctx.translate(-camX, 0);
    // a ruler, the boss arena, and markers for things you can't see in the picture
    vctx.font = 'bold 11px sans-serif'; vctx.textAlign = 'center';
    for (let x = Math.floor(camX / 100) * 100; x < camX + W + 100; x += 100) {
      vctx.fillStyle = 'rgba(255,255,255,0.5)'; vctx.fillRect(x, H - 10, 1, x % 500 ? 6 : 10);
      if (x % 500 === 0) vctx.fillText(x, x, H - 14);
    }
    if (L.boss) { vctx.strokeStyle = '#ff4d6d'; vctx.setLineDash([8, 6]); vctx.beginPath(); vctx.moveTo(L.boss.x - 380, 60); vctx.lineTo(L.boss.x - 380, G); vctx.stroke(); vctx.setLineDash([]); vctx.fillStyle = '#ff4d6d'; vctx.fillText('BOSS ARENA', L.boss.x - 380, 54); }
    for (const n of L.npcs) {
      if (n.kind === 'emus') { vctx.fillStyle = '#ffd23f'; vctx.fillText('EMU STAMPEDE starts here', n.x, 120); vctx.fillRect(n.x - 1, 125, 2, G - 125); }
      if (n.kind === 'quokka' && n.late !== undefined) { vctx.fillStyle = '#ffd6a5'; vctx.fillText('late quokka', n.x, G - 70); }
    }
    for (const z of L.water || []) { vctx.strokeStyle = '#4cc9f0'; vctx.strokeRect(z.x, G - z.depth, z.w, z.depth); }
    vctx.fillStyle = '#9ef01a'; vctx.fillText('FINISH', L.length - 100, 40);
    if (sel) {
      const b = boxOf(sel);
      vctx.strokeStyle = '#ffffff'; vctx.lineWidth = 2; vctx.setLineDash([5, 4]);
      vctx.strokeRect(b.x, b.y, b.w, b.h); vctx.setLineDash([]);
    }
    vctx.restore();
    vctx.fillStyle = 'rgba(20,10,30,0.7)'; vctx.fillRect(0, 0, 330, 24);
    vctx.fillStyle = '#ffffff'; vctx.textAlign = 'left'; vctx.font = 'bold 13px sans-serif';
    vctx.fillText(`${L.name}   x ${Math.round(camX)}-${Math.round(camX + W)} of ${L.length}`, 8, 16);
    drawStrip();
  }
  function boxOf(s) {
    const it = s.item;
    if (s.list === 'platforms') return { x: it.x, y: it.y - 4, w: it.w, h: 22 };
    if (s.list === 'water') return { x: it.x, y: G - it.depth, w: it.w, h: it.depth };
    if (s.list === 'grass') return { x: it.x, y: G - 50, w: it.w, h: 50 };
    const y = it.y !== undefined && s.list !== 'gates' ? it.y : G;
    const h = s.list === 'gates' ? 160 : s.list === null ? 120 : 60;
    return { x: it.x - 30, y: y - h, w: 60, h };
  }
  function drawStrip() {
    const k = strip.width / L.length;
    sctx.fillStyle = '#2b193d'; sctx.fillRect(0, 0, strip.width, strip.height);
    sctx.fillStyle = 'rgba(255,255,255,0.15)'; sctx.fillRect(camX * k, 0, W * k, strip.height);
    const dot = (x, y, c, r = 2) => { sctx.fillStyle = c; sctx.fillRect(x * k - r / 2, y, r, r); };
    for (const p of L.platforms) { sctx.fillStyle = '#a0683a'; sctx.fillRect(p.x * k, 10, Math.max(2, p.w * k), 3); }
    for (const z of L.water || []) { sctx.fillStyle = '#4cc9f0'; sctx.fillRect(z.x * k, 36, Math.max(2, z.w * k), 6); }
    for (const e of L.enemies) dot(e.x, 24, '#ff4d6d', 3);
    for (const c of L.crates) dot(c.x, 30, '#c68642', 3);
    for (const c of L.coins) dot(c.x, 18, '#ffd23f', 2);
    for (const n of L.npcs) dot(n.x, 4, '#9ef01a', 3);
    for (const g of L.gates) { sctx.fillStyle = '#ffffff'; sctx.fillRect(g.x * k - 1, 0, 2, strip.height); }
    if (L.boss) { sctx.fillStyle = '#ff4d6d'; sctx.fillRect(L.boss.x * k - 3, 2, 6, 40); }
  }

  // ---------------- mouse and keys ----------------
  const tool = () => document.querySelector('input[name=tool]:checked').value;
  function worldPos(ev) {
    const r = view.getBoundingClientRect();
    return { x: camX + (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
  }
  view.addEventListener('mousedown', (ev) => {
    const p = worldPos(ev);
    const tl = tool();
    if (tl === 'select') {
      sel = E.pick(L, p.x, p.y);
      if (sel) { snapshot(); drag = { x: p.x, y: p.y }; }
      return;
    }
    snapshot();
    const kind = $('kind').value;
    const w = +$('width').value || 170;
    sel = { list: { platform: 'platforms', pest: 'enemies', crate: 'crates', coin: 'coins', pickup: 'pickups', decor: 'decor', npc: 'npcs', gate: 'gates', water: 'water', grass: 'grass', boss: null }[tl], item: null };
    sel.item = E.place(L, tl, p.x, p.y, { type: kind, loot: kind, w, v: kind === '5' ? 5 : 1 });
    if (tl === 'boss') $('fLength').value = L.length;
    rebuild();
  });
  window.addEventListener('mousemove', (ev) => {
    if (!drag || !sel) return;
    const p = worldPos(ev);
    E.move(L, sel, p.x - drag.x, p.y - drag.y);
    drag = { x: p.x, y: p.y };
    rebuild();
  });
  window.addEventListener('mouseup', () => { drag = null; });
  view.addEventListener('wheel', (ev) => { ev.preventDefault(); camX = MG.U.clamp(camX + (ev.deltaY + ev.deltaX), 0, Math.max(0, L.length - W)); }, { passive: false });
  strip.addEventListener('mousedown', (ev) => {
    const r = strip.getBoundingClientRect();
    camX = MG.U.clamp((ev.clientX - r.left) / r.width * L.length - W / 2, 0, Math.max(0, L.length - W));
  });
  window.addEventListener('keydown', (ev) => {
    if (playing || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (ev.key === 'ArrowRight') camX = Math.min(Math.max(0, L.length - W), camX + 120);
    else if (ev.key === 'ArrowLeft') camX = Math.max(0, camX - 120);
    else if ((ev.key === 'Delete' || ev.key === 'Backspace') && sel) { snapshot(); E.remove(L, sel); sel = null; rebuild(); ev.preventDefault(); }
    else if (ev.key === 'z' && (ev.ctrlKey || ev.metaKey)) { undo(); ev.preventDefault(); }
  });

  // ---------------- the side panel ----------------
  function fillKinds() {
    const tl = tool();
    const opts = tl === 'pest' ? E.pests() : tl === 'boss' ? E.bosses() : tl === 'crate' ? E.LOOT.concat(MG.WEAPON_IDS.map((w) => 'w:' + w))
      : tl === 'decor' ? E.DECOR : tl === 'npc' ? E.NPCS : tl === 'pickup' ? E.pickups() : tl === 'coin' ? ['1', '5'] : ['-'];
    $('kind').innerHTML = opts.map((o) => `<option>${o}</option>`).join('');
  }
  document.querySelectorAll('input[name=tool]').forEach((r) => r.addEventListener('change', fillKinds));
  $('fTheme').innerHTML = E.THEMES.map((o) => `<option>${o}</option>`).join('');
  $('fMusic').innerHTML = Object.keys(MG.Audio.SONGS).map((o) => `<option>${o}</option>`).join('');
  const field = (id, key, num) => $(id).addEventListener('change', () => { snapshot(); L[key] = num ? Math.max(1500, +$(id).value || 4000) : $(id).value; if (key === 'sky' && !L.sky) delete L.sky; rebuild(); fillMaps(); });
  field('fId', 'id'); field('fWorld', 'world'); field('fName', 'name'); field('fTheme', 'theme'); field('fMusic', 'music'); field('fSky', 'sky'); field('fLength', 'length', true); field('fTip', 'tip');
  $('mapSel').addEventListener('change', () => open(+$('mapSel').value));
  $('newMap').addEventListener('click', newMap);
  $('undo').addEventListener('click', undo);
  $('export').addEventListener('click', () => { $('out').value = E.serialize(L); $('out').select(); });

  // ---------------- test play: the real game, in this page ----------------
  let engineReady = false;
  $('play').addEventListener('click', () => {
    rebuild();
    playing = true;
    $('wrap').style.display = 'none'; $('game').style.display = 'block'; $('back').style.display = 'block';
    if (!engineReady) { MG.Engine.init(); engineReady = true; }
    MG.Engine.resize();
    MG.Engine.setScene(new MG.CampaignScene({ charId: MG.CHARACTERS[0].id, level: idx }));
  });
  $('back').addEventListener('click', () => {
    playing = false;
    MG.Engine.setScene({ update() {}, draw() {} });
    $('wrap').style.display = 'flex'; $('game').style.display = 'none'; $('back').style.display = 'none';
  });

  // ---------------- start ----------------
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch (e) { draft = null; }
  if (draft && draft.L && draft.L.id) {
    const i = MG.LEVELS.findIndex((M) => M.id === draft.L.id);
    if (i >= 0) { idx = i; L = E.copy(draft.L); MG.LEVELS[i] = L; } else { idx = MG.LEVELS.length; L = E.copy(draft.L); MG.LEVELS.push(L); }
    fillMaps(); fillForm(); fillKinds(); rebuild();
  } else { fillMaps(); fillKinds(); open(0); }
  let last = performance.now();
  (function loop(now) {
    t += Math.min(0.05, (now - last) / 1000); last = now;
    if (!playing) draw();
    requestAnimationFrame(loop);
  })(last);
})();
