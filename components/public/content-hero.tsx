export function ContentHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="soft-grid border-b bg-white">
      <div className="page-container py-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.035em] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
      </div>
    </section>
  );
}
