import type { Metadata } from "next";
import { ContactPage } from "@/components/public/contact-page";

export const metadata: Metadata = { title: "Kontak" };
export default function Page() { return <ContactPage />; }
