import { rupees, SITE_URL } from "@/lib/format";
import type { Order } from "@/lib/orders";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";

type Msg = { key: string; label: string; text: string };

/**
 * Ready-made WhatsApp messages to the customer for each stage of the order.
 * Tapping one opens WhatsApp with the text filled in — the shop just presses Send. Free, no API needed.
 */
export function CustomerMessages({ o, shop }: { o: Order; shop: string }) {
  const first = o.customer_name.trim().split(/\s+/)[0] || o.customer_name;
  const link = `${SITE_URL}/order/${o.code}?t=${o.access_token}`;
  const items = o.items.map((i) => `• ${i.name} (${i.label}) × ${i.qty}`).join("\n");
  const phone = o.phone.startsWith("+") ? o.phone.slice(1) : `91${o.phone}`;
  const sign = `\n\n— ${shop}`;

  const all: Record<string, Msg> = {
    askPay: { key: "askPay", label: "Ask about payment", text: `Hi ${first} 🙏\n\nThank you for your order *${o.code}* with ${shop}!\n\n${items}\n*Total: ${rupees(o.total)}*\n\nWe haven't received the payment yet. Did you complete it? If yes, please reply with the payment screenshot. If not, you can pay here:\n${link}${sign}` },
    expired: { key: "expired", label: "Payment not received", text: `Hi ${first},\n\nYour order *${o.code}* (${rupees(o.total)}) was not paid, so the items were released.\n\nIf you already paid, please send us the payment screenshot and we'll restore your order right away. Want to order again? Just reply here 🙂${sign}` },
    checking: { key: "checking", label: "We're checking payment", text: `Hi ${first} 🙏\n\nThank you! We received your payment details for order *${o.code}* (${rupees(o.total)}). We're confirming it with our bank and will update you shortly.\n\nTrack your order: ${link}${sign}` },
    confirmed: { key: "confirmed", label: "Payment received ✅", text: `Hi ${first} ✅\n\nPayment of *${rupees(o.total)}* received for order *${o.code}*. Thank you!\n\n${items}\n\nWe'll prepare and pack your order fresh, and send you the tracking details soon.\n\nTrack your order: ${link}${sign}` },
    cod: { key: "cod", label: "Confirm COD order", text: `Hi ${first} 🙏\n\nThank you for your Cash on Delivery order *${o.code}*.\n\n${items}\n*Pay on delivery: ${rupees(o.total)}*\n\nPlease reply *YES* to confirm and we'll pack it right away.${sign}` },
    packed: { key: "packed", label: "Order packed 📦", text: `Hi ${first} 📦\n\nYour order *${o.code}* is packed and will be handed to the courier soon.\n\nTrack your order: ${link}${sign}` },
    shipped: { key: "shipped", label: "Send tracking 🚚", text: `Hi ${first} 🚚\n\nYour order *${o.code}* has been shipped!${o.tracking ? `\n\n*Tracking:* ${o.tracking}` : ""}\n\nTrack your order: ${link}${sign}` },
    delivered: { key: "delivered", label: "Thank you / feedback", text: `Hi ${first} 🙏\n\nYour order *${o.code}* has been delivered. We hope you enjoy it!\n\nWe'd love to hear how you liked it — just reply here. Thank you for choosing ${shop} ❤️${sign}` },
  };

  // the message that fits the order right now
  const paidOrCod = o.payment_status === "paid" || o.payment_method === "cod";
  const now =
    o.status === "cancelled" ? (o.payment_status === "expired" ? all.expired : null)
    : o.status === "delivered" ? all.delivered
    : o.status === "shipped" ? all.shipped
    : o.status === "packed" ? all.packed
    : o.payment_status === "submitted" ? all.checking
    : o.payment_method === "cod" && o.status === "placed" ? all.cod
    : paidOrCod ? all.confirmed
    : all.askPay;
  const others = Object.values(all).filter((m) => m.key !== now?.key && (o.payment_method === "cod" || m.key !== "cod"));
  const href = (m: Msg) => `https://wa.me/${phone}?text=${encodeURIComponent(m.text)}`;

  return (
    <section className="card space-y-3 p-5 text-sm">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold"><WhatsAppIcon className="h-5 w-5 text-[#25D366]" /> Message customer</h2>
      {now && (
        <a href={href(now)} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] py-3 text-white shadow hover:opacity-90">
          <WhatsAppIcon className="h-5 w-5" /> {now.label}
        </a>
      )}
      {now && <p className="whitespace-pre-line rounded-xl bg-[#e7fbe9] p-3 text-xs text-ink/80">{now.text}</p>}
      <details>
        <summary className="cursor-pointer text-xs font-semibold text-ink/60">Other messages</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {others.map((m) => <a key={m.key} href={href(m)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-[#25D366]/50 hover:bg-[#e7fbe9]">{m.label}</a>)}
        </div>
      </details>
      <p className="text-[11px] text-ink/50">Opens WhatsApp with the message ready — just press Send.</p>
    </section>
  );
}
