import type { Metadata } from "next";
import { QuestionListPage } from "@/components/questions/question-list-page";

export const metadata: Metadata = { title: "Kelola Soal" };
export default function Page() { return <QuestionListPage />; }
