// Emberforge — all sound is synthesized with WebAudio: no audio files.
// Short oscillator/noise bursts for effects, and a small step sequencer
// that loops a moody A-minor arpeggio while the game runs.

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicTimer = null;
  let step = 0;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, lowpass) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
  }

  // A-minor arpeggio, one step every 140 ms, bass on every fourth step.
  const MELODY = [220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63];
  const BASS = [110, 87.31, 130.81, 98];

  function musicStep() {
    if (!ctx || muted) return;
    const note = MELODY[step % MELODY.length];
    tone(note, 0.16, 'triangle', 0.055);
    if (step % 4 === 0) tone(BASS[(step / 4) % BASS.length | 0], 0.5, 'sine', 0.07);
    if (step % 8 === 6) tone(note * 2, 0.1, 'sine', 0.03);
    step += 1;
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    get muted() {
      return muted;
    },
    startMusic() {
      if (!ensure() || musicTimer) return;
      musicTimer = window.setInterval(musicStep, 140);
    },
    stopMusic() {
      if (musicTimer) window.clearInterval(musicTimer);
      musicTimer = null;
    },
    shoot() {
      if (!ensure()) return;
      tone(720, 0.09, 'square', 0.06, 240);
    },
    hit() {
      if (!ensure()) return;
      tone(190, 0.07, 'sawtooth', 0.05, 120);
    },
    explode() {
      if (!ensure()) return;
      noise(0.35, 0.22, 900);
      tone(90, 0.3, 'sine', 0.16, 40);
    },
    pickup() {
      if (!ensure()) return;
      tone(880, 0.08, 'sine', 0.08);
      window.setTimeout(() => tone(1318, 0.12, 'sine', 0.07), 60);
    },
    heart() {
      if (!ensure()) return;
      tone(523, 0.12, 'sine', 0.09);
      window.setTimeout(() => tone(784, 0.18, 'sine', 0.09), 90);
    },
    hurt() {
      if (!ensure()) return;
      tone(160, 0.25, 'sawtooth', 0.14, 60);
      noise(0.15, 0.12, 500);
    },
    dash() {
      if (!ensure()) return;
      noise(0.12, 0.08, 2400);
    },
    waveHorn() {
      if (!ensure()) return;
      tone(196, 0.35, 'triangle', 0.12, 262);
      window.setTimeout(() => tone(262, 0.4, 'triangle', 0.1, 330), 160);
    },
    bossRoar() {
      if (!ensure()) return;
      noise(0.7, 0.2, 400);
      tone(55, 0.7, 'sawtooth', 0.14, 38);
    },
    victory() {
      if (!ensure()) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        window.setTimeout(() => tone(f, 0.35, 'triangle', 0.1), i * 130);
      });
    },
    defeat() {
      if (!ensure()) return;
      [392, 329.63, 261.63, 196].forEach((f, i) => {
        window.setTimeout(() => tone(f, 0.4, 'triangle', 0.09), i * 170);
      });
    },
  };
}
