import { PrismaClient } from 'generated/prisma/client';

export async function seedProductionLocations(prisma: PrismaClient) {
  const cozinha = await prisma.productionLocation.upsert({
    where: { code: 'COZINHA' },
    update: {},
    create: {
      code: 'COZINHA',
      name: 'Cozinha',
      description: 'Preparo de pratos quentes, carnes, massas e frutos do mar',
      active: true,
      order: 1,
    },
  });

  const bar = await prisma.productionLocation.upsert({
    where: { code: 'BAR' },
    update: {},
    create: {
      code: 'BAR',
      name: 'Bar',
      description: 'Preparo de bebidas, drinks e sobremesas',
      active: true,
      order: 2,
    },
  });

  console.log('✓ Production Locations seed');
  return { cozinha, bar };
}
