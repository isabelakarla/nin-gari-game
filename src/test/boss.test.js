import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BossBattle, LEVEL_BOSS_HITS, LevelBoss, MINION_SHOT_INTERVAL, MUD_ATTACK_INTERVAL, WAVE_ATTACK_INTERVAL } from "../game/boss.js";
import { Game, MAX_LIVES } from "../game/engine.js";
import { buildLevel, THEMES } from "../game/levels.js";

const player = () => ({ x: 280, y: 150, w: 22, h: 30, vx: 0, vy: 0, face: 1 });
const callbacks = () => ({
  hurt() {},
  hit() {},
  collect() {},
  stomp() {},
  win() {},
});

describe("Regras da arena final", () => {
  it("tem cinco capítulos e uma arena final ODS 13", () => {
    assert.equal(THEMES.length, 5);
    assert.equal(THEMES[4].ods, 13);
  });

  it("começa cada partida com sete vidas e sete corações no HUD", () => {
    const hudUpdates = [];
    const game = new Game({
      onHud(hud) {
        hudUpdates.push(hud);
      },
      onFact() {},
      onEnd() {},
    });
    assert.equal(MAX_LIVES, 7);
    assert.equal(game.lives, MAX_LIVES);
    assert.equal(hudUpdates[0]?.lives, MAX_LIVES);
  });

  it("só abre o portal depois de coletar os itens e derrotar o monstro da fase", () => {
    const game = new Game({
      onHud() {},
      onFact() {},
      onEnd() {},
    });
    game.got = THEMES[0].targetCount - 1;
    const lastTarget = game.items.find((item) => item.kind === THEMES[0].target);
    assert.ok(lastTarget);
    Object.assign(game.p, { x: lastTarget.x, y: lastTarget.y, vx: 0, vy: 0 });

    game.update(0);

    assert.ok(game.boss instanceof LevelBoss);
    assert.equal(game.boss.health, LEVEL_BOSS_HITS);
    assert.equal(game.portalOpen, false);
    while (game.boss.health) {
      game.boss.damage();
    }
    assert.equal(game.portalOpen, true);
  });

  it("dispara projéteis em X que atingem o monstro comum", () => {
    const hits = [];
    const boss = new LevelBoss(THEMES[0], 200, {
      hurt() {},
      hit(count) {
        hits.push(count);
      },
      win() {},
    }, 800);
    const target = { ...player(), x: 100, y: 356 };

    boss.update(0.2, target, true);

    assert.equal(boss.health, LEVEL_BOSS_HITS - 1);
    assert.deepEqual(hits, [1]);
  });

  it("dá ao jogador tempo para desviar dos tiros na arena final", () => {
    const battle = new BossBattle(callbacks());
    assert.equal(battle.minions[0]?.timer, 4);
    assert.equal(battle.minions[1]?.timer, 5);
    assert.equal(battle.projectileSpeed, 120);
    assert.equal(MINION_SHOT_INTERVAL, 4.5);
    assert.equal(MUD_ATTACK_INTERVAL, 4.5);
    assert.equal(WAVE_ATTACK_INTERVAL, 7);
    battle.hits = 9;
    assert.equal(battle.projectileSpeed, 195);
    assert.ok(MINION_SHOT_INTERVAL / (1 + battle.tier * 0.08) > 3.5);
    assert.ok(MUD_ATTACK_INTERVAL / (1 + battle.tier * 0.1) > 3);
    assert.ok(WAVE_ATTACK_INTERVAL / (1 + battle.tier * 0.1) > 5);
    battle.hits = 0;

    const target = { ...player(), x: 400, y: 0 };
    for (let index = 0; index < 180; index++) {
      battle.update(1 / 60, target, false);
    }
    assert.equal(battle.shots.filter((shot) => shot.kind === "shot").length, 0);

    for (let index = 180; index < 246; index++) {
      battle.update(1 / 60, target, false);
    }
    assert.equal(battle.shots.filter((shot) => shot.kind === "shot").length, 1);
  });

  it("constrói a arena com chão e três plataformas flutuantes", () => {
    const level = buildLevel(4);
    assert.equal(level.width, 800);
    assert.equal(level.platforms.filter((platform) => !platform.ground).length, 3);
    assert.deepEqual(level.platforms.find((platform) => platform.ground), {
      x: 0,
      y: 386,
      w: 800,
      h: 64,
      ground: true,
    });
  });

  it("exige dez acertos distintos para purificar o chefe", () => {
    const battle = new BossBattle(callbacks());
    for (let index = 0; index < 9; index++) {
      battle.cooldown = 0;
      battle.damage();
    }
    assert.equal(battle.health, 1);
    battle.cooldown = 0;
    battle.damage();
    assert.equal(battle.health, 0);
    battle.cooldown = 0;
    assert.equal(battle.damage(), false);
    assert.equal(battle.hits, 10);
  });

  it("aumenta a velocidade dos projéteis e a frequência do lixo a cada três acertos", () => {
    const battle = new BossBattle(callbacks());
    const initialSpeed = battle.projectileSpeed;
    const initialInterval = battle.trashInterval;
    for (let index = 0; index < 3; index++) {
      battle.cooldown = 0;
      battle.damage();
    }
    assert.ok(battle.projectileSpeed > initialSpeed);
    assert.ok(battle.trashInterval < initialInterval);

    for (const threshold of [6, 9]) {
      const previousSpeed = battle.projectileSpeed;
      while (battle.hits < threshold) {
        battle.cooldown = 0;
        battle.damage();
      }
      assert.ok(battle.projectileSpeed > previousSpeed);
    }
  });

  it("reaparece os minions pisoteados após quinze segundos", () => {
    const battle = new BossBattle(callbacks());
    const minion = battle.minions[0];
    assert.ok(minion);
    battle.update(0, { ...player(), x: minion.x, y: minion.y - 26, vy: 100 }, false);
    assert.equal(minion.respawn, 15);
    battle.update(14.9, player(), false);
    assert.ok(Math.abs(minion.respawn - 0.1) < 1e-9);
    battle.update(0.1, player(), false);
    assert.equal(minion.respawn, 0);
  });

  it("coleta bombas e lança somente uma por pressionamento do botão", () => {
    const battle = new BossBattle(callbacks());
    battle.update(0, { ...player(), x: 183, y: 254 }, false);
    assert.equal(battle.bombs, 1);
    for (let index = 0; index < 60; index++) {
      battle.update(1 / 60, player(), true);
    }
    assert.equal(battle.bombs, 0);
    assert.equal(battle.health, 9);
  });

  it("dispara balas no chefe da arena final", () => {
    const battle = new BossBattle(callbacks());
    const target = { ...player(), x: 260, y: 300 };
    for (let index = 0; index < 4; index++) {
      battle.update(0.1, target, false, true);
    }
    assert.equal(battle.health, 9);
  });

  it("o pisão descendente também causa dano ao chefe", () => {
    const battle = new BossBattle(callbacks());
    const jumpingPlayer = { ...player(), x: 350, y: 266, vy: 200 };
    battle.update(0, jumpingPlayer, false);
    assert.equal(battle.health, 9);
    assert.ok(jumpingPlayer.vy < 0);
  });

  it("mantém os pontos anteriores e mostra fatos educativos durante a batalha", () => {
    const facts = [];
    const endings = [];
    const game = new Game({
      onHud() {},
      onFact(fact) {
        facts.push(fact);
      },
      onEnd(ending) {
        endings.push(ending);
      },
    });
    game.score = 1234;
    game.load(4);
    const battle = game.boss;
    assert.ok(battle);
    for (let index = 0; index < 4; index++) {
      battle.cooldown = 0;
      battle.damage();
    }
    assert.equal(facts.length, 0);
    battle.cooldown = 0;
    battle.damage();
    assert.deepEqual(facts.map((fact) => fact.ods), [13]);
    for (let index = 0; index < 5; index++) {
      battle.cooldown = 0;
      battle.damage();
    }
    assert.deepEqual(facts.map((fact) => fact.ods), [13, 13]);
    assert.equal(endings.length, 0);
    battle.update(2, player(), false);
    assert.deepEqual(endings, [
      { score: 2584, trash: 0, seedlings: 0, enemies: 1, level: 5, win: true },
    ]);
    battle.update(2, player(), false);
    assert.equal(endings.length, 1);
  });

  it("avança pelo quarto portal até a arena final sem encerrar a partida", () => {
    const endings = [];
    const game = new Game({
      onHud() {},
      onFact() {},
      onEnd(ending) {
        endings.push(ending);
      },
    });
    game.load(3);
    game.portalOpen = true;
    Object.assign(game.p, {
      x: game.lvl.portal.x,
      y: game.lvl.portal.y,
      vx: 0,
      vy: 0,
    });
    game.update(0);
    assert.equal(game.li, 4);
    assert.ok(game.boss instanceof BossBattle);
    assert.equal(endings.length, 0);
  });
});
