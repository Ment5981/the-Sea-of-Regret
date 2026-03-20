import { cookies } from "next/headers";
import { generateDestinyProfile } from "@/lib/agent-factory";
import { fail, ok } from "@/lib/api-response";
import type { DestinyFormInput } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DestinyFormInput;
    if (!body.mbti || !body.birthDate || !body.birthPlace) {
      return fail("缺少必填字段：mbti / birthDate / birthPlace", 1001, 400);
    }

    const cookieStore = await cookies();
    const secondMeId =
      cookieStore.get("secondme_user_id")?.value ?? "mock-secondme-user";
    const result = await generateDestinyProfile({ ...body, secondMeId });
    return ok(result, "命盘生成成功");
  } catch {
    return fail("命盘生成失败，请稍后重试", 1002, 500);
  }
}
