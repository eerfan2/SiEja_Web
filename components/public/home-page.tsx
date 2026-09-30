import Link from "next/link";
import {
  AudioLines,
  BarChart3,
  BookOpenText,
  CheckCircle2,
  Gamepad2,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Map,
  Medal,
  PencilLine,
  RefreshCcw,
  Sparkles,
  Star,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { AppGallery } from "@/components/public/app-gallery";
import { PublicShell } from "@/components/public/public-shell";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";

const FEATURES: Array<[LucideIcon, string, string]> = [
  [BookOpenText, "Belajar Huruf A–Z", "Pengenalan huruf lengkap dengan visual dan audio."],
  [PencilLine, "Mengeja Kata", "Latihan mengeja kata dasar Bahasa Indonesia."],
  [Map, "Berkelana", "Permainan bertahap melalui peta pembelajaran."],
  [Gamepad2, "6 Stage", "Materi dibagi ke enam stage dari A–E sampai A–Z."],
  [Sparkles, "7 Mini-game", "Variasi interaksi agar latihan tidak monoton."],
  [AudioLines, "Audio Interaktif", "Audio huruf, kata, instruksi, dan umpan balik."],
  [Medal, "Skor", "Setiap jawaban benar memberikan 10 poin."],
  [Star, "Bintang", "Feedback hasil berdasarkan skor, bukan syarat unlock."],
  [BarChart3, "Progress Siswa", "Guru memantau status dan hasil setiap stage."],
  [KeyRound, "Unlock Level", "Stage dibuka guru dan mengikuti urutan penyelesaian."],
  [RefreshCcw, "Remedial", "Stage completed dengan skor di bawah 50 dapat direset."],
  [LayoutDashboard, "Dashboard Guru", "Pusat pemantauan pembelajaran melalui web."],
  [CheckCircle2, "Kelola Soal", "Guru mengelola metadata bank soal Firestore."],
];

const STEPS = [
  "Guru mendaftarkan siswa",
  "Siswa memperoleh username + PIN",
  "Siswa login ke aplikasi Android",
  "Siswa memilih aktivitas pembelajaran",
  "Siswa memainkan stage yang tersedia",
  "Skor dan status stage tersimpan",
  "Guru melihat progress melalui dashboard",
];

export function HomePage() {
  return (
    <PublicShell>
      <main>
        <section id="home" className="soft-grid relative overflow-hidden border-b">
          <div className="absolute -left-24 top-24 size-56 rounded-full bg-[#81c784]/20 blur-3xl" />
          <div className="absolute -right-24 top-8 size-64 rounded-full bg-[#5a4fcf]/15 blur-3xl" />
          <div className="page-container relative grid min-h-[calc(100svh-4.75rem)] items-center gap-8 py-10 sm:min-h-0 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d2fb] bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm">
                <Sparkles className="size-4" /> Media pembelajaran pendamping anak TK
              </div>
              <h1 className="mt-5 text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                Belajar mengeja jadi lebih <span className="text-primary">menyenangkan.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                SiEja membantu anak mengenal huruf dan berlatih mengeja melalui aktivitas interaktif, audio, dan pembelajaran bertahap—dengan guru tetap memantau perkembangan melalui satu sumber data yang sama.
              </p>
              <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
                <Button asChild size="lg" className="h-12 rounded-xl px-6 shadow-[0_10px_28px_rgba(90,79,207,.24)]">
                  <Link href="/download">Download SiEja</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl bg-white px-6">
                  <Link href="#cara-kerja">Lihat Cara Kerja</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Tersedia untuk Android. Unduh file APK resmi atau scan QR code di halaman Download.</p>
            </div>

            <div className="relative mx-auto w-full max-w-[18rem] sm:max-w-[21rem]">
              <div className="absolute inset-x-8 bottom-2 h-12 rounded-full bg-[#5a4fcf]/20 blur-2xl" />
              <div className="relative rounded-[2.25rem] border-[7px] border-[#4a3e3d] bg-[#4a3e3d] p-1 shadow-[0_28px_70px_rgba(74,62,61,.22)]">
                <div className="absolute left-1/2 top-2 z-10 h-3 w-16 -translate-x-1/2 rounded-full bg-[#4a3e3d]" />
                <img src="/screenshots/dashboard-siswa.png" alt="Screenshot asli dashboard siswa aplikasi SiEja" className="aspect-[401/888] w-full rounded-[1.55rem] object-cover" />
              </div>
              <div className="absolute -left-8 top-24 hidden rounded-2xl border bg-white p-3 shadow-lg sm:block">
                <p className="text-xs font-bold text-primary">6 stage</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Belajar bertahap</p>
              </div>
              <div className="absolute -right-9 bottom-24 hidden rounded-2xl border bg-white p-3 shadow-lg sm:block">
                <p className="text-xs font-bold text-[#1b5e20]">7 mini-game</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Latihan bervariasi</p>
              </div>
            </div>
          </div>
        </section>

        <section id="tentang-sieja" className="page-container py-16 sm:py-20">
          <div className="grid gap-8 rounded-[1.75rem] border bg-white p-6 shadow-[0_18px_50px_rgba(74,62,61,.06)] sm:p-9 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div className="rounded-2xl bg-[#eeeafd] p-6">
              <UsersRound className="size-8 text-primary" />
              <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-primary">Tentang SiEja</p>
              <p className="mt-3 text-2xl font-bold leading-snug">Android untuk siswa, web untuk guru, satu data pembelajaran.</p>
            </div>
            <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p>SiEja merupakan media pembelajaran pendamping bagi anak Taman Kanak-Kanak untuk latihan mengenal huruf dan mengeja.</p>
              <p>Anak belajar melalui fitur Belajar Huruf, Mengeja Kata, dan permainan Berkelana berbasis stage. Guru berperan mendaftarkan siswa, membuka level, melihat progress, menangani remedial, dan mengelola bank soal.</p>
              <p className="rounded-xl border-l-4 border-[#81c784] bg-[#f3faf3] px-4 py-3 text-sm font-medium text-[#2e5931]">SiEja tidak menggantikan peran guru; aplikasi digunakan sebagai media latihan pendamping.</p>
            </div>
          </div>
        </section>

        <section id="fitur" className="border-y bg-white py-16 sm:py-20">
          <div className="page-container">
            <SectionHeading eyebrow="Fitur utama" title="Satu pengalaman belajar yang saling terhubung" description="Fitur siswa dan guru dirancang dengan aturan yang konsisten antara aplikasi Android, Firebase, dan dashboard web." />
            <div className="mt-10 grid gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {FEATURES.map(([Icon, title, description]) => (
                <article key={title} className="group rounded-2xl border bg-background p-5 transition duration-200 hover:-translate-y-1 hover:border-[#cfc8fb] hover:shadow-[0_14px_32px_rgba(90,79,207,.08)]">
                  <div className="grid size-11 place-items-center rounded-xl bg-[#eeeafd] text-primary transition group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold sm:text-base">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="page-container py-16 sm:py-20">
          <SectionHeading eyebrow="Cara kerja" title="Dari pendaftaran sampai pemantauan progress" description="Alur dibuat sederhana agar guru dapat mengelola pembelajaran dan siswa fokus menggunakan aplikasi Android." />
          <ol className="relative mx-auto mt-10 max-w-3xl space-y-3 before:absolute before:bottom-7 before:left-[1.43rem] before:top-7 before:w-px before:bg-[#cec8ee] sm:space-y-4">
            {STEPS.map((step, index) => (
              <li key={step} className="relative flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{index + 1}</span>
                <span className="text-sm font-semibold sm:text-base">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-[#1f2930] py-16 text-white sm:py-20">
          <div className="page-container grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a7e1aa]">Aturan unlock yang jelas</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Bintang memberi feedback. Guru menentukan akses.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">Stage 1 tersedia sejak awal. Stage 2–6 hanya dapat dimainkan apabila sudah dibuka guru dan stage sebelumnya berstatus completed.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <RuleCard icon={LockKeyhole} title="Syarat akses" text="Dibuka guru + stage sebelumnya completed." />
              <RuleCard icon={Star} title="Bukan syarat unlock" text="Skor dan bintang hanya feedback pengerjaan." />
              <RuleCard icon={RefreshCcw} title="Remedial" text="Completed dengan skor di bawah 50 dapat direset." />
              <RuleCard icon={CheckCircle2} title="Hasil reset" text="Skor 0, status unlocked, timestamp diperbarui." />
            </div>
          </div>
        </section>

        <section className="page-container py-16 sm:py-20">
          <SectionHeading eyebrow="Tampilan aplikasi" title="Screenshot asli SiEja" description="Galeri ini menggunakan tangkapan layar aplikasi Android yang sebenarnya, bukan mockup layar buatan." />
          <div className="mt-10"><AppGallery /></div>
        </section>

        <section className="border-t bg-[#edf6ee] py-14">
          <div className="page-container flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1b5e20]">Untuk guru</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Pantau pembelajaran dari layar apa pun.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Dashboard dirancang mobile-first dan terhubung ke Firebase project SiEja yang sama.</p>
            </div>
            <Button asChild size="lg" className="h-12 shrink-0 rounded-xl bg-[#1b5e20] px-6 hover:bg-[#154a19]">
              <Link href="/login-guru">Masuk sebagai Guru</Link>
            </Button>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function RuleCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
      <Icon className="size-5 text-[#a7e1aa]" />
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-white/65 sm:text-sm">{text}</p>
    </article>
  );
}
