// 실시간 미리보기 업데이트
document.addEventListener('DOMContentLoaded', function() {
    const senderInput = document.getElementById('sender');
    const receiverInput = document.getElementById('receiver');
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('charCount');

    const previewSender = document.getElementById('previewSender');
    const previewReceiver = document.getElementById('previewReceiver');
    const previewMessage = document.getElementById('previewMessage');

    // 실시간 미리보기
    senderInput.addEventListener('input', function() {
        previewSender.textContent = this.value || '___';
    });

    receiverInput.addEventListener('input', function() {
        previewReceiver.textContent = this.value || '___';
    });

    messageInput.addEventListener('input', function() {
        const text = this.value || '여기에 메시지가 표시됩니다...';
        previewMessage.textContent = text;
        charCount.textContent = this.value.length;

        // 글자 수 경고
        if (this.value.length > 450) {
            charCount.style.color = '#d63031';
        } else {
            charCount.style.color = '#999';
        }
    });
});

// AR 미리보기 (자신이 작성한 카드 미리보기)
function previewCard() {
    const sender = document.getElementById('sender').value.trim();
    const receiver = document.getElementById('receiver').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!sender || !receiver || !message) {
        alert('모든 필드를 입력해주세요! 😊');
        return;
    }

    // 데이터를 localStorage에 저장
    const cardData = {
        sender: sender,
        receiver: receiver,
        message: message,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('previewCard', JSON.stringify(cardData));

    // AR 뷰어 페이지로 이동
    window.location.href = 'view.html?preview=true';
}

// 카드 보내기
function sendCard() {
    const sender = document.getElementById('sender').value.trim();
    const receiver = document.getElementById('receiver').value.trim();
    const receiverEmail = document.getElementById('receiverEmail').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!sender || !receiver || !receiverEmail || !message) {
        alert('모든 필드를 입력해주세요! 😊');
        return;
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(receiverEmail)) {
        alert('올바른 이메일 주소를 입력해주세요! 📧');
        return;
    }

    // 카드 데이터 생성
    const cardData = {
        id: generateCardId(),
        sender: sender,
        receiver: receiver,
        receiverEmail: receiverEmail,
        message: message,
        timestamp: new Date().toISOString()
    };

    // 로컬 스토리지에 저장 (실제로는 서버에 저장)
    saveCardToStorage(cardData);

    // 카드 링크 생성
    const cardLink = `${window.location.origin}/christmas-card/view.html?id=${cardData.id}`;

    // 이메일 전송 시뮬레이션
    sendEmailSimulation(receiverEmail, receiver, sender, cardLink);

    // 성공 모달 표시
    showSuccessModal(cardLink);
}

// 카드 ID 생성
function generateCardId() {
    return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 카드 데이터 저장
function saveCardToStorage(cardData) {
    const cards = JSON.parse(localStorage.getItem('christmasCards') || '[]');
    cards.push(cardData);
    localStorage.setItem('christmasCards', JSON.stringify(cards));
}

// 이메일 전송 시뮬레이션
function sendEmailSimulation(email, receiverName, senderName, link) {
    console.log('📧 이메일 전송 중...');
    console.log('수신자:', email);
    console.log('내용:', `${receiverName}님께 ${senderName}님이 마법의 크리스마스 카드를 보냈습니다!`);
    console.log('링크:', link);

    // 실제 구현 시에는 백엔드 API를 호출하여 이메일 전송
    // fetch('/api/send-email', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         to: email,
    //         subject: `🎅 ${senderName}님이 마법의 크리스마스 카드를 보냈습니다!`,
    //         body: `안녕하세요 ${receiverName}님,\n\n${senderName}님이 특별한 AR 크리스마스 카드를 보냈습니다!\n\n아래 링크를 클릭하여 마법 같은 경험을 해보세요:\n${link}\n\n메리 크리스마스! 🎄`
    //     })
    // });
}

// 성공 모달 표시
function showSuccessModal(link) {
    const modal = document.getElementById('successModal');
    const linkElement = document.getElementById('cardLink');

    linkElement.textContent = link;
    modal.classList.add('show');

    // 링크 복사 기능
    linkElement.style.cursor = 'pointer';
    linkElement.onclick = function() {
        navigator.clipboard.writeText(link).then(() => {
            alert('링크가 클립보드에 복사되었습니다! 📋');
        });
    };
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});
