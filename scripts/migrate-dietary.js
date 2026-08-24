import 'dotenv/config';
import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Connected to DB. Running DDL...");
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "DietaryCategory" AS ENUM ('PURE_VEG', 'PURE_NON_VEG', 'BOTH');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("DietaryCategory enum created/verified.");

    await client.query(`
      ALTER TABLE "restaurants" 
      ADD COLUMN IF NOT EXISTS "dietaryCategory" "DietaryCategory" DEFAULT 'BOTH',
      ADD COLUMN IF NOT EXISTS "fssaiLicense" TEXT;
    `);
    console.log("Columns dietaryCategory and fssaiLicense added to restaurants table.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
