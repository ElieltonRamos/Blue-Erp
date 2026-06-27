import { PrismaClient } from 'generated/prisma/client';

export async function seedCompany(prisma: PrismaClient) {
  await prisma.company.upsert({
    where: { cnpj: '22222222000122' },
    update: {},
    create: {
      cnpj: '22222222000122',
      corporateName: 'BLUE ERP TESTE LTDA',
      tradeName: 'BLUE ERP TESTE',
      stateRegistration: '987654321',
      taxRegime: '1',
      street: 'AVENIDA PAULISTA',
      number: '1000',
      complement: 'Bloco A',
      neighborhood: 'BELA VISTA',
      city: 'SAO PAULO',
      cityCode: '3550308',
      state: 'SP',
      zipCode: '01310100',
      phone: '11999998888',
      email: 'HOMOLOG@BLUEERPTESTE.COM.BR',
      nfceSeries: '1',
      nfceCurrentNumber: 1,
      nfceEnvironment: 'staging',
      nfceCsc: 'HOMOLOGACAO-CSC-EXEMPLO',
      nfceCscId: '1',
      certificatePath: '/certificates/blue_erp_teste.pfx',
      certificatePassword: 'certificado123',
      certificateExpirationDate: new Date('2027-12-31'),
      ibptVersion: '4.0',
      licenseKey: 'COMPLETO-22222222000122-a7c3e14d8b224a21',
      licenseToken: 'TOKEN-HOMOLOG-BLUE-456',
    },
  });

  console.log('✓ Company seed (Homologação)');
}
