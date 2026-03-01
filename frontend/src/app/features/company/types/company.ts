// interfaces/company.ts
export interface Company {
  id?: number;
  cnpj: string;
  corporateName: string;
  tradeName: string;
  stateRegistration: string;
  taxRegime: '1' | '2' | '3';
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  cityCode: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  nfceSeries: string;
  nfceCurrentNumber: number;
  nfceEnvironment: 'production' | 'staging';
  ibptVersion: string;
  licenseKey: string;
  licenseToken: string;
  certificateExpirationDate?: Date;

  // Campos sensíveis não retornados pela API
  nfceCscConfigured: boolean;
  nfceCscIdConfigured: boolean;
  certificatePasswordConfigured: boolean;
  certificateConfigured: boolean;
}
