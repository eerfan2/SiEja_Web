import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateStars,
  defaultStageStatus,
  isRemedial,
  normalizeTeacherEmail,
  validateQuestionInput,
} from "../lib/domain/business-rules";
import { GAME_TYPES, type StandardGameType, type StandardQuestionInput } from "../types/sieja";

function question(overrides: Partial<StandardQuestionInput> = {}): StandardQuestionInput {
  return {
    stageId: "stage1",
    gameType: "dengarSuaraHuruf",
    kata: "ayam",
    huruf: "a",
    isActive: true,
    ...overrides,
  };
}

test("batas bintang mengikuti 90, 70, dan 50", () => {
  assert.equal(calculateStars(100), 3);
  assert.equal(calculateStars(90), 3);
  assert.equal(calculateStars(89), 2);
  assert.equal(calculateStars(70), 2);
  assert.equal(calculateStars(69), 1);
  assert.equal(calculateStars(50), 1);
  assert.equal(calculateStars(49), 0);
});

test("remedial hanya completed dengan skor di bawah 50", () => {
  assert.equal(isRemedial({ status: "completed", skor: 40 }), true);
  assert.equal(isRemedial({ status: "completed", skor: 50 }), false);
  assert.equal(isRemedial({ status: "unlocked", skor: 40 }), false);
});

test("stage 1 default unlocked dan stage berikutnya locked", () => {
  assert.equal(defaultStageStatus("stage1"), "unlocked");
  assert.equal(defaultStageStatus("stage2"), "locked");
});

test("username guru mengikuti mekanisme email internal Android", () => {
  assert.equal(normalizeTeacherEmail("Guru"), "guru@sieja.com");
  assert.equal(normalizeTeacherEmail("guru@example.com"), "guru@example.com");
});

test("Stage 1 menerima materi A", () => {
  assert.deepEqual(validateQuestionInput(question()), []);
});

test("Stage 1 menerima materi K", () => {
  assert.deepEqual(validateQuestionInput(question({ kata: "kucing", huruf: "k" })), []);
});

test("Stage 1 menerima materi Z", () => {
  assert.deepEqual(validateQuestionInput(question({ kata: "zebra", huruf: "z" })), []);
});

test("Stage 1 menerima susunKata", () => {
  assert.deepEqual(validateQuestionInput(question({ gameType: "susunKata" })), []);
});

test("Stage 1 menerima semua enam GameType berbasis materi", () => {
  for (const gameType of GAME_TYPES.filter((type) => type !== "urutkanHuruf")) {
    assert.deepEqual(validateQuestionInput(question({ gameType })), [], gameType);
  }
});

test("GameType invalid tetap ditolak", () => {
  const invalid = question({ gameType: "gameTidakResmi" as StandardGameType });
  assert.match(validateQuestionInput(invalid)[0], /mini-game tidak valid/i);
});

test("material yang tidak ada di katalog tetap ditolak", () => {
  const invalid = question({ kata: "apel", huruf: "a" });
  assert.match(validateQuestionInput(invalid)[0], /katalog asset/i);
});

test("huruf harus tepat satu karakter A-Z", () => {
  const invalid = question({ kata: "ayam", huruf: "aa" });
  assert.match(validateQuestionInput(invalid)[0], /satu karakter A-Z/i);
});
