"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Star } from "lucide-react";
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
import { useStudents } from "@/hooks/use-students";
import {
  calculateStars,
  defaultStageStatus,
  formatDate,
  isRemedial,
} from "@/lib/domain/business-rules";
import {
  getStudentRemedialCount,
  studentMatchesProgressFilter,
  type ProgressFilter,
} from "@/lib/domain/ui-rules";
import {
  STAGE_IDS,
  type AsyncState,
  type StageId,
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
}: {
  studentsOverride?: AsyncState<Student[]>;
} = {}) {
  if (studentsOverride) return <ProgressPageContent students={studentsOverride} />;
  return <LiveProgressPage />;
}

function LiveProgressPage() {
  const students = useStudents();
  return <ProgressPageContent students={students} />;
}

function ProgressPageContent({ students }: { students: AsyncState<Student[]> }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [selected, setSelected] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.data.filter((student) => {
      const matchesSearch =
        !term ||
        `${student.namaLengkap} ${student.username}`
          .toLowerCase()
          .includes(term);
      return matchesSearch && studentMatchesProgressFilter(student, filter);
    });
  }, [filter, search, students.data]);

  const hasActiveQuery = Boolean(search.trim()) || filter !== "all";

  return (
    <div>
      <PageHeader
        eyebrow="Pemantauan"
        title="Progress Siswa"
        description="Lihat status stage, skor, bintang, dan indikator remedial berdasarkan data Firestore."
      />

      <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau username..."
            className="h-12 rounded-xl bg-white pl-11"
          />
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as ProgressFilter)}>
          <SelectTrigger className="h-12 rounded-xl bg-white" aria-label="Filter progress siswa">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FILTER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {students.loading ? (
        <ResourceSkeleton />
      ) : students.error ? (
        <ResourceError message={students.error} />
      ) : !filtered.length ? (
        <ResourceEmpty
          title={hasActiveQuery ? "Progress tidak ditemukan" : "Belum ada siswa terdaftar"}
          description={
            hasActiveQuery
              ? "Coba kata kunci atau filter lain."
              : "Progress akan tampil setelah data siswa tersedia."
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 xl:hidden">
            {filtered.map((student) => (
              <StudentProgressCard
                key={student.id}
                student={student}
                onDetail={() => setSelected(student)}
              />
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-2xl border bg-white xl:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[14%] px-3">Nama</TableHead>
                  {STAGE_IDS.map((stageId) => (
                    <TableHead key={stageId} className="w-[9.5%] px-2 text-center">
                      Stage {stageId.replace("stage", "")}
                    </TableHead>
                  ))}
                  <TableHead className="w-[13%] px-2 text-center">Remedial</TableHead>
                  <TableHead className="w-[16%] px-2 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id} data-testid="student-progress-row">
                    <TableCell className="px-3">
                      <p className="truncate font-semibold">{student.namaLengkap}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        @{student.username}
                      </p>
                    </TableCell>
                    {STAGE_IDS.map((stageId) => (
                      <TableCell key={stageId} className="px-2 text-center">
                        <StageSummary student={student} stageId={stageId} />
                      </TableCell>
                    ))}
                    <TableCell className="px-2 text-center">
                      <RemedialSummary student={student} />
                    </TableCell>
                    <TableCell className="px-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg px-2 text-xs"
                        onClick={() => setSelected(student)}
                      >
                        <Eye className="size-4" />
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <ProgressDetailDialog
        student={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function StudentProgressCard({
  student,
  onDetail,
}: {
  student: Student;
  onDetail: () => void;
}) {
  const remedialCount = getStudentRemedialCount(student);

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-bold">{student.namaLengkap}</h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">@{student.username}</p>
        </div>
        {remedialCount > 0 && (
          <Badge variant="outline" className="shrink-0 rounded-full border-amber-200 bg-amber-50 text-amber-800">
            {remedialCount} remedial
          </Badge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {STAGE_IDS.map((stageId) => (
          <div key={stageId} className="min-w-0 rounded-xl border bg-muted/25 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Stage {stageId.replace("stage", "")}
            </p>
            <StageSummary student={student} stageId={stageId} />
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={onDetail}>
        <Eye className="size-4" />
        Lihat Detail
      </Button>
    </article>
  );
}

function StageSummary({ student, stageId }: { student: Student; stageId: StageId }) {
  const progress = student.progress[stageId];
  const status = progress?.status ?? defaultStageStatus(stageId);
  const score = progress?.skor ?? 0;
  const stars = calculateStars(score);

  if (status === "completed" && isRemedial(progress)) {
    return (
      <Badge
        variant="outline"
        className="max-w-full justify-center whitespace-normal rounded-lg border-amber-200 bg-amber-50 px-2 py-1 text-center text-[11px] leading-4 text-amber-800"
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
        className="max-w-full justify-center rounded-lg border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800"
      >
        {score} {stars > 0 ? "★".repeat(stars) : "• 0 bintang"}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={
        status === "unlocked"
          ? "rounded-lg border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] text-indigo-700"
          : "rounded-lg border-slate-200 bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
      }
    >
      {status === "unlocked" ? "Unlocked" : "Locked"}
    </Badge>
  );
}

function RemedialSummary({ student }: { student: Student }) {
  const count = getStudentRemedialCount(student);
  return count > 0 ? (
    <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-800">
      {count} stage
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground">Tidak ada</span>
  );
}

function ProgressDetailDialog({
  student,
  onOpenChange,
}: {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [displayStudent, setDisplayStudent] = useState<Student | null>(student);

  useEffect(() => {
    if (student) setDisplayStudent(student);
  }, [student]);

  return (
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detail Progress {displayStudent?.namaLengkap}</DialogTitle>
          <DialogDescription>
            @{displayStudent?.username} • Status, skor, bintang, waktu pembaruan, dan remedial setiap stage.
          </DialogDescription>
        </DialogHeader>
        {displayStudent && (
          <div className="grid gap-3 sm:grid-cols-2">
            {STAGE_IDS.map((stageId) => {
              const progress = displayStudent.progress[stageId];
              const status = progress?.status ?? defaultStageStatus(stageId);
              const score = progress?.skor ?? 0;
              const stars = calculateStars(score);

              return (
                <section key={stageId} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">
                      Stage {stageId.replace("stage", "")}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge status={status} />
                      {isRemedial(progress) && <RemedialBadge />}
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Skor</dt>
                      <dd className="mt-1 font-bold">{score}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Bintang</dt>
                      <dd className="mt-1 inline-flex items-center gap-1 font-bold">
                        <Star className={`size-4 ${stars > 0 ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                        {stars}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 border-t pt-3 text-[11px] leading-5 text-muted-foreground">
                    Diperbarui: {formatDate(progress?.updatedAt)}
                  </p>
                </section>
              );
            })}
          </div>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
