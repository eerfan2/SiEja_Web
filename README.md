# SiEja — Website Resmi & Dashboard Guru

Next.js, TypeScript, Tailwind CSS, Firebase Web SDK, Firebase Authentication, dan Cloud Firestore.

## Menjalankan project

1. Salin `.env.example` menjadi `.env.local`.
2. Isi Firebase Web Configuration dari project `sieja-app`.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.

Perintah di atas kompatibel dengan Windows PowerShell, Command Prompt, macOS,
dan Linux. Project membutuhkan Node.js 22.13.0 atau versi yang lebih baru.

## Pemeriksaan lokal

```powershell
npm install
npm run dev
```

Dev server lokal menggunakan `127.0.0.1` sehingga dapat dibuka melalui
`http://localhost:5173` tanpa mengekspos server ke jaringan lokal.

Untuk menjalankan pemeriksaan lengkap dari terminal lain setelah dev server
berhasil dibuka:

```powershell
npm test
npm run lint
npm run build
```

`vite.config.ts` memakai `build/sites-vite-plugin.ts`. File tersebut merupakan
source plugin konfigurasi dan harus tetap disertakan ketika membuat ZIP source.
5. Buka website pada alamat yang ditampilkan terminal.

## Validasi

- `npm run lint`
- `npm test` (production build + unit tests aturan bisnis)

## Kontrak collection `soal`

Enam mini-game berbasis materi menyimpan `kata` dan `huruf`. Khusus
`gameType: "urutkanHuruf"`, website menyimpan konfigurasi berikut tanpa gambar,
audio, atau hasil acak:

```json
{
  "stageId": "stage1",
  "gameType": "urutkanHuruf",
  "isActive": true,
  "config": {
    "startLetter": "F",
    "endLetter": "Q",
    "letterCount": 4
  }
}
```

Dokumen `urutkanHuruf` lama yang masih memiliki `kata` dan `huruf` tetap dapat
dibaca dan diberi label **Legacy**. Dokumen baru dikonversi hanya setelah guru
membuka Edit dan menyimpan konfigurasi baru.

`firestore.rules.proposed` memvalidasi huruf A-Z dan `letterCount` 3-7. Urutan
serta kapasitas rentang tetap divalidasi oleh web dan Android karena Firestore
Rules tidak menyediakan operasi ordinal alfabet yang layak untuk menghitung
ukuran rentang seperti F-Q.

## Deploy

Pasang enam environment variable Firebase pada hosting, jalankan build produksi, lalu deploy hasil build. Tambahkan domain hosting ke Firebase Authentication > Authorized domains sebelum menguji login guru.

Jangan deploy `firestore.rules.proposed` tanpa meninjau komentar kompatibilitas login siswa dan dampaknya terhadap data produksi.
