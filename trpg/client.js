// TRPG 클라이언트 JavaScript

const socket = io();

// 전역 상태
const gameState = {
    playerName: '',
    playerId: null,
    roomCode: null,
    isHost: false,
    currentScene: null,
    room: null,
    pendingRequirement: null,
    charismaCheckId: null,
    gameStartTime: null,
    videoStream: null
};

// DOM 요소
const elements = {
    // 화면
    mainMenu: document.getElementById('mainMenu'),
    lobbyScreen: document.getElementById('lobbyScreen'),
    gameScreen: document.getElementById('gameScreen'),

    // 메인 메뉴
    createRoomBtn: document.getElementById('createRoomBtn'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    nameInputSection: document.getElementById('nameInputSection'),
    joinInputSection: document.getElementById('joinInputSection'),
    playerNameInput: document.getElementById('playerNameInput'),
    confirmNameBtn: document.getElementById('confirmNameBtn'),
    roomCodeInput: document.getElementById('roomCodeInput'),
    confirmJoinBtn: document.getElementById('confirmJoinBtn'),
    errorMessage: document.getElementById('errorMessage'),

    // 로비
    displayRoomCode: document.getElementById('displayRoomCode'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    playersList: document.getElementById('playersList'),
    playerCount: document.getElementById('playerCount'),
    characterSelection: document.getElementById('characterSelection'),
    leaveLobbyBtn: document.getElementById('leaveLobbyBtn'),
    startGameBtn: document.getElementById('startGameBtn'),

    // 게임
    sceneTitle: document.getElementById('sceneTitle'),
    gameTimer: document.getElementById('gameTimer'),
    storyContent: document.getElementById('storyContent'),
    choicesContainer: document.getElementById('choicesContainer'),
    playersStatus: document.getElementById('playersStatus'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),

    // 주사위 모달
    diceModal: document.getElementById('diceModal'),
    diceDescription: document.getElementById('diceDescription'),
    diceRequirement: document.getElementById('diceRequirement'),
    diceStat: document.getElementById('diceStat'),
    diceDisplay: document.getElementById('diceDisplay'),
    rollDiceBtn: document.getElementById('rollDiceBtn'),
    diceResult: document.getElementById('diceResult'),
    continueDiceBtn: document.getElementById('continueDiceBtn'),

    // 카리스마 모달
    charismaModal: document.getElementById('charismaModal'),
    charismaDescription: document.getElementById('charismaDescription'),
    cameraSection: document.getElementById('cameraSection'),
    charismaPlayerName: document.getElementById('charismaPlayerName'),
    charismaVideo: document.getElementById('charismaVideo'),
    votingSection: document.getElementById('votingSection'),
    votingPlayerName: document.getElementById('votingPlayerName'),
    voteCount: document.getElementById('voteCount'),
    totalVoters: document.getElementById('totalVoters'),
    charismaResult: document.getElementById('charismaResult'),
    avgScore: document.getElementById('avgScore'),
    continueCharismaBtn: document.getElementById('continueCharismaBtn'),

    // 종료 모달
    endModal: document.getElementById('endModal'),
    endContent: document.getElementById('endContent'),
    totalPlayTime: document.getElementById('totalPlayTime'),
    completedScenes: document.getElementById('completedScenes'),
    backToMenuBtn: document.getElementById('backToMenuBtn')
};

// ===== 초기화 =====
function init() {
    createSnowfall();
    setupEventListeners();
    setupSocketListeners();
}

// 눈 내리기 효과
function createSnowfall() {
    const snowContainer = document.getElementById('snowContainer');
    const snowflakeCount = 50;

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        snowflake.style.opacity = Math.random() * 0.6 + 0.4;
        snowContainer.appendChild(snowflake);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 메인 메뉴
    elements.createRoomBtn.addEventListener('click', showNameInput);
    elements.joinRoomBtn.addEventListener('click', showJoinInput);
    elements.confirmNameBtn.addEventListener('click', handleCreateRoom);
    elements.confirmJoinBtn.addEventListener('click', handleJoinRoom);
    elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCreateRoom();
    });
    elements.roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleJoinRoom();
    });

    // 로비
    elements.copyCodeBtn.addEventListener('click', copyRoomCode);
    elements.leaveLobbyBtn.addEventListener('click', leaveLobby);
    elements.startGameBtn.addEventListener('click', startGame);

    // 게임
    elements.sendChatBtn.addEventListener('click', sendChatMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // 주사위
    elements.rollDiceBtn.addEventListener('click', rollDice);
    elements.continueDiceBtn.addEventListener('click', closeDiceModal);

    // 카리스마
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => voteCharisma(parseInt(btn.dataset.score)));
    });
    elements.continueCharismaBtn.addEventListener('click', closeCharismaModal);

    // 종료
    elements.backToMenuBtn.addEventListener('click', backToMenu);
}

// Socket.io 리스너 설정
function setupSocketListeners() {
    socket.on('connect', () => {
        console.log('Connected to server');
        gameState.playerId = socket.id;
    });

    socket.on('room_created', (data) => {
        gameState.roomCode = data.roomCode;
        gameState.isHost = true;
        updateRoomData(data.room);
        showScreen('lobbyScreen');
    });

    socket.on('room_joined', (data) => {
        updateRoomData(data.room);
        showScreen('lobbyScreen');
    });

    socket.on('player_joined', (data) => {
        updateRoomData(data.room);
        addChatSystemMessage(`${data.player.name}님이 입장했습니다.`);
    });

    socket.on('player_left', (data) => {
        updateRoomData(data.room);
        addChatSystemMessage(`${data.playerName}님이 퇴장했습니다.`);
    });

    socket.on('character_selected', (data) => {
        updateRoomData(data.room);
    });

    socket.on('game_started', (data) => {
        gameState.gameStartTime = Date.now();
        updateRoomData(data.room);
        displayScene(data.scene);
        showScreen('gameScreen');
        startGameTimer();
        addChatSystemMessage('게임이 시작되었습니다! 🎄');
    });

    socket.on('scene_changed', (data) => {
        displayScene(data.scene);
        updateRoomData(data.room);
    });

    socket.on('dice_rolled', (data) => {
        addChatSystemMessage(
            `🎲 ${data.playerName}님이 d${data.diceType}를 굴렸습니다: ${data.result}`
        );
    });

    socket.on('charisma_check_started', (data) => {
        addChatSystemMessage(
            `✨ ${data.playerName}님의 카리스마 체크가 시작되었습니다!`
        );
    });

    socket.on('charisma_vote_received', (data) => {
        addChatSystemMessage(
            `⭐ ${data.voterName}님이 투표했습니다. (${data.totalVotes}/${data.requiredVotes})`
        );
    });

    socket.on('charisma_check_completed', (data) => {
        showCharismaResult(data.avgScore, data.success);
    });

    socket.on('chat_message', (data) => {
        addChatMessage(data.playerName, data.message);
    });

    socket.on('game_finished', (data) => {
        showGameEnd(data.room);
    });

    socket.on('error', (data) => {
        showError(data.message || '오류가 발생했습니다.');
    });
}

// ===== 화면 전환 =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ===== 메인 메뉴 =====
function showNameInput() {
    elements.nameInputSection.classList.remove('hidden');
    elements.joinInputSection.classList.add('hidden');
    elements.playerNameInput.focus();
}

function showJoinInput() {
    elements.joinInputSection.classList.remove('hidden');
    elements.nameInputSection.classList.add('hidden');
    elements.playerNameInput.value = '';
    elements.roomCodeInput.focus();
}

function handleCreateRoom() {
    const name = elements.playerNameInput.value.trim();
    if (!name) {
        showError('이름을 입력해주세요.');
        return;
    }
    gameState.playerName = name;
    socket.emit('create_trpg_room', { playerName: name });
}

function handleJoinRoom() {
    const name = elements.playerNameInput.value.trim();
    const code = elements.roomCodeInput.value.trim().toUpperCase();

    if (!name) {
        showError('이름을 입력해주세요.');
        return;
    }
    if (!code || code.length !== 6) {
        showError('올바른 방 코드를 입력해주세요.');
        return;
    }

    gameState.playerName = name;
    socket.emit('join_trpg_room', { roomCode: code, playerName: name });
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 3000);
}

// ===== 로비 =====
function updateRoomData(room) {
    if (!room) return;

    gameState.room = room;
    gameState.roomCode = room.code;

    // 방 코드 표시
    elements.displayRoomCode.textContent = room.code;
    elements.playerCount.textContent = room.playerCount;

    // 플레이어 목록 업데이트
    updatePlayersList(room.players);

    // 캐릭터 선택 (처음에만)
    if (elements.characterSelection.children.length === 0) {
        loadCharacterSelection();
    }

    // 시작 버튼 활성화 (호스트이고 모두 준비된 경우)
    if (gameState.isHost) {
        const allReady = room.players.every(p => p.ready);
        elements.startGameBtn.disabled = !allReady || room.playerCount === 0;
    }

    // 게임 중이면 플레이어 상태 업데이트
    if (room.state === 'playing') {
        updatePlayersStatus(room.players);
    }
}

function updatePlayersList(players) {
    elements.playersList.innerHTML = '';
    players.forEach(player => {
        const card = document.createElement('div');
        card.className = `player-card ${player.ready ? 'ready' : ''}`;

        const info = document.createElement('div');
        info.className = 'player-info';

        const name = document.createElement('span');
        name.textContent = player.name;
        info.appendChild(name);

        if (player.isHost) {
            const badge = document.createElement('span');
            badge.className = 'player-badge';
            badge.textContent = '방장';
            info.appendChild(badge);
        }

        card.appendChild(info);

        const status = document.createElement('div');
        if (player.ready && player.character) {
            status.textContent = `✅ ${player.character.name}`;
            status.style.color = '#4caf50';
        } else {
            status.textContent = '준비 중...';
            status.style.color = '#999';
        }
        card.appendChild(status);

        elements.playersList.appendChild(card);
    });
}

function loadCharacterSelection() {
    const classes = [
        {
            id: "elf",
            name: "산타의 요정",
            description: "빠르고 손재주가 좋아요",
            bonuses: { agility: 2, charisma: 1 }
        },
        {
            id: "reindeer",
            name: "루돌프의 친구",
            description: "힘이 세고 용감해요",
            bonuses: { strength: 2, wisdom: 1 }
        },
        {
            id: "snowman",
            name: "마법 눈사람",
            description: "추위에 강하고 현명해요",
            bonuses: { wisdom: 2, health: 1 }
        },
        {
            id: "angel",
            name: "크리스마스 천사",
            description: "카리스마가 뛰어나요",
            bonuses: { charisma: 3 }
        }
    ];

    classes.forEach(charClass => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.classId = charClass.id;

        const name = document.createElement('div');
        name.className = 'character-name';
        name.textContent = charClass.name;

        const desc = document.createElement('div');
        desc.className = 'character-description';
        desc.textContent = charClass.description;

        const bonuses = document.createElement('div');
        bonuses.className = 'character-bonuses';
        bonuses.textContent = '보너스: ' + Object.entries(charClass.bonuses)
            .map(([k, v]) => `${k} +${v}`)
            .join(', ');

        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(bonuses);

        card.addEventListener('click', () => selectCharacter(charClass.id, card));

        elements.characterSelection.appendChild(card);
    });
}

function selectCharacter(classId, cardElement) {
    // 기존 선택 해제
    document.querySelectorAll('.character-card').forEach(c => {
        c.classList.remove('selected');
    });

    // 새로운 선택
    cardElement.classList.add('selected');

    // 서버에 전송
    socket.emit('select_character', { characterClass: classId });
}

function copyRoomCode() {
    navigator.clipboard.writeText(gameState.roomCode);
    elements.copyCodeBtn.textContent = '✅ 복사됨!';
    setTimeout(() => {
        elements.copyCodeBtn.textContent = '📋 복사';
    }, 2000);
}

function leaveLobby() {
    socket.disconnect();
    location.reload();
}

function startGame() {
    socket.emit('start_trpg_game', { roomCode: gameState.roomCode });
}

// ===== 게임 화면 =====
function displayScene(scene) {
    if (!scene) return;

    gameState.currentScene = scene;

    // 제목 업데이트
    elements.sceneTitle.textContent = scene.title;

    // 스토리 내용 업데이트
    elements.storyContent.innerHTML = `<p>${scene.description}</p>`;

    // 선택지 업데이트
    displayChoices(scene.choices);
}

function displayChoices(choices) {
    elements.choicesContainer.innerHTML = '';

    if (!choices || choices.length === 0) {
        // 게임 종료
        return;
    }

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;

        if (choice.requirement) {
            if (choice.requirement.type === 'dice') {
                btn.classList.add('requires-dice');
                btn.textContent += ' 🎲';
            } else if (choice.requirement.type === 'charisma') {
                btn.classList.add('requires-charisma');
                btn.textContent += ' ✨';
            } else if (choice.requirement.type === 'group_dice') {
                btn.classList.add('requires-dice');
                btn.textContent += ' 🎲 (협동)';
            }
        }

        btn.addEventListener('click', () => makeChoice(choice.id));

        elements.choicesContainer.appendChild(btn);
    });
}

function makeChoice(choiceId) {
    socket.emit('make_choice', {
        roomCode: gameState.roomCode,
        choiceId: choiceId
    });

    // 서버 응답 대기
    socket.once('choice_result', (data) => {
        if (data.requirementType === 'dice') {
            showDiceModal(data.requirement, data.nextScene);
        } else if (data.requirementType === 'charisma') {
            showCharismaModal(data.requirement, data.nextScene);
        } else if (data.requirementType === 'group_dice') {
            showGroupDiceModal(data.requirement, data.nextScene);
        }
    });
}

function updatePlayersStatus(players) {
    elements.playersStatus.innerHTML = '';

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-status-card';

        const name = document.createElement('div');
        name.className = 'player-status-name';
        name.textContent = player.name;

        const charClass = document.createElement('div');
        charClass.className = 'player-status-class';
        charClass.textContent = player.character ? player.character.name : '캐릭터 없음';

        const health = document.createElement('div');
        health.className = 'player-status-health';
        health.textContent = `❤️ ${player.currentHealth}/${player.stats.health}`;

        card.appendChild(name);
        card.appendChild(charClass);
        card.appendChild(health);

        elements.playersStatus.appendChild(card);
    });
}

function startGameTimer() {
    setInterval(() => {
        if (!gameState.gameStartTime) return;

        const elapsed = Date.now() - gameState.gameStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);

        elements.gameTimer.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// ===== 채팅 =====
function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;

    socket.emit('send_chat', {
        roomCode: gameState.roomCode,
        message: message
    });

    elements.chatInput.value = '';
}

function addChatMessage(sender, message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';

    const senderSpan = document.createElement('span');
    senderSpan.className = 'chat-message-sender';
    senderSpan.textContent = sender + ':';

    msgDiv.appendChild(senderSpan);
    msgDiv.appendChild(document.createTextNode(message));

    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addChatSystemMessage(message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';
    msgDiv.style.fontStyle = 'italic';
    msgDiv.style.color = '#ffd700';
    msgDiv.textContent = '🎄 ' + message;

    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// ===== 주사위 =====
function showDiceModal(requirement, nextScene) {
    gameState.pendingRequirement = { requirement, nextScene };

    elements.diceDescription.textContent = '주사위를 굴려 도전하세요!';
    elements.diceRequirement.textContent = requirement.difficulty;
    elements.diceStat.textContent = requirement.stat;
    elements.diceDisplay.textContent = '?';
    elements.diceResult.classList.add('hidden');
    elements.rollDiceBtn.disabled = false;

    elements.diceModal.classList.add('active');
}

function showGroupDiceModal(requirement, nextScene) {
    // 그룹 주사위는 호스트만 굴림
    if (gameState.isHost) {
        showDiceModal(requirement, nextScene);
    } else {
        addChatSystemMessage('방장이 주사위를 굴립니다...');
    }
}

function rollDice() {
    elements.rollDiceBtn.disabled = true;
    elements.diceDisplay.classList.add('rolling');

    // 주사위 애니메이션
    let count = 0;
    const interval = setInterval(() => {
        elements.diceDisplay.textContent = Math.floor(Math.random() * 20) + 1;
        count++;
        if (count > 10) {
            clearInterval(interval);
            finishDiceRoll();
        }
    }, 100);
}

function finishDiceRoll() {
    socket.emit('roll_dice', {
        roomCode: gameState.roomCode,
        diceType: 20
    });

    socket.once('dice_roll_result', (data) => {
        elements.diceDisplay.classList.remove('rolling');
        elements.diceDisplay.textContent = data.result;

        const { requirement, nextScene } = gameState.pendingRequirement;
        const success = data.result >= requirement.difficulty;

        elements.diceResult.classList.remove('hidden');
        const resultText = elements.diceResult.querySelector('.result-text');

        if (success) {
            resultText.textContent = `성공! 🎉 (${data.result} >= ${requirement.difficulty})`;
            resultText.className = 'result-text success';
        } else {
            resultText.textContent = `실패... (${data.result} < ${requirement.difficulty})`;
            resultText.className = 'result-text failure';
        }

        // 서버에 결과 전송
        socket.emit('dice_check_complete', {
            roomCode: gameState.roomCode,
            success: success,
            nextScene: nextScene
        });
    });
}

function closeDiceModal() {
    elements.diceModal.classList.remove('active');
    gameState.pendingRequirement = null;
}

// ===== 카리스마 체크 =====
function showCharismaModal(requirement, nextScene) {
    gameState.pendingRequirement = { requirement, nextScene };

    elements.charismaDescription.textContent = requirement.description;
    elements.cameraSection.classList.add('hidden');
    elements.votingSection.classList.add('hidden');
    elements.charismaResult.classList.add('hidden');

    elements.charismaModal.classList.add('active');

    // 카리스마 체크 시작
    socket.emit('start_charisma_check', {
        roomCode: gameState.roomCode,
        description: requirement.description
    });

    socket.once('charisma_check_id', (data) => {
        gameState.charismaCheckId = data.checkId;

        // 체크 대상자는 카메라 켜기
        if (data.isYou) {
            showCamera();
        } else {
            // 다른 플레이어는 투표 준비
            setTimeout(() => showVoting(data.playerName), 3000);
        }
    });
}

async function showCamera() {
    elements.cameraSection.classList.remove('hidden');
    elements.charismaPlayerName.textContent = gameState.playerName;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        gameState.videoStream = stream;
        elements.charismaVideo.srcObject = stream;

        // 10초 후 카메라 종료
        setTimeout(() => {
            stopCamera();
            waitForVotes();
        }, 10000);
    } catch (error) {
        console.error('Camera error:', error);
        elements.cameraSection.classList.add('hidden');
        addChatSystemMessage('카메라를 사용할 수 없습니다. 투표만 진행합니다.');
        waitForVotes();
    }
}

function stopCamera() {
    if (gameState.videoStream) {
        gameState.videoStream.getTracks().forEach(track => track.stop());
        gameState.videoStream = null;
    }
    elements.charismaVideo.srcObject = null;
    elements.cameraSection.classList.add('hidden');
}

function waitForVotes() {
    elements.votingSection.classList.add('hidden');
    addChatSystemMessage('다른 플레이어들의 투표를 기다리는 중...');
}

function showVoting(playerName) {
    elements.votingSection.classList.remove('hidden');
    elements.votingPlayerName.textContent = playerName;

    const totalPlayers = gameState.room.playerCount;
    elements.totalVoters.textContent = totalPlayers - 1;
    elements.voteCount.textContent = '0';
}

function voteCharisma(score) {
    socket.emit('vote_charisma', {
        roomCode: gameState.roomCode,
        checkId: gameState.charismaCheckId,
        score: score
    });

    elements.votingSection.classList.add('hidden');
    addChatSystemMessage(`${score}점을 투표했습니다.`);

    // 투표 완료 후 결과 대기
    socket.once('vote_complete', () => {
        // 모든 투표가 완료되면 서버가 자동으로 완료 처리
    });
}

function showCharismaResult(avgScore, success) {
    elements.charismaResult.classList.remove('hidden');
    elements.avgScore.textContent = avgScore.toFixed(1);

    const resultText = elements.charismaResult.querySelector('.result-text');
    if (success) {
        resultText.textContent = '성공! 플레이어들이 감동했습니다! 🎉';
        resultText.className = 'result-text success';
    } else {
        resultText.textContent = '아쉽게도 설득에 실패했습니다...';
        resultText.className = 'result-text failure';
    }
}

function closeCharismaModal() {
    stopCamera();
    elements.charismaModal.classList.remove('active');
    gameState.pendingRequirement = null;
    gameState.charismaCheckId = null;
}

// ===== 게임 종료 =====
function showGameEnd(room) {
    const playTime = Date.now() - gameState.gameStartTime;
    const minutes = Math.floor(playTime / 60000);
    const seconds = Math.floor((playTime % 60000) / 1000);

    elements.totalPlayTime.textContent =
        `${minutes}분 ${seconds}초`;
    elements.completedScenes.textContent = room.sceneHistory?.length || 0;

    elements.endModal.classList.add('active');
}

function backToMenu() {
    location.reload();
}

// ===== 시작 =====
init();
