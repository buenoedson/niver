/**
 * @file main.js
 * @description Ponto de entrada (bootloader), gerenciamento de ciclo de vida e orquestração do loop de 60 FPS.
 */

import { SynthEngine } from './audio/SynthEngine.js';
import { ParticleSystem } from './graphics/ParticleSystem.js';
import { GameEngine } from './game/GameEngine.js';
import { TerminalInterface } from './terminal/TerminalInterface.js';

class App {
    constructor() {
        this.canvas = document.getElementById('viewport-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.synth = new SynthEngine();
        this.particles = new ParticleSystem(2500);
        this.game = new GameEngine(this.particles, this.synth);

        // Elementos do HUD
        this.scoreValEl = document.getElementById('val-score');
        this.comboValEl = document.getElementById('val-combo');
        this.fpsValEl = document.getElementById('val-fps');
        this.particlesValEl = document.getElementById('val-particles');

        // Botões de Ação
        this.btnAudio = document.getElementById('btn-audio');
        this.btnTerminal = document.getElementById('btn-terminal');
        this.btnCrt = document.getElementById('btn-crt');
        this.btnFullscreen = document.getElementById('btn-fullscreen');

        // Terminal
        this.terminalContainer = document.getElementById('terminal-container');
        this.terminalInput = document.getElementById('terminal-input');
        this.terminalLogs = document.getElementById('terminal-logs');
        this.terminal = new TerminalInterface(
            this.terminalContainer,
            this.terminalInput,
            this.terminalLogs,
            this.game,
            this.particles,
            this.synth
        );

        // Modal de Inicialização
        this.audioGateModal = document.getElementById('audio-gate-modal');
        this.btnStart = document.getElementById('btn-start-app');

        // Variáveis de Temporização do Loop
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.currentFps = 60;
        this.isRunning = false;

        this._init();
    }

    _init() {
        this._setupResizeHandler();
        this._bindUserInputs();
        this._bindButtonActions();

        // Inicializar estrelas no tamanho da tela
        this.particles.initStars(this.canvas.width, this.canvas.height);
        this.game.init(this.canvas.width, this.canvas.height);

        // Evento de Início no Modal
        this.btnStart.addEventListener('click', async () => {
            await this.synth.resume();
            this.synth.startBGM();

            this.audioGateModal.style.opacity = '0';
            setTimeout(() => {
                this.audioGateModal.style.display = 'none';
            }, 400);

            this.isRunning = true;
            this.lastTime = performance.now();

            // Salva de boas-vindas
            this.terminal.execute('banner');

            requestAnimationFrame(this._loop.bind(this));
        });
    }

    _setupResizeHandler() {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.canvas.width = width;
            this.canvas.height = height;

            if (this.game) this.game.resize(width, height);
            if (this.particles) this.particles.initStars(width, height);
        };

        window.addEventListener('resize', handleResize);
        handleResize();
    }

    _bindUserInputs() {
        window.addEventListener('keydown', (e) => {
            if (document.activeElement === this.terminalInput) return;
            this.game.handleKeyDown(e.code);

            // Tecla de atalho para abrir terminal (~)
            if (e.code === 'Backquote') {
                this._toggleTerminal();
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (document.activeElement === this.terminalInput) return;
            this.game.handleKeyUp(e.code);
        });

        window.addEventListener('mousemove', (e) => {
            this.game.handleMouseMove(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mousedown', () => {
            this.game.handleMouseDown();
        });

        window.addEventListener('mouseup', () => {
            this.game.handleMouseUp();
        });
    }

    _bindButtonActions() {
        // Áudio Mute/Unmute
        this.btnAudio.addEventListener('click', () => {
            const muted = this.synth.toggleMute();
            this.btnAudio.textContent = muted ? 'ÁUDIO: OFF' : 'ÁUDIO: ON';
            this.btnAudio.classList.toggle('active', !muted);
        });

        // Alternar Visibilidade do Terminal
        this.btnTerminal.addEventListener('click', () => {
            this._toggleTerminal();
        });

        // Alternar Efeito CRT
        this.btnCrt.addEventListener('click', () => {
            const scanlines = document.querySelector('.scanlines-overlay');
            const isVisible = scanlines.style.display !== 'none';
            scanlines.style.display = isVisible ? 'none' : 'block';
            this.btnCrt.classList.toggle('active', !isVisible);
        });

        // Alternar Tela Cheia
        this.btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });
    }

    _toggleTerminal() {
        const isCollapsed = this.terminalContainer.classList.toggle('collapsed');
        if (!isCollapsed) {
            this.terminalInput.focus();
        }
    }

    _loop(currentTime) {
        if (!this.isRunning) return;

        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // Medição de FPS
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 500) {
            this.currentFps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            this._updateHUD();
        }

        // Limpeza do Canvas
        this.ctx.fillStyle = '#05070f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Atualização dos Sistemas
        this.particles.update(dt, this.canvas.width, this.canvas.height);
        this.game.update(dt);

        // Renderização dos Sistemas
        this.particles.draw(this.ctx);
        this.game.draw(this.ctx);

        requestAnimationFrame(this._loop.bind(this));
    }

    _updateHUD() {
        this.scoreValEl.textContent = this.game.score.toString().padStart(6, '0');
        this.comboValEl.textContent = `${this.game.multiplier}x`;
        this.fpsValEl.textContent = this.currentFps;
        this.particlesValEl.textContent = this.particles.getActiveCount();
    }
}

// Inicializar aplicação após carga do DOM
window.addEventListener('DOMContentLoaded', () => {
    new App();
});

