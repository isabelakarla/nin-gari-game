import { audio } from "./game/audio.js";
import { Game, MAX_LIVES, VH, VW } from "./game/engine.js";
import { THEMES } from "./game/levels.js";

const canvas = document.querySelector("#game-canvas");
const context = canvas?.getContext("2d");
if (!canvas || !context) {
  throw new Error("Não foi possível inicializar o canvas do jogo.");
}

const elements = {
  score: document.querySelector("#score"),
  trash: document.querySelector("#trash"),
  level: document.querySelector("#level"),
  odsBadge: document.querySelector("#ods-badge"),
  odsLabel: document.querySelector("#ods-label"),
  lives: document.querySelector("#lives"),
  pauseButton: document.querySelector("#pause-button"),
  soundButton: document.querySelector("#sound-button"),
  missionBar: document.querySelector("#mission-bar"),
  missionText: document.querySelector("#mission-text"),
  missionProgress: document.querySelector("#mission-progress"),
  bossBar: document.querySelector("#boss-bar"),
  bossHealth: document.querySelector("#boss-health"),
  bossName: document.querySelector("#boss-name"),
  bossHealthLabel: document.querySelector("#boss-health-label"),
  shootButton: document.querySelector("#shoot-button"),
  throwButton: document.querySelector("#throw-button"),
  bombCount: document.querySelector("#bomb-count"),
  overlay: document.querySelector("#overlay"),
  touchControls: document.querySelector("#touch-controls"),
};

let game = null;
let hud = null;
let fact = null;
let story = null;
let stats = null;
let screen = "menu";
let paused = false;
let muted = false;
let endTimer = 0;

context.imageSmoothingEnabled = false;
elements.touchControls.hidden = !("ontouchstart" in window || navigator.maxTouchPoints > 0);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function odsBadge(ods, name, color, small = false) {
  const sizeClass = small ? " ods-badge-small" : "";
  return `<span class="ods-badge${sizeClass}" style="background-color:${escapeHTML(color)}" title="ODS ${ods} · ${escapeHTML(name)}"><span>ODS</span><span class="ods-number">${ods}</span>${small ? "" : `<span>${escapeHTML(name)}</span>`}</span>`;
}

function showOverlay(html) {
  if (!elements.overlay.hidden && elements.overlay.innerHTML === html) {
    return;
  }
  const wasHidden = elements.overlay.hidden;
  elements.overlay.innerHTML = html;
  elements.overlay.hidden = false;
  elements.overlay.setAttribute("aria-hidden", "false");
  if (wasHidden) {
    elements.overlay.querySelector("button")?.focus();
  }
}

function hideOverlay() {
  elements.overlay.hidden = true;
  elements.overlay.setAttribute("aria-hidden", "true");
  elements.overlay.replaceChildren();
}

function renderHUD() {
  elements.score.textContent = hud ? String(hud.score) : "0";
  elements.trash.textContent = hud ? String(hud.trash) : "0";
  elements.level.textContent = hud ? `${hud.level} / ${hud.totalLevels}` : `- / ${THEMES.length}`;

  if (hud) {
    elements.odsBadge.outerHTML = `<span class="ods-badge ods-badge-small" id="ods-badge" aria-hidden="true" style="background-color:${escapeHTML(hud.color)}"><span>ODS</span><span class="ods-number">${hud.ods}</span></span>`;
    elements.odsBadge = document.querySelector("#ods-badge");
    elements.odsLabel.textContent = `ODS ${hud.ods} · ${hud.odsName}`;
    elements.missionBar.hidden = screen !== "playing";
    elements.missionText.textContent = hud.portalOpen
      ? "Portal aberto! Vá até o final da fase ➜"
      : hud.bossHealth !== null
        ? hud.level === 5 ? "A FONTE DA TOXICIDADE · Atire com X" : `Derrote ${hud.bossName} · Atire com X`
        : `${hud.mission} · Cuidado: ${THEMES[hud.level - 1]?.enemyName ?? ""}`;
    elements.missionProgress.textContent = hud.bossHealth !== null
      ? `${hud.bossMaxHealth - hud.bossHealth}/${hud.bossMaxHealth}`
      : `${Math.min(hud.got, hud.need)}/${hud.need}`;

    const inBossBattle = hud.bossHealth !== null && hud.bossHealth > 0;
    elements.bossBar.hidden = screen !== "playing" || !inBossBattle;
    elements.bossName.textContent = hud.bossName;
    elements.bossHealth.max = hud.bossMaxHealth;
    elements.bossHealth.value = hud.bossHealth ?? 0;
    elements.bossHealthLabel.textContent = `${hud.bossHealth ?? 0}/${hud.bossMaxHealth}`;
    elements.bossHealth.setAttribute("aria-label", `Vida de ${hud.bossName}`);
    elements.shootButton.hidden = !inBossBattle;
    elements.throwButton.hidden = !inBossBattle || hud.level !== 5;
    elements.throwButton.disabled = !hud.bombs;
    elements.throwButton.setAttribute("aria-label", `Lançar bomba (${hud.bombs})`);
    elements.bombCount.textContent = String(hud.bombs);
  }

  const lives = hud?.lives ?? MAX_LIVES;
  elements.lives.setAttribute("aria-label", `${lives} vidas`);
  elements.lives.innerHTML = Array.from({ length: MAX_LIVES }, (_, index) =>
    `<span class="heart${index < lives ? "" : " heart-empty"}" aria-hidden="true"></span>`,
  ).join("");

  elements.pauseButton.disabled = screen !== "playing";
  elements.pauseButton.textContent = paused ? "▶" : "❚❚";
  elements.pauseButton.setAttribute("aria-label", paused ? "Continuar jogo" : "Pausar jogo");
  elements.soundButton.textContent = muted ? "🔇" : "🔊";
  elements.soundButton.setAttribute("aria-label", muted ? "Ativar som" : "Silenciar som");
}

function renderOverlay() {
  if (screen === "menu") {
    const flags = THEMES.map((theme) =>
      odsBadge(theme.ods, theme.odsName, theme.color),
    ).join("");
    showOverlay(`
      <h2 class="overlay-title">Nin-Gari:<span>A Lenda do Reciclador</span></h2>
      <p class="overlay-copy">Um ninja catador de lixo em missões pelos Objetivos de Desenvolvimento Sustentável</p>
      <p class="overlay-copy overlay-copy-small">Os Monstros da Poluição invadiram o mundo. Só Nin-Gari, o lendário reciclador, pode limpar as quatro regiões e enfrentar a fonte da toxicidade para salvar o planeta!</p>
      <div class="ods-list">${flags}</div>
      <button class="btn-pixel fact-action" type="button" data-action="start">▶ JOGAR</button>
      <p class="overlay-copy overlay-copy-small">← → / A D mover · Espaço / W / ↑ pular · Segure X para atirar nos monstros · E lança bombas na fase final · P pausar</p>
    `);
    return;
  }

  if (screen === "end" && stats) {
    const title = stats.win ? "PLANETA SALVO!" : "FIM DE JOGO";
    const summary = stats.win
      ? "Você mostrou que pequenas atitudes mudam o mundo. Separe o lixo, economize energia e cuide da natureza também na vida real!"
      : `Você chegou à fase ${stats.level}. Todo resíduo recolhido já faz diferença — tente de novo e continue cuidando do planeta!`;
    const ending = stats.win
      ? '<p class="ending-copy">As quatro regiões estão livres e a fonte da toxicidade foi purificada! O Giga-Barril se tornou uma árvore. O rio corre limpo, o vale tem energia limpa, a floresta cresce e a cidade respira. A lenda continua com cada pessoa que cuida do planeta.</p>'
      : "";
    showOverlay(`
      <section class="fact-card" aria-labelledby="end-title">
        <h2 class="overlay-title" id="end-title">${title}</h2>
        <div class="stat-grid">
          <div class="stat-box"><div class="stat-number">${stats.score}</div><div class="stat-name">Pontuação</div></div>
          <div class="stat-box"><div class="stat-number">${stats.trash}</div><div class="stat-name">Resíduos reciclados</div></div>
          <div class="stat-box"><div class="stat-number">${stats.seedlings}</div><div class="stat-name">Mudas plantadas</div></div>
          <div class="stat-box"><div class="stat-number">${stats.enemies}</div><div class="stat-name">Poluidores vencidos</div></div>
        </div>
        ${ending}
        <p class="fact-copy">${summary}</p>
        <button class="btn-pixel fact-action" type="button" data-action="start">↻ JOGAR NOVAMENTE</button>
      </section>
    `);
    return;
  }

  if (fact && hud) {
    showOverlay(`
      <section class="fact-card" aria-labelledby="fact-title">
        <div class="fact-heading">
          ${odsBadge(fact.ods, fact.odsName, fact.color)}
          <span class="fact-subtitle">ODS ${fact.ods} · ${escapeHTML(fact.odsName)}</span>
        </div>
        <h2 class="fact-title" id="fact-title">${escapeHTML(fact.title)}</h2>
        <p class="fact-copy">${escapeHTML(fact.text)}</p>
        <p class="fact-tip">💡 Dica: ${escapeHTML(fact.tip)}</p>
        <button class="btn-pixel fact-action" type="button" data-action="close-fact">CONTINUAR ➜</button>
      </section>
    `);
    return;
  }

  if (paused && screen === "playing") {
    showOverlay(`
      <h2 class="overlay-title">PAUSADO</h2>
      <button class="btn-pixel fact-action" type="button" data-action="resume">▶ CONTINUAR</button>
      <button class="btn-pixel btn-pixel-ghost fact-action" type="button" data-action="start">↻ REINICIAR</button>
    `);
    return;
  }

  if (story !== null && screen === "playing") {
    const chapter = THEMES[story];
    if (chapter) {
      showOverlay(`
        <section class="fact-card" aria-labelledby="chapter-title">
          <div class="fact-heading">
            ${odsBadge(chapter.ods, chapter.odsName, chapter.color)}
            <div>
              <div class="fact-subtitle">CAPÍTULO ${story + 1}</div>
              <h2 class="fact-title" id="chapter-title">${escapeHTML(chapter.title)}</h2>
            </div>
          </div>
          <p class="fact-copy">${escapeHTML(chapter.story)}</p>
          <button class="btn-pixel fact-action" type="button" data-action="close-story">COMEÇAR ➜</button>
        </section>
      `);
      return;
    }
  }

  hideOverlay();
}

function renderUI() {
  renderHUD();
  renderOverlay();
}

function startGame() {
  window.clearTimeout(endTimer);
  audio.unlock();
  fact = null;
  story = null;
  stats = null;
  paused = false;
  hud = null;
  screen = "playing";
  renderUI();

  game = new Game({
    onHud(nextHud) {
      hud = nextHud;
      renderUI();
    },
    onFact(nextFact) {
      fact = nextFact;
      renderUI();
    },
    onLevel(index) {
      story = index;
      renderUI();
    },
    onEnd(result) {
      stats = result;
      endTimer = window.setTimeout(() => {
        screen = "end";
        renderUI();
      }, 600);
    },
  });
}

function drawMenuBackground(time) {
  const gradient = context.createLinearGradient(0, 0, 0, VH);
  gradient.addColorStop(0, "#1f6f9f");
  gradient.addColorStop(1, "#56c02b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, VW, VH);

  const colors = ["#0a97d9", "#fcc30b", "#56c02b", "#fd9d24"];
  for (let index = 0; index < 40; index++) {
    const x = (index * 97 + time * 20 * ((index % 3) + 1)) % VW;
    const y = (index * 53) % VH;
    context.fillStyle = colors[index % colors.length];
    context.fillRect(Math.round(x), y, 8, 8);
  }

  context.fillStyle = "rgb(0 0 0 / 35%)";
  context.fillRect(0, 0, VW, VH);
}

const fixedStep = 1 / 60;
let lastFrame = performance.now();
let accumulator = 0;
function frame(now) {
  accumulator += Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;

  if (game) {
    while (accumulator >= fixedStep) {
      if (!paused && !fact && story === null && screen === "playing") {
        game.update(fixedStep);
      }
      accumulator -= fixedStep;
    }
    game.render(context);
  } else {
    accumulator = 0;
    drawMenuBackground(now / 1000);
  }

  window.requestAnimationFrame(frame);
}
window.requestAnimationFrame(frame);

function setControl(name, pressed, queueAction = false) {
  if (!game) return;
  game.input[name] = pressed;
  if (name === "throw" && pressed && queueAction) {
    game.throwQueued = true;
  }
  if (name === "shoot" && pressed && queueAction) {
    game.shootQueued = true;
  }
}

function togglePause() {
  if (screen !== "playing") return;
  paused = !paused;
  renderUI();
}

elements.pauseButton.addEventListener("click", togglePause);
elements.soundButton.addEventListener("click", () => {
  muted = !muted;
  audio.setMuted(muted);
  renderHUD();
});
elements.throwButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  audio.unlock();
  setControl("throw", true, true);
});
for (const eventName of ["pointerup", "pointercancel", "lostpointercapture", "pointerleave"]) {
  elements.throwButton.addEventListener(eventName, () => setControl("throw", false));
}
elements.throwButton.addEventListener("contextmenu", (event) => event.preventDefault());
elements.shootButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  audio.unlock();
  setControl("shoot", true, true);
});
for (const eventName of ["pointerup", "pointercancel", "lostpointercapture", "pointerleave"]) {
  elements.shootButton.addEventListener(eventName, () => setControl("shoot", false));
}
elements.shootButton.addEventListener("contextmenu", (event) => event.preventDefault());

elements.overlay.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  switch (button.dataset.action) {
    case "start":
      startGame();
      break;
    case "resume":
      paused = false;
      renderUI();
      break;
    case "close-fact":
      fact = null;
      renderUI();
      break;
    case "close-story":
      story = null;
      renderUI();
      break;
  }
});

for (const button of elements.touchControls.querySelectorAll("[data-control]")) {
  const name = button.dataset.control;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    audio.unlock();
    button.setPointerCapture(event.pointerId);
    setControl(name, true);
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(eventName, () => setControl(name, false));
  }
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

const keyControls = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
  KeyX: "shoot",
  KeyE: "throw",
};

window.addEventListener("keydown", (event) => {
  const control = keyControls[event.code];
  if (control) {
    event.preventDefault();
    if (control === "throw" || control === "shoot") {
      if (!event.repeat) {
        setControl(control, true, true);
      }
    } else {
      setControl(control, true);
    }
  }

  if (!event.repeat && screen === "playing" && (event.code === "KeyP" || event.code === "Escape")) {
    togglePause();
  }

  if (!event.repeat && event.code === "Enter") {
    if (screen === "menu" || screen === "end") {
      startGame();
      return;
    }
    if (paused && screen === "playing") {
      togglePause();
      return;
    }
    if (fact) {
      fact = null;
      renderUI();
    } else if (story !== null) {
      story = null;
      renderUI();
    }
  }
});

window.addEventListener("keyup", (event) => {
  const control = keyControls[event.code];
  if (control) {
    event.preventDefault();
    setControl(control, false);
  }
});

window.addEventListener("blur", () => {
  if (game) {
    for (const control of Object.keys(game.input)) {
      game.input[control] = false;
    }
  }
});

renderUI();
