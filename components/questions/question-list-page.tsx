"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Filter, Info, ListOrdered, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { ResourceEmpty, ResourceError, ResourceSkeleton } from "@/components/dashboard/resource-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GAME_TYPE_LABELS, getMaterial, STAGE_DEFINITIONS } from "@/data/material-catalog";
import { useQuestions } from "@/hooks/use-questions";
import { useStages } from "@/hooks/use-stages";
import { formatDate } from "@/lib/domain/business-rules";
import {
  getQuestionMaterialLabel,
  questionMatchesFilters,
} from "@/lib/domain/question-presentation";
import {
  countActiveQuestionsPerStage,
  getBankSoalStatus,
  MAX_SESSION_QUESTIONS,
  type BankSoalStatus,
} from "@/lib/domain/ui-rules";
import { getCatalogItems } from "@/services/catalog-service";
import { deleteQuestion, setQuestionActive } from "@/services/question-service";
import {
  GAME_TYPES,
  isLetterSequenceQuestion,
  type GameType,
  type MaterialCatalogItem,
  type Question,
  type StageId,
} from "@/types/sieja";

const PAGE_SIZE = 20;

export function QuestionListPage() {
  const questions = useQuestions();
  const stages = useStages();
  const sliderRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<StageId | "all">("all");
  const [gameType, setGameType] = useState<GameType | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [detail, setDetail] = useState<Question | null>(null);
  const [page, setPage] = useState(1);
  const [catalogItems, setCatalogItems] = useState<MaterialCatalogItem[]>([]);

  useEffect(() => {
    getCatalogItems().then(setCatalogItems).catch(() => {});
  }, []);

  const catalogMap = useMemo(() => {
    const map = new Map<string, { imagePath: string; wordAudioPath: string }>();
    for (const item of catalogItems) {
      const key = (item.normalizedWord || item.word).toLowerCase().trim();
      map.set(key, {
        imagePath: item.imageUrl || item.imagePath,
        wordAudioPath: item.wordAudioUrl || item.wordAudioPath,
      });
    }
    return map;
  }, [catalogItems]);

  const filtered = useMemo(() => {
    return questions.data.filter((question) =>
      questionMatchesFilters(question, { term: search, stage, gameType, status }),
    );
  }, [gameType, questions.data, search, stage, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function toggle(question: Question, active: boolean) {
    try { await setQuestionActive(question.id, active); toast.success(`Soal ${active ? "diaktifkan" : "dinonaktifkan"}.`); }
    catch { toast.error("Status soal gagal diperbarui."); }
  }
  async function remove(question: Question) {
    try { await deleteQuestion(question.id); toast.success("Soal berhasil dihapus."); }
    catch { toast.error("Soal gagal dihapus."); }
  }

  // Hitung soal aktif per stage dari data yang sudah ada — tidak ada query Firestore baru
  const activePerStage = useMemo(
    () => countActiveQuestionsPerStage(questions.data),
    [questions.data],
  );

  // Gabungkan stage bawaan (1-6) dengan stage dari Firestore dan soal aktif
  const allStages = useMemo(() => {
    const map = new Map<StageId, { id: StageId; number: number; range?: string }>();

    // 1. Stage 1–6 bawaan
    for (const def of STAGE_DEFINITIONS) {
      map.set(def.id, { id: def.id, number: def.number, range: def.range });
    }

    // 2. Stage dinamis dari koleksi 'stages' Firestore (Stage 7, 8, dst.)
    for (const s of stages.data) {
      const num = s.number || Number(s.id.replace("stage", "")) || 0;
      map.set(s.id, { id: s.id, number: num, range: s.range });
    }

    // 3. Stage yang muncul di data soal
    for (const q of questions.data) {
      if (q.stageId && !map.has(q.stageId)) {
        const num = Number(q.stageId.replace("stage", "")) || 0;
        map.set(q.stageId, { id: q.stageId, number: num });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.number - b.number);
  }, [stages.data, questions.data]);

  // Stage yang sedang difilter (selain "all")
  const filteredStageDef =
    stage !== "all" ? (allStages.find((s) => s.id === stage) ?? null) : null;
  const filteredActiveCount = filteredStageDef ? (activePerStage[filteredStageDef.id] ?? 0) : null;

  function scrollSlider(direction: "left" | "right") {
    if (sliderRef.current) {
      const scrollAmount = 260;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }

  const filterControls = (
    <QuestionFilters
      stage={stage}
      setStage={(value) => { setStage(value); setPage(1); }}
      gameType={gameType}
      setGameType={(value) => { setGameType(value); setPage(1); }}
      status={status}
      setStatus={(value) => { setStatus(value); setPage(1); }}
      availableStages={allStages}
    />
  );

  return (
    <div>
      <PageHeader
        eyebrow="Bank soal"
        title="Kelola Soal"
        description="Kelola metadata soal yang dibaca aplikasi Android. Media tetap berasal dari asset lokal SiEja."
        action={
          <Button asChild className="h-11 w-full rounded-xl sm:w-auto">
            <Link href="/dashboard/soal/tambah"><Plus className="size-4" /> Tambah Soal</Link>
          </Button>
        }
      />

      {/* ── Stat Cards: Ringkasan Bank Soal per Stage (Dapat digeser / slider) ── */}
      <section aria-label="Ringkasan bank soal per stage" className="mt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Ringkasan Stage ({allStages.length} Stage)
          </p>
          {allStages.length > 5 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7 rounded-lg bg-white shadow-xs hover:bg-slate-100 active:scale-95 transition-transform"
                onClick={() => scrollSlider("left")}
                aria-label="Geser kartu stage ke kiri"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7 rounded-lg bg-white shadow-xs hover:bg-slate-100 active:scale-95 transition-transform"
                onClick={() => scrollSlider("right")}
                aria-label="Geser kartu stage ke kanan"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {questions.loading || stages.loading ? (
          <div className="flex gap-3 overflow-x-auto pb-3 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 min-w-[170px] sm:min-w-[195px] flex-1 flex-shrink-0 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : (
          <div
            ref={sliderRef}
            className="flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar md:[scrollbar-width:thin] focus:outline-none"
            tabIndex={0}
            aria-label="Daftar ringkasan bank soal per stage"
          >
            {allStages.map((s) => (
              <div
                key={s.id}
                className="min-w-[170px] sm:min-w-[195px] flex-1 flex-shrink-0"
              >
                <StageBankCard
                  stageNumber={s.number}
                  activeCount={activePerStage[s.id] ?? 0}
                  isHighlighted={stage === s.id}
                  onClick={() => {
                    setStage(stage === s.id ? "all" : s.id);
                    setPage(1);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Info Box: Penjelasan Logika Pemilihan Soal ── */}
      <div className="mt-4 rounded-2xl border border-[#d8d2fb] bg-[#f6f4fd] p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-[#493ebc]" aria-hidden />
          <div className="space-y-1 text-sm leading-6 text-[#493ebc]">
            <p className="font-semibold">Setiap sesi permainan menggunakan maksimal {MAX_SESSION_QUESTIONS} soal yang dipilih secara acak dari bank soal aktif pada stage tersebut.</p>
            <ul className="mt-2 space-y-0.5 text-[13px] opacity-90">
              <li>• <strong>Lebih dari {MAX_SESSION_QUESTIONS} soal aktif</strong> — SiEja memilih {MAX_SESSION_QUESTIONS} soal secara acak dari bank soal aktif.</li>
              <li>• <strong>Tepat {MAX_SESSION_QUESTIONS} soal aktif</strong> — seluruh kebutuhan sesi dapat dipenuhi dari bank soal aktif.</li>
              <li>• <strong>Kurang dari {MAX_SESSION_QUESTIONS} soal aktif</strong> — kekurangannya dilengkapi oleh bank soal bawaan aplikasi.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Contextual Notice: saat filter stage tertentu dipilih ── */}
      {filteredStageDef !== null && filteredActiveCount !== null && (
        <ContextualNotice
          stageNumber={filteredStageDef.number}
          activeCount={filteredActiveCount}
        />
      )}

      <div className="mt-6 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari materi atau jenis game..." className="h-12 rounded-xl bg-white pl-11" />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="size-12 shrink-0 md:hidden" aria-label="Buka filter soal"><Filter className="size-4" /></Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85svh] rounded-t-2xl">
            <SheetHeader><SheetTitle>Filter Soal</SheetTitle><SheetDescription>Saring berdasarkan stage, mini-game, dan status.</SheetDescription></SheetHeader>
            <div className="space-y-4 p-4">{filterControls}</div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="mt-4 hidden grid-cols-3 gap-3 md:grid">{filterControls}</div>

      {questions.invalidCount > 0 && (
        <Alert className="mt-5 border-amber-200 bg-amber-50">
          <AlertTitle>{questions.invalidCount} dokumen tidak valid disembunyikan</AlertTitle>
          <AlertDescription>Dokumen tersebut tidak memenuhi kontrak soal standar atau konfigurasi Urutkan Huruf.</AlertDescription>
        </Alert>
      )}

      {questions.loading ? <ResourceSkeleton /> : questions.error ? <ResourceError message={questions.error} /> : !visible.length ? (
        <ResourceEmpty
          title={questions.data.length ? "Soal tidak ditemukan" : "Belum ada soal pada bank soal"}
          description={questions.data.length ? "Ubah kata kunci atau filter yang digunakan." : "Tambahkan soal valid pertama. Android tetap memiliki fallback lokal."}
          action={<Button asChild><Link href="/dashboard/soal/tambah"><Plus className="size-4" /> Tambah Soal</Link></Button>}
        />
      ) : <>
        <div className="mt-6 grid gap-4 md:hidden">
          {visible.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              customMedia={!isLetterSequenceQuestion(question) ? catalogMap.get(question.kata.toLowerCase()) : undefined}
              onDetail={() => setDetail(question)}
              onToggle={(active) => toggle(question, active)}
              onDelete={() => remove(question)}
            />
          ))}
        </div>
        <div className="mt-6 hidden overflow-hidden rounded-2xl border bg-white md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materi</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Game Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <QuestionMaterial
                      question={question}
                      customMedia={!isLetterSequenceQuestion(question) ? catalogMap.get(question.kata.toLowerCase()) : undefined}
                    />
                  </TableCell>
                  <TableCell>Stage {question.stageId.replace("stage", "")}</TableCell>
                  <TableCell>{GAME_TYPE_LABELS[question.gameType]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={question.isActive}
                        onCheckedChange={(value) => toggle(question, value)}
                        aria-label={`${question.isActive ? "Nonaktifkan" : "Aktifkan"} ${getQuestionMaterialLabel(question)}`}
                      />
                      <ActiveBadge active={question.isActive} />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(question.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <QuestionActions question={question} onDetail={() => setDetail(question)} onDelete={() => remove(question)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && <Pagination className="mt-6"><PaginationContent><PaginationItem><PaginationPrevious href="#" aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); setPage(Math.max(1, currentPage - 1)); }} /></PaginationItem>{Array.from({ length: totalPages }).map((_, index) => <PaginationItem key={index}><PaginationLink href="#" isActive={currentPage === index + 1} onClick={(event) => { event.preventDefault(); setPage(index + 1); }}>{index + 1}</PaginationLink></PaginationItem>)}<PaginationItem><PaginationNext href="#" aria-disabled={currentPage === totalPages} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} onClick={(event) => { event.preventDefault(); setPage(Math.min(totalPages, currentPage + 1)); }} /></PaginationItem></PaginationContent></Pagination>}
      </>
      }
      <QuestionDetail
        question={detail}
        customMedia={detail && !isLetterSequenceQuestion(detail) ? catalogMap.get(detail.kata.toLowerCase()) : undefined}
        onOpenChange={(open) => !open && setDetail(null)}
      />
    </div>
  );
}

function QuestionFilters({
  stage,
  setStage,
  gameType,
  setGameType,
  status,
  setStatus,
  availableStages,
}: {
  stage: StageId | "all";
  setStage: (value: StageId | "all") => void;
  gameType: GameType | "all";
  setGameType: (value: GameType | "all") => void;
  status: "all" | "active" | "inactive";
  setStatus: (value: "all" | "active" | "inactive") => void;
  availableStages: Array<{ id: StageId; number: number; range?: string }>;
}) {
  return (
    <>
      <Select value={stage} onValueChange={(value) => setStage(value as StageId | "all")}>
        <SelectTrigger className="h-11 w-full bg-white">
          <SelectValue placeholder="Semua Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Stage</SelectItem>
          {availableStages.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              Stage {item.number}{item.range ? ` (${item.range})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={gameType} onValueChange={(value) => setGameType(value as GameType | "all")}>
        <SelectTrigger className="h-11 w-full bg-white">
          <SelectValue placeholder="Semua Mini-game" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Mini-game</SelectItem>
          {GAME_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {GAME_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={(value) => setStatus(value as "all" | "active" | "inactive")}>
        <SelectTrigger className="h-11 w-full bg-white">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="active">Aktif</SelectItem>
          <SelectItem value="inactive">Nonaktif</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

function QuestionCard({
  question,
  customMedia,
  onDetail,
  onToggle,
  onDelete,
}: {
  question: Question;
  customMedia?: { imagePath?: string; wordAudioPath?: string };
  onDetail: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Stage {question.stageId.replace("stage", "")}</p>
          <div className="mt-3">
            <QuestionMaterial question={question} customMedia={customMedia} compact />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{GAME_TYPE_LABELS[question.gameType]}</p>
        </div>
        <QuestionActions question={question} onDetail={onDetail} onDelete={onDelete} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 p-3">
        <ActiveBadge active={question.isActive} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Aktif</span>
          <Switch checked={question.isActive} onCheckedChange={onToggle} aria-label={`${question.isActive ? "Nonaktifkan" : "Aktifkan"} ${getQuestionMaterialLabel(question)}`} />
        </div>
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={onDetail}>
        <Eye className="size-4" /> Detail
      </Button>
    </article>
  );
}

function QuestionActions({ question, onDetail, onDelete }: { question: Question; onDetail: () => void; onDelete: () => void }) {
  const label = getQuestionMaterialLabel(question);
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Aksi soal ${label}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={onDetail}><Eye className="size-4" /> Detail</DropdownMenuItem><DropdownMenuItem asChild><Link href={`/dashboard/soal/${question.id}/edit`}><Pencil className="size-4" /> Edit</Link></DropdownMenuItem><DropdownMenuSeparator /><ConfirmActionDialog trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="size-4" /> Hapus permanen</DropdownMenuItem>} title="Hapus soal?" description={`${label} akan dihapus permanen. Untuk hanya menghentikan pemakaian, lebih baik nonaktifkan soal.`} actionLabel="Hapus Soal" destructive onConfirm={onDelete} /></DropdownMenuContent></DropdownMenu>;
}

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant="outline" className={active ? "rounded-full border-green-200 bg-green-50 text-green-800" : "rounded-full border-zinc-200 bg-zinc-100 text-zinc-700"}>{active ? "Aktif" : "Nonaktif"}</Badge>;
}

function QuestionDetail({
  question,
  customMedia,
  onOpenChange,
}: {
  question: Question | null;
  customMedia?: { imagePath?: string; wordAudioPath?: string };
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(question)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detail Soal</DialogTitle>
          <DialogDescription>Metadata yang disimpan ke collection soal.</DialogDescription>
        </DialogHeader>
        {question && <QuestionDetailContent question={question} customMedia={customMedia} />}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function QuestionMaterial({
  question,
  compact = false,
  customMedia,
}: {
  question: Question;
  compact?: boolean;
  customMedia?: { imagePath?: string; wordAudioPath?: string };
}) {
  if (isLetterSequenceQuestion(question)) {
    return (
      <div className="flex items-center gap-3">
        <span className={`${compact ? "size-12" : "size-10"} grid shrink-0 place-items-center rounded-xl bg-[#eeeafd] text-primary`}>
          <ListOrdered className="size-5" />
        </span>
        <div>
          <p className="font-semibold">{question.config.startLetter}–{question.config.endLetter}</p>
          <p className="text-xs text-muted-foreground">{question.config.letterCount} Huruf</p>
        </div>
      </div>
    );
  }

  const defaultMaterial = getMaterial(question.huruf);
  const imageSrc = customMedia?.imagePath || defaultMaterial?.imagePath;
  return (
    <div className="flex items-center gap-3">
      <img
        src={imageSrc}
        alt={`Gambar materi ${question.kata}`}
        className={`${compact ? "size-12" : "size-10"} shrink-0 rounded-lg bg-muted object-contain p-1`}
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold capitalize">{question.kata}</p>
          {question.gameType === "urutkanHuruf" && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Legacy</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">Huruf {question.huruf.toUpperCase()}</p>
      </div>
    </div>
  );
}

function QuestionDetailContent({
  question,
  customMedia,
}: {
  question: Question;
  customMedia?: { imagePath?: string; wordAudioPath?: string };
}) {
  const material = !isLetterSequenceQuestion(question) ? getMaterial(question.huruf) : undefined;
  const audioSrc = customMedia?.wordAudioPath || material?.wordAudioPath;
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/60 p-4">
        <QuestionMaterial question={question} customMedia={customMedia} compact />
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Stage" value={`Stage ${question.stageId.replace("stage", "")}`} />
        <Detail label="Mini-game" value={GAME_TYPE_LABELS[question.gameType]} />
        <Detail label="Status" value={question.isActive ? "Aktif" : "Nonaktif"} />
        <Detail label="Diperbarui" value={formatDate(question.updatedAt)} />
        {isLetterSequenceQuestion(question) && (
          <>
            <Detail label="Rentang" value={`${question.config.startLetter}–${question.config.endLetter}`} />
            <Detail label="Jumlah huruf" value={`${question.config.letterCount} Huruf`} />
          </>
        )}
      </dl>
      {isLetterSequenceQuestion(question) ? (
        <p className="rounded-xl border border-primary/15 bg-[#f7f5ff] p-4 text-sm leading-6 text-muted-foreground">
          Kombinasi huruf dibangkitkan secara acak oleh aplikasi Android saat soal dimainkan.
        </p>
      ) : (
        <audio controls preload="none" src={audioSrc} className="w-full" aria-label={`Preview audio kata ${question.kata}`} />
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }

const BANK_STATUS_CONFIG: Record<BankSoalStatus, { label: string; className: string }> = {
  "perlu-fallback": {
    label: "Dilengkapi Bawaan",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  cukup: {
    label: "Soal Lengkap",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  "bank-variatif": {
    label: "Soal Pilihan",
    className: "border-[#d8d2fb] bg-[#f6f4fd] text-[#493ebc]",
  },
};

function StageBankCard({
  stageNumber,
  activeCount,
  isHighlighted,
  onClick,
}: {
  stageNumber: number;
  activeCount: number;
  isHighlighted: boolean;
  onClick?: () => void;
}) {
  const status = getBankSoalStatus(activeCount);
  const { label, className } = BANK_STATUS_CONFIG[status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={[
        "h-full rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 cursor-pointer select-none",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:scale-[0.98]",
        isHighlighted ? "ring-2 ring-primary ring-offset-2 border-primary bg-[#faf9ff]" : "",
      ].join(" ")}
      title={`Klik untuk memfilter Stage ${stageNumber}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Stage {stageNumber}</p>
        {isHighlighted && (
          <span className="size-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums leading-none">{activeCount}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Soal Aktif</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{MAX_SESSION_QUESTIONS} / Sesi</p>
      <Badge
        variant="outline"
        className={`mt-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}
      >
        {label}
      </Badge>
    </div>
  );
}

function ContextualNotice({
  stageNumber,
  activeCount,
}: {
  stageNumber: number;
  activeCount: number;
}) {
  const status = getBankSoalStatus(activeCount);

  const message =
    status === "bank-variatif"
      ? `Stage ${stageNumber} memiliki ${activeCount} soal aktif. Pada setiap sesi, SiEja akan memilih maksimal ${MAX_SESSION_QUESTIONS} soal secara acak dari bank soal aktif.`
      : status === "cukup"
        ? `Stage ${stageNumber} memiliki ${activeCount} soal aktif. Seluruh kebutuhan soal sesi dapat dipenuhi dari bank soal aktif.`
        : `Stage ${stageNumber} memiliki ${activeCount} soal aktif. Kekurangan hingga ${MAX_SESSION_QUESTIONS} soal akan dilengkapi menggunakan bank soal bawaan aplikasi.`;

  return (
    <p className="mt-3 rounded-xl border border-[#d8d2fb] bg-[#f6f4fd] px-4 py-2.5 text-sm text-[#493ebc]">
      {message}
    </p>
  );
}
