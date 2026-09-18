/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from 'generated/prisma/client';

const MENUS_BASE = [
  '/clientes',
  '/produtos',
  '/usuarios',
  '/historico-vendas',
  '/relatorios',
  '/financeiro',
  '/empresa',
  '/pdv',
];

const MENUS_FISCAL = ['/fiscal', '/compras'];
const MENUS_SEGMENTO_OFICINA = ['/veiculos', '/servicos', '/ordem-servico'];
const MENUS_SEGMENTO_RESTAURANTE = ['/comandas', '/cozinha', '/mesas'];

const MENUS_PDV = [...MENUS_BASE];

const MENUS_OFICINA = [
  ...MENUS_BASE,
  ...MENUS_FISCAL,
  ...MENUS_SEGMENTO_OFICINA,
];

const MENUS_RESTAURANTE = [
  ...MENUS_BASE,
  ...MENUS_FISCAL,
  ...MENUS_SEGMENTO_RESTAURANTE,
];

const MENUS_VAREJO = [
  ...MENUS_BASE,
  ...MENUS_FISCAL,
  ...MENUS_SEGMENTO_OFICINA,
  ...MENUS_SEGMENTO_RESTAURANTE,
];

const LICENSE_COMPLETO = 'COMPLETO-22222222000122-a7c3e14d8b224a21';
const LICENSE_PDV = '<chave sem fiscal>';

const businessType = 'PDV';
const licenseKey = LICENSE_COMPLETO;
const enabledMenus = MENUS_PDV;

export async function seedCompany(prisma: PrismaClient) {
  const data = {
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
    licenseToken: 'TOKEN-HOMOLOG-BLUE-456',
    licenseKey,
    businessType,
    enabledMenus,
  } as const;

  await prisma.company.upsert({
    where: { cnpj: '22222222000122' },
    update: { licenseKey, businessType, enabledMenus },
    create: { cnpj: '22222222000122', ...data },
  });

  console.log(`✓ Company seed (Homologação) - ${businessType}`);
}
