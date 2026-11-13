// Trait modules (docs/ROSTER.md). A character lists its abilities; the fighter calls these hooks:
//   update(f, dt, ctrl, world)  every frame before moving        jump(f, ctrl, world) -> true if it used the jump
//   physics(f, dt, ctrl, world) after gravity                    hit(f, hit, world) -> 'miss', or the hit (changed)
//   speed(f) -> multiplier                                        afterHit(f, hit, result, world) after taking a hit
// Passive flags (scavenger, snackSpeed, earRadar, rabbitBane, swimmer, tailCounter) are read where they matter.
(function () {
  const U = MG.U;
  const approach = (v, target, amt) => (v < target ? Math.min(target, v + amt) : Math.max(target, v - amt));

  const A = (MG.ABILITIES = {
    // Boomer: block a hit, then an automatic tail kick (handled in the fighter's block code).
    tailCounter: {},

    // Stinker: tougher the longer a fight goes on (up to 30% less damage after 90 seconds).
    tougher: {
      update(f, dt) { f.fightT = (f.fightT || 0) + dt; },
      hit(f, hit) { hit.dmg *= 1 - Math.min(0.3, (f.fightT || 0) / 300); return hit; },
    },

    // Tank: super armour (small hits don't stop him).
    superArmour: {
      hit(f, hit) { if (!hit.big && !hit.sleep && hit.dmg < 12) hit.armour = true; return hit; },
    },

    // Tank: double-tap a direction for a short sprint (wombats really sprint at about 40 km/h).
    sprintBurst: {
      update(f, dt, ctrl, world) {
        const dir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
        f.sprintT = Math.max(0, (f.sprintT || 0) - dt);
        f.tapT = (f.tapT || 0) + dt;
        if (dir !== (f.lastDir || 0)) {
          if (dir !== 0 && dir === f.tapDir && f.tapT < 0.28 && f.onGround && f.state === 'idle') {
            f.sprintT = 0.65;
            f.sprintHits = new Set();
            world.fx.text(f.x, f.y - f.h - 14, 'WOMBAT SPRINT!', '#ffd23f', 20);
            MG.Audio.whiff();
          }
          if (dir !== 0) { f.tapDir = dir; f.tapT = 0; }
          f.lastDir = dir;
        }
        if (f.sprintT > 0) {
          // bowl over whatever's in the way
          for (const t of world.targets(f.team)) {
            if (!t.alive || f.sprintHits.has(t) || !U.overlap(f.reachBox(30), t.box)) continue;
            f.sprintHits.add(t);
            t.takeHit({ dmg: 7 * f.def.power, kbx: f.facing * 520, kby: -360, stun: 0.5, big: true, from: f, dir: f.facing }, world);
            world.fx.text(t.x, t.box.y - 10, 'BOWLED OVER!', '#ffffff', 18);
          }
        }
      },
      speed(f) { return f.sprintT > 0 ? 2.2 : 1; },
    },

    // Chompers: eats scraps left by knocked-out pests (the campaign drops them; see collect()).
    scavenger: {},

    // Zip: hold jump while falling to glide.
    glide: {
      physics(f, dt, ctrl) {
        f.gliding = !f.onGround && f.vy > 0 && !!ctrl.jump && f.state !== 'hurt' && f.state !== 'ko' && !f.move;
        if (f.gliding) {
          f.vy = Math.min(f.vy, 95);
          const dir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
          if (dir) f.vx = approach(f.vx, dir * f.def.speed * 1.1, 900 * dt);
        }
      },
    },

    // Stripes: every pickup is a Termite Snack: a burst of speed.
    snackSpeed: {
      speed(f) { return f.powers.snack ? 1.35 : 1; },
    },

    // Earl: Ear Radar shows hiding pests (the campaign draws them), and extra damage to rabbits.
    earRadar: {},
    rabbitBane: {},

    // Paddles: a strong swimmer (water zones come with the Cane Fields maps).
    swimmer: {},

    // Benny: double jump.
    doubleJump: {
      jump(f, ctrl, world) {
        if (f.onGround || f.airJumps <= 0) return false;
        f.airJumps--;
        f.vy = -f.def.jump * 0.88;
        f.jumping = true;
        MG.Audio.hop();
        world.fx.burst(f.x, f.y, '#ffffff', 8, 160);
        return true;
      },
    },

    // Drowsy: Power Nap (stand still holding block to doze and heal; hits hurt double while asleep)
    powerNap: {
      update(f, dt, ctrl, world) {
        const still = ctrl.down && f.onGround && Math.abs(f.vx) < 15 && f.state !== 'attack' && f.state !== 'hurt';
        f.napT = still ? (f.napT || 0) + dt : 0;
        f.napping = f.napT > 1;
        if (f.napping) {
          f.heal(7 * dt);
          if (Math.random() < dt * 1.5) world.fx.text(f.x + 20, f.y - f.h - 10, 'Zzz', '#bde0fe', 20);
        }
      },
      hit(f, hit) { if (f.napping) { hit.dmg *= 2; hit.wakeUp = true; } return hit; },
    },

    // Drowsy: climbs the posts of wooden stands (hold jump next to a post).
    climb: {
      update(f, dt, ctrl, world) {
        f.climbing = false;
        if (!ctrl.jump || f.state === 'hurt' || f.state === 'ko') return;
        for (const p of world.platforms || []) {
          const posts = [p.x + 15, p.x + p.w - 15];
          if (f.y > p.y - 2 && posts.some((px) => Math.abs(f.x - px) < 18)) {
            f.vy = -240;
            f.onGround = false;
            f.climbing = true;
            return;
          }
        }
      },
    },

    // Bins: wall cling (against a wall or closed gate in the air), then jump off it.
    wallCling: {
      physics(f, dt, ctrl, world) {
        f.cling = 0;
        if (f.onGround || f.state === 'hurt' || f.state === 'ko' || f.move) return;
        const b = world.bounds(f);
        const atLeft = f.x - f.w / 2 <= b.min + 1, atRight = f.x + f.w / 2 >= b.max - 1;
        if ((atLeft && ctrl.left) || (atRight && ctrl.right)) {
          f.cling = atLeft ? -1 : 1;
          f.vy = Math.min(f.vy, 70);
        }
      },
      jump(f, ctrl, world) {
        if (!f.cling) return false;
        f.vy = -f.def.jump * 0.92;
        f.vx = -f.cling * 420;
        f.facing = -f.cling;
        f.cling = 0;
        f.jumping = true;
        MG.Audio.hop();
        world.fx.text(f.x, f.y - f.h - 10, 'WALL JUMP!', '#ffffff', 16);
        return true;
      },
    },

    // Dead Fred: venom immunity (poison clouds don't hurt him).
    venomImmune: {
      hit(f, hit, world) {
        if (hit.poison) {
          if (Math.random() < 0.2) world.fx.text(f.x, f.y - f.h - 10, 'IMMUNE!', '#9ef01a', 16);
          return 'miss';
        }
        return hit;
      },
    },
  });

  // Run one hook for every ability a fighter has.
  MG.Abilities = {
    each(f, hook, fn) {
      for (const name of f.def.abilities || []) {
        const a = A[name];
        if (a && a[hook]) fn(a[hook]);
      }
    },
    update(f, dt, ctrl, world) { this.each(f, 'update', (h) => h(f, dt, ctrl, world)); },
    physics(f, dt, ctrl, world) { this.each(f, 'physics', (h) => h(f, dt, ctrl, world)); },
    jump(f, ctrl, world) {
      let used = false;
      this.each(f, 'jump', (h) => { if (!used && h(f, ctrl, world)) used = true; });
      return used;
    },
    hit(f, hit, world) {
      let h = hit;
      this.each(f, 'hit', (fn) => { if (h !== 'miss') h = fn(f, h, world); });
      return h;
    },
    speed(f) {
      let k = 1;
      this.each(f, 'speed', (h) => { k *= h(f); });
      return k;
    },
  };
})();
