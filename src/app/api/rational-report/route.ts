import { generateRationalReport } from "@/lib/epilogue-generator";
import { fail, ok } from "@/lib/api-response";
import type { SimulationResult } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { simulation?: SimulationResult };
    if (!body.simulation?.rounds?.length) {
      return fail("缺少 simulation", 6101, 400);
    }
    const rationalReport = await generateRationalReport(body.simulation);
    return ok({ rationalReport }, "理性复盘生成成功");
  } catch {
    return fail("理性复盘生成失败", 6102, 500);
  }
}
