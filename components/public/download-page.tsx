import { CheckCircle2, Download, ShieldCheck, Smartphone } from "lucide-react";
import { AppGallery } from "@/components/public/app-gallery";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";

const APK_DOWNLOAD_URL = "https://github.com/eerfan2/SiEja/releases/latest/download/SiEja.apk";

export function DownloadPage() {
  return (
    <PublicShell>
      <main>
        <ContentHero
          eyebrow="Download"
          title="SiEja untuk Android"
          description="Unduh file APK resmi SiEja untuk smartphone Android Anda atau pindai kode QR untuk mengunduh langsung ke perangkat."
        />
        <section className="page-container py-12 sm:py-16">
          <div className="grid gap-6 rounded-[1.75rem] border bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[1fr_.75fr] lg:items-center">
            <div>
              <div className="flex items-center gap-4">
                <img
                  src="/brand/logo-sieja.png"
                  alt="Logo aplikasi SiEja"
                  className="h-20 w-28 rounded-2xl bg-[#edf6ee] object-contain p-2"
                />
                <div>
                  <h2 className="text-2xl font-bold">SiEja</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Platform: Android • Versi Rilis Resmi</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#c3e6cb] bg-[#eef9f0] p-4 text-sm leading-6 text-[#1e5e2f]">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#2e7d32]" />
                  <div>
                    <p className="font-semibold">APK Resmi SiEja Telah Tersedia</p>
                    <p className="mt-0.5 text-xs text-[#2b6b37]">
                      Klik tombol di bawah untuk mengunduh paket instalasi APK secara langsung dan aman.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild size="lg" className="h-12 w-full rounded-xl sm:w-auto shadow-[0_10px_24px_rgba(90,79,207,.2)]">
                  <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 size-4" /> Unduh SiEja APK
                  </a>
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
              <p className="mt-4 text-sm font-bold text-foreground">Scan QR Code</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                Arahkan kamera smartphone atau aplikasi pemindai QR untuk langsung mengunduh SiEja ke Android Anda.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-bold">Petunjuk instalasi</h2>
              <ol className="mt-5 space-y-3">
                {[
                  "Unduh file APK dari tombol resmi di halaman ini.",
                  "Buka file APK yang selesai diunduh.",
                  "Izinkan pemasangan dari sumber ini apabila Android memintanya.",
                  "Ikuti petunjuk instalasi lalu buka SiEja.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3 rounded-2xl border bg-white p-4 text-sm leading-6"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span><span>{step}</span></li>
                ))}
              </ol>
              <div className="mt-5 flex gap-3 rounded-xl bg-[#edf6ee] p-4 text-xs leading-6 text-[#245e2a]"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p>Gunakan hanya APK resmi SiEja dan jangan memasang file dari tautan yang tidak dikenal.</p></div>
            </div>
            <div className="min-w-0">
              <div className="mb-5 flex items-center gap-2"><Smartphone className="size-5 text-primary" /><h2 className="text-xl font-bold">Tampilan aplikasi</h2></div>
              <AppGallery compact />
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
