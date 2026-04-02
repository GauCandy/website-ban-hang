const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://whitecat:MeoMeo123@node-1.whitecat.cloud:20100/whitecat_store",
});

const UPLOAD_DIR = path.join(__dirname, "uploads", "products");

// Fetch with redirect support
function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,image/*,*/*",
        },
        timeout: 20000,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          let redir = res.headers.location;
          if (redir.startsWith("/")) {
            const u = new URL(url);
            redir = u.origin + redir;
          }
          res.resume();
          return fetchUrl(redir, maxRedirects - 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

// Fetch HTML page and extract product image URL from JSON-LD or og:image
async function findImageFromPage(pageUrl) {
  const buf = await fetchUrl(pageUrl);
  const html = buf.toString("utf8");

  // Try JSON-LD schema.org
  const ldMatch = html.match(
    /"@type"\s*:\s*"Product"[\s\S]*?"image"\s*:\s*"([^"]+)"/
  );
  if (ldMatch) return ldMatch[1];

  // Try og:image
  const ogMatch = html.match(
    /property=["']og:image["']\s+content=["']([^"']+)["']/
  );
  if (ogMatch) return ogMatch[1];

  // Try first large product image in media/product
  const mediaMatch = html.match(
    /(?:src|href)=["']((?:https?:\/\/[^"']*|\/?)media\/product\/[^"']+)["']/
  );
  if (mediaMatch) {
    let u = mediaMatch[1];
    if (u.startsWith("/") || u.startsWith("media"))
      u = new URL(u, pageUrl).href;
    return u;
  }

  return null;
}

// Download image buffer and save to disk
async function downloadImage(slug, imageUrl) {
  const buf = await fetchUrl(imageUrl);
  if (buf.length < 500) return null; // too small, likely error page
  const ext =
    imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1]?.toLowerCase() || "jpg";
  const filename = `${Date.now()}-${slug}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buf);
  return `/uploads/products/${filename}`;
}

// Product slug -> nguyencongpc.vn page slug mapping
const nguyencongPages = {
  // Laptops
  "dell-pv-15250-essential": "laptop-dell-pv-15250-essential",
  "lenovo-loq-essential-15iax9e": "laptop-lenovo-loq-essential-15iax9e",
  "lenovo-thinkpad-e14-gen4": "laptop-lenovo-thinkpad-e14-gen-4-21e3s04d00",
  "gigabyte-a16-cthi3vn893sh": "laptop-gigabyte-a16-cthi3vn893sh",
  "gigabyte-a16-cmhi2vn893sh": "laptop-gigabyte-a16-cmhi2vn893sh",
  "hp-15-fd0133wm": "laptop-hp-15-fd0133wm",
  "hp-15-fd0250wm": "laptop-hp-15-fd0250wm",
  "dell-inspiron-14-5440": "laptop-dell-inspiron-14-5440",
  "dell-dc15250-touchscreen": "laptop-dell-dc15250",
  "lenovo-thinkbook-14g7-ahp": "laptop-lenovo-thinkbook-14g7-ahp",
  "gigabyte-g5-kf-e3vn333sh": "laptop-gigabyte-g5-kf-e3vn333sh",
  "gigabyte-a16-cvhi3vn893sh": "laptop-gigabyte-a16-cvhi3vn893sh",
  "gigabyte-aorus-16x-asg": "laptop-gigabyte-aorus-16x-asg-53vnc54sh",
  // Monitors
  "gigabyte-gs25f2-24-5-200hz": "man-hinh-gigabyte-gs25f2",
  "asus-va249hg-23-8-120hz": "man-hinh-asus-va249hg",
  "asus-tuf-vg27aq5a-27-2k-210hz": "man-hinh-asus-tuf-gaming-vg27aq5a",
  "gigabyte-gs25f14-24-5-144hz": "man-hinh-gigabyte-gs25f14",
  "asus-tuf-vg259q5a-24-5-200hz": "man-hinh-asus-tuf-gaming-vg259q5a",
  "edra-egm24f120h-24-120hz": "man-hinh-edra-egm24f120h",
  "asus-proart-pa248qfv-24-1-wuxga": "man-hinh-asus-proart-pa248qfv",
  "msi-mag-275qf-27-2k-180hz": "man-hinh-msi-mag-275qf",
  "dell-ultrasharp-u2424h-23-8-fhd": "man-hinh-dell-ultrasharp-u2424h",
  "lg-ultragear-27g610a-27-qhd-200hz": "man-hinh-lg-ultragear-27g610a-b",
  "lg-27up600k-27-4k": "man-hinh-lg-27up600k-w",
  "vsp-g2718q1-27-2k-180hz": "man-hinh-vsp-2k-g2718q1",
  "asrock-cl25ffa-24-5-120hz": "man-hinh-asrock-cl25ffa",
  "vsp-ip2407s-23-8-120hz": "man-hinh-vsp-ip2407s",
  "asus-va259hga-24-5-120hz": "man-hinh-asus-va259hga",
  // Keyboards
  "ban-phim-logitech-k120": "ban-phim-logitech-k120",
  "ban-phim-mik-shiba": "ban-phim-mik-shiba",
  "ban-phim-edra-ek506": "ban-phim-e-dra-ek506",
  "dareu-ek75-grey-black": "ban-phim-dareu-ek75-grey-black",
  "dareu-ek98x-black-grey": "ban-phim-dareu-ek98x-black-grey",
  "dareu-ek75-pro-cloudy-aqua": "ban-phim-dareu-ek75-pro-cloudy-aqua",
  "darmoshark-top87-trimode": "ban-phim-darmoshark-top-87-tri-mode-rgb",
  "machenike-kg98-black-green": "ban-phim-machenike-kg98-black-green",
  "dareu-ek98l-grey-black": "ban-phim-dareu-ek98l-grey-black",
  "asus-tuf-gaming-k3-gen2": "ban-phim-asus-tuf-gaming-k3-gen-ii",
  "darmoshark-top98-trimode-black": "ban-phim-darmoshark-top98-trio-mode-black",
  "motospeed-k103-black": "ban-phim-motospeed-k103-black",
  "fuhlen-l411-usb-black": "ban-phim-fuhlen-l411-usb-black",
  "machenike-kg98-white-blue": "ban-phim-machenike-kg98-white-blue",
};

// For products NOT on nguyencongpc, search alternative image sources
const directImageUrls = {
  // PC builds - use generic PC images from free sources
  "bo-pc-ryzen-5-3400g-16gb":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_19.png",
  "bo-pc-gaming-ryzen5-5500gt":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_20.png",
  "bo-pc-gaming-i5-12400f-rtx5050":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_15.png",
  "bo-pc-gaming-r5-7500x3d-rtx5060ti":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_14.png",
  "bo-pc-gaming-ultra9-285k-rtx5070ti":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_11.png",
  "bo-pc-gaming-r7-9800x3d-rtx5080":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/t/e/text_ng_n_12.png",
  // Components
  "cpu-amd-ryzen-7-9800x3d":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/m/amd-ryzen-7-9800x3d.png",
  "cpu-intel-core-i5-14400f":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/n/intel-core-i5-14400f.png",
  "vga-rtx-5070-ti-16gb":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/e/geforce-rtx-5070-ti.png",
  "ram-kingston-fury-beast-16gb-ddr5-6000":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/k/i/kingston-fury-beast-ddr5.png",
  "ssd-samsung-990-evo-plus-1tb":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-990-evo-plus.png",
  "mainboard-msi-mag-b650-tomahawk-wifi":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/s/msi-mag-b650-tomahawk.png",
  "nguon-corsair-rm850x-850w":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/o/corsair-rm850x.png",
  "tan-nhiet-deepcool-ls720-se-360mm":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/e/deepcool-ls720-se.png",
  // Accessories
  "tai-nghe-logitech-g-pro-x2":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/l/o/logitech-g-pro-x-2.png",
  "chuot-logitech-g502x-plus":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/l/o/logitech-g502-x-plus.png",
  "ghe-gaming-dxracer-craft-d5000":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/x/dxracer-craft.png",
  "webcam-logitech-c920e":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/l/o/logitech-c920e.png",
  "balo-asus-rog-ranger-bp1500g":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/s/asus-rog-ranger-bp1500g.png",
  "lot-chuot-artisan-hien-fx-xl":
    "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/r/artisan-hien-fx.png",
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  let updated = 0;
  let failed = 0;

  // Phase 1: Products from nguyencongpc.vn (fetch page -> extract image -> download)
  const ncSlugs = Object.keys(nguyencongPages);
  console.log(`\n=== Phase 1: nguyencongpc.vn (${ncSlugs.length} products) ===\n`);

  for (let i = 0; i < ncSlugs.length; i += 3) {
    const batch = ncSlugs.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (slug) => {
        const pageSlug = nguyencongPages[slug];
        const pageUrl = `https://nguyencongpc.vn/${pageSlug}`;
        try {
          const imgUrl = await findImageFromPage(pageUrl);
          if (!imgUrl) {
            console.log(`  SKIP ${slug} - no image found on page`);
            return { slug, dbPath: null };
          }
          const fullUrl = imgUrl.startsWith("http")
            ? imgUrl
            : `https://nguyencongpc.vn${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;
          const dbPath = await downloadImage(slug, fullUrl);
          if (dbPath) {
            console.log(
              `  OK ${slug} -> ${path.basename(dbPath)}`
            );
          } else {
            console.log(`  SKIP ${slug} - image too small`);
          }
          return { slug, dbPath };
        } catch (e) {
          console.log(`  FAIL ${slug}: ${e.message}`);
          return { slug, dbPath: null };
        }
      })
    );

    for (const { slug, dbPath } of results) {
      if (dbPath) {
        await pool.query(
          "UPDATE products SET cover_image_url = $1 WHERE slug = $2 AND cover_image_url IS NULL",
          [dbPath, slug]
        );
        updated++;
      } else {
        failed++;
      }
    }
    await sleep(500); // be polite
  }

  // Phase 2: Direct image URLs (PC builds, components, accessories)
  const directSlugs = Object.keys(directImageUrls);
  console.log(
    `\n=== Phase 2: Direct URLs (${directSlugs.length} products) ===\n`
  );

  for (let i = 0; i < directSlugs.length; i += 3) {
    const batch = directSlugs.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (slug) => {
        try {
          const dbPath = await downloadImage(slug, directImageUrls[slug]);
          if (dbPath) {
            console.log(`  OK ${slug} -> ${path.basename(dbPath)}`);
          } else {
            console.log(`  SKIP ${slug} - image too small`);
          }
          return { slug, dbPath };
        } catch (e) {
          console.log(`  FAIL ${slug}: ${e.message}`);
          return { slug, dbPath: null };
        }
      })
    );

    for (const { slug, dbPath } of results) {
      if (dbPath) {
        await pool.query(
          "UPDATE products SET cover_image_url = $1 WHERE slug = $2 AND cover_image_url IS NULL",
          [dbPath, slug]
        );
        updated++;
      } else {
        failed++;
      }
    }
  }

  // Summary
  const { rows } = await pool.query(
    "SELECT slug, name FROM products WHERE cover_image_url IS NULL AND product_status='active'"
  );

  console.log(`\n========== SUMMARY ==========`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Still missing: ${rows.length}`);
  if (rows.length > 0) {
    rows.forEach((r) => console.log(`  - ${r.slug}`));
  }

  await pool.end();
}

main().catch(console.error);
