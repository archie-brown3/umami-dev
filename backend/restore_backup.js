#!/usr/bin/env node

/**
 * Supabase Backup Restore Script
 *
 * This script restores a PostgreSQL backup to Supabase using the REST API
 */

require("dotenv").config();
const fs = require("fs");
const https = require("https");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

/**
 * Execute SQL via Supabase REST API
 */
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL("/rest/v1/rpc/exec_sql", SUPABASE_URL);

    const postData = JSON.stringify({
      sql: sql,
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main restore function
 */
async function restoreBackup() {
  console.log("🔄 Starting Supabase backup restore...");

  const backupFile =
    "/Users/archiebrown/Downloads/db_cluster-08-07-2025@10-23-52.backup (1)";

  if (!fs.existsSync(backupFile)) {
    console.error("❌ Backup file not found:", backupFile);
    process.exit(1);
  }

  console.log("📖 Reading backup file...");
  const backupContent = fs.readFileSync(backupFile, "utf8");

  // Split into individual SQL statements
  const statements = backupContent
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))
    .filter((stmt) => stmt.includes("public."));

  console.log(
    `📝 Found ${statements.length} public schema statements to execute`
  );

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ";";

    console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
    console.log(`📝 ${statement.substring(0, 100)}...`);

    try {
      const result = await executeSQL(statement);

      if (result.statusCode === 200) {
        console.log("✅ Success");
        successCount++;
      } else {
        console.log(`❌ Failed (${result.statusCode}):`, result.data);
        errorCount++;
      }
    } catch (error) {
      console.log("❌ Error:", error.message);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n📊 Restore Summary:");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📝 Total: ${statements.length}`);

  if (errorCount === 0) {
    console.log("\n🎉 Backup restore completed successfully!");
  } else {
    console.log("\n⚠️  Backup restore completed with some errors.");
  }
}

// Run the restore
restoreBackup().catch((error) => {
  console.error("💥 Restore failed:", error);
  process.exit(1);
});
