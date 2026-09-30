"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (configured && !loading && !user) {
      router.replace(`/login-guru?next=${encodeURIComponent(pathname)}`);
    }
  }, [configured, loading, pathname, router, user]);

  if (!configured) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-5">
        <div className="w-full max-w-lg rounded-2xl border bg-white p-7 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fff4dd] text-[#9a6514]"><AlertTriangle className="size-5" /></div>
          <h1 className="mt-5 text-xl font-bold">Dashboard belum terhubung</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Firebase Web Configuration untuk project <strong>sieja-app</strong> belum tersedia. Tidak ada data dummy produksi yang ditampilkan.</p>
          <Button asChild variant="outline" className="mt-6 h-11 rounded-xl"><Link href="/">Kembali ke Website</Link></Button>
        </div>
      </main>
    );
  }

  if (loading || !user) {
    return <main className="grid min-h-screen place-items-center"><div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground"><LoaderCircle className="size-5 animate-spin text-primary" /> Memeriksa sesi guru...</div></main>;
  }

  return <>{children}</>;
}
