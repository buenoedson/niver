# Project Chronos // Jubilee Protocol

> Motor audiovisual de alta performance, sintetizador procedural por software e arcade espacial retrô em Vanilla JavaScript (ESM), HTML5 Canvas e Web Audio API, servido por runtime nativo em Node.js com **zero dependências externas**.

---

## 1. Visão Geral

O **Project Chronos** é uma aplicação interativa desenvolvida com foco em requisitos não funcionais rigorosos: taxa constante de **60 FPS**, latência de inicialização sub-segundo, pegada de memória reduzida (< 50 MB) e ausência de bibliotecas de terceiros (0 dependências no `package.json` ou CDNs externos).

Toda a física vetorial, geração sonora, campo estelar de dobra e efeitos de partículas são computados proceduralmente em tempo real pelo navegador.

---

## 2. Funcionalidades Principais

### Síntese Procedural de Áudio (Web Audio API)
- **Trilha Sonora Synthwave em Tempo Real:** Sequenciador polifônico arpejado em 124 BPM, linha de baixo sub-bass, bumbo (kick) sintético com queda exponencial e chimbal sintetizado por buffer PCM de ruído branco filtrado.
- **Gerador de SFX sem Assets:** Disparos de plasma, detonações de impacto, saltos para hiperespaço (*warp*) e fanfarras de milestone gerados em tempo de execução via osciladores senoidais, dente de serra e envelopes ADSR (`AudioParam.gain`).
- **Controle de Estado:** Suporte a *mute/unmute* com interpolação suave de ganho e conformidade com a política de autoplay dos navegadores modernos (ativação por interação explícita do usuário).

### Motor Gráfico e de Partículas
- **Object Pooling:** Buffer estático pré-dimensionado de 2.500 partículas para mitigação total de engasgos de *Garbage Collection* (GC pauses).
- **Emissores Dinâmicos:**
  - *Fogos de Artifício:* Explosões radiais com decaimento gravitacional, atrito aerodinâmico e paleta neon aleatorizada.
  - *Confetes Holográficos:* Partículas retangulares 2D com simulação de arrasto e rotação angular tridimensional.
  - *Esteira de Propulsão & Faíscas:* Feedback cinético ao vetor de aceleração do jogador e pontos de impacto.
  - *Campo Estelar Hiperespaço:* Estrelas com velocidade de dobra ajustável dinamicamente.
- **Pós-Processamento Retrô:** Scanlines CRT em gradiente linear e máscara de vinheta analógica comutável pelo HUD.

### Lógica do Jogo Arcade
- **Interceptor Cyberpunk:** Nave com navegação inercial (teclado `WASD`/setas) e rastreamento angular contínuo orientado ao cursor do mouse.
- **Balística Dupla:** Canhões de plasma simétricos com temporizador de cadência de tiro.
- **Detecção de Colisão Euclidiana:** Verificação radial \( (x_1 - x_2)^2 + (y_1 - y_2)^2 \le (r_1 + r_2)^2 \) contra alvos orbitais com malha poligonal neon.
- **Sistema de Pontuação e Milestones:** Multiplicadores de combo em cadeia e ativação de eventos comemorativos a cada 1.000 pontos (screen shake, salvas de fogos, confetes e fanfarra).

### Console Cyber-Terminal Embutido
Console integrado acessível via tecla de atalho (`~` ou `ESC`) para inspeção de telemetria e injeção de rotinas em tempo de execução.

---

## 3. Estrutura do Repositório

```text
niver/
├── .gitignore                      # Regras de isolamento LGPD e segurança
├── README.md                       # Documentação técnica do projeto
├── server.js                       # Servidor HTTP nativo em Node.js
├── docs/
│   └── ESPECIFICACOES.md           # Contratos, NFRs e modelagem arquitetural
├── logs/
│   └── HISTORICO_SESSAO.md         # Rastreabilidade append-only de atividades
└── public/                         # Assets e código da aplicação cliente
    ├── index.html                  # Shell HTML5, overlays e containers de HUD
    ├── css/
    │   └── style.css               # Estilos neon-cyberpunk e responsividade
    └── js/
        ├── main.js                 # Ponto de entrada, High-DPI e render loop
        ├── audio/
        │   └── SynthEngine.js      # Sintetizador procedural (Web Audio API)
        ├── graphics/
        │   └── ParticleSystem.js   # Sistema de partículas com Object Pooling
        ├── game/
        │   └── GameEngine.js       # Lógica arcade, colisões e entidades
        └── terminal/
            └── TerminalInterface.js# Terminal de comandos interativo
```

---

## 4. Instruções de Instalação e Execução

### Pré-requisitos
- **Node.js:** Versão 18.0.0 ou superior (testado em Node.js v24.15.0).
- Navegador moderno com suporte a HTML5 Canvas e Web Audio API (Chrome, Edge, Firefox, Safari).

### Inicialização do Servidor Local
Clone ou abra o repositório no terminal e execute:

```powershell
node server.js
```

O servidor será vinculado à interface local:
```text
[Project Chronos] Servidor operacional em http://127.0.0.1:3000
```

Abra o endereço `http://127.0.0.1:3000` no seu navegador e clique em **INICIALIZAR SISTEMA** para desbloquear o contexto de áudio e inicializar o loop de renderização.

*(Opcional: A aplicação pode ser servida por qualquer servidor HTTP estático, como `npx serve public` ou abrindo diretamente em containers).*

---

## 5. Mapeamento de Controles

| Entrada / Tecla | Ação |
| :--- | :--- |
| `W`, `A`, `S`, `D` / `Setas` | Navegação e propulsão do interceptor espacial |
| `Mouse (Movimento)` | Mira angular de precisão (360°) |
| `Botão Esquerdo do Mouse` | Disparo contínuo dos canhões de plasma duplos |
| `Barra de Espaço` | Disparo alternativo de pulso |
| `~` (Til) ou `Botão TERMINAL` | Alterna a visibilidade do console de comandos |
| `Botão ÁUDIO` | Alterna estado de mudo (*Mute / Unmute*) |
| `Botão CRT` | Alterna filtro visual de linhas de varredura (scanlines) |
| `Botão TELA CHEIA` | Alterna modo de tela cheia do navegador |

---

## 6. Comandos do Cyber-Terminal

No console de comandos embutido, os seguintes comandos estão disponíveis para execução:

| Comando | Descrição |
| :--- | :--- |
| `help` | Lista todos os comandos disponíveis no terminal |
| `fireworks [n]` | Detona `n` salvas de fogos de artifício procedurais (padrão: 5) |
| `confetti [n]` | Dispara chuva de confetes holográficos com física rotacional (padrão: 120) |
| `warp` | Alterna o modo de velocidade de dobra no campo estelar |
| `synth [freq]` | Testa o sintetizador disparando frequência em Hertz |
| `milestone` | Força a execução imediata do protocolo comemorativo |
| `stats` | Exibe telemetria em tempo real (partículas ativas, score, combo) |
| `banner` | Imprime o manifesto comemorativo e aciona efeitos especiais |
| `clear` | Limpa o histórico de logs do terminal |

---

## 7. Requisitos Não Funcionais (NFRs) e Arquitetura

- **Frame Budget:** 16.6ms por quadro (60 FPS contínuos garantidos via `requestAnimationFrame` e desacoplamento de física por `dt`).
- **Alocação de Memória:** Zero alocações no loop crítico de partículas devido ao padrão *Object Pool*, mantendo a coleta de lixo estável.
- **Segurança e Isolamento:**
  - Servidor HTTP com proteção contra *Directory Traversal* via `path.normalize` e validação estrita de subdiretório.
  - Cabeçalhos de segurança implementados nativamente: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- **Conformidade LGPD:**
  - Nenhum dado pessoal (PII) é coletado, persistido em disco ou transmitido para servidores remotos.
  - Regras no `.gitignore` impedem o versionamento acidental de chaves, credenciais ou dumps estruturados.

---

## 8. Governança e Rastreabilidade

O projeto segue padrões estritos de governança técnica e documental:
- **Histórico Append-Only:** [logs/HISTORICO_SESSAO.md](logs/HISTORICO_SESSAO.md)
- **Especificações de Engenharia:** [docs/ESPECIFICACOES.md](docs/ESPECIFICACOES.md)

