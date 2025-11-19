// AR 씬 관리
let scene, camera, renderer;
let video, canvas;
let cardData = null;
let isExperienceStarted = false;
let animationState = 'idle'; // idle, intro, dancing, gift, letter, complete

// 초기화
function initARScene() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');

    // Three.js 씬 설정
    scene = new THREE.Scene();

    // 카메라 설정
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    // 렌더러 설정
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 포인트 라이트 (크리스마스 분위기)
    const pointLight1 = new THREE.PointLight(0xff0000, 1, 50);
    pointLight1.position.set(-5, 3, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00ff00, 1, 50);
    pointLight2.position.set(5, 3, 0);
    scene.add(pointLight2);

    // 바닥 평면 (그림자 받기용)
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 창 크기 조절 이벤트
    window.addEventListener('resize', onWindowResize);

    console.log('✅ AR 씬 초기화 완료');
}

// 창 크기 조절
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 카메라 접근
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // 후면 카메라
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = stream;
        video.play();

        console.log('✅ 카메라 시작');
        return true;
    } catch (error) {
        console.error('❌ 카메라 접근 실패:', error);
        alert('카메라 접근이 필요합니다. 권한을 허용해주세요.');
        return false;
    }
}

// 경험 시작
async function startExperience() {
    const startScreen = document.getElementById('start-screen');
    const loading = document.getElementById('loading');
    const instructions = document.getElementById('instructions');

    startScreen.style.display = 'none';
    loading.style.display = 'block';

    // 카드 데이터 로드
    loadCardData();

    // 씬 초기화
    initARScene();

    // 카메라 시작
    const cameraStarted = await startCamera();

    if (!cameraStarted) {
        startScreen.style.display = 'flex';
        loading.style.display = 'none';
        return;
    }

    // 캐릭터 초기화
    await initCharacters();

    loading.style.display = 'none';
    instructions.style.display = 'block';

    isExperienceStarted = true;

    // 애니메이션 시작
    animate();

    // 3초 후 인트로 시작
    setTimeout(() => {
        startIntroAnimation();
    }, 2000);
}

// 카드 데이터 로드
function loadCardData() {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('id');
    const isPreview = urlParams.get('preview');

    if (isPreview) {
        // 미리보기 모드
        cardData = JSON.parse(localStorage.getItem('previewCard'));
    } else if (cardId) {
        // 실제 카드 로드
        const cards = JSON.parse(localStorage.getItem('christmasCards') || '[]');
        cardData = cards.find(card => card.id === cardId);
    }

    if (!cardData) {
        cardData = {
            sender: '산타',
            receiver: '친구',
            message: '메리 크리스마스! 행복한 연말 보내세요! 🎄'
        };
    }

    console.log('📧 카드 데이터:', cardData);
}

// 애니메이션 루프
function animate() {
    if (!isExperienceStarted) return;

    requestAnimationFrame(animate);

    // 캐릭터 애니메이션 업데이트
    updateCharacterAnimations();

    // 씬 렌더링
    renderer.render(scene, camera);
}

// 액션 버튼 표시
function showActionButtons() {
    const actionButtons = document.getElementById('action-buttons');
    actionButtons.classList.add('show');
}

// 답장 보내기
function sendReply() {
    if (cardData && cardData.sender) {
        const message = prompt(`${cardData.sender}님께 답장을 작성하세요:`);
        if (message) {
            alert(`답장이 전송되었습니다! 💌\n\n"${message}"`);
            // 실제로는 백엔드로 전송
        }
    }
}

// 새 카드 만들기
function createNew() {
    if (confirm('새로운 크리스마스 카드를 만드시겠습니까?')) {
        window.location.href = 'index.html';
    }
}

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎄 AR 크리스마스 카드 준비 완료');
});
