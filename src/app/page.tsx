import { Suspense } from "react";
import { HomeClient } from "./home-client";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          加载中…
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
