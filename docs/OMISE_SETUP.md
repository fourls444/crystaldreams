# Omise PromptPay setup

CrystalDream uses Omise only for PromptPay. COD stays outside Omise, and credit cards are not enabled by this integration.

## Required setup

1. Enable PromptPay for the Omise account (test and live modes are configured separately).
2. Run `sql/migrate-omise-promptpay.sql` once in Supabase SQL Editor.
3. Add these server environment variables:

   ```text
   OMISE_SECRET_KEY=skey_test_...
   NEXT_PUBLIC_APP_URL=https://your-production-domain.example
   ```

   Use the live secret key only in the production environment. Never expose `OMISE_SECRET_KEY` through a `NEXT_PUBLIC_` variable.

4. In Omise Dashboard, configure the test webhook and live webhook to:

   ```text
   https://your-production-domain.example/api/webhooks/omise
   ```

5. Create a test order, scan or complete the test PromptPay charge, and confirm that the order changes to `payment_status = paid` before the shipping form becomes available.

The webhook route retrieves the charge from Omise again before trusting it. It checks the Charge ID, order metadata, amount, THB currency, paid flag, and PromptPay source. The database migration adds a transaction-safe function so duplicate webhook deliveries do not deduct stock twice.

References: [Omise webhooks](https://docs.opn.ooo/api-webhooks), [Omise integrations](https://docs.opn.ooo/integrations/thailand).
