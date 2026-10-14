export type ItemKind = "bottle" | "can" | "bag" | "seedling" | "special";
export type Deco = "river" | "wind" | "forest" | "city";

export interface Theme {
  ods: number;
  odsName: string;
  title: string;
  mission: string;
  target: ItemKind;
  targetLabel: string;
  targetCount: number;
  color: string;
  sky: [string, string];
  hazard: string;
  dirt: string;
  grass: string;
  hill: string;
  deco: Deco;
  missionFact: string;
  specialFact: string;
}

export const THEMES: Theme[] = [
  {
    ods: 14, odsName: "Vida na Água", title: "Rio Limpo",
    mission: "Colete 5 garrafas plásticas para limpar o rio", target: "bottle", targetLabel: "Garrafas", targetCount: 5,
    color: "#0A97D9", sky: ["#5ec8f2", "#d9f3ff"], hazard: "#3f7a6a", dirt: "#8b5a2b", grass: "#3fbf4f", hill: "#7cc8a8", deco: "river",
    missionFact: "Cerca de 11 milhões de toneladas de plástico chegam aos oceanos todo ano. Uma garrafa plástica pode levar até 450 anos para se decompor!",
    specialFact: "Os oceanos produzem mais da metade do oxigênio que respiramos, graças ao fitoplâncton. Protegê-los é proteger a vida!",
  },
  {
    ods: 7, odsName: "Energia Limpa", title: "Vale dos Ventos",
    mission: "Recicle 6 latinhas para gerar energia limpa", target: "can", targetLabel: "Latinhas", targetCount: 6,
    color: "#FCC30B", sky: ["#ffd76a", "#fff6d8"], hazard: "#5a4a3a", dirt: "#9a6a3a", grass: "#8cc63f", hill: "#c8d96a", deco: "wind",
    missionFact: "Reciclar uma latinha de alumínio economiza energia suficiente para manter uma TV ligada por 3 horas. O Brasil recicla quase 100% das latinhas!",
    specialFact: "Energia solar e eólica já são as fontes de eletricidade mais baratas em grande parte do mundo. O sol entrega à Terra em 1 hora a energia que a humanidade usa em 1 ano!",
  },
  {
    ods: 15, odsName: "Vida Terrestre", title: "Floresta Viva",
    mission: "Plante 6 mudas para reflorestar a mata", target: "seedling", targetLabel: "Mudas", targetCount: 6,
    color: "#56C02B", sky: ["#8fd9a8", "#e8fbe9"], hazard: "#6b3b2a", dirt: "#6e4424", grass: "#2e9e3e", hill: "#4fae6a", deco: "forest",
    missionFact: "Uma única árvore adulta pode absorver cerca de 22 kg de CO₂ por ano. Florestas abrigam 80% das espécies terrestres do planeta!",
    specialFact: "A Mata Atlântica já perdeu cerca de 88% da sua área original. Projetos de reflorestamento ajudam a reconectar habitats de animais.",
  },
  {
    ods: 11, odsName: "Cidades Sustentáveis", title: "Cidade Verde",
    mission: "Recolha 7 sacolas plásticas das ruas", target: "bag", targetLabel: "Sacolas", targetCount: 7,
    color: "#FD9D24", sky: ["#ffb877", "#ffeedd"], hazard: "#55505a", dirt: "#6a6a72", grass: "#5cb85c", hill: "#b3a3c3", deco: "city",
    missionFact: "Mais da metade da população mundial vive em cidades. Coleta seletiva, transporte público e áreas verdes tornam as cidades mais saudáveis!",
    specialFact: "Telhados verdes reduzem a temperatura dos prédios, retêm água da chuva e criam abrigo para abelhas e pássaros no meio da cidade.",
  },
];

export interface Rect { x: number; y: number; w: number; h: number }
export interface LevelData {
  width: number;
  platforms: (Rect & { ground: boolean })[];
  items: { x: number; y: number; kind: ItemKind }[];
  enemies: { x: number; minX: number; maxX: number }[];
  portal: { x: number; y: number };
}

export const GY = 386;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildLevel(i: number): LevelData {
  const theme = THEMES[i];
  const r = rng(1234 + i * 777);
  const others: ItemKind[] = (["bottle", "can", "bag"] as ItemKind[]).filter((k) => k !== theme.target);
  const platforms: LevelData["platforms"] = [];
  const items: LevelData["items"] = [];
  const enemies: LevelData["enemies"] = [];
  const segs = 6 + i;
  let x = 0;
  let specialPlaced = false;
  for (let s = 0; s < segs; s++) {
    const w = s === 0 ? 600 : 380 + Math.floor(r() * 300);
    platforms.push({ x, y: GY, w, h: 64, ground: true });
    if (s > 0) {
      // floating platforms
      const px = x + 60 + Math.floor(r() * (w - 220));
      const pw = 96 + Math.floor(r() * 3) * 32;
      platforms.push({ x: px, y: 290, w: pw, h: 16, ground: false });
      items.push({ x: px + pw / 2 - 8, y: 290 - 30, kind: theme.target });
      if (r() > 0.4) {
        const hx = px + pw - 20 + Math.floor(r() * 60);
        platforms.push({ x: hx, y: 200, w: 96, h: 16, ground: false });
        if (!specialPlaced && s >= 2) {
          items.push({ x: hx + 40, y: 168, kind: "special" });
          specialPlaced = true;
        } else items.push({ x: hx + 40, y: 170, kind: others[Math.floor(r() * others.length)] });
      }
      items.push({ x: x + 40 + Math.floor(r() * (w - 80)), y: GY - 28, kind: r() > 0.35 ? theme.target : others[Math.floor(r() * others.length)] });
      if (s < segs - 1 && w > 420) enemies.push({ x: x + w / 2, minX: x + 40, maxX: x + w - 70 });
      if (i >= 2 && s % 3 === 0 && w > 500) enemies.push({ x: x + 80, minX: x + 40, maxX: x + w / 2 });
    } else {
      items.push({ x: 380, y: GY - 28, kind: theme.target });
    }
    x += w;
    if (s < segs - 1) x += 80 + Math.floor(r() * 50);
  }
  if (!specialPlaced) {
    platforms.push({ x: x - 360, y: 220, w: 96, h: 16, ground: false });
    items.push({ x: x - 320, y: 188, kind: "special" });
  }
  return { width: x, platforms, items, enemies, portal: { x: x - 110, y: GY - 72 } };
}
