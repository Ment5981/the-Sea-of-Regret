import Link from "next/link";
import { cookies } from "next/headers";
import { getSecondMeUserInfo, SECONDME_COOKIE_ACCESS_TOKEN } from "@/lib/secondme";

async function getProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SECONDME_COOKIE_ACCESS_TOKEN)?.value;
    if (!token) return null;
    return await getSecondMeUserInfo(token);
  } catch {
    return null;
  }
}

const STEPS = [
  {
    href: "/create",
    title: "觉醒",
    desc: "分身报告、命盘与本地档案",
    color: "border-cyan-800/60 bg-cyan-950/30 text-cyan-200",
  },
  {
    href: "/plaza",
    title: "广场",
    desc: "Discover、邀请房、锁定搭档",
    color: "border-fuchsia-800/60 bg-fuchsia-950/25 text-fuchsia-200",
  },
  {
    href: "/simulation",
    title: "推演",
    desc: "三合三离、卦象槽、A2A 时间轴",
    color: "border-emerald-800/60 bg-emerald-950/25 text-emerald-200",
  },
  {
    href: "/result",
    title: "结果",
    desc: "长篇、九宫格、知乎、理性复盘",
    color: "border-amber-800/60 bg-amber-950/30 text-amber-200",
  },
] as const;

export default async function DashboardPage() {
  const profile = await getProfile();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-slate-100">控制台</h1>
        <p className="mt-2 text-sm text-slate-400">
          SecondMe 已连接后，可从这里进入完整推演流程；路演前也可使用「一键演示」。
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className={`rounded-xl border p-4 transition hover:brightness-110 ${step.color}`}
          >
            <p className="font-medium">{step.title}</p>
            <p className="mt-1 text-xs opacity-90">{step.desc}</p>
          </Link>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          className="rounded-md bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700"
          href="/demo"
        >
          一键演示数据
        </Link>
        <Link
          className="rounded-md border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
          href="/"
        >
          返回首页
        </Link>
        <Link
          className="rounded-md border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
          href="/share"
        >
          拉票分享页
        </Link>
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          SecondMe 资料（调试）
        </p>
        <pre className="max-h-64 overflow-auto text-xs text-slate-300">
          {JSON.stringify(profile ?? { hint: "未读取到资料，请先登录" }, null, 2)}
        </pre>
      </section>
    </main>
  );
}
