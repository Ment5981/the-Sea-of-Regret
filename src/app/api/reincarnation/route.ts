import { generateReincarnation } from "@/lib/epilogue-generator";
import { fail, ok } from "@/lib/api-response";
import type { SimulationResult } from "@/types";

export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_REINCARNATION !== "true") {
      return fail("轮回叙事未开启（设置 ENABLE_REINCARNATION=true）", 6301, 403);
    }
    const body = (await request.json()) as { simulation?: SimulationResult };
    if (!body.simulation?.rounds?.length) {
      return fail("缺少 simulation", 6302, 400);
    }
    const reincarnation = await generateReincarnation(body.simulation);
    return ok({ reincarnation }, "轮回短章生成成功");
  } catch {
    return fail("轮回短章生成失败", 6303, 500);
  }
}
