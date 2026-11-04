import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/catalog-page";

export const metadata: Metadata = { title: "Katalog Materi" };
export default function Page() {
  return <CatalogPage />;
}
