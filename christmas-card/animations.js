// 애니메이션 시퀀스 관리
let animationTime = 0;
let animationPhase = 'idle'; // idle, intro, dancing, tree, gift, letter, complete

// 인트로 애니메이션 시작
function startIntroAnimation() {
    console.log('🎬 인트로 애니메이션 시작');
    animationPhase = 'intro';
    animationTime = 0;

    const instructions = document.getElementById('instructions');
    instructions.textContent = '🎅 산타와 친구들이 나타나고 있어요!';

    // 캐릭터들이 튀어나오는 애니메이션
    animateCharacterEntrance();
}

// 캐릭터 등장 애니메이션
function animateCharacterEntrance() {
    const duration = 2000; // 2초
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 이징 함수 (bounce out)
        const eased = bounceOut(progress);

        // 캐릭터들이 밑에서 위로 튀어나옴
        if (characters.santa) {
            characters.santa.position.y = -5 + eased * 5; // -5에서 0으로
        }

        if (characters.elf1) {
            characters.elf1.position.y = -5 + eased * 4.5;
            characters.elf1.position.x = -3 + Math.sin(elapsed * 0.005) * 0.5;
        }

        if (characters.elf2) {
            characters.elf2.position.y = -5 + eased * 4.5;
            characters.elf2.position.x = 3 + Math.sin(elapsed * 0.005 + Math.PI) * 0.5;
        }

        if (characters.rudolph) {
            characters.rudolph.position.y = -5 + eased * 4;
            // 루돌프 코 깜빡이기
            if (characters.rudolph.userData.nose) {
                characters.rudolph.userData.nose.material.emissiveIntensity =
                    0.5 + Math.sin(elapsed * 0.01) * 0.3;
            }
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 등장 완료 후 춤 시작
            setTimeout(() => {
                startDancingAnimation();
            }, 500);
        }
    }

    animate();
}

// 춤추기 애니메이션
function startDancingAnimation() {
    console.log('💃 춤추기 애니메이션 시작');
    animationPhase = 'dancing';
    animationTime = 0;

    const instructions = document.getElementById('instructions');
    instructions.textContent = '🎵 신나는 춤 파티가 시작됐어요!';

    // 3초 동안 춤추기
    setTimeout(() => {
        startTreeAnimation();
    }, 3000);
}

// 트리 세우기 애니메이션
function startTreeAnimation() {
    console.log('🎄 트리 세우기 시작');
    animationPhase = 'tree';

    const instructions = document.getElementById('instructions');
    instructions.textContent = '🎄 크리스마스 트리를 세우고 있어요!';

    // 트리 생성
    christmasTree = createChristmasTree();
    scene.add(christmasTree);

    const duration = 2000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 트리가 자라나는 효과
        const scale = easeOutElastic(progress);
        christmasTree.scale.set(scale, scale, scale);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            setTimeout(() => {
                startGiftAnimation();
            }, 1000);
        }
    }

    animate();
}

// 선물 주기 애니메이션
function startGiftAnimation() {
    console.log('🎁 선물 주기 시작');
    animationPhase = 'gift';

    const instructions = document.getElementById('instructions');
    instructions.textContent = '🎁 산타가 선물을 주려고 해요!';

    // 선물 상자 생성
    giftBox = createGiftBox();
    scene.add(giftBox);

    // 산타가 선물을 들고 앞으로
    const duration = 2000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = easeInOutCubic(progress);

        // 선물 상자가 올라옴
        giftBox.position.y = -5 + eased * 5.5;

        // 선물 상자 회전
        giftBox.rotation.y = eased * Math.PI * 2;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            instructions.textContent = '🎁 선물 상자를 탭하여 열어보세요!';

            // 선물 상자 클릭 이벤트
            enableGiftClick();
        }
    }

    animate();
}

// 선물 상자 클릭 가능하게
function enableGiftClick() {
    const canvas = document.getElementById('canvas');
    canvas.style.cursor = 'pointer';

    // 선물 상자 반짝이는 효과
    let pulseTime = 0;
    const pulseInterval = setInterval(() => {
        pulseTime += 0.1;
        if (giftBox) {
            const scale = 1 + Math.sin(pulseTime) * 0.1;
            giftBox.scale.set(scale, scale, scale);
        }
    }, 50);

    // 클릭 이벤트
    function onCanvasClick() {
        clearInterval(pulseInterval);
        canvas.removeEventListener('click', onCanvasClick);
        canvas.style.cursor = 'default';

        openGiftBox();
    }

    canvas.addEventListener('click', onCanvasClick);
}

// 선물 상자 열기
function openGiftBox() {
    console.log('📦 선물 상자 열기');
    animationPhase = 'letter';

    const instructions = document.getElementById('instructions');
    instructions.style.display = 'none';

    // 선물 상자 폭발 효과
    const duration = 1000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 선물 상자가 사라지는 효과
        if (giftBox) {
            giftBox.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
            giftBox.rotation.y += 0.1;

            // 투명도
            giftBox.traverse(child => {
                if (child.material) {
                    child.material.opacity = 1 - progress;
                    child.material.transparent = true;
                }
            });
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 선물 상자 제거
            if (giftBox) {
                scene.remove(giftBox);
            }

            // 편지 표시
            setTimeout(() => {
                showLetter();
            }, 300);
        }
    }

    animate();
}

// 편지 표시
function showLetter() {
    console.log('💌 편지 표시');
    animationPhase = 'letter';

    const letterOverlay = document.getElementById('letter-overlay');
    const letterReceiver = document.getElementById('letterReceiver');
    const letterContent = document.getElementById('letter-content');
    const letterSender = document.getElementById('letterSender');

    // 카드 데이터 채우기
    letterReceiver.textContent = cardData.receiver;
    letterSender.textContent = cardData.sender;

    // 편지 표시
    letterOverlay.style.display = 'block';

    // 타이핑 효과로 편지 내용 표시 & TTS 읽기
    typeLetterWithTTS(letterContent, cardData.message, () => {
        // 편지 읽기 완료
        setTimeout(() => {
            completeExperience();
        }, 2000);
    });
}

// 타이핑 효과 (TTS와 동기화)
function typeLetterWithTTS(element, text, callback) {
    let index = 0;
    element.textContent = '';

    // TTS 시작
    speakText(text);

    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;

            // 글자 속도 (TTS 속도와 비슷하게)
            const delay = text.charAt(index) === ' ' ? 50 : 100;
            setTimeout(type, delay);
        } else {
            if (callback) callback();
        }
    }

    type();
}

// 경험 완료
function completeExperience() {
    console.log('✅ 경험 완료');
    animationPhase = 'complete';

    // 액션 버튼 표시
    showActionButtons();
}

// 캐릭터 애니메이션 업데이트 (루프)
function updateCharacterAnimations() {
    animationTime += 0.016; // ~60fps

    if (animationPhase === 'dancing' || animationPhase === 'tree' || animationPhase === 'gift') {
        // 산타 춤
        if (characters.santa) {
            characters.santa.rotation.y = Math.sin(animationTime * 2) * 0.3;
            characters.santa.position.y = Math.abs(Math.sin(animationTime * 3)) * 0.3;

            if (characters.santa.userData.leftArm) {
                characters.santa.userData.leftArm.rotation.z = Math.PI / 4 + Math.sin(animationTime * 3) * 0.5;
                characters.santa.userData.rightArm.rotation.z = -Math.PI / 4 - Math.sin(animationTime * 3) * 0.5;
            }
        }

        // 엘프들 춤
        if (characters.elf1) {
            characters.elf1.rotation.y = Math.sin(animationTime * 2 + 1) * 0.4;
            characters.elf1.position.y = -0.5 + Math.abs(Math.sin(animationTime * 4)) * 0.4;

            if (characters.elf1.userData.leftArm) {
                characters.elf1.userData.leftArm.rotation.z = Math.PI / 6 + Math.sin(animationTime * 4) * 0.6;
                characters.elf1.userData.rightArm.rotation.z = -Math.PI / 6 - Math.sin(animationTime * 4) * 0.6;
            }
        }

        if (characters.elf2) {
            characters.elf2.rotation.y = Math.sin(animationTime * 2 + 2) * 0.4;
            characters.elf2.position.y = -0.5 + Math.abs(Math.sin(animationTime * 4 + Math.PI)) * 0.4;

            if (characters.elf2.userData.leftArm) {
                characters.elf2.userData.leftArm.rotation.z = Math.PI / 6 + Math.sin(animationTime * 4 + Math.PI) * 0.6;
                characters.elf2.userData.rightArm.rotation.z = -Math.PI / 6 - Math.sin(animationTime * 4 + Math.PI) * 0.6;
            }
        }

        // 루돌프 움직임
        if (characters.rudolph) {
            characters.rudolph.position.y = -1 + Math.abs(Math.sin(animationTime * 2.5)) * 0.3;
            characters.rudolph.rotation.y = Math.sin(animationTime * 1.5) * 0.2;

            // 다리 애니메이션
            if (characters.rudolph.userData.legs) {
                characters.rudolph.userData.legs.forEach((leg, i) => {
                    leg.rotation.x = Math.sin(animationTime * 3 + i * Math.PI / 2) * 0.3;
                });
            }
        }
    }

    // 트리 반짝이기
    if (christmasTree && animationPhase !== 'idle') {
        christmasTree.rotation.y += 0.005;
    }
}

// 이징 함수들
function bounceOut(t) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
        return n1 * t * t;
    } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}

function easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;

    return t === 0 ? 0 : t === 1 ? 1 :
        Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
