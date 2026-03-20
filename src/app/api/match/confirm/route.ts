import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { candidateToDestinyProfile } from "@/lib/partner-profile";
import { computeMatchScore, pickWarningTag } from "@/lib/match-score";
import { PLAZA_MATCH_COOKIE } from "@/lib/secondme";
import { fail } from "@/lib/api-response";
import type { DestinyProfile, MatchCandidate, PlazaMatchPayload } from "@/types";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const selfId = cookieStore.get("secondme_user_id")?.value;
  if (!selfId) {
    return fail("未登录，无法锁定匹配", 7401, 401);
  }

  let body: {
    userProfile?: DestinyProfile;
    partnerSecondMeId?: string;
    partnerCandidate?: MatchCandidate;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("请求体无效", 7403, 400);
  }

  if (!body.userProfile?.secondMeId || !body.partnerSecondMeId) {
    return fail("缺少 userProfile 或 partnerSecondMeId", 7402, 400);
  }

  const partnerCandidate: MatchCandidate = body.partnerCandidate ?? {
    secondMeUserId: body.partnerSecondMeId,
  };
  if (!partnerCandidate.secondMeUserId) {
    return fail("partner 信息不完整", 7404, 400);
  }

  const partnerProfile = candidateToDestinyProfile(partnerCandidate);
  const score = computeMatchScore(body.userProfile, partnerProfile);
  const pairKey = `${body.userProfile.secondMeId}|${partnerProfile.secondMeId}`;
  const warningTag = pickWarningTag(score, pairKey);

  const payload: PlazaMatchPayload = {
    matchScore: score,
    warningTag,
    partnerSecondMeId: partnerProfile.secondMeId,
    partnerProfile,
  };

  const res = NextResponse.json({
    code: 0,
    message: "匹配已锁定",
    data: payload,
  });

  res.cookies.set(PLAZA_MATCH_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 3,
  });

  return res;
}
