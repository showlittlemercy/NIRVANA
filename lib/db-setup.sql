-- Run this SQL in your Supabase SQL editor to create tables

-- Products table
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

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policies for products (public read, admin write)
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Service role can insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Service role can delete products" ON products FOR DELETE USING (true);

-- Policies for cart_items (users can manage their own cart)
CREATE POLICY "Users can view their own cart" ON cart_items FOR SELECT USING (true);
CREATE POLICY "Users can insert to their cart" ON cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their cart" ON cart_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete from their cart" ON cart_items FOR DELETE USING (true);

-- Policies for orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can view all orders" ON orders FOR SELECT USING (true);

-- Policies for order_items
CREATE POLICY "Anyone can view order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT WITH CHECK (true);

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category, stock) VALUES
('Wireless Headphones', 'Premium noise-cancelling wireless headphones with superior sound quality', 149.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'Electronics', 50),
('Smart Watch', 'Advanced fitness tracking and notifications on your wrist', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'Electronics', 30),
('Laptop Backpack', 'Durable and spacious backpack with laptop compartment', 79.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'Accessories', 100),
('Coffee Maker', 'Programmable coffee maker with thermal carafe', 89.99, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', 'Home', 25),
('Yoga Mat', 'Non-slip exercise mat for yoga and fitness', 34.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500', 'Sports', 75),
('Bluetooth Speaker', 'Portable waterproof speaker with 360° sound', 69.99, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 'Electronics', 60),
('Running Shoes', 'Lightweight and comfortable running shoes', 119.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'Sports', 40),
('Desk Lamp', 'LED desk lamp with adjustable brightness', 45.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500', 'Home', 55);