import type { Metadata } from "next";
import { StudentPage } from "@/components/students/student-page";

export const metadata: Metadata = { title: "Data Siswa" };
export default function Page() { return <StudentPage />; }
