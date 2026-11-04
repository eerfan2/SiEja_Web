import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";

// Baca environment variables dari .env.local
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...values] = trimmed.split("=");
    if (key && values.length) {
      process.env[key.trim()] = values.join("=").trim();
    }
  }
} catch {
  // Abaikan jika .env.local tidak ada
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_STAGES = [
  { id: "stage1", number: 1, range: "A–E" },
  { id: "stage2", number: 2, range: "F–J" },
  { id: "stage3", number: 3, range: "K–O" },
  { id: "stage4", number: 4, range: "P–T" },
  { id: "stage5", number: 5, range: "U–Z" },
  { id: "stage6", number: 6, range: "A–Z" },
];

async function checkQuestions() {
  console.log("\n🔍 Mengambil data soal & stage dari Firestore...\n");

  // 1. Ambil stages
  const stageMap = new Map();
  for (const s of DEFAULT_STAGES) {
    stageMap.set(s.id, { ...s });
  }

  try {
    const stageSnap = await getDocs(collection(db, "stages"));
    for (const doc of stageSnap.docs) {
      const d = doc.data();
      const num = typeof d.number === "number" ? d.number : Number(doc.id.replace("stage", ""));
      stageMap.set(doc.id, {
        id: doc.id,
        number: num,
        range: d.range || "A–Z",
        nama: d.nama || d.title || `Stage ${num}`,
      });
    }
  } catch (err) {
    console.warn("⚠️ Tidak dapat mengambil koleksi stages:", err.message);
  }

  // 2. Ambil soal
  const questionsByStage = new Map();
  for (const id of stageMap.keys()) {
    questionsByStage.set(id, []);
  }

  try {
    const questionSnap = await getDocs(
      query(collection(db, "soal"), where("isActive", "==", true)),
    );
    for (const doc of questionSnap.docs) {
      const q = doc.data();
      const stageId = q.stageId;
      if (!questionsByStage.has(stageId)) {
        questionsByStage.set(stageId, []);
      }
      questionsByStage.get(stageId).push({ id: doc.id, ...q });
    }
  } catch (err) {
    console.error("❌ Gagal mengambil koleksi soal:", err.message);
    process.exit(1);
  }

  const sortedStages = Array.from(stageMap.values()).sort((a, b) => a.number - b.number);

  console.log("╔════════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║               📊 STATUS SUMBER SOAL SETIAP STAGE (FIRESTORE VS DEFAULT)            ║");
  console.log("║                      Aturan Sesi Bermain: Tepat 10 Soal per Sesi                   ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════════════╝\n");

  for (const stage of sortedStages) {
    const allQuestions = questionsByStage.get(stage.id) || [];
    const activeQuestions = allQuestions.filter((q) => q.isActive !== false);
    const count = activeQuestions.length;

    let statusLabel = "";
    let statusIcon = "";
    let description = "";

    if (count >= 10) {
      statusIcon = "🔥";
      statusLabel = "100% FIRESTORE";
      description = `${count} soal aktif di Firestore (Dipilih 10 acak per sesi). Soal default TIDAK muncul.`;
    } else if (count > 0) {
      statusIcon = "⚖️ ";
      statusLabel = "CAMPURAN";
      const needed = 10 - count;
      description = `${count} soal dari Firestore + ${needed} soal pelengkap dari Default Lokal.`;
    } else {
      statusIcon = "📦";
      statusLabel = "100% DEFAULT LOKAL";
      description = `Belum ada soal aktif di Firestore. Memainkan 10 soal bawaan lokal (${stage.range}).`;
    }

    console.log(`┌─ Stage ${stage.number} (${stage.nama || `Stage ${stage.number}`}) • Rentang: ${stage.range}`);
    console.log(`│  Status  : ${statusIcon} [${statusLabel}]`);
    console.log(`│  Rincian : ${description}`);

    if (count > 0) {
      console.log(`│  Daftar Soal Firestore (${count} soal):`);
      activeQuestions.slice(0, 10).forEach((q, idx) => {
        const detail =
          q.gameType === "urutkanHuruf"
            ? `Urutkan Huruf (${q.config?.startLetter || "A"}-${q.config?.endLetter || "Z"}, ${q.config?.letterCount || 4} huruf)`
            : `${q.gameType} — kata: "${q.kata}", huruf: "${(q.huruf || "").toUpperCase()}"`;
        console.log(`│    ${idx + 1}. ${detail}`);
      });
      if (count > 10) {
        console.log(`│    ... dan ${count - 10} soal lainnya.`);
      }
    }
    console.log("└─────────────────────────────────────────────────────────────────────────────────\n");
  }

  process.exit(0);
}

checkQuestions();
