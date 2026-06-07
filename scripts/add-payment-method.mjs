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

    console.log("Executing migration SQL query...");
    // Add payment_method column to orders table if it doesn't exist
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'promptpay';
    `);
    
    console.log("✅ Migration completed successfully! payment_method column added.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
