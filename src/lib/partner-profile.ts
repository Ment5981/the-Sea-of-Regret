import { randomUUID } from "node:crypto";
import type { DestinyProfile, MatchCandidate } from "@/types";

const MBTI_RE =
  /\b(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP)\b/i;

function guessMbti(text?: string): string {
  if (!text) return "ENFP";
  const m = text.match(MBTI_RE);
  return m ? m[1].toUpperCase() : "ENFP";
}

/** Discover 列表项往往没有完整命盘，用占位档案驱动推演 */
export function candidateToDestinyProfile(c: MatchCandidate): DestinyProfile {
  const mbti = c.destinyProfile?.mbti ?? guessMbti(c.briefIntroduction);
  return {
    id: c.destinyProfile?.id ?? randomUUID(),
    secondMeId: c.secondMeUserId,
    mbti,
    birthDate: c.destinyProfile?.birthDate ?? "1999-06-15",
    birthPlace: c.destinyProfile?.birthPlace ?? "网络相遇",
    baziElements:
      c.destinyProfile?.baziElements ??
      [c.briefIntroduction ?? "缘分自 Discover 一线牵起，命盘待补全。"],
    hiddenTraits:
      c.destinyProfile?.hiddenTraits ??
      [c.displayName ? `来自广场的「${c.displayName}」` : "广场镜像", "资料轻量"],
    fateTag:
      c.destinyProfile?.fateTag ??
      (c.displayName
        ? `${c.displayName}：在无数路由里与你并排闪烁。`
        : "在无数路由里与你并排闪烁。"),
  };
}
