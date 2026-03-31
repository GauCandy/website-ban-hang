DROP INDEX IF EXISTS products_category_id_idx;

ALTER TABLE products
DROP COLUMN IF EXISTS category_id;

DROP INDEX IF EXISTS product_categories_slug_unique_idx;

DROP TABLE IF EXISTS product_categories;