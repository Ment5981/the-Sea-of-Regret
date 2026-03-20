import { fail, ok } from "@/lib/api-response";
import {
  buildZhihuHeaders,
  hasZhihuCredentials,
  mockZhihu,
} from "@/lib/zhihu-fetch";
import type { ZhihuAdviceItem } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword")?.trim();
    if (!keyword) return fail("缺少 keyword", 6001, 400);

    const baseUrl = process.env.ZHIHU_API_BASE_URL?.trim();

    if (!baseUrl || !hasZhihuCredentials()) {
      return ok({ items: mockZhihu(keyword), mode: "mock" as const }, "未配置知乎或仅部分配置，返回模拟建议");
    }

    const path =
      process.env.ZHIHU_SEARCH_PATH?.trim() ||
      "/openapi/search/global";
    const target = `${baseUrl.replace(/\/$/, "")}${path}?keyword=${encodeURIComponent(keyword)}`;

    const response = await fetch(target, {
      headers: buildZhihuHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      return ok(
        { items: mockZhihu(keyword), mode: "mock" as const },
        "知乎接口不可用，返回模拟建议",
      );
    }

    const data = (await response.json()) as {
      data?: Array<{ title?: string; url?: string; excerpt?: string }>;
    };
    const items: ZhihuAdviceItem[] =
      data.data?.slice(0, 5).map((item) => ({
        title: item.title ?? "知乎建议",
        url: item.url ?? "https://www.zhihu.com",
        summary: item.excerpt ?? "暂无摘要",
      })) ?? mockZhihu(keyword);

    return ok({ items, mode: "live" as const }, "知乎建议获取成功");
  } catch {
    return fail("知乎建议获取失败", 6002, 500);
  }
}
