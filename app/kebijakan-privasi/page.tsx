import type { Metadata } from "next";
import { PolicyPage } from "@/components/public/policy-page";

export const metadata: Metadata = { title: "Kebijakan Privasi" };
export default function Page() { return <PolicyPage type="privacy" />; }
