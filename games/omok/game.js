class OmokGame {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = 40;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1 = black, 2 = white
        this.myPlayer = null;
        this.roomId = null;
        this.socket = io();

        this.setupSocket();
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.drawBoard();
    }

    setupSocket() {
        this.socket.on('roomCreated', (data) => {
            this.roomId = data.roomId;
            this.myPlayer = 1;
            document.getElementById('lobby').style.display = 'none';
            document.getElementById('status').textContent = `Room ${this.roomId} - Waiting for opponent...`;
        });

        this.socket.on('roomJoined', (data) => {
            this.roomId = data.roomId;
            this.myPlayer = 2;
            document.getElementById('lobby').style.display = 'none';
            document.getElementById('status').textContent = 'Your turn (White)!';
        });

        this.socket.on('gameStart', () => {
            document.getElementById('status').textContent = this.myPlayer === 1 ? 'Your turn (Black)!' : 'Opponent\'s turn...';
        });

        this.socket.on('moveMade', (data) => {
            this.board[data.row][data.col] = data.player;
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.drawBoard();
            this.updateStatus();
            this.checkWin(data.row, data.col);
        });

        this.socket.on('gameWon', (data) => {
            const isWinner = data.winner === this.myPlayer;
            document.getElementById('winnerText').textContent = isWinner ? '🎉 You Won! 🎉' : '😔 You Lost';
            document.getElementById('gameOver').style.display = 'block';
        });
    }

    createRoom() {
        const roomId = document.getElementById('roomId').value || Math.random().toString(36).substring(7);
        this.socket.emit('createRoom', { roomId, game: 'omok' });
    }

    joinRoom() {
        const roomId = document.getElementById('roomId').value;
        if (!roomId) {
            alert('Please enter a room ID');
            return;
        }
        this.socket.emit('joinRoom', { roomId, game: 'omok' });
    }

    drawBoard() {
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(20 + i * this.cellSize, 20);
            this.ctx.lineTo(20 + i * this.cellSize, 20 + (this.boardSize - 1) * this.cellSize);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(20, 20 + i * this.cellSize);
            this.ctx.lineTo(20 + (this.boardSize - 1) * this.cellSize, 20 + i * this.cellSize);
            this.ctx.stroke();
        }

        // Draw star points
        const starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
        this.ctx.fillStyle = '#000';
        for (const [row, col] of starPoints) {
            this.ctx.beginPath();
            this.ctx.arc(20 + col * this.cellSize, 20 + row * this.cellSize, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw stones
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    const x = 20 + col * this.cellSize;
                    const y = 20 + row * this.cellSize;

                    this.ctx.fillStyle = this.board[row][col] === 1 ? '#000' : '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 16, 0, Math.PI * 2);
                    this.ctx.fill();

                    this.ctx.strokeStyle = this.board[row][col] === 1 ? '#333' : '#ccc';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }
            }
        }
    }

    handleClick(e) {
        if (!this.roomId || this.currentPlayer !== this.myPlayer) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.round((x - 20) / this.cellSize);
        const row = Math.round((y - 20) / this.cellSize);

        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize && this.board[row][col] === 0) {
            this.socket.emit('makeMove', { roomId: this.roomId, row, col, player: this.myPlayer });
        }
    }

    updateStatus() {
        const myTurn = this.currentPlayer === this.myPlayer;
        document.getElementById('status').textContent = myTurn ? 'Your turn!' : 'Opponent\'s turn...';
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            let count = 1;

            for (let i = 1; i < 5; i++) {
                const r = row + dx * i;
                const c = col + dy * i;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                    count++;
                } else break;
            }

            for (let i = 1; i < 5; i++) {
                const r = row - dx * i;
                const c = col - dy * i;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && this.board[r][c] === player) {
                    count++;
                } else break;
            }

            if (count >= 5) {
                this.socket.emit('gameWon', { roomId: this.roomId, winner: player });
                return;
            }
        }
    }
}

let game;
window.addEventListener('load', () => {
    game = new OmokGame();
});
