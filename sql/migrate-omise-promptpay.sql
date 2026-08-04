-- Run this file once in Supabase SQL Editor before enabling Omise in production.
-- Existing slip columns are intentionally preserved so historical orders remain readable.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS omise_charge_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS omise_charge_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS omise_failure_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_completed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS orders_omise_charge_id_unique
  ON orders (omise_charge_id)
  WHERE omise_charge_id IS NOT NULL;

-- SECURITY DEFINER is required because only trusted server routes may finalize payments.
-- Row locking plus one transaction makes repeated Omise webhooks idempotent.
CREATE OR REPLACE FUNCTION finalize_omise_payment(
  p_order_id UUID,
  p_charge_id TEXT,
  p_paid_at TIMESTAMPTZ
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_shortage TEXT;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.payment_method <> 'promptpay' THEN RAISE EXCEPTION 'invalid_payment_method'; END IF;
  IF v_order.omise_charge_id IS DISTINCT FROM p_charge_id THEN RAISE EXCEPTION 'charge_mismatch'; END IF;
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
    SELECT CASE WHEN p.id IS NULL OR p.stock < v_order.quantity THEN COALESCE(p.name, v_order.product_id::TEXT) END
      INTO v_shortage
      FROM products p
     WHERE p.id = v_order.product_id;

    IF v_order.product_id IS NULL OR NOT EXISTS (SELECT 1 FROM products WHERE id = v_order.product_id) THEN
      v_shortage := COALESCE(v_order.product_id::TEXT, 'unknown_product');
    ELSIF v_shortage IS NULL THEN
      UPDATE products
         SET stock = stock - v_order.quantity,
             updated_at = NOW()
       WHERE id = v_order.product_id;
    END IF;
  END IF;

  UPDATE orders
     SET payment_status = 'paid',
         omise_charge_status = 'successful',
         status = CASE WHEN v_shortage IS NULL THEN 'verified' ELSE 'paid_stock_issue' END,
         verified_by = 'omise',
         paid_at = COALESCE(p_paid_at, NOW()),
         stock_deducted_at = CASE WHEN v_shortage IS NULL THEN NOW() ELSE NULL END,
         updated_at = NOW()
   WHERE id = p_order_id;

  RETURN CASE WHEN v_shortage IS NULL THEN 'verified' ELSE 'paid_stock_issue' END;
END;
$$;

CREATE OR REPLACE FUNCTION save_order_shipping(
  p_order_id UUID,
  p_customer_name TEXT,
  p_customer_tel TEXT,
  p_customer_address TEXT,
  p_customer_line TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_shortage TEXT;
  v_next_status TEXT;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
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
      SELECT CASE WHEN p.id IS NULL OR p.stock < v_order.quantity THEN COALESCE(p.name, v_order.product_id::TEXT) END
        INTO v_shortage
        FROM products p
       WHERE p.id = v_order.product_id;
      IF v_order.product_id IS NULL OR NOT EXISTS (SELECT 1 FROM products WHERE id = v_order.product_id) THEN
        v_shortage := COALESCE(v_order.product_id::TEXT, 'unknown_product');
      ELSIF v_shortage IS NULL THEN
        UPDATE products SET stock = stock - v_order.quantity, updated_at = NOW() WHERE id = v_order.product_id;
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

REVOKE ALL ON FUNCTION finalize_omise_payment(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION save_order_shipping(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_omise_payment(UUID, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION save_order_shipping(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
