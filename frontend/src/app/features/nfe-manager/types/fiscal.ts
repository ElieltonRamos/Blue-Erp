export interface NotaFiscal {
  id: number;
  fiscalKey: string;
  fiscalProtocol: string;
  fiscalStatus: 'PENDENTE' | 'EMITIDA' | 'CANCELADA' | 'ERRO';
  fiscalEmitDate: string;
  fiscalXml: string;
  total: number;
  nNF: number;
  date: string;
  clientName: string;
  paymentMethod: string;
}

export interface PaginatedNotaFiscal {
  data: NotaFiscal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SefazStatus {
  online: boolean;
  status: string;
  message: string;
  checkedAt: string;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  totalNotes: number;
  canceledNotes: number;
  canceledValue: number;
  byCfop: CfopGroup[];
  byNcm: NcmGroup[];
}

export interface CfopGroup {
  cfop: string;
  description: string;
  totalValue: number;
  count: number;
}

export interface NcmGroup {
  ncm: string;
  totalValue: number;
  count: number;
}
