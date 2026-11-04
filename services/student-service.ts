import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import type {
  NewStudentInput,
  ProgressMap,
  Student,
  UpdateStudentInput,
} from "@/types/sieja";

/**
 * Menghasilkan hash SHA-256 (lowercase hex) untuk kunci login siswa:
 * Format: sha256("$username.trim().toLowerCase():$pin.trim()")
 * Identik dengan CredentialHelper.generateCredentialKey pada aplikasi Flutter Android SiEja.
 */
export async function generateCredentialKey(
  username: string,
  pin: string,
): Promise<string> {
  const normalized = username.trim().toLowerCase();
  const input = `${normalized}:${pin.trim()}`;
  const encoded = new TextEncoder().encode(input);
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function validateStudentInput(
  input: {
    namaLengkap: string;
    username: string;
    pin?: string;
    usia: number;
    jenisKelamin: string;
  },
): string[] {
  const errors: string[] = [];
  const nama = input.namaLengkap.trim();
  const uname = input.username.trim();

  if (!nama || nama.length < 2) {
    errors.push("Nama lengkap minimal 2 karakter.");
  }
  if (!uname || uname.length < 2) {
    errors.push("Username minimal 2 karakter.");
  }
  if (input.pin !== undefined) {
    const pin = input.pin.trim();
    if (!/^\d{3}$/.test(pin)) {
      errors.push("PIN harus berupa 3 digit angka (contoh: 001).");
    }
  }
  if (typeof input.usia !== "number" || input.usia < 3 || input.usia > 12) {
    errors.push("Usia harus antara 3 sampai 12 tahun.");
  }
  if (!input.jenisKelamin || !input.jenisKelamin.trim()) {
    errors.push("Jenis kelamin wajib dipilih.");
  }
  return errors;
}

export function buildCreateStudentPayload(
  input: NewStudentInput,
  pin: string,
  timestamp: unknown,
) {
  return {
    namaLengkap: input.namaLengkap.trim(),
    username: input.username.trim(),
    pin: pin.trim(),
    usia: input.usia,
    jenisKelamin: input.jenisKelamin,
    createdAt: timestamp,
    progress: {},
  };
}

export function verifyCredentialTargetOwnership(
  targetDoc: { exists: boolean; siswaId?: string | null },
  currentStudentId: string,
): { allowed: boolean; error?: string } {
  if (targetDoc.exists && targetDoc.siswaId && targetDoc.siswaId !== currentStudentId) {
    return {
      allowed: false,
      error: "Kredensial login (kombinasi username dan PIN) sudah digunakan oleh siswa lain.",
    };
  }
  return { allowed: true };
}

/**
 * Memastikan PIN yang dimasukkan belum digunakan oleh siswa lain manapun.
 */
export function verifyPinUniqueness(
  pin: string,
  currentStudentId: string,
  existingStudents: Array<{ id: string; pin?: string | null }>,
): { allowed: boolean; error?: string } {
  const cleanPin = pin.trim();
  const isTaken = existingStudents.some(
    (s) => s.id !== currentStudentId && String(s.pin ?? "").trim() === cleanPin,
  );
  if (isTaken) {
    return {
      allowed: false,
      error: `PIN ${cleanPin} sudah digunakan oleh siswa lain.`,
    };
  }
  return { allowed: true };
}

export function buildUpdateStudentPayload(input: UpdateStudentInput) {
  return {
    namaLengkap: input.namaLengkap.trim(),
    username: input.username.trim(),
    pin: input.pin.trim(),
    usia: input.usia,
    jenisKelamin: input.jenisKelamin,
  };
}

export function buildLoginCredentialPayload(
  studentId: string,
  username: string,
  timestamp: unknown,
) {
  return {
    siswaId: studentId,
    username: username.trim().toLowerCase(),
    createdAt: timestamp,
  };
}

function studentFromFirestore(id: string, data: DocumentData): Student {
  return {
    id,
    namaLengkap: typeof data.namaLengkap === "string" ? data.namaLengkap : "Tanpa nama",
    username: typeof data.username === "string" ? data.username : "",
    pin: typeof data.pin === "string" ? data.pin : "",
    usia: typeof data.usia === "number" ? data.usia : 0,
    jenisKelamin: typeof data.jenisKelamin === "string" ? data.jenisKelamin : "Belum diisi",
    createdAt: data.createdAt ?? null,
    progress: (data.progress ?? {}) as ProgressMap,
  };
}

export function subscribeStudents(
  onData: (students: Student[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const { db } = getFirebaseClient();
  return onSnapshot(
    collection(db, "siswa"),
    (snapshot) => {
      const students = snapshot.docs
        .map((item) => studentFromFirestore(item.id, item.data()))
        .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap, "id"));
      onData(students);
    },
    () => onError("Gagal mengambil data siswa. Coba kembali."),
  );
}

async function getNextPin(): Promise<string> {
  const { db } = getFirebaseClient();
  const snapshot = await getDocs(collection(db, "siswa"));
  const used = new Set<number>();
  snapshot.docs.forEach((item) => {
    const pin = Number.parseInt(String(item.data().pin ?? ""), 10);
    if (Number.isFinite(pin) && pin > 0) used.add(pin);
  });
  let candidate = 1;
  while (used.has(candidate)) candidate += 1;
  return String(candidate).padStart(3, "0");
}

export async function createStudent(input: NewStudentInput): Promise<string> {
  const errors = validateStudentInput({ ...input, pin: "001" });
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  const { db } = getFirebaseClient();
  const username = input.username.trim();
  const snapshot = await getDocs(collection(db, "siswa"));
  const duplicate = snapshot.docs.some(
    (item) => String(item.data().username ?? "").toLowerCase() === username.toLowerCase(),
  );
  if (duplicate) throw new Error("Username sudah digunakan.");

  const pin = await getNextPin();
  const siswaRef = doc(collection(db, "siswa"));
  const credentialKey = await generateCredentialKey(username, pin);

  const batch = writeBatch(db);
  batch.set(
    siswaRef,
    buildCreateStudentPayload(input, pin, serverTimestamp()),
  );
  batch.set(
    doc(db, "login_siswa", credentialKey),
    buildLoginCredentialPayload(siswaRef.id, username, serverTimestamp()),
  );

  await batch.commit();
  return pin;
}

export async function updateStudent(
  studentId: string,
  input: UpdateStudentInput,
  currentStudent: Student,
): Promise<void> {
  const errors = validateStudentInput(input);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  const { db } = getFirebaseClient();
  const trimmedUsername = input.username.trim();
  const trimmedPin = input.pin.trim();
  const usernameChanged =
    trimmedUsername.toLowerCase() !== currentStudent.username.toLowerCase();
  const pinChanged = trimmedPin !== currentStudent.pin.trim();

  // Validasi keunikan username dan PIN jika ada perubahan
  if (usernameChanged || pinChanged) {
    const allSiswaSnap = await getDocs(collection(db, "siswa"));

    // 1. Cek duplikasi username (case-insensitive)
    if (usernameChanged) {
      const isTaken = allSiswaSnap.docs.some(
        (docItem) =>
          docItem.id !== studentId &&
          String(docItem.data().username ?? "").trim().toLowerCase() ===
            trimmedUsername.toLowerCase(),
      );
      if (isTaken) {
        throw new Error("Username sudah digunakan.");
      }
    }

    // 2. Cek duplikasi PIN: tidak boleh ada siswa lain dengan PIN yang sama
    if (pinChanged) {
      const existingStudents = allSiswaSnap.docs.map((docItem) => ({
        id: docItem.id,
        pin: docItem.data().pin,
      }));
      const pinCheck = verifyPinUniqueness(trimmedPin, studentId, existingStudents);
      if (!pinCheck.allowed) {
        throw new Error(pinCheck.error);
      }
    }
  }

  const oldCredentialKey = await generateCredentialKey(
    currentStudent.username,
    currentStudent.pin,
  );
  const newCredentialKey = await generateCredentialKey(
    trimmedUsername,
    input.pin.trim(),
  );

  // 4b. Pastikan kredensial tujuan pada login_siswa tidak digunakan oleh siswa lain
  if (oldCredentialKey !== newCredentialKey) {
    const existingLoginSnap = await getDoc(doc(db, "login_siswa", newCredentialKey));
    if (existingLoginSnap.exists()) {
      const targetData = existingLoginSnap.data();
      const ownership = verifyCredentialTargetOwnership(
        { exists: true, siswaId: targetData?.siswaId },
        studentId,
      );
      if (!ownership.allowed) {
        throw new Error(ownership.error);
      }
    }
  }

  const batch = writeBatch(db);
  const siswaRef = doc(db, "siswa", studentId);

  // Partial update — pertahankan progress, createdAt, dan ID
  batch.update(siswaRef, buildUpdateStudentPayload(input));

  // Sinkronisasi mapping login_siswa
  if (oldCredentialKey !== newCredentialKey) {
    // Hapus mapping kredensial lama
    batch.delete(doc(db, "login_siswa", oldCredentialKey));
    // Buat mapping kredensial baru
    batch.set(
      doc(db, "login_siswa", newCredentialKey),
      buildLoginCredentialPayload(studentId, trimmedUsername, serverTimestamp()),
    );
  } else {
    // Self-healing jika sebelumnya dokumen login_siswa belum terbentuk
    batch.set(
      doc(db, "login_siswa", newCredentialKey),
      buildLoginCredentialPayload(studentId, trimmedUsername, serverTimestamp()),
      { merge: true },
    );
  }

  await batch.commit();
}

export async function deleteStudent(
  studentId: string,
  currentStudent?: Student,
): Promise<void> {
  const { db } = getFirebaseClient();
  const batch = writeBatch(db);
  batch.delete(doc(db, "siswa", studentId));

  let username = currentStudent?.username;
  let pin = currentStudent?.pin;

  if (!username || !pin) {
    try {
      const snap = await getDoc(doc(db, "siswa", studentId));
      if (snap.exists()) {
        const data = snap.data();
        username = typeof data.username === "string" ? data.username : undefined;
        pin = typeof data.pin === "string" ? data.pin : undefined;
      }
    } catch {
      // Abaikan jika tidak dapat dibaca
    }
  }

  if (username && pin) {
    const credentialKey = await generateCredentialKey(username, pin);
    batch.delete(doc(db, "login_siswa", credentialKey));
  }

  await batch.commit();
}
