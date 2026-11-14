// CPU marsupial champions who fight beside the players (docs/DESIGN.md, story beat 7: "joining forces").
// A map lists them in `allies: ['boomer', 'chompers', ...]`. Each is an ordinary Fighter on the players'
// team, driven by this little brain: go for the nearest pest, keep up with the team, use the special.
// They can't lose the map for you: when knocked out they're back a few seconds later.
(function () {
  const U = MG.U;

  MG.AllyAI = class {
    constructor() {
      this.timer = 0;
      this.hold = { left: false, right: false, jump: false };
      this.lastX = 0;
      this.stuckT = 0;
    }

    control(me, world, dt) {
      const ctrl = { left: false, right: false, down: false, jump: false, shoot: false, jumpP: false, attackP: false, bigP: false, specialP: false, shootP: false, grenadeP: false, joeyP: false, pouchP: false };
      if (me.state === 'ko') return ctrl;
      this.timer -= dt;
      // the nearest pest that can be hit
      let target = null, bd = 560;
      for (const e of world.enemies || []) {
        if (!e.alive || e.hidden || e.burrowed || e.lurking || e.clinging) continue;
        const d = Math.abs(e.x - me.x) + Math.abs(e.y - me.y) * 0.5;
        if (d < bd) { bd = d; target = e; }
      }
      const lead = world.leader();
      if (!target) {
        // keep up with the team
        const tx = lead.x - lead.facing * 90;
        if (Math.abs(tx - me.x) > 60) ctrl[tx > me.x ? 'right' : 'left'] = true;
      } else {
        const dx = target.x - me.x, dist = Math.abs(dx);
        const reach = (target.d ? target.d.w / 2 : 20) + 50;
        if (dist > reach) ctrl[dx > 0 ? 'right' : 'left'] = true;
        else me.facing = dx > 0 ? 1 : -1;
        if (this.timer <= 0) {
          this.timer = U.rand(0.25, 0.45);
          const spec = MG.SPECIALS[me.def.special];
          const range = spec && spec.range ? spec.range : [0, 150];
          if (me.canSpecial && dist >= range[0] && dist <= range[1]) ctrl.specialP = true;
          else if (dist <= reach + 10) { if (Math.random() < 0.25) ctrl.bigP = true; else ctrl.attackP = true; }
        }
        if (target.y < me.y - 60 && me.onGround && Math.random() < dt * 2) ctrl.jumpP = true;
      }
      // stuck against something: hop
      this.stuckT = Math.abs(me.x - this.lastX) < 1 && (ctrl.left || ctrl.right) ? this.stuckT + dt : 0;
      this.lastX = me.x;
      if (this.stuckT > 0.6 && me.onGround) { ctrl.jumpP = true; ctrl.jump = true; this.stuckT = 0; }
      if (me.swimming && Math.random() < dt * 3) ctrl.jumpP = true;
      return ctrl;
    }
  };
})();
