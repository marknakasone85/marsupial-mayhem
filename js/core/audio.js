// All sound is synthesized with WebAudio, so there are no audio files to ship.
(function () {
  const A = (MG.Audio = {
    ctx: null,
    master: null,
    musicGain: null,
    muted: MG.Save.get('muted', false),
    song: null,
    _timer: null,

    unlock() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.muted ? 0 : 0.5;
          this.master.connect(this.ctx.destination);
          this.musicGain = this.ctx.createGain();
          this.musicGain.gain.value = 0.35;
          this.musicGain.connect(this.master);
          if (this._wantSong) this.playMusic(this._wantSong);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (!this.warmed) {
          // play one silent sample: some iPhones only enable sound after the first real playback
          this.warmed = true;
          const b = this.ctx.createBuffer(1, 1, 22050);
          const src = this.ctx.createBufferSource();
          src.buffer = b;
          src.connect(this.ctx.destination);
          src.start(0);
        }
      } catch (e) { /* audio unsupported */ }
    },

    toggleMute() {
      this.muted = !this.muted;
      MG.Save.set('muted', this.muted);
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    },

    // ---------- primitives ----------
    tone(freq, dur, type = 'square', vol = 0.2, slideTo = null, delay = 0, dest = null) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(dest || this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    noise(dur, vol = 0.5, freq = 1500, q = 1, delay = 0) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq;
      f.Q.value = q;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },

    // ---------- sound effects ----------
    hit() {
      this.noise(0.1, 0.9, 2200, 0.7);
      this.tone(260, 0.07, 'square', 0.12, 90);
    },
    bigHit() {
      this.noise(0.22, 1.0, 1100, 0.6);
      this.tone(180, 0.18, 'sawtooth', 0.2, 45);
      this.noise(0.08, 0.6, 3500, 1, 0.04);
    },
    whiff() { this.noise(0.12, 0.25, 600, 2); },
    jump() { this.tone(280, 0.18, 'sine', 0.25, 620); },
    land() { this.noise(0.06, 0.25, 300, 1); },
    hurt() { this.tone(520, 0.18, 'square', 0.12, 160); },
    block() { this.tone(900, 0.05, 'square', 0.1); this.noise(0.05, 0.3, 4000, 2); },
    pickup() {
      this.tone(660, 0.08, 'triangle', 0.25);
      this.tone(990, 0.14, 'triangle', 0.25, null, 0.07);
    },
    heal() {
      [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.2, null, i * 0.06));
    },
    gong() {
      this.tone(110, 1.4, 'sine', 0.4);
      this.tone(167, 1.2, 'triangle', 0.2);
      this.noise(0.3, 0.4, 700, 3);
    },
    crate() { this.noise(0.18, 0.8, 500, 0.8); this.tone(120, 0.1, 'square', 0.15, 60); },
    select() { this.tone(520, 0.05, 'square', 0.1); },
    confirm() { this.tone(520, 0.06, 'square', 0.12); this.tone(780, 0.1, 'square', 0.12, null, 0.06); },
    special() { this.tone(200, 0.35, 'sawtooth', 0.15, 900); this.noise(0.3, 0.3, 2500, 0.5); },
    // Slow-motion finisher: a deep "BWOOMM" with a falling whistle.
    finisher() {
      this.tone(110, 0.9, 'sawtooth', 0.2, 36);
      this.noise(0.6, 0.5, 380, 0.7);
      this.tone(1500, 0.55, 'sine', 0.07, 280, 0.05);
    },
    ko() {
      [392, 370, 349, 262].forEach((f, i) =>
        this.tone(f, i === 3 ? 0.6 : 0.22, 'square', 0.15, i === 3 ? 180 : null, i * 0.22));
    },
    // A tone with vibrato (for squawks, kazoos and other silliness).
    wobble(freq, dur, type, vol, rate, depth, slideTo = null, delay = 0) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      lfo.frequency.value = rate;
      lfoGain.gain.value = depth;
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t); lfo.start(t);
      o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
    },

    shoot() {
      this.noise(0.09, 0.8, 1800, 0.5);
      this.tone(900, 0.12, 'square', 0.12, 180);
      this.tone(90, 0.1, 'sine', 0.35, 40);
    },
    powerUp() {
      [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'square', 0.11, null, i * 0.05));
      this.tone(200, 0.4, 'sine', 0.2, 800);
    },
    emptyClick() { this.tone(1800, 0.03, 'square', 0.08); this.tone(1200, 0.03, 'square', 0.06, null, 0.06); },
    ammo() { [660, 880, 1100].forEach((f, i) => this.tone(f, 0.07, 'square', 0.1, null, i * 0.05)); },

    // ---------- Marsupial Mayhem ----------
    jab() { this.noise(0.07, 0.7, 2600, 0.8); this.tone(320, 0.05, 'square', 0.1, 140); },
    kick() {
      this.noise(0.2, 1.0, 900, 0.6);
      this.tone(150, 0.2, 'sawtooth', 0.22, 40);
      this.tone(900, 0.12, 'sine', 0.08, 300, 0.03);
    },
    hop() { this.tone(170, 0.16, 'sine', 0.22, 420); },
    // Grenade: the pin comes out with a little "tink", then a fizzing fuse; the boom is big and low.
    pin() { this.tone(2600, 0.05, 'triangle', 0.15); this.tone(3400, 0.08, 'triangle', 0.1, null, 0.05); },
    punt() { this.noise(0.08, 0.6, 1400, 1); this.tone(500, 0.1, 'square', 0.1, 900); },
    boom() {
      this.noise(0.7, 1.0, 240, 0.5);
      this.noise(0.25, 0.6, 1200, 0.7);
      this.tone(70, 0.6, 'sine', 0.5, 28);
    },
    gatling() { this.noise(0.05, 0.45, 1700, 0.9); this.tone(240, 0.04, 'square', 0.06, 120); },
    // Milestone 5: one sound per weapon (MG.WEAPONS[id].sound), coins and the shop
    weapon(name) { if (typeof this[name] === 'function' && ['twang', 'plop', 'gatling', 'thwack', 'whoosh', 'squawk'].includes(name)) this[name](); },
    twang() { this.tone(900, 0.12, 'triangle', 0.2, 300); this.noise(0.04, 0.3, 3000, 1); },
    plop() { this.tone(180, 0.12, 'sine', 0.3, 420); this.noise(0.06, 0.3, 900, 1); },
    thwack() { this.noise(0.06, 0.8, 2200, 1.2); this.tone(140, 0.08, 'square', 0.15, 70); },
    whoosh() { this.noise(0.09, 0.18, 700 + Math.random() * 300, 0.6); },
    squawk() { this.wobble(1100, 0.22, 'sawtooth', 0.1, 24, 160, 1500); },
    coin() { this.tone(1320, 0.05, 'square', 0.07); this.tone(1980, 0.08, 'square', 0.07, null, 0.05); },
    kaching() { [880, 1320, 1760].forEach((f, i) => this.tone(f, 0.09, 'square', 0.1, null, i * 0.06)); this.noise(0.15, 0.3, 6000, 1, 0.18); },
    munch() { [0, 0.09, 0.18].forEach((d) => this.noise(0.06, 0.5, 2000, 1.5, d)); },
    thump() { this.tone(80, 0.18, 'sine', 0.5, 45); this.noise(0.1, 0.5, 300, 1); },
    hiss() { this.noise(0.35, 0.35, 5200, 0.8); },
    snort() { this.wobble(120, 0.3, 'sawtooth', 0.14, 30, 30, 80); },
    screech() { this.wobble(1400, 0.6, 'sawtooth', 0.12, 30, 300, 900); this.noise(0.5, 0.4, 3500, 1); },
    splash() { this.noise(0.45, 0.8, 900, 0.5); this.noise(0.3, 0.4, 2600, 1, 0.1); },
    bellow() { this.wobble(70, 0.9, 'sawtooth', 0.3, 18, 12, 55); this.noise(0.6, 0.4, 200, 0.6); },

    // Funny "you got me!" noises, one style per kind of enemy.
    funnyDeath(style) {
      switch (style) {
        case 'squish':
          this.noise(0.25, 0.7, 400, 0.7);
          this.tone(320, 0.3, 'sine', 0.3, 60);
          break;
        case 'squawk':
          this.wobble(1100, 0.35, 'square', 0.12, 28, 220, 500);
          this.wobble(800, 0.25, 'square', 0.08, 30, 180, 400, 0.2);
          break;
        case 'bloop':
          this.tone(700, 0.18, 'sine', 0.35, 140);
          this.tone(1600, 0.05, 'square', 0.1, null, 0.16);
          this.tone(1300, 0.05, 'square', 0.1, null, 0.22);
          break;
        case 'ook':
          this.tone(420, 0.1, 'triangle', 0.35, 720);
          this.tone(720, 0.18, 'triangle', 0.35, 260, 0.11);
          this.tone(520, 0.12, 'triangle', 0.25, 860, 0.3);
          break;
        case 'bzzt':
          this.wobble(220, 0.5, 'sawtooth', 0.14, 40, 60, 50);
          this.noise(0.35, 0.6, 2500, 1, 0.1);
          break;
        case 'kazoo':
          this.wobble(320, 0.7, 'sawtooth', 0.15, 7, 25, 160);
          this.wobble(240, 0.6, 'sawtooth', 0.1, 7, 20, 120, 0.4);
          break;
        case 'boing':
          this.tone(180, 0.3, 'sine', 0.35, 900);
          this.tone(320, 0.18, 'triangle', 0.3, 140, 0.28);
          break;
        case 'baa':
          this.wobble(540, 0.55, 'sawtooth', 0.12, 28, 45, 420);
          break;
        case 'squeak':
          this.tone(1800, 0.08, 'square', 0.1, 2600);
          this.tone(2000, 0.1, 'square', 0.08, 3000, 0.1);
          break;
        case 'rawr':
          this.wobble(150, 0.65, 'sawtooth', 0.2, 24, 35, 80);
          this.noise(0.4, 0.4, 500, 0.8);
          break;
        case 'beep':
          [1400, 1000, 700].forEach((f, i) => this.tone(f, 0.08, 'square', 0.1, null, i * 0.09));
          this.wobble(260, 0.35, 'sawtooth', 0.1, 40, 50, 60, 0.27);
          break;
        case 'honk':
          this.tone(330, 0.12, 'square', 0.16, 280);
          this.tone(300, 0.2, 'square', 0.16, 240, 0.15);
          break;
        case 'oink':
          this.wobble(380, 0.18, 'square', 0.14, 35, 60, 300);
          this.wobble(340, 0.3, 'square', 0.14, 35, 60, 200, 0.2);
          break;
        case 'yowl':
          this.wobble(600, 0.5, 'sawtooth', 0.12, 9, 90, 900);
          this.wobble(900, 0.3, 'sawtooth', 0.08, 9, 70, 400, 0.4);
          break;
        case 'groan':
          this.wobble(130, 0.8, 'sawtooth', 0.14, 5, 18, 70);
          break;
        case 'boss':
          this.tone(1200, 0.9, 'sine', 0.3, 120); // slide whistle down...
          this.noise(0.5, 1, 300, 0.5, 0.8);      // ...KABOOM
          this.tone(60, 0.6, 'sine', 0.5, 30, 0.8);
          break;
        default:
          this.tone(600, 0.3, 'sine', 0.3, 150);
      }
      // sometimes add a bonus cartoon honk or boing
      const r = Math.random();
      if (r < 0.2) { this.tone(260, 0.08, 'square', 0.12, null, 0.3); this.tone(260, 0.12, 'square', 0.12, null, 0.42); }
      else if (r < 0.35) this.tone(200, 0.35, 'sine', 0.25, 900, 0.3);
    },

    win() {
      [523, 659, 784, 1046, 784, 1046].forEach((f, i) =>
        this.tone(f, 0.15, 'square', 0.13, null, i * 0.1));
    },

    // ---------- tiny step-sequencer for background music ----------
    // Marsupial Mayhem's own tunes (16 steps each; MIDI note numbers, null = rest).
    SONGS: {
      // The Outback: a bush-band stomp in D major.
      outback: {
        bpm: 132,
        bass: [38, null, 45, null, 38, null, 45, null, 43, null, 50, null, 45, null, 52, null],
        lead: [62, 66, 69, null, 71, 69, 66, null, 67, null, 71, 74, 73, null, 69, null],
      },
      // Boss fights: fast and grumpy in D minor.
      boss: {
        bpm: 148,
        bass: [38, 38, 50, 38, 41, 41, 53, 41, 36, 36, 48, 36, 40, 40, 52, 43],
        lead: [74, null, 72, 74, null, 77, 76, null, 72, null, 70, 72, null, 69, null, null],
      },
      // Title screen: a bouncy, hopping tune in G major.
      title: {
        bpm: 124,
        bass: [43, null, 50, 43, null, 47, 50, null, 48, null, 55, 48, null, 50, 52, null],
        lead: [71, null, 74, 79, 78, null, 74, null, 76, 74, 72, null, 71, null, 67, null],
      },
      // The Rainforest: mellow and mysterious in A minor, rolling marimba-style broken chords
      // with high "bird call" chirps.
      rainforest: {
        bpm: 124,
        bass: [45, null, null, 52, null, null, 45, null, 41, null, null, 48, null, 43, null, 50],
        lead: [69, 72, 76, null, 74, 72, 69, 88, 65, 69, 72, null, 71, 67, 86, null],
      },
      // Cane Fields & Coast: bouncy and sunny in C major, a syncopated steel-drum calypso.
      coast: {
        bpm: 136,
        bass: [36, null, 43, 36, null, 43, 48, null, 41, null, 48, 41, null, 43, 47, null],
        lead: [76, null, 79, 76, null, 72, 74, 76, 77, null, 81, 77, null, 74, 79, null],
      },
      // The world map: a light, adventurous march in F major (a short loop).
      map: {
        bpm: 128,
        bass: [41, null, 48, null, 46, null, 53, null, 43, null, 50, null, 48, null, 52, null],
        lead: [65, 69, 72, null, 70, 74, 77, null, 74, 72, 70, null, 72, null, 69, null],
      },
    },

    playMusic(name) {
      this._wantSong = name;
      if (!this.ctx) return;
      if (this.song === name) return;
      this.stopMusic();
      this.song = name;
      const s = this.SONGS[name];
      const stepDur = 60 / s.bpm / 2;
      let step = 0;
      let nextTime = this.ctx.currentTime + 0.05;
      const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
      this._timer = setInterval(() => {
        while (nextTime < this.ctx.currentTime + 0.15) {
          const delay = nextTime - this.ctx.currentTime;
          const b = s.bass[step % 16];
          const l = s.lead[step % 16];
          if (b) this.tone(midi(b), stepDur * 0.9, 'triangle', 0.5, null, delay, this.musicGain);
          if (l) this.tone(midi(l), stepDur * 0.8, 'square', 0.12, null, delay, this.musicGain);
          if (step % 4 === 0) this.tone(70, 0.08, 'sine', 0.4, 40, delay, this.musicGain);
          nextTime += stepDur;
          step++;
        }
      }, 25);
    },

    stopMusic() {
      if (this._timer) clearInterval(this._timer);
      this._timer = null;
      this.song = null;
    },
  });
})();
