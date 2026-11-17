import { PageHeader } from "@/components/admin/ui";
import { listMaterials, materialLog, materialPeople } from "@/lib/materials";
import { IngredientManager } from "./IngredientManager";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const [items, log, people] = await Promise.all([listMaterials(), materialLog(30), materialPeople()]);
  return (
    <div>
      <PageHeader title="Ingredients stock" sub="Salt, karam, masala, oil and everything else used in the kitchen — with usage and shortage alerts." />
      <IngredientManager items={items} log={log} people={people} />
    </div>
  );
}
