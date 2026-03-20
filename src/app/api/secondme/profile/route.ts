import { cookies } from "next/headers";
import { getSecondMeUserInfo, SECONDME_COOKIE_ACCESS_TOKEN } from "@/lib/secondme";
import { fail, ok } from "@/lib/api-response";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SECONDME_COOKIE_ACCESS_TOKEN)?.value;

  if (!accessToken) {
    return fail("未登录 SecondMe", 7001, 401);
  }

  try {
    const profile = await getSecondMeUserInfo(accessToken);
    const response = ok(profile, "获取个人信息成功");
    const userId =
      (profile.userId as string | undefined) ??
      (profile.id as string | undefined) ??
      (profile.uid as string | undefined);
    if (userId) {
      response.cookies.set("secondme_user_id", userId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取资料失败";
    return fail(message, 7002, 500);
  }
}
