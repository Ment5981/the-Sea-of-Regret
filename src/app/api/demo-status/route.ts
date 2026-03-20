import { ok } from "@/lib/api-response";
import { isDemoMode } from "@/lib/env";

export async function GET() {
  return ok({ demoMode: isDemoMode() }, "ok");
}
