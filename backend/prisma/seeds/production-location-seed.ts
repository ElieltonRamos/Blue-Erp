import { PrismaClient } from 'generated/prisma/client';

export async function seedProductionLocations(prisma: PrismaClient) {
  const japonesa = await prisma.productionLocation.upsert({
    where: { code: 'JAPONESA' },
    update: {},
    create: {
      code: 'JAPONESA',
      name: 'Cozinha Japonesa',
      description: 'Preparo de sushis, sashimis e pratos orientais',
      active: true,
      order: 1,
    },
  });

  const churrascaria = await prisma.productionLocation.upsert({
    where: { code: 'CHURRASCARIA' },
    update: {},
    create: {
      code: 'CHURRASCARIA',
      name: 'Churrascaria',
      description: 'Preparo de carnes grelhadas e churrasco',
      active: true,
      order: 2,
    },
  });

  console.log('✓ Production Locations seed');
  return { japonesa, churrascaria };
}
