import { PrismaClient } from 'generated/prisma/client';

export async function seedTables(prisma: PrismaClient, locations: any) {
  const tables = [
    { number: 1, capacity: 4 },
    { number: 2, capacity: 4 },
    { number: 3, capacity: 6 },
    { number: 4, capacity: 6 },
    { number: 5, capacity: 8 },
    { number: 6, capacity: 4 },
    { number: 7, capacity: 4 },
    { number: 8, capacity: 6 },
    { number: 9, capacity: 8 },
    { number: 10, capacity: 6 },
  ];

  for (const table of tables) {
    await prisma.table.upsert({
      where: {
        number_locationId: {
          number: table.number,
          locationId: locations.cozinha.id,
        },
      },
      update: {},
      create: {
        number: table.number,
        capacity: table.capacity,
        status: 'AVAILABLE',
        locationId: locations.cozinha.id,
      },
    });
  }

  const mesa3 = await prisma.table.findUniqueOrThrow({
    where: {
      number_locationId: { number: 3, locationId: locations.cozinha.id },
    },
  });
  const mesa5 = await prisma.table.findUniqueOrThrow({
    where: {
      number_locationId: { number: 5, locationId: locations.cozinha.id },
    },
  });
  const mesa8 = await prisma.table.findUniqueOrThrow({
    where: {
      number_locationId: { number: 8, locationId: locations.cozinha.id },
    },
  });

  console.log('✓ Tables seed');
  return { mesa3, mesa5, mesa8 };
}
