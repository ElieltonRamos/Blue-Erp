import { PrismaClient } from 'generated/prisma/client';

export async function seedClients(prisma: PrismaClient) {
  // Cliente 1
  const consumidorFinal = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Consumidor Final',
      cpf: '00000000000',
      active: true,
    },
  });

  // Cliente 2
  const maria = await prisma.client.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Maria Santos',
      phone: '11912345678',
      address: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP',
      cpf: '98765432109',
      active: true,
    },
  });

  console.log('✓ Clients seed');
  return { consumidorFinal, maria };
}
