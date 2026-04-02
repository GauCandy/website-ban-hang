const https = require("https");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://whitecat:MeoMeo123@node-1.whitecat.cloud:20100/whitecat_store",
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

// All 14 keyboards with correct Tiki images (750x750)
const fixes = {
  "ban-phim-logitech-k120": "https://salt.tikicdn.com/cache/750x750/ts/product/3b/0d/87/174386f4889d3fa5aed0a9a6e804f1c6.jpeg",
  "ban-phim-mik-shiba": "https://salt.tikicdn.com/cache/750x750/ts/product/3e/85/f3/ffa212f3843064817a93220bd8229851.jpg",
  "ban-phim-edra-ek506": "https://salt.tikicdn.com/cache/750x750/ts/product/dd/22/6f/ea8e5940ef57263e08ea7f563a20986c.jpg",
  "dareu-ek75-grey-black": "https://salt.tikicdn.com/cache/750x750/ts/product/89/45/48/df359528a5d92f1d9f014f0a1c1db67a.jpg",
  "dareu-ek98x-black-grey": "https://salt.tikicdn.com/cache/750x750/ts/product/a8/43/8d/8f07a1201d727320d499e96a7c0aefb4.jpg",
  "dareu-ek75-pro-cloudy-aqua": "https://salt.tikicdn.com/cache/750x750/ts/product/89/45/48/df359528a5d92f1d9f014f0a1c1db67a.jpg",
  "darmoshark-top87-trimode": "https://salt.tikicdn.com/cache/750x750/ts/product/a2/2d/c7/3af3a9fd52286be2cc37c4319381f26b.jpg",
  "machenike-kg98-black-green": "https://salt.tikicdn.com/cache/750x750/ts/product/7f/ce/2e/f53820342c536275b4ecb25f37629187.jpg",
  "dareu-ek98l-grey-black": "https://salt.tikicdn.com/cache/750x750/ts/product/dd/22/6f/ea8e5940ef57263e08ea7f563a20986c.jpg",
  "asus-tuf-gaming-k3-gen2": "https://salt.tikicdn.com/cache/750x750/ts/product/4c/a9/dd/256f7107ebb4efb14f3722e60a4ea0fa.jpg",
  "darmoshark-top98-trimode-black": "https://salt.tikicdn.com/cache/750x750/ts/product/4e/b9/fc/250564ce98f86fc6f9c4543567bb2009.jpg",
  "motospeed-k103-black": "https://salt.tikicdn.com/cache/750x750/ts/product/a2/2d/c7/3af3a9fd52286be2cc37c4319381f26b.jpg",
  "fuhlen-l411-usb-black": "https://salt.tikicdn.com/cache/750x750/ts/product/00/c6/3a/15d237969b67fe418e1c0f283c76a6d9.jpg",
  "machenike-kg98-white-blue": "https://salt.tikicdn.com/cache/750x750/ts/product/7f/ce/2e/f53820342c536275b4ecb25f37629187.jpg",
};

async function main() {
  let updated = 0;
  const slugs = Object.keys(fixes);
  console.log(`Fixing ${slugs.length} keyboard images...\n`);

  for (const slug of slugs) {
    try {
      const buf = await fetchUrl(fixes[slug]);
      if (buf.length < 500) { console.log(`  SKIP ${slug} - too small`); continue; }
      const ext = fixes[slug].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
      const filename = `${Date.now()}-${slug}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);
      const dbPath = `/uploads/products/${filename}`;
      // Force update (overwrite old bad image)
      await pool.query("UPDATE products SET cover_image_url = $1 WHERE slug = $2", [dbPath, slug]);
      console.log(`  OK ${slug} (${(buf.length/1024).toFixed(0)}KB)`);
      updated++;
    } catch (e) {
      console.log(`  FAIL ${slug}: ${e.message}`);
    }
  }

  console.log(`\nFixed ${updated} keyboard images!`);
  await pool.end();
}

main().catch(console.error);
