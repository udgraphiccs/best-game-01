// Emberforge — every pixel the game draws: the vale, the smith, the
// creatures, the HUD, and the title / forge / ending screens.

import { PALETTE, SCORE, TOTAL_WAVES, UPGRADE_COSTS, VIEW } from './config.js';
import { STATES } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, PALETTE.bgTop);
  grad.addColorStop(0.55, PALETTE.bgMid);
  grad.addColorStop(1, PALETTE.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Distant stars, drifting slowly.
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 137.5 + time * 6) % VIEW.width;
    const y = (i * 89.3) % (VIEW.height - 120);
    const tw = 0.35 + 0.3 * Math.sin(time * 2 + i);
    ctx.globalAlpha = Math.max(0.08, tw);
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // The forge floor: dark stone slabs.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, VIEW.height - 84, VIEW.width, 84);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let x = 0; x < VIEW.width; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, VIEW.height - 84);
    ctx.lineTo(x - 30, VIEW.height);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,179,71,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height - 84);
  ctx.lineTo(VIEW.width, VIEW.height - 84);
  ctx.stroke();
}

function drawPlayer(ctx, p, time) {
  const bob = Math.sin(p.walkPhase) * 2;
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.4);
  if (p.invuln > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.35;

  // Cloak and shoulders.
  ctx.fillStyle = '#3d2b63';
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#57418c';
  ctx.beginPath();
  ctx.arc(-6, -4, 7, 0, Math.PI * 2);
  ctx.arc(6, -4, 7, 0, Math.PI * 2);
  ctx.fill();

  // Hood and face.
  ctx.fillStyle = '#2a1d47';
  ctx.beginPath();
  ctx.arc(0, -3, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.emberCore;
  ctx.beginPath();
  ctx.arc(-3, -4, 1.8, 0, Math.PI * 2);
  ctx.arc(3, -4, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // The hammer, aimed at the mouse.
  ctx.save();
  ctx.rotate(p.facing);
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(26, 0);
  ctx.stroke();
  ctx.fillStyle = PALETTE.emberHot;
  ctx.fillRect(22, -7, 12, 14);
  ctx.fillStyle = PALETTE.emberCore;
  ctx.fillRect(24, -5, 8, 10);
  ctx.restore();

  // Dash readiness ring.
  if (p.dashCooldown <= 0) {
    ctx.strokeStyle = 'rgba(127,231,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemy(ctx, e, time) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const flash = e.flash > 0.4;
  if (e.kind === 'imp') {
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    // Horns.
    ctx.fillStyle = '#7a2d12';
    ctx.beginPath();
    ctx.moveTo(-9, -9);
    ctx.lineTo(-13, -19);
    ctx.lineTo(-4, -12);
    ctx.moveTo(9, -9);
    ctx.lineTo(13, -19);
    ctx.lineTo(4, -12);
    ctx.fill();
    ctx.fillStyle = '#1a0b06';
    ctx.beginPath();
    ctx.arc(-5, -2, 2.2, 0, Math.PI * 2);
    ctx.arc(5, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'bat') {
    const flap = Math.sin(time * 18 + e.phase) * 0.5;
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.ellipse(-14, -4 + flap * 6, 13, 5, -0.5 - flap * 0.3, 0, Math.PI * 2);
    ctx.ellipse(14, -4 - flap * 6, 13, 5, 0.5 + flap * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, e.radius - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(-3, -1, 1.8, 0, Math.PI * 2);
    ctx.arc(3, -1, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'golem') {
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5d7488';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius - 5, 0, Math.PI * 2);
    ctx.stroke();
    // Molten cracks.
    ctx.strokeStyle = PALETTE.emberHot;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(0, 0);
    ctx.lineTo(10, -10);
    ctx.moveTo(-8, 10);
    ctx.lineTo(4, 4);
    ctx.stroke();
    ctx.fillStyle = PALETTE.emberCore;
    ctx.beginPath();
    ctx.arc(-7, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'wisp') {
    const pulse = 1 + Math.sin(time * 6 + e.phase) * 0.12;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, (e.radius + 6) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0d2b33';
    ctx.beginPath();
    ctx.arc(-4, -2, 2, 0, Math.PI * 2);
    ctx.arc(4, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'wyrm') {
    // The Ember Wyrm: a coiled serpent head with a crown of flame.
    const sway = Math.sin(time * 2 + e.phase) * 0.08;
    ctx.rotate(sway);
    ctx.fillStyle = flash ? '#ffffff' : '#7a1f2b';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius - 10, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      ctx.fillStyle = PALETTE.ember;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (e.radius - 4), Math.sin(a) * (e.radius - 4));
      ctx.lineTo(Math.cos(a - 0.16) * (e.radius + 16), Math.sin(a - 0.16) * (e.radius + 16));
      ctx.lineTo(Math.cos(a + 0.16) * (e.radius + 16), Math.sin(a + 0.16) * (e.radius + 16));
      ctx.fill();
    }
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(-16, -8, 5, 0, Math.PI * 2);
    ctx.arc(16, -8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0505';
    ctx.beginPath();
    ctx.arc(-16, -8, 2.4, 0, Math.PI * 2);
    ctx.arc(16, -8, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Small health bar over anything tougher than an imp.
  if (e.maxHp > 2 && e.hp < e.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-e.radius, -e.radius - 12, e.radius * 2, 5);
    ctx.fillStyle = PALETTE.danger;
    ctx.fillRect(-e.radius, -e.radius - 12, e.radius * 2 * (e.hp / e.maxHp), 5);
  }
  ctx.restore();
}

function drawPickup(ctx, pk, time) {
  const bob = Math.sin(pk.phase) * 3;
  ctx.save();
  ctx.translate(pk.x, pk.y + bob);
  if (pk.life < 2.5 && Math.floor(time * 8) % 2 === 0) ctx.globalAlpha = 0.3;
  if (pk.kind === 'ember') {
    ctx.fillStyle = PALETTE.ember;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.emberCore;
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.heart;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-11, -2, -7, -10, 0, -4);
    ctx.bezierCurveTo(7, -10, 11, -2, 0, 8);
    ctx.fill();
  }
  ctx.restore();
}

function drawHud(ctx, world) {
  const p = world.player;
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(10,6,24,0.72)';
  ctx.fillRect(0, 0, VIEW.width, 52);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${world.score}`, 16, 33);
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${Math.max(1, world.wave)} / ${TOTAL_WAVES}`, VIEW.width / 2, 33);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`◆ ${world.embers} embers`, VIEW.width - 16, 33);

  // Hearts.
  for (let i = 0; i < p.maxHp; i += 1) {
    const x = 24 + i * 28;
    const y = 66;
    ctx.fillStyle = i < p.hp ? PALETTE.heart : 'rgba(255,93,122,0.22)';
    ctx.beginPath();
    ctx.moveTo(x, y + 7);
    ctx.bezierCurveTo(x - 10, y - 1, x - 6, y - 9, x, y - 3);
    ctx.bezierCurveTo(x + 6, y - 9, x + 10, y - 1, x, y + 7);
    ctx.fill();
  }
  // Dash pip.
  ctx.fillStyle = p.dashCooldown <= 0 ? PALETTE.ice : 'rgba(127,231,255,0.3)';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(p.dashCooldown <= 0 ? 'DASH READY  [Space]' : 'dash recharging…', 16, 96);

  // Boss bar.
  if (world.boss) {
    const b = world.boss;
    const bw = 420;
    const bx = (VIEW.width - bw) / 2;
    const by = 62;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, bx - 4, by - 4, bw + 8, 22, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.danger;
    roundRect(ctx, bx, by, bw * Math.max(0, b.hp / b.maxHp), 14, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE EMBER WYRM', VIEW.width / 2, by + 32);
  }

  // Wave banner.
  if (world.waveBanner > 0) {
    ctx.globalAlpha = Math.min(1, world.waveBanner);
    ctx.fillStyle = PALETTE.emberCore;
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.waveBannerText, VIEW.width / 2, 150);
    ctx.globalAlpha = 1;
  }
  if (world.messageTimer > 0) {
    ctx.globalAlpha = Math.min(1, world.messageTimer);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, VIEW.width / 2, 182);
    ctx.globalAlpha = 1;
  }

  // Controls hint, bottom right.
  ctx.fillStyle = 'rgba(185,168,216,0.75)';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD move · mouse aim · hold click to fire · Space dash · M mute', VIEW.width - 14, VIEW.height - 12);
  ctx.restore();
}

function drawTitle(ctx, world, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,6,24,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // A big ember sun behind the title.
  const glow = ctx.createRadialGradient(VIEW.width / 2, 190, 10, VIEW.width / 2, 190, 190);
  glow.addColorStop(0, 'rgba(255,179,71,0.5)');
  glow.addColorStop(1, 'rgba(255,179,71,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ember;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('EMBERFORGE', VIEW.width / 2, 180);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('The Last Smith of Aethermoor', VIEW.width / 2, 216);

  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('The Ashen Vale is overrun. Hold the forge through 10 waves,', VIEW.width / 2, 268);
  ctx.fillText('spend the embers you gather on new forgings, and break the Ember Wyrm.', VIEW.width / 2, 292);

  ctx.fillStyle = PALETTE.ink;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('WASD / arrows — move      Mouse — aim      Hold click — fire      Space — dash', VIEW.width / 2, 340);
  ctx.fillText('Between waves the forge opens: pick 1 of 3 upgrades, or press Enter to fight on.', VIEW.width / 2, 366);

  const pulse = 0.65 + 0.35 * Math.sin(time * 3.2);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.emberCore;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('—  CLICK OR PRESS ENTER TO BEGIN  —', VIEW.width / 2, 436);
  ctx.globalAlpha = 1;

  if (world.best > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(`Best score: ${world.best}`, VIEW.width / 2, 482);
  }
  ctx.restore();
}

function drawForge(ctx, world) {
  const p = world.player;
  ctx.save();
  ctx.fillStyle = 'rgba(10,6,24,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.emberCore;
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillText('THE FORGE', VIEW.width / 2, 96);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '17px Georgia, serif';
  ctx.fillText(`Wave ${world.wave} cleared!  You carry ${world.embers} embers — choose one forging.`, VIEW.width / 2, 132);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Click a card, or press 1, 2 or 3.  Enter skips the forge and starts the next wave.', VIEW.width / 2, 158);

  const cardW = 250;
  const cardH = 210;
  const gap = 24;
  const total = cardW * 3 + gap * 2;
  const x0 = (VIEW.width - total) / 2;
  const y0 = 190;
  const owned = p.upgrades || {};
  world.forgeChoices.forEach((u, i) => {
    const cx = x0 + i * (cardW + gap);
    const level = owned[u.id] || 0;
    const cost = UPGRADE_COSTS[Math.min(level, UPGRADE_COSTS.length - 1)];
    const afford = world.embers >= cost;
    ctx.fillStyle = 'rgba(38,24,66,0.95)';
    roundRect(ctx, cx, y0, cardW, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = afford ? PALETTE.ember : 'rgba(185,168,216,0.35)';
    ctx.lineWidth = 2;
    roundRect(ctx, cx, y0, cardW, cardH, 14);
    ctx.stroke();

    ctx.fillStyle = PALETTE.emberCore;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(u.name, cx + cardW / 2, y0 + 44);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '15px Georgia, serif';
    const words = wrapText(u.desc, 30);
    words.forEach((line, li) => ctx.fillText(line, cx + cardW / 2, y0 + 78 + li * 20));

    ctx.fillStyle = PALETTE.dim;
    ctx.font = '14px Georgia, serif';
    ctx.fillText(`Level ${level} / ${u.max}`, cx + cardW / 2, y0 + 140);
    ctx.fillStyle = afford ? PALETTE.gold : PALETTE.danger;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(afford ? `◆ ${cost} embers` : `◆ ${cost} — not enough`, cx + cardW / 2, y0 + 170);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '13px Georgia, serif';
    ctx.fillText(`press ${i + 1}`, cx + cardW / 2, y0 + 194);
  });

  ctx.fillStyle = PALETTE.dim;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('— or press Enter to fight on without forging —', VIEW.width / 2, VIEW.height - 64);
  ctx.restore();
}

function wrapText(text, width) {
  const words = text.split(' ');
  const lines = [''];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if ((last + ' ' + w).trim().length > width && last.length > 0) lines.push(w);
    else lines[lines.length - 1] = (last + ' ' + w).trim();
  }
  return lines;
}

function drawEnding(ctx, world, won) {
  ctx.save();
  ctx.fillStyle = won ? 'rgba(20,26,8,0.72)' : 'rgba(24,6,12,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.gold : PALETTE.danger;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(won ? 'THE WYRM IS BROKEN' : 'THE FORGE FALLS DARK', VIEW.width / 2, 170);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText(
    won ? 'Aethermoor burns bright again — the last smith kept her fire.' : 'The embers scatter. The vale waits for another smith.',
    VIEW.width / 2, 208,
  );

  const minutes = Math.floor(world.timePlayed / 60);
  const seconds = Math.floor(world.timePlayed % 60).toString().padStart(2, '0');
  ctx.font = '19px Georgia, serif';
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(`Score  ${world.score}`, VIEW.width / 2, 268);
  ctx.fillText(`Waves cleared  ${won ? TOTAL_WAVES : Math.max(0, world.wave - 1)} / ${TOTAL_WAVES}`, VIEW.width / 2, 298);
  ctx.fillText(`Creatures felled  ${world.kills}      Time  ${minutes}:${seconds}`, VIEW.width / 2, 328);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText(`Best score  ${world.best}`, VIEW.width / 2, 362);
  if (won) {
    ctx.fillStyle = PALETTE.emberCore;
    ctx.font = '15px Georgia, serif';
    ctx.fillText(`Boss bonus +${SCORE.bossBonus} included in your score.`, VIEW.width / 2, 392);
  }

  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.emberCore;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('—  PRESS R TO PLAY AGAIN, OR ENTER FOR THE TITLE  —', VIEW.width / 2, 452);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let time = 0;

  function render(world, dt) {
    time += dt;
    ctx.save();
    const shake = world.particles ? world.particles.shake : 0;
    if (shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    drawBackground(ctx, time);

    if (world.state === STATES.TITLE) {
      drawTitle(ctx, world, time);
      ctx.restore();
      return;
    }

    for (const pk of world.pickups) drawPickup(ctx, pk, time);
    for (const e of world.enemies) drawEnemy(ctx, e, time);
    for (const b of world.bullets) {
      ctx.fillStyle = PALETTE.emberCore;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.emberHot;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of world.enemyBullets) {
      ctx.fillStyle = '#ff5d3a';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd0c0';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // On an ending screen the smith steps out of the frame: only the verdict shows.
    if (world.state !== STATES.VICTORY && world.state !== STATES.DEFEAT) {
      drawPlayer(ctx, world.player, time);
    }
    world.particles.draw(ctx);

    if (world.state === STATES.PLAYING || world.state === STATES.FORGE) drawHud(ctx, world);
    if (world.state === STATES.FORGE) drawForge(ctx, world);
    if (world.state === STATES.VICTORY) drawEnding(ctx, world, true);
    if (world.state === STATES.DEFEAT) drawEnding(ctx, world, false);
    ctx.restore();
  }

  return { render };
}
