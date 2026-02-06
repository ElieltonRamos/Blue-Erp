import { Unit, ProductType } from 'generated/prisma/client';

export class Product {
  id?: number;
  name: string;
  code: string;
  productionLocation?: string | null;

  // Preços
  price: number;
  costPrice: number;
  extraCosts?: number;

  // Informações fiscais
  ncm: string;
  cest?: string | null;
  origin: number;

  // Tributação
  csosn?: string | null;
  cst?: string | null;
  icmsRate?: number | null;

  // PIS/COFINS
  cstPis?: string | null;
  pisRate?: number | null;
  cstCofins?: string | null;
  cofinsRate?: number | null;

  // IBPT
  federalTaxRate?: number | null;
  stateTaxRate?: number | null;
  municipalTaxRate?: number | null;

  // Controle
  unit: Unit;
  quantity: number;
  minStock?: number | null;
  active: boolean;
  productType: ProductType;

  // Categoria
  categoryId?: number | null;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}
