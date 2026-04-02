const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("pg");
require("dotenv").config();

const uploadDir = path.resolve(__dirname, "uploads", "products");
fs.mkdirSync(uploadDir, { recursive: true });

function download(url) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith("https") ? https : http;
    transport.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function getExtFromUrl(url) {
  const match = url.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i);
  return match ? "." + match[1].toLowerCase() : ".png";
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query(
    "SELECT id, name, cover_image_url FROM products WHERE cover_image_url IS NOT NULL AND cover_image_url LIKE 'http%'"
  );

  console.log(`Found ${rows.length} products with external image URLs`);

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      console.log(`Downloading: ${row.name}`);
      const buffer = await download(row.cover_image_url);

      const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);
      const ext = getExtFromUrl(row.cover_image_url);
      const filename = `${hash}${ext}`;
      const filepath = path.join(uploadDir, filename);

      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, buffer);
        console.log(`  Saved: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`  Already exists: ${filename}`);
      }

      const localUrl = `/uploads/products/${filename}`;
      await client.query("UPDATE products SET cover_image_url = $1 WHERE id = $2", [localUrl, row.id]);
      success++;
    } catch (err) {
      console.error(`  FAILED: ${row.name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
