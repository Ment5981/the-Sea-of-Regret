export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-4 w-full animate-pulse rounded bg-slate-700/50"
        />
      ))}
    </div>
  );
}
