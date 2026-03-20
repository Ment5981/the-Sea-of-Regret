"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DestinyProfile,
  DestinyProfileLLMRaw,
  TwinPersonaReport,
  UserAwakeningInput,
} from "@/types";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { TwinReportCard } from "@/components/twin-report-card";

const MBTI_OPTIONS = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

type GenerateResponse = {
  profile: DestinyProfile;
  raw: DestinyProfileLLMRaw;
};

type AwakenResponse = {
  twinReport: TwinPersonaReport;
  profile: DestinyProfile;
};

export default function CreatePage() {
  const router = useRouter();
  const [mbti, setMbti] = useState("INFP");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [calendarType, setCalendarType] = useState<UserAwakeningInput["calendarType"]>("solar");
  const [gender, setGender] = useState("保密");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAwaken, setLoadingAwaken] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [awaken, setAwaken] = useState<AwakenResponse | null>(null);

  async function handleAwaken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingAwaken(true);
    setError("");
    try {
      const payload: UserAwakeningInput = {
        calendarType,
        birthDate,
        birthTime: birthTime || undefined,
        birthPlace,
        gender,
        displayName: displayName.trim() || "未命名分身",
        mbti,
      };
      const response = await fetch("/api/awaken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        code: number;
        message: string;
        data: AwakenResponse;
      };
      if (body.code !== 0) throw new Error(body.message);
      setAwaken(body.data);
      localStorage.setItem("destiny_profile", JSON.stringify(body.data.profile));
      localStorage.setItem("twin_persona_report", JSON.stringify(body.data.twinReport));
    } catch (e) {
      setError(e instanceof Error ? e.message : "觉醒推演失败，请稍后重试");
    } finally {
      setLoadingAwaken(false);
    }
  }

  async function handleLegacyProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/destiny-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mbti, birthDate, birthPlace }),
      });
      const body = (await response.json()) as {
        code: number;
        message: string;
        data: GenerateResponse;
      };
      if (body.code !== 0) throw new Error(body.message);
      setResult(body.data);
      localStorage.setItem("destiny_profile", JSON.stringify(body.data.profile));
      localStorage.setItem("destiny_profile_raw", JSON.stringify(body.data.raw));
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-wide text-cyan-300">
        分身降生 · 觉醒与命盘
      </h1>
      <p className="text-sm text-slate-400">
        SOP 阶段一：填写觉醒信息，生成分身人格报告；也可使用下方「仅赛博命盘」走旧版 LLM 命盘。
      </p>

      <form
        onSubmit={handleAwaken}
        className="grid gap-4 rounded-xl border border-cyan-800/60 bg-slate-900/70 p-5"
      >
        <h2 className="text-lg font-medium text-cyan-200">觉醒录入</h2>

        <label className="grid gap-2 text-sm">
          称呼 / 分身名
          <input
            type="text"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="例如：阿离"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <label className="grid gap-2">
            历法
            <select
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              value={calendarType}
              onChange={(e) =>
                setCalendarType(e.target.value as UserAwakeningInput["calendarType"])
              }
            >
              <option value="solar">公历</option>
              <option value="lunar">农历</option>
            </select>
          </label>
          <label className="grid gap-2">
            性别
            <select
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="非二元">非二元</option>
              <option value="保密">保密</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          MBTI
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            value={mbti}
            onChange={(e) => setMbti(e.target.value)}
          >
            {MBTI_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            生日
            <input
              type="date"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            出生时辰（可选）
            <input
              type="time"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          出生地
          <input
            type="text"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="例如：上海"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loadingAwaken}
          className="rounded-md bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
        >
          {loadingAwaken ? "觉醒推演中..." : "觉醒并生成分身报告"}
        </button>
      </form>

      {awaken ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-fuchsia-300">分身报告</h2>
          <TwinReportCard report={awaken.twinReport} />
        </section>
      ) : null}

      <form
        onSubmit={handleLegacyProfile}
        className="grid gap-4 rounded-xl border border-slate-700/80 bg-slate-950/50 p-5"
      >
        <h2 className="text-base font-medium text-slate-300">仅赛博命盘（旧版 LLM JSON）</h2>
        <p className="text-xs text-slate-500">
          使用当前表单中的 MBTI、生日、出生地调用 /api/destiny-profile，展示原始 JSON 字段。
        </p>
        <button
          type="submit"
          disabled={loading || loadingAwaken}
          className="rounded-md border border-fuchsia-600/60 bg-transparent px-4 py-2 text-sm text-fuchsia-200 hover:bg-fuchsia-950/40 disabled:opacity-60"
        >
          {loading ? "推演中..." : "生成赛博命盘（旧版）"}
        </button>
      </form>

      <section className="rounded-xl border border-fuchsia-700/50 bg-slate-900 p-5">
        <h2 className="mb-3 text-lg font-semibold text-fuchsia-300">命盘展示（旧版）</h2>
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : result ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-slate-400">五行推演：</span>
              {result.raw.bazi_analysis}
            </p>
            <p>
              <span className="text-slate-400">融合特质：</span>
              {result.raw.personality_fusion.join(" / ")}
            </p>
            <p>
              <span className="text-slate-400">宿命引语：</span>
              {result.raw.fate_quotation}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">点击「仅赛博命盘」后在此显示。</p>
        )}
      </section>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push("/simulation")}
          className="rounded-md border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
        >
          前往宿命推演
        </button>
        <a className="self-center text-sm text-slate-400 underline" href="/plaza">
          前往广场匹配
        </a>
        <a className="self-center text-sm text-slate-400 underline" href="/dashboard">
          回到 Dashboard
        </a>
      </div>
    </main>
  );
}
