import { PrismaClient } from 'generated/prisma/client';

export async function seedCompany(prisma: PrismaClient) {
  await prisma.company.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      cnpj: '12345678000190',
      corporateName: 'Restaurante Bom Sabor LTDA',
      tradeName: 'Bom Sabor',
      stateRegistration: '123456789',
      taxRegime: '1',
      street: 'Rua das Flores',
      number: '456',
      complement: 'Loja 1',
      neighborhood: 'Centro',
      city: 'São Paulo',
      cityCode: '3550308',
      state: 'SP',
      zipCode: '01310100',
      phone: '11987654321',
      email: 'contato@bomsabor.com.br',
      nfceSeries: '1',
      nfceCurrentNumber: 1,
      nfceEnvironment: 'staging',
      nfceCsc: 'HOMOLOGACAO-CSC-EXEMPLO',
      nfceCscId: '1',
      certificatePath: '/certificates/bomsabor.pfx',
      certificatePassword: 'certificado123',
      certificateExpirationDate: new Date('2026-12-31'),
      ibptVersion: '4.0',
      licenseKey: 'LIC-2024-BOMSABOR',
      licenseToken: 'TOKEN-XYZ-123',
    },
  });

  console.log('✓ Company seed');
}
