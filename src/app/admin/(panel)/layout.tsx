import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { NewOrderAlert } from "@/components/admin/NewOrderAlert";
import { expireUnpaidOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  await expireUnpaidOrders().catch(() => 0);
  return (
    <div className="lg:grid lg:grid-cols-[250px_1fr]">
      <AdminNav email={admin.email} name={admin.name} />
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      <NewOrderAlert />
    </div>
  );
}
