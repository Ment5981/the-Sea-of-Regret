export interface UserProfile {
  id: string;
  mbti: string;
  birthDate: string;
  birthPlace: string;
  secondMeId: string;
}

export interface DestinyProfile extends UserProfile {
  baziElements: string[];
  hiddenTraits: string[];
  fateTag: string;
}

/** SOP 阶段一：觉醒录入 */
export type CalendarType = "solar" | "lunar";

export interface UserAwakeningInput {
  calendarType: CalendarType;
  birthDate: string;
  birthTime?: string;
  birthPlace: string;
  gender: string;
  displayName: string;
  mbti: string;
}

/** 八字/命理结构化摘要（真排盘可后续替换引擎） */
export interface BaziAnalysis {
  elements: string[];
  tenGods: string[];
  patternTags: string[];
  loveLandmines: string[];
  rawSummary: string;
}

/** 《分身人格特征报告》卡片数据 */
export interface TwinPersonaReport {
  keywords: string[];
  fateTone: string;
  fusionLine: string;
  loveLandmines: string[];
  bazi: BaziAnalysis;
}

export type SimulationEventType = "初遇" | "冲突" | "离别";

export type A2AgentRole = "user_agent" | "partner_agent";

export interface A2ATurn {
  speaker: A2AgentRole;
  utterance: string;
}

/** 兼容旧版时间轴事件 */
export interface SimulationEvent {
  timestamp: string;
  eventType: SimulationEventType;
  description: string;
  emotionIntensity: number;
  a2aTurns?: A2ATurn[];
}

export interface StoryReport {
  novelText: string;
  comicPrompts: string[];
  zhihuAdvice: string;
}

export interface DestinyFormInput {
  mbti: string;
  birthDate: string;
  birthPlace: string;
}

export interface DestinyProfileLLMRaw {
  bazi_analysis: string;
  personality_fusion: string[];
  fate_quotation: string;
}

export interface ZhihuAdviceItem {
  title: string;
  url: string;
  summary: string;
}

/** 阶段二：Discover 候选 */
export interface MatchCandidate {
  secondMeUserId: string;
  route?: string;
  displayName?: string;
  briefIntroduction?: string;
  destinyProfile?: DestinyProfile;
}

export type MatchWarningTag = "孽缘预警" | "良缘试探" | "劫数纠缠" | "平淡相守";

export interface PlazaMatchPayload {
  matchScore: number;
  warningTag: MatchWarningTag;
  partnerSecondMeId: string;
  partnerProfile: DestinyProfile;
}

/** 单卦线 */
export interface HexagramLine {
  name: string;
  imageMeaning: string;
  narrativeHint: string;
}

/** 本互变综错 */
export interface HexagramSlot {
  ben: HexagramLine;
  hu: HexagramLine;
  bian: HexagramLine;
  zong: HexagramLine;
  cuo: HexagramLine;
}

/** 三合三离：单轮叙事 */
export interface StoryRound {
  roundIndex: 1 | 2 | 3;
  title: string;
  divinationMeta: {
    method: string;
    model: string;
  };
  hexagrams: HexagramSlot;
  beats: { label: string; text: string }[];
  a2aTurns: A2ATurn[];
  summary: string;
}

/** 完整推演结果 */
export interface SimulationResult {
  /** 取第三轮或主卦作展示用 */
  guaLabel: string;
  rounds: StoryRound[];
  novelLong: string;
  nineFramePrompts: string[];
  zhihuKeywords: string[];
  rationalReport?: string;
  reincarnation?: {
    pastLife: string;
    nextLife: string;
    scrollPrompt?: string;
  };
  finalEpitaph?: string;
}

export interface ApiSuccess<T> {
  code: 0;
  message: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
  data: null;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
