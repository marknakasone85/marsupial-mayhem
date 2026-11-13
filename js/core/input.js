// Keyboard, pointer (mouse/touch) and gamepad input.
// Gamepads are mapped onto virtual key codes like "Pad0Left" so everything
// else can treat them exactly like keys.
(function () {
  const PREVENT = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Slash', 'Tab', 'Semicolon', 'Quote', 'BracketLeft', 'BracketRight',
  ]);

  // Which keys the player is using, so on-screen hints can match them.
  const ARROW_SIDE = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyK', 'KeyL',
    'Comma', 'Period', 'Slash', 'Semicolon', 'Quote', 'BracketLeft', 'BracketRight']);
  const WASD_SIDE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyR', 'KeyE', 'KeyQ', 'KeyT']);

  const I = (MG.Input = {
    lastDevice: 'wasd', // 'wasd' | 'arrows' | 'pad'
    keys: {},
    pressed: {},
    pointer: { x: 0, y: 0, down: false, pressed: false },
    _padPrev: {},

    init(canvas) {
      window.addEventListener('keydown', (e) => {
        if (PREVENT.has(e.code)) e.preventDefault();
        if (!this.keys[e.code]) this.pressed[e.code] = true;
        this.keys[e.code] = true;
        if (ARROW_SIDE.has(e.code)) this.lastDevice = 'arrows';
        else if (WASD_SIDE.has(e.code)) this.lastDevice = 'wasd';
        MG.Audio.unlock();
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });
      window.addEventListener('blur', () => {
        this.keys = {};
      });

      const toLocal = (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer.x = ((e.clientX - r.left) / r.width) * MG.W;
        this.pointer.y = ((e.clientY - r.top) / r.height) * MG.H;
      };
      canvas.addEventListener('pointerdown', (e) => {
        toLocal(e);
        this.pointer.down = true;
        this.pointer.pressed = true;
        MG.Audio.unlock();
      });
      canvas.addEventListener('pointermove', toLocal);
      window.addEventListener('pointerup', () => {
        this.pointer.down = false;
      });
      if (MG.Touch) MG.Touch.init(canvas);
      // iPhone/iPad only allow sound to start on a finished tap or click
      window.addEventListener('touchend', () => MG.Audio.unlock(), { passive: true });
      window.addEventListener('click', () => MG.Audio.unlock());
    },

    // Read gamepads (first two) and the touch buttons into virtual keys.
    poll() {
      if (MG.Touch) MG.Touch.poll();
      if (!navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      for (let i = 0; i < 2; i++) {
        const gp = pads[i];
        const st = {};
        if (gp) {
          const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
          const b = (n) => !!(gp.buttons[n] && gp.buttons[n].pressed);
          st.Left = ax < -0.4 || b(14);
          st.Right = ax > 0.4 || b(15);
          st.Up = ay < -0.6 || b(12);
          st.Down = ay > 0.6 || b(13) || b(4);
          st.R = b(5);          // RB: shoot
          st.L = b(6);          // LT: grenade
          st.RT = b(7);         // RT: pouch
          st.Back = b(8);       // Back / View: joey
          st.A = b(0);
          st.B = b(1);
          st.X = b(2);
          st.Y = b(3);
          st.Start = b(9);
        }
        for (const k of ['Left', 'Right', 'Up', 'Down', 'A', 'B', 'X', 'Y', 'R', 'L', 'RT', 'Back', 'Start']) {
          const code = 'Pad' + i + k;
          const now = !!st[k];
          if (now && !this._padPrev[code]) { this.pressed[code] = true; this.lastDevice = 'pad'; }
          this.keys[code] = now;
          this._padPrev[code] = now;
        }
      }
    },

    anyPressed() { return Object.keys(this.pressed).length > 0 || this.pointer.pressed; },
    down(code) { return !!this.keys[code]; },
    hit(code) { return !!this.pressed[code]; },
    anyDown(codes) { return codes.some((c) => this.keys[c]); },
    anyHit(codes) { return codes.some((c) => this.pressed[c]); },

    endFrame() {
      this.pressed = {};
      this.pointer.pressed = false;
    },
  });

  // ---------- Control schemes ----------
  const P1 = {
    left: ['KeyA', 'Pad0Left', 'TouchLeft'],
    right: ['KeyD', 'Pad0Right', 'TouchRight'],
    up: ['KeyW', 'Pad0Up', 'Pad0A', 'TouchJump'],
    down: ['KeyS', 'Pad0Down', 'TouchDown'],
    attack: ['KeyF', 'Pad0X', 'TouchAttack'],
    big: ['KeyG', 'Pad0Y', 'TouchBig'],
    special: ['KeyH', 'Pad0B', 'TouchSpecial'],
    shoot: ['KeyR', 'Pad0R', 'TouchShoot'],
    grenade: ['KeyE', 'Pad0L', 'TouchGrenade'],
    joey: ['KeyQ', 'Pad0Back', 'TouchJoey'],
    pouch: ['KeyT', 'Pad0RT', 'TouchPouch'],
  };
  const P2 = {
    left: ['ArrowLeft', 'Pad1Left'],
    right: ['ArrowRight', 'Pad1Right'],
    up: ['ArrowUp', 'Pad1Up', 'Pad1A'],
    down: ['ArrowDown', 'Pad1Down'],
    attack: ['Comma', 'Numpad1', 'Pad1X'],
    big: ['Period', 'Numpad2', 'Pad1Y'],
    special: ['Slash', 'Numpad3', 'Pad1B'],
    shoot: ['Semicolon', 'Numpad4', 'Pad1R'],
    grenade: ['Quote', 'Numpad5', 'Pad1L'],
    joey: ['BracketLeft', 'Numpad6', 'Pad1Back'],
    pouch: ['BracketRight', 'Numpad7', 'Pad1RT'],
  };
  // Solo play accepts both halves of the keyboard plus J/K/L and Space.
  const SOLO = {};
  for (const k of Object.keys(P1)) SOLO[k] = P1[k].concat(P2[k]);
  SOLO.up.push('Space');
  SOLO.attack.push('KeyJ');
  SOLO.big.push('KeyK');
  SOLO.special.push('KeyL');

  MG.Controls = { P1, P2, SOLO };

  // Turn a scheme into the plain "controller state" fighters understand.
  MG.readControls = function (scheme) {
    return {
      left: I.anyDown(scheme.left),
      right: I.anyDown(scheme.right),
      down: I.anyDown(scheme.down),
      jumpP: I.anyHit(scheme.up),
      attackP: I.anyHit(scheme.attack),
      bigP: I.anyHit(scheme.big),
      specialP: I.anyHit(scheme.special),
      shootP: I.anyHit(scheme.shoot),
      grenadeP: I.anyHit(scheme.grenade),
      joeyP: I.anyHit(scheme.joey),
      pouchP: I.anyHit(scheme.pouch),
      shoot: I.anyDown(scheme.shoot), // held: rapid-fire weapons keep firing
      jump: I.anyDown(scheme.up),     // held: higher hops
    };
  };

  // Menu helpers
  MG.Menu = {
    up: () => I.anyHit(['ArrowUp', 'KeyW', 'Pad0Up', 'Pad1Up']),
    down: () => I.anyHit(['ArrowDown', 'KeyS', 'Pad0Down', 'Pad1Down']),
    left: () => I.anyHit(['ArrowLeft', 'KeyA', 'Pad0Left', 'Pad1Left']),
    right: () => I.anyHit(['ArrowRight', 'KeyD', 'Pad0Right', 'Pad1Right']),
    confirm: () => I.anyHit(['Enter', 'Space', 'KeyF', 'Pad0A', 'Pad1A', 'Pad0Start']),
    back: () => I.anyHit(['Escape', 'Backspace', 'Pad0B', 'Pad1B']),
    pause: () => I.anyHit(['Escape', 'KeyP', 'Pad0Start', 'Pad1Start', 'TouchPause']),
  };
})();
