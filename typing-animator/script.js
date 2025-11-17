class HumanTypingAnimator {
    constructor() {
        // DOM Elements
        this.inputText = document.getElementById('inputText');
        this.output = document.getElementById('output');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.speedRange = document.getElementById('speedRange');
        this.speedLabel = document.getElementById('speedLabel');
        this.statusText = document.getElementById('statusText');
        this.progressText = document.getElementById('progressText');

        // State
        this.isTyping = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.textToType = '';
        this.timeoutId = null;

        // Speed settings (ms)
        this.speedSettings = {
            1: { base: 250, variation: 150, name: '매우 느림' },    // 100-400ms
            2: { base: 150, variation: 100, name: '느림' },        // 50-250ms
            3: { base: 80, variation: 70, name: '보통' },          // 10-150ms
            4: { base: 50, variation: 40, name: '빠름' },          // 10-90ms
            5: { base: 30, variation: 30, name: '매우 빠름' }      // 0-60ms
        };

        this.currentSpeed = 3;

        // Initialize
        this.init();
    }

    init() {
        // Event listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.speedRange.addEventListener('input', (e) => this.updateSpeed(e.target.value));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target === this.inputText) {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.start();
                }
                return;
            }

            switch(e.key) {
                case 'Enter':
                    e.preventDefault();
                    if (!this.isTyping) {
                        this.start();
                    } else if (this.isPaused) {
                        this.resume();
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    if (this.isTyping) {
                        this.pause();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.stop();
                    break;
            }
        });

        // Focus input on load
        this.inputText.focus();
    }

    updateSpeed(value) {
        this.currentSpeed = parseInt(value);
        const speedInfo = this.speedSettings[this.currentSpeed];
        this.speedLabel.textContent = speedInfo.name;
    }

    getRandomDelay(char) {
        const speedInfo = this.speedSettings[this.currentSpeed];
        let baseDelay = speedInfo.base;
        let variation = speedInfo.variation;

        // Add extra delay for punctuation (more human-like)
        if (['.', '!', '?', ',', ';', ':'].includes(char)) {
            baseDelay += 200;
            variation += 100;
        }

        // Add extra delay for newlines
        if (char === '\n') {
            baseDelay += 300;
            variation += 150;
        }

        // Add extra delay for spaces (slightly)
        if (char === ' ') {
            baseDelay += 20;
            variation += 10;
        }

        // Random variation to simulate human typing
        const randomVariation = Math.random() * variation;
        return Math.floor(baseDelay + randomVariation - (variation / 2));
    }

    start() {
        const text = this.inputText.value.trim();

        if (!text) {
            alert('텍스트를 입력해주세요!');
            this.inputText.focus();
            return;
        }

        if (this.isPaused) {
            this.resume();
            return;
        }

        // Reset and start
        this.textToType = text;
        this.currentIndex = 0;
        this.isTyping = true;
        this.isPaused = false;

        // Clear output and add cursor
        this.output.innerHTML = '<span class="cursor">|</span>';

        // Update UI
        this.updateUI();
        this.updateStatus('타이핑 중...', 'typing');

        // Start typing
        this.typeNextCharacter();
    }

    typeNextCharacter() {
        if (!this.isTyping || this.isPaused) {
            return;
        }

        if (this.currentIndex >= this.textToType.length) {
            this.complete();
            return;
        }

        const char = this.textToType[this.currentIndex];
        const currentText = this.textToType.substring(0, this.currentIndex + 1);

        // Update output with typed text and cursor
        this.output.innerHTML = this.escapeHtml(currentText) + '<span class="cursor">|</span>';

        // Update progress
        this.updateProgress();

        this.currentIndex++;

        // Schedule next character with random delay
        const delay = this.getRandomDelay(char);
        this.timeoutId = setTimeout(() => this.typeNextCharacter(), delay);
    }

    pause() {
        if (!this.isTyping || this.isPaused) {
            return;
        }

        this.isPaused = true;
        clearTimeout(this.timeoutId);
        this.updateUI();
        this.updateStatus('일시정지됨', 'paused');
    }

    resume() {
        if (!this.isTyping || !this.isPaused) {
            return;
        }

        this.isPaused = false;
        this.updateUI();
        this.updateStatus('타이핑 중...', 'typing');
        this.typeNextCharacter();
    }

    stop() {
        if (!this.isTyping) {
            return;
        }

        this.isTyping = false;
        this.isPaused = false;
        clearTimeout(this.timeoutId);
        this.updateUI();
        this.updateStatus('중지됨', '');
        this.progressText.textContent = '';
    }

    complete() {
        this.isTyping = false;
        this.isPaused = false;

        // Remove cursor
        const finalText = this.textToType;
        this.output.innerHTML = this.escapeHtml(finalText);

        this.updateUI();
        this.updateStatus('완료!', 'typing');
        this.progressText.textContent = '100%';

        // Show completion message
        setTimeout(() => {
            this.updateStatus('대기 중...', '');
        }, 3000);
    }

    clear() {
        this.stop();
        this.inputText.value = '';
        this.output.innerHTML = '<span class="cursor">|</span>';
        this.currentIndex = 0;
        this.updateStatus('대기 중...', '');
        this.progressText.textContent = '';
        this.inputText.focus();
    }

    updateUI() {
        if (this.isTyping) {
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
            this.inputText.disabled = true;
            this.speedRange.disabled = true;

            if (this.isPaused) {
                this.startBtn.disabled = false;
                this.startBtn.innerHTML = '<span class="btn-icon">▶️</span> 재개';
            } else {
                this.startBtn.innerHTML = '<span class="btn-icon">▶️</span> 타이핑 시작 (Enter)';
            }
        } else {
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopBtn.disabled = true;
            this.inputText.disabled = false;
            this.speedRange.disabled = false;
            this.startBtn.innerHTML = '<span class="btn-icon">▶️</span> 타이핑 시작 (Enter)';
        }
    }

    updateStatus(text, className) {
        this.statusText.textContent = text;
        this.statusText.className = className;
    }

    updateProgress() {
        const progress = Math.floor((this.currentIndex / this.textToType.length) * 100);
        this.progressText.textContent = `${progress}% (${this.currentIndex}/${this.textToType.length})`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const animator = new HumanTypingAnimator();
    console.log('⌨️ Human-like Typing Animator initialized!');
});
