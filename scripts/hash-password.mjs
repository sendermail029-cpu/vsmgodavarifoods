import bcrypt from "bcryptjs";
const pw = process.argv[2];
if (!pw || pw.length < 10) { console.error('Usage: npm run hash-password -- "a-strong-password-of-10+-chars"'); process.exit(1); }
const hash = await bcrypt.hash(pw, 12);
console.log("\n1) For the .env.local file on this computer (the \\ before each $ is needed — Next.js would otherwise blank it):\n");
console.log("ADMIN_PASSWORD_HASH=" + hash.replace(/\$/g, "\\$"));
console.log("\n2) For Vercel → your project → Settings → Environment Variables (paste exactly, no \\):\n");
console.log(hash + "\n");
