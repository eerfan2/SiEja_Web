"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeTeacherPassword, logoutTeacher } from "@/services/auth-service";

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setError("Kata sandi saat ini wajib diisi.");
      return;
    }
    if (cleanNew.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    if (cleanCurrent === cleanNew) {
      setError("Kata sandi baru harus berbeda dari kata sandi saat ini.");
      return;
    }

    setSaving(true);
    try {
      await changeTeacherPassword(cleanCurrent, cleanNew);
      toast.success("Kata sandi guru berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengubah kata sandi.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-2xl border bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
          <div className="grid size-9 place-items-center rounded-xl bg-[#eeeafd] text-primary">
            <KeyRound className="size-5" />
          </div>
          Ubah Kata Sandi Guru
        </CardTitle>
        <CardDescription>
          Perbarui kata sandi akun guru untuk menjaga keamanan akses dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                required
                placeholder="Masukkan kata sandi lama"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showCurrent ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
              >
                {showCurrent ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showNew ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
              >
                {showNew ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                required
                minLength={6}
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirm
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto h-11 rounded-xl shadow-xs"
            >
              {saving ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function logout() {
    await logoutTeacher();
    router.replace("/login-guru");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Akun"
        title="Pengaturan"
        description="Lihat informasi sesi guru dan kelola profil akun yang digunakan pada dashboard."
      />

      <div className="mt-6 grid max-w-2xl gap-6">
        <Card className="rounded-2xl border bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
                <div className="grid size-9 place-items-center rounded-xl bg-[#eeeafd] text-primary">
                  <UserRound className="size-5" />
                </div>
                Akun Guru
              </CardTitle>
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-800"
              >
                <CheckCircle2 className="size-3" /> Aktif
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
              <div className="pb-3.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Mail className="size-3.5" /> Email Akun
                </p>
                <p className="mt-1 break-all font-semibold text-slate-900">
                  {user?.email ?? "Tidak tersedia"}
                </p>
              </div>

              <div className="pt-3.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Shield className="size-3.5" /> User ID (UID)
                </p>
                <p className="mt-1 break-all font-mono text-xs text-slate-700">
                  {user?.uid ?? "Tidak tersedia"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 rounded-xl border-red-200 text-destructive hover:bg-red-50 hover:text-destructive active:scale-[0.98] transition-all"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Keluar dari Akun Guru
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Ubah Kata Sandi Guru */}
        <ChangePasswordCard />
      </div>
    </div>
  );
}
