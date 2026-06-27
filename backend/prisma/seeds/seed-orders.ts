import {
  PrismaClient,
  OrderStatus,
  OrderType,
  ProductionStatus,
  FiscalStatus,
} from 'generated/prisma/client';

export async function seedOrders(
  prisma: PrismaClient,
  users: any,
  clients: any,
  products: any,
  locations: any,
  tables: any,
) {
  // ─── ORDER 1: DINE_IN - OPEN, itens em produção ──────────────────────────────
  const order1 = await prisma.order.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      type: OrderType.DINE_IN,
      locationId: locations.cozinha.code,
      customerName: 'Carlos Menezes',
      table: '3',
      status: OrderStatus.OPEN,
      total: 0,
      serviceCharge: 0,
      operatorId: users.garcom.id,
      createdAt: new Date('2026-06-27T19:00:00'),
    },
  });

  await prisma.table.update({
    where: { id: tables.mesa3.id },
    data: {
      status: 'OCCUPIED',
      orderId: order1.id,
      customer: 'Carlos Menezes',
    },
  });

  const o1i1 = await prisma.orderItem.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      orderId: order1.id,
      productId: products.picanha.id,
      code: products.picanha.code,
      name: products.picanha.name,
      quantity: 1,
      unitPrice: products.picanha.price,
      total: products.picanha.price,
      serviceCharge: 0,
      operatorId: users.garcom.id,
      observation: 'Ao ponto',
    },
  });

  const o1i2 = await prisma.orderItem.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      orderId: order1.id,
      productId: products.cerveja.id,
      code: products.cerveja.code,
      name: products.cerveja.name,
      quantity: 2,
      unitPrice: products.cerveja.price,
      total: Number(products.cerveja.price) * 2,
      serviceCharge: 0,
      operatorId: users.garcom.id,
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      orderItemId: o1i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.IN_PROGRESS,
      quantityRequested: 1,
      quantityProduced: 0,
      pendingAt: new Date('2026-06-27T19:01:00'),
      startedAt: new Date('2026-06-27T19:05:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      orderItemId: o1i2.id,
      productionLocation: locations.bar.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 2,
      quantityProduced: 2,
      pendingAt: new Date('2026-06-27T19:01:00'),
      startedAt: new Date('2026-06-27T19:02:00'),
      completedAt: new Date('2026-06-27T19:04:00'),
      deliveredAt: new Date('2026-06-27T19:05:00'),
    },
  });

  await prisma.order.update({
    where: { id: order1.id },
    data: {
      total:
        Number(products.picanha.price) + Number(products.cerveja.price) * 2,
    },
  });

  // ─── ORDER 2: DINE_IN - CLOSED → Sale EMITIDA, pagamento crédito ─────────────
  const order2 = await prisma.order.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      type: OrderType.DINE_IN,
      locationId: locations.cozinha.code,
      customerName: 'Ana Paula',
      table: '5',
      status: OrderStatus.CLOSED,
      total: 229.8,
      serviceCharge: 22.98,
      operatorId: users.garcom.id,
      closedByOperatorId: users.admin.id,
      createdAt: new Date('2026-06-27T18:00:00'),
      finishedAt: new Date('2026-06-27T20:00:00'),
    },
  });

  const o2i1 = await prisma.orderItem.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      orderId: order2.id,
      productId: products.moquecaCamarao.id,
      code: products.moquecaCamarao.code,
      name: products.moquecaCamarao.name,
      quantity: 1,
      unitPrice: products.moquecaCamarao.price,
      total: products.moquecaCamarao.price,
      serviceCharge: Number(products.moquecaCamarao.price) * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-27T18:50:00'),
    },
  });

  const o2i2 = await prisma.orderItem.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      orderId: order2.id,
      productId: products.caipirinha.id,
      code: products.caipirinha.code,
      name: products.caipirinha.name,
      quantity: 2,
      unitPrice: products.caipirinha.price,
      total: Number(products.caipirinha.price) * 2,
      serviceCharge: Number(products.caipirinha.price) * 2 * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-27T18:15:00'),
    },
  });

  const o2i3 = await prisma.orderItem.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      orderId: order2.id,
      productId: products.pudim.id,
      code: products.pudim.code,
      name: products.pudim.name,
      quantity: 1,
      unitPrice: products.pudim.price,
      total: products.pudim.price,
      serviceCharge: Number(products.pudim.price) * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-27T19:30:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      orderItemId: o2i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 1,
      quantityProduced: 1,
      pendingAt: new Date('2026-06-27T18:01:00'),
      startedAt: new Date('2026-06-27T18:10:00'),
      completedAt: new Date('2026-06-27T18:48:00'),
      deliveredAt: new Date('2026-06-27T18:50:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      orderItemId: o2i2.id,
      productionLocation: locations.bar.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 2,
      quantityProduced: 2,
      pendingAt: new Date('2026-06-27T18:01:00'),
      startedAt: new Date('2026-06-27T18:05:00'),
      completedAt: new Date('2026-06-27T18:12:00'),
      deliveredAt: new Date('2026-06-27T18:15:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      orderItemId: o2i3.id,
      productionLocation: locations.bar.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 1,
      quantityProduced: 1,
      pendingAt: new Date('2026-06-27T19:00:00'),
      startedAt: new Date('2026-06-27T19:05:00'),
      completedAt: new Date('2026-06-27T19:25:00'),
      deliveredAt: new Date('2026-06-27T19:30:00'),
    },
  });

  // 149.9 + 18.9*2 + 22.9 = 210.6 produtos; service 21.06; total 231.66
  const sale2 = await prisma.sale.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      clientId: clients.consumidorFinal.id,
      userOperator: users.admin.username,
      operatorId: users.admin.id,
      orderId: order2.id,
      date: new Date('2026-06-27T20:00:00'),
      totalProductsWithoutDiscount: 210.6,
      discount: 0,
      total: 231.66,
      profitSale: 90.0,
      isPaid: true,
      serviceCharge: 21.06,
      cfop: '5102',
      fiscalStatus: FiscalStatus.EMITIDA,
      fiscalKey: '29260666182168000173650010000000011000000014',
      fiscalProtocol: '129260000014321',
      fiscalEmitDate: new Date('2026-06-27T20:01:00'),
      fiscalXml:
        '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe>...</NFe></nfeProc>',
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale2.id, itemNumber: 1 } },
    update: {},
    create: {
      saleId: sale2.id,
      itemNumber: 1,
      productId: products.moquecaCamarao.id,
      quantity: 1,
      unitPrice: products.moquecaCamarao.price,
      totalPrice: products.moquecaCamarao.price,
      cfop: '5102',
      serviceCharge: Number(products.moquecaCamarao.price) * 0.1,
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale2.id, itemNumber: 2 } },
    update: {},
    create: {
      saleId: sale2.id,
      itemNumber: 2,
      productId: products.caipirinha.id,
      quantity: 2,
      unitPrice: products.caipirinha.price,
      totalPrice: Number(products.caipirinha.price) * 2,
      cfop: '5102',
      serviceCharge: Number(products.caipirinha.price) * 2 * 0.1,
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale2.id, itemNumber: 3 } },
    update: {},
    create: {
      saleId: sale2.id,
      itemNumber: 3,
      productId: products.pudim.id,
      quantity: 1,
      unitPrice: products.pudim.price,
      totalPrice: products.pudim.price,
      cfop: '5102',
      serviceCharge: Number(products.pudim.price) * 0.1,
    },
  });

  await prisma.salePayment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      saleId: sale2.id,
      method: 'CREDITO',
      amount: 231.66,
      change: 0,
    },
  });

  // ─── ORDER 3: DELIVERY - CLOSED → Sale PENDENTE ───────────────────────────────
  const order3 = await prisma.order.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      type: OrderType.DELIVERY,
      locationId: locations.cozinha.code,
      customerName: 'Roberto Alves',
      address: 'Rua das Flores, 200 - Centro',
      status: OrderStatus.CLOSED,
      total: 79.9,
      serviceCharge: 0,
      operatorId: users.admin.id,
      closedByOperatorId: users.admin.id,
      createdAt: new Date('2026-06-27T17:00:00'),
      finishedAt: new Date('2026-06-27T17:50:00'),
    },
  });

  const o3i1 = await prisma.orderItem.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      orderId: order3.id,
      productId: products.feijoada.id,
      code: products.feijoada.code,
      name: products.feijoada.name,
      quantity: 1,
      unitPrice: products.feijoada.price,
      total: products.feijoada.price,
      serviceCharge: 0,
      operatorId: users.admin.id,
      kitchenReadyAt: new Date('2026-06-27T17:45:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      orderItemId: o3i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 1,
      quantityProduced: 1,
      pendingAt: new Date('2026-06-27T17:01:00'),
      startedAt: new Date('2026-06-27T17:10:00'),
      completedAt: new Date('2026-06-27T17:43:00'),
      deliveredAt: new Date('2026-06-27T17:45:00'),
    },
  });

  const sale3 = await prisma.sale.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      clientId: clients.consumidorFinal.id,
      userOperator: users.admin.username,
      operatorId: users.admin.id,
      orderId: order3.id,
      date: new Date('2026-06-27T17:50:00'),
      totalProductsWithoutDiscount: 79.9,
      discount: 0,
      total: 79.9,
      profitSale: 47.9,
      isPaid: true,
      serviceCharge: 0,
      cfop: '5102',
      fiscalStatus: FiscalStatus.PENDENTE,
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale3.id, itemNumber: 1 } },
    update: {},
    create: {
      saleId: sale3.id,
      itemNumber: 1,
      productId: products.feijoada.id,
      quantity: 1,
      unitPrice: products.feijoada.price,
      totalPrice: products.feijoada.price,
      cfop: '5102',
      serviceCharge: 0,
    },
  });

  await prisma.salePayment.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      saleId: sale3.id,
      method: 'PIX',
      amount: 79.9,
      change: 0,
    },
  });

  // ─── ORDER 4: DINE_IN - CANCELED, produção CANCELED ──────────────────────────
  const order4 = await prisma.order.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      type: OrderType.DINE_IN,
      locationId: locations.cozinha.code,
      customerName: 'Cliente Desistiu',
      table: '7',
      status: OrderStatus.CANCELED,
      total: 0,
      serviceCharge: 0,
      operatorId: users.garcom.id,
      closedByOperatorId: users.admin.id,
      createdAt: new Date('2026-06-27T16:00:00'),
      finishedAt: new Date('2026-06-27T16:10:00'),
    },
  });

  const o4i1 = await prisma.orderItem.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      orderId: order4.id,
      productId: products.lasanha.id,
      code: products.lasanha.code,
      name: products.lasanha.name,
      quantity: 1,
      unitPrice: products.lasanha.price,
      total: products.lasanha.price,
      serviceCharge: 0,
      operatorId: users.garcom.id,
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      orderItemId: o4i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.CANCELED,
      quantityRequested: 1,
      quantityProduced: 0,
      pendingAt: new Date('2026-06-27T16:01:00'),
      observation: 'Pedido cancelado pelo cliente antes do preparo',
    },
  });

  // ─── ORDER 5: DINE_IN - OPEN, itens PENDING recém lançados ───────────────────
  const order5 = await prisma.order.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      type: OrderType.DINE_IN,
      locationId: locations.cozinha.code,
      customerName: 'Família Oliveira',
      table: '8',
      status: OrderStatus.OPEN,
      total: 0,
      serviceCharge: 0,
      operatorId: users.garcom.id,
      createdAt: new Date('2026-06-27T20:00:00'),
    },
  });

  await prisma.table.update({
    where: { id: tables.mesa8.id },
    data: {
      status: 'OCCUPIED',
      orderId: order5.id,
      customer: 'Família Oliveira',
    },
  });

  const o5i1 = await prisma.orderItem.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      orderId: order5.id,
      productId: products.feijoada.id,
      code: products.feijoada.code,
      name: products.feijoada.name,
      quantity: 2,
      unitPrice: products.feijoada.price,
      total: Number(products.feijoada.price) * 2,
      serviceCharge: 0,
      operatorId: users.garcom.id,
    },
  });

  const o5i2 = await prisma.orderItem.upsert({
    where: { id: 9 },
    update: {},
    create: {
      id: 9,
      orderId: order5.id,
      productId: products.refri.id,
      code: products.refri.code,
      name: products.refri.name,
      quantity: 4,
      unitPrice: products.refri.price,
      total: Number(products.refri.price) * 4,
      serviceCharge: 0,
      operatorId: users.garcom.id,
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      orderItemId: o5i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.PENDING,
      quantityRequested: 2,
      quantityProduced: 0,
      pendingAt: new Date('2026-06-27T20:01:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 9 },
    update: {},
    create: {
      id: 9,
      orderItemId: o5i2.id,
      productionLocation: locations.bar.code,
      status: ProductionStatus.PENDING,
      quantityRequested: 4,
      quantityProduced: 0,
      pendingAt: new Date('2026-06-27T20:01:00'),
    },
  });

  await prisma.order.update({
    where: { id: order5.id },
    data: {
      total:
        Number(products.feijoada.price) * 2 + Number(products.refri.price) * 4,
    },
  });

  // ─── ORDER 6: DINE_IN - CLOSED → Sale fiscal ERRO ────────────────────────────
  const order6 = await prisma.order.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      type: OrderType.DINE_IN,
      locationId: locations.cozinha.code,
      customerName: 'Marcos Freitas',
      table: '2',
      status: OrderStatus.CLOSED,
      total: 64.9,
      serviceCharge: 6.49,
      operatorId: users.garcom.id,
      closedByOperatorId: users.admin.id,
      createdAt: new Date('2026-06-27T15:00:00'),
      finishedAt: new Date('2026-06-27T16:30:00'),
    },
  });

  const o6i1 = await prisma.orderItem.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      orderId: order6.id,
      productId: products.lasanha.id,
      code: products.lasanha.code,
      name: products.lasanha.name,
      quantity: 1,
      unitPrice: products.lasanha.price,
      total: products.lasanha.price,
      serviceCharge: Number(products.lasanha.price) * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-27T15:50:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      orderItemId: o6i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 1,
      quantityProduced: 1,
      pendingAt: new Date('2026-06-27T15:01:00'),
      startedAt: new Date('2026-06-27T15:10:00'),
      completedAt: new Date('2026-06-27T15:48:00'),
      deliveredAt: new Date('2026-06-27T15:50:00'),
    },
  });

  const sale6 = await prisma.sale.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      clientId: clients.consumidorFinal.id,
      userOperator: users.admin.username,
      operatorId: users.admin.id,
      orderId: order6.id,
      date: new Date('2026-06-27T16:30:00'),
      totalProductsWithoutDiscount: 64.9,
      discount: 0,
      total: 71.39,
      profitSale: 39.9,
      isPaid: true,
      serviceCharge: 6.49,
      cfop: '5102',
      fiscalStatus: FiscalStatus.ERRO,
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale6.id, itemNumber: 1 } },
    update: {},
    create: {
      saleId: sale6.id,
      itemNumber: 1,
      productId: products.lasanha.id,
      quantity: 1,
      unitPrice: products.lasanha.price,
      totalPrice: products.lasanha.price,
      cfop: '5102',
      serviceCharge: Number(products.lasanha.price) * 0.1,
    },
  });

  await prisma.salePayment.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      saleId: sale6.id,
      method: 'DINHEIRO',
      amount: 80.0,
      change: 8.61,
    },
  });

  // ─── ORDER 7: DINE_IN - CLOSED → Sale CANCELADA ──────────────────────────────
  const order7 = await prisma.order.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      type: OrderType.DINE_IN,
      locationId: locations.cozinha.code,
      customerName: 'Julia Costa',
      table: '1',
      status: OrderStatus.CLOSED,
      total: 99.9,
      serviceCharge: 9.99,
      operatorId: users.garcom.id,
      closedByOperatorId: users.admin.id,
      createdAt: new Date('2026-06-26T19:00:00'),
      finishedAt: new Date('2026-06-26T21:00:00'),
    },
  });

  const o7i1 = await prisma.orderItem.upsert({
    where: { id: 11 },
    update: {},
    create: {
      id: 11,
      orderId: order7.id,
      productId: products.bobo.id,
      code: products.bobo.code,
      name: products.bobo.name,
      quantity: 1,
      unitPrice: products.bobo.price,
      total: products.bobo.price,
      serviceCharge: Number(products.bobo.price) * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-26T20:30:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 11 },
    update: {},
    create: {
      id: 11,
      orderItemId: o7i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 1,
      quantityProduced: 1,
      pendingAt: new Date('2026-06-26T19:05:00'),
      startedAt: new Date('2026-06-26T19:15:00'),
      completedAt: new Date('2026-06-26T20:28:00'),
      deliveredAt: new Date('2026-06-26T20:30:00'),
    },
  });

  const sale7 = await prisma.sale.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      clientId: clients.consumidorFinal.id,
      userOperator: users.admin.username,
      operatorId: users.admin.id,
      orderId: order7.id,
      date: new Date('2026-06-26T21:00:00'),
      totalProductsWithoutDiscount: 99.9,
      discount: 0,
      total: 109.89,
      profitSale: 57.9,
      isPaid: true,
      serviceCharge: 9.99,
      cfop: '5102',
      fiscalStatus: FiscalStatus.CANCELADA,
      fiscalKey: '29260666182168000173650010000000021000000025',
      fiscalProtocol: '129260000014322',
      fiscalEmitDate: new Date('2026-06-26T21:01:00'),
      fiscalXml:
        '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe>...</NFe></nfeProc>',
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale7.id, itemNumber: 1 } },
    update: {},
    create: {
      saleId: sale7.id,
      itemNumber: 1,
      productId: products.bobo.id,
      quantity: 1,
      unitPrice: products.bobo.price,
      totalPrice: products.bobo.price,
      cfop: '5102',
      serviceCharge: Number(products.bobo.price) * 0.1,
    },
  });

  await prisma.salePayment.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      saleId: sale7.id,
      method: 'DEBITO',
      amount: 109.89,
      change: 0,
    },
  });

  // ─── ORDER 8: DELIVERY - OPEN, em produção ────────────────────────────────────
  const order8 = await prisma.order.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      type: OrderType.DELIVERY,
      locationId: locations.cozinha.code,
      customerName: 'Fernando Lima',
      address: 'Av. Central, 450 - Bairro Novo',
      status: OrderStatus.OPEN,
      total: 0,
      serviceCharge: 0,
      operatorId: users.admin.id,
      createdAt: new Date('2026-06-27T20:15:00'),
    },
  });

  const o8i1 = await prisma.orderItem.upsert({
    where: { id: 12 },
    update: {},
    create: {
      id: 12,
      orderId: order8.id,
      productId: products.macarraoSugo.id,
      code: products.macarraoSugo.code,
      name: products.macarraoSugo.name,
      quantity: 1,
      unitPrice: products.macarraoSugo.price,
      total: products.macarraoSugo.price,
      serviceCharge: 0,
      operatorId: users.admin.id,
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 12 },
    update: {},
    create: {
      id: 12,
      orderItemId: o8i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.IN_PROGRESS,
      quantityRequested: 1,
      quantityProduced: 0,
      pendingAt: new Date('2026-06-27T20:16:00'),
      startedAt: new Date('2026-06-27T20:20:00'),
    },
  });

  await prisma.order.update({
    where: { id: order8.id },
    data: { total: Number(products.macarraoSugo.price) },
  });

  // ─── ORDER 9: DINE_IN - CLOSED → Sale EMITIDA, desconto + pagamento misto ────
  const order9 = await prisma.order.upsert({
    where: { id: 9 },
    update: {},
    create: {
      id: 9,
      type: OrderType.DINE_IN,
      locationId: locations.cozinha.code,
      customerName: 'Patricia Gomes',
      table: '5',
      status: OrderStatus.CLOSED,
      total: 389.5,
      serviceCharge: 38.95,
      operatorId: users.garcom.id,
      closedByOperatorId: users.admin.id,
      createdAt: new Date('2026-06-27T13:00:00'),
      finishedAt: new Date('2026-06-27T15:30:00'),
    },
  });

  const o9i1 = await prisma.orderItem.upsert({
    where: { id: 13 },
    update: {},
    create: {
      id: 13,
      orderId: order9.id,
      productId: products.picanha.id,
      code: products.picanha.code,
      name: products.picanha.name,
      quantity: 2,
      unitPrice: products.picanha.price,
      total: Number(products.picanha.price) * 2,
      serviceCharge: Number(products.picanha.price) * 2 * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-27T13:55:00'),
    },
  });

  const o9i2 = await prisma.orderItem.upsert({
    where: { id: 14 },
    update: {},
    create: {
      id: 14,
      orderId: order9.id,
      productId: products.vinho.id,
      code: products.vinho.code,
      name: products.vinho.name,
      quantity: 4,
      unitPrice: products.vinho.price,
      total: Number(products.vinho.price) * 4,
      serviceCharge: Number(products.vinho.price) * 4 * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-27T13:20:00'),
    },
  });

  const o9i3 = await prisma.orderItem.upsert({
    where: { id: 15 },
    update: {},
    create: {
      id: 15,
      orderId: order9.id,
      productId: products.acai.id,
      code: products.acai.code,
      name: products.acai.name,
      quantity: 2,
      unitPrice: products.acai.price,
      total: Number(products.acai.price) * 2,
      serviceCharge: Number(products.acai.price) * 2 * 0.1,
      operatorId: users.garcom.id,
      kitchenReadyAt: new Date('2026-06-27T14:50:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 13 },
    update: {},
    create: {
      id: 13,
      orderItemId: o9i1.id,
      productionLocation: locations.cozinha.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 2,
      quantityProduced: 2,
      pendingAt: new Date('2026-06-27T13:05:00'),
      startedAt: new Date('2026-06-27T13:10:00'),
      completedAt: new Date('2026-06-27T13:53:00'),
      deliveredAt: new Date('2026-06-27T13:55:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 14 },
    update: {},
    create: {
      id: 14,
      orderItemId: o9i2.id,
      productionLocation: locations.bar.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 4,
      quantityProduced: 4,
      pendingAt: new Date('2026-06-27T13:05:00'),
      startedAt: new Date('2026-06-27T13:08:00'),
      completedAt: new Date('2026-06-27T13:18:00'),
      deliveredAt: new Date('2026-06-27T13:20:00'),
    },
  });

  await prisma.orderProduction.upsert({
    where: { id: 15 },
    update: {},
    create: {
      id: 15,
      orderItemId: o9i3.id,
      productionLocation: locations.bar.code,
      status: ProductionStatus.COMPLETED,
      quantityRequested: 2,
      quantityProduced: 2,
      pendingAt: new Date('2026-06-27T14:30:00'),
      startedAt: new Date('2026-06-27T14:35:00'),
      completedAt: new Date('2026-06-27T14:48:00'),
      deliveredAt: new Date('2026-06-27T14:50:00'),
    },
  });

  // 2x picanha=259.8 + 4x vinho=100 + 2x acai=59.8 = 419.6, desconto 30 = 389.6, service 38.96
  const sale9 = await prisma.sale.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      clientId: clients.consumidorFinal.id,
      userOperator: users.admin.username,
      operatorId: users.admin.id,
      orderId: order9.id,
      date: new Date('2026-06-27T15:30:00'),
      totalProductsWithoutDiscount: 419.6,
      discount: 30.0,
      total: 428.51,
      profitSale: 160.0,
      isPaid: true,
      serviceCharge: 38.95,
      cfop: '5102',
      fiscalStatus: FiscalStatus.EMITIDA,
      fiscalKey: '29260666182168000173650010000000031000000036',
      fiscalProtocol: '129260000014323',
      fiscalEmitDate: new Date('2026-06-27T15:31:00'),
      fiscalXml:
        '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe>...</NFe></nfeProc>',
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale9.id, itemNumber: 1 } },
    update: {},
    create: {
      saleId: sale9.id,
      itemNumber: 1,
      productId: products.picanha.id,
      quantity: 2,
      unitPrice: products.picanha.price,
      totalPrice: Number(products.picanha.price) * 2,
      cfop: '5102',
      serviceCharge: Number(products.picanha.price) * 2 * 0.1,
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale9.id, itemNumber: 2 } },
    update: {},
    create: {
      saleId: sale9.id,
      itemNumber: 2,
      productId: products.vinho.id,
      quantity: 4,
      unitPrice: products.vinho.price,
      totalPrice: Number(products.vinho.price) * 4,
      cfop: '5102',
      serviceCharge: Number(products.vinho.price) * 4 * 0.1,
    },
  });

  await prisma.saleItem.upsert({
    where: { saleId_itemNumber: { saleId: sale9.id, itemNumber: 3 } },
    update: {},
    create: {
      saleId: sale9.id,
      itemNumber: 3,
      productId: products.acai.id,
      quantity: 2,
      unitPrice: products.acai.price,
      totalPrice: Number(products.acai.price) * 2,
      cfop: '5102',
      serviceCharge: Number(products.acai.price) * 2 * 0.1,
    },
  });

  await prisma.salePayment.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      saleId: sale9.id,
      method: 'CREDITO',
      amount: 250.0,
      change: 0,
    },
  });

  await prisma.salePayment.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      saleId: sale9.id,
      method: 'DINHEIRO',
      amount: 200.0,
      change: 21.49,
    },
  });

  console.log(
    '✓ Orders, OrderItems, OrderProductions, Sales, SaleItems, SalePayments seed',
  );
}
