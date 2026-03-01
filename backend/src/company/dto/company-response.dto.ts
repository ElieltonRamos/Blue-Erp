import { Exclude } from 'class-transformer';

export class CompanyResponseDto {
  id: number;
  cnpj: string;
  corporateName: string;
  tradeName: string;
  stateRegistration: string;
  taxRegime: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  cityCode: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string | null;
  nfceSeries: string;
  nfceCurrentNumber: number;
  nfceEnvironment: string;
  ibptVersion: string;
  licenseKey: string | null;
  licenseToken: string | null;
  certificateExpirationDate: Date | null;

  @Exclude()
  nfceCsc: string;

  @Exclude()
  nfceCscId: string;

  @Exclude()
  certificatePath: string;

  @Exclude()
  certificatePassword: string;

  // Substitui os campos sensíveis por flags
  nfceCscConfigured: boolean;
  nfceCscIdConfigured: boolean;
  certificatePasswordConfigured: boolean;
  certificateConfigured: boolean;

  constructor(partial: Partial<CompanyResponseDto>) {
    Object.assign(this, partial);
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
