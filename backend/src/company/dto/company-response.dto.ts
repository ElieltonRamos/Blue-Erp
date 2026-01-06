// src/company/dto/company-response.dto.ts
export class CompanyResponseDto {
  id: number;
  name: string;
  cnpj: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CompanyResponseDto>) {
    Object.assign(this, partial);
  }
}
