// Emberforge — sparks, smoke, floating score text and the screen shake
// that sells every hit. Pure data: spawn, update, draw, forget.

export function createParticles() {
  const sparks = [];
  const texts = [];
  let shake = 0;

  return {
    get shake() {
      return shake;
    },
    burst(x, y, color, count, speed, life) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.65);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: life * (0.5 + Math.random() * 0.5),
          maxLife: life,
          size: 2 + Math.random() * 3.5,
          color,
          drag: 0.92,
        });
      }
    },
    trail(x, y, color) {
      sparks.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 0.35,
        maxLife: 0.35,
        size: 2 + Math.random() * 2,
        color,
        drag: 0.9,
      });
    },
    ring(x, y, color) {
      for (let i = 0; i < 26; i += 1) {
        const angle = (i / 26) * Math.PI * 2;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * 190,
          vy: Math.sin(angle) * 190,
          life: 0.5,
          maxLife: 0.5,
          size: 3,
          color,
          drag: 0.94,
        });
      }
    },
    floatText(x, y, text, color) {
      texts.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
    },
    addShake(amount) {
      shake = Math.min(14, shake + amount);
    },
    update(dt) {
      shake = Math.max(0, shake - dt * 34);
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= s.drag;
        s.vy *= s.drag;
      }
      for (let i = texts.length - 1; i >= 0; i -= 1) {
        const t = texts[i];
        t.life -= dt;
        t.y -= 34 * dt;
        if (t.life <= 0) texts.splice(i, 1);
      }
    },
    draw(ctx) {
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px Georgia, serif';
      for (const t of texts) {
        ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    },
    clear() {
      sparks.length = 0;
      texts.length = 0;
      shake = 0;
    },
  };
}
