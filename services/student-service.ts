import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { NewStudentInput, ProgressMap, Student } from "@/types/sieja";

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
  const { db } = getFirebaseClient();
  const username = input.username.trim();
  const snapshot = await getDocs(collection(db, "siswa"));
  const duplicate = snapshot.docs.some(
    (item) => String(item.data().username ?? "").toLowerCase() === username.toLowerCase(),
  );
  if (duplicate) throw new Error("Username sudah digunakan.");

  const pin = await getNextPin();
  await addDoc(collection(db, "siswa"), {
    namaLengkap: input.namaLengkap.trim(),
    username,
    pin,
    usia: input.usia,
    jenisKelamin: input.jenisKelamin,
    createdAt: serverTimestamp(),
    progress: {},
  });
  return pin;
}

export async function deleteStudent(studentId: string): Promise<void> {
  const { db } = getFirebaseClient();
  await deleteDoc(doc(db, "siswa", studentId));
}
