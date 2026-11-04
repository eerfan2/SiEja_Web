import test from "node:test";
import assert from "node:assert/strict";
import { changeTeacherPassword } from "../services/auth-service";

test("changeTeacherPassword: validasi input sebelum panggilan Firebase", async () => {
  // 1. Kata sandi saat ini kosong
  await assert.rejects(
    async () => {
      await changeTeacherPassword("", "passwordBaru123");
    },
    {
      message: /Kata sandi saat ini wajib diisi/i,
    },
  );

  // 2. Kata sandi baru kurang dari 6 karakter
  await assert.rejects(
    async () => {
      await changeTeacherPassword("oldPassword", "123");
    },
    {
      message: /minimal 6 karakter/i,
    },
  );

  // 3. Kata sandi baru sama persis dengan kata sandi lama
  await assert.rejects(
    async () => {
      await changeTeacherPassword("samaPassword", "samaPassword");
    },
    {
      message: /harus berbeda/i,
    },
  );
});

