import { PrismaClient } from 'generated/prisma/client';

export async function seedClients(prisma: PrismaClient) {
  const joao = await prisma.client.upsert({
    where: { cpf: '12345678901' },
    update: {},
    create: {
      name: 'João Silva',
      phone: '11987654321',
      address: 'Rua das Acácias, 123 - Centro - São Paulo/SP',
      cpf: '12345678901',
      active: true,
    },
  });

  const maria = await prisma.client.upsert({
    where: { cpf: '98765432109' },
    update: {},
    create: {
      name: 'Maria Santos',
      phone: '11912345678',
      address: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP',
      cpf: '98765432109',
      active: true,
    },
  });

  const consumidorFinal = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Consumidor Final',
      active: true,
    },
  });

  console.log('✓ Clients seed');
  return { joao, maria, consumidorFinal };
}
