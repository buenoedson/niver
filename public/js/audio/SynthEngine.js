/**
 * @file SynthEngine.js
 * @description Motor de síntese procedural de áudio baseado em Web Audio API nativa.
 * Gera trilha sonora procedural synthwave e efeitos sonoros (SFX) sem arquivos externos.
 */

export class SynthEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isPlayingBgm = false;
        this.bgmTimer = null;
        this.currentStep = 0;

        // Escalas harmônicas e notas em Hertz (Hz) para sintetizador Synthwave
        this.scale = [
            130.81, // C3
            146.83, // D3
            164.81, // E3
            174.61, // F3
            196.00, // G3
            220.00, // A3
            246.94, // B3
            261.63, // C4
            293.66, // D4
            329.63, // E4
            349.23, // F4
            392.00, // G4
            440.00, // A4
            523.25  // C5
        ];

        // Linha de baixo e progressão arpejada (C - Am - F - G)
        this.arpeggioSequence = [0, 4, 7, 11, 2, 5, 9, 12, 3, 7, 10, 13, 1, 5, 8, 12];
    }

    /**
     * Inicializa o AudioContext mediante interação prévia do usuário.
     */
    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
    }

    /**
     * Retoma o contexto se suspenso pelo navegador.
     */
    async resume() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    /**
     * Alterna estado de mudo (Mute / Unmute).
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (!this.masterGain) return this.isMuted;

        const targetGain = this.isMuted ? 0 : 0.3;
        this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
        return this.isMuted;
    }

    /**
     * Inicia a reprodução do sintetizador de trilha sonora procedural contínua.
     */
    startBGM() {
        if (this.isPlayingBgm) return;
        this.isPlayingBgm = true;
        this.currentStep = 0;

        const bpm = 124;
        const intervalMs = (60 / bpm / 2) * 1000; // semicolcheias

        this.bgmTimer = setInterval(() => {
            if (!this.ctx || this.isMuted) return;

            const now = this.ctx.currentTime;
            const noteIndex = this.arpeggioSequence[this.currentStep % this.arpeggioSequence.length];
            const freq = this.scale[noteIndex % this.scale.length];

            // Sintetizador de Lead / Arpeggio
            this._playTone(freq, 'sawtooth', 0.12, 0.08, now);

            // Linha de Baixo Sub (a cada 4 passos)
            if (this.currentStep % 4 === 0) {
                const bassFreq = freq * 0.5;
                this._playTone(bassFreq, 'square', 0.2, 0.15, now);
            }

            // Kick procedural
            if (this.currentStep % 8 === 0 || this.currentStep % 8 === 4) {
                this._playKick(now);
            }

            // Hi-hat procedural
            if (this.currentStep % 2 === 1) {
                this._playHiHat(now);
            }

            this.currentStep++;
        }, intervalMs);
    }

    /**
     * Pausa a trilha sonora procedural.
     */
    stopBGM() {
        this.isPlayingBgm = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    /**
     * Toca um tom sintético com envelope ADSR.
     */
    _playTone(freq, type, duration, volume, time) {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        // Envelope ADSR
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    /**
     * Gerador de bumbo sintético via queda rápida de frequência.
     */
    _playKick(time) {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.12);
    }

    /**
     * Gerador de chimbal procedural via ruído branco filtrado.
     */
    _playHiHat(time) {
        if (!this.ctx || this.isMuted) return;

        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(time);
        noise.stop(time + 0.03);
    }

    /**
     * Efeito Sonoro: Disparo de Laser de Plasma.
     */
    playLaser() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    /**
     * Efeito Sonoro: Explosão de Alvo / Fogos.
     */
    playExplosion() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Camada 1: Ruído de impacto
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.linearRampToValueAtTime(80, now + 0.35);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.35);
    }

    /**
     * Efeito Sonoro: Fanfarra de Milestone / Comemoração.
     * Acorde harmônico ascendente em arpejo triádico maior.
     */
    playMilestoneChime() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        chord.forEach((freq, idx) => {
            const timeOffset = now + idx * 0.08;
            this._playTone(freq, 'sine', 0.6, 0.22, timeOffset);
        });
    }

    /**
     * Efeito Sonoro: Salto Hiperespaço / Warp.
     */
    playWarpSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.8);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.85);
    }
}

