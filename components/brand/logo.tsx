import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center gap-2 rounded-lg"
      aria-label="SiEja — kembali ke beranda"
    >
      <img
        src="/brand/logo-sieja.png"
        alt="Logo SiEja"
        className={compact ? "h-10 w-24 object-contain" : "h-12 w-28 object-contain"}
      />
    </Link>
  );
}
