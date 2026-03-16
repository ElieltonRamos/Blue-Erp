import { PrismaClient } from 'generated/prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  const bebidas = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Bebidas',
      active: true,
    },
  });

  const lanches = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Lanches',
      active: true,
    },
  });

  const sobremesas = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Sobremesas',
      active: true,
    },
  });

  const pratos = await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Pratos Principais',
      active: true,
    },
  });

  console.log('✓ Categories seed');
  return { bebidas, lanches, sobremesas, pratos };
}
