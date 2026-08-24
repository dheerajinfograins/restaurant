import 'dotenv/config';
import { Pool } from 'pg';

async function verifyProducts() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.name, p.price, p."foodType", p."isAvailable", p."restaurantId", c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."restaurantId" = 'cmt6vc6u60007mgvwg85jtl1f'
      ORDER BY p."createdAt" ASC
    `);
    console.log("Products in Royal Spice Non-Veg Restaurant:\n", JSON.stringify(res.rows, null, 2));

    const ordersRes = await client.query(`
      SELECT id, "orderNumber", "totalAmount", "status", "restaurantId"
      FROM orders
      WHERE "restaurantId" = 'cmt6vc6u60007mgvwg85jtl1f'
    `);
    console.log("Orders in Royal Spice (should be 0 for blank new restaurant):", ordersRes.rows.length);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyProducts();
