import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { normalizeTeacherEmail } from "@/lib/domain/business-rules";
import { getFirebaseClient } from "@/lib/firebase/client";

export async function loginTeacher(identifier: string, password: string) {
  const { auth } = getFirebaseClient();
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, normalizeTeacherEmail(identifier), password);
}

export async function logoutTeacher() {
  const { auth } = getFirebaseClient();
  await signOut(auth);
}
