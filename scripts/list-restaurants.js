import 'dotenv/config';
import { Pool } from 'pg';

async function listRests() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, "dietaryCategory", email, "createdAt" FROM restaurants ORDER BY "createdAt" DESC');
    console.log("ALL RESTAURANTS IN DB:\n", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

listRests();
