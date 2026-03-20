import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-6xl font-light text-slate-600">404</p>
      <h1 className="text-xl font-medium text-slate-200">页面未找到</h1>
      <p className="text-sm text-slate-500">
        这条命运线尚未接入，请从首页或控制台返回。
      </p>
      <Link
        href="/"
        className="rounded-md bg-cyan-600 px-5 py-2 text-sm text-white hover:bg-cyan-500"
      >
        回到首页
      </Link>
    </main>
  );
}
