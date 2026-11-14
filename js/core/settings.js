// Settings (Milestone 8), saved in this browser: volumes, blood (on / off / gore), difficulty,
// bigger touch buttons, high contrast, and changing the keys. The Settings page is js/scenes/settings.js.
(function () {
  const S = MG.Settings; // (blood was already here, from fx.js)
  S.gore = MG.Save.get('gore', false);               // extra cartoon splatter (only when blood is on)
  S.difficulty = MG.Save.get('difficulty', 'normal'); // easy | normal | hard (the campaign only; duels stay fair)
  S.bigTouch = MG.Save.get('bigTouch', false);        // bigger touch buttons on phones and tablets
  S.contrast = MG.Save.get('contrast', false);        // high contrast: solid panels, outlines under everyone
  S.music = MG.Save.get('musicVol', 1);              // 0..1
  S.effects = MG.Save.get('effectsVol', 1);          // 0..1

  // Difficulty: how hard pests hit, and how tough they are.
  MG.DIFFICULTY = { easy: { dmg: 0.65, hp: 0.8, name: 'EASY' }, normal: { dmg: 1, hp: 1, name: 'NORMAL' }, hard: { dmg: 1.35, hp: 1.3, name: 'HARD' } };
  MG.difficulty = () => MG.DIFFICULTY[S.difficulty] || MG.DIFFICULTY.normal;

  // Blood: ON, then GORE (extra cartoon splatter), then OFF (confetti).
  MG.bloodLabel = () => (!S.blood ? 'OFF (confetti)' : S.gore ? 'GORE (extra splatter)' : 'ON');
  MG.cycleBlood = () => {
    if (S.blood && !S.gore) S.gore = true;
    else if (S.blood) { S.blood = false; S.gore = false; } else { S.blood = true; S.gore = false; }
    MG.Save.set('blood', S.blood);
    MG.Save.set('gore', S.gore);
  };
  MG.setSetting = (key, value, saveKey) => { S[key] = value; MG.Save.set(saveKey || key, value); MG.applyVolume(); };

  // Volume: the effects level sets the master gain; music rides on top of it.
  MG.applyVolume = () => {
    const A = MG.Audio;
    if (!A || !A.master) return;
    const fx = Math.max(0.02, S.effects);
    A.master.gain.value = A.muted ? 0 : 0.5 * S.effects;
    if (A.musicGain) A.musicGain.gain.value = 0.35 * S.music / fx;
  };
  // (the audio starts on the first tap or key press, and the mute button resets the gain: apply ours after)
  for (const name of ['unlock', 'toggleMute']) {
    const orig = MG.Audio[name];
    if (typeof orig === 'function') MG.Audio[name] = function (...args) { const r = orig.apply(this, args); MG.applyVolume(); return r; };
  }

  // ---------------- changing the keys ----------------
  // Each action has one keyboard key per player (gamepads and touch buttons don't change).
  const ACTIONS = ['left', 'right', 'up', 'down', 'attack', 'big', 'special', 'shoot', 'grenade', 'joey', 'pouch'];
  const ACTION_NAMES = { left: 'Move left', right: 'Move right', up: 'Jump', down: 'Block', attack: 'Attack', big: 'Big attack', special: 'Special', shoot: 'Shoot', grenade: 'Grenade', joey: 'Joey', pouch: 'Pouch' };
  const C = MG.Controls;
  const DEFAULTS = { P1: {}, P2: {} };
  for (const p of ['P1', 'P2']) for (const a of ACTIONS) DEFAULTS[p][a] = C[p][a][0];
  const SOLO_EXTRA = { up: ['Space'], attack: ['KeyJ'], big: ['KeyK'], special: ['KeyL'] };
  const LABELS = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'",
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`', Space: 'Space', Enter: 'Enter',
    ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'L-Alt', AltRight: 'R-Alt', Tab: 'Tab',
  };
  MG.keyLabel = (code) => {
    if (!code) return '?';
    if (LABELS[code]) return LABELS[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad/.test(code)) return 'Num' + code.slice(6);
    return code;
  };
  MG.Keys = {
    ACTIONS, ACTION_NAMES, DEFAULTS,
    saved() { const k = MG.Save.get('keys', {}); return k && typeof k === 'object' ? k : {}; },
    get(p, a) { const k = this.saved(); return (k[p] && typeof k[p][a] === 'string' && k[p][a]) || DEFAULTS[p][a]; },
    label(p, a) { return MG.keyLabel(this.get(p, a)); },
    // Give `action` this key. If another action (either player's) had it, they swap.
    set(p, a, code) {
      if (typeof code !== 'string' || !/^(Key|Digit|Arrow|Numpad|Comma|Period|Slash|Semicolon|Quote|Bracket|Backslash|Minus|Equal|Backquote|Space|Enter|Shift|Control|Alt|Tab)/.test(code)) return false;
      const k = this.saved();
      const old = this.get(p, a);
      for (const q of ['P1', 'P2']) for (const b of ACTIONS) {
        if ((q !== p || b !== a) && this.get(q, b) === code) { k[q] = k[q] || {}; k[q][b] = old; }
      }
      k[p] = k[p] || {}; k[p][a] = code;
      MG.Save.set('keys', k);
      this.apply();
      return true;
    },
    reset() { MG.Save.set('keys', {}); this.apply(); },
    // Puts the chosen keys into MG.Controls (the arrays are changed in place: other code holds them).
    apply() {
      for (const p of ['P1', 'P2']) for (const a of ACTIONS) C[p][a][0] = this.get(p, a);
      for (const a of ACTIONS) {
        const arr = C.SOLO[a];
        arr.length = 0;
        arr.push(...C.P1[a], ...C.P2[a], ...(SOLO_EXTRA[a] || []));
      }
    },
  };
  MG.Keys.apply();
})();
