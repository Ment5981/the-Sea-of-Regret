import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
import { fetchDiscoverUsers, getMockDiscoverCandidates } from "@/lib/discover";
import { isDemoMode } from "@/lib/env";
import { SECONDME_COOKIE_ACCESS_TOKEN } from "@/lib/secondme";
import { fail, ok } from "@/lib/api-response";

export async function GET() {
  if (isDemoMode()) {
    return ok({ candidates: getMockDiscoverCandidates() }, "ok");
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SECONDME_COOKIE_ACCESS_TOKEN)?.value;
  if (!accessToken) {
    return fail("未登录 SecondMe，无法拉取 Discover", 7201, 401);
  }

  try {
    const candidates = await fetchDiscoverUsers(accessToken);
    return ok({ candidates }, "ok");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Discover 请求失败";
    return fail(message, 7202, 502);
  }
}
