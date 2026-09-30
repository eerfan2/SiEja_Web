"use client";

import Link from "next/link";
import { Camera, Menu, Music2, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  ["Home", "/#home"],
  ["Fitur", "/#fitur"],
  ["Cara Kerja", "/#cara-kerja"],
  ["Download", "/download"],
  ["Tutorial", "/tutorial"],
  ["FAQ", "/faq"],
  ["Tentang", "/tentang"],
  ["Kontak", "/kontak"],
] as const;

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="page-container flex h-[4.75rem] items-center justify-between gap-4">
          <Logo compact />
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Navigasi utama">
            {NAV_ITEMS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-all duration-200 ease-out hover:bg-accent/80 hover:text-primary active:scale-[0.98]"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden h-11 rounded-xl px-5 sm:inline-flex">
              <Link href="/login-guru">Login Guru</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="size-11 xl:hidden" aria-label="Buka menu navigasi">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(88vw,22rem)] p-0">
                <SheetHeader className="border-b p-5 text-left">
                  <Logo compact />
                  <SheetTitle className="sr-only">Menu SiEja</SheetTitle>
                  <SheetDescription>Navigasi website resmi SiEja.</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4" aria-label="Navigasi mobile">
                  {NAV_ITEMS.map(([label, href]) => (
                    <SheetClose asChild key={label}>
                      <Link
                        href={href}
                        className="rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200 ease-out hover:bg-accent hover:text-primary active:scale-[0.98]"
                      >
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Button asChild className="mt-3 h-12 rounded-xl">
                      <Link href="/login-guru">Login Guru</Link>
                    </Button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="page-enter">
        {children}
      </div>

      <footer className="border-t bg-[#f2f6ef]">
        <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              Media pembelajaran pendamping untuk membantu anak TK mengenal huruf dan berlatih mengeja melalui aktivitas interaktif bertahap.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                [Camera, "Instagram"],
                [Users, "Facebook"],
                [Music2, "TikTok"],
              ].map(([Icon, label]) => (
                <a
                  key={label as string}
                  href="#"
                  aria-label={`${label} SiEja — tautan belum tersedia`}
                  title="Tautan belum tersedia"
                  className="grid size-10 place-items-center rounded-xl border bg-white text-muted-foreground transition-all duration-200 ease-out hover:border-primary hover:text-primary hover:-translate-y-0.5 hover:shadow-sm active:scale-95"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
          <FooterGroup title="Navigasi" links={[["Home", "/"], ["Fitur", "/#fitur"], ["Download", "/download"], ["Tutorial", "/tutorial"], ["FAQ", "/faq"], ["Tentang", "/tentang"]]} />
          <FooterGroup title="Bantuan" links={[["FAQ", "/faq"], ["Tutorial", "/tutorial"], ["Kontak", "/kontak"], ["Kebijakan Privasi", "/kebijakan-privasi"], ["Syarat Penggunaan", "/syarat-penggunaan"]]} />
          <div>
            <h2 className="text-sm font-bold text-foreground">Pengembang</h2>
            <p className="mt-4 text-sm font-semibold">M. Irfan Fadhlurrohman</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Teknik Informatika<br />Universitas Bale Bandung
            </p>
          </div>
        </div>
        <div className="border-t border-[#dce6d9] py-5 text-center text-xs text-muted-foreground">
          © 2026 SiEja. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="transition-colors duration-150 ease-out hover:text-primary">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
