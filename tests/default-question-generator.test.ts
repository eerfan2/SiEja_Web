import test from "node:test";
import assert from "node:assert/strict";
import {
  generateDefaultQuestionsForStage,
  GAME_TYPE_DIFFICULTIES,
  SAMPLE_LETTER_SEQUENCE_CONFIGS,
} from "../lib/domain/default-question-generator";
import { validateQuestionInput } from "../lib/domain/business-rules";
import { validateLetterSequenceConfig } from "../lib/domain/letter-sequence";
import { GAME_TYPES } from "../types/sieja";

test("generateDefaultQuestionsForStage: menghasilkan tepat 10 soal secara default", () => {
  const questions = generateDefaultQuestionsForStage("stage7");
  assert.equal(questions.length, 10);
});

test("generateDefaultQuestionsForStage: seluruh soal aktif dan memiliki stageId yang sesuai", () => {
  const stageId = "stage8";
  const questions = generateDefaultQuestionsForStage(stageId);

  for (const q of questions) {
    assert.equal(q.stageId, stageId);
    assert.equal(q.isActive, true);
  }
});

test("generateDefaultQuestionsForStage: ke-7 tipe mini-game terwakili minimal 1 kali", () => {
  const questions = generateDefaultQuestionsForStage("stage7");
  const presentTypes = new Set(questions.map((q) => q.gameType));

  for (const expectedType of GAME_TYPES) {
    assert.ok(
      presentTypes.has(expectedType),
      `Tipe game "${expectedType}" harus hadir dalam paket soal default`,
    );
  }
});

test("generateDefaultQuestionsForStage: komposisi kesulitan terdistribusi (mudah, sedang, sulit)", () => {
  const questions = generateDefaultQuestionsForStage("stage7");
  const difficultyCounts = { mudah: 0, sedang: 0, sulit: 0 };

  for (const q of questions) {
    const diff = GAME_TYPE_DIFFICULTIES[q.gameType];
    difficultyCounts[diff]++;
  }

  // Tiap level kesulitan minimal memiliki 2 soal dalam 10 soal
  assert.ok(difficultyCounts.mudah >= 2, `Mudah: ${difficultyCounts.mudah}`);
  assert.ok(difficultyCounts.sedang >= 2, `Sedang: ${difficultyCounts.sedang}`);
  assert.ok(difficultyCounts.sulit >= 2, `Sulit: ${difficultyCounts.sulit}`);
  assert.equal(
    difficultyCounts.mudah + difficultyCounts.sedang + difficultyCounts.sulit,
    10,
  );
});

test("generateDefaultQuestionsForStage: seluruh soal tervalidasi 100% tanpa error", () => {
  const questions = generateDefaultQuestionsForStage("stage7");

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const errors = validateQuestionInput(q);
    assert.deepEqual(
      errors,
      [],
      `Soal index ${i} (${q.gameType}) memiliki error validasi: ${errors.join(", ")}`,
    );

    if (q.gameType === "urutkanHuruf") {
      assert.ok("config" in q && q.config, "urutkanHuruf harus memiliki config");
      const configErrors = validateLetterSequenceConfig(q.config);
      assert.deepEqual(configErrors, [], "Config urutkanHuruf harus valid");
    } else {
      assert.ok("kata" in q && q.kata, "Soal standar harus memiliki kata");
      assert.ok("huruf" in q && q.huruf, "Soal standar harus memiliki huruf");
      assert.equal(q.huruf, q.kata[0].toLowerCase(), "Huruf harus merupakan inisial kata");
    }
  }
});

test("generateDefaultQuestionsForStage: soal standar tidak memiliki kata yang duplikat", () => {
  const questions = generateDefaultQuestionsForStage("stage7");
  const words = questions
    .filter((q) => q.gameType !== "urutkanHuruf")
    .map((q) => ("kata" in q ? q.kata : ""));

  const uniqueWords = new Set(words);
  assert.equal(
    uniqueWords.size,
    words.length,
    "Seluruh soal standar dalam 1 stage default harus menggunakan kata yang unik",
  );
});

test("generateDefaultQuestionsForStage: mendukung pembuatan soal untuk stage dinamis manapun", () => {
  for (const sId of ["stage7", "stage8", "stage9", "stage12"]) {
    const questions = generateDefaultQuestionsForStage(sId);
    assert.equal(questions.length, 10);
    assert.equal(questions.every((q) => q.stageId === sId), true);
  }
});

test("SAMPLE_LETTER_SEQUENCE_CONFIGS: seluruh sampel konfigurasi valid", () => {
  for (const config of SAMPLE_LETTER_SEQUENCE_CONFIGS) {
    const errors = validateLetterSequenceConfig(config);
    assert.deepEqual(errors, [], `Config ${JSON.stringify(config)} harus valid`);
  }
});

