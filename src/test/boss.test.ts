import { describe, expect, it, vi } from "vitest";
import { BossBattle } from "@/game/boss";
import { Game, type Fact } from "@/game/engine";
import { buildLevel, THEMES } from "@/game/levels";
const player = () => ({ x: 280, y: 150, w: 22, h: 30, vx: 0, vy: 0, face: 1 });
const create = () => new BossBattle({ hurt: vi.fn(), hit: vi.fn(), collect: vi.fn(), stomp: vi.fn(), win: vi.fn() });
describe("Final arena rules", () => {
  it("has five chapters and an ODS 13 final arena", () => { expect(THEMES).toHaveLength(5); expect(THEMES[4]?.ods).toBe(13); });
  it("has full-width ground and exactly three floating platforms in an 800px fixed arena", () => {
    const level = buildLevel(4); expect(level.width).toBe(800);
    expect(level.platforms.filter(p => !p.ground)).toHaveLength(3);
    expect(level.platforms.find(p => p.ground)).toMatchObject({ x: 0, w: 800 });
  });
  it("requires ten distinct hits to purify the boss", () => {
    const b = create(); for (let i = 0; i < 9; i++) { b.cooldown = 0; b.damage(); }
    expect(b.health).toBe(1); b.cooldown = 0; b.damage(); expect(b.health).toBe(0);
    b.cooldown = 0; expect(b.damage()).toBe(false); expect(b.hits).toBe(10);
  });
  it("increases projectile speed and trash frequency every three hits", () => {
    const b = create(); const speed = b.projectileSpeed, interval = b.trashInterval;
    for (let i = 0; i < 2; i++) { b.cooldown = 0; b.damage(); }
    expect(b.projectileSpeed).toBe(speed); b.cooldown = 0; b.damage();
    expect(b.projectileSpeed).toBeGreaterThan(speed); expect(b.trashInterval).toBeLessThan(interval);
    for (const threshold of [6, 9]) { const old = b.projectileSpeed; while (b.hits < threshold) { b.cooldown = 0; b.damage(); } expect(b.projectileSpeed).toBeGreaterThan(old); }
  });
  it("respawns stomped minions after exactly fifteen seconds", () => {
    const b = create(), m = b.minions[0]; if (!m) throw new Error("Missing minion");
    b.update(0, { ...player(), x: m.x, y: m.y - 26, vy: 100 }, false);
    expect(m.respawn).toBe(15); b.update(14.9, player(), false); expect(m.respawn).toBeCloseTo(0.1);
    b.update(0.1, player(), false); expect(m.respawn).toBeCloseTo(0);
  });
  it("collects bombs and throws one per button press to damage the barrel", () => {
    const b = create(), p = { ...player(), x: 183, y: 254 };
    b.update(0, p, false); expect(b.bombs).toBe(1);
    for (let i = 0; i < 60; i++) b.update(1 / 60, player(), true);
    expect(b.bombs).toBe(0); expect(b.health).toBe(9);
  });
  it("damages the barrel with a descending stomp", () => {
    const b = create(), p = { ...player(), x: 350, y: 266, vy: 200 };
    b.update(0, p, false); expect(b.health).toBe(9); expect(p.vy).toBeLessThan(0);
  });
  it("shows climate learning at half health and defeat, and preserves earlier scores", () => {
    const facts: Fact[] = [], end = vi.fn();
    const g = new Game({ onHud: vi.fn(), onFact: f => facts.push(f), onEnd: end });
    g.score = 1234; g.load(4); const b = g.boss; if (!b) throw new Error("Missing boss");
    for (let i = 0; i < 4; i++) { b.cooldown = 0; b.damage(); }
    expect(facts).toHaveLength(0); b.cooldown = 0; b.damage(); expect(facts.map(f => f.ods)).toEqual([13]);
    for (let i = 0; i < 5; i++) { b.cooldown = 0; b.damage(); }
    expect(facts.map(f => f.ods)).toEqual([13, 13]); expect(end).not.toHaveBeenCalled();
    b.update(2, player(), false); expect(end).toHaveBeenCalledWith(expect.objectContaining({ win: true, score: 2384, level: 5 }));
    b.update(2, player(), false); expect(end).toHaveBeenCalledTimes(1);
  });
  it("advances through the fourth portal to the boss instead of winning early", () => {
    const end = vi.fn(), g = new Game({ onHud: vi.fn(), onFact: vi.fn(), onEnd: end });
    g.load(3); g.portalOpen = true; Object.assign(g.p, { x: g.lvl.portal.x, y: g.lvl.portal.y, vx: 0, vy: 0 });
    g.update(0); expect(g.li).toBe(4); expect(g.boss).toBeInstanceOf(BossBattle); expect(end).not.toHaveBeenCalled();
  });
});