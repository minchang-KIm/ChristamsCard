// 크리스마스 TRPG 스토리: "산타의 잃어버린 선물"
// 약 1시간 분량의 협력형 어드벤처

const storyBook = {
  title: "산타의 잃어버린 선물 🎅",
  description: "크리스마스 이브, 산타의 특별한 선물이 사라졌습니다. 여러분은 산타의 요청으로 선물을 찾아 크리스마스를 구해야 합니다!",
  estimatedTime: "60분",

  scenes: [
    {
      id: "intro",
      title: "프롤로그: 긴급 호출",
      description: `
        크리스마스 이브 밤 11시. 갑자기 하늘에서 반짝이는 빛과 함께 산타클로스가 나타납니다.

        산타: "호호호! 여러분, 큰일이에요! 올해의 가장 특별한 선물, '영원한 크리스마스의 별'이 사라졌습니다.
        이 별이 없으면 전 세계 어린이들에게 기쁨을 전할 수 없어요.
        저는 다른 선물을 배달해야 하니, 여러분이 도와주시겠어요?"

        어두운 그림자가 북쪽 숲으로 사라지는 것이 보입니다.
      `,
      choices: [
        {
          id: "accept",
          text: "당연히 도와드리죠! 🎄",
          next: "scene1",
          requirement: null
        }
      ]
    },

    {
      id: "scene1",
      title: "1장: 눈 덮인 숲 입구",
      description: `
        북쪽 숲 입구에 도착했습니다. 눈이 소복이 쌓인 거대한 전나무들이 어둠 속에서 으스스하게 서 있습니다.
        발자국이 세 방향으로 나뉘어져 있습니다:

        1) 왼쪽: 얼음으로 뒤덮인 좁은 길 (얼음 위에 작은 발자국)
        2) 정면: 넓고 안전해 보이는 길 (하지만 발자국이 없음)
        3) 오른쪽: 희미하게 빛나는 길 (커다란 발자국과 반짝이는 가루)
      `,
      choices: [
        {
          id: "left",
          text: "왼쪽 얼음 길로 간다",
          next: "scene2_left",
          requirement: { type: "dice", difficulty: 12, stat: "민첩성" }
        },
        {
          id: "center",
          text: "정면 안전한 길로 간다",
          next: "scene2_center",
          requirement: null
        },
        {
          id: "right",
          text: "오른쪽 빛나는 길로 간다",
          next: "scene2_right",
          requirement: { type: "charisma", description: "요정들을 설득해야 합니다" }
        }
      ]
    },

    {
      id: "scene2_left",
      title: "얼음 동굴",
      description: `
        [주사위 성공 시]
        조심스럽게 얼음 위를 걸어, 숨겨진 동굴을 발견했습니다.
        안에는 떨고 있는 작은 눈사람이 있습니다.

        눈사람: "으흑... 나쁜 크람푸스가 별을 훔쳐갔어요!
        그는 '불의 산' 정상에 있는 자기 성으로 가져갔답니다."

        눈사람이 특별한 '얼음 부적'을 줍니다. (화염 저항 +2)

        [주사위 실패 시]
        미끄러져 얼음물에 빠졌습니다! 춥고 젖었지만 다행히 근처 오두막을 발견했습니다.
        친절한 토끼 할머니가 따뜻한 코코아를 줍니다. (체력 회복)
      `,
      choices: [
        {
          id: "continue",
          text: "불의 산으로 향한다",
          next: "scene3",
          requirement: null
        }
      ]
    },

    {
      id: "scene2_center",
      title: "안전한 길",
      description: `
        안전하게 숲을 통과하고 있습니다.
        갑자기 수상한 여우가 나타나 말을 겁니다.

        여우: "흐흐... 별을 찾고 있나? 내가 지름길을 알려줄 수 있지...
        대신 각자 내게 크리스마스 소원을 하나씩 말해줘."

        여우의 눈빛이 이상하게 반짝입니다.
      `,
      choices: [
        {
          id: "trust",
          text: "여우를 믿고 소원을 말한다",
          next: "scene2_center_trust",
          requirement: { type: "dice", difficulty: 15, stat: "지혜" }
        },
        {
          id: "refuse",
          text: "정중히 거절하고 계속 간다",
          next: "scene3",
          requirement: null
        }
      ]
    },

    {
      id: "scene2_center_trust",
      title: "여우의 제안",
      description: `
        [주사위 성공 시]
        여우가 실은 변장한 착한 요정이었습니다!
        요정: "호호, 똑똑하구나! 순수한 마음을 가진 자만이 날 알아볼 수 있지.
        크람푸스가 별을 훔쳐 '불의 산'으로 갔어. 이 '텔레포트 깃털'을 가져가렴."
        (불의 산까지 시간 절약)

        [주사위 실패 시]
        여우가 여러분의 소원을 먹어치우더니 사라졌습니다!
        각자 일시적으로 한 가지 능력을 잃습니다. (다음 체크 -3)
      `,
      choices: [
        {
          id: "continue",
          text: "불의 산으로 향한다",
          next: "scene3",
          requirement: null
        }
      ]
    },

    {
      id: "scene2_right",
      title: "요정의 마을",
      description: `
        반짝이는 길을 따라가니 아름다운 요정 마을이 나타납니다.
        하지만 요정들이 길을 막고 있습니다.

        요정 대표: "인간들은 이곳에 올 수 없어요.
        우리 마을의 규칙이에요. 돌아가세요!"

        [카리스마 체크가 필요합니다]
      `,
      choices: [
        {
          id: "persuade",
          text: "크리스마스를 구하려는 사명을 설명한다",
          next: "scene2_right_success",
          requirement: { type: "charisma", description: "요정들을 감동시켜야 합니다" }
        }
      ]
    },

    {
      id: "scene2_right_success",
      title: "요정의 축복",
      description: `
        [카리스마 성공 시]
        요정들이 감동받아 눈물을 흘립니다!

        요정 대표: "아름다운 마음을 가지셨군요! 우리가 도와드릴게요.
        크람푸스가 '불의 산'에 숨어있어요. 이 '날개 부츠'를 신으면 빠르게 갈 수 있어요!"

        요정들이 함께 노래하며 축복을 내립니다. (모든 능력 +1)

        [카리스마 실패 시]
        요정들이 여러분을 마을 밖으로 텔레포트시켰습니다.
        하지만 다행히 올바른 방향으로 보내줬습니다.
      `,
      choices: [
        {
          id: "continue",
          text: "불의 산으로 향한다",
          next: "scene3",
          requirement: null
        }
      ]
    },

    {
      id: "scene3",
      title: "2장: 불의 산",
      description: `
        거대한 화산 앞에 도착했습니다. 산 정상에서 붉은 빛이 새어 나옵니다.
        입구에는 용암이 흐르는 다리가 있고, 그 앞에 거대한 눈골렘이 서 있습니다.

        눈골렘: "크람푸스님이 명령하셨다! 아무도 지나갈 수 없다!"

        골렘의 약점을 찾거나, 설득하거나, 우회로를 찾아야 합니다.
      `,
      choices: [
        {
          id: "fight",
          text: "골렘의 약점을 찾아 공격한다",
          next: "scene3_fight",
          requirement: { type: "dice", difficulty: 14, stat: "전투력" }
        },
        {
          id: "persuade",
          text: "골렘을 설득한다",
          next: "scene3_persuade",
          requirement: { type: "charisma", description: "골렘의 마음을 움직여야 합니다" }
        },
        {
          id: "sneak",
          text: "옆쪽 화산 암벽을 타고 우회한다",
          next: "scene3_sneak",
          requirement: { type: "dice", difficulty: 13, stat: "민첩성" }
        }
      ]
    },

    {
      id: "scene3_fight",
      title: "골렘 전투",
      description: `
        [주사위 성공 시]
        골렘의 핵심(눈으로 만든 심장)을 발견하고 공격했습니다!
        골렘이 무너지면서 말합니다: "고마워... 이제 자유다..."
        골렘은 원래 착한 눈사람이었지만 크람푸스의 마법에 조종당했던 것입니다.

        [주사위 실패 시]
        골렘의 공격을 받아 모두 부상을 입었습니다. (체력 -2)
        하지만 싸우는 동안 골렘의 마법이 약해져서 옆으로 빠져나갈 수 있게 되었습니다.
      `,
      choices: [
        {
          id: "continue",
          text: "산을 오른다",
          next: "scene4",
          requirement: null
        }
      ]
    },

    {
      id: "scene3_persuade",
      title: "골렘 설득",
      description: `
        [카리스마 성공 시]
        여러분의 진심 어린 말에 골렘이 눈물을 흘립니다.

        골렘: "나도... 나도 원래는 산타님께 선물을 받던 착한 눈사람이었어...
        크람푸스가 나를 조종했어... 도와줘서 고마워."

        골렘이 마법에서 풀려나 동료가 됩니다! (다음 전투 시 도움)

        [카리스마 실패 시]
        골렘이 혼란스러워하는 사이 옆으로 빠져나갔습니다.
      `,
      choices: [
        {
          id: "continue",
          text: "산을 오른다",
          next: "scene4",
          requirement: null
        }
      ]
    },

    {
      id: "scene3_sneak",
      title: "암벽 우회",
      description: `
        [주사위 성공 시]
        조심스럽게 암벽을 타고 올라갔습니다.
        정상 근처에서 '화염 꽃'을 발견했습니다! (특별 아이템 획득)

        [주사위 실패 시]
        미끄러져 떨어졌지만, 다행히 용암 대신 눈 더미에 착지했습니다.
        골렘이 소리를 듣고 잠시 자리를 비운 사이 통과할 수 있었습니다.
      `,
      choices: [
        {
          id: "continue",
          text: "산을 오른다",
          next: "scene4",
          requirement: null
        }
      ]
    },

    {
      id: "scene4",
      title: "3장: 크람푸스의 성",
      description: `
        산 정상에 어두운 성이 있습니다. 성문이 활짝 열려있고 안에서 으스스한 웃음소리가 들립니다.

        크람푸스: "크크크... 오랜만에 손님이로군!
        '영원한 크리스마스의 별'? 아, 이 반짝이는 것 말이지?
        크리스마스는 너무 밝고 행복하기만 해! 좀 더 긴장감이 필요하다고!"

        크람푸스가 별을 높이 들어올립니다. 별이 점점 어두워지고 있습니다!

        "별을 가지고 싶으면... 나와 게임을 해!
        세 가지 크리스마스 수수께끼를 풀어봐. 하나라도 틀리면 별은 영원히 사라진다!"
      `,
      choices: [
        {
          id: "accept",
          text: "도전을 받아들인다",
          next: "scene5",
          requirement: null
        },
        {
          id: "fight",
          text: "수수께끼는 싫다! 별을 되찾기 위해 싸운다",
          next: "scene5_fight",
          requirement: { type: "group_dice", difficulty: 16, stat: "팀워크" }
        }
      ]
    },

    {
      id: "scene5",
      title: "4장: 크리스마스 수수께끼",
      description: `
        크람푸스: "좋아, 수수께끼 시간이다!"

        첫 번째 수수께끼:
        "나무도 아닌데 장식을 달고, 집도 아닌데 모두가 모이는 곳.
        일년에 한 번만 진정한 의미를 가지는 나는 무엇일까?"

        (정답: 크리스마스 트리)

        [플레이어들이 상의하여 답을 맞혀야 합니다]
      `,
      choices: [
        {
          id: "continue",
          text: "다음 수수께끼로 (정답을 맞혔다고 가정)",
          next: "scene5_riddle2",
          requirement: null
        }
      ]
    },

    {
      id: "scene5_riddle2",
      title: "두 번째 수수께끼",
      description: `
        크람푸스: "흥, 운이 좋았군. 다음!"

        두 번째 수수께끼:
        "착한 아이에게는 선물을, 나쁜 아이에게는 교훈을 주는 자.
        하지만 실제로는 모든 아이들이 사랑받을 자격이 있다고 믿는 존재는?"

        (정답: 산타클로스... 그리고 사실 크람푸스 자신도 포함)

        크람푸스가 잠시 당황합니다.
        크람푸스: "...그건..."
      `,
      choices: [
        {
          id: "continue",
          text: "마지막 수수께끼로",
          next: "scene5_riddle3",
          requirement: null
        }
      ]
    },

    {
      id: "scene5_riddle3",
      title: "세 번째 수수께끼",
      description: `
        크람푸스가 조용해집니다.

        크람푸스: "...마지막 수수께끼다. 이건 어렵다."

        "크리스마스의 진정한 의미는 선물도, 트리도, 눈도 아닌... 무엇일까?"

        (정답: 함께하는 것, 사랑, 마음을 나누는 것 등)

        [카리스마 체크: 크람푸스의 마음을 감동시켜야 합니다]
      `,
      choices: [
        {
          id: "answer",
          text: "진심을 담아 답한다",
          next: "ending_good",
          requirement: { type: "charisma", description: "크람푸스의 마음을 녹여야 합니다" }
        }
      ]
    },

    {
      id: "scene5_fight",
      title: "최종 전투",
      description: `
        [주사위 성공 시]
        모두가 힘을 합쳐 크람푸스와 맞섭니다!
        크람푸스의 마법 공격을 피하고, 팀워크로 그를 제압했습니다.

        크람푸스: "크윽... 이럴 수가... 너희들의 팀워크가 나의 힘보다 강하다니..."

        [주사위 실패 시]
        크람푸스의 마법이 너무 강력합니다!
        하지만 여러분의 용기와 우정이 별을 깨우고, 별의 빛이 크람푸스를 약하게 만듭니다.
      `,
      choices: [
        {
          id: "continue",
          text: "크람푸스에게 다가간다",
          next: "ending_good",
          requirement: null
        }
      ]
    },

    {
      id: "ending_good",
      title: "에필로그: 진정한 크리스마스",
      description: `
        [카리스마/전투 결과와 무관하게]

        여러분의 진심이 크람푸스의 마음에 닿았습니다.

        크람푸스: "...나는 항상 외로웠어. 산타는 모두에게 사랑받지만,
        나는 두려움의 대상일 뿐이지. 나도... 나도 크리스마스를 즐기고 싶었어..."

        눈물을 흘리는 크람푸스에게 손을 내밉니다.

        "크리스마스는 모두를 위한 거야. 너도 함께 축하할 수 있어."

        크람푸스: "정말... 나도?"

        그 순간, '영원한 크리스마스의 별'이 눈부시게 빛나며 모두를 감쌉니다.
        크람푸스의 어두운 성이 아름다운 얼음 궁전으로 변합니다.

        === 자정의 종소리 ===

        산타가 썰매를 타고 도착합니다!

        산타: "호호호! 잘했어요! 여러분은 별을 찾았을 뿐만 아니라,
        잃어버린 친구도 되찾아줬군요. 크람푸스, 오랜만이야 친구!"

        크람푸스: "산타... 미안해..."

        산타: "괜찮아! 이제 함께 크리스마스를 축하하자!
        여러분, 정말 고마워요. 이제 모든 아이들이 행복한 크리스마스를 맞이할 수 있을 거예요!"

        === 크리스마스의 기적 ===

        별이 하늘로 떠올라 북극성 옆에서 밝게 빛납니다.
        세계 곳곳에서 아이들의 웃음소리가 들립니다.

        그리고 여러분은... 최고의 크리스마스 영웅이 되었습니다!

        🎄 메리 크리스마스! 🎄

        === THE END ===

        [게임 클리어!]
        - 플레이 시간 체크
        - 각자의 활약상 정리
        - MVP 투표
      `,
      choices: []
    }
  ],

  // 캐릭터 직업 옵션
  characterClasses: [
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
  ],

  // 스탯 설명
  stats: {
    strength: "전투력 - 싸움이나 힘쓰는 일에 필요",
    agility: "민첩성 - 빠른 행동이나 곡예에 필요",
    wisdom: "지혜 - 수수께끼나 판단에 필요",
    charisma: "카리스마 - 설득이나 감동을 줄 때 필요",
    health: "체력 - 부상을 견디는 능력"
  }
};

module.exports = storyBook;
