import { generateNovel, generateNovelFromSimulation } from "@/lib/novel-generator";
import { fail, ok } from "@/lib/api-response";
import type { SimulationEvent, SimulationResult } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      events?: SimulationEvent[];
      simulation?: SimulationResult;
    };

    if (body.simulation?.rounds?.length) {
      const novelText = await generateNovelFromSimulation(body.simulation);
      return ok({ novelText, mode: "long" as const }, "小说生成成功");
    }

    if (body.events?.length) {
      const novelText = await generateNovel(body.events);
      return ok({ novelText, mode: "short" as const }, "小说生成成功");
    }

    return fail("缺少推演数据：请提供 simulation 或 events", 3001, 400);
  } catch {
    return fail("小说生成失败，请稍后重试", 3002, 500);
  }
}
