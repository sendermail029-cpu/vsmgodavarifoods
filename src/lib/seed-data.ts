// Starter catalogue — loaded only the very first time the database is created.
// Prices/stock below are SAMPLE values: edit everything from the Admin panel.

export const SEED_CATEGORIES = [
  { name: "Non-Veg Pickles", telugu: "నాన్-వెజ్ పచ్చళ్ళు", slug: "non-veg-pickles", description: "Village-style chicken, mutton and prawn pickles slow-cooked in cold-pressed oil with Guntur chillies." },
  { name: "Veg Pickles", telugu: "వెజ్ పచ్చళ్ళు", slug: "veg-pickles", description: "Avakaya, gongura and seasonal pickles made the way Godavari grandmothers make them." },
  { name: "Sweets & Laddus", telugu: "స్వీట్లు & లడ్డూలు", slug: "sweets-laddus", description: "Sunnundalu, laddus, kaja and putharekulu made with pure ghee and jaggery." },
  { name: "Traditional Snacks", telugu: "సాంప్రదాయ పిండి వంటలు", slug: "traditional-snacks", description: "Crunchy chekkalu, janthikalu and more — fresh-fried tea-time favourites." },
];

type SeedVariant = { label: string; grams: number; price: number; mrp?: number; stock: number };
type SeedProduct = {
  category: string; name: string; telugu: string; slug: string; short: string; description: string;
  ingredients: string; shelfLife: string; art: string; spice: number; featured?: boolean; variants: SeedVariant[];
};

const pickleSizes = (p250: number, p500: number, p1k: number): SeedVariant[] => [
  { label: "250 g", grams: 250, price: p250, stock: 40 },
  { label: "500 g", grams: 500, price: p500, stock: 30 },
  { label: "1 kg", grams: 1000, price: p1k, stock: 15 },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    category: "non-veg-pickles", name: "Chicken Boneless Pickle", telugu: "చికెన్ పచ్చడి", slug: "chicken-boneless-pickle",
    short: "Tender boneless chicken fried crisp and soaked in spicy Godavari masala.",
    description: "Our bestseller. Country-style boneless chicken pieces are marinated, fried till crisp and then rested in a fiery masala of Guntur chilli, garlic, ginger and hand-ground spices, finished with cold-pressed groundnut oil. Perfect with hot rice, ghee and a slice of onion.",
    ingredients: "Boneless chicken, groundnut oil, red chilli powder, garlic, ginger, salt, lemon juice, garam masala, mustard, fenugreek, curry leaves.",
    shelfLife: "45 days at room temperature, 3 months refrigerated. Always use a dry spoon.",
    art: "chicken", spice: 4, featured: true, variants: pickleSizes(399, 749, 1449),
  },
  {
    category: "non-veg-pickles", name: "Mutton Boneless Pickle", telugu: "మటన్ పచ్చడి", slug: "mutton-boneless-pickle",
    short: "Slow-cooked tender mutton in a rich, garlicky masala.",
    description: "Tender goat meat slow-cooked until soft, then fried and mixed with roasted spices and plenty of garlic. A Sunday-special taste you can open any day.",
    ingredients: "Boneless mutton, groundnut oil, red chilli powder, garlic, ginger, salt, lemon juice, spices, curry leaves.",
    shelfLife: "45 days at room temperature, 3 months refrigerated.",
    art: "mutton", spice: 4, featured: true, variants: pickleSizes(549, 1049, 1999),
  },
  {
    category: "non-veg-pickles", name: "Royyala (Prawn) Pickle", telugu: "రొయ్యల పచ్చడి", slug: "prawn-pickle",
    short: "Konaseema-style prawn pickle — crispy, tangy and spicy.",
    description: "Fresh Godavari prawns cleaned, fried crisp and pickled in a tangy masala of chilli, garlic and tamarind — the coastal classic.",
    ingredients: "Prawns, groundnut oil, red chilli powder, garlic, tamarind, salt, spices, curry leaves.",
    shelfLife: "45 days at room temperature, 3 months refrigerated.",
    art: "prawn", spice: 3, featured: true, variants: pickleSizes(499, 949, 1849),
  },
  {
    category: "veg-pickles", name: "Avakaya (Mango) Pickle", telugu: "ఆవకాయ", slug: "avakaya-mango-pickle",
    short: "The king of Andhra pickles — raw mango, mustard and chilli.",
    description: "Hand-cut raw mangoes with the stone, mixed with freshly ground mustard, Guntur chilli powder and cold-pressed oil. Matured in jaadi (ceramic jars) the traditional way.",
    ingredients: "Raw mango, groundnut oil, mustard powder, red chilli powder, salt, fenugreek, garlic (optional).",
    shelfLife: "12 months when stored with a dry spoon.",
    art: "mango", spice: 3, featured: true, variants: pickleSizes(199, 379, 699),
  },
  {
    category: "veg-pickles", name: "Gongura Pickle", telugu: "గోంగూర పచ్చడి", slug: "gongura-pickle",
    short: "Tangy sorrel leaves with roasted chillies — pure Andhra pride.",
    description: "Fresh gongura leaves sautéed and ground with roasted red chillies, garlic and a tempering of mustard and urad dal.",
    ingredients: "Gongura (sorrel) leaves, groundnut oil, red chillies, garlic, salt, mustard, urad dal, fenugreek.",
    shelfLife: "6 months.", art: "gongura", spice: 3, variants: pickleSizes(179, 339, 649),
  },
  {
    category: "veg-pickles", name: "Tomato Pickle", telugu: "టమాటా పచ్చడి", slug: "tomato-pickle",
    short: "Sweet-sour-spicy tomato pickle, a breakfast favourite.",
    description: "Ripe country tomatoes cooked down with tamarind and spices. Great with idli, dosa and upma.",
    ingredients: "Tomato, tamarind, groundnut oil, red chilli powder, salt, garlic, mustard, fenugreek.",
    shelfLife: "6 months.", art: "tomato", spice: 2, variants: pickleSizes(169, 319, 599),
  },
  {
    category: "veg-pickles", name: "Lemon Pickle", telugu: "నిమ్మకాయ పచ్చడి", slug: "lemon-pickle",
    short: "Sun-cured lemons in a gentle spice blend.", description: "Juicy lemons sun-cured with salt and turmeric, then mixed with chilli and fenugreek.",
    ingredients: "Lemon, salt, turmeric, red chilli powder, groundnut oil, fenugreek, mustard.",
    shelfLife: "12 months.", art: "lemon", spice: 2, variants: pickleSizes(169, 319, 599),
  },
  {
    category: "sweets-laddus", name: "Sunnundalu", telugu: "సున్నుండలు", slug: "sunnundalu",
    short: "Roasted urad dal laddus with jaggery and pure ghee.",
    description: "A Godavari household treasure — roasted urad dal ground fine and rolled with jaggery and generous pure ghee. Protein-rich and melt-in-mouth.",
    ingredients: "Urad dal, jaggery, pure ghee, cardamom.", shelfLife: "30 days.", art: "sunnundalu", spice: 0, featured: true,
    variants: [{ label: "250 g", grams: 250, price: 249, stock: 30 }, { label: "500 g", grams: 500, price: 479, stock: 20 }, { label: "1 kg", grams: 1000, price: 929, stock: 10 }],
  },
  {
    category: "sweets-laddus", name: "Boondi Laddu", telugu: "బూందీ లడ్డు", slug: "boondi-laddu",
    short: "Soft ghee boondi laddus with cashew and cardamom.", description: "Fresh boondi soaked in sugar syrup and rolled with ghee, cashews, raisins and cardamom.",
    ingredients: "Gram flour, sugar, pure ghee, cashew, raisins, cardamom.", shelfLife: "15 days.", art: "laddu", spice: 0, featured: true,
    variants: [{ label: "500 g", grams: 500, price: 299, stock: 25 }, { label: "1 kg", grams: 1000, price: 579, stock: 12 }],
  },
  {
    category: "sweets-laddus", name: "Kakinada Kaja", telugu: "కాకినాడ కాజా", slug: "kakinada-kaja",
    short: "Juicy, flaky kaja dripping with syrup.", description: "Layered, fried and soaked in sugar syrup — the famous East Godavari sweet.",
    ingredients: "Maida, sugar, ghee, oil.", shelfLife: "10 days.", art: "kaja", spice: 0, featured: true,
    variants: [{ label: "500 g", grams: 500, price: 279, stock: 20 }, { label: "1 kg", grams: 1000, price: 539, stock: 10 }],
  },
  {
    category: "sweets-laddus", name: "Atreyapuram Putharekulu", telugu: "పూతరేకులు", slug: "putharekulu",
    short: "Paper-thin rice sheets with ghee, jaggery and dry fruits.", description: "The iconic paper sweet from Atreyapuram — delicate rice-starch sheets layered with ghee, jaggery/sugar and dry fruits.",
    ingredients: "Rice starch, jaggery, pure ghee, dry fruits.", shelfLife: "20 days.", art: "putharekulu", spice: 0,
    variants: [{ label: "10 pcs", grams: 250, price: 299, stock: 25 }, { label: "20 pcs", grams: 500, price: 579, stock: 15 }],
  },
  {
    category: "traditional-snacks", name: "Chekkalu (Rice Crackers)", telugu: "చెక్కలు", slug: "chekkalu",
    short: "Crispy rice-flour crackers with chana dal and curry leaves.", description: "Thin, crunchy rice-flour discs studded with chana dal, chilli and curry leaves.",
    ingredients: "Rice flour, chana dal, green chilli, curry leaves, butter, salt, oil.", shelfLife: "30 days.", art: "chekkalu", spice: 1, featured: true,
    variants: [{ label: "250 g", grams: 250, price: 129, stock: 40 }, { label: "500 g", grams: 500, price: 249, stock: 25 }],
  },
  {
    category: "traditional-snacks", name: "Janthikalu (Murukulu)", telugu: "జంతికలు", slug: "janthikalu",
    short: "Crunchy spiral murukulu with ajwain and sesame.", description: "Hand-pressed spirals of rice and gram flour with ajwain and sesame — the perfect tea-time crunch.",
    ingredients: "Rice flour, gram flour, ajwain, sesame, butter, salt, oil.", shelfLife: "30 days.", art: "murukulu", spice: 1,
    variants: [{ label: "250 g", grams: 250, price: 129, stock: 40 }, { label: "500 g", grams: 500, price: 249, stock: 25 }],
  },
  {
    category: "traditional-snacks", name: "Ariselu", telugu: "అరిసెలు", slug: "ariselu",
    short: "Festive jaggery-rice discs with sesame.", description: "Sankranti special — soft jaggery and rice-flour discs topped with sesame and fried in ghee.",
    ingredients: "Rice flour, jaggery, sesame, ghee.", shelfLife: "20 days.", art: "ariselu", spice: 0,
    variants: [{ label: "250 g", grams: 250, price: 199, stock: 25 }, { label: "500 g", grams: 500, price: 379, stock: 15 }],
  },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  store_name: "VSM Godavari Foods",
  phone: "6301009703",
  phone2: "7995941419",
  maps_url: "https://maps.app.goo.gl/fjqwrEcJbinEvyub7",
  map_lat_lng: "16.7194394,81.6750019",
  facebook_url: "https://www.facebook.com/profile.php?id=61596664225974",
  whatsapp: "916301009703",
  email: "vsmgodavarifoods@gmail.com",
  address: "Velpuru, Tanuku Mandalam, West Godavari District, Andhra Pradesh",
  upi_id: "",
  upi_payee_name: "VSM Godavari Foods",
  upi_account_type: "personal",
  enable_upi_qr: "1",
  enable_cod: "0",
  cod_fee: "0",
  free_shipping_above: "1500",
  shipping_per_kg: "50",
  min_shipping: "50",
  packing_grams: "150",
  announcement: "Free delivery across India on orders above ₹1,500",
  fssai_license: "",
  grievance_officer: "Customer Care Team, VSM Godavari Foods",
  dispatch_days: "1–3",
};
