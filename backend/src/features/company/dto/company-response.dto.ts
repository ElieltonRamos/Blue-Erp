import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from 'generated/prisma/enums';
import { Company, Prisma } from 'generated/prisma/client';

const maskLicenseKey = (key: string | null): string | null => {
  if (!key) return null;
  return key.length <= 4 ? '****' : `****${key.slice(-4)}`;
};

export class CompanyResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '12345678000199', description: 'Somente dígitos' })
  cnpj: string;

  @ApiProperty({ example: 'Empresa Exemplo LTDA' })
  corporateName: string;

  @ApiProperty({ example: 'Empresa Exemplo' })
  tradeName: string;

  @ApiProperty({ example: '123456789' })
  stateRegistration: string;

  @ApiProperty({
    enum: ['1', '2', '3'],
    example: '1',
    description:
      '1=Simples Nacional, 2=Simples Nacional - Excesso, 3=Regime Normal',
  })
  taxRegime: string;

  @ApiProperty({ example: 'Rua das Flores' })
  street: string;

  @ApiProperty({ example: '123' })
  number: string;

  @ApiProperty({ type: String, nullable: true, example: 'Apt 101' })
  complement: string | null;

  @ApiProperty({ example: 'Centro' })
  neighborhood: string;

  @ApiProperty({ example: 'Belo Horizonte' })
  city: string;

  @ApiProperty({ example: '2905701', description: 'Código IBGE do município' })
  cityCode: string;

  @ApiProperty({ example: 'BA', description: 'UF' })
  state: string;

  @ApiProperty({ example: '46430000' })
  zipCode: string;

  @ApiProperty({ example: '(31) 3333-4444' })
  phone: string;

  @ApiProperty({ type: String, nullable: true, example: 'contato@exemplo.com' })
  email: string | null;

  // NFC-e
  @ApiProperty({ example: '1' })
  nfceSeries: string;

  @ApiProperty({ example: 1 })
  nfceCurrentNumber: number;

  @ApiProperty({ enum: ['production', 'staging'], example: 'staging' })
  nfceEnvironment: string;

  // NF-e
  @ApiProperty({ example: '1' })
  nfeSeries: string;

  @ApiProperty({ example: 0 })
  nfeCurrentNumber: number;

  @ApiProperty({ enum: ['production', 'staging'], example: 'staging' })
  nfeEnvironment: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1.25,
    description: 'Alíquota de crédito do Simples Nacional (pCredSN), em %',
  })
  simplesCreditRate: number | null;

  @ApiProperty({ example: '4.0' })
  ibptVersion: string;

  @ApiProperty({
    example: '****A1B2',
    description: 'Chave de licença mascarada (apenas os 4 últimos caracteres)',
  })
  licenseKey: string | null;

  @ApiProperty({ enum: BusinessType, enumName: 'BusinessType' })
  businessType: BusinessType;

  @ApiProperty({
    type: Object,
    nullable: true,
    example: { comandas: true, cozinha: true },
  })
  enabledMenus: Prisma.JsonValue;

  @ApiProperty({ type: Date, nullable: true })
  certificateExpirationDate: Date | null;

  // Flags no lugar dos campos sensíveis
  @ApiProperty({ description: 'Indica se o CSC está configurado' })
  nfceCscConfigured: boolean;

  @ApiProperty({ description: 'Indica se o ID do CSC está configurado' })
  nfceCscIdConfigured: boolean;

  @ApiProperty({
    description: 'Indica se a senha do certificado está configurada',
  })
  certificatePasswordConfigured: boolean;

  @ApiProperty({
    description: 'Indica se o certificado digital está configurado',
  })
  certificateConfigured: boolean;

  constructor(company: Company) {
    this.id = company.id;
    this.cnpj = company.cnpj;
    this.corporateName = company.corporateName;
    this.tradeName = company.tradeName;
    this.stateRegistration = company.stateRegistration;
    this.taxRegime = company.taxRegime;
    this.street = company.street;
    this.number = company.number;
    this.complement = company.complement;
    this.neighborhood = company.neighborhood;
    this.city = company.city;
    this.cityCode = company.cityCode;
    this.state = company.state;
    this.zipCode = company.zipCode;
    this.phone = company.phone;
    this.email = company.email;
    this.nfceSeries = company.nfceSeries;
    this.nfceCurrentNumber = company.nfceCurrentNumber;
    this.nfceEnvironment = company.nfceEnvironment;
    this.nfeSeries = company.nfeSeries;
    this.nfeCurrentNumber = company.nfeCurrentNumber;
    this.nfeEnvironment = company.nfeEnvironment;
    this.simplesCreditRate = company.simplesCreditRate?.toNumber() ?? null;
    this.ibptVersion = company.ibptVersion;
    this.licenseKey = maskLicenseKey(company.licenseKey);
    this.businessType = company.businessType;
    this.enabledMenus = company.enabledMenus;
    this.certificateExpirationDate = company.certificateExpirationDate;
    this.nfceCscConfigured = !!company.nfceCsc;
    this.nfceCscIdConfigured = !!company.nfceCscId;
    this.certificatePasswordConfigured = !!company.certificatePassword;
    this.certificateConfigured =
      !!company.certificatePath && !!company.certificatePassword;
  }
}
