import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateNextStageNumber,
  defaultStageStatus,
  isStageId,
  validateStageAccess,
} from "../lib/domain/business-rules";
import { DEFAULT_STAGE_ITEMS } from "../services/stage-service";

test("calculateNextStageNumber: menentukan nomor stage baru otomatis setelah stage terakhir", () => {
  // Jika belum ada dokumen di koleksi stages (hanya 6 bawaan)
  assert.equal(calculateNextStageNumber([]), 7);
  assert.equal(calculateNextStageNumber([1, 2, 3, 4, 5, 6]), 7);

  // Jika sudah ada stage 7
  assert.equal(calculateNextStageNumber([1, 2, 3, 4, 5, 6, 7]), 8);

  // Menangani input tidak berurutan secara aman
  assert.equal(calculateNextStageNumber([5, 8, 2, 7, 3, 1, 6, 4]), 9);

  // Minimal selalu setelah Stage 6
  assert.equal(calculateNextStageNumber([1, 2]), 7);
});

test("isStageId: memvalidasi format ID stage bawaan maupun dinamis", () => {
  assert.equal(isStageId("stage1"), true);
  assert.equal(isStageId("stage2"), true);
  assert.equal(isStageId("stage6"), true);
  assert.equal(isStageId("stage7"), true);
  assert.equal(isStageId("stage10"), true);
  assert.equal(isStageId("stage99"), true);

  // Nilai tidak valid
  assert.equal(isStageId("stage0"), false);
  assert.equal(isStageId("stage"), false);
  assert.equal(isStageId("stage-1"), false);
  assert.equal(isStageId("stageABC"), false);
  assert.equal(isStageId("level1"), false);
  assert.equal(isStageId(""), false);
});

test("defaultStageStatus: stage 1 default unlocked, stage baru selalu default locked", () => {
  assert.equal(defaultStageStatus("stage1"), "unlocked");
  assert.equal(defaultStageStatus("stage2"), "locked");
  assert.equal(defaultStageStatus("stage6"), "locked");
  assert.equal(defaultStageStatus("stage7"), "locked");
  assert.equal(defaultStageStatus("stage100"), "locked");
});

test("validateStageAccess: aturan akses Stage 1 mempertahankan perilaku lama", () => {
  // Stage 1 dapat dimainkan jika dibuka guru (default)
  const accessible = validateStageAccess(1, true, false);
  assert.equal(accessible.canPlay, true);
  assert.equal(accessible.reason, undefined);

  // Stage 1 terkunci jika guru secara eksplisit menguncinya
  const teacherLocked = validateStageAccess(1, false, false);
  assert.equal(teacherLocked.canPlay, false);
  assert.equal(teacherLocked.reason, "teacher_locked");
});

test("validateStageAccess: aturan akses Stage N > 1 memerlukan izin guru DAN penyelesaian stage sebelumnya", () => {
  // Skenario 1: Guru belum membuka stage N -> Terkunci karena guru
  const case1 = validateStageAccess(2, false, true);
  assert.equal(case1.canPlay, false);
  assert.equal(case1.reason, "teacher_locked");

  // Skenario 2: Guru sudah membuka stage N, tapi stage N-1 belum selesai -> Terkunci karena stage sebelumnya
  const case2 = validateStageAccess(2, true, false);
  assert.equal(case2.canPlay, false);
  assert.equal(case2.reason, "prev_incomplete");

  // Skenario 3: Guru belum membuka DAN stage N-1 belum selesai -> Terkunci (prioritas guru)
  const case3 = validateStageAccess(2, false, false);
  assert.equal(case3.canPlay, false);
  assert.equal(case3.reason, "teacher_locked");

  // Skenario 4: Guru sudah membuka DAN stage N-1 sudah selesai -> BISA DIMAINKAN
  const case4 = validateStageAccess(2, true, true);
  assert.equal(case4.canPlay, true);
  assert.equal(case4.reason, undefined);

  // Berlaku identik untuk Stage 7 dan seterusnya
  assert.equal(validateStageAccess(7, true, true).canPlay, true);
  assert.equal(validateStageAccess(7, false, true).canPlay, false);
  assert.equal(validateStageAccess(7, true, false).canPlay, false);
});

test("DEFAULT_STAGE_ITEMS: menyediakan 6 stage default dengan status Stage 1 terbuka", () => {
  assert.equal(DEFAULT_STAGE_ITEMS.length, 6);
  assert.equal(DEFAULT_STAGE_ITEMS[0].id, "stage1");
  assert.equal(DEFAULT_STAGE_ITEMS[0].number, 1);
  assert.equal(DEFAULT_STAGE_ITEMS[0].isOpenByTeacher, true);

  for (let i = 1; i < 6; i++) {
    assert.equal(DEFAULT_STAGE_ITEMS[i].number, i + 1);
    assert.equal(DEFAULT_STAGE_ITEMS[i].isOpenByTeacher, false);
  }
});

test("isCustomStage: Stage 7 ke atas adalah stage dinamis yang dapat diedit/dihapus, Stage 1-6 adalah bawaan", () => {
  const isCustomStage = (stageNumber: number) => stageNumber > 6;
  assert.equal(isCustomStage(1), false);
  assert.equal(isCustomStage(2), false);
  assert.equal(isCustomStage(6), false);
  assert.equal(isCustomStage(7), true);
  assert.equal(isCustomStage(8), true);
  assert.equal(isCustomStage(99), true);
});

