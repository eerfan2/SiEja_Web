import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";

export function PolicyPage({ type }: { type: "privacy" | "terms" }) {
  const privacy = type === "privacy";
  return (
    <PublicShell>
      <main>
        <ContentHero eyebrow={privacy ? "Kebijakan Privasi" : "Syarat Penggunaan"} title={privacy ? "Informasi privasi SiEja" : "Ketentuan penggunaan SiEja"} description="Dokumen ringkas untuk menjelaskan prinsip penggunaan website. Isi final perlu ditinjau sebelum peluncuran publik resmi." />
        <article className="page-container py-12 sm:py-16"><div className="mx-auto max-w-3xl space-y-8 rounded-[1.75rem] border bg-white p-6 sm:p-10">
          {privacy ? <>
            <PolicySection title="Data yang digunakan">Dashboard menampilkan data siswa dan progress dari Firebase project SiEja yang sama. Website tidak menambahkan data riset, statistik pengguna, atau layanan pelacak eksternal.</PolicySection>
            <PolicySection title="Akses guru">Akses dashboard menggunakan Firebase Authentication. Hak akses Firestore tetap harus ditegakkan melalui Security Rules yang sesuai.</PolicySection>
            <PolicySection title="Form kontak">Form kontak saat ini hanya memiliki validasi antarmuka dan belum mengirim atau menyimpan pesan.</PolicySection>
          </> : <>
            <PolicySection title="Penggunaan aplikasi">SiEja digunakan sebagai media pembelajaran pendamping, bukan pengganti pembelajaran bersama guru.</PolicySection>
            <PolicySection title="Akun dan akses">Kredensial guru dan PIN siswa tidak boleh dibagikan kepada pihak yang tidak berkepentingan.</PolicySection>
            <PolicySection title="Konten soal">Guru bertanggung jawab memastikan materi yang diaktifkan sesuai kebutuhan pembelajaran dan range stage.</PolicySection>
          </>}
        </div></article>
      </main>
    </PublicShell>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{children}</p></section>;
}
