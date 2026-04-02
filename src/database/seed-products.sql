-- Seed real product data for gatecat.net
-- Reference: nguyencongpc.vn

-- Get first admin user as seller
DO $$
DECLARE
  v_seller_id UUID;
  v_cat_laptop UUID;
  v_cat_pc UUID;
  v_cat_monitor UUID;
  v_cat_keyboard UUID;
  v_cat_mouse UUID;
  v_cat_component UUID;
  v_cat_accessory UUID;
BEGIN

-- Get first user as seller
SELECT id INTO v_seller_id FROM users LIMIT 1;
IF v_seller_id IS NULL THEN
  RAISE EXCEPTION 'No users found. Create a user first.';
END IF;

-- Create categories
INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Laptop', 'laptop', 'Laptop gaming, văn phòng, đồ họa, mỏng nhẹ')
  ON CONFLICT DO NOTHING;
INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'PC Gaming', 'pc-gaming', 'Bộ máy tính để bàn gaming, workstation')
  ON CONFLICT DO NOTHING;
INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Màn hình', 'man-hinh', 'Màn hình máy tính gaming, đồ họa, văn phòng')
  ON CONFLICT DO NOTHING;
INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Bàn phím', 'ban-phim', 'Bàn phím cơ, bàn phím gaming, bàn phím văn phòng')
  ON CONFLICT DO NOTHING;
INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Chuột máy tính', 'chuot-may-tinh', 'Chuột gaming, chuột không dây, chuột ergonomic')
  ON CONFLICT DO NOTHING;
INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Linh kiện PC', 'linh-kien-pc', 'CPU, GPU, RAM, SSD, nguồn, case, tản nhiệt')
  ON CONFLICT DO NOTHING;
INSERT INTO product_categories (id, name, slug, description) VALUES
  (gen_random_uuid(), 'Phụ kiện', 'phu-kien', 'Tai nghe, webcam, ghế gaming, balo laptop')
  ON CONFLICT DO NOTHING;

-- Get category IDs
SELECT id INTO v_cat_laptop FROM product_categories WHERE slug = 'laptop';
SELECT id INTO v_cat_pc FROM product_categories WHERE slug = 'pc-gaming';
SELECT id INTO v_cat_monitor FROM product_categories WHERE slug = 'man-hinh';
SELECT id INTO v_cat_keyboard FROM product_categories WHERE slug = 'ban-phim';
SELECT id INTO v_cat_mouse FROM product_categories WHERE slug = 'chuot-may-tinh';
SELECT id INTO v_cat_component FROM product_categories WHERE slug = 'linh-kien-pc';
SELECT id INTO v_cat_accessory FROM product_categories WHERE slug = 'phu-kien';

-- ═══════════════════════════════════════
-- LAPTOP (13 sản phẩm - tham khảo nguyencongpc.vn)
-- ═══════════════════════════════════════

INSERT INTO products (seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at) VALUES
(v_seller_id, v_cat_laptop, 'Dell PV 15250 Essential', 'dell-pv-15250-essential',
 'SP-LAP-001', 'Laptop Dell PV 15250 Core 3-100U, 8GB RAM, 512GB SSD',
 'Laptop Dell PV 15250 Essential trang bị bộ xử lý Intel Core 3-100U, RAM 8GB DDR4, ổ cứng SSD 512GB NVMe, màn hình 15.6 inch Full HD 120Hz, card đồ họa Intel tích hợp. Phù hợp cho học tập và làm việc văn phòng cơ bản. Bảo hành 12 tháng chính hãng Dell.',
 11690000, NULL, 31, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'Lenovo LOQ Essential 15IAX9E', 'lenovo-loq-essential-15iax9e',
 'SP-LAP-002', 'Laptop Gaming Lenovo LOQ i5-12450HX, RTX 3050 6GB, 16GB RAM',
 'Lenovo LOQ Essential 15IAX9E sở hữu chip Intel Core i5-12450HX 8 nhân 12 luồng, card đồ họa NVIDIA GeForce RTX 3050 6GB GDDR6, RAM 16GB DDR5, SSD 512GB, màn hình 15.6 inch Full HD 144Hz. Thiết kế gaming mạnh mẽ, tản nhiệt hiệu quả.',
 20590000, NULL, 21, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'Lenovo ThinkPad E14 Gen 4', 'lenovo-thinkpad-e14-gen4',
 'SP-LAP-003', 'Laptop doanh nhân Lenovo ThinkPad E14 i7-1255U, 8GB, 256GB',
 'Lenovo ThinkPad E14 Gen 4 dòng laptop doanh nhân với Intel Core i7-1255U, RAM 8GB DDR4, SSD 256GB NVMe, màn hình 14 inch Full HD IPS. Bàn phím chống tràn, bảo mật vân tay, bền bỉ chuẩn quân đội MIL-STD-810H. Bảo hành 24 tháng.',
 15590000, 20900000, 34, 'active', true, NOW()),

(v_seller_id, v_cat_laptop, 'Gigabyte A16 CTHI3VN893SH', 'gigabyte-a16-cthi3vn893sh',
 'SP-LAP-004', 'Laptop Gaming Gigabyte A16 i7-13620H, RTX 5050 8GB, 16" 165Hz',
 'Gigabyte A16 CTHI3VN893SH với Intel Core i7-13620H, NVIDIA GeForce RTX 5050 8GB GDDR6, RAM 16GB DDR5, SSD 512GB, màn hình 16 inch FHD+ 165Hz. Hiệu năng gaming mạnh mẽ thế hệ mới, tản nhiệt WINDFORCE.',
 29490000, 35990000, 11, 'active', true, NOW()),

(v_seller_id, v_cat_laptop, 'Gigabyte A16 CMHI2VN893SH', 'gigabyte-a16-cmhi2vn893sh',
 'SP-LAP-005', 'Laptop Gaming Gigabyte A16 i7-13620H, RTX 4050 6GB, 16" 165Hz',
 'Gigabyte A16 CMHI2VN893SH trang bị Intel Core i7-13620H, NVIDIA GeForce RTX 4050 6GB GDDR6, RAM 16GB DDR5, SSD 512GB NVMe, màn hình 16 inch WUXGA 165Hz. Card đồ họa RTX 4050 mạnh mẽ cho gaming và sáng tạo nội dung.',
 27490000, 32990000, 15, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'HP 15-fd0133wm', 'hp-15-fd0133wm',
 'SP-LAP-006', 'Laptop HP 15 Core i3-1315U, 8GB RAM, 256GB SSD, 15.6" FHD',
 'HP 15-fd0133wm laptop phổ thông với Intel Core i3-1315U, RAM 8GB DDR4, SSD 256GB, màn hình 15.6 inch Full HD. Thiết kế mỏng nhẹ, pin lâu, phù hợp sinh viên và văn phòng. Bảo hành 12 tháng.',
 11300000, 15590000, 32, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'HP 15-fd0250wm', 'hp-15-fd0250wm',
 'SP-LAP-007', 'Laptop HP 15 Core i5-1334U, 8GB RAM, 512GB SSD',
 'HP 15-fd0250wm với Intel Core i5-1334U, RAM 8GB DDR4, SSD 512GB NVMe, màn hình 15.6 inch HD. Hiệu năng tốt cho công việc văn phòng, giải trí cơ bản. Bảo hành 12 tháng HP Việt Nam.',
 12990000, 16990000, 25, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'Dell Inspiron 14 5440', 'dell-inspiron-14-5440',
 'SP-LAP-008', 'Laptop Dell Inspiron 14 i5-1334U, 8GB, 512GB, 14" FHD+',
 'Dell Inspiron 14 5440 thiết kế sang trọng với Intel Core i5-1334U, RAM 8GB, SSD 512GB, màn hình 14 inch FHD+ IPS sắc nét. Vỏ nhôm cao cấp, bảo mật vân tay, phù hợp doanh nhân và sinh viên.',
 15490000, 20690000, 25, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'Dell DC15250 Touchscreen', 'dell-dc15250-touchscreen',
 'SP-LAP-009', 'Laptop Dell DC15250 i5-1334U, 8GB, 512GB, 15.6" FHD cảm ứng',
 'Dell DC15250 laptop màn hình cảm ứng 15.6 inch Full HD, Intel Core i5-1334U, RAM 8GB, SSD 512GB. Trải nghiệm cảm ứng mượt mà, đa nhiệm linh hoạt. Giảm giá 30% cực sốc.',
 13990000, 19990000, 12, 'active', true, NOW()),

(v_seller_id, v_cat_laptop, 'Lenovo ThinkBook 14G7+ AHP', 'lenovo-thinkbook-14g7-ahp',
 'SP-LAP-010', 'Laptop Lenovo ThinkBook 14 Ryzen 7, 24GB RAM, 14.5" 2.5K',
 'Lenovo ThinkBook 14G7+ AHP với AMD Ryzen 7 H 255, RAM 24GB DDR5, SSD 512GB, màn hình 14.5 inch 2.5K 90Hz IPS. Hiệu năng vượt trội, thiết kế chuyên nghiệp cho doanh nhân.',
 21990000, 25990000, 12, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'Gigabyte G5 KF-E3VN333SH', 'gigabyte-g5-kf-e3vn333sh',
 'SP-LAP-011', 'Laptop Gaming Gigabyte G5 i5-12500H, RTX 4060 8GB, 15.6" 144Hz',
 'Gigabyte G5 KF laptop gaming hot nhất với Intel Core i5-12500H, NVIDIA GeForce RTX 4060 8GB, RAM 8GB DDR4, SSD 512GB, màn hình 15.6 inch Full HD 144Hz. Đã bán 169 máy — bestseller gaming tầm trung.',
 23300000, 24990000, 50, 'active', true, NOW()),

(v_seller_id, v_cat_laptop, 'Gigabyte A16 CVHI3VN893SH', 'gigabyte-a16-cvhi3vn893sh',
 'SP-LAP-012', 'Laptop Gaming Gigabyte A16 i7-13620H, RTX 5060 8GB, 16" 165Hz',
 'Gigabyte A16 CVHI3VN893SH cao cấp với Intel Core i7-13620H, NVIDIA GeForce RTX 5060 8GB, RAM 16GB DDR5, SSD 512GB, màn hình 16 inch FHD+ 165Hz. RTX 5060 hiệu năng đỉnh cao cho gaming AAA.',
 33290000, 38990000, 10, 'active', false, NOW()),

(v_seller_id, v_cat_laptop, 'Gigabyte AORUS 16X ASG-53VNC54SH', 'gigabyte-aorus-16x-asg',
 'SP-LAP-013', 'Laptop Gaming AORUS 16X i7-14650HX, RTX 4070, 16" 2K 165Hz',
 'Gigabyte AORUS 16X flagship gaming với Intel Core i7-14650HX, NVIDIA GeForce RTX 4070 8GB, RAM 16GB DDR5, SSD 1TB, màn hình 16 inch WQXGA 165Hz. Hiệu năng đỉnh cao, tản nhiệt WINDFORCE Infinity.',
 38690000, 46950000, 8, 'active', true, NOW());

-- ═══════════════════════════════════════
-- PC GAMING (6 sản phẩm)
-- ═══════════════════════════════════════

INSERT INTO products (seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at) VALUES
(v_seller_id, v_cat_pc, 'Bộ PC Ryzen 5 3400G, RAM 16GB, SSD 256GB', 'bo-pc-ryzen-5-3400g-16gb',
 'SP-PC-001', 'PC văn phòng Ryzen 5 3400G tích hợp Vega 11, 16GB RAM',
 'Bộ máy tính để bàn AMD Ryzen 5 3400G với GPU tích hợp Radeon Vega 11, RAM 16GB DDR4, SSD 256GB NVMe. Phù hợp làm việc văn phòng, học tập, giải trí cơ bản. Bảo hành 24 tháng.',
 7990000, NULL, 20, 'active', false, NOW()),

(v_seller_id, v_cat_pc, 'Bộ PC Gaming Ryzen 5 5500GT, Vega 7, 16GB', 'bo-pc-gaming-ryzen5-5500gt',
 'SP-PC-002', 'PC Gaming giá rẻ Ryzen 5 5500GT, RX Vega 7, RAM 16GB',
 'PC Gaming entry-level AMD Ryzen 5 5500GT với GPU tích hợp RX Vega 7, RAM 16GB DDR4, SSD 512GB. Chơi được Valorant, LOL, CS2 mượt mà ở 1080p. Lựa chọn tối ưu chi phí cho game thủ.',
 9790000, NULL, 18, 'active', false, NOW()),

(v_seller_id, v_cat_pc, 'Bộ PC Gaming i5-12400F, RTX 5050 8GB', 'bo-pc-gaming-i5-12400f-rtx5050',
 'SP-PC-003', 'PC Gaming i5-12400F, RTX 5050 8GB, RAM 16GB DDR4',
 'Bộ PC Gaming hiệu năng tốt với Intel Core i5-12400F 6 nhân 12 luồng, card NVIDIA GeForce RTX 5050 8GB GDDR6, RAM 16GB DDR4, SSD 512GB NVMe. Chiến mượt mọi tựa game ở Full HD.',
 20090000, NULL, 15, 'active', true, NOW()),

(v_seller_id, v_cat_pc, 'Bộ PC Gaming Ryzen 5 7500X3D, RTX 5060Ti 16GB', 'bo-pc-gaming-r5-7500x3d-rtx5060ti',
 'SP-PC-004', 'PC Gaming cao cấp Ryzen 5 7500X3D, RTX 5060 Ti 16GB',
 'PC Gaming cao cấp AMD Ryzen 5 7500X3D (3D V-Cache gaming CPU), NVIDIA GeForce RTX 5060 Ti 16GB, RAM 16GB DDR5, SSD 1TB NVMe Gen4. Hiệu năng gaming đỉnh cao ở 1440p Ultra settings.',
 38990000, 42990000, 8, 'active', true, NOW()),

(v_seller_id, v_cat_pc, 'Bộ PC Gaming Core Ultra 9 285K, RTX 5070 Ti', 'bo-pc-gaming-ultra9-285k-rtx5070ti',
 'SP-PC-005', 'PC Enthusiast Ultra 9 285K, RTX 5070 Ti, 64GB DDR5',
 'Bộ PC Enthusiast tối thượng với Intel Core Ultra 9 285K, NVIDIA GeForce RTX 5070 Ti 16GB, RAM 64GB DDR5, SSD 2TB NVMe Gen5. Dành cho game thủ hardcore và content creator chuyên nghiệp.',
 98190000, 109990000, 3, 'active', true, NOW()),

(v_seller_id, v_cat_pc, 'Bộ PC Gaming Ryzen 7 9800X3D, RTX 5080 16GB', 'bo-pc-gaming-r7-9800x3d-rtx5080',
 'SP-PC-006', 'PC Ultimate R7 9800X3D, RTX 5080 16GB, 32GB DDR5',
 'Cỗ máy gaming Ultimate với AMD Ryzen 7 9800X3D — CPU gaming #1 thế giới, NVIDIA GeForce RTX 5080 16GB GDDR7, RAM 32GB DDR5-6000, SSD 2TB Gen5. Chinh phục mọi tựa game ở 4K Ultra.',
 135990000, NULL, 2, 'active', true, NOW());

-- ═══════════════════════════════════════
-- MÀN HÌNH (15 sản phẩm)
-- ═══════════════════════════════════════

INSERT INTO products (seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at) VALUES
(v_seller_id, v_cat_monitor, 'Màn hình Gigabyte GS25F2 24.5" FHD IPS 200Hz', 'gigabyte-gs25f2-24-5-200hz',
 'SP-MH-001', 'Màn hình Gaming Gigabyte GS25F2 24.5 inch, IPS, 200Hz, 1ms',
 'Màn hình gaming Gigabyte GS25F2 kích thước 24.5 inch, tấm nền IPS Full HD, tần số quét 200Hz, thời gian phản hồi 1ms. Hỗ trợ FreeSync Premium, HDR10. Lựa chọn hoàn hảo cho FPS gaming.',
 2850000, 4990000, 40, 'active', true, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình ASUS VA249HG 23.8" IPS FHD 120Hz', 'asus-va249hg-23-8-120hz',
 'SP-MH-002', 'Màn hình ASUS VA249HG 23.8 inch, IPS, Full HD, 120Hz',
 'Màn hình ASUS VA249HG 23.8 inch tấm nền IPS Full HD, tần số quét 120Hz, 1ms MPRT. Thiết kế viền mỏng, Eye Care giảm mỏi mắt, phù hợp gaming và làm việc.',
 2300000, 2990000, 50, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình ASUS TUF VG27AQ5A 27" 2K IPS 210Hz', 'asus-tuf-vg27aq5a-27-2k-210hz',
 'SP-MH-003', 'Màn hình Gaming ASUS TUF 27 inch, 2K QHD, IPS, 210Hz',
 'Màn hình gaming ASUS TUF Gaming VG27AQ5A 27 inch, độ phân giải 2K QHD (2560x1440), tấm nền IPS, 210Hz, 1ms GTG. ELMB Sync, FreeSync Premium, HDR10. Lựa chọn #1 cho gaming 2K.',
 4950000, 6990000, 30, 'active', true, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình Gaming Gigabyte GS25F14 24.5" FHD 144Hz', 'gigabyte-gs25f14-24-5-144hz',
 'SP-MH-004', 'Màn hình Gigabyte GS25F14 24.5 inch, IPS, FHD, 144Hz, 1ms',
 'Gigabyte GS25F14 màn hình gaming 24.5 inch IPS Full HD 144Hz, 1ms. FreeSync, chống nhấp nháy Flicker-free, bộ lọc ánh sáng xanh. Giá tốt nhất phân khúc 144Hz.',
 2400000, 2990000, 45, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình ASUS TUF VG259Q5A 24.5" FHD IPS 200Hz', 'asus-tuf-vg259q5a-24-5-200hz',
 'SP-MH-005', 'Màn hình Gaming ASUS TUF 24.5 inch, FHD, IPS, 200Hz, 0.3ms',
 'ASUS TUF Gaming VG259Q5A 24.5 inch Full HD IPS, tần số quét lên đến 200Hz, thời gian phản hồi siêu nhanh 0.3ms MPRT. ELMB, FreeSync Premium. Đỉnh cao cho competitive FPS.',
 2990000, 3999000, 35, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình EDRA EGM24F120H 24" FHD IPS 120Hz', 'edra-egm24f120h-24-120hz',
 'SP-MH-006', 'Màn hình EDRA 24 inch, FHD, IPS, 120Hz giá rẻ',
 'Màn hình EDRA EGM24F120H 24 inch IPS Full HD 120Hz, lựa chọn giá rẻ nhất cho nhu cầu gaming cơ bản và làm việc văn phòng. Viền mỏng 3 cạnh, bảo vệ mắt.',
 1900000, 2590000, 60, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình ASUS ProArt PA248QFV 24.1" WUXGA IPS', 'asus-proart-pa248qfv-24-1-wuxga',
 'SP-MH-007', 'Màn hình đồ họa ASUS ProArt 24.1 inch, WUXGA, IPS, 100Hz',
 'Màn hình chuyên đồ họa ASUS ProArt PA248QFV 24.1 inch, độ phân giải WUXGA (1920x1200), 100% sRGB, 100% Rec.709, Delta E < 2. Chuẩn Calman Verified, USB-C 96W. Dành cho designer và nhiếp ảnh gia.',
 5190000, 6590000, 20, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình MSI MAG 275QF 27" 2K IPS 180Hz', 'msi-mag-275qf-27-2k-180hz',
 'SP-MH-008', 'Màn hình Gaming MSI MAG 275QF 27 inch, 2K, Rapid IPS, 180Hz',
 'MSI MAG 275QF màn hình gaming 27 inch, 2K QHD, tấm nền Rapid IPS tốc độ cao 180Hz, 1ms GTG. Hỗ trợ HDR, Night Vision AI, Anti-Flicker. Tối ưu cho gaming 2K.',
 4390000, 5290000, 25, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình Dell UltraSharp U2424H 23.8" FHD IPS', 'dell-ultrasharp-u2424h-23-8-fhd',
 'SP-MH-009', 'Màn hình Dell UltraSharp 23.8 inch, IPS, FHD, 120Hz, USB-C',
 'Dell UltraSharp U2424H 23.8 inch IPS FHD 120Hz, 100% sRGB, cổng USB-C 90W, KVM tích hợp. Viền siêu mỏng, chân đế xoay/nghiêng/xoay dọc. Dành cho chuyên gia và lập trình viên.',
 5200000, 7290000, 15, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình LG UltraGear 27G610A 27" QHD IPS 200Hz', 'lg-ultragear-27g610a-27-qhd-200hz',
 'SP-MH-010', 'Màn hình Gaming LG UltraGear 27 inch, QHD, IPS, 200Hz, 1ms',
 'LG UltraGear 27G610A-B 27 inch QHD (2560x1440) IPS, 200Hz, 1ms GtG. HDR10, DAS Mode, Black Stabilizer. Màn hình gaming 2K tốc độ cao từ LG.',
 5190000, 6000000, 22, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình LG 27UP600K 27" IPS 4K', 'lg-27up600k-27-4k',
 'SP-MH-011', 'Màn hình LG 27 inch, IPS, 4K UHD, 60Hz, HDR400',
 'LG 27UP600K-W 27 inch 4K UHD (3840x2160) IPS, 60Hz, VESA DisplayHDR 400, 95% DCI-P3. Màn hình 4K cho sáng tạo nội dung, xem phim và lập trình.',
 5450000, 6399000, 18, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình VSP 2K G2718Q1 27" IPS 180Hz', 'vsp-g2718q1-27-2k-180hz',
 'SP-MH-012', 'Màn hình VSP 27 inch, 2K QHD, IPS, 180Hz giá rẻ',
 'VSP G2718Q1 màn hình 27 inch 2K QHD IPS 180Hz, giá rẻ nhất phân khúc 2K gaming. FreeSync, bộ lọc ánh sáng xanh, góc nhìn rộng 178°. Thương hiệu Việt Nam.',
 3500000, 4150000, 30, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình ASROCK CL25FFA 24.5" FHD IPS 120Hz', 'asrock-cl25ffa-24-5-120hz',
 'SP-MH-013', 'Màn hình ASROCK 24.5 inch, FHD, IPS, 120Hz, 1ms',
 'ASROCK CL25FFA 24.5 inch IPS Full HD 120Hz, 1ms. Thiết kế viền mỏng, bảo vệ mắt, giá tốt cho nhu cầu cơ bản.',
 2200000, 2999000, 35, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình VSP IP2407S 23.8" IPS FHD 120Hz', 'vsp-ip2407s-23-8-120hz',
 'SP-MH-014', 'Màn hình VSP 23.8 inch, IPS, FHD, 120Hz, 1ms giá rẻ',
 'VSP IP2407S 23.8 inch IPS Full HD 120Hz, 1ms. Màn hình giá rẻ nhất dòng IPS 120Hz, phù hợp văn phòng và gaming nhẹ. Thương hiệu Việt.',
 1900000, 2690000, 55, 'active', false, NOW()),

(v_seller_id, v_cat_monitor, 'Màn hình ASUS VA259HGA 24.5" FHD IPS 120Hz Loa', 'asus-va259hga-24-5-120hz',
 'SP-MH-015', 'Màn hình ASUS 24.5 inch, FHD, IPS, 120Hz, tích hợp loa',
 'ASUS VA259HGA 24.5 inch IPS Full HD 120Hz, 1ms, tích hợp loa stereo. Eye Care Plus, viền mỏng 3 cạnh. Tiện lợi với loa tích hợp, không cần loa ngoài.',
 2350000, 3400000, 40, 'active', false, NOW());

-- ═══════════════════════════════════════
-- BÀN PHÍM (14 sản phẩm)
-- ═══════════════════════════════════════

INSERT INTO products (seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at) VALUES
(v_seller_id, v_cat_keyboard, 'Bàn phím Logitech K120', 'ban-phim-logitech-k120',
 'SP-KB-001', 'Bàn phím có dây Logitech K120 USB chính hãng',
 'Bàn phím có dây Logitech K120 kết nối USB, phím êm ái bền bỉ, chống tràn nước, layout fullsize. Lựa chọn kinh điển cho văn phòng. Bảo hành 36 tháng Logitech.',
 160000, 200000, 100, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím MIK SHIBA', 'ban-phim-mik-shiba',
 'SP-KB-002', 'Bàn phím giả cơ MIK SHIBA RGB giá rẻ',
 'Bàn phím giả cơ MIK SHIBA với đèn LED RGB 7 màu, phím bấm giả cơ êm tay, kết nối USB. Thiết kế nhỏ gọn, giá siêu rẻ cho học sinh sinh viên.',
 130000, 290000, 150, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím E-DRA EK506', 'ban-phim-edra-ek506',
 'SP-KB-003', 'Bàn phím giả cơ E-DRA EK506 RGB gaming',
 'E-DRA EK506 bàn phím giả cơ gaming với LED RGB nhiều chế độ, phím bấm tích tắc sảng khoái, chống ghosting. Thiết kế gaming góc cạnh.',
 150000, 250000, 120, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím DareU EK75 Grey Black', 'dareu-ek75-grey-black',
 'SP-KB-004', 'Bàn phím cơ DareU EK75 không dây 75% hotswap',
 'DareU EK75 bàn phím cơ 75% layout, kết nối 3 chế độ (Bluetooth/2.4G/USB-C), hotswap switch, gasket mount, RGB, pin 3000mAh. Thiết kế compact đẹp mắt.',
 560000, 700000, 80, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím DareU EK98X Black Grey', 'dareu-ek98x-black-grey',
 'SP-KB-005', 'Bàn phím cơ DareU EK98X không dây 98% hotswap',
 'DareU EK98X bàn phím cơ 98% layout đầy đủ numpad, tri-mode wireless, hotswap, gasket mount, switch DareU Dream, keycap PBT doubleshot. Pin lâu 4000mAh.',
 850000, 990000, 60, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím DareU EK75 PRO Cloudy Aqua', 'dareu-ek75-pro-cloudy-aqua',
 'SP-KB-006', 'Bàn phím cơ DareU EK75 PRO wireless premium',
 'DareU EK75 PRO phiên bản Cloudy Aqua cao cấp, gasket mount 2.0, foam dampening 5 lớp, switch DareU Sky V3 pre-lubed, keycap PBT dye-sub. Âm thanh thock đỉnh cao.',
 690000, 1590000, 45, 'active', true, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím Darmoshark TOP 87 Tri-mode RGB', 'darmoshark-top87-trimode',
 'SP-KB-007', 'Bàn phím cơ Darmoshark TOP 87 TKL wireless RGB',
 'Darmoshark TOP 87 bàn phím cơ TKL 87 phím, kết nối tri-mode, switch Kailh hotswap, gasket mount, RGB per-key, case nhôm CNC. Build quality cao cấp.',
 1450000, 2200000, 30, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím Machenike KG98 Black Green', 'machenike-kg98-black-green',
 'SP-KB-008', 'Bàn phím cơ Machenike KG98 không dây 98% RGB',
 'Machenike KG98 bàn phím cơ 98% layout, tri-mode wireless, gasket mount, switch hotswap, keycap PBT, RGB. Phối màu Black Green cá tính.',
 1350000, 1950000, 35, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím DareU EK98L Grey Black', 'dareu-ek98l-grey-black',
 'SP-KB-009', 'Bàn phím cơ DareU EK98L có dây 98% hotswap',
 'DareU EK98L bàn phím cơ 98% layout có dây USB-C, hotswap, gasket mount, switch DareU Sky, keycap PBT. Phiên bản có dây giá tốt của EK98X.',
 510000, 790000, 70, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím ASUS TUF Gaming K3 Gen II', 'asus-tuf-gaming-k3-gen2',
 'SP-KB-010', 'Bàn phím cơ ASUS TUF Gaming K3 Gen II RGB',
 'ASUS TUF Gaming K3 Gen II bàn phím cơ full-size, switch ROG NX Red, RGB Aura Sync, khung nhôm, chống bụi IP57, phím media riêng. Bền bỉ chuẩn quân đội.',
 1350000, 1990000, 25, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím Darmoshark Top98 Trio-mode Black', 'darmoshark-top98-trimode-black',
 'SP-KB-011', 'Bàn phím cơ Darmoshark Top98 wireless 98% premium',
 'Darmoshark Top98 bàn phím cơ 98% layout, tri-mode wireless, case nhôm CNC anodized, gasket mount, switch Kailh Box hotswap, keycap PBT. Build quality flagship.',
 2100000, 2999000, 20, 'active', true, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím Motospeed K103 Black', 'motospeed-k103-black',
 'SP-KB-012', 'Bàn phím giả cơ Motospeed K103 RGB giá siêu rẻ',
 'Motospeed K103 bàn phím giả cơ fullsize, LED RGB rainbow, phím bấm êm, kết nối USB. Giá rẻ nhất thị trường, phù hợp cho mọi nhu cầu cơ bản.',
 95000, 190000, 200, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím Fuhlen L411 USB Black', 'fuhlen-l411-usb-black',
 'SP-KB-013', 'Bàn phím văn phòng Fuhlen L411 có dây USB',
 'Fuhlen L411 bàn phím văn phòng fullsize, kết nối USB, phím membrane êm ái, thiết kế đơn giản bền bỉ. Thương hiệu uy tín cho văn phòng.',
 170000, 200000, 90, 'active', false, NOW()),

(v_seller_id, v_cat_keyboard, 'Bàn phím Machenike KG98 White Blue', 'machenike-kg98-white-blue',
 'SP-KB-014', 'Bàn phím cơ Machenike KG98 không dây 98% White Blue',
 'Machenike KG98 phiên bản White Blue thanh lịch, 98% layout, tri-mode wireless, gasket mount, hotswap, keycap PBT doubleshot, RGB per-key.',
 1350000, 1950000, 35, 'active', false, NOW());

-- ═══════════════════════════════════════
-- LINH KIỆN PC (8 sản phẩm)
-- ═══════════════════════════════════════

INSERT INTO products (seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at) VALUES
(v_seller_id, v_cat_component, 'CPU AMD Ryzen 7 9800X3D', 'cpu-amd-ryzen-7-9800x3d',
 'SP-LK-001', 'Bộ xử lý AMD Ryzen 7 9800X3D 8 nhân 16 luồng 3D V-Cache',
 'AMD Ryzen 7 9800X3D — CPU gaming số 1 thế giới với công nghệ 3D V-Cache 104MB, 8 nhân 16 luồng, xung nhịp boost 5.2GHz, socket AM5, TDP 120W. Vượt trội hoàn toàn trong gaming.',
 12990000, 14490000, 15, 'active', true, NOW()),

(v_seller_id, v_cat_component, 'CPU Intel Core i5-14400F', 'cpu-intel-core-i5-14400f',
 'SP-LK-002', 'Bộ xử lý Intel Core i5-14400F 10 nhân 16 luồng',
 'Intel Core i5-14400F 10 nhân (6P+4E) 16 luồng, boost clock 4.7GHz, socket LGA 1700, TDP 65W. Lựa chọn tối ưu chi phí cho gaming và đa nhiệm.',
 4590000, 5290000, 40, 'active', false, NOW()),

(v_seller_id, v_cat_component, 'VGA NVIDIA GeForce RTX 5070 Ti 16GB', 'vga-rtx-5070-ti-16gb',
 'SP-LK-003', 'Card đồ họa RTX 5070 Ti 16GB GDDR7 Blackwell',
 'NVIDIA GeForce RTX 5070 Ti 16GB GDDR7, kiến trúc Blackwell thế hệ mới, DLSS 4 Multi Frame Generation, ray tracing hiệu năng gấp đôi. Chinh phục 4K gaming.',
 18990000, 21990000, 10, 'active', true, NOW()),

(v_seller_id, v_cat_component, 'RAM Kingston Fury Beast 16GB DDR5-6000', 'ram-kingston-fury-beast-16gb-ddr5-6000',
 'SP-LK-004', 'RAM Kingston Fury Beast 16GB DDR5 6000MHz CL30',
 'Kingston Fury Beast 16GB (1x16GB) DDR5-6000MHz CL30, XMP 3.0, tản nhiệt nhôm. Hiệu năng cao cho gaming và workstation AM5/Intel 13th-14th Gen.',
 1190000, 1490000, 80, 'active', false, NOW()),

(v_seller_id, v_cat_component, 'SSD Samsung 990 EVO Plus 1TB NVMe Gen5', 'ssd-samsung-990-evo-plus-1tb',
 'SP-LK-005', 'Ổ cứng SSD Samsung 990 EVO Plus 1TB M.2 NVMe PCIe 5.0',
 'Samsung 990 EVO Plus 1TB M.2 2280 NVMe PCIe Gen 5.0 x4, tốc độ đọc 10,000MB/s, ghi 8,000MB/s. Controller Samsung Piccolo, NAND V8 TLC. SSD Gen5 giá tốt nhất.',
 3290000, 3990000, 50, 'active', false, NOW()),

(v_seller_id, v_cat_component, 'Mainboard MSI MAG B650 TOMAHAWK WIFI', 'mainboard-msi-mag-b650-tomahawk-wifi',
 'SP-LK-006', 'Bo mạch chủ MSI MAG B650 TOMAHAWK WIFI AM5 DDR5',
 'MSI MAG B650 TOMAHAWK WIFI bo mạch chủ AM5, hỗ trợ Ryzen 7000/9000, DDR5, PCIe 5.0, WiFi 6E, 2.5G LAN, USB4. VRM 14+2+1 phase mạnh mẽ.',
 5490000, 6290000, 25, 'active', false, NOW()),

(v_seller_id, v_cat_component, 'Nguồn Corsair RM850x 850W 80+ Gold', 'nguon-corsair-rm850x-850w',
 'SP-LK-007', 'Nguồn máy tính Corsair RM850x 850W 80 Plus Gold Full Modular',
 'Corsair RM850x 850W 80+ Gold, full modular, quạt 140mm Zero RPM mode, cáp flat dễ đi dây, bảo hành 10 năm. Đủ sức nuôi RTX 5070 Ti.',
 2990000, 3490000, 30, 'active', false, NOW()),

(v_seller_id, v_cat_component, 'Tản nhiệt nước AIO DeepCool LS720 SE 360mm', 'tan-nhiet-deepcool-ls720-se-360mm',
 'SP-LK-008', 'Tản nhiệt nước AIO DeepCool LS720 SE ARGB 360mm',
 'DeepCool LS720 SE tản nhiệt nước AIO 360mm, 3 quạt ARGB FK120, bơm 4th Gen, tương thích Intel LGA1700/AM5. Hiệu năng tản nhiệt vượt trội, hoạt động êm ái.',
 1890000, 2490000, 35, 'active', false, NOW());

-- ═══════════════════════════════════════
-- PHỤ KIỆN (6 sản phẩm)
-- ═══════════════════════════════════════

INSERT INTO products (seller_id, category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, product_status, is_featured, published_at) VALUES
(v_seller_id, v_cat_accessory, 'Tai nghe Logitech G Pro X 2 Lightspeed', 'tai-nghe-logitech-g-pro-x2',
 'SP-PK-001', 'Tai nghe gaming không dây Logitech G Pro X 2 Lightspeed',
 'Logitech G PRO X 2 LIGHTSPEED tai nghe gaming không dây cao cấp, driver Graphene 50mm, DTS Headphone:X 2.0, micro Blue VO!CE, pin 50 giờ, kết nối Bluetooth/Lightspeed/3.5mm.',
 3990000, 4690000, 25, 'active', true, NOW()),

(v_seller_id, v_cat_accessory, 'Chuột Logitech G502 X Plus Lightspeed', 'chuot-logitech-g502x-plus',
 'SP-PK-002', 'Chuột gaming không dây Logitech G502 X Plus RGB',
 'Logitech G502 X PLUS chuột gaming không dây flagship, cảm biến HERO 25K, switch LIGHTFORCE hybrid, RGB LIGHTSYNC, bánh xe cuộn siêu tốc, pin sạc 130 giờ.',
 2990000, 3690000, 30, 'active', false, NOW()),

(v_seller_id, v_cat_accessory, 'Ghế gaming DXRacer Craft D5000', 'ghe-gaming-dxracer-craft-d5000',
 'SP-PK-003', 'Ghế gaming DXRacer Craft Series D5000 ergonomic',
 'DXRacer Craft D5000 ghế gaming cao cấp, đệm memory foam, da PU premium, tựa lưng điều chỉnh 135°, tay ghế 4D, piston class 4. Thiết kế ergonomic hỗ trợ lưng tối ưu.',
 8990000, 10990000, 10, 'active', false, NOW()),

(v_seller_id, v_cat_accessory, 'Webcam Logitech C920e Full HD', 'webcam-logitech-c920e',
 'SP-PK-004', 'Webcam Logitech C920e 1080p cho họp trực tuyến',
 'Logitech C920e webcam Full HD 1080p/30fps, tự động lấy nét, chỉnh sáng HD, micro stereo kép, nắp che riêng tư. Tối ưu cho Zoom, Teams, Google Meet.',
 1690000, 2190000, 40, 'active', false, NOW()),

(v_seller_id, v_cat_accessory, 'Balo laptop ASUS ROG Ranger BP1500G', 'balo-asus-rog-ranger-bp1500g',
 'SP-PK-005', 'Balo laptop gaming ASUS ROG Ranger 15.6 inch',
 'ASUS ROG Ranger BP1500G balo laptop gaming 15.6 inch, chất liệu chống nước, ngăn laptop riêng biệt có đệm bảo vệ, thiết kế gaming phong cách ROG, nhiều ngăn tiện dụng.',
 1590000, 2090000, 35, 'active', false, NOW()),

(v_seller_id, v_cat_accessory, 'Lót chuột Artisan Hien FX Soft XL', 'lot-chuot-artisan-hien-fx-xl',
 'SP-PK-006', 'Lót chuột gaming Artisan Hien FX Soft XL Nhật Bản',
 'Artisan Hien FX Soft XL (490x420mm) lót chuột gaming cao cấp Nhật Bản, bề mặt vải dệt đặc biệt, tốc độ trung bình-nhanh, kiểm soát tốt. Lựa chọn của pro player CS2/Valorant.',
 1490000, 1790000, 20, 'active', false, NOW());

END $$;
