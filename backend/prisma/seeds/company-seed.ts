import { PrismaClient } from 'generated/prisma/client';

export async function seedCompany(prisma: PrismaClient) {
  await prisma.company.upsert({
    where: { cnpj: '66182168000173' },
    update: {},
    create: {
      cnpj: '66182168000173',
      corporateName: 'CASA DO LAGO EVENTOS E ENTRETERIMENTO LTDA',
      tradeName: 'CASA DO LAGO EVENTOS',
      stateRegistration: '123456789',
      taxRegime: '1',
      street: 'R URBINO PEREIRA DONATO',
      number: '878',
      complement: 'Loja 1',
      neighborhood: 'SAO FRANCISCO',
      city: 'GUANAMBI',
      cityCode: '2911709',
      state: 'BA',
      zipCode: '46430000',
      phone: '77988860656',
      email: 'LUCIANAGBI@YAHOO.COM.BR',
      nfceSeries: '1',
      nfceCurrentNumber: 1,
      nfceEnvironment: 'staging',
      nfceCsc: 'HOMOLOGACAO-CSC-EXEMPLO',
      nfceCscId: '1',
      certificatePath: '/certificates/bomsabor.pfx',
      certificatePassword: 'certificado123',
      certificateExpirationDate: new Date('2026-12-31'),
      ibptVersion: '4.0',
      licenseKey:
        'b6a63bc12098bbc81b16e5cc4c8e5dcb8d7506aa8b9a57cc56d72f4d677f13ef',
      licenseToken: 'TOKEN-XYZ-123',
    },
  });

  console.log('✓ Company seed');
}
