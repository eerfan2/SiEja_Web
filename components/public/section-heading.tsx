export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>}
    </div>
  );
}
