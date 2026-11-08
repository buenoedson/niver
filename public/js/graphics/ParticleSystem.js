/**
 * @file ParticleSystem.js
 * @description Motor de partículas 2D de alta performance com padrão Object Pooling.
 * Suporta emissão de fogos de artifício procedurais, confetes, esteiras de plasma e campo estelar.
 */

class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 2;
        this.color = '#00f3ff';
        this.alpha = 1;
        this.decay = 0.015;
        this.gravity = 0.05;
        this.friction = 0.98;
        this.isConfetti = false;
        this.rotation = 0;
        this.rotSpeed = 0;
        this.aspectRatio = 1;
    }

    reset(x, y, vx, vy, size, color, decay, gravity, friction, isConfetti = false) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.alpha = 1;
        this.decay = decay;
        this.gravity = gravity;
        this.friction = friction;
        this.isConfetti = isConfetti;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
        this.aspectRatio = isConfetti ? (0.4 + Math.random() * 0.6) : 1;
    }

    update(dt) {
        if (!this.active) return;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        this.x += this.vx * (dt * 60);
        this.y += this.vy * (dt * 60);

        this.alpha -= this.decay * (dt * 60);
        if (this.isConfetti) {
            this.rotation += this.rotSpeed * (dt * 60);
        }

        if (this.alpha <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));

        if (this.isConfetti) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.fillRect(
                -this.size / 2,
                -(this.size * this.aspectRatio) / 2,
                this.size,
                this.size * this.aspectRatio
            );
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export class ParticleSystem {
    constructor(maxParticles = 2500) {
        this.maxParticles = maxParticles;
        this.pool = new Array(maxParticles);
        for (let i = 0; i < maxParticles; i++) {
            this.pool[i] = new Particle();
        }

        this.stars = [];
        this.starCount = 180;
        this.warpSpeedMultiplier = 1;
        this.isWarping = false;

        this.palette = [
            '#00f3ff', // Cyan
            '#ff007f', // Pink
            '#00ff66', // Green
            '#ffaa00', // Amber
            '#ffffff', // White
            '#9d00ff'  // Purple
        ];
    }

    /**
     * Inicializa o campo de estrelas procedurais no fundo.
     */
    initStars(width, height) {
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z: Math.random() * width,
                baseSpeed: 0.5 + Math.random() * 2,
                size: 0.8 + Math.random() * 1.6
            });
        }
    }

    /**
     * Alterna o modo de dobra estelar (Warp Speed).
     */
    toggleWarp() {
        this.isWarping = !this.isWarping;
        return this.isWarping;
    }

    /**
     * Dispara um feixe de fogos de artifício com explosão radial.
     */
    spawnFirework(x, y, count = 120) {
        const color = this.palette[Math.floor(Math.random() * this.palette.length)];
        const secondaryColor = this.palette[Math.floor(Math.random() * this.palette.length)];

        for (let i = 0; i < count; i++) {
            const particle = this._getAvailableParticle();
            if (!particle) break;

            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 1.5 + Math.random() * 2.5;
            const decay = 0.012 + Math.random() * 0.018;
            const selectedColor = Math.random() > 0.3 ? color : secondaryColor;

            particle.reset(x, y, vx, vy, size, selectedColor, decay, 0.04, 0.96, false);
        }
    }

    /**
     * Emite chuva de confetes holográficos com física rotacional.
     */
    spawnConfettiShower(width, count = 80) {
        for (let i = 0; i < count; i++) {
            const particle = this._getAvailableParticle();
            if (!particle) break;

            const x = Math.random() * width;
            const y = -10 - Math.random() * 40;
            const vx = (Math.random() - 0.5) * 3;
            const vy = 1.5 + Math.random() * 3.5;
            const size = 5 + Math.random() * 6;
            const color = this.palette[Math.floor(Math.random() * this.palette.length)];
            const decay = 0.003 + Math.random() * 0.005;

            particle.reset(x, y, vx, vy, size, color, decay, 0.02, 0.99, true);
        }
    }

    /**
     * Emite partículas de esteira do motor da nave.
     */
    spawnExhaust(x, y, angle) {
        const particle = this._getAvailableParticle();
        if (!particle) return;

        const spread = (Math.random() - 0.5) * 0.5;
        const speed = 3 + Math.random() * 2;
        const vx = -Math.cos(angle + spread) * speed;
        const vy = -Math.sin(angle + spread) * speed;

        particle.reset(x, y, vx, vy, 2, '#00f3ff', 0.08, 0, 0.92, false);
    }

    /**
     * Emite faíscas de impacto de projétil em alvos.
     */
    spawnImpactSparks(x, y, count = 16) {
        for (let i = 0; i < count; i++) {
            const particle = this._getAvailableParticle();
            if (!particle) break;

            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            particle.reset(x, y, vx, vy, 1.8, '#ffaa00', 0.05, 0.02, 0.95, false);
        }
    }

    /**
     * Atualização de ciclo de vida das partículas e campo de estrelas.
     */
    update(dt, width, height) {
        // Atualizar partículas
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.pool[i].active) {
                this.pool[i].update(dt);
            }
        }

        // Atualizar campo estelar
        const targetMultiplier = this.isWarping ? 18 : 1;
        this.warpSpeedMultiplier += (targetMultiplier - this.warpSpeedMultiplier) * 0.08;

        for (let star of this.stars) {
            star.y += star.baseSpeed * this.warpSpeedMultiplier * (dt * 60);
            if (star.y > height) {
                star.y = 0;
                star.x = Math.random() * width;
            }
        }
    }

    /**
     * Renderização em lote no contexto 2D.
     */
    draw(ctx) {
        // Renderizar estrelas
        ctx.save();
        for (let star of this.stars) {
            ctx.fillStyle = this.isWarping ? '#00f3ff' : 'rgba(255, 255, 255, 0.7)';
            if (this.isWarping) {
                ctx.fillRect(star.x, star.y, star.size, star.size * 6);
            } else {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // Renderizar partículas ativas
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.pool[i].active) {
                this.pool[i].draw(ctx);
            }
        }
    }

    /**
     * Retorna a quantidade de partículas em execução no momento.
     */
    getActiveCount() {
        let count = 0;
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.pool[i].active) count++;
        }
        return count;
    }

    _getAvailableParticle() {
        for (let i = 0; i < this.maxParticles; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        return null;
    }
}

