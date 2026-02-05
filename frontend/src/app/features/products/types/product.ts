export const productionLocationOptions = [
  'Cozinha Principal',
  'Cozinha Secundária',
  'Bar',
  'Confeitaria',
  'Pizzaria',
  'Grill',
  'Forno',
  'Chapa',
  'Fritura',
  'Montagem',
];

export default interface Product {
  id?: number;
  name: string; // Descrição do produto para NFC-e
  code: string; // Código interno ou SKU
  price: number; // Preço unitário de venda
  costPrice: number; // Custo do produto - usado para controle interno
  ncm: string; // Código NCM obrigatório para emissão fiscal
  cest: string; // Código CEST, se aplicável
  csosn: string; // Código CSOSN do Simples Nacional para o produto
  unit: Unit; // Unidade de medida (ex.: "UN", "CX", "LT")
  origin: number; // Origem do produto (0-8 conforme tabela fiscal)
  quantity: number; // Estoque atual do produto (opcional)
  active: boolean; // Flag ativo/inativo
}

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

export interface GetSugestionCode {
  code: number;
}

// Interface para resposta de código sugerido
interface CodeSuggestionResponse {
  code: number;
}

// Interface para composição do produto (backend)
export interface ProductCompositionDTO {
  compositionItems: {
    materialId: string;
    quantity: number;
  }[];
  preparationSteps: {
    order: number;
    description: string;
  }[];
}

// Interface para criação de produto com composição
export interface CreateProductDTO {
  // Dados básicos do produto
  name: string;
  code: string;
  productType: string; // 'manufactured' ou 'resale'
  price: number;
  costPrice: number;
  ncm: string;
  cest: string;
  csosn: string;
  unit: Unit;
  origin: number;
  quantity: number;
  active: boolean;

  // Composição do produto (apenas para produtos manufaturados)
  composition?: ProductCompositionDTO;
}

// Interface para resposta do backend após criar produto
export interface CreateProductResponse {
  id: string;
  name: string;
  code: string;
  price: number;
  costPrice: number;
  ncm: string;
  cest: string;
  csosn: string;
  unit: string;
  origin: number;
  quantity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CompositionItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface PreparationStep {
  order: number;
  description: string;
}

export interface ProductComposition {
  items: CompositionItem[];
  preparationSteps: PreparationStep[];
  totalCost: number;
}

// Interface para enviar ao backend
export interface ProductCompositionDTO {
  compositionItems: {
    materialId: string;
    quantity: number;
  }[];
  preparationSteps: {
    order: number;
    description: string;
  }[];
}
