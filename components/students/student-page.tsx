"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search, Trash2 } from "lucide-react";
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
import { createStudent, deleteStudent } from "@/services/student-service";
import {
  STAGE_IDS,
  type AsyncState,
  type NewStudentInput,
  type Student,
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

function StudentPageContent({ students }: { students: AsyncState<Student[]> }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students.data;
    return students.data.filter((student) =>
      `${student.namaLengkap} ${student.username}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, students.data]);

  async function handleDelete(student: Student) {
    try {
      await deleteStudent(student.id);
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
      <div className="relative mt-6 max-w-xl">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau username..."
          className="h-12 rounded-xl bg-white pl-11"
        />
      </div>

      {students.loading ? (
        <ResourceSkeleton />
      ) : students.error ? (
        <ResourceError message={students.error} />
      ) : !filtered.length ? (
        <ResourceEmpty
          title={search ? "Siswa tidak ditemukan" : "Belum ada siswa terdaftar"}
          description={
            search
              ? "Coba gunakan kata kunci lain."
              : "Tambahkan siswa pertama tanpa membuat collection baru."
          }
          action={
            !search ? (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Tambah Siswa
              </Button>
            ) : undefined
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
      />
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function StudentCard({
  student,
  onDetail,
  onDelete,
}: {
  student: Student;
  onDetail: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <StudentAvatar
          jenisKelamin={student.jenisKelamin}
          name={student.namaLengkap}
        />
        <div className="min-w-0">
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
                <div className="min-w-0 pt-1">
                  <DialogTitle>{displayStudent.namaLengkap}</DialogTitle>
                  <DialogDescription className="mt-2">
                    @{displayStudent.username} • PIN {displayStudent.pin} • {displayStudent.usia} tahun •{" "}
                    {displayStudent.jenisKelamin || "Jenis kelamin tidak diketahui"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {STAGE_IDS.map((stageId) => {
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
              })}
            </div>
          </>
        )}
        <DialogFooter showCloseButton />
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
                  max={9}
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
