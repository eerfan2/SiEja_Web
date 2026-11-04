import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { calculateNextStageNumber } from "@/lib/domain/business-rules";
import { generateDefaultQuestionsForStage } from "@/lib/domain/default-question-generator";
import { buildCreateQuestionData } from "@/services/question-service";
import type { StageId, StageItem } from "@/types/sieja";

export const DEFAULT_STAGE_ITEMS: StageItem[] = [
  { id: "stage1", number: 1, range: "A–E", nama: "Stage 1", lokasi: "Awal Petualangan", isOpenByTeacher: true },
  { id: "stage2", number: 2, range: "F–J", nama: "Stage 2", lokasi: "Taman Bintang", isOpenByTeacher: false },
  { id: "stage3", number: 3, range: "K–O", nama: "Stage 3", lokasi: "Desa Alfabet", isOpenByTeacher: false },
  { id: "stage4", number: 4, range: "P–T", nama: "Stage 4", lokasi: "Pelangi Mengeja", isOpenByTeacher: false },
  { id: "stage5", number: 5, range: "U–Z", nama: "Stage 5", lokasi: "Taman Huruf", isOpenByTeacher: false },
  { id: "stage6", number: 6, range: "A–Z", nama: "Stage 6", lokasi: "Istana Literasi", isOpenByTeacher: false },
];

/**
 * Berlangganan perubahan data stage secara realtime dari Firestore.
 * Menggabungkan 6 stage default dengan data dari collection 'stages'.
 */
export function subscribeStages(
  onData: (stages: StageItem[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  try {
    const { db } = getFirebaseClient();
    return onSnapshot(
      collection(db, "stages"),
      (snapshot) => {
        const stageMap = new Map<string, StageItem>();

        // Masukkan default stage 1-6 terlebih dahulu
        for (const def of DEFAULT_STAGE_ITEMS) {
          stageMap.set(def.id, { ...def });
        }

        // Timpa atau tambahkan dari dokumen Firestore
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const num =
            typeof data.number === "number"
              ? data.number
              : Number(docSnap.id.replace("stage", ""));
          const stageItem: StageItem = {
            id: docSnap.id,
            number: num,
            range: data.range || (stageMap.get(docSnap.id)?.range ?? "A - Z"),
            nama: data.nama || data.title || `Stage ${num}`,
            lokasi: data.lokasi || stageMap.get(docSnap.id)?.lokasi,
            isOpenByTeacher:
              typeof data.isOpenByTeacher === "boolean"
                ? data.isOpenByTeacher
                : (stageMap.get(docSnap.id)?.isOpenByTeacher ?? false),
            createdAt: data.createdAt ?? null,
            createdBy: data.createdBy ?? "",
          };
          stageMap.set(docSnap.id, stageItem);
        }

        onData(Array.from(stageMap.values()).sort((a, b) => a.number - b.number));
      },
      (err) => {
        if (onError) onError(err.message);
        else onData([...DEFAULT_STAGE_ITEMS]);
      },
    );
  } catch {
    onData([...DEFAULT_STAGE_ITEMS]);
    return () => {};
  }
}

/**
 * Mengambil daftar seluruh stage (bawaan + Firestore dinamis).
 * Diurutkan berdasarkan nomor urut (number) secara menaik.
 */
export async function getStages(): Promise<StageItem[]> {
  try {
    const { db } = getFirebaseClient();
    const snapshot = await getDocs(collection(db, "stages"));
    const stageMap = new Map<string, StageItem>();

    // Masukkan default stage 1-6 terlebih dahulu
    for (const def of DEFAULT_STAGE_ITEMS) {
      stageMap.set(def.id, { ...def });
    }

    // Timpa atau tambahkan dari dokumen Firestore
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const num = typeof data.number === "number" ? data.number : Number(docSnap.id.replace("stage", ""));
      const stageItem: StageItem = {
        id: docSnap.id,
        number: num,
        range: data.range || (stageMap.get(docSnap.id)?.range ?? "A - Z"),
        nama: data.nama || data.title || `Stage ${num}`,
        lokasi: data.lokasi || stageMap.get(docSnap.id)?.lokasi,
        isOpenByTeacher: typeof data.isOpenByTeacher === "boolean"
          ? data.isOpenByTeacher
          : (stageMap.get(docSnap.id)?.isOpenByTeacher ?? false),
        createdAt: data.createdAt ?? null,
        createdBy: data.createdBy ?? "",
      };
      stageMap.set(docSnap.id, stageItem);
    }

    return Array.from(stageMap.values()).sort((a, b) => a.number - b.number);
  } catch (err) {
    // Fallback lokal jika Firestore offline / collection belum siap
    return [...DEFAULT_STAGE_ITEMS];
  }
}

export interface AddStageInput {
  range: string;
  title?: string;
  lokasi?: string;
  createdBy?: string;
  autoGenerateQuestions?: boolean;
}

/**
 * Guru menambahkan Stage baru.
 * - Nomor urut ditentukan otomatis setelah nomor stage tertinggi yang ada.
 * - Menggunakan Firestore transaction untuk mencegah nomor ganda/race condition.
 * - Status awal otomatis TERKUNCI (isOpenByTeacher: false).
 * - Secara default otomatis men-generate 10 paket soal awal dengan variasi kesulitan acak.
 */
export async function addStage(
  input: AddStageInput,
): Promise<StageItem & { generatedQuestionsCount?: number }> {
  const trimmedRange = input.range.trim();
  if (!trimmedRange) {
    throw new Error("Rentang huruf atau materi stage wajib diisi.");
  }

  const { db, auth } = getFirebaseClient();
  const creatorId = input.createdBy || auth.currentUser?.uid || "";

  try {
    // 1. Ambil seluruh stage dokumen yang ada di koleksi stages di luar transaksi
    const snapshot = await getDocs(collection(db, "stages"));
    const existingNumbers: number[] = [1, 2, 3, 4, 5, 6];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const num = typeof data.number === "number"
        ? data.number
        : Number(docSnap.id.replace("stage", ""));
      if (!Number.isNaN(num)) {
        existingNumbers.push(num);
      }
    }

    const nextNumber = calculateNextStageNumber(existingNumbers);
    const newStageId = `stage${nextNumber}`;
    const newDocRef = doc(db, "stages", newStageId);

    const stageTitle = input.title?.trim() || `Stage ${nextNumber}`;
    const stageLokasi = input.lokasi?.trim() || stageTitle;

    const createdStage = await runTransaction(db, async (transaction) => {
      // Cek apakah dokumen ini sudah ada
      const existingDoc = await transaction.get(newDocRef);
      if (existingDoc.exists()) {
        throw new Error(`Stage ${nextNumber} sudah terdaftar. Silakan coba kembali.`);
      }

      const newStageData = {
        id: newStageId,
        number: nextNumber,
        range: trimmedRange,
        nama: stageTitle,
        lokasi: stageLokasi,
        isOpenByTeacher: false, // Terkunci secara default
        createdAt: serverTimestamp(),
        createdBy: creatorId,
      };

      transaction.set(newDocRef, newStageData);

      return {
        id: newStageId,
        number: nextNumber,
        range: trimmedRange,
        nama: stageTitle,
        lokasi: stageLokasi,
        isOpenByTeacher: false,
        createdBy: creatorId,
      };
    });

    // 2. Auto-generate paket 10 soal default jika diaktifkan (default: true)
    let generatedQuestionsCount = 0;
    if (input.autoGenerateQuestions !== false && creatorId) {
      try {
        const defaultQuestions = generateDefaultQuestionsForStage(newStageId, {
          preferredRange: trimmedRange,
        });
        const batch = writeBatch(db);
        const timestamp = serverTimestamp();

        for (const q of defaultQuestions) {
          const qDocRef = doc(collection(db, "soal"));
          const qData = buildCreateQuestionData(q, creatorId, timestamp);
          batch.set(qDocRef, qData);
        }

        await batch.commit();
        generatedQuestionsCount = defaultQuestions.length;
      } catch (qErr) {
        console.warn(
          `[StageService] Stage ${newStageId} berhasil dibuat, namun pembuatan soal default mengalami kendala:`,
          qErr,
        );
      }
    }

    return {
      ...createdStage,
      generatedQuestionsCount,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (
      errorObj?.code === "permission-denied" ||
      errorObj?.message?.toLowerCase().includes("insufficient permissions")
    ) {
      throw new Error(
        "Izin ditolak (Missing or insufficient permissions). Pastikan Anda telah login sebagai Guru di halaman Login Guru dan Security Rules untuk koleksi 'stages' telah diizinkan di Firebase Console.",
      );
    }
    throw err;
  }
}

/**
 * Membuka atau mengunci stage untuk seluruh siswa.
 * Memperbarui status di progress seluruh siswa DAN dokumen stages di Firestore.
 */
export async function setStageForAllStudents(
  stageId: StageId,
  targetStatus: "locked" | "unlocked",
): Promise<number> {
  const { db } = getFirebaseClient();
  const snapshot = await getDocs(collection(db, "siswa"));
  const eligible = snapshot.docs.filter((item) => {
    if (targetStatus === "locked") return true;
    const current = item.data().progress?.[stageId]?.status;
    return current == null || current === "locked";
  });

  // 1. Update status siswa
  for (let start = 0; start < eligible.length; start += 450) {
    const batch = writeBatch(db);
    eligible.slice(start, start + 450).forEach((item) => {
      batch.update(doc(db, "siswa", item.id), {
        [`progress.${stageId}`]: {
          skor: 0,
          status: targetStatus,
          updatedAt: serverTimestamp(),
        },
      });
    });
    await batch.commit();
  }

  // 2. Simpan status isOpenByTeacher di dokumen koleksi 'stages' agar tersinkronisasi
  try {
    const stageDocRef = doc(db, "stages", stageId);
    await setDoc(
      stageDocRef,
      {
        id: stageId,
        isOpenByTeacher: targetStatus === "unlocked",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // Non-blocking jika collection belum memiliki write rules
  }

  return eligible.length;
}

export interface UpdateStageInput {
  nama?: string;
  range?: string;
}

/**
 * Guru memperbarui nama atau rentang materi stage (khusus stage baru / stage 7 ke atas).
 */
export async function updateStage(
  stageId: StageId,
  input: UpdateStageInput,
): Promise<void> {
  const { db } = getFirebaseClient();
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (input.nama !== undefined) {
    const trimmedNama = input.nama.trim();
    if (!trimmedNama) throw new Error("Nama stage tidak boleh kosong.");
    payload.nama = trimmedNama;
  }

  if (input.range !== undefined) {
    const trimmedRange = input.range.trim();
    if (!trimmedRange) throw new Error("Rentang huruf atau materi stage tidak boleh kosong.");
    payload.range = trimmedRange;
  }

  const stageDocRef = doc(db, "stages", stageId);
  await updateDoc(stageDocRef, payload);
}

/**
 * Guru menghapus stage dinamis (khusus stage baru / stage 7 ke atas).
 * Menghapus dokumen dari koleksi 'stages' dan membersihkan progress siswa yang terkait.
 */
export async function deleteStage(stageId: StageId): Promise<void> {
  const { db } = getFirebaseClient();

  // 1. Hapus dokumen stage
  const stageDocRef = doc(db, "stages", stageId);
  await deleteDoc(stageDocRef);

  // 2. Bersihkan progress siswa yang terkait stage ini
  try {
    const snapshot = await getDocs(collection(db, "siswa"));
    for (let start = 0; start < snapshot.docs.length; start += 450) {
      const batch = writeBatch(db);
      snapshot.docs.slice(start, start + 450).forEach((item) => {
        if (item.data().progress?.[stageId] !== undefined) {
          batch.update(doc(db, "siswa", item.id), {
            [`progress.${stageId}`]: deleteField(),
          });
        }
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn(`[StageService] Gagal membersihkan progress siswa untuk ${stageId}:`, err);
  }

  // 3. Bersihkan bank soal yang terkait stage ini
  try {
    const qSnapshot = await getDocs(
      query(collection(db, "soal"), where("stageId", "==", stageId)),
    );
    if (!qSnapshot.empty) {
      for (let start = 0; start < qSnapshot.docs.length; start += 450) {
        const batch = writeBatch(db);
        qSnapshot.docs.slice(start, start + 450).forEach((item) => {
          batch.delete(doc(db, "soal", item.id));
        });
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn(`[StageService] Gagal membersihkan soal untuk ${stageId}:`, err);
  }
}

