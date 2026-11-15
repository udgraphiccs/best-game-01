// Emberforge — keyboard and mouse state, in game coordinates.
// The canvas is scaled by CSS, so mouse positions are mapped back through
// the canvas bounding box before anything else reads them.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false,
    clickX: 0,
    clickY: 0,
    // A key pressed since the last frame was consumed.
    pressed: new Set(),

    isDown(code) {
      return keys.has(code);
    },
    wasPressed(code) {
      return input.pressed.has(code);
    },
    moveAxis() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    consumeClick() {
      if (!input.clicked) return null;
      input.clicked = false;
      return { x: input.clickX, y: input.clickY };
    },
    endFrame() {
      input.pressed.clear();
    },
  };

  function toGame(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (event) => {
    const p = toGame(event.clientX, event.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toGame(event.clientX, event.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mouseDown = true;
    input.clicked = true;
    input.clickX = p.x;
    input.clickY = p.y;
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });

  return input;
}
