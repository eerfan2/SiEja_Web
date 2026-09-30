import type { Metadata } from "next";
import { QuestionFormPage } from "@/components/questions/question-form-page";

export const metadata: Metadata = { title: "Tambah Soal" };
export default function Page() { return <QuestionFormPage mode="create" />; }
