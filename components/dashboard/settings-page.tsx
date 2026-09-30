"use client";

import { useRouter } from "next/navigation";
import { Database, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutTeacher } from "@/services/auth-service";

export function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  async function logout() { await logoutTeacher(); router.replace("/login-guru"); }
  return <div><PageHeader eyebrow="Akun" title="Pengaturan" description="Lihat informasi sesi guru dan koneksi data yang digunakan dashboard." /><div className="mt-6 grid gap-4 lg:grid-cols-2"><Card className="rounded-2xl bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserRound className="size-5 text-primary" /> Akun Guru</CardTitle></CardHeader><CardContent><dl className="space-y-4 text-sm"><div><dt className="text-muted-foreground">Email Firebase</dt><dd className="mt-1 break-all font-semibold">{user?.email ?? "Tidak tersedia"}</dd></div><div><dt className="text-muted-foreground">UID</dt><dd className="mt-1 break-all font-mono text-xs">{user?.uid}</dd></div></dl><Button variant="outline" className="mt-6 text-destructive hover:bg-red-50 hover:text-destructive" onClick={logout}><LogOut className="size-4" /> Logout</Button></CardContent></Card><Card className="rounded-2xl bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Database className="size-5 text-primary" /> Sumber Data</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="rounded-xl border p-4"><p className="font-semibold">Firebase project</p><p className="mt-1 text-muted-foreground">sieja-app</p></div><div className="rounded-xl border p-4"><p className="font-semibold">Collection</p><p className="mt-1 text-muted-foreground">siswa dan soal</p></div><div className="flex gap-3 rounded-xl bg-[#edf6ee] p-4 text-[#245e2a]"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p className="text-xs leading-6">Dashboard menggunakan Firebase Web SDK tanpa service account private key di browser.</p></div></CardContent></Card></div></div>;
}
