import { getCategories } from "@/lib/catalog";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "./CategoryManager";

export default async function CategoriesPage() {
  const cats = await getCategories({ includeInactive: true });
  return (
    <div>
      <PageHeader title="Categories" sub="Group your products into sections. Cards appear on the website in the order shown here." />
      <CategoryManager cats={cats.map((c) => ({ id: c.id, name: c.name, telugu_name: c.telugu_name ?? "", slug: c.slug, description: c.description ?? "", sort: c.sort, active: !!c.active, hasImage: !!c.image, count: Number(c.product_count) }))} />
    </div>
  );
}
