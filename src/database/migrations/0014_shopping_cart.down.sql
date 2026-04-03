DROP INDEX IF EXISTS shopping_cart_items_product_id_idx;
DROP INDEX IF EXISTS shopping_cart_items_cart_product_unique_idx;
DROP TABLE IF EXISTS shopping_cart_items;

DROP INDEX IF EXISTS shopping_carts_updated_at_idx;
DROP INDEX IF EXISTS shopping_carts_session_id_unique_idx;
DROP INDEX IF EXISTS shopping_carts_user_id_unique_idx;
DROP TABLE IF EXISTS shopping_carts;
