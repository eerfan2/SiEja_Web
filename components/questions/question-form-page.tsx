"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Headphones,
  ImageIcon,
  Info,
  ListOrdered,
  RefreshCw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { ResourceError, ResourceSkeleton } from "@/components/dashboard/resource-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  GAME_TYPE_HELP,
  GAME_TYPE_LABELS,
  getMaterial,
  getRecommendedGameTypesForStage,
  getRecommendedMaterialsForStage,
  MATERIAL_CATALOG,
  STAGE_DEFINITIONS,
} from "@/data/material-catalog";
import { validateQuestionInput } from "@/lib/domain/business-rules";
import {
  generateLetterSequencePreview,
  getDefaultLetterSequenceConfig,
  getLetterRange,
  getLetterRangeSize,
  LETTER_COUNT_OPTIONS,
  validateLetterSequenceConfig,
} from "@/lib/domain/letter-sequence";
import { getCatalogItems } from "@/services/catalog-service";
import { createQuestion, getQuestion, updateQuestion } from "@/services/question-service";
import { getStages } from "@/services/stage-service";
import {
  ALPHABET,
  GAME_TYPES,
  isLetterSequenceInput,
  isLetterSequenceQuestion,
  type AlphabetLetter,
  type GameType,
  type LetterSequenceConfig,
  type MaterialCatalogItem,
  type MaterialItem,
  type QuestionInput,
  type StageId,
  type StageItem,
  type StandardGameType,
} from "@/types/sieja";

const DEFAULT_FORM: QuestionInput = {
  stageId: "stage1",
  gameType: "dengarSuaraHuruf",
  kata: "",
  huruf: "",
  isActive: true,
};

export function QuestionFormPage({ mode }: { mode: "create" | "edit" }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<QuestionInput>(DEFAULT_FORM);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);

  // Ambil katalog materi dinamis dari Firestore & daftar stage
  const [dynamicCatalogItems, setDynamicCatalogItems] = useState<MaterialCatalogItem[]>([]);
  const [availableStages, setAvailableStages] = useState<StageItem[]>([]);

  useEffect(() => {
    let active = true;
    getCatalogItems()
      .then((items) => {
        if (active) setDynamicCatalogItems(items);
      })
      .catch((err) => console.warn("Gagal memuat katalog dinamis:", err));

    getStages()
      .then((stages) => {
        if (active) setAvailableStages(stages);
      })
      .catch((err) => console.warn("Gagal memuat stage dinamis:", err));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit") return;
    let active = true;
    getQuestion(params.id)
      .then((question) => {
        if (!active) return;
        if (isLetterSequenceQuestion(question)) {
          setForm({
            stageId: question.stageId,
            gameType: "urutkanHuruf",
            config: question.config,
            isActive: question.isActive,
          });
        } else if (question.gameType === "urutkanHuruf") {
          setForm({
            stageId: question.stageId,
            gameType: "urutkanHuruf",
            config: getDefaultLetterSequenceConfig(question.stageId),
            isActive: question.isActive,
          });
        } else {
          setForm({
            stageId: question.stageId,
            gameType: question.gameType,
            kata: question.kata,
            huruf: question.huruf,
            isActive: question.isActive,
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Soal gagal dimuat.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [mode, params.id]);

  // Gabungkan materi default A-Z dengan katalog materi dinamis
  const allMaterials = useMemo<MaterialItem[]>(() => {
    const list: MaterialItem[] = [...MATERIAL_CATALOG];
    for (const dyn of dynamicCatalogItems) {
      if (dyn.isActive === false) continue;
      const normKata = dyn.word.toLowerCase().trim();
      const mapped: MaterialItem = {
        huruf: dyn.initialLetter.toLowerCase(),
        kata: normKata,
        imagePath: dyn.imageUrl || dyn.imagePath,
        letterAudioPath: `/media/huruf-audio/${dyn.letterAudioId.toLowerCase()}.mp3`,
        wordAudioPath: dyn.wordAudioUrl || dyn.wordAudioPath,
      };
      const existingIdx = list.findIndex((m) => m.kata.toLowerCase() === normKata);
      if (existingIdx >= 0) {
        list[existingIdx] = mapped;
      } else {
        list.push(mapped);
      }
    }
    return list.sort((a, b) => a.kata.localeCompare(b.kata));
  }, [dynamicCatalogItems]);

  const dynamicWords = useMemo(
    () =>
      dynamicCatalogItems
        .map((i) => (i.normalizedWord || i.word || "").toLowerCase().trim())
        .filter(Boolean),
    [dynamicCatalogItems],
  );

  const stageList = useMemo(() => {
    if (availableStages.length > 0) {
      return availableStages.map((s) => ({
        id: s.id,
        number: s.number,
        range: s.range || "A–Z",
        nama: s.nama || `Stage ${s.number}`,
      }));
    }
    return STAGE_DEFINITIONS.map((s) => ({
      id: s.id,
      number: s.number,
      range: s.range,
      nama: `Stage ${s.number}`,
    }));
  }, [availableStages]);

  const isSequence = isLetterSequenceInput(form);
  const sequenceConfig = isSequence ? form.config : null;

  const selected = useMemo(() => {
    if (isSequence) return undefined;
    const formKata = "kata" in form && typeof form.kata === "string" ? form.kata.toLowerCase() : "";
    const formHuruf = "huruf" in form && typeof form.huruf === "string" ? form.huruf.toLowerCase() : "";
    if (formKata) {
      const matchKata = allMaterials.find((m) => m.kata.toLowerCase() === formKata);
      if (matchKata) return matchKata;
    }
    if (formHuruf) {
      return allMaterials.find((m) => m.huruf.toLowerCase() === formHuruf);
    }
    return undefined;
  }, [isSequence, form, allMaterials]);

  const selectedStage = stageList.find((stage) => stage.id === form.stageId);
  const recommendedMaterials = getRecommendedMaterialsForStage(form.stageId);
  const recommendedGameTypes = getRecommendedGameTypesForStage(form.stageId) ?? [];
  const selectedIsDefault = selected
    ? recommendedMaterials.some((material) => material.huruf === selected.huruf && material.kata === selected.kata)
    : false;
  const errors = validateQuestionInput(form, dynamicWords);
  const sequencePreview = useMemo(() => {
    void previewNonce;
    if (!sequenceConfig || validateLetterSequenceConfig(sequenceConfig).length) return null;
    return generateLetterSequencePreview(sequenceConfig);
  }, [sequenceConfig, previewNonce]);

  function chooseStage(stageId: StageId) {
    setForm((current) =>
      isLetterSequenceInput(current)
        ? { ...current, stageId, config: getDefaultLetterSequenceConfig(stageId) }
        : { ...current, stageId },
    );
  }

  function chooseGameType(gameType: GameType) {
    setForm((current) => {
      if (gameType === "urutkanHuruf") {
        return {
          stageId: current.stageId,
          gameType,
          config: getDefaultLetterSequenceConfig(current.stageId),
          isActive: current.isActive,
        };
      }
      return {
        stageId: current.stageId,
        gameType,
        kata: "kata" in current && typeof current.kata === "string" ? current.kata : "",
        huruf: "huruf" in current && typeof current.huruf === "string" ? current.huruf : "",
        isActive: current.isActive,
      };
    });
  }

  function updateRange(field: "startLetter" | "endLetter", value: AlphabetLetter) {
    setForm((current) => {
      if (!isLetterSequenceInput(current)) return current;
      const nextConfig = { ...current.config, [field]: value };
      const rangeSize = getLetterRangeSize(nextConfig.startLetter, nextConfig.endLetter);
      return {
        ...current,
        config: {
          ...nextConfig,
          letterCount:
            rangeSize >= 3
              ? Math.min(nextConfig.letterCount, rangeSize)
              : nextConfig.letterCount,
        },
      };
    });
  }

  function updateLetterCount(letterCount: number) {
    setForm((current) =>
      isLetterSequenceInput(current)
        ? { ...current, config: { ...current.config, letterCount } }
        : current,
    );
  }

  function updateActive(isActive: boolean) {
    setForm((current) => ({ ...current, isActive }));
  }

  async function save() {
    if (errors.length || !user) {
      toast.error(errors[0] ?? "Sesi guru tidak ditemukan.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") await createQuestion(form, user.uid, dynamicWords);
      else await updateQuestion(params.id, form, dynamicWords);
      toast.success(mode === "create" ? "Soal berhasil ditambahkan." : "Soal berhasil diperbarui.");
      router.push("/dashboard/soal");
    } catch (problem) {
      toast.error(problem instanceof Error ? problem.message : "Soal gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Bank soal" title="Memuat soal" description="Mengambil metadata soal dari Firestore." />
        <ResourceSkeleton cards={2} />
      </>
    );
  }
  if (loadError) {
    return (
      <>
        <PageHeader eyebrow="Bank soal" title="Soal tidak dapat diedit" description="Data soal perlu valid sebelum dapat diproses." />
        <ResourceError message={loadError} />
      </>
    );
  }

  const stepLabels = [
    "Pilih stage dan mini-game",
    isSequence ? "Pilih rentang huruf" : "Pilih materi",
    "Periksa preview dan simpan",
  ];
  const stepTwoValid = isSequence ? errors.length === 0 : Boolean(selected);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Bank soal"
        title={mode === "create" ? "Tambah Soal" : "Edit Soal"}
        description="Pilih metadata yang dipahami guru. Path asset, enum teknis, options, dan correctAnswer tidak perlu diisi."
        action={
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href="/dashboard/soal"><ArrowLeft className="size-4" /> Kembali</Link>
          </Button>
        }
      />
      <Card className="mt-6 rounded-2xl border bg-white shadow-sm">
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-primary">Langkah {step} dari 3</p>
              <p className="mt-1 text-sm font-semibold">{stepLabels[step - 1]}</p>
            </div>
            <span className="text-xs text-muted-foreground">{Math.round((step / 3) * 100)}%</span>
          </div>
          <Progress value={(step / 3) * 100} className="mt-4 h-2" />

          {step === 1 && (
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Stage pembelajaran</Label>
                <Select value={form.stageId} onValueChange={(value) => chooseStage(value as StageId)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stageList.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        Stage {stage.number} — {stage.nama} ({stage.range})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="rounded-xl border border-primary/15 bg-[#f7f5ff] p-3 text-xs leading-5 text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <Badge variant="secondary" className="rounded-full">Default</Badge>
                    <span>Materi bawaan Stage {selectedStage?.number}: {selectedStage?.range}.</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="mr-2 rounded-full border-primary/25 text-primary">Fleksibel</Badge>
                    Guru tetap dapat memilih {isSequence ? "rentang huruf lain" : "materi A–Z"} sesuai kebutuhan pembelajaran.
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jenis mini-game</Label>
                <Select value={form.gameType} onValueChange={(value) => chooseGameType(value as GameType)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GAME_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {GAME_TYPE_LABELS[type]}
                        {recommendedGameTypes?.includes(type) ? " — Default" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">{GAME_TYPE_HELP[form.gameType]}</p>
                {isSequence ? (
                  <div className="rounded-xl border border-primary/15 bg-[#f7f5ff] p-3 text-xs leading-5 text-muted-foreground">
                    <ListOrdered className="mr-2 inline size-4 text-primary" aria-hidden="true" />
                    Untuk Urutkan Huruf, guru menentukan rentang alfabet dan jumlah huruf. Aplikasi Android akan membangkitkan kombinasi huruf secara acak setiap kali soal dimainkan.
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/15 bg-[#f7f5ff] p-3 text-xs leading-5 text-muted-foreground">
                    <Info className="mr-2 inline size-4 text-primary" aria-hidden="true" />
                    Jenis permainan bawaan stage hanya menjadi rekomendasi. Guru dapat memilih seluruh tujuh jenis permainan resmi.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && isSequence && (
            <LetterRangeStep
              stageId={form.stageId}
              config={form.config}
              onRangeChange={updateRange}
              onLetterCountChange={updateLetterCount}
            />
          )}

          {step === 2 && !isSequence && (
            <div className="mt-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-bold">Katalog Materi Pembelajaran</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Pilih kata materi dari katalog bawaan maupun materi baru yang ditambahkan guru.
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">{allMaterials.length} materi</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {allMaterials.map((material) => {
                  const active =
                    "kata" in form && form.kata
                      ? form.kata.toLowerCase() === material.kata.toLowerCase()
                      : form.huruf?.toLowerCase() === material.huruf.toLowerCase();
                  const isDefault = recommendedMaterials.some(
                    (item) => item.huruf === material.huruf && item.kata === material.kata,
                  );
                  const isCustom = dynamicWords?.includes(material.kata.toLowerCase()) ?? false;
                  return (
                    <button
                      key={`${material.huruf}_${material.kata}`}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setForm({ ...form, huruf: material.huruf, kata: material.kata })}
                      className={`relative rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-primary bg-[#f3f1ff] ring-2 ring-primary/20"
                          : "bg-white hover:border-[#cfc8fb]"
                      }`}
                    >
                      <Badge
                        variant={isCustom ? "default" : isDefault ? "secondary" : "outline"}
                        className="absolute left-2 top-2 rounded-full text-[10px]"
                      >
                        {isCustom ? "Katalog Baru" : isDefault ? "Default" : "Fleksibel"}
                      </Badge>
                      <img
                        src={material.imagePath}
                        alt={`Gambar ${material.kata}`}
                        className="mx-auto aspect-square w-full max-w-24 object-contain pt-5"
                      />
                      <p className="mt-3 text-sm font-bold capitalize">{material.kata}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Huruf {material.huruf.toUpperCase()}</p>
                      {active && (
                        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-white">
                          <Check className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && isSequence && sequencePreview && (
            <LetterSequencePreviewStep
              stageId={form.stageId}
              config={form.config}
              preview={sequencePreview}
              isActive={form.isActive}
              onShuffle={() => setPreviewNonce((value) => value + 1)}
              onActiveChange={updateActive}
            />
          )}

          {step === 3 && !isSequence && selected && (
            <div className="mt-7 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
              <div className="rounded-2xl border bg-muted/50 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold"><ImageIcon className="size-4 text-primary" /> Preview Gambar</div>
                  <Badge variant={selectedIsDefault ? "secondary" : "outline"} className="rounded-full">
                    {selectedIsDefault ? "Default" : "Fleksibel"}
                  </Badge>
                </div>
                <img src={selected.imagePath} alt={`Preview gambar ${selected.kata}`} className="mx-auto mt-4 aspect-square w-full max-w-56 object-contain" />
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border p-5">
                  <h2 className="text-sm font-bold">Preview Soal</h2>
                  <p className="mt-3 text-lg font-bold text-primary">{questionPreview(form.gameType, selected.kata, selected.huruf)}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Jawaban dan distractor dibentuk otomatis oleh aplikasi Android dari kata dan huruf.</p>
                </div>
                <div className="rounded-2xl border p-5">
                  <div className="flex items-center gap-2 text-sm font-bold"><Headphones className="size-4 text-primary" /> Preview Audio</div>
                  <label className="mt-4 block text-xs font-semibold">Audio huruf {selected.huruf.toUpperCase()}</label>
                  <audio controls preload="none" src={selected.letterAudioPath} className="mt-2 w-full" />
                  <label className="mt-4 block text-xs font-semibold capitalize">Audio kata {selected.kata}</label>
                  <audio controls preload="none" src={selected.wordAudioPath} className="mt-2 w-full" />
                </div>
                <ActiveSwitch isActive={form.isActive} onActiveChange={updateActive} />
              </div>
            </div>
          )}

          {step === 3 && !stepTwoValid && (
            <Alert variant="destructive" className="mt-7">
              <AlertTitle>{isSequence ? "Konfigurasi belum valid" : "Materi belum dipilih"}</AlertTitle>
              <AlertDescription>{errors[0] ?? "Kembali ke langkah 2 dan lengkapi materi."}</AlertDescription>
            </Alert>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-5 min-[420px]:flex-row min-[420px]:justify-between">
            <Button variant="outline" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1 || saving} className="h-11 rounded-xl">
              <ArrowLeft className="size-4" /> Sebelumnya
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((value) => Math.min(3, value + 1))} disabled={step === 2 && !stepTwoValid} className="h-11 rounded-xl">
                Selanjutnya <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={save} disabled={saving || errors.length > 0} className="h-11 rounded-xl">
                <Save className="size-4" /> {saving ? "Menyimpan..." : mode === "create" ? "Simpan Soal" : "Simpan Perubahan"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LetterRangeStep({
  stageId,
  config,
  onRangeChange,
  onLetterCountChange,
}: {
  stageId: StageId;
  config: LetterSequenceConfig;
  onRangeChange: (field: "startLetter" | "endLetter", value: AlphabetLetter) => void;
  onLetterCountChange: (value: number) => void;
}) {
  const selectedStage = STAGE_DEFINITIONS.find((stage) => stage.id === stageId) ?? {
    id: stageId,
    number: Number(stageId.replace("stage", "")) || 1,
    range: "A–Z",
    letters: [],
  };
  const selectedRange = getLetterRange(config.startLetter, config.endLetter);
  const rangeSize = selectedRange.length;
  const rangeErrors = validateLetterSequenceConfig(config);

  return (
    <div className="mt-7 space-y-6" data-testid="letter-range-step">
      <div>
        <h2 className="text-lg font-bold">Pilih Rentang Huruf</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Materi bawaan Stage {selectedStage.number} adalah {selectedStage.range}. Guru tetap dapat memilih rentang huruf lain sesuai kebutuhan pembelajaran.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border bg-muted/25 p-4 sm:grid-cols-2 sm:p-5">
        <div className="space-y-2">
          <Label>Huruf Awal</Label>
          <Select value={config.startLetter} onValueChange={(value) => onRangeChange("startLetter", value as AlphabetLetter)}>
            <SelectTrigger className="h-12 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>{ALPHABET.map((letter) => <SelectItem key={letter} value={letter}>{letter}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Huruf Akhir</Label>
          <Select value={config.endLetter} onValueChange={(value) => onRangeChange("endLetter", value as AlphabetLetter)}>
            <SelectTrigger className="h-12 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>{ALPHABET.map((letter) => <SelectItem key={letter} value={letter}>{letter}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))] sm:gap-2" aria-label={`Visual rentang ${config.startLetter} sampai ${config.endLetter}`}>
          {ALPHABET.map((letter) => {
            const active = selectedRange.includes(letter);
            const endpoint = letter === config.startLetter || letter === config.endLetter;
            return (
              <span
                key={letter}
                className={`grid aspect-square min-w-0 place-items-center rounded-lg text-xs font-bold transition sm:text-sm ${active ? "bg-primary text-white" : "bg-muted text-muted-foreground"} ${endpoint ? "ring-2 ring-primary/25 ring-offset-2" : ""}`}
              >
                {letter}
              </span>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge className="rounded-full">Rentang dipilih: {config.startLetter}–{config.endLetter}</Badge>
          <Badge variant="outline" className="rounded-full">Tersedia {rangeSize} huruf</Badge>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 sm:p-5">
        <Label>Jumlah huruf yang harus diurutkan</Label>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Jumlah huruf per soal">
          {LETTER_COUNT_OPTIONS.map((count) => {
            const disabled = count > rangeSize;
            const active = count === config.letterCount;
            return (
              <Button
                key={count}
                type="button"
                variant={active ? "default" : "outline"}
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onLetterCountChange(count)}
                className="min-w-24 rounded-xl"
              >
                {count} Huruf
              </Button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Pilihan yang melebihi jumlah huruf pada rentang otomatis dinonaktifkan.
        </p>
        {rangeErrors.length > 0 && <p className="mt-2 text-sm font-medium text-destructive">{rangeErrors[0]}</p>}
      </div>

      <div className="rounded-xl border border-primary/15 bg-[#f7f5ff] p-4 text-sm leading-6 text-muted-foreground">
        <Info className="mr-2 inline size-4 text-primary" aria-hidden="true" />
        Untuk Urutkan Huruf, guru menentukan rentang alfabet dan jumlah huruf. Aplikasi Android akan membangkitkan kombinasi huruf secara acak setiap kali soal dimainkan.
      </div>
    </div>
  );
}

function LetterSequencePreviewStep({
  stageId,
  config,
  preview,
  isActive,
  onShuffle,
  onActiveChange,
}: {
  stageId: StageId;
  config: LetterSequenceConfig;
  preview: ReturnType<typeof generateLetterSequencePreview>;
  isActive: boolean;
  onShuffle: () => void;
  onActiveChange: (value: boolean) => void;
}) {
  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-[.8fr_1.2fr]" data-testid="letter-sequence-preview">
      <div className="rounded-2xl border bg-muted/35 p-5">
        <div className="flex items-center gap-2 text-sm font-bold"><ListOrdered className="size-4 text-primary" /> Konfigurasi Soal</div>
        <dl className="mt-5 space-y-3 text-sm">
          <ConfigRow label="Stage" value={`Stage ${stageId.replace("stage", "")}`} />
          <ConfigRow label="Mini-game" value="Urutkan Huruf" />
          <ConfigRow label="Rentang" value={`${config.startLetter}–${config.endLetter}`} />
          <ConfigRow label="Jumlah huruf" value={`${config.letterCount} Huruf`} />
        </dl>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Preview Contoh</h2>
              <p className="mt-1 text-xs text-muted-foreground">Contoh hanya ditampilkan di web dan tidak disimpan ke Firestore.</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={onShuffle}>
              <RefreshCw className="size-4" /> Acak Contoh
            </Button>
          </div>
          <div className="mt-5 space-y-5">
            <LetterChips label="Huruf acak" letters={preview.display} tone="primary" />
            <LetterChips label="Jawaban benar" letters={preview.correct} tone="success" />
          </div>
        </div>
        <ActiveSwitch isActive={isActive} onActiveChange={onActiveChange} />
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}

function LetterChips({ label, letters, tone }: { label: string; letters: readonly string[]; tone: "primary" | "success" }) {
  const classes = tone === "primary" ? "border-primary/20 bg-[#f3f1ff] text-primary" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {letters.map((letter, index) => (
          <span key={`${letter}-${index}`} className={`grid size-11 place-items-center rounded-xl border text-base font-bold ${classes}`}>{letter}</span>
        ))}
      </div>
    </div>
  );
}

function ActiveSwitch({ isActive, onActiveChange }: { isActive: boolean; onActiveChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border p-5">
      <div>
        <Label htmlFor="question-active">Soal aktif</Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Soal nonaktif tidak dipilih query Android yang memakai isActive.</p>
      </div>
      <Switch id="question-active" checked={isActive} onCheckedChange={onActiveChange} />
    </div>
  );
}

function questionPreview(gameType: StandardGameType, kata: string, huruf: string) {
  const upper = huruf.toUpperCase();
  const label = kata.charAt(0).toUpperCase() + kata.slice(1);
  const previews: Record<StandardGameType, string> = {
    dengarSuaraHuruf: `Dengarkan suara huruf. Huruf apakah itu? (${upper})`,
    tebakGambarObjek: `Dengarkan kata “${label}”, lalu pilih gambarnya.`,
    susunKata: `Susun huruf menjadi kata “${label}”.`,
    hurufYangHilang: `Lengkapi huruf yang hilang pada kata “${label}”.`,
    hurufAwalApa: `Apa huruf awal dari “${label}”?`,
    cocokkanHuruf: `Cocokkan huruf besar ${upper} dengan huruf kecilnya.`,
  };
  return previews[gameType];
}
