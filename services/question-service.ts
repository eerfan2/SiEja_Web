import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { validateQuestionInput } from "@/lib/domain/business-rules";
import { parseLetterSequenceConfig } from "@/lib/domain/letter-sequence";
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

export function parseQuestionDocument(id: string, data: DocumentData): Question | null {
  const metadata = {
    id,
    stageId: data.stageId,
    isActive: data.isActive,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
  };

  if (data.gameType === "urutkanHuruf") {
    const config = parseLetterSequenceConfig(data.config);
    if (config) {
      const input: QuestionInput = {
        stageId: data.stageId,
        gameType: "urutkanHuruf",
        config,
        isActive: data.isActive,
      };
      if (validateQuestionInput(input).length) return null;
      return { ...metadata, gameType: "urutkanHuruf", config };
    }

    // Dokumen lama tetap dibaca agar daftar soal tidak crash. Konversi hanya
    // terjadi ketika guru membuka Edit dan menyimpan config baru.
    const kata = typeof data.kata === "string" ? data.kata.trim().toLowerCase() : "";
    const huruf = typeof data.huruf === "string" ? data.huruf.trim().toLowerCase() : "";
    const legacyProbe = {
      stageId: data.stageId,
      gameType: "susunKata" as const,
      kata,
      huruf,
      isActive: data.isActive,
    };
    if (validateQuestionInput(legacyProbe).length) return null;
    return { ...metadata, gameType: "urutkanHuruf", kata, huruf };
  }

  const input: QuestionInput = {
    stageId: data.stageId,
    gameType: data.gameType as StandardGameType,
    kata: typeof data.kata === "string" ? data.kata : "",
    huruf: typeof data.huruf === "string" ? data.huruf : "",
    isActive: data.isActive,
  };
  if (validateQuestionInput(input).length) return null;
  return { ...metadata, ...input };
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

export async function createQuestion(input: QuestionInput, userId: string) {
  const errors = validateQuestionInput(input);
  if (errors.length) throw new Error(errors[0]);
  const { db } = getFirebaseClient();
  const timestamp = serverTimestamp();
  await addDoc(collection(db, "soal"), buildCreateQuestionData(input, userId, timestamp));
}

export async function updateQuestion(questionId: string, input: QuestionInput) {
  const errors = validateQuestionInput(input);
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
