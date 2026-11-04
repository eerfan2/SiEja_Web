"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PublicShell } from "@/components/public/public-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginTeacher } from "@/services/auth-service";

export function LoginPage() {
  const { user, loading: authLoading, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await loginTeacher(identifier, password);
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/dashboard") ? next : "/dashboard");
    } catch (loginError) {
      const code = typeof loginError === "object" && loginError && "code" in loginError ? String(loginError.code) : "";
      if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
        setError("Username atau password salah. Periksa kembali data login Anda.");
      } else if (code.includes("too-many-requests")) {
        setError("Terlalu banyak percobaan login. Tunggu sebentar lalu coba kembali.");
      } else if (code.includes("network")) {
        setError("Koneksi ke Firebase gagal. Periksa jaringan lalu coba kembali.");
      } else {
        setError("Login gagal. Coba kembali.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicShell>
      <main className="soft-grid border-b">
        <div className="page-container grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:py-16">
          <div className="mx-auto hidden w-full max-w-sm lg:block">
            <div className="rounded-[2rem] border bg-white p-3 shadow-[0_24px_65px_rgba(74,62,61,.16)]">
              <img src="/screenshots/login-guru.png" alt="Screenshot asli halaman login guru SiEja" className="aspect-[390/892] w-full rounded-[1.4rem] object-cover" />
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md rounded-[1.5rem] border bg-white shadow-[0_20px_55px_rgba(74,62,61,.1)]">
            <CardHeader className="space-y-3 p-6 pb-2 sm:p-8 sm:pb-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#eeeafd] text-primary"><LockKeyhole className="size-5" /></div>
              <CardTitle className="text-2xl">Login Guru</CardTitle>
              <CardDescription className="leading-6">Gunakan kredensial Firebase Authentication yang sama dengan aplikasi Android SiEja.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4 sm:p-8 sm:pt-5">
              {!configured && (
                <Alert className="mb-5 border-[#e3cda3] bg-[#fff8e8] text-[#795316]">
                  <ShieldCheck className="size-4" />
                  <AlertTitle>Konfigurasi Firebase Web belum dipasang</AlertTitle>
                  <AlertDescription className="leading-6">Login akan aktif setelah enam environment variable Firebase project <strong>sieja-app</strong> diberikan.</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive" className="mb-5" role="alert">
                  <AlertTitle>Login gagal</AlertTitle><AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Username</Label>
                  <Input id="identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="h-12" disabled={!configured || submitting} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pr-12" disabled={!configured || submitting} required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} disabled={!configured}>
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="h-12 w-full rounded-xl" disabled={!configured || submitting || authLoading}>
                  <LogIn className="size-4" /> {submitting ? "Memeriksa akun..." : "Masuk ke Dashboard"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </PublicShell>
  );
}
