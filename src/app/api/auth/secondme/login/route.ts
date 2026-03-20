import { NextResponse } from "next/server";
import { getSecondMeOAuthAuthorizeUrl } from "@/lib/secondme";
import { createSignedOAuthState } from "@/lib/oauth-state";

export async function GET() {
  try {
    const state = createSignedOAuthState();
    const redirectUrl = getSecondMeOAuthAuthorizeUrl(state);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start OAuth login";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
