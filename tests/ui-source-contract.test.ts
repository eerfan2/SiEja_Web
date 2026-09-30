import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

test("Progress desktop dirender satu baris per siswa", () => {
  const source = readFileSync("components/progress/progress-page.tsx", "utf8");
  assert.match(source, /data-testid="student-progress-row"/);
  assert.doesNotMatch(source, /filtered\.flatMap/);
  assert.match(source, /Lihat Detail/);
});

test("Tutorial memakai contain dan lightbox yang dibatasi viewport", () => {
  const source = readFileSync("components/public/tutorial-page.tsx", "utf8");
  assert.match(source, /object-contain/);
  assert.doesNotMatch(source, /object-cover/);
  assert.match(source, /max-h-\[calc\(100svh-1\.5rem\)\]/);
  assert.match(source, /overflow-hidden/);
});

test("asset avatar Eja dan Eva tersedia serta memiliki dimensi valid", () => {
  for (const path of ["public/avatars/eja.png", "public/avatars/eva.png"]) {
    assert.ok(statSync(path).size > 0);
    const image = readFileSync(path);
    assert.equal(image.toString("ascii", 1, 4), "PNG");
    assert.ok(image.readUInt32BE(16) > 0);
    assert.ok(image.readUInt32BE(20) > 0);
  }
});

test("form urutkanHuruf memakai range A-Z dan preview config khusus", () => {
  const source = readFileSync("components/questions/question-form-page.tsx", "utf8");
  assert.match(source, /data-testid="letter-range-step"/);
  assert.match(source, /Huruf Awal/);
  assert.match(source, /Huruf Akhir/);
  assert.match(source, /Jumlah huruf yang harus diurutkan/);
  assert.match(source, /data-testid="letter-sequence-preview"/);
  assert.match(source, /Acak Contoh/);
});

test("daftar soal menampilkan config dan menandai urutkanHuruf legacy", () => {
  const source = readFileSync("components/questions/question-list-page.tsx", "utf8");
  assert.match(source, /question\.config\.startLetter/);
  assert.match(source, /question\.config\.letterCount/);
  assert.match(source, />Legacy</);
});

test("rules proposal menerima config urutkanHuruf tanpa kata dan huruf", () => {
  const source = readFileSync("firestore.rules.proposed", "utf8");
  assert.match(source, /validLetterSequenceQuestionFields/);
  assert.match(source, /'startLetter', 'endLetter', 'letterCount'/);
  assert.match(source, /config\.letterCount >= 3/);
  assert.match(source, /config\.letterCount <= 7/);
});
