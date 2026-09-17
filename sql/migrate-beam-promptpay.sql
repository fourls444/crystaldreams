-- Run once in the Supabase SQL Editor when enabling the Beam payment flow.
-- This migration is safe to rerun and keeps historical payment columns intact.

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS beam_charge_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS beam_charge_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS beam_failure_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_completed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS orders_beam_charge_id_unique
  ON orders (beam_charge_id)
  WHERE beam_charge_id IS NOT NULL;

-- Only the trusted server role can execute payment finalization and shipping
-- persistence. Both functions use row locks so duplicate requests are safe.
CREATE OR REPLACE FUNCTION public.finalize_beam_payment(
  p_order_id UUID,
  p_charge_id TEXT,
  p_paid_at TIMESTAMPTZ
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_shortage TEXT;
BEGIN
  SELECT * INTO v_order
    FROM orders
   WHERE id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.payment_method <> 'promptpay' THEN RAISE EXCEPTION 'invalid_payment_method'; END IF;
  IF v_order.beam_charge_id IS DISTINCT FROM p_charge_id THEN RAISE EXCEPTION 'charge_mismatch'; END IF;
  IF v_order.payment_status = 'paid' THEN RETURN v_order.status; END IF;

  IF v_order.items IS NOT NULL AND jsonb_typeof(v_order.items) = 'array' THEN
    WITH requested AS (
      SELECT (item->>'product_id')::UUID AS product_id,
             SUM((item->>'quantity')::INTEGER) AS quantity
        FROM jsonb_array_elements(v_order.items) AS item
       GROUP BY (item->>'product_id')::UUID
    )
    SELECT string_agg(COALESCE(p.name, requested.product_id::TEXT), ', ')
      INTO v_shortage
      FROM requested
      LEFT JOIN products p ON p.id = requested.product_id
     WHERE p.id IS NULL OR p.stock < requested.quantity;

    IF v_shortage IS NULL THEN
      WITH requested AS (
        SELECT (item->>'product_id')::UUID AS product_id,
               SUM((item->>'quantity')::INTEGER) AS quantity
          FROM jsonb_array_elements(v_order.items) AS item
         GROUP BY (item->>'product_id')::UUID
      )
      UPDATE products p
         SET stock = p.stock - requested.quantity,
             updated_at = NOW()
        FROM requested
       WHERE p.id = requested.product_id;
    END IF;
  ELSE
    IF v_order.product_id IS NULL THEN
      v_shortage := 'unknown_product';
    ELSE
      SELECT CASE WHEN stock < v_order.quantity THEN name END
        INTO v_shortage
        FROM products
       WHERE id = v_order.product_id;

      IF NOT FOUND THEN
        v_shortage := v_order.product_id::TEXT;
      ELSIF v_shortage IS NULL THEN
        UPDATE products
           SET stock = stock - v_order.quantity,
               updated_at = NOW()
         WHERE id = v_order.product_id;
      END IF;
    END IF;
  END IF;

  UPDATE orders
     SET payment_status = 'paid',
         beam_charge_status = 'completed',
         status = CASE WHEN v_shortage IS NULL THEN 'verified' ELSE 'paid_stock_issue' END,
         verified_by = 'beam',
         paid_at = COALESCE(p_paid_at, NOW()),
         stock_deducted_at = CASE WHEN v_shortage IS NULL THEN NOW() ELSE NULL END,
         updated_at = NOW()
   WHERE id = p_order_id;

  RETURN CASE WHEN v_shortage IS NULL THEN 'verified' ELSE 'paid_stock_issue' END;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_order_shipping(
  p_order_id UUID,
  p_customer_name TEXT,
  p_customer_tel TEXT,
  p_customer_address TEXT,
  p_customer_line TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_shortage TEXT;
  v_next_status TEXT;
BEGIN
  SELECT * INTO v_order
    FROM orders
   WHERE id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.shipping_completed THEN RAISE EXCEPTION 'shipping_already_completed'; END IF;

  IF v_order.payment_method = 'promptpay' THEN
    IF v_order.payment_status <> 'paid' THEN RAISE EXCEPTION 'payment_not_completed'; END IF;
    v_next_status := v_order.status;
  ELSIF v_order.payment_method = 'cod' THEN
    IF v_order.status <> 'pending' THEN RAISE EXCEPTION 'order_already_processed'; END IF;

    IF v_order.items IS NOT NULL AND jsonb_typeof(v_order.items) = 'array' THEN
      WITH requested AS (
        SELECT (item->>'product_id')::UUID AS product_id,
               SUM((item->>'quantity')::INTEGER) AS quantity
          FROM jsonb_array_elements(v_order.items) AS item
         GROUP BY (item->>'product_id')::UUID
      )
      SELECT string_agg(COALESCE(p.name, requested.product_id::TEXT), ', ')
        INTO v_shortage
        FROM requested
        LEFT JOIN products p ON p.id = requested.product_id
       WHERE p.id IS NULL OR p.stock < requested.quantity;

      IF v_shortage IS NULL THEN
        WITH requested AS (
          SELECT (item->>'product_id')::UUID AS product_id,
                 SUM((item->>'quantity')::INTEGER) AS quantity
            FROM jsonb_array_elements(v_order.items) AS item
           GROUP BY (item->>'product_id')::UUID
        )
        UPDATE products p
           SET stock = p.stock - requested.quantity,
               updated_at = NOW()
          FROM requested
         WHERE p.id = requested.product_id;
      END IF;
    ELSE
      IF v_order.product_id IS NULL THEN
        v_shortage := 'unknown_product';
      ELSE
        SELECT CASE WHEN stock < v_order.quantity THEN name END
          INTO v_shortage
          FROM products
         WHERE id = v_order.product_id;

        IF NOT FOUND THEN
          v_shortage := v_order.product_id::TEXT;
        ELSIF v_shortage IS NULL THEN
          UPDATE products
             SET stock = stock - v_order.quantity,
                 updated_at = NOW()
           WHERE id = v_order.product_id;
        END IF;
      END IF;
    END IF;

    IF v_shortage IS NOT NULL THEN RAISE EXCEPTION 'insufficient_stock:%', v_shortage; END IF;
    v_next_status := 'cod_pending';
  ELSE
    RAISE EXCEPTION 'invalid_payment_method';
  END IF;

  UPDATE orders
     SET customer_name = btrim(p_customer_name),
         customer_tel = p_customer_tel,
         customer_address = btrim(p_customer_address),
         customer_line = NULLIF(btrim(p_customer_line), ''),
         shipping_completed = TRUE,
         status = v_next_status,
         payment_status = CASE WHEN payment_method = 'cod' THEN 'cod_pending' ELSE payment_status END,
         stock_deducted_at = CASE WHEN payment_method = 'cod' THEN NOW() ELSE stock_deducted_at END,
         updated_at = NOW()
   WHERE id = p_order_id;

  RETURN v_next_status;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_beam_payment(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_order_shipping(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_beam_payment(UUID, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_order_shipping(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Orders are created publicly, but reading and changing order rows stays admin-only.
-- Customer tracking and payment pages use server endpoints that accept one UUID.
DROP POLICY IF EXISTS "Allow public create orders" ON orders;
CREATE POLICY "Allow public create orders" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow public select orders by id" ON orders;
DROP POLICY IF EXISTS "Allow admins to manage orders" ON orders;

CREATE POLICY "Allow admins to manage orders" ON orders
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'isAdmin') = 'true'
    OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'isAdmin') = 'true'
    OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
