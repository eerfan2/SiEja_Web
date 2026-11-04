"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_PENGEMBANG = "dfly12377@gmail.com";

export function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const nama = String(formData.get("nama") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subjek = String(formData.get("subjek") || "").trim();
    const pesan = String(formData.get("pesan") || "").trim();

    if (!nama || !email || !subjek || !pesan) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const emailInput = form.elements.namedItem("email") as HTMLInputElement | null;
      emailInput?.setCustomValidity("Format email tidak valid");
      emailInput?.reportValidity();
      return;
    }

    const subject = `[SiEja] ${subjek}`;
    const body = `Nama: ${nama}\nEmail: ${email}\n\nPesan:\n${pesan}`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_PENGEMBANG)}&su=${encodedSubject}&body=${encodedBody}`;

    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    setStatus(
      `Membuka Gmail... Jika Gmail tidak terbuka otomatis, Anda dapat menghubungi email pengembang secara langsung di: ${EMAIL_PENGEMBANG}`
    );

    if (isMobile) {
      let appUrl = "";
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        appUrl = `googlegmail://co?to=${encodeURIComponent(EMAIL_PENGEMBANG)}&subject=${encodedSubject}&body=${encodedBody}`;
      } else if (/Android/i.test(userAgent)) {
        appUrl = `intent://co?to=${encodeURIComponent(EMAIL_PENGEMBANG)}&subject=${encodedSubject}&body=${encodedBody}#Intent;scheme=googlegmail;package=com.google.android.gm;end`;
      }

      if (appUrl) {
        const start = Date.now();
        window.location.href = appUrl;
        setTimeout(() => {
          if (Date.now() - start < 2000) {
            const opened = window.open(gmailWebUrl, "_blank");
            if (!opened) {
              window.location.href = gmailWebUrl;
            }
          }
        }, 1200);
      } else {
        const opened = window.open(gmailWebUrl, "_blank");
        if (!opened) {
          window.location.href = gmailWebUrl;
        }
      }
    } else {
      const opened = window.open(gmailWebUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = gmailWebUrl;
      }
    }
  }

  return (
    <PublicShell>
      <main>
        <ContentHero
          eyebrow="Kontak"
          title="Hubungi pengembang SiEja"
          description="Isi form berikut untuk menghubungi pengembang. Pesan akan dibuka melalui aplikasi email pada perangkat Anda."
        />
        <section className="page-container py-12 sm:py-16">
          <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-[1.75rem] border bg-white p-5 shadow-sm sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nama" id="nama">
                <Input id="nama" name="nama" required minLength={2} placeholder="Nama lengkap" className="h-12" />
              </Field>
              <Field label="Email" id="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  className="h-12"
                  onChange={(e) => e.currentTarget.setCustomValidity("")}
                />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Subjek" id="subjek">
                <Input id="subjek" name="subjek" required minLength={3} placeholder="Subjek pesan" className="h-12" />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Pesan" id="pesan">
                <Textarea id="pesan" name="pesan" required minLength={10} placeholder="Tuliskan pesan Anda..." className="min-h-36 resize-y" />
              </Field>
            </div>
            {status && (
              <div role="status" className="mt-5 flex gap-3 rounded-xl bg-[#edf6ee] p-4 text-sm leading-6 text-[#245e2a]">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                <p>{status}</p>
              </div>
            )}
            <Button type="submit" className="mt-6 h-12 w-full rounded-xl">
              <Send className="size-4" /> Kirim Pesan
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
              Pesan akan diteruskan melalui aplikasi email Anda.
            </p>
          </form>
        </section>
      </main>
    </PublicShell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
