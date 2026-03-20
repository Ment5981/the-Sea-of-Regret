const SECONDME_API_BASE_URL =
  process.env.SECONDME_API_BASE_URL ?? "https://api.mindverse.com/gate/lab";
const SECONDME_OAUTH_URL =
  process.env.SECONDME_OAUTH_URL ?? "https://go.second.me/oauth/";

export const SECONDME_COOKIE_ACCESS_TOKEN = "secondme_access_token";
export const SECONDME_COOKIE_REFRESH_TOKEN = "secondme_refresh_token";
export const SECONDME_COOKIE_OAUTH_STATE = "secondme_oauth_state";

/** 广场匹配成功后写入 HttpOnly Cookie，供服务端推演读取 */
export const PLAZA_MATCH_COOKIE = "plaza_match";

type SecondMeApiResponse<T> = {
  code: number;
  message?: string;
  data: T;
};

type OAuthTokenData = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  scope?: string[];
};

export function getSecondMeOAuthAuthorizeUrl(state: string) {
  const clientId = process.env.SECONDME_CLIENT_ID;
  const redirectUri = process.env.SECONDME_REDIRECT_URI;
  const scope = process.env.SECONDME_SCOPES ?? "user.info";

  if (!clientId || !redirectUri) {
    throw new Error("Missing SECONDME_CLIENT_ID or SECONDME_REDIRECT_URI");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return `${SECONDME_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.SECONDME_CLIENT_ID;
  const clientSecret = process.env.SECONDME_CLIENT_SECRET;
  const redirectUri = process.env.SECONDME_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing SECONDME_CLIENT_ID, SECONDME_CLIENT_SECRET, or SECONDME_REDIRECT_URI",
    );
  }

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(`${SECONDME_API_BASE_URL}/api/oauth/token/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed with status ${response.status}`);
  }

  const result = (await response.json()) as SecondMeApiResponse<OAuthTokenData>;
  if (result.code !== 0 || !result.data?.accessToken) {
    throw new Error(result.message ?? "Token exchange failed");
  }

  return result.data;
}

export async function getSecondMeUserInfo(accessToken: string) {
  const response = await fetch(
    `${SECONDME_API_BASE_URL}/api/secondme/user/info`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`User info request failed with status ${response.status}`);
  }

  const result = (await response.json()) as SecondMeApiResponse<
    Record<string, unknown>
  >;
  if (result.code !== 0) {
    throw new Error(result.message ?? "Failed to read profile");
  }

  return result.data;
}
