// src/company/entities/company.entity.ts
export class Company {
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

  constructor(partial: Partial<Company>) {
    Object.assign(this, partial);
  }
}
