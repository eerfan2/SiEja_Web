export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
