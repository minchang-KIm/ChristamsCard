class SnowmanJumpGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.player = {
            x: 0,
            y: 0,
            width: 60,
            height: 60,
            velocityX: 0,
            velocityY: 0,
            jumping: false
        };

        this.gravity = 0.5;
        this.jumpForce = -12;
        this.moveSpeed = 5;
        this.platforms = [];
        this.score = 0;
        this.highScore = localStorage.getItem('snowmanJumpHighScore') || 0;
        this.gameRunning = false;
        this.cameraY = 0;

        this.keys = {};

        this.initializeGame();
    }

    initializeGame() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Mobile controls
        if (this.isMobile()) {
            document.getElementById('mobileControls').style.display = 'flex';
            document.getElementById('leftBtn').addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
            document.getElementById('leftBtn').addEventListener('touchend', () => this.keys['ArrowLeft'] = false);
            document.getElementById('rightBtn').addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
            document.getElementById('rightBtn').addEventListener('touchend', () => this.keys['ArrowRight'] = false);

            // Tilt controls
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', (e) => this.handleTilt(e));
            }
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    handleTilt(event) {
        if (!this.gameRunning) return;

        const gamma = event.gamma; // Left-right tilt (-90 to 90)

        if (gamma !== null) {
            if (gamma < -10) {
                this.player.velocityX = -this.moveSpeed;
            } else if (gamma > 10) {
                this.player.velocityX = this.moveSpeed;
            } else {
                this.player.velocityX *= 0.9;
            }
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = 600;
        this.canvas.width = Math.min(container.clientWidth, maxWidth);
        this.canvas.height = container.clientHeight;
    }

    startGame() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';

        this.gameRunning = true;
        this.score = 0;
        this.cameraY = 0;

        // Initialize player position
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height - 150;
        this.player.velocityX = 0;
        this.player.velocityY = 0;

        // Create initial platforms
        this.platforms = [];
        this.createInitialPlatforms();

        this.gameLoop();
    }

    createInitialPlatforms() {
        // Starting platform
        this.platforms.push({
            x: this.canvas.width / 2 - 50,
            y: this.canvas.height - 100,
            width: 100,
            height: 20,
            type: 'normal'
        });

        // Generate platforms going up
        for (let i = 0; i < 10; i++) {
            this.generatePlatform(i * 80);
        }
    }

    generatePlatform(offsetY = 0) {
        const types = ['normal', 'normal', 'normal', 'moving', 'breakable'];
        const type = types[Math.floor(Math.random() * types.length)];

        const platform = {
            x: Math.random() * (this.canvas.width - 100),
            y: this.canvas.height - 200 - offsetY - Math.random() * 100,
            width: type === 'breakable' ? 80 : 100,
            height: 20,
            type: type,
            broken: false
        };

        if (type === 'moving') {
            platform.velocityX = 2;
            platform.direction = Math.random() < 0.5 ? 1 : -1;
        }

        this.platforms.push(platform);
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Handle input
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.velocityX = -this.moveSpeed;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.velocityX = this.moveSpeed;
        } else if (!this.isMobile()) {
            this.player.velocityX *= 0.8;
        }

        // Apply gravity
        this.player.velocityY += this.gravity;

        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Wrap around screen horizontally
        if (this.player.x > this.canvas.width) {
            this.player.x = -this.player.width;
        } else if (this.player.x < -this.player.width) {
            this.player.x = this.canvas.width;
        }

        // Move camera when player goes up
        if (this.player.y < this.canvas.height / 2) {
            const diff = this.canvas.height / 2 - this.player.y;
            this.player.y = this.canvas.height / 2;
            this.cameraY += diff;
            this.score = Math.max(this.score, Math.floor(this.cameraY / 10));
            document.getElementById('score').textContent = this.score;
        }

        // Update platforms
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const platform = this.platforms[i];

            // Moving platforms
            if (platform.type === 'moving') {
                platform.x += platform.velocityX * platform.direction;
                if (platform.x <= 0 || platform.x >= this.canvas.width - platform.width) {
                    platform.direction *= -1;
                }
            }

            // Check collision (only when falling)
            if (this.player.velocityY > 0 &&
                !platform.broken &&
                this.player.x < platform.x + platform.width &&
                this.player.x + this.player.width > platform.x &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 10) {

                if (platform.type === 'breakable') {
                    platform.broken = true;
                } else {
                    this.player.velocityY = this.jumpForce;
                    this.player.jumping = true;
                }
            }

            // Remove platforms that are too far down
            if (platform.y - this.cameraY > this.canvas.height + 100) {
                this.platforms.splice(i, 1);
            }
        }

        // Generate new platforms
        if (this.platforms.length < 15) {
            const highestPlatform = Math.min(...this.platforms.map(p => p.y));
            if (highestPlatform > -this.cameraY + 200) {
                this.generatePlatform(this.cameraY + 100);
            }
        }

        // Check game over
        if (this.player.y - this.cameraY > this.canvas.height) {
            this.endGame();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for camera
        this.ctx.save();
        this.ctx.translate(0, -this.cameraY);

        // Draw platforms
        for (const platform of this.platforms) {
            if (platform.broken) continue;

            this.ctx.fillStyle = this.getPlatformColor(platform.type);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;

            if (platform.type === 'breakable') {
                // Breakable platform style
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('❄️', platform.x + platform.width / 2, platform.y + 15);
            } else {
                // Normal/moving platform
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 10);
                this.ctx.fill();
                this.ctx.stroke();

                if (platform.type === 'moving') {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('→', platform.x + platform.width / 2, platform.y + 14);
                }
            }
        }

        // Draw player (snowman)
        this.drawSnowman(this.player.x, this.player.y);

        this.ctx.restore();
    }

    drawSnowman(x, y) {
        // Bottom snowball
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x + 30, y + 50, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Top snowball (head)
        this.ctx.beginPath();
        this.ctx.arc(x + 30, y + 20, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x + 25, y + 17, 2, 0, Math.PI * 2);
        this.ctx.arc(x + 35, y + 17, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Carrot nose
        this.ctx.fillStyle = '#ff6b35';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 30, y + 21);
        this.ctx.lineTo(x + 40, y + 21);
        this.ctx.lineTo(x + 30, y + 24);
        this.ctx.fill();

        // Hat
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 20, y + 5, 20, 3);
        this.ctx.fillRect(x + 23, y - 5, 14, 10);

        // Scarf
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(x + 25, y + 30, 10, 8);
    }

    getPlatformColor(type) {
        switch (type) {
            case 'normal':
                return '#4facfe';
            case 'moving':
                return '#f093fb';
            case 'breakable':
                return '#a8edea';
            default:
                return '#4facfe';
        }
    }

    endGame() {
        this.gameRunning = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snowmanJumpHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').style.display = 'block';
    }

    restartGame() {
        this.startGame();
    }
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new SnowmanJumpGame();
});
