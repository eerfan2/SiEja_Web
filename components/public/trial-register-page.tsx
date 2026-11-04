"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Info,
  KeyRound,
  RotateCcw,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStudent } from "@/services/student-service";
import type { NewStudentInput } from "@/types/sieja";

const APK_DOWNLOAD_URL =
  "https://github.com/eerfan2/SiEja/releases/latest/download/SiEja.apk";

export function TrialRegisterPage() {
  const [form, setForm] = useState<NewStudentInput>({
    namaLengkap: "",
    username: "",
    usia: 6,
    jenisKelamin: "Laki-laki",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredPin, setRegisteredPin] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<NewStudentInput | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const cleanNama = form.namaLengkap.trim();
    const cleanUsername = form.username.trim().toLowerCase();

    if (cleanNama.length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      setSaving(false);
      return;
    }

    if (cleanUsername.length < 2) {
      setError("Username minimal 2 karakter.");
      setSaving(false);
      return;
    }

    try {
      const generatedPin = await createStudent({
        ...form,
        namaLengkap: cleanNama,
        username: cleanUsername,
      });

      setRegisteredPin(generatedPin);
      setRegisteredData({
        ...form,
        namaLengkap: cleanNama,
        username: cleanUsername,
      });
      toast.success("Pendaftaran akun siswa berhasil!");
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan akun. Silakan coba kembali.";
      const isPermissionDenied =
        rawMsg.toLowerCase().includes("permission") ||
        rawMsg.toLowerCase().includes("insufficient");
      const msg = isPermissionDenied
        ? "Izin Firebase belum diaktifkan untuk pendaftaran publik. Harap perbarui aturan Firestore Security Rules di Firebase Console agar mengizinkan penambahan siswa uji coba."
        : rawMsg;
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm({
      namaLengkap: "",
      username: "",
      usia: 6,
      jenisKelamin: "Laki-laki",
    });
    setError(null);
    setRegisteredPin(null);
    setRegisteredData(null);
  }

  function copyCredentials() {
    if (!registeredData || !registeredPin) return;
    const text = `Akun SiEja (Siswa Uji Coba)\nNama: ${registeredData.namaLengkap}\nUsername: ${registeredData.username}\nPIN: ${registeredPin}`;
    navigator.clipboard.writeText(text);
    toast.success("Informasi akun berhasil disalin ke clipboard!");
  }

  return (
    <PublicShell>
      <main>
        <ContentHero
          eyebrow="Uji Coba Mandiri"
          title="Pendaftaran Akun Siswa"
          description="Daftarkan akun uji coba secara mandiri untuk mencoba langsung peran sebagai siswa dan bermain di aplikasi SiEja Android."
        />

        <section className="page-container py-10 sm:py-16">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Keterangan Pemberitahuan Uji Coba */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 text-sm text-amber-950 shadow-xs">
              <div className="flex gap-3.5">
                <Info className="size-5 shrink-0 text-amber-700 mt-0.5" />
                <div className="space-y-1.5 leading-6">
                  <p className="font-bold text-amber-900">
                    Keterangan Pendaftaran Akun Uji Coba:
                  </p>
                  <p className="text-amber-800 text-xs sm:text-sm">
                    Fitur pendaftaran mandiri ini disediakan untuk keperluan{" "}
                    <strong>uji coba aplikasi SiEja</strong>. Saat ini belum ada
                    guru yang mengelola kelas Anda, sehingga Anda dapat
                    mendaftarkan akun sendiri untuk mencoba seluruh permainan
                    mengeja dan fitur belajar sebagai siswa.
                  </p>
                  <p className="text-amber-800/90 text-xs italic">
                    *Pada implementasi penuh di sekolah, seluruh akun siswa akan
                    dikelola dan didaftarkan secara terpusat oleh Guru melalui
                    Dashboard Guru.
                  </p>
                </div>
              </div>
            </div>

            {/* Konten: Sukses atau Form Pendaftaran */}
            {registeredPin && registeredData ? (
              <Card className="rounded-[1.75rem] border-2 border-emerald-300 bg-white p-2 shadow-md sm:p-4">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <CardTitle className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
                    Pendaftaran Berhasil! 🎉
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Akun siswa uji coba Anda telah siap. Simpan dan catat
                    informasi login berikut untuk masuk ke aplikasi Android.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-2">
                  {/* Kotak Ringkasan Kredensial */}
                  <div className="rounded-2xl border border-indigo-100 bg-[#f8f7ff] p-5 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3.5 shadow-xs">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <User className="size-3.5 text-primary" /> Username
                          Login
                        </span>
                        <p className="mt-1.5 text-lg font-bold font-mono text-indigo-950">
                          {registeredData.username}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-xs">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                          <KeyRound className="size-3.5 text-emerald-700" /> PIN
                          Siswa (3 Digit)
                        </span>
                        <p className="mt-1 text-2xl font-black tracking-[0.25em] text-emerald-900 font-mono">
                          {registeredPin}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-indigo-100/80 pt-3 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
                      <span>Nama Siswa: <strong>{registeredData.namaLengkap}</strong></span>
                      <span>Usia: <strong>{registeredData.usia} Tahun</strong> • {registeredData.jenisKelamin}</span>
                    </div>

                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyCredentials}
                        className="w-full rounded-xl border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-50"
                      >
                        <Copy className="mr-2 size-3.5" /> Salin Data Akun
                      </Button>
                    </div>
                  </div>

                  {/* Petunjuk Langkah Selanjutnya */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Langkah Selanjutnya:
                    </p>
                    <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                      <li className="flex items-start gap-2.5">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white mt-0.5">
                          1
                        </span>
                        <span>Unduh dan pasang aplikasi <strong>SiEja APK</strong> di perangkat Android Anda.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white mt-0.5">
                          2
                        </span>
                        <span>Buka aplikasi SiEja, lalu pilih peran <strong>Siswa</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white mt-0.5">
                          3
                        </span>
                        <span>
                          Masukkan Username <strong>{registeredData.username}</strong> dan PIN <strong>{registeredPin}</strong> untuk mulai bermain!
                        </span>
                      </li>
                    </ol>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-xl bg-primary text-white shadow-[0_10px_24px_rgba(90,79,207,.2)]"
                    >
                      <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 size-4" /> Unduh SiEja APK
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-12 rounded-xl border-slate-200 hover:bg-slate-50"
                    >
                      <Link href="/download">
                        Ke Halaman Download <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      <RotateCcw className="mr-1.5 size-3" />
                      Daftar Akun Siswa Uji Coba Lainnya
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-[1.75rem] border bg-white p-2 shadow-sm sm:p-5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-[#eeeafd] text-primary">
                      <UserPlus className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        Form Pendaftaran Siswa
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Isi identitas siswa di bawah ini untuk mendapatkan
                        Username dan PIN otomatis.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="nama-lengkap">
                        Nama Lengkap Siswa <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nama-lengkap"
                        required
                        minLength={2}
                        placeholder="Contoh: Budi Santoso"
                        value={form.namaLengkap}
                        onChange={(e) => {
                          setForm({ ...form, namaLengkap: e.target.value });
                          if (error) setError(null);
                        }}
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="username">
                        Username / Nama Panggilan <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="username"
                        required
                        minLength={2}
                        autoCapitalize="none"
                        placeholder="Contoh: budi (huruf kecil, tanpa spasi)"
                        value={form.username}
                        onChange={(e) => {
                          setForm({ ...form, username: e.target.value });
                          if (error) setError(null);
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Digunakan saat siswa masuk ke aplikasi SiEja di HP/tablet Android.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="usia">
                          Usia Siswa (Tahun) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="usia"
                          required
                          type="number"
                          min={3}
                          max={12}
                          value={form.usia}
                          onChange={(e) => {
                            setForm({
                              ...form,
                              usia: Number.parseInt(e.target.value, 10) || 5,
                            });
                          }}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Rentang usia anak usia dini: 3 – 12 tahun.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="jenis-kelamin">
                          Jenis Kelamin <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={form.jenisKelamin}
                          onValueChange={(val) =>
                            setForm({ ...form, jenisKelamin: val })
                          }
                        >
                          <SelectTrigger id="jenis-kelamin" className="w-full">
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                            <SelectItem value="Perempuan">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-[#f7f6fd] p-3 text-xs leading-5 text-indigo-900">
                      <strong>Informasi PIN:</strong> PIN 3-digit unik akan
                      dibuatkan secara otomatis oleh sistem saat Anda menekan tombol
                      daftar di bawah.
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
                        size="lg"
                        className="w-full h-12 rounded-xl bg-primary text-white shadow-sm font-semibold"
                      >
                        {saving ? (
                          "Mendaftarkan Akun..."
                        ) : (
                          <>
                            <Sparkles className="mr-2 size-4" /> Buat Akun Siswa
                            Uji Coba
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

