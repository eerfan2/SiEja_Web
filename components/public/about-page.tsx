import { Braces, Gamepad2, GraduationCap, Layers3, Smartphone } from "lucide-react";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";

export function AboutPage() {
  return (
    <PublicShell>
      <main>
        <ContentHero eyebrow="Tentang" title="SiEja sebagai media pembelajaran pendamping" description="SiEja dikembangkan untuk membantu anak TK berlatih mengenal huruf dan mengeja, dengan guru tetap memegang kendali atas akses stage dan pemantauan progress." />
        <section className="page-container py-12 sm:py-16">
          <div className="grid gap-5 md:grid-cols-2">
            <InfoCard icon={GraduationCap} title="Tujuan pengembangan">Menyediakan pengalaman latihan huruf dan mengeja yang interaktif, bertahap, serta mudah dipantau oleh guru.</InfoCard>
            <InfoCard icon={Gamepad2} title="Fitur utama">Belajar Huruf A–Z, Mengeja Kata, 6 stage, 7 mini-game, audio, skor, bintang, progress, remedial, unlock level, dan bank soal.</InfoCard>
            <InfoCard icon={Smartphone} title="Peran aplikasi Android">Menjadi aplikasi utama siswa untuk login, belajar, bermain stage, menerima reward, dan melihat progress.</InfoCard>
            <InfoCard icon={Layers3} title="Peran website">Memperkenalkan SiEja sekaligus menjadi dashboard guru untuk siswa, progress, remedial, stage, dan kelola soal.</InfoCard>
          </div>
          <div className="mt-8 rounded-[1.75rem] border bg-[#1f2930] p-6 text-white sm:p-9">
            <div className="flex items-center gap-3"><Braces className="size-6 text-[#a7e1aa]" /><h2 className="text-2xl font-bold">Teknologi</h2></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["Flutter & Dart", "Next.js & TypeScript", "Firebase Authentication", "Cloud Firestore"].map((item) => <div key={item} className="rounded-xl border border-white/10 bg-white/[0.07] p-4 text-sm font-semibold">{item}</div>)}
            </div>
          </div>
          <div className="mt-8 rounded-[1.75rem] border bg-white p-6 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pengembang</p>
            <h2 className="mt-3 text-2xl font-bold">M. Irfan Fadhlurrohman</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Teknik Informatika, Universitas Bale Bandung.</p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof GraduationCap; title: string; children: React.ReactNode }) {
  return <article className="rounded-2xl border bg-white p-6 shadow-sm"><div className="grid size-11 place-items-center rounded-xl bg-[#eeeafd] text-primary"><Icon className="size-5" /></div><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{children}</p></article>;
}
