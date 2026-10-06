import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BusinessType } from 'generated/prisma/enums';

export class CompanyResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '12345678000199' })
  cnpj: string;

  @ApiProperty({ example: 'Empresa Exemplo LTDA' })
  corporateName: string;

  @ApiProperty({ example: 'Empresa Exemplo' })
  tradeName: string;

  @ApiProperty({ example: '123456789' })
  stateRegistration: string;

  @ApiProperty({ example: 'Simples Nacional' })
  taxRegime: string;

  @ApiProperty()
  street: string;

  @ApiProperty()
  number: string;

  @ApiProperty({ type: String, nullable: true })
  complement: string | null;

  @ApiProperty()
  neighborhood: string;

  @ApiProperty()
  city: string;

  @ApiProperty({ example: '2905701' })
  cityCode: string;

  @ApiProperty({ example: 'BA' })
  state: string;

  @ApiProperty({ example: '46430000' })
  zipCode: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  // NFC-e
  @ApiProperty({ example: '1' })
  nfceSeries: string;

  @ApiProperty({ example: 1 })
  nfceCurrentNumber: number;

  @ApiProperty({ example: 'staging' })
  nfceEnvironment: string;

  // NF-e
  @ApiProperty({ example: '1' })
  nfeSeries: string;

  @ApiProperty({ example: 0 })
  nfeCurrentNumber: number;

  @ApiProperty({ example: 'staging' })
  nfeEnvironment: string;

  @ApiProperty({ type: Number, nullable: true, example: 1.25 })
  simplesCreditRate: number | null;

  @ApiProperty({ example: '4.0' })
  ibptVersion: string;

  @ApiProperty({ type: String, nullable: true })
  licenseKey: string | null;

  @ApiProperty({ type: String, nullable: true })
  licenseToken: string | null;

  @ApiProperty({ enum: BusinessType, enumName: 'BusinessType' })
  businessType: BusinessType;

  @ApiProperty({ type: Object, nullable: true })
  enabledMenus: any;

  @ApiProperty({ type: Date, nullable: true })
  certificateExpirationDate: Date | null;

  @Exclude()
  @ApiHideProperty()
  nfceCsc: string;

  @Exclude()
  @ApiHideProperty()
  nfceCscId: string;

  @Exclude()
  @ApiHideProperty()
  certificatePath: string;

  @Exclude()
  @ApiHideProperty()
  certificatePassword: string;

  // Substitui os campos sensíveis por flags
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

  constructor(partial: CompanyResponseInput) {
    Object.assign(this, partial);
    this.simplesCreditRate =
      partial.simplesCreditRate != null
        ? Number(partial.simplesCreditRate)
        : null;
    this.nfceCscConfigured = !!partial.nfceCsc;
    this.nfceCscIdConfigured = !!partial.nfceCscId;
    this.certificatePasswordConfigured = !!partial.certificatePassword;
    this.certificateConfigured =
      !!partial.certificatePath && !!partial.certificatePassword;
    delete (this as any).nfceCsc;
    delete (this as any).nfceCscId;
    delete (this as any).certificatePath;
    delete (this as any).certificatePassword;
  }
}

type DecimalLike = { toNumber(): number };

type CompanyResponseInput = Omit<
  Partial<CompanyResponseDto>,
  'simplesCreditRate'
> & {
  simplesCreditRate?: DecimalLike | number | null;
};
