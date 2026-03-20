import type { ZhihuAdviceItem } from "@/types";

/** 构建知乎开放平台请求头：支持 Bearer + 可选 API Key（不同产品线字段名可能不同） */
export function buildZhihuHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = process.env.ZHIHU_API_TOKEN?.trim();
  const apiKey = process.env.ZHIHU_API_KEY?.trim();
  const keyHeader =
    process.env.ZHIHU_KEY_HEADER?.trim() || "X-API-Key";

  if (token) {
    const prefix = process.env.ZHIHU_TOKEN_PREFIX?.trim();
    headers.Authorization =
      prefix === "raw"
        ? token
        : prefix
          ? `${prefix} ${token}`
          : `Bearer ${token}`;
  }
  if (apiKey) {
    headers[keyHeader] = apiKey;
  }
  return headers;
}

export function hasZhihuCredentials(): boolean {
  return Boolean(
    process.env.ZHIHU_API_BASE_URL?.trim() &&
      (process.env.ZHIHU_API_TOKEN?.trim() || process.env.ZHIHU_API_KEY?.trim()),
  );
}

export function mockZhihu(keyword: string): ZhihuAdviceItem[] {
  return [
    {
      title: `如何看待「${keyword}」中的沟通断层？`,
      url: "https://www.zhihu.com",
      summary: "建议先区分情绪表达和事实表达，先共情后讨论结论。",
    },
    {
      title: "异地与高压工作下如何维系亲密关系？",
      url: "https://www.zhihu.com",
      summary: "建立固定沟通节律和冲突复盘机制，减少误解累积。",
    },
    {
      title: "关系走到分手边缘时，最该优先做什么？",
      url: "https://www.zhihu.com",
      summary: "识别核心冲突议题，避免泛化指责，聚焦可执行行动。",
    },
  ];
}
