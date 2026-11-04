import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import { isRemedial } from "@/lib/domain/business-rules";
import { STAGE_IDS, type StageId, type Student } from "@/types/sieja";

export function getRemedialItems(
  students: Student[],
  stageIds?: readonly StageId[],
) {
  return students.flatMap((student) => {
    const ids =
      stageIds && stageIds.length > 0
        ? stageIds
        : Array.from(
            new Set([
              ...STAGE_IDS,
              ...Object.keys(student?.progress || {}).filter((k) =>
                /^stage[1-9][0-9]*$/.test(k),
              ),
            ]),
          ).sort((a, b) => {
            const numA = Number(a.replace("stage", "")) || 0;
            const numB = Number(b.replace("stage", "")) || 0;
            return numA - numB;
          });

    return ids.flatMap((stageId) => {
      const progress = student.progress[stageId];
      return isRemedial(progress) && progress
        ? [{ student, stageId: stageId as StageId, progress }]
        : [];
    });
  });
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
