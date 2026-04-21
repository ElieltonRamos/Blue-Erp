import { PrismaClient } from 'generated/prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  const hashAdmin = await bcrypt.hash('impostoeroubo', 10);
  const hashCashier = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'root' },
    update: {},
    create: {
      username: 'root',
      password: hashAdmin,
      role: 'admin',
      workplace: '',
      active: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { username: 'Renan' },
    update: {},
    create: {
      username: 'Renan',
      password: hashCashier,
      role: 'admin',
      workplace: '',
      active: true,
    },
  });

  console.log('✓ Users seed');
  return { admin, cashier };
}
