import { cookies } from "next/headers";
import {
  createInviteRoom,
  getInviteRoom,
  joinInviteRoom,
} from "@/lib/match-store";
import { fail, ok } from "@/lib/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return fail("缺少 code", 7301, 400);

  const room = getInviteRoom(code);
  if (!room) return fail("房间不存在或已过期", 7302, 404);

  const ready = Boolean(room.guestSecondMeId);
  return ok(
    {
      code: room.code,
      hostSecondMeId: room.hostSecondMeId,
      guestSecondMeId: room.guestSecondMeId,
      ready,
    },
    "ok",
  );
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const selfId = cookieStore.get("secondme_user_id")?.value;
  if (!selfId) {
    return fail("未登录，无法创建/加入邀请房", 7303, 401);
  }

  let body: { code?: string } = {};
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    body = {};
  }

  const joinCode = typeof body.code === "string" ? body.code.trim() : "";

  if (!joinCode) {
    const room = createInviteRoom(selfId);
    return ok(
      {
        action: "created" as const,
        code: room.code,
        inviteUrl: `/plaza?room=${encodeURIComponent(room.code)}`,
      },
      "邀请房已创建",
    );
  }

  const result = joinInviteRoom(joinCode, selfId);
  if (!result.ok) return fail(result.reason, 7304, 400);

  return ok(
    {
      action: "joined" as const,
      code: result.room.code,
      hostSecondMeId: result.room.hostSecondMeId,
      guestSecondMeId: result.room.guestSecondMeId,
      ready: true,
    },
    "已加入邀请房",
  );
}
