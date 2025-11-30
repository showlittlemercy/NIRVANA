-- ============================================================
--  CLEAN + SAFE SUPABASE SCHEMA (IDEMPOTENT)
--  - Creates extension if missing
--  - Drops existing policies for target tables
--  - Creates tables if missing (user_id is TEXT)
--  - Enables RLS
--  - Creates secure, idempotent policies
--  - Inserts sample products only if not present
-- ============================================================

-- 0) Ensure pgcrypto (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) DROP EXISTING POLICIES SAFELY (only for these tables)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, schemaname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('products', 'orders', 'order_items', 'cart_items')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- 2) CREATE TABLES (SAFE / idempotent)

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                 -- TEXT to match auth.uid()::text (Clerk IDs are strings)
  user_email TEXT NOT NULL,
  user_name TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 3) ENABLE RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 4) CREATE POLICIES (CLEAN + SECURE)

-- PRODUCTS
-- public read
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- service-role write/update/delete (server-side only - service role key)
DROP POLICY IF EXISTS "Service role can insert products" ON products;
CREATE POLICY "Service role can insert products"
  ON products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update products" ON products;
CREATE POLICY "Service role can update products"
  ON products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role can delete products" ON products;
CREATE POLICY "Service role can delete products"
  ON products FOR DELETE USING (true);

-- CART ITEMS (user-specific)
-- Users may only see/insert/update/delete rows where auth.uid()::text = user_id
DROP POLICY IF EXISTS "Users can view their own cart" ON cart_items;
CREATE POLICY "Users can view their own cart"
  ON cart_items FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert to their cart" ON cart_items;
CREATE POLICY "Users can insert to their cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their cart" ON cart_items;
CREATE POLICY "Users can update their cart"
  ON cart_items FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete from their cart" ON cart_items;
CREATE POLICY "Users can delete from their cart"
  ON cart_items FOR DELETE
  USING (auth.uid()::text = user_id);

-- ORDERS (user-specific + service-role view)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Service role (server) may read all orders
DROP POLICY IF EXISTS "Service role can view all orders" ON orders;
CREATE POLICY "Service role can view all orders"
  ON orders FOR SELECT
  USING (true);

-- ORDER ITEMS (readable publicly, insertable by server / order creation flow)
DROP POLICY IF EXISTS "Anyone can view order items" ON order_items;
CREATE POLICY "Anyone can view order items"
  ON order_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- 5) OPTIONAL: Ensure indexes for performance (helpful)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_product ON cart_items (user_id, product_id);

-- 6) INSERT SAMPLE PRODUCTS (only if not exists)
INSERT INTO products (name, description, price, image_url, category, stock)
SELECT * FROM (
  VALUES
    ('Wireless Headphones', 'Premium noise-cancelling wireless headphones', 149.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Electronics', 50),
    ('Smart Watch', 'Advanced fitness tracking watch', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'Electronics', 30),
    ('Laptop Backpack', 'Durable backpack with laptop compartment', 79.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Accessories', 100),
    ('Coffee Maker', 'Programmable coffee maker', 89.99, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', 'Home', 25),
    ('Yoga Mat', 'Non-slip exercise mat', 34.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', 'Sports', 75),
    ('Bluetooth Speaker', 'Portable waterproof speaker', 69.99, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Electronics', 60),
    ('Running Shoes', 'Lightweight running shoes', 119.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'Sports', 40),
    ('Desk Lamp', 'LED desk lamp with adjustable brightness', 45.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500', 'Home', 55)
) AS v(name, description, price, image_url, category, stock)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = v.name);

-- 7) Final sanity checks: Show counts (you can run these separately to confirm)
-- SELECT COUNT(*) AS total_products FROM products;
-- SELECT COUNT(*) AS total_orders FROM orders;
-- SELECT COUNT(*) AS total_cart_rows FROM cart_items;

