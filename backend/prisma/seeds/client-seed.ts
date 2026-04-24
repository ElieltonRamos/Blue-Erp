import { PrismaClient } from 'generated/prisma/client';

export async function seedClients(prisma: PrismaClient) {
  // const joao = await prisma.client.upsert({
  //   where: { cpf: '00000000000' },
  //   update: {},
  //   create: {
  //     name: 'Clientes Avista',
  //     phone: '00000000000',
  //     address: 'Sem Endereço',
  //     cpf: '00000000000',
  //     active: true,
  //   },
  // });

  // const maria = await prisma.client.upsert({
  //   where: { cpf: '98765432109' },
  //   update: {},
  //   create: {
  //     name: 'Maria Santos',
  //     phone: '11912345678',
  //     address: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP',
  //     cpf: '98765432109',
  //     active: true,
  //   },
  // });

  const consumidorFinal = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Consumidor Final',
      active: true,
    },
  });

  console.log('✓ Clients seed');
  return { consumidorFinal };
}
