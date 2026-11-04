import { ContentHero } from "@/components/public/content-hero";
import { PublicShell } from "@/components/public/public-shell";

export function PolicyPage({ type }: { type: "privacy" | "terms" }) {
  const privacy = type === "privacy";
  return (
    <PublicShell>
      <main>
        <ContentHero
          eyebrow={privacy ? "Kebijakan Privasi" : "Syarat Penggunaan"}
          title={privacy ? "Informasi privasi SiEja" : "Ketentuan penggunaan SiEja"}
          description={
            privacy
              ? "Informasi mengenai penggunaan data dan privasi pada website SiEja. Informasi yang digunakan dapat berbeda sesuai dengan fitur yang diakses oleh pengguna."
              : "Dokumen ringkas untuk menjelaskan prinsip dan ketentuan penggunaan layanan website SiEja."
          }
        />
        <article className="page-container py-12 sm:py-16">
          <div className="mx-auto max-w-3xl space-y-8 rounded-[1.75rem] border bg-white p-6 sm:p-10">
            {privacy ? (
              <>
                <PolicySection title="Data yang digunakan">
                  Pengunjung yang hanya melihat informasi pada website tidak perlu memberikan data pribadi. Pada fitur tertentu, SiEja dapat menggunakan data yang diperlukan untuk menjalankan fungsi tersebut, seperti data siswa dan progress pada dashboard guru.
                </PolicySection>
                <PolicySection title="Akses guru">
                  Fitur dashboard guru menggunakan Firebase Authentication untuk proses autentikasi. Data yang ditampilkan dan dikelola melalui dashboard mengikuti hak akses dan aturan keamanan yang diterapkan pada sistem.
                </PolicySection>
                <PolicySection title="Form kontak">
                  Form kontak tidak menyimpan pesan pada website. Setelah pengguna mengisi form dan menekan tombol “Kirim Pesan”, data digunakan untuk membuat draft pesan pada layanan email pengguna. Pengiriman pesan dilakukan oleh pengguna melalui layanan email tersebut.
                </PolicySection>
              </>
            ) : (
              <>
                <PolicySection title="Penggunaan aplikasi">
                  SiEja digunakan sebagai media pembelajaran pendamping, bukan pengganti pembelajaran bersama guru.
                </PolicySection>
                <PolicySection title="Akun dan akses">
                  Kredensial guru dan PIN siswa tidak boleh dibagikan kepada pihak yang tidak berkepentingan.
                </PolicySection>
                <PolicySection title="Konten soal">
                  Guru bertanggung jawab memastikan materi yang diaktifkan sesuai dengan kebutuhan pembelajaran dan tahapan yang tersedia.
                </PolicySection>
              </>
            )}
          </div>
        </article>
      </main>
    </PublicShell>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{children}</p></section>;
}
