import type { Metadata } from "next";
import { FaqPage } from "@/components/public/faq-page";

export const metadata: Metadata = { title: "FAQ" };
export default function Page() { return <FaqPage />; }
