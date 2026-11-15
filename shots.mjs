// Emberforge play-test + screenshots (run from the repo root):
//   node shots.mjs
// Serves game/ on localhost, opens it in headless Chromium, plays wave 1
// with a scripted bot, checks the forge / defeat / restart loop, and takes
// 4 screenshots of the game's own code into screenshots/.

import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 8123;
const BASE = `http://127.0.0.1:${PORT}`;

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: here, stdio: 'pipe' });
await new Promise((resolve) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes(String(PORT))) resolve();
  });
  setTimeout(resolve, 5000);
});

const exe = process.env.CHROMIUM_EXE
  || '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const consoleErrors = [];
const badRequests = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(String(err)));
page.on('request', (req) => {
  const url = req.url();
  if (!url.startsWith(BASE) && !url.startsWith('data:')) badRequests.push(url);
});
page.on('requestfailed', (req) => badRequests.push(`FAILED ${req.url()}`));

const state = () => page.evaluate(() => {
  const w = window.__emberforge.world;
  return {
    state: w.state, wave: w.wave, score: w.score, embers: w.embers,
    kills: w.kills, hp: w.player.hp, enemies: w.enemies.length,
    bullets: w.bullets.length, pickups: w.pickups.length,
  };
});

function check(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) process.exitCode = 1;
}

// --- 1. Title screen loads with no errors ---
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
let s = await state();
check('title screen shows', s.state === 'title');
check('no console errors on load', consoleErrors.length === 0);
check('no network requests', badRequests.length === 0);

// --- 2. Start and play wave 1 with a simple bot ---
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
s = await state();
check('Enter starts the game', s.state === 'playing' && s.wave === 1);

await page.mouse.move(640, 300);
await page.mouse.down();
const t0 = Date.now();
while (Date.now() - t0 < 45000) {
  // Aim at the nearest enemy; wiggle with WASD so the smith keeps moving.
  const target = await page.evaluate(() => {
    const w = window.__emberforge.world;
    const p = w.player;
    if (!w.enemies.length) return null;
    let best = null;
    let bd = 1e9;
    for (const e of w.enemies) {
      const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best ? { x: best.x, y: best.y, px: p.x, py: p.y } : null;
  });
  if (target) {
    const rect = await page.evaluate(() => {
      const r = document.getElementById('game').getBoundingClientRect();
      return { left: r.left, top: r.top, w: r.width, h: r.height };
    });
    const sx = rect.left + (target.x / 960) * rect.w;
    const sy = rect.top + (target.y / 600) * rect.h;
    await page.mouse.move(sx, sy);
    // Keep moving away from the nearest enemy a little.
    const away = target.px < target.x ? 'KeyA' : 'KeyD';
    await page.keyboard.down(away);
    await page.waitForTimeout(120);
    await page.keyboard.up(away);
  } else {
    await page.waitForTimeout(200);
  }
  s = await state();
  if (s.state === 'forge') break;
}
await page.mouse.up();
s = await state();
console.log('after wave 1:', JSON.stringify(s));
check('wave 1 cleared into the forge', s.state === 'forge');
check('kills and score recorded', s.kills > 0 && s.score > 0);
check('embers earned', s.embers > 0);

// --- 3. Buy an upgrade, wave 2 starts ---
await page.keyboard.press('Digit1');
await page.waitForTimeout(400);
s = await state();
check('forge purchase starts wave 2', s.state === 'playing' && s.wave === 2);

// --- 4. Defeat path: drop an imp on the smith, then restart with R ---
await page.evaluate(() => {
  const w = window.__emberforge.world;
  w.player.hp = 1;
  w.player.invuln = 0;
  w.enemies.push({
    kind: 'imp', x: w.player.x, y: w.player.y, radius: 14, hp: 2, maxHp: 2,
    speed: 0, score: 50, embers: 2, damage: 1, color: '#ff8a5c',
    phase: 0, shootTimer: 99, flash: 0, split: false,
  });
});
await page.waitForTimeout(500);
s = await state();
check('defeat screen shows when HP hits 0', s.state === 'defeat');
await page.keyboard.press('KeyR');
await page.waitForTimeout(400);
s = await state();
check('R restarts a fresh game', s.state === 'playing' && s.wave === 1 && s.score === 0);

// --- 5. Screenshots of the game's own code ---
const shots = [
  ['1-start.jpg', '?shot=start'],
  ['2-play.jpg', '?shot=play'],
  ['3-forge.jpg', '?shot=forge'],
  ['4-win.jpg', '?shot=win'],
];
for (const [name, query] of shots) {
  await page.goto(BASE + '/' + query, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(here, 'screenshots', name), type: 'jpeg', quality: 88 });
  console.log('shot', name);
}

// --- 6. Final error sweep ---
check('no console errors during play', consoleErrors.length === 0);
if (consoleErrors.length) console.log(consoleErrors);
check('no external requests during play', badRequests.length === 0);
if (badRequests.length) console.log(badRequests);

await browser.close();
server.kill();
console.log('done');
