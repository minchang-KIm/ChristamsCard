const { v4: uuidv4 } = require('uuid');
const storyBook = require('./storyBook');

class TRPGManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
    this.playerRooms = new Map(); // socketId -> roomCode
  }

  // 방 코드 생성 (6자리)
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  // 방 생성
  createRoom(hostSocketId, hostSocket, hostName) {
    const roomCode = this.generateRoomCode();
    const room = {
      code: roomCode,
      host: hostSocketId,
      players: new Map(),
      state: 'lobby', // lobby, playing, finished
      currentScene: 'intro',
      sceneHistory: [],
      storyBook: storyBook,
      createdAt: Date.now(),
      startedAt: null,
      diceRolls: [],
      charismaChecks: [],
      items: [] // 획득한 아이템들
    };

    // 호스트를 첫 플레이어로 추가
    const hostPlayer = this.createPlayer(hostSocketId, hostSocket, hostName, true);
    room.players.set(hostSocketId, hostPlayer);

    this.rooms.set(roomCode, room);
    this.playerRooms.set(hostSocketId, roomCode);

    console.log(`🎮 TRPG Room created: ${roomCode} by ${hostName}`);

    return {
      success: true,
      roomCode,
      room: this.getRoomData(roomCode)
    };
  }

  // 플레이어 생성
  createPlayer(socketId, socket, name, isHost = false) {
    return {
      id: socketId,
      socket: socket,
      name: name,
      isHost: isHost,
      character: null, // 나중에 설정
      stats: {
        strength: 5,
        agility: 5,
        wisdom: 5,
        charisma: 5,
        health: 10
      },
      currentHealth: 10,
      items: [],
      ready: false
    };
  }

  // 방 참가
  joinRoom(roomCode, socketId, socket, playerName) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: '존재하지 않는 방입니다.' };
    }

    if (room.state !== 'lobby') {
      return { success: false, error: '이미 게임이 시작되었습니다.' };
    }

    if (room.players.size >= 6) {
      return { success: false, error: '방이 가득 찼습니다. (최대 6명)' };
    }

    const player = this.createPlayer(socketId, socket, playerName, false);
    room.players.set(socketId, player);
    this.playerRooms.set(socketId, roomCode);

    console.log(`👤 ${playerName} joined room ${roomCode}`);

    // 모든 플레이어에게 업데이트 알림
    this.broadcastToRoom(roomCode, 'player_joined', {
      player: this.getPlayerData(player),
      room: this.getRoomData(roomCode)
    });

    return {
      success: true,
      room: this.getRoomData(roomCode)
    };
  }

  // 캐릭터 선택
  selectCharacter(socketId, characterClass) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return { success: false, error: '방을 찾을 수 없습니다.' };

    const room = this.rooms.get(roomCode);
    const player = room.players.get(socketId);

    if (!player) return { success: false, error: '플레이어를 찾을 수 없습니다.' };

    const classData = storyBook.characterClasses.find(c => c.id === characterClass);
    if (!classData) return { success: false, error: '잘못된 직업입니다.' };

    // 캐릭터 설정
    player.character = classData;

    // 보너스 스탯 적용
    Object.entries(classData.bonuses).forEach(([stat, bonus]) => {
      if (stat === 'health') {
        player.stats.health += bonus;
        player.currentHealth += bonus;
      } else {
        player.stats[stat] = (player.stats[stat] || 5) + bonus;
      }
    });

    player.ready = true;

    console.log(`🎭 ${player.name} selected ${classData.name}`);

    this.broadcastToRoom(roomCode, 'character_selected', {
      playerId: socketId,
      character: classData,
      room: this.getRoomData(roomCode)
    });

    return { success: true };
  }

  // 게임 시작
  startGame(roomCode, hostSocketId) {
    const room = this.rooms.get(roomCode);

    if (!room) return { success: false, error: '방을 찾을 수 없습니다.' };
    if (room.host !== hostSocketId) return { success: false, error: '호스트만 시작할 수 있습니다.' };

    // 모든 플레이어가 준비되었는지 확인
    const allReady = Array.from(room.players.values()).every(p => p.ready);
    if (!allReady) {
      return { success: false, error: '모든 플레이어가 캐릭터를 선택해야 합니다.' };
    }

    room.state = 'playing';
    room.startedAt = Date.now();
    room.currentScene = 'intro';

    const scene = this.getCurrentScene(roomCode);

    console.log(`🎬 Game started in room ${roomCode}`);

    this.broadcastToRoom(roomCode, 'game_started', {
      scene: scene,
      room: this.getRoomData(roomCode)
    });

    return { success: true };
  }

  // 현재 씬 가져오기
  getCurrentScene(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    return storyBook.scenes.find(s => s.id === room.currentScene);
  }

  // 선택지 선택
  makeChoice(roomCode, socketId, choiceId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: '방을 찾을 수 없습니다.' };

    const currentScene = this.getCurrentScene(roomCode);
    if (!currentScene) return { success: false, error: '씬을 찾을 수 없습니다.' };

    const choice = currentScene.choices.find(c => c.id === choiceId);
    if (!choice) return { success: false, error: '잘못된 선택입니다.' };

    // 요구사항 체크
    if (choice.requirement) {
      const req = choice.requirement;

      if (req.type === 'dice') {
        // 주사위 굴리기 필요
        return {
          success: true,
          requirementType: 'dice',
          requirement: req,
          choiceId: choiceId,
          nextScene: choice.next
        };
      } else if (req.type === 'charisma') {
        // 카리스마 체크 필요
        return {
          success: true,
          requirementType: 'charisma',
          requirement: req,
          choiceId: choiceId,
          nextScene: choice.next
        };
      } else if (req.type === 'group_dice') {
        // 그룹 주사위 굴리기
        return {
          success: true,
          requirementType: 'group_dice',
          requirement: req,
          choiceId: choiceId,
          nextScene: choice.next
        };
      }
    }

    // 요구사항 없으면 바로 다음 씬으로
    return this.moveToScene(roomCode, choice.next);
  }

  // 씬 이동
  moveToScene(roomCode, sceneId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: '방을 찾을 수 없습니다.' };

    room.sceneHistory.push(room.currentScene);
    room.currentScene = sceneId;

    const scene = this.getCurrentScene(roomCode);

    if (!scene) {
      // 게임 종료
      room.state = 'finished';
      this.broadcastToRoom(roomCode, 'game_finished', {
        room: this.getRoomData(roomCode)
      });
      return { success: true, finished: true };
    }

    console.log(`📖 Room ${roomCode} moved to scene: ${sceneId}`);

    this.broadcastToRoom(roomCode, 'scene_changed', {
      scene: scene,
      room: this.getRoomData(roomCode)
    });

    return {
      success: true,
      scene: scene
    };
  }

  // 주사위 굴리기
  rollDice(roomCode, socketId, diceType = 20) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: '방을 찾을 수 없습니다.' };

    const player = room.players.get(socketId);
    if (!player) return { success: false, error: '플레이어를 찾을 수 없습니다.' };

    const result = Math.floor(Math.random() * diceType) + 1;

    const rollData = {
      playerId: socketId,
      playerName: player.name,
      diceType: diceType,
      result: result,
      timestamp: Date.now()
    };

    room.diceRolls.push(rollData);

    console.log(`🎲 ${player.name} rolled d${diceType}: ${result}`);

    this.broadcastToRoom(roomCode, 'dice_rolled', rollData);

    return {
      success: true,
      result: result,
      rollData: rollData
    };
  }

  // 주사위 체크 완료
  completeDiceCheck(roomCode, success, nextScene) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    return this.moveToScene(roomCode, nextScene);
  }

  // 카리스마 체크 시작
  startCharismaCheck(roomCode, socketId, description) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    const player = room.players.get(socketId);
    if (!player) return { success: false };

    const checkId = uuidv4();

    const charismaCheck = {
      id: checkId,
      playerId: socketId,
      playerName: player.name,
      description: description,
      votes: new Map(), // voterId -> score
      status: 'voting', // voting, completed
      startedAt: Date.now()
    };

    room.charismaChecks.push(charismaCheck);

    console.log(`✨ Charisma check started for ${player.name}`);

    this.broadcastToRoom(roomCode, 'charisma_check_started', {
      checkId: checkId,
      playerId: socketId,
      playerName: player.name,
      description: description
    });

    return {
      success: true,
      checkId: checkId
    };
  }

  // 카리스마 투표
  voteCharisma(roomCode, checkId, voterSocketId, score) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    const check = room.charismaChecks.find(c => c.id === checkId);
    if (!check || check.status !== 'voting') return { success: false };

    const voter = room.players.get(voterSocketId);
    if (!voter) return { success: false };

    check.votes.set(voterSocketId, score);

    console.log(`⭐ ${voter.name} voted ${score} for charisma check`);

    this.broadcastToRoom(roomCode, 'charisma_vote_received', {
      checkId: checkId,
      voterName: voter.name,
      totalVotes: check.votes.size,
      requiredVotes: room.players.size - 1 // 본인 제외
    });

    return { success: true };
  }

  // 카리스마 체크 완료
  completeCharismaCheck(roomCode, checkId, nextScene) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    const check = room.charismaChecks.find(c => c.id === checkId);
    if (!check) return { success: false };

    check.status = 'completed';

    // 평균 점수 계산
    const votes = Array.from(check.votes.values());
    const avgScore = votes.length > 0
      ? votes.reduce((a, b) => a + b, 0) / votes.length
      : 0;

    const success = avgScore >= 3; // 5점 만점에 3점 이상이면 성공

    console.log(`✅ Charisma check completed: ${avgScore.toFixed(1)}/5 - ${success ? 'SUCCESS' : 'FAIL'}`);

    this.broadcastToRoom(roomCode, 'charisma_check_completed', {
      checkId: checkId,
      avgScore: avgScore,
      success: success
    });

    // 다음 씬으로 이동
    return this.moveToScene(roomCode, nextScene);
  }

  // 방 데이터 (클라이언트 전송용)
  getRoomData(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    return {
      code: room.code,
      host: room.host,
      players: Array.from(room.players.values()).map(p => this.getPlayerData(p)),
      state: room.state,
      currentScene: room.currentScene,
      playerCount: room.players.size,
      createdAt: room.createdAt,
      startedAt: room.startedAt
    };
  }

  // 플레이어 데이터 (클라이언트 전송용)
  getPlayerData(player) {
    return {
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      character: player.character,
      stats: player.stats,
      currentHealth: player.currentHealth,
      items: player.items,
      ready: player.ready
    };
  }

  // 방의 모든 플레이어에게 브로드캐스트
  broadcastToRoom(roomCode, event, data) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players.forEach(player => {
      player.socket.emit(event, data);
    });
  }

  // 플레이어 연결 해제
  handleDisconnect(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(socketId);
    if (!player) return;

    console.log(`👋 ${player.name} left room ${roomCode}`);

    room.players.delete(socketId);
    this.playerRooms.delete(socketId);

    // 방에 플레이어가 없으면 방 삭제
    if (room.players.size === 0) {
      this.rooms.delete(roomCode);
      console.log(`🗑️ Room ${roomCode} deleted (empty)`);
      return;
    }

    // 호스트가 나갔으면 다른 사람을 호스트로
    if (room.host === socketId) {
      const newHost = Array.from(room.players.values())[0];
      room.host = newHost.id;
      newHost.isHost = true;
      console.log(`👑 ${newHost.name} is now the host of room ${roomCode}`);
    }

    // 나머지 플레이어들에게 알림
    this.broadcastToRoom(roomCode, 'player_left', {
      playerId: socketId,
      playerName: player.name,
      room: this.getRoomData(roomCode)
    });
  }

  // 채팅 메시지
  sendChatMessage(roomCode, socketId, message) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false };

    const player = room.players.get(socketId);
    if (!player) return { success: false };

    const chatData = {
      playerId: socketId,
      playerName: player.name,
      message: message,
      timestamp: Date.now()
    };

    this.broadcastToRoom(roomCode, 'chat_message', chatData);

    return { success: true };
  }
}

module.exports = TRPGManager;
