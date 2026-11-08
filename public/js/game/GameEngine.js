/**
 * @file GameEngine.js
 * @description Lógica do arcade espacial, ciclo de jogo, detecção de colisões e sistema de pontuação com milestones.
 */

export class GameEngine {
    constructor(particleSystem, synthEngine) {
        this.particles = particleSystem;
        this.synth = synthEngine;

        this.width = 800;
        this.height = 600;

        // Entidade Jogador (Interceptor Cyberpunk)
        this.player = {
            x: 400,
            y: 500,
            vx: 0,
            vy: 0,
            radius: 18,
            angle: -Math.PI / 2,
            targetAngle: -Math.PI / 2,
            speed: 6.5,
            fireCooldown: 0,
            maxCooldown: 8,
            isThrusting: false
        };

        // Projéteis e Inimigos
        this.projectiles = [];
        this.targets = [];
        this.spawnTimer = 0;
        this.spawnInterval = 75; // frames

        // Pontuação e Combos
        this.score = 0;
        this.multiplier = 1;
        this.comboTimer = 0;
        this.maxComboTime = 180; // 3 segundos a 60 FPS
        this.lastMilestone = 0;
        this.milestoneStep = 1000;

        // Feedback visual de Milestone / Comemoração
        this.activeBanner = null;
        this.bannerTimer = 0;
        this.screenShake = 0;

        // Entradas do usuário
        this.keys = {};
        this.mouse = { x: 400, y: 300, isDown: false };
    }

    init(width, height) {
        this.resize(width, height);
        this.player.x = width / 2;
        this.player.y = height * 0.75;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    handleKeyDown(code) {
        this.keys[code] = true;
        if (code === 'Space') {
            this.mouse.isDown = true;
        }
    }

    handleKeyUp(code) {
        this.keys[code] = false;
        if (code === 'Space') {
            this.mouse.isDown = false;
        }
    }

    handleMouseMove(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    }

    handleMouseDown() {
        this.mouse.isDown = true;
    }

    handleMouseUp() {
        this.mouse.isDown = false;
    }

    /**
     * Atualização do loop de simulação.
     */
    update(dt) {
        // Redução gradual de tremor de tela (Screen Shake)
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }

        // Atualização do jogador
        this._updatePlayer(dt);

        // Atualização de projéteis
        this._updateProjectiles(dt);

        // Spawn e atualização de alvos orbitais
        this._updateTargets(dt);

        // Verificação de colisões e pontuação
        this._checkCollisions();

        // Temporizador de combo
        if (this.multiplier > 1) {
            this.comboTimer -= dt * 60;
            if (this.comboTimer <= 0) {
                this.multiplier = 1;
            }
        }

        // Temporizador de banner comemorativo
        if (this.bannerTimer > 0) {
            this.bannerTimer -= dt * 60;
            if (this.bannerTimer <= 0) {
                this.activeBanner = null;
            }
        }
    }

    _updatePlayer(dt) {
        const p = this.player;

        // Movimentação por teclado (WASD / Setas)
        let moveX = 0;
        let moveY = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
        }

        p.vx = moveX * p.speed;
        p.vy = moveY * p.speed;

        p.x += p.vx * (dt * 60);
        p.y += p.vy * (dt * 60);

        // Limites da tela
        p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));

        // Rotação suave em direção à mira do mouse
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        p.targetAngle = Math.atan2(dy, dx);

        // Interpolação angular suave
        let diff = p.targetAngle - p.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        p.angle += diff * 0.2;

        // Emissão de esteira do propulsor
        p.isThrusting = (moveX !== 0 || moveY !== 0);
        if (p.isThrusting || Math.random() < 0.4) {
            const exhaustX = p.x - Math.cos(p.angle) * p.radius;
            const exhaustY = p.y - Math.sin(p.angle) * p.radius;
            this.particles.spawnExhaust(exhaustX, exhaustY, p.angle);
        }

        // Cadência de disparo
        if (p.fireCooldown > 0) {
            p.fireCooldown -= dt * 60;
        }

        if (this.mouse.isDown && p.fireCooldown <= 0) {
            this._fireLasers();
            p.fireCooldown = p.maxCooldown;
        }
    }

    _fireLasers() {
        const p = this.player;
        const speed = 14;

        // Disparo duplo simétrico
        const offsetDist = 12;
        const leftX = p.x + Math.cos(p.angle + Math.PI / 2) * offsetDist;
        const leftY = p.y + Math.sin(p.angle + Math.PI / 2) * offsetDist;
        const rightX = p.x + Math.cos(p.angle - Math.PI / 2) * offsetDist;
        const rightY = p.y + Math.sin(p.angle - Math.PI / 2) * offsetDist;

        const vx = Math.cos(p.angle) * speed;
        const vy = Math.sin(p.angle) * speed;

        this.projectiles.push(
            { x: leftX, y: leftY, vx, vy, radius: 3, life: 120 },
            { x: rightX, y: rightY, vx, vy, radius: 3, life: 120 }
        );

        this.synth.playLaser();
    }

    _updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * (dt * 60);
            proj.y += proj.vy * (dt * 60);
            proj.life -= dt * 60;

            if (proj.life <= 0 || proj.x < 0 || proj.x > this.width || proj.y < 0 || proj.y > this.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    _updateTargets(dt) {
        this.spawnTimer += dt * 60;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnTarget();
        }

        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];
            t.x += t.vx * (dt * 60);
            t.y += t.vy * (dt * 60);
            t.rotation += t.rotSpeed * (dt * 60);

            // Rebatimento nas bordas horizontais
            if (t.x < t.radius || t.x > this.width - t.radius) {
                t.vx *= -1;
            }

            // Excluir se passar da borda inferior
            if (t.y > this.height + t.radius * 2) {
                this.targets.splice(i, 1);
            }
        }
    }

    _spawnTarget() {
        const radius = 16 + Math.random() * 14;
        const x = radius + Math.random() * (this.width - radius * 2);
        const y = -radius;
        const vx = (Math.random() - 0.5) * 2;
        const vy = 1.2 + Math.random() * 2;
        const color = ['#ff007f', '#00f3ff', '#00ff66', '#ffaa00'][Math.floor(Math.random() * 4)];

        this.targets.push({
            x,
            y,
            vx,
            vy,
            radius,
            color,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            points: Math.round(100 + (30 - radius) * 10)
        });
    }

    _checkCollisions() {
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const t = this.targets[i];

            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const p = this.projectiles[j];
                const dx = t.x - p.x;
                const dy = t.y - p.y;
                const distSq = dx * dx + dy * dy;
                const combinedRadius = t.radius + p.radius;

                if (distSq <= combinedRadius * combinedRadius) {
                    // Colisão confirmada
                    this.particles.spawnImpactSparks(p.x, p.y);
                    this.particles.spawnFirework(t.x, t.y, 60);
                    this.synth.playExplosion();

                    // Acréscimo de pontuação e combo
                    this.score += t.points * this.multiplier;
                    this.multiplier = Math.min(8, this.multiplier + 1);
                    this.comboTimer = this.maxComboTime;

                    // Avaliar milestone de celebração
                    if (Math.floor(this.score / this.milestoneStep) > Math.floor(this.lastMilestone / this.milestoneStep)) {
                        this._triggerMilestoneCelebration();
                    }
                    this.lastMilestone = this.score;

                    this.targets.splice(i, 1);
                    this.projectiles.splice(j, 1);
                    break;
                }
            }
        }
    }

    _triggerMilestoneCelebration() {
        this.screenShake = 12;
        this.synth.playMilestoneChime();
        this.activeBanner = `MILESTONE ATINGIDO: ${this.score} PTS!`;
        this.bannerTimer = 160;

        // Erupção de fogos de artifício e confetes
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const fx = 100 + Math.random() * (this.width - 200);
                const fy = 100 + Math.random() * (this.height * 0.4);
                this.particles.spawnFirework(fx, fy, 140);
            }, i * 150);
        }

        this.particles.spawnConfettiShower(this.width, 100);
    }

    /**
     * Renderização de entidades no contexto 2D.
     */
    draw(ctx) {
        ctx.save();

        // Aplicar Screen Shake
        if (this.screenShake > 0) {
            const offsetX = (Math.random() - 0.5) * this.screenShake;
            const offsetY = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(offsetX, offsetY);
        }

        // Renderizar Projéteis
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        for (let proj of this.projectiles) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Renderizar Alvos Orbitais (Geometria Neon Wireframe)
        for (let t of this.targets) {
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.rotation);
            ctx.strokeStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 12;
            ctx.lineWidth = 2.5;

            // Desenhar Diamante / Octógono Wireframe
            ctx.beginPath();
            const sides = 6;
            for (let s = 0; s < sides; s++) {
                const a = (s / sides) * Math.PI * 2;
                const px = Math.cos(a) * t.radius;
                const py = Math.sin(a) * t.radius;
                if (s === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Núcleo central
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, t.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Renderizar Jogador (Interceptor)
        const p = this.player;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        ctx.strokeStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#0a1628';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(p.radius * 1.3, 0);
        ctx.lineTo(-p.radius, -p.radius * 0.8);
        ctx.lineTo(-p.radius * 0.5, 0);
        ctx.lineTo(-p.radius, p.radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit brilhante
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(p.radius * 0.2, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Renderizar Banner de Milestone / Comemoração
        if (this.activeBanner && this.bannerTimer > 0) {
            const alpha = Math.min(1, this.bannerTimer / 30);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 24px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff007f';
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 20;
            ctx.fillText(this.activeBanner, this.width / 2, this.height * 0.35);
            ctx.restore();
        }

        ctx.restore();
    }
}

