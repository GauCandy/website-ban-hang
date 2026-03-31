CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(32),
  gender VARCHAR(32),
  birth_date DATE,
  avatar_url TEXT,
  role VARCHAR(32) NOT NULL DEFAULT 'customer',
  account_status VARCHAR(32) NOT NULL DEFAULT 'active',
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_gender_check CHECK (
    gender IS NULL OR gender IN ('male', 'female')
  ),
  CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin')),
  CONSTRAINT users_account_status_check CHECK (
    account_status IN ('active', 'inactive', 'blocked')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
ON users (lower(email));

CREATE TABLE IF NOT EXISTS auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_identities_provider_user_id_key UNIQUE (provider, provider_user_id),
  CONSTRAINT auth_identities_user_provider_key UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  country_code VARCHAR(2) NOT NULL DEFAULT 'VN',
  state_or_province VARCHAR(120) NOT NULL,
  district VARCHAR(120),
  ward VARCHAR(120),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  postal_code VARCHAR(32),
  delivery_notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
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

CREATE UNIQUE INDEX IF NOT EXISTS product_categories_slug_unique_idx
ON product_categories (lower(slug));

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx
ON auth_identities (user_id);

CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx
ON user_addresses (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_addresses_one_default_per_user_idx
ON user_addresses (user_id)
WHERE is_default;

CREATE INDEX IF NOT EXISTS products_seller_id_idx
ON products (seller_id);

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_idx
ON products (lower(slug));

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx
ON products (sku)
WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_category_id_idx
ON products (category_id);

CREATE OR REPLACE VIEW v_user_profiles AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  u.phone_number,
  u.gender,
  u.birth_date,
  u.avatar_url,
  u.role,
  u.account_status,
  u.marketing_opt_in,
  u.last_login_at,
  u.created_at,
  u.updated_at,
  COALESCE(
    (
      SELECT json_agg(provider_row.provider ORDER BY provider_row.provider)
      FROM (
        SELECT DISTINCT ai.provider
        FROM auth_identities ai
        WHERE ai.user_id = u.id
      ) AS provider_row
    ),
    '[]'::json
  ) AS auth_providers,
  EXISTS(
    SELECT 1
    FROM auth_identities ai
    WHERE ai.user_id = u.id
  ) AS has_identity
FROM users u;
