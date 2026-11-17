import { PageHeader } from "@/components/admin/ui";
import { getPopup, popupImageSrc } from "@/lib/popup";
import { PopupForm } from "./PopupForm";

export const dynamic = "force-dynamic";

export default async function PopupPage() {
  const p = await getPopup();
  return (
    <div>
      <PageHeader title="Website popup" sub="A poster that pops up on the website a few seconds after a visitor opens it — for offers, festival specials or new products." />
      <PopupForm initial={{ ...p, image: undefined }} currentImage={popupImageSrc(p) || null} />
    </div>
  );
}
