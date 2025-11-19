// 캐릭터 생성 및 관리
let characters = {
    santa: null,
    elf1: null,
    elf2: null,
    rudolph: null
};

let christmasTree = null;
let giftBox = null;

// 캐릭터 초기화
async function initCharacters() {
    console.log('🎅 캐릭터 생성 중...');

    // 산타 생성
    characters.santa = createSanta();
    characters.santa.position.set(0, -5, 0); // 화면 밖에서 시작
    scene.add(characters.santa);

    // 엘프 생성
    characters.elf1 = createElf(0xff69b4); // 핑크 엘프
    characters.elf1.position.set(-3, -5, 0);
    scene.add(characters.elf1);

    characters.elf2 = createElf(0x00ff00); // 초록 엘프
    characters.elf2.position.set(3, -5, 0);
    scene.add(characters.elf2);

    // 루돌프 생성
    characters.rudolph = createRudolph();
    characters.rudolph.position.set(0, -5, -2);
    scene.add(characters.rudolph);

    console.log('✅ 캐릭터 생성 완료');
}

// 산타 생성 (귀여운 3D 모델)
function createSanta() {
    const santa = new THREE.Group();

    // 몸통
    const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xdc143c });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    santa.add(body);

    // 머리
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffd1b3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1;
    head.castShadow = true;
    santa.add(head);

    // 모자
    const hatGeometry = new THREE.ConeGeometry(0.5, 0.8, 32);
    const hatMaterial = new THREE.MeshPhongMaterial({ color: 0xdc143c });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 1.7;
    hat.castShadow = true;
    santa.add(hat);

    // 모자 끝 (흰색 폼폼)
    const pomGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const pomMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const pom = new THREE.Mesh(pomGeometry, pomMaterial);
    pom.position.y = 2.1;
    santa.add(pom);

    // 수염
    const beardGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const beardMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const beard = new THREE.Mesh(beardGeometry, beardMaterial);
    beard.position.set(0, 0.7, 0.3);
    beard.scale.set(1, 0.7, 0.8);
    santa.add(beard);

    // 눈
    const eyeGeometry = new THREE.SphereGeometry(0.08, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.1, 0.4);
    santa.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.1, 0.4);
    santa.add(rightEye);

    // 코 (빨간 코)
    const noseGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.95, 0.48);
    santa.add(nose);

    // 팔 (좌)
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.8, 32);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0xdc143c });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 0.3, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    santa.add(leftArm);

    // 팔 (우)
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 0.3, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.castShadow = true;
    santa.add(rightArm);

    santa.userData.type = 'santa';
    santa.userData.leftArm = leftArm;
    santa.userData.rightArm = rightArm;
    santa.scale.set(0.7, 0.7, 0.7);

    return santa;
}

// 엘프 생성
function createElf(color) {
    const elf = new THREE.Group();

    // 몸통
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    elf.add(body);

    // 머리
    const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffd1b3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.8;
    head.castShadow = true;
    elf.add(head);

    // 뾰족 모자
    const hatGeometry = new THREE.ConeGeometry(0.35, 0.7, 32);
    const hatMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 1.3;
    hat.castShadow = true;
    elf.add(hat);

    // 귀 (뾰족한 엘프 귀)
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 32);
    const earMaterial = new THREE.MeshPhongMaterial({ color: 0xffd1b3 });

    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.35, 0.85, 0);
    leftEar.rotation.z = -Math.PI / 2;
    elf.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.35, 0.85, 0);
    rightEar.rotation.z = Math.PI / 2;
    elf.add(rightEar);

    // 눈
    const eyeGeometry = new THREE.SphereGeometry(0.06, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.85, 0.3);
    elf.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.85, 0.3);
    elf.add(rightEye);

    // 팔
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.6, 32);

    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.45, 0.2, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    elf.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.45, 0.2, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    elf.add(rightArm);

    elf.userData.type = 'elf';
    elf.userData.leftArm = leftArm;
    elf.userData.rightArm = rightArm;
    elf.scale.set(0.6, 0.6, 0.6);

    return elf;
}

// 루돌프 생성
function createRudolph() {
    const rudolph = new THREE.Group();

    // 몸통
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    rudolph.add(body);

    // 머리
    const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.8, 0.3, 0);
    head.castShadow = true;
    rudolph.add(head);

    // 빨간 코
    const noseGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const noseMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(1.1, 0.3, 0);
    rudolph.add(nose);

    // 뿔
    const hornGeometry = new THREE.ConeGeometry(0.05, 0.5, 8);
    const hornMaterial = new THREE.MeshPhongMaterial({ color: 0xd2691e });

    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(0.8, 0.8, -0.2);
    leftHorn.rotation.x = -Math.PI / 6;
    rudolph.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(0.8, 0.8, 0.2);
    rightHorn.rotation.x = -Math.PI / 6;
    rudolph.add(rightHorn);

    // 눈
    const eyeGeometry = new THREE.SphereGeometry(0.08, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.95, 0.4, -0.2);
    rudolph.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.95, 0.4, 0.2);
    rudolph.add(rightEye);

    // 다리 4개
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.6, 32);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });

    const legs = [];
    const positions = [
        { x: -0.4, z: -0.3 },
        { x: -0.4, z: 0.3 },
        { x: 0.4, z: -0.3 },
        { x: 0.4, z: 0.3 }
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos.x, -0.9, pos.z);
        leg.castShadow = true;
        rudolph.add(leg);
        legs.push(leg);
    });

    rudolph.userData.type = 'rudolph';
    rudolph.userData.nose = nose;
    rudolph.userData.legs = legs;
    rudolph.scale.set(0.7, 0.7, 0.7);

    return rudolph;
}

// 크리스마스 트리 생성
function createChristmasTree() {
    const tree = new THREE.Group();

    // 나무 몸통
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 32);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.4;
    trunk.castShadow = true;
    tree.add(trunk);

    // 나무 잎 (3단)
    const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });

    const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 8), leafMaterial);
    leaf1.position.y = 1.5;
    leaf1.castShadow = true;
    tree.add(leaf1);

    const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(1, 1.2, 8), leafMaterial);
    leaf2.position.y = 2.2;
    leaf2.castShadow = true;
    tree.add(leaf2);

    const leaf3 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 8), leafMaterial);
    leaf3.position.y = 2.8;
    leaf3.castShadow = true;
    tree.add(leaf3);

    // 별 (꼭대기)
    const starGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const starMaterial = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.y = 3.5;
    tree.add(star);

    // 장식 (반짝이는 구슬들)
    const ornamentGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    const colors = [0xff0000, 0x0000ff, 0xffd700, 0xff1493];

    for (let i = 0; i < 12; i++) {
        const ornament = new THREE.Mesh(
            ornamentGeometry,
            new THREE.MeshPhongMaterial({
                color: colors[i % colors.length],
                emissive: colors[i % colors.length],
                emissiveIntensity: 0.3
            })
        );

        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.6 + (i % 3) * 0.2;
        const height = 1.2 + (i % 3) * 0.6;

        ornament.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );

        tree.add(ornament);
    }

    tree.position.set(-2, -2, -1);
    tree.scale.set(0, 0, 0); // 처음엔 숨김

    return tree;
}

// 선물 상자 생성
function createGiftBox() {
    const gift = new THREE.Group();

    // 상자
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xff1493 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.castShadow = true;
    gift.add(box);

    // 리본 (가로)
    const ribbonGeometry = new THREE.BoxGeometry(1.1, 0.15, 0.15);
    const ribbonMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });

    const ribbon1 = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    ribbon1.position.y = 0.5;
    gift.add(ribbon1);

    // 리본 (세로)
    const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 0.15), ribbonMaterial);
    ribbon2.position.y = 0.5;
    gift.add(ribbon2);

    // 리본 (대각선)
    const ribbon3 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.1), ribbonMaterial);
    ribbon3.position.y = 0.5;
    gift.add(ribbon3);

    // 리본 장식 (위)
    const bowGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const bow = new THREE.Mesh(bowGeometry, ribbonMaterial);
    bow.position.y = 1;
    gift.add(bow);

    gift.position.set(0, -5, 0);
    gift.userData.box = box;
    gift.userData.type = 'gift';

    return gift;
}
