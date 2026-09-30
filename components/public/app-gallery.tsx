"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const SCREENSHOTS = [
  ["Splash", "/screenshots/splash.png"],
  ["Dashboard Siswa", "/screenshots/dashboard-siswa.png"],
  ["Belajar Huruf", "/screenshots/belajar-huruf.png"],
  ["Mengeja Kata", "/screenshots/mengeja-kata.png"],
  ["Peta Berkelana", "/screenshots/peta-berkelana.png"],
  ["Mini-game", "/screenshots/mini-game.png"],
  ["Reward", "/screenshots/reward.png"],
  ["Dashboard Guru", "/screenshots/dashboard-guru.png"],
  ["Buka Level", "/screenshots/buka-level.png"],
  ["Progress Siswa", "/screenshots/progress-guru.png"],
] as const;

export function AppGallery({ compact = false }: { compact?: boolean }) {
  return (
    <Carousel opts={{ align: "start" }} className="mx-auto w-full max-w-6xl" aria-label="Galeri screenshot aplikasi SiEja">
      <CarouselContent>
        {SCREENSHOTS.map(([label, src]) => (
          <CarouselItem key={label} className={compact ? "basis-[72%] sm:basis-1/3 lg:basis-1/4" : "basis-[76%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"}>
            <figure className="rounded-[1.7rem] border bg-white p-2 shadow-[0_18px_50px_rgba(74,62,61,0.09)]">
              <div className="overflow-hidden rounded-[1.25rem] bg-muted">
                <img src={src} alt={`Screenshot asli ${label} pada aplikasi SiEja`} className="aspect-[390/889] w-full object-cover" loading="lazy" />
              </div>
              <figcaption className="px-2 py-3 text-center text-sm font-bold">{label}</figcaption>
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 hidden bg-white sm:inline-flex" />
      <CarouselNext className="right-2 hidden bg-white sm:inline-flex" />
    </Carousel>
  );
}
