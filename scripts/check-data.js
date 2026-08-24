import 'dotenv/config';
import { Pool } from 'pg';

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, "dietaryCategory", email FROM restaurants');
    console.log("Existing restaurants:", JSON.stringify(res.rows, null, 2));

    const cats = await client.query('SELECT id, name, "restaurantId" FROM categories');
    console.log("Existing categories:", JSON.stringify(cats.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
