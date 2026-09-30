import { STAGE_DEFINITIONS } from "@/data/material-catalog";
import {
  ALPHABET,
  type AlphabetLetter,
  type LetterSequenceConfig,
  type StageId,
} from "@/types/sieja";

export const LETTER_COUNT_OPTIONS = [3, 4, 5, 6, 7] as const;

export interface LetterSequencePreview {
  selected: AlphabetLetter[];
  display: AlphabetLetter[];
  correct: AlphabetLetter[];
}

export function isAlphabetLetter(value: unknown): value is AlphabetLetter {
  return typeof value === "string" && ALPHABET.includes(value as AlphabetLetter);
}

export function getLetterIndex(letter: string): number {
  return ALPHABET.indexOf(letter.toUpperCase() as AlphabetLetter);
}

export function getLetterRange(startLetter: string, endLetter: string): AlphabetLetter[] {
  const start = getLetterIndex(startLetter);
  const end = getLetterIndex(endLetter);
  if (start < 0 || end < 0 || start > end) return [];
  return ALPHABET.slice(start, end + 1);
}

export function getLetterRangeSize(startLetter: string, endLetter: string): number {
  return getLetterRange(startLetter, endLetter).length;
}

export function getDefaultLetterSequenceConfig(stageId: StageId): LetterSequenceConfig {
  const stage = STAGE_DEFINITIONS.find((item) => item.id === stageId) ?? STAGE_DEFINITIONS[0];
  return {
    startLetter: stage.letters[0].toUpperCase() as AlphabetLetter,
    endLetter: stage.letters.at(-1)!.toUpperCase() as AlphabetLetter,
    letterCount: 4,
  };
}

export function parseLetterSequenceConfig(value: unknown): LetterSequenceConfig | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    !isAlphabetLetter(candidate.startLetter) ||
    !isAlphabetLetter(candidate.endLetter) ||
    typeof candidate.letterCount !== "number"
  ) {
    return null;
  }

  const config: LetterSequenceConfig = {
    startLetter: candidate.startLetter,
    endLetter: candidate.endLetter,
    letterCount: candidate.letterCount,
  };
  return validateLetterSequenceConfig(config).length ? null : config;
}

export function validateLetterSequenceConfig(config: LetterSequenceConfig): string[] {
  const errors: string[] = [];
  if (!isAlphabetLetter(config.startLetter)) errors.push("Huruf awal harus A-Z.");
  if (!isAlphabetLetter(config.endLetter)) errors.push("Huruf akhir harus A-Z.");

  const startIndex = getLetterIndex(config.startLetter);
  const endIndex = getLetterIndex(config.endLetter);
  if (startIndex >= 0 && endIndex >= 0 && startIndex > endIndex) {
    errors.push("Huruf awal tidak boleh setelah huruf akhir.");
  }
  if (!Number.isInteger(config.letterCount) || config.letterCount < 3 || config.letterCount > 7) {
    errors.push("Jumlah huruf harus antara 3 sampai 7.");
  }

  const rangeSize = getLetterRangeSize(config.startLetter, config.endLetter);
  if (rangeSize > 0 && config.letterCount > rangeSize) {
    errors.push("Jumlah huruf tidak boleh melebihi ukuran rentang.");
  }
  return errors;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function generateLetterSequencePreview(
  config: LetterSequenceConfig,
  random: () => number = Math.random,
): LetterSequencePreview {
  const errors = validateLetterSequenceConfig(config);
  if (errors.length) throw new Error(errors[0]);

  const selected = shuffle(
    getLetterRange(config.startLetter, config.endLetter),
    random,
  ).slice(0, config.letterCount);
  const correct = [...selected].sort(
    (left, right) => getLetterIndex(left) - getLetterIndex(right),
  );
  const display = shuffle(correct, random);

  if (display.length > 1 && display.every((letter, index) => letter === correct[index])) {
    [display[0], display[1]] = [display[1], display[0]];
  }

  return { selected, display, correct };
}
