"use client";

import Link from "next/link";
import { BookOpenCheck, CheckCircle2, RefreshCcw, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ResourceEmpty, ResourceError, ResourceSkeleton } from "@/components/dashboard/resource-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudents } from "@/hooks/use-students";
import { formatDate, isRemedial } from "@/lib/domain/business-rules";
import { STAGE_IDS } from "@/types/sieja";

export function OverviewPage() {
  const students = useStudents();
  if (students.loading) return <><PageHeader eyebrow="Ringkasan" title="Dashboard" description="Memuat ringkasan data SiEja dari Firestore." /><ResourceSkeleton cards={4} /></>;
  if (students.error) return <><PageHeader eyebrow="Ringkasan" title="Dashboard" description="Ringkasan pembelajaran siswa." /><ResourceError message={students.error} /></>;

  let highestOpenedStageIndex = 0;
  for (const student of students.data) {
    for (let i = STAGE_IDS.length - 1; i >= 0; i--) {
      const status = student.progress[STAGE_IDS[i]]?.status;
      if (status === "unlocked" || status === "completed") {
        if (i > highestOpenedStageIndex) {
          highestOpenedStageIndex = i;
        }
        break;
      }
    }
  }

  const highestOpenedStageId = STAGE_IDS[highestOpenedStageIndex];
  const completedHighestStageCount = students.data.filter(s => s.progress[highestOpenedStageId]?.status === "completed").length;

  const remedial = students.data.reduce((total, student) => total + STAGE_IDS.filter((id) => isRemedial(student.progress[id])).length, 0);
  const activeQuestionsLabel = "Lihat bank soal";
  const activities = students.data.flatMap((student) => STAGE_IDS.flatMap((stageId) => {
    const progress = student.progress[stageId];
    return progress?.updatedAt ? [{ student, stageId, progress }] : [];
  })).sort((a, b) => (b.progress.updatedAt?.toDate?.().getTime() ?? 0) - (a.progress.updatedAt?.toDate?.().getTime() ?? 0)).slice(0, 6);

  return (
    <div>
      <PageHeader eyebrow="Ringkasan" title="Dashboard" description="Pantau siswa, penyelesaian stage, remedial, dan aktivitas progress terbaru." action={<Button asChild className="h-11 rounded-xl"><Link href="/dashboard/soal/tambah">Tambah Soal</Link></Button>} />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Jumlah Siswa" value={students.data.length} tone="indigo" />
        <StatCard icon={CheckCircle2} label={`Selesai Stage ${highestOpenedStageIndex + 1}`} value={`${completedHighestStageCount}/${students.data.length}`} tone="green" />
        <StatCard icon={RefreshCcw} label="Perlu Remedial" value={remedial} tone="amber" />
        <StatCard icon={BookOpenCheck} label="Bank Soal" value={activeQuestionsLabel} tone="slate" isText />
      </div>

      {!students.data.length ? (
        <ResourceEmpty title="Belum ada siswa terdaftar" description="Tambahkan siswa melalui menu Data Siswa atau aplikasi Android guru." action={<Button asChild variant="outline"><Link href="/dashboard/siswa">Buka Data Siswa</Link></Button>} />
      ) : (
        <Card className="mt-6 rounded-2xl border bg-white shadow-sm">
          <CardHeader><CardTitle className="text-lg">Aktivitas progress terbaru</CardTitle></CardHeader>
          <CardContent>
            {activities.length ? <div className="space-y-3">{activities.map(({ student, stageId, progress }) => (
              <div key={`${student.id}-${stageId}`} className="flex flex-col gap-3 rounded-xl border p-4 transition-all duration-150 ease-out hover:bg-muted/40 hover:border-border/90 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="truncate text-sm font-bold">{student.namaLengkap}</p><p className="mt-1 text-xs text-muted-foreground">Stage {stageId.replace("stage", "")} • Skor {progress.skor} • {formatDate(progress.updatedAt)}</p></div>
                <StatusBadge status={progress.status} />
              </div>
            ))}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas progress terbaru.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, isText = false }: { icon: typeof Users; label: string; value: number | string; tone: "indigo" | "green" | "amber" | "slate"; isText?: boolean }) {
  const toneClass = { indigo: "bg-[#eeeafd] text-primary", green: "bg-[#edf6ee] text-[#1b5e20]", amber: "bg-[#fff4dd] text-[#9a6514]", slate: "bg-slate-100 text-slate-700" }[tone];
  return (
    <Card className="min-w-0 rounded-2xl border bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-[#cfc8fb]">
      <CardContent className="p-4 sm:p-5">
        <div className={`grid size-10 place-items-center rounded-xl ${toneClass}`}><Icon className="size-5" /></div>
        <p className={`${isText ? "text-sm" : "text-2xl"} mt-4 break-words font-bold`}>{value}</p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}
