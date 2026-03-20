"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeClient() {
  const [profileResult, setProfileResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/demo-status")
      .then((r) => r.json())
      .then((b: { data?: { demoMode?: boolean } }) =>
        setDemoMode(!!b.data?.demoMode),
      )
      .catch(() => setDemoMode(false));
  }, []);

  /**
   * SecondMe / OAuth 若把「重定向 URI」配成站点根路径（如 https://xxx.vercel.app/），
   * 授权后会回到 /?code=...&state=... 而不会命中 /api/auth/secondme/callback，导致无法换 token、首页一直显示「尚未登录」。
   * 这里自动转发到服务端回调完成换票。
   */
  useEffect(() => {
    if (searchParams.get("login") === "success") return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state) return;

    if (typeof window === "undefined") return;
    const q = window.location.search;
    window.location.replace(`/api/auth/secondme/callback${q}`);
  }, [searchParams]);

  const statusText = useMemo(() => {
    const login = searchParams.get("login");
    const error = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (login === "success") return "SecondMe OAuth 登录成功。";
    if (error) return `登录回调异常：${error}`;
    if (code && state)
      return "正在完成登录（已将 OAuth 回调转发到服务端）…";
    return "尚未登录。";
  }, [searchParams]);

  async function handleLoadProfile() {
    setLoading(true);
    setProfileResult("");
    try {
      const response = await fetch("/api/secondme/profile", { method: "GET" });
      const body = (await response.json()) as Record<string, unknown>;
      setProfileResult(JSON.stringify(body, null, 2));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "读取 SecondMe 资料失败";
      setProfileResult(JSON.stringify({ error: message }, null, 2));
    } finally {
      setLoading(false);
    }
  }

  function handleReplay() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("simulation_events");
    localStorage.removeItem("simulation_result");
    localStorage.removeItem("partner_profile");
    localStorage.removeItem("result_novel");
    localStorage.removeItem("plaza_match");
    alert("已清空本地推演与搭档缓存，可从「觉醒」或「广场」重新开始。");
  }

  function handleShare() {
    const path = "/share";
    if (typeof window !== "undefined") {
      window.open(path, "_blank");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <h1 className="text-3xl font-semibold">命中注定的离别</h1>
        <p className="text-sm text-slate-300">
          如果恋爱可以预演，我们是否能避开所有遗憾？
          这里是你的 A2A 情感推演工作台。
        </p>

        <section className="rounded-xl border border-cyan-900/50 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-cyan-300">
            SOP 全流程
          </h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            <li className="flex flex-wrap gap-x-2">
              <span className="text-cyan-500">①</span>
              <span>SecondMe 登录 → 拉 OAuth 计分</span>
            </li>
            <li className="flex flex-wrap gap-x-2">
              <span className="text-cyan-500">②</span>
              <Link href="/create" className="text-fuchsia-300 underline">
                觉醒
              </Link>
              <span>：分身报告 + 命盘</span>
            </li>
            <li className="flex flex-wrap gap-x-2">
              <span className="text-cyan-500">③</span>
              <Link href="/plaza" className="text-fuchsia-300 underline">
                广场
              </Link>
              <span>：Discover / 邀请房 / 锁定搭档</span>
            </li>
            <li className="flex flex-wrap gap-x-2">
              <span className="text-cyan-500">④</span>
              <Link href="/simulation" className="text-fuchsia-300 underline">
                三合三离推演
              </Link>
              <span>：卦象槽 + A2A</span>
            </li>
            <li className="flex flex-wrap gap-x-2">
              <span className="text-cyan-500">⑤</span>
              <Link href="/result" className="text-fuchsia-300 underline">
                结果页
              </Link>
              <span>：长篇 + 九宫格 + 知乎 + 理性复盘 / 终局赠言（可选轮回）</span>
            </li>
          </ol>
        </section>
        <p className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/90">
          <strong className="text-amber-200">用户选择分提示：</strong>
          黑客松「用户选择」按 <strong>OAuth 授权登录</strong> 用户数计分。请先完成
          SecondMe 登录后再体验全流程，并欢迎转发本页给亲友授权支持。
        </p>
        {demoMode ? (
          <p className="rounded-lg border border-fuchsia-800/60 bg-fuchsia-950/30 px-3 py-2 text-xs text-fuchsia-100/90">
            <strong className="text-fuchsia-200">演示模式已开启：</strong>
            已跳过外部 LLM/生图调用，使用固定数据保证现场稳定。关闭请移除环境变量{" "}
            <code className="text-fuchsia-300">DEMO_MODE</code>。
          </p>
        ) : null}

        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm">
          当前状态：{statusText}
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/api/auth/secondme/login">
            <Button>使用 SecondMe 登录</Button>
          </a>
          <Button
            type="button"
            onClick={handleLoadProfile}
            disabled={loading}
            variant="outline"
          >
            {loading ? "读取中..." : "获取我的 SecondMe 资料"}
          </Button>
          <a href="/create">
            <Button variant="outline">分身降生</Button>
          </a>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <a className="underline" href="/login">
            /login
          </a>
          <a className="underline" href="/dashboard">
            /dashboard
          </a>
          <a className="underline" href="/plaza">
            /plaza
          </a>
          <a className="underline" href="/simulation">
            /simulation
          </a>
          <a className="underline" href="/result">
            /result
          </a>
          <a className="underline" href="/share">
            /share
          </a>
          <a className="underline" href="/demo">
            /demo
          </a>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleReplay}>
            重新推演
          </Button>
          <Button type="button" variant="outline" onClick={handleShare}>
            打开拉票分享页
          </Button>
          <Link
            href="/demo"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            一键演示
          </Link>
        </div>

        <pre className="min-h-56 overflow-x-auto rounded-lg border border-slate-700 bg-black/40 p-4 text-xs text-slate-200">
          {profileResult || "点击“获取我的 SecondMe 资料”后，这里会显示返回结果。"}
        </pre>
      </main>
    </div>
  );
}
