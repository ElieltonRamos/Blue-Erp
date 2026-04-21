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

  console.log('✓ Categories seed');
  return { entradas, cortes, especiais, pasta, guarnicoes, sandwiches };
}
