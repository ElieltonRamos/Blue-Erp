import { PrismaClient } from 'generated/prisma/client';

export async function seedTables(prisma: PrismaClient, locations: any) {
  const tables = [
    { number: 1, capacity: 6 },
    { number: 2, capacity: 4 },
    { number: 3, capacity: 6 },
    { number: 4, capacity: 6 },
    { number: 5, capacity: 8 },
    { number: 6, capacity: 4 },
    { number: 7, capacity: 4 },
    { number: 8, capacity: 6 },
    { number: 9, capacity: 8 },
    { number: 10, capacity: 6 },
    { number: 11, capacity: 4 },
    { number: 12, capacity: 6 },
    { number: 13, capacity: 8 },
    { number: 14, capacity: 6 },
    { number: 15, capacity: 6 },
    { number: 16, capacity: 8 },
    { number: 17, capacity: 6 },
    { number: 18, capacity: 8 },
    { number: 19, capacity: 8 },
    { number: 20, capacity: 6 },
    { number: 21, capacity: 6 },
    { number: 22, capacity: 4 },
    { number: 23, capacity: 6 },
  ];

  for (const table of tables) {
    await prisma.table.upsert({
      where: {
        number_locationId: {
          number: table.number,
          locationId: locations.domJuan.id,
        },
      },
      update: {},
      create: {
        number: table.number,
        capacity: table.capacity,
        status: 'AVAILABLE',
        locationId: locations.domJuan.id,
      },
    });
  }

  console.log('✓ Tables seed');
}
