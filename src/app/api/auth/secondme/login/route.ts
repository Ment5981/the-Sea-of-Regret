import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getSecondMeOAuthAuthorizeUrl,
  SECONDME_COOKIE_OAUTH_STATE,
} from "@/lib/secondme";

export async function GET() {
  try {
    const state = randomUUID();
    const redirectUrl = getSecondMeOAuthAuthorizeUrl(state);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(SECONDME_COOKIE_OAUTH_STATE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start OAuth login";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
