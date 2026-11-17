import { getCategories } from "@/lib/catalog";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../ProductForm";

export default async function NewProduct() {
  const cats = await getCategories({ includeInactive: true });
  return (
    <div>
      <PageHeader title="Add product" />
      <ProductForm categories={cats.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
