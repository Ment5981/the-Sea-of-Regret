import { isDemoMode } from "@/lib/env";
import type { MatchCandidate } from "@/types";

type UnknownRecord = Record<string, unknown>;

function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  return [];
}

function pickString(obj: UnknownRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    const x = obj[k];
    if (typeof x === "string" && x.length) return x;
  }
  return undefined;
}

function normalizeItem(raw: unknown, index: number): MatchCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as UnknownRecord;
  const secondMeUserId =
    pickString(o, [
      "secondMeUserId",
      "secondmeUserId",
      "userId",
      "id",
      "uid",
      "openId",
    ]) ?? `discover-anon-${index}`;
  const displayName = pickString(o, ["displayName", "nickname", "name", "title"]);
  const briefIntroduction = pickString(o, [
    "briefIntroduction",
    "introduction",
    "bio",
    "description",
    "signature",
  ]);
  const route = pickString(o, ["route", "path", "link"]);
  return {
    secondMeUserId,
    displayName,
    briefIntroduction,
    route,
    destinyProfile: undefined,
  };
}

export function getMockDiscoverCandidates(): MatchCandidate[] {
  return [
    {
      secondMeUserId: "plaza-demo-aurora",
      displayName: "霓虹旅人",
      briefIntroduction: "INFJ · 城市漫游 · 喜欢末班地铁的白噪音",
    },
    {
      secondMeUserId: "plaza-demo-kite",
      displayName: "风筝与线",
      briefIntroduction: "ENTP · 辩论是亲密，沉默是告别预演",
    },
    {
      secondMeUserId: "plaza-demo-lune",
      displayName: "月台回声",
      briefIntroduction: "ISFP · 把情绪藏进歌单与雨声里",
    },
  ];
}

/**
 * 调用 SecondMe / 第三方 Discover（路径可通过环境变量覆盖）。
 * 失败或 DEMO_MODE 时返回本地 Mock，保证广场页可用。
 */
export async function fetchDiscoverUsers(accessToken: string): Promise<MatchCandidate[]> {
  if (isDemoMode()) return getMockDiscoverCandidates();

  const base =
    process.env.SECONDME_DISCOVER_BASE_URL ??
    "https://app.mindos.com/gate/in/rest/third-party-agent/v1";
  const pageNo = 1;
  const pageSize = 30;
  const url = `${base.replace(/\/$/, "")}/discover/users?pageNo=${pageNo}&pageSize=${pageSize}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return getMockDiscoverCandidates();
    const json = (await res.json()) as UnknownRecord;
    const data = json.data ?? json.result ?? json;
    let list: unknown[] = [];
    if (Array.isArray(data)) list = data;
    else if (data && typeof data === "object") {
      const d = data as UnknownRecord;
      list =
        asArray(d.list) ||
        asArray(d.records) ||
        asArray(d.items) ||
        asArray(d.users) ||
        [];
    }
    const out: MatchCandidate[] = [];
    list.forEach((item, i) => {
      const c = normalizeItem(item, i);
      if (c) out.push(c);
    });
    return out.length ? out : getMockDiscoverCandidates();
  } catch {
    return getMockDiscoverCandidates();
  }
}
