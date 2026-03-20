import type {
  DestinyProfile,
  HexagramSlot,
  SimulationEvent,
  SimulationResult,
} from "@/types";

/** 固定卦象与演示文案，用于 DEMO_MODE / 一键演示 */
export const DEMO_GUA = "水火未济";

export const DEMO_DESTINY_PROFILE: DestinyProfile = {
  id: "demo-profile-001",
  secondMeId: "demo-secondme-user",
  mbti: "INFP",
  birthDate: "1998-03-21",
  birthPlace: "上海",
  baziElements: ["剑锋金气隐现，木火偏旺，宜以水语润情。"],
  hiddenTraits: ["理想主义", "敏感共情", "宿命感"],
  fateTag: "我们不是偶然相遇，而是彼此命运里迟到的注脚。",
};

export const DEMO_SIMULATION_EVENTS: SimulationEvent[] = [
  {
    timestamp: new Date("2025-01-01T20:00:00.000Z").toISOString(),
    eventType: "初遇",
    description:
      "跨年霓虹雨里，地铁末班车把两人推到同一出口，试探像玩笑，眼神却认真。",
    emotionIntensity: 78,
    a2aTurns: [
      { speaker: "user_agent", utterance: "……你也常走这条线？我以为是城市留给我的默认路径。" },
      { speaker: "partner_agent", utterance: "默认路径也会分叉。你站在这里，就已经像命运点名了。" },
      { speaker: "user_agent", utterance: "那如果我跟上你，算不算擅自改命？" },
      { speaker: "partner_agent", utterance: "算。但我很喜欢。" },
    ],
  },
  {
    timestamp: new Date("2025-05-01T22:30:00.000Z").toISOString(),
    eventType: "冲突",
    description:
      `卦象${DEMO_GUA}应在「错位与未完成」：一方用工作逃避亲密，另一方用沉默累积伤害，争吵在凌晨爆发。`,
    emotionIntensity: 91,
    a2aTurns: [
      { speaker: "user_agent", utterance: "你又在忙。我们到底在等什么？" },
      { speaker: "partner_agent", utterance: "我在等一个不被责备的间隙。可你每次靠近都像审判。" },
      { speaker: "user_agent", utterance: "我只是想被看见。不是想赢。" },
      { speaker: "partner_agent", utterance: "那你看见我吗？我在你计划里，还是在你焦虑里？" },
    ],
  },
  {
    timestamp: new Date("2025-09-20T19:00:00.000Z").toISOString(),
    eventType: "离别",
    description:
      "告别在车站的风里完成，拥抱很轻，像把一生的重量都放回去；他们没有说再见，因为一说就碎。",
    emotionIntensity: 97,
    a2aTurns: [
      { speaker: "user_agent", utterance: "我们别互相折磨了。你走吧，我替你恨我。" },
      { speaker: "partner_agent", utterance: "我不是想走。我是想被你留下。可你一次都没伸手。" },
      { speaker: "user_agent", utterance: "伸手就会碎。碎了就再也拼不回「我们」。" },
      { speaker: "partner_agent", utterance: "那就碎吧。至少碎过，也算真的爱过。" },
    ],
  },
];

const DEMO_HEX_SLOT: HexagramSlot = {
  ben: {
    name: "水火未济",
    imageMeaning: "未济：亨，小狐汔济，濡其尾，无攸利。",
    narrativeHint: "本卦：事未竟，情绪在将成未成之间。",
  },
  hu: {
    name: "火水未济",
    imageMeaning: "互卦象：阴阳交错，互为表里。",
    narrativeHint: "互卦：心事互锁，解释与误读叠合。",
  },
  bian: {
    name: "火风鼎",
    imageMeaning: "鼎新：关系定型，热灶与余温并存。",
    narrativeHint: "变卦：承诺被重新铸造，却仍可能烫伤。",
  },
  zong: {
    name: "未济·综",
    imageMeaning: "综卦：视角调转，彼此站位互换。",
    narrativeHint: "综卦：站在对方站过的位置，风仍很冷。",
  },
  cuo: {
    name: "既济·错",
    imageMeaning: "错卦：阴阳对调，理想与现实换位。",
    narrativeHint: "错卦：若当初相反选择，是否仍来到此处？",
  },
};

/** 三合三离完整结构（演示模式） */
export const DEMO_SIMULATION_RESULT: SimulationResult = {
  guaLabel: DEMO_GUA,
  rounds: [
    {
      roundIndex: 1,
      title: "初见与裂痕",
      divinationMeta: { method: "时间起卦", model: "梅花易数" },
      hexagrams: DEMO_HEX_SLOT,
      beats: [
        {
          label: "起卦",
          text: `${DEMO_GUA}在霓虹里显影，像城市给两人的默认剧本。`,
        },
        { label: "对视", text: "试探被说成玩笑，认真却从眼神里漏出来。" },
        {
          label: "伏笔",
          text: "他们还不知道，这次相遇会把以后所有的告别都预演一遍。",
        },
      ],
      a2aTurns: DEMO_SIMULATION_EVENTS[0].a2aTurns ?? [],
      summary: DEMO_SIMULATION_EVENTS[0].description,
    },
    {
      roundIndex: 2,
      title: "挣扎与妥协",
      divinationMeta: { method: "铜钱起卦", model: "奇门遁甲" },
      hexagrams: DEMO_HEX_SLOT,
      beats: [
        { label: "裂痕", text: "未回的消息在聊天框里堆成审判席。" },
        { label: "拉扯", text: "爱被翻译成要求，沉默被翻译成惩罚。" },
        {
          label: "僵持",
          text: `卦象${DEMO_GUA}如悬案：谁都不想输，却都输了温柔。`,
        },
      ],
      a2aTurns: DEMO_SIMULATION_EVENTS[1].a2aTurns ?? [],
      summary: DEMO_SIMULATION_EVENTS[1].description,
    },
    {
      roundIndex: 3,
      title: "宿命与终局",
      divinationMeta: { method: "时辰起卦", model: "紫微斗数" },
      hexagrams: DEMO_HEX_SLOT,
      beats: [
        { label: "站台", text: "风把告别吹得很轻，轻到像谎言。" },
        { label: "松手", text: "拥抱短得像一次赦免，赦免彼此不再互相折磨。" },
        { label: "余烬", text: "他们终于学会把爱留在命里，而不是留在关系里。" },
      ],
      a2aTurns: DEMO_SIMULATION_EVENTS[2].a2aTurns ?? [],
      summary: DEMO_SIMULATION_EVENTS[2].description,
    },
  ],
  novelLong: [
    "【初见与裂痕】",
    DEMO_SIMULATION_EVENTS[0].description,
    "",
    "【挣扎与妥协】",
    DEMO_SIMULATION_EVENTS[1].description,
    "",
    "【宿命与终局】",
    DEMO_SIMULATION_EVENTS[2].description,
    "",
    "（演示）命定的离别不是惩罚，而是两个人在错误时机里仍用力相爱的证词。",
  ].join("\n"),
  nineFramePrompts: [
    "Panel 1/9: neon rain station, two silhouettes, cyberpunk breakup, cinematic, no text",
    "Panel 2/9: subway last train glow, reflection on glass, emotional negative space",
    "Panel 3/9: split screen argument, cold blue vs warm magenta lighting",
    "Panel 4/9: smartphone glow on faces, unread messages as abstract storm",
    "Panel 5/9: I Ching hexagram hologram, glitch overlay, puzzle collage",
    "Panel 6/9: corridor endless depth, fate as repeating doors",
    "Panel 7/9: farewell hug, light feather touch, wind particles",
    "Panel 8/9: empty platform, receding train lights, bokeh",
    "Panel 9/9: puzzle frame empty center, title negative space, no text",
  ],
  zhihuKeywords: [
    "INFP 恋爱模式",
    "亲密关系沟通",
    "分手与告别",
    "回避型依恋",
    "情感边界",
    "异地恋如何维持",
  ],
};
