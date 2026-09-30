"use client";

import { useState } from "react";
import { Maximize2, MonitorCog } from "lucide-react";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STUDENT_STEPS = [
  ["Membuka aplikasi", "Buka SiEja dan tunggu halaman splash selesai.", "/screenshots/splash.png"],
  ["Memilih Siswa", "Pilih peran Siswa pada halaman pemilihan peran.", "/screenshots/login-siswa.png"],
  ["Login", "Masukkan username dan PIN 3 digit dari guru.", "/screenshots/login-siswa.png"],
  ["Dashboard", "Pilih Belajar Huruf, Mengeja Kata, Permainan, atau Progress.", "/screenshots/dashboard-siswa.png"],
  ["Belajar Huruf", "Pilih huruf A–Z lalu dengarkan audio pembelajaran.", "/screenshots/belajar-huruf.png"],
  ["Mengeja Kata", "Pilih objek dan ikuti latihan mengeja.", "/screenshots/mengeja-kata.png"],
  ["Berkelana", "Pilih stage yang sudah tersedia pada peta.", "/screenshots/peta-berkelana.png"],
  ["Reward", "Lihat skor dan bintang setelah 10 soal selesai.", "/screenshots/reward.png"],
  ["Progress", "Lihat hasil stage yang pernah dikerjakan.", "/screenshots/pengaturan-siswa.png"],
] as const;

const TEACHER_STEPS = [
  ["Login Guru", "Masukkan username atau email Firebase dan password.", "/screenshots/login-guru.png"],
  ["Dashboard", "Lihat ringkasan siswa, aktivitas, dan akses menu guru.", "/screenshots/dashboard-guru.png"],
  ["Data Siswa", "Lihat atau tambahkan data siswa pada collection siswa yang sama.", "/screenshots/data-siswa.png"],
  ["Buka/Kunci Stage", "Atur status stage siswa tanpa menggunakan skor sebagai syarat unlock.", "/screenshots/buka-level.png"],
  ["Melihat Progress", "Periksa status, skor, bintang, dan stage yang perlu remedial.", "/screenshots/progress-guru.png"],
  ["Reset Stage", "Konfirmasi reset agar skor menjadi 0 dan status menjadi unlocked.", "/screenshots/pengaturan-guru.png"],
] as const;

type TutorialStep = readonly [string, string, string];

export function TutorialPage() {
  return (
    <PublicShell>
      <main>
        <ContentHero
          eyebrow="Tutorial"
          title="Panduan menggunakan SiEja"
          description="Panduan dipisahkan untuk siswa dan guru agar setiap pengguna dapat mengikuti langkah yang sesuai."
        />
        <section className="page-container py-12 sm:py-16">
          <Tabs defaultValue="siswa" className="w-full">
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-[#eeeafd] p-1 sm:w-[25rem]">
              <TabsTrigger value="siswa" className="rounded-lg">
                Tutorial Siswa
              </TabsTrigger>
              <TabsTrigger value="guru" className="rounded-lg">
                Tutorial Guru
              </TabsTrigger>
            </TabsList>
            <TabsContent value="siswa" className="mt-7">
              <StepGrid steps={STUDENT_STEPS} />
            </TabsContent>
            <TabsContent value="guru" className="mt-7">
              <StepGrid steps={TEACHER_STEPS} />
              <article className="mt-5 flex gap-4 rounded-2xl border bg-[#edf6ee] p-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#1b5e20]">
                  <MonitorCog className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold">Kelola Soal melalui web</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Buka menu Kelola Soal, pilih stage, mini-game, dan materi lokal. Preview
                    gambar/audio sebelum menyimpan metadata ke Firestore.
                  </p>
                </div>
              </article>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </PublicShell>
  );
}

function StepGrid({ steps }: { steps: ReadonlyArray<TutorialStep> }) {
  const [preview, setPreview] = useState<TutorialStep | null>(null);

  return (
    <>
      <ol className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {steps.map(([title, description, image], index) => (
          <li key={`${title}-${index}`} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setPreview([title, description, image])}
              aria-label={`Perbesar screenshot langkah ${title}`}
              className="group relative block w-full bg-[#f2f0f6]"
            >
              <span className="relative block aspect-[393/889] overflow-hidden sm:aspect-auto sm:h-[34rem]">
                <img
                  src={image}
                  alt={`Tampilan langkah ${title} di aplikasi SiEja`}
                  className="h-full w-full object-contain p-2"
                  loading="lazy"
                />
              </span>
              <span className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-white shadow">
                {index + 1}
              </span>
              <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white/95 text-primary shadow-sm transition group-hover:scale-105">
                <Maximize2 className="size-4" aria-hidden="true" />
              </span>
            </button>
            <div className="p-5">
              <h2 className="font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </li>
        ))}
      </ol>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="flex max-h-[calc(100svh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-4xl flex-col overflow-hidden p-4 sm:p-6">
          <DialogHeader className="shrink-0 text-left">
            <DialogTitle>{preview?.[0]}</DialogTitle>
            <DialogDescription>{preview?.[1]}</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#f2f0f6] p-2">
              <img
                src={preview[2]}
                alt={`Screenshot diperbesar untuk langkah ${preview[0]}`}
                className="max-h-[calc(100svh-10rem)] w-auto max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
