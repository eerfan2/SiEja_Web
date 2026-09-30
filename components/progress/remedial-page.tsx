"use client";

import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { ResourceEmpty, ResourceError, ResourceSkeleton } from "@/components/dashboard/resource-state";
import { RemedialBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudents } from "@/hooks/use-students";
import { getRemedialItems, resetStage } from "@/services/progress-service";
import type { StageId } from "@/types/sieja";

export function RemedialPage() {
  const students = useStudents();
  const items = getRemedialItems(students.data);

  async function handleReset(studentId: string, studentName: string, stageId: StageId) {
    try { await resetStage(studentId, stageId); toast.success(`Stage ${stageId.replace("stage", "")} milik ${studentName} berhasil direset.`); }
    catch { toast.error("Reset stage gagal. Coba kembali."); }
  }

  return <div><PageHeader eyebrow="Tindak lanjut" title="Remedial" description="Hanya stage dengan status completed dan skor di bawah 50 yang muncul di halaman ini." />{students.loading ? <ResourceSkeleton /> : students.error ? <ResourceError message={students.error} /> : !items.length ? <ResourceEmpty title="Tidak ada stage yang perlu remedial" description="Stage remedial akan muncul otomatis ketika status completed dan skor kurang dari 50." /> : <>
    <div className="mt-6 grid gap-4 md:hidden">{items.map(({ student, stageId, progress }) => <article key={`${student.id}-${stageId}`} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{student.namaLengkap}</h2><p className="mt-1 text-xs text-muted-foreground">Stage {stageId.replace("stage", "")}</p></div><RemedialBadge /></div><div className="mt-4 rounded-xl bg-[#fff8e8] p-4"><p className="text-xs text-[#795316]">Skor saat ini</p><p className="mt-1 text-2xl font-bold text-[#795316]">{progress.skor}</p></div><ConfirmActionDialog trigger={<Button className="mt-4 w-full"><RefreshCcw className="size-4" /> Reset Stage</Button>} title="Reset stage remedial?" description={`Progress Stage ${stageId.replace("stage", "")} milik ${student.namaLengkap} akan menjadi skor 0 dan status unlocked. Field stage tidak dihapus.`} actionLabel="Ya, Reset Stage" onConfirm={() => handleReset(student.id, student.namaLengkap, stageId)} /></article>)}</div>
    <div className="mt-6 hidden overflow-hidden rounded-2xl border bg-white md:block"><Table><TableHeader><TableRow><TableHead>Nama Siswa</TableHead><TableHead>Stage</TableHead><TableHead>Skor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{items.map(({ student, stageId, progress }) => <TableRow key={`${student.id}-${stageId}`}><TableCell className="font-semibold">{student.namaLengkap}</TableCell><TableCell>Stage {stageId.replace("stage", "")}</TableCell><TableCell>{progress.skor}</TableCell><TableCell><RemedialBadge /></TableCell><TableCell><div className="flex justify-end"><ConfirmActionDialog trigger={<Button size="sm"><RefreshCcw className="size-4" /> Reset</Button>} title="Reset stage remedial?" description={`Progress Stage ${stageId.replace("stage", "")} milik ${student.namaLengkap} akan menjadi skor 0 dan status unlocked. Field stage tidak dihapus.`} actionLabel="Ya, Reset Stage" onConfirm={() => handleReset(student.id, student.namaLengkap, stageId)} /></div></TableCell></TableRow>)}</TableBody></Table></div>
  </>}</div>;
}
