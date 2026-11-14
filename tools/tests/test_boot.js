// Milestone 0: the game boots to the title screen, the menu works, settings save, Wi-Fi rules.
frames(30);
check(sceneName() === 'Menu', 'starts on the title screen');
check(MG.W === 960 && MG.H === 540, 'the game is 960 x 540');
var m = scene();
check(/Marsupial Mayhem™/.test(readFile('index.html')), 'page title says Marsupial Mayhem™');
check(/© 2026 Mark A\. Nakasone\. All rights reserved\./.test(MG.MenuScene.FOOTER), 'title screen shows the copyright line');
check(!/(src|href)="(https?:)?\/\//.test(readFile('index.html')), 'the page loads nothing from other websites');

// menu: keyboard moves, Enter on CONTROLS opens the controls page, any key closes it
var ci = -1;
m.menu.items.forEach(function (it, i) { if (label(it) === 'CONTROLS') ci = i; });
check(ci >= 0, 'title menu has CONTROLS');
for (var n = 0; n < 10 && m.menu.sel !== ci; n++) tap('ArrowDown');
check(m.menu.sel === ci, 'arrow keys move through the menu');
tap('Enter'); frames(10);
check(m.page === 'controls', 'CONTROLS opens the controls page');
tap('Escape'); frames(2);
check(!m.page, 'a key press closes the controls page');

// PLAY: pick Boomer, walk the Marsupial World map, start the first map; 2 PLAYERS: the same for two
MG.Story.markSeen('opening'); // (the opening story is tested in test_worlds.js)
menuItem(m.menu, 'PLAY').act(); frames(10);
check(sceneName() === 'Select' && scene().mode === 'campaign', 'PLAY opens the character select');
tap('Enter'); frames(10);
check(scene() instanceof MG.WorldMapScene && scene().players[0].cid === 'boomer', '...Enter picks Boomer and opens the Marsupial World map');
tap('Enter'); frames(5);
check(sceneName() === 'Campaign' && scene().slots.length === 1 && scene().player.def.id === 'boomer', '...and Enter there starts the first map');
menuItem(new MG.MenuScene().menu, '2 PLAYERS').act(); frames(10);
tap('KeyD'); tap('KeyF'); tap('ArrowLeft'); tap('Comma'); frames(5);
tap('Enter'); frames(5);
check(sceneName() === 'Campaign' && scene().slots.map(function (s) { return s.local + ':' + s.cid; }).join() === 'P1:stinker,P2:paddles',
  '2 PLAYERS: each player picks (P1 Stinker, P2 Paddles), then the map starts');
menuItem(new MG.MenuScene().menu, 'TOURNAMENT DUEL').act(); frames(2);
check(sceneName() === 'DuelMenu', 'TOURNAMENT DUEL opens the duel menu');
MG.Engine.setScene(m); frames(2);

// settings: blood ON by default and saved, sound on/off saved
check(MG.Settings.blood === true, 'blood is ON by default');
menuItem(m.menu, 'BLOOD: ON').act();
check(MG.Settings.blood === false && !!menuItem(m.menu, 'BLOOD: OFF'), 'BLOOD switches off');
check(localStorage.getItem('marsupialmayhem.blood') === 'false', 'the blood setting is saved in the browser');
menuItem(m.menu, 'BLOOD: OFF').act();
check(MG.Settings.blood === true, 'BLOOD switches back on');
menuItem(m.menu, 'SOUND: ON').act();
check(MG.Audio.muted === true && localStorage.getItem('marsupialmayhem.muted') === 'true', 'SOUND switches off and is saved');
menuItem(m.menu, 'SOUND: OFF').act();
check(MG.Audio.muted === false, 'SOUND switches back on');

// controls: every scheme has every action, and keys reach the "controller state"
['P1', 'P2', 'SOLO'].forEach(function (s) {
  var c = MG.Controls[s];
  check(['left', 'right', 'up', 'down', 'attack', 'big', 'special', 'shoot', 'grenade', 'joey', 'pouch'].every(function (k) { return c[k] && c[k].length; }),
    s + ' controls have every action');
});
key('KeyF', true);
check(MG.readControls(MG.Controls.P1).attackP === true, 'F attacks for player 1');
frames(1); key('KeyF', false); frames(1);
key('KeyJ', true);
check(MG.readControls(MG.Controls.SOLO).attackP === true && !MG.readControls(MG.Controls.P1).attackP, 'J attacks when playing alone only');
frames(1); key('KeyJ', false); frames(1);
var ids = MG.Touch.buttons.map(function (b) { return b.id; }).join(',');
check(ids === 'Left,Right,Down,Attack,Jump,Big,Shoot,Special,Grenade,Joey,Pouch,Pause', 'phone touch buttons: ' + ids);

// saves use the game's own name, so they never mix with Sloth Slap's
MG.Save.set('probe', 7);
check(localStorage.getItem('marsupialmayhem.probe') === '7' && MG.Save.get('probe', 0) === 7, 'saves are kept under marsupialmayhem.');

// Wi-Fi: double-clicked page shows the WI-FI button with sharing instructions
check(!!menuItem(m.menu, 'WI-FI'), 'double-clicked page: WI-FI button is there');
menuItem(m.menu, 'WI-FI').act(); frames(10);
check(sceneName() === 'Wifi', 'WI-FI opens the Wi-Fi menu');
menuItem(scene().menu, 'HOST CO-OP GAME').act(); frames(2);
check(sceneName() === 'Wifi' && /share-on-network\.command/.test(scene().info.join(' ')), 'double-clicked page: HOST explains share-on-network.command');
MG.Engine.setScene(m); frames(2);
// public web pages (GitHub Pages) have no WI-FI button; home addresses do
function wifiAt(host) { location.protocol = 'http:'; location.hostname = host; return MG.Net.available(); }
check(!wifiAt('marknakasone85.github.io') && MG.Net.webOnly(), 'GitHub Pages: Wi-Fi is off');
check(!menuItem(new MG.MenuScene().menu, 'WI-FI'), 'GitHub Pages: no WI-FI button');
check(wifiAt('localhost') && wifiAt('192.168.0.5') && wifiAt('my-mac.local') && wifiAt('[::1]'), 'home addresses keep Wi-Fi on');
check(!!menuItem(new MG.MenuScene().menu, 'WI-FI'), 'home share: WI-FI button is there');
location.hostname = ''; location.protocol = 'file:';

// a host window that another window replaced stops and says why
MG.Net.role = 'host'; MG.Net.status = 'connected'; MG.Net.token = 't';
MG.Net.giveUp(); frames(2);
check(sceneName() === 'Lobby' && /stopped/.test(scene().error) && MG.Net.role === null, 'a replaced host window stops and explains');
done('boot');
