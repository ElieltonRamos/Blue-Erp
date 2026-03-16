import { PrismaClient } from 'generated/prisma/client';

export async function seedProducts(
  prisma: PrismaClient,
  categories: any,
  materials: any,
  locations: any,
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

  // Produtos manufaturados - Churrascaria
  const picanha = await prisma.product.upsert({
    where: { code: 'PROD003' },
    update: {},
    create: {
      name: 'Picanha na Brasa',
      code: 'PROD003',
      productionLocation: locations.churrascaria.code,
      price: 45.0,
      costPrice: 22.0,
      extraCosts: 3.0,
      ncm: '02071400',
      origin: 0,
      csosn: '102',
      federalTaxRate: 4.68,
      stateTaxRate: 12.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 0,
      active: true,
      productType: 'MANUFACTURED',
      categoryId: categories.pratos.id,
    },
  });

  const costela = await prisma.product.upsert({
    where: { code: 'PROD004' },
    update: {},
    create: {
      name: 'Costela Assada',
      code: 'PROD004',
      productionLocation: locations.churrascaria.code,
      price: 38.0,
      costPrice: 18.5,
      extraCosts: 2.5,
      ncm: '02071400',
      origin: 0,
      csosn: '102',
      federalTaxRate: 4.68,
      stateTaxRate: 12.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 0,
      active: true,
      productType: 'MANUFACTURED',
      categoryId: categories.pratos.id,
    },
  });

  // Produtos manufaturados - Japonesa
  const sushiSalmao = await prisma.product.upsert({
    where: { code: 'PROD005' },
    update: {},
    create: {
      name: 'Sushi de Salmão (8 unidades)',
      code: 'PROD005',
      productionLocation: locations.japonesa.code,
      price: 32.0,
      costPrice: 14.0,
      extraCosts: 2.0,
      ncm: '16041900',
      origin: 0,
      csosn: '102',
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 0,
      active: true,
      productType: 'MANUFACTURED',
      categoryId: categories.pratos.id,
    },
  });

  const temaki = await prisma.product.upsert({
    where: { code: 'PROD006' },
    update: {},
    create: {
      name: 'Temaki de Atum',
      code: 'PROD006',
      productionLocation: locations.japonesa.code,
      price: 18.0,
      costPrice: 8.5,
      extraCosts: 1.5,
      ncm: '16041900',
      origin: 0,
      csosn: '102',
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      unit: 'UN',
      quantity: 0,
      active: true,
      productType: 'MANUFACTURED',
      categoryId: categories.pratos.id,
    },
  });

  // Composições dos produtos manufaturados
  await prisma.compositionItem.createMany({
    data: [
      // Picanha
      {
        productId: picanha.id,
        materialId: materials.frango.id,
        quantity: 0.3,
      },

      // Costela
      {
        productId: costela.id,
        materialId: materials.frango.id,
        quantity: 0.4,
      },

      // Sushi
      {
        productId: sushiSalmao.id,
        materialId: materials.farinhaPao.id,
        quantity: 0.15,
      },

      // Temaki
      {
        productId: temaki.id,
        materialId: materials.farinhaPao.id,
        quantity: 0.1,
      },
    ],
    skipDuplicates: true,
  });

  // Passos de preparação
  await prisma.preparationStep.createMany({
    data: [
      // Picanha
      {
        productId: picanha.id,
        order: 1,
        description: 'Temperar a picanha com sal grosso',
      },
      {
        productId: picanha.id,
        order: 2,
        description: 'Grelhar na brasa por 15 minutos cada lado',
      },
      {
        productId: picanha.id,
        order: 3,
        description: 'Deixar descansar por 5 minutos',
      },
      {
        productId: picanha.id,
        order: 4,
        description: 'Fatiar e servir',
      },

      // Costela
      {
        productId: costela.id,
        order: 1,
        description: 'Temperar com sal e especiarias',
      },
      {
        productId: costela.id,
        order: 2,
        description: 'Assar lentamente por 2 horas',
      },
      {
        productId: costela.id,
        order: 3,
        description: 'Grelhar para finalizar',
      },

      // Sushi
      {
        productId: sushiSalmao.id,
        order: 1,
        description: 'Preparar arroz japonês temperado',
      },
      {
        productId: sushiSalmao.id,
        order: 2,
        description: 'Fatiar salmão fresco',
      },
      {
        productId: sushiSalmao.id,
        order: 3,
        description: 'Montar os sushis',
      },
      {
        productId: sushiSalmao.id,
        order: 4,
        description: 'Servir com shoyu e wasabi',
      },

      // Temaki
      {
        productId: temaki.id,
        order: 1,
        description: 'Preparar nori e arroz',
      },
      {
        productId: temaki.id,
        order: 2,
        description: 'Adicionar atum e ingredientes',
      },
      {
        productId: temaki.id,
        order: 3,
        description: 'Enrolar em formato de cone',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Products seed');
  return { cocaCola, aguaMineral, picanha, costela, sushiSalmao, temaki };
}
