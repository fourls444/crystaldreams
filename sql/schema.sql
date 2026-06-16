-- 1. Create Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'หมอน Crystal Dreams',
    price NUMERIC NOT NULL DEFAULT 1890,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    description TEXT,
    detail TEXT,
    image_urls TEXT[],
    is_visible BOOLEAN NOT NULL DEFAULT TRUE, -- Added column
    sort_order INTEGER NOT NULL DEFAULT 0, -- Added column for drag-and-drop sorting
    discount_percent INTEGER NOT NULL DEFAULT 0, -- Added column for manual product discounts
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Default Product
INSERT INTO products (name, price, stock, description, detail)
VALUES (
    'หมอนยางพารา + วัสดุ TPE',
    1890,
    50,
    '📐 ขนาด: 60*40*10 cm
(🔥 ส่งฟรี!) 📦 สินค้าพรีออเดอร์: รอของ 14-20 วัน',
    '💤 ไอเทมลับของคนหลับยาก! หมอนยางพารา ท็อป TPE ตาราง 3 เหลี่ยม นุ่ม ซัพพอร์ตคอดีมากก

ใครปวดคอ ขี้ร้อนตอนนอน แนะนำใบนี้เลย! โครงสร้างตารางช่วยกระจายน้ำหนักและระบายอากาศขั้นสุด เย็นสบายตลอดคืน ❄️'
);

-- 2. Create Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount NUMERIC NOT NULL,
    customer_name TEXT,
    customer_tel TEXT,
    customer_address TEXT,
    customer_line TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'slip_uploaded' | 'verified' | 'rejected'
    slip_url TEXT,
    slip_verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT, -- 'auto' | 'manual'
    payment_method TEXT NOT NULL DEFAULT 'promptpay',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create Policies for products (Anyone can read visible products, Admin can manage all)
CREATE POLICY "Allow public read on products" ON products
    FOR SELECT USING (is_visible = true);

CREATE POLICY "Allow admins to manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- Create Policies for orders (Anyone can create and read by ID, Admin can manage all)
CREATE POLICY "Allow public create orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select orders by id" ON orders
    FOR SELECT USING (true); -- In production we can restrict or keep it open since IDs are UUIDs.

CREATE POLICY "Allow admins to manage orders" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

-- --- DATABASE MIGRATION FOR EXISTING TABLES ---
-- Run this SQL in your Supabase SQL Editor:
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0;
-- DROP POLICY IF EXISTS "Allow public read on products" ON products;
-- CREATE POLICY "Allow public read on products" ON products FOR SELECT USING (is_visible = true);

-- 3. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create Policies for settings (Anyone can read, Admin can manage all)
DROP POLICY IF EXISTS "Allow public select settings" ON settings;
CREATE POLICY "Allow public select settings" ON settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to manage settings" ON settings;
CREATE POLICY "Allow admins to manage settings" ON settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default promptpay number if not exists
INSERT INTO settings (key, value)
VALUES ('promptpay_number', '010753600031501')
ON CONFLICT (key) DO NOTHING;



