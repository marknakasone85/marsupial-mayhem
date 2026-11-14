// Milestone 8: Settings: changing the keys, difficulty, volume, blood/gore, bigger touch buttons, high contrast.
localStorage.clear(); MG.Keys.reset();
function press(code, n) { key(code, true); frames(1); key(code, false); frames(n === undefined ? 2 : n); }

// ---- changing the keys
check(MG.Keys.label('P1', 'attack') === 'F' && MG.Keys.label('P1', 'grenade') === 'G' && MG.Keys.label('P2', 'attack') === ',', 'default keys: P1 F attack, G grenade; P2 , attack');
MG.Keys.set('P1', 'attack', 'KeyZ');
check(MG.Controls.P1.attack[0] === 'KeyZ' && MG.Controls.SOLO.attack.indexOf('KeyZ') >= 0 && MG.Controls.SOLO.attack.indexOf('KeyF') < 0, 'P1 attack moved to Z (solo play follows)');
check(MG.Controls.P1.attack.indexOf('Pad0X') >= 0 && MG.Controls.P1.attack.indexOf('TouchAttack') >= 0, 'gamepad and touch buttons stay the same');
check(JSON.parse(localStorage.getItem('marsupialmayhem.keys')).P1.attack === 'KeyZ', 'saved in this browser');
MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: 0 })); var sc = scene(); sc.t = 5; frames(3);
press('KeyZ', 1);
check(sc.player.move && sc.player.move.kind === 'jab', 'pressing Z attacks now');
var texts = [], real = MG.UI.text;
MG.UI.text = function (c, str) { texts.push(String(str)); return real.apply(this, arguments); };
MG.UI.keyStrip(MG.Engine.ctx, sc.player, 0, { layout: 'wasd' }); MG.UI.controlsPanel(MG.Engine.ctx);
MG.UI.text = real;
check(texts.indexOf('Z') >= 0 && texts.indexOf('F') < 0, 'the key hints and the Controls page show the new key');
MG.Keys.set('P1', 'attack', 'KeyE');
check(MG.Keys.get('P1', 'attack') === 'KeyE' && MG.Keys.get('P1', 'big') === 'KeyZ', 'taking a key another action uses swaps them');
MG.Keys.set('P2', 'shoot', 'KeyE');
check(MG.Keys.get('P2', 'shoot') === 'KeyE' && MG.Keys.get('P1', 'attack') === 'Semicolon', '...even between the two players');
check(!MG.Keys.set('P1', 'jump', 'Escape') && !MG.Keys.set('P1', 'jump', 'Pad0A'), 'Esc and gamepad buttons can\'t be used');
MG.Keys.reset();
check(MG.Keys.get('P1', 'attack') === 'KeyF' && MG.Controls.P1.attack[0] === 'KeyF' && MG.Controls.SOLO.attack.indexOf('KeyJ') >= 0, 'reset puts every key back');
// the settings page: pick an action and press a key
var st = new MG.SettingsScene(); MG.Engine.setScene(st); frames(2);
st.activate(st.items.findIndex(function (it) { return it.label === 'Change keys: player 2'; }));
check(st.page === 'keys' && st.player === 'P2', 'Settings > Change keys: player 2');
st.keySel = MG.Keys.ACTIONS.indexOf('joey'); press('Enter', 2);
check(st.waiting, 'Enter on an action waits for a key');
press('KeyO', 2);
check(!st.waiting && MG.Keys.get('P2', 'joey') === 'KeyO', '...and the next key pressed becomes its key');
var drawErr = null; try { st.draw(MG.Engine.ctx); st.page = 'main'; st.draw(MG.Engine.ctx); } catch (e) { drawErr = '' + e; }
check(!drawErr, 'the settings pages draw' + (drawErr ? ': ' + drawErr : ''));
MG.Keys.reset();

// ---- difficulty
function pigHp(diff) { MG.setSetting('difficulty', diff); var s = new MG.CampaignScene({ charId: 'boomer', level: 0 }); return s.enemies.find(function (e) { return e.type === 'pig'; }).maxHp; }
var easy = pigHp('easy'), normal = pigHp('normal'), hard = pigHp('hard');
check(easy < normal && normal < hard, 'pests are tougher on HARD, softer on EASY (pig ' + easy + ' / ' + normal + ' / ' + hard + ')');
function bite(diff) {
  MG.setSetting('difficulty', diff);
  var s = new MG.CampaignScene({ charId: 'boomer', level: 0 }); MG.Engine.setScene(s); frames(2);
  var e = s.enemies[0], f = s.player, h0 = f.hp;
  f.takeHit({ dmg: 10, kbx: 0, kby: 0, stun: 0.1, from: e }, s);
  return h0 - f.hp;
}
check(bite('easy') < bite('normal') && bite('normal') < bite('hard'), 'pests hit softer on EASY and harder on HARD');
MG.setSetting('difficulty', 'hard');
MG.Engine.setScene(new MG.DuelScene({ stage: 0, players: [{ id: 0, cid: 'tank', local: 'P1' }, { id: 1, cid: 'zip', local: 'P2' }] }));
var d = scene(), a = d.slots[0].f, b = d.slots[1].f, h0 = b.hp;
b.takeHit({ dmg: 10, kbx: 0, kby: 0, stun: 0.1, from: a }, d);
check(h0 - b.hp === 10, 'duels ignore the difficulty (fair fights)');
MG.setSetting('difficulty', 'normal');

// ---- volume, blood/gore, touch buttons, high contrast
MG.Audio.master = { gain: { value: 0 } }; MG.Audio.musicGain = { gain: { value: 0 } }; MG.Audio.muted = false;
MG.setSetting('effects', 0.5, 'effectsVol'); MG.setSetting('music', 0.2, 'musicVol');
check(Math.abs(MG.Audio.master.gain.value - 0.25) < 1e-6 && Math.abs(0.25 * MG.Audio.musicGain.gain.value - 0.5 * 0.35 * 0.2) < 1e-6, 'music and sound-effects volumes are set separately');
MG.Audio.master = null; MG.Audio.musicGain = null;
var fx = new MG.FX(); fx.gore(0, 0, '#d62828', 10, 400); var normalParts = fx.parts.length;
MG.Settings.gore = true; fx = new MG.FX(); fx.gore(0, 0, '#d62828', 10, 400); var goreParts = fx.parts.length; MG.Settings.gore = false;
check(goreParts > normalParts * 2, 'GORE adds extra cartoon splatter (' + normalParts + ' -> ' + goreParts + ')');
var r0 = MG.Touch.layout()[0].r; MG.Settings.bigTouch = true; var r1 = MG.Touch.layout()[0].r; MG.Settings.bigTouch = false;
check(r1 > r0, 'Touch buttons: BIG makes them bigger');
MG.Settings.contrast = true;
drawErr = null; try { var s3 = new MG.CampaignScene({ charId: 'boomer', level: 0 }); MG.Engine.setScene(s3); frames(3); s3.draw(MG.Engine.ctx); } catch (e) { drawErr = '' + e; }
MG.Settings.contrast = false;
check(!drawErr, 'high contrast draws (solid panels, rings under everyone)' + (drawErr ? ': ' + drawErr : ''));
done('settings');
