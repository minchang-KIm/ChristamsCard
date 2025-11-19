class SantaCatcherGame {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.gameCanvas = document.getElementById('gameCanvas');
        this.canvasCtx = this.canvas.getContext('2d');
        this.gameCtx = this.gameCanvas.getContext('2d');

        this.score = 0;
        this.highScore = localStorage.getItem('santaCatcherHighScore') || 0;
        this.timeLeft = 60;
        this.gameRunning = false;
        this.handPositions = [];

        this.gifts = [];
        this.giftInterval = null;
        this.timerInterval = null;

        this.initializeGame();
    }

    initializeGame() {
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.gameCanvas.parentElement;
        this.canvas.width = this.gameCanvas.width = container.clientWidth;
        this.canvas.height = this.gameCanvas.height = container.clientHeight;
    }

    async startGame() {
        document.getElementById('instructions').style.display = 'none';

        try {
            await this.initializeCamera();
            await this.initializeHandTracking();

            this.gameRunning = true;
            this.score = 0;
            this.timeLeft = 60;
            this.gifts = [];

            this.updateScore();
            this.startGiftSpawn();
            this.startTimer();
            this.gameLoop();
        } catch (error) {
            alert('Camera access is required to play this game. Please allow camera access and try again.');
            document.getElementById('instructions').style.display = 'block';
        }
    }

    async initializeCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
        });
        this.video.srcObject = stream;
        return new Promise((resolve) => {
            this.video.onloadedmetadata = () => resolve();
        });
    }

    async initializeHandTracking() {
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults((results) => this.onHandsDetected(results));

        const camera = new Camera(this.video, {
            onFrame: async () => {
                await hands.send({ image: this.video });
            },
            width: 1280,
            height: 720
        });

        camera.start();
    }

    onHandsDetected(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.handPositions = [];

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                // Draw hand landmarks
                drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS,
                    { color: '#00FF00', lineWidth: 5 });
                drawLandmarks(this.canvasCtx, landmarks,
                    { color: '#FF0000', lineWidth: 2, radius: 5 });

                // Get palm center position
                const palmBase = landmarks[0];
                const handX = palmBase.x * this.canvas.width;
                const handY = palmBase.y * this.canvas.height;
                this.handPositions.push({ x: handX, y: handY, radius: 80 });
            }
        }

        this.canvasCtx.restore();
    }

    startGiftSpawn() {
        this.giftInterval = setInterval(() => {
            if (this.gameRunning) {
                this.spawnGift();
            }
        }, 800);
    }

    spawnGift() {
        const isBomb = Math.random() < 0.2; // 20% chance of bomb
        const gift = {
            x: Math.random() * (this.gameCanvas.width - 60) + 30,
            y: -50,
            width: 50,
            height: 50,
            speed: 2 + Math.random() * 2,
            emoji: isBomb ? '💣' : ['🎁', '🎀', '⭐', '🎄'][Math.floor(Math.random() * 4)],
            isBomb: isBomb,
            caught: false
        };
        this.gifts.push(gift);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

        // Update and draw gifts
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];

            if (gift.caught) continue;

            gift.y += gift.speed;

            // Check collision with hands
            for (const hand of this.handPositions) {
                const dx = gift.x - hand.x;
                const dy = gift.y - hand.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < hand.radius && !gift.caught) {
                    gift.caught = true;
                    if (gift.isBomb) {
                        this.score = Math.max(0, this.score - 20);
                        this.createExplosion(gift.x, gift.y);
                    } else {
                        this.score += 10;
                        this.createSparkles(gift.x, gift.y);
                    }
                    this.updateScore();
                    this.gifts.splice(i, 1);
                    break;
                }
            }

            // Remove off-screen gifts
            if (gift.y > this.gameCanvas.height) {
                this.gifts.splice(i, 1);
            } else if (!gift.caught) {
                // Draw gift
                this.gameCtx.font = '50px Arial';
                this.gameCtx.fillText(gift.emoji, gift.x - 25, gift.y + 25);
            }
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    createSparkles(x, y) {
        const sparkles = ['✨', '⭐', '💫', '🌟'];
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.gameCtx.font = '30px Arial';
                this.gameCtx.fillText(
                    sparkles[Math.floor(Math.random() * sparkles.length)],
                    x + (Math.random() - 0.5) * 100,
                    y + (Math.random() - 0.5) * 100
                );
            }, i * 50);
        }
    }

    createExplosion(x, y) {
        this.gameCtx.font = '60px Arial';
        this.gameCtx.fillText('💥', x - 30, y + 30);
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('santaCatcherHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }
    }

    endGame() {
        this.gameRunning = false;
        clearInterval(this.giftInterval);
        clearInterval(this.timerInterval);

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('gameOver').style.display = 'block';
    }

    restartGame() {
        document.getElementById('gameOver').style.display = 'none';
        this.startGame();
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new SantaCatcherGame();
});
