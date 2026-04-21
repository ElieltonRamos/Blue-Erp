import { PrismaClient, ProductType, Unit } from 'generated/prisma/client';

export async function seedProducts(
  prisma: PrismaClient,
  categories: any,
  locations: any,
) {
  const defaults = {
    costPrice: 0.0,
    ncm: '00000000',
    origin: 0,
    csosn: '102',
    federalTaxRate: 0.0,
    stateTaxRate: 0.0,
    municipalTaxRate: 0.0,
    unit: 'UN' as Unit,
    quantity: 0,
    active: true,
    productionLocation: locations.churrascaria.code,
    productType: 'MANUFACTURED' as ProductType,
  };

  // ENTRADAS
  await prisma.product.upsert({
    where: { code: 'ENT001' },
    update: {},
    create: {
      ...defaults,
      name: 'Provolone Pachá',
      code: 'ENT001',
      price: 40.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT002' },
    update: {},
    create: {
      ...defaults,
      name: 'Panceta',
      code: 'ENT002',
      price: 35.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT003' },
    update: {},
    create: {
      ...defaults,
      name: 'Coxinha Dom Juan',
      code: 'ENT003',
      price: 38.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT004' },
    update: {},
    create: {
      ...defaults,
      name: 'Beef Tartare',
      code: 'ENT004',
      price: 55.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT005' },
    update: {},
    create: {
      ...defaults,
      name: 'Onion Rings',
      code: 'ENT005',
      price: 25.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT006' },
    update: {},
    create: {
      ...defaults,
      name: 'Fritas Flambadas com Cheddar e Bacon',
      code: 'ENT006',
      price: 45.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT007' },
    update: {},
    create: {
      ...defaults,
      name: 'Fritas',
      code: 'ENT007',
      price: 35.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT008' },
    update: {},
    create: {
      ...defaults,
      name: 'Carne de Sol',
      code: 'ENT008',
      price: 60.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT009' },
    update: {},
    create: {
      ...defaults,
      name: 'Queijo Coalho',
      code: 'ENT009',
      price: 32.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT010' },
    update: {},
    create: {
      ...defaults,
      name: 'Pão de Alho da Parrilla',
      code: 'ENT010',
      price: 20.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT011' },
    update: {},
    create: {
      ...defaults,
      name: 'Linguiça Provoleta',
      code: 'ENT011',
      price: 60.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT012' },
    update: {},
    create: {
      ...defaults,
      name: 'Gran Choripán',
      code: 'ENT012',
      price: 35.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT013' },
    update: {},
    create: {
      ...defaults,
      name: 'Bolinho de Cupim',
      code: 'ENT013',
      price: 36.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT014' },
    update: {},
    create: {
      ...defaults,
      name: 'Bolinho de Rabada',
      code: 'ENT014',
      price: 40.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT015' },
    update: {},
    create: {
      ...defaults,
      name: 'Mignon alla Vodka',
      code: 'ENT015',
      price: 70.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT016' },
    update: {},
    create: {
      ...defaults,
      name: 'Fish & Chips',
      code: 'ENT016',
      price: 60.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT017' },
    update: {},
    create: {
      ...defaults,
      name: 'Camarão Fuego',
      code: 'ENT017',
      price: 89.0,
      categoryId: categories.entradas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ENT018' },
    update: {},
    create: {
      ...defaults,
      name: 'Cordeiro de Sol',
      code: 'ENT018',
      price: 65.0,
      categoryId: categories.entradas.id,
    },
  });

  // SELEÇÃO DE CORTES
  await prisma.product.upsert({
    where: { code: 'COR001' },
    update: {},
    create: {
      ...defaults,
      name: 'Entrecôte (Ribeye)',
      code: 'COR001',
      price: 119.0,
      categoryId: categories.cortes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'COR002' },
    update: {},
    create: {
      ...defaults,
      name: 'Bife de Tira',
      code: 'COR002',
      price: 119.0,
      categoryId: categories.cortes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'COR003' },
    update: {},
    create: {
      ...defaults,
      name: 'Picanha Angus',
      code: 'COR003',
      price: 139.0,
      categoryId: categories.cortes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'COR004' },
    update: {},
    create: {
      ...defaults,
      name: 'Picanha Nelore',
      code: 'COR004',
      price: 110.0,
      categoryId: categories.cortes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'COR005' },
    update: {},
    create: {
      ...defaults,
      name: 'Maminha com Fonduta de Queijos',
      code: 'COR005',
      price: 109.0,
      categoryId: categories.cortes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'COR006' },
    update: {},
    create: {
      ...defaults,
      name: 'Baby Beef',
      code: 'COR006',
      price: 109.0,
      categoryId: categories.cortes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'COR007' },
    update: {},
    create: {
      ...defaults,
      name: 'Mignon ao Blue Cheese',
      code: 'COR007',
      price: 110.0,
      categoryId: categories.cortes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'COR008' },
    update: {},
    create: {
      ...defaults,
      name: 'Fraldinha Fugazzetta Black Angus',
      code: 'COR008',
      price: 109.0,
      categoryId: categories.cortes.id,
    },
  });

  // ESPECIAIS
  await prisma.product.upsert({
    where: { code: 'ESP001' },
    update: {},
    create: {
      ...defaults,
      name: 'Carré de Cordeiro',
      code: 'ESP001',
      price: 150.0,
      categoryId: categories.especiais.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ESP002' },
    update: {},
    create: {
      ...defaults,
      name: 'Pork Ribs',
      code: 'ESP002',
      price: 98.0,
      categoryId: categories.especiais.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ESP003' },
    update: {},
    create: {
      ...defaults,
      name: 'Entrecôte Suíno',
      code: 'ESP003',
      price: 75.0,
      categoryId: categories.especiais.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'ESP004' },
    update: {},
    create: {
      ...defaults,
      name: 'Filé de Sobrecoxa',
      code: 'ESP004',
      price: 70.0,
      categoryId: categories.especiais.id,
    },
  });

  // PASTA & BRASA
  await prisma.product.upsert({
    where: { code: 'PAS001' },
    update: {},
    create: {
      ...defaults,
      name: 'Filé alla Parmigiana - Frango',
      code: 'PAS001',
      price: 120.0,
      categoryId: categories.pasta.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'PAS002' },
    update: {},
    create: {
      ...defaults,
      name: 'Filé alla Parmigiana - Mignon',
      code: 'PAS002',
      price: 150.0,
      categoryId: categories.pasta.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'PAS003' },
    update: {},
    create: {
      ...defaults,
      name: 'Filé alla Parmigiana - Camarão',
      code: 'PAS003',
      price: 170.0,
      categoryId: categories.pasta.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'PAS004' },
    update: {},
    create: {
      ...defaults,
      name: 'Camarão do Lago',
      code: 'PAS004',
      price: 170.0,
      categoryId: categories.pasta.id,
    },
  });

  // GUARNIÇÕES
  await prisma.product.upsert({
    where: { code: 'GUA001' },
    update: {},
    create: {
      ...defaults,
      name: 'Arroz Texano / Arroz de Cupim',
      code: 'GUA001',
      price: 40.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA002' },
    update: {},
    create: {
      ...defaults,
      name: 'Purê de Mandioca',
      code: 'GUA002',
      price: 15.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA003' },
    update: {},
    create: {
      ...defaults,
      name: 'Mandioca Cremosa',
      code: 'GUA003',
      price: 10.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA004' },
    update: {},
    create: {
      ...defaults,
      name: 'Farofa de Ovos',
      code: 'GUA004',
      price: 15.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA005' },
    update: {},
    create: {
      ...defaults,
      name: 'Farofa Crocante da Chef',
      code: 'GUA005',
      price: 10.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA006' },
    update: {},
    create: {
      ...defaults,
      name: 'Vinagrete Dom Juan',
      code: 'GUA006',
      price: 10.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA007' },
    update: {},
    create: {
      ...defaults,
      name: 'Vinagrete de Milho',
      code: 'GUA007',
      price: 10.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA008' },
    update: {},
    create: {
      ...defaults,
      name: 'Arroz Branco',
      code: 'GUA008',
      price: 10.0,
      categoryId: categories.guarnicoes.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'GUA009' },
    update: {},
    create: {
      ...defaults,
      name: 'Creme de Milho',
      code: 'GUA009',
      price: 15.0,
      categoryId: categories.guarnicoes.id,
    },
  });

  // SANDWICHES & FRIES
  await prisma.product.upsert({
    where: { code: 'SAN001' },
    update: {},
    create: {
      ...defaults,
      name: 'Sandwich Mignon',
      code: 'SAN001',
      price: 35.0,
      categoryId: categories.sandwiches.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'SAN002' },
    update: {},
    create: {
      ...defaults,
      name: 'Burger Dom Juan',
      code: 'SAN002',
      price: 35.0,
      categoryId: categories.sandwiches.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'SAN003' },
    update: {},
    create: {
      ...defaults,
      name: 'Crispy Chicken',
      code: 'SAN003',
      price: 32.0,
      categoryId: categories.sandwiches.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'SAN004' },
    update: {},
    create: {
      ...defaults,
      name: 'Brisket Sandwich',
      code: 'SAN004',
      price: 32.0,
      categoryId: categories.sandwiches.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'SAN005' },
    update: {},
    create: {
      ...defaults,
      name: 'Cupim Sandwich',
      code: 'SAN005',
      price: 34.0,
      categoryId: categories.sandwiches.id,
    },
  });

  console.log('✓ Products seed');
}
