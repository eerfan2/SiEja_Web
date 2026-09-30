import type { Metadata } from "next";
import { QuestionFormPage } from "@/components/questions/question-form-page";

export const metadata: Metadata = { title: "Edit Soal" };
export default function Page() { return <QuestionFormPage mode="edit" />; }
