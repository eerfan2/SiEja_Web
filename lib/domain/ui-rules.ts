import { defaultStageStatus, isRemedial } from "@/lib/domain/business-rules";
import { STAGE_IDS, type Question, type StageId, type Student } from "@/types/sieja";

export interface StageStatusCounts {
  locked: number;
  unlocked: number;
  completed: number;
}

export type StageAudienceState = "all-locked" | "all-open" | "mixed";
export type StudentAvatarKind = "eja" | "eva" | "neutral";
export type ProgressFilter = "all" | "remedial" | "completed" | "incomplete";

export function countStageStatuses(
  students: Student[],
  stageId: StageId,
): StageStatusCounts {
  const counts: StageStatusCounts = { locked: 0, unlocked: 0, completed: 0 };
  students.forEach((student) => {
    const status = student.progress[stageId]?.status ?? defaultStageStatus(stageId);
    counts[status] += 1;
  });
  return counts;
}

export function getStageAudienceState(
  counts: StageStatusCounts,
  totalStudents: number,
): StageAudienceState {
  if (totalStudents > 0 && counts.locked === totalStudents) return "all-locked";
  if (
    totalStudents > 0 &&
    counts.locked === 0 &&
    counts.unlocked + counts.completed === totalStudents
  ) {
    return "all-open";
  }
  return "mixed";
}

export function getStudentAvatarKind(jenisKelamin: string): StudentAvatarKind {
  const normalized = jenisKelamin.trim();
  if (normalized === "Laki-laki") return "eja";
  if (normalized === "Perempuan") return "eva";
  return "neutral";
}

/**
 * Menghitung usia paling banyak (modus / dominan) di antara para siswa.
 * Jika terdapat lebih dari satu usia dengan jumlah yang sama tinggi,
 * semua usia tersebut akan digabungkan (contoh: 5 dan 6 tahun -> "5-6 tahun").
 */
export function getDominantAgeInfo(students: Array<{ usia?: number }>): {
  dominantAgeLabel: string;
  dominantAges: number[];
} {
  const freq = new Map<number, number>();
  for (const s of students) {
    if (typeof s.usia === "number" && !isNaN(s.usia) && s.usia > 0) {
      freq.set(s.usia, (freq.get(s.usia) ?? 0) + 1);
    }
  }

  if (freq.size === 0) {
    return { dominantAgeLabel: "-", dominantAges: [] };
  }

  let maxCount = 0;
  for (const count of freq.values()) {
    if (count > maxCount) maxCount = count;
  }

  const tiedAges: number[] = [];
  for (const [age, count] of freq.entries()) {
    if (count === maxCount) {
      tiedAges.push(age);
    }
  }

  tiedAges.sort((a, b) => a - b);

  return {
    dominantAgeLabel: `${tiedAges.join("-")} tahun`,
    dominantAges: tiedAges,
  };
}

export function getStudentRemedialCount(
  student: Student,
  stageIds?: readonly StageId[],
): number {
  const ids =
    stageIds && stageIds.length > 0
      ? stageIds
      : Array.from(
          new Set([
            ...STAGE_IDS,
            ...Object.keys(student?.progress || {}).filter((k) =>
              /^stage[1-9][0-9]*$/.test(k),
            ),
          ]),
        );
  return ids.filter((stageId) => isRemedial(student.progress[stageId])).length;
}

export function studentMatchesProgressFilter(
  student: Student,
  filter: ProgressFilter,
  stageIds?: readonly StageId[],
): boolean {
  if (filter === "all") return true;
  if (filter === "remedial") return getStudentRemedialCount(student, stageIds) > 0;

  const ids =
    stageIds && stageIds.length > 0
      ? stageIds
      : Array.from(
          new Set([
            ...STAGE_IDS,
            ...Object.keys(student?.progress || {}).filter((k) =>
              /^stage[1-9][0-9]*$/.test(k),
            ),
          ]),
        ).sort((a, b) => {
          const numA = Number(a.replace("stage", "")) || 0;
          const numB = Number(b.replace("stage", "")) || 0;
          return numA - numB;
        });

  const statuses = ids.map(
    (stageId) => student.progress[stageId]?.status ?? defaultStageStatus(stageId),
  );
  if (filter === "completed") return statuses.some((status) => status === "completed");

  let highestOpenStatus: "locked" | "unlocked" | "completed" = "locked";
  for (let i = ids.length - 1; i >= 0; i--) {
    const stageId = ids[i];
    const status = student.progress[stageId]?.status ?? defaultStageStatus(stageId);
    if (status !== "locked") {
      highestOpenStatus = status;
      break;
    }
  }
  return highestOpenStatus === "unlocked";
}

/**
 * Mengumpulkan seluruh ID stage yang tersedia secara dinamis:
 * 1. Default stage 1–6 (selalu ada)
 * 2. Stage dari koleksi 'stages' (misal: stage7, stage8, stage9)
 * 3. Stage yang tercatat di progress siswa
 * Diurutkan berdasarkan nomor stage secara menaik.
 */
export function getAvailableStageIds(
  stages: { id: StageId }[] = [],
  students: Student[] = [],
): StageId[] {
  const set = new Set<string>();

  for (let i = 1; i <= 6; i++) {
    set.add(`stage${i}`);
  }

  for (const s of stages) {
    if (s.id) set.add(s.id);
  }

  for (const student of students) {
    if (student.progress) {
      for (const key of Object.keys(student.progress)) {
        if (/^stage[1-9][0-9]*$/.test(key)) {
          set.add(key);
        }
      }
    }
  }

  return Array.from(set).sort((a, b) => {
    const numA = Number(a.replace("stage", "")) || 0;
    const numB = Number(b.replace("stage", "")) || 0;
    return numA - numB;
  }) as StageId[];
}

// ---------------------------------------------------------------------------
// Bank Soal — informasi untuk halaman Kelola Soal (UI only, tidak ada efek ke Android)
// ---------------------------------------------------------------------------

/** Status bank soal per stage berdasarkan jumlah soal aktif vs kebutuhan sesi (10). */
export type BankSoalStatus = "perlu-fallback" | "cukup" | "bank-variatif";

/**
 * Hitung jumlah soal aktif (isActive === true) per stageId.
 * Menggunakan array Question yang sudah di-fetch di halaman — tidak ada query Firestore baru.
 */
export function countActiveQuestionsPerStage(
  questions: Question[],
): Record<StageId, number> {
  const result = Object.fromEntries(
    STAGE_IDS.map((id) => [id, 0]),
  ) as Record<StageId, number>;
  for (const q of questions) {
    if (q.isActive) {
      result[q.stageId] = (result[q.stageId] ?? 0) + 1;
    }
  }
  return result;
}

/**
 * Tentukan status bank soal berdasarkan jumlah soal aktif.
 *
 * - < 10  → "perlu-fallback"  (kekurangan dilengkapi local fallback Android)
 * - = 10  → "cukup"           (kebutuhan sesi terpenuhi dari bank soal)
 * - > 10  → "bank-variatif"   (Android memilih 10 secara acak)
 *
 * Batas 10 mencerminkan MAX_SESSION_QUESTIONS di Android dan TIDAK boleh diubah
 * dari sisi website.
 */
export const MAX_SESSION_QUESTIONS = 10;

export function getBankSoalStatus(activeCount: number): BankSoalStatus {
  if (activeCount < MAX_SESSION_QUESTIONS) return "perlu-fallback";
  if (activeCount === MAX_SESSION_QUESTIONS) return "cukup";
  return "bank-variatif";
}
