import {
  browserLocalPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
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

/**
 * Mengubah kata sandi akun guru yang sedang login.
 * Memerlukan re-autentikasi dengan kata sandi saat ini sebelum menetapkan kata sandi baru.
 */
export async function changeTeacherPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const cleanCurrent = currentPassword.trim();
  const cleanNew = newPassword.trim();

  if (!cleanCurrent) {
    throw new Error("Kata sandi saat ini wajib diisi.");
  }

  if (!cleanNew || cleanNew.length < 6) {
    throw new Error("Kata sandi baru minimal 6 karakter.");
  }

  if (cleanCurrent === cleanNew) {
    throw new Error("Kata sandi baru harus berbeda dari kata sandi saat ini.");
  }

  const { auth } = getFirebaseClient();
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("Sesi login guru tidak ditemukan. Silakan login kembali.");
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, cleanCurrent);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, cleanNew);
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (
      errorObj?.code === "auth/wrong-password" ||
      errorObj?.code === "auth/invalid-credential"
    ) {
      throw new Error("Kata sandi saat ini yang Anda masukkan salah.");
    }
    if (errorObj?.code === "auth/weak-password") {
      throw new Error("Kata sandi baru terlalu lemah (minimal 6 karakter).");
    }
    if (errorObj?.code === "auth/requires-recent-login") {
      throw new Error(
        "Sesi login telah kedaluwarsa demi keamanan. Silakan keluar dan login kembali sebelum mengubah kata sandi.",
      );
    }
    throw new Error(errorObj?.message || "Gagal mengubah kata sandi.");
  }
}

