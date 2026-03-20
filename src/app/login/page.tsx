export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold">登录 SecondMe</h1>
      <p className="text-slate-300">
        先完成 OAuth 登录，系统会用你的 SecondMe 身份作为分身唯一标识。
      </p>
      <a
        className="inline-flex w-fit rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        href="/api/auth/secondme/login"
      >
        使用 SecondMe 登录
      </a>
      <a className="text-sm text-slate-400 underline" href="/">
        返回首页
      </a>
    </main>
  );
}
