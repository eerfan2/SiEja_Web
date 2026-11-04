import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getFirebaseClient } from "@/lib/firebase/client";
import {
  calculateInitialLetter,
  formatCatalogWord,
  normalizeWord,
  validateAudioFile,
  validateCatalogInput,
  validateImageFile,
} from "@/lib/domain/business-rules";
import type {
  CreateCatalogInput,
  MaterialCatalogItem,
  UpdateCatalogInput,
} from "@/types/sieja";

/**
 * Membangun payload Firestore untuk penambahan materi katalog baru.
 * Fungsi murni agar dapat diuji secara terisolasi tanpa koneksi Firebase.
 */
export function buildCreateCatalogPayload(
  input: CreateCatalogInput,
  imagePath: string,
  wordAudioPath: string,
  userUid?: string,
  timestamp: any = serverTimestamp(),
) {
  const normalizedWord = normalizeWord(input.word);
  const word = formatCatalogWord(input.word);
  const initialLetter = calculateInitialLetter(input.word);
  const letterAudioId = input.letterAudioId.trim().toUpperCase();

  return {
    word,
    normalizedWord,
    initialLetter,
    letterAudioId,
    imagePath,
    wordAudioPath,
    isActive: input.isActive ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(userUid ? { createdBy: userUid } : {}),
  };
}

/**
 * Membangun payload Firestore untuk pembaruan materi katalog.
 * Fungsi murni agar dapat diuji secara terisolasi.
 */
export function buildUpdateCatalogPayload(
  input: UpdateCatalogInput,
  newImagePath?: string,
  newWordAudioPath?: string,
  timestamp: any = serverTimestamp(),
) {
  const payload: Record<string, any> = {
    updatedAt: timestamp,
  };

  if (input.word !== undefined) {
    payload.word = formatCatalogWord(input.word);
    payload.normalizedWord = normalizeWord(input.word);
    payload.initialLetter = calculateInitialLetter(input.word);
  }

  if (input.letterAudioId !== undefined) {
    payload.letterAudioId = input.letterAudioId.trim().toUpperCase();
  }

  if (input.isActive !== undefined) {
    payload.isActive = input.isActive;
  }

  if (newImagePath) {
    payload.imagePath = newImagePath;
  }

  if (newWordAudioPath) {
    payload.wordAudioPath = newWordAudioPath;
  }

  return payload;
}

/**
 * Mengambil URL unduh media dari Firebase Storage dengan fallback aman.
 */
export async function getMediaDownloadUrl(storagePath: string): Promise<string> {
  if (!storagePath) return "";
  if (
    storagePath.startsWith("http://") ||
    storagePath.startsWith("https://") ||
    storagePath.startsWith("data:")
  ) {
    return storagePath;
  }

  try {
    const { storage } = getFirebaseClient();
    const fileRef = ref(storage, storagePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.warn(`[CatalogService] Gagal memuat download URL untuk ${storagePath}:`, error);
    return "";
  }
}

/**
 * Mengompresi file gambar di browser menggunakan canvas menjadi data URL WebP/JPEG (~15-35 KB)
 * sehingga dapat disimpan langsung ke Firestore tanpa memerlukan Firebase Cloud Storage.
 */
export async function compressImageToDataUrl(
  file: File,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Jika di lingkungan non-browser (misal SSR atau Node.js test), kembalikan data URL langsung
    if (typeof window === "undefined" || typeof document === "undefined") {
      fileToDataUrl(file).then(resolve).catch(reject);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp")) {
            resolve(webpData);
            return;
          }
        } catch {
          // Fallback ke JPEG jika browser tidak mendukung toDataURL webp
        }
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
    reader.readAsDataURL(file);
  });
}

/**
 * Mengubah file ke format Base64 Data URL.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca berkas."));
    reader.readAsDataURL(file);
  });
}

/**
 * Mengunggah file ke Firebase Storage.
 */
export async function uploadCatalogMedia(
  file: File,
  storagePath: string,
): Promise<string> {
  const { storage } = getFirebaseClient();
  const fileRef = ref(storage, storagePath);
  try {
    await uploadBytes(fileRef, file, {
      contentType: file.type || "application/octet-stream",
    });
    return storagePath;
  } catch (error: any) {
    if (error?.code === "storage/unauthorized") {
      throw new Error(
        "Izin Firebase Storage ditolak (unauthorized). Pastikan Anda telah login sebagai Guru dan aturan Security Rules di menu Storage Firebase Console sudah diizinkan (allow write: if request.auth != null;).",
      );
    }
    if (
      error?.code === "storage/retry-limit-exceeded" ||
      error?.code === "storage/canceled" ||
      error?.message?.toLowerCase().includes("timeout") ||
      error?.message?.toLowerCase().includes("retry")
    ) {
      throw new Error(
        "Waktu unggah berkas ke Firebase Storage habis (timeout). Pastikan layanan Storage telah diaktifkan ('Get started') di Firebase Console dan koneksi internet stabil.",
      );
    }
    if (
      error?.code === "storage/bucket-not-found" ||
      error?.code === "storage/project-not-found"
    ) {
      throw new Error(
        "Bucket Firebase Storage tidak ditemukan. Buka Firebase Console -> menu Storage -> klik 'Get started' untuk mengaktifkannya.",
      );
    }
    throw error;
  }
}

/**
 * Menghapus file dari Firebase Storage.
 */
export async function deleteCatalogMedia(storagePath: string): Promise<void> {
  if (!storagePath) return;
  if (
    storagePath.startsWith("http://") ||
    storagePath.startsWith("https://") ||
    storagePath.startsWith("data:")
  ) {
    return;
  }
  try {
    const { storage } = getFirebaseClient();
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error: any) {
    if (error?.code !== "storage/object-not-found") {
      console.warn(`[CatalogService] Gagal menghapus storage object ${storagePath}:`, error);
    }
  }
}

/**
 * Mengambil semua materi dari koleksi `material_catalog`.
 * Menghubungkan URL pratinjau media secara otomatis.
 */
export async function getCatalogItems(): Promise<MaterialCatalogItem[]> {
  try {
    const { db, storage } = getFirebaseClient();
    const q = query(collection(db, "material_catalog"), orderBy("word", "asc"));
    const snapshot = await getDocs(q);

    const items: MaterialCatalogItem[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const item: MaterialCatalogItem = {
        id: docSnap.id,
        word: data.word || "",
        normalizedWord: data.normalizedWord || (data.word || "").toLowerCase(),
        initialLetter: data.initialLetter || (data.word || "")[0]?.toUpperCase() || "A",
        letterAudioId: data.letterAudioId || (data.initialLetter || "A"),
        imagePath: data.imagePath || "",
        wordAudioPath: data.wordAudioPath || "",
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
      };

      // Upayakan resolve URL media untuk kemudahan UI
      if (item.imagePath) {
        if (
          item.imagePath.startsWith("http://") ||
          item.imagePath.startsWith("https://") ||
          item.imagePath.startsWith("data:")
        ) {
          item.imageUrl = item.imagePath;
        } else {
          try {
            item.imageUrl = await getDownloadURL(ref(storage, item.imagePath));
          } catch {
            item.imageUrl = "";
          }
        }
      }
      if (item.wordAudioPath) {
        if (
          item.wordAudioPath.startsWith("http://") ||
          item.wordAudioPath.startsWith("https://") ||
          item.wordAudioPath.startsWith("data:")
        ) {
          item.wordAudioUrl = item.wordAudioPath;
        } else {
          try {
            item.wordAudioUrl = await getDownloadURL(ref(storage, item.wordAudioPath));
          } catch {
            item.wordAudioUrl = "";
          }
        }
      }

      items.push(item);
    }

    return items;
  } catch (error) {
    console.error("[CatalogService] Gagal mengambil katalog materi:", error);
    return [];
  }
}

/**
 * Mengambil satu materi katalog berdasarkan ID.
 */
export async function getCatalogItem(id: string): Promise<MaterialCatalogItem | null> {
  try {
    const { db, storage } = getFirebaseClient();
    const docRef = doc(db, "material_catalog", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    const item: MaterialCatalogItem = {
      id: snap.id,
      word: data.word || "",
      normalizedWord: data.normalizedWord || (data.word || "").toLowerCase(),
      initialLetter: data.initialLetter || (data.word || "")[0]?.toUpperCase() || "A",
      letterAudioId: data.letterAudioId || (data.initialLetter || "A"),
      imagePath: data.imagePath || "",
      wordAudioPath: data.wordAudioPath || "",
      isActive: data.isActive ?? true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
    };

    if (item.imagePath) {
      if (
        item.imagePath.startsWith("http://") ||
        item.imagePath.startsWith("https://") ||
        item.imagePath.startsWith("data:")
      ) {
        item.imageUrl = item.imagePath;
      } else {
        try {
          item.imageUrl = await getDownloadURL(ref(storage, item.imagePath));
        } catch {
          item.imageUrl = "";
        }
      }
    }
    if (item.wordAudioPath) {
      if (
        item.wordAudioPath.startsWith("http://") ||
        item.wordAudioPath.startsWith("https://") ||
        item.wordAudioPath.startsWith("data:")
      ) {
        item.wordAudioUrl = item.wordAudioPath;
      } else {
        try {
          item.wordAudioUrl = await getDownloadURL(ref(storage, item.wordAudioPath));
        } catch {
          item.wordAudioUrl = "";
        }
      }
    }

    return item;
  } catch (error) {
    console.error(`[CatalogService] Gagal mengambil item katalog ${id}:`, error);
    return null;
  }
}

/**
 * Menambahkan materi baru ke koleksi `material_catalog`.
 * Mendukung berkas langsung (otomatis diubah ke Data URL hemat memori) maupun Tautan URL (HTTP/HTTPS),
 * sehingga bekerja 100% tanpa memerlukan paket Blaze/Cloud Storage Firebase.
 */
export async function createCatalogItem(
  input: CreateCatalogInput,
  imageSource: File | string,
  audioSource: File | string,
  userUid?: string,
): Promise<MaterialCatalogItem> {
  let imagePath = "";
  let wordAudioPath = "";

  // 1. Proses Gambar
  if (typeof imageSource === "string") {
    const trimmed = imageSource.trim();
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("data:image/")
    ) {
      throw new Error(
        "Tautan gambar harus diawali dengan http://, https://, atau berupa format data gambar.",
      );
    }
    imagePath = trimmed;
  } else {
    const imgErrors = validateImageFile(imageSource);
    if (imgErrors.length > 0) throw new Error(imgErrors[0]);
    imagePath = await compressImageToDataUrl(imageSource);
  }

  // 2. Proses Audio
  if (typeof audioSource === "string") {
    const trimmed = audioSource.trim();
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("data:audio/")
    ) {
      throw new Error(
        "Tautan audio harus diawali dengan http://, https://, atau berupa format data audio.",
      );
    }
    wordAudioPath = trimmed;
  } else {
    const audErrors = validateAudioFile(audioSource);
    if (audErrors.length > 0) throw new Error(audErrors[0]);
    if (audioSource.size > 600 * 1024) {
      throw new Error(
        "Ukuran audio untuk simpan langsung maksimal 600 KB agar muat di database cloud. Gunakan rekaman lebih pendek atau gunakan mode Tautan URL.",
      );
    }
    wordAudioPath = await fileToDataUrl(audioSource);
  }

  // 3. Validasi input kata & huruf
  const { db, auth } = getFirebaseClient();
  const effectiveUid = userUid || auth.currentUser?.uid || "";

  // Periksa duplikasi kata di koleksi
  const existingDocs = await getDocs(collection(db, "material_catalog"));
  const existingWords = existingDocs.docs.map((d) => d.data().normalizedWord || "");
  const inputErrors = validateCatalogInput(input, existingWords);
  if (inputErrors.length > 0) throw new Error(inputErrors[0]);

  // 4. Siapkan ID dokumen dan simpan ke Firestore
  const catalogCol = collection(db, "material_catalog");
  const newDocRef = doc(catalogCol);
  const materialId = newDocRef.id;

  const payload = buildCreateCatalogPayload(
    input,
    imagePath,
    wordAudioPath,
    effectiveUid,
  );

  try {
    await setDoc(newDocRef, payload);

    return {
      id: materialId,
      ...payload,
      imageUrl: imagePath,
      wordAudioUrl: wordAudioPath,
    };
  } catch (error: any) {
    if (
      error?.code === "permission-denied" ||
      error?.message?.toLowerCase().includes("insufficient permissions")
    ) {
      throw new Error(
        "Izin Firestore ditolak (Missing or insufficient permissions). Pastikan aturan Security Rules untuk koleksi 'material_catalog' di Firebase Console sudah diizinkan.",
      );
    }
    throw new Error(error.message || "Gagal menyimpan materi baru.");
  }
}

/**
 * Memperbarui materi katalog yang sudah ada.
 * Mendukung penggantian gambar dan audio baik berkas langsung maupun Tautan URL.
 */
export async function updateCatalogItem(
  id: string,
  input: UpdateCatalogInput,
  newImageSource?: File | string,
  newAudioSource?: File | string,
): Promise<void> {
  const currentItem = await getCatalogItem(id);
  if (!currentItem) throw new Error("Materi tidak ditemukan.");

  let newImagePath: string | undefined;
  let newWordAudioPath: string | undefined;

  if (newImageSource) {
    if (typeof newImageSource === "string") {
      newImagePath = newImageSource.trim();
    } else {
      const imgErrors = validateImageFile(newImageSource);
      if (imgErrors.length > 0) throw new Error(imgErrors[0]);
      newImagePath = await compressImageToDataUrl(newImageSource);
    }
  }

  if (newAudioSource) {
    if (typeof newAudioSource === "string") {
      newWordAudioPath = newAudioSource.trim();
    } else {
      const audErrors = validateAudioFile(newAudioSource);
      if (audErrors.length > 0) throw new Error(audErrors[0]);
      if (newAudioSource.size > 600 * 1024) {
        throw new Error(
          "Ukuran audio untuk simpan langsung maksimal 600 KB. Silakan gunakan rekaman lebih pendek atau gunakan mode Tautan URL.",
        );
      }
      newWordAudioPath = await fileToDataUrl(newAudioSource);
    }
  }

  const { db } = getFirebaseClient();

  // Periksa duplikasi jika nama kata berubah
  if (input.word !== undefined) {
    const existingDocs = await getDocs(collection(db, "material_catalog"));
    const otherWords = existingDocs.docs
      .filter((d) => d.id !== id)
      .map((d) => d.data().normalizedWord || "");
    const inputErrors = validateCatalogInput(
      { word: input.word, letterAudioId: input.letterAudioId || currentItem.letterAudioId },
      otherWords,
      currentItem.normalizedWord,
    );
    if (inputErrors.length > 0) throw new Error(inputErrors[0]);
  }

  // Update Firestore
  const payload = buildUpdateCatalogPayload(
    input,
    newImagePath,
    newWordAudioPath,
  );
  await updateDoc(doc(db, "material_catalog", id), payload);

  // Jika berkas lama berupa file Storage cloud (bukan data URL atau http URL), hapus dari Storage
  if (
    newImagePath &&
    currentItem.imagePath &&
    currentItem.imagePath !== newImagePath &&
    !currentItem.imagePath.startsWith("data:") &&
    !currentItem.imagePath.startsWith("http")
  ) {
    await deleteCatalogMedia(currentItem.imagePath);
  }
  if (
    newWordAudioPath &&
    currentItem.wordAudioPath &&
    currentItem.wordAudioPath !== newWordAudioPath &&
    !currentItem.wordAudioPath.startsWith("data:") &&
    !currentItem.wordAudioPath.startsWith("http")
  ) {
    await deleteCatalogMedia(currentItem.wordAudioPath);
  }
}

/**
 * Mengubah status aktif/nonaktif materi katalog.
 */
export async function toggleCatalogStatus(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { db } = getFirebaseClient();
  await updateDoc(doc(db, "material_catalog", id), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Menghapus materi katalog beserta aset gambar dan audionya.
 */
export async function deleteCatalogItem(
  id: string,
  item?: MaterialCatalogItem,
): Promise<void> {
  const target = item || (await getCatalogItem(id));
  const { db } = getFirebaseClient();

  // Hapus dokumen Firestore terlebih dahulu
  await deleteDoc(doc(db, "material_catalog", id));

  // Hapus berkas Storage terkait
  if (target?.imagePath) {
    await deleteCatalogMedia(target.imagePath);
  }
  if (target?.wordAudioPath) {
    await deleteCatalogMedia(target.wordAudioPath);
  }
}
