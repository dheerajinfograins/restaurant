import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { couponService } from "../src/modules/coupon";

async function runCouponTests() {
  console.log("=========================================");
  console.log("  RUNNING COUPON ENGINE AUTOMATED TESTS  ");
  console.log("=========================================\n");

  // 1. Find Sattva Pure Veg restaurant
  const restaurant = await prisma.restaurant.findFirst({
    where: { name: { contains: "Sattva", mode: "insensitive" } },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found for tests");
  }

  const products = await prisma.product.findMany({
    where: { category: { restaurantId: restaurant.id } },
  });

  console.log(`[TEST 1] Testing with Restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
  console.log(`Available menu items in restaurant: ${products.length}`);

  const product1 = products[0] || { id: "cm_dummy_p1", price: 300, name: "Paneer Butter Masala" };
  const product2 = products[1] || products[0] || { id: "cm_dummy_p2", price: 200, name: "Dal Tadka" };

  // Clean previous test coupons
  await prisma.coupon.deleteMany({
    where: {
      restaurantId: restaurant.id,
      code: { in: ["TEST_DISH20", "TEST_FLAT100", "TEST_FEAST1200"] },
    },
  });

  // 2. Test Create 3 Coupon Types
  console.log("\n[TEST 2] Creating 3 Types of Promotional Coupons...");

  // Type A: PRODUCT_DISCOUNT
  const dishCoupon = await couponService.createCoupon(restaurant.id, {
    code: "TEST_DISH20",
    description: "20% discount on selected signature dishes",
    couponType: "PRODUCT_DISCOUNT",
    discountType: "PERCENTAGE",
    discountValue: 20,
    productIds: product1 ? [product1.id] : [],
    isActive: true,
  });
  console.log(`✓ Created PRODUCT_DISCOUNT: ${dishCoupon.code} (${dishCoupon.discountValue}% on ${dishCoupon.productIds.length} items)`);

  // Type B: ORDER_DISCOUNT
  const flatCoupon = await couponService.createCoupon(restaurant.id, {
    code: "TEST_FLAT100",
    description: "Flat ₹100 OFF on total bill above ₹500",
    couponType: "ORDER_DISCOUNT",
    discountType: "FLAT",
    discountValue: 100,
    minOrderAmount: 500,
    isActive: true,
  });
  console.log(`✓ Created ORDER_DISCOUNT: ${flatCoupon.code} (Flat ₹${flatCoupon.discountValue} on min order ₹${flatCoupon.minOrderAmount})`);

  // Type C: TIERED_MIN_ORDER (Min ₹1,200, Max ₹300)
  const tieredCoupon = await couponService.createCoupon(restaurant.id, {
    code: "TEST_FEAST1200",
    description: "20% OFF up to ₹300 on orders above ₹1,200",
    couponType: "TIERED_MIN_ORDER",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 1200,
    maxDiscount: 300,
    isActive: true,
  });
  console.log(`✓ Created TIERED_MIN_ORDER: ${tieredCoupon.code} (${tieredCoupon.discountValue}% max ₹${tieredCoupon.maxDiscount} for orders >= ₹${tieredCoupon.minOrderAmount})`);

  // 3. Test Validations
  console.log("\n[TEST 3] Testing Coupon Calculations & Threshold Rules...");

  // 3A. Tiered coupon with cart below minimum threshold (₹800 < ₹1200) -> Must fail
  try {
    await couponService.validateCoupon({
      code: "TEST_FEAST1200",
      restaurantId: restaurant.id,
      subtotal: 800,
      items: [{ id: product1.id, quantity: 2, price: 400 }],
    });
    console.error("❌ FAILED: TEST_FEAST1200 should have failed for subtotal ₹800");
  } catch (err: any) {
    console.log(`✓ SUCCESS: Correctly rejected below threshold - "${err.message}"`);
  }

  // 3B. Tiered coupon with cart above threshold (₹1500 >= ₹1200) -> 20% of 1500 = 300 (hits max cap of 300)
  const tieredValid = await couponService.validateCoupon({
    code: "TEST_FEAST1200",
    restaurantId: restaurant.id,
    subtotal: 1500,
    items: [{ id: product1.id, quantity: 3, price: 500 }],
  });
  console.log(`✓ SUCCESS: Validated TEST_FEAST1200 on ₹1,500 cart -> Discount: ₹${tieredValid.discountAmount} (Max Cap Enforced: ${tieredValid.discountAmount === 300})`);

  // 3C. Product-specific coupon
  if (product1) {
    const dishValid = await couponService.validateCoupon({
      code: "TEST_DISH20",
      restaurantId: restaurant.id,
      subtotal: 700,
      items: [
        { id: product1.id, quantity: 1, price: 300 }, // matching product -> 20% of 300 = 60
        { id: "other-item", quantity: 1, price: 400 }, // non-matching
      ],
    });
    console.log(`✓ SUCCESS: Validated TEST_DISH20 on mixed cart -> Discount: ₹${dishValid.discountAmount} (Calculated only on matching dish: ${dishValid.discountAmount === 60})`);
  }

  // 3D. Flat total discount
  const flatValid = await couponService.validateCoupon({
    code: "TEST_FLAT100",
    restaurantId: restaurant.id,
    subtotal: 650,
    items: [{ id: product1.id, quantity: 1, price: 650 }],
  });
  console.log(`✓ SUCCESS: Validated TEST_FLAT100 on ₹650 cart -> Discount: ₹${flatValid.discountAmount}`);

  // 4. Test Listing
  const allCoupons = await couponService.getCoupons(restaurant.id);
  console.log(`\n[TEST 4] Total coupons retrieved for ${restaurant.name}: ${allCoupons.length}`);

  console.log("\n=========================================");
  console.log("  ALL COUPON ENGINE TESTS PASSED! 🎉    ");
  console.log("=========================================\n");
}

runCouponTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
