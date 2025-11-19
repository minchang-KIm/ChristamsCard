class AngrySnowballsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.level = 1;
        this.score = 0;
        this.targets = [];
        this.snowball = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.slingshotPos = { x: 150, y: 450 };

        this.initPhysics();
        this.setupLevel();
        this.setupControls();
        this.gameLoop();
    }

    initPhysics() {
        const { Engine, World, Bodies, Events } = Matter;
        this.engine = Engine.create();
        this.world = this.engine.world;
        this.world.gravity.y = 1;

        // Ground
        const ground = Bodies.rectangle(400, 590, 810, 20, { isStatic: true });
        World.add(this.world, ground);
    }

    setupLevel() {
        this.targets = [];
        const startX = 500;
        const startY = 450;

        // Create target structure
        for (let row = 0; row < this.level + 2; row++) {
            for (let col = 0; col < 3; col++) {
                const x = startX + col * 70;
                const y = startY - row * 60;
                const box = Matter.Bodies.rectangle(x, y, 50, 50, {
                    restitution: 0.5,
                    density: 0.001
                });
                this.targets.push({ body: box, emoji: ['🎁', '🎄', '⛄'][Math.floor(Math.random() * 3)] });
                Matter.World.add(this.world, box);
            }
        }
    }

    setupControls() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', (e) => this.endDrag(e));
    }

    startDrag(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dx = x - this.slingshotPos.x;
        const dy = y - this.slingshotPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 50 && !this.snowball) {
            this.isDragging = true;
            this.dragStart = { x, y };
        }
    }

    drag(e) {
        if (!this.isDragging) return;
        const rect = this.canvas.getBoundingClientRect();
        this.dragStart.x = e.clientX - rect.left;
        this.dragStart.y = e.clientY - rect.top;
    }

    endDrag(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        const dx = this.slingshotPos.x - this.dragStart.x;
        const dy = this.slingshotPos.y - this.dragStart.y;
        const force = Math.min(Math.sqrt(dx * dx + dy * dy) / 50, 1);

        this.snowball = Matter.Bodies.circle(this.slingshotPos.x, this.slingshotPos.y, 20, {
            restitution: 0.8,
            density: 0.04
        });
        Matter.World.add(this.world, this.snowball);
        Matter.Body.applyForce(this.snowball, this.snowball.position, {
            x: dx * 0.003 * force,
            y: dy * 0.003 * force
        });

        setTimeout(() => this.checkWin(), 3000);
    }

    checkWin() {
        let remainingTargets = 0;
        for (let i = this.targets.length - 1; i >= 0; i--) {
            if (this.targets[i].body.position.y > 590) {
                Matter.World.remove(this.world, this.targets[i].body);
                this.targets.splice(i, 1);
                this.score += 100;
            } else {
                remainingTargets++;
            }
        }

        if (this.snowball) {
            Matter.World.remove(this.world, this.snowball);
            this.snowball = null;
        }

        document.getElementById('score').textContent = this.score;

        if (remainingTargets === 0) {
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOver').style.display = 'block';
        }
    }

    nextLevel() {
        this.level++;
        document.getElementById('level').textContent = this.level;
        document.getElementById('gameOver').style.display = 'none';
        this.setupLevel();
    }

    gameLoop() {
        Matter.Engine.update(this.engine);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw slingshot
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(this.slingshotPos.x - 30, this.slingshotPos.y);
        this.ctx.lineTo(this.slingshotPos.x - 30, this.slingshotPos.y + 100);
        this.ctx.moveTo(this.slingshotPos.x + 30, this.slingshotPos.y);
        this.ctx.lineTo(this.slingshotPos.x + 30, this.slingshotPos.y + 100);
        this.ctx.stroke();

        if (this.isDragging) {
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.slingshotPos.x - 30, this.slingshotPos.y);
            this.ctx.lineTo(this.dragStart.x, this.dragStart.y);
            this.ctx.lineTo(this.slingshotPos.x + 30, this.slingshotPos.y);
            this.ctx.stroke();

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(this.dragStart.x, this.dragStart.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.stroke();
        }

        // Draw targets
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (const target of this.targets) {
            this.ctx.fillText(target.emoji, target.body.position.x, target.body.position.y);
        }

        // Draw snowball
        if (this.snowball) {
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(this.snowball.position.x, this.snowball.position.y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.stroke();
        }

        // Draw ground
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, 580, 800, 20);

        requestAnimationFrame(() => this.gameLoop());
    }
}

let game;
window.addEventListener('load', () => {
    game = new AngrySnowballsGame();
});
