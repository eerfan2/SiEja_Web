import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export function ResourceSkeleton({ cards = 4 }: { cards?: number }) {
  return <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: cards }).map((_, index) => <div key={index} className="rounded-2xl border bg-white p-5"><Skeleton className="h-5 w-1/2" /><Skeleton className="mt-4 h-4 w-full" /><Skeleton className="mt-2 h-4 w-3/4" /><Skeleton className="mt-6 h-10 w-full" /></div>)}</div>;
}

export function ResourceEmpty({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <Empty className="mt-6 min-h-64 border bg-white"><EmptyHeader><EmptyMedia variant="icon"><Inbox /></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader>{action && <EmptyContent>{action}</EmptyContent>}</Empty>;
}

export function ResourceError({ message }: { message: string }) {
  return <Empty className="mt-6 min-h-64 border border-red-200 bg-red-50"><EmptyHeader><EmptyMedia variant="icon"><AlertCircle className="text-destructive" /></EmptyMedia><EmptyTitle>Data gagal dimuat</EmptyTitle><EmptyDescription>{message}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => window.location.reload()}>Coba kembali</Button></EmptyContent></Empty>;
}
