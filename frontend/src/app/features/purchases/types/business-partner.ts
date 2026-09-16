// types/business-partner.ts

export type PartnerType = 'SUPPLIER' | 'EMPLOYEE' | 'CARRIER' | 'ACCOUNTANT' | 'BANK';

export interface BusinessPartner {
  id: number;
  type: PartnerType;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

export interface CreateBusinessPartnerDTO {
  type: PartnerType;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateBusinessPartnerDTO extends Partial<CreateBusinessPartnerDTO> {}

export interface BusinessPartnerFilters {
  type?: PartnerType | '';
  active?: boolean;
  search?: string;
}
