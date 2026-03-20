import { generateFinalEpitaph } from "@/lib/epilogue-generator";
import { fail, ok } from "@/lib/api-response";
import type { SimulationResult } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      simulation?: SimulationResult;
      novelExcerpt?: string;
    };
    if (!body.simulation?.rounds?.length) {
      return fail("缺少 simulation", 6201, 400);
    }
    const finalEpitaph = await generateFinalEpitaph(
      body.simulation,
      body.novelExcerpt,
    );
    return ok({ finalEpitaph }, "终局赠言生成成功");
  } catch {
    return fail("终局赠言生成失败", 6202, 500);
  }
}
