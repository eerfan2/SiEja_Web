import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateInitialLetter,
  formatCatalogWord,
  isValidLetterAudioId,
  materialExistsInCatalog,
  normalizeWord,
  validateAudioFile,
  validateCatalogInput,
  validateImageFile,
  validateQuestionInput,
} from "../lib/domain/business-rules";
import {
  buildCreateCatalogPayload,
  buildUpdateCatalogPayload,
} from "../services/catalog-service";
import { parseQuestionDocument } from "../services/question-service";

test("normalizeWord: membersihkan spasi dan mengubah ke huruf kecil", () => {
  assert.equal(normalizeWord("  BOLA  "), "bola");
  assert.equal(normalizeWord("Gajah"), "gajah");
  assert.equal(normalizeWord("Kucing Anggora"), "kucing anggora");
});

test("formatCatalogWord: mengubah ke huruf kapital sesuai konvensi", () => {
  assert.equal(formatCatalogWord("  bola  "), "BOLA");
  assert.equal(formatCatalogWord("gajah"), "GAJAH");
});

test("calculateInitialLetter: mengambil huruf awal dari kata yang dinormalisasi", () => {
  assert.equal(calculateInitialLetter("  bola  "), "B");
  assert.equal(calculateInitialLetter("Jerapah"), "J");
  assert.equal(calculateInitialLetter(""), "");
});

test("isValidLetterAudioId: memvalidasi huruf audio A–Z", () => {
  assert.equal(isValidLetterAudioId("A"), true);
  assert.equal(isValidLetterAudioId("Z"), true);
  assert.equal(isValidLetterAudioId("b"), true); // auto-uppercase diuji
  assert.equal(isValidLetterAudioId("AB"), false);
  assert.equal(isValidLetterAudioId("1"), false);
  assert.equal(isValidLetterAudioId(""), false);
  assert.equal(isValidLetterAudioId("@"), false);
});

test("validateImageFile: menerima format gambar yang didukung dan menolak file tidak valid", () => {
  // Valid
  const validPng = { name: "bola.png", size: 1024 * 500, type: "image/png" };
  assert.deepEqual(validateImageFile(validPng), []);

  const validWebp = { name: "foto.webp", size: 1024 * 1024, type: "image/webp" };
  assert.deepEqual(validateImageFile(validWebp), []);

  // Kosong
  const emptyFile = { name: "test.png", size: 0, type: "image/png" };
  assert.ok(validateImageFile(emptyFile).length > 0);

  // Ukuran melebihi 5MB
  const largeFile = { name: "large.png", size: 6 * 1024 * 1024, type: "image/png" };
  assert.ok(validateImageFile(largeFile).some((msg) => msg.includes("5 MB")));

  // Format tidak didukung
  const invalidExt = { name: "document.pdf", size: 1000, type: "application/pdf" };
  assert.ok(validateImageFile(invalidExt).some((msg) => msg.includes("PNG, JPG, JPEG, atau WebP")));
});

test("validateAudioFile: menerima format audio yang didukung dan menolak file tidak valid", () => {
  // Valid
  const validMp3 = { name: "bola.mp3", size: 1024 * 200, type: "audio/mpeg" };
  assert.deepEqual(validateAudioFile(validMp3), []);

  const validWav = { name: "bola.wav", size: 1024 * 800, type: "audio/wav" };
  assert.deepEqual(validateAudioFile(validWav), []);

  // Kosong
  const emptyAudio = { name: "audio.mp3", size: 0, type: "audio/mp3" };
  assert.ok(validateAudioFile(emptyAudio).length > 0);

  // Ukuran melebihi 10MB
  const largeAudio = { name: "audio.mp3", size: 11 * 1024 * 1024, type: "audio/mp3" };
  assert.ok(validateAudioFile(largeAudio).some((msg) => msg.includes("10 MB")));

  // Format tidak didukung
  const invalidExt = { name: "song.exe", size: 1000, type: "application/x-msdownload" };
  assert.ok(validateAudioFile(invalidExt).length > 0);
});

test("validateCatalogInput: validasi nama kata, audio huruf, dan pencegahan duplikasi", () => {
  // Valid input
  assert.deepEqual(
    validateCatalogInput({ word: "BOLA", letterAudioId: "B" }, ["ayam", "kucing"]),
    [],
  );

  // Kata kosong
  assert.ok(
    validateCatalogInput({ word: "", letterAudioId: "A" }).some((m) =>
      m.includes("tidak boleh kosong"),
    ),
  );

  // Audio huruf tidak valid
  assert.ok(
    validateCatalogInput({ word: "BOLA", letterAudioId: "123" }).some((m) =>
      m.includes("satu karakter A–Z"),
    ),
  );

  // Kata duplikat
  assert.ok(
    validateCatalogInput({ word: "KUCING", letterAudioId: "K" }, ["kucing"]).some((m) =>
      m.includes("sudah terdaftar"),
    ),
  );

  // Edit kata yang sama (tidak dianggap duplikat dengan diri sendiri)
  assert.deepEqual(
    validateCatalogInput({ word: "KUCING", letterAudioId: "K" }, ["kucing", "ayam"], "kucing"),
    [],
  );
});

test("buildCreateCatalogPayload: menghasilkan schema Firestore yang tepat", () => {
  const dummyTime = { marker: "timestamp" };
  const payload = buildCreateCatalogPayload(
    { word: "bola", letterAudioId: "B", isActive: true },
    "material_catalog/mat_1/image.png",
    "material_catalog/mat_1/word.mp3",
    "teacher_123",
    dummyTime,
  );

  assert.equal(payload.word, "BOLA");
  assert.equal(payload.normalizedWord, "bola");
  assert.equal(payload.initialLetter, "B");
  assert.equal(payload.letterAudioId, "B");
  assert.equal(payload.imagePath, "material_catalog/mat_1/image.png");
  assert.equal(payload.wordAudioPath, "material_catalog/mat_1/word.mp3");
  assert.equal(payload.isActive, true);
  assert.equal(payload.createdBy, "teacher_123");
  assert.equal(payload.createdAt, dummyTime);
  assert.equal(payload.updatedAt, dummyTime);
});

test("buildUpdateCatalogPayload: tidak menimpa createdAt atau createdBy", () => {
  const dummyTime = { marker: "update_timestamp" };
  const payload = buildUpdateCatalogPayload(
    { word: "BOLA KAKI", letterAudioId: "B" },
    "material_catalog/mat_1/new_image.png",
    undefined,
    dummyTime,
  );

  assert.equal("createdAt" in payload, false);
  assert.equal("createdBy" in payload, false);
  assert.equal(payload.word, "BOLA KAKI");
  assert.equal(payload.normalizedWord, "bola kaki");
  assert.equal(payload.initialLetter, "B");
  assert.equal(payload.letterAudioId, "B");
  assert.equal(payload.imagePath, "material_catalog/mat_1/new_image.png");
  assert.equal("wordAudioPath" in payload, false);
  assert.equal(payload.updatedAt, dummyTime);
});

test("materialExistsInCatalog: mendukung materi lokal dan materi dinamis", () => {
  // Materi lokal bawaan
  assert.equal(materialExistsInCatalog("k", "kucing"), true);
  assert.equal(materialExistsInCatalog("a", "ayam"), true);

  // Materi dinamis
  const dynamicWords = ["bola", "robot"];
  assert.equal(materialExistsInCatalog("b", "bola", dynamicWords), true);
  assert.equal(materialExistsInCatalog("r", "robot", dynamicWords), true);
  assert.equal(materialExistsInCatalog("z", "pesawat", dynamicWords), false);
});

test("validateQuestionInput: menerima kata materi dinamis", () => {
  const dynamicWords = ["bola", "robot"];
  const errors = validateQuestionInput(
    {
      stageId: "stage1",
      gameType: "susunKata",
      kata: "bola",
      huruf: "b",
      isActive: true,
    },
    dynamicWords,
  );
  assert.deepEqual(errors, []);
});

test("parseQuestionDocument: membaca dokumen soal dengan kata materi dinamis", () => {
  const parsed = parseQuestionDocument("q-dynamic-1", {
    stageId: "stage2",
    gameType: "tebakGambarObjek",
    kata: "bola",
    huruf: "b",
    isActive: true,
    createdBy: "teacher-123",
  });
  assert.ok(parsed);
  assert.equal(parsed.kata, "bola");
  assert.equal(parsed.huruf, "b");
  assert.equal(parsed.stageId, "stage2");
});

