let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

let _muted = false;
let _volume = 0.5;

export function setMuted(m: boolean) { _muted = m; }
export function isMuted() { return _muted; }
export function setVolume(v: number) { _volume = Math.max(0, Math.min(1, v)); }
export function getVolume() { return _volume; }

function gain(ctx: AudioContext, v: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = v * _volume;
  g.connect(ctx.destination);
  return g;
}

export function playTilePlace() {
  if (_muted) return;
  const ctx = getCtx();
  const g = gain(ctx, 0.6);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(g);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);

  // noise burst for "thud"
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const ng = gain(ctx, 0.4);
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  noise.connect(ng);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.08);
}

export function playPass() {
  if (_muted) return;
  const ctx = getCtx();
  const g = gain(ctx, 0.3);
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.2);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.connect(g);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}

export function playYourTurn() {
  if (_muted) return;
  const ctx = getCtx();
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const g = gain(ctx, 0.25);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.12;
    g.gain.setValueAtTime(0.25 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

export function playVictory() {
  if (_muted) return;
  const ctx = getCtx();
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const g = gain(ctx, 0.3);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.15;
    g.gain.setValueAtTime(0.3 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

export function playDefeat() {
  if (_muted) return;
  const ctx = getCtx();
  const notes = [392, 349, 311, 262]; // G4 F4 Eb4 C4
  notes.forEach((freq, i) => {
    const g = gain(ctx, 0.25);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.2;
    g.gain.setValueAtTime(0.15 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

export function playChatReceived() {
  if (_muted) return;
  const ctx = getCtx();
  const g = gain(ctx, 0.2);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.06);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(g);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}
