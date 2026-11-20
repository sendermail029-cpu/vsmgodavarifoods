import "server-only";
import { rgb } from "pdf-lib";
import type { InvestorBook } from "./investors";
import type { Settings } from "./settings";
import { CREAM, footer, GOLD, GREY, H, header, LINE, M, MAROON, money, newDoc, niceDay, safe, table, text, W, type Ctx } from "./pdf";

const GREEN = rgb(0.13, 0.42, 0.2), RED = rgb(0.75, 0.13, 0.1), WHITE = rgb(1, 1, 1), PALE_GOLD = rgb(0.91, 0.81, 0.54), SOFT = rgb(0.95, 0.92, 0.85);
const KIND: Record<string, string> = { invest: "Money in", withdraw: "Taken out", expense: "Expense" };
const monthName = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const shortDay = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

/** Investors & money book: profit/loss, summary, members, month by month, where money went, all entries. */
export async function investorBookPdf(bk: InvestorBook, s: Settings) {
  const { doc, f, b } = await newDoc();
  doc.setTitle("Investors & money"); doc.setAuthor(safe(s.store_name));
  const c: Ctx = { doc, page: doc.addPage([W, H]), y: 0, f, b };
  const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  header(c, s, "INVESTORS & MONEY", `As on ${niceDay(today)}`);
  const foot = `${safe(s.store_name)} - Investors & money`;
  const newPage = () => { footer(c, foot); c.page = doc.addPage([W, H]); c.y = H - 60; };
  const section = (title: string) => {
    if (c.y < 170) newPage();
    text(c, title, M, c.y, 13, true, MAROON);
    c.page.drawRectangle({ x: M, y: c.y - 6, width: 36, height: 2, color: GOLD });
    c.y -= 24;
  };
  /** shorten text so it fits a column */
  const fit = (str: string, width: number, size = 8.5) => {
    const full = safe(str);
    let t = full;
    while (t.length > 1 && f.widthOfTextAtSize(t + "...", size) > width) t = t.slice(0, -1);
    return t === full || f.widthOfTextAtSize(full, size) <= width ? full : t + "...";
  };
  const t = bk.totals;

  // profit / loss banner
  const profit = t.profit >= 0, bandH = 70;
  c.page.drawRectangle({ x: M, y: c.y - bandH + 10, width: W - 2 * M, height: bandH, color: profit ? GREEN : rgb(0.37, 0.08, 0.08) });
  text(c, profit ? "PROFIT SO FAR" : "LOSS SO FAR", M + 16, c.y - 8, 8.5, true, PALE_GOLD);
  text(c, money(Math.abs(t.profit)), M + 16, c.y - 32, 22, true, WHITE);
  text(c, `Sales ${money(t.sales)}  -  money used ${money(t.used)}`, M + 16, c.y - 48, 8.5, false, SOFT);
  text(c, "CASH THE BUSINESS SHOULD HAVE", W - M - 16, c.y - 8, 7.5, true, PALE_GOLD, "right");
  text(c, money(t.cash), W - M - 16, c.y - 30, 16, true, WHITE, "right");
  text(c, "invested - taken out + sales - used", W - M - 16, c.y - 46, 7.5, false, SOFT, "right");
  c.y -= bandH + 14;

  // four summary boxes
  const boxes: [string, number, string][] = [
    ["Total invested", t.invested, `by ${bk.members.length} member(s)`],
    ["Taken out", t.withdrawn, "withdrawals / payouts"],
    ["Money used", t.used, `expenses + ingredients`],
    ["Sales income", t.sales, "paid + delivered COD"],
  ];
  const gap = 10, bw = (W - 2 * M - gap * 3) / 4, bh = 56;
  boxes.forEach(([label, v, sub], i) => {
    const x = M + i * (bw + gap);
    c.page.drawRectangle({ x, y: c.y - bh, width: bw, height: bh, color: CREAM, borderColor: LINE, borderWidth: 0.8 });
    text(c, label, x + 10, c.y - 15, 8, true, GREY);
    text(c, money(v), x + 10, c.y - 33, 12, true, i === 2 ? RED : MAROON);
    text(c, fit(sub, bw - 20, 6.8), x + 10, c.y - 47, 6.8, false, GREY);
  });
  c.y -= bh + 28;

  // members
  section("Members");
  if (bk.members.length) {
    table(c, [
      { label: "Member", w: 130 }, { label: "Invested", w: 80, align: "right" }, { label: "Taken out", w: 80, align: "right" },
      { label: "Share", w: 55, align: "right" }, { label: "Profit / loss", w: 85, align: "right" }, { label: "Current value", w: 85, align: "right" },
    ], [
      ...bk.members.map((m) => [fit(m.name, 118), money(m.invested), money(m.withdrawn), `${m.sharePct.toFixed(1)}%`, money(m.profitShare), money(m.balance)]),
      ["TOTAL", money(t.invested), money(t.withdrawn), t.invested ? "100%" : "-", money(bk.members.reduce((a, m) => a + m.profitShare, 0)), money(bk.members.reduce((a, m) => a + m.balance, 0))],
    ], { onNewPage: newPage, bold: (i) => i === bk.members.length });
    c.y -= 4;
    text(c, "Profit or loss is shared in proportion to what each member invested. Current value = invested - taken out + share of profit.", M, c.y, 7.5, false, GREY);
  } else text(c, "No members added yet.", M, c.y, 9, false, GREY);
  c.y -= 30;

  // month by month
  section("Month by month");
  table(c, [
    { label: "Month", w: 105 }, { label: "Invested", w: 82, align: "right" }, { label: "Taken out", w: 82, align: "right" },
    { label: "Used", w: 82, align: "right" }, { label: "Sales", w: 82, align: "right" }, { label: "Profit / loss", w: 82, align: "right" },
  ], [
    ...bk.months.map((m) => [monthName(m.month), money(m.invested), money(m.withdrawn), money(m.expenses + m.ingredients), money(m.sales), money(m.profit)]),
    ["TOTAL", money(t.invested), money(t.withdrawn), money(t.used), money(t.sales), money(t.profit)],
  ], { onNewPage: newPage, bold: (i) => i === bk.months.length });
  c.y -= 26;

  // where money went
  section("Where the money went");
  table(c, [{ label: "Category", w: 300 }, { label: "Amount", w: 130, align: "right" }, { label: "% of used", w: 85, align: "right" }], [
    ...bk.byCategory.map((x) => [x.category, money(x.amount), t.used ? `${((x.amount / t.used) * 100).toFixed(1)}%` : "-"]),
    ["TOTAL", money(t.used), t.used ? "100%" : "-"],
  ], { onNewPage: newPage, bold: (i) => i === bk.byCategory.length });
  c.y -= 26;

  // all entries
  section("All entries");
  table(c, [
    { label: "Date", w: 68 }, { label: "Type", w: 60 }, { label: "Member / category", w: 118 }, { label: "Note", w: 129 },
    { label: "In", w: 70, align: "right" }, { label: "Out", w: 70, align: "right" },
  ], [
    ...bk.entries.map((e) => [
      shortDay(e.date), KIND[e.kind], fit(e.kind === "expense" ? e.category : e.investor ?? "", 108, 8), fit(e.note, 118, 8),
      e.kind === "invest" ? money(e.amount) : "", e.kind === "invest" ? "" : money(e.amount),
    ]),
    ["TOTAL", "", "", "", money(t.invested), money(t.withdrawn + t.expenses)],
  ], { onNewPage: newPage, bold: (i) => i === bk.entries.length, size: 8 });
  if (t.ingredients) {
    c.y -= 4;
    text(c, `Ingredient purchases (${money(t.ingredients)}) come from the Ingredients stock page and are included in "Money used".`, M, c.y, 7.5, false, GREY);
  }

  footer(c, foot);
  return doc.save();
}
