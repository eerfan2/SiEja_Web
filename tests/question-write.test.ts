import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreateQuestionData,
  buildUpdateQuestionData,
} from "../services/question-service";
import type { LetterSequenceQuestionInput, StandardQuestionInput } from "../types/sieja";

const input: StandardQuestionInput = {
  stageId: "stage1",
  gameType: "susunKata",
  kata: " Kucing ",
  huruf: " K ",
  isActive: true,
};

const sequenceInput: LetterSequenceQuestionInput = {
  stageId: "stage1",
  gameType: "urutkanHuruf",
  isActive: true,
  config: {
    startLetter: "F",
    endLetter: "Q",
    letterCount: 4,
  },
};

test("payload create mempertahankan schema Firestore delapan field", () => {
  const timestamp = { marker: "serverTimestamp" };
  const payload = buildCreateQuestionData(input, "teacher-uid", timestamp);

  assert.deepEqual(Object.keys(payload).sort(), [
    "createdAt",
    "createdBy",
    "gameType",
    "huruf",
    "isActive",
    "kata",
    "stageId",
    "updatedAt",
  ]);
  assert.equal(payload.kata, "kucing");
  assert.equal(payload.huruf, "k");
  assert.equal(payload.createdBy, "teacher-uid");
});

test("payload edit tidak menimpa createdAt dan createdBy", () => {
  const payload = buildUpdateQuestionData(input, { marker: "newTimestamp" });

  assert.equal("createdAt" in payload, false);
  assert.equal("createdBy" in payload, false);
  assert.deepEqual(Object.keys(payload).sort(), [
    "gameType",
    "huruf",
    "isActive",
    "kata",
    "stageId",
    "updatedAt",
  ]);
});

test("payload edit memperbarui updatedAt", () => {
  const newTimestamp = { marker: "newTimestamp" };
  const payload = buildUpdateQuestionData(input, newTimestamp);

  assert.equal(payload.updatedAt, newTimestamp);
});

test("payload urutkanHuruf menyimpan config tanpa kata dan huruf", () => {
  const payload = buildCreateQuestionData(
    sequenceInput,
    "teacher-uid",
    { marker: "serverTimestamp" },
  );

  assert.deepEqual(payload.config, {
    startLetter: "F",
    endLetter: "Q",
    letterCount: 4,
  });
  assert.equal("kata" in payload, false);
  assert.equal("huruf" in payload, false);
});

test("payload urutkanHuruf tidak menyimpan hasil random preview", () => {
  const payload = buildCreateQuestionData(sequenceInput, "teacher-uid", {});
  for (const forbidden of ["letters", "selected", "display", "correct", "correctLetters", "options", "correctAnswer"]) {
    assert.equal(forbidden in payload, false, forbidden);
  }
});

test("create urutkanHuruf memakai createdAt dan updatedAt yang sama", () => {
  const timestamp = { marker: "serverTimestamp" };
  const payload = buildCreateQuestionData(sequenceInput, "teacher-uid", timestamp);

  assert.equal(payload.createdAt, timestamp);
  assert.equal(payload.updatedAt, timestamp);
});

test("edit urutkanHuruf tidak menimpa createdAt atau createdBy", () => {
  const payload = buildUpdateQuestionData(sequenceInput, { marker: "updated" });

  assert.equal("createdAt" in payload, false);
  assert.equal("createdBy" in payload, false);
  assert.deepEqual(payload.config, sequenceInput.config);
});
