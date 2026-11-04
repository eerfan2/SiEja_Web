import assert from "node:assert/strict";
import test from "node:test";
import {
  getAvailableStageIds,
  getStudentRemedialCount,
  studentMatchesProgressFilter,
} from "../lib/domain/ui-rules";
import { getRemedialItems } from "../services/progress-service";
import { getRecommendedGameTypesForStage } from "../data/material-catalog";
import { GAME_TYPES, type StageItem, type Student } from "../types/sieja";

function mockStudent(
  id: string,
  progress: Student["progress"] = {},
): Student {
  return {
    id,
    namaLengkap: `Anak ${id}`,
    username: `anak${id}`,
    pin: "001",
    usia: 6,
    jenisKelamin: "Laki-laki",
    progress,
  };
}

test("getAvailableStageIds: minimal selalu berisi stage 1 hingga 6", () => {
  const ids = getAvailableStageIds([], []);
  assert.deepEqual(ids, [
    "stage1",
    "stage2",
    "stage3",
    "stage4",
    "stage5",
    "stage6",
  ]);
});

test("getAvailableStageIds: mendeteksi stage baru sampai stage 9 dari data stages", () => {
  const stages: StageItem[] = [
    { id: "stage1", number: 1, range: "A–E", isOpenByTeacher: true },
    { id: "stage7", number: 7, range: "A–E", isOpenByTeacher: false },
    { id: "stage8", number: 8, range: "F–J", isOpenByTeacher: false },
    { id: "stage9", number: 9, range: "K–O", isOpenByTeacher: false },
  ];
  const ids = getAvailableStageIds(stages, []);
  assert.deepEqual(ids, [
    "stage1",
    "stage2",
    "stage3",
    "stage4",
    "stage5",
    "stage6",
    "stage7",
    "stage8",
    "stage9",
  ]);
});

test("getAvailableStageIds: mendeteksi stage yang ada di progress siswa jika belum ada di koleksi stages", () => {
  const students = [
    mockStudent("1", {
      stage7: { status: "completed", skor: 80 },
      stage9: { status: "unlocked", skor: 0 },
    }),
  ];
  const ids = getAvailableStageIds([], students);
  assert.deepEqual(ids, [
    "stage1",
    "stage2",
    "stage3",
    "stage4",
    "stage5",
    "stage6",
    "stage7",
    "stage9",
  ]);
});

test("getStudentRemedialCount: mendeteksi remedial pada stage 7, 8, atau 9", () => {
  const studentWithRemedialStage8 = mockStudent("1", {
    stage1: { status: "completed", skor: 100 },
    stage8: { status: "completed", skor: 40 }, // < 50 => remedial
  });

  const count = getStudentRemedialCount(studentWithRemedialStage8);
  assert.equal(count, 1);
});

test("studentMatchesProgressFilter: filter remedial dan completed mencakup stage dinamis", () => {
  const studentStage9 = mockStudent("1", {
    stage1: { status: "completed", skor: 90 },
    stage9: { status: "completed", skor: 40 },
  });

  const dynamicIds = ["stage1", "stage2", "stage3", "stage4", "stage5", "stage6", "stage7", "stage8", "stage9"];
  assert.equal(studentMatchesProgressFilter(studentStage9, "remedial", dynamicIds), true);
  assert.equal(studentMatchesProgressFilter(studentStage9, "completed", dynamicIds), true);
});

test("getRemedialItems: mengambil stage remedial untuk stage 7 ke atas", () => {
  const students = [
    mockStudent("1", {
      stage9: { status: "completed", skor: 30 },
    }),
  ];

  const items = getRemedialItems(students);
  assert.equal(items.length, 1);
  assert.equal(items[0].stageId, "stage9");
  assert.equal(items[0].progress.skor, 30);
});

test("getRecommendedGameTypesForStage: mengembalikan array valid (GAME_TYPES) untuk stage dinamis", () => {
  const stage7Types = getRecommendedGameTypesForStage("stage7");
  assert.ok(Array.isArray(stage7Types));
  assert.equal(stage7Types.length, GAME_TYPES.length);
  assert.equal(stage7Types.includes("urutkanHuruf"), true);

  const stage9Types = getRecommendedGameTypesForStage("stage9");
  assert.ok(Array.isArray(stage9Types));
  assert.equal(stage9Types.length, GAME_TYPES.length);
});
