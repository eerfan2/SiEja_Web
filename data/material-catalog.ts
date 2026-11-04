import { GAME_TYPES, type GameType, type MaterialItem, type StageId } from "@/types/sieja";

const WORDS = [
  ["a", "Ayam"], ["b", "Bebek"], ["c", "Cicak"], ["d", "Domba"],
  ["e", "Elang"], ["f", "Feri"], ["g", "Gajah"], ["h", "Harimau"],
  ["i", "Ikan"], ["j", "Jerapah"], ["k", "Kucing"], ["l", "Lebah"],
  ["m", "Monyet"], ["n", "Nanas"], ["o", "Onta"], ["p", "Panda"],
  ["q", "Quran"], ["r", "Rusa"], ["s", "Singa"], ["t", "Tikus"],
  ["u", "Ulat"], ["v", "Vas"], ["w", "Wortel"], ["x", "Xilofon"],
  ["y", "Yoyo"], ["z", "Zebra"],
] as const;

export const MATERIAL_CATALOG: MaterialItem[] = WORDS.map(([huruf, label]) => {
  const kata = label.toLowerCase();
  return {
    huruf,
    kata,
    imagePath: `/media/kata-images/${huruf}_${kata}.png`,
    letterAudioPath: `/media/huruf-audio/${huruf}.mp3`,
    wordAudioPath: `/media/kata-audio/${kata}.mp3`,
  };
});

// Range materi fallback bawaan Android. Ini hanya rekomendasi untuk guru;
// katalog input web tetap A-Z pada setiap stage.
export const STAGE_DEFINITIONS: Array<{
  id: StageId;
  number: number;
  range: string;
  letters: string[];
}> = [
  { id: "stage1", number: 1, range: "A–E", letters: ["a", "b", "c", "d", "e"] },
  { id: "stage2", number: 2, range: "F–J", letters: ["f", "g", "h", "i", "j"] },
  { id: "stage3", number: 3, range: "K–O", letters: ["k", "l", "m", "n", "o"] },
  { id: "stage4", number: 4, range: "P–T", letters: ["p", "q", "r", "s", "t"] },
  { id: "stage5", number: 5, range: "U–Z", letters: ["u", "v", "w", "x", "y", "z"] },
  { id: "stage6", number: 6, range: "A–Z", letters: WORDS.map(([letter]) => letter) },
];

// Rekomendasi bawaan dari StageQuestionComposer._stageKomposisi Android.
// Konfigurasi ini hanya membantu guru memahami fallback lokal; input guru tidak
// dibatasi oleh rekomendasi ini.
export const STAGE_GAME_TYPES: Record<StageId, readonly GameType[]> = {
  stage1: ["dengarSuaraHuruf", "tebakGambarObjek"],
  stage2: ["dengarSuaraHuruf", "tebakGambarObjek", "hurufYangHilang"],
  stage3: ["dengarSuaraHuruf", "tebakGambarObjek", "hurufYangHilang", "hurufAwalApa"],
  stage4: ["dengarSuaraHuruf", "tebakGambarObjek", "hurufYangHilang", "hurufAwalApa", "cocokkanHuruf"],
  stage5: ["tebakGambarObjek", "hurufYangHilang", "susunKata", "urutkanHuruf"],
  stage6: ["dengarSuaraHuruf", "tebakGambarObjek", "hurufYangHilang", "hurufAwalApa", "cocokkanHuruf", "urutkanHuruf", "susunKata"],
};

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  dengarSuaraHuruf: "Dengar Suara Huruf",
  tebakGambarObjek: "Tebak Gambar Objek",
  susunKata: "Susun Kata",
  hurufYangHilang: "Huruf yang Hilang",
  hurufAwalApa: "Huruf Awal Apa",
  cocokkanHuruf: "Cocokkan Huruf",
  urutkanHuruf: "Urutkan Huruf",
};

export const GAME_TYPE_HELP: Record<GameType, string> = {
  dengarSuaraHuruf: "Anak mendengar audio huruf lalu memilih huruf yang tepat.",
  tebakGambarObjek: "Anak mendengar kata lalu memilih gambar objek yang sesuai.",
  susunKata: "Anak menyusun huruf acak hingga membentuk kata.",
  hurufYangHilang: "Anak memilih huruf yang hilang dari sebuah kata.",
  hurufAwalApa: "Anak menentukan huruf awal dari gambar dan kata.",
  cocokkanHuruf: "Anak memasangkan huruf besar dengan huruf kecil.",
  urutkanHuruf: "Anak mengurutkan beberapa huruf secara alfabetis.",
};

export function getRecommendedMaterialsForStage(stageId: StageId): MaterialItem[] {
  const stage = STAGE_DEFINITIONS.find((item) => item.id === stageId);
  if (!stage) return [];
  return MATERIAL_CATALOG.filter((item) => stage.letters.includes(item.huruf));
}

export function getRecommendedGameTypesForStage(stageId: StageId): readonly GameType[] {
  return STAGE_GAME_TYPES[stageId] ?? GAME_TYPES;
}

export function getMaterial(huruf: string): MaterialItem | undefined {
  return MATERIAL_CATALOG.find((item) => item.huruf === huruf.toLowerCase());
}
