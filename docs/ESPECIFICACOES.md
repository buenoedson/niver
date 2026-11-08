# Especificações Técnicas e Informações Críticas - Project Chronos (Arcade & Audiovisual Engine)
# Última modificação: 07/11/2026

## 1. Visão Geral e Arquitetura
- **Escopo Funcional:** Sistema interativo audiovisual contendo jogo de arcade espacial, sintetizador procedural de áudio por software, emissor de partículas de alta taxa de atualização com efeitos de fogos de artifício e terminal de comando embutido.
- **Stack e Dependências Críticas:**
  - Runtime de desenvolvimento e hospedagem local: Node.js (>= v18, testado em v24.15.0).
  - Linguagem do Servidor: JavaScript (CommonJS / Node.js standard library: `http`, `fs`, `path`, `url`).
  - Linguagem do Cliente: JavaScript (ES6+ Modules), HTML5 Canvas 2D API, Web Audio API.
  - Dependências Externas de Terceiros: Zero (0). Toda a lógica física, matemática e sonora é calculada proceduralmente.

## 2. Sub-projetos e Relatórios Mapeados
- Escopo único. Nenhum sub-projeto mapeado.

## 3. Regras de Negócio e Contratos de Dados
- **Render Loop:** Taxa alvo fixa de 60 FPS com desacoplamento por `deltaTime` via `requestAnimationFrame`.
- **Object Pooling de Partículas:** Alocação de buffer pré-dimensionado de partículas (capacidade máxima de 2.500 partículas ativas) com reciclagem imediata de instâncias para mitigar overhead de Garbage Collection (GC).
- **Web Audio Engine:**
  - Sintetizador baseado em osciladores de frequências harmônicas (senoidal, dente de serra, quadrada) manipulados com envelopes ADSR (Attack, Decay, Sustain, Release) em `AudioParam.gain`.
  - Gerador de ruído pseudo-aleatório gerado dinamicamente via buffer PCM (`createBuffer`) para efeitos de explosões e propulsão.
- **Game Engine & Colisões:**
  - Verificação de colisão espacial radial euclidiana para projéteis e alvos circulares: \( (x_1 - x_2)^2 + (y_1 - y_2)^2 \le (r_1 + r_2)^2 \).
  - Sistema de pontuação cumulativa com multiplicador de combo e disparo de comemorações por milestones (a cada 1.000 pontos).

## 4. Requisitos Não Funcionais (NFRs) e Limites Operacionais
- **Performance Gráfica:** 60 FPS estáveis com tempo de quadro (frame budget) inferior a 16.6ms.
- **Consumo de Memória:** Footprint de memória heap no navegador inferior a 50 MB.
- **Latência de Inicialização:** Carregamento completo da aplicação no cliente em < 300ms a partir do localhost.
- **Concorrência do Servidor:** Suporte nativo a conexões HTTP simultâneas com tratamento assíncrono não-bloqueante (`fs.promises` / streaming).
- **Tratamento de Exceções:** Graceful degradation caso o contexto de áudio exija interação explícita do usuário (`AudioContext.state === 'suspended'`).

## 5. Governança LGPD e Segurança
- **Dados Sensíveis/PII Manipulados:** Nenhum dado pessoal (PII) é capturado, transmitido, armazenado ou persistido em disco. Telemetria e pontuações do arcade são mantidas estritamente voláteis em memória da sessão de runtime.
- **Política de Mascaramento/Anonimização:** Ausência total de campos de identificação nominal, e-mails, endereços ou credenciais.
- **Regras Críticas do `.gitignore`:** Bloqueio obrigatório de `.env*`, `*.pem`, `*.key`, `*.pfx`, `secrets.*`, `credentials.*`, `*.sql`, `*.sqlite`, `*.db`, `*.bak`, `*.dump`, `*.csv`, `*.xlsx`, `*.xls`, `*.parquet`, `*.pdf` e `*.log` (com exceção auditada de `logs/HISTORICO_SESSAO.md`).

## 6. Configurações de Ambiente e Chaves Necessárias
- Variáveis de ambiente opcionais:
  - `PORT`: Porta de escuta do servidor HTTP local (padrão: `3000`).
  - `HOST`: Interface de rede de vinculação (padrão: `127.0.0.1`).

