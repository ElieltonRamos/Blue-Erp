import { PrismaClient, ProductType, Unit } from 'generated/prisma/client';

export async function seedProducts(
  prisma: PrismaClient,
  categories: any,
  locations: any,
) {
  // ─── MANUFACTURED (5) — produzidos do zero na cozinha ───────────────────────
  // Picanha na Brasa
  const picanha = await prisma.product.upsert({
    where: { code: 'PRD001' },
    update: {},
    create: {
      code: 'PRD001',
      name: 'Picanha na Brasa',
      price: 129.9,
      costPrice: 55.0,
      extraCosts: 5.0,
      ncm: '02013000',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.MANUFACTURED,
      productionLocation: locations.cozinha.code,
      categoryId: categories.carnes.id,
      federalTaxRate: 4.68,
      stateTaxRate: 12.0,
      municipalTaxRate: 0.0,
    },
  });

  // Frango ao Molho Pardo
  const frangoPardo = await prisma.product.upsert({
    where: { code: 'PRD002' },
    update: {},
    create: {
      code: 'PRD002',
      name: 'Frango ao Molho Pardo',
      price: 59.9,
      costPrice: 20.0,
      extraCosts: 3.0,
      ncm: '02071400',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.MANUFACTURED,
      productionLocation: locations.cozinha.code,
      categoryId: categories.carnes.id,
      federalTaxRate: 4.68,
      stateTaxRate: 12.0,
      municipalTaxRate: 0.0,
    },
  });

  // Moqueca de Camarão
  const moquecaCamarao = await prisma.product.upsert({
    where: { code: 'PRD003' },
    update: {},
    create: {
      code: 'PRD003',
      name: 'Moqueca de Camarão',
      price: 149.9,
      costPrice: 65.0,
      extraCosts: 6.0,
      ncm: '16052100',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.MANUFACTURED,
      productionLocation: locations.cozinha.code,
      categoryId: categories.frutosDoMar.id,
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  // Pudim de Leite Condensado
  const pudim = await prisma.product.upsert({
    where: { code: 'PRD004' },
    update: {},
    create: {
      code: 'PRD004',
      name: 'Pudim de Leite Condensado',
      price: 22.9,
      costPrice: 6.0,
      extraCosts: 1.0,
      ncm: '21069090',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.MANUFACTURED,
      productionLocation: locations.bar.code,
      categoryId: categories.sobremesas.id,
      federalTaxRate: 13.45,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  // Caipirinha de Limão
  const caipirinha = await prisma.product.upsert({
    where: { code: 'PRD005' },
    update: {},
    create: {
      code: 'PRD005',
      name: 'Caipirinha de Limão',
      price: 18.9,
      costPrice: 4.5,
      extraCosts: 0.5,
      ncm: '22082000',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.MANUFACTURED,
      productionLocation: locations.bar.code,
      categoryId: categories.bebidas.id,
      federalTaxRate: 33.89,
      stateTaxRate: 25.0,
      municipalTaxRate: 0.0,
    },
  });

  // ─── RESALE (5) — comprados prontos e revendidos ─────────────────────────────
  // Água Mineral 500ml
  const agua = await prisma.product.upsert({
    where: { code: 'PRD006' },
    update: {},
    create: {
      code: 'PRD006',
      name: 'Água Mineral 500ml',
      price: 5.0,
      costPrice: 1.5,
      extraCosts: 0.0,
      ncm: '22011000',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 50,
      minStock: 20,
      active: true,
      productType: ProductType.RESALE,
      productionLocation: locations.bar.code,
      categoryId: categories.bebidas.id,
      federalTaxRate: 13.45,
      stateTaxRate: 12.0,
      municipalTaxRate: 0.0,
    },
  });

  // Refrigerante Lata 350ml
  const refri = await prisma.product.upsert({
    where: { code: 'PRD007' },
    update: {},
    create: {
      code: 'PRD007',
      name: 'Refrigerante Lata 350ml',
      price: 7.0,
      costPrice: 2.5,
      extraCosts: 0.0,
      ncm: '22021000',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 80,
      minStock: 30,
      active: true,
      productType: ProductType.RESALE,
      productionLocation: locations.bar.code,
      categoryId: categories.bebidas.id,
      federalTaxRate: 33.89,
      stateTaxRate: 25.0,
      municipalTaxRate: 0.0,
    },
  });

  // Cerveja Longneck 355ml
  const cerveja = await prisma.product.upsert({
    where: { code: 'PRD008' },
    update: {},
    create: {
      code: 'PRD008',
      name: 'Cerveja Longneck 355ml',
      price: 12.0,
      costPrice: 4.5,
      extraCosts: 0.0,
      ncm: '22030000',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 120,
      minStock: 40,
      active: true,
      productType: ProductType.RESALE,
      productionLocation: locations.bar.code,
      categoryId: categories.bebidas.id,
      federalTaxRate: 33.89,
      stateTaxRate: 25.0,
      municipalTaxRate: 0.0,
    },
  });

  // Brigadeiro (unitário, comprado de confeitaria)
  const brigadeiro = await prisma.product.upsert({
    where: { code: 'PRD009' },
    update: {},
    create: {
      code: 'PRD009',
      name: 'Brigadeiro Gourmet',
      price: 8.0,
      costPrice: 3.0,
      extraCosts: 0.0,
      ncm: '18069000',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 30,
      minStock: 10,
      active: true,
      productType: ProductType.RESALE,
      productionLocation: locations.bar.code,
      categoryId: categories.sobremesas.id,
      federalTaxRate: 13.45,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  // Vinho Tinto Taça
  const vinho = await prisma.product.upsert({
    where: { code: 'PRD010' },
    update: {},
    create: {
      code: 'PRD010',
      name: 'Vinho Tinto Taça',
      price: 25.0,
      costPrice: 10.0,
      extraCosts: 0.0,
      ncm: '22042100',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 40,
      minStock: 15,
      active: true,
      productType: ProductType.RESALE,
      productionLocation: locations.bar.code,
      categoryId: categories.bebidas.id,
      federalTaxRate: 33.89,
      stateTaxRate: 25.0,
      municipalTaxRate: 0.0,
    },
  });

  // ─── SEMI_MANUFACTURED (5) — parcialmente processados ───────────────────────
  // Feijoada Completa (base pré-cozida, finalizada na hora)
  const feijoada = await prisma.product.upsert({
    where: { code: 'PRD011' },
    update: {},
    create: {
      code: 'PRD011',
      name: 'Feijoada Completa',
      price: 79.9,
      costPrice: 28.0,
      extraCosts: 4.0,
      ncm: '21069090',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.SEMI_MANUFACTURED,
      productionLocation: locations.cozinha.code,
      categoryId: categories.carnes.id,
      federalTaxRate: 13.45,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  // Macarrão ao Sugo (molho base pré-pronto, massa fresca na hora)
  const macarraoSugo = await prisma.product.upsert({
    where: { code: 'PRD012' },
    update: {},
    create: {
      code: 'PRD012',
      name: 'Macarrão ao Sugo',
      price: 49.9,
      costPrice: 15.0,
      extraCosts: 2.0,
      ncm: '19021900',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.SEMI_MANUFACTURED,
      productionLocation: locations.cozinha.code,
      categoryId: categories.massas.id,
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  // Lasanha Bolonhesa (montada congelada, gratinada na hora)
  const lasanha = await prisma.product.upsert({
    where: { code: 'PRD013' },
    update: {},
    create: {
      code: 'PRD013',
      name: 'Lasanha Bolonhesa',
      price: 64.9,
      costPrice: 22.0,
      extraCosts: 3.0,
      ncm: '19021900',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.SEMI_MANUFACTURED,
      productionLocation: locations.cozinha.code,
      categoryId: categories.massas.id,
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  // Bobó de Camarão (base de mandioca pré-pronta, camarão finalizado na hora)
  const bobo = await prisma.product.upsert({
    where: { code: 'PRD014' },
    update: {},
    create: {
      code: 'PRD014',
      name: 'Bobó de Camarão',
      price: 99.9,
      costPrice: 38.0,
      extraCosts: 4.0,
      ncm: '16052100',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.SEMI_MANUFACTURED,
      productionLocation: locations.cozinha.code,
      categoryId: categories.frutosDoMar.id,
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  // Açaí na Tigela (polpa pré-batida, montagem na hora)
  const acai = await prisma.product.upsert({
    where: { code: 'PRD015' },
    update: {},
    create: {
      code: 'PRD015',
      name: 'Açaí na Tigela',
      price: 29.9,
      costPrice: 10.0,
      extraCosts: 1.5,
      ncm: '20089900',
      origin: 0,
      csosn: '102',
      unit: Unit.UN,
      quantity: 0,
      active: true,
      productType: ProductType.SEMI_MANUFACTURED,
      productionLocation: locations.bar.code,
      categoryId: categories.sobremesas.id,
      federalTaxRate: 13.45,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
    },
  });

  console.log('✓ Products seed');
  return {
    // MANUFACTURED
    picanha,
    frangoPardo,
    moquecaCamarao,
    pudim,
    caipirinha,
    // RESALE
    agua,
    refri,
    cerveja,
    brigadeiro,
    vinho,
    // SEMI_MANUFACTURED
    feijoada,
    macarraoSugo,
    lasanha,
    bobo,
    acai,
  };
}
