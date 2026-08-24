import 'dotenv/config';
import { Pool } from 'pg';

async function cleanAndSeed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const nonVegRestId = 'cmt6vc6u60007mgvwg85jtl1f';

    // Delete any VEG food type products from Pure Non-Veg restaurant
    const delRes = await client.query(`
      DELETE FROM products 
      WHERE "restaurantId" = $1 AND "foodType" = 'VEG'
    `, [nonVegRestId]);
    console.log(`Deleted ${delRes.rowCount} VEG products from Pure Non-Veg restaurant.`);

    // Add a Non-Veg Starter item instead (e.g. Mutton Seekh Kebab)
    const startersCatRes = await client.query(`
      SELECT id FROM categories 
      WHERE "restaurantId" = $1 AND name ILIKE '%Starter%'
      LIMIT 1
    `, [nonVegRestId]);

    const starterCatId = startersCatRes.rows[0]?.id;

    if (starterCatId) {
      const prodId = 'prod-' + Math.random().toString(36).substring(2, 12);
      await client.query(`
        INSERT INTO products (
          id, name, slug, price, discount, "foodType", description, image,
          "categoryId", "restaurantId", "isAvailable", "isFeatured", "preparationTime", "createdAt", "updatedAt"
        )
        VALUES (
          $1, 'Galouti Mutton Seekh Kebab', 'galouti-mutton-seekh-kebab-royal', 369, 5, 'NON_VEG',
          'Melt-in-mouth spiced minced lamb kebabs infused with royal Awadhi herbs and charcoal smoked.',
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
          $2, $3, true, true, 18, NOW(), NOW()
        )
        ON CONFLICT ("restaurantId", slug) DO NOTHING
      `, [prodId, starterCatId, nonVegRestId]);
      console.log('Added Galouti Mutton Seekh Kebab to Royal Spice.');
    }

    const check = await client.query(`
      SELECT id, name, "foodType", price FROM products WHERE "restaurantId" = $1
    `, [nonVegRestId]);
    console.log("Current Royal Spice Products:", JSON.stringify(check.rows, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanAndSeed();
