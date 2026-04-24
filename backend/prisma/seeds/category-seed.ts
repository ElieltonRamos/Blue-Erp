import { PrismaClient } from 'generated/prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  const entradas = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Entradas para Compartilhar', active: true },
  });

  const cortes = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Seleção de Cortes', active: true },
  });

  const especiais = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Especiais de Cordeiro, Aves & Suínos', active: true },
  });

  const pasta = await prisma.category.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'Pasta & Brasa', active: true },
  });

  const guarnicoes = await prisma.category.upsert({
    where: { id: 5 },
    update: {},
    create: { name: 'Guarnições', active: true },
  });

  const sandwiches = await prisma.category.upsert({
    where: { id: 6 },
    update: {},
    create: { name: 'Sandwiches & Fries', active: true },
  });

  const drinksGin = await prisma.category.upsert({
    where: { id: 7 },
    update: {},
    create: { name: 'Drinks com Gin', active: true },
  });

  const drinksSemAlcool = await prisma.category.upsert({
    where: { id: 8 },
    update: {},
    create: { name: 'Drinks sem Álcool', active: true },
  });

  const sucos = await prisma.category.upsert({
    where: { id: 9 },
    update: {},
    create: { name: 'Sucos da Fruta', active: true },
  });

  const bebidas = await prisma.category.upsert({
    where: { id: 10 },
    update: {},
    create: { name: 'Bebidas', active: true },
  });

  console.log('✓ Categories seed');
  return {
    entradas,
    cortes,
    especiais,
    pasta,
    guarnicoes,
    sandwiches,
    drinksGin,
    drinksSemAlcool,
    sucos,
    bebidas,
  };
}
