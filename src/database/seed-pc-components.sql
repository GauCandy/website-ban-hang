-- Seed PC components for gatecat.net
-- Linh kiện PC: CPU, GPU, RAM, SSD, Mainboard, PSU, Case, Tản nhiệt

DO $$
DECLARE
  v_seller_id UUID;
  v_cat_cpu UUID;
  v_cat_gpu UUID;
  v_cat_ram UUID;
  v_cat_ssd UUID;
  v_cat_mainboard UUID;
  v_cat_psu UUID;
  v_cat_case UUID;
  v_cat_cooler UUID;
  v_pid UUID;
BEGIN

SELECT id INTO v_seller_id FROM users LIMIT 1;
IF v_seller_id IS NULL THEN
  RAISE EXCEPTION 'No users found. Create a user first.';
END IF;

-- ═══════════════���═══════════════════════════════════
-- CATEGORIES
-- ═══════════════════════════════��═══════════════════

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'CPU - Bộ vi xử lý', 'cpu', 'Bộ vi xử lý Intel, AMD cho gaming và đồ họa')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_cpu FROM product_categories WHERE slug = 'cpu';

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'VGA - Card đồ họa', 'vga', 'Card đồ họa NVIDIA GeForce, AMD Radeon')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_gpu FROM product_categories WHERE slug = 'vga';

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'RAM - Bộ nhớ trong', 'ram', 'RAM DDR4, DDR5 cho PC desktop')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_ram FROM product_categories WHERE slug = 'ram';

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'SSD - Ổ cứng', 'ssd', 'Ổ cứng SSD NVMe, SATA cho PC')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_ssd FROM product_categories WHERE slug = 'ssd';

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Mainboard - Bo mạch chủ', 'mainboard', 'Bo mạch chủ Intel, AMD các socket')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_mainboard FROM product_categories WHERE slug = 'mainboard';

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'PSU - Nguồn máy tính', 'psu', 'Nguồn máy tính 80 Plus Bronze, Gold, Platinum')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_psu FROM product_categories WHERE slug = 'psu';

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Case - Vỏ máy tính', 'case-vo-may-tinh', 'Vỏ case máy tính ATX, mATX, ITX')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_case FROM product_categories WHERE slug = 'case-vo-may-tinh';

INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Tản nhiệt', 'tan-nhiet', 'Tản nhiệt khí, tản nhiệt nước AIO cho CPU')
  ON CONFLICT DO NOTHING;
SELECT id INTO v_cat_cooler FROM product_categories WHERE slug = 'tan-nhiet';

-- ═══════════════════════════════════════════════════
-- CPU - INTEL
-- ═══════════════════════════════════════════════════

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'Intel Core i9-14900K', 'intel-core-i9-14900k', 'CPU-I9-14900K',
  'CPU Intel thế hệ 14, 24 nhân 32 luồng, xung nhịp tối đa 6.0GHz, socket LGA 1700',
  '<p><strong>Intel Core i9-14900K</strong> là bộ vi xử lý flagship thế hệ 14 (Raptor Lake Refresh) dành cho desktop.</p><ul><li>24 nhân (8P + 16E) / 32 luồng</li><li>Xung nhịp boost tối đa: 6.0 GHz</li><li>Cache: 36MB Intel Smart Cache</li><li>TDP: 125W (PBP), 253W (MTP)</li><li>Socket: LGA 1700</li><li>Hỗ trợ DDR4/DDR5, PCIe 5.0</li><li>Đồ họa tích hợp Intel UHD 770</li></ul>',
  14490000, 15990000, 25, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/i9-14900k_d0ade2000c434e1e8e0f40a7b5cf5cde_grande.png')
RETURNING id INTO v_pid;

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'Intel Core i9-14900KF', 'intel-core-i9-14900kf', 'CPU-I9-14900KF',
  'CPU Intel thế hệ 14, 24 nhân 32 luồng, xung nhịp tối đa 6.0GHz, không GPU tích hợp',
  '<p><strong>Intel Core i9-14900KF</strong> — phiên bản không có GPU tích hợp của i9-14900K, hiệu năng tương đương.</p><ul><li>24 nhân (8P + 16E) / 32 luồng</li><li>Boost: 6.0 GHz</li><li>36MB Cache</li><li>TDP: 125W / 253W MTP</li><li>Socket LGA 1700</li><li>Không có iGPU — cần card đồ họa rời</li></ul>',
  13490000, 14990000, 30, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/i9-14900kf_b99f56a16b0b454984a41e5d3c1a5a25_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'Intel Core i7-14700K', 'intel-core-i7-14700k', 'CPU-I7-14700K',
  'CPU Intel thế hệ 14, 20 nhân 28 luồng, xung nhịp tối đa 5.6GHz, socket LGA 1700',
  '<p><strong>Intel Core i7-14700K</strong> — lựa chọn tối ưu cho gaming và sáng tạo nội dung.</p><ul><li>20 nhân (8P + 12E) / 28 luồng</li><li>Boost: 5.6 GHz</li><li>33MB Cache</li><li>TDP: 125W / 253W MTP</li><li>Socket LGA 1700</li><li>Intel UHD 770</li></ul>',
  9790000, 10990000, 40, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/i7-14700k_3b95fd60eefa43ca93c4ab5f5e6e31be_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'Intel Core i7-14700KF', 'intel-core-i7-14700kf', 'CPU-I7-14700KF',
  'CPU Intel thế hệ 14, 20 nhân 28 luồng, xung nhịp 5.6GHz, không GPU tích hợp',
  '<p><strong>Intel Core i7-14700KF</strong> — hiệu năng i7-14700K, giá tốt hơn nhờ không có iGPU.</p><ul><li>20 nhân / 28 luồng</li><li>Boost 5.6 GHz, 33MB Cache</li><li>Socket LGA 1700</li></ul>',
  9190000, 9990000, 35, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/i7-14700kf_da71e07c462e44e3a4d651c67d2bfd10_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'Intel Core i5-14600K', 'intel-core-i5-14600k', 'CPU-I5-14600K',
  'CPU Intel thế hệ 14, 14 nhân 20 luồng, xung nhịp tối đa 5.3GHz',
  '<p><strong>Intel Core i5-14600K</strong> — CPU gaming tầm trung hiệu năng mạnh mẽ.</p><ul><li>14 nhân (6P + 8E) / 20 luồng</li><li>Boost: 5.3 GHz</li><li>24MB Cache</li><li>TDP: 125W / 181W MTP</li><li>Socket LGA 1700</li></ul>',
  6990000, 7790000, 50, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/i5-14600k_d9bbed0cb03e42c4952f0e2b33e5ab05_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'Intel Core i5-14600KF', 'intel-core-i5-14600kf', 'CPU-I5-14600KF',
  'CPU Intel thế hệ 14, 14 nhân 20 luồng, 5.3GHz, không GPU tích hợp',
  '<p><strong>Intel Core i5-14600KF</strong> — hiệu năng gaming tuyệt vời ở tầm giá hợp lý.</p><ul><li>14 nhân / 20 luồng, Boost 5.3 GHz</li><li>24MB Cache, LGA 1700</li></ul>',
  6390000, 6990000, 45, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/i5-14600kf_2e1b4e43891e48af9b3b94f1eb37a63c_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'Intel Core i5-14400F', 'intel-core-i5-14400f', 'CPU-I5-14400F',
  'CPU Intel thế hệ 14, 10 nhân 16 luồng, xung nhịp 4.7GHz, giá rẻ cho gaming',
  '<p><strong>Intel Core i5-14400F</strong> — CPU giá rẻ nhất dòng i5 gen 14, phù hợp build PC gaming tầm trung.</p><ul><li>10 nhân (6P + 4E) / 16 luồng</li><li>Boost: 4.7 GHz</li><li>20MB Cache</li><li>TDP: 65W / 148W MTP</li><li>Socket LGA 1700</li></ul>',
  4390000, 4990000, 60, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/i5-14400f_e66f57a1cec24ff6913855ef32f5c12c_grande.png');

-- CPU - AMD

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'AMD Ryzen 9 7950X', 'amd-ryzen-9-7950x', 'CPU-R9-7950X',
  'CPU AMD Zen 4, 16 nhân 32 luồng, xung nhịp tối đa 5.7GHz, socket AM5',
  '<p><strong>AMD Ryzen 9 7950X</strong> — CPU đa nhân mạnh nhất của AMD trên nền tảng AM5.</p><ul><li>16 nhân / 32 luồng</li><li>Boost: 5.7 GHz</li><li>80MB Cache (L2+L3)</li><li>TDP: 170W</li><li>Socket AM5</li><li>Hỗ trợ DDR5, PCIe 5.0</li><li>GPU tích hợp RDNA 2</li></ul>',
  13990000, 16490000, 15, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/7950x_f1a7990f9e6649f0a05f8d9aa259ed78_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'AMD Ryzen 9 7900X', 'amd-ryzen-9-7900x', 'CPU-R9-7900X',
  'CPU AMD Zen 4, 12 nhân 24 luồng, boost 5.6GHz, socket AM5',
  '<p><strong>AMD Ryzen 9 7900X</strong> — hiệu năng cực cao cho gaming và workstation.</p><ul><li>12 nhân / 24 luồng</li><li>Boost: 5.6 GHz</li><li>76MB Cache</li><li>TDP: 170W, Socket AM5</li></ul>',
  9990000, 12490000, 20, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/7900x_2e8ba3d0fa7248a2aa42e8c6a7b35025_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d', 'CPU-R7-7800X3D',
  'CPU AMD Zen 4 với 3D V-Cache, 8 nhân 16 luồng, CPU gaming tốt nhất',
  '<p><strong>AMD Ryzen 7 7800X3D</strong> — CPU gaming nhanh nhất nhờ công nghệ 3D V-Cache 96MB.</p><ul><li>8 nhân / 16 luồng</li><li>Boost: 5.0 GHz</li><li>96MB 3D V-Cache + 8MB L2</li><li>TDP: 120W</li><li>Socket AM5</li><li>Tối ưu cho gaming, FPS cao hơn mọi đối thủ</li></ul>',
  9490000, 10990000, 30, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/7800x3d_a5a78c16bdaa4d05b0bc2fa7073b60f5_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'AMD Ryzen 7 7700X', 'amd-ryzen-7-7700x', 'CPU-R7-7700X',
  'CPU AMD Zen 4, 8 nhân 16 luồng, boost 5.4GHz, AM5',
  '<p><strong>AMD Ryzen 7 7700X</strong> — hiệu năng cao cho gaming và đa nhiệm.</p><ul><li>8 nhân / 16 luồng</li><li>Boost: 5.4 GHz</li><li>40MB Cache, TDP 105W</li><li>Socket AM5</li></ul>',
  7290000, 8490000, 35, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/7700x_79ffbb5c2f5841399f8f36acc2cee10c_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'AMD Ryzen 5 7600X', 'amd-ryzen-5-7600x', 'CPU-R5-7600X',
  'CPU AMD Zen 4, 6 nhân 12 luồng, boost 5.3GHz, giá tốt cho gaming',
  '<p><strong>AMD Ryzen 5 7600X</strong> — CPU tầm trung xuất sắc trên nền tảng AM5.</p><ul><li>6 nhân / 12 luồng</li><li>Boost: 5.3 GHz, 38MB Cache</li><li>TDP: 105W, Socket AM5</li></ul>',
  4990000, 5990000, 50, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/7600x_80c9b8dca4ba41c1bc58ae8fc1f88d94_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cpu,
  'AMD Ryzen 5 7600', 'amd-ryzen-5-7600', 'CPU-R5-7600',
  'CPU AMD Zen 4, 6 nhân 12 luồng, boost 5.1GHz, kèm tản nhiệt Wraith Stealth',
  '<p><strong>AMD Ryzen 5 7600</strong> — CPU giá rẻ nhất AM5, kèm tản nhiệt.</p><ul><li>6 nhân / 12 luồng, Boost 5.1 GHz</li><li>38MB Cache, TDP 65W</li><li>Kèm tản Wraith Stealth</li></ul>',
  4390000, 4990000, 55, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/7600_caa5e2a753674131b1c29d5b7f72ee1d_grande.png');

-- ═══════════════════════════════════════════════════
-- VGA - NVIDIA
-- ═════════════════════════════════════════════════���═

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'NVIDIA GeForce RTX 4090 Founders Edition', 'nvidia-rtx-4090-fe', 'VGA-RTX4090-FE',
  'Card đồ họa cao cấp nhất, 24GB GDDR6X, 16384 CUDA Cores',
  '<p><strong>RTX 4090 Founders Edition</strong> — GPU mạnh nhất thế giới cho gaming và AI.</p><ul><li>24GB GDDR6X, 384-bit</li><li>16384 CUDA Cores</li><li>Boost Clock: 2520 MHz</li><li>TDP: 450W</li><li>DLSS 3, Ray Tracing Gen 3</li></ul>',
  49990000, 54990000, 5, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/rtx_4090_fe_12de83f5adcd47e9b4e11ee2e2bc7b08_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'MSI GeForce RTX 4080 SUPER GAMING X TRIO', 'msi-rtx-4080-super-gaming-x-trio', 'VGA-RTX4080S-MSI-GXT',
  'Card đồ họa RTX 4080 SUPER, 16GB GDDR6X, tản nhiệt 3 fan',
  '<p><strong>MSI RTX 4080 SUPER GAMING X TRIO</strong></p><ul><li>16GB GDDR6X, 256-bit</li><li>10240 CUDA Cores</li><li>Boost: 2610 MHz</li><li>TDP: 320W</li><li>Tản nhiệt TRI FROZR 3</li></ul>',
  29990000, 33990000, 8, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/4080_super_gaming_x_trio_b4bc3dfd34b24e5da47bd21ecba3e46a_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'ASUS ROG STRIX RTX 4070 Ti SUPER OC', 'asus-rog-strix-rtx-4070-ti-super-oc', 'VGA-RTX4070TIS-ASUS-STRIX',
  'Card đồ họa RTX 4070 Ti SUPER, 16GB GDDR6X, ROG STRIX OC Edition',
  '<p><strong>ASUS ROG STRIX RTX 4070 Ti SUPER OC</strong></p><ul><li>16GB GDDR6X, 256-bit</li><li>8448 CUDA Cores</li><li>OC Mode: 2670 MHz</li><li>TDP: 285W</li><li>Tản nhiệt Axial-tech 3 fan</li></ul>',
  23490000, 25990000, 12, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/4070_ti_super_strix_oc_ad4e8a94c05b472b85a8e1db69fa3b5f_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'GIGABYTE GeForce RTX 4070 SUPER GAMING OC', 'gigabyte-rtx-4070-super-gaming-oc', 'VGA-RTX4070S-GIG-GOC',
  'Card đồ họa RTX 4070 SUPER, 12GB GDDR6X, WINDFORCE 3 fan',
  '<p><strong>GIGABYTE RTX 4070 SUPER GAMING OC</strong></p><ul><li>12GB GDDR6X, 192-bit</li><li>7168 CUDA Cores</li><li>Boost: 2543 MHz</li><li>TDP: 220W</li><li>WINDFORCE 3X cooling</li></ul>',
  15990000, 17490000, 20, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/4070_super_gaming_oc_91f0f4e0de41410f8443cc0c4e3f4c11_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'MSI GeForce RTX 4060 Ti GAMING X 8GB', 'msi-rtx-4060-ti-gaming-x-8g', 'VGA-RTX4060TI-MSI-GX',
  'Card đồ họa RTX 4060 Ti, 8GB GDDR6, tản nhiệt TWIN FROZR 9',
  '<p><strong>MSI RTX 4060 Ti GAMING X</strong></p><ul><li>8GB GDDR6, 128-bit</li><li>4352 CUDA Cores</li><li>Boost: 2655 MHz</li><li>TDP: 165W</li></ul>',
  11490000, 12490000, 25, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/4060_ti_gaming_x_67ed31a02c5447d59d57cb8e36ca4cce_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'ASUS DUAL GeForce RTX 4060 OC 8GB', 'asus-dual-rtx-4060-oc-8g', 'VGA-RTX4060-ASUS-DUAL',
  'Card đồ họa RTX 4060, 8GB GDDR6, tản nhiệt 2 fan Axial-tech',
  '<p><strong>ASUS DUAL RTX 4060 OC</strong> — card đồ họa 1080p gaming tầm trung.</p><ul><li>8GB GDDR6, 128-bit</li><li>3072 CUDA Cores</li><li>OC Mode: 2535 MHz</li><li>TDP: 115W</li></ul>',
  8290000, 8990000, 30, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/4060_dual_oc_7def8e79e82d41b5bb9b8e7cbf67b3d5_grande.png');

-- VGA - AMD

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'SAPPHIRE NITRO+ AMD Radeon RX 7900 XTX', 'sapphire-nitro-rx-7900-xtx', 'VGA-RX7900XTX-SAP-NITRO',
  'Card đồ họa AMD RX 7900 XTX, 24GB GDDR6, hiệu năng ngang RTX 4080',
  '<p><strong>SAPPHIRE NITRO+ RX 7900 XTX</strong></p><ul><li>24GB GDDR6, 384-bit</li><li>6144 Stream Processors</li><li>Boost: 2525 MHz</li><li>TDP: 355W</li><li>Tản nhiệt Tri-X 3 fan</li></ul>',
  27990000, 31990000, 10, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/7900_xtx_nitro__4cdb3e0df1d3425bab3dded7d0b8baba_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_gpu,
  'GIGABYTE AMD Radeon RX 7800 XT GAMING OC', 'gigabyte-rx-7800-xt-gaming-oc', 'VGA-RX7800XT-GIG-GOC',
  'Card đồ họa AMD RX 7800 XT, 16GB GDDR6, gaming 1440p',
  '<p><strong>GIGABYTE RX 7800 XT GAMING OC</strong></p><ul><li>16GB GDDR6, 256-bit</li><li>3840 Stream Processors</li><li>Boost: 2254 MHz</li><li>TDP: 263W</li></ul>',
  12990000, 13990000, 18, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/7800_xt_gaming_oc_3e19a69e72d7482a906b7917d20ceaff_grande.png');

-- ═══════════════════════════════════════════════════
-- RAM
-- ══════════════════════════════════════════════════��

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ram,
  'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000MHz', 'gskill-trident-z5-rgb-32gb-ddr5-6000', 'RAM-TZ5-32G-6000',
  'RAM DDR5 32GB kit, tốc độ 6000MHz CL30, RGB, tối ưu cho Intel & AMD',
  '<p><strong>G.Skill Trident Z5 RGB DDR5-6000</strong></p><ul><li>Dung lượng: 32GB (2x16GB)</li><li>Tốc độ: DDR5-6000 CL30-40-40-96</li><li>Điện áp: 1.35V</li><li>LED RGB tích hợp</li><li>Hỗ trợ Intel XMP 3.0 & AMD EXPO</li></ul>',
  3290000, 3690000, 40, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/trident_z5_rgb_ddr5_1__bc6d17a9d66143508553ced3ba27e46b_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ram,
  'Kingston FURY Beast 32GB (2x16GB) DDR5 5600MHz', 'kingston-fury-beast-32gb-ddr5-5600', 'RAM-KFB-32G-5600',
  'RAM DDR5 32GB kit, 5600MHz CL36, thiết kế heatsink đen',
  '<p><strong>Kingston FURY Beast DDR5-5600</strong></p><ul><li>32GB (2x16GB)</li><li>DDR5-5600 CL36</li><li>1.25V</li><li>Intel XMP 3.0</li><li>Heatsink nhôm tản nhiệt tốt</li></ul>',
  2290000, 2590000, 50, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/fury_beast_ddr5_1b88d8b6f1bd40279c3e9e39ef3fcf14_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ram,
  'Corsair Vengeance 32GB (2x16GB) DDR5 5600MHz', 'corsair-vengeance-32gb-ddr5-5600', 'RAM-CV-32G-5600',
  'RAM DDR5 32GB, 5600MHz, profile thấp, tương thích tản khí lớn',
  '<p><strong>Corsair Vengeance DDR5-5600</strong></p><ul><li>32GB (2x16GB)</li><li>DDR5-5600 CL36</li><li>Profile thấp — không conflict tản nhiệt</li><li>Intel XMP 3.0 & AMD EXPO</li></ul>',
  2190000, 2490000, 55, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/vengeance_ddr5_5600_c858c10b32f240e79fa1d5e17f2b2de2_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ram,
  'G.Skill Trident Z5 RGB 64GB (2x32GB) DDR5 6000MHz', 'gskill-trident-z5-rgb-64gb-ddr5-6000', 'RAM-TZ5-64G-6000',
  'RAM DDR5 64GB kit cho workstation và sáng tạo nội dung',
  '<p><strong>G.Skill Trident Z5 RGB 64GB DDR5-6000</strong></p><ul><li>64GB (2x32GB)</li><li>DDR5-6000 CL30</li><li>RGB, XMP 3.0</li></ul>',
  5990000, 6790000, 15, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/trident_z5_rgb_ddr5_1__bc6d17a9d66143508553ced3ba27e46b_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ram,
  'Kingston FURY Beast 16GB (2x8GB) DDR4 3200MHz', 'kingston-fury-beast-16gb-ddr4-3200', 'RAM-KFB-16G-3200',
  'RAM DDR4 16GB kit, tốc độ 3200MHz, giá rẻ cho hệ thống DDR4',
  '<p><strong>Kingston FURY Beast DDR4-3200</strong></p><ul><li>16GB (2x8GB)</li><li>DDR4-3200 CL16</li><li>1.35V</li><li>Intel XMP</li></ul>',
  890000, 1090000, 80, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/fury_beast_ddr4_rgb_ab59ffa3d1cd4d8fb60c9aa0ded9d3f2_grande.png');

-- ═══════════════════════════════════════════════════
-- SSD
-- ════════════════════════════════════════��══════════

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ssd,
  'Samsung 990 PRO 2TB NVMe M.2', 'samsung-990-pro-2tb', 'SSD-SAM990P-2T',
  'SSD NVMe Gen 4, tốc độ đọc 7450MB/s, ghi 6900MB/s, cho gaming & workstation',
  '<p><strong>Samsung 990 PRO 2TB</strong></p><ul><li>Dung lượng: 2TB</li><li>Chuẩn: NVMe PCIe Gen 4x4, M.2 2280</li><li>Đọc: 7450 MB/s, Ghi: 6900 MB/s</li><li>TBW: 1200TB</li><li>Controller Samsung Pascal</li></ul>',
  4690000, 5290000, 30, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/990_pro_2tb_30f7ed6c05c14dc0be9b5459c4da1f18_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ssd,
  'Samsung 990 PRO 1TB NVMe M.2', 'samsung-990-pro-1tb', 'SSD-SAM990P-1T',
  'SSD NVMe Gen 4, tốc độ đọc 7450MB/s, phù hợp cài hệ điều hành + game',
  '<p><strong>Samsung 990 PRO 1TB</strong></p><ul><li>1TB NVMe PCIe Gen 4x4</li><li>Đọc: 7450 MB/s, Ghi: 6900 MB/s</li><li>TBW: 600TB</li></ul>',
  2690000, 2990000, 45, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/990_pro_1tb_51eaba88f5d54d54891fb4ca2aafdc03_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ssd,
  'WD Black SN850X 2TB NVMe M.2', 'wd-black-sn850x-2tb', 'SSD-WD850X-2T',
  'SSD NVMe Gen 4, đọc 7300MB/s, tối ưu cho gaming',
  '<p><strong>WD Black SN850X 2TB</strong></p><ul><li>2TB NVMe PCIe Gen 4x4</li><li>Đọc: 7300 MB/s, Ghi: 6600 MB/s</li><li>Game Mode 2.0</li></ul>',
  4190000, 4790000, 25, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/sn850x_2tb_f2e88be7f7b24c28ac7a85c81e00b9f5_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ssd,
  'WD Black SN850X 1TB NVMe M.2', 'wd-black-sn850x-1tb', 'SSD-WD850X-1T',
  'SSD NVMe Gen 4, đọc 7300MB/s, giá tốt cho 1TB',
  '<p><strong>WD Black SN850X 1TB</strong></p><ul><li>1TB NVMe PCIe Gen 4</li><li>Đọc: 7300 MB/s, Ghi: 6300 MB/s</li></ul>',
  2290000, 2690000, 40, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/sn850x_1tb_3f74ed2d3dff487cab7f6cdec94dd4f3_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_ssd,
  'Samsung 870 EVO 1TB SATA 2.5"', 'samsung-870-evo-1tb', 'SSD-SAM870E-1T',
  'SSD SATA III 2.5 inch, đọc 560MB/s, nâng cấp từ HDD',
  '<p><strong>Samsung 870 EVO 1TB</strong> — SSD SATA tốt nhất để nâng cấp laptop/PC cũ.</p><ul><li>1TB, SATA III 6Gb/s</li><li>Đọc: 560 MB/s, Ghi: 530 MB/s</li><li>TBW: 600TB</li></ul>',
  1990000, 2290000, 60, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/870_evo_1tb_d35aa42b5f6d49e4a2c90db8fc3fe30b_grande.png');

-- ═══════════════════════════════════════════════════
-- MAINBOARD
-- ═════════════════════════════════════════��═════════

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_mainboard,
  'ASUS ROG STRIX Z790-E GAMING WIFI', 'asus-rog-strix-z790-e-gaming-wifi', 'MB-ASUS-Z790E',
  'Mainboard Intel Z790, DDR5, PCIe 5.0, WiFi 6E, ATX',
  '<p><strong>ASUS ROG STRIX Z790-E GAMING WIFI</strong></p><ul><li>Socket LGA 1700 (Intel 12/13/14th Gen)</li><li>DDR5, 4 khe DIMM, tối đa 128GB</li><li>PCIe 5.0 x16, 4x M.2 NVMe</li><li>WiFi 6E + Bluetooth 5.3</li><li>2.5G LAN</li><li>Audio ROG SupremeFX ALC4080</li></ul>',
  9990000, 11490000, 15, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/z790-e_gaming_wifi_41f8b4e9cc5845bdba0bfda0cb64a5c3_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_mainboard,
  'MSI MAG B760 TOMAHAWK WIFI DDR5', 'msi-mag-b760-tomahawk-wifi-ddr5', 'MB-MSI-B760-TOM',
  'Mainboard Intel B760, DDR5, WiFi 6E, tầm trung chất lượng cao',
  '<p><strong>MSI MAG B760 TOMAHAWK WIFI</strong></p><ul><li>Socket LGA 1700</li><li>DDR5, 4 khe DIMM, tối đa 128GB</li><li>2x M.2, PCIe 4.0</li><li>WiFi 6E, 2.5G LAN</li><li>USB-C 20Gbps</li></ul>',
  5490000, 5990000, 25, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/b760_tomahawk_wifi_ddr5_3e6db0b4c9ab44d68ae5ec7eb8b5e8b7_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_mainboard,
  'GIGABYTE B650 AORUS ELITE AX V2', 'gigabyte-b650-aorus-elite-ax-v2', 'MB-GIG-B650-ELITE',
  'Mainboard AMD B650, DDR5, WiFi 6E, PCIe 5.0 M.2',
  '<p><strong>GIGABYTE B650 AORUS ELITE AX V2</strong></p><ul><li>Socket AM5 (Ryzen 7000)</li><li>DDR5, 4 khe DIMM</li><li>PCIe 5.0 M.2, PCIe 4.0 x16</li><li>WiFi 6E + BT 5.3</li><li>2.5G LAN</li></ul>',
  5290000, 5790000, 20, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/b650_aorus_elite_ax_v2_3c0a6dfd927e42c49b6e5ccc2ad31e72_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_mainboard,
  'ASUS ROG STRIX X670E-E GAMING WIFI', 'asus-rog-strix-x670e-e-gaming-wifi', 'MB-ASUS-X670E-E',
  'Mainboard AMD X670E cao cấp, DDR5, PCIe 5.0, WiFi 6E',
  '<p><strong>ASUS ROG STRIX X670E-E GAMING WIFI</strong></p><ul><li>Socket AM5</li><li>DDR5, PCIe 5.0 x16 + M.2</li><li>WiFi 6E, 2.5G LAN</li><li>18+2 VRM phases</li></ul>',
  11990000, 13490000, 10, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/x670e-e_gaming_wifi_1b01f3697aa04b7884b3c1f4b4ecde54_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_mainboard,
  'MSI PRO B660M-A WIFI DDR4', 'msi-pro-b660m-a-wifi-ddr4', 'MB-MSI-B660M-A',
  'Mainboard Intel B660 giá rẻ, DDR4, mATX, WiFi',
  '<p><strong>MSI PRO B660M-A WIFI DDR4</strong> — mainboard tầm trung giá rẻ cho build PC tiết kiệm.</p><ul><li>Socket LGA 1700</li><li>DDR4, 2 khe DIMM</li><li>1x M.2, PCIe 4.0</li><li>WiFi + BT</li></ul>',
  2990000, 3290000, 35, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/b660m-a_wifi_ddr4_b891fb63ef89411987f7f3c90cedc9ea_grande.png');

-- ═══════════════════════════════════════════════════
-- PSU - NGUỒN
-- ═══════════════════════════════════════════════════

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_psu,
  'Corsair RM1000x 1000W 80 Plus Gold', 'corsair-rm1000x-1000w', 'PSU-COR-RM1000X',
  'Nguồn 1000W full modular, 80 Plus Gold, quạt 0 RPM mode',
  '<p><strong>Corsair RM1000x</strong></p><ul><li>Công suất: 1000W</li><li>Chứng nhận: 80 Plus Gold</li><li>Full modular</li><li>Quạt 135mm Zero RPM mode</li><li>Bảo hành 10 năm</li></ul>',
  4290000, 4790000, 20, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/rm1000x_9cdc8e7e21d84990b64f29f3e20e7f50_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_psu,
  'Corsair RM850x 850W 80 Plus Gold', 'corsair-rm850x-850w', 'PSU-COR-RM850X',
  'Nguồn 850W full modular, 80 Plus Gold, đủ cho RTX 4070/4080',
  '<p><strong>Corsair RM850x</strong></p><ul><li>850W, 80 Plus Gold</li><li>Full modular</li><li>Quạt 135mm Zero RPM</li><li>Bảo hành 10 năm</li></ul>',
  3190000, 3490000, 30, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/rm850x_6a6a31d2d3a94e5e8b37f2bfb2b79f22_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_psu,
  'MSI MAG A750GL PCIE5 750W 80 Plus Gold', 'msi-mag-a750gl-pcie5-750w', 'PSU-MSI-A750GL',
  'Nguồn 750W full modular, 80 Plus Gold, hỗ trợ PCIe 5.0 12VHPWR',
  '<p><strong>MSI MAG A750GL PCIE5</strong></p><ul><li>750W, 80 Plus Gold</li><li>Full modular</li><li>Đầu nối 12VHPWR cho RTX 40 series</li><li>Quạt 120mm</li></ul>',
  2290000, 2590000, 40, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/a750gl_pcie5_ec9aa9a38e5647a8a0e72dfb86d6e5ca_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_psu,
  'Corsair CV650 650W 80 Plus Bronze', 'corsair-cv650-650w', 'PSU-COR-CV650',
  'Nguồn 650W giá rẻ, 80 Plus Bronze, cho build tầm trung',
  '<p><strong>Corsair CV650</strong></p><ul><li>650W, 80 Plus Bronze</li><li>Non-modular</li><li>Quạt 120mm</li><li>Bảo hành 3 năm</li></ul>',
  1090000, 1290000, 60, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/cv650_6bd20caa71504bb5bbd42ac76e0a5a98_grande.png');

-- ═══════════════════════════════════════════════════
-- CASE - VỎ MÁY TÍNH
-- ═════════════════════════════════════════��═════════

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_case,
  'NZXT H7 Flow RGB White', 'nzxt-h7-flow-rgb-white', 'CASE-NZXT-H7FLOW-W',
  'Case ATX mid-tower, airflow tốt, kính cường lực, 3 fan RGB',
  '<p><strong>NZXT H7 Flow RGB</strong></p><ul><li>Form factor: ATX Mid Tower</li><li>Kính cường lực hông</li><li>3x 120mm RGB fan đi kèm</li><li>Hỗ trợ tản nước 360mm top + front</li><li>Cable management tốt</li></ul>',
  3290000, 3690000, 15, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/h7_flow_rgb_white_1e7a5c8a39c541a38da22c05d4ae48c6_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_case,
  'Lian Li O11 Dynamic EVO', 'lian-li-o11-dynamic-evo', 'CASE-LL-O11-EVO',
  'Case ATX dual-chamber, hỗ trợ custom loop, kính cường lực',
  '<p><strong>Lian Li O11 Dynamic EVO</strong></p><ul><li>ATX Dual Chamber design</li><li>Kính cường lực 2 mặt</li><li>Hỗ trợ E-ATX, tản nước 360x3</li><li>Thiết kế modular linh hoạt</li></ul>',
  3990000, 4390000, 12, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/o11_dynamic_evo_f25d8e9bae4947c78e0c2e5dcf1e7d82_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_case,
  'Corsair 4000D Airflow Black', 'corsair-4000d-airflow-black', 'CASE-COR-4000D-AF',
  'Case ATX mid-tower airflow, giá rẻ, popular nhất thế giới',
  '<p><strong>Corsair 4000D Airflow</strong> — case best-seller, airflow + cable management xuất sắc.</p><ul><li>ATX Mid Tower</li><li>2x 120mm fan đi kèm</li><li>Kính cường lực</li><li>Hỗ trợ tản nước 360mm front</li></ul>',
  2290000, 2590000, 30, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/4000d_airflow_black_2e2e0e8f4b9b4d1f9b0c0fa2e8c46de7_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_case,
  'NZXT H5 Flow Black', 'nzxt-h5-flow-black', 'CASE-NZXT-H5FLOW',
  'Case ATX compact, thiết kế gọn gàng, airflow tốt',
  '<p><strong>NZXT H5 Flow</strong></p><ul><li>ATX Mid Tower compact</li><li>2x 120mm fan đi kèm</li><li>Kính cường lực</li><li>Cable management routing</li></ul>',
  1790000, 1990000, 25, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/h5_flow_black_f0c07de80e0a461f850f3c5fc3c8ed90_grande.png');

-- ════════════════════════════════════════════��══════
-- TẢN NHIỆT
-- ═══════════════════════════════════════════════════

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cooler,
  'NZXT Kraken X73 RGB 360mm AIO', 'nzxt-kraken-x73-rgb-360mm', 'COOL-NZXT-X73-RGB',
  'Tản nước AIO 360mm, 3 fan RGB, màn hình LCD trên pump',
  '<p><strong>NZXT Kraken X73 RGB</strong></p><ul><li>Tản nước AIO 360mm</li><li>3x 120mm Aer RGB fan</li><li>Màn hình LCD 1.54" trên pump head</li><li>Hỗ trợ Intel LGA 1700/1200, AMD AM5/AM4</li></ul>',
  5490000, 5990000, 15, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/kraken_x73_rgb_b10b3a0dc37f4ccf8f9db2e1d1c7f2e0_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cooler,
  'Corsair iCUE H150i ELITE CAPELLIX 360mm', 'corsair-h150i-elite-capellix-360mm', 'COOL-COR-H150I-EC',
  'Tản nước AIO 360mm, 3 fan ML120 RGB, Corsair Commander CORE',
  '<p><strong>Corsair iCUE H150i ELITE CAPELLIX</strong></p><ul><li>Tản nước AIO 360mm</li><li>3x ML120 RGB fan</li><li>CAPELLIX LED pump head</li><li>Commander CORE controller đi kèm</li></ul>',
  4790000, 5290000, 18, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/h150i_elite_capellix_f7ad28c5b43c491f860b92b09cd2e6ff_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cooler,
  'Noctua NH-D15 Chromax Black', 'noctua-nh-d15-chromax-black', 'COOL-NOC-NHD15-BK',
  'Tản nhiệt khí dual tower, 2 fan 150mm, hiệu năng ngang AIO 280mm',
  '<p><strong>Noctua NH-D15 Chromax Black</strong> — tản khí tốt nhất thế giới.</p><ul><li>Dual tower, 6 ống đồng</li><li>2x NF-A15 PWM 150mm</li><li>TDP: lên tới 250W</li><li>Cao: 165mm</li><li>Hoàn toàn im lặng</li></ul>',
  2690000, 2990000, 20, 'active', true, NOW(),
  'https://product.hstatic.net/200000722513/product/nh-d15_chromax_black_d8c74e0e99324e1ca95e7c20e02b7eb6_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cooler,
  'DeepCool AK620 Digital', 'deepcool-ak620-digital', 'COOL-DC-AK620D',
  'Tản nhiệt khí dual tower, màn hình hiển thị nhiệt độ, giá rẻ',
  '<p><strong>DeepCool AK620 Digital</strong></p><ul><li>Dual tower, 6 ống đồng</li><li>2x 120mm FK120 fan</li><li>Màn hình digital hiển thị nhiệt độ CPU</li><li>TDP: 260W</li></ul>',
  1490000, 1690000, 30, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/ak620_digital_e4f0e7cd929f4c07baa9b90c8b5c8d7c_grande.png');

INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at, cover_image_url)
VALUES (gen_random_uuid(), v_seller_id, v_cat_cooler,
  'ID-COOLING SE-226-XT Black', 'id-cooling-se-226-xt-black', 'COOL-IDC-SE226XT',
  'Tản nhiệt khí single tower, 6 ống đồng, giá siêu rẻ hiệu năng cao',
  '<p><strong>ID-COOLING SE-226-XT</strong></p><ul><li>Single tower, 6 ống đồng</li><li>1x 120mm fan</li><li>TDP: 250W</li><li>Hỗ trợ LGA 1700, AM5</li></ul>',
  590000, 690000, 50, 'active', false, NOW(),
  'https://product.hstatic.net/200000722513/product/se-226-xt_black_6d3e5a19f6c1467d80e49d80a2a10ec5_grande.png');

RAISE NOTICE 'Seed PC components completed! Total: ~45 products across 8 categories.';
END $$;
