import { cn } from "@/lib/utils";

export function ComponentPreview({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[380px] w-full items-center justify-center rounded-xl border border-border bg-card p-6",
        className,
      )}
    >
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
