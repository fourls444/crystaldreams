import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Client } = pg;

// Load env variables
const envPath = path.resolve(process.cwd(), '.env.local');
let databaseUrl = '';
let defaultPromptPay = '010753600031501'; // Fallback default
let defaultRef1 = '';
let defaultRef2 = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const dbMatch = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (dbMatch) databaseUrl = dbMatch[1];
  
  const ppMatch = envContent.match(/^NEXT_PUBLIC_PROMPTPAY_NUMBER\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (ppMatch) defaultPromptPay = ppMatch[1].trim();

  const ref1Match = envContent.match(/^NEXT_PUBLIC_PROMPTPAY_REF1\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (ref1Match) defaultRef1 = ref1Match[1].trim();

  const ref2Match = envContent.match(/^NEXT_PUBLIC_PROMPTPAY_REF2\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (ref2Match) defaultRef2 = ref2Match[1].trim();
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

    console.log("Creating settings table & setting up RLS policies...");
    
    // 1. Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // 2. Enable RLS
    await client.query(`
      ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
    `);

    // 3. Create public SELECT policy
    await client.query(`
      DROP POLICY IF EXISTS "Allow public select settings" ON settings;
      CREATE POLICY "Allow public select settings" ON settings
        FOR SELECT USING (true);
    `);

    // 4. Create admin ALL policy
    await client.query(`
      DROP POLICY IF EXISTS "Allow admins to manage settings" ON settings;
      CREATE POLICY "Allow admins to manage settings" ON settings
        FOR ALL USING (auth.role() = 'authenticated');
    `);

    // 5. Seed default settings
    console.log(`Seeding initial promptpay_number: ${defaultPromptPay}...`);
    await client.query(`
      INSERT INTO settings (key, value)
      VALUES ('promptpay_number', $1)
      ON CONFLICT (key) DO NOTHING;
    `, [defaultPromptPay]);

    console.log(`Seeding initial promptpay_ref1: ${defaultRef1}...`);
    await client.query(`
      INSERT INTO settings (key, value)
      VALUES ('promptpay_ref1', $1)
      ON CONFLICT (key) DO NOTHING;
    `, [defaultRef1]);

    console.log(`Seeding initial promptpay_ref2: ${defaultRef2}...`);
    await client.query(`
      INSERT INTO settings (key, value)
      VALUES ('promptpay_ref2', $1)
      ON CONFLICT (key) DO NOTHING;
    `, [defaultRef2]);
    
    console.log("✅ Database migration completed successfully! Settings table and RLS policies initialized.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
