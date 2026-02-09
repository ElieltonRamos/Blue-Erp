import { PrismaClient } from 'generated/prisma/client';

export async function seedProducts(
  prisma: PrismaClient,
  categories: any,
  materials: any,
) {
  // Produtos de revenda (bebidas)
  const cocaCola = await prisma.product.upsert({
    where: { code: 'PROD001' },
    update: {},
    create: {
      name: 'Coca-Cola 350ml',
      code: 'PROD001',
      price: 6.0,
      costPrice: 3.5,
      ncm: '22021000',
      origin: 0,
      csosn: '102',
      federalTaxRate: 33.89,
      stateTaxRate: 25.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 48,
      minStock: 24,
      active: true,
      productType: 'RESALE',
      categoryId: categories.bebidas.id,
    },
  });

  const aguaMineral = await prisma.product.upsert({
    where: { code: 'PROD002' },
    update: {},
    create: {
      name: 'Água Mineral 500ml',
      code: 'PROD002',
      price: 3.5,
      costPrice: 1.8,
      ncm: '22011000',
      origin: 0,
      csosn: '102',
      federalTaxRate: 18.45,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 60,
      minStock: 36,
      active: true,
      productType: 'RESALE',
      categoryId: categories.bebidas.id,
    },
  });

  // Produtos manufaturados
  const hamburger = await prisma.product.upsert({
    where: { code: 'PROD003' },
    update: {},
    create: {
      name: 'Hambúrguer Artesanal',
      code: 'PROD003',
      productionLocation: 'LOCAL_01',
      price: 28.0,
      costPrice: 12.5,
      extraCosts: 2.0,
      ncm: '19059090',
      origin: 0,
      csosn: '102',
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 0,
      active: true,
      productType: 'MANUFACTURED',
      categoryId: categories.lanches.id,
    },
  });

  const frangoCatupiry = await prisma.product.upsert({
    where: { code: 'PROD004' },
    update: {},
    create: {
      name: 'Sanduíche de Frango com Catupiry',
      code: 'PROD004',
      productionLocation: 'LOCAL_01',
      price: 22.0,
      costPrice: 9.8,
      extraCosts: 1.5,
      ncm: '19059090',
      origin: 0,
      csosn: '102',
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 0,
      active: true,
      productType: 'MANUFACTURED',
      categoryId: categories.lanches.id,
    },
  });

  const pudim = await prisma.product.upsert({
    where: { code: 'PROD005' },
    update: {},
    create: {
      name: 'Pudim de Leite',
      code: 'PROD005',
      productionLocation: 'LOCAL_01',
      price: 12.0,
      costPrice: 4.5,
      extraCosts: 0.5,
      ncm: '21069090',
      origin: 0,
      csosn: '102',
      federalTaxRate: 13.45,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 0,
      active: true,
      productType: 'MANUFACTURED',
      categoryId: categories.sobremesas.id,
    },
  });

  // Composições dos produtos manufaturados
  await prisma.compositionItem.createMany({
    data: [
      // Hambúrguer
      {
        productId: hamburger.id,
        materialId: materials.farinhaPao.id,
        quantity: 0.1,
      }, // 100g pão
      {
        productId: hamburger.id,
        materialId: materials.queijo.id,
        quantity: 0.05,
      }, // 50g queijo
      {
        productId: hamburger.id,
        materialId: materials.frango.id,
        quantity: 0.15,
      }, // 150g frango

      // Frango com Catupiry
      {
        productId: frangoCatupiry.id,
        materialId: materials.farinhaPao.id,
        quantity: 0.08,
      },
      {
        productId: frangoCatupiry.id,
        materialId: materials.queijo.id,
        quantity: 0.06,
      },
      {
        productId: frangoCatupiry.id,
        materialId: materials.frango.id,
        quantity: 0.12,
      },

      // Pudim
      { productId: pudim.id, materialId: materials.leite.id, quantity: 0.25 }, // 250ml
      { productId: pudim.id, materialId: materials.acucar.id, quantity: 0.1 }, // 100g
    ],
    skipDuplicates: true,
  });

  // Passos de preparação
  await prisma.preparationStep.createMany({
    data: [
      // Hambúrguer
      {
        productId: hamburger.id,
        order: 1,
        description: 'Grelhar o pão até dourar',
      },
      {
        productId: hamburger.id,
        order: 2,
        description: 'Grelhar o frango temperado',
      },
      {
        productId: hamburger.id,
        order: 3,
        description: 'Adicionar queijo e deixar derreter',
      },
      {
        productId: hamburger.id,
        order: 4,
        description: 'Montar o hambúrguer com alface e tomate',
      },

      // Frango com Catupiry
      {
        productId: frangoCatupiry.id,
        order: 1,
        description: 'Desfiar o frango cozido',
      },
      {
        productId: frangoCatupiry.id,
        order: 2,
        description: 'Misturar com catupiry',
      },
      { productId: frangoCatupiry.id, order: 3, description: 'Aquecer o pão' },
      {
        productId: frangoCatupiry.id,
        order: 4,
        description: 'Rechear e servir',
      },

      // Pudim
      {
        productId: pudim.id,
        order: 1,
        description: 'Fazer calda com açúcar caramelizado',
      },
      {
        productId: pudim.id,
        order: 2,
        description: 'Bater leite condensado, leite e ovos',
      },
      {
        productId: pudim.id,
        order: 3,
        description: 'Assar em banho-maria por 50min a 180°C',
      },
      { productId: pudim.id, order: 4, description: 'Resfriar e desenformar' },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Products seed');
  return { cocaCola, aguaMineral, hamburger, frangoCatupiry, pudim };
}
