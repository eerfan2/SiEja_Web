import type { Metadata } from "next";
import { DownloadPage } from "@/components/public/download-page";

export const metadata: Metadata = { title: "Download" };
export default function Page() { return <DownloadPage />; }
