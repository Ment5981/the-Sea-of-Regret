import type { BaziAnalysis, UserAwakeningInput } from "@/types";

const ELEMENTS = ["木", "火", "土", "金", "水"];
const TEN_GODS = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"];
const PATTERNS = ["伤官见官", "财旺身弱", "官杀混杂", "比劫争财", "桃花入命", "孤辰寡宿"];
const MINES = [
  "情绪勒索型依恋",
  "回避型沟通",
  "控制欲强",
  "过度理想化",
  "冷战型分手",
  "第三者磁场",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, n: number): T[] {
  const out: T[] = [];
  const copy = [...arr];
  let x = seed;
  for (let i = 0; i < n && copy.length; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const idx = x % copy.length;
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

/**
 * 占位八字引擎：用出生信息 + 性别哈希生成稳定、可复现的结构化摘要。
 * 后续可替换为真排盘（lunar-javascript / 专业库）。
 */
export function analyzeBazi(input: UserAwakeningInput): BaziAnalysis {
  const key = `${input.birthDate}|${input.birthTime ?? ""}|${input.birthPlace}|${input.gender}|${input.calendarType}`;
  const seed = hashString(key);

  const elements = pick(ELEMENTS, seed, 3);
  const tenGods = pick(TEN_GODS, seed + 1, 4);
  const patternTags = pick(PATTERNS, seed + 2, 2);
  const loveLandmines = pick(MINES, seed + 3, 2);

  const rawSummary = [
    `日主${elements[0]}气偏旺，${tenGods[0]}与${tenGods[1]}并见，`,
    `情感上易呈现「${patternTags[0]}」的拉扯模式；`,
    `在亲密关系里需警惕${loveLandmines[0]}与${loveLandmines[1]}。`,
  ].join("");

  return {
    elements,
    tenGods,
    patternTags,
    loveLandmines,
    rawSummary,
  };
}
