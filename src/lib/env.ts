/**
 * 黑客松现场：DEMO_MODE=true 时跳过外部 LLM/生图调用，使用固定演示数据，保证不翻车。
 * 客户端展示条需 NEXT_PUBLIC_DEMO_MODE=true（与 DEMO_MODE 同步）。
 */
export function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}
