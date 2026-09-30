"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("Form valid. Pengiriman pesan belum diaktifkan karena layanan backend kontak belum ditentukan.");
  }

  return (
    <PublicShell>
      <main>
        <ContentHero eyebrow="Kontak" title="Hubungi pengembang SiEja" description="Isi form berikut untuk memeriksa kelengkapan pesan. Untuk saat ini, pesan belum dikirim atau disimpan ke layanan eksternal." />
        <section className="page-container py-12 sm:py-16">
          <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-[1.75rem] border bg-white p-5 shadow-sm sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nama" id="nama"><Input id="nama" name="nama" required minLength={2} placeholder="Nama lengkap" className="h-12" /></Field>
              <Field label="Email" id="email"><Input id="email" name="email" type="email" required placeholder="nama@email.com" className="h-12" /></Field>
            </div>
            <div className="mt-5"><Field label="Subjek" id="subjek"><Input id="subjek" name="subjek" required minLength={3} placeholder="Subjek pesan" className="h-12" /></Field></div>
            <div className="mt-5"><Field label="Pesan" id="pesan"><Textarea id="pesan" name="pesan" required minLength={10} placeholder="Tuliskan pesan Anda..." className="min-h-36 resize-y" /></Field></div>
            {status && <div role="status" className="mt-5 flex gap-3 rounded-xl bg-[#edf6ee] p-4 text-sm leading-6 text-[#245e2a]"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><p>{status}</p></div>}
            <Button type="submit" className="mt-6 h-12 w-full rounded-xl"><Send className="size-4" /> Periksa Pesan</Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Tidak ada data yang dikirim saat tombol ditekan.</p>
          </form>
        </section>
      </main>
    </PublicShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
