const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager();

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '..')));

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 게임 페이지
app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'game', 'index.html'));
});

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log('🎮 New player connected:', socket.id);

  // 매칭 요청
  socket.on('find_match', () => {
    console.log('🔍 Player looking for match:', socket.id);
    const result = gameManager.addPlayerToQueue(socket.id, socket);

    if (result.started) {
      console.log('✅ Game started:', result.gameId);
    } else if (result.waiting) {
      socket.emit('waiting_for_opponent');
      console.log('⏳ Player waiting for opponent:', socket.id);
    }
  });

  // 유닛 생성 요청
  socket.on('create_unit', (data) => {
    const { similarity, drawingData } = data;
    const game = gameManager.getPlayerGame(socket.id);

    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const result = gameManager.createUnit(
      game.id,
      socket.id,
      similarity,
      drawingData
    );

    if (result.success) {
      // 양쪽 플레이어에게 유닛 생성 알림
      Object.values(game.players).forEach(player => {
        player.socket.emit('unit_created', {
          unit: result.unit,
          playerId: socket.id,
          newPrompt: player.id === socket.id ? result.newPrompt : null
        });
      });

      console.log(`⚔️ Unit created in game ${game.id}:`, result.unit.name,
                  `(similarity: ${(similarity * 100).toFixed(1)}%)`);
    } else {
      socket.emit('error', { message: result.reason });
    }
  });

  // 게임 상태 요청
  socket.on('get_game_state', () => {
    const game = gameManager.getPlayerGame(socket.id);
    if (game) {
      socket.emit('game_state', {
        players: Object.keys(game.players).reduce((acc, playerId) => {
          const player = game.players[playerId];
          acc[playerId] = {
            health: player.currentHealth,
            maxHealth: player.baseHealth,
            unitCount: player.units.length,
            side: player.side
          };
          return acc;
        }, {}),
        prompt: game.currentPrompt
      });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('👋 Player disconnected:', socket.id);
    gameManager.handleDisconnect(socket.id);
  });
});

// 게임 루프 - 초당 30틱
setInterval(() => {
  gameManager.activeGames.forEach((game, gameId) => {
    if (game.state === 'playing') {
      const battleResult = gameManager.processBattle(gameId);

      if (battleResult) {
        // 양쪽 플레이어에게 전투 업데이트 전송
        Object.values(game.players).forEach(player => {
          player.socket.emit('battle_update', {
            updates: battleResult.updates,
            gameState: battleResult.gameState,
            winner: battleResult.winner
          });
        });

        // 게임 종료 처리
        if (battleResult.winner) {
          console.log(`🏆 Game ${gameId} finished! Winner:`, battleResult.winner);

          Object.values(game.players).forEach(player => {
            player.socket.emit('game_over', {
              winner: battleResult.winner,
              isWinner: player.id === battleResult.winner
            });
          });
        }
      }
    }
  });
}, 1000 / 30); // 30 FPS

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🎄 Christmas AI Drawing Battle Game Server 🎄        ║
║                                                        ║
║  Server running on port ${PORT}                           ║
║  Game page: http://localhost:${PORT}/game                ║
║                                                        ║
║  Ready for players! 🎮                                 ║
╚════════════════════════════════════════════════════════╝
  `);
});
