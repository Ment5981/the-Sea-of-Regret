import { generateComicPrompts, generateNineComicPrompts } from "@/lib/comic-generator";
import { fail, ok } from "@/lib/api-response";
import type { SimulationEvent, SimulationResult } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      events?: SimulationEvent[];
      simulation?: SimulationResult;
    };

    if (body.simulation?.rounds?.length) {
      const comicPrompts = await generateNineComicPrompts(body.simulation);
      return ok({ comicPrompts, mode: "nine" as const }, "漫画提示词生成成功");
    }

    if (body.events?.length) {
      const farewell =
        body.events.find((event) => event.eventType === "离别")?.description ??
        body.events[body.events.length - 1].description;
      const comicPrompts = await generateComicPrompts(farewell);
      return ok({ comicPrompts, mode: "three" as const }, "漫画提示词生成成功");
    }

    return fail("缺少推演数据：请提供 simulation 或 events", 4001, 400);
  } catch {
    return fail("漫画提示词生成失败，请稍后重试", 4002, 500);
  }
}
