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
  complement?: string | null;
  neighborhood: string;
  city: string;
  cityCode: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string | null;

  // NFC-e
  nfceSeries: string;
  nfceCurrentNumber: number;
  nfceEnvironment: 'production' | 'staging';

  // NF-e
  nfeSeries: string;
  nfeCurrentNumber: number;
  nfeEnvironment: 'production' | 'staging';
  simplesCreditRate: number | null;

  ibptVersion: string;
  licenseKey: string | null;
  licenseToken: string | null;
  certificateExpirationDate?: Date | null;
  businessType: 'RESTAURANTE' | 'OFICINA' | 'VAREJO' | 'PDV';
  enabledMenus: string[] | null;

  // Campos sensíveis não retornados pela API
  nfceCscConfigured: boolean;
  nfceCscIdConfigured: boolean;
  certificatePasswordConfigured: boolean;
  certificateConfigured: boolean;
}
