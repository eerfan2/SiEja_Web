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

export function getStudentRemedialCount(student: Student): number {
  return STAGE_IDS.filter((stageId) => isRemedial(student.progress[stageId])).length;
}

export function studentMatchesProgressFilter(
  student: Student,
  filter: ProgressFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "remedial") return getStudentRemedialCount(student) > 0;

  const statuses = STAGE_IDS.map(
    (stageId) => student.progress[stageId]?.status ?? defaultStageStatus(stageId),
  );
  if (filter === "completed") return statuses.some((status) => status === "completed");

  let highestOpenStatus: "locked" | "unlocked" | "completed" = "locked";
  for (let i = STAGE_IDS.length - 1; i >= 0; i--) {
    const stageId = STAGE_IDS[i];
    const status = student.progress[stageId]?.status ?? defaultStageStatus(stageId);
    if (status !== "locked") {
      highestOpenStatus = status;
      break;
    }
  }
  return highestOpenStatus === "unlocked";
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
    if (q.isActive) result[q.stageId] += 1;
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
