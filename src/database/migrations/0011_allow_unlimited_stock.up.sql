-- Allow stock_quantity = -1 to mean "unlimited"
ALTER TABLE products DROP CONSTRAINT products_stock_quantity_check;
ALTER TABLE products ADD CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= -1);
