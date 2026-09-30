"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ResourceEmpty,
  ResourceError,
  ResourceSkeleton,
} from "@/components/dashboard/resource-state";
import { Badge } from "@/components/ui/badge";
import { STAGE_DEFINITIONS } from "@/data/material-catalog";
import { useStudents } from "@/hooks/use-students";
import {
  countStageStatuses,
  getStageAudienceState,
} from "@/lib/domain/ui-rules";
import { setStageForAllStudents } from "@/services/stage-service";
import type { AsyncState, StageId, Student } from "@/types/sieja";

const AUDIENCE_PRESENTATION: Record<
  "open" | "locked",
  { label: string; badgeClass: string }
> = {
  open: {
    label: "Terbuka",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  locked: {
    label: "Terkunci",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

export function StagePage({
  studentsOverride,
}: {
  studentsOverride?: AsyncState<Student[]>;
} = {}) {
  if (studentsOverride) return <StagePageContent students={studentsOverride} />;
  return <LiveStagePage />;
}

function LiveStagePage() {
  const students = useStudents();
  return <StagePageContent students={students} />;
}

function StagePageContent({ students }: { students: AsyncState<Student[]> }) {
  const [pending, setPending] = useState<StageId | null>(null);

  async function changeStage(stageId: StageId, status: "locked" | "unlocked") {
    setPending(stageId);
    try {
      const changed = await setStageForAllStudents(stageId, status);
      toast.success(`${changed} data siswa berhasil diperbarui.`);
    } catch {
      toast.error("Status stage gagal diperbarui. Coba kembali.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Akses pembelajaran"
        title="Buka / Kunci Stage"
        description="Guru menentukan izin stage. Skor tidak pernah digunakan sebagai syarat unlock."
      />
      <div className="mt-5 rounded-2xl border border-[#d8d2fb] bg-[#f6f4fd] p-4 text-sm leading-6 text-[#493ebc]">
        Stage 2–6 tetap memerlukan stage sebelumnya berstatus <strong>completed</strong> pada
        aplikasi siswa, meskipun sudah dibuka guru.
      </div>

      {students.loading ? (
        <ResourceSkeleton cards={6} />
      ) : students.error ? (
        <ResourceError message={students.error} />
      ) : !students.data.length ? (
        <ResourceEmpty
          title="Belum ada siswa terdaftar"
          description="Aksi stage akan tersedia setelah data siswa ada."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {STAGE_DEFINITIONS.map((stage) => {
            const counts = countStageStatuses(students.data, stage.id);
            const audienceState = getStageAudienceState(counts, students.data.length);
            const isPending = pending === stage.id;
            const isOpen = audienceState !== "all-locked";
            const isLocked = audienceState === "all-locked";
            const audience = AUDIENCE_PRESENTATION[isLocked ? "locked" : "open"];

            return (
              <article key={stage.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      Stage {stage.number}
                    </p>
                    <h2 className="mt-2 text-xl font-bold">Huruf {stage.range}</h2>
                    <Badge
                      variant="outline"
                      className={`mt-3 rounded-full px-3 py-1 ${audience.badgeClass}`}
                    >
                      {audience.label}
                    </Badge>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eeeafd] text-lg font-bold text-primary">
                    {stage.number}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <Count label="Locked" value={counts.locked} tone="slate" />
                  <Count label="Unlocked" value={counts.unlocked} tone="indigo" />
                  <Count label="Completed" value={counts.completed} tone="green" />
                </div>

                <div className="mt-5">
                  <StageToggle
                    stageNumber={stage.number}
                    isOpen={isOpen}
                    isLocked={isLocked}
                    isPending={isPending}
                    onOpen={() => changeStage(stage.id, "unlocked")}
                    onLock={() => changeStage(stage.id, "locked")}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StageToggle({
  stageNumber,
  isOpen,
  isLocked,
  isPending,
  onOpen,
  onLock,
}: {
  stageNumber: number;
  isOpen: boolean;
  isLocked: boolean;
  isPending: boolean;
  onOpen: () => void;
  onLock: () => void;
}) {
  return (
    <div
      className={[
        "relative flex h-11 w-full items-center overflow-hidden rounded-xl border-2 transition-all duration-300",
        isOpen ? "border-emerald-400 bg-emerald-50" : "border-rose-400 bg-rose-50",
      ].join(" ")}
    >
      {/* Sliding indicator knob */}
      <div
        className={[
          "pointer-events-none absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg shadow-sm transition-all duration-300 ease-in-out",
          isOpen ? "left-[calc(50%+2px)] bg-emerald-500" : "left-1 bg-rose-500",
        ].join(" ")}
      />

      {/* Kunci side (left) */}
      <ConfirmActionDialog
        trigger={
          <button
            type="button"
            disabled={isPending || isLocked}
            className={[
              "relative z-10 flex h-full w-1/2 cursor-pointer items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-300",
              isLocked ? "text-white" : "text-rose-600 hover:text-rose-700",
              "disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <Lock className="size-3.5 shrink-0" />
            {isPending ? "..." : "Kunci"}
          </button>
        }
        title={`Kunci Stage ${stageNumber} untuk semua siswa?`}
        description={`Seluruh siswa akan mendapat skor 0 dan status locked pada Stage ${stageNumber}.${stageNumber === 1 ? " Ini membuat Stage 1 tidak dapat dimainkan sampai dibuka kembali." : ""}`}
        actionLabel="Ya, Kunci"
        destructive
        onConfirm={onLock}
      />

      {/* Buka side (right) */}
      <ConfirmActionDialog
        trigger={
          <button
            type="button"
            disabled={isPending || isOpen}
            className={[
              "relative z-10 flex h-full w-1/2 cursor-pointer items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-300",
              isOpen ? "text-white" : "text-emerald-700 hover:text-emerald-800",
              "disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <Unlock className="size-3.5 shrink-0" />
            {isPending ? "..." : "Buka"}
          </button>
        }
        title={`Buka Stage ${stageNumber} untuk semua siswa?`}
        description="Stage yang belum ada atau berstatus locked akan menjadi skor 0 dan status unlocked. Data completed tetap dipertahankan."
        actionLabel="Ya, Buka"
        onConfirm={onOpen}
      />
    </div>
  );
}

function Count({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "indigo" | "green";
}) {
  const classes = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-[#eeeafd] text-primary",
    green: "bg-[#edf6ee] text-[#1b5e20]",
  }[tone];

  return (
    <div className={`rounded-xl px-2 py-3 ${classes}`}>
      <strong className="block text-lg">{value}</strong>
      <span className="mt-1 block text-[10px] font-semibold">{label}</span>
    </div>
  );
}

