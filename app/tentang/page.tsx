import type { Metadata } from "next";
import { AboutPage } from "@/components/public/about-page";

export const metadata: Metadata = { title: "Tentang" };
export default function Page() { return <AboutPage />; }
