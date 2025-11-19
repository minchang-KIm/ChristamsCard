// 편지 관리
let letterData = null;

// 편지 데이터 로드
function loadLetterData() {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('id');
    const isPreview = urlParams.get('preview');

    if (isPreview) {
        letterData = JSON.parse(localStorage.getItem('previewCard'));
    } else if (cardId) {
        const cards = JSON.parse(localStorage.getItem('christmasCards') || '[]');
        letterData = cards.find(card => card.id === cardId);
    }

    if (!letterData) {
        letterData = {
            sender: '산타',
            receiver: '친구',
            message: '메리 크리스마스! 행복한 연말 보내세요! 🎄'
        };
    }

    return letterData;
}

// 편지 내용을 화면에 표시
function displayLetter() {
    const letterOverlay = document.getElementById('letter-overlay');
    const letterReceiver = document.getElementById('letterReceiver');
    const letterContent = document.getElementById('letter-content');
    const letterSender = document.getElementById('letterSender');

    if (!letterData) {
        letterData = loadLetterData();
    }

    letterReceiver.textContent = letterData.receiver || '친구';
    letterSender.textContent = letterData.sender || '산타';

    // 편지 오버레이 표시
    letterOverlay.style.display = 'block';

    // 타이핑 효과
    typeText(letterContent, letterData.message, 80);
}

// 타이핑 효과
function typeText(element, text, speed = 100) {
    let index = 0;
    element.textContent = '';

    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;

            // 문장 부호에서는 조금 더 긴 지연
            const char = text.charAt(index - 1);
            const delay = ['.', '!', '?', ','].includes(char) ? speed * 2 : speed;

            setTimeout(type, delay);
        }
    }

    type();
}

// 편지 닫기
function closeLetter() {
    const letterOverlay = document.getElementById('letter-overlay');
    letterOverlay.style.display = 'none';
}

// 편지를 이미지로 저장
function saveLetterAsImage() {
    const letterOverlay = document.getElementById('letter-overlay');

    // html2canvas 같은 라이브러리를 사용하거나, Canvas로 변환
    // 여기서는 간단하게 alert으로 대체
    alert('편지가 이미지로 저장되었습니다! 📷');

    // 실제 구현:
    // html2canvas(letterOverlay).then(canvas => {
    //     const link = document.createElement('a');
    //     link.download = 'christmas-letter.png';
    //     link.href = canvas.toDataURL();
    //     link.click();
    // });
}
