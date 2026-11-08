/**
 * @file TerminalInterface.js
 * @description Interface interativa de console cyber-terminal para controle de telemetria e execução de rotinas.
 */

export class TerminalInterface {
    constructor(containerEl, inputEl, logsEl, gameEngine, particleSystem, synthEngine) {
        this.container = containerEl;
        this.input = inputEl;
        this.logs = logsEl;
        this.game = gameEngine;
        this.particles = particleSystem;
        this.synth = synthEngine;

        this.history = [];
        this.historyIndex = -1;

        this._bindEvents();
        this.logSystem('Project Chronos [Kernel v2.4.0-release]');
        this.logSystem('Sistemas inicializados. Digite "help" para listar os comandos.');
    }

    _bindEvents() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const commandText = this.input.value.trim();
                if (commandText) {
                    this.execute(commandText);
                    this.history.push(commandText);
                    this.historyIndex = this.history.length;
                    this.input.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.historyIndex] || '';
                }
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.history[this.historyIndex] || '';
                } else {
                    this.historyIndex = this.history.length;
                    this.input.value = '';
                }
                e.preventDefault();
            }
        });
    }

    execute(cmdString) {
        const parts = cmdString.trim().split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        this.logUser(`> ${cmdString}`);

        switch (command) {
            case 'help':
                this.logInfo('COMANDOS DISPONÍVEIS:');
                this.logInfo('  help             - Exibe este menu de ajuda');
                this.logInfo('  fireworks [n]    - Dispara rajada de fogos de artifício procedurais');
                this.logInfo('  confetti [n]     - Emite chuva de confetes holográficos');
                this.logInfo('  warp             - Alterna o modo de dobra estelar (Warp Speed)');
                this.logInfo('  synth [freq]     - Testa gerador de frequência sonora');
                this.logInfo('  milestone        - Dispara o protocolo comemorativo de milestone');
                this.logInfo('  stats            - Exibe métricas de telemetria e performance');
                this.logInfo('  banner           - Imprime o manifesto comemorativo do sistema');
                this.logInfo('  clear            - Limpa o histórico de comandos');
                break;

            case 'fireworks': {
                const count = parseInt(args[0], 10) || 5;
                this.logSuccess(`Iniciando detonação de ${count} salvas de fogos de artifício...`);
                for (let i = 0; i < count; i++) {
                    setTimeout(() => {
                        const x = 100 + Math.random() * (this.game.width - 200);
                        const y = 80 + Math.random() * (this.game.height * 0.45);
                        this.particles.spawnFirework(x, y, 130);
                        this.synth.playExplosion();
                    }, i * 200);
                }
                break;
            }

            case 'confetti': {
                const count = parseInt(args[0], 10) || 120;
                this.logSuccess(`Liberando chuva de confetes holográficos (${count} unidades)...`);
                this.particles.spawnConfettiShower(this.game.width, count);
                break;
            }

            case 'warp': {
                const state = this.particles.toggleWarp();
                this.synth.playWarpSound();
                this.logAccent(`Modo Hiperespaço (Warp Speed): ${state ? 'ATIVADO' : 'DESATIVADO'}`);
                break;
            }

            case 'synth': {
                const freq = parseFloat(args[0]) || 440;
                this.logInfo(`Disparando tom no sintetizador: ${freq} Hz`);
                this.synth.playLaser();
                break;
            }

            case 'milestone':
                this.logAccent('Executando protocolo de comemoração de Milestone...');
                this.game._triggerMilestoneCelebration();
                break;

            case 'stats': {
                const activeParticles = this.particles.getActiveCount();
                const score = this.game.score;
                const multiplier = this.game.multiplier;
                this.logInfo(`TELEMETRIA: Partículas Ativas: ${activeParticles} | Score: ${score} | Combo: ${multiplier}x`);
                break;
            }

            case 'banner':
                this.logAccent('==================================================');
                this.logAccent('  PROJECT CHRONOS // JUBILEE CELEBRATION PROTOCOL  ');
                this.logAccent('  NÍVEL UP: PARABÉNS PELO SEU ANIVERSÁRIO!        ');
                this.logAccent('  ARQUITETURA NATIVA, ZERO LATÊNCIA, 60 FPS      ');
                this.logAccent('==================================================');
                this.game._triggerMilestoneCelebration();
                break;

            case 'clear':
                this.logs.innerHTML = '';
                break;

            default:
                this.logWarning(`Comando não reconhecido: "${command}". Digite "help" para assistência.`);
                break;
        }

        this.logs.scrollTop = this.logs.scrollHeight;
    }

    logUser(text) {
        this._appendLine(text, 'user');
    }

    logSystem(text) {
        this._appendLine(text, 'system');
    }

    logInfo(text) {
        this._appendLine(text, 'info');
    }

    logSuccess(text) {
        this._appendLine(text, 'success');
    }

    logWarning(text) {
        this._appendLine(text, 'warning');
    }

    logAccent(text) {
        this._appendLine(text, 'accent');
    }

    _appendLine(text, type) {
        const div = document.createElement('div');
        div.className = `log-line ${type}`;
        div.textContent = text;
        this.logs.appendChild(div);
        this.logs.scrollTop = this.logs.scrollHeight;
    }
}

