export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-[var(--color-cyan)]">▸</span> {title}
        </h1>
        {subtitle && <div className="text-[10px] font-mono tracking-widest text-[var(--color-text-dim)] mt-1">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
