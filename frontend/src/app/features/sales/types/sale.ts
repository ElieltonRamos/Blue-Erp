export interface SaleItem {
  saleId: number;
  productId: number;
  nItem: number;        // número do item na nota (1, 2, 3...) - pode ser definido na conversão
  cProd: string;        // código/id do produto
  xProd: string;        // descrição do produto

  // Fiscais principais
  ncm: string;          // NCM do produto (obrigatório)
  cfop: string;         // CFOP da operação (pode herdar de Sale.cfop se quiser)
  csosn: string;        // CSOSN do Simples Nacional (ex.: '102')
  origem: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 0 = nacional, etc.

  // Quantidade / valor comercial
  uCom: string;         // unidade de comercialização (default 'UN')
  qCom: number;         // quantidade comercial (ex.: 1.546)
  vUnCom: number;       // valor unitário comercial
  indTot: 0 | 1;        // 1 = compõe o total da NF (default 1)

  // Unidade tributável (se diferente da comercial)
  uTrib?: string;       // se não informar, a conversão copia uCom
  qTrib?: number;       // se não informar, a conversão copia qCom
  vUnTrib?: number;     // se não informar, a conversão copia vUnCom

  // IBPT (para cálculo do vTotTrib)
  aliqFederal?: number;   // % tributos federais aproximados
  aliqEstadual?: number;  // % tributos estaduais aproximados
  aliqMunicipal?: number; // % tributos municipais aproximados

  // Impostos resumidos (visão de aplicação)
  vTotTrib?: number;    // valor aproximado de tributos do item (Lei 12.741)

  pisCst?: string;      // CST PIS (ex.: '49'); base/aliquota/valor ficam 0 no Simples
  cofinsCst?: string;   // CST COFINS (ex.: '49'); base/aliquota/valor ficam 0 no Simples

  iiValor?: number;     // valor de II (normalmente 0 no varejo interno)
  iofValor?: number;    // valor de IOF (normalmente 0)
}

export interface Sale {
  id?: number;
  clientId: number;
  userOperator: string;       // Nome ou usuário do operador
  paymentMethod: string;
  date: Date;
  products?: SaleItem[];      // Itens vendidos, cada um com sua quantidade, preço, csosn e cfop
  totalProductsWithoutDiscount: number;
  total: number;
  isPaid: boolean;
  discount: number;           // Desconto total da venda
  profitSale: number;
  client?: { name: string; cpf: string; address: string };
  cfop: string;
  formattedDate?: string;
  nfceStatus?: 'pendente' | 'emitida' | 'cancelada' | 'erro';
  nfceKey?: string;
  nfceProtocol?: string;
  dateNfceEmit?: Date;
  operator?: { username: string };
}