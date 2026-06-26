const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env.local');
console.log("Reading environment from:", envPath);

let dbUrl = null;
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (match) {
    dbUrl = match[1].trim();
  }
} catch (e) {
  console.error("Failed to read .env.local file:", e);
  process.exit(1);
}

if (!dbUrl) {
  console.error("DATABASE_URL is not found in env file!");
  process.exit(1);
}

// Strip quotes if present
if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
  dbUrl = dbUrl.slice(1, -1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database successfully.");
    
    // Add columns to orders table
    const query = `
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT;
    `;
    await client.query(query);
    console.log("Migration executed successfully. 'shipping_carrier' and 'tracking_number' columns added to 'orders' table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
