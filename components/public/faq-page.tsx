"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

const FAQS = [
  ["Umum", "Apa itu SiEja?", "SiEja adalah game edukasi Android yang digunakan sebagai media pembelajaran pendamping untuk latihan mengenal huruf dan mengeja."],
  ["Umum", "Siapa yang menggunakan SiEja?", "Anak TK menggunakan aplikasi Android, sedangkan guru menggunakan fitur guru di Android dan dashboard web."],
  ["Siswa", "Bagaimana siswa login?", "Siswa login memakai username dan PIN 3 digit yang diberikan guru."],
  ["Permainan", "Bagaimana stage berikutnya terbuka?", "Stage 2–6 dapat dimainkan apabila sudah dibuka guru dan stage sebelumnya berstatus completed."],
  ["Permainan", "Apakah skor digunakan untuk unlock?", "Tidak. Skor dan bintang hanya menjadi feedback hasil pengerjaan, bukan syarat unlock."],
  ["Progress", "Apa arti remedial?", "Stage perlu remedial ketika statusnya completed dan skor di bawah 50. Guru dapat mereset stage tersebut."],
  ["Download", "Apakah SiEja tersedia di Android?", "Ya, SiEja dibuat untuk Android. Anda dapat mengunduh file APK resmi langsung melalui halaman Download atau memindai QR Code yang disediakan."],
  ["Siswa", "Apakah SiEja dapat digunakan offline?", "Sebagian fitur siswa memiliki mode offline terbatas. Login, sinkronisasi progress, dan fungsi guru memerlukan koneksi."],
  ["Guru", "Bagaimana guru melihat progress?", "Guru login ke dashboard, lalu membuka menu Progress atau Remedial untuk melihat hasil per siswa dan stage."],
  ["Guru", "Bagaimana guru menambah soal?", "Guru membuka Kelola Soal, memilih stage, jenis mini-game, materi lokal, memeriksa preview, lalu menyimpan."],
  ["Akun", "Apakah login web menggunakan akun baru?", "Tidak. Dashboard menggunakan Firebase Authentication pada project SiEja yang sama dengan aplikasi Android."],
] as const;

export function FaqPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return FAQS;
    return FAQS.filter(([category, question, answer]) => `${category} ${question} ${answer}`.toLowerCase().includes(term));
  }, [query]);

  return (
    <PublicShell>
      <main>
        <ContentHero eyebrow="FAQ" title="Pertanyaan yang sering diajukan" description="Temukan jawaban tentang akun, permainan, progress, download, dan penggunaan dashboard guru." />
        <section className="page-container py-12 sm:py-16">
          <label className="relative block max-w-2xl">
            <span className="sr-only">Cari pertanyaan</span>
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pertanyaan, misalnya unlock atau remedial..." className="h-12 rounded-xl bg-white pl-12" />
          </label>

          {filtered.length ? (
            <Accordion type="single" collapsible className="mt-7 max-w-3xl space-y-3">
              {filtered.map(([category, question, answer], index) => (
                <AccordionItem key={question} value={`faq-${index}`} className="rounded-2xl border bg-white px-5 shadow-sm">
                  <AccordionTrigger className="py-5 text-left hover:no-underline"><span><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{category}</span>{question}</span></AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground">{answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Empty className="mt-8 max-w-3xl border bg-white py-14"><EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>Pertanyaan tidak ditemukan</EmptyTitle><EmptyDescription>Coba gunakan kata kunci yang lebih singkat.</EmptyDescription></EmptyHeader></Empty>
          )}
        </section>
      </main>
    </PublicShell>
  );
}
