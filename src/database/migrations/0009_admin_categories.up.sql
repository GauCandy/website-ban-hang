CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  description TEXT,
  category_status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_categories_status_check CHECK (
    category_status IN ('active', 'inactive')
  )
);

CREATE UNIQUE INDEX product_categories_slug_unique_idx
ON product_categories (lower(slug));

ALTER TABLE products
ADD COLUMN category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

CREATE INDEX products_category_id_idx
ON products (category_id);