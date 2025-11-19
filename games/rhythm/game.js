class RhythmGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = { perfect: 0, good: 0, miss: 0 };

        this.notes = [];
        this.noteSpeed = 3;
        this.laneWidth = 100;
        this.laneGap = 20;
        this.hitZoneY = 0;

        this.keys = ['d', 'f', 'j', 'k'];
        this.laneColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731'];

        this.gameRunning = false;
        this.gameStartTime = 0;
        this.currentSong = null;

        this.initializeGame();
    }

    initializeGame() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Song selection
        document.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('click', () => {
                const songId = card.dataset.song;
                this.selectSong(songId);
            });
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            this.backToMenu();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Touch controls for mobile
        document.querySelectorAll('.hit-zone').forEach((zone, index) => {
            zone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleLaneHit(index);
            });
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.hitZoneY = this.canvas.height - 200;
    }

    selectSong(songId) {
        this.currentSong = this.getSongData(songId);
        document.getElementById('songSelect').style.display = 'none';
        this.startGame();
    }

    getSongData(songId) {
        const songs = {
            'jingle-bells': {
                name: 'Jingle Bells',
                bpm: 120,
                notes: this.generateNotes('jingle-bells', 'easy')
            },
            'silent-night': {
                name: 'Silent Night',
                bpm: 100,
                notes: this.generateNotes('silent-night', 'medium')
            },
            'deck-the-halls': {
                name: 'Deck the Halls',
                bpm: 140,
                notes: this.generateNotes('deck-the-halls', 'hard')
            }
        };
        return songs[songId];
    }

    generateNotes(songId, difficulty) {
        const notes = [];
        const duration = 60; // 60 seconds
        const baseInterval = difficulty === 'easy' ? 800 : difficulty === 'medium' ? 600 : 400;

        // Jingle Bells pattern
        if (songId === 'jingle-bells') {
            const pattern = [0, 0, 0, 1, 2, 2, 2, 3, 0, 1, 2, 3];
            let time = 2000;
            for (let i = 0; i < 50; i++) {
                const lane = pattern[i % pattern.length];
                notes.push({ lane, time });
                time += baseInterval + Math.random() * 200;
            }
        }
        // Silent Night pattern
        else if (songId === 'silent-night') {
            let time = 2000;
            for (let i = 0; i < 60; i++) {
                const lane = Math.floor(Math.random() * 4);
                notes.push({ lane, time });
                time += baseInterval + Math.random() * 300;
            }
        }
        // Deck the Halls pattern (harder)
        else if (songId === 'deck-the-halls') {
            let time = 2000;
            for (let i = 0; i < 80; i++) {
                const lane = Math.floor(Math.random() * 4);
                notes.push({ lane, time });
                if (Math.random() < 0.3) {
                    notes.push({ lane: (lane + 1) % 4, time: time + 100 });
                }
                time += baseInterval;
            }
        }

        return notes.sort((a, b) => a.time - b.time);
    }

    startGame() {
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = { perfect: 0, good: 0, miss: 0 };

        this.notes = this.currentSong.notes.map(n => ({
            lane: n.lane,
            spawnTime: n.time,
            y: -50,
            hit: false,
            missed: false
        }));

        this.updateDisplay();
        this.gameLoop();
    }

    handleKeyDown(e) {
        if (!this.gameRunning) return;

        const key = e.key.toLowerCase();
        const laneIndex = this.keys.indexOf(key);

        if (laneIndex !== -1) {
            this.handleLaneHit(laneIndex);
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        const laneIndex = this.keys.indexOf(key);

        if (laneIndex !== -1) {
            const zone = document.querySelector(`.hit-zone[data-lane="${laneIndex}"]`);
            zone.classList.remove('active');
        }
    }

    handleLaneHit(laneIndex) {
        if (!this.gameRunning) return;

        const zone = document.querySelector(`.hit-zone[data-lane="${laneIndex}"]`);
        zone.classList.add('active');

        // Find closest note in this lane
        const notesInLane = this.notes.filter(n => n.lane === laneIndex && !n.hit && !n.missed);

        if (notesInLane.length === 0) return;

        const closestNote = notesInLane.reduce((prev, curr) => {
            const prevDist = Math.abs(prev.y - this.hitZoneY);
            const currDist = Math.abs(curr.y - this.hitZoneY);
            return currDist < prevDist ? curr : prev;
        });

        const distance = Math.abs(closestNote.y - this.hitZoneY);

        if (distance < 50) {
            this.registerHit('perfect', closestNote, laneIndex);
        } else if (distance < 100) {
            this.registerHit('good', closestNote, laneIndex);
        }

        setTimeout(() => zone.classList.remove('active'), 100);
    }

    registerHit(judgment, note, laneIndex) {
        note.hit = true;

        if (judgment === 'perfect') {
            this.score += 100;
            this.combo++;
            this.hits.perfect++;
        } else if (judgment === 'good') {
            this.score += 50;
            this.combo++;
            this.hits.good++;
        }

        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.updateDisplay();
        this.showJudgment(judgment);
        this.showHitEffect(laneIndex);
    }

    showJudgment(judgment) {
        const judgmentEl = document.getElementById('judgment');
        judgmentEl.textContent = judgment.toUpperCase();
        judgmentEl.className = `judgment-display show ${judgment}`;

        setTimeout(() => {
            judgmentEl.classList.remove('show');
        }, 500);
    }

    showHitEffect(laneIndex) {
        const effect = document.getElementById(`effect${laneIndex}`);
        effect.classList.add('show');
        setTimeout(() => effect.classList.remove('show'), 300);
    }

    gameLoop() {
        if (!this.gameRunning) return;

        const currentTime = Date.now() - this.gameStartTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw lanes
        this.drawLanes();

        // Update and draw notes
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];

            if (note.hit) continue;

            // Spawn note if it's time
            if (currentTime >= note.spawnTime && note.y === -50) {
                note.y = 0;
            }

            // Move note down
            if (note.y >= 0) {
                note.y += this.noteSpeed;
            }

            // Check if missed
            if (note.y > this.hitZoneY + 150 && !note.missed) {
                note.missed = true;
                this.combo = 0;
                this.hits.miss++;
                this.updateDisplay();
            }

            // Draw note
            if (note.y >= 0 && !note.hit && !note.missed) {
                this.drawNote(note);
            }

            // Remove off-screen notes
            if (note.y > this.canvas.height || note.hit) {
                this.notes.splice(i, 1);
            }
        }

        // Check if game is over
        if (this.notes.length === 0 && currentTime > this.currentSong.notes[this.currentSong.notes.length - 1].time + 5000) {
            this.endGame();
            return;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    drawLanes() {
        const startX = (this.canvas.width - (this.laneWidth * 4 + this.laneGap * 3)) / 2;

        for (let i = 0; i < 4; i++) {
            const x = startX + (this.laneWidth + this.laneGap) * i;

            // Lane background
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.fillRect(x, 0, this.laneWidth, this.canvas.height);

            // Lane border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, 0, this.laneWidth, this.canvas.height);

            // Hit zone indicator
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(x, this.hitZoneY - 50, this.laneWidth, 100);
        }
    }

    drawNote(note) {
        const startX = (this.canvas.width - (this.laneWidth * 4 + this.laneGap * 3)) / 2;
        const x = startX + (this.laneWidth + this.laneGap) * note.lane;

        // Note glow
        const gradient = this.ctx.createRadialGradient(
            x + this.laneWidth / 2, note.y + 25, 0,
            x + this.laneWidth / 2, note.y + 25, 50
        );
        gradient.addColorStop(0, this.laneColors[note.lane] + '80');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - 10, note.y - 10, this.laneWidth + 20, 70);

        // Note body
        this.ctx.fillStyle = this.laneColors[note.lane];
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 10, note.y, this.laneWidth - 20, 50, 10);
        this.ctx.fill();
        this.ctx.stroke();

        // Note icon
        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const icons = ['🎁', '⭐', '🎄', '❄️'];
        this.ctx.fillText(icons[note.lane], x + this.laneWidth / 2, note.y + 25);
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.combo;

        const totalHits = this.hits.perfect + this.hits.good + this.hits.miss;
        const accuracy = totalHits > 0 ? ((this.hits.perfect * 100 + this.hits.good * 50) / (totalHits * 100) * 100).toFixed(1) : 100;
        document.getElementById('accuracy').textContent = accuracy;
    }

    endGame() {
        this.gameRunning = false;

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        document.getElementById('perfectCount').textContent = this.hits.perfect;
        document.getElementById('goodCount').textContent = this.hits.good;
        document.getElementById('missCount').textContent = this.hits.miss;

        const totalHits = this.hits.perfect + this.hits.good + this.hits.miss;
        const accuracy = totalHits > 0 ? ((this.hits.perfect * 100 + this.hits.good * 50) / (totalHits * 100) * 100).toFixed(1) : 100;
        document.getElementById('finalAccuracy').textContent = accuracy + '%';

        // Calculate rank
        let rank = 'D';
        if (accuracy >= 95) rank = 'S';
        else if (accuracy >= 90) rank = 'A';
        else if (accuracy >= 80) rank = 'B';
        else if (accuracy >= 70) rank = 'C';

        document.getElementById('rankDisplay').textContent = rank;
        document.getElementById('gameOver').style.display = 'block';
    }

    backToMenu() {
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('songSelect').style.display = 'block';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new RhythmGame();
});
