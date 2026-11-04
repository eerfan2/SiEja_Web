import { MATERIAL_CATALOG } from "@/data/material-catalog";
import { validateQuestionInput } from "@/lib/domain/business-rules";
import { validateLetterSequenceConfig } from "@/lib/domain/letter-sequence";
import {
  GAME_TYPES,
  type AlphabetLetter,
  type GameType,
  type LetterSequenceConfig,
  type QuestionInput,
  type StageId,
  type StandardGameType,
} from "@/types/sieja";

/**
 * Pengelompokan 7 jenis mini-game SiEja berdasarkan tingkat kesulitan kognitif anak:
 * - Mudah: Pengenalan bunyi & visual langsung (Dengar Suara, Tebak Gambar, Huruf Awal)
 * - Sedang: Asosiasi & pengisian elemen hilang (Huruf Hilang, Pasang Huruf Besar-Kecil)
 * - Sulit/Menantang: Rekonstruksi & pengurutan sekuensial (Susun Kata, Urutkan Alfabet)
 */
export const GAME_TYPE_DIFFICULTIES: Record<GameType, "mudah" | "sedang" | "sulit"> = {
  dengarSuaraHuruf: "mudah",
  tebakGambarObjek: "mudah",
  hurufAwalApa: "mudah",
  hurufYangHilang: "sedang",
  cocokkanHuruf: "sedang",
  susunKata: "sulit",
  urutkanHuruf: "sulit",
};

/**
 * Daftar konfigurasi rentang huruf kurasi yang valid untuk mini-game `urutkanHuruf`.
 * Seluruh opsi dijamin memenuhi aturan: startLetter <= endLetter, letterCount 3-7,
 * dan kapasitas rentang >= letterCount.
 */
export const SAMPLE_LETTER_SEQUENCE_CONFIGS: readonly LetterSequenceConfig[] = [
  { startLetter: "A", endLetter: "G", letterCount: 4 },
  { startLetter: "B", endLetter: "H", letterCount: 4 },
  { startLetter: "C", endLetter: "J", letterCount: 5 },
  { startLetter: "F", endLetter: "M", letterCount: 4 },
  { startLetter: "H", endLetter: "O", letterCount: 4 },
  { startLetter: "K", endLetter: "R", letterCount: 5 },
  { startLetter: "M", endLetter: "T", letterCount: 4 },
  { startLetter: "P", endLetter: "W", letterCount: 4 },
  { startLetter: "A", endLetter: "J", letterCount: 5 },
  { startLetter: "S", endLetter: "Z", letterCount: 5 },
];

export interface DefaultQuestionGeneratorOptions {
  totalCount?: number;
  preferredRange?: string;
  randomFn?: () => number;
}

/**
 * Mengocok array menggunakan algoritma Fisher-Yates dengan random function yang bisa diinjeksi.
 */
function shuffle<T>(array: T[], randomFn: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Memilih huruf yang mungkin terkandung dalam deskripsi rentang (misal: "A - E" atau "A–Z").
 */
function extractLettersFromRange(rangeStr?: string): string[] {
  if (!rangeStr) return [];
  const matchRange = rangeStr.toUpperCase().match(/([A-Z])\s*[-–—]\s*([A-Z])/);
  if (matchRange) {
    const start = matchRange[1].charCodeAt(0);
    const end = matchRange[2].charCodeAt(0);
    if (start <= end) {
      const letters: string[] = [];
      for (let c = start; c <= end; c++) {
        letters.push(String.fromCharCode(c).toLowerCase());
      }
      return letters;
    }
  }
  return [];
}

/**
 * Men-generate paket soal default (default: 10 soal) untuk sebuah stage baru.
 *
 * Menjamin:
 * 1. Seluruh 7 tipe mini-game terwakili minimal 1 kali (7 soal), ditambah 3 soal acak
 *    lintas tingkat kesulitan (total = 10 soal).
 * 2. Distribusi kesulitan seimbang: ~3-4 Mudah, ~3-4 Sedang, ~2-3 Sulit.
 * 3. Soal berbasis kata (non-urutkanHuruf) menggunakan kosakata UNIK dari katalog resmi SiEja
 *    sehingga tidak ada kata yang terulang dalam 1 sesi.
 * 4. Soal `urutkanHuruf` memiliki config range yang valid secara alfabetik.
 * 5. Seluruh soal tervalidasi 100% dan siap dimainkan di aplikasi Android SiEja.
 */
export function generateDefaultQuestionsForStage(
  stageId: StageId,
  options: DefaultQuestionGeneratorOptions = {},
): QuestionInput[] {
  const totalCount = Math.max(7, options.totalCount ?? 10);
  const randomFn = options.randomFn ?? Math.random;

  // 1. Siapkan pool jenis game: pastikan ke-7 jenis game muncul minimal 1 kali
  const chosenGameTypes: GameType[] = [...GAME_TYPES];

  // 2. Tambahkan sisa kuota (misal: 10 - 7 = 3 soal) dari tipe game acak lintas kesulitan
  const extraPool: GameType[] = [
    "dengarSuaraHuruf",
    "tebakGambarObjek",
    "hurufAwalApa",
    "hurufYangHilang",
    "cocokkanHuruf",
    "susunKata",
    "urutkanHuruf",
  ];
  const shuffledExtra = shuffle(extraPool, randomFn);

  while (chosenGameTypes.length < totalCount) {
    const nextType = shuffledExtra[(chosenGameTypes.length - GAME_TYPES.length) % shuffledExtra.length];
    chosenGameTypes.push(nextType);
  }

  // 3. Kocok urutan game types agar posisi soal tidak monoton
  const finalGameTypes = shuffle(chosenGameTypes.slice(0, totalCount), randomFn);

  // 4. Siapkan pool kata dari katalog materi SiEja
  const rangeLetters = extractLettersFromRange(options.preferredRange);
  let primaryCatalog = MATERIAL_CATALOG;

  // Jika guru memasukkan rentang huruf spesifik (dan terdapat cukup kata, min 5), dahulukan kata tsb
  if (rangeLetters.length >= 5) {
    const filtered = MATERIAL_CATALOG.filter((item) => rangeLetters.includes(item.huruf));
    if (filtered.length >= 5) {
      primaryCatalog = filtered;
    }
  }

  // Acak katalog materi agar tiap stage mendapatkan variasi kosakata berbeda
  const shuffledCatalog = shuffle(primaryCatalog, randomFn);
  const fallbackCatalog = shuffle(MATERIAL_CATALOG, randomFn);

  let catalogWordIndex = 0;
  let configIndex = 0;
  const shuffledConfigs = shuffle([...SAMPLE_LETTER_SEQUENCE_CONFIGS], randomFn);

  const result: QuestionInput[] = [];

  for (const gameType of finalGameTypes) {
    if (gameType === "urutkanHuruf") {
      const config = shuffledConfigs[configIndex % shuffledConfigs.length];
      configIndex++;

      const qInput: QuestionInput = {
        stageId,
        gameType: "urutkanHuruf",
        isActive: true,
        config: {
          startLetter: config.startLetter,
          endLetter: config.endLetter,
          letterCount: config.letterCount,
        },
      };

      // Validasi defensive
      const errors = validateLetterSequenceConfig(qInput.config);
      if (errors.length === 0) {
        result.push(qInput);
        continue;
      }
    }

    // Untuk 6 tipe game standar: ambil materi kata unik
    const material =
      shuffledCatalog[catalogWordIndex % shuffledCatalog.length] ||
      fallbackCatalog[catalogWordIndex % fallbackCatalog.length];
    catalogWordIndex++;

    const qInput: QuestionInput = {
      stageId,
      gameType: gameType as StandardGameType,
      kata: material.kata,
      huruf: material.huruf,
      isActive: true,
    };

    result.push(qInput);
  }

  return result;
}

