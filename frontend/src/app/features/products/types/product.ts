export const productionLocationOptions = [
  'Cozinha Principal',
  'Cozinha Secundária',
  'Cozinha Terciaria',
  'Bar',
];

export enum Unit {
  UN = 'UN', // Unidade
  KG = 'KG', // Quilograma
  LT = 'LT', // Litro
  MT = 'MT', // Metro
  CX = 'CX', // Caixa
  ML = 'ML', // Mililitro
  GR = 'GR', // Grama
  DZ = 'DZ', // Dúzia
}

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
  productType: 'MANUFACTURED' | 'RESALE';
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
  materialName: string;
  materialId: number;
  quantity: number;
  unitCost: number;
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
  productType: 'MANUFACTURED' | 'RESALE';
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
  productType?: 'MANUFACTURED' | 'RESALE';
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
  productType?: 'MANUFACTURED' | 'RESALE';
  unit?: string;
  active?: boolean;
  lowStock?: boolean;
  categoryId?: number;
}
