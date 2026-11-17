import { getSettings, phonePeEnabled } from "@/lib/settings";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div>
      <PageHeader title="Settings & Payments" sub="Store details, delivery charges and payment methods." />
      <SettingsForm initial={s} phonepe={phonePeEnabled()} phonepeEnv={process.env.PHONEPE_ENV === "production" ? "production" : "sandbox"} />
    </div>
  );
}
