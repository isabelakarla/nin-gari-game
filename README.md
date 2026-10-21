# Nin-Gari: A Lenda do Reciclador

Jogo educativo de plataforma sobre os Objetivos de Desenvolvimento Sustentável.
Feito com HTML, CSS e JavaScript nativos: não usa frameworks, ferramentas de
compilação nem dependências de pacotes.

## Executar

Instale o [Node.js](https://nodejs.org/) e, na pasta do projeto, execute:

```sh
npm start
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080) no navegador. Para alterar
a porta, defina a variável de ambiente `PORT` antes de iniciar.

## Controles

- **Mover:** setas ← → ou teclas A e D.
- **Pular:** Espaço, W ou seta ↑ (inclui pulo duplo).
- **Atirar nos monstros:** segure X.
- **Lançar bombas na batalha final:** E.
- **Pausar:** P ou Esc.
- Em dispositivos touch, use os controles na tela.
- Você começa cada partida com cinco vidas.
- Nas fases 1 a 4, complete a coleta para enfrentar o monstro e abrir o portal.
- Na arena final, os ataques têm intervalos maiores e os projéteis são mais
  lentos para dar mais tempo de desviar. A batalha fica mais desafiadora
  gradualmente à medida que o chefe recebe dano.

## Testes

```sh
npm test
npm run check
```

O canvas, a física, a progressão de fases e as regras da batalha final estão
em `src/game/`. A página e os controles estão em `index.html`, `styles.css` e
`src/main.js`. O servidor de desenvolvimento usa apenas módulos integrados do
Node.js.
