import { randomUUID } from "node:crypto";
import { analyzeBazi } from "@/lib/bazi-engine";
import {
  buildTwinPersonaPrompt,
  SYSTEM_CYBER_FORTUNE_TELLER,
} from "@/lib/prompts";
import { generateText } from "@/lib/llm-client";
import { isDemoMode } from "@/lib/env";
import type { DestinyProfile, TwinPersonaReport, UserAwakeningInput } from "@/types";

function fallbackTwinReport(
  input: UserAwakeningInput,
  bazi: TwinPersonaReport["bazi"],
): TwinPersonaReport {
  const keywords = [
    ...bazi.elements.slice(0, 2),
    input.mbti,
    bazi.patternTags[0] ?? "宿命牵引",
  ].filter(Boolean);
  return {
    keywords: keywords.slice(0, 5),
    fateTone: `${input.gender === "女" ? "她" : "他"}的分身带着${bazi.elements[0] ?? "木"}气与${input.mbti}的叙事滤镜，在关系里既渴望被读懂，又害怕被看穿。`,
    fusionLine: `「${input.displayName}」与赛博命盘共振：${bazi.rawSummary.slice(0, 80)}${bazi.rawSummary.length > 80 ? "……" : ""}`,
    loveLandmines: bazi.loveLandmines,
    bazi,
  };
}

function parseTwinJson(
  raw: string,
  input: UserAwakeningInput,
  bazi: TwinPersonaReport["bazi"],
): TwinPersonaReport {
  try {
    const p = JSON.parse(raw) as Partial<{
      keywords: string[];
      fateTone: string;
      fusionLine: string;
    }>;
    if (
      !Array.isArray(p.keywords) ||
      p.keywords.length < 2 ||
      typeof p.fateTone !== "string" ||
      typeof p.fusionLine !== "string"
    ) {
      return fallbackTwinReport(input, bazi);
    }
    return {
      keywords: p.keywords.slice(0, 8).map(String),
      fateTone: p.fateTone,
      fusionLine: p.fusionLine,
      loveLandmines: bazi.loveLandmines,
      bazi,
    };
  } catch {
    return fallbackTwinReport(input, bazi);
  }
}

export async function generateTwinPersonaReport(
  input: UserAwakeningInput,
): Promise<TwinPersonaReport> {
  const bazi = analyzeBazi(input);
  const fallback = JSON.stringify(fallbackTwinReport(input, bazi));

  if (isDemoMode()) {
    return JSON.parse(fallback) as TwinPersonaReport;
  }

  const raw = await generateText({
    systemPrompt: SYSTEM_CYBER_FORTUNE_TELLER,
    userPrompt: buildTwinPersonaPrompt(input, bazi),
    temperature: 0.75,
    fallbackText: fallback,
  });
  return parseTwinJson(raw, input, bazi);
}

export function twinReportToDestinyProfile(
  input: UserAwakeningInput,
  twin: TwinPersonaReport,
  secondMeId: string,
): DestinyProfile {
  return {
    id: randomUUID(),
    secondMeId,
    mbti: input.mbti,
    birthDate: input.birthDate,
    birthPlace: input.birthPlace,
    baziElements: [twin.bazi.rawSummary, ...twin.bazi.elements],
    hiddenTraits: twin.keywords,
    fateTag: twin.fusionLine,
  };
}
