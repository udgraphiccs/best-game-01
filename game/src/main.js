// Emberforge — bootstrap: wire input, audio, particles, world and renderer
// together, run the fixed-step loop, and stage deterministic scenes when
// the page is opened with ?shot=start|play|forge|win|lose.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createParticles } from './particles.js';
import { createRenderer } from './render.js';
import { createWorld } from './world.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const audio = createAudio();
const particles = createParticles();
const input = createInput(canvas);
const world = createWorld(audio, particles);
const renderer = createRenderer(canvas);

// Test and screenshot hooks: the play-test drives the game through these,
// and ?shot= scenes stage a fixed frame for the screenshots.
window.__emberforge = { world, input, audio, particles };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  world.stageShot(shot);
  // Stage the scene, then render one settled frame.
  renderer.render(world, 0.016);
  world.particles.update(0.016);
  renderer.render(world, 0.016);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot) {
    world.update(dt, input);
    input.endFrame();
  }
  renderer.render(world, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
