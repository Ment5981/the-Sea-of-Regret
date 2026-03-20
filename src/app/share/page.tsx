"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SharePage() {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share`
      : "/share";

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
        SecondMe Hackathon
      </p>
      <h1 className="text-2xl font-semibold leading-snug text-slate-100 md:text-3xl">
        命中注定的离别
      </h1>
      <p className="text-sm text-slate-400">
        如果恋爱可以预演，我们是否能避开所有遗憾？
        <br />
        <span className="text-amber-200/90">
          支持本项目请完成 SecondMe 授权登录（计入「用户选择」分）
        </span>
      </p>
      <a href="/api/auth/secondme/login">
        <Button className="h-12 px-8 text-base">使用 SecondMe 登录支持</Button>
      </a>
      <div className="flex w-full flex-col gap-2">
        <p className="text-xs text-slate-500">分享本拉票页</p>
        <code className="break-all rounded border border-slate-700 bg-slate-900 px-3 py-2 text-left text-xs text-slate-300">
          {shareUrl}
        </code>
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? "已复制链接" : "复制链接"}
        </Button>
      </div>
      <a href="/" className="text-sm text-slate-500 underline">
        进入完整体验
      </a>
    </main>
  );
}
