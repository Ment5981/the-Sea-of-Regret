import { generateText } from "@/lib/llm-client";
import {
  buildComicPromptFromFarewell,
  buildNineComicPromptsPrompt,
  SYSTEM_CYBER_FORTUNE_TELLER,
} from "@/lib/prompts";
import type { SimulationResult } from "@/types";

function fallbackPrompts() {
  return [
    "Cinematic shot, emotional cyberpunk couple at a rainy station, split screen memory fragments, puzzle collage art, dramatic blue and magenta lighting, no text",
    "Two lovers arguing in neon apartment, mirrored composition, emotional tension, cinematic storytelling, puzzle collage style, volumetric light, no text",
    "Final farewell on empty bridge at dawn, torn photo pieces floating, cyberpunk melancholy, dramatic rim lighting, cinematic composition, no text",
  ];
}

export async function generateComicPrompts(farewellText: string) {
  const text = await generateText({
    systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} You are also a professional prompt engineer for image models.`,
    userPrompt: buildComicPromptFromFarewell(farewellText),
    fallbackText: JSON.stringify({ prompts: fallbackPrompts() }),
  });

  try {
    const parsed = JSON.parse(text) as { prompts?: string[] };
    if (!parsed.prompts?.length) return fallbackPrompts();
    return parsed.prompts.slice(0, 3);
  } catch {
    return fallbackPrompts();
  }
}

function padNine(prompts: string[], simulation: SimulationResult): string[] {
  if (prompts.length >= 9) return prompts.slice(0, 9);
  const base = simulation.nineFramePrompts.length
    ? simulation.nineFramePrompts
    : fallbackPrompts();
  const out = [...prompts];
  let guard = 0;
  while (out.length < 9 && guard++ < 24) {
    out.push(base[out.length % base.length] ?? base[0]);
  }
  return out.slice(0, 9);
}

/** 九格漫画：与三合三离弧线对齐 */
export async function generateNineComicPrompts(simulation: SimulationResult) {
  const fallback = JSON.stringify({
    prompts: padNine([], simulation),
  });
  const text = await generateText({
    systemPrompt: `${SYSTEM_CYBER_FORTUNE_TELLER} You are a professional prompt engineer for image models. Output valid JSON only.`,
    userPrompt: buildNineComicPromptsPrompt(simulation),
    temperature: 0.78,
    maxOutputTokens: 2000,
    fallbackText: fallback,
  });

  try {
    const parsed = JSON.parse(text) as { prompts?: string[] };
    const raw = parsed.prompts
      ?.map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean);
    if (!raw?.length) return padNine([], simulation);
    return padNine(raw, simulation);
  } catch {
    return padNine([], simulation);
  }
}
