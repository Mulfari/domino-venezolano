let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

let _muted = typeof window !== "undefined" && localStorage.getItem("domino_muted") === "true";
let _volume = 0.5;

export function setMuted(m: boolean) {
  _muted = m;
  if (typeof window !== "undefined") localStorage.setItem("domino_muted", String(m));
}
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

export function playCapicua() {
  if (_muted) return;
  const ctx = getCtx();
  // Ascending arpeggio + shimmer — celebratory but brief
  const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
  notes.forEach((freq, i) => {
    const g = gain(ctx, 0.22);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.09;
    g.gain.setValueAtTime(0.22 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.28);
  });
  // Shimmer overtone
  const g2 = gain(ctx, 0.12);
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.value = 2093; // C7
  const t2 = ctx.currentTime + 0.36;
  g2.gain.setValueAtTime(0.12 * _volume, t2);
  g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.5);
  osc2.connect(g2);
  osc2.start(t2);
  osc2.stop(t2 + 0.5);
}

export function playDosFichas() {
  if (_muted) return;
  const ctx = getCtx();
  // Single mid-range tone — softer warning than ¡Una ficha!
  const notes = [784, 659]; // G5, E5 — descending pair, less urgent than C6/G5
  notes.forEach((freq, i) => {
    const g = gain(ctx, 0.22);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.16;
    g.gain.setValueAtTime(0.22 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

export function playUnaFicha() {
  if (_muted) return;
  const ctx = getCtx();
  // Two sharp descending tones — urgent "watch out" signal
  const notes = [1047, 784]; // C6, G5
  notes.forEach((freq, i) => {
    const g = gain(ctx, 0.32);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.14;
    g.gain.setValueAtTime(0.32 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.22);
  });
  // Short noise accent for punch
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const ng = gain(ctx, 0.18);
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  noise.connect(ng);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.04);
}

export function playShuffle() {
  if (_muted) return;
  const ctx = getCtx();
  // Rapid tile-clicking bursts that simulate shuffling dominoes on a table
  const burstCount = 18;
  for (let i = 0; i < burstCount; i++) {
    const t = ctx.currentTime + i * 0.055 + Math.random() * 0.025;
    // Short noise click
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.022), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * 0.6;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const ng = ctx.createGain();
    // Fade in slightly then out — envelope for each click
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(0.28 * _volume, t + 0.003);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
    noise.connect(ng);
    ng.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 0.025);
    // Tonal click component — short pitched tap
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 180 + Math.random() * 120;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.18 * _volume, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.02);
  }
  // Final "settle" thud
  const settleT = ctx.currentTime + burstCount * 0.055 + 0.05;
  const sbuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
  const sdata = sbuf.getChannelData(0);
  for (let j = 0; j < sdata.length; j++) sdata[j] = (Math.random() * 2 - 1) * 0.4;
  const snoise = ctx.createBufferSource();
  snoise.buffer = sbuf;
  const sng = ctx.createGain();
  sng.gain.setValueAtTime(0.35 * _volume, settleT);
  sng.gain.exponentialRampToValueAtTime(0.001, settleT + 0.06);
  snoise.connect(sng);
  sng.connect(ctx.destination);
  snoise.start(settleT);
  snoise.stop(settleT + 0.07);
}

export function playDouble() {
  if (_muted) return;
  const ctx = getCtx();
  // Two bright "ding" tones — a minor third apart — to signal a double
  const notes = [880, 1047]; // A5, C6
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.13;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.28 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.33);
    // Subtle harmonic overtone
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.09 * _volume, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    g2.connect(ctx.destination);
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    osc2.connect(g2);
    osc2.start(t);
    osc2.stop(t + 0.19);
  });
}

export function playStreak() {
  if (_muted) return;
  const ctx = getCtx();
  // Rising triplet — signals momentum building
  const notes = [659, 784, 1047]; // E5, G5, C6
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.11;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.26 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.29);
  });
  // Accent shimmer on the last note
  const t3 = ctx.currentTime + 0.22;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.12 * _volume, t3);
  g2.gain.exponentialRampToValueAtTime(0.001, t3 + 0.35);
  g2.connect(ctx.destination);
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 2093; // C7
  osc2.connect(g2);
  osc2.start(t3);
  osc2.stop(t3 + 0.36);
}

export function playCochina() {
  if (_muted) return;
  const ctx = getCtx();
  // Bold 4-note fanfare — G4 C5 E5 G5 — with a deep bass thud underneath
  const notes = [392, 523, 659, 784]; // G4 C5 E5 G5
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.13;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.39);
    // Harmonic shimmer
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.1 * _volume, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    g2.connect(ctx.destination);
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    osc2.connect(g2);
    osc2.start(t);
    osc2.stop(t + 0.23);
  });
  // Deep bass thud on beat 1
  const bassG = ctx.createGain();
  bassG.gain.setValueAtTime(0.45 * _volume, ctx.currentTime);
  bassG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
  bassG.connect(ctx.destination);
  const bassOsc = ctx.createOscillator();
  bassOsc.type = "sine";
  bassOsc.frequency.setValueAtTime(98, ctx.currentTime);
  bassOsc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.18);
  bassOsc.connect(bassG);
  bassOsc.start(ctx.currentTime);
  bassOsc.stop(ctx.currentTime + 0.29);
  // Noise accent
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const ng = gain(ctx, 0.22);
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  noise.connect(ng);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.07);
}

export function playTimeout() {
  if (_muted) return;
  const ctx = getCtx();
  // Three descending tones — "time's up" signal
  const notes = [523, 392, 262]; // C5, G4, C4
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.18;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3 * _volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.29);
  });
  // Low thud at the end
  const t3 = ctx.currentTime + 0.54;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.25 * _volume, t3);
  ng.gain.exponentialRampToValueAtTime(0.001, t3 + 0.1);
  noise.connect(ng);
  ng.connect(ctx.destination);
  noise.start(t3);
  noise.stop(t3 + 0.11);
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
