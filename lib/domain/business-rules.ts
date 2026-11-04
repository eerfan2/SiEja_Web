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
  return (STAGE_IDS as readonly string[]).includes(value) || /^stage[1-9][0-9]*$/.test(value);
}

export function calculateNextStageNumber(existingNumbers: number[]): number {
  if (existingNumbers.length === 0) return 7;
  return Math.max(6, ...existingNumbers) + 1;
}

export function validateStageAccess(
  stageNumber: number,
  isUnlockedByTeacher: boolean,
  isPrevStageCompleted: boolean,
): { canPlay: boolean; reason?: "teacher_locked" | "prev_incomplete" } {
  if (stageNumber === 1) {
    if (!isUnlockedByTeacher) {
      return { canPlay: false, reason: "teacher_locked" };
    }
    return { canPlay: true };
  }

  if (!isUnlockedByTeacher) {
    return { canPlay: false, reason: "teacher_locked" };
  }
  if (!isPrevStageCompleted) {
    return { canPlay: false, reason: "prev_incomplete" };
  }
  return { canPlay: true };
}

export function isGameType(value: string): value is GameType {
  return GAME_TYPES.includes(value as GameType);
}

export function materialExistsInCatalog(
  huruf: string,
  kata: string,
  dynamicCatalogWords?: string[],
): boolean {
  const normKata = kata.toLowerCase().trim();
  const normHuruf = huruf.toLowerCase().trim();
  const inStatic = MATERIAL_CATALOG.some(
    (item) => item.huruf === normHuruf && item.kata === normKata,
  );
  if (inStatic) return true;
  if (dynamicCatalogWords && dynamicCatalogWords.includes(normKata)) {
    return true;
  }
  return false;
}

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function formatCatalogWord(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return "";
  return trimmed.toUpperCase();
}

export function calculateInitialLetter(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return "";
  return trimmed[0].toUpperCase();
}

export function isValidLetterAudioId(letter: string): boolean {
  return /^[A-Z]$/.test(letter.trim().toUpperCase());
}

export const VALID_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;
export const VALID_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const VALID_AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
  ".aac",
  ".webm",
] as const;
export const VALID_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/m4a",
  "audio/ogg",
  "audio/aac",
  "audio/webm",
] as const;
export const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: { name: string; size: number; type?: string }): string[] {
  const errors: string[] = [];
  if (file.size <= 0) errors.push("Berkas gambar tidak boleh kosong.");
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    errors.push(`Ukuran gambar maksimal adalah ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB.`);
  }
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  const hasValidExt = VALID_IMAGE_EXTENSIONS.includes(ext as any);
  const hasValidMime = file.type ? VALID_IMAGE_MIME_TYPES.includes(file.type.toLowerCase() as any) : true;
  if (!hasValidExt && !hasValidMime) {
    errors.push("Format gambar harus berupa PNG, JPG, JPEG, atau WebP.");
  }
  return errors;
}

export function validateAudioFile(file: { name: string; size: number; type?: string }): string[] {
  const errors: string[] = [];
  if (file.size <= 0) errors.push("Berkas audio tidak boleh kosong.");
  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    errors.push(`Ukuran audio maksimal adalah ${MAX_AUDIO_SIZE_BYTES / (1024 * 1024)} MB.`);
  }
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  const hasValidExt = VALID_AUDIO_EXTENSIONS.includes(ext as any);
  const hasValidMime = file.type ? VALID_AUDIO_MIME_TYPES.includes(file.type.toLowerCase() as any) : true;
  if (!hasValidExt && !hasValidMime) {
    errors.push("Format audio harus berupa MP3, WAV, M4A, OGG, AAC, atau WebM.");
  }
  return errors;
}

export function validateCatalogInput(
  input: { word: string; letterAudioId: string },
  existingNormalizedWords: string[] = [],
  currentNormalizedWord?: string,
): string[] {
  const errors: string[] = [];
  const normalized = normalizeWord(input.word);
  if (!normalized) {
    errors.push("Nama kata tidak boleh kosong.");
  } else if (!/^[a-zA-Z\s\-]+$/.test(input.word.trim())) {
    errors.push("Nama kata hanya boleh mengandung huruf alfabet, spasi, atau tanda hubung.");
  }

  if (!isValidLetterAudioId(input.letterAudioId)) {
    errors.push("Pilihan audio huruf harus satu karakter A–Z yang valid.");
  }

  if (normalized && normalized !== currentNormalizedWord) {
    if (existingNormalizedWords.includes(normalized)) {
      errors.push(`Kata "${input.word.trim().toUpperCase()}" sudah terdaftar dalam katalog.`);
    }
  }

  return errors;
}

export function validateQuestionInput(
  input: QuestionInput,
  dynamicCatalogWords?: string[],
): string[] {
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
    !materialExistsInCatalog(huruf.trim(), kata.trim(), dynamicCatalogWords)
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
