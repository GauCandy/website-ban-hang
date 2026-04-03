CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shopping_carts_owner_check CHECK (
    (
      CASE WHEN user_id IS NULL THEN 0 ELSE 1 END +
      CASE WHEN session_id IS NULL THEN 0 ELSE 1 END
    ) = 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS shopping_carts_user_id_unique_idx
ON shopping_carts (user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS shopping_carts_session_id_unique_idx
ON shopping_carts (session_id)
WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS shopping_carts_updated_at_idx
ON shopping_carts (updated_at DESC);

CREATE TABLE IF NOT EXISTS shopping_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shopping_cart_items_quantity_check CHECK (quantity > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS shopping_cart_items_cart_product_unique_idx
ON shopping_cart_items (cart_id, product_id);

CREATE INDEX IF NOT EXISTS shopping_cart_items_product_id_idx
ON shopping_cart_items (product_id);
