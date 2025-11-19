/**
 * DrawingCanvas - 캔버스 드로잉 시스템
 */
class DrawingCanvas {
  constructor(canvasId, onDrawingChange) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.onDrawingChange = onDrawingChange;

    // 기본 설정
    this.brushColor = '#FF0000';
    this.brushSize = 5;

    this.setupCanvas();
    this.attachEventListeners();
  }

  setupCanvas() {
    // 고해상도 지원
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    // 크기가 0이면 기다렸다가 다시 시도
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(() => this.setupCanvas(), 100);
      return;
    }

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);

    // 캔버스 스타일 크기 설정
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // 배경을 흰색으로
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 선 설정
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  attachEventListeners() {
    // 마우스 이벤트
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // 터치 이벤트 (모바일 지원)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    this.ctx.strokeStyle = this.brushColor;
    this.ctx.lineWidth = this.brushSize;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();

    this.lastX = currentX;
    this.lastY = currentY;

    // 그림이 변경되었음을 알림
    if (this.onDrawingChange) {
      this.onDrawingChange();
    }
  }

  stopDrawing() {
    if (this.isDrawing && this.onDrawingChange) {
      this.onDrawingChange();
    }
    this.isDrawing = false;
  }

  setBrushColor(color) {
    this.brushColor = color;
  }

  setBrushSize(size) {
    this.brushSize = size;
  }

  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    if (this.onDrawingChange) {
      this.onDrawingChange();
    }
  }

  /**
   * 캔버스 이미지를 ImageData로 반환
   */
  getImageData() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 캔버스를 Data URL로 반환
   */
  toDataURL() {
    return this.canvas.toDataURL('image/png');
  }

  /**
   * 캔버스가 비어있는지 확인
   */
  isEmpty() {
    const imageData = this.getImageData();
    const pixels = imageData.data;

    // 모든 픽셀이 흰색(255, 255, 255, 255)인지 확인
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
        return false;
      }
    }

    return true;
  }

  /**
   * 캔버스를 리사이즈된 이미지로 반환 (ML 모델 입력용)
   */
  getResizedImage(width = 224, height = 224) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    // 배경을 흰색으로
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, width, height);

    // 원본 이미지 리사이즈하여 그리기
    tempCtx.drawImage(this.canvas, 0, 0, width, height);

    return tempCanvas;
  }

  /**
   * 그림의 경계 박스 계산
   */
  getBoundingBox() {
    const imageData = this.getImageData();
    const pixels = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;

    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        // 흰색이 아닌 픽셀 찾기
        if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * 그림을 중앙에 배치 (정규화)
   */
  centerDrawing() {
    const bbox = this.getBoundingBox();

    if (bbox.maxX === 0) return; // 빈 캔버스

    // 그림 추출
    const width = bbox.maxX - bbox.minX + 1;
    const height = bbox.maxY - bbox.minY + 1;
    const drawing = this.ctx.getImageData(bbox.minX, bbox.minY, width, height);

    // 캔버스 클리어
    this.clear();

    // 중앙에 배치
    const rect = this.canvas.getBoundingClientRect();
    const x = (rect.width - width) / 2;
    const y = (rect.height - height) / 2;

    this.ctx.putImageData(drawing, x, y);
  }
}
