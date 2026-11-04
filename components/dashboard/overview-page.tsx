"use client";

import Link from "next/link";
import { BookOpenCheck, CheckCircle2, RefreshCcw, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ResourceEmpty, ResourceError, ResourceSkeleton } from "@/components/dashboard/resource-state";
import { RemedialBadge, StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuestions } from "@/hooks/use-questions";
import { useStudents } from "@/hooks/use-students";
import { formatDate, isRemedial } from "@/lib/domain/business-rules";
import { STAGE_IDS } from "@/types/sieja";

export function OverviewPage() {
  const students = useStudents();
  const questions = useQuestions();

  if (students.loading) return <><PageHeader eyebrow="Ringkasan" title="Dashboard" description="Memuat ringkasan data SiEja dari Firestore." /><ResourceSkeleton cards={4} /></>;
  if (students.error) return <><PageHeader eyebrow="Ringkasan" title="Dashboard" description="Ringkasan pembelajaran siswa." /><ResourceError message={students.error} /></>;

  const allStageIds = Array.from(
    new Set([
      ...STAGE_IDS,
      ...students.data.flatMap((s) =>
        Object.keys(s.progress || {}).filter((k) => /^stage[1-9][0-9]*$/.test(k)),
      ),
    ]),
  ).sort((a, b) => {
    const numA = Number(a.replace("stage", "")) || 0;
    const numB = Number(b.replace("stage", "")) || 0;
    return numA - numB;
  });

  let highestOpenedStageIndex = 0;
  for (const student of students.data) {
    for (let i = allStageIds.length - 1; i >= 0; i--) {
      const status = student.progress[allStageIds[i]]?.status;
      if (status === "unlocked" || status === "completed") {
        if (i > highestOpenedStageIndex) {
          highestOpenedStageIndex = i;
        }
        break;
      }
    }
  }

  const highestOpenedStageId = allStageIds[highestOpenedStageIndex] || "stage1";
  const completedHighestStageCount = students.data.filter(s => s.progress[highestOpenedStageId]?.status === "completed").length;

  const remedial = students.data.reduce((total, student) => total + allStageIds.filter((id) => isRemedial(student.progress[id])).length, 0);
  const totalQuestions = questions.loading ? "..." : questions.data.length;
  const activities = students.data
    .flatMap((student) =>
      allStageIds.flatMap((stageId) => {
        const progress = student.progress[stageId];
        if (progress?.status === "completed") {
          return [{ student, stageId, progress }];
        }
        return [];
      }),
    )
    .sort((a, b) => (b.progress.updatedAt?.toDate?.().getTime() ?? 0) - (a.progress.updatedAt?.toDate?.().getTime() ?? 0))
    .slice(0, 6);

  return (
    <div>
      <PageHeader eyebrow="Ringkasan" title="Dashboard" description="Pantau siswa, penyelesaian stage, remedial, dan aktivitas progress terbaru." action={<Button asChild className="h-11 rounded-xl"><Link href="/dashboard/soal/tambah">Tambah Soal</Link></Button>} />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Jumlah Siswa" value={students.data.length} tone="indigo" delayIndex={0} href="/dashboard/siswa" />
        <StatCard icon={CheckCircle2} label={`Selesai Stage ${highestOpenedStageIndex + 1}`} value={`${completedHighestStageCount}/${students.data.length}`} tone="green" delayIndex={1} href="/dashboard/stage" />
        <StatCard icon={RefreshCcw} label="Perlu Remedial" value={remedial} tone="amber" delayIndex={2} href="/dashboard/remedial" />
        <StatCard icon={BookOpenCheck} label="Bank Soal" value={totalQuestions} tone="slate" delayIndex={3} href="/dashboard/soal" />
      </div>

      {!students.data.length ? (
        <ResourceEmpty title="Belum ada siswa terdaftar" description="Tambahkan siswa melalui menu Data Siswa atau aplikasi Android guru." action={<Button asChild variant="outline"><Link href="/dashboard/siswa">Buka Data Siswa</Link></Button>} />
      ) : (
        <Card className="mt-6 rounded-2xl border bg-white shadow-sm">
          <CardHeader><CardTitle className="text-lg">Aktivitas progress terbaru</CardTitle></CardHeader>
          <CardContent>
            {activities.length ? (
              <div className="space-y-3">
                {activities.map(({ student, stageId, progress }) => {
                  const remedial = isRemedial(progress);
                  const stageNum = stageId.replace("stage", "");
                  return (
                    <div
                      key={`${student.id}-${stageId}`}
                      className="flex flex-col gap-3 rounded-xl border p-4 transition-all duration-150 ease-out hover:bg-muted/40 hover:border-border/90 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {student.namaLengkap}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Menyelesaikan Stage {stageNum} • Skor {progress.skor} • {formatDate(progress.updatedAt)}
                        </p>
                      </div>
                      {remedial ? (
                        <RemedialBadge />
                      ) : (
                        <StatusBadge status="completed" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada aktivitas stage yang diselesaikan siswa.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  isText = false,
  delayIndex = 0,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  tone: "indigo" | "green" | "amber" | "slate";
  isText?: boolean;
  delayIndex?: number;
  href?: string;
}) {
  const toneClass = {
    indigo: "bg-[#eeeafd] text-primary shadow-indigo-100/60",
    green: "bg-[#edf6ee] text-[#1b5e20] shadow-emerald-100/60",
    amber: "bg-[#fff4dd] text-[#9a6514] shadow-amber-100/60",
    slate: "bg-slate-100 text-slate-700 shadow-slate-100/60",
  }[tone];

  const card = (
    <Card className="group h-full min-w-0 cursor-pointer rounded-2xl border bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md hover:border-[#cfc8fb]">
      <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
        <div>
          <div
            style={{ animationDelay: `${delayIndex * 0.4}s` }}
            className={`grid size-11 place-items-center rounded-2xl ${toneClass} animate-breathe-glow transition-all duration-300 group-hover:scale-115`}
          >
            <Icon className="size-5 transition-transform duration-300 group-hover:rotate-6" />
          </div>
          <p className={`${isText ? "text-sm" : "text-2xl"} mt-4 break-words font-bold tracking-tight text-foreground`}>
            {value}
          </p>
        </div>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-xs font-medium">
          {label}
        </p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full no-underline rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {card}
      </Link>
    );
  }

  return card;
}
