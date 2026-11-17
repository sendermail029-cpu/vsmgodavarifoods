// Optional: the database is created + seeded automatically on first request.
// This script just pings the site so the tables are created right after deploy.
const url = process.argv[2] || "http://localhost:3000";
const r = await fetch(url + "/shop");
console.log(url, r.status === 200 ? "✓ database ready" : `status ${r.status}`);
