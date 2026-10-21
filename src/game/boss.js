import { GY } from "./levels.js";
export const BOSS_HITS = 10;
export const MINION_RESPAWN = 15;
export const MINION_SHOT_INTERVAL = 4.5;
export const MUD_ATTACK_INTERVAL = 4.5;
export const WAVE_ATTACK_INTERVAL = 7;
export const LEVEL_BOSS_HITS = 5;
const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export class LevelBoss {
    callbacks;
    theme;
    body;
    hits = 0;
    elapsed = 0;
    shotTimer = 0;
    attackTimer = 2;
    worldWidth;
    shots = [];
    defeated = false;
    constructor(theme, x, callbacks, worldWidth) {
        this.theme = theme;
        this.body = { x, y: GY - 72, w: 72, h: 72 };
        this.callbacks = callbacks;
        this.worldWidth = worldWidth;
    }
    get health() { return LEVEL_BOSS_HITS - this.hits; }
    damage() {
        if (this.defeated)
            return false;
        this.hits++;
        this.callbacks.hit(this.hits);
        if (!this.health) {
            this.defeated = true;
            this.callbacks.win();
        }
        return true;
    }
    update(dt, p, shooting) {
        this.elapsed += dt;
        if (this.defeated)
            return;
        this.shotTimer = Math.max(0, this.shotTimer - dt);
        this.attackTimer -= dt;
        if (shooting && this.shotTimer <= 0) {
            const direction = p.face || 1;
            this.shots.push({
                x: p.x + (direction > 0 ? p.w : -12),
                y: p.y + 14,
                w: 12,
                h: 6,
                vx: direction * 520,
                vy: 0,
                kind: "player",
                life: 2,
            });
            this.shotTimer = 0.35;
        }
        if (this.attackTimer <= 0) {
            const dx = p.x + p.w / 2 - (this.body.x + this.body.w / 2);
            const dy = p.y + p.h / 2 - (this.body.y + this.body.h / 2);
            const distance = Math.max(1, Math.hypot(dx, dy));
            this.shots.push({
                x: this.body.x + this.body.w / 2,
                y: this.body.y + this.body.h / 2,
                w: 10,
                h: 10,
                vx: dx / distance * 180,
                vy: dy / distance * 180,
                kind: "enemy",
                life: 5,
            });
            this.attackTimer = 2.5;
        }
        for (const shot of this.shots) {
            shot.life -= dt;
            shot.x += shot.vx * dt;
            shot.y += shot.vy * dt;
            if (shot.kind === "player" && intersects(shot, this.body)) {
                this.damage();
                shot.life = 0;
            } else if (shot.kind === "enemy" && intersects(shot, p)) {
                this.callbacks.hurt();
                shot.life = 0;
            }
        }
        this.shots = this.shots.filter(shot =>
            shot.life > 0 && shot.x > -40 && shot.x < this.worldWidth + 40 && shot.y > -40 && shot.y < GY + 40,
        );
        if (this.health && intersects(p, this.body))
            this.callbacks.hurt();
    }
    render(c) {
        const r = (x, y, w, h, color) => {
            c.fillStyle = color;
            c.fillRect(Math.round(x), Math.round(y), w, h);
        };
        const { x, y, w, h } = this.body;
        if (this.defeated) {
            r(x + 18, y + 52, 36, 8, "#c8ccd4");
        } else {
            const color = this.theme.color;
            const dark = this.theme.deco === "city" ? "#5a3c68" : "#31513b";
            const bounce = Math.sin(this.elapsed * 5) * 2;
            r(x + 12, y + 20 + bounce, 48, 40, color);
            r(x + 6, y + 30 + bounce, 60, 22, color);
            r(x + 18, y + 10 + bounce, 36, 16, dark);
            r(x + 20, y + 32 + bounce, 9, 10, "#fff");
            r(x + 44, y + 32 + bounce, 9, 10, "#fff");
            r(x + 23, y + 35 + bounce, 4, 6, "#1d2522");
            r(x + 47, y + 35 + bounce, 4, 6, "#1d2522");
            r(x + 28, y + 50 + bounce, 16, 5, dark);
            r(x + 16, y + 60, 12, 12, dark);
            r(x + 44, y + 60, 12, 12, dark);
            if (this.theme.target === "bottle") {
                r(x + 2, y + 6 + bounce, 12, 22, "#72c8ed");
                r(x + 5, y + 1 + bounce, 6, 7, "#3174aa");
                r(x + 57, y + 12 + bounce, 12, 18, "#c8ccd4");
                r(x + 60, y + 8 + bounce, 6, 5, "#9aa0aa");
            } else if (this.theme.target === "can") {
                r(x + 4, y + 14 + bounce, 12, 18, "#c8ccd4");
                r(x + 6, y + 10 + bounce, 8, 5, "#9aa0aa");
            } else if (this.theme.target === "seedling") {
                r(x + 1, y + 10 + bounce, 3, 20, "#704b2c");
                r(x - 2, y + 10 + bounce, 10, 5, "#56c02b");
            } else if (this.theme.target === "bag") {
                r(x + 4, y + 12 + bounce, 12, 16, "#f4f4f4");
                r(x + 6, y + 7 + bounce, 3, 8, "#f4f4f4");
                r(x + 12, y + 7 + bounce, 3, 8, "#f4f4f4");
            }
        }
        for (const shot of this.shots)
            r(shot.x, shot.y, shot.w, shot.h, shot.kind === "player" ? "#ffe173" : "#96db55");
    }
}

export class BossBattle {
    callbacks;
    body = { x: 348, y: 292, w: 104, h: 94 };
    hits = 0;
    cooldown = 0;
    bombs = 0;
    elapsed = 0;
    purifiedFor = 0;
    shots = [];
    pickups = [{ x: 183, y: 254, w: 22, h: 24, wait: 0 }, { x: 389, y: 204, w: 22, h: 24, wait: 0 }, { x: 585, y: 254, w: 22, h: 24, wait: 0 }];
    minions = [
        { x: 25, y: GY - 32, w: 24, h: 32, vx: 32, min: 15, max: 105, respawn: 0, timer: 4 },
        { x: 745, y: GY - 32, w: 24, h: 32, vx: -32, min: 690, max: 760, respawn: 0, timer: 5 },
    ];
    mudTimer = 3.5;
    waveTimer = 5;
    trashTimer = 6;
    throwHeld = false;
    shootTimer = 0;
    trash = [];
    constructor(callbacks) {
        this.callbacks = callbacks;
    }
    get health() { return BOSS_HITS - this.hits; }
    get tier() { return Math.floor(this.hits / 3); }
    get projectileSpeed() { return 120 + this.tier * 25; }
    get trashInterval() { return 5 / (1 + this.tier * 0.5); }
    damage() {
        if (this.cooldown > 0 || this.health === 0)
            return false;
        this.hits++;
        this.cooldown = 0.8;
        this.callbacks.hit(this.hits);
        return true;
    }
    update(dt, p, throwing, shooting = false) {
        this.elapsed += dt;
        this.cooldown = Math.max(0, this.cooldown - dt);
        this.shootTimer = Math.max(0, this.shootTimer - dt);
        if (!this.health) {
            this.purifiedFor += dt;
            if (this.purifiedFor >= 2)
                this.callbacks.win();
            return;
        }
        if (shooting && this.shootTimer <= 0) {
            const direction = p.face || 1;
            this.shots.push({
                x: p.x + (direction > 0 ? p.w : -12),
                y: p.y + 14,
                w: 12,
                h: 6,
                vx: direction * 480,
                vy: 0,
                kind: "player",
                life: 2,
            });
            this.shootTimer = 0.9;
        }
        for (const it of this.pickups) {
            it.wait = Math.max(0, it.wait - dt);
            if (!it.wait && intersects(p, it)) {
                this.bombs++;
                it.wait = 6;
                this.callbacks.collect();
            }
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
            if (p.vy > 0 && p.y + p.h - this.body.y < 20) {
                p.y = this.body.y - p.h;
                p.vy = -540;
                this.damage();
            }
            else
                this.callbacks.hurt();
        }
        this.mudTimer -= dt;
        this.waveTimer -= dt;
        this.trashTimer -= dt;
        if (this.mudTimer <= 0) {
            this.mudTimer = MUD_ATTACK_INTERVAL / (1 + this.tier * 0.1);
            for (let k = 0; k < 3; k++) {
                const landing = 30 + Math.random() * 740;
                this.shots.push({ x: 390, y: 286, w: 14, h: 14, vx: (landing - 390) / 1.7, vy: -500 - this.tier * 30, kind: "mud", life: 4 });
            }
        }
        if (this.waveTimer <= 0) {
            this.waveTimer = WAVE_ATTACK_INTERVAL / (1 + this.tier * 0.1);
            for (const sign of [-1, 1])
                this.shots.push({ x: 400, y: GY - 14, w: 26, h: 14, vx: sign * this.projectileSpeed, vy: 0, kind: "wave", life: 5 });
        }
        if (this.trashTimer <= 0) {
            this.trashTimer = this.trashInterval;
            this.trash.push({ x: 100 + Math.random() * 580, y: GY - 22, w: 16, h: 22, life: 12 });
        }
        for (const m of this.minions) {
            if (m.respawn > 0) {
                m.respawn = Math.max(0, m.respawn - dt);
                continue;
            }
            m.x += m.vx * dt;
            if (m.x < m.min || m.x > m.max) {
                m.x = Math.max(m.min, Math.min(m.max, m.x));
                m.vx *= -1;
            }
            m.timer -= dt;
            if (m.timer <= 0) {
                m.timer = MINION_SHOT_INTERVAL / (1 + this.tier * 0.08);
                const dx = p.x - m.x, dy = p.y + 12 - (m.y + 12), len = Math.max(1, Math.hypot(dx, dy));
                this.shots.push({ x: m.x + 12, y: m.y + 12, w: 10, h: 6, vx: dx / len * this.projectileSpeed, vy: dy / len * this.projectileSpeed, kind: "shot", life: 6 });
            }
            if (intersects(p, m)) {
                if (p.vy > 0 && p.y + p.h - m.y < 18) {
                    m.respawn = MINION_RESPAWN;
                    m.timer = 2;
                    p.vy = -420;
                    this.callbacks.stomp();
                }
                else
                    this.callbacks.hurt();
            }
        }
        for (const s of this.shots) {
            s.life -= dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.kind === "mud")
                s.vy += 600 * dt;
            if ((s.kind === "bomb" || s.kind === "player") && intersects(s, this.body)) {
                this.damage();
                s.life = 0;
            }
            else if (s.kind !== "bomb" && s.kind !== "player" && intersects(s, p)) {
                this.callbacks.hurt();
                s.life = 0;
            }
            if (s.y > GY && s.kind === "mud")
                s.life = 0;
        }
        this.shots = this.shots.filter(s => s.life > 0 && s.x > -40 && s.x < 840);
        for (const t of this.trash) {
            t.life -= dt;
            if (intersects(t, p)) {
                t.life = 0;
                this.callbacks.collect();
            }
        }
        this.trash = this.trash.filter(t => t.life > 0);
    }
    render(c) {
        const r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
        if (!this.health) {
            r(390, 300, 20, 86, "#805534");
            r(344, 258, 112, 58, "#3e9f46");
            r(360, 232, 80, 38, "#65c343");
            r(375, 245, 12, 9, "#93df68");
        }
        else {
            const flash = this.cooldown > 0 && Math.floor(this.elapsed * 16) % 2;
            r(348, 298, 104, 88, flash ? "#f1ebb6" : "#3c7351");
            r(340, 292, 120, 12, "#a3b2a0");
            r(344, 326, 112, 9, "#727d74");
            r(344, 368, 112, 9, "#727d74");
            r(354, 309, 7, 52, "#8faa80");
            r(392, 311, 8, 15, "#1e2b25");
            r(400, 323, 10, 12, "#1e2b25");
            r(390, 334, 15, 32, "#8bdc3f");
            r(382, 376, 38, 10, "#8bdc3f");
            r(367, 315, 14, 8, "#f5e66c");
            r(420, 315, 14, 8, "#f5e66c");
            for (let k = 0; k < 4; k++)
                r(360 + k * 22, 287 + Math.sin(this.elapsed * 4 + k) * 3, 9, 6, "#9fec49");
        }
        for (const m of this.minions)
            if (!m.respawn && this.health) {
                r(m.x + 3, m.y, 18, 14, "#172820");
                r(m.x + 2, m.y + 5, 20, 4, "#699a46");
                r(m.x + 7, m.y + 6, 10, 2, "#efde72");
                r(m.x + 2, m.y + 14, 20, 12, "#274332");
                r(m.x + 3, m.y + 26, 7, 6, "#172820");
                r(m.x + 14, m.y + 26, 7, 6, "#172820");
            }
        for (const it of this.pickups)
            if (!it.wait && this.health) {
                r(it.x + 3, it.y + 5, 16, 17, "#e6eeda");
                r(it.x + 5, it.y + 9, 12, 8, "#3d9747");
                r(it.x + 9, it.y, 4, 5, "#f2d44c");
            }
        for (const t of this.trash) {
            r(t.x, t.y, 16, 22, "#bdc9c1");
            r(t.x, t.y + 6, 16, 8, "#ce654d");
        }
        for (const s of this.shots)
            r(s.x, s.y, s.w, s.h, s.kind === "bomb" ? "#e6eeda" : s.kind === "player" ? "#ffe173" : s.kind === "shot" ? "#efde72" : "#8bdc3f");
    }
}
