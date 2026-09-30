import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";
import type { StageId } from "@/types/sieja";

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
  return eligible.length;
}
