import { PrismaClient } from 'generated/prisma/client';

export async function seedOrders(
  prisma: PrismaClient,
  users: any,
  products: any,
) {
  // Pedido local - mesa 5 - em aberto
  const order1 = await prisma.order.create({
    data: {
      type: 'DINE_IN',
      locationId: 'LOCAL_01',
      customerName: 'Mesa 5',
      table: '5',
      status: 'OPEN',
      total: 62.0,
      operatorId: users.cashier.id,
      kitchenSentAt: new Date('2026-02-08T12:15:00'),
      items: {
        create: [
          {
            code: products.hamburger.code,
            name: products.hamburger.name,
            quantity: 2,
            unitPrice: 28.0,
            total: 56.0,
            productId: products.hamburger.id,
            productions: {
              create: {
                productionLocation:
                  products.hamburger.productionLocation || 'LOCAL_01',
                status: 'IN_PROGRESS',
                quantityRequested: 2,
                quantityProduced: 1,
                pendingAt: new Date('2026-02-08T12:15:00'),
                startedAt: new Date('2026-02-08T12:16:00'),
              },
            },
          },
          {
            code: products.cocaCola.code,
            name: products.cocaCola.name,
            quantity: 1,
            unitPrice: 6.0,
            total: 6.0,
            productId: products.cocaCola.id,
            // Coca-Cola é RESALE, não cria production
          },
        ],
      },
    },
  });

  // Pedido delivery - finalizado
  const order2 = await prisma.order.create({
    data: {
      type: 'DELIVERY',
      locationId: 'DELIVERY',
      customerName: 'João Silva',
      address: 'Rua das Acácias, 123',
      status: 'CLOSED',
      total: 56.0,
      operatorId: users.cashier.id,
      kitchenSentAt: new Date('2026-02-08T11:30:00'),
      kitchenReadyAt: new Date('2026-02-08T11:55:00'),
      finishedAt: new Date('2026-02-08T12:30:00'),
      deliveredAt: new Date('2026-02-08T12:30:00'),
      items: {
        create: [
          {
            code: products.frangoCatupiry.code,
            name: products.frangoCatupiry.name,
            quantity: 2,
            unitPrice: 22.0,
            total: 44.0,
            kitchenReadyAt: new Date('2026-02-08T11:55:00'),
            productId: products.frangoCatupiry.id,
            productions: {
              create: {
                productionLocation:
                  products.frangoCatupiry.productionLocation || 'LOCAL_01',
                status: 'COMPLETED',
                quantityRequested: 2,
                quantityProduced: 2,
                pendingAt: new Date('2026-02-08T11:30:00'),
                startedAt: new Date('2026-02-08T11:32:00'),
                completedAt: new Date('2026-02-08T11:55:00'),
                deliveredAt: new Date('2026-02-08T11:55:00'),
              },
            },
          },
          {
            code: products.pudim.code,
            name: products.pudim.name,
            quantity: 1,
            unitPrice: 12.0,
            total: 12.0,
            kitchenReadyAt: new Date('2026-02-08T11:55:00'),
            productId: products.pudim.id,
            productions: {
              create: {
                productionLocation:
                  products.pudim.productionLocation || 'LOCAL_01',
                status: 'COMPLETED',
                quantityRequested: 1,
                quantityProduced: 1,
                pendingAt: new Date('2026-02-08T11:30:00'),
                startedAt: new Date('2026-02-08T11:32:00'),
                completedAt: new Date('2026-02-08T11:55:00'),
                deliveredAt: new Date('2026-02-08T11:55:00'),
              },
            },
          },
        ],
      },
    },
  });

  // Pedido local - mesa 3 - aguardando produção
  const order3 = await prisma.order.create({
    data: {
      type: 'DINE_IN',
      locationId: 'LOCAL_01',
      customerName: 'Mesa 3',
      table: '3',
      status: 'OPEN',
      total: 15.5,
      operatorId: users.cashier.id,
      kitchenSentAt: new Date('2026-02-08T12:20:00'),
      items: {
        create: [
          {
            code: products.aguaMineral.code,
            name: products.aguaMineral.name,
            quantity: 1,
            unitPrice: 3.5,
            total: 3.5,
            productId: products.aguaMineral.id,
            // Água é RESALE, não cria production
          },
          {
            code: products.pudim.code,
            name: products.pudim.name,
            quantity: 1,
            unitPrice: 12.0,
            total: 12.0,
            productId: products.pudim.id,
            productions: {
              create: {
                productionLocation:
                  products.pudim.productionLocation || 'LOCAL_01',
                status: 'PENDING',
                quantityRequested: 1,
                quantityProduced: 0,
                pendingAt: new Date('2026-02-08T12:20:00'),
              },
            },
          },
        ],
      },
    },
  });

  console.log('✓ Orders seed');
  return { order1, order2, order3 };
}
