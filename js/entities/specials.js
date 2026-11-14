// The specials (docs/ROSTER.md), one module each. The fighter calls:
//   start(f, world, m)              once, when the special begins (m = the move: { kind: 'special', id, t, phase })
//   update(f, dt, ctrl, world, m)   every frame; return true when it's finished
//   land(f, world, m)               when the fighter lands during it (optional)
//   pose(f, m) -> art hints         { crouch, screech, dive, dead, glide, holding, basic, big, bigStyle, tongue, hidden }
//   range: [min, max]               distances where the CPU likes to use it
(function () {
  const U = MG.U;
  const approach = (v, target, amt) => (v < target ? Math.min(target, v + amt) : Math.max(target, v - amt));
  // hit everything around the fighter (both sides)
  const around = (f, world, r, h, up = 110) => {
    f.hitList.clear();
    return f.doHits(world, { x: f.x - r, y: f.y - up, w: r * 2, h: up + 12 }, h, true);
  };
  const steer = (f, ctrl, dt, speed) => {
    const dir = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0);
    if (dir) f.vx = approach(f.vx, dir * speed, 900 * dt);
  };

  MG.SPECIALS = {
    // ---- Boomer: a giant leap and a ground pound with two dust shockwaves
    bound: {
      range: [0, 240],
      update(f, dt, ctrl, world, m) {
        if (m.phase === 'start') {
          f.invuln = Math.max(f.invuln, 0.05);
          if (m.t > 0.16) {
            m.phase = 'air'; m.t = 0;
            f.vy = -1250; f.vx = f.facing * 340; f.onGround = false;
            MG.Audio.hop();
            world.fx.burst(f.x, f.y, '#d69669', 12, 220);
          }
        } else if (m.phase === 'air') {
          steer(f, ctrl, dt, 400);
          if (m.t > 2.5) return true;
        } else if (m.phase === 'impact' && m.t > 0.3) return true;
        return false;
      },
      land(f, world, m) {
        if (m.phase !== 'air') return;
        m.phase = 'impact'; m.t = 0;
        MG.Audio.kick(); MG.Audio.thump();
        world.fx.shake(18);
        world.fx.ring(f.x, f.y, 220, '#e3a072');
        world.fx.burst(f.x, f.y, '#d69669', 26, 420);
        world.fx.text(f.x, f.y - f.h - 24, 'KA-THUMP!', '#ff4d6d', 38);
        around(f, world, 190, { dmg: 22, kbx: 420, kby: -620, stun: 0.7, big: true });
        for (const d of [-1, 1]) {
          world.spawn(new MG.Projectile('dust', f.x + d * 60, f.y - 4, d * 600, 0, f.team,
            { dmg: 12, stun: 0.5, kbx: 300, kby: -420, big: true, pierce: true, props: true, ground: true, life: 0.75 }));
        }
      },
      pose(f, m) { return { crouch: m.phase === 'start' ? Math.min(1, m.t / 0.16) : m.phase === 'impact' ? Math.max(0, 1 - m.t / 0.3) : 0 }; },
    },

    // ---- Stinker: a stink cloud; pests inside cough, run away and take damage over time
    stink: {
      range: [0, 200],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.25) {
          m.fired = true;
          world.spawn(new MG.Projectile('stink', f.x + f.facing * 70, f.y - 44, 0, 0, f.team,
            { dmg: 3, tick: 0.5, radius: 130, life: 4.5, poison: true, scare: 1.6, stun: 0.12, kbx: 0, kby: 0, pierce: true, still: true }));
          MG.Audio.hiss();
          world.fx.text(f.x + f.facing * 70, f.y - f.h - 20, 'PHWOAR!', '#9ef01a', 30);
        }
        return m.t > 0.5;
      },
      pose(f, m) { return { crouch: m.t < 0.25 ? 0.4 : 0, basic: m.t > 0.2 ? 1 : 0 }; },
    },

    // ---- Tank: three cube poos that bounce, then sit as little walls pests can't get past
    cubes: {
      range: [100, 480],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.22) {
          m.fired = true;
          for (let i = 0; i < 3; i++) {
            world.spawn(new MG.Projectile('cube', f.x + f.facing * 26, f.y - f.h * 0.7, f.facing * (260 + i * 150), -420 - i * 60, f.team,
              { dmg: 7, stun: 0.4, kbx: 260, kby: -200, gravity: 1500, bounce: 0.3, friction: 4, wall: 6, props: true, life: 7.5 }));
          }
          world.fx.text(f.x, f.y - f.h - 24, 'CUBE BARRAGE!', '#c68642', 24);
        }
        return m.t > 0.55;
      },
      pose(f, m) { return m.fired ? { basic: Math.max(0, 1 - (m.t - 0.22) * 3) } : { holding: 'cube' }; },
    },

    // ---- Chompers: a screech that stuns everyone close, then a three-bite combo
    screech: {
      range: [0, 210],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.1) {
          m.fired = true;
          MG.Audio.screech();
          for (let i = 0; i < 3; i++) world.fx.ring(f.x, f.y - f.h * 0.6, 120 + i * 60, '#ff4d6d');
          world.fx.text(f.x, f.y - f.h - 30, 'SKREEEEE!', '#ff4d6d', 34);
          around(f, world, 210, { dmg: 3, stun: 1.2, kbx: 50, kby: -60 }, 160);
        }
        if (m.t > 0.45 && m.t < 1.25) {
          const tx = world.faceTarget ? world.faceTarget(f) : null;
          if (tx !== null && m.t < 0.55) f.facing = tx > f.x ? 1 : -1;
          if (tx !== null && Math.abs(tx - f.x) > 46) f.vx = f.facing * 420;
          const bite = [0.55, 0.75, 0.95].findIndex((w0) => m.t >= w0 && m.t < w0 + 0.08);
          if (bite >= 0) {
            if (m.bite !== bite) { m.bite = bite; f.hitList.clear(); MG.Audio.whiff(); }
            const last = bite === 2;
            f.doHits(world, f.reachBox(70), last ? { dmg: 10, kbx: 520, kby: -360, stun: 0.6, big: true } : { dmg: 6, kbx: 90, kby: -60, stun: 0.45 });
          }
        }
        return m.t > 1.25;
      },
      pose(f, m) { return m.t < 0.45 ? { screech: true } : { basic: Math.abs(Math.sin((m.t - 0.45) * 16)), basicStyle: 'bite' }; },
    },

    // ---- Zip: up into the air, then a dive bomb that crashes down on pests
    diveBomb: {
      range: [0, 320],
      start(f) { m0(f).phase = f.onGround ? 'rise' : 'dive'; },
      update(f, dt, ctrl, world, m) {
        if (m.phase === 'rise') {
          if (m.t < 0.02) { f.vy = -760; f.onGround = false; MG.Audio.hop(); }
          if (m.t > 0.24) {
            m.phase = 'dive'; m.t = 0; MG.Audio.whiff();
            // aim the dive at the nearest pest (or opponent) in range
            const tx = world.faceTarget ? world.faceTarget(f) : null;
            const fall = Math.max(0.12, (world.groundY - f.y) / 1050);
            m.vx = tx !== null && Math.abs(tx - f.x) < 420 ? U.clamp((tx - f.x) / fall, -820, 820) : f.facing * 560;
            if (m.vx) f.facing = m.vx > 0 ? 1 : -1;
          }
        } else if (m.phase === 'dive') {
          f.vx = m.vx !== undefined ? m.vx : f.facing * 560;
          f.vy = Math.max(f.vy, 1050);
          f.doHits(world, { x: f.x - 26, y: f.y - f.h * 0.7, w: 52, h: f.h * 0.8 }, { dmg: 10, kbx: 380, kby: -320, stun: 0.5, big: true });
          if (m.t > 1.5) return true;
        } else if (m.phase === 'impact' && m.t > 0.25) return true;
        return false;
      },
      land(f, world, m) {
        if (m.phase !== 'dive') return;
        m.phase = 'impact'; m.t = 0;
        f.vx *= 0.2;
        MG.Audio.kick();
        world.fx.shake(10);
        world.fx.ring(f.x, f.y, 140, '#9aa0a8');
        world.fx.text(f.x, f.y - f.h - 20, 'DIVE BOMB!', '#00f5d4', 30);
        around(f, world, 110, { dmg: 16, kbx: 460, kby: -520, stun: 0.6, big: true });
      },
      pose(f, m) { return m.phase === 'dive' ? { dive: true } : m.phase === 'rise' ? { glide: true } : { crouch: Math.max(0, 1 - m.t * 4) }; },
    },

    // ---- Stripes: a long sticky tongue that yanks a pest (or a pickup) over
    tongue: {
      range: [90, 340],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.08) {
          m.fired = true;
          m.proj = new MG.Projectile('tongue', f.x + f.facing * 26, f.y - f.h * 0.62, f.facing * 1300, 0, f.team,
            { dmg: 4, stun: 0.8, kbx: 0, kby: -120, pull: f, grab: true, life: 0.27 });
          world.spawn(m.proj);
          MG.Audio.tone(900, 0.12, 'sine', 0.2, 300);
        }
        return m.fired && m.proj.dead && m.t > 0.32;
      },
      pose() { return { tongue: true, mouth: 'open' }; },
    },

    // ---- Earl: dig in, tunnel along underground, and pop up under a pest
    burrow: {
      range: [0, 340],
      update(f, dt, ctrl, world, m) {
        if (m.phase === 'start') {
          f.vx = 0;
          if (m.t > 0.2) { m.phase = 'under'; m.t = 0; f.burrowed = true; MG.Audio.crate(); world.fx.burst(f.x, f.y, '#9c4a2a', 14, 220); }
        } else if (m.phase === 'under') {
          f.invuln = Math.max(f.invuln, 0.05);
          f.vx = f.facing * 540;
          const under = world.targets(f.team).find((t) => t.alive && !t.isProp && Math.abs(t.x - f.x) < 26 && Math.abs(t.y - f.y) < 60);
          if (under || m.t > 0.6) {
            m.phase = 'pop'; m.t = 0;
            f.burrowed = false;
            f.vx *= 0.2;
            f.vy = -700; f.onGround = false;
            world.fx.burst(f.x, f.y, '#9c4a2a', 22, 360);
            world.fx.text(f.x, f.y - f.h - 20, 'SURPRISE!', '#ffd23f', 30);
            around(f, world, 55, { dmg: 18, kbx: 200, kby: -760, stun: 0.7, big: true }, 130);
          }
        } else if (m.phase === 'pop') {
          if ((f.onGround && m.t > 0.15) || m.t > 1.6) return true;
        }
        return false;
      },
      pose(f, m) { return m.phase === 'start' ? { crouch: Math.min(1, m.t / 0.2) } : m.phase === 'under' ? { hidden: true } : { basic: 1, basicStyle: 'kick' }; },
    },

    // ---- Paddles: a wave of water that rolls along the ground pushing pests away
    splash: {
      range: [0, 420],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.2) {
          m.fired = true;
          world.spawn(new MG.Projectile('wave', f.x + f.facing * 40, f.y - 4, f.facing * 620, 0, f.team,
            { dmg: 8, stun: 0.5, kbx: 760, kby: -300, pierce: true, props: true, ground: true, life: 0.85 }));
          MG.Audio.splash();
          world.fx.text(f.x + f.facing * 60, f.y - f.h - 10, 'SPLOOSH!', '#4cc9f0', 28);
        }
        return m.t > 0.45;
      },
      pose(f, m) { return { basic: m.t > 0.15 ? 1 : m.t / 0.15, basicStyle: 'punch', crouch: 0.2 }; },
    },

    // ---- Benny: a foot thump that calls a mob of wallabies stampeding across the screen
    thumpAlarm: {
      range: [0, 9999],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.2) {
          m.fired = true;
          MG.Audio.thump();
          world.fx.ring(f.x, f.y, 150, '#c9b48a');
          world.fx.shake(6);
          around(f, world, 120, { dmg: 6, kbx: 200, kby: -420, stun: 0.4 }, 60);
          const view = world.view ? world.view() : { min: 0, max: MG.W };
          for (let i = 0; i < 4; i++) {
            const x = f.facing > 0 ? view.min - 60 - i * 80 : view.max + 60 + i * 80;
            world.spawn(new MG.Projectile('wallaby', x, world.groundY, f.facing * 980, 0, f.team,
              { dmg: 10, stun: 0.5, kbx: 600, kby: -420, big: true, pierce: true, props: true, ground: true, life: 2.4 }));
          }
          world.fx.text(f.x, f.y - f.h - 30, 'WALLABY STAMPEDE!', '#ffd23f', 28);
        }
        return m.t > 0.45;
      },
      pose(f, m) { return { kick: m.t < 0.25 ? m.t / 0.25 * 0.6 : 0.6 }; },
    },

    // ---- Drowsy: a deep, loud bellow; a shockwave of sound all around
    bellow: {
      range: [0, 260],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.3) {
          m.fired = true;
          MG.Audio.bellow();
          for (let i = 0; i < 3; i++) world.fx.ring(f.x, f.y - f.h * 0.6, 140 + i * 80, i % 2 ? '#bde0fe' : '#ffffff');
          world.fx.shake(12);
          world.fx.text(f.x, f.y - f.h - 30, 'BELLOOOOW!', '#bde0fe', 34);
          around(f, world, 260, { dmg: 13, kbx: 620, kby: -380, stun: 0.6, big: true }, 200);
        }
        return m.t > 0.7;
      },
      pose(f, m) { return { screech: m.t > 0.15 }; },
    },

    // ---- Bins: throws a wheelie bin that bounces and rolls
    binFling: {
      range: [60, 520],
      update(f, dt, ctrl, world, m) {
        if (!m.fired && m.t > 0.22) {
          m.fired = true;
          world.spawn(new MG.Projectile('bin', f.x + f.facing * 30, f.y - f.h * 0.75, f.facing * 560, -360, f.team,
            { dmg: 18, stun: 0.6, kbx: 640, kby: -420, big: true, gravity: 1500, bounce: 0.25, friction: 1.2, props: true, life: 1.9, pierce: true }));
          world.fx.text(f.x, f.y - f.h - 24, 'BIN DAY!', '#52b788', 28);
          MG.Audio.whiff();
        }
        return m.t > 0.5;
      },
      pose(f, m) { return m.fired ? { basic: 1, basicStyle: 'punch' } : { holding: 'bin' }; },
    },

    // ---- Dead Fred: play dead (nothing can hurt him and pests lose interest), then a surprise chomp
    playDead: {
      range: [0, 170],
      update(f, dt, ctrl, world, m) {
        if (m.phase === 'start') {
          f.playingDead = true;
          f.vx = approach(f.vx, 0, 2000 * dt);
          if (!m.said) { m.said = true; world.fx.text(f.x, f.y - 60, 'x_x', '#ffffff', 24); MG.Audio.ko(); }
          if (m.t > 1.6) {
            m.phase = 'surprise'; m.t = 0;
            f.playingDead = false;
            f.vy = -420; f.onGround = false;
            world.fx.text(f.x, f.y - f.h - 20, 'SURPRISE!', '#ffd23f', 32);
            MG.Audio.screech();
            around(f, world, 130, { dmg: 20, kbx: 480, kby: -500, stun: 0.6, big: true });
          }
        } else if (m.t > 0.45) return true;
        return false;
      },
      pose(f, m) { return m.phase === 'start' ? { dead: true } : { big: 1, bigStyle: 'grinChomp' }; },
    },

    // ---- Ghost (secret): fades out and streaks straight through everything in front, biting on the way
    phantomDash: {
      range: [0, 380],
      update(f, dt, ctrl, world, m) {
        if (m.phase === undefined || m.phase === 'start') {
          if (!m.fade) { m.fade = true; f.phantom = true; world.fx.text(f.x, f.y - f.h - 20, 'PHANTOM DASH!', '#bde0fe', 28); MG.Audio.whiff(); }
          f.vx = 0;
          if (m.t > 0.15) { m.phase = 'dash'; m.t = 0; f.hitList.clear(); }
        } else if (m.phase === 'dash') {
          f.invuln = Math.max(f.invuln, 0.05);
          f.vx = f.facing * 900;
          f.doHits(world, { x: f.x - 30, y: f.y - f.h, w: 60, h: f.h }, { dmg: 14, kbx: 300, kby: -380, stun: 0.6, big: true });
          if (Math.random() < dt * 30) world.fx.burst(f.x - f.facing * 20, f.y - f.h * 0.5, '#bde0fe', 2, 80);
          if (m.t > 0.42) { m.phase = 'end'; m.t = 0; f.vx = f.facing * 120; }
        } else if (m.t > 0.2) { f.phantom = false; return true; }
        return false;
      },
      pose(f, m) { return m.phase === 'dash' ? { big: 1, bigStyle: 'wideJaw' } : { crouch: 0.5 }; },
    },

    // ---- Cousin Cuscus (secret): a flurry of Sloth-Slap-style slaps, then one enormous one
    slapStorm: {
      range: [0, 150],
      update(f, dt, ctrl, world, m) {
        f.vx = approach(f.vx, 0, 1600 * dt);
        m.n = m.n || 0;
        if (m.t > 0.12 && m.n < 8) {
          m.t = 0; m.n++;
          f.hitList.clear();
          f.doHits(world, { x: f.facing > 0 ? f.x : f.x - 110, y: f.y - f.h, w: 110, h: f.h }, { dmg: 4, kbx: 90, kby: -60, stun: 0.3 });
          world.fx.text(f.x + f.facing * U.rand(40, 90), f.y - f.h * U.rand(0.4, 1), 'SLAP!', '#ffd23f', 16);
          MG.Audio.jab();
        } else if (m.n >= 8 && !m.big && m.t > 0.2) {
          m.big = true; m.t = 0;
          f.hitList.clear();
          f.doHits(world, { x: f.facing > 0 ? f.x : f.x - 130, y: f.y - f.h - 10, w: 130, h: f.h + 10 }, { dmg: 22, kbx: 820, kby: -520, stun: 0.8, big: true });
          world.fx.text(f.x + f.facing * 70, f.y - f.h - 30, 'SLAP STORM!', '#ff4d6d', 32);
          world.fx.shake(12);
          MG.Audio.kick();
        } else if (m.big && m.t > 0.35) return true;
        return false;
      },
      pose(f, m) { return m.big ? { big: 1, bigStyle: 'megaSlap' } : { basic: (m.n || 0) % 2 ? 1 : 0.4, basicStyle: 'slap' }; },
    },
  };

  // (diveBomb.start needs the move object: the fighter sets f.move before calling start)
  function m0(f) { return f.move; }
})();
