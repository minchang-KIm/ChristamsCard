const { v4: uuidv4 } = require('uuid');

/**
 * GameManager - 게임 상태 관리 및 로직 처리
 */
class GameManager {
  constructor() {
    this.waitingPlayers = [];
    this.activeGames = new Map();
    this.playerToGame = new Map();
  }

  /**
   * 플레이어를 대기열에 추가하고 매칭 시도
   */
  addPlayerToQueue(playerId, socket) {
    // 이미 게임 중인지 확인
    if (this.playerToGame.has(playerId)) {
      return { success: false, reason: 'already_in_game' };
    }

    // 대기열에 추가
    this.waitingPlayers.push({ playerId, socket, joinedAt: Date.now() });

    // 매칭 시도
    if (this.waitingPlayers.length >= 2) {
      return this.createGame();
    }

    return { success: true, waiting: true };
  }

  /**
   * 게임 생성 및 시작
   */
  createGame() {
    const player1 = this.waitingPlayers.shift();
    const player2 = this.waitingPlayers.shift();

    const gameId = uuidv4();
    const game = {
      id: gameId,
      players: {
        [player1.playerId]: {
          id: player1.playerId,
          socket: player1.socket,
          baseHealth: 1000,
          currentHealth: 1000,
          units: [],
          side: 'left'
        },
        [player2.playerId]: {
          id: player2.playerId,
          socket: player2.socket,
          baseHealth: 1000,
          currentHealth: 1000,
          units: [],
          side: 'right'
        }
      },
      state: 'playing',
      createdAt: Date.now(),
      currentPrompt: this.getRandomPrompt()
    };

    this.activeGames.set(gameId, game);
    this.playerToGame.set(player1.playerId, gameId);
    this.playerToGame.set(player2.playerId, gameId);

    // 양쪽 플레이어에게 게임 시작 알림
    const gameStartData = {
      gameId,
      prompt: game.currentPrompt,
      opponent: {
        [player1.playerId]: { id: player2.playerId },
        [player2.playerId]: { id: player1.playerId }
      }
    };

    player1.socket.emit('game_start', {
      ...gameStartData,
      yourSide: 'left',
      opponentId: player2.playerId
    });

    player2.socket.emit('game_start', {
      ...gameStartData,
      yourSide: 'right',
      opponentId: player1.playerId
    });

    return { success: true, gameId, started: true };
  }

  /**
   * 랜덤 그림 제시어 생성 (크리스마스 테마)
   */
  getRandomPrompt() {
    const prompts = [
      {
        type: 'attack',
        name: '눈싸움 엘프',
        description: '눈덩이를 던지는 공격형 엘프',
        baseAttack: 30,
        baseDefense: 10,
        baseHealth: 100,
        icon: '🧝'
      },
      {
        type: 'defense',
        name: '눈사람 방패병',
        description: '튼튼한 눈사람 방어병',
        baseAttack: 10,
        baseDefense: 50,
        baseHealth: 200,
        icon: '⛄'
      },
      {
        type: 'magic',
        name: '마법 루돌프',
        description: '마법 공격을 하는 루돌프',
        baseAttack: 50,
        baseDefense: 20,
        baseHealth: 80,
        icon: '🦌'
      },
      {
        type: 'attack',
        name: '산타 전사',
        description: '선물 폭탄을 던지는 산타',
        baseAttack: 40,
        baseDefense: 15,
        baseHealth: 120,
        icon: '🎅'
      },
      {
        type: 'defense',
        name: '크리스마스 트리 가디언',
        description: '견고한 크리스마스 트리 수호자',
        baseAttack: 15,
        baseDefense: 60,
        baseHealth: 250,
        icon: '🎄'
      },
      {
        type: 'magic',
        name: '천사 힐러',
        description: '아군을 회복시키는 천사',
        baseAttack: 5,
        baseDefense: 25,
        baseHealth: 100,
        healing: 20,
        icon: '👼'
      }
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  /**
   * 유닛 생성 (유사도 기반 스탯 계산)
   */
  createUnit(gameId, playerId, similarity, drawingData) {
    const game = this.activeGames.get(gameId);
    if (!game) return { success: false, reason: 'game_not_found' };

    const player = game.players[playerId];
    if (!player) return { success: false, reason: 'player_not_found' };

    const prompt = game.currentPrompt;

    // 유사도에 따른 스탯 배율 (0.3 ~ 1.5배)
    const statMultiplier = 0.3 + (similarity * 1.2);

    const unit = {
      id: uuidv4(),
      type: prompt.type,
      name: prompt.name,
      attack: Math.round(prompt.baseAttack * statMultiplier),
      defense: Math.round(prompt.baseDefense * statMultiplier),
      health: Math.round(prompt.baseHealth * statMultiplier),
      maxHealth: Math.round(prompt.baseHealth * statMultiplier),
      healing: prompt.healing ? Math.round(prompt.healing * statMultiplier) : 0,
      similarity,
      drawingData,
      position: 0,
      state: 'moving',
      icon: prompt.icon,
      side: player.side,
      createdAt: Date.now()
    };

    player.units.push(unit);

    // 새로운 제시어 생성
    game.currentPrompt = this.getRandomPrompt();

    return { success: true, unit, newPrompt: game.currentPrompt };
  }

  /**
   * 게임 틱 처리 (전투 로직)
   */
  processBattle(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game || game.state !== 'playing') return null;

    const players = Object.values(game.players);
    const [player1, player2] = players;

    // 모든 유닛을 위치별로 정렬
    const allUnits = [
      ...player1.units.map(u => ({ ...u, playerId: player1.id })),
      ...player2.units.map(u => ({ ...u, playerId: player2.id }))
    ];

    const updates = {
      units: [],
      deaths: [],
      baseDamage: []
    };

    // 유닛 이동 및 전투 처리
    for (const unit of allUnits) {
      if (unit.state === 'dead') continue;

      const enemySide = unit.side === 'left' ? 'right' : 'left';
      const enemyUnits = allUnits.filter(u =>
        u.side === enemySide && u.state !== 'dead'
      );

      // 적 유닛이 있으면 전투, 없으면 본체 공격
      if (enemyUnits.length > 0) {
        // 가장 가까운 적 찾기
        const nearestEnemy = enemyUnits.reduce((nearest, enemy) => {
          const distance = Math.abs(unit.position - enemy.position);
          const nearestDistance = Math.abs(unit.position - nearest.position);
          return distance < nearestDistance ? enemy : nearest;
        });

        // 전투 거리 내에 있으면 공격
        if (Math.abs(unit.position - nearestEnemy.position) < 50) {
          const damage = Math.max(1, unit.attack - nearestEnemy.defense);
          nearestEnemy.health -= damage;

          updates.units.push({
            unitId: unit.id,
            action: 'attack',
            targetId: nearestEnemy.id,
            damage
          });

          if (nearestEnemy.health <= 0) {
            nearestEnemy.state = 'dead';
            updates.deaths.push(nearestEnemy.id);
          }
        } else {
          // 적에게 이동
          const direction = unit.side === 'left' ? 1 : -1;
          unit.position += direction * 2;

          updates.units.push({
            unitId: unit.id,
            action: 'move',
            position: unit.position
          });
        }
      } else {
        // 적 본체 공격 - 위치에 따라 도달 여부 판단
        const reachedBase = (unit.side === 'left' && unit.position >= 800) ||
                           (unit.side === 'right' && unit.position <= 0);

        if (reachedBase) {
          const enemyPlayer = unit.side === 'left' ? player2 : player1;
          const damage = unit.attack;
          enemyPlayer.currentHealth -= damage;

          updates.baseDamage.push({
            playerId: enemyPlayer.id,
            damage,
            unitId: unit.id
          });

          updates.units.push({
            unitId: unit.id,
            action: 'attack_base',
            damage
          });
        } else {
          // 본체를 향해 이동
          const direction = unit.side === 'left' ? 1 : -1;
          unit.position += direction * 2;

          updates.units.push({
            unitId: unit.id,
            action: 'move',
            position: unit.position
          });
        }
      }
    }

    // 죽은 유닛 제거
    player1.units = player1.units.filter(u => u.state !== 'dead');
    player2.units = player2.units.filter(u => u.state !== 'dead');

    // 승리 조건 확인
    if (player1.currentHealth <= 0) {
      game.state = 'finished';
      game.winner = player2.id;
    } else if (player2.currentHealth <= 0) {
      game.state = 'finished';
      game.winner = player1.id;
    }

    return {
      updates,
      gameState: {
        [player1.id]: {
          health: player1.currentHealth,
          unitCount: player1.units.length
        },
        [player2.id]: {
          health: player2.currentHealth,
          unitCount: player2.units.length
        }
      },
      winner: game.winner || null
    };
  }

  /**
   * 플레이어 연결 해제 처리
   */
  handleDisconnect(playerId) {
    // 대기열에서 제거
    this.waitingPlayers = this.waitingPlayers.filter(
      p => p.playerId !== playerId
    );

    // 진행 중인 게임 찾기
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      const game = this.activeGames.get(gameId);
      if (game) {
        // 상대방에게 알림
        Object.values(game.players).forEach(player => {
          if (player.id !== playerId) {
            player.socket.emit('opponent_disconnected');
          }
        });

        // 게임 종료
        this.activeGames.delete(gameId);
      }

      this.playerToGame.delete(playerId);
    }
  }

  /**
   * 게임 상태 조회
   */
  getGame(gameId) {
    return this.activeGames.get(gameId);
  }

  /**
   * 플레이어의 게임 조회
   */
  getPlayerGame(playerId) {
    const gameId = this.playerToGame.get(playerId);
    return gameId ? this.activeGames.get(gameId) : null;
  }
}

module.exports = GameManager;
