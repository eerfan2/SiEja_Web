import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  actionLabel,
  onConfirm,
  destructive = false,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogMedia><AlertTriangle /></AlertDialogMedia><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription className="leading-6">{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={onConfirm}>{actionLabel}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
