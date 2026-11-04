import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Info,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { AppGallery } from "@/components/public/app-gallery";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";

const APK_DOWNLOAD_URL =
  "https://github.com/eerfan2/SiEja/releases/latest/download/SiEja.apk";

export function DownloadPage() {
  return (
    <PublicShell>
      <main>
        <ContentHero
          eyebrow="Download"
          title="SiEja untuk Android"
          description="Unduh file APK resmi SiEja untuk perangkat smartphone dan tablet Android atau pindai kode QR untuk mengunduh langsung."
        />
        <section className="page-container py-12 sm:py-16">
          {/* Banner Pendaftaran Akun Uji Coba Mandiri */}
          <div className="mb-8 rounded-[1.75rem] border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-pink-50/40 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                    Uji Coba Mandiri
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-indigo-950">
                    Belum Memiliki Akun untuk Mencoba SiEja?
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-indigo-800 leading-relaxed">
                  Untuk dapat masuk ke aplikasi di Android, Anda memerlukan akun
                  siswa (<strong>Username</strong> dan <strong>PIN 3 Digit</strong>).
                  Karena belum ada guru kelas, Anda dapat mendaftarkan akun siswa
                  uji coba secara mandiri untuk mencoba peran sebagai siswa.
                </p>
                <p className="text-[11px] text-indigo-600 italic">
                  *Nantinya pada sistem sekolah sebenarnya, akun siswa akan
                  didaftarkan dan dikelola oleh Guru kelas.
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full sm:w-auto rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm font-semibold"
                >
                  <Link href="/daftar-uji-coba">
                    <UserPlus className="mr-2 size-4" /> Daftar Akun Siswa Uji Coba
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 rounded-[1.75rem] border bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[1fr_.75fr] lg:items-center">
            <div>
              <div className="flex items-center gap-4">
                <img
                  src="/brand/logo-sieja.png"
                  alt="Logo aplikasi SiEja"
                  className="h-20 w-24 shrink-0 rounded-2xl bg-[#edf6ee] object-contain p-2"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-bold">SiEja</h2>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#c3e6cb] bg-[#eef9f0] px-2.5 py-0.5 text-xs font-semibold text-[#1e5e2f]">
                      <img
                        src="/android.png"
                        alt="Android"
                        className="size-4 object-contain"
                      />
                      Android
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Smartphone & Tablet • Orientasi Portrait
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#c3e6cb] bg-[#eef9f0] p-4 text-sm leading-6 text-[#1e5e2f]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 shrink-0 text-[#2e7d32]" />
                  <div>
                    <p className="font-semibold">APK Resmi SiEja Siap Diunduh</p>
                    <p className="text-xs text-[#2b6b37]">
                      Paket instalasi resmi untuk perangkat Android.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-xl sm:w-auto shadow-[0_10px_24px_rgba(90,79,207,.2)]"
                >
                  <a
                    href={APK_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 size-4" /> Unduh SiEja APK
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-xl sm:w-auto border-indigo-200 text-indigo-900 bg-indigo-50/50 hover:bg-indigo-100/70"
                >
                  <Link href="/daftar-uji-coba">
                    <UserPlus className="mr-2 size-4" /> Daftar Akun Siswa
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f6f4fd] p-6 text-center sm:p-8">
              <div className="rounded-2xl border border-[#d8d2fb] bg-white p-3 shadow-sm">
                <img
                  src="/SiEjaQR.png"
                  alt="QR Code Download SiEja APK"
                  className="size-44 sm:size-48 object-contain rounded-lg"
                />
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">
                Scan QR Code
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                Pindai kode QR menggunakan kamera untuk langsung mengunduh ke
                perangkat Android Anda.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-bold">Petunjuk instalasi</h2>
              <ol className="mt-5 space-y-3">
                {[
                  "Daftarkan akun siswa uji coba untuk mendapatkan Username & PIN login (jika belum memiliki akun).",
                  "Unduh file APK dari tombol resmi di halaman ini.",
                  "Buka file APK yang selesai diunduh.",
                  "Izinkan pemasangan dari sumber ini apabila Android memintanya.",
                  "Buka aplikasi SiEja, pilih peran Siswa, lalu masuk dengan Username dan PIN Anda.",
                ].map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 rounded-2xl border bg-white p-4 text-sm leading-6"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex gap-3 rounded-xl bg-[#edf6ee] p-4 text-xs leading-6 text-[#245e2a]">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                <p>
                  Gunakan hanya APK resmi SiEja dan jangan memasang file dari
                  tautan yang tidak dikenal.
                </p>
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-5 flex items-center gap-2">
                <Smartphone className="size-5 text-primary" />
                <h2 className="text-xl font-bold">Tampilan aplikasi</h2>
              </div>
              <AppGallery compact />
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
