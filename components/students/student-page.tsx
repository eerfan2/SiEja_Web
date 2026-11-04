"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/dashboard/confirm-action-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ResourceEmpty,
  ResourceError,
  ResourceSkeleton,
} from "@/components/dashboard/resource-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
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
import { calculateStars, defaultStageStatus } from "@/lib/domain/business-rules";
import { getDominantAgeInfo } from "@/lib/domain/ui-rules";
import {
  createStudent,
  deleteStudent,
  updateStudent,
} from "@/services/student-service";
import {
  STAGE_IDS,
  type AsyncState,
  type NewStudentInput,
  type Student,
  type UpdateStudentInput,
} from "@/types/sieja";

export function StudentPage({
  studentsOverride,
}: {
  studentsOverride?: AsyncState<Student[]>;
} = {}) {
  if (studentsOverride) return <StudentPageContent students={studentsOverride} />;
  return <LiveStudentPage />;
}

function LiveStudentPage() {
  const students = useStudents();
  return <StudentPageContent students={students} />;
}

type StudentStatFilter = "all" | "laki-laki" | "perempuan" | "dominant-age";

function StudentPageContent({ students }: { students: AsyncState<Student[]> }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [statFilter, setStatFilter] = useState<StudentStatFilter>("all");

  const maleCount = useMemo(
    () => students.data.filter((s) => s.jenisKelamin?.toLowerCase() === "laki-laki").length,
    [students.data],
  );

  const femaleCount = useMemo(
    () => students.data.filter((s) => s.jenisKelamin?.toLowerCase() === "perempuan").length,
    [students.data],
  );

  const { dominantAgeLabel, dominantAges } = useMemo(
    () => getDominantAgeInfo(students.data),
    [students.data],
  );

  const filtered = useMemo(() => {
    let result = students.data;

    // Filter berdasarkan kartu statistik yang diklik
    if (statFilter === "laki-laki") {
      result = result.filter((s) => s.jenisKelamin?.toLowerCase() === "laki-laki");
    } else if (statFilter === "perempuan") {
      result = result.filter((s) => s.jenisKelamin?.toLowerCase() === "perempuan");
    } else if (statFilter === "dominant-age") {
      result = result.filter((s) => typeof s.usia === "number" && dominantAges.includes(s.usia));
    }

    // Filter teks pencarian nama / username
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter((student) =>
        `${student.namaLengkap} ${student.username}`
          .toLowerCase()
          .includes(term),
      );
    }

    return result;
  }, [dominantAges, search, statFilter, students.data]);

  async function handleDelete(student: Student) {
    try {
      await deleteStudent(student.id, student);
      toast.success(`${student.namaLengkap} berhasil dihapus.`);
    } catch {
      toast.error("Gagal menghapus siswa. Coba kembali.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Manajemen siswa"
        title="Data Siswa"
        description="Lihat akun, identitas, dan ringkasan progress siswa dari collection siswa."
        action={
          <Button
            onClick={() => setAddOpen(true)}
            className="h-11 w-full rounded-xl sm:w-auto"
          >
            <Plus className="size-4" />
            Tambah Siswa
          </Button>
        }
      />

      {students.data.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatFilter("all")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setStatFilter("all");
              }
            }}
            className={[
              "group flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm transition-all duration-200 cursor-pointer select-none",
              "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:scale-[0.98]",
              statFilter === "all" ? "ring-2 ring-primary ring-offset-2 border-primary bg-[#faf9ff]" : "",
            ].join(" ")}
            title="Klik untuk menampilkan semua siswa"
          >
            <div
              style={{ animationDelay: "0s" }}
              className="grid size-11 place-items-center rounded-2xl bg-[#eeeafd] text-primary shadow-sm shadow-indigo-100/60 animate-breathe-glow"
            >
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Siswa</p>
              <p className="text-lg font-bold text-foreground">{students.data.length}</p>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatFilter(statFilter === "laki-laki" ? "all" : "laki-laki")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setStatFilter(statFilter === "laki-laki" ? "all" : "laki-laki");
              }
            }}
            className={[
              "group flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm transition-all duration-200 cursor-pointer select-none",
              "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:scale-[0.98]",
              statFilter === "laki-laki" ? "ring-2 ring-primary ring-offset-2 border-primary bg-[#faf9ff]" : "",
            ].join(" ")}
            title="Klik untuk memfilter siswa laki-laki"
          >
            <StudentAvatar jenisKelamin="laki-laki" name="Laki-laki" size="sm" animate />
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Laki-laki</p>
              <p className="text-lg font-bold text-foreground">
                {maleCount}
              </p>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatFilter(statFilter === "perempuan" ? "all" : "perempuan")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setStatFilter(statFilter === "perempuan" ? "all" : "perempuan");
              }
            }}
            className={[
              "group flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm transition-all duration-200 cursor-pointer select-none",
              "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:scale-[0.98]",
              statFilter === "perempuan" ? "ring-2 ring-primary ring-offset-2 border-primary bg-[#faf9ff]" : "",
            ].join(" ")}
            title="Klik untuk memfilter siswa perempuan"
          >
            <StudentAvatar jenisKelamin="perempuan" name="Perempuan" size="sm" animate />
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Perempuan</p>
              <p className="text-lg font-bold text-foreground">
                {femaleCount}
              </p>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatFilter(statFilter === "dominant-age" ? "all" : "dominant-age")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setStatFilter(statFilter === "dominant-age" ? "all" : "dominant-age");
              }
            }}
            className={[
              "group flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm transition-all duration-200 cursor-pointer select-none",
              "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:scale-[0.98]",
              statFilter === "dominant-age" ? "ring-2 ring-primary ring-offset-2 border-primary bg-[#faf9ff]" : "",
            ].join(" ")}
            title={`Klik untuk memfilter siswa usia rata-rata (${dominantAgeLabel})`}
          >
            <div
              style={{ animationDelay: "0.9s" }}
              className="grid size-11 place-items-center rounded-2xl bg-[#fff4dd] text-[#9a6514] shadow-sm shadow-amber-100/60 animate-breathe-glow"
            >
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Rata-rata Usia</p>
              <p className="text-lg font-bold text-foreground">
                {dominantAgeLabel}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau username..."
            className="h-12 rounded-xl bg-white pl-11"
          />
        </div>
        {statFilter !== "all" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter aktif:</span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              {statFilter === "laki-laki" && "Siswa Laki-laki"}
              {statFilter === "perempuan" && "Siswa Perempuan"}
              {statFilter === "dominant-age" && `Usia Rata-rata (${dominantAgeLabel})`}
              <button
                type="button"
                onClick={() => setStatFilter("all")}
                className="ml-1 rounded-full p-0.5 hover:bg-indigo-100 active:scale-90"
                title="Hapus filter"
                aria-label="Hapus filter"
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </div>

      {students.loading ? (
        <ResourceSkeleton />
      ) : students.error ? (
        <ResourceError message={students.error} />
      ) : !filtered.length ? (
        <ResourceEmpty
          title={
            search.trim() || statFilter !== "all"
              ? "Siswa tidak ditemukan"
              : "Belum ada siswa terdaftar"
          }
          description={
            search.trim() || statFilter !== "all"
              ? "Coba sesuaikan kata kunci pencarian atau filter kartu yang dipilih."
              : "Tambahkan siswa pertama tanpa membuat collection baru."
          }
          action={
            search.trim() || statFilter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatFilter("all");
                }}
              >
                Reset Filter
              </Button>
            ) : (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Tambah Siswa
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:hidden">
            {filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onDetail={() => setSelected(student)}
                onEdit={() => setEditTarget(student)}
                onDelete={() => handleDelete(student)}
              />
            ))}
          </div>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead>Usia</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StudentAvatar
                          jenisKelamin={student.jenisKelamin}
                          name={student.namaLengkap}
                          size="sm"
                        />
                        <span className="font-semibold">{student.namaLengkap}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>
                      <span className="font-mono font-medium tracking-wider text-muted-foreground">
                        {student.pin}
                      </span>
                    </TableCell>
                    <TableCell>{student.usia} tahun</TableCell>
                    <TableCell>{student.jenisKelamin || "Tidak diketahui"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(student)}
                        >
                          <Eye className="size-4" />
                          Detail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditTarget(student)}
                          aria-label={`Edit ${student.namaLengkap}`}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <ConfirmActionDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Hapus ${student.namaLengkap}`}
                              className="text-destructive hover:bg-red-50 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          }
                          title="Hapus siswa?"
                          description={`Data ${student.namaLengkap} beserta seluruh progress akan dihapus dan tidak dapat dikembalikan.`}
                          actionLabel="Hapus Siswa"
                          destructive
                          onConfirm={() => handleDelete(student)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <StudentDetailDialog
        student={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onEdit={(student) => setEditTarget(student)}
      />
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditStudentDialog
        student={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  );
}

function StudentCard({
  student,
  onDetail,
  onEdit,
  onDelete,
}: {
  student: Student;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <StudentAvatar
          jenisKelamin={student.jenisKelamin}
          name={student.namaLengkap}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold">{student.namaLengkap}</h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            @{student.username} • PIN {student.pin}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-3 text-xs">
        <div>
          <span className="block text-muted-foreground">Usia</span>
          <strong className="mt-1 block">{student.usia} tahun</strong>
        </div>
        <div>
          <span className="block text-muted-foreground">Jenis kelamin</span>
          <strong className="mt-1 block">{student.jenisKelamin || "Tidak diketahui"}</strong>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onDetail}>
          <Eye className="size-4" />
          Detail
        </Button>
        <Button variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <ConfirmActionDialog
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Hapus ${student.namaLengkap}`}
              className="text-destructive hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          }
          title="Hapus siswa?"
          description={`Data ${student.namaLengkap} beserta seluruh progress akan dihapus dan tidak dapat dikembalikan.`}
          actionLabel="Hapus Siswa"
          destructive
          onConfirm={onDelete}
        />
      </div>
    </article>
  );
}

function StudentDetailDialog({
  student,
  onOpenChange,
  onEdit,
}: {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (student: Student) => void;
}) {
  const [displayStudent, setDisplayStudent] = useState<Student | null>(student);

  useEffect(() => {
    if (student) setDisplayStudent(student);
  }, [student]);

  return (
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        {displayStudent && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 text-left">
                <StudentAvatar
                  jenisKelamin={displayStudent.jenisKelamin}
                  name={displayStudent.namaLengkap}
                  size="lg"
                />
                <div className="min-w-0 flex-1 pt-1">
                  <DialogTitle>{displayStudent.namaLengkap}</DialogTitle>
                  <DialogDescription className="mt-2">
                    @{displayStudent.username} • PIN {displayStudent.pin} • {displayStudent.usia} tahun •{" "}
                    {displayStudent.jenisKelamin || "Jenis kelamin tidak diketahui"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {(() => {
                const modalStageIds = Array.from(
                  new Set([
                    ...STAGE_IDS,
                    ...Object.keys(displayStudent.progress || {}).filter((k) =>
                      /^stage[1-9][0-9]*$/.test(k),
                    ),
                  ]),
                ).sort((a, b) => {
                  const numA = Number(a.replace("stage", "")) || 0;
                  const numB = Number(b.replace("stage", "")) || 0;
                  return numA - numB;
                });

                return modalStageIds.map((stageId) => {
                  const progress = displayStudent.progress[stageId];
                  const status = progress?.status ?? defaultStageStatus(stageId);
                  const score = progress?.skor ?? 0;
                  return (
                    <div key={stageId} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold">
                          Stage {stageId.replace("stage", "")}
                        </h3>
                        <StatusBadge status={status} />
                      </div>
                      <p className="mt-3 text-sm">
                        Skor <strong>{score}</strong> • {calculateStars(score)} bintang
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          </>
        )}
        <DialogFooter showCloseButton>
          {displayStudent && onEdit && (
            <Button
              variant="default"
              onClick={() => {
                const s = displayStudent;
                onOpenChange(false);
                onEdit(s);
              }}
            >
              <Pencil className="size-4" />
              Edit Data Siswa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddStudentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<NewStudentInput>({
    namaLengkap: "",
    username: "",
    usia: 5,
    jenisKelamin: "Laki-laki",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setPin(null);
    try {
      const generated = await createStudent(form);
      setPin(generated);
      toast.success("Siswa berhasil ditambahkan.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Gagal menambahkan siswa.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpen(next: boolean) {
    if (!next) {
      setForm({
        namaLengkap: "",
        username: "",
        usia: 5,
        jenisKelamin: "Laki-laki",
      });
      setError(null);
      setPin(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Siswa</DialogTitle>
          <DialogDescription>
            Data disimpan ke collection siswa. PIN terkecil yang belum digunakan akan dibuat
            otomatis.
          </DialogDescription>
        </DialogHeader>
        {pin ? (
          <Alert className="border-green-200 bg-green-50">
            <AlertTitle>Siswa berhasil ditambahkan</AlertTitle>
            <AlertDescription className="mt-2">
              PIN siswa: <strong className="text-lg tracking-widest">{pin}</strong>. Catat PIN
              sebelum menutup dialog.
            </AlertDescription>
          </Alert>
        ) : (
          <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Nama lengkap</Label>
              <Input
                id="student-name"
                required
                minLength={2}
                value={form.namaLengkap}
                onChange={(event) => setForm({ ...form, namaLengkap: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-username">Username unik</Label>
              <Input
                id="student-username"
                required
                minLength={2}
                autoCapitalize="none"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student-age">Usia</Label>
                <Input
                  id="student-age"
                  required
                  type="number"
                  min={3}
                  max={12}
                  value={form.usia}
                  onChange={(event) => setForm({ ...form, usia: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Jenis kelamin</Label>
                <Select
                  value={form.jenisKelamin}
                  onValueChange={(value) => setForm({ ...form, jenisKelamin: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
          </form>
        )}
        <DialogFooter>
          {pin ? (
            <Button onClick={() => handleOpen(false)}>Selesai</Button>
          ) : (
            <Button type="submit" form="student-form" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Siswa"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditStudentDialog({
  student,
  onOpenChange,
}: {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<UpdateStudentInput>({
    namaLengkap: "",
    username: "",
    pin: "",
    usia: 5,
    jenisKelamin: "Laki-laki",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setForm({
        namaLengkap: student.namaLengkap,
        username: student.username,
        pin: student.pin,
        usia: student.usia,
        jenisKelamin:
          student.jenisKelamin?.toLowerCase() === "perempuan"
            ? "Perempuan"
            : "Laki-laki",
      });
      setError(null);
    }
  }, [student]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student) return;

    setSaving(true);
    setError(null);

    try {
      await updateStudent(student.id, form, student);
      toast.success(`Data ${form.namaLengkap} berhasil diperbarui.`);
      onOpenChange(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Gagal memperbarui data siswa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Data Siswa</DialogTitle>
          <DialogDescription>
            Perbarui data profil siswa. Progress belajar akan tetap utuh dan pemetaan login
            disinkronkan secara aman.
          </DialogDescription>
        </DialogHeader>

        {student && (
          <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-student-name">Nama lengkap</Label>
              <Input
                id="edit-student-name"
                required
                minLength={2}
                value={form.namaLengkap}
                onChange={(event) =>
                  setForm({ ...form, namaLengkap: event.target.value })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-student-username">Username unik</Label>
                <Input
                  id="edit-student-username"
                  required
                  minLength={2}
                  autoCapitalize="none"
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-student-pin">PIN Masuk (3 Digit)</Label>
                <Input
                  id="edit-student-pin"
                  required
                  pattern="[0-9]{3}"
                  maxLength={3}
                  placeholder="001"
                  value={form.pin}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      pin: event.target.value.replace(/\D/g, "").slice(0, 3),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-student-age">Usia</Label>
                <Input
                  id="edit-student-age"
                  required
                  type="number"
                  min={3}
                  max={12}
                  value={form.usia}
                  onChange={(event) =>
                    setForm({ ...form, usia: Number(event.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis kelamin</Label>
                <Select
                  value={form.jenisKelamin}
                  onValueChange={(value) =>
                    setForm({ ...form, jenisKelamin: value })
                  }
                >
                  <SelectTrigger id="edit-student-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </form>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="edit-student-form"
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
