import assert from "node:assert/strict";
import test from "node:test";
import { validateQuestionInput } from "../lib/domain/business-rules";
import {
  generateLetterSequencePreview,
  getLetterRange,
} from "../lib/domain/letter-sequence";
import { questionMatchesFilters } from "../lib/domain/question-presentation";
import { countActiveQuestionsPerStage } from "../lib/domain/ui-rules";
import { parseQuestionDocument } from "../services/question-service";
import {
  isLegacyLetterSequenceQuestion,
  type LetterSequenceQuestion,
  type LetterSequenceQuestionInput,
  type Question,
  type QuestionInput,
} from "../types/sieja";

function sequenceInput(
  config: LetterSequenceQuestionInput["config"],
): LetterSequenceQuestionInput {
  return {
    stageId: "stage1",
    gameType: "urutkanHuruf",
    isActive: true,
    config,
  };
}

test("Stage 1 + F-Q + 4 valid", () => {
  assert.deepEqual(validateQuestionInput(sequenceInput({ startLetter: "F", endLetter: "Q", letterCount: 4 })), []);
});

test("Stage 1 + A-Z + 7 valid", () => {
  assert.deepEqual(validateQuestionInput(sequenceInput({ startLetter: "A", endLetter: "Z", letterCount: 7 })), []);
});

test("F-H + 4 invalid karena range hanya tiga huruf", () => {
  assert.match(validateQuestionInput(sequenceInput({ startLetter: "F", endLetter: "H", letterCount: 4 }))[0], /ukuran rentang/i);
});

test("Q-F invalid karena urutan range terbalik", () => {
  assert.match(validateQuestionInput(sequenceInput({ startLetter: "Q", endLetter: "F", letterCount: 4 }))[0], /huruf awal/i);
});

test("letterCount 2 invalid", () => {
  assert.match(validateQuestionInput(sequenceInput({ startLetter: "A", endLetter: "Z", letterCount: 2 }))[0], /3 sampai 7/i);
});

test("letterCount 8 invalid", () => {
  assert.match(validateQuestionInput(sequenceInput({ startLetter: "A", endLetter: "Z", letterCount: 8 }))[0], /3 sampai 7/i);
});

test("startLetter invalid ditolak", () => {
  const input = sequenceInput({ startLetter: "1" as "A", endLetter: "Z", letterCount: 4 });
  assert.match(validateQuestionInput(input)[0], /huruf awal/i);
});

test("endLetter invalid ditolak", () => {
  const input = sequenceInput({ startLetter: "A", endLetter: "AA" as "Z", letterCount: 4 });
  assert.match(validateQuestionInput(input)[0], /huruf akhir/i);
});

test("enam game lain tetap membutuhkan kata dan huruf", () => {
  const invalid = {
    stageId: "stage1",
    gameType: "susunKata",
    isActive: true,
  } as unknown as QuestionInput;
  const errors = validateQuestionInput(invalid).join(" ");
  assert.match(errors, /kata tidak boleh kosong/i);
  assert.match(errors, /huruf tidak boleh kosong/i);
});

test("soal legacy urutkanHuruf tetap dapat dibaca tanpa crash", () => {
  const parsed = parseQuestionDocument("legacy-1", {
    stageId: "stage1",
    gameType: "urutkanHuruf",
    kata: "nanas",
    huruf: "n",
    isActive: true,
    createdBy: "teacher-uid",
  });

  assert.ok(parsed);
  assert.equal(isLegacyLetterSequenceQuestion(parsed), true);
});

test("satu config urutkanHuruf dihitung sebagai satu soal aktif", () => {
  const question: LetterSequenceQuestion = {
    id: "sequence-1",
    stageId: "stage1",
    gameType: "urutkanHuruf",
    isActive: true,
    createdBy: "teacher-uid",
    config: { startLetter: "F", endLetter: "Q", letterCount: 4 },
  };
  assert.equal(countActiveQuestionsPerStage([question]).stage1, 1);
});

test("filter urutkanHuruf tetap bekerja", () => {
  const questions: Question[] = [
    {
      id: "sequence-1",
      stageId: "stage1",
      gameType: "urutkanHuruf",
      isActive: true,
      createdBy: "teacher-uid",
      config: { startLetter: "F", endLetter: "Q", letterCount: 4 },
    },
    {
      id: "standard-1",
      stageId: "stage1",
      gameType: "susunKata",
      kata: "ayam",
      huruf: "a",
      isActive: true,
      createdBy: "teacher-uid",
    },
  ];

  const filtered = questions.filter((question) =>
    questionMatchesFilters(question, {
      term: "",
      stage: "all",
      gameType: "urutkanHuruf",
      status: "all",
    }),
  );
  assert.deepEqual(filtered.map((question) => question.id), ["sequence-1"]);
});

test("preview generator menghasilkan huruf unik di dalam range", () => {
  const config = { startLetter: "F", endLetter: "Q", letterCount: 4 } as const;
  const preview = generateLetterSequencePreview(config, () => 0.37);
  const allowed = new Set(getLetterRange("F", "Q"));

  assert.equal(preview.selected.length, 4);
  assert.equal(new Set(preview.selected).size, 4);
  assert.ok(preview.selected.every((letter) => allowed.has(letter)));
  assert.deepEqual([...preview.correct].sort(), preview.correct);
  assert.equal(preview.display.length, 4);
});
