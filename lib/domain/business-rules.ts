import { MATERIAL_CATALOG } from "@/data/material-catalog";
import { validateLetterSequenceConfig } from "@/lib/domain/letter-sequence";
import {
  GAME_TYPES,
  STAGE_IDS,
  type GameType,
  type QuestionInput,
  type StageId,
  type StageProgress,
  type StageStatus,
} from "@/types/sieja";

export const STAGE_COUNT = 6;

export function calculateStars(score: number): 0 | 1 | 2 | 3 {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

export function isRemedial(progress?: StageProgress | null): boolean {
  return progress?.status === "completed" && progress.skor < 50;
}

export function defaultStageStatus(stageId: StageId): StageStatus {
  return stageId === "stage1" ? "unlocked" : "locked";
}

export function isStageId(value: string): value is StageId {
  return STAGE_IDS.includes(value as StageId);
}

export function isGameType(value: string): value is GameType {
  return GAME_TYPES.includes(value as GameType);
}

export function materialExistsInCatalog(huruf: string, kata: string): boolean {
  return MATERIAL_CATALOG.some(
    (item) => item.huruf === huruf.toLowerCase() && item.kata === kata.toLowerCase(),
  );
}

export function validateQuestionInput(input: QuestionInput): string[] {
  const errors: string[] = [];
  if (!isStageId(input.stageId)) errors.push("Stage tidak valid.");
  if (!isGameType(input.gameType)) errors.push("Jenis mini-game tidak valid.");
  if (typeof input.isActive !== "boolean") errors.push("Status aktif harus berupa boolean.");

  if (input.gameType === "urutkanHuruf") {
    if (!("config" in input) || !input.config) {
      errors.push("Konfigurasi rentang huruf wajib diisi.");
      return errors;
    }
    return [...errors, ...validateLetterSequenceConfig(input.config)];
  }

  const kata = "kata" in input && typeof input.kata === "string" ? input.kata : "";
  const huruf = "huruf" in input && typeof input.huruf === "string" ? input.huruf : "";
  if (!kata.trim()) errors.push("Kata tidak boleh kosong.");
  if (!huruf.trim()) errors.push("Huruf tidak boleh kosong.");
  if (huruf.trim() && !/^[a-z]$/i.test(huruf.trim())) {
    errors.push("Huruf harus satu karakter A-Z.");
  }
  if (
    kata.trim() &&
    huruf.trim() &&
    /^[a-z]$/i.test(huruf.trim()) &&
    !materialExistsInCatalog(huruf.trim(), kata.trim())
  ) {
    errors.push("Materi tidak tersedia dalam katalog asset SiEja.");
  }
  return errors;
}

export function normalizeTeacherEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@sieja.com`;
}

export function formatDate(value?: { toDate?: () => Date } | null): string {
  if (!value?.toDate) return "Belum tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value.toDate());
}

export function stageNumber(stageId: StageId): number {
  return Number(stageId.replace("stage", ""));
}
