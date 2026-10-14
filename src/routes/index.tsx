import { createFileRoute } from "@tanstack/react-router";
import EcoGame from "@/components/EcoGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoHerói — Jogo de plataforma sobre as ODS" },
      { name: "description", content: "Jogo educativo retrô 2D: recolha lixo, plante mudas e aprenda sobre os Objetivos de Desenvolvimento Sustentável da ONU." },
      { property: "og:title", content: "EcoHerói — Jogo de plataforma sobre as ODS" },
      { property: "og:description", content: "Aventura pixel art sobre meio ambiente e as ODS 14, 7, 15 e 11." },
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
          <h1 className="font-pixel text-sm sm:text-lg">EcoHerói</h1>
          <p className="text-lg text-muted-foreground">Missões pelo planeta · ODS da ONU</p>
        </div>
      </header>
      <EcoGame />
      <p className="mx-auto mt-6 max-w-5xl text-center text-lg text-muted-foreground">
        Feito para estudantes do Ensino Médio · Aprenda brincando sobre Vida na Água, Energia Limpa, Vida Terrestre e Cidades Sustentáveis.
      </p>
    </main>
  );
}
