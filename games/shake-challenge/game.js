class ShakeChallengeGame {
    constructor() {
        this.shakeCount = 0;
        this.highScore = localStorage.getItem('shakeHighScore') || 0;
        this.timeLeft = 30;
        this.gameRunning = false;
        this.lastX = 0;
        this.lastY = 0;
        this.lastZ = 0;
        this.shakeThreshold = 15;
        this.lastShakeTime = 0;
        this.shakeDebounce = 100; // ms

        this.initializeGame();
        this.createSnowflakes();
    }

    createSnowflakes() {
        const snowContainer = document.getElementById('snowContainer');
        const snowflakeCount = 50;

        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.classList.add('snowflake');
            snowflake.innerHTML = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
            snowflake.style.opacity = Math.random();
            snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
            snowflake.style.animationDelay = Math.random() * 5 + 's';
            snowContainer.appendChild(snowflake);
        }
    }

    initializeGame() {
        document.getElementById('highScoreValue').textContent = this.highScore;
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareScore());

        // Check if device supports motion events
        if (window.DeviceMotionEvent) {
            this.requestMotionPermission();
        } else {
            alert('Your device does not support motion detection.');
        }
    }

    async requestMotionPermission() {
        // iOS 13+ requires permission
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    this.initializeMotionTracking();
                }
            } catch (error) {
                console.error('Motion permission error:', error);
            }
        } else {
            this.initializeMotionTracking();
        }
    }

    initializeMotionTracking() {
        window.addEventListener('devicemotion', (event) => {
            if (!this.gameRunning) return;

            const acceleration = event.accelerationIncludingGravity;
            if (!acceleration) return;

            const x = acceleration.x || 0;
            const y = acceleration.y || 0;
            const z = acceleration.z || 0;

            const deltaX = Math.abs(x - this.lastX);
            const deltaY = Math.abs(y - this.lastY);
            const deltaZ = Math.abs(z - this.lastZ);

            const shakeIntensity = deltaX + deltaY + deltaZ;

            // Update meter
            const meterPercent = Math.min(100, (shakeIntensity / this.shakeThreshold) * 100);
            document.getElementById('meterFill').style.width = meterPercent + '%';

            // Detect shake
            const now = Date.now();
            if (shakeIntensity > this.shakeThreshold && now - this.lastShakeTime > this.shakeDebounce) {
                this.onShake();
                this.lastShakeTime = now;
            }

            this.lastX = x;
            this.lastY = y;
            this.lastZ = z;
        }, false);
    }

    startGame() {
        // Request permission on iOS if not already granted
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        this.beginGame();
                    } else {
                        alert('Motion permission is required to play this game.');
                    }
                })
                .catch(console.error);
        } else {
            this.beginGame();
        }
    }

    beginGame() {
        this.gameRunning = true;
        this.shakeCount = 0;
        this.timeLeft = 30;
        document.getElementById('gameStatus').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';

        this.updateDisplay();
        this.startTimer();
    }

    onShake() {
        if (!this.gameRunning) return;

        this.shakeCount++;
        this.updateDisplay();

        // Add shake animation to santa
        const santa = document.getElementById('santa');
        santa.classList.add('shaking');
        santa.style.left = (Math.random() * 80) + '%';

        setTimeout(() => {
            santa.classList.remove('shaking');
        }, 200);

        // Create shake effect
        this.createShakeEffect();
    }

    createShakeEffect() {
        const effects = ['❄️', '⭐', '✨', '💫'];
        const effect = document.createElement('div');
        effect.textContent = effects[Math.floor(Math.random() * effects.length)];
        effect.style.position = 'absolute';
        effect.style.fontSize = '2rem';
        effect.style.left = Math.random() * 100 + '%';
        effect.style.top = Math.random() * 100 + '%';
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'fadeOut 1s ease-out forwards';

        document.querySelector('.game-area').appendChild(effect);

        setTimeout(() => effect.remove(), 1000);
    }

    startTimer() {
        const timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timerValue').textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                clearInterval(timer);
                this.endGame();
            }
        }, 1000);
    }

    updateDisplay() {
        document.getElementById('shakeCount').textContent = this.shakeCount;
    }

    endGame() {
        this.gameRunning = false;

        // Update high score
        if (this.shakeCount > this.highScore) {
            this.highScore = this.shakeCount;
            localStorage.setItem('shakeHighScore', this.highScore);
            document.getElementById('highScoreValue').textContent = this.highScore;
        }

        // Show results
        document.getElementById('finalShakes').textContent = this.shakeCount;

        // Determine rank
        let rank = '';
        if (this.shakeCount >= 200) rank = '🏆 SHAKE MASTER! 🏆';
        else if (this.shakeCount >= 150) rank = '🥇 Amazing Shaker!';
        else if (this.shakeCount >= 100) rank = '🥈 Great Job!';
        else if (this.shakeCount >= 50) rank = '🥉 Nice Try!';
        else rank = 'Keep Practicing!';

        document.getElementById('rank').textContent = rank;
        document.getElementById('gameOver').style.display = 'block';

        // Update leaderboard
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const leaderboardData = JSON.parse(localStorage.getItem('shakeLeaderboard') || '[]');
        leaderboardData.push({
            name: 'You',
            score: this.shakeCount,
            timestamp: Date.now()
        });

        // Sort and keep top 10
        leaderboardData.sort((a, b) => b.score - a.score);
        const topScores = leaderboardData.slice(0, 10);
        localStorage.setItem('shakeLeaderboard', JSON.stringify(topScores));

        // Display leaderboard
        const leaderboardEl = document.getElementById('leaderboard');
        leaderboardEl.innerHTML = topScores.map((entry, index) => {
            const badges = ['🥇', '🥈', '🥉'];
            const badge = badges[index] || `${index + 1}`;
            return `
                <div class="leader-item">
                    <span class="rank-badge">${badge}</span>
                    <span class="leader-name">${entry.name}</span>
                    <span class="leader-score">${entry.score}</span>
                </div>
            `;
        }).join('');
    }

    restartGame() {
        this.startGame();
    }

    shareScore() {
        const text = `I just shook my phone ${this.shakeCount} times in the Christmas Shake Challenge! 🎄📳 Can you beat my score?`;

        if (navigator.share) {
            navigator.share({
                title: 'Shake Challenge Score',
                text: text,
                url: window.location.href
            }).catch(err => console.log('Error sharing:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert('Score copied to clipboard!');
            });
        }
    }
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        to {
            opacity: 0;
            transform: translateY(-50px) scale(2);
        }
    }
`;
document.head.appendChild(style);

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new ShakeChallengeGame();
});
