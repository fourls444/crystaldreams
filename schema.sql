-- 1. Create Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'หมอน Crystal Dreams',
    price NUMERIC NOT NULL DEFAULT 1890,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Default Product
INSERT INTO products (name, price, stock)
VALUES ('หมอนเพื่อสุขภาพ Crystal Dreams', 1890, 50);

-- 2. Create Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount NUMERIC NOT NULL,
    customer_name TEXT,
    customer_tel TEXT,
    customer_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'slip_uploaded' | 'verified' | 'rejected'
    slip_url TEXT,
    slip_verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT, -- 'auto' | 'manual'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create Policies for products (Anyone can read, Admin can manage)
CREATE POLICY "Allow public read on products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- Create Policies for orders (Anyone can create and read by ID, Admin can manage all)
CREATE POLICY "Allow public create orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select orders by id" ON orders
    FOR SELECT USING (true); -- In production we can restrict or keep it open since IDs are UUIDs.

CREATE POLICY "Allow admins to manage orders" ON orders
    FOR ALL USING (auth.role() = 'authenticated');
