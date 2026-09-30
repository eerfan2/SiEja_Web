import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { isRemedial } from "@/lib/domain/business-rules";
import { STAGE_IDS, type StageId, type Student } from "@/types/sieja";

export function getRemedialItems(students: Student[]) {
  return students.flatMap((student) =>
    STAGE_IDS.flatMap((stageId) => {
      const progress = student.progress[stageId];
      return isRemedial(progress) && progress
        ? [{ student, stageId, progress }]
        : [];
    }),
  );
}

export async function resetStage(studentId: string, stageId: StageId) {
  const { db } = getFirebaseClient();
  await updateDoc(doc(db, "siswa", studentId), {
    [`progress.${stageId}`]: {
      skor: 0,
      status: "unlocked",
      updatedAt: serverTimestamp(),
    },
  });
}
