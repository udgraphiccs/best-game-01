// Emberforge — the game itself: states, waves, movement, collisions,
// pickups, the forge between waves, and the win/lose arc.

import {
  PALETTE, PLAYER, SCORE, STORAGE_BEST, TOTAL_WAVES, UPGRADES,
  UPGRADE_COSTS, VIEW, WAVES,
} from './config.js';
import { makeBullet, makeEnemy, makeEnemyBullet, makePickup, makePlayer, spawnEdgePosition } from './entities.js';
import { mulberry32 } from './random.js';

export const STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  FORGE: 'forge',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
};

export function createWorld(audio, particles) {
  const world = {
    state: STATES.TITLE,
    particles,
    audio,
    wave: 0,
    score: 0,
    embers: 0,
    kills: 0,
    timePlayed: 0,
    best: 0,
    player: makePlayer(),
    enemies: [],
    bullets: [],
    enemyBullets: [],
    pickups: [],
    spawnQueue: [],
    spawnTimer: 0,
    waveBanner: 0,
    waveBannerText: '',
    boss: null,
    forgeChoices: [],
    forgeBought: false,
    rng: mulberry32(20261115),
    muted: false,
    message: '',
    messageTimer: 0,
  };

  try {
    world.best = Number(window.localStorage.getItem(STORAGE_BEST) || 0) || 0;
  } catch {
    world.best = 0;
  }

  function saveBest() {
    if (world.score > world.best) {
      world.best = world.score;
      try {
        window.localStorage.setItem(STORAGE_BEST, String(world.best));
      } catch {
        // Best score is a nicety; a blocked localStorage must not break play.
      }
    }
  }

  function queueWave(n) {
    const plan = WAVES[n - 1];
    const queue = [];
    for (let i = 0; i < plan.imps; i += 1) queue.push('imp');
    for (let i = 0; i < plan.bats; i += 1) queue.push('bat');
    for (let i = 0; i < plan.golems; i += 1) queue.push('golem');
    for (let i = 0; i < plan.wisps; i += 1) queue.push('wisp');
    // Shuffle so the trickle is mixed, not one kind at a time.
    for (let i = queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(world.rng() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    world.spawnQueue = queue;
    world.spawnTimer = 0.6;
    if (plan.boss) {
      const boss = makeEnemy('wyrm', VIEW.width / 2, -60, n);
      boss.y = 120;
      world.enemies.push(boss);
      world.boss = boss;
      audio.bossRoar();
      setMessage('THE EMBER WYRM AWAKENS', 2.6);
    }
  }

  function startWave(n) {
    world.wave = n;
    world.enemies = [];
    world.enemyBullets = [];
    world.bullets = [];
    world.boss = null;
    queueWave(n);
    world.waveBanner = 2.4;
    world.waveBannerText = n === TOTAL_WAVES ? 'FINAL WAVE — THE EMBER WYRM' : `WAVE ${n} OF ${TOTAL_WAVES}`;
    audio.waveHorn();
  }

  function startGame() {
    world.player = makePlayer();
    world.enemies = [];
    world.bullets = [];
    world.enemyBullets = [];
    world.pickups = [];
    world.score = 0;
    world.embers = 0;
    world.kills = 0;
    world.timePlayed = 0;
    world.forgeBought = false;
    world.state = STATES.PLAYING;
    audio.startMusic();
    startWave(1);
  }

  function setMessage(text, seconds) {
    world.message = text;
    world.messageTimer = seconds;
  }

  function offerForge() {
    const owned = world.player.upgrades || (world.player.upgrades = {});
    const available = UPGRADES.filter((u) => (owned[u.id] || 0) < u.max);
    const choices = [];
    const pool = [...available];
    while (choices.length < 3 && pool.length > 0) {
      const i = Math.floor(world.rng() * pool.length);
      choices.push(pool.splice(i, 1)[0]);
    }
    world.forgeChoices = choices;
    world.forgeBought = false;
    world.state = STATES.FORGE;
  }

  function buyUpgrade(index) {
    const upgrade = world.forgeChoices[index];
    if (!upgrade || world.forgeBought) return false;
    const owned = world.player.upgrades || (world.player.upgrades = {});
    const level = owned[upgrade.id] || 0;
    const cost = UPGRADE_COSTS[Math.min(level, UPGRADE_COSTS.length - 1)];
    if (world.embers < cost) {
      setMessage('Not enough embers for that forging.', 1.6);
      return false;
    }
    world.embers -= cost;
    owned[upgrade.id] = level + 1;
    upgrade.apply(world.player);
    world.forgeBought = true;
    audio.pickup();
    particles.ring(world.player.x, world.player.y, PALETTE.gold);
    world.state = STATES.PLAYING;
    startWave(world.wave + 1);
    return true;
  }

  function skipForge() {
    if (world.forgeBought) return;
    world.state = STATES.PLAYING;
    startWave(world.wave + 1);
  }

  function dropPickups(enemy) {
    for (let i = 0; i < enemy.embers; i += 1) {
      world.pickups.push(makePickup('ember', enemy.x, enemy.y, 1));
    }
    if (enemy.kind === 'golem' && world.rng() < 0.55) {
      world.pickups.push(makePickup('heart', enemy.x, enemy.y, 1));
    }
    if (enemy.kind === 'wyrm') {
      for (let i = 0; i < 5; i += 1) world.pickups.push(makePickup('heart', enemy.x, enemy.y, 1));
    }
  }

  function killEnemy(enemy, index) {
    world.enemies.splice(index, 1);
    world.kills += 1;
    world.score += enemy.score;
    particles.burst(enemy.x, enemy.y, enemy.color, enemy.kind === 'wyrm' ? 90 : 22, 260, 0.7);
    particles.floatText(enemy.x, enemy.y - 10, `+${enemy.score}`, PALETTE.gold);
    particles.addShake(enemy.kind === 'wyrm' ? 12 : 3);
    audio.explode();
    dropPickups(enemy);
    if (enemy.split) {
      for (let i = 0; i < 2; i += 1) {
        const imp = makeEnemy('imp', enemy.x + (i === 0 ? -24 : 24), enemy.y, world.wave);
        world.enemies.push(imp);
      }
    }
    if (enemy.kind === 'wyrm') {
      world.boss = null;
      world.score += SCORE.bossBonus;
      saveBest();
      world.state = STATES.VICTORY;
      audio.stopMusic();
      audio.victory();
    }
  }

  function hurtPlayer(damage) {
    const p = world.player;
    if (p.invuln > 0 || world.state !== STATES.PLAYING) return;
    p.hp -= damage;
    p.invuln = PLAYER.invulnTime;
    particles.burst(p.x, p.y, PALETTE.danger, 26, 300, 0.6);
    particles.addShake(9);
    audio.hurt();
    if (p.hp <= 0) {
      p.hp = 0;
      saveBest();
      world.state = STATES.DEFEAT;
      audio.stopMusic();
      audio.defeat();
    }
  }

  function fireBolt(p, angle) {
    const spread = 0.09;
    for (let i = 0; i < p.projectiles; i += 1) {
      const offset = p.projectiles === 1 ? 0 : (i - (p.projectiles - 1) / 2) * spread;
      const bx = p.x + Math.cos(angle) * (p.radius + 6);
      const by = p.y + Math.sin(angle) * (p.radius + 6);
      world.bullets.push(makeBullet(bx, by, angle + offset, p.bulletSpeed, p.bulletDamage));
    }
    audio.shoot();
    particles.trail(p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20, PALETTE.ember);
  }

  function updatePlaying(dt, input) {
    const p = world.player;
    world.timePlayed += dt;
    if (world.waveBanner > 0) world.waveBanner -= dt;
    if (world.messageTimer > 0) world.messageTimer -= dt;

    // Movement, with a dash on Space / Shift.
    const axis = input.moveAxis();
    if (input.wasPressed('Space') || input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight')) {
      if (p.dashCooldown <= 0 && (axis.x !== 0 || axis.y !== 0)) {
        p.dashTime = PLAYER.dashTime;
        p.dashX = axis.x;
        p.dashY = axis.y;
        p.dashCooldown = p.dashCooldownMax;
        audio.dash();
        particles.trail(p.x, p.y, PALETTE.ice);
      }
    }
    if (p.dashTime > 0) {
      p.dashTime -= dt;
      p.x += p.dashX * PLAYER.dashSpeed * dt;
      p.y += p.dashY * PLAYER.dashSpeed * dt;
      particles.trail(p.x, p.y, PALETTE.ice);
    } else {
      p.x += axis.x * p.speed * dt;
      p.y += axis.y * p.speed * dt;
    }
    p.x = Math.max(p.radius, Math.min(VIEW.width - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(VIEW.height - p.radius, p.y));
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.walkPhase += dt * (axis.x !== 0 || axis.y !== 0 ? 11 : 0);

    // Aim at the mouse; hold the button (or J) to fire.
    p.aimX = input.mouseX;
    p.aimY = input.mouseY;
    p.facing = Math.atan2(p.aimY - p.y, p.aimX - p.x);
    p.fireTimer -= dt;
    if ((input.mouseDown || input.isDown('KeyJ')) && p.fireTimer <= 0) {
      p.fireTimer = p.fireInterval;
      fireBolt(p, p.facing);
    }

    // Spawn the wave's trickle.
    if (world.spawnQueue.length > 0) {
      world.spawnTimer -= dt;
      if (world.spawnTimer <= 0) {
        world.spawnTimer = WAVES[world.wave - 1].interval;
        const kind = world.spawnQueue.shift();
        const pos = spawnEdgePosition(world.rng, 60);
        world.enemies.push(makeEnemy(kind, pos.x, pos.y, world.wave));
      }
    } else if (world.enemies.length === 0 && !world.boss) {
      world.score += SCORE.waveClear;
      if (world.wave >= TOTAL_WAVES) return;
      offerForge();
      return;
    }

    // Enemies chase, wobble and shoot.
    for (const e of world.enemies) {
      e.flash = Math.max(0, e.flash - dt * 6);
      e.phase += dt;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      let mx = dx / dist;
      let my = dy / dist;
      if (e.kind === 'bat') {
        const wob = Math.sin(e.phase * 5) * 0.9;
        const px = -my * wob;
        const py = mx * wob;
        mx += px;
        my += py;
        const len = Math.hypot(mx, my) || 1;
        mx /= len;
        my /= len;
      }
      if (e.kind === 'wisp') {
        // Wisps keep their distance and strafe while they charge a shot.
        const want = 240;
        const radial = dist < want ? -1 : 0.4;
        mx = (dx / dist) * radial + (-dy / dist) * 0.7;
        my = (dy / dist) * radial + (dx / dist) * 0.7;
        const len = Math.hypot(mx, my) || 1;
        mx /= len;
        my /= len;
      }
      if (e.kind === 'wyrm') {
        // The wyrm circles the arena and spits ember rings.
        e.wobble += dt;
        const cx = VIEW.width / 2;
        const cy = 150;
        const ang = e.wobble * 0.7;
        const tx = cx + Math.cos(ang) * 300;
        const ty = cy + Math.sin(ang) * 70;
        mx = (tx - e.x) / Math.max(1, Math.hypot(tx - e.x, ty - e.y));
        my = (ty - e.y) / Math.max(1, Math.hypot(tx - e.x, ty - e.y));
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 1.6;
          const ring = 10;
          for (let i = 0; i < ring; i += 1) {
            const a = (i / ring) * Math.PI * 2 + e.wobble;
            world.enemyBullets.push(makeEnemyBullet(e.x, e.y, a, 130));
          }
          audio.hit();
        }
      } else if (e.kind === 'wisp') {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0 && dist < 420) {
          e.shootTimer = 2.4;
          world.enemyBullets.push(makeEnemyBullet(e.x, e.y, Math.atan2(dy, dx), 170));
          audio.hit();
        }
      }
      e.x += mx * e.speed * dt;
      e.y += my * e.speed * dt;

      // Touching the smith hurts her.
      if (dist < e.radius + p.radius - 2) hurtPlayer(e.damage);
    }

    // Player bolts.
    for (let i = world.bullets.length - 1; i >= 0; i -= 1) {
      const b = world.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -20 || b.x > VIEW.width + 20 || b.y < -20 || b.y > VIEW.height + 20) {
        world.bullets.splice(i, 1);
        continue;
      }
      for (let j = world.enemies.length - 1; j >= 0; j -= 1) {
        const e = world.enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
          e.hp -= b.damage;
          e.flash = 1;
          particles.burst(b.x, b.y, PALETTE.emberCore, 5, 140, 0.3);
          audio.hit();
          world.bullets.splice(i, 1);
          if (e.hp <= 0) killEnemy(e, j);
          break;
        }
      }
    }

    // Enemy cinders.
    for (let i = world.enemyBullets.length - 1; i >= 0; i -= 1) {
      const b = world.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -20 || b.x > VIEW.width + 20 || b.y < -20 || b.y > VIEW.height + 20) {
        world.enemyBullets.splice(i, 1);
        continue;
      }
      if (Math.hypot(b.x - p.x, b.y - p.y) < b.radius + p.radius - 4) {
        world.enemyBullets.splice(i, 1);
        hurtPlayer(b.damage);
      }
    }

    // Pickups drift, then fly to the smith when she is near.
    for (let i = world.pickups.length - 1; i >= 0; i -= 1) {
      const pk = world.pickups[i];
      pk.life -= dt;
      pk.phase += dt * 4;
      if (pk.life <= 0) {
        world.pickups.splice(i, 1);
        continue;
      }
      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < p.pickupRadius) {
        pk.x += (dx / dist) * 420 * dt;
        pk.y += (dy / dist) * 420 * dt;
      } else {
        pk.x += pk.vx * dt;
        pk.y += pk.vy * dt;
        pk.vx *= 0.98;
        pk.vy *= 0.98;
      }
      if (dist < p.radius + pk.radius + 2) {
        if (pk.kind === 'ember') {
          world.embers += pk.value;
          audio.pickup();
          particles.burst(pk.x, pk.y, PALETTE.gold, 4, 90, 0.3);
        } else {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          audio.heart();
          particles.floatText(pk.x, pk.y - 8, '+1 ♥', PALETTE.heart);
        }
        world.pickups.splice(i, 1);
      }
    }

    particles.update(dt);
  }

  function update(dt, input) {
    if (input.wasPressed('KeyM')) {
      world.muted = audio.toggleMute();
    }
    if (world.state === STATES.TITLE) {
      if (input.wasPressed('Enter') || input.wasPressed('Space') || input.consumeClick()) {
        audio.unlock();
        startGame();
      }
      particles.update(dt);
      return;
    }
    if (world.state === STATES.FORGE) {
      const click = input.consumeClick();
      if (click) {
        const choice = forgeCardAt(click.x, click.y);
        if (choice >= 0) buyUpgrade(choice);
        else if (click.y > VIEW.height - 84) skipForge();
      }
      if (input.wasPressed('Digit1')) buyUpgrade(0);
      if (input.wasPressed('Digit2')) buyUpgrade(1);
      if (input.wasPressed('Digit3')) buyUpgrade(2);
      if (input.wasPressed('Enter')) skipForge();
      particles.update(dt);
      return;
    }
    if (world.state === STATES.VICTORY || world.state === STATES.DEFEAT) {
      if (input.wasPressed('Enter') || input.wasPressed('Space') || input.consumeClick()) {
        world.state = STATES.TITLE;
      }
      if (input.wasPressed('KeyR')) startGame();
      particles.update(dt);
      return;
    }
    updatePlaying(dt, input);
  }

  // Forge cards sit in a row across the middle of the screen.
  function forgeCardAt(x, y) {
    const cardW = 250;
    const cardH = 210;
    const gap = 24;
    const total = cardW * 3 + gap * 2;
    const x0 = (VIEW.width - total) / 2;
    const y0 = 190;
    for (let i = 0; i < world.forgeChoices.length; i += 1) {
      const cx = x0 + i * (cardW + gap);
      if (x >= cx && x <= cx + cardW && y >= y0 && y <= y0 + cardH) return i;
    }
    return -1;
  }

  // Deterministic staged scenes for screenshots: same seed, same picture.
  function stageShot(shot) {
    const rng = mulberry32(777);
    world.rng = rng;
    if (shot === 'start') {
      world.state = STATES.TITLE;
      return;
    }
    if (shot === 'forge') {
      world.state = STATES.PLAYING;
      startGameSilent();
      world.wave = 3;
      world.score = 1450;
      world.embers = 24;
      world.kills = 31;
      offerForge();
      return;
    }
    if (shot === 'win') {
      world.state = STATES.PLAYING;
      startGameSilent();
      world.score = 12840;
      world.embers = 41;
      world.kills = 187;
      world.timePlayed = 512;
      world.wave = TOTAL_WAVES;
      saveBest();
      world.state = STATES.VICTORY;
      return;
    }
    if (shot === 'lose') {
      world.state = STATES.PLAYING;
      startGameSilent();
      world.score = 2340;
      world.embers = 9;
      world.kills = 52;
      world.timePlayed = 268;
      world.wave = 6;
      world.player.hp = 0;
      saveBest();
      world.state = STATES.DEFEAT;
      return;
    }
    // 'play': a busy mid-wave-4 fight.
    world.state = STATES.PLAYING;
    startGameSilent();
    world.wave = 4;
    world.score = 2190;
    world.embers = 17;
    world.kills = 43;
    world.timePlayed = 143;
    world.player.x = 430;
    world.player.y = 380;
    world.player.aimX = 640;
    world.player.aimY = 220;
    world.player.facing = Math.atan2(220 - 380, 640 - 430);
    const kinds = ['imp', 'bat', 'golem', 'wisp', 'imp', 'bat', 'wisp', 'imp'];
    const spots = [
      [640, 220], [720, 300], [300, 160], [540, 120], [820, 420], [180, 420], [700, 480], [380, 300],
    ];
    for (let i = 0; i < kinds.length; i += 1) {
      const e = makeEnemy(kinds[i], spots[i][0], spots[i][1], 4);
      world.enemies.push(e);
    }
    for (let i = 0; i < 4; i += 1) {
      world.bullets.push(makeBullet(480 + i * 46, 350 - i * 34, -0.6, 560, 1));
    }
    world.pickups.push(makePickup('ember', 520, 430, 1));
    world.pickups.push(makePickup('ember', 560, 450, 1));
    world.pickups.push(makePickup('heart', 350, 470, 1));
    particles.burst(640, 220, PALETTE.emberHot, 18, 220, 0.6);
    particles.burst(300, 160, '#9fb4c7', 12, 180, 0.6);
    world.waveBanner = 0;
  }

  function startGameSilent() {
    world.player = makePlayer();
    world.enemies = [];
    world.bullets = [];
    world.enemyBullets = [];
    world.pickups = [];
    world.score = 0;
    world.embers = 0;
    world.kills = 0;
    world.timePlayed = 0;
    world.forgeBought = false;
    world.state = STATES.PLAYING;
  }

  world.startGame = startGame;
  world.update = update;
  world.buyUpgrade = buyUpgrade;
  world.skipForge = skipForge;
  world.forgeCardAt = forgeCardAt;
  world.stageShot = stageShot;
  world.saveBest = saveBest;
  return world;
}
