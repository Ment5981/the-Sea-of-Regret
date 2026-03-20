import { cookies } from "next/headers";
import { PLAZA_MATCH_COOKIE } from "@/lib/secondme";
import { fail, ok } from "@/lib/api-response";
import type { PlazaMatchPayload } from "@/types";

/** 读取 HttpOnly 中的广场匹配快照（供前端同步到 localStorage） */
export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PLAZA_MATCH_COOKIE)?.value;
  if (!raw) {
    return fail("暂无广场匹配记录", 7501, 404);
  }
  try {
    const payload = JSON.parse(raw) as PlazaMatchPayload;
    if (!payload?.partnerProfile?.secondMeId) {
      return fail("匹配记录损坏", 7502, 400);
    }
    return ok(payload, "ok");
  } catch {
    return fail("匹配记录损坏", 7502, 400);
  }
}
