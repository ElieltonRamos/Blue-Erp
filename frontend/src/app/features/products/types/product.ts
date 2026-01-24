export default interface Product {
  id?: number;
  name: string;          // Descrição do produto para NFC-e
  code: string;          // Código interno ou SKU
  price: number;         // Preço unitário de venda
  costPrice: number;     // Custo do produto - usado para controle interno
  ncm: string;          // Código NCM obrigatório para emissão fiscal
  cest: string;         // Código CEST, se aplicável
  csosn: string;        // Código CSOSN do Simples Nacional para o produto
  unit: Unit;         // Unidade de medida (ex.: "UN", "CX", "LT")
  origin: number;       // Origem do produto (0-8 conforme tabela fiscal)
  quantity: number;     // Estoque atual do produto (opcional)
  active: boolean;      // Flag ativo/inativo
}

export enum Unit {
  UN = 'UN',   // Unidade
  KG = 'KG',   // Quilograma
  LT = 'LT',   // Litro
  MT = 'MT',   // Metro
  CX = 'CX',   // Caixa
  ML = 'ML',   // Mililitro
  GR = 'GR',   // Grama
  DZ = 'DZ',   // Dúzia
}

export interface GetSugestionCode {
  code: number;
}
