import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, getProductById } from "@/lib/catalog";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const p = await getProductById(Number((await params).id));
  if (!p) notFound();
  const cats = await getCategories({ includeInactive: true });
  return (
    <div>
      <PageHeader title={`Edit: ${p.name}`}><Link href={`/product/${p.slug}`} target="_blank" className="btn-ghost bg-white">View in shop ↗</Link></PageHeader>
      <ProductForm
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: p.id, category_id: p.category_id, name: p.name, telugu_name: p.telugu_name ?? "", slug: p.slug, short_description: p.short_description ?? "",
          description: p.description ?? "", ingredients: p.ingredients ?? "", shelf_life: p.shelf_life ?? "", art: p.art, spice_level: p.spice_level,
          featured: !!p.featured, active: !!p.active, hasImage: !!p.image,
          variants: p.variants.map((v) => ({ id: v.id, label: v.label, weight_grams: v.weight_grams, price: v.price / 100, mrp: v.mrp ? v.mrp / 100 : null, stock: v.stock, low_stock_at: v.low_stock_at, sku: v.sku ?? "" })),
        }}
      />
    </div>
  );
}
