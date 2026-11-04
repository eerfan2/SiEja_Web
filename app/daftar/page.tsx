import type { Metadata } from "next";
import { TrialRegisterPage } from "@/components/public/trial-register-page";

export const metadata: Metadata = {
  title: "Pendaftaran Akun Siswa (Uji Coba)",
  description:
    "Daftarkan akun uji coba secara mandiri untuk mencoba peran sebagai siswa dan bermain di aplikasi SiEja Android.",
};

export default function Page() {
  return <TrialRegisterPage />;
}

