import { GAME_TYPE_LABELS, getMaterial } from "@/data/material-catalog";
import {
  isLegacyLetterSequenceQuestion,
  isLetterSequenceQuestion,
  type GameType,
  type Question,
  type StageId,
} from "@/types/sieja";

export interface QuestionFilters {
  term: string;
  stage: StageId | "all";
  gameType: GameType | "all";
  status: "all" | "active" | "inactive";
}

export function getQuestionMaterialLabel(question: Question): string {
  if (isLetterSequenceQuestion(question)) {
    return `${question.config.startLetter}–${question.config.endLetter} / ${question.config.letterCount} Huruf`;
  }
  if (isLegacyLetterSequenceQuestion(question)) {
    return `${question.kata} / Huruf ${question.huruf.toUpperCase()} (Legacy)`;
  }
  return `${question.kata} / Huruf ${question.huruf.toUpperCase()}`;
}

export function getQuestionSearchText(question: Question): string {
  if (isLetterSequenceQuestion(question)) {
    return [
      question.config.startLetter,
      question.config.endLetter,
      `${question.config.startLetter}-${question.config.endLetter}`,
      `${question.config.letterCount} huruf`,
      GAME_TYPE_LABELS[question.gameType],
    ].join(" ").toLowerCase();
  }

  const material = getMaterial(question.huruf);
  return [
    question.kata,
    question.huruf,
    material?.kata ?? "",
    GAME_TYPE_LABELS[question.gameType],
    isLegacyLetterSequenceQuestion(question) ? "legacy" : "",
  ].join(" ").toLowerCase();
}

export function questionMatchesFilters(
  question: Question,
  filters: QuestionFilters,
): boolean {
  const term = filters.term.trim().toLowerCase();
  return (
    (!term || getQuestionSearchText(question).includes(term)) &&
    (filters.stage === "all" || question.stageId === filters.stage) &&
    (filters.gameType === "all" || question.gameType === filters.gameType) &&
    (filters.status === "all" ||
      (filters.status === "active" ? question.isActive : !question.isActive))
  );
}
