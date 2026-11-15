// Emberforge — the things that move: the smith, her bolts, the creatures
// of the Ashen Vale, and the embers they drop. Factories only; the world
// owns the lists and decides what happens when they meet.

import { ENEMIES, PLAYER, VIEW } from './config.js';

export function makePlayer() {
  return {
    x: VIEW.width / 2,
    y: VIEW.height - 110,
    radius: PLAYER.radius,
    speed: PLAYER.speed,
    hp: PLAYER.maxHp,
    maxHp: PLAYER.maxHp,
    fireInterval: PLAYER.fireInterval,
    fireTimer: 0,
    bulletSpeed: PLAYER.bulletSpeed,
    bulletDamage: PLAYER.bulletDamage,
    projectiles: 1,
    pickupRadius: PLAYER.pickupRadius,
    dashCooldownMax: PLAYER.dashCooldown,
    dashCooldown: 0,
    dashTime: 0,
    dashX: 0,
    dashY: 0,
    invuln: 0,
    aimX: VIEW.width / 2,
    aimY: 0,
    facing: -Math.PI / 2,
    walkPhase: 0,
  };
}

export function makeBullet(x, y, angle, speed, damage) {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 5,
    damage,
    life: 1.4,
    kind: 'bolt',
  };
}

export function makeEnemyBullet(x, y, angle, speed) {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 6,
    damage: 1,
    life: 4,
    kind: 'cinder',
  };
}

let enemyId = 0;

export function makeEnemy(kind, x, y, wave) {
  const base = ENEMIES[kind];
  const hpScale = 1 + (wave - 1) * 0.14;
  const speedScale = 1 + (wave - 1) * 0.03;
  const enemy = {
    id: enemyId += 1,
    kind,
    x,
    y,
    radius: base.radius,
    hp: Math.round(base.hp * hpScale),
    maxHp: Math.round(base.hp * hpScale),
    speed: base.speed * speedScale,
    score: base.score,
    embers: base.embers,
    damage: base.damage,
    color: base.color,
    phase: Math.random() * Math.PI * 2,
    wobble: 0,
    shootTimer: 1.5 + Math.random() * 1.5,
    flash: 0,
    split: kind === 'golem',
  };
  if (kind === 'wyrm') {
    enemy.hp = base.hp;
    enemy.maxHp = base.hp;
    enemy.shootTimer = 1.2;
  }
  return enemy;
}

export function makePickup(kind, x, y, value) {
  return {
    kind,
    x,
    y,
    value,
    vx: (Math.random() - 0.5) * 40,
    vy: 30 + Math.random() * 40,
    life: 9,
    phase: Math.random() * Math.PI * 2,
    radius: kind === 'heart' ? 11 : 8,
  };
}

export function spawnEdgePosition(rng, margin) {
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: margin + rng() * (VIEW.width - margin * 2), y: -30 };
  if (side === 1) return { x: margin + rng() * (VIEW.width - margin * 2), y: VIEW.height + 30 };
  if (side === 2) return { x: -30, y: margin + rng() * (VIEW.height - margin * 2) };
  return { x: VIEW.width + 30, y: margin + rng() * (VIEW.height - margin * 2) };
}
