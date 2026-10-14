import { useCallback, useEffect, useRef, useState } from "react";
import { Game, VH, VW, type Fact, type Hud, type Stats } from "@/game/engine";
import { audio } from "@/game/audio";
import { THEMES } from "@/game/levels";

type Screen = "menu" | "playing" | "end";

export default function EcoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [screen, setScreen] = useState<Screen>("menu");
  const [hud, setHud] = useState<Hud | null>(null);
  const [fact, setFact] = useState<Fact | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [touch, setTouch] = useState(false);
  const halted = useRef(false);
  halted.current = paused || !!fact || screen !== "playing";

  useEffect(() => { setTouch("ontouchstart" in window || navigator.maxTouchPoints > 0); }, []);
  useEffect(() => { audio.setMuted(muted); }, [muted]);

  const start = useCallback(() => {
    audio.unlock();
    gameRef.current = new Game({
      onHud: setHud,
      onFact: (f) => setFact(f),
      onEnd: (s) => { setStats(s); setTimeout(() => setScreen("end"), 600); },
    });
    setFact(null); setPaused(false); setStats(null); setScreen("playing");
  }, []);

  // loop
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0, last = performance.now(), acc = 0;
    const step = 1 / 60;
    const loop = (now: number) => {
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      const g = gameRef.current;
      if (g) {
        while (acc >= step) { if (!halted.current) g.update(step); acc -= step; }
        g.render(ctx);
      } else {
        acc = 0;
        drawMenuBg(ctx, now / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // keyboard
  useEffect(() => {
    const map: Record<string, "left" | "right" | "jump"> = {
      ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "jump", KeyW: "jump", Space: "jump",
    };
    const set = (e: KeyboardEvent, v: boolean) => {
      const k = map[e.code];
      if (k) { e.preventDefault(); if (gameRef.current) gameRef.current.input[k] = v; }
      if (v && (e.code === "KeyP" || e.code === "Escape")) setPaused((p) => !p);
      if (v && e.code === "Enter") setFact(null);
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  const press = (k: "left" | "right" | "jump", v: boolean) => { if (gameRef.current) gameRef.current.input[k] = v; };
  const tb = (k: "left" | "right" | "jump") => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); audio.unlock(); press(k, true); },
    onPointerUp: () => press(k, false),
    onPointerLeave: () => press(k, false),
    onPointerCancel: () => press(k, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="mx-auto w-full max-w-5xl select-none">
      {/* HUD */}
      <div className="hud-bar mb-3 flex flex-wrap items-center gap-2 p-2 text-lg sm:gap-4 sm:px-4">
        <HudStat label="Pontos" value={hud?.score ?? 0} />
        <HudStat label="Lixo" value={hud?.trash ?? 0} />
        <HudStat label="Fase" value={hud ? `${hud.level}/${hud.totalLevels}` : `-/${THEMES.length}`} />
        {hud && (
          <span className="ods-badge" style={{ backgroundColor: hud.color }}>ODS {hud.ods} · {hud.odsName}</span>
        )}
        <div className="flex items-center gap-1" aria-label={`${hud?.lives ?? 3} vidas`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < (hud?.lives ?? 3) ? "heart" : "heart heart-empty"} />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn-pixel btn-pixel-sm" onClick={() => setPaused((p) => !p)} disabled={screen !== "playing"} aria-label="Pausar">
            {paused ? "▶" : "❚❚"}
          </button>
          <button className="btn-pixel btn-pixel-sm" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Ativar som" : "Silenciar"}>
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {hud && screen === "playing" && (
        <div className="mission-bar mb-3 flex items-center gap-3 px-3 py-2 text-lg">
          <span className="font-pixel text-[10px] text-primary">MISSÃO</span>
          <span className="flex-1 leading-tight">{hud.portalOpen ? "Portal aberto! Vá até o final da fase ➜" : hud.mission}</span>
          <span className="font-pixel text-xs">{Math.min(hud.got, hud.need)}/{hud.need}</span>
        </div>
      )}

      <div className="game-frame relative aspect-video w-full overflow-hidden">
        <canvas ref={canvasRef} width={VW} height={VH} className="pixelated block h-full w-full" />

        {screen === "menu" && (
          <div className="overlay">
            <h1 className="font-pixel text-center text-xl leading-relaxed text-primary-foreground sm:text-3xl">ECO<span className="text-accent">HERÓI</span></h1>
            <p className="mt-2 text-center text-xl sm:text-2xl">Uma aventura pelos Objetivos de Desenvolvimento Sustentável</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {THEMES.map((t) => <span key={t.ods} className="ods-badge" style={{ backgroundColor: t.color }}>ODS {t.ods}</span>)}
            </div>
            <button className="btn-pixel mt-6" onClick={start}>▶ JOGAR</button>
            <p className="mt-4 hidden text-center text-lg opacity-90 sm:block">
              ← → / A D mover · Espaço / W / ↑ pular (pulo duplo!) · P pausar · Pule nos monstros de poluição
            </p>
          </div>
        )}

        {paused && screen === "playing" && !fact && (
          <div className="overlay">
            <h2 className="font-pixel text-2xl">PAUSADO</h2>
            <button className="btn-pixel mt-6" onClick={() => setPaused(false)}>▶ CONTINUAR</button>
            <button className="btn-pixel btn-pixel-ghost mt-3" onClick={start}>↻ REINICIAR</button>
          </div>
        )}

        {fact && (
          <div className="overlay">
            <div className="fact-card max-w-md p-4 sm:p-6" style={{ borderColor: fact.color }}>
              <span className="ods-badge" style={{ backgroundColor: fact.color }}>ODS {fact.ods} · {fact.odsName}</span>
              <h3 className="font-pixel mt-3 text-xs leading-relaxed sm:text-sm">{fact.title}</h3>
              <p className="mt-3 text-xl leading-snug sm:text-2xl">{fact.text}</p>
              <button className="btn-pixel mt-4 w-full" onClick={() => setFact(null)} autoFocus>CONTINUAR ➜</button>
            </div>
          </div>
        )}

        {screen === "end" && stats && (
          <div className="overlay">
            <div className="fact-card max-w-md p-4 text-center sm:p-6">
              <h2 className="font-pixel text-base leading-relaxed sm:text-xl">{stats.win ? "PLANETA SALVO!" : "FIM DE JOGO"}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xl">
                <EndStat label="Pontuação" v={stats.score} />
                <EndStat label="Resíduos reciclados" v={stats.trash} />
                <EndStat label="Mudas plantadas" v={stats.seedlings} />
                <EndStat label="Poluidores vencidos" v={stats.enemies} />
              </div>
              <p className="mt-4 text-xl leading-snug">
                {stats.win
                  ? "Você mostrou que pequenas atitudes mudam o mundo. Separe o lixo, economize energia e cuide da natureza também na vida real!"
                  : `Você chegou à fase ${stats.level}. Todo resíduo recolhido já faz diferença — tente de novo e continue cuidando do planeta!`}
              </p>
              <button className="btn-pixel mt-5 w-full" onClick={start}>↻ JOGAR NOVAMENTE</button>
            </div>
          </div>
        )}
      </div>

      {touch && (
        <div className="mt-4 flex items-center justify-between gap-4 touch-none">
          <div className="flex gap-3">
            <button className="touch-btn" {...tb("left")} aria-label="Esquerda">◀</button>
            <button className="touch-btn" {...tb("right")} aria-label="Direita">▶</button>
          </div>
          <button className="touch-btn touch-btn-jump" {...tb("jump")} aria-label="Pular">▲</button>
        </div>
      )}
    </div>
  );
}

function HudStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-pixel text-[9px] text-muted-foreground">{label}</span>
      <span className="font-pixel text-xs sm:text-sm">{value}</span>
    </div>
  );
}

function EndStat({ label, v }: { label: string; v: number }) {
  return (
    <div className="stat-box p-2">
      <div className="font-pixel text-sm">{v}</div>
      <div className="text-base leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}

function drawMenuBg(c: CanvasRenderingContext2D, t: number) {
  const g = c.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, "#1f6f9f"); g.addColorStop(1, "#56C02B");
  c.fillStyle = g; c.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + t * 20 * ((i % 3) + 1)) % VW;
    const y = (i * 53) % VH;
    c.fillStyle = ["#0A97D9", "#FCC30B", "#56C02B", "#FD9D24"][i % 4]!;
    c.fillRect(Math.round(x), y, 8, 8);
  }
  c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(0, 0, VW, VH);
}
