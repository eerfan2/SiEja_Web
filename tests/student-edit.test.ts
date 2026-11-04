import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreateStudentPayload,
  buildLoginCredentialPayload,
  buildUpdateStudentPayload,
  generateCredentialKey,
  validateStudentInput,
  verifyCredentialTargetOwnership,
  verifyPinUniqueness,
} from "../services/student-service";
import type { NewStudentInput, UpdateStudentInput } from "../types/sieja";

test("generateCredentialKey: cocok dengan SHA-256 Android CredentialHelper", async () => {
  const key = await generateCredentialKey("budi", "001");
  assert.equal(
    key,
    "871ce82b9b9d835508f19ba6481c6ebdd2ccdd69c5618a8ac231e2f28d931b38",
  );
});

test("generateCredentialKey: menormalisasi spasi dan huruf besar", async () => {
  const key1 = await generateCredentialKey("  Budi  ", "001");
  const key2 = await generateCredentialKey("budi", "001");
  assert.equal(key1, key2);
});

test("validateStudentInput: input valid diterima", () => {
  const input: UpdateStudentInput = {
    namaLengkap: "Ahmad Dahlan",
    username: "ahmad01",
    pin: "005",
    usia: 6,
    jenisKelamin: "Laki-laki",
  };
  const errors = validateStudentInput(input);
  assert.deepEqual(errors, []);
});

test("validateStudentInput: nama dan username pendek ditolak", () => {
  const input: UpdateStudentInput = {
    namaLengkap: "A",
    username: "u",
    pin: "005",
    usia: 6,
    jenisKelamin: "Laki-laki",
  };
  const errors = validateStudentInput(input);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /nama lengkap minimal/i);
  assert.match(errors[1], /username minimal/i);
});

test("validateStudentInput: PIN non-3 digit ditolak", () => {
  assert.ok(
    validateStudentInput({
      namaLengkap: "Budi Santoso",
      username: "budis",
      pin: "12",
      usia: 6,
      jenisKelamin: "Laki-laki",
    }).length > 0,
  );

  assert.ok(
    validateStudentInput({
      namaLengkap: "Budi Santoso",
      username: "budis",
      pin: "abcd",
      usia: 6,
      jenisKelamin: "Laki-laki",
    }).length > 0,
  );
});

test("validateStudentInput: usia tidak valid ditolak", () => {
  const errors = validateStudentInput({
    namaLengkap: "Budi Santoso",
    username: "budis",
    pin: "001",
    usia: 2,
    jenisKelamin: "Laki-laki",
  });
  assert.match(errors[0], /usia harus antara 3 sampai 12 tahun/i);
});

test("buildUpdateStudentPayload: tidak menimpa progress, createdAt, atau ID", () => {
  const input: UpdateStudentInput = {
    namaLengkap: " Siti Aminah ",
    username: " sitia ",
    pin: " 009 ",
    usia: 7,
    jenisKelamin: "Perempuan",
  };
  const payload = buildUpdateStudentPayload(input);

  assert.equal("progress" in payload, false);
  assert.equal("createdAt" in payload, false);
  assert.equal("id" in payload, false);
  assert.equal(payload.namaLengkap, "Siti Aminah");
  assert.equal(payload.username, "sitia");
  assert.equal(payload.pin, "009");
  assert.equal(payload.usia, 7);
  assert.equal(payload.jenisKelamin, "Perempuan");
});

test("buildLoginCredentialPayload: memetakan siswaId dan username normal", () => {
  const timestamp = { marker: "serverTimestamp" };
  const payload = buildLoginCredentialPayload("student-abc", " SitiA ", timestamp);

  assert.equal(payload.siswaId, "student-abc");
  assert.equal(payload.username, "sitia");
  assert.equal(payload.createdAt, timestamp);
});

test("buildCreateStudentPayload: menginisialisasi progress kosong dan createdAt", () => {
  const timestamp = { marker: "serverTimestamp" };
  const input: NewStudentInput = {
    namaLengkap: "Doni Pratama",
    username: "doni",
    usia: 6,
    jenisKelamin: "Laki-laki",
  };
  const payload = buildCreateStudentPayload(input, "003", timestamp);

  assert.deepEqual(payload.progress, {});
  assert.equal(payload.createdAt, timestamp);
  assert.equal(payload.pin, "003");
});

test("verifyCredentialTargetOwnership: newKey milik siswa lain ditolak (mencegah penyerobotan akun)", () => {
  const check = verifyCredentialTargetOwnership(
    { exists: true, siswaId: "siswa-lain-999" },
    "siswa-target-123",
  );
  assert.equal(check.allowed, false);
  assert.match(check.error ?? "", /sudah digunakan oleh siswa lain/i);
});

test("verifyCredentialTargetOwnership: newKey belum pernah dipakai diizinkan", () => {
  const check = verifyCredentialTargetOwnership(
    { exists: false, siswaId: null },
    "siswa-target-123",
  );
  assert.equal(check.allowed, true);
  assert.equal(check.error, undefined);
});

test("verifyCredentialTargetOwnership: newKey milik siswa itu sendiri diizinkan", () => {
  const check = verifyCredentialTargetOwnership(
    { exists: true, siswaId: "siswa-target-123" },
    "siswa-target-123",
  );
  assert.equal(check.allowed, true);
  assert.equal(check.error, undefined);
});

test("konsistensi kredensial: perubahan profil biasa mempertahankan pemetaan login siswa", async () => {
  const current = { username: "doni", pin: "003", id: "siswa-123" };
  const oldKey = await generateCredentialKey(current.username, current.pin);
  // Guru hanya mengedit nama atau usia, username dan PIN tetap
  const newKey = await generateCredentialKey("doni", "003");
  assert.equal(oldKey, newKey);

  const credPayload = buildLoginCredentialPayload(current.id, "doni", "timestamp");
  assert.equal(credPayload.siswaId, current.id);
});

test("konsistensi kredensial: perubahan username/PIN memperbarui hash tanpa mengubah siswaId", async () => {
  const current = { username: "doni", pin: "003", id: "siswa-123" };
  const oldKey = await generateCredentialKey(current.username, current.pin);
  const newKey = await generateCredentialKey("doni_baru", "007");

  assert.notEqual(oldKey, newKey);
  const credPayload = buildLoginCredentialPayload(current.id, "doni_baru", "timestamp");
  // siswaId tetap mengarah ke siswa yang sama
  assert.equal(credPayload.siswaId, current.id);
  assert.equal(credPayload.username, "doni_baru");
});

test("verifyPinUniqueness: menolak jika PIN sudah dipakai oleh siswa lain", () => {
  const existing = [
    { id: "siswa-1", pin: "001" },
    { id: "siswa-2", pin: "002" },
  ];

  // Siswa 2 ingin ganti PIN menjadi 001 (milik siswa-1)
  const result = verifyPinUniqueness("001", "siswa-2", existing);
  assert.equal(result.allowed, false);
  assert.match(result.error ?? "", /PIN 001 sudah digunakan/);
});

test("verifyPinUniqueness: mengizinkan jika PIN tidak dipakai oleh siswa lain", () => {
  const existing = [
    { id: "siswa-1", pin: "001" },
    { id: "siswa-2", pin: "002" },
  ];

  // Siswa 2 ingin ganti PIN menjadi 003 (belum ada yang pakai)
  const result = verifyPinUniqueness("003", "siswa-2", existing);
  assert.equal(result.allowed, true);
  assert.equal(result.error, undefined);
});

test("verifyPinUniqueness: mengizinkan jika PIN tetap milik siswa itu sendiri", () => {
  const existing = [
    { id: "siswa-1", pin: "001" },
    { id: "siswa-2", pin: "002" },
  ];

  // Siswa 1 tetap menggunakan 001
  const result = verifyPinUniqueness("001", "siswa-1", existing);
  assert.equal(result.allowed, true);
  assert.equal(result.error, undefined);
});

