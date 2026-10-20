import { GY, type Rect } from "./levels";

export const BOSS_HITS = 10;
export const MINION_RESPAWN = 15;
type Player = Rect & { vx: number; vy: number; face: number };
type Shot = Rect & { vx: number; vy: number; kind: "mud" | "wave" | "shot" | "bomb"; life: number };
type Minion = Rect & { vx: number; min: number; max: number; respawn: number; timer: number };
const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export class BossBattle {
  body = { x: 348, y: 292, w: 104, h: 94 };
  hits = 0; cooldown = 0; bombs = 0; elapsed = 0; purifiedFor = 0;
  shots: Shot[] = [];
  pickups = [{ x: 183, y: 254, w: 22, h: 24, wait: 0 }, { x: 389, y: 204, w: 22, h: 24, wait: 0 }, { x: 585, y: 254, w: 22, h: 24, wait: 0 }];
  minions: Minion[] = [
    { x: 25, y: GY - 32, w: 24, h: 32, vx: 32, min: 15, max: 105, respawn: 0, timer: 2 },
    { x: 745, y: GY - 32, w: 24, h: 32, vx: -32, min: 690, max: 760, respawn: 0, timer: 3 },
  ];
  private mudTimer = 2; private waveTimer = 4; private trashTimer = 5; private throwHeld = false;
  trash: (Rect & { life: number })[] = [];
  constructor(private callbacks: { hurt: () => void; hit: (hits: number) => void; collect: () => void; stomp: () => void; win: () => void }) {}
  get health() { return BOSS_HITS - this.hits; }
  get tier() { return Math.floor(this.hits / 3); }
  get projectileSpeed() { return 160 + this.tier * 45; }
  get trashInterval() { return 5 / (1 + this.tier * 0.5); }
  damage() {
    if (this.cooldown > 0 || this.health === 0) return false;
    this.hits++; this.cooldown = 0.8; this.callbacks.hit(this.hits); return true;
  }
  update(dt: number, p: Player, throwing: boolean) {
    this.elapsed += dt; this.cooldown = Math.max(0, this.cooldown - dt);
    if (!this.health) { this.purifiedFor += dt; if (this.purifiedFor >= 2) this.callbacks.win(); return; }
    for (const it of this.pickups) {
      it.wait = Math.max(0, it.wait - dt);
      if (!it.wait && intersects(p, it)) { this.bombs++; it.wait = 6; this.callbacks.collect(); }
    }
    if (throwing && !this.throwHeld && this.bombs > 0) {
      this.bombs--;
      const dx = this.body.x + this.body.w / 2 - (p.x + p.w / 2);
      const dy = this.body.y + 38 - (p.y + 12);
      const distance = Math.max(1, Math.hypot(dx, dy));
      this.shots.push({ x: p.x + p.w / 2, y: p.y + 12, w: 14, h: 14, vx: dx / distance * 420, vy: dy / distance * 420, kind: "bomb", life: 3 });
    }
    this.throwHeld = throwing;
    if (intersects(p, this.body)) {
      if (p.vy > 0 && p.y + p.h - this.body.y < 20) { p.y = this.body.y - p.h; p.vy = -540; this.damage(); }
      else this.callbacks.hurt();
    }
    this.mudTimer -= dt; this.waveTimer -= dt; this.trashTimer -= dt;
    if (this.mudTimer <= 0) {
      this.mudTimer = 2.6 / (1 + this.tier * 0.2);
      for (let k = 0; k < 3; k++) {
        const landing = 30 + Math.random() * 740;
        this.shots.push({ x: 390, y: 286, w: 14, h: 14, vx: (landing - 390) / 1.7, vy: -500 - this.tier * 30, kind: "mud", life: 4 });
      }
    }
    if (this.waveTimer <= 0) {
      this.waveTimer = 4 / (1 + this.tier * 0.2);
      for (const sign of [-1, 1]) this.shots.push({ x: 400, y: GY - 14, w: 26, h: 14, vx: sign * this.projectileSpeed, vy: 0, kind: "wave", life: 5 });
    }
    if (this.trashTimer <= 0) {
      this.trashTimer = this.trashInterval;
      this.trash.push({ x: 100 + Math.random() * 580, y: GY - 22, w: 16, h: 22, life: 12 });
    }
    for (const m of this.minions) {
      if (m.respawn > 0) { m.respawn = Math.max(0, m.respawn - dt); continue; }
      m.x += m.vx * dt;
      if (m.x < m.min || m.x > m.max) { m.x = Math.max(m.min, Math.min(m.max, m.x)); m.vx *= -1; }
      m.timer -= dt;
      if (m.timer <= 0) {
        m.timer = 2.4 / (1 + this.tier * 0.15);
        const dx = p.x - m.x, dy = p.y + 12 - (m.y + 12), len = Math.max(1, Math.hypot(dx, dy));
        this.shots.push({ x: m.x + 12, y: m.y + 12, w: 10, h: 6, vx: dx / len * this.projectileSpeed, vy: dy / len * this.projectileSpeed, kind: "shot", life: 6 });
      }
      if (intersects(p, m)) {
        if (p.vy > 0 && p.y + p.h - m.y < 18) { m.respawn = MINION_RESPAWN; m.timer = 2; p.vy = -420; this.callbacks.stomp(); }
        else this.callbacks.hurt();
      }
    }
    for (const s of this.shots) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === "mud") s.vy += 600 * dt;
      if (s.kind === "bomb" && intersects(s, this.body)) { this.damage(); s.life = 0; }
      else if (s.kind !== "bomb" && intersects(s, p)) { this.callbacks.hurt(); s.life = 0; }
      if (s.y > GY && s.kind === "mud") s.life = 0;
    }
    this.shots = this.shots.filter(s => s.life > 0 && s.x > -40 && s.x < 840);
    for (const t of this.trash) { t.life -= dt; if (intersects(t, p)) { t.life = 0; this.callbacks.collect(); } }
    this.trash = this.trash.filter(t => t.life > 0);
  }
  render(c: CanvasRenderingContext2D) {
    const r = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
    if (!this.health) {
      r(390, 300, 20, 86, "#805534"); r(344, 258, 112, 58, "#3e9f46"); r(360, 232, 80, 38, "#65c343");
      r(375, 245, 12, 9, "#93df68");
    } else {
      const flash = this.cooldown > 0 && Math.floor(this.elapsed * 16) % 2;
      r(348, 298, 104, 88, flash ? "#f1ebb6" : "#3c7351");
      r(340, 292, 120, 12, "#a3b2a0"); r(344, 326, 112, 9, "#727d74"); r(344, 368, 112, 9, "#727d74");
      r(354, 309, 7, 52, "#8faa80"); r(392, 311, 8, 15, "#1e2b25"); r(400, 323, 10, 12, "#1e2b25");
      r(390, 334, 15, 32, "#8bdc3f"); r(382, 376, 38, 10, "#8bdc3f");
      r(367, 315, 14, 8, "#f5e66c"); r(420, 315, 14, 8, "#f5e66c");
      for (let k = 0; k < 4; k++) r(360 + k * 22, 287 + Math.sin(this.elapsed * 4 + k) * 3, 9, 6, "#9fec49");
    }
    for (const m of this.minions) if (!m.respawn && this.health) {
      r(m.x + 3, m.y, 18, 14, "#172820"); r(m.x + 2, m.y + 5, 20, 4, "#699a46"); r(m.x + 7, m.y + 6, 10, 2, "#efde72");
      r(m.x + 2, m.y + 14, 20, 12, "#274332"); r(m.x + 3, m.y + 26, 7, 6, "#172820"); r(m.x + 14, m.y + 26, 7, 6, "#172820");
    }
    for (const it of this.pickups) if (!it.wait && this.health) { r(it.x + 3, it.y + 5, 16, 17, "#e6eeda"); r(it.x + 5, it.y + 9, 12, 8, "#3d9747"); r(it.x + 9, it.y, 4, 5, "#f2d44c"); }
    for (const t of this.trash) { r(t.x, t.y, 16, 22, "#bdc9c1"); r(t.x, t.y + 6, 16, 8, "#ce654d"); }
    for (const s of this.shots) r(s.x, s.y, s.w, s.h, s.kind === "bomb" ? "#e6eeda" : s.kind === "shot" ? "#efde72" : "#8bdc3f");
  }
}