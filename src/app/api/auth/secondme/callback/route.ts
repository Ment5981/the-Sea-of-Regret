import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  SECONDME_COOKIE_ACCESS_TOKEN,
  SECONDME_COOKIE_OAUTH_STATE,
  SECONDME_COOKIE_REFRESH_TOKEN,
} from "@/lib/secondme";
import { verifySignedOAuthState } from "@/lib/oauth-state";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_code_or_state", request.url));
  }

  const cookieStore = await cookies();
  /** 优先：HMAC 签名 state（不依赖 Cookie，避免重定向丢 Cookie）。兼容：旧版 UUID + Cookie。 */
  const savedState = cookieStore.get(SECONDME_COOKIE_OAUTH_STATE)?.value;
  const stateOk =
    verifySignedOAuthState(state) ||
    Boolean(savedState && savedState === state);

  if (!stateOk) {
    return NextResponse.redirect(new URL("/?error=invalid_oauth_state", request.url));
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const response = NextResponse.redirect(new URL("/?login=success", request.url));

    response.cookies.set(SECONDME_COOKIE_ACCESS_TOKEN, tokenData.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: tokenData.expiresIn ?? 60 * 60 * 2,
    });

    if (tokenData.refreshToken) {
      response.cookies.set(SECONDME_COOKIE_REFRESH_TOKEN, tokenData.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    response.cookies.set(SECONDME_COOKIE_OAUTH_STATE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "oauth_callback_failed";
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, request.url));
  }
}
