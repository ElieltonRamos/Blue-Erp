import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';
import { seedCompany } from './company.seed';
import { seedUsers } from './user.seed';
import { seedIbpt } from './ibpt.seed';
import { seedCategories } from './category.seed';
import { seedPrimaryMaterials } from './primary-material.seed';
import { seedClients } from './client.seed';
import { seedExpenses } from './expense.seed';
import { seedOrders } from './order.seed';
import { seedSales } from './sale.seed';
import { seedProducts } from './product.seed';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  await seedCompany(prisma);
  const users = await seedUsers(prisma);
  await seedIbpt(prisma);
  const categories = await seedCategories(prisma);
  const materials = await seedPrimaryMaterials(prisma);
  const products = await seedProducts(prisma, categories, materials);
  const clients = await seedClients(prisma);
  await seedExpenses(prisma);
  await seedOrders(prisma, users, products);
  await seedSales(prisma, users, clients, products);

  console.log('✅ Seed concluído');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
