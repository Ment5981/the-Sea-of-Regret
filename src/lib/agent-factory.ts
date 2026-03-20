import { randomUUID } from "node:crypto";
import {
  buildDestinyProfilePrompt,
  SYSTEM_CYBER_FORTUNE_TELLER,
} from "@/lib/prompts";
import { generateText } from "@/lib/llm-client";
import { isDemoMode } from "@/lib/env";
import { DEMO_DESTINY_PROFILE } from "@/lib/demo-data";
import type { DestinyFormInput, DestinyProfile, DestinyProfileLLMRaw } from "@/types";

function fallbackRaw(input: DestinyFormInput): DestinyProfileLLMRaw {
  const keywordMap: Record<string, string[]> = {
    INFP: ["理想主义", "敏感共情", "宿命感"],
    INFJ: ["洞察力", "克制深情", "精神连接"],
    ENFP: ["热烈自由", "浪漫冒险", "情绪感染"],
  };
  return {
    bazi_analysis: `命格推演：木火偏旺，需以水调和；在关系中重情绪流动与被理解感。(${input.birthPlace})`,
    personality_fusion: keywordMap[input.mbti] ?? ["理性外壳", "情绪暗涌", "关系执念"],
    fate_quotation: "我们不是偶然相遇，而是彼此命运里迟到的注脚。",
  };
}

function parseRaw(rawText: string, input: DestinyFormInput): DestinyProfileLLMRaw {
  try {
    const parsed = JSON.parse(rawText) as Partial<DestinyProfileLLMRaw>;
    return {
      bazi_analysis: parsed.bazi_analysis ?? fallbackRaw(input).bazi_analysis,
      personality_fusion:
        parsed.personality_fusion?.slice(0, 3) ?? fallbackRaw(input).personality_fusion,
      fate_quotation: parsed.fate_quotation ?? fallbackRaw(input).fate_quotation,
    };
  } catch {
    return fallbackRaw(input);
  }
}

export async function generateDestinyProfile(
  input: DestinyFormInput & { secondMeId?: string },
) {
  if (isDemoMode()) {
    const raw = fallbackRaw(input);
    const profile: DestinyProfile = {
      ...DEMO_DESTINY_PROFILE,
      id: DEMO_DESTINY_PROFILE.id,
      mbti: input.mbti,
      birthDate: input.birthDate,
      birthPlace: input.birthPlace,
      secondMeId: input.secondMeId ?? DEMO_DESTINY_PROFILE.secondMeId,
      baziElements: [raw.bazi_analysis],
      hiddenTraits: raw.personality_fusion,
      fateTag: raw.fate_quotation,
    };
    return { profile, raw };
  }

  const raw = await generateText({
    systemPrompt: SYSTEM_CYBER_FORTUNE_TELLER,
    userPrompt: buildDestinyProfilePrompt(input),
    fallbackText: JSON.stringify(fallbackRaw(input)),
  });
  const profileRaw = parseRaw(raw, input);

  const profile: DestinyProfile = {
    id: randomUUID(),
    mbti: input.mbti,
    birthDate: input.birthDate,
    birthPlace: input.birthPlace,
    secondMeId: input.secondMeId ?? "mock-secondme-user",
    baziElements: [profileRaw.bazi_analysis],
    hiddenTraits: profileRaw.personality_fusion,
    fateTag: profileRaw.fate_quotation,
  };

  return { profile, raw: profileRaw };
}
