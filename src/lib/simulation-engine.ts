import {
  buildStoryRoundPrompt,
  pickDivinationMeta,
  ROUND_CONFIGS,
  SYSTEM_CYBER_FORTUNE_TELLER,
} from "@/lib/prompts";
import { generateText } from "@/lib/llm-client";
import { isDemoMode } from "@/lib/env";
import { DEMO_SIMULATION_RESULT } from "@/lib/demo-data";
import type {
  A2ATurn,
  DestinyProfile,
  HexagramLine,
  HexagramSlot,
  SimulationEvent,
  SimulationEventType,
  SimulationResult,
  StoryRound,
} from "@/types";

const GUA_POOL = ["水火未济", "泽火革", "风山渐", "雷泽归妹", "山水蒙"];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildHexagramSlot(mainGua: string, seed: string, roundIndex: number): HexagramSlot {
  const h = hashString(`${seed}|${mainGua}|${roundIndex}`);
  const pool = ["水火未济", "火水未济", "火风鼎", "山水蒙", "火泽睽", "天风姤"];
  const pick = (i: number) => pool[(h + i) % pool.length];
  const line = (n: string, k: number): HexagramLine => ({
    name: n,
    imageMeaning: `象意：${mainGua}与${n}互参，映出关系中的${["缝隙", "错位", "余温", "执念", "回声"][k % 5]}。`,
    narrativeHint: `本${["本卦", "互卦", "变卦", "综卦", "错卦"][k]}：情绪在${["起点", "中段", "转向", "回望", "终局"][k]}的落点。`,
  });
  return {
    ben: line(mainGua, 0),
    hu: line(pick(1), 1),
    bian: line(pick(2), 2),
    zong: line(pick(3), 3),
    cuo: line(pick(4), 4),
  };
}

function roundIndexToPhase(r: 1 | 2 | 3): SimulationEventType {
  return r === 1 ? "初遇" : r === 2 ? "冲突" : "离别";
}

type PhaseLLMResult = {
  turns: A2ATurn[];
  summary: string;
};

function mockPhase(phase: SimulationEventType, gua: string): PhaseLLMResult {
  if (phase === "初遇") {
    return {
      turns: [
        { speaker: "user_agent", utterance: "……你也常走这条线？我以为是城市留给我的默认路径。" },
        { speaker: "partner_agent", utterance: "默认路径也会分叉。你站在这里，就已经像命运点名了。" },
        { speaker: "user_agent", utterance: "那如果我跟上你，算不算擅自改命？" },
        { speaker: "partner_agent", utterance: "算。但我很喜欢。" },
      ],
      summary:
        "雨夜霓虹下，两人因同一条归途停住脚步，试探像玩笑，眼神却认真。",
    };
  }
  if (phase === "冲突") {
    return {
      turns: [
        {
          speaker: "user_agent",
          utterance: `你又在忙。卦象${gua}像未竟之事——我们到底在等什么？`,
        },
        {
          speaker: "partner_agent",
          utterance: "我在等一个不被责备的间隙。可你每次靠近都像审判。",
        },
        { speaker: "user_agent", utterance: "我只是想被看见。不是想赢。" },
        {
          speaker: "partner_agent",
          utterance: "那你看见我吗？我在你计划里，还是在你焦虑里？",
        },
      ],
      summary: `卦象${gua}应在「错位与未完成」：一方用工作逃避亲密，另一方用沉默累积伤害，争吵在凌晨爆发。`,
    };
  }
  return {
    turns: [
      { speaker: "user_agent", utterance: "我们别互相折磨了。你走吧，我替你恨我。" },
      { speaker: "partner_agent", utterance: "我不是想走。我是想被你留下。可你一次都没伸手。" },
      { speaker: "user_agent", utterance: "伸手就会碎。碎了就再也拼不回‘我们’。" },
      { speaker: "partner_agent", utterance: "那就碎吧。至少碎过，也算真的爱过。" },
    ],
    summary:
      "告别在车站的风里完成，拥抱很轻，像把一生的重量都放回去；他们没有说再见，因为一说就碎。",
  };
}

function defaultBeats(roundIndex: 1 | 2 | 3, gua: string) {
  if (roundIndex === 1) {
    return [
      { label: "起卦", text: `${gua}在霓虹里显影，像城市给两人的默认剧本。` },
      { label: "对视", text: "试探被说成玩笑，认真却从眼神里漏出来。" },
      { label: "伏笔", text: "他们还不知道，这次相遇会把以后所有的告别都预演一遍。" },
    ];
  }
  if (roundIndex === 2) {
    return [
      { label: "裂痕", text: "未回的消息在聊天框里堆成审判席。" },
      { label: "拉扯", text: "爱被翻译成要求，沉默被翻译成惩罚。" },
      { label: "僵持", text: `卦象${gua}如悬案：谁都不想输，却都输了温柔。` },
    ];
  }
  return [
    { label: "站台", text: "风把告别吹得很轻，轻到像谎言。" },
    { label: "松手", text: "拥抱短得像一次赦免，赦免彼此不再互相折磨。" },
    { label: "余烬", text: "他们终于学会把爱留在命里，而不是留在关系里。" },
  ];
}

function mockStoryRoundJson(roundIndex: 1 | 2 | 3, gua: string) {
  const phase = roundIndexToPhase(roundIndex);
  const { turns, summary } = mockPhase(phase, gua);
  return {
    beats: defaultBeats(roundIndex, gua),
    turns,
    summary,
  };
}

function parseStoryRoundJson(
  raw: string,
  roundIndex: 1 | 2 | 3,
  gua: string,
): { beats: { label: string; text: string }[]; turns: A2ATurn[]; summary: string } {
  const fallback = mockStoryRoundJson(roundIndex, gua);
  try {
    const parsed = JSON.parse(raw) as {
      beats?: { label?: string; text?: string }[];
      turns?: A2ATurn[];
      summary?: string;
    };
    const turns = parsed.turns?.filter(
      (t) =>
        t &&
        (t.speaker === "user_agent" || t.speaker === "partner_agent") &&
        typeof t.utterance === "string",
    );
    const beats = parsed.beats
      ?.filter((b) => b && typeof b.label === "string" && typeof b.text === "string")
      .slice(0, 5);
    if (!turns?.length || !parsed.summary) return fallback;
    return {
      beats:
        beats && beats.length >= 3
          ? (beats.slice(0, 3) as { label: string; text: string }[])
          : fallback.beats,
      turns,
      summary: parsed.summary,
    };
  } catch {
    return fallback;
  }
}

function buildNineFramePrompts(guaLabel: string, rounds: StoryRound[]): string[] {
  const spine = rounds.map((r) => r.title).join(" · ");
  return Array.from(
    { length: 9 },
    (_, i) =>
      `Panel ${i + 1}/9: cinematic cyberpunk breakup, gua "${guaLabel}", arc "${spine}", neon rain, split screen collage, emotional negative space, dramatic rim light, no text, no watermark`,
  );
}

function extractZhihuKeywords(rounds: StoryRound[], user: DestinyProfile): string[] {
  return [
    `${user.mbti} 恋爱模式`,
    "亲密关系沟通",
    "分手与告别",
    "回避型依恋",
    "情感边界",
    rounds[1]?.title ?? "关系拉扯",
  ];
}

function stitchNovelLong(rounds: StoryRound[]): string {
  const body = rounds.map((r) => `【${r.title}】\n${r.summary}`).join("\n\n");
  return `${body}\n\n（收束：命定的离别不是惩罚，而是两个人在错误时机里，仍用力相爱的证词。）`;
}

export function roundsToLegacyEvents(rounds: StoryRound[]): SimulationEvent[] {
  const base = Date.now();
  const day = 1000 * 60 * 60 * 24;
  const types: SimulationEventType[] = ["初遇", "冲突", "离别"];
  return rounds.map((r, i) => {
    const emotionIntensity = Math.min(99, 68 + r.roundIndex * 10);
    return {
      timestamp: new Date(base + day * (i === 0 ? 0 : i === 1 ? 120 : 260)).toISOString(),
      eventType: types[i],
      description: r.summary,
      emotionIntensity,
      a2aTurns: r.a2aTurns,
    };
  });
}

export async function runDestinySimulation(
  userProfile: DestinyProfile,
  partnerProfile: DestinyProfile,
): Promise<SimulationResult> {
  if (isDemoMode()) {
    return DEMO_SIMULATION_RESULT;
  }

  const userLabel = `${userProfile.mbti}｜${userProfile.hiddenTraits.join("、")}｜${userProfile.fateTag}`;
  const partnerLabel = `${partnerProfile.mbti}｜${partnerProfile.hiddenTraits.join("、")}｜${partnerProfile.fateTag}`;
  const seed = hashString(`${userProfile.secondMeId}|${partnerProfile.secondMeId}`);
  const guaLabel = GUA_POOL[seed % GUA_POOL.length];
  const seedStr = String(seed);

  const rounds: StoryRound[] = [];

  for (const cfg of ROUND_CONFIGS) {
    const meta = pickDivinationMeta(seed, cfg.roundIndex);
    const hexagrams = buildHexagramSlot(guaLabel, seedStr, cfg.roundIndex);
    const fallback = JSON.stringify(mockStoryRoundJson(cfg.roundIndex, guaLabel));
    const raw = await generateText({
      systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} 你也是 A2A 剧本导演，必须输出合法 JSON。`,
      userPrompt: buildStoryRoundPrompt({
        roundIndex: cfg.roundIndex,
        title: cfg.title,
        userLabel,
        partnerLabel,
        guaLabel,
        method: meta.method,
        model: meta.model,
      }),
      temperature: 0.85,
      fallbackText: fallback,
    });
    const parsed = parseStoryRoundJson(raw, cfg.roundIndex, guaLabel);
    rounds.push({
      roundIndex: cfg.roundIndex,
      title: cfg.title,
      divinationMeta: meta,
      hexagrams,
      beats: parsed.beats,
      a2aTurns: parsed.turns,
      summary: parsed.summary,
    });
  }

  return {
    guaLabel,
    rounds,
    novelLong: stitchNovelLong(rounds),
    nineFramePrompts: buildNineFramePrompts(guaLabel, rounds),
    zhihuKeywords: extractZhihuKeywords(rounds, userProfile),
  };
}
