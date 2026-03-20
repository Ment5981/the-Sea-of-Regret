"use client";

import Image from "next/image";
import { useState } from "react";
import type { SimulationEvent, SimulationResult, ZhihuAdviceItem } from "@/types";
import { LoadingSkeleton } from "@/components/loading-skeleton";

function readEvents() {
  if (typeof window === "undefined") return [] as SimulationEvent[];
  const raw = localStorage.getItem("simulation_events");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SimulationEvent[];
  } catch {
    return [];
  }
}

function readSimulation(): SimulationResult | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("simulation_result");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SimulationResult;
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const [loading, setLoading] = useState(false);
  const [novel, setNovel] = useState("");
  const [novelMode, setNovelMode] = useState<"long" | "short" | null>(null);
  const [comicPrompts, setComicPrompts] = useState<string[]>([]);
  const [comicMode, setComicMode] = useState<"nine" | "three" | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [advice, setAdvice] = useState<ZhihuAdviceItem[]>([]);
  const [rationalReport, setRationalReport] = useState("");
  const [finalEpitaph, setFinalEpitaph] = useState("");
  const [reincarnation, setReincarnation] = useState<
    SimulationResult["reincarnation"] | null
  >(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    const events = readEvents();
    const simulation = readSimulation();
    if (!simulation?.rounds?.length && !events.length) {
      setError("请先在 Simulation 页完成一次推演（需写入 simulation_result 或 simulation_events）。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const useSim = Boolean(simulation?.rounds?.length);
      const novelBody = (await (
        await fetch("/api/novel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            useSim ? { simulation } : { events },
          ),
        })
      ).json()) as {
        code: number;
        message: string;
        data?: { novelText: string; mode?: "long" | "short" };
      };

      const promptsBody = (await (
        await fetch("/api/comic-prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            useSim ? { simulation } : { events },
          ),
        })
      ).json()) as {
        code: number;
        message: string;
        data?: { comicPrompts: string[]; mode?: "nine" | "three" };
      };

      if (novelBody.code !== 0 || promptsBody.code !== 0) {
        throw new Error(novelBody.message || promptsBody.message);
      }

      const prompts = promptsBody.data?.comicPrompts ?? [];
      setNovel(novelBody.data?.novelText ?? "");
      setNovelMode(novelBody.data?.mode ?? null);
      setComicPrompts(prompts);
      setComicMode(promptsBody.data?.mode ?? null);

      const imageRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });
      const imageBody = (await imageRes.json()) as {
        code: number;
        data?: { imageUrls: string[] };
      };
      setImages(imageBody.data?.imageUrls ?? []);

      const keywordSeed =
        simulation?.zhihuKeywords?.[0] ?? "异地恋如何维持";
      const keyword = encodeURIComponent(keywordSeed);
      const adviceRes = await fetch(`/api/zhihu-search?keyword=${keyword}`);
      const adviceBody = (await adviceRes.json()) as {
        code: number;
        data?: { items: ZhihuAdviceItem[] };
      };
      setAdvice(adviceBody.data?.items ?? []);

      if (novelBody.data?.novelText) {
        localStorage.setItem("result_novel", novelBody.data.novelText);
      }

      if (useSim && simulation) {
        const [rationalRes, epitaphRes] = await Promise.all([
          fetch("/api/rational-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ simulation }),
          }),
          fetch("/api/final-epitaph", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              simulation,
              novelExcerpt: novelBody.data?.novelText,
            }),
          }),
        ]);
        const rationalJson = (await rationalRes.json()) as {
          code: number;
          data?: { rationalReport?: string };
        };
        const epitaphJson = (await epitaphRes.json()) as {
          code: number;
          data?: { finalEpitaph?: string };
        };
        if (rationalJson.code === 0 && rationalJson.data?.rationalReport) {
          setRationalReport(rationalJson.data.rationalReport);
        } else {
          setRationalReport("");
        }
        if (epitaphJson.code === 0 && epitaphJson.data?.finalEpitaph) {
          setFinalEpitaph(epitaphJson.data.finalEpitaph);
        } else {
          setFinalEpitaph("");
        }

        const reinRes = await fetch("/api/reincarnation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ simulation }),
        });
        const reinJson = (await reinRes.json()) as {
          code: number;
          data?: { reincarnation?: SimulationResult["reincarnation"] };
        };
        if (reinJson.code === 0 && reinJson.data?.reincarnation) {
          setReincarnation(reinJson.data.reincarnation);
        } else {
          setReincarnation(null);
        }
      } else {
        setRationalReport("");
        setFinalEpitaph("");
        setReincarnation(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold">Result</h1>
      <p className="text-slate-300">
        悲剧美学报告：约 2000 字中篇（有 <code className="text-xs text-slate-500">simulation_result</code> 时）+
        3×3 拼图漫画 + 知乎建议。
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-fit rounded-md bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-400 disabled:opacity-60"
      >
        {loading ? "生成中..." : "生成结果报告"}
      </button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      {loading ? <LoadingSkeleton rows={10} /> : null}

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="mb-2 text-lg font-medium text-cyan-300">
          小说《我们命定的一年》
          {novelMode ? (
            <span className="ml-2 text-xs font-normal text-slate-500">
              {novelMode === "long" ? "（约 2000 字管线）" : "（短篇 500 字）"}
            </span>
          ) : null}
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
          {novel || "点击「生成结果报告」后展示。"}
        </p>
      </section>

      {rationalReport ? (
        <section className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
          <h2 className="mb-2 text-lg font-medium text-amber-200">理性复盘（知乎向）</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-amber-50/95">
            {rationalReport}
          </p>
        </section>
      ) : null}

      {finalEpitaph ? (
        <section className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-4">
          <h2 className="mb-2 text-lg font-medium text-rose-200">终局赠言</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-rose-50/95">
            {finalEpitaph}
          </p>
        </section>
      ) : null}

      {reincarnation ? (
        <section className="rounded-lg border border-violet-800/50 bg-violet-950/25 p-4">
          <h2 className="mb-2 text-lg font-medium text-violet-200">
            可选轮回叙事（ENABLE_REINCARNATION）
          </h2>
          <p className="mb-2 text-sm text-violet-100/90">
            <span className="text-violet-400">前世：</span>
            {reincarnation.pastLife}
          </p>
          <p className="text-sm text-violet-100/90">
            <span className="text-violet-400">来生：</span>
            {reincarnation.nextLife}
          </p>
          {reincarnation.scrollPrompt ? (
            <p className="mt-2 text-xs text-violet-300/80">
              卷轴生图 prompt：{reincarnation.scrollPrompt}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h2 className="mb-2 text-lg font-medium text-fuchsia-300">
          拼图漫画 · 九宫格
          {comicMode ? (
            <span className="ml-2 text-xs font-normal text-slate-500">
              {comicMode === "nine" ? "9 帧" : "3 帧（旧版）"}
            </span>
          ) : null}
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 9 }).map((_, idx) => {
            const url = images[idx];
            return (
              <div
                key={`cell-${idx}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-slate-700/80 bg-slate-800"
              >
                {url ? (
                  <Image
                    src={url}
                    alt={`comic-${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 200px"
                    unoptimized={url.startsWith("data:")}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-600">
                    {idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {comicPrompts.length ? (
          <ul className="mt-3 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-slate-400">
            {comicPrompts.map((prompt, idx) => (
              <li key={`${idx}-${prompt.slice(0, 24)}`}>
                <span className="text-slate-500">{idx + 1}. </span>
                {prompt}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-lg border border-blue-700/60 bg-blue-950/50 p-4">
        <h2 className="mb-2 text-lg font-medium text-blue-300">知乎情感专家建议</h2>
        <p className="mb-2 text-xs text-slate-500">
          关键词优先取推演中的 zhihuKeywords；无则默认「异地恋如何维持」。
        </p>
        <ul className="space-y-2 text-sm">
          {advice.length ? (
            advice.map((item) => (
              <li key={item.title} className="rounded border border-blue-800/60 p-3">
                <a
                  href={item.url}
                  target="_blank"
                  className="font-medium text-blue-200 underline"
                  rel="noreferrer"
                >
                  {item.title}
                </a>
                <p className="mt-1 text-blue-100/90">{item.summary}</p>
              </li>
            ))
          ) : (
            <li className="text-slate-400">生成后会展示建议条目。</li>
          )}
        </ul>
      </section>
    </main>
  );
}
