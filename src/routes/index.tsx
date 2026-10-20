import { createFileRoute } from "@tanstack/react-router";
import EcoGame from "@/components/EcoGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nin-Gari: A Lenda do Reciclador — Cinco missões pelas ODS" },
      { name: "description", content: "Jogo educativo retrô 2D: seja um ninja catador de lixo, recolha resíduos, plante mudas e aprenda sobre os Objetivos de Desenvolvimento Sustentável da ONU." },
      { property: "og:title", content: "Nin-Gari: A Lenda do Reciclador" },
      { property: "og:description", content: "Cinco capítulos em pixel art sobre as ODS 14, 7, 15, 11 e 13, com uma batalha final contra a poluição." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8">
      <header className="mx-auto mb-4 flex max-w-5xl items-center gap-3">
        <span className="logo-block" aria-hidden />
        <div>
          <h1 className="font-pixel text-sm sm:text-lg">Nin-Gari: A Lenda do Reciclador</h1>
          <p className="text-lg text-muted-foreground">Missões pelo planeta · ODS da ONU</p>
        </div>
      </header>
      <EcoGame />
      <p className="mx-auto mt-6 max-w-5xl text-center text-lg text-muted-foreground">
        Feito para estudantes do Ensino Médio · Vida na Água, Energia Limpa, Vida Terrestre, Cidades Sustentáveis e Ação Climática.
      </p>
    </main>
  );
}
