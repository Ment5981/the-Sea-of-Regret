"use client";

import { useEffect, useMemo, useState } from "react";
import type { DestinyProfile, SimulationEvent, SimulationResult } from "@/types";
import { LoadingSkeleton } from "@/components/loading-skeleton";

function getProfileFromStorage() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("destiny_profile");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DestinyProfile;
  } catch {
    return null;
  }
}

function getPartnerFromStorage() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("partner_profile");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DestinyProfile;
  } catch {
    return null;
  }
}

export default function SimulationPage() {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [gua, setGua] = useState("");
  const [error, setError] = useState("");

  const profile = useMemo(() => getProfileFromStorage(), []);
  const partner = useMemo(() => getPartnerFromStorage(), []);

  useEffect(() => {
    const rawSim = localStorage.getItem("simulation_result");
    if (rawSim) {
      try {
        const sim = JSON.parse(rawSim) as SimulationResult;
        setSimulation(sim);
        setGua(sim.guaLabel);
      } catch {
        /* ignore */
      }
    }
    const rawEv = localStorage.getItem("simulation_events");
    if (rawEv) {
      try {
        setEvents(JSON.parse(rawEv) as SimulationEvent[]);
      } catch {
        /* ignore */
      }
    }
  }, []);

  async function handleRun() {
    if (!profile) {
      setError("请先在“分身降生”页面生成你的命盘。");
      return;
    }
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: profile,
          ...(partner ? { partnerProfile: partner } : {}),
        }),
      });
      const body = (await response.json()) as {
        code: number;
        message: string;
        data?: {
          events: SimulationEvent[];
          gua: string;
          simulation: SimulationResult;
        };
      };
      if (body.code !== 0 || !body.data) throw new Error(body.message);
      setEvents(body.data.events);
      setGua(body.data.gua);
      setSimulation(body.data.simulation);
      localStorage.setItem("simulation_events", JSON.stringify(body.data.events));
      localStorage.setItem("simulation_result", JSON.stringify(body.data.simulation));
    } catch (e) {
      setError(e instanceof Error ? e.message : "推演失败");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold">Simulation</h1>
      <p className="text-slate-300">
        三合三离：每轮含起卦元数据、本互变综错卦槽、三枚「镜头切片」与 A2A 双 Agent 轮次。
        {partner ? (
          <span className="text-emerald-300"> 已加载广场「搭档」档案。</span>
        ) : (
          <span className="text-slate-500"> 未设置搭档时将使用内置 Mock 对方。</span>
        )}
      </p>
      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="w-fit rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-60"
      >
        {running ? "推演进行中..." : "开始宿命推演"}
      </button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div className="mb-3 text-sm text-slate-400">
          主卦展示：<span className="text-cyan-300">{gua || "未开始"}</span>
          {simulation?.zhihuKeywords?.length ? (
            <span className="ml-3 text-slate-500">
              关键词：{simulation.zhihuKeywords.join(" · ")}
            </span>
          ) : null}
        </div>
        {running ? (
          <LoadingSkeleton rows={4} />
        ) : simulation?.rounds?.length ? (
          <ol className="space-y-6">
            {simulation.rounds.map((round) => (
              <li
                key={round.roundIndex}
                className="rounded border border-slate-700 bg-slate-950/50 p-3"
              >
                <p className="text-xs text-slate-500">
                  第 {round.roundIndex} 轮 · {round.title}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {round.divinationMeta.method} · {round.divinationMeta.model}
                </p>

                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-5">
                  {(
                    [
                      ["本", round.hexagrams.ben],
                      ["互", round.hexagrams.hu],
                      ["变", round.hexagrams.bian],
                      ["综", round.hexagrams.zong],
                      ["错", round.hexagrams.cuo],
                    ] as const
                  ).map(([tag, line]) => (
                    <div key={tag} className="rounded border border-cyan-900/40 bg-slate-900/80 p-2">
                      <p className="font-semibold text-cyan-400">
                        {tag}·{line.name}
                      </p>
                      <p className="mt-1 text-slate-500">{line.imageMeaning}</p>
                    </div>
                  ))}
                </div>

                <ul className="mt-3 space-y-1 text-sm text-slate-300">
                  {round.beats.map((b) => (
                    <li key={b.label}>
                      <span className="text-fuchsia-400">[{b.label}]</span> {b.text}
                    </li>
                  ))}
                </ul>

                <p className="mt-2 text-xs font-semibold text-emerald-400/90">A2A 双 Agent</p>
                <ul className="mt-2 space-y-2">
                  {round.a2aTurns.map((turn, ti) => (
                    <li
                      key={`${round.roundIndex}-t-${ti}`}
                      className={`rounded-md px-3 py-2 text-sm ${
                        turn.speaker === "user_agent"
                          ? "ml-0 mr-6 border border-cyan-800/50 bg-cyan-950/40"
                          : "ml-6 mr-0 border border-fuchsia-800/50 bg-fuchsia-950/30"
                      }`}
                    >
                      <span className="text-xs text-slate-500">
                        {turn.speaker === "user_agent" ? "用户分身" : "对方分身"}
                      </span>
                      <p className="mt-1 text-slate-200">{turn.utterance}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-slate-400">场景摘要：{round.summary}</p>
              </li>
            ))}
          </ol>
        ) : events.length ? (
          <ol className="space-y-4">
            {events.map((event, index) => (
              <li key={`${event.timestamp}-${index}`} className="rounded border border-slate-700 p-3">
                <p className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</p>
                <p className="mt-1 text-sm font-semibold text-cyan-300">
                  {event.eventType}
                  <span className="ml-2 text-xs font-normal text-emerald-400">A2A 双 Agent 轮次</span>
                </p>
                {event.a2aTurns?.length ? (
                  <ul className="mt-2 space-y-2">
                    {event.a2aTurns.map((turn, ti) => (
                      <li
                        key={`${event.timestamp}-t-${ti}`}
                        className={`rounded-md px-3 py-2 text-sm ${
                          turn.speaker === "user_agent"
                            ? "ml-0 mr-8 border border-cyan-800/50 bg-cyan-950/40"
                            : "ml-8 mr-0 border border-fuchsia-800/50 bg-fuchsia-950/30"
                        }`}
                      >
                        <span className="text-xs text-slate-500">
                          {turn.speaker === "user_agent" ? "用户分身" : "对方分身"}
                        </span>
                        <p className="mt-1 text-slate-200">{turn.utterance}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-2 text-sm text-slate-300">场景摘要：{event.description}</p>
                <p className="mt-1 text-xs text-slate-400">情绪强度：{event.emotionIntensity}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-400">点击按钮后将在此展示三合三离推演。</p>
        )}
      </section>
      <a className="text-sm underline" href="/result">
        前往结果页（小说/漫画/建议）
      </a>
    </main>
  );
}
