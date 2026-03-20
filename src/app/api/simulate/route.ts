import {
  roundsToLegacyEvents,
  runDestinySimulation,
} from "@/lib/simulation-engine";
import { fail, ok } from "@/lib/api-response";
import type { DestinyProfile, SimulationResult } from "@/types";

type RequestBody = {
  userProfile: DestinyProfile;
  partnerProfile?: DestinyProfile;
};

function mockPartner(): DestinyProfile {
  return {
    id: "partner-mock-001",
    secondMeId: "partner-secondme-id",
    mbti: "INFJ",
    birthDate: "1999-06-15",
    birthPlace: "杭州",
    baziElements: ["水木偏盛，金弱，情感表达深但慢热。"],
    hiddenTraits: ["理性温柔", "共情过载", "边界敏感"],
    fateTag: "你是我在平行宇宙里错过的同频者。",
  };
}

export type SimulateResponseData = {
  /** 三合三离完整结果 */
  simulation: SimulationResult;
  /** 主卦/展示用标签 */
  gua: string;
  /** 与旧版页面兼容的时间轴事件 */
  events: ReturnType<typeof roundsToLegacyEvents>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    if (!body.userProfile) return fail("缺少 userProfile", 2001, 400);
    const partner = body.partnerProfile ?? mockPartner();
    const simulation = await runDestinySimulation(body.userProfile, partner);
    const events = roundsToLegacyEvents(simulation.rounds);
    const payload: SimulateResponseData = {
      simulation,
      gua: simulation.guaLabel,
      events,
    };
    return ok(payload, "宿命推演完成");
  } catch {
    return fail("宿命推演失败，请稍后重试", 2002, 500);
  }
}
