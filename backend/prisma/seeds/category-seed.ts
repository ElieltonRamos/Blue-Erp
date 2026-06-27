import { PrismaClient } from 'generated/prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  const carnes = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Carnes', active: true },
  });

  const massas = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Massas', active: true },
  });

  const frutosDoMar = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Frutos do Mar', active: true },
  });

  const sobremesas = await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: 'Sobremesas', active: true },
  });

  const bebidas = await prisma.category.upsert({
    where: { id: 5 },
    update: {},
    create: { id: 5, name: 'Bebidas', active: true },
  });

  console.log('✓ Categories seed');
  return { carnes, massas, frutosDoMar, sobremesas, bebidas };
}
