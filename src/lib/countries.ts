/** Countries for international delivery (works in the browser and on the server). */
const CODES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI KH CM CA CV CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW".split(" ");

const names = new Intl.DisplayNames(["en"], { type: "region" });
/** Every country except India, sorted A–Z by English name. */
export const COUNTRIES: string[] = CODES.map((c) => names.of(c) ?? c).sort((a, b) => a.localeCompare(b));
export const INDIA = "India";
export const isCountry = (c: string) => c === INDIA || COUNTRIES.includes(c);

/** Short names people type in the rates list. */
const ALIAS: Record<string, string> = { usa: "united states", us: "united states", america: "united states", uk: "united kingdom", england: "united kingdom", britain: "united kingdom", uae: "united arab emirates", dubai: "united arab emirates" };
const norm = (s: string) => { const k = s.trim().toLowerCase(); return ALIAS[k] ?? k; };

export type IntlRate = { perKg: number; min: number };
/**
 * Rates from the admin text box, one per line: "Country | per kg ₹ | minimum ₹".
 * "Other countries" is used for any country not listed.
 */
export function parseIntlRates(text: string) {
  const map = new Map<string, IntlRate>();
  for (const line of (text || "").split(/\r?\n/)) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 2 || !parts[0]) continue;
    const perKg = Number(parts[1].replace(/[^\d.]/g, "")), min = Number((parts[2] ?? "").replace(/[^\d.]/g, "")) || perKg;
    if (perKg > 0) map.set(norm(parts[0]), { perKg, min });
  }
  return map;
}
export function intlRateFor(country: string, rates: Map<string, IntlRate>): IntlRate | null {
  return rates.get(norm(country)) ?? rates.get("other countries") ?? rates.get("other") ?? null;
}
/** International shipping in paise: per kg of PACKED weight (rounded up to whole kg), never below the minimum. No free delivery abroad. */
export function intlShipping(totalGrams: number, itemCount: number, packGrams: number, rate: IntlRate) {
  const kgs = Math.max(1, Math.ceil((totalGrams + itemCount * packGrams) / 1000));
  return Math.round(Math.max(kgs * rate.perKg, rate.min) * 100);
}
