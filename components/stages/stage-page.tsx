"use client";

import { useEffect, useState } from "react";
import { Lock, Pencil, Plus, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ResourceEmpty,
  ResourceError,
  ResourceSkeleton,
} from "@/components/dashboard/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudents } from "@/hooks/use-students";
import { calculateNextStageNumber } from "@/lib/domain/business-rules";
import {
  countStageStatuses,
  getStageAudienceState,
} from "@/lib/domain/ui-rules";
import {
  addStage,
  DEFAULT_STAGE_ITEMS,
  deleteStage,
  getStages,
  setStageForAllStudents,
  updateStage,
} from "@/services/stage-service";
import { useAuth } from "@/components/auth/auth-provider";
import type { User } from "firebase/auth";
import type { AsyncState, StageId, StageItem, Student } from "@/types/sieja";

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
  stagesOverride,
}: {
  studentsOverride?: AsyncState<Student[]>;
  stagesOverride?: StageItem[];
} = {}) {
  if (studentsOverride) {
    return (
      <StagePageContent
        students={studentsOverride}
        stagesOverride={stagesOverride}
      />
    );
  }
  return <LiveStagePage />;
}

function LiveStagePage() {
  const students = useStudents();
  const { user } = useAuth();
  return <StagePageContent students={students} currentUser={user} />;
}

function StagePageContent({
  students,
  stagesOverride,
  currentUser,
}: {
  students: AsyncState<Student[]>;
  stagesOverride?: StageItem[];
  currentUser?: User | null;
}) {
  const [stages, setStages] = useState<StageItem[]>(
    stagesOverride ?? DEFAULT_STAGE_ITEMS,
  );
  const [pending, setPending] = useState<StageId | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageItem | null>(null);

  useEffect(() => {
    if (stagesOverride) {
      setStages(stagesOverride);
      return;
    }
    let isMounted = true;
    getStages().then((loaded) => {
      if (isMounted) setStages(loaded);
    });
    return () => {
      isMounted = false;
    };
  }, [stagesOverride]);

  async function refreshStages() {
    try {
      const reloaded = await getStages();
      setStages(reloaded);
    } catch {
      // Abaikan jika reload gagal
    }
  }

  async function changeStage(stageId: StageId, status: "locked" | "unlocked") {
    setPending(stageId);
    try {
      const changed = await setStageForAllStudents(stageId, status);
      toast.success(`${changed} data siswa berhasil diperbarui.`);
      await refreshStages();
    } catch {
      toast.error("Status stage gagal diperbarui. Coba kembali.");
    } finally {
      setPending(null);
    }
  }

  async function handleDeleteStage(stageId: StageId, stageName: string) {
    try {
      await deleteStage(stageId);
      toast.success(`${stageName} berhasil dihapus.`);
      await refreshStages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus stage.";
      toast.error(msg);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Akses pembelajaran"
        title="Kelola Stage"
        description="Guru menentukan izin stage. Skor tidak pernah digunakan sebagai syarat unlock."
        action={
          <Button
            onClick={() => setAddOpen(true)}
            className="h-11 w-full rounded-xl sm:w-auto"
          >
            <Plus className="size-4" />
            Tambah Stage
          </Button>
        }
      />
      <div className="mt-5 rounded-2xl border border-[#d8d2fb] bg-[#f6f4fd] p-4 text-sm leading-6 text-[#493ebc]">
        Stage 2 ke atas tetap memerlukan stage sebelumnya berstatus <strong>completed</strong> pada
        aplikasi siswa, meskipun sudah dibuka guru. Stage baru otomatis berstatus terkunci secara default.
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
          {stages.map((stage) => {
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        {stage.nama || `Stage ${stage.number}`}
                      </p>
                      {stage.number <= 6 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          Bawaan
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-xl font-bold">Huruf {stage.range}</h2>
                    <Badge
                      variant="outline"
                      className={`mt-3 rounded-full px-3 py-1 ${audience.badgeClass}`}
                    >
                      {audience.label}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eeeafd] text-lg font-bold text-primary">
                      {stage.number}
                    </span>
                    {stage.number > 6 && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          onClick={() => setEditingStage(stage)}
                          title="Edit Stage"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <ConfirmActionDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                              title="Hapus Stage"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          }
                          title={`Hapus ${stage.nama || `Stage ${stage.number}`}?`}
                          description={`Apakah Anda yakin ingin menghapus ${stage.nama || `Stage ${stage.number}`} (Huruf ${stage.range})? Stage ini akan dihapus dari sistem dan progress siswa yang terkait akan dibersihkan. Tindakan ini tidak dapat dibatalkan.`}
                          actionLabel="Hapus Stage"
                          destructive
                          onConfirm={() =>
                            handleDeleteStage(
                              stage.id as StageId,
                              stage.nama || `Stage ${stage.number}`,
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
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

      <AddStageDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingNumbers={stages.map((s) => s.number)}
        currentUser={currentUser}
        onStageCreated={async () => {
          await refreshStages();
        }}
      />

      <EditStageDialog
        open={Boolean(editingStage)}
        onOpenChange={(open) => {
          if (!open) setEditingStage(null);
        }}
        stage={editingStage}
        onStageUpdated={async () => {
          await refreshStages();
        }}
      />
    </div>
  );
}

function AddStageDialog({
  open,
  onOpenChange,
  existingNumbers,
  currentUser,
  onStageCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNumbers: number[];
  currentUser?: User | null;
  onStageCreated: () => void;
}) {
  const nextNumber = calculateNextStageNumber(existingNumbers);
  const [range, setRange] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setRange("");
    setAutoGenerate(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedRange = range.trim();
    if (!trimmedRange) {
      setError("Rentang huruf atau deskripsi materi tidak boleh kosong.");
      return;
    }

    if (!currentUser) {
      const msg = "Anda belum login sebagai Guru. Silakan login terlebih dahulu melalui menu Login Guru.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await addStage({
        range: trimmedRange,
        title: `Stage ${nextNumber}`,
        createdBy: currentUser.uid,
        autoGenerateQuestions: autoGenerate,
      });

      if (created.generatedQuestionsCount && created.generatedQuestionsCount > 0) {
        toast.success(
          `Stage ${created.number} berhasil ditambahkan beserta ${created.generatedQuestionsCount} paket soal default!`,
        );
      } else {
        toast.success(`Stage ${created.number} berhasil ditambahkan (Status awal: Terkunci).`);
      }

      resetForm();
      onOpenChange(false);
      onStageCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan stage.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) {
          if (!next) resetForm();
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Stage Baru</DialogTitle>
          <DialogDescription>
            Nomor urut otomatis berada di akhir urutan. Stage baru akan berstatus terkunci
            secara default hingga dibuka oleh guru.
          </DialogDescription>
        </DialogHeader>

        <form id="add-stage-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          {!currentUser && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <strong>Perhatian:</strong> Sesi login Guru tidak terdeteksi. Silakan{" "}
              <a href="/login-guru" className="font-bold underline hover:text-amber-950">
                Login sebagai Guru
              </a>{" "}
              terlebih dahulu agar memiliki hak akses menyimpan ke database Firebase.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="stage-number">Nomor Stage (Otomatis)</Label>
            <Input
              id="stage-number"
              disabled
              value={`Stage ${nextNumber}`}
              className="bg-slate-100 font-semibold text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stage-range">
              Rentang Huruf / Materi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stage-range"
              required
              placeholder="Contoh: A - Z, Huruf Vokal, atau Konsonan"
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
          </div>

          <div className="flex items-start space-x-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 transition-colors">
            <Checkbox
              id="auto-generate-questions"
              checked={autoGenerate}
              onCheckedChange={(checked) => setAutoGenerate(checked === true)}
              className="mt-0.5 border-indigo-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <div className="space-y-1">
              <Label
                htmlFor="auto-generate-questions"
                className="cursor-pointer text-sm font-semibold text-indigo-950"
              >
                Buat 10 Soal Default Otomatis (Rekomendasi)
              </Label>
              <p className="text-xs leading-relaxed text-indigo-700">
                Menghasilkan 10 soal dengan variasi acak dari 7 jenis mini-game (mudah, sedang, dan menantang) agar stage siap dimainkan siswa tanpa risiko kosong. Soal tetap dapat diedit di Bank Soal kapan saja.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <strong>Catatan:</strong> Stage {nextNumber} akan langsung berstatus <em>Terkunci</em> untuk
            seluruh siswa. Siswa baru dapat mengaksesnya jika guru membukanya dan siswa telah
            menyelesaikan Stage {nextNumber - 1}.
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Batal
          </Button>
          <Button type="submit" form="add-stage-form" disabled={saving || !currentUser}>
            {saving ? "Menyimpan..." : "Simpan Stage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditStageDialog({
  open,
  onOpenChange,
  stage,
  onStageUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: StageItem | null;
  onStageUpdated: () => void;
}) {
  const [nama, setNama] = useState("");
  const [range, setRange] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stage) {
      setNama(stage.nama || `Stage ${stage.number}`);
      setRange(stage.range || "");
      setError(null);
    }
  }, [stage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stage) return;

    const trimmedNama = nama.trim();
    const trimmedRange = range.trim();

    if (!trimmedNama) {
      setError("Nama stage tidak boleh kosong.");
      return;
    }
    if (!trimmedRange) {
      setError("Rentang huruf atau materi tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateStage(stage.id as StageId, {
        nama: trimmedNama,
        range: trimmedRange,
      });
      toast.success(`Stage ${stage.number} berhasil diperbarui.`);
      onStageUpdated();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui stage.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Stage {stage?.number}</DialogTitle>
          <DialogDescription>
            Perbarui nama stage atau rentang materi untuk Stage {stage?.number}.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-stage-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-stage-number">Nomor Stage</Label>
            <Input
              id="edit-stage-number"
              disabled
              value={`Stage ${stage?.number}`}
              className="bg-slate-100 font-semibold text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-stage-name">
              Nama Stage <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-stage-name"
              required
              placeholder="Contoh: Stage 7 atau Latihan Vokal"
              value={nama}
              onChange={(e) => {
                setNama(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-stage-range">
              Rentang Huruf / Materi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-stage-range"
              required
              placeholder="Contoh: A - Z, Huruf Vokal, atau Konsonan"
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" form="edit-stage-form" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
