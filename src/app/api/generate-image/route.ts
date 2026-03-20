import { fail, ok } from "@/lib/api-response";
import { isDemoMode } from "@/lib/env";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompts: string[] };
    if (!body.prompts?.length) return fail("缺少 prompts", 5001, 400);

    if (isDemoMode() || !process.env.OPENAI_API_KEY) {
      return ok(
        {
          imageUrls: body.prompts.slice(0, 9).map(() => FALLBACK_IMAGE),
          mode: isDemoMode() ? "demo" : "mock",
        },
        isDemoMode()
          ? "演示模式：跳过生图，返回占位图"
          : "图片服务未配置，返回占位图",
      );
    }

    const imageUrls: string[] = [];
    /** 九宫格最多 9 张；旧版 3 张仍兼容 */
    for (const prompt of body.prompts.slice(0, 9)) {
      try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            size: "1024x1024",
          }),
        });
        if (!response.ok) {
          imageUrls.push(FALLBACK_IMAGE);
          continue;
        }
        const result = (await response.json()) as {
          data?: Array<{ b64_json?: string; url?: string }>;
        };
        const first = result.data?.[0];
        if (first?.url) {
          imageUrls.push(first.url);
          continue;
        }
        if (first?.b64_json) {
          imageUrls.push(`data:image/png;base64,${first.b64_json}`);
          continue;
        }
        imageUrls.push(FALLBACK_IMAGE);
      } catch {
        imageUrls.push(FALLBACK_IMAGE);
      }
    }

    return ok({ imageUrls, mode: "live" }, "图片生成完成");
  } catch {
    return fail("图片生成失败，请稍后重试", 5002, 500);
  }
}
