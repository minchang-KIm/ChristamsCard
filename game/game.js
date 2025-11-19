/**
 * Christmas AI Drawing Battle Game
 * 메인 게임 로직 및 통합
 */

class Game {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerId = null;
    this.mySide = null;
    this.opponentId = null;
    this.currentPrompt = null;

    // 게임 상태
    this.myHealth = 1000;
    this.opponentHealth = 1000;
    this.myUnits = [];
    this.opponentUnits = [];
    this.unitsCreated = 0;
    this.totalSimilarity = 0;
    this.gameStartTime = null;

    // 컴포넌트
    this.drawingCanvas = null;
    this.renderer = null;
    this.similarityDetector = null;

    // 현재 유사도
    this.currentSimilarity = 0;

    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    console.log('🎮 Initializing game...');

    // Socket.io 연결
    this.socket = io();

    // 유사도 감지기 초기화
    this.similarityDetector = new SimilarityDetector();
    await this.similarityDetector.loadModel();

    // 렌더러 초기화
    this.renderer = new BattlefieldRenderer('battlefieldCanvas');

    // 이벤트 리스너 설정
    this.setupEventListeners();
    this.setupSocketListeners();

    // 눈 내리는 효과 시작
    this.startSnowfall();

    console.log('✅ Game initialized!');
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 매칭 버튼
    document.getElementById('findMatchBtn').addEventListener('click', () => {
      this.findMatch();
    });

    // 드로잉 캔버스 초기화
    this.drawingCanvas = new DrawingCanvas('drawingCanvas', () => {
      this.onDrawingChange();
    });

    // 색상 선택기
    document.getElementById('colorPicker').addEventListener('change', (e) => {
      this.drawingCanvas.setBrushColor(e.target.value);
    });

    // 브러시 크기
    document.getElementById('brushSize').addEventListener('input', (e) => {
      this.drawingCanvas.setBrushSize(e.target.value);
    });

    // 캔버스 지우기
    document.getElementById('clearCanvas').addEventListener('click', () => {
      this.drawingCanvas.clear();
      this.updateSimilarityDisplay(0);
    });

    // 유닛 생성 버튼
    document.getElementById('createUnitBtn').addEventListener('click', () => {
      this.createUnit();
    });

    // 다시 플레이 버튼
    document.getElementById('playAgainBtn').addEventListener('click', () => {
      location.reload();
    });

    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
      this.renderer.resize();
    });
  }

  /**
   * Socket 리스너 설정
   */
  setupSocketListeners() {
    // 매칭 대기
    this.socket.on('waiting_for_opponent', () => {
      console.log('⏳ Waiting for opponent...');
      document.getElementById('waitingMessage').classList.remove('hidden');
    });

    // 게임 시작
    this.socket.on('game_start', (data) => {
      console.log('🎮 Game started!', data);
      this.onGameStart(data);
    });

    // 유닛 생성 알림
    this.socket.on('unit_created', (data) => {
      console.log('⚔️ Unit created:', data);
      this.onUnitCreated(data);
    });

    // 전투 업데이트
    this.socket.on('battle_update', (data) => {
      this.onBattleUpdate(data);
    });

    // 게임 종료
    this.socket.on('game_over', (data) => {
      console.log('🏆 Game over!', data);
      this.onGameOver(data);
    });

    // 상대 연결 해제
    this.socket.on('opponent_disconnected', () => {
      alert('상대방의 연결이 끊어졌습니다.');
      location.reload();
    });

    // 에러
    this.socket.on('error', (data) => {
      console.error('❌ Error:', data);
      alert(`오류: ${data.message}`);
    });
  }

  /**
   * 매칭 찾기
   */
  findMatch() {
    console.log('🔍 Finding match...');
    this.socket.emit('find_match');
    document.getElementById('findMatchBtn').disabled = true;
    document.getElementById('waitingMessage').classList.remove('hidden');
  }

  /**
   * 게임 시작 핸들러
   */
  onGameStart(data) {
    this.gameId = data.gameId;
    this.mySide = data.yourSide;
    this.opponentId = data.opponentId;
    this.currentPrompt = data.prompt;
    this.gameStartTime = Date.now();
    this.playerId = this.socket.id;

    // 화면 전환
    this.switchScreen('gameScreen');

    // 캔버스와 렌더러 재초기화 (화면 전환 후 크기가 잡힘)
    setTimeout(() => {
      this.drawingCanvas.setupCanvas();
      this.renderer.resize();
    }, 100);

    // 제시어 표시
    this.updatePrompt(this.currentPrompt);

    // 게임 타이머 시작
    this.startGameTimer();

    console.log('✅ Game ready! Your side:', this.mySide);
  }

  /**
   * 유닛 생성
   */
  async createUnit() {
    if (this.drawingCanvas.isEmpty()) {
      alert('그림을 먼저 그려주세요!');
      return;
    }

    const button = document.getElementById('createUnitBtn');
    button.disabled = true;
    button.querySelector('.button-text').textContent = '생성 중...';

    try {
      // 유사도 계산
      const canvas = this.drawingCanvas.getResizedImage();
      const similarity = await this.similarityDetector.calculateSimilarity(
        canvas,
        this.currentPrompt.name
      );

      // 그림 데이터
      const drawingData = this.drawingCanvas.toDataURL();

      // 서버에 전송
      this.socket.emit('create_unit', {
        similarity,
        drawingData
      });

      // 통계 업데이트
      this.unitsCreated++;
      this.totalSimilarity += similarity;

      // 캔버스 클리어
      this.drawingCanvas.clear();
      this.updateSimilarityDisplay(0);

    } catch (error) {
      console.error('Failed to create unit:', error);
      alert('유닛 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      button.disabled = false;
      button.querySelector('.button-text').textContent = '병사 생성!';
    }
  }

  /**
   * 유닛 생성 알림 핸들러
   */
  onUnitCreated(data) {
    const { unit, playerId, newPrompt } = data;

    // 렌더러에 유닛 추가
    this.renderer.addUnit(unit);

    // 내가 만든 유닛이면 새 제시어 업데이트
    if (playerId === this.socket.id && newPrompt) {
      this.currentPrompt = newPrompt;
      this.updatePrompt(newPrompt);
    }

    // 유닛 리스트 업데이트
    if (playerId === this.socket.id) {
      this.myUnits.push(unit);
    } else {
      this.opponentUnits.push(unit);
    }
  }

  /**
   * 전투 업데이트 핸들러
   */
  onBattleUpdate(data) {
    const { updates, gameState } = data;

    // 유닛 액션 처리
    updates.units.forEach((update) => {
      switch (update.action) {
        case 'move':
          this.renderer.updateUnitPosition(update.unitId, update.position);
          break;
        case 'attack':
          this.renderer.unitAttack(update.unitId, update.targetId);
          break;
        case 'attack_base':
          const unit = this.renderer.units.get(update.unitId);
          if (unit) {
            const targetSide = unit.side === 'left' ? 'right' : 'left';
            this.renderer.baseAttack(update.unitId, targetSide);
          }
          break;
      }
    });

    // 사망 유닛 처리
    updates.deaths.forEach((unitId) => {
      this.renderer.removeUnit(unitId);
    });

    // 본체 데미지 처리
    updates.baseDamage.forEach((damage) => {
      if (damage.playerId === this.socket.id) {
        this.myHealth = gameState[this.socket.id].health;
      } else {
        this.opponentHealth = gameState[damage.playerId].health;
      }
    });

    // UI 업데이트
    this.updateHealthBars();
  }

  /**
   * 게임 종료 핸들러
   */
  onGameOver(data) {
    const { isWinner } = data;

    // 화면 전환
    this.switchScreen('gameOverScreen');

    // 결과 표시
    if (isWinner) {
      document.getElementById('resultIcon').textContent = '🏆';
      document.getElementById('resultTitle').textContent = '승리!';
      document.getElementById('resultMessage').textContent = '축하합니다! 크리스마스 전투에서 승리하셨습니다!';
    } else {
      document.getElementById('resultIcon').textContent = '😢';
      document.getElementById('resultTitle').textContent = '패배';
      document.getElementById('resultMessage').textContent = '아쉽게도 패배했습니다. 다시 도전해보세요!';
    }

    // 통계 표시
    const playTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const minutes = Math.floor(playTime / 60);
    const seconds = playTime % 60;

    document.getElementById('finalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('unitsCreated').textContent = this.unitsCreated;

    const avgSimilarity = this.unitsCreated > 0
      ? (this.totalSimilarity / this.unitsCreated * 100).toFixed(1)
      : 0;
    document.getElementById('avgSimilarity').textContent = avgSimilarity + '%';
  }

  /**
   * 그림 변경 시 유사도 업데이트
   */
  async onDrawingChange() {
    if (!this.currentPrompt || this.drawingCanvas.isEmpty()) {
      this.updateSimilarityDisplay(0);
      return;
    }

    // 디바운싱을 사용하여 실시간 유사도 계산
    if (this.similarityTimeout) {
      clearTimeout(this.similarityTimeout);
    }

    this.similarityTimeout = setTimeout(async () => {
      try {
        const canvas = this.drawingCanvas.getResizedImage();
        const similarity = await this.similarityDetector.calculateSimilarity(
          canvas,
          this.currentPrompt.name
        );

        this.currentSimilarity = similarity;
        this.updateSimilarityDisplay(similarity);
      } catch (error) {
        console.error('Failed to calculate similarity:', error);
      }
    }, 1000);
  }

  /**
   * 제시어 업데이트
   */
  updatePrompt(prompt) {
    document.getElementById('promptIcon').textContent = prompt.icon;
    document.getElementById('promptName').textContent = prompt.name;
    document.getElementById('promptDesc').textContent = prompt.description;

    const typeNames = {
      attack: '공격형',
      defense: '방어형',
      magic: '마법형'
    };
    document.getElementById('promptType').textContent = typeNames[prompt.type] || prompt.type;
  }

  /**
   * 유사도 표시 업데이트
   */
  updateSimilarityDisplay(similarity) {
    const percent = Math.round(similarity * 100);
    document.getElementById('similarityFill').style.width = percent + '%';
    document.getElementById('similarityValue').textContent = percent + '%';
  }

  /**
   * 체력 바 업데이트
   */
  updateHealthBars() {
    const myPercent = (this.myHealth / 1000) * 100;
    const opponentPercent = (this.opponentHealth / 1000) * 100;

    document.querySelector('#playerHealthBar .health-fill').style.width = myPercent + '%';
    document.getElementById('playerHealthText').textContent = `${Math.max(0, this.myHealth)} / 1000`;

    document.querySelector('#opponentHealthBar .health-fill').style.width = opponentPercent + '%';
    document.getElementById('opponentHealthText').textContent = `${Math.max(0, this.opponentHealth)} / 1000`;
  }

  /**
   * 게임 타이머 시작
   */
  startGameTimer() {
    setInterval(() => {
      if (!this.gameStartTime) return;

      const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;

      document.getElementById('gameTime').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  /**
   * 화면 전환
   */
  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.remove('active');
    });

    document.getElementById(screenId).classList.add('active');
  }

  /**
   * 눈 내리는 효과
   */
  startSnowfall() {
    function createSnowflake() {
      const snowContainer = document.getElementById('snowContainer');
      const snowflake = document.createElement('div');
      snowflake.classList.add('snowflake');
      snowflake.innerHTML = '❄';
      snowflake.style.left = Math.random() * 100 + '%';
      snowflake.style.animationDuration = Math.random() * 3 + 5 + 's';
      snowflake.style.opacity = Math.random();
      snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';

      snowContainer.appendChild(snowflake);

      setTimeout(() => {
        snowflake.remove();
      }, 8000);
    }

    setInterval(createSnowflake, 200);
  }
}

// 게임 시작
let game;
window.addEventListener('DOMContentLoaded', () => {
  game = new Game();
});
