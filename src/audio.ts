// Tiny synthesized sound effects (no audio files needed).
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.06, slideTo?: number, delay = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  jump: () => tone(380, 0.16, 'square', 0.04, 760),
  collect: () => {
    tone(988, 0.07, 'triangle', 0.08);
    tone(1319, 0.12, 'triangle', 0.08, undefined, 0.06);
  },
  fall: () => tone(440, 0.5, 'sawtooth', 0.04, 90),
  alert: () => {
    tone(660, 0.08, 'square', 0.05);
    tone(880, 0.14, 'square', 0.05, undefined, 0.09);
  },
  start: () => [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'triangle', 0.07, undefined, i * 0.08)),
  win: () =>
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      tone(f, i === 5 ? 0.45 : 0.14, 'triangle', 0.08, undefined, i * 0.12),
    ),
};
