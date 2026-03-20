import { ok } from "@/lib/api-response";
import {
  DEMO_DESTINY_PROFILE,
  DEMO_GUA,
  DEMO_SIMULATION_EVENTS,
  DEMO_SIMULATION_RESULT,
} from "@/lib/demo-data";

/**
 * 一键演示用固定数据（不调用 LLM）。也可给前端 /demo 页写入 localStorage。
 */
export async function GET() {
  return ok(
    {
      gua: DEMO_GUA,
      profile: DEMO_DESTINY_PROFILE,
      events: DEMO_SIMULATION_EVENTS,
      simulation: DEMO_SIMULATION_RESULT,
    },
    "演示数据包",
  );
}
