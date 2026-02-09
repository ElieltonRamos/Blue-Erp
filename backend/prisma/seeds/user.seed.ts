import { PrismaClient } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashCashier = await bcrypt.hash('caixa123', 10);
  const hashKitchen = await bcrypt.hash('cozinha123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashAdmin,
      role: 'admin',
      workplace: 'LOCAL_01',
      active: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { username: 'caixa01' },
    update: {},
    create: {
      username: 'caixa01',
      password: hashCashier,
      role: 'CASHIER',
      workplace: 'LOCAL_01',
      active: true,
    },
  });

  const kitchen = await prisma.user.upsert({
    where: { username: 'cozinha01' },
    update: {},
    create: {
      username: 'cozinha01',
      password: hashKitchen,
      role: 'KITCHEN',
      workplace: 'LOCAL_01',
      active: true,
    },
  });

  console.log('✓ Users seed');
  return { admin, cashier, kitchen };
}
