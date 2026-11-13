// CPU opponent for Tournament Duel (pattern from Sloth Slap's CPU). It makes the same controller
// state a player would, so it can play any character.
(function () {
  const U = MG.U;
  const LEVELS = [
    { name: 'JOEY', think: 0.42, block: 0.15, aggression: 0.45, special: 0.4 },
    { name: 'CHAMPION', think: 0.24, block: 0.4, aggression: 0.65, special: 0.75 },
    { name: 'LEGEND', think: 0.12, block: 0.7, aggression: 0.85, special: 1 },
  ];
  MG.CPU_LEVELS = LEVELS;

  MG.CPU = class {
    constructor(level = 1) {
      this.cfg = LEVELS[level] || LEVELS[1];
      this.timer = 0;
      this.hold = { left: false, right: false, down: false, jump: false, shoot: false };
      this.blockT = 0;
      this.kickNade = 0;
    }

    control(me, opp, dt, world) {
      const ctrl = { left: false, right: false, down: false, jump: false, shoot: false, jumpP: false, attackP: false, bigP: false, specialP: false, shootP: false, grenadeP: false, joeyP: false, pouchP: false };
      if (!opp || opp.state === 'ko' || me.state === 'ko' || opp.playingDead) return ctrl;
      this.timer -= dt;
      this.blockT -= dt;
      this.kickNade -= dt;
      const dx = opp.x - me.x;
      const dist = Math.abs(dx);
      const toward = dx > 0 ? 'right' : 'left';
      const away = dx > 0 ? 'left' : 'right';

      // a grenade we just dropped: kick it at the opponent
      if (this.kickNade > 0 && world && world.grenadeNear && world.grenadeNear(me)) {
        ctrl.bigP = dist > 300;
        ctrl.attackP = !ctrl.bigP;
        this.kickNade = 0;
        return ctrl;
      }
      // block incoming attacks (limited by skill)
      const threatened = opp.state === 'attack' && dist < 160;
      if (threatened && this.blockT <= 0 && Math.random() < this.cfg.block * dt * 12) this.blockT = 0.35;
      if (this.blockT > 0) { ctrl.down = true; return ctrl; }

      if (this.timer <= 0) {
        this.timer = this.cfg.think * U.rand(0.7, 1.3);
        this.hold = { left: false, right: false, down: false, jump: false, shoot: false };
        const aggressive = Math.random() < this.cfg.aggression;
        const spec = MG.SPECIALS[me.def.special];
        const range = spec && spec.range ? spec.range : [0, 150];
        if (me.pouch && (me.pouch !== 'heart' ? dist < 260 : me.hp < me.maxHp * 0.5)) {
          ctrl.pouchP = true;
        } else if (me.joeyReady && dist < 380 && Math.random() < this.cfg.aggression * 0.35) {
          ctrl.joeyP = true;
        } else if (me.canSpecial && dist >= range[0] && dist <= range[1] && Math.random() < this.cfg.special) {
          ctrl.specialP = true;
        } else if (me.canSpecial && Math.random() < this.cfg.special) {
          // special ready but out of range: get into range for it
          this.hold[dist < range[0] ? away : toward] = true;
        } else if (me.grenades > 0 && dist > 160 && dist < 420 && Math.random() < 0.25) {
          ctrl.grenadeP = true;
          this.kickNade = 0.8;
        } else if (me.weapon && dist > 140 && Math.random() < 0.6) {
          this.hold.shoot = true;
        } else if (dist < me.w * 0.6 + 60) {
          if (aggressive) {
            if (Math.random() < 0.65) ctrl.attackP = true;
            else ctrl.bigP = true;
          } else this.hold[away] = true;
        } else if (dist < 260) {
          this.hold[toward] = aggressive || Math.random() < 0.5;
          if (!this.hold[toward]) this.hold[away] = Math.random() < 0.3;
          if (Math.random() < 0.12) { ctrl.jumpP = true; this.hold.jump = true; }
        } else {
          this.hold[toward] = true;
          if (Math.random() < 0.05) { ctrl.jumpP = true; this.hold.jump = true; }
        }
      }
      ctrl.left = this.hold.left;
      ctrl.right = this.hold.right;
      ctrl.jump = this.hold.jump;
      ctrl.shoot = this.hold.shoot;
      return ctrl;
    }
  };
})();
