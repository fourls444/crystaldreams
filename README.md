# Crystal Dreams

Crystal Dreams is a full-stack e-commerce application for a retail client. It supports product browsing, cart and checkout flows, payment confirmation, order tracking, inventory updates, customer reviews, and administrative operations.

## Features

- Product catalogue with visibility, stock, images, and product details
- Cart and order creation with trusted server-side totals
- PromptPay slip payment and Beam payment flow integration
- Delivery information and public order tracking
- Inventory and order management for administrators
- Product reviews with admin controls
- Supabase-backed data access, storage, and authentication utilities

## Tech stack

- Next.js 16 with React 19 and TypeScript
- Supabase for database, storage, and authentication support
- PostgreSQL with Drizzle ORM
- Tailwind CSS and CSS Modules
- Beam payment API and PromptPay payment flow

## Project structure

```text
src/app/          Pages and API routes, including checkout, tracking, and admin flows
src/components/   Product, cart, checkout, header, footer, and admin UI
src/utils/        Authentication, Supabase, payment, notification, and verification helpers
src/db/           Drizzle database schema
sql/              SQL schema and row-level security policies
docs/             Payment setup and development notes
```

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) after the server starts.

## Environment variables

Create `.env.local` and provide the values required by the deployment. The exact variables used by the current code are documented in the existing setup notes under `docs/`, including Supabase and Beam configuration. Never commit secrets or service-role keys.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Notes

Payment and notification integrations require external service credentials. Use the project setup documents in `docs/` for the current sandbox and webhook configuration.
