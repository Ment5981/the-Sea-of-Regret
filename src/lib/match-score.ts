import type { DestinyProfile, MatchWarningTag } from "@/types";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function elementOverlap(a: DestinyProfile, b: DestinyProfile): number {
  const chars = new Set<string>();
  for (const el of a.baziElements.join("")) {
    if (/[木火土金水]/.test(el)) chars.add(el);
  }
  let n = 0;
  for (const el of b.baziElements.join("")) {
    if (/[木火土金水]/.test(el) && chars.has(el)) n++;
  }
  return n;
}

/**
 * 简易匹配分：MBTI、特质重叠、五行字面相撞（占位算法，可替换为真实合盘）。
 */
export function computeMatchScore(a: DestinyProfile, b: DestinyProfile): number {
  let score = 48;
  if (a.mbti === b.mbti) score += 12;
  const setA = new Set(a.hiddenTraits);
  const overlap = b.hiddenTraits.filter((t) => setA.has(t)).length;
  score += Math.min(24, overlap * 8);
  score += Math.min(16, elementOverlap(a, b) * 4);
  const fateLen = Math.min(a.fateTag.length, b.fateTag.length);
  score += Math.min(8, Math.floor(fateLen / 40));
  const mix = hashString(`${a.secondMeId}|${b.secondMeId}`) % 7;
  score += mix;
  return Math.min(98, Math.max(34, score));
}

export function pickWarningTag(score: number, pairKey: string): MatchWarningTag {
  const h = hashString(pairKey) % 4;
  if (score >= 82) return "良缘试探";
  if (score >= 68) return "平淡相守";
  if (score >= 55) return h < 2 ? "劫数纠缠" : "孽缘预警";
  return h < 1 ? "劫数纠缠" : "孽缘预警";
}
