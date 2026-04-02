const https = require("https");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://whitecat:MeoMeo123@node-1.whitecat.cloud:20100/whitecat_store",
});

const UPLOAD_DIR = path.join(__dirname, "uploads", "products");

function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    const mod = url.startsWith("https") ? https : require("http");
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let r = res.headers.location;
        if (r.startsWith("/")) r = new URL(url).origin + r;
        res.resume();
        return fetchUrl(r, maxRedirects - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const c = []; res.on("data", d => c.push(d)); res.on("end", () => resolve(Buffer.concat(c))); res.on("error", reject);
    }).on("error", reject).on("timeout", function() { this.destroy(); reject(new Error("timeout")); });
  });
}

// Remaining 14 products with verified image URLs
// Using 750x750 from tiki CDN + nvidia + nguyencongpc
const remaining = {
  "cpu-intel-core-i5-14400f": "https://salt.tikicdn.com/cache/750x750/ts/product/1b/77/9c/f6756a18cfe8d439fa54d5dd651358c9.jpg",
  "cpu-amd-ryzen-7-9800x3d": "https://nguyencongpc.vn/media/product/250-27034-amd-ryzen-7-9800x3d-thumb.jpg",
  "vga-rtx-5070-ti-16gb": "https://www.nvidia.com/content/dam/en-zz/Solutions/geforce/graphic-cards/50-series/5070-family/geforce-rtx-5070-ti-og-image.jpg",
  "ram-kingston-fury-beast-16gb-ddr5-6000": "https://salt.tikicdn.com/cache/750x750/ts/product/c0/60/b6/a3184422350b6b630b948525d06f059c.png",
  "ssd-samsung-990-evo-plus-1tb": "https://salt.tikicdn.com/cache/750x750/ts/product/64/6a/d4/c57304055be6673933d562ef0b76b87d.jpg",
  "mainboard-msi-mag-b650-tomahawk-wifi": "https://nguyencongpc.vn/media/product/250-23895-main.jpg",
  "nguon-corsair-rm850x-850w": "https://salt.tikicdn.com/cache/750x750/ts/product/23/36/fa/f14f4017242d0817f4fd989c2abe8f2e.jpg",
  "tan-nhiet-deepcool-ls720-se-360mm": "https://salt.tikicdn.com/cache/750x750/ts/product/ff/0a/bf/4710d5d226a52bfb8da9d418e3eb9951.jpg",
  "tai-nghe-logitech-g-pro-x2": "https://salt.tikicdn.com/cache/750x750/ts/product/1e/07/4f/79aa852d96bd1543ab7fbfb006a4da64.png",
  "chuot-logitech-g502x-plus": "https://salt.tikicdn.com/cache/750x750/ts/product/51/a5/82/6d994fb2370377dd2284fcefc80d7d96.jpg",
  "ghe-gaming-dxracer-craft-d5000": "https://salt.tikicdn.com/cache/750x750/ts/product/50/ed/18/2812c7544fe87aa9d8a8c710ccd88354.jpg",
  "webcam-logitech-c920e": "https://salt.tikicdn.com/cache/750x750/ts/product/a8/9f/26/ee4a98618e599e67b865849d65edf573.png",
  "balo-asus-rog-ranger-bp1500g": "https://salt.tikicdn.com/cache/750x750/ts/product/c9/05/6e/68335deae7f860dd89a749456e7bf4ca.png",
  "lot-chuot-artisan-hien-fx-xl": "https://salt.tikicdn.com/cache/750x750/ts/product/21/76/6a/0e0e46349b66071b7edc894b519d0e3e.jpg",
};

async function main() {
  let updated = 0;
  const slugs = Object.keys(remaining);
  console.log(`Downloading ${slugs.length} remaining images...\n`);

  for (const slug of slugs) {
    try {
      const buf = await fetchUrl(remaining[slug]);
      if (buf.length < 500) { console.log(`  SKIP ${slug} - too small`); continue; }
      const ext = remaining[slug].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
      const filename = `${Date.now()}-${slug}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);
      const dbPath = `/uploads/products/${filename}`;
      await pool.query("UPDATE products SET cover_image_url = $1 WHERE slug = $2", [dbPath, slug]);
      console.log(`  OK ${slug} (${(buf.length/1024).toFixed(0)}KB)`);
      updated++;
    } catch (e) {
      console.log(`  FAIL ${slug}: ${e.message}`);
    }
  }

  const { rows } = await pool.query("SELECT COUNT(*) as total FROM products WHERE cover_image_url IS NOT NULL AND product_status='active'");
  const { rows: missing } = await pool.query("SELECT slug FROM products WHERE cover_image_url IS NULL AND product_status='active'");
  console.log(`\nDone! Updated: ${updated}`);
  console.log(`Total products with images: ${rows[0].total}`);
  console.log(`Still missing: ${missing.length}`);
  missing.forEach(r => console.log(`  - ${r.slug}`));

  await pool.end();
}

main().catch(console.error);
