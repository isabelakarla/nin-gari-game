import { audio } from "./audio";
import { buildLevel, GY, THEMES, type ItemKind, type LevelData, type Rect, type Theme } from "./levels";

export const VW = 800;
export const VH = 450;

export interface Hud {
  score: number; trash: number; lives: number; level: number; totalLevels: number;
  ods: number; odsName: string; color: string; mission: string; got: number; need: number; targetLabel: string; portalOpen: boolean;
}
export interface Fact { ods: number; odsName: string; title: string; text: string; color: string }
export interface Stats { score: number; trash: number; seedlings: number; enemies: number; level: number; win: boolean }
export interface Callbacks {
  onHud: (h: Hud) => void;
  onFact: (f: Fact) => void;
  onEnd: (s: Stats) => void;
}

interface Item extends Rect { kind: ItemKind; taken: boolean; phase: number }
interface Enemy extends Rect { vx: number; minX: number; maxX: number; alive: boolean; dead: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; c: string }

const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export class Game {
  input = { left: false, right: false, jump: false };
  li = 0;
  theme!: Theme;
  lvl!: LevelData;
  p = { x: 60, y: 300, w: 22, h: 30, vx: 0, vy: 0, onGround: false, jumps: 0, face: 1, inv: 0, anim: 0 };
  items: Item[] = [];
  enemies: Enemy[] = [];
  parts: Particle[] = [];
  score = 0; lives = 3; got = 0; trash = 0; seedlings = 0; kills = 0;
  camX = 0; t = 0; portalOpen = false; jumpHeld = false; safe = { x: 60, y: 300 }; over = false;
  private lastHud = "";

  constructor(private cb: Callbacks) { this.load(0); }

  load(i: number) {
    this.li = i;
    this.theme = THEMES[i];
    this.lvl = buildLevel(i);
    this.items = this.lvl.items.map((it) => ({ x: it.x, y: it.y, w: 18, h: 24, kind: it.kind, taken: false, phase: Math.random() * 6 }));
    this.enemies = this.lvl.enemies.map((e) => ({ x: e.x, y: GY - 22, w: 28, h: 22, vx: 50 + i * 12, minX: e.minX, maxX: e.maxX, alive: true, dead: 0 }));
    Object.assign(this.p, { x: 60, y: 300, vx: 0, vy: 0, jumps: 0, inv: 1 });
    this.safe = { x: 60, y: 300 };
    this.got = 0; this.portalOpen = false; this.camX = 0;
    this.emitHud();
  }

  emitHud() {
    const h: Hud = {
      score: this.score, trash: this.trash, lives: this.lives, level: this.li + 1, totalLevels: THEMES.length,
      ods: this.theme.ods, odsName: this.theme.odsName, color: this.theme.color, mission: this.theme.mission,
      got: this.got, need: this.theme.targetCount, targetLabel: this.theme.targetLabel, portalOpen: this.portalOpen,
    };
    const k = JSON.stringify(h);
    if (k !== this.lastHud) { this.lastHud = k; this.cb.onHud(h); }
  }

  burst(x: number, y: number, c: string, n = 12) {
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300, life: 0.6, c });
  }

  hurt() {
    if (this.p.inv > 0) return;
    this.lives--;
    audio.play("hurt");
    this.p.inv = 1.6;
    this.p.vy = -380;
    this.burst(this.p.x + 11, this.p.y + 15, "#ff4d4d");
    if (this.lives <= 0) this.end(false);
  }

  end(win: boolean) {
    if (this.over) return;
    this.over = true;
    audio.play(win ? "win" : "lose");
    this.emitHud();
    this.cb.onEnd({ score: this.score, trash: this.trash, seedlings: this.seedlings, enemies: this.kills, level: this.li + 1, win });
  }

  update(dt: number) {
    if (this.over) return;
    this.t += dt;
    const p = this.p;
    const { left, right, jump } = this.input;
    const target = (right ? 1 : 0) - (left ? 1 : 0);
    p.vx += (target * 250 - p.vx) * Math.min(1, dt * 14);
    if (target) p.face = target;
    if (jump && !this.jumpHeld) {
      if (p.onGround) { p.vy = -620; p.jumps = 1; audio.play("jump"); }
      else if (p.jumps < 2) { p.vy = -540; p.jumps = 2; audio.play("jump"); this.burst(p.x + 11, p.y + 30, "#ffffff", 6); }
    }
    if (!jump && p.vy < -260) p.vy = -260;
    this.jumpHeld = jump;
    p.vy = Math.min(p.vy + 1800 * dt, 900);

    p.x += p.vx * dt;
    for (const pl of this.lvl.platforms) if (overlap(p, pl)) {
      if (p.vx > 0) p.x = pl.x - p.w; else if (p.vx < 0) p.x = pl.x + pl.w;
    }
    p.x = Math.max(0, Math.min(this.lvl.width - p.w, p.x));
    p.y += p.vy * dt;
    p.onGround = false;
    for (const pl of this.lvl.platforms) if (overlap(p, pl)) {
      if (p.vy > 0) {
        p.y = pl.y - p.h; p.vy = 0; p.onGround = true; p.jumps = 0;
        if (pl.ground) this.safe = { x: Math.max(pl.x + 10, Math.min(pl.x + pl.w - 40, p.x)), y: pl.y - p.h };
      } else if (p.vy < 0) { p.y = pl.y + pl.h; p.vy = 0; }
    }
    if (Math.abs(p.vx) > 20 && p.onGround) p.anim += dt * 12;
    if (p.inv > 0) p.inv -= dt;

    if (p.y > VH + 40) {
      this.lives--;
      audio.play("hurt");
      if (this.lives <= 0) { this.end(false); return; }
      Object.assign(p, { x: this.safe.x, y: this.safe.y - 10, vx: 0, vy: 0, inv: 1.6 });
    }

    for (const e of this.enemies) {
      if (!e.alive) { e.dead += dt; continue; }
      e.x += e.vx * dt;
      if (e.x < e.minX) { e.x = e.minX; e.vx *= -1; }
      if (e.x > e.maxX) { e.x = e.maxX; e.vx *= -1; }
      if (overlap(p, e)) {
        if (p.vy > 0 && p.y + p.h - e.y < 16) {
          e.alive = false; p.vy = -420; this.score += 50; this.kills++;
          audio.play("stomp"); this.burst(e.x + 14, e.y + 10, "#6b6b7a", 16);
        } else this.hurt();
      }
    }

    for (const it of this.items) {
      if (it.taken || !overlap(p, it)) continue;
      it.taken = true;
      if (it.kind === "special") {
        this.score += 100;
        audio.play("special");
        this.burst(it.x + 9, it.y + 12, "#ffd700", 24);
        this.cb.onFact({ ods: this.theme.ods, odsName: this.theme.odsName, title: "Item especial!", text: this.theme.specialFact, color: this.theme.color });
      } else {
        this.score += it.kind === this.theme.target ? 20 : 10;
        if (it.kind === "seedling") this.seedlings++; else this.trash++;
        audio.play("collect");
        this.burst(it.x + 9, it.y + 12, this.theme.color, 10);
        if (it.kind === this.theme.target) {
          this.got++;
          if (this.got >= this.theme.targetCount && !this.portalOpen) {
            this.portalOpen = true;
            this.score += 200;
            setTimeout(() => audio.play("unlock"), 250);
            this.cb.onFact({ ods: this.theme.ods, odsName: this.theme.odsName, title: "Missão cumprida! Portal aberto", text: this.theme.missionFact, color: this.theme.color });
          }
        }
      }
    }

    const portal = { x: this.lvl.portal.x, y: this.lvl.portal.y, w: 44, h: 72 };
    if (this.portalOpen && overlap(p, portal)) {
      this.score += this.lives * 50;
      if (this.li + 1 >= THEMES.length) { this.end(true); return; }
      audio.play("win");
      this.load(this.li + 1);
    }

    for (const pt of this.parts) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 900 * dt; pt.life -= dt; }
    this.parts = this.parts.filter((pt) => pt.life > 0);

    const tx = p.x - VW * 0.4;
    this.camX += (Math.max(0, Math.min(this.lvl.width - VW, tx)) - this.camX) * Math.min(1, dt * 8);
    this.emitHud();
  }

  // ---------- Rendering ----------
  render(c: CanvasRenderingContext2D) {
    const th = this.theme;
    const r = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
    const g = c.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    c.fillStyle = g; c.fillRect(0, 0, VW, VH);

    // sun
    r(640, 50, 48, 48, "#fff3a0"); r(632, 58, 64, 32, "#fff3a0"); r(648, 42, 32, 64, "#fff3a0");
    // clouds
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 260 - this.camX * 0.15 + this.t * 8) % 1560 + 1560) % 1560 - 200;
      const cy = 50 + (i % 3) * 35;
      r(cx, cy, 64, 16, "#ffffff"); r(cx + 12, cy - 10, 36, 12, "#ffffff"); r(cx - 8, cy + 6, 80, 10, "#ffffff");
    }
    // hills
    for (let i = -1; i < 8; i++) {
      const hx = i * 160 - ((this.camX * 0.3) % 160);
      for (let s = 0; s < 8; s++) r(hx + s * 8, 300 - s * 10 - (i % 2) * 20, 160 - s * 16, 200, th.hill);
    }
    this.drawDeco(c, r);

    c.save();
    c.translate(-Math.round(this.camX), 0);
    // hazard below
    r(this.camX - 10, GY + 24, VW + 20, VH, th.hazard);
    for (let x = Math.floor(this.camX / 32) * 32; x < this.camX + VW + 32; x += 32) {
      r(x + ((this.t * 20) % 32), GY + 24 + Math.sin(x + this.t * 3) * 3, 14, 3, "rgba(255,255,255,0.25)");
    }
    for (const pl of this.lvl.platforms) {
      if (pl.x > this.camX + VW || pl.x + pl.w < this.camX) continue;
      r(pl.x, pl.y, pl.w, pl.h, th.dirt);
      for (let x = pl.x; x < pl.x + pl.w; x += 16) for (let y = pl.y + 14; y < pl.y + pl.h; y += 16) r(x + ((y / 16) % 2) * 8 + 3, y + 3, 4, 4, "rgba(0,0,0,0.18)");
      r(pl.x, pl.y, pl.w, 8, th.grass);
      for (let x = pl.x; x < pl.x + pl.w - 4; x += 8) r(x, pl.y + 8, 4, 4, th.grass);
      r(pl.x, pl.y, pl.w, 2, "rgba(255,255,255,0.35)");
    }
    // portal
    const pt = this.lvl.portal;
    r(pt.x - 4, pt.y - 4, 52, 80, "#5a4a3a"); r(pt.x, pt.y, 44, 72, "#2a2236");
    if (this.portalOpen) {
      for (let k = 0; k < 5; k++) {
        const s = ((this.t * 30 + k * 8) % 40);
        c.fillStyle = k % 2 ? th.color : "#ffffff";
        c.globalAlpha = 1 - s / 40;
        c.fillRect(pt.x + 22 - s / 2, pt.y + 36 - s * 0.85, s, s * 1.7);
      }
      c.globalAlpha = 1;
    } else {
      r(pt.x + 16, pt.y + 30, 12, 10, "#c9a227"); r(pt.x + 18, pt.y + 24, 8, 6, "#888"); r(pt.x + 20, pt.y + 26, 4, 4, "#2a2236");
    }
    // items
    for (const it of this.items) {
      if (it.taken) continue;
      const y = it.y + Math.sin(this.t * 4 + it.phase) * 3;
      this.drawItem(r, it.kind, it.x, y);
    }
    // enemies
    for (const e of this.enemies) {
      if (!e.alive) { if (e.dead < 0.4) r(e.x, e.y + 16, 28, 6, "#4a4a55"); continue; }
      const b = Math.sin(this.t * 10 + e.x) * 2;
      r(e.x + 2, e.y + 4 + b, 24, 18 - b, "#4a4a55"); r(e.x + 6, e.y + b, 16, 6, "#5c5c6a");
      r(e.x, e.y + 12, 28, 10, "#3a3a44");
      const ex = e.vx > 0 ? 4 : 0;
      r(e.x + 7 + ex, e.y + 8 + b, 5, 5, "#fff"); r(e.x + 16 + ex, e.y + 8 + b, 5, 5, "#fff");
      r(e.x + 9 + ex, e.y + 10 + b, 2, 2, "#d22"); r(e.x + 18 + ex, e.y + 10 + b, 2, 2, "#d22");
      r(e.x + 8 + ex, e.y + 6 + b, 12, 2, "#222");
    }
    // player
    const p = this.p;
    if (!(p.inv > 0 && Math.floor(this.t * 16) % 2)) {
      const x = Math.round(p.x), y = Math.round(p.y), f = p.face;
      const leg = p.onGround ? Math.floor(p.anim) % 2 : 1;
      r(x + 4, y + 24, 6, 6 - (leg ? 2 : 0), "#2b4aa0"); r(x + 12, y + 24, 6, 6 - (leg ? 0 : 2), "#2b4aa0");
      r(x + 3, y + 13, 16, 12, "#ff8a3d"); r(x + 3, y + 13, 16, 3, "#ffb36b");
      r(x + 9, y + 16, 4, 4, "#56C02B");
      r(x + (f > 0 ? 17 : 0), y + 15, 5, 7, "#f2c39b");
      r(x + 4, y + 2, 14, 12, "#f2c39b");
      r(x + 2, y, 18, 5, "#2e9e3e"); r(x + (f > 0 ? 14 : -2), y + 3, 10, 3, "#2e9e3e");
      r(x + (f > 0 ? 13 : 6), y + 7, 3, 3, "#222");
      r(x + (f > 0 ? 11 : 8), y + 11, 4, 1, "#a0522d");
    }
    for (const q of this.parts) { c.globalAlpha = Math.max(0, q.life / 0.6); r(q.x, q.y, 4, 4, q.c); }
    c.globalAlpha = 1;
    c.restore();
  }

  private drawItem(r: (x: number, y: number, w: number, h: number, c: string) => void, k: ItemKind, x: number, y: number) {
    if (k === "bottle") { r(x + 6, y, 6, 4, "#1e5fbf"); r(x + 5, y + 4, 8, 3, "#bfe7ff"); r(x + 3, y + 7, 12, 17, "#8fd3ff"); r(x + 3, y + 12, 12, 5, "#e04848"); r(x + 5, y + 8, 2, 14, "#e6f7ff"); }
    else if (k === "can") { r(x + 3, y + 3, 12, 20, "#c8ccd4"); r(x + 3, y + 8, 12, 9, "#d93a3a"); r(x + 4, y + 1, 10, 3, "#9aa0aa"); r(x + 5, y + 4, 2, 18, "#eef0f4"); }
    else if (k === "bag") { r(x + 2, y + 7, 14, 16, "#f4f4f4"); r(x + 3, y + 2, 3, 6, "#f4f4f4"); r(x + 12, y + 2, 3, 6, "#f4f4f4"); r(x + 5, y + 12, 8, 4, "#5ab0e6"); r(x + 2, y + 21, 14, 2, "#cfcfcf"); }
    else if (k === "seedling") { r(x + 3, y + 16, 12, 8, "#b5652e"); r(x + 2, y + 15, 14, 3, "#8a4a20"); r(x + 8, y + 6, 2, 10, "#2e9e3e"); r(x + 2, y + 4, 7, 5, "#56C02B"); r(x + 9, y + 1, 7, 5, "#7ad94a"); }
    else {
      const s = Math.floor(this.t * 6) % 2;
      r(x + 6, y, 6, 24, "#ffd700"); r(x, y + 9, 18, 6, "#ffd700"); r(x + 3, y + 3, 12, 18, "#ffe55c"); r(x + 7, y + 7, 4, 10, s ? "#fff" : "#56C02B");
    }
  }

  private drawDeco(c: CanvasRenderingContext2D, r: (x: number, y: number, w: number, h: number, c: string) => void) {
    const d = this.theme.deco;
    const off = this.camX * 0.5;
    for (let i = -1; i < 7; i++) {
      const x = i * 180 - (off % 180);
      if (d === "wind") {
        r(x + 60, 200, 6, 140, "#f0f0f0");
        c.save(); c.translate(x + 63, 200); c.rotate(this.t * 2 + i);
        for (let b = 0; b < 3; b++) { c.rotate((Math.PI * 2) / 3); c.fillStyle = "#ffffff"; c.fillRect(-3, 0, 6, 44); }
        c.restore(); r(x + 58, 196, 10, 8, "#ddd");
        if (i % 2) { r(x + 110, 320, 50, 20, "#2b4aa0"); r(x + 112, 322, 22, 7, "#5a8be0"); r(x + 136, 322, 22, 7, "#5a8be0"); r(x + 132, 340, 4, 12, "#888"); }
      } else if (d === "forest") {
        r(x + 70, 260, 12, 90, "#6e4424"); r(x + 46, 220, 60, 50, "#2e8b3e"); r(x + 56, 196, 40, 30, "#3aa64a"); r(x + 120, 290, 8, 60, "#6e4424"); r(x + 104, 260, 40, 40, "#3aa64a");
      } else if (d === "city") {
        const h = 120 + ((i * 53) % 90) + 40;
        r(x + 20, 350 - h, 70, h, "#8a7fa0"); r(x + 18, 350 - h - 6, 74, 8, "#5cb85c");
        for (let wy = 350 - h + 14; wy < 340; wy += 22) for (let wx = x + 28; wx < x + 84; wx += 18) r(wx, wy, 10, 12, "#ffe9a8");
        r(x + 110, 300, 40, 50, "#9f95b3"); r(x + 125, 286, 10, 14, "#ffd76a");
      } else {
        r(x, 330, 180, 20, "#3fa3d9"); r(x + 20 + ((this.t * 30) % 140), 336, 18, 3, "#bfe7ff");
        r(x + 120, 300, 6, 30, "#3a8a4a"); r(x + 112, 296, 22, 8, "#4fae5a");
      }
    }
  }
}
