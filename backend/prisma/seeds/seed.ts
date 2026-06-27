import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';
import { seedCompany } from './company-seed';
import { seedUsers } from './user-seed';
import { seedIbpt } from './ibpt-seed';
import { seedCategories } from './category-seed';
import { seedProductionLocations } from './production-location-seed';
import { seedPrimaryMaterials } from './primary-material-seed';
import { seedProducts } from './product-seed';
import { seedTables } from './seed-tables';
import { seedClients } from './client-seed';
import { seedExpenses } from './expense-seed';
import { seedOrders } from './seed-orders';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || '127.0.0.1',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'db_blue_erp',
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  await seedCompany(prisma);
  await seedUsers(prisma);
  await seedIbpt(prisma);

  const categories = await seedCategories(prisma);
  const locations = await seedProductionLocations(prisma);
  await seedPrimaryMaterials(prisma);

  const products = await seedProducts(prisma, categories, locations);
  const tables = await seedTables(prisma, locations);
  const clients = await seedClients(prisma);
  await seedExpenses(prisma);

  const users = {
    admin: await prisma.user.findFirstOrThrow({
      where: { username: 'admin_test' },
    }),
    garcom: await prisma.user.findFirstOrThrow({
      where: { username: 'garcom_test' },
    }),
  };

  await seedOrders(prisma, users, clients, products, locations, tables);

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
