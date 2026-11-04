"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Layers, Search, Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ResourceEmpty,
  ResourceError,
  ResourceSkeleton,
} from "@/components/dashboard/resource-state";
import { RemedialBadge, StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStages } from "@/hooks/use-stages";
import { useStudents } from "@/hooks/use-students";
import {
  calculateStars,
  defaultStageStatus,
  formatDate,
  isRemedial,
} from "@/lib/domain/business-rules";
import {
  getAvailableStageIds,
  getStudentRemedialCount,
  studentMatchesProgressFilter,
  type ProgressFilter,
} from "@/lib/domain/ui-rules";
import { DEFAULT_STAGE_ITEMS } from "@/services/stage-service";
import {
  STAGE_IDS,
  type AsyncState,
  type StageId,
  type StageItem,
  type Student,
} from "@/types/sieja";

const FILTER_LABELS: Record<ProgressFilter, string> = {
  all: "Semua siswa",
  remedial: "Remedial",
  completed: "Selesai",
  incomplete: "Belum Selesai",
};

export function ProgressPage({
  studentsOverride,
  stagesOverride,
}: {
  studentsOverride?: AsyncState<Student[]>;
  stagesOverride?: StageItem[];
} = {}) {
  if (studentsOverride) {
    return (
      <ProgressPageContent
        students={studentsOverride}
        stagesOverride={stagesOverride}
      />
    );
  }
  return <LiveProgressPage />;
}

function LiveProgressPage() {
  const students = useStudents();
  const stages = useStages();
  return <ProgressPageContent students={students} stages={stages} />;
}

function ProgressPageContent({
  students,
  stages: stagesProp,
  stagesOverride,
}: {
  students: AsyncState<Student[]>;
  stages?: AsyncState<StageItem[]>;
  stagesOverride?: StageItem[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [selected, setSelected] = useState<Student | null>(null);

  const rawStages = stagesOverride ?? stagesProp?.data ?? DEFAULT_STAGE_ITEMS;

  const stageMap = useMemo(() => {
    const map = new Map<string, StageItem>();
    rawStages.forEach((s) => map.set(s.id, s));
    return map;
  }, [rawStages]);

  const dynamicStageIds = useMemo(() => {
    return getAvailableStageIds(rawStages, students.data);
  }, [rawStages, students.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.data.filter((student) => {
      const matchesSearch =
        !term ||
        `${student.namaLengkap} ${student.username}`
          .toLowerCase()
          .includes(term);
      return (
        matchesSearch &&
        studentMatchesProgressFilter(student, filter, dynamicStageIds)
      );
    });
  }, [dynamicStageIds, filter, search, students.data]);

  const hasActiveQuery = Boolean(search.trim()) || filter !== "all";

  return (
    <div>
      <PageHeader
        eyebrow="Pemantauan"
        title="Progress Siswa"
        description="Lihat status stage, skor, bintang, dan indikator remedial berdasarkan data Firestore."
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid max-w-3xl flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau username..."
              className="h-12 rounded-xl bg-white pl-11"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as ProgressFilter)}
          >
            <SelectTrigger
              className="h-12 rounded-xl bg-white"
              aria-label="Filter progress siswa"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-muted-foreground shadow-sm lg:flex">
          <Layers className="size-4 text-indigo-600" />
          <span>
            Total <strong>{dynamicStageIds.length} Stage</strong> aktif
          </span>
        </div>
      </div>

      {students.loading ? (
        <ResourceSkeleton />
      ) : students.error ? (
        <ResourceError message={students.error} />
      ) : !filtered.length ? (
        <ResourceEmpty
          title={
            hasActiveQuery
              ? "Progress tidak ditemukan"
              : "Belum ada siswa terdaftar"
          }
          description={
            hasActiveQuery
              ? "Coba kata kunci atau filter lain."
              : "Progress akan tampil setelah data siswa tersedia."
          }
        />
      ) : (
        <>
          {/* Tampilan Mobile & Tablet (< lg): Card yang kompak dan rapi */}
          <div className="mt-6 grid gap-4 lg:hidden">
            {filtered.map((student) => (
              <StudentProgressCard
                key={student.id}
                student={student}
                stageIds={dynamicStageIds}
                stageMap={stageMap}
                onDetail={() => setSelected(student)}
              />
            ))}
          </div>

          {/* Tampilan Desktop (>= lg): Tabel Horisontal Scroll dengan Sticky Nama & Aksi */}
          <div className="mt-6 hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            {dynamicStageIds.length > 6 && (
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">
                    Tabel Progress Pembelajaran
                  </span>
                  <span>• {dynamicStageIds.length} Stage</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Geser horizontal untuk melihat seluruh stage (Stage 1 – {dynamicStageIds.length}) →
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    {/* Kolom Nama Sticky di Kiri */}
                    <TableHead className="sticky left-0 z-20 min-w-[200px] max-w-[240px] border-r border-slate-200 bg-slate-50/95 px-4 py-3.5 text-left font-bold text-slate-800 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                      Nama Siswa
                    </TableHead>

                    {/* Kolom Dinamis Setiap Stage */}
                    {dynamicStageIds.map((stageId) => {
                      const num = stageId.replace("stage", "");
                      const stageInfo = stageMap.get(stageId);
                      return (
                        <TableHead
                          key={stageId}
                          className="min-w-[115px] px-3 py-3.5 text-center font-bold text-slate-800"
                        >
                          <span className="block font-bold">Stage {num}</span>
                          {stageInfo?.range && (
                            <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                              {stageInfo.range}
                            </span>
                          )}
                        </TableHead>
                      );
                    })}

                    {/* Kolom Remedial */}
                    <TableHead className="min-w-[110px] px-3 py-3.5 text-center font-bold text-slate-800">
                      Remedial
                    </TableHead>

                    {/* Kolom Aksi Sticky di Kanan */}
                    <TableHead className="sticky right-0 z-10 min-w-[130px] border-l border-slate-200 bg-slate-50/95 px-4 py-3.5 text-right font-bold text-slate-800 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((student) => (
                    <TableRow
                      key={student.id}
                      data-testid="student-progress-row"
                      className="group transition-colors hover:bg-slate-50/60"
                    >
                      {/* Cell Nama Siswa (Sticky Kiri) */}
                      <TableCell className="sticky left-0 z-20 border-r border-slate-100 bg-white px-4 py-3.5 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors group-hover:bg-slate-50/90">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {student.namaLengkap}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          @{student.username}
                        </p>
                      </TableCell>

                      {/* Cell Setiap Stage */}
                      {dynamicStageIds.map((stageId) => (
                        <TableCell
                          key={stageId}
                          className="px-3 py-3 text-center"
                        >
                          <StageSummary student={student} stageId={stageId} />
                        </TableCell>
                      ))}

                      {/* Cell Remedial */}
                      <TableCell className="px-3 py-3 text-center">
                        <RemedialSummary
                          student={student}
                          stageIds={dynamicStageIds}
                        />
                      </TableCell>

                      {/* Cell Aksi (Sticky Kanan) */}
                      <TableCell className="sticky right-0 z-10 border-l border-slate-100 bg-white px-4 py-3 text-right shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors group-hover:bg-slate-50/90">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg px-2.5 text-xs font-medium transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => setSelected(student)}
                        >
                          <Eye className="mr-1 size-3.5" />
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <ProgressDetailDialog
        student={selected}
        stageIds={dynamicStageIds}
        stageMap={stageMap}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function StudentProgressCard({
  student,
  stageIds,
  stageMap,
  onDetail,
}: {
  student: Student;
  stageIds: StageId[];
  stageMap: Map<string, StageItem>;
  onDetail: () => void;
}) {
  const remedialCount = getStudentRemedialCount(student, stageIds);

  const completedCount = stageIds.filter(
    (id) => student.progress[id]?.status === "completed",
  ).length;
  const progressPercent =
    stageIds.length > 0
      ? Math.round((completedCount / stageIds.length) * 100)
      : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
      {/* Header Siswa */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
            {student.namaLengkap.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {student.namaLengkap}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              @{student.username}
            </p>
          </div>
        </div>

        {remedialCount > 0 ? (
          <Badge
            variant="outline"
            className="shrink-0 rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
          >
            {remedialCount} Remedial
          </Badge>
        ) : completedCount === stageIds.length && stageIds.length > 0 ? (
          <Badge
            variant="outline"
            className="shrink-0 rounded-full border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
          >
            Selesai Semua
          </Badge>
        ) : null}
      </div>

      {/* Ringkasan Progres & Progress Bar */}
      <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">
            Progres Pembelajaran
          </span>
          <span className="font-bold text-slate-800">
            {completedCount} / {stageIds.length} Stage Selesai
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid Status Seluruh Stage (Menyesuaikan jumlah stage: 6, 9, dst.) */}
      <div className="mt-3.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Status Stage ({stageIds.length} Stage)
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {stageIds.map((stageId) => {
            const num = stageId.replace("stage", "");
            const progress = student.progress[stageId];
            const status = progress?.status ?? defaultStageStatus(stageId);
            const score = progress?.skor ?? 0;
            const stars = calculateStars(score);
            const remedial = isRemedial(progress);

            return (
              <div
                key={stageId}
                className={`min-w-0 rounded-xl border p-2 text-center transition-all ${
                  remedial
                    ? "border-amber-200 bg-amber-50/50"
                    : status === "completed"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : status === "unlocked"
                    ? "border-indigo-100 bg-indigo-50/40"
                    : "border-slate-200/80 bg-slate-50/60"
                }`}
              >
                <p className="truncate text-[11px] font-bold text-slate-700">
                  Stage {num}
                </p>
                <div className="mt-1 flex items-center justify-center">
                  {status === "completed" && remedial ? (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      {score} Rem
                    </span>
                  ) : status === "completed" ? (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {score} {stars > 0 ? "★".repeat(stars) : ""}
                    </span>
                  ) : status === "unlocked" ? (
                    <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                      Belum Dikerjakan
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">
                      Terkunci
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tombol Detail */}
      <Button
        variant="outline"
        className="mt-4 h-10 w-full gap-1.5 rounded-xl border-slate-200 text-xs font-semibold transition-colors hover:bg-slate-50 hover:text-indigo-700"
        onClick={onDetail}
      >
        <Eye className="size-4" />
        Lihat Detail Selengkapnya
      </Button>
    </article>
  );
}

function StageSummary({
  student,
  stageId,
}: {
  student: Student;
  stageId: StageId;
}) {
  const progress = student.progress[stageId];
  const status = progress?.status ?? defaultStageStatus(stageId);
  const score = progress?.skor ?? 0;
  const stars = calculateStars(score);

  if (status === "completed" && isRemedial(progress)) {
    return (
      <Badge
        variant="outline"
        className="max-w-full justify-center whitespace-nowrap rounded-lg border-amber-300 bg-amber-50 px-2.5 py-1 text-center text-xs font-semibold text-amber-800 shadow-none"
      >
        {score} • Remedial
      </Badge>
    );
  }

  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        aria-label={`Skor ${score}, ${stars} bintang`}
        className="max-w-full justify-center whitespace-nowrap rounded-lg border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-none"
      >
        {score} {stars > 0 ? "★".repeat(stars) : "• 0★"}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={
        status === "unlocked"
          ? "whitespace-nowrap rounded-lg border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-none"
          : "whitespace-nowrap rounded-lg border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-normal text-slate-400 shadow-none"
      }
    >
      {status === "unlocked" ? "Belum Dikerjakan" : "Terkunci"}
    </Badge>
  );
}

function RemedialSummary({
  student,
  stageIds,
}: {
  student: Student;
  stageIds?: StageId[];
}) {
  const count = getStudentRemedialCount(student, stageIds);
  return count > 0 ? (
    <Badge
      variant="outline"
      className="rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
    >
      {count} stage
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground">Tidak ada</span>
  );
}

function ProgressDetailDialog({
  student,
  stageIds,
  stageMap,
  onOpenChange,
}: {
  student: Student | null;
  stageIds: StageId[];
  stageMap: Map<string, StageItem>;
  onOpenChange: (open: boolean) => void;
}) {
  const [displayStudent, setDisplayStudent] = useState<Student | null>(student);

  useEffect(() => {
    if (student) setDisplayStudent(student);
  }, [student]);

  const completedCount = displayStudent
    ? stageIds.filter((id) => displayStudent.progress[id]?.status === "completed")
        .length
    : 0;

  const totalScore = displayStudent
    ? stageIds.reduce(
        (sum, id) => sum + (displayStudent.progress[id]?.skor ?? 0),
        0,
      )
    : 0;

  const remedialCount = displayStudent
    ? getStudentRemedialCount(displayStudent, stageIds)
    : 0;

  return (
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Detail Progress {displayStudent?.namaLengkap}
          </DialogTitle>
          <DialogDescription>
            @{displayStudent?.username} • Memantau {stageIds.length} stage pembelajaran SiEja.
          </DialogDescription>
        </DialogHeader>

        {displayStudent && (
          <div className="space-y-4">
            {/* Kartu Ringkasan Mini */}
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div>
                <p className="text-[11px] text-muted-foreground">Stage Selesai</p>
                <p className="mt-0.5 text-base font-bold text-slate-800">
                  {completedCount}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {stageIds.length}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total Skor</p>
                <p className="mt-0.5 text-base font-bold text-indigo-700">
                  {totalScore}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Perlu Remedial</p>
                <p
                  className={`mt-0.5 text-base font-bold ${
                    remedialCount > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {remedialCount > 0 ? `${remedialCount} Stage` : "Tidak Ada"}
                </p>
              </div>
            </div>

            {/* Grid Kartu Stage Lengkap */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stageIds.map((stageId) => {
                const stageNum = stageId.replace("stage", "");
                const stageInfo = stageMap.get(stageId);
                const progress = displayStudent.progress[stageId];
                const status = progress?.status ?? defaultStageStatus(stageId);
                const score = progress?.skor ?? 0;
                const stars = calculateStars(score);
                const remedial = isRemedial(progress);

                return (
                  <section
                    key={stageId}
                    className={`rounded-xl border p-3.5 transition-all ${
                      remedial
                        ? "border-amber-200 bg-amber-50/30"
                        : status === "completed"
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {stageInfo?.nama || `Stage ${stageNum}`}
                        </h3>
                        {stageInfo?.range && (
                          <p className="text-[11px] text-muted-foreground">
                            Huruf: {stageInfo.range}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={status} />
                        {remedial && <RemedialBadge />}
                      </div>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50/80 p-2 text-xs">
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Skor</dt>
                        <dd className="mt-0.5 text-sm font-bold text-slate-800">
                          {score}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Bintang</dt>
                        <dd className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-slate-800">
                          <Star
                            className={`size-3.5 ${
                              stars > 0
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-300"
                            }`}
                          />
                          {stars}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-2.5 text-[11px] text-muted-foreground">
                      Diperbarui: {formatDate(progress?.updatedAt)}
                    </p>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
