// Emberforge — tuning, palette, waves and forge upgrades.
// One file, one job: every number the game balances on lives here.

export const VIEW = { width: 960, height: 600 };

export const PALETTE = {
  bgTop: '#1a1030',
  bgMid: '#241640',
  bgBottom: '#0d0819',
  floor: '#2c1e4e',
  ember: '#ffb347',
  emberHot: '#ff7b2f',
  emberCore: '#ffe9a8',
  ice: '#7fe7ff',
  leaf: '#8dff9e',
  heart: '#ff5d7a',
  ink: '#f4ecff',
  dim: '#b9a8d8',
  danger: '#ff4d5e',
  gold: '#ffd76a',
};

export const PLAYER = {
  radius: 16,
  speed: 265,
  maxHp: 5,
  fireInterval: 0.22,
  bulletSpeed: 560,
  bulletDamage: 1,
  dashSpeed: 720,
  dashTime: 0.16,
  dashCooldown: 1.6,
  pickupRadius: 54,
  invulnTime: 1.0,
};

export const ENEMIES = {
  imp: { hp: 2, speed: 78, radius: 14, score: 50, embers: 2, damage: 1, color: '#ff8a5c' },
  bat: { hp: 1, speed: 165, radius: 11, score: 80, embers: 2, damage: 1, color: '#c98cff' },
  golem: { hp: 9, speed: 42, radius: 26, score: 200, embers: 6, damage: 2, color: '#9fb4c7' },
  wisp: { hp: 3, speed: 110, radius: 12, score: 120, embers: 3, damage: 1, color: '#7fe7ff' },
  wyrm: { hp: 220, speed: 55, radius: 46, score: 5000, embers: 40, damage: 2, color: '#ff4d5e' },
};

// Wave plan: which kinds spawn, how many, and how fast they trickle in.
// Wave 10 is the boss wave: the Ember Wyrm plus a thin escort of imps.
export const WAVES = [
  { imps: 6, bats: 0, golems: 0, wisps: 0, interval: 1.15 },
  { imps: 8, bats: 4, golems: 0, wisps: 0, interval: 1.05 },
  { imps: 10, bats: 6, golems: 1, wisps: 0, interval: 0.95 },
  { imps: 10, bats: 8, golems: 2, wisps: 3, interval: 0.9 },
  { imps: 12, bats: 10, golems: 2, wisps: 5, interval: 0.85 },
  { imps: 14, bats: 12, golems: 3, wisps: 6, interval: 0.8 },
  { imps: 14, bats: 14, golems: 4, wisps: 8, interval: 0.75 },
  { imps: 16, bats: 16, golems: 5, wisps: 9, interval: 0.7 },
  { imps: 18, bats: 18, golems: 6, wisps: 10, interval: 0.65 },
  { imps: 8, bats: 6, golems: 2, wisps: 4, interval: 0.9, boss: true },
];

export const TOTAL_WAVES = WAVES.length;

// Forge upgrades offered between waves. Each has a level cap; the forge
// shows three at a time and the player picks one with a click or keys 1-3.
export const UPGRADES = [
  {
    id: 'rapid',
    name: 'Rapid Forge',
    desc: 'Hammer strikes 18% faster.',
    max: 4,
    apply: (p) => { p.fireInterval *= 0.82; },
  },
  {
    id: 'twin',
    name: 'Twin Barrels',
    desc: 'Fire one extra ember bolt per shot.',
    max: 3,
    apply: (p) => { p.projectiles += 1; },
  },
  {
    id: 'aegis',
    name: 'Aegis Plating',
    desc: '+1 max heart and mend 2 hearts.',
    max: 3,
    apply: (p) => { p.maxHp += 1; p.hp = Math.min(p.maxHp, p.hp + 2); },
  },
  {
    id: 'magnet',
    name: 'Magnet Coil',
    desc: 'Embers fly to you from 70% further away.',
    max: 3,
    apply: (p) => { p.pickupRadius *= 1.7; },
  },
  {
    id: 'swift',
    name: 'Swift Boots',
    desc: 'Move 15% faster and dash recharges sooner.',
    max: 3,
    apply: (p) => { p.speed *= 1.15; p.dashCooldownMax *= 0.85; },
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    desc: 'Bolts hit 50% harder.',
    max: 4,
    apply: (p) => { p.bulletDamage += 0.5; },
  },
];

export const UPGRADE_COSTS = [6, 10, 15, 22];

export const SCORE = {
  waveClear: 250,
  bossBonus: 2000,
};

export const STORAGE_BEST = 'emberforge.best';
