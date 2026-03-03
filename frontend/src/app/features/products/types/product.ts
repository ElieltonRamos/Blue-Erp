export const productionLocationOptions = [
  'Cozinha Principal',
  'Cozinha Secundária',
  'Cozinha Terciaria',
  'Bar',
];

export enum Unit {
  UN = 'UN',
  KG = 'KG',
  LT = 'LT',
  MT = 'MT',
  CX = 'CX',
  ML = 'ML',
  GR = 'GR',
  DZ = 'DZ',
}

export type ProductType = 'MANUFACTURED' | 'RESALE' | 'SEMI_MANUFACTURED';

export interface Product {
  id: number;
  name: string;
  code: string;
  productionLocation?: string;
  price: number;
  costPrice: number;
  extraCosts: number;
  ncm: string;
  cest?: string;
  origin: number;
  csosn?: string;
  cst?: string;
  icmsRate?: number;
  cstPis?: string;
  pisRate?: number;
  cstCofins?: string;
  cofinsRate?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
  municipalTaxRate?: number;
  unit: string;
  quantity: number;
  minStock?: number;
  active: boolean;
  productType: ProductType;
  categoryId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductComposition {
  items: CompositionItem[];
  preparationSteps: PreparationStep[];
  totalCost: number;
}

export interface CompositionItem {
  materialId?: number;
  subProductId?: number;
  materialName: string;
  quantity: number;
  unitCost: number;
  unit?: string;
  totalCost?: number;
}

export interface PreparationStep {
  order: number;
  description: string;
}

export interface CreateProductDTO {
  name: string;
  code: string;
  productionLocation?: string;
  price: number;
  costPrice: number;
  extraCosts: number;
  ncm: string;
  cest?: string;
  origin: number;
  csosn?: string;
  cst?: string;
  icmsRate?: number;
  cstPis?: string;
  pisRate?: number;
  cstCofins?: string;
  cofinsRate?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
  municipalTaxRate?: number;
  unit: string;
  quantity?: number;
  minStock?: number;
  active?: boolean;
  productType: ProductType;
  categoryId?: number;
  composition?: CompositionItem[];
  preparationSteps?: PreparationStep[];
}

export interface UpdateProductDTO {
  name?: string;
  code?: string;
  productionLocation?: string;
  price?: number;
  costPrice?: number;
  extraCosts?: number;
  ncm?: string;
  cest?: string;
  origin?: number;
  csosn?: string;
  cst?: string;
  icmsRate?: number;
  cstPis?: string;
  pisRate?: number;
  cstCofins?: string;
  cofinsRate?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
  municipalTaxRate?: number;
  unit?: string;
  quantity?: number;
  minStock?: number;
  active?: boolean;
  productType?: ProductType;
  categoryId?: number;
}

export interface UpdateCompositionDTO {
  composition: CompositionItem[];
}

export interface UpdatePreparationDTO {
  steps: PreparationStep[];
}

export interface ProduceProductDTO {
  quantity: number;
}

export interface ProductSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalStockValue: number;
  productsLowStock: number;
  totalItems: number;
}

export interface StockAlert {
  id: number;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  price: number;
  estimatedValue: number;
}

export interface FilterProductParams {
  search?: string;
  productType?: ProductType;
  unit?: string;
  active?: boolean;
  lowStock?: boolean;
  categoryId?: number;
}
