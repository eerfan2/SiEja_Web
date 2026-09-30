import type { Timestamp } from "firebase/firestore";

export const GAME_TYPES = [
  "dengarSuaraHuruf",
  "tebakGambarObjek",
  "susunKata",
  "hurufYangHilang",
  "hurufAwalApa",
  "cocokkanHuruf",
  "urutkanHuruf",
] as const;

export const STAGE_IDS = [
  "stage1",
  "stage2",
  "stage3",
  "stage4",
  "stage5",
  "stage6",
] as const;

export type GameType = (typeof GAME_TYPES)[number];
export type StandardGameType = Exclude<GameType, "urutkanHuruf">;
export type StageId = (typeof STAGE_IDS)[number];
export type StageStatus = "locked" | "unlocked" | "completed";

export const ALPHABET = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
] as const;

export type AlphabetLetter = (typeof ALPHABET)[number];

export interface LetterSequenceConfig {
  startLetter: AlphabetLetter;
  endLetter: AlphabetLetter;
  letterCount: number;
}

export interface StageProgress {
  skor: number;
  status: StageStatus;
  updatedAt?: Timestamp | null;
}

export type ProgressMap = Partial<Record<StageId, StageProgress>>;

export interface Student {
  id: string;
  namaLengkap: string;
  username: string;
  pin: string;
  usia: number;
  jenisKelamin: string;
  createdAt?: Timestamp | null;
  progress: ProgressMap;
}

export interface NewStudentInput {
  namaLengkap: string;
  username: string;
  usia: number;
  jenisKelamin: string;
}

interface QuestionBase {
  id: string;
  stageId: StageId;
  isActive: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  createdBy: string;
}

export interface StandardQuestion extends QuestionBase {
  gameType: StandardGameType;
  kata: string;
  huruf: string;
  config?: never;
}

export interface LetterSequenceQuestion extends QuestionBase {
  gameType: "urutkanHuruf";
  config: LetterSequenceConfig;
  kata?: never;
  huruf?: never;
}

/** Dokumen urutkanHuruf lama yang masih memakai kata + huruf. */
export interface LegacyLetterSequenceQuestion extends QuestionBase {
  gameType: "urutkanHuruf";
  kata: string;
  huruf: string;
  config?: never;
}

export type Question =
  | StandardQuestion
  | LetterSequenceQuestion
  | LegacyLetterSequenceQuestion;

interface QuestionInputBase {
  stageId: StageId;
  isActive: boolean;
}

export interface StandardQuestionInput extends QuestionInputBase {
  gameType: StandardGameType;
  kata: string;
  huruf: string;
  config?: never;
}

export interface LetterSequenceQuestionInput extends QuestionInputBase {
  gameType: "urutkanHuruf";
  config: LetterSequenceConfig;
  kata?: never;
  huruf?: never;
}

export type QuestionInput = StandardQuestionInput | LetterSequenceQuestionInput;

export function isLetterSequenceQuestion(
  question: Question,
): question is LetterSequenceQuestion {
  return question.gameType === "urutkanHuruf" && "config" in question;
}

export function isLegacyLetterSequenceQuestion(
  question: Question,
): question is LegacyLetterSequenceQuestion {
  return question.gameType === "urutkanHuruf" && !("config" in question);
}

export function isLetterSequenceInput(
  input: QuestionInput,
): input is LetterSequenceQuestionInput {
  return input.gameType === "urutkanHuruf";
}

export interface MaterialItem {
  huruf: string;
  kata: string;
  imagePath: string;
  letterAudioPath: string;
  wordAudioPath: string;
}

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}
