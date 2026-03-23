CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  short_description TEXT,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  compare_at_price NUMERIC(12, 2),
  currency_code VARCHAR(3) NOT NULL DEFAULT 'VND',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
  product_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  cover_image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_price_check CHECK (price >= 0),
  CONSTRAINT products_compare_at_price_check CHECK (
    compare_at_price IS NULL OR compare_at_price >= price
  ),
  CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= 0),
  CONSTRAINT products_status_check CHECK (
    product_status IN ('draft', 'active', 'archived')
  )
);

CREATE INDEX products_seller_id_idx
ON products (seller_id);

CREATE UNIQUE INDEX products_slug_unique_idx
ON products (lower(slug));

CREATE UNIQUE INDEX products_sku_unique_idx
ON products (sku)
WHERE sku IS NOT NULL;
