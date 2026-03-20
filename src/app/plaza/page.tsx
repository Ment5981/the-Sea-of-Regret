import { Suspense } from "react";
import { PlazaClient } from "./plaza-client";

export default function PlazaPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-cyan-300">宿命广场</h1>
        <p className="mt-2 text-sm text-slate-400">
          Discover 候选来自 SecondMe（失败时降级为本地 Mock）；邀请房用于线下传码兜底；「锁定搭档」会写入{" "}
          <code className="text-xs text-slate-500">plaza_match</code> HttpOnly Cookie。
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-slate-500">加载广场…</p>}
      >
        <PlazaClient />
      </Suspense>
    </main>
  );
}
