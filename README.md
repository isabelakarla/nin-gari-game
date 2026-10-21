<div align="center">

# ♻️ Nin-Gari: A Lenda do Reciclador

**Uma aventura de plataforma para cuidar do planeta, uma missão de cada vez.**

Jogo educativo inspirado nos Objetivos de Desenvolvimento Sustentável (ODS),
feito com HTML, CSS e JavaScript nativos.

[🎮 Jogar online](https://isabelakarla.github.io/nin-gari-game/) ·
[📦 Repositório no GitHub](https://github.com/isabelakarla/nin-gari-game)

</div>

---

## 📚 Índice

- [Sobre o jogo](#-sobre-o-jogo)
- [Fases e objetivos](#-fases-e-objetivos)
- [Controles](#-controles)
- [Como executar](#-como-executar)
- [Publicar no GitHub Pages](#-publicar-no-github-pages)
- [Testes e verificações](#-testes-e-verificações)
- [Estrutura do projeto](#-estrutura-do-projeto)

## 🌍 Sobre o jogo

Os Monstros da Poluição invadiram o mundo! Ajude Nin-Gari a limpar quatro
regiões, cumprir as missões de cada fase e enfrentar a fonte da toxicidade.

Você começa com **7 vidas**. Recolha os itens pedidos, derrote os inimigos e,
nas quatro primeiras fases, vença o chefe regional para abrir o portal. Na
quinta fase, encare o chefe final. Ao longo da aventura, descubra fatos e dicas
sobre sustentabilidade.

A partida termina quando as vidas acabam ou quando o planeta é salvo. Na tela
final, confira sua pontuação, os resíduos reciclados, as mudas plantadas e os
poluidores vencidos — e, se quiser, comece outra partida.

## 🎯 Fases e objetivos

| Fase | Região | ODS | Missão |
|:---:|---|---|---|
| 1 | Rio Limpo | **14 — Vida na Água** | Recolher 5 garrafas plásticas |
| 2 | Vale dos Ventos | **7 — Energia Limpa** | Reciclar 6 latinhas |
| 3 | Floresta Viva | **15 — Vida Terrestre** | Plantar 6 mudas |
| 4 | Cidade Verde | **11 — Cidades Sustentáveis** | Recolher 7 sacolas plásticas |
| 5 | A Fonte da Toxicidade | **13 — Ação Contra a Mudança Global do Clima** | Derrotar o Giga-Barril Tóxico |

## 🕹️ Controles

### Teclado

| Ação | Teclas |
|---|---|
| Mover | **← →** ou **A / D** |
| Pular e fazer pulo duplo | **Espaço**, **W** ou **↑** |
| Atirar | Segure **X** |
| Lançar uma bomba na fase final | **E** |
| Pausar ou continuar | **P** ou **Esc** |

### Celular e tablet

Use os controles direcionais e o botão de pulo exibidos na tela. Na batalha
final, os botões de tiro e de bomba aparecem junto à barra de vida do chefe.

> **Dica:** o botão 🔊 alterna o som; o botão de pausa fica disponível durante
> a partida.

## ▶️ Como executar

### Requisitos

- [Node.js](https://nodejs.org/)

### Obter o projeto

```sh
git clone https://github.com/isabelakarla/nin-gari-game.git
cd nin-gari-game
```

### Iniciar

Na pasta do projeto, execute:

```sh
npm start
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080) no navegador.

O servidor usa os módulos nativos do Node.js, não exige instalação de
dependências e atende apenas em `127.0.0.1`.

### Usar outra porta

No **PowerShell**:

```powershell
$env:PORT = "3000"
npm start
```

No **macOS ou Linux**:

```sh
PORT=3000 npm start
```

Depois, acesse `http://127.0.0.1:3000`.

## 🌐 Publicar no GitHub Pages

O jogo é estático e pode ser publicado diretamente pelo GitHub Actions, sem
build ou instalação de dependências.

O código deste projeto está em
[github.com/isabelakarla/nin-gari-game](https://github.com/isabelakarla/nin-gari-game)
e o endereço do jogo é
[isabelakarla.github.io/nin-gari-game](https://isabelakarla.github.io/nin-gari-game/).

1. Envie o workflow e os arquivos do jogo para a branch `main` do repositório
   `isabelakarla/nin-gari-game`.
2. Nesse repositório, abra **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions**.
4. Abra a aba **Actions** e aguarde a conclusão do workflow **Deploy to GitHub Pages**.
5. Quando a publicação terminar, acesse:
   [https://isabelakarla.github.io/nin-gari-game/](https://isabelakarla.github.io/nin-gari-game/).

O workflow publica automaticamente uma nova versão a cada envio para `main`.
Também é possível iniciar uma publicação manual pela aba **Actions**.

## ✅ Testes e verificações

```sh
npm test
npm run check
```

`npm test` executa os testes automatizados; `npm run check` verifica a sintaxe
dos arquivos JavaScript do projeto.

## 🧩 Estrutura do projeto

| Caminho | Responsabilidade |
|---|---|
| `index.html` | Estrutura da página, placar, telas e controles |
| `styles.css` | Layout, identidade visual e estilos responsivos |
| `src/main.js` | Inicialização, interface, áudio e controles |
| `src/game/engine.js` | Física do canvas, movimento, itens, vidas e progressão |
| `src/game/levels.js` | Fases, temas, missões e informações educativas |
| `src/game/boss.js` | Regras dos chefes regionais e da batalha final |
| `src/game/audio.js` | Efeitos sonoros |
| `src/test/boss.test.js` | Testes das regras de combate |
| `server.js` | Servidor HTTP local |

---

<div align="center">

Feito por estudantes do **EREM Rosa de Magalhães Melo**<br>
Matheus Montarroyos · Carlos Henrique · Hebert Rhyan

</div>
