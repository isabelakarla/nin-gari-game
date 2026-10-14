let ctx: AudioContext | null = null;
let muted = false;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
  const a = ac();
  if (!a || muted) return;
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

export type Sfx = "jump" | "collect" | "special" | "hurt" | "unlock" | "win" | "stomp" | "lose";

export const audio = {
  unlock() { ac(); },
  setMuted(m: boolean) { muted = m; },
  play(s: Sfx) {
    switch (s) {
      case "jump": tone(320, 0.14, "square", 0.08, 640); break;
      case "collect": tone(880, 0.08, "square", 0.08); tone(1320, 0.12, "square", 0.08, undefined, 0.07); break;
      case "special": [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.12, "triangle", 0.12, undefined, i * 0.07)); break;
      case "stomp": tone(500, 0.12, "square", 0.1, 120); break;
      case "hurt": tone(220, 0.3, "sawtooth", 0.12, 60); break;
      case "unlock": [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.15, "square", 0.08, undefined, i * 0.09)); break;
      case "win": [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.2, "triangle", 0.14, undefined, i * 0.12)); break;
      case "lose": [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, "square", 0.1, undefined, i * 0.18)); break;
    }
  },
};
