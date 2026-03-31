ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_id_fkey;

ALTER TABLE products
  ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
