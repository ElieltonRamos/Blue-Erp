import { PrismaClient } from 'generated/prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const hashCashier = await bcrypt.hash('caixa123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashAdmin,
      role: 'admin',
      workplace: 'CHURRASCARIA',
      active: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { username: 'caixa01' },
    update: {},
    create: {
      username: 'caixa01',
      password: hashCashier,
      role: 'caixa',
      workplace: 'JAPONESA',
      active: true,
    },
  });

  console.log('✓ Users seed');
  return { admin, cashier };
}
