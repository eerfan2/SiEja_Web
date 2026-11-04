import { CheckCircle2, Lock, RotateCcw, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StageStatus } from "@/types/sieja";

const config = {
  completed: [CheckCircle2, "Selesai", "border-green-200 bg-green-50 text-green-800"],
  unlocked: [Unlock, "Belum Dikerjakan", "border-indigo-200 bg-indigo-50 text-indigo-800"],
  locked: [Lock, "Terkunci", "border-zinc-200 bg-zinc-100 text-zinc-700"],
} as const;

export function StatusBadge({ status }: { status: StageStatus }) {
  const item = config[status] ?? config.locked;
  const [Icon, label, className] = item;
  return <Badge variant="outline" className={`gap-1 rounded-full px-2.5 py-1 ${className}`}><Icon className="size-3" /> {label}</Badge>;
}

export function RemedialBadge() {
  return <Badge variant="outline" className="gap-1 rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800"><RotateCcw className="size-3" /> Remedial</Badge>;
}
