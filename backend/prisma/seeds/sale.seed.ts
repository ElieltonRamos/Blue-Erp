import { PrismaClient } from 'generated/prisma/client';

export async function seedSales(
  prisma: PrismaClient,
  users: any,
  clients: any,
  products: any,
) {
  // Venda 1 - João Silva - paga e emitida
  const sale1 = await prisma.sale.create({
    data: {
      clientId: clients.joao.id,
      userOperator: users.cashier.username,
      operatorId: users.cashier.id,
      date: new Date('2026-02-07T10:30:00'),
      paymentMethod: 'PIX',
      totalProductsWithoutDiscount: 84.0,
      discount: 4.0,
      total: 80.0,
      profitSale: 53.5,
      isPaid: true,
      cfop: '5102',
      fiscalStatus: 'EMITIDA',
      fiscalKey: '35260212345678000190650010000000011234567890',
      fiscalProtocol: '135260000123456',
      fiscalEmitDate: new Date('2026-02-07T10:35:00'),
      items: {
        create: [
          {
            itemNumber: 1,
            productId: products.hamburger.id,
            xProd: products.hamburger.name,
            quantity: 2,
            unitPrice: 28.0,
            totalPrice: 56.0,
            cfop: '5102',
            totalTaxValue: 15.68,
            importTaxValue: 0,
            iofValue: 0,
          },
          {
            itemNumber: 2,
            productId: products.cocaCola.id,
            xProd: products.cocaCola.name,
            quantity: 2,
            unitPrice: 6.0,
            totalPrice: 12.0,
            cfop: '5102',
            totalTaxValue: 4.07,
            importTaxValue: 0,
            iofValue: 0,
          },
          {
            itemNumber: 3,
            productId: products.pudim.id,
            xProd: products.pudim.name,
            quantity: 1,
            unitPrice: 12.0,
            totalPrice: 12.0,
            cfop: '5102',
            totalTaxValue: 3.77,
            importTaxValue: 0,
            iofValue: 0,
          },
        ],
      },
    },
  });

  // Venda 2 - Maria Santos - pendente emissão
  const sale2 = await prisma.sale.create({
    data: {
      clientId: clients.maria.id,
      userOperator: users.cashier.username,
      operatorId: users.cashier.id,
      date: new Date('2026-02-08T11:00:00'),
      paymentMethod: 'DINHEIRO',
      totalProductsWithoutDiscount: 44.0,
      discount: 0,
      total: 44.0,
      profitSale: 30.7,
      isPaid: true,
      cfop: '5102',
      fiscalStatus: 'PENDENTE',
      items: {
        create: [
          {
            itemNumber: 1,
            productId: products.frangoCatupiry.id,
            xProd: products.frangoCatupiry.name,
            quantity: 2,
            unitPrice: 22.0,
            totalPrice: 44.0,
            cfop: '5102',
            totalTaxValue: 12.64,
            importTaxValue: 0,
            iofValue: 0,
          },
        ],
      },
    },
  });

  // Venda 3 - Consumidor Final - balcão
  const sale3 = await prisma.sale.create({
    data: {
      clientId: clients.consumidorFinal.id,
      userOperator: users.cashier.username,
      operatorId: users.cashier.id,
      date: new Date('2026-02-08T12:00:00'),
      paymentMethod: 'CREDITO',
      totalProductsWithoutDiscount: 18.0,
      discount: 0,
      total: 18.0,
      profitSale: 12.3,
      isPaid: true,
      cfop: '5102',
      fiscalStatus: 'EMITIDA',
      fiscalKey: '35260212345678000190650010000000021234567891',
      fiscalProtocol: '135260000123457',
      fiscalEmitDate: new Date('2026-02-08T12:05:00'),
      items: {
        create: [
          {
            itemNumber: 1,
            productId: products.cocaCola.id,
            xProd: products.cocaCola.name,
            quantity: 2,
            unitPrice: 6.0,
            totalPrice: 12.0,
            cfop: '5102',
            totalTaxValue: 4.07,
            importTaxValue: 0,
            iofValue: 0,
          },
          {
            itemNumber: 2,
            productId: products.cocaCola.id,
            xProd: products.cocaCola.name,
            quantity: 1,
            unitPrice: 6.0,
            totalPrice: 6.0,
            cfop: '5102',
            totalTaxValue: 2.03,
            importTaxValue: 0,
            iofValue: 0,
          },
        ],
      },
    },
  });

  console.log('✓ Sales seed');
  return { sale1, sale2, sale3 };
}
