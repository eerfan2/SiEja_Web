import type { Metadata } from "next";
import { StagePage } from "@/components/stages/stage-page";

export const metadata: Metadata = { title: "Kelola Stage" };
export default function Page() { return <StagePage />; }
