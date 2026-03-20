"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import type { DestinyProfile, SimulationEvent, SimulationResult } from "@/types";

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadBundle() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/demo-bundle");
      const body = (await res.json()) as {
        code: number;
        data?: {
          profile: DestinyProfile;
          events: SimulationEvent[];
          gua: string;
          simulation: SimulationResult;
        };
      };
      if (body.code !== 0 || !body.data) throw new Error("加载演示包失败");
      localStorage.setItem("destiny_profile", JSON.stringify(body.data.profile));
      localStorage.setItem("simulation_events", JSON.stringify(body.data.events));
      localStorage.setItem("simulation_result", JSON.stringify(body.data.simulation));
      localStorage.setItem("demo_gua", body.data.gua);
      setMsg("已写入本地演示数据，可选择下方入口查看。");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-cyan-300">一键演示</h1>
      <p className="text-sm text-slate-400">
        从服务器拉取<strong className="text-slate-200">固定 A2A 推演数据</strong>
        写入浏览器本地存储，无需等待 LLM。适合路演与网络不稳定环境。
        <br />
        若已设置环境变量 <code className="text-fuchsia-300">DEMO_MODE=true</code>
        ，服务端也会跳过外部模型调用。
      </p>
      <Button type="button" onClick={loadBundle} disabled={loading}>
        {loading ? "加载中…" : "加载演示数据到本机"}
      </Button>
      {loading ? <LoadingSkeleton rows={3} /> : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/simulation")}>
          查看推演时间轴
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/result")}>
          查看结果页
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/")}>
          回首页
        </Button>
      </div>
    </main>
  );
}
