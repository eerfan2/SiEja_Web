import type { Metadata } from "next";
import { PolicyPage } from "@/components/public/policy-page";

export const metadata: Metadata = { title: "Syarat Penggunaan" };
export default function Page() { return <PolicyPage type="terms" />; }
