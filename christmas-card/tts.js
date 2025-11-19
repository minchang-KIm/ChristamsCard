// TTS (Text-to-Speech) 관리
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// 텍스트 읽기 (산타 목소리)
function speakText(text, options = {}) {
    // 진행 중인 음성이 있으면 중단
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    // SpeechSynthesisUtterance 생성
    currentUtterance = new SpeechSynthesisUtterance(text);

    // 기본 설정
    currentUtterance.lang = options.lang || 'ko-KR';
    currentUtterance.rate = options.rate || 0.9; // 속도 (0.1 ~ 10)
    currentUtterance.pitch = options.pitch || 1.1; // 음높이 (0 ~ 2)
    currentUtterance.volume = options.volume || 1; // 볼륨 (0 ~ 1)

    // 가능한 경우 남성 목소리 선택 (산타처럼)
    const voices = speechSynthesis.getVoices();
    const koreanVoice = voices.find(voice =>
        voice.lang.startsWith('ko') && voice.name.includes('Male')
    ) || voices.find(voice => voice.lang.startsWith('ko'));

    if (koreanVoice) {
        currentUtterance.voice = koreanVoice;
    }

    // 이벤트 리스너
    currentUtterance.onstart = () => {
        console.log('🎅 산타가 편지를 읽기 시작했습니다...');
    };

    currentUtterance.onend = () => {
        console.log('✅ 편지 읽기 완료');
        if (options.onEnd) options.onEnd();
    };

    currentUtterance.onerror = (event) => {
        console.error('❌ TTS 오류:', event);
    };

    // 읽기 시작
    speechSynthesis.speak(currentUtterance);

    return currentUtterance;
}

// 음성 중단
function stopSpeaking() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
}

// 음성 일시정지
function pauseSpeaking() {
    if (speechSynthesis.speaking) {
        speechSynthesis.pause();
    }
}

// 음성 재개
function resumeSpeaking() {
    if (speechSynthesis.paused) {
        speechSynthesis.resume();
    }
}

// 사용 가능한 목소리 목록 가져오기
function getAvailableVoices() {
    return speechSynthesis.getVoices();
}

// 브라우저가 TTS를 지원하는지 확인
function isTTSSupported() {
    return 'speechSynthesis' in window;
}

// 목소리 로드 (일부 브라우저에서는 비동기로 로드됨)
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        const voices = getAvailableVoices();
        console.log('🔊 사용 가능한 목소리:', voices.length);
    };
}

// 산타 목소리 설정 (사용자 정의)
function getSantaVoiceSettings() {
    return {
        rate: 0.85,      // 조금 느리게 (할아버지 느낌)
        pitch: 0.9,      // 조금 낮은 음높이
        volume: 1,       // 최대 볼륨
        lang: 'ko-KR'    // 한국어
    };
}

// 편지를 산타 목소리로 읽기
function readLetterAsSanta(text, onComplete) {
    const santaSettings = getSantaVoiceSettings();
    santaSettings.onEnd = onComplete;

    return speakText(text, santaSettings);
}

console.log('🎅 TTS 모듈 로드 완료');
console.log('TTS 지원:', isTTSSupported() ? '✅' : '❌');
