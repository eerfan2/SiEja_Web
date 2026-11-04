import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { isGameType, isStageId, validateQuestionInput } from "@/lib/domain/business-rules";
import { parseLetterSequenceConfig, validateLetterSequenceConfig } from "@/lib/domain/letter-sequence";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  isLetterSequenceInput,
  type Question,
  type QuestionInput,
  type StandardGameType,
} from "@/types/sieja";

export function buildCreateQuestionData(
  input: QuestionInput,
  userId: string,
  timestamp: unknown,
) {
  if (isLetterSequenceInput(input)) {
    return {
      stageId: input.stageId,
      gameType: input.gameType,
      isActive: input.isActive,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      config: {
        startLetter: input.config.startLetter,
        endLetter: input.config.endLetter,
        letterCount: input.config.letterCount,
      },
    };
  }

  return {
    stageId: input.stageId,
    gameType: input.gameType,
    kata: input.kata.trim().toLowerCase(),
    huruf: input.huruf.trim().toLowerCase(),
    isActive: input.isActive,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: userId,
  };
}

export function buildUpdateQuestionData(
  input: QuestionInput,
  timestamp: unknown,
  removedField?: unknown,
) {
  if (isLetterSequenceInput(input)) {
    return {
      stageId: input.stageId,
      gameType: input.gameType,
      isActive: input.isActive,
      updatedAt: timestamp,
      config: {
        startLetter: input.config.startLetter,
        endLetter: input.config.endLetter,
        letterCount: input.config.letterCount,
      },
      ...(removedField === undefined
        ? {}
        : { kata: removedField, huruf: removedField }),
    };
  }

  return {
    stageId: input.stageId,
    gameType: input.gameType,
    kata: input.kata.trim().toLowerCase(),
    huruf: input.huruf.trim().toLowerCase(),
    isActive: input.isActive,
    updatedAt: timestamp,
    ...(removedField === undefined ? {} : { config: removedField }),
  };
}

async function resolveDynamicWords(
  input: QuestionInput,
  providedWords?: string[],
): Promise<string[] | undefined> {
  if (providedWords && providedWords.length > 0) {
    return providedWords;
  }
  if (isLetterSequenceInput(input)) {
    return undefined;
  }
  try {
    const { db } = getFirebaseClient();
    const snap = await getDocs(collection(db, "material_catalog"));
    return snap.docs
      .map((d) => (d.data().normalizedWord || d.data().word || "").toString().toLowerCase().trim())
      .filter(Boolean);
  } catch (err) {
    console.warn("[QuestionService] Gagal mengambil katalog dinamis:", err);
    return undefined;
  }
}

export function parseQuestionDocument(id: string, data: DocumentData): Question | null {
  const metadata = {
    id,
    stageId: data.stageId,
    isActive: data.isActive,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
  };

  if (typeof data.isActive !== "boolean") return null;
  if (!isStageId(data.stageId)) return null;
  if (!isGameType(data.gameType)) return null;

  if (data.gameType === "urutkanHuruf") {
    const config = parseLetterSequenceConfig(data.config);
    if (config) {
      if (validateLetterSequenceConfig(config).length > 0) return null;
      return { ...metadata, gameType: "urutkanHuruf", config };
    }

    // Dokumen lama tetap dibaca agar daftar soal tidak crash. Konversi hanya
    // terjadi ketika guru membuka Edit dan menyimpan config baru.
    const kata = typeof data.kata === "string" ? data.kata.trim().toLowerCase() : "";
    const huruf = typeof data.huruf === "string" ? data.huruf.trim().toLowerCase() : "";
    if (!kata || !huruf || !/^[a-z]$/i.test(huruf)) return null;
    return { ...metadata, gameType: "urutkanHuruf", kata, huruf };
  }

  const kata = typeof data.kata === "string" ? data.kata.trim().toLowerCase() : "";
  const huruf = typeof data.huruf === "string" ? data.huruf.trim().toLowerCase() : "";
  if (!kata || !huruf || !/^[a-z]$/i.test(huruf)) return null;

  return {
    ...metadata,
    stageId: data.stageId,
    gameType: data.gameType as StandardGameType,
    kata,
    huruf,
    isActive: data.isActive,
  };
}

export function subscribeQuestions(
  onData: (questions: Question[], invalidCount: number) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const { db } = getFirebaseClient();
  return onSnapshot(
    collection(db, "soal"),
    (snapshot) => {
      let invalidCount = 0;
      const questions = snapshot.docs.flatMap((item) => {
        const parsed = parseQuestionDocument(item.id, item.data());
        if (!parsed) {
          invalidCount += 1;
          return [];
        }
        return [parsed];
      });
      questions.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.().getTime() ?? 0;
        const bTime = b.updatedAt?.toDate?.().getTime() ?? 0;
        return bTime - aTime;
      });
      onData(questions, invalidCount);
    },
    () => onError("Gagal mengambil bank soal. Coba kembali."),
  );
}

export async function getQuestion(questionId: string): Promise<Question> {
  const { db } = getFirebaseClient();
  const snapshot = await getDoc(doc(db, "soal", questionId));
  if (!snapshot.exists()) throw new Error("Soal tidak ditemukan.");
  const parsed = parseQuestionDocument(snapshot.id, snapshot.data());
  if (!parsed) throw new Error("Data soal tidak valid untuk kontrak Android.");
  return parsed;
}

export async function createQuestion(
  input: QuestionInput,
  userId: string,
  dynamicCatalogWords?: string[],
) {
  const dynamicWords = await resolveDynamicWords(input, dynamicCatalogWords);
  const errors = validateQuestionInput(input, dynamicWords);
  if (errors.length) throw new Error(errors[0]);
  const { db } = getFirebaseClient();
  const timestamp = serverTimestamp();
  await addDoc(collection(db, "soal"), buildCreateQuestionData(input, userId, timestamp));
}

export async function updateQuestion(
  questionId: string,
  input: QuestionInput,
  dynamicCatalogWords?: string[],
) {
  const dynamicWords = await resolveDynamicWords(input, dynamicCatalogWords);
  const errors = validateQuestionInput(input, dynamicWords);
  if (errors.length) throw new Error(errors[0]);
  const { db } = getFirebaseClient();
  await updateDoc(
    doc(db, "soal", questionId),
    buildUpdateQuestionData(input, serverTimestamp(), deleteField()),
  );
}

export async function setQuestionActive(questionId: string, isActive: boolean) {
  const { db } = getFirebaseClient();
  await updateDoc(doc(db, "soal", questionId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuestion(questionId: string) {
  const { db } = getFirebaseClient();
  await deleteDoc(doc(db, "soal", questionId));
}
