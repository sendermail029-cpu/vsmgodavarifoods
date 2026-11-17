"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, EyeOff, Pencil, Star, Trash2 } from "lucide-react";
import { deleteProduct, toggleProduct } from "@/app/admin/actions";

export function ProductRowActions({ id, active, featured, name }: { id: number; active: boolean; featured: boolean; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  return (
    <div className={`inline-flex gap-1 ${pending ? "opacity-50" : ""}`}>
      <Link href={`/admin/products/${id}`} className="rounded-lg p-2 hover:bg-cream" title="Edit"><Pencil className="h-4 w-4" /></Link>
      <button className="rounded-lg p-2 hover:bg-cream" title={featured ? "Remove from featured" : "Feature on home page"} onClick={() => run(() => toggleProduct(id, "featured"))}><Star className={`h-4 w-4 ${featured ? "fill-turmeric text-turmeric" : ""}`} /></button>
      <button className="rounded-lg p-2 hover:bg-cream" title={active ? "Mark as out of stock on the website" : "Make available to order again"} onClick={() => run(() => toggleProduct(id, "active"))}>{active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
      <button className="rounded-lg p-2 text-chilli hover:bg-cream" title="Delete" onClick={() => confirm(`Delete "${name}" permanently?`) && run(() => deleteProduct(id))}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
