import type { Metadata } from "next";
import { TutorialPage } from "@/components/public/tutorial-page";

export const metadata: Metadata = { title: "Tutorial" };
export default function Page() { return <TutorialPage />; }
