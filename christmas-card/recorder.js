// 영상 녹화 및 저장
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingStream = null;

// 녹화 시작
async function startRecording() {
    try {
        const canvas = document.getElementById('canvas');
        const video = document.getElementById('video');

        // Canvas와 Video를 합성한 스트림 생성
        const canvasStream = canvas.captureStream(30); // 30fps
        const videoStream = video.srcObject;

        // 오디오 트랙 추가 (TTS 소리 포함)
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        // Canvas 스트림과 비디오 스트림 합성
        const tracks = [
            ...canvasStream.getVideoTracks(),
            ...destination.stream.getAudioTracks()
        ];

        recordingStream = new MediaStream(tracks);

        // MediaRecorder 생성
        const options = {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000 // 2.5Mbps
        };

        // 브라우저 지원 확인
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }

        mediaRecorder = new MediaRecorder(recordingStream, options);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            saveRecording();
        };

        recordedChunks = [];
        mediaRecorder.start(100); // 100ms마다 데이터 수집

        isRecording = true;
        console.log('🎥 녹화 시작');

        return true;
    } catch (error) {
        console.error('❌ 녹화 시작 실패:', error);
        alert('녹화를 시작할 수 없습니다.');
        return false;
    }
}

// 녹화 중지
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        console.log('⏹️ 녹화 중지');

        // 스트림 정리
        if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
        }
    }
}

// 녹화 저장
function saveRecording() {
    if (recordedChunks.length === 0) {
        alert('녹화된 영상이 없습니다.');
        return;
    }

    // Blob 생성
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });

    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `christmas-card-${Date.now()}.webm`;

    document.body.appendChild(a);
    a.click();

    // 정리
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    console.log('💾 영상 저장 완료');
    alert('영상이 저장되었습니다! 🎥');

    recordedChunks = [];
}

// 녹화 토글 (시작/중지)
function toggleRecording() {
    const btn = document.querySelector('.btn-record');

    if (!isRecording) {
        // 녹화 시작
        startRecording().then(success => {
            if (success) {
                btn.textContent = '⏹️ 녹화 중지';
                btn.classList.add('recording');
            }
        });
    } else {
        // 녹화 중지
        stopRecording();
        btn.textContent = '🎥 영상 저장';
        btn.classList.remove('recording');
    }
}

// 브라우저 지원 확인
function isRecordingSupported() {
    return typeof MediaRecorder !== 'undefined' &&
           typeof HTMLCanvasElement.prototype.captureStream !== 'undefined';
}

console.log('🎥 녹화 모듈 로드 완료');
console.log('녹화 지원:', isRecordingSupported() ? '✅' : '❌');
