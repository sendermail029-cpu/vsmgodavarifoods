import { PageHeader } from "@/components/admin/ui";
import { EXPENSE_CATEGORIES, investorBook } from "@/lib/investors";
import { todayIST } from "@/lib/reports";
import { InvestorManager } from "./InvestorManager";

export const dynamic = "force-dynamic";

export default async function InvestorsPage() {
  const book = await investorBook();
  return (
    <div>
      <PageHeader title="Investors & money" sub="How much each member put in, how much was used, and whether the business is in profit or loss." />
      <InvestorManager book={book} categories={[...EXPENSE_CATEGORIES]} today={todayIST()} />
    </div>
  );
}
