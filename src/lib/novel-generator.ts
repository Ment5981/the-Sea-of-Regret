import { generateText } from "@/lib/llm-client";
import {
  buildLongNovelFromSimulationPrompt,
  buildNovelPrompt,
  SYSTEM_CYBER_FORTUNE_TELLER,
} from "@/lib/prompts";
import type { SimulationEvent, SimulationResult } from "@/types";

export async function generateNovel(events: SimulationEvent[]) {
  return generateText({
    systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} 你也是成熟的情感小说作者。`,
    userPrompt: buildNovelPrompt(events),
    fallbackText:
      "他们在霓虹下相遇，以为命运终于温柔。后来，现实像潮水把承诺一点点磨薄。争吵不是因为不爱，而是太想被懂得。最后一次见面，他们站在风里，谁都没有回头。回忆像一部未剪完的电影，留着大片空白。她终于明白，离别不是失败，而是两个人在错误时机里尽力相爱的证词。",
  });
}

/** 当 LLM 不可用时，用推演原文 + 三轮摘要/对话拼出接近 2000 字的降级正文 */
export function buildLongNovelFallback(simulation: SimulationResult): string {
  const chunks: string[] = [simulation.novelLong.trim()];
  for (const r of simulation.rounds) {
    chunks.push(
      `\n\n【${r.title}】\n${r.summary}\n\n`,
      r.a2aTurns.map((t) => `「${t.utterance}」`).join("\n"),
    );
  }
  let text = chunks.join("").replace(/\s+\n/g, "\n");
  const targetMin = 1800;
  const targetMax = 2200;
  if (text.length < targetMin) {
    text += `\n\n风从站台尽头吹来，像把未说完的话一遍遍推回喉咙。霓虹在玻璃上碎成无数条路，他们终于承认：爱不是互相拯救，而是允许彼此在命里留下缺口。多年以后，城市换了皮肤，他们偶尔还会梦见同一场雨——雨里有人回头，有人装作没听见。`;
  }
  if (text.length > targetMax) {
    text = text.slice(0, targetMax) + "……";
  }
  return text;
}

/** 约 2000 字中篇（优先使用 SimulationResult 全量素材） */
export async function generateNovelFromSimulation(simulation: SimulationResult) {
  return generateText({
    systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} 你也是成熟的情感小说作者，擅长长篇叙事与章节结构。`,
    userPrompt: buildLongNovelFromSimulationPrompt(simulation),
    temperature: 0.82,
    maxOutputTokens: 3600,
    fallbackText: buildLongNovelFallback(simulation),
  });
}
