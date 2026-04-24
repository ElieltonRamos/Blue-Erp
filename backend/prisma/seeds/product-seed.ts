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
    productionLocation: locations.domJuan.code,
    productType: 'MANUFACTURED' as ProductType,
  };

  const defaultsBar = {
    ...defaults,
    productionLocation: locations.bar.code,
    productType: 'RESALE' as ProductType,
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
      name: 'Fritas (Vegetariano)',
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
      price: 21.0,
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
      price: 58.0,
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
      price: 110.0,
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
      price: 105.0,
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

  // DRINKS COM GIN
  await prisma.product.upsert({
    where: { code: 'DRG001' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Pink Gin',
      code: 'DRG001',
      price: 32.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG002' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Gin Melancia',
      code: 'DRG002',
      price: 32.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG003' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Gin Tropical',
      code: 'DRG003',
      price: 32.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG004' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Martini',
      code: 'DRG004',
      price: 32.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG005' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Mojito',
      code: 'DRG005',
      price: 35.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG006' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Daiquiri',
      code: 'DRG006',
      price: 35.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG007' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Piña Colada',
      code: 'DRG007',
      price: 36.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG008' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Negroni',
      code: 'DRG008',
      price: 38.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG009' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Moscow Mule',
      code: 'DRG009',
      price: 36.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG010' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Caipiroska',
      code: 'DRG010',
      price: 25.0,
      categoryId: categories.drinksGin.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DRG011' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Caipirinha',
      code: 'DRG011',
      price: 18.0,
      categoryId: categories.drinksGin.id,
    },
  });

  // DRINKS SEM ÁLCOOL
  await prisma.product.upsert({
    where: { code: 'DSA001' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Soda Italiana – Maçã Verde',
      code: 'DSA001',
      price: 17.0,
      categoryId: categories.drinksSemAlcool.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DSA002' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Soda Italiana – Tropical',
      code: 'DSA002',
      price: 38.0,
      categoryId: categories.drinksSemAlcool.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'DSA003' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Soda Italiana – Amora',
      code: 'DSA003',
      price: 0.0,
      categoryId: categories.drinksSemAlcool.id,
    },
  });

  // SUCOS DA FRUTA
  await prisma.product.upsert({
    where: { code: 'SUC001' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Suco de Abacaxi',
      code: 'SUC001',
      price: 12.0,
      categoryId: categories.sucos.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'SUC002' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Suco de Laranja',
      code: 'SUC002',
      price: 12.0,
      categoryId: categories.sucos.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'SUC003' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Suco de Morango',
      code: 'SUC003',
      price: 14.0,
      categoryId: categories.sucos.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'SUC004' },
    update: {},
    create: {
      ...defaults,
      productionLocation: locations.bar.code,
      name: 'Suco de Graviola',
      code: 'SUC004',
      price: 14.0,
      categoryId: categories.sucos.id,
    },
  });

  // BEBIDAS
  await prisma.product.upsert({
    where: { code: 'BEB001' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Coca-Cola Zero',
      code: 'BEB001',
      price: 6.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB002' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Coca-Cola',
      code: 'BEB002',
      price: 6.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB003' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Guaraná Zero',
      code: 'BEB003',
      price: 6.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB004' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Fanta Laranja',
      code: 'BEB004',
      price: 6.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB005' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Red Bull Tradicional',
      code: 'BEB005',
      price: 15.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB006' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Red Bull Sem Açúcar',
      code: 'BEB006',
      price: 15.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB007' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Red Bull Tropical',
      code: 'BEB007',
      price: 15.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB008' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Red Bull Melancia',
      code: 'BEB008',
      price: 15.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB009' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Água Tônica',
      code: 'BEB009',
      price: 7.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB010' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Água Mineral',
      code: 'BEB010',
      price: 6.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB011' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Água com Gás',
      code: 'BEB011',
      price: 7.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB012' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Heineken Longneck',
      code: 'BEB012',
      price: 12.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB013' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Heineken 600ml',
      code: 'BEB013',
      price: 20.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB014' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Heineken Zero',
      code: 'BEB014',
      price: 14.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB015' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Praya',
      code: 'BEB015',
      price: 14.0,
      categoryId: categories.bebidas.id,
    },
  });
  await prisma.product.upsert({
    where: { code: 'BEB016' },
    update: {},
    create: {
      ...defaultsBar,
      name: 'Amstel 600ml',
      code: 'BEB016',
      price: 14.0,
      categoryId: categories.bebidas.id,
    },
  });

  console.log('✓ Products seed');
}
