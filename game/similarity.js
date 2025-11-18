/**
 * SimilarityDetector - AI 기반 이미지 유사도 측정
 * TensorFlow.js와 MobileNet을 사용하여 실시간 유사도 측정
 */
class SimilarityDetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isReady = false;

    // 크리스마스 테마 키워드 매핑
    this.keywordMappings = {
      '눈싸움 엘프': ['elf', 'person', 'toy', 'snowball', 'christmas'],
      '눈사람 방패병': ['snowman', 'snow', 'umbrella', 'shield'],
      '마법 루돌프': ['deer', 'horse', 'reindeer', 'animal'],
      '산타 전사': ['santa', 'person', 'red', 'christmas', 'claus'],
      '크리스마스 트리 가디언': ['tree', 'christmas tree', 'pine', 'evergreen'],
      '천사 힐러': ['angel', 'person', 'wing', 'white']
    };
  }

  /**
   * MobileNet 모델 로드
   */
  async loadModel() {
    if (this.isReady) return true;
    if (this.isLoading) {
      // 로딩 중이면 대기
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isReady) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }

    this.isLoading = true;

    try {
      console.log('🤖 Loading AI model...');
      this.model = await mobilenet.load();
      this.isReady = true;
      this.isLoading = false;
      console.log('✅ AI model loaded successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to load AI model:', error);
      this.isLoading = false;
      return false;
    }
  }

  /**
   * 이미지 유사도 계산
   * @param {HTMLCanvasElement} canvas - 그린 그림 캔버스
   * @param {string} targetName - 목표 그림 이름
   * @returns {Promise<number>} 유사도 (0.0 ~ 1.0)
   */
  async calculateSimilarity(canvas, targetName) {
    if (!this.isReady) {
      await this.loadModel();
    }

    try {
      // MobileNet으로 이미지 분류
      const predictions = await this.model.classify(canvas);

      // 목표 키워드
      const targetKeywords = this.keywordMappings[targetName] || [];

      // 예측 결과와 목표 키워드 매칭
      let bestScore = 0;

      predictions.forEach((prediction) => {
        const className = prediction.className.toLowerCase();
        const probability = prediction.probability;

        // 키워드 매칭 점수 계산
        targetKeywords.forEach((keyword) => {
          if (className.includes(keyword.toLowerCase())) {
            const score = probability;
            if (score > bestScore) {
              bestScore = score;
            }
          }
        });

        // 부분 매칭도 고려
        const words = className.split(/[\s,]+/);
        words.forEach((word) => {
          targetKeywords.forEach((keyword) => {
            if (word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)) {
              const score = probability * 0.7; // 부분 매칭은 70% 점수
              if (score > bestScore) {
                bestScore = score;
              }
            }
          });
        });
      });

      // 최소 유사도 보장 (그림을 그렸으면 최소 20%)
      const baseSimilarity = this.calculateBaseSimilarity(canvas);
      const finalScore = Math.max(bestScore, baseSimilarity);

      console.log(`📊 Similarity for "${targetName}":`, {
        predictions: predictions.slice(0, 3).map(p => ({
          class: p.className,
          prob: (p.probability * 100).toFixed(1) + '%'
        })),
        bestScore: (bestScore * 100).toFixed(1) + '%',
        baseSimilarity: (baseSimilarity * 100).toFixed(1) + '%',
        finalScore: (finalScore * 100).toFixed(1) + '%'
      });

      return Math.min(finalScore, 1.0);

    } catch (error) {
      console.error('Error calculating similarity:', error);
      // 에러 발생 시 기본 유사도 반환
      return this.calculateBaseSimilarity(canvas);
    }
  }

  /**
   * 기본 유사도 계산 (픽셀 기반)
   * 그림의 복잡도를 기반으로 최소 유사도 제공
   */
  calculateBaseSimilarity(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let coloredPixels = 0;
    let totalPixels = canvas.width * canvas.height;

    // 흰색이 아닌 픽셀 카운트
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
        coloredPixels++;
      }
    }

    // 그림의 커버리지 계산
    const coverage = coloredPixels / totalPixels;

    // 복잡도에 따라 20%~40% 기본 유사도 제공
    const baseSimilarity = Math.min(0.2 + (coverage * 0.2), 0.4);

    return baseSimilarity;
  }

  /**
   * 빠른 유사도 계산 (간단한 픽셀 기반)
   * AI 모델 없이도 작동 가능
   */
  calculateQuickSimilarity(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let coloredPixels = 0;
    let edgePixels = 0;
    let totalPixels = canvas.width * canvas.height;

    // 픽셀 분석
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;

        // 흰색이 아닌 픽셀
        if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255) {
          coloredPixels++;

          // 엣지 감지 (간단한 방법)
          if (x > 0 && x < canvas.width - 1 && y > 0 && y < canvas.height - 1) {
            const left = (y * canvas.width + (x - 1)) * 4;
            const right = (y * canvas.width + (x + 1)) * 4;
            const top = ((y - 1) * canvas.width + x) * 4;
            const bottom = ((y + 1) * canvas.width + x) * 4;

            const isEdge =
              (pixels[left] === 255 || pixels[right] === 255 ||
               pixels[top] === 255 || pixels[bottom] === 255);

            if (isEdge) edgePixels++;
          }
        }
      }
    }

    const coverage = coloredPixels / totalPixels;
    const edgeRatio = coloredPixels > 0 ? edgePixels / coloredPixels : 0;

    // 복잡도 점수 (커버리지 + 엣지 비율)
    const complexityScore = (coverage * 0.5) + (edgeRatio * 0.5);

    // 30%~70% 범위로 스케일링
    const similarity = 0.3 + (complexityScore * 0.4);

    return Math.min(similarity, 0.85); // 최대 85%
  }

  /**
   * 실시간 유사도 계산 (디바운싱 포함)
   */
  async calculateSimilarityDebounced(canvas, targetName, callback) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      const similarity = await this.calculateSimilarity(canvas, targetName);
      if (callback) callback(similarity);
    }, 500); // 500ms 디바운싱
  }

  /**
   * 모델 상태 확인
   */
  isModelReady() {
    return this.isReady;
  }
}
