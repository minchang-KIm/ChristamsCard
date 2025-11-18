/**
 * BattlefieldRenderer - 전투 필드 렌더링 엔진
 * Canvas를 사용하여 유닛들의 전투를 시각화
 */
class BattlefieldRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.units = new Map();
    this.effects = [];
    this.animationFrame = null;

    this.setupCanvas();
    this.startRenderLoop();
  }

  setupCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();

    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // 배경 그라데이션
    this.backgroundGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    this.backgroundGradient.addColorStop(0, 'rgba(78, 205, 196, 0.1)');
    this.backgroundGradient.addColorStop(0.5, 'rgba(10, 22, 40, 0.1)');
    this.backgroundGradient.addColorStop(1, 'rgba(255, 107, 107, 0.1)');
  }

  /**
   * 렌더링 루프 시작
   */
  startRenderLoop() {
    const render = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  /**
   * 메인 렌더링 함수
   */
  render() {
    // 캔버스 클리어
    this.ctx.fillStyle = 'rgba(10, 22, 40, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 배경
    this.ctx.fillStyle = this.backgroundGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 중앙선 그리기
    this.drawCenterLine();

    // 유닛 렌더링
    this.renderUnits();

    // 이펙트 렌더링
    this.renderEffects();
  }

  /**
   * 중앙선 그리기
   */
  drawCenterLine() {
    const centerX = this.canvas.width / 2;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, 0);
    this.ctx.lineTo(centerX, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  /**
   * 유닛 추가
   */
  addUnit(unit) {
    this.units.set(unit.id, {
      ...unit,
      displayX: unit.side === 'left' ? 50 : this.canvas.width - 50,
      displayY: this.canvas.height / 2,
      targetX: null,
      targetY: null,
      animationPhase: 0
    });

    // 생성 이펙트
    this.addEffect({
      type: 'spawn',
      x: unit.side === 'left' ? 50 : this.canvas.width - 50,
      y: this.canvas.height / 2,
      duration: 30,
      color: unit.side === 'left' ? '#4ecdc4' : '#ff6b6b'
    });
  }

  /**
   * 유닛 제거
   */
  removeUnit(unitId) {
    const unit = this.units.get(unitId);
    if (unit) {
      // 사망 이펙트
      this.addEffect({
        type: 'death',
        x: unit.displayX,
        y: unit.displayY,
        duration: 40,
        color: '#ff6b6b'
      });

      this.units.delete(unitId);
    }
  }

  /**
   * 유닛 위치 업데이트
   */
  updateUnitPosition(unitId, position) {
    const unit = this.units.get(unitId);
    if (unit) {
      // 게임 좌표(0-800)를 캔버스 좌표로 변환
      const targetX = (position / 800) * this.canvas.width;
      unit.targetX = targetX;
    }
  }

  /**
   * 유닛 공격 애니메이션
   */
  unitAttack(unitId, targetId) {
    const unit = this.units.get(unitId);
    const target = this.units.get(targetId);

    if (unit && target) {
      // 공격 이펙트
      this.addEffect({
        type: 'attack',
        x1: unit.displayX,
        y1: unit.displayY,
        x2: target.displayX,
        y2: target.displayY,
        duration: 15,
        color: unit.side === 'left' ? '#4ecdc4' : '#ff6b6b'
      });
    }
  }

  /**
   * 본체 공격 애니메이션
   */
  baseAttack(unitId, side) {
    const unit = this.units.get(unitId);

    if (unit) {
      const baseX = side === 'right' ? this.canvas.width - 50 : 50;
      const baseY = this.canvas.height / 2;

      this.addEffect({
        type: 'attack',
        x1: unit.displayX,
        y1: unit.displayY,
        x2: baseX,
        y2: baseY,
        duration: 15,
        color: '#ffd700'
      });
    }
  }

  /**
   * 유닛 렌더링
   */
  renderUnits() {
    this.units.forEach((unit) => {
      // 위치 보간 (부드러운 이동)
      if (unit.targetX !== null) {
        const dx = unit.targetX - unit.displayX;
        unit.displayX += dx * 0.1;

        if (Math.abs(dx) < 1) {
          unit.displayX = unit.targetX;
          unit.targetX = null;
        }
      }

      // 애니메이션 페이즈 업데이트
      unit.animationPhase += 0.1;

      // 유닛 그리기
      this.drawUnit(unit);
    });
  }

  /**
   * 개별 유닛 그리기
   */
  drawUnit(unit) {
    const x = unit.displayX;
    const y = unit.displayY + Math.sin(unit.animationPhase) * 5; // 위아래 흔들림

    // 체력 바
    const healthBarWidth = 50;
    const healthBarHeight = 5;
    const healthPercent = unit.health / unit.maxHealth;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x - healthBarWidth / 2, y - 40, healthBarWidth, healthBarHeight);

    this.ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : '#ff6b6b';
    this.ctx.fillRect(x - healthBarWidth / 2, y - 40, healthBarWidth * healthPercent, healthBarHeight);

    // 유닛 아이콘 (그린 그림 또는 기본 아이콘)
    if (unit.drawingData) {
      // 그린 그림 표시
      const img = new Image();
      img.src = unit.drawingData;

      const size = 40;
      this.ctx.save();

      // 원형 마스크
      this.ctx.beginPath();
      this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      this.ctx.clip();

      this.ctx.drawImage(img, x - size / 2, y - size / 2, size, size);

      this.ctx.restore();

      // 테두리
      this.ctx.strokeStyle = unit.side === 'left' ? '#4ecdc4' : '#ff6b6b';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      this.ctx.stroke();
    } else {
      // 기본 아이콘
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(unit.icon || '⚔️', x, y);
    }

    // 유닛 정보 (디버그)
    this.ctx.font = '10px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${unit.attack}⚔️ ${unit.defense}🛡️`, x, y + 30);
  }

  /**
   * 이펙트 추가
   */
  addEffect(effect) {
    this.effects.push({
      ...effect,
      frame: 0
    });
  }

  /**
   * 이펙트 렌더링
   */
  renderEffects() {
    this.effects = this.effects.filter((effect) => {
      effect.frame++;

      if (effect.frame >= effect.duration) {
        return false; // 이펙트 제거
      }

      const progress = effect.frame / effect.duration;

      switch (effect.type) {
        case 'spawn':
          this.renderSpawnEffect(effect, progress);
          break;
        case 'death':
          this.renderDeathEffect(effect, progress);
          break;
        case 'attack':
          this.renderAttackEffect(effect, progress);
          break;
      }

      return true;
    });
  }

  /**
   * 생성 이펙트
   */
  renderSpawnEffect(effect, progress) {
    const radius = 20 + progress * 30;
    const alpha = 1 - progress;

    this.ctx.strokeStyle = `${effect.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * 사망 이펙트
   */
  renderDeathEffect(effect, progress) {
    const particles = 8;
    const maxRadius = 50;
    const alpha = 1 - progress;

    for (let i = 0; i < particles; i++) {
      const angle = (Math.PI * 2 * i) / particles;
      const radius = progress * maxRadius;
      const x = effect.x + Math.cos(angle) * radius;
      const y = effect.y + Math.sin(angle) * radius;

      this.ctx.fillStyle = `${effect.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * 공격 이펙트
   */
  renderAttackEffect(effect, progress) {
    const alpha = 1 - progress;

    this.ctx.strokeStyle = `${effect.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(effect.x1, effect.y1);
    this.ctx.lineTo(effect.x2, effect.y2);
    this.ctx.stroke();

    // 충격 이펙트
    const impactRadius = (1 - progress) * 15;
    this.ctx.strokeStyle = `${effect.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(effect.x2, effect.y2, impactRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * 캔버스 리사이즈
   */
  resize() {
    this.setupCanvas();
  }

  /**
   * 정리
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.units.clear();
    this.effects = [];
  }
}
