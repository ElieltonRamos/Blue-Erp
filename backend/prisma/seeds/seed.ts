import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';
import { seedCompany } from './company-seed';
import { seedUsers } from './user-seed';
import { seedIbpt } from './ibpt-seed';
import { seedCategories } from './category-seed';
import { seedProductionLocations } from './production-location-seed';
import { seedPrimaryMaterials } from './primary-material-seed';
import { seedClients } from './client-seed';
import { seedExpenses } from './expense-seed';
import { seedProducts } from './product-seed';

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
  const materials = await seedPrimaryMaterials(prisma);
  await seedProducts(prisma, categories, materials, locations);
  await seedClients(prisma);
  await seedExpenses(prisma);

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
