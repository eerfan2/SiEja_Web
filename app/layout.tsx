import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "SiEja — Belajar Mengeja Jadi Lebih Menyenangkan",
    template: "%s | SiEja",
  },
  description:
    "Website resmi SiEja, media pembelajaran pendamping untuk membantu anak TK mengenal huruf dan berlatih mengeja.",
  icons: {
    icon: "/brand/logo-sieja.png",
    shortcut: "/brand/logo-sieja.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
