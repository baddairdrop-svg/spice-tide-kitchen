// SPICE TIDE KITCHEN — sound, synthesized live with WebAudio.
// No audio files: every clink, sizzle and chime is an oscillator or a burst
// of filtered noise made on the spot, so the game stays a handful of static
// files. Sound starts only after the player's first click or key press
// (browsers require a gesture), and every call is safe when muted or when
// WebAudio is missing entirely.

let context = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  return muted;
}

/** Create (or resume) the shared audio context. Call from a user gesture. */
export function unlockAudio() {
  try {
    if (context === null) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) context = new AudioCtor();
    }
    if (context && context.state === 'suspended') context.resume();
  } catch {
    context = null;
  }
}

function tone(freqFrom, freqTo, seconds, type, volume, delay = 0) {
  if (muted || context === null) return;
  try {
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  } catch {
    /* sound is decoration; never let it break the game */
  }
}

function noiseBurst(seconds, volume, delay = 0) {
  if (muted || context === null) return;
  try {
    const start = context.currentTime + delay;
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
  } catch {
    /* as above */
  }
}

/** A soft pop when an ingredient lands on the plate. */
export function soundAdd() {
  tone(420, 660, 0.07, 'triangle', 0.12);
}

/** A short sizzle when a station starts cooking. */
export function soundCookStart() {
  noiseBurst(0.25, 0.05);
  tone(180, 120, 0.15, 'sawtooth', 0.03);
}

/** The bright ding of a station finishing: food is ready to collect. */
export function soundReady() {
  tone(1180, 1180, 0.1, 'sine', 0.14);
  tone(1560, 1560, 0.16, 'sine', 0.12, 0.09);
}

/** Cash-register chime and coin sparkle when an order is served. */
export function soundServe() {
  tone(660, 660, 0.09, 'square', 0.08);
  tone(880, 880, 0.09, 'square', 0.08, 0.08);
  tone(1320, 1320, 0.2, 'square', 0.09, 0.16);
}

/** A low buzz for a plate that matches no order. */
export function soundError() {
  tone(160, 110, 0.22, 'sawtooth', 0.1);
}

/** A sad descending pair when a customer walks out. */
export function soundLose() {
  tone(392, 392, 0.16, 'triangle', 0.12);
  tone(311, 262, 0.3, 'triangle', 0.12, 0.15);
}

/** The little fanfare for finishing a day. */
export function soundDayClear() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => tone(freq, freq, 0.18, 'triangle', 0.12, i * 0.11));
}
