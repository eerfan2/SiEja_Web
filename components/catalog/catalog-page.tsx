"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderArchive,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Music,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ResourceEmpty,
  ResourceError,
  ResourceSkeleton,
} from "@/components/dashboard/resource-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateInitialLetter,
  formatCatalogWord,
  formatDate,
  normalizeWord,
  validateAudioFile,
  validateCatalogInput,
  validateImageFile,
} from "@/lib/domain/business-rules";
import {
  createCatalogItem,
  deleteCatalogItem,
  getCatalogItems,
  toggleCatalogStatus,
  updateCatalogItem,
} from "@/services/catalog-service";
import type {
  AsyncState,
  CreateCatalogInput,
  MaterialCatalogItem,
  UpdateCatalogInput,
} from "@/types/sieja";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function CatalogPage({
  catalogOverride,
}: {
  catalogOverride?: AsyncState<MaterialCatalogItem[]>;
} = {}) {
  const [state, setState] = useState<AsyncState<MaterialCatalogItem[]>>(
    catalogOverride || { data: [], loading: true, error: null },
  );

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterLetter, setFilterLetter] = useState<string>("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<MaterialCatalogItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MaterialCatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio preview helper untuk audio huruf lokal bawaan
  function playLetterAudio(letter: string) {
    try {
      const audio = new Audio(`/media/huruf-audio/${letter.toLowerCase()}.mp3`);
      audio.play().catch((err) => console.warn("Gagal memutar audio huruf:", err));
    } catch (e) {
      console.warn("Audio tidak didukung:", e);
    }
  }

  async function loadData() {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const items = await getCatalogItems();
      setState({ data: items, loading: false, error: null });
    } catch (err: any) {
      setState({
        data: [],
        loading: false,
        error: err?.message || "Gagal memuat katalog materi.",
      });
    }
  }

  useEffect(() => {
    if (!catalogOverride) {
      loadData();
    }
  }, [catalogOverride]);

  const filteredItems = useMemo(() => {
    return state.data.filter((item) => {
      const matchesSearch =
        item.word.toLowerCase().includes(search.toLowerCase()) ||
        item.initialLetter.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "active"
            ? item.isActive
            : !item.isActive;

      const matchesLetter =
        filterLetter === "all" ? true : item.initialLetter === filterLetter;

      return matchesSearch && matchesStatus && matchesLetter;
    });
  }, [state.data, search, filterStatus, filterLetter]);

  const activeCount = useMemo(
    () => state.data.filter((i) => i.isActive).length,
    [state.data],
  );

  async function handleToggleStatus(item: MaterialCatalogItem, newStatus: boolean) {
    try {
      await toggleCatalogStatus(item.id, newStatus);
      setState((prev) => ({
        ...prev,
        data: prev.data.map((i) => (i.id === item.id ? { ...i, isActive: newStatus } : i)),
      }));
      toast.success(
        `Materi "${item.word}" berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui status materi.");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteItem) return;
    setIsSubmitting(true);
    try {
      await deleteCatalogItem(deleteItem.id, deleteItem);
      setState((prev) => ({
        ...prev,
        data: prev.data.filter((i) => i.id !== deleteItem.id),
      }));
      toast.success(`Materi "${deleteItem.word}" berhasil dihapus.`);
      setDeleteItem(null);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus materi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog Materi"
        title="Katalog Materi Dinamis"
        description="Kelola kata, gambar objek, audio pelafalan kata, dan audio huruf bawaan untuk pembelajaran siswa."
        action={
          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary shadow-sm hover:bg-primary/90"
          >
            <Plus className="size-4" /> Tambah Materi
          </Button>
        }
      />

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Materi
          </p>
          <p className="mt-2 text-2xl font-bold">{state.data.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Koleksi cloud & lokal</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Materi Aktif
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p>
          <p className="mt-1 text-xs text-emerald-600">Dapat digunakan dalam soal</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Materi Nonaktif
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {state.data.length - activeCount}
          </p>
          <p className="mt-1 text-xs text-amber-600">Tidak dimunculkan pada kuis</p>
        </div>
      </div>

      {/* Filter dan Pencarian */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kata atau huruf awal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus}
            onValueChange={(val: any) => setFilterStatus(val)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif Saja</SelectItem>
              <SelectItem value="inactive">Nonaktif Saja</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterLetter}
            onValueChange={(val) => setFilterLetter(val)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Huruf" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Huruf</SelectItem>
              {ALPHABET.map((char) => (
                <SelectItem key={char} value={char}>
                  Huruf {char}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Data Katalog */}
      {state.loading ? (
        <ResourceSkeleton />
      ) : state.error ? (
        <ResourceError
          message={state.error}
        />
      ) : filteredItems.length === 0 ? (
        <ResourceEmpty
          title="Belum Ada Materi"
          description={
            search || filterStatus !== "all" || filterLetter !== "all"
              ? "Tidak ada materi yang cocok dengan filter pencarian."
              : "Belum ada materi katalog dinamis yang ditambahkan. Klik tombol 'Tambah Materi' untuk memulai."
          }
          action={
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="size-4" /> Tambah Materi Baru
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Gambar</TableHead>
                <TableHead>Nama Kata</TableHead>
                <TableHead className="w-24 text-center">Huruf Awal</TableHead>
                <TableHead className="w-32 text-center">Audio Huruf</TableHead>
                <TableHead>Audio Kata</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-32 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  {/* Gambar */}
                  <TableCell>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.word}
                        className="size-14 rounded-xl border bg-muted object-contain p-1"
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                        <ImageIcon className="size-6 opacity-40" />
                      </div>
                    )}
                  </TableCell>

                  {/* Kata */}
                  <TableCell>
                    <div className="font-bold tracking-wide text-foreground">
                      {item.word}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Diperbarui: {formatDate(item.updatedAt)}
                    </div>
                  </TableCell>

                  {/* Huruf Awal */}
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono text-sm font-bold">
                      {item.initialLetter}
                    </Badge>
                  </TableCell>

                  {/* Audio Huruf */}
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => playLetterAudio(item.letterAudioId)}
                      title={`Putar audio huruf ${item.letterAudioId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      <Volume2 className="size-3.5" />
                      Huruf {item.letterAudioId}
                    </button>
                  </TableCell>

                  {/* Audio Kata */}
                  <TableCell>
                    {item.wordAudioUrl ? (
                      <audio
                        controls
                        src={item.wordAudioUrl}
                        className="h-9 w-48 sm:w-56"
                        preload="none"
                      />
                    ) : (
                      <span className="text-xs italic text-muted-foreground">
                        Tidak ada audio
                      </span>
                    )}
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(val) => handleToggleStatus(item, val)}
                        aria-label={`Ubah status ${item.word}`}
                      />
                      <span
                        className={`text-[10px] font-semibold ${
                          item.isActive ? "text-emerald-600" : "text-muted-foreground"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditItem(item)}
                        title="Edit materi"
                      >
                        <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteItem(item)}
                        title="Hapus materi"
                      >
                        <Trash2 className="size-4 text-rose-500 hover:text-rose-700" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal Tambah Materi */}
      {isAddOpen && (
        <CatalogFormDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          existingWords={state.data.map((i) => i.normalizedWord)}
          onSuccess={(newItem) => {
            setState((prev) => ({
              ...prev,
              data: [newItem, ...prev.data].sort((a, b) =>
                a.word.localeCompare(b.word),
              ),
            }));
            setIsAddOpen(false);
          }}
        />
      )}

      {/* Modal Edit Materi */}
      {editItem && (
        <CatalogFormDialog
          isOpen={Boolean(editItem)}
          onClose={() => setEditItem(null)}
          existingWords={state.data.map((i) => i.normalizedWord)}
          initialData={editItem}
          onSuccess={() => {
            loadData();
            setEditItem(null);
          }}
        />
      )}

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={Boolean(deleteItem)} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Materi Katalog</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              Apakah Anda yakin ingin menghapus materi &quot;{deleteItem?.word}&quot;? Berkas gambar dan audio terkait di cloud storage juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isSubmitting} onClick={handleDeleteConfirm}>
              {isSubmitting ? "Menghapus..." : "Hapus Materi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Komponen Form Tambah / Edit Materi Katalog Dinamis
 */
function CatalogFormDialog({
  isOpen,
  onClose,
  initialData,
  existingWords,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: MaterialCatalogItem;
  existingWords: string[];
  onSuccess: (item: MaterialCatalogItem) => void;
}) {
  const isEdit = Boolean(initialData);
  const { user: currentUser } = useAuth();

  const [word, setWord] = useState(initialData?.word || "");
  const [letterAudioId, setLetterAudioId] = useState(
    initialData?.letterAudioId || (initialData?.word ? initialData.word[0].toUpperCase() : "A"),
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Mode input media: "file" (unggah & simpan langsung) atau "url" (tautan web publik)
  const isInitialHttp =
    initialData?.imagePath?.startsWith("http") ||
    initialData?.wordAudioPath?.startsWith("http");
  const [mediaMode, setMediaMode] = useState<"file" | "url">(
    isInitialHttp ? "url" : "file",
  );

  // State untuk mode File
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // State untuk mode URL
  const [imageUrlInput, setImageUrlInput] = useState<string>(
    initialData?.imagePath?.startsWith("http") ? initialData.imagePath : "",
  );
  const [audioUrlInput, setAudioUrlInput] = useState<string>(
    initialData?.wordAudioPath?.startsWith("http") ? initialData.wordAudioPath : "",
  );

  // Preview state
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || "");
  const [audioPreview, setAudioPreview] = useState<string>(initialData?.wordAudioUrl || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Perbarui letterAudioId secara cerdas ketika user mengetik kata pertama kali (pada mode tambah)
  function handleWordChange(newWord: string) {
    setWord(newWord);
    if (!isEdit && newWord.trim().length > 0) {
      const firstChar = newWord.trim()[0].toUpperCase();
      if (/^[A-Z]$/.test(firstChar)) {
        setLetterAudioId(firstChar);
      }
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const errors = validateImageFile(file);
    if (errors.length > 0) {
      setErrorMsg(errors[0]);
      return;
    }

    setErrorMsg(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const errors = validateAudioFile(file);
    if (errors.length > 0) {
      setErrorMsg(errors[0]);
      return;
    }

    if (file.size > 600 * 1024) {
      setErrorMsg(
        "Ukuran audio untuk simpan langsung maksimal 600 KB agar muat di database cloud. Silakan gunakan rekaman pengucapan lebih pendek atau beralih ke mode 'Tautan URL'.",
      );
      return;
    }

    setErrorMsg(null);
    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
  }

  function playLetterAudio(letter: string) {
    try {
      const audio = new Audio(`/media/huruf-audio/${letter.toLowerCase()}.mp3`);
      audio.play().catch((err) => console.warn("Gagal memutar audio huruf:", err));
    } catch (e) {
      console.warn("Audio tidak didukung:", e);
    }
  }

  function testAudioUrl(url: string) {
    if (!url.trim()) {
      setErrorMsg("Masukkan URL audio terlebih dahulu.");
      return;
    }
    try {
      const audio = new Audio(url.trim());
      audio.play().catch((err) => {
        setErrorMsg("Gagal memutar audio dari tautan URL. Pastikan format audio didukung (MP3/WAV) dan tautan dapat diakses secara publik.");
      });
    } catch {
      setErrorMsg("Browser tidak dapat memutar audio dari tautan ini.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    // 1. Validasi kata & huruf
    const inputErrors = validateCatalogInput(
      { word, letterAudioId },
      existingWords,
      initialData?.normalizedWord,
    );
    if (inputErrors.length > 0) {
      setErrorMsg(inputErrors[0]);
      return;
    }

    // 2. Validasi media berdasarkan mode
    if (mediaMode === "file") {
      if (!isEdit) {
        if (!imageFile) {
          setErrorMsg("Gambar objek wajib dipilih dari perangkat.");
          return;
        }
        if (!audioFile) {
          setErrorMsg("Audio pengucapan kata wajib diunggah dari perangkat.");
          return;
        }
      }
    } else {
      // Mode URL
      if (!isEdit) {
        if (!imageUrlInput.trim()) {
          setErrorMsg("Tautan URL gambar wajib diisi.");
          return;
        }
        if (!audioUrlInput.trim()) {
          setErrorMsg("Tautan URL audio wajib diisi.");
          return;
        }
      }
      if (imageUrlInput.trim() && !imageUrlInput.trim().startsWith("http://") && !imageUrlInput.trim().startsWith("https://")) {
        setErrorMsg("Tautan gambar harus diawali dengan http:// atau https://");
        return;
      }
      if (audioUrlInput.trim() && !audioUrlInput.trim().startsWith("http://") && !audioUrlInput.trim().startsWith("https://")) {
        setErrorMsg("Tautan audio harus diawali dengan http:// atau https://");
        return;
      }
    }

    if (!currentUser) {
      setErrorMsg("Anda belum login sebagai Guru. Silakan login terlebih dahulu melalui menu Login Guru.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        const updateInput: UpdateCatalogInput = {
          word: word.trim(),
          letterAudioId: letterAudioId.trim().toUpperCase(),
          isActive,
        };

        const imageSource =
          mediaMode === "file" ? imageFile || undefined : imageUrlInput.trim() || undefined;
        const audioSource =
          mediaMode === "file" ? audioFile || undefined : audioUrlInput.trim() || undefined;

        await updateCatalogItem(
          initialData.id,
          updateInput,
          imageSource,
          audioSource,
        );

        toast.success(`Materi "${formatCatalogWord(word)}" berhasil diperbarui!`);
        onSuccess({
          ...initialData,
          word: formatCatalogWord(word),
          normalizedWord: normalizeWord(word),
          initialLetter: calculateInitialLetter(word),
          letterAudioId,
          isActive,
          imageUrl: imagePreview || initialData.imageUrl,
          wordAudioUrl: audioPreview || initialData.wordAudioUrl,
        });
      } else {
        const createInput: CreateCatalogInput = {
          word: word.trim(),
          letterAudioId: letterAudioId.trim().toUpperCase(),
          isActive,
        };

        const imageSource = mediaMode === "file" ? imageFile! : imageUrlInput.trim();
        const audioSource = mediaMode === "file" ? audioFile! : audioUrlInput.trim();

        const created = await createCatalogItem(
          createInput,
          imageSource,
          audioSource,
          currentUser.uid,
        );

        toast.success(`Materi "${created.word}" berhasil ditambahkan ke katalog!`);
        onSuccess(created);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat menyimpan materi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Materi Katalog" : "Tambah Materi Katalog Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui kata, gambar objek, atau audio pelafalan materi."
              : "Tambahkan kata baru beserta gambar dan rekaman suara untuk materi belajar siswa."}
          </DialogDescription>
        </DialogHeader>

        {!currentUser && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <strong>Perhatian:</strong> Sesi login Guru tidak terdeteksi. Silakan{" "}
            <a href="/login-guru" className="font-bold underline hover:text-amber-950">
              Login sebagai Guru
            </a>{" "}
            terlebih dahulu agar perubahan dapat tersimpan.
          </div>
        )}

        {errorMsg && (
          <Alert variant="destructive">
            <AlertTitle>Perhatian</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kata / Objek */}
          <div className="space-y-1.5">
            <Label htmlFor="catalog-word">Nama Kata / Objek</Label>
            <Input
              id="catalog-word"
              placeholder="Contoh: BOLA, JERAPAH, SEPATU"
              value={word}
              onChange={(e) => handleWordChange(e.target.value)}
              className="font-medium tracking-wide uppercase"
              required
            />
            {word.trim() && (
              <p className="text-xs text-muted-foreground">
                Huruf awal terdeteksi:{" "}
                <span className="font-bold text-primary">
                  {calculateInitialLetter(word)}
                </span>
              </p>
            )}
          </div>

          {/* Pilihan Audio Huruf Bawaan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="catalog-letter-audio">Audio Huruf Bawaan (A–Z)</Label>
              <button
                type="button"
                onClick={() => playLetterAudio(letterAudioId)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Play className="size-3" /> Tes Suara Huruf {letterAudioId}
              </button>
            </div>
            <Select
              value={letterAudioId}
              onValueChange={(val) => setLetterAudioId(val)}
            >
              <SelectTrigger id="catalog-letter-audio">
                <SelectValue placeholder="Pilih audio huruf" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {ALPHABET.map((char) => (
                  <SelectItem key={char} value={char}>
                    Suara Huruf {char}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Memetakan ke audio pelafalan huruf bawaan A–Z aplikasi (tidak perlu mengunggah ulang suara huruf).
            </p>
          </div>

          {/* Pilihan Mode Input Media */}
          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Metode Input Media (Gambar & Audio)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMediaMode("file")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                  mediaMode === "file"
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <UploadCloud className="size-4" />
                Unggah File Langsung
              </button>
              <button
                type="button"
                onClick={() => setMediaMode("url")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                  mediaMode === "url"
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <LinkIcon className="size-4" />
                Tautan / Link URL
              </button>
            </div>

            {mediaMode === "url" && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Tempelkan tautan URL gambar dan audio yang dapat diakses secara online.
              </p>
            )}
          </div>

          {/* Input Konten Berdasarkan Mode */}
          {mediaMode === "file" ? (
            <>
              {/* File Picker: Gambar Objek */}
              <div className="space-y-1.5">
                <Label htmlFor="catalog-image-file">
                  Gambar Objek {isEdit ? "(Opsional jika tidak diganti)" : "*"}
                </Label>
                <Input
                  id="catalog-image-file"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleImageChange}
                />
                <p className="text-[11px] text-muted-foreground">
                  Format: PNG, JPG, JPEG, atau WebP (Maksimal 5 MB).
                </p>
                {imagePreview && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border bg-muted/40 p-2">
                    <img
                      src={imagePreview}
                      alt="Pratinjau"
                      className="size-16 rounded-lg border bg-white object-contain p-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      Pratinjau gambar objek
                    </span>
                  </div>
                )}
              </div>

              {/* File Picker: Audio Pengucapan Kata */}
              <div className="space-y-1.5">
                <Label htmlFor="catalog-audio-file">
                  Audio Pengucapan Kata Utuh {isEdit ? "(Opsional jika tidak diganti)" : "*"}
                </Label>
                <Input
                  id="catalog-audio-file"
                  type="file"
                  accept=".mp3,.wav,.m4a,.ogg,.aac,.webm"
                  onChange={handleAudioChange}
                />
                <p className="text-[11px] text-muted-foreground">
                  Format: MP3, WAV, atau M4A (Maks. 600 KB untuk simpan langsung).
                </p>
                {audioPreview && (
                  <div className="mt-2 rounded-xl border bg-muted/40 p-2">
                    <audio controls src={audioPreview} className="w-full" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* URL Input: Gambar Objek */}
              <div className="space-y-1.5">
                <Label htmlFor="catalog-image-url">
                  Tautan URL Gambar Objek {isEdit ? "(Opsional jika tidak diganti)" : "*"}
                </Label>
                <Input
                  id="catalog-image-url"
                  type="url"
                  placeholder="https://contoh.com/gambar-bola.png"
                  value={imageUrlInput}
                  onChange={(e) => {
                    setImageUrlInput(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Masukkan link HTTPS gambar online (misal dari Imgur, Wikimedia, atau hosting Anda).
                </p>
                {imagePreview && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border bg-muted/40 p-2">
                    <img
                      src={imagePreview}
                      alt="Pratinjau"
                      className="size-16 rounded-lg border bg-white object-contain p-1"
                      onError={() => setErrorMsg("URL gambar tidak dapat dimuat. Pastikan URL valid dan dapat diakses publik.")}
                    />
                    <span className="text-xs text-muted-foreground">
                      Pratinjau gambar online
                    </span>
                  </div>
                )}
              </div>

              {/* URL Input: Audio Pengucapan Kata */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="catalog-audio-url">
                    Tautan URL Audio Kata {isEdit ? "(Opsional jika tidak diganti)" : "*"}
                  </Label>
                  {audioUrlInput.trim() && (
                    <button
                      type="button"
                      onClick={() => testAudioUrl(audioUrlInput)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Volume2 className="size-3" /> Tes Putar Audio
                    </button>
                  )}
                </div>
                <Input
                  id="catalog-audio-url"
                  type="url"
                  placeholder="https://contoh.com/suara-bola.mp3"
                  value={audioUrlInput}
                  onChange={(e) => {
                    setAudioUrlInput(e.target.value);
                    setAudioPreview(e.target.value);
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Masukkan link HTTPS audio online (format MP3/WAV/M4A).
                </p>
                {audioPreview && (
                  <div className="mt-2 rounded-xl border bg-muted/40 p-2">
                    <audio controls src={audioPreview} className="w-full" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Aktif */}
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <Label className="font-semibold">Aktifkan Materi</Label>
              <p className="text-xs text-muted-foreground">
                Materi aktif dapat digunakan langsung dalam bank soal dan arena permainan.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Status aktif"
            />
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !currentUser}
              className="rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan materi...
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Simpan Materi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
