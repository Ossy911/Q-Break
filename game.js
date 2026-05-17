/**
 * Q-Break: Quantum Breach
 * Core Game Logic using Phaser 3
 */

class AudioController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration, vol=0.1) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClassicalShoot() {
        this.playTone(880, 'square', 0.1, 0.05); // High pitched, short
    }

    playQuantumShoot() {
        this.playTone(220, 'sawtooth', 0.3, 0.08); // Lower, thicker
    }

    playExplosion() {
        if (!this.enabled || this.ctx.state === 'suspended') return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        // Lowpass filter to make it sound like a muffled boom
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playUIBlip() {
        this.playTone(600, 'sine', 0.05, 0.1);
    }

    playVaultSecured() {
        // Major chord arpeggio
        setTimeout(() => this.playTone(440, 'sine', 0.1, 0.1), 0);
        setTimeout(() => this.playTone(554, 'sine', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(659, 'sine', 0.2, 0.1), 200);
    }

    playPlayerHit() {
        // Dissonant low frequency
        this.playTone(150, 'sawtooth', 0.4, 0.2);
        setTimeout(() => this.playTone(130, 'square', 0.4, 0.2), 50);
    }
}
const gameAudio = new AudioController();

const CONFIG = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#0a0a0f',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: null // To be set
};

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.enemies = null;
        this.projectiles = null;
        this.quips = null;
        this.entropy = 0;
        this.score = 0;
        this.vaultsSecured = 0;
        this.activeWeapon = 'classical';
        this.quantumCharges = 3;
        this.isGameOver = false;
        this.difficultyTimer = 0;
        this.currentWave = 1;
        this.enemiesDefeatedInWave = 0;
        this.isWaveTransitioning = false;
    }

    preload() {
        // We'll generate textures procedurally in create()
    }

    create() {
        this.createTextures();
        this.setupWorld();
        this.setupPlayer();
        this.setupInput();
        this.setupGroups();
        this.setupCollision();
        this.setupUIEvents();
        
        // Start Spawning
        this.spawnEvent = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 15000,
            callback: this.spawnDataBlock,
            callbackScope: this,
            loop: true
        });

        // Background Particles
        this.createBackgroundGrid();
        
        // Start first data block immediately
        this.spawnDataBlock();
    }

    createTextures() {
        // Player Texture
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.lineStyle(2, 0x00f2ff);
        graphics.strokeCircle(16, 16, 12);
        graphics.fillStyle(0x00f2ff, 0.3);
        graphics.fillCircle(16, 16, 8);
        graphics.generateTexture('player', 32, 32);
        graphics.clear();

        // Classical Projectile
        graphics.fillStyle(0x00f2ff, 1);
        graphics.fillCircle(4, 4, 3);
        graphics.generateTexture('bullet-classical', 8, 8);
        graphics.clear();

        // Quantum Projectile
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillCircle(8, 8, 6);
        graphics.lineStyle(1, 0xffffff);
        graphics.strokeCircle(8, 8, 6);
        graphics.generateTexture('bullet-quantum', 16, 16);
        graphics.clear();

        // Enemy: Swarm
        graphics.lineStyle(1, 0xff00ff);
        graphics.strokeTriangle(0, 16, 16, 16, 8, 0);
        graphics.generateTexture('enemy-swarm', 16, 16);
        graphics.clear();

        // Enemy: Brute
        graphics.lineStyle(2, 0x7a00ff);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.fillStyle(0x7a00ff, 0.2);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('enemy-brute', 32, 32);
        graphics.clear();

        // Enemy: Satoshi (Glitch)
        graphics.lineStyle(1, 0xffffff);
        graphics.strokeRect(0, 0, 20, 20);
        graphics.generateTexture('enemy-satoshi', 20, 20);
        graphics.clear();

        // Data Block
        graphics.lineStyle(2, 0x00f2ff);
        graphics.strokeRect(0, 0, 24, 24);
        graphics.generateTexture('datablock', 24, 24);
        graphics.clear();

        // QUIP Vault
        graphics.lineStyle(3, 0x00f2ff);
        graphics.strokeCircle(48, 48, 40);
        graphics.generateTexture('vault-base', 96, 96);
        graphics.clear();

        // Scrolling Grid Tile Texture
        graphics.lineStyle(1, 0x00f2ff, 0.15);
        graphics.strokeRect(0, 0, 64, 64);
        graphics.generateTexture('grid-tile', 64, 64);
        graphics.clear();
    }

    createBackgroundGrid() {
        this.bgGrid = this.add.tileSprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            'grid-tile'
        );
        this.bgGrid.setDepth(-1);
    }

    setupWorld() {
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    }

    setupPlayer() {
        this.player = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'player'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setDrag(1000);
        this.player.setMaxVelocity(300);
        this.player.setDepth(10);

        // Player trail particles for premium movement feel
        this.trailParticles = this.add.particles(0, 0, 'player', {
            speed: 0,
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.3, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            frequency: 50,
            follow: this.player
        });
        this.trailParticles.setDepth(9);
    }

    setupGroups() {
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.quips = this.physics.add.group();
        this.datablocks = this.physics.add.group();
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys('W,A,S,D,ONE,TWO,SPACE');
        this.input.on('pointerdown', (pointer) => {
            // Only fire if not touching the joystick or action button
            if (pointer.x > 200 || pointer.y < CONFIG.height - 200) {
                this.fire();
            }
        });

        // Mobile Action Button
        const mobileAction = document.getElementById('mobile-action');
        mobileAction.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            // Action handled by collision normally, but we could trigger it here
        });

        // Joystick Setup
        this.joystick = {
            active: false,
            baseX: 0,
            baseY: 0,
            vectorX: 0,
            vectorY: 0
        };

        const joystickEl = document.getElementById('joystick-move');
        const knobEl = joystickEl.querySelector('.joystick-knob');

        joystickEl.addEventListener('pointerdown', (e) => {
            this.joystick.active = true;
            const rect = joystickEl.getBoundingClientRect();
            this.joystick.baseX = rect.left + rect.width / 2;
            this.joystick.baseY = rect.top + rect.height / 2;
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.joystick.active) return;
            
            const dx = e.clientX - this.joystick.baseX;
            const dy = e.clientY - this.joystick.baseY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxDist = 40;
            
            const angle = Math.atan2(dy, dx);
            const moveDist = Math.min(dist, maxDist);
            
            this.joystick.vectorX = (Math.cos(angle) * moveDist) / maxDist;
            this.joystick.vectorY = (Math.sin(angle) * moveDist) / maxDist;
            
            knobEl.style.transform = `translate(calc(-50% + ${this.joystick.vectorX * maxDist}px), calc(-50% + ${this.joystick.vectorY * maxDist}px))`;
        });

        window.addEventListener('pointerup', () => {
            this.joystick.active = false;
            this.joystick.vectorX = 0;
            this.joystick.vectorY = 0;
            knobEl.style.transform = `translate(-50%, -50%)`;
        });
    }

    setupCollision() {
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.datablocks, this.collectData, null, this);
    }

    setupUIEvents() {
        // Initial UI update
        this.updateUI();
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Scroll background cyber-grid dynamically
        if (this.bgGrid) {
            this.bgGrid.tilePositionX = time * 0.05;
            this.bgGrid.tilePositionY = time * 0.05;
            
            // Add parallax drag based on player physics
            if (this.player && this.player.body) {
                this.bgGrid.tilePositionX += this.player.body.velocity.x * 0.003;
                this.bgGrid.tilePositionY += this.player.body.velocity.y * 0.003;
            }
        }

        this.handleMovement();
        this.handleWeaponSwitch();
        this.handleEntropy(delta);
        
        // Rotate player towards mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        this.player.setRotation(angle);

        // Enemy AI
        this.enemies.getChildren().forEach(enemy => {
            this.physics.moveToObject(enemy, this.player, enemy.speed || 100);
        });

        // QUIP Progress
        this.quips.getChildren().forEach(quip => {
            if (quip.status === 'approving') {
                quip.progress += delta / 1000;
                quip.overlay.setAlpha(0.2 + 0.8 * (quip.progress / 10));
                if (quip.progress >= 10) {
                    this.completeVault(quip);
                }
            }
        });
    }

    handleMovement() {
        const speed = 300;
        
        // Keyboard
        let vx = 0;
        let vy = 0;
        
        if (this.keys.W.isDown) vy = -1;
        else if (this.keys.S.isDown) vy = 1;
        
        if (this.keys.A.isDown) vx = -1;
        else if (this.keys.D.isDown) vx = 1;

        // Joystick Override
        if (this.joystick.active) {
            vx = this.joystick.vectorX;
            vy = this.joystick.vectorY;
        }

        if (vx !== 0 || vy !== 0) {
            this.player.setAccelerationX(vx * speed * 5);
            this.player.setAccelerationY(vy * speed * 5);
        } else {
            this.player.setAccelerationX(0);
            this.player.setAccelerationY(0);
        }
    }

    handleWeaponSwitch() {
        if (this.keys.ONE.isDown) this.setActiveWeapon('classical');
        if (this.keys.TWO.isDown) this.setActiveWeapon('quantum');
    }

    setActiveWeapon(type) {
        if (this.activeWeapon !== type) {
            gameAudio.playUIBlip();
        }
        this.activeWeapon = type;
        document.querySelectorAll('.weapon').forEach(w => w.classList.remove('active'));
        document.getElementById(`weapon-${type}`).classList.add('active');
    }

    handleEntropy(delta) {
        this.entropy += (delta / 1000) * 0.5; // Base entropy growth
        if (this.entropy >= 100) {
            this.entropy = 100;
            this.gameOver();
        }
        this.updateUI();
    }

    fire() {
        if (this.isGameOver) return;

        if (this.activeWeapon === 'quantum') {
            if (this.quantumCharges <= 0) return;
            this.quantumCharges--;
            this.updateUI();
        }

        const pointer = this.input.activePointer;
        const bullet = this.projectiles.create(this.player.x, this.player.y, `bullet-${this.activeWeapon}`);
        bullet.type = this.activeWeapon;
        
        if (this.activeWeapon === 'classical') {
            gameAudio.playClassicalShoot();
        } else if (this.activeWeapon === 'quantum') {
            gameAudio.playQuantumShoot();
        }
        
        this.physics.moveTo(bullet, pointer.x, pointer.y, 600);
        bullet.setRotation(Phaser.Math.Angle.Between(bullet.x, bullet.y, pointer.x, pointer.y));
        
        // Lifespan
        this.time.delayedCall(2000, () => bullet.destroy());
    }

    spawnEnemy() {
        if (this.isGameOver || this.isWaveTransitioning) return;

        const side = Phaser.Math.Between(0, 3);
        let x, y;
        if (side === 0) { x = Phaser.Math.Between(0, CONFIG.width); y = -50; }
        else if (side === 1) { x = CONFIG.width + 50; y = Phaser.Math.Between(0, CONFIG.height); }
        else if (side === 2) { x = Phaser.Math.Between(0, CONFIG.width); y = CONFIG.height + 50; }
        else { x = -50; y = Phaser.Math.Between(0, CONFIG.height); }

        const rand = Math.random();
        let type = 'swarm';
        // Brutes restricted to Wave 2+, Satoshi restricted to Wave 4+
        if (rand > 0.9 && this.currentWave >= 2) type = 'brute';
        else if (rand > 0.7 && this.currentWave >= 4) type = 'satoshi';

        const enemy = this.enemies.create(x, y, `enemy-${type}`);
        enemy.enemyType = type;
        enemy.health = type === 'brute' ? 5 : 1;
        let baseSpeed = type === 'satoshi' ? 200 : 100;
        enemy.speed = baseSpeed + (this.currentWave * 15);
        
        if (type === 'satoshi') {
            enemy.setTint(0xffffff);
            // Glitch effect
            this.time.addEvent({
                delay: 200,
                callback: () => enemy.setAlpha(Math.random()),
                loop: true
            });
        } else if (type === 'brute') {
            // Subtle glowing purple trail for Brute
            const trail = this.add.particles(0, 0, 'enemy-brute', {
                speed: 0,
                scale: { start: 0.6, end: 0 },
                alpha: { start: 0.2, end: 0 },
                lifespan: 400,
                blendMode: 'ADD',
                frequency: 80,
                follow: enemy
            });
            trail.setDepth(7);
            enemy.trailEmitter = trail;
        }
    }

    spawnDataBlock() {
        if (this.isGameOver) return;
        const x = Phaser.Math.Between(100, CONFIG.width - 100);
        const y = Phaser.Math.Between(100, CONFIG.height - 100);
        const db = this.datablocks.create(x, y, 'datablock');
        db.setInteractive();
        
        // Floating animation
        this.tweens.add({
            targets: db,
            y: y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    collectData(player, db) {
        db.destroy();
        this.initVault(db.x, db.y);
    }

    initVault(x, y) {
        const vault = this.quips.create(x, y, 'vault-base');
        vault.status = 'approving';
        vault.progress = 0;
        vault.overlay = this.add.circle(x, y, 40, 0x00f2ff, 0.2);
        
        // Pop glowing burst particles when initializing the vault
        for (let i = 0; i < 20; i++) {
            const p = this.add.circle(x, y, 3, 0x00f2ff);
            this.physics.add.existing(p);
            p.body.setVelocity(
                Phaser.Math.Between(-150, 150),
                Phaser.Math.Between(-150, 150)
            );
            this.tweens.add({
                targets: p,
                alpha: 0,
                scale: 0.5,
                duration: 600,
                onComplete: () => p.destroy()
            });
        }
        
        // UI Notification
        this.showMessage("VAULT INITIALIZED: DEFEND AREA");
    }

    completeVault(vault) {
        vault.status = 'claimed';
        vault.overlay.destroy();
        gameAudio.playVaultSecured();
        
        // Visual Pop
        const fx = this.add.circle(vault.x, vault.y, 40, 0x00f2ff, 1);
        this.tweens.add({
            targets: fx,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => fx.destroy()
        });

        vault.destroy();
        this.score += 1000;
        this.vaultsSecured++;
        this.entropy = Math.max(0, this.entropy - 20);
        this.quantumCharges = Math.min(5, this.quantumCharges + 2);
        
        this.updateUI();
        this.showMessage("QUIP SECURED: ENTROPY PURGED");
    }

    hitEnemy(bullet, enemy) {
        // Quantum enemies (Brutes) need Quantum bullets?
        // Let's make Brutes immune to classical
        if (enemy.enemyType === 'brute' && bullet.type === 'classical') {
            bullet.destroy();
            return;
        }

        enemy.health--;
        bullet.destroy();

        if (enemy.health <= 0) {
            const points = enemy.enemyType === 'brute' ? 500 : (enemy.enemyType === 'satoshi' ? 200 : 100);
            this.score += points;
            
            // Floating score text popup
            const scoreText = this.add.text(enemy.x, enemy.y - 10, `+${points}`, {
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                color: enemy.enemyType === 'brute' ? '#7a00ff' : '#00f2ff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(20);
            
            this.tweens.add({
                targets: scoreText,
                y: scoreText.y - 40,
                alpha: 0,
                duration: 800,
                onComplete: () => scoreText.destroy()
            });

            this.createExplosion(enemy.x, enemy.y, enemy.enemyType === 'brute' ? 0x7a00ff : 0xff00ff);
            
            // Add dramatic camera shake for large Quantum explosions and Brute defeats
            if (bullet.type === 'quantum' || enemy.enemyType === 'brute') {
                this.cameras.main.shake(200, 0.015);
            }
            
            // Trigger premium impact hit-stop freeze on major brute kills
            if (enemy.enemyType === 'brute') {
                this.triggerHitStop(80);
            }
            
            if (enemy.trailEmitter) enemy.trailEmitter.destroy();
            enemy.destroy();
            this.enemiesDefeatedInWave++;
            this.checkWaveProgress();
            this.updateUI();
        }
    }

    checkWaveProgress() {
        if (this.enemiesDefeatedInWave >= 10 + (this.currentWave * 2)) {
            this.advanceWave();
        }
    }

    advanceWave() {
        this.currentWave++;
        this.enemiesDefeatedInWave = 0;
        this.isWaveTransitioning = true;
        if (this.spawnEvent) this.spawnEvent.destroy();
        this.showMessage(`WAVE ${this.currentWave} INCOMING`);
        
        // Cinematic floating wave banner
        const waveText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            `WAVE ${this.currentWave}`,
            {
                fontFamily: 'Outfit, sans-serif',
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#ff00ff',
                stroke: '#00f2ff',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(100).setAlpha(0).setScale(0.5);
        
        this.tweens.add({
            targets: waveText,
            alpha: 1,
            scale: 1.2,
            duration: 500,
            ease: 'Back.easeOut',
            yoyo: true,
            hold: 1500,
            onComplete: () => waveText.destroy()
        });
        
        // Resume after 3 seconds
        this.time.delayedCall(3000, () => {
            this.isWaveTransitioning = false;
            const newDelay = Math.max(400, 2000 - (this.currentWave * 150));
            this.spawnEvent = this.time.addEvent({
                delay: newDelay,
                callback: this.spawnEnemy,
                callbackScope: this,
                loop: true
            });
        });
        
        this.updateUI();
    }

    hitPlayer(player, enemy) {
        gameAudio.playPlayerHit();
        const damage = enemy.enemyType === 'brute' ? 15 : 5;
        this.entropy += damage;
        this.createExplosion(enemy.x, enemy.y, 0xff0000);
        if (enemy.trailEmitter) enemy.trailEmitter.destroy();
        enemy.destroy();
        
        // Player visual damage flash
        this.player.setTint(0xff0000);
        this.time.delayedCall(150, () => {
            if (this.player && this.player.active) {
                this.player.clearTint();
            }
        });
        
        // Dynamic camera shake depending on impact
        const shakeDuration = enemy.enemyType === 'brute' ? 300 : 150;
        const shakeIntensity = enemy.enemyType === 'brute' ? 0.03 : 0.01;
        this.cameras.main.shake(shakeDuration, shakeIntensity);
        
        this.updateUI();
    }

    createExplosion(x, y, color) {
        gameAudio.playExplosion();
        for (let i = 0; i < 10; i++) {
            const p = this.add.circle(x, y, 2, color);
            this.physics.add.existing(p);
            p.body.setVelocity(
                Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(-100, 100)
            );
            this.tweens.add({
                targets: p,
                alpha: 0,
                duration: 500,
                onComplete: () => p.destroy()
            });
        }
    }

    updateUI() {
        document.getElementById('entropy-fill').style.width = `${this.entropy}%`;
        document.getElementById('entropy-value').textContent = `${Math.floor(this.entropy)}%`;
        document.getElementById('score-value').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('vaults-value').textContent = `${this.vaultsSecured}/5`;
        document.getElementById('wave-value').textContent = this.currentWave;
        
        // Quantum Charges
        const chargeContainer = document.getElementById('quantum-charges');
        chargeContainer.innerHTML = '';
        for (let i = 0; i < this.quantumCharges; i++) {
            const dot = document.createElement('div');
            dot.className = 'charge-dot';
            chargeContainer.appendChild(dot);
        }

        const entropyFill = document.getElementById('entropy-fill');
        if (this.entropy > 80) {
            entropyFill.classList.add('critical');
        } else {
            entropyFill.classList.remove('critical');
        }
    }

    triggerHitStop(duration) {
        this.physics.world.pause();
        setTimeout(() => {
            if (!this.isGameOver) {
                this.physics.world.resume();
            }
        }, duration);
    }

    showMessage(text) {
        const prompt = document.getElementById('interaction-prompt');
        prompt.textContent = text;
        prompt.classList.remove('hidden');
        this.time.delayedCall(3000, () => prompt.classList.add('hidden'));
    }

    gameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        
        document.getElementById('ui-layer').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-vaults').textContent = this.vaultsSecured;

        // Handle guest score commit button style
        const commitBtn = document.getElementById('commit-score-btn');
        if (window.quip.isGuest) {
            commitBtn.textContent = 'CONNECT TO SAVE SCORE';
            commitBtn.disabled = true;
            commitBtn.style.opacity = '0.5';
            commitBtn.style.cursor = 'not-allowed';
        } else {
            commitBtn.textContent = 'COMMIT SCORE TO QUIP';
            commitBtn.disabled = false;
            commitBtn.style.opacity = '1';
            commitBtn.style.cursor = 'pointer';
        }
    }
}

// Initialization
let game;
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('ui-layer').classList.remove('hidden');
    
    CONFIG.scene = GameScene;
    game = new Phaser.Game(CONFIG);
});

document.getElementById('restart-btn').addEventListener('click', () => {
    window.location.reload();
});

document.getElementById('commit-score-btn').addEventListener('click', async () => {
    const btn = document.getElementById('commit-score-btn');
    btn.textContent = 'COMMITTING...';
    btn.disabled = true;
    
    const score = parseInt(document.getElementById('final-score').textContent);
    const vaults = parseInt(document.getElementById('final-vaults').textContent);
    
    const result = await window.quip.commitScore(score, vaults);
    if (result.success) {
        btn.textContent = 'COMMITTED: ' + result.hash.substring(0, 10) + '...';
        btn.style.borderColor = 'var(--cyan)';
        btn.style.color = 'var(--cyan)';
    }
});
