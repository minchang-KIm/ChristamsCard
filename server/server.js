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

// 게임 허브 페이지
app.get('/games.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'games.html'));
});

// 개별 게임 페이지들
app.get('/games/:gameName', (req, res) => {
  const gameName = req.params.gameName;
  res.sendFile(path.join(__dirname, '..', 'games', gameName, 'index.html'));
});

// 멀티플레이어 게임 룸 관리
const gameRooms = new Map();

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

  // === 보드 게임 이벤트 핸들러 ===

  // 방 생성
  socket.on('createRoom', (data) => {
    const { roomId, game } = data;
    gameRooms.set(roomId, {
      game: game,
      players: [socket.id],
      sockets: [socket],
      state: 'waiting',
      gameData: {}
    });
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    console.log(`🎲 Room created: ${roomId} for ${game}`);
  });

  // 방 참가
  socket.on('joinRoom', (data) => {
    const { roomId, game } = data;
    const room = gameRooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    room.players.push(socket.id);
    room.sockets.push(socket);
    room.state = 'playing';
    socket.join(roomId);

    socket.emit('roomJoined', { roomId });
    io.to(roomId).emit('gameStart');
    console.log(`🎲 Player joined room: ${roomId}`);
  });

  // 게임 이동 (오목, 체스, 바둑 등)
  socket.on('makeMove', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('moveMade', data);
  });

  // 게임 승리
  socket.on('gameWon', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('gameWon', data);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('👋 Player disconnected:', socket.id);
    gameManager.handleDisconnect(socket.id);

    // 게임 룸에서 플레이어 제거
    gameRooms.forEach((room, roomId) => {
      const index = room.players.indexOf(socket.id);
      if (index > -1) {
        room.players.splice(index, 1);
        room.sockets.splice(index, 1);
        if (room.players.length === 0) {
          gameRooms.delete(roomId);
          console.log(`🗑️ Room deleted: ${roomId}`);
        } else {
          io.to(roomId).emit('playerLeft');
        }
      }
    });
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
