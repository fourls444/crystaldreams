import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Client } = pg;

// Load env variables
const envPath = path.resolve(process.cwd(), '.env.local');
let databaseUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const dbMatch = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (dbMatch) databaseUrl = dbMatch[1];
}

if (!databaseUrl) {
  console.error("❌ Error: Missing DATABASE_URL in env variables.");
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully.");

    console.log("Creating reviews table & setting up RLS policies...");
    
    // 1. Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        customer_name TEXT NOT NULL,
        image_urls TEXT[] DEFAULT '{}',
        rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
        comment TEXT NOT NULL,
        is_visible BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table 'reviews' checked/created.");
    
    // 2. Enable RLS
    await client.query(`
      ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    `);
    console.log("RLS enabled on 'reviews'.");

    // 3. Create public SELECT policy
    await client.query(`
      DROP POLICY IF EXISTS "Allow public select reviews" ON reviews;
      CREATE POLICY "Allow public select reviews" ON reviews
        FOR SELECT USING (is_visible = true);
    `);
    console.log("Public SELECT policy created.");

    // 4. Create admin ALL policy
    await client.query(`
      DROP POLICY IF EXISTS "Allow admins to manage reviews" ON reviews;
      CREATE POLICY "Allow admins to manage reviews" ON reviews
        FOR ALL USING (auth.role() = 'authenticated');
    `);
    console.log("Admin manage policy created.");
    
    console.log("✅ Database migration completed successfully! Reviews table and RLS policies initialized.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
