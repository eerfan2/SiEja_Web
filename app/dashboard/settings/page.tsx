import type { Metadata } from "next";
import { SettingsPage } from "@/components/dashboard/settings-page";

export const metadata: Metadata = { title: "Pengaturan" };
export default function Page() { return <SettingsPage />; }
