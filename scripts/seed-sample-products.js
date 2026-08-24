import 'dotenv/config';
import { Pool } from 'pg';

async function seedProducts() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("Seeding products for Royal Spice Non-Veg Restaurant...");

    const nonVegRestId = "cmt6vc6u60007mgvwg85jtl1f"; // Royal Spice Non-Veg Restaurant
    const vegRestId = "cmt6v7uax0000mgvwdgk0ld0h"; // Sattva Pure Veg Restaurant

    // 1. Fetch or create categories for Royal Spice Non-Veg
    let nvCatsRes = await client.query('SELECT id, name FROM categories WHERE "restaurantId" = $1', [nonVegRestId]);
    let nvCats = nvCatsRes.rows;

    if (nvCats.length === 0) {
      console.log("Creating categories for Royal Spice...");
      await client.query(`
        INSERT INTO categories (id, name, slug, "restaurantId", "sortOrder", "createdAt", "updatedAt")
        VALUES 
          ('cat-nv-starters-' || substr(md5(random()::text), 1, 8), 'Non-Veg Starters & Kebabs', 'nv-starters-' || substr(md5(random()::text), 1, 6), $1, 1, NOW(), NOW()),
          ('cat-nv-main-' || substr(md5(random()::text), 1, 8), 'Non-Veg Main Course & Biryani', 'nv-main-' || substr(md5(random()::text), 1, 6), $1, 2, NOW(), NOW()),
          ('cat-nv-drinks-' || substr(md5(random()::text), 1, 8), 'Beverages & Refreshers', 'nv-drinks-' || substr(md5(random()::text), 1, 6), $1, 3, NOW(), NOW()),
          ('cat-nv-desserts-' || substr(md5(random()::text), 1, 8), 'Desserts', 'nv-desserts-' || substr(md5(random()::text), 1, 6), $1, 4, NOW(), NOW())
      `, [nonVegRestId]);

      nvCatsRes = await client.query('SELECT id, name FROM categories WHERE "restaurantId" = $1', [nonVegRestId]);
      nvCats = nvCatsRes.rows;
    }

    const startersCat = nvCats.find(c => c.name.toLowerCase().includes("starter")) || nvCats[0];
    const mainCat = nvCats.find(c => c.name.toLowerCase().includes("main") || c.name.toLowerCase().includes("biryani")) || nvCats[0];
    const drinksCat = nvCats.find(c => c.name.toLowerCase().includes("beverage") || c.name.toLowerCase().includes("drink")) || nvCats[0];
    const dessertCat = nvCats.find(c => c.name.toLowerCase().includes("dessert")) || nvCats[0];

    const nonVegProducts = [
      {
        name: "Hyderabadi Dum Chicken Biryani",
        slug: "hyderabadi-dum-chicken-biryani",
        price: 349,
        discount: 10,
        foodType: "NON_VEG",
        description: "Fragrant long-grain basmati rice layered with spiced chicken, caramelized onions, and fresh mint.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        categoryId: mainCat.id,
        isFeatured: true,
        preparationTime: 25,
      },
      {
        name: "Butter Chicken (Murgh Makhani)",
        slug: "butter-chicken-murgh-makhani",
        price: 389,
        discount: 0,
        foodType: "NON_VEG",
        description: "Tender roasted chicken tikka cooked in a rich, creamy, buttery tomato-cashew gravy.",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
        categoryId: mainCat.id,
        isFeatured: true,
        preparationTime: 20,
      },
      {
        name: "Mutton Rogan Josh",
        slug: "mutton-rogan-josh",
        price: 499,
        discount: 5,
        foodType: "NON_VEG",
        description: "Authentic Kashmiri slow-cooked tender lamb in an aromatic blend of fennel, ginger, and saffron spices.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        categoryId: mainCat.id,
        isFeatured: false,
        preparationTime: 30,
      },
      {
        name: "Tandoori Chicken Tikka",
        slug: "tandoori-chicken-tikka",
        price: 299,
        discount: 0,
        foodType: "NON_VEG",
        description: "Succulent boneless chicken chunks marinated in spiced yogurt and grilled over clay tandoor coals.",
        image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
        categoryId: startersCat.id,
        isFeatured: true,
        preparationTime: 15,
      },
      {
        name: "Crispy Fried Chicken Wings",
        slug: "crispy-fried-chicken-wings",
        price: 269,
        discount: 10,
        foodType: "NON_VEG",
        description: "Golden crunchy battered chicken wings tossed in peri-peri seasoning and served with garlic dip.",
        image: "https://images.unsplash.com/photo-1527477321055-436158a2573d?auto=format&fit=crop&w=800&q=80",
        categoryId: startersCat.id,
        isFeatured: false,
        preparationTime: 15,
      },
      {
        name: "Dhaba Style Egg Curry",
        slug: "dhaba-style-egg-curry",
        price: 219,
        discount: 0,
        foodType: "EGG",
        description: "Pan-fried hard-boiled eggs simmered in a spiced onion, tomato, and garlic roadside gravy.",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
        categoryId: mainCat.id,
        isFeatured: false,
        preparationTime: 15,
      },
      {
        name: "Fresh Mint Mojito",
        slug: "fresh-mint-mojito-royal",
        price: 149,
        discount: 0,
        foodType: "VEG", // beverages can be veg
        description: "Zesty lime, crushed fresh mint leaves, cane sugar, and chilled club soda on crushed ice.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
        categoryId: drinksCat.id,
        isFeatured: false,
        preparationTime: 5,
      },
      {
        name: "Sizzling Chocolate Brownie with Ice Cream",
        slug: "sizzling-chocolate-brownie-royal",
        price: 199,
        discount: 0,
        foodType: "EGG",
        description: "Hot fudgy walnut brownie served on a cast iron sizzler plate topped with vanilla bean ice cream.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        categoryId: dessertCat.id,
        isFeatured: true,
        preparationTime: 8,
      }
    ];

    for (const prod of nonVegProducts) {
      const prodId = 'prod-' + Math.random().toString(36).substring(2, 12);
      await client.query(`
        INSERT INTO products (
          id, name, slug, price, discount, "foodType", description, image, 
          "categoryId", "restaurantId", "isAvailable", "isFeatured", "preparationTime", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, NOW(), NOW())
        ON CONFLICT ("restaurantId", slug) DO UPDATE SET
          price = EXCLUDED.price,
          description = EXCLUDED.description,
          image = EXCLUDED.image,
          "foodType" = EXCLUDED."foodType"
      `, [
        prodId, prod.name, prod.slug, prod.price, prod.discount, prod.foodType,
        prod.description, prod.image, prod.categoryId, nonVegRestId, prod.isFeatured, prod.preparationTime
      ]);
    }

    console.log(`Seeded ${nonVegProducts.length} non-veg products for Royal Spice successfully!`);

    // 2. Also ensure Sattva Pure Veg has sample dishes
    let vegCatsRes = await client.query('SELECT id, name FROM categories WHERE "restaurantId" = $1', [vegRestId]);
    let vegCats = vegCatsRes.rows;

    if (vegCats.length > 0) {
      const vegStarters = vegCats.find(c => c.name.toLowerCase().includes("starter")) || vegCats[0];
      const vegMain = vegCats.find(c => c.name.toLowerCase().includes("main")) || vegCats[0];

      const vegProducts = [
        {
          name: "Paneer Tikka Masala",
          slug: "paneer-tikka-masala-sattva",
          price: 319,
          foodType: "VEG",
          description: "Smoky tandoor-grilled cottage cheese cubes cooked in a spiced tomato-butter gravy.",
          image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
          categoryId: vegMain.id,
          isFeatured: true,
          preparationTime: 20
        },
        {
          name: "Dal Makhani Special",
          slug: "dal-makhani-special-sattva",
          price: 249,
          foodType: "VEG",
          description: "Slow-cooked black lentils and kidney beans simmered overnight with butter and fresh cream.",
          image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
          categoryId: vegMain.id,
          isFeatured: true,
          preparationTime: 15
        },
        {
          name: "Crispy Corn & Hara Bhara Kebab",
          slug: "crispy-corn-hara-bhara-sattva",
          price: 219,
          foodType: "VEG",
          description: "Spinach, green pea and potato patties spiced with aromatic herbs and pan-roasted to crisp perfection.",
          image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
          categoryId: vegStarters.id,
          isFeatured: false,
          preparationTime: 12
        }
      ];

      for (const prod of vegProducts) {
        const prodId = 'prod-' + Math.random().toString(36).substring(2, 12);
        await client.query(`
          INSERT INTO products (
            id, name, slug, price, discount, "foodType", description, image, 
            "categoryId", "restaurantId", "isAvailable", "isFeatured", "preparationTime", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, true, $10, $11, NOW(), NOW())
          ON CONFLICT ("restaurantId", slug) DO NOTHING
        `, [
          prodId, prod.name, prod.slug, prod.price, prod.foodType,
          prod.description, prod.image, prod.categoryId, vegRestId, prod.isFeatured, prod.preparationTime
        ]);
      }
      console.log(`Seeded ${vegProducts.length} veg products for Sattva Pure Veg!`);
    }

  } catch (err) {
    console.error("Error seeding products:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts();
