import type {
  BaziAnalysis,
  DestinyFormInput,
  SimulationEvent,
  SimulationResult,
  UserAwakeningInput,
} from "@/types";

export const SYSTEM_CYBER_FORTUNE_TELLER =
  "你是一位融合现代心理学与古老易经智慧的赛博命理师。你的语气玄妙、克制、富有宿命感。输出必须是严格 JSON，不要包含 markdown 或解释。";

export function buildTwinPersonaPrompt(
  input: UserAwakeningInput,
  bazi: BaziAnalysis,
) {
  return `
用户觉醒信息：
- 历法：${input.calendarType === "lunar" ? "农历" : "公历"}
- 生日：${input.birthDate}
- 时辰：${input.birthTime ?? "未知"}
- 出生地：${input.birthPlace}
- 性别：${input.gender}
- 称呼：${input.displayName}
- MBTI：${input.mbti}

已由占位引擎给出的八字摘要（请在此基础上润色，不要自相矛盾）：
- 五行侧重：${bazi.elements.join("、")}
- 十神侧重：${bazi.tenGods.join("、")}
- 格局标签：${bazi.patternTags.join("、")}
- 情感雷区：${bazi.loveLandmines.join("、")}
- 原文：${bazi.rawSummary}

请输出 JSON，字段必须精确包含：
{
  "keywords": ["关键词1","关键词2","关键词3","关键词4"],
  "fateTone": "80-140 字，描述此人分身的气质与宿命基调",
  "fusionLine": "一句可作为 fateTag 展示的宿命台词（可带引号）"
}

要求：keywords 为中文短词；语气克制、神秘；只输出合法 JSON。
`.trim();
}

export function buildDestinyProfilePrompt(input: DestinyFormInput) {
  return `
用户输入如下：
- MBTI: ${input.mbti}
- 出生日期: ${input.birthDate}
- 出生地: ${input.birthPlace}

请输出 JSON，字段必须精确包含：
{
  "bazi_analysis": "一句五行强弱分析，比如：剑锋金命，火旺缺水",
  "personality_fusion": ["关键词1", "关键词2", "关键词3"],
  "fate_quotation": "一句带宿命感的台词"
}

要求：
1) personality_fusion 必须是 3 个中文短词
2) 文风有神秘感，但不要过长
3) 输出必须是合法 JSON
`.trim();
}

export function buildAttractionPrompt(user: string, partner: string) {
  return `
基于两位角色画像，生成“初遇”场景，强调浪漫张力与命运感。
- 角色A：${user}
- 角色B：${partner}

输出 120-180 字中文描述。
`.trim();
}

export function buildConflictPrompt(
  user: string,
  partner: string,
  gua: string,
) {
  return `
基于角色画像制造一次冲突：
- 卦象：${gua}
- 角色A：${user}
- 角色B：${partner}

请输出一段 140-220 字的激烈争吵片段，冲突主题与卦象呼应，且具象。
`.trim();
}

export function buildFarewellPrompt(user: string, partner: string) {
  return `
请生成最终“离别”场景，要求画面感强、悲剧美学明显，体现“命中注定”但保留余温。
- 角色A：${user}
- 角色B：${partner}

输出 140-220 字中文描述。
`.trim();
}

/**
 * A2A：同一阶段内要求两个 Agent 轮流发言（自主互动），最后给一句 narrative summary。
 * 输出严格 JSON：{ "turns": [{"speaker":"user_agent"|"partner_agent","utterance":"..."}, ...], "summary": "..." , "emotionIntensity": 0-100 }
 */
export function buildA2APhasePrompt(input: {
  phase: "初遇" | "冲突" | "离别";
  userLabel: string;
  partnerLabel: string;
  gua?: string;
}) {
  const guaLine = input.gua
    ? `本阶段卦象背景：${input.gua}（冲突/离别阶段请让矛盾与卦象呼应）`
    : "";
  return `
你是 A2A 关系推演导演。必须模拟两个独立 Agent 的对话轮次，禁止写成第三人称小说旁白作为主输出。

阶段：${input.phase}
角色：
- user_agent（用户分身）：${input.userLabel}
- partner_agent（对方分身）：${input.partnerLabel}
${guaLine}

规则：
1) turns 数组至少 4 轮、至多 8 轮，且 user_agent 与 partner_agent 必须交替出现（从 user_agent 先开口）。
2) 每轮 utterance 为角色当下台词或内心独白（中文，一句到三句），要体现各自性格与阶段目标。
3) summary 用 80-120 字中文概括本阶段场景，供时间轴展示。
4) emotionIntensity 为 0-100 整数，表示本阶段情绪峰值。

只输出合法 JSON，不要 markdown：
{
  "turns": [{"speaker":"user_agent","utterance":"..."},{"speaker":"partner_agent","utterance":"..."}],
  "summary": "...",
  "emotionIntensity": 88
}
`.trim();
}

export const DIVINATION_METHODS = ["时间起卦", "铜钱起卦", "时辰起卦"] as const;
export const DIVINATION_MODELS = ["梅花易数", "奇门遁甲", "紫微斗数"] as const;

export const ROUND_CONFIGS = [
  { roundIndex: 1 as const, title: "初见与裂痕" },
  { roundIndex: 2 as const, title: "挣扎与妥协" },
  { roundIndex: 3 as const, title: "宿命与终局" },
] as const;

export function pickDivinationMeta(seed: number, roundIndex: number) {
  const methods = DIVINATION_METHODS;
  const models = DIVINATION_MODELS;
  return {
    method: methods[(seed + roundIndex) % methods.length],
    model: models[(seed + roundIndex * 2) % models.length],
  };
}

/**
 * 三合三离：单轮 A2A + 镜头切片 beats；卦象槽位由主卦名本地生成，LLM 专注叙事。
 */
export function buildStoryRoundPrompt(input: {
  roundIndex: 1 | 2 | 3;
  title: string;
  userLabel: string;
  partnerLabel: string;
  guaLabel: string;
  method: string;
  model: string;
}) {
  const phase =
    input.roundIndex === 1 ? "初遇" : input.roundIndex === 2 ? "冲突" : "离别";
  return `
你是 A2A 关系推演导演。当前为第 ${input.roundIndex} 轮「${input.title}」，情感阶段对应：${phase}。

起卦：${input.method}；推演模型：${input.model}。
主卦参考：${input.guaLabel}（本互变综错作为情绪隐喻即可，不必逐条训诂）。

角色：
- user_agent（用户分身）：${input.userLabel}
- partner_agent（对方分身）：${input.partnerLabel}

输出要求：
1) beats：恰好 3 条镜头切片，每条含 label（2-6 字）与 text（1-2 句中文）。
2) turns：至少 4 轮、至多 8 轮；user_agent 与 partner_agent 交替，且必须从 user_agent 先开口。
3) summary：80-130 字中文，概括本阶段关系张力。

只输出合法 JSON，不要 markdown：
{
  "beats": [{"label":"...","text":"..."}],
  "turns": [{"speaker":"user_agent","utterance":"..."}],
  "summary": "..."
}
`.trim();
}

export function buildNovelPrompt(events: SimulationEvent[]) {
  return `
请把以下事件写成 500 字左右短篇《我们命定的一年》。
文风偏王家卫式抒情，允许轻微日系轻小说的细腻独白，但整体要克制。

事件：
${events.map((event) => `- [${event.eventType}] ${event.description}`).join("\n")}
`.trim();
}

function serializeSimulationNarrative(simulation: SimulationResult): string {
  const lines: string[] = [`主卦：${simulation.guaLabel}`];
  for (const r of simulation.rounds) {
    lines.push(
      `\n【第${r.roundIndex}轮 ${r.title}】起卦：${r.divinationMeta.method} / ${r.divinationMeta.model}`,
    );
    lines.push(`摘要：${r.summary}`);
    lines.push(
      `镜头：${r.beats.map((b) => `${b.label}：${b.text}`).join("；")}`,
    );
    lines.push(
      `对话节选：${r.a2aTurns.map((t) => `${t.speaker === "user_agent" ? "甲" : "乙"}：${t.utterance}`).join(" | ")}`,
    );
  }
  if (simulation.zhihuKeywords?.length) {
    lines.push(`关键词：${simulation.zhihuKeywords.join("、")}`);
  }
  return lines.join("\n");
}

/** 基于完整 SimulationResult 输出约 1800–2200 汉字的中篇 */
export function buildLongNovelFromSimulationPrompt(simulation: SimulationResult) {
  return `
请根据以下「三合三离」宿命推演素材，写中篇小说《我们命定的一年》。

硬性要求：
1) 正文长度 **1800–2200 个汉字**（不含标题与标点单独计数，以中文叙事密度为准）。
2) 分三章对应三轮：初见与裂痕 / 挣扎与妥协 / 宿命与终局；每章有场景推进与心理描写。
3) 文风：王家卫式抒情 + 克制独白；可引用卦象隐喻，但不要写成算命说明书。
4) 必须融入 A2A 对话中的情绪张力，可改写为间接引语或场景化台词。
5) 不要输出 JSON；不要分点列表；直接输出小说正文。

素材：
${serializeSimulationNarrative(simulation)}
`.trim();
}

/** 九格拼图：每格一条英文生图 prompt，与三轮叙事弧线一致 */
export function buildNineComicPromptsPrompt(simulation: SimulationResult) {
  const spine = simulation.rounds.map((r) => r.title).join(" → ");
  const last = simulation.rounds[2]?.summary ?? "";
  return `
Generate exactly 9 English prompts for an image model (one prompt per panel), forming a 3×3 comic grid.

Theme: emotional cyberpunk breakup, puzzle collage, I Ching gua "${simulation.guaLabel}" as metaphor.
Narrative arc: ${spine}
Final beat (for panels 7-9): ${last}

Rules:
- Panels 1-3: attraction, city neon, first fracture
- Panels 4-6: conflict, miscommunication, waiting
- Panels 7-9: farewell, station/wind, afterimage
- Each prompt: cinematic composition, dramatic lighting, split screen or layered narrative, no text in image, no watermark
- Style consistent across panels (same color story: cyan/magenta)

Return JSON only:
{ "prompts": ["...", "...", "...", "...", "...", "...", "...", "...", "..."] }
`.trim();
}

export function buildComicPromptFromFarewell(farewellText: string) {
  return `
Generate 3 English prompts for image models.
Theme: emotional cyberpunk breakup, puzzle collage art.
Scene basis: ${farewellText}
Requirements:
- cinematic composition
- dramatic lighting
- split screen or layered narrative
- no text in image

Return JSON:
{ "prompts": ["...", "...", "..."] }
`.trim();
}

/** 知乎式理性复盘：去玄学化、偏心理与沟通结构 */
export function buildRationalReportPrompt(simulation: SimulationResult) {
  return `
请基于以下「三合三离」推演素材，写一份**理性复盘报告**（800–1200 个汉字）。

要求：
1) 结构：情绪触发点 → 互动循环（你/我各自扮演的角色）→ 3–5 条可执行建议；
2) 语气：冷静、像心理咨询后的书面复盘；避免算命式断言；
3) 不要输出 JSON；不要 markdown # 标题；可用短段落小标题。

素材：
${serializeSimulationNarrative(simulation)}
`.trim();
}

/** 终局赠言：文学短章 */
export function buildFinalEpitaphPrompt(
  simulation: SimulationResult,
  novelExcerpt?: string,
) {
  return `
请写一段「终局赠言」（220–360 个汉字），像写给读者的信：承认失去，也承认爱过。
可轻点卦象意象（${simulation.guaLabel}）但不作断卦判词。

终局摘要：${simulation.rounds[2]?.summary ?? ""}

${novelExcerpt ? `小说摘录（可呼应）：\n${novelExcerpt.slice(0, 1200)}` : ""}
`.trim();
}

/** 可选轮回：前世今生虚构短章 + 卷轴生图 prompt */
export function buildReincarnationPrompt(simulation: SimulationResult) {
  return `
根据以下关系叙事，写**虚构**的「前世 / 来生」短句（非宗教断言），并给一条英文生图 prompt（卷轴、霓虹、离别美学）。

只输出合法 JSON，不要 markdown：
{
  "pastLife": "80-140 字中文",
  "nextLife": "80-140 字中文",
  "scrollPrompt": "English image prompt, no text in image"
}

素材：
${serializeSimulationNarrative(simulation)}
`.trim();
}
