# Green Goal Game

Crie um jogo educativo de plataforma 2D interativo em estilo retro (pixel art / 16-bit) focado em Meio Ambiente e nos Objetivos de Desenvolvimento Sustentável (ODS da ONU). O projeto deve ser construído utilizando HTML5 Canvas, React, Tailwind CSS e TypeScript puro (sem dependências pesadas de engines de jogos externas).

### 🎨 Design e Estética

- Visual limpo, colorido e amigável para estudantes do Ensino Médio, com tema da natureza e sustentabilidade.

- Interface moderna com placar no topo (HUD): Pontuação, Contador de Lixo Recolhido, Fase Atual, ODS Ativa e Vidas (Corações).

- Paleta de cores vibrantes baseada nas cores das ODS (Azul para ODS 14 - Vida na Água, Amarelo/Verde para ODS 7 - Energia Limpa, Verde para ODS 15 - Vida Terrestre).

- Responsividade: Deve funcionar perfeitamente em telas de desktop e dispositivos móveis (incluir controles virtuais de toque na tela para mobile).

### 🎮 Mecânicas do Jogo (Física e Controles)

- **Controles:** Suporte a Teclado (Setas direcionais / WASD para mover e Espaço / W / Seta para Cima para pular) e botões visuais para telas touch.

- **Física:** Implementar gravidade simples, velocidade horizontal/vertical, pulo duplo opcional e detecção de colisões AABB precisa com o chão, plataformas flutuantes e colecionáveis.

- **Colecionáveis:** Itens espalhados pelo mapa (garrafas plásticas, latinhas, sacolas, mudas de plantas). Ao coletar, toca um efeito sonoro e soma pontos.

- **Missões e Transição de Fase:** Cada fase deve ter um objetivo (ex: "Colete 5 garrafas plásticas para limpar o rio"). Ao concluir, abre-se um portal/alavanca para a próxima fase.

### 📚 Conteúdo Educativo e ODS

- **Pop-ups Educativos:** Quando o jogador completa uma missão ou coleta um item especial, exiba um card modal com um fato educativo curto sobre a ODS correspondente (ex: ODS 14 - Vida na Água, ODS 7 - Energia Limpa e Sustentável, ODS 11 - Cidades Sustentáveis).

- **Tela de Conclusão / Game Over:** Tela final com resumo do desempenho, total de resíduos reciclados e uma mensagem de conscientização ambiental.

### 🔊 Recursos de Áudio e Usabilidade

- Efeitos sonoros gerados via Web Audio API (som de pulo, som de coleta de item, som de vitória e som de dano/erro).

- Botão para pausar o jogo e botão para alternar o som (Mute/Unmute).

Crie uma interface fluida, intuitiva e pronta para rodar diretamente no navegador!

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ea6dd95b-6060-51bc-b0f9-58a646593388).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
