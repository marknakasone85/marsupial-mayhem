// Difficulty check: a simple bot (it never blocks or dodges) plays the whole map.
// It may use up to 5 checkpoint continues. Each map is played a few times; most runs must finish.
function runLevel(li) {
  MG.Engine.setScene(new MG.CampaignScene({ charId: 'boomer', level: li }));
  var sc = scene(), lastX = 0, stuck = 0, held = {}, deaths = 0, i;
  function set(code, on) { if (!!held[code] !== on) { key(code, on); held[code] = on; } }
  for (i = 0; i < 60 * 300 && (sc.state === 'play' || sc.state === 'dead'); i++) {
    if (sc.state === 'dead') { if (sc.menu && sc.checkpoint && deaths < 5) { deaths++; sc.respawn(); } else if (sc.menu) break; frames(1); continue; }
    var p = sc.player;
    var near = sc.targets('player').filter(function (t) {
      return t.alive && Math.abs(t.x - p.x) < 100 && Math.abs((t.box.y + t.box.h / 2) - (p.y - p.h / 2)) < 110;
    });
    var many = sc.enemies.filter(function (e) { return e.alive && Math.abs(e.x - p.x) < 260; }).length;
    if (near.length) {
      var dir = near[0].x > p.x ? 'KeyD' : 'KeyA';
      set(dir, true); set(dir === 'KeyD' ? 'KeyA' : 'KeyD', false);
      set('KeyF', i % 10 < 2);
      set('KeyG', i % 37 === 20);
      set('KeyH', p.canSpecial && i % 20 === 0);
      set('KeyE', many >= 3 && p.grenades > 0 && i % 120 === 0);
    } else {
      set('KeyA', false); set('KeyD', true); set('KeyF', false); set('KeyG', false); set('KeyH', false); set('KeyE', false);
    }
    set('KeyR', !!p.weapon && sc.enemies.some(function (e) { return e.alive && (e.x - p.x) * p.facing > 0 && Math.abs(e.x - p.x) < 500; }));
    if (i % 60 === 0) { if (Math.abs(p.x - lastX) < 5) stuck++; else stuck = 0; lastX = p.x; }
    set('KeyW', stuck > 1 && i % 40 < 20);
    frames(1);
  }
  Object.keys(held).forEach(function (k) { if (held[k]) key(k, false); });
  frames(2);
  return { won: sc.state === 'won', deaths: deaths, secs: Math.round(i / 60), x: Math.round(sc.player.x) };
}
var RUNS = typeof FULL_RUN !== 'undefined' && FULL_RUN ? 6 : 3;
var wins = 0, runs = 0;
for (var li = 0; li < MG.LEVELS.length; li++) {
  var detail = [];
  for (var k = 0; k < RUNS; k++) {
    var res = runLevel(li); runs++; if (res.won) wins++;
    detail.push((res.won ? 'won' : 'lost at x=' + res.x) + ' in ' + res.secs + ' s, ' + res.deaths + ' continues');
  }
  print('  map ' + (li + 1) + ' ' + MG.LEVELS[li].name + ': ' + detail.join('; '));
}
check(wins / runs >= 0.65, 'the solo bot finished ' + wins + '/' + runs + ' runs');
done('solo');
