import { PrismaClient } from 'generated/prisma/client';

export async function seedIbpt(prisma: PrismaClient) {
  const ibptData = [
    {
      ncm: '21069090',
      federalTaxRate: 13.45,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      version: '4.0',
    },
    {
      ncm: '19059090',
      federalTaxRate: 10.73,
      stateTaxRate: 18.0,
      municipalTaxRate: 0.0,
      version: '4.0',
    },
    {
      ncm: '22021000',
      federalTaxRate: 33.89,
      stateTaxRate: 25.0,
      municipalTaxRate: 0.0,
      version: '4.0',
    },
    {
      ncm: '02071400',
      federalTaxRate: 4.68,
      stateTaxRate: 12.0,
      municipalTaxRate: 0.0,
      version: '4.0',
    },
    {
      ncm: '04012010',
      federalTaxRate: 18.45,
      stateTaxRate: 12.0,
      municipalTaxRate: 0.0,
      version: '4.0',
    },
  ];

  for (const data of ibptData) {
    await prisma.ibpt.upsert({
      where: { id: ibptData.indexOf(data) + 1 },
      update: {},
      create: data,
    });
  }

  console.log('✓ IBPT seed');
}
