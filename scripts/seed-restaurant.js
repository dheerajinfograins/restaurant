require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.restaurant.upsert({
    where: { id: 'super-admin-restaurant' },
    update: {},
    create: {
      id: 'super-admin-restaurant',
      name: 'Super Admin Restaurant',
      email: 'super@restaurant.com',
      phone: '0000000000',
      address: 'Admin Address'
    }
  });
  console.log('Dummy restaurant seeded');
}

main().catch(console.error).finally(() => prisma.$disconnect());
