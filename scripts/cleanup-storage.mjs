import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let serviceRoleKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  const keyMatch = envContent.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (urlMatch) supabaseUrl = urlMatch[1];
  if (keyMatch) serviceRoleKey = keyMatch[1];
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Missing Supabase environment variables in .env.local.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const isDelete = process.argv.includes('--delete');

async function cleanupBucket(bucketName, dbUrls, fileExtractor) {
  console.log(`\n--------------------------------------------`);
  console.log(`📦 Analyzing bucket: "${bucketName}"`);
  console.log(`--------------------------------------------`);

  // Extract active filenames from DB URLs
  const activeFiles = new Set();
  dbUrls.forEach(url => {
    if (url) {
      const filename = fileExtractor(url);
      if (filename) activeFiles.add(filename);
    }
  });

  console.log(`🔹 Found ${activeFiles.size} unique active files referenced in the database.`);

  // List all files in Supabase Storage bucket
  let allStorageFiles = [];
  let errorListing = null;

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucketName).list('', {
      limit: 1000,
    });
    
    if (error) {
      errorListing = error;
    } else if (data) {
      allStorageFiles = data;
    }
  } catch (err) {
    errorListing = err;
  }

  if (errorListing) {
    console.error(`❌ Failed to list files in bucket "${bucketName}":`, errorListing.message || errorListing);
    return;
  }

  // Filter files that are NOT in active list
  const unusedFiles = allStorageFiles.filter(file => {
    // Skip placeholders or empty directories
    if (file.name === '.emptyFolderPlaceholder') return false;
    return !activeFiles.has(file.name);
  });

  if (unusedFiles.length === 0) {
    console.log(`✅ No unused files found in bucket "${bucketName}". Everything is clean!`);
    return;
  }

  console.log(`⚠️ Found ${unusedFiles.length} unused files in storage:`);
  let totalSize = 0;
  unusedFiles.forEach(file => {
    const sizeKB = (file.metadata?.size || 0) / 1024;
    totalSize += file.metadata?.size || 0;
    console.log(`   - ${file.name} (${sizeKB.toFixed(2)} KB, created at: ${file.created_at})`);
  });

  console.log(`📊 Total size of unused files: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  if (isDelete) {
    console.log(`\n🔥 Deleting ${unusedFiles.length} unused files from bucket "${bucketName}"...`);
    const filenamesToDelete = unusedFiles.map(file => file.name);
    
    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucketName)
      .remove(filenamesToDelete);

    if (deleteError) {
      console.error(`❌ Failed to delete files from bucket "${bucketName}":`, deleteError.message);
    } else {
      console.log(`✅ Successfully deleted ${filenamesToDelete.length} files from bucket "${bucketName}"!`);
    }
  } else {
    console.log(`\n💡 Note: This was a DRY RUN (Preview Mode). To actually delete these files, run:`);
    console.log(`   node scripts/cleanup-storage.mjs --delete`);
  }
}

async function run() {
  console.log("🚀 Supabase Storage Cleanup Utility starting...");
  console.log(`Run Mode: ${isDelete ? "🚨 DELETE MODE" : "🔍 DRY RUN (Preview Mode)"}`);

  try {
    // 1. Fetch active slip URLs from orders
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('slip_url');

    if (ordersErr) throw new Error(`Fetch orders error: ${ordersErr.message}`);

    const dbSlipUrls = (orders || []).map(o => o.slip_url).filter(Boolean);

    // 2. Fetch active product image URLs from products
    const { data: products, error: productsErr } = await supabaseAdmin
      .from('products')
      .select('image_url, image_urls');

    if (productsErr) throw new Error(`Fetch products error: ${productsErr.message}`);

    const dbProductUrls = [];
    (products || []).forEach(p => {
      if (p.image_url) dbProductUrls.push(p.image_url);
      if (p.image_urls && Array.isArray(p.image_urls)) {
        p.image_urls.forEach(url => dbProductUrls.push(url));
      }
    });

    // Helper: Extract filename from public URL (last segment)
    const getFilenameFromUrl = (url) => {
      try {
        const decodedUrl = decodeURIComponent(url);
        const parts = decodedUrl.split('/');
        return parts[parts.length - 1];
      } catch {
        return null;
      }
    };

    // 3. Process buckets
    await cleanupBucket('slips', dbSlipUrls, getFilenameFromUrl);
    await cleanupBucket('product-images', dbProductUrls, getFilenameFromUrl);

    console.log("\n🏁 Cleanup process finished.");
  } catch (err) {
    console.error("❌ Cleanup script crash error:", err.message);
  }
}

run();
