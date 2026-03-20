import type { TwinPersonaReport } from "@/types";

export function TwinReportCard({ report }: { report: TwinPersonaReport }) {
  return (
    <div className="space-y-4 rounded-xl border border-cyan-500/40 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-fuchsia-950/30 p-5 shadow-lg shadow-cyan-950/40">
      <header className="border-b border-cyan-800/50 pb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400/80">
          Twin Persona Report
        </p>
        <h3 className="mt-1 text-lg font-semibold text-cyan-100">
          《分身人格特征报告》
        </h3>
      </header>

      <div className="flex flex-wrap gap-2">
        {report.keywords.map((k) => (
          <span
            key={k}
            className="rounded-full border border-fuchsia-500/40 bg-fuchsia-950/40 px-2.5 py-0.5 text-xs text-fuchsia-100"
          >
            {k}
          </span>
        ))}
      </div>

      <section className="space-y-2 text-sm leading-relaxed text-slate-200">
        <p>
          <span className="text-slate-500">宿命基调 · </span>
          {report.fateTone}
        </p>
        <p className="border-l-2 border-fuchsia-600/60 pl-3 text-fuchsia-100/95 italic">
          {report.fusionLine}
        </p>
      </section>

      <section className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-sm">
        <p className="mb-2 text-xs font-medium text-amber-200/90">情感雷区</p>
        <ul className="list-inside list-disc space-y-1 text-amber-100/85">
          {report.loveLandmines.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="text-xs leading-relaxed text-slate-400">
        <p className="mb-1 font-medium text-slate-300">八字占位摘要</p>
        <p>{report.bazi.rawSummary}</p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span>五行：{report.bazi.elements.join("、")}</span>
          <span>十神：{report.bazi.tenGods.slice(0, 4).join("、")}</span>
        </p>
      </section>
    </div>
  );
}
