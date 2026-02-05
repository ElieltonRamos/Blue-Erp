// primary-material.service.ts
export interface CreatePrimaryMaterialDTO {
  name: string;
  code: string;
  unit: string;
  unitCost: number;
  currentStock?: number;
  minStock?: number;
  expiryDate?: Date;
  active?: boolean;
  ncm?: string;
  cfop?: string;
}

export interface PrimaryMaterial {
  id: string;
  name: string;
  code: string;
  unit: string;
  unitCost: number;
  currentStock: number;
  minStock?: number;
  expiryDate?: Date;
  active: boolean;
  ncm?: string;
  cfop?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePrimaryMaterialDTO {
  name?: string;
  code?: string;
  unit?: string;
  unitCost?: number;
  currentStock?: number;
  minStock?: number;
  expiryDate?: Date;
  active?: boolean;
  ncm?: string;
  cfop?: string;
}

export interface MaterialSummary {
  totalMaterials: number;
  activeMaterials: number;
  inactiveMaterials: number;
  totalStockValue: number;
  materialsLowStock: number;
  totalItems: number;
}

export interface StockAlert {
  id: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  unitCost: number;
  estimatedValue: number;
}

export interface FilterPrimaryMaterialParams {
  search?: string;
  unit?: string;
  active?: boolean;
  lowStock?: boolean;
}

export interface GetSuggestedCode {
  code: number;
}
