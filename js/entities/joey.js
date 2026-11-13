// The joey (docs/DESIGN.md, "The signature mechanic: the pouch"). Every marsupial has one: in a
// pouch (the mums), in a backwards pouch (wombat, devil) or riding on the back (the boys, the numbat).
//  * By itself: hops out to nip a pest that's close, and fetches nearby pickups.
//  * The JOEY button: a Joey Rush at the nearest pest (shares the same cooldown).
//  * Once per map: when its parent is knocked out, it gets them back up ("JOEY TO THE RESCUE!").
//  * Levels 1-5: +1 for every map its character clears (saved in the browser). Duels: level 1, no rescue.
(function () {
  const U = MG.U;
  const GRAV = 1900;
  MG.JOEY_MAX_LEVEL = 5;
  const COOL = { nip: 5, fetch: 3.5, rush: 8 };

  // Saved joey levels: { characterId: level }
  MG.joeyLevel = (cid) => U.clamp((MG.Save.get('joeyLevels', {})[cid] || 1), 1, MG.JOEY_MAX_LEVEL);
  MG.growJoey = (cid) => {
    const all = MG.Save.get('joeyLevels', {});
    const was = U.clamp(all[cid] || 1, 1, MG.JOEY_MAX_LEVEL);
    all[cid] = Math.min(MG.JOEY_MAX_LEVEL, was + 1);
    MG.Save.set('joeyLevels', all);
    return all[cid] > was ? all[cid] : 0;
  };

  MG.Joey = class {
    constructor(parent, level, opts = {}) {
      this.parent = parent;
      this.level = U.clamp(level || 1, 1, MG.JOEY_MAX_LEVEL);
      this.canRescue = opts.rescue !== false;
      this.rescueUsed = false;
      this.state = 'home';   // home | out | back
      this.job = null;       // nip | fetch | rush
      this.cool = 2;         // seconds until it can help again
      this.x = parent.x; this.y = parent.y; this.vx = 0; this.vy = 0;
      this.t = 0;
      this.outT = 0;
      this.facing = 1;
      this.target = null;
      this.carrying = null;
      this.hitDone = false;
    }

    get power() { return 1 + 0.25 * (this.level - 1); }
    get ready() { return this.state === 'home' && this.cool <= 0; }
    get scale() { return 0.3 + 0.025 * (this.level - 1); }

    // the JOEY button
    rush(world) {
      if (!this.ready || this.parent.state === 'ko') return false;
      const target = this.nearestPest(world, 460);
      this.launch('rush', target);
      world.fx.text(this.parent.x, this.parent.y - this.parent.h - 30, 'JOEY RUSH!', '#f6b3c4', 22);
      MG.Audio.hop();
      return true;
    }

    nearestPest(world, range) {
      let best = null, bd = range;
      for (const t of world.targets(this.parent.team)) {
        if (!t.alive || t.isProp || t.hidden || t.playingDead) continue;
        const d = Math.abs(t.x - this.parent.x);
        if (d < bd && Math.abs(t.y - this.parent.y) < 160) { bd = d; best = t; }
      }
      return best;
    }

    launch(job, target) {
      this.state = 'out';
      this.job = job;
      this.target = target;
      this.hitDone = false;
      this.outT = 0;
      this.x = this.parent.x;
      this.y = this.parent.y - this.parent.h * 0.5;
      const dir = target ? Math.sign(target.x - this.x) || this.parent.facing : this.parent.facing;
      this.facing = dir;
      this.vx = dir * (job === 'rush' ? 560 : 360);
      this.vy = -420;
    }

    // Once per map: back up with some health instead of a knockout. Returns true if it rescued.
    tryRescue(world) {
      if (!this.canRescue || this.rescueUsed) return false;
      this.rescueUsed = true;
      const f = this.parent;
      f.hp = Math.round(f.maxHp * 0.4);
      f.state = 'idle';
      f.move = null;
      f.invuln = 2;
      f.vy = -420;
      f.onGround = false;
      world.fx.text(f.x, f.y - f.h - 40, 'JOEY TO THE RESCUE!', '#f6b3c4', 28);
      world.fx.burst(f.x, f.y - f.h * 0.5, '#f6b3c4', 26, 320);
      MG.Audio.powerUp();
      this.cool = Math.max(this.cool, 2);
      return true;
    }

    update(dt, world) {
      const f = this.parent;
      this.t += dt;
      this.cool -= dt;
      if (this.state === 'home') {
        this.x = f.x; this.y = f.y;
        if (this.cool > 0 || f.state === 'ko' || f.burrowed || f.playingDead) return;
        // help by itself: nip a pest that's close, or fetch a pickup that's near
        const pest = this.nearestPest(world, 160);
        if (pest) { this.launch('nip', pest); return; }
        const pk = world.pickups ? world.pickups.find((p) => !p.taken && !p.carried && p.type !== 'scrap'
          && Math.abs(p.x - f.x) > 30 && Math.abs(p.x - f.x) < 230 && Math.abs(p.y - f.y) < 120 && p.y >= (world.floorBelow ? world.floorBelow(p.x, p.y) - 2 : p.y)) : null;
        if (pk) { this.launch('fetch', pk); pk.carried = this; }
        return;
      }
      this.outT += dt;
      // hop along
      this.vy += GRAV * (world.gravity || 1) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const floor = world.floorBelow ? world.floorBelow(this.x, this.y - 1) : world.groundY;
      if (this.y >= floor) {
        this.y = floor;
        const goal = this.state === 'back' ? f : this.target;
        const gx = goal ? goal.x : this.x + this.facing * 80;
        const dir = Math.sign(gx - this.x) || this.facing;
        this.facing = dir;
        this.vy = -(this.job === 'rush' && this.state === 'out' ? 300 : 360);
        this.vx = dir * (this.job === 'rush' && this.state === 'out' ? 560 : 340);
      }
      if (this.state === 'out') {
        const t = this.target;
        const gone = !t || (t.alive === false) || t.taken;
        if (this.job === 'fetch') {
          if (gone) { this.goHome(); return; }
          if (Math.abs(t.x - this.x) < 26) { this.carrying = t; t.carried = this; this.goHome(); }
        } else {
          // nip or rush whatever pest is in reach (the rush keeps going straight if there was no target)
          const box = { x: this.x - 16, y: this.y - 34, w: 32, h: 34 };
          for (const p of world.targets(f.team)) {
            if (!p.alive || p.isProp || this.hitDone || !U.overlap(box, p.box)) continue;
            this.hitDone = true;
            const rush = this.job === 'rush';
            const res = p.takeHit({
              dmg: (rush ? 10 : 4) * this.power, kbx: this.facing * (rush ? 520 : 160), kby: rush ? -420 : -120,
              stun: rush ? 0.6 : 0.3, big: rush, from: this.parent, dir: this.facing,
            }, world);
            if (res !== 'miss') {
              world.fx.burst(p.x, p.box.y + 10, '#f6b3c4', rush ? 14 : 6, rush ? 260 : 150);
              world.fx.text(p.x, p.box.y - 12, rush ? 'JOEY KICK!' : 'NIP!', '#f6b3c4', rush ? 22 : 16);
              MG.Audio.jab();
            }
            this.goHome();
            break;
          }
          if (gone && this.job === 'nip') this.goHome();
        }
        if (this.outT > (this.job === 'rush' ? 1.6 : 2.5)) this.goHome();
      } else if (this.state === 'back') {
        if (this.carrying) { this.carrying.x = this.x; this.carrying.y = this.y - 4; }
        if (Math.abs(f.x - this.x) < 30 && Math.abs(f.y - this.y) < 80 || this.outT > 4) this.arrive(world);
      }
    }

    goHome() {
      this.state = 'back';
      this.outT = 0;
      this.cool = COOL[this.job] || 4;
    }

    arrive(world) {
      this.state = 'home';
      const pk = this.carrying;
      this.carrying = null;
      if (pk && !pk.taken && this.parent.state !== 'ko' && world.collect) {
        pk.carried = null;
        world.collect(pk, this.parent);
        world.fx.text(this.parent.x, this.parent.y - this.parent.h - 30, 'FETCHED!', '#f6b3c4', 18);
      } else if (pk) pk.carried = null;
    }

    // what the art (and Wi-Fi guests) need: [x, y, state 0 home / 1 out, level, facing, carrying?]
    renderState() {
      return this.state === 'home' ? [0, 0, 0, this.level, this.facing, 0]
        : [Math.round(this.x), Math.round(this.y), 1, this.level, this.facing, this.carrying ? 1 : 0];
    }
  };
})();
