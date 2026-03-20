import { cookies } from "next/headers";
import { fail, ok } from "@/lib/api-response";
import {
  generateTwinPersonaReport,
  twinReportToDestinyProfile,
} from "@/lib/twin-persona";
import type { UserAwakeningInput } from "@/types";

function validate(input: Partial<UserAwakeningInput>): input is UserAwakeningInput {
  return (
    !!input &&
    (input.calendarType === "solar" || input.calendarType === "lunar") &&
    typeof input.birthDate === "string" &&
    input.birthDate.length > 0 &&
    typeof input.birthPlace === "string" &&
    input.birthPlace.length > 0 &&
    typeof input.gender === "string" &&
    typeof input.displayName === "string" &&
    input.displayName.length > 0 &&
    typeof input.mbti === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<UserAwakeningInput>;
    if (!validate(body)) {
      return fail(
        "缺少或非法字段：calendarType / birthDate / birthPlace / gender / displayName / mbti",
        1101,
        400,
      );
    }

    const cookieStore = await cookies();
    const secondMeId =
      cookieStore.get("secondme_user_id")?.value ?? "mock-secondme-user";

    const twinReport = await generateTwinPersonaReport(body);
    const profile = twinReportToDestinyProfile(body, twinReport, secondMeId);

    return ok(
      {
        twinReport,
        profile,
      },
      "觉醒推演完成",
    );
  } catch {
    return fail("觉醒推演失败，请稍后重试", 1102, 500);
  }
}
