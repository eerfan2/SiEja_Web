import assert from "node:assert/strict";
import test from "node:test";
import {
  countActiveQuestionsPerStage,
  countStageStatuses,
  getBankSoalStatus,
  getDominantAgeInfo,
  getStageAudienceState,
  getStudentAvatarKind,
  studentMatchesProgressFilter,
} from "../lib/domain/ui-rules";
import type { ProgressMap, Question, Student } from "../types/sieja";

function student(
  id: string,
  jenisKelamin: string,
  progress: ProgressMap = {},
): Student {
  return {
    id,
    namaLengkap: `Siswa ${id}`,
    username: `siswa${id}`,
    pin: "001",
    usia: 5,
    jenisKelamin,
    progress,
  };
}

test("status stage menjadi Terkunci untuk Semua saat seluruh siswa locked", () => {
  const students = [student("1", "Laki-laki"), student("2", "Perempuan")];
  const counts = countStageStatuses(students, "stage3");

  assert.deepEqual(counts, { locked: 2, unlocked: 0, completed: 0 });
  assert.equal(getStageAudienceState(counts, students.length), "all-locked");
});

test("status stage menjadi Terbuka untuk Semua tanpa siswa locked", () => {
  const students = [
    student("1", "Laki-laki", {
      stage2: { status: "unlocked", skor: 0 },
    }),
    student("2", "Perempuan", {
      stage2: { status: "completed", skor: 80 },
    }),
  ];
  const counts = countStageStatuses(students, "stage2");

  assert.deepEqual(counts, { locked: 0, unlocked: 1, completed: 1 });
  assert.equal(getStageAudienceState(counts, students.length), "all-open");
});

test("status stage menjadi Status Campuran untuk kombinasi locked dan terbuka", () => {
  const students = [
    student("1", "Laki-laki", {
      stage2: { status: "unlocked", skor: 0 },
    }),
    student("2", "Perempuan"),
  ];
  const counts = countStageStatuses(students, "stage2");

  assert.deepEqual(counts, { locked: 1, unlocked: 1, completed: 0 });
  assert.equal(getStageAudienceState(counts, students.length), "mixed");
});

test("avatar siswa mengikuti jenisKelamin Android", () => {
  assert.equal(getStudentAvatarKind("Laki-laki"), "eja");
  assert.equal(getStudentAvatarKind("Perempuan"), "eva");
  assert.equal(getStudentAvatarKind(""), "neutral");
  assert.equal(getStudentAvatarKind("Tidak diketahui"), "neutral");
});

test("filter progress mendeteksi remedial, completed, dan belum selesai", () => {
  const remedialStudent = student("1", "Laki-laki", {
    stage1: { status: "completed", skor: 40 },
  });
  const completedStudent = student("2", "Perempuan", {
    stage1: { status: "completed", skor: 80 },
  });
  const incompleteStudent = student("3", "Laki-laki", {
    stage1: { status: "unlocked", skor: 0 },
  });

  assert.equal(studentMatchesProgressFilter(remedialStudent, "remedial"), true);
  assert.equal(studentMatchesProgressFilter(completedStudent, "remedial"), false);
  assert.equal(studentMatchesProgressFilter(completedStudent, "completed"), true);
  assert.equal(studentMatchesProgressFilter(completedStudent, "incomplete"), false);
  assert.equal(studentMatchesProgressFilter(incompleteStudent, "incomplete"), true);
  assert.equal(studentMatchesProgressFilter(completedStudent, "all"), true);
});

// ---------------------------------------------------------------------------
// Bank Soal — getBankSoalStatus
// ---------------------------------------------------------------------------

function makeQuestion(
  id: string,
  stageId: Question["stageId"],
  isActive: boolean,
): Question {
  return {
    id,
    stageId,
    gameType: "tebakGambarObjek",
    kata: `kata${id}`,
    huruf: "a",
    isActive,
    createdBy: "test",
  };
}

test("getBankSoalStatus: 0 soal aktif → perlu-fallback", () => {
  assert.equal(getBankSoalStatus(0), "perlu-fallback");
});

test("getBankSoalStatus: 6 soal aktif → perlu-fallback", () => {
  assert.equal(getBankSoalStatus(6), "perlu-fallback");
});

test("getBankSoalStatus: 10 soal aktif → cukup", () => {
  assert.equal(getBankSoalStatus(10), "cukup");
});

test("getBankSoalStatus: 11 soal aktif → bank-variatif", () => {
  assert.equal(getBankSoalStatus(11), "bank-variatif");
});

test("getBankSoalStatus: 25 soal aktif → bank-variatif", () => {
  assert.equal(getBankSoalStatus(25), "bank-variatif");
});

test("countActiveQuestionsPerStage: soal isActive=false tidak masuk count aktif", () => {
  const questions: Question[] = [
    makeQuestion("1", "stage1", true),
    makeQuestion("2", "stage1", false), // tidak dihitung
    makeQuestion("3", "stage1", false), // tidak dihitung
  ];
  const counts = countActiveQuestionsPerStage(questions);
  assert.equal(counts.stage1, 1);
});

test("countActiveQuestionsPerStage: count dipisahkan berdasarkan stageId", () => {
  const questions: Question[] = [
    makeQuestion("1", "stage1", true),
    makeQuestion("2", "stage1", true),
    makeQuestion("3", "stage2", true),
    makeQuestion("4", "stage2", false), // tidak dihitung
    makeQuestion("5", "stage3", true),
  ];
  const counts = countActiveQuestionsPerStage(questions);
  assert.equal(counts.stage1, 2);
  assert.equal(counts.stage2, 1);
  assert.equal(counts.stage3, 1);
  assert.equal(counts.stage4, 0);
  assert.equal(counts.stage5, 0);
  assert.equal(counts.stage6, 0);
});

test("getDominantAgeInfo: menampilkan usia tunggal paling banyak", () => {
  const students = [{ usia: 5 }, { usia: 5 }, { usia: 6 }, { usia: 4 }];
  const { dominantAgeLabel, dominantAges } = getDominantAgeInfo(students);
  assert.equal(dominantAgeLabel, "5 tahun");
  assert.deepEqual(dominantAges, [5]);
});

test("getDominantAgeInfo: menampilkan rentang jika ada usia yang sama tinggi (contoh: 5-6 tahun)", () => {
  // Contoh user: 5 tahun ada 10 orang dan 6 tahun ada 10 orang -> 5-6 tahun
  const students = [
    ...Array(10).fill({ usia: 5 }),
    ...Array(10).fill({ usia: 6 }),
    ...Array(3).fill({ usia: 4 }),
  ];
  const { dominantAgeLabel, dominantAges } = getDominantAgeInfo(students);
  assert.equal(dominantAgeLabel, "5-6 tahun");
  assert.deepEqual(dominantAges, [5, 6]);
});

test("getDominantAgeInfo: menangani data kosong atau usia invalid", () => {
  assert.deepEqual(getDominantAgeInfo([]), { dominantAgeLabel: "-", dominantAges: [] });
  assert.deepEqual(getDominantAgeInfo([{ usia: 0 }, { usia: undefined }]), { dominantAgeLabel: "-", dominantAges: [] });
});
