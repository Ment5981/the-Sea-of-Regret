"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DestinyProfile, MatchCandidate, PlazaMatchPayload } from "@/types";

type ApiOk<T> = { code: 0; message: string; data: T };

function readLocalProfile(): DestinyProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("destiny_profile");
    if (!raw) return null;
    return JSON.parse(raw) as DestinyProfile;
  } catch {
    return null;
  }
}

export function PlazaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get("room");

  const [profile, setProfile] = useState<DestinyProfile | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [discoverError, setDiscoverError] = useState("");
  const [loadingDiscover, setLoadingDiscover] = useState(true);

  const [inviteCode, setInviteCode] = useState("");
  const [roomState, setRoomState] = useState<{
    code: string;
    ready: boolean;
    hostSecondMeId?: string;
    guestSecondMeId?: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);

  const [matchFlash, setMatchFlash] = useState<PlazaMatchPayload | null>(null);
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    setProfile(readLocalProfile());
  }, []);

  const loadDiscover = useCallback(async () => {
    setLoadingDiscover(true);
    setDiscoverError("");
    try {
      const res = await fetch("/api/match/discover", { cache: "no-store" });
      const body = (await res.json()) as ApiOk<{ candidates: MatchCandidate[] }> & {
        code: number;
        message: string;
      };
      if (body.code !== 0) throw new Error(body.message);
      setCandidates(body.data.candidates);
    } catch (e) {
      setDiscoverError(e instanceof Error ? e.message : "Discover 加载失败");
      setCandidates([]);
    } finally {
      setLoadingDiscover(false);
    }
  }, []);

  useEffect(() => {
    void loadDiscover();
  }, [loadDiscover]);

  const pollRoom = useCallback(async (code: string) => {
    const res = await fetch(
      `/api/match/invite?code=${encodeURIComponent(code)}`,
      { cache: "no-store" },
    );
    const body = (await res.json()) as ApiOk<{
      code: string;
      hostSecondMeId: string;
      guestSecondMeId?: string;
      ready: boolean;
    }>;
    if (body.code !== 0) throw new Error(body.message);
    setRoomState({
      code: body.data.code,
      ready: body.data.ready,
      hostSecondMeId: body.data.hostSecondMeId,
      guestSecondMeId: body.data.guestSecondMeId,
    });
    return body.data.ready;
  }, []);

  useEffect(() => {
    if (!roomFromUrl) return;
    const code = roomFromUrl.trim().toUpperCase();
    setInviteCode(code);
    let cancelled = false;
    const tick = async () => {
      try {
        const ready = await pollRoom(code);
        if (!cancelled && ready) setInviteError("");
      } catch {
        if (!cancelled) setInviteError("房间无效或已过期");
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [roomFromUrl, pollRoom]);

  async function handleCreateInvite() {
    setInviteBusy(true);
    setInviteError("");
    try {
      const res = await fetch("/api/match/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as ApiOk<{
        code: string;
        inviteUrl: string;
      }>;
      if (body.code !== 0) throw new Error(body.message);
      setInviteCode(body.data.code);
      setRoomState({
        code: body.data.code,
        ready: false,
        hostSecondMeId: undefined,
        guestSecondMeId: undefined,
      });
      const url = new URL(window.location.href);
      url.searchParams.set("room", body.data.code);
      router.replace(url.pathname + url.search);
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleJoin() {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setInviteBusy(true);
    setInviteError("");
    try {
      const res = await fetch("/api/match/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as ApiOk<unknown>;
      if (body.code !== 0) throw new Error(body.message);
      await pollRoom(code);
      const url = new URL(window.location.href);
      url.searchParams.set("room", code);
      router.replace(url.pathname + url.search);
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "加入失败");
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleConfirm(partner: MatchCandidate) {
    const userProfile = readLocalProfile();
    if (!userProfile) {
      setConfirmError("请先在「觉醒」页生成分身档案");
      return;
    }
    setConfirmError("");
    try {
      const res = await fetch("/api/match/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile,
          partnerSecondMeId: partner.secondMeUserId,
          partnerCandidate: partner,
        }),
      });
      const body = (await res.json()) as ApiOk<PlazaMatchPayload>;
      if (body.code !== 0) throw new Error((body as unknown as { message: string }).message);
      const data = body.data;
      setMatchFlash(data);
      localStorage.setItem("partner_profile", JSON.stringify(data.partnerProfile));
      localStorage.setItem("plaza_match", JSON.stringify(data));
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : "确认失败");
    }
  }

  const roomHint = useMemo(() => {
    if (!roomState) return null;
    if (!roomState.ready) return "等待对方加入邀请房…";
    return "双方已就位，可在下方从 Discover 锁定搭档，或依赖本地档案直接进入推演。";
  }, [roomState]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-cyan-900/50 bg-slate-950/60 p-5">
        <h2 className="text-lg font-medium text-cyan-200">本地档案</h2>
        {profile ? (
          <p className="mt-2 text-sm text-slate-300">
            已加载分身：<span className="text-fuchsia-300">{profile.mbti}</span> ·{" "}
            {profile.birthPlace}
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-200/90">
            未找到 <code className="text-xs">destiny_profile</code>，请先完成觉醒。
          </p>
        )}
        <Link className="mt-3 inline-block text-sm text-cyan-400 underline" href="/create">
          去觉醒页
        </Link>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-lg font-medium text-slate-200">邀请房（兜底匹配）</h2>
        <p className="mt-1 text-xs text-slate-500">
          创建房间码分享给同伴；对方打开带 <code>?room=CODE</code> 的链接或手动输入加入。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={inviteBusy}
            onClick={() => void handleCreateInvite()}
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm text-white hover:bg-cyan-600 disabled:opacity-60"
          >
            创建邀请
          </button>
          <input
            className="min-w-[8rem] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm uppercase"
            placeholder="房间码"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          />
          <button
            type="button"
            disabled={inviteBusy}
            onClick={() => void handleJoin()}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
          >
            加入
          </button>
        </div>
        {inviteError ? <p className="mt-2 text-sm text-rose-400">{inviteError}</p> : null}
        {roomHint ? <p className="mt-2 text-sm text-emerald-300/90">{roomHint}</p> : null}
      </section>

      <section className="rounded-xl border border-fuchsia-900/40 bg-slate-950/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-fuchsia-200">Discover 列表</h2>
          <button
            type="button"
            className="text-xs text-slate-400 underline"
            onClick={() => void loadDiscover()}
          >
            刷新
          </button>
        </div>
        {loadingDiscover ? (
          <p className="mt-3 text-sm text-slate-500">加载中…</p>
        ) : discoverError ? (
          <p className="mt-3 text-sm text-rose-400">{discoverError}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {candidates.map((c) => (
              <li
                key={c.secondMeUserId}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-100">
                    {c.displayName ?? "匿名分身"}{" "}
                    <span className="text-xs text-slate-500">({c.secondMeUserId})</span>
                  </p>
                  <p className="text-sm text-slate-400">{c.briefIntroduction ?? "暂无简介"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleConfirm(c)}
                  className="rounded-md bg-fuchsia-600 px-3 py-2 text-sm text-white hover:bg-fuchsia-500"
                >
                  锁定搭档
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmError ? (
        <p className="text-sm text-rose-400">{confirmError}</p>
      ) : null}

      {matchFlash ? (
        <section className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-5 text-sm text-emerald-100">
          <p className="font-medium">匹配已写入 Cookie 与本地缓存</p>
          <p className="mt-2">
            匹配分 <span className="text-emerald-300">{matchFlash.matchScore}</span> · 标签{" "}
            <span className="text-emerald-300">{matchFlash.warningTag}</span>
          </p>
          <button
            type="button"
            className="mt-4 rounded-md border border-emerald-700 px-3 py-2 text-emerald-100 hover:bg-emerald-950/60"
            onClick={() => router.push("/simulation")}
          >
            前往宿命推演
          </button>
        </section>
      ) : null}

      <div className="flex gap-4 text-sm">
        <Link className="text-slate-400 underline" href="/">
          首页
        </Link>
        <Link className="text-slate-400 underline" href="/create">
          觉醒
        </Link>
      </div>
    </div>
  );
}
