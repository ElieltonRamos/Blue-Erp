import { PrismaClient } from 'generated/prisma/client';

export async function seedProductionLocations(prisma: PrismaClient) {
  const japonesa = await prisma.productionLocation.upsert({
    where: { code: 'BAR' },
    update: {},
    create: {
      code: 'BAR',
      name: 'BAR',
      description: 'Preparo de Bebidas e drinks',
      active: true,
      order: 1,
    },
  });

  const churrascaria = await prisma.productionLocation.upsert({
    where: { code: 'COZINHA_DOM_JUAN' },
    update: {},
    create: {
      code: 'COZINHA_DOM_JUAN',
      name: 'DOM JUAN',
      description: 'Preparo de Pratos especiais',
      active: true,
      order: 2,
    },
  });

  console.log('✓ Production Locations seed');
  return { japonesa, churrascaria };
}
