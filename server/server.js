const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameManager = require('./gameManager');
const TRPGManager = require('./trpgManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager();
const trpgManager = new TRPGManager();

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

// TRPG 페이지
app.get('/trpg', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'trpg', 'index.html'));
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

  // ===== TRPG 이벤트 =====

  // TRPG 방 생성
  socket.on('create_trpg_room', (data) => {
    const result = trpgManager.createRoom(socket.id, socket, data.playerName);
    if (result.success) {
      socket.emit('room_created', result);
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // TRPG 방 참가
  socket.on('join_trpg_room', (data) => {
    const result = trpgManager.joinRoom(data.roomCode, socket.id, socket, data.playerName);
    if (result.success) {
      socket.emit('room_joined', result);
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // 캐릭터 선택
  socket.on('select_character', (data) => {
    const result = trpgManager.selectCharacter(socket.id, data.characterClass);
    if (!result.success) {
      socket.emit('error', { message: result.error });
    }
  });

  // 게임 시작
  socket.on('start_trpg_game', (data) => {
    const result = trpgManager.startGame(data.roomCode, socket.id);
    if (!result.success) {
      socket.emit('error', { message: result.error });
    }
  });

  // 선택지 선택
  socket.on('make_choice', (data) => {
    const result = trpgManager.makeChoice(data.roomCode, socket.id, data.choiceId);
    if (result.success) {
      socket.emit('choice_result', result);
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // 주사위 굴리기
  socket.on('roll_dice', (data) => {
    const result = trpgManager.rollDice(data.roomCode, socket.id, data.diceType);
    if (result.success) {
      socket.emit('dice_roll_result', result);
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // 주사위 체크 완료
  socket.on('dice_check_complete', (data) => {
    trpgManager.completeDiceCheck(data.roomCode, data.success, data.nextScene);
  });

  // 카리스마 체크 시작
  socket.on('start_charisma_check', (data) => {
    const result = trpgManager.startCharismaCheck(data.roomCode, socket.id, data.description);
    if (result.success) {
      socket.emit('charisma_check_id', {
        checkId: result.checkId,
        isYou: true
      });

      // 다른 플레이어들에게 알림
      const roomCode = trpgManager.playerRooms.get(socket.id);
      const room = trpgManager.rooms.get(roomCode);
      if (room) {
        room.players.forEach((player, playerId) => {
          if (playerId !== socket.id) {
            player.socket.emit('charisma_check_id', {
              checkId: result.checkId,
              isYou: false,
              playerName: data.playerName || 'Player'
            });
          }
        });
      }
    }
  });

  // 카리스마 투표
  socket.on('vote_charisma', (data) => {
    const result = trpgManager.voteCharisma(data.roomCode, data.checkId, socket.id, data.score);
    if (result.success) {
      socket.emit('vote_complete');

      // 모든 투표가 완료되었는지 확인
      const room = trpgManager.rooms.get(data.roomCode);
      if (room) {
        const check = room.charismaChecks.find(c => c.id === data.checkId);
        if (check && check.votes.size >= room.players.size - 1) {
          // 모든 투표 완료, 결과 계산
          trpgManager.completeCharismaCheck(data.roomCode, data.checkId, data.nextScene || check.nextScene);
        }
      }
    }
  });

  // 채팅 메시지
  socket.on('send_chat', (data) => {
    trpgManager.sendChatMessage(data.roomCode, socket.id, data.message);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('👋 Player disconnected:', socket.id);
    gameManager.handleDisconnect(socket.id);
    trpgManager.handleDisconnect(socket.id);
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
║  🎄 Christmas Game Server 🎄                          ║
║                                                        ║
║  Server running on port ${PORT}                           ║
║  AI Drawing Battle: http://localhost:${PORT}/game        ║
║  TRPG Game: http://localhost:${PORT}/trpg                ║
║                                                        ║
║  Ready for players! 🎮                                 ║
╚════════════════════════════════════════════════════════╝
  `);
});
