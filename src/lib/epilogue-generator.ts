import { generateText } from "@/lib/llm-client";
import {
  buildFinalEpitaphPrompt,
  buildRationalReportPrompt,
  buildReincarnationPrompt,
  SYSTEM_CYBER_FORTUNE_TELLER,
} from "@/lib/prompts";
import type { SimulationResult } from "@/types";

const FALLBACK_RATIONAL =
  "理性复盘：这段关系的核心张力，往往来自「渴望被看见」与「害怕被看穿」同时存在。试着把指责换成需求陈述，把冷战换成可预约的谈话时间。离别不一定是失败，有时是两个人在错误时机里仍尽力相爱的证据。";

const FALLBACK_EPITAPH =
  "如果命运真有一双眼睛，它一定看见过你们在雨里并肩，也看见过你们在沉默里各自碎裂。别再把离别写成惩罚——它只是把你们轻轻放回各自的路上。愿你在没有我的城市里，仍能相信温柔值得。";

const FALLBACK_REINCARNATION = {
  pastLife:
    "前世你们在同一个渡口错过两艘船，像无数次练习告别，却从没学会把爱留在当下。",
  nextLife:
    "来生也许只是地铁里擦肩的陌生人，但那一瞬的熟悉，会替你们把未说完的话说完。",
  scrollPrompt:
    "Ancient silk scroll unfurling in neon rain, cyberpunk farewell, cyan and magenta rim light, emotional negative space, no text, no watermark",
};

export async function generateRationalReport(simulation: SimulationResult) {
  return generateText({
    systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} 你也是心理咨询师取向的关系写作者。`,
    userPrompt: buildRationalReportPrompt(simulation),
    temperature: 0.62,
    maxOutputTokens: 2800,
    fallbackText: FALLBACK_RATIONAL,
  });
}

export async function generateFinalEpitaph(
  simulation: SimulationResult,
  novelExcerpt?: string,
) {
  return generateText({
    systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} 你也是书信体散文作者。`,
    userPrompt: buildFinalEpitaphPrompt(simulation, novelExcerpt),
    temperature: 0.78,
    maxOutputTokens: 1200,
    fallbackText: FALLBACK_EPITAPH,
  });
}

export function parseReincarnationJson(raw: string): NonNullable<
  SimulationResult["reincarnation"]
> {
  try {
    const p = JSON.parse(raw) as {
      pastLife?: string;
      nextLife?: string;
      scrollPrompt?: string;
    };
    if (p.pastLife && p.nextLife) {
      return {
        pastLife: p.pastLife,
        nextLife: p.nextLife,
        scrollPrompt: p.scrollPrompt,
      };
    }
  } catch {
    /* fallthrough */
  }
  return { ...FALLBACK_REINCARNATION };
}

export async function generateReincarnation(
  simulation: SimulationResult,
): Promise<NonNullable<SimulationResult["reincarnation"]>> {
  const fallback = JSON.stringify(FALLBACK_REINCARNATION);
  const raw = await generateText({
    systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} 输出必须仅为合法 JSON。`,
    userPrompt: buildReincarnationPrompt(simulation),
    temperature: 0.8,
    maxOutputTokens: 1200,
    fallbackText: fallback,
  });
  return parseReincarnationJson(raw);
}
