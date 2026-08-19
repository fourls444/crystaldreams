-- Crystal Dreams: Migrate discount from percentage to fixed amount (baht)
-- Run this SQL in Supabase SQL Editor ONCE before deploying the code changes.

-- Step 1: Add the new discount_amount column
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0;

-- Step 2: Migrate existing percentage discounts to fixed amounts
-- Example: product price 1890, discount_percent 10 → discount_amount = ROUND(1890 * 10 / 100) = 189
UPDATE products
SET discount_amount = ROUND(price * discount_percent / 100)
WHERE discount_percent > 0;

-- Step 3: Verify the migration (run this SELECT to check before dropping the old column)
-- SELECT id, name, price, discount_percent, discount_amount,
--        price - discount_amount AS final_price
-- FROM products
-- WHERE discount_percent > 0 OR discount_amount > 0;

-- Step 4: Once verified, drop the old column (OPTIONAL - do this manually after confirming data is correct)
-- ALTER TABLE products DROP COLUMN IF EXISTS discount_percent;
