-- Product options (max 2 per product), e.g. "Size", "Giới tính"
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_options_product_id_idx
ON product_options (product_id, position);

-- Option values, e.g. "S", "M", "L", "XL"
CREATE TABLE IF NOT EXISTS product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  value VARCHAR(120) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_option_values_option_id_idx
ON product_option_values (option_id, position);

-- Variants = combinations of option values
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option1_value_id UUID REFERENCES product_option_values(id) ON DELETE CASCADE,
  option2_value_id UUID REFERENCES product_option_values(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  price NUMERIC(12, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_variants_stock_check CHECK (stock_quantity >= -1)
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
ON product_variants (product_id);
