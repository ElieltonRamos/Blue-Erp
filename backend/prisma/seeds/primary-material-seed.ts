import { PrismaClient } from 'generated/prisma/client';

export async function seedPrimaryMaterials(prisma: PrismaClient) {
  const farinhaPao = await prisma.primaryMaterial.upsert({
    where: { code: 'MAT001' },
    update: {},
    create: {
      name: 'Farinha de Trigo',
      code: 'MAT001',
      unit: 'KG',
      unitCost: 4.5,
      currentStock: 25.0,
      minStock: 10.0,
      active: true,
      ncm: '11010010',
      cfop: '5102',
    },
  });

  const queijo = await prisma.primaryMaterial.upsert({
    where: { code: 'MAT002' },
    update: {},
    create: {
      name: 'Queijo Muçarela',
      code: 'MAT002',
      unit: 'KG',
      unitCost: 35.0,
      currentStock: 8.5,
      minStock: 5.0,
      active: true,
      ncm: '04061000',
      cfop: '5102',
      expiryDate: new Date('2026-03-15'),
    },
  });

  const frango = await prisma.primaryMaterial.upsert({
    where: { code: 'MAT003' },
    update: {},
    create: {
      name: 'Peito de Frango',
      code: 'MAT003',
      unit: 'KG',
      unitCost: 18.0,
      currentStock: 12.0,
      minStock: 8.0,
      active: true,
      ncm: '02071400',
      cfop: '5102',
      expiryDate: new Date('2026-02-20'),
    },
  });

  const leite = await prisma.primaryMaterial.upsert({
    where: { code: 'MAT004' },
    update: {},
    create: {
      name: 'Leite Integral',
      code: 'MAT004',
      unit: 'LT',
      unitCost: 5.2,
      currentStock: 15.0,
      minStock: 10.0,
      active: true,
      ncm: '04012010',
      cfop: '5102',
      expiryDate: new Date('2026-02-15'),
    },
  });

  const acucar = await prisma.primaryMaterial.upsert({
    where: { code: 'MAT005' },
    update: {},
    create: {
      name: 'Açúcar Cristal',
      code: 'MAT005',
      unit: 'KG',
      unitCost: 3.8,
      currentStock: 20.0,
      minStock: 8.0,
      active: true,
      ncm: '17011100',
      cfop: '5102',
    },
  });

  console.log('✓ Primary Materials seed');
  return { farinhaPao, queijo, frango, leite, acucar };
}
