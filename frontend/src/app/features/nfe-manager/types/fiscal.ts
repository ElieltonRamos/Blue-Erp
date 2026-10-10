export interface NotaFiscal {
  id: number;
  fiscalModel: '55' | '65' | null; // null = notas antigas, tratadas como NFC-e
  fiscalKey: string | null;
  fiscalProtocol: string | null;
  fiscalStatus: 'PENDENTE' | 'EMITIDA' | 'CANCELADA' | 'ERRO';
  fiscalEmitDate: string | null;
  total: string; // o getNotas converte com toFixed(2)
  nNF: number | '—'; // '—' quando não há chave
  date: string;
  clientName: string;
  payments: { method: string; amount: number }[];
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

export interface EmissionResult {
  accessKey: string;
  protocol?: string;
  xmlPath: string;
  pdfPath?: string;
  status: 'authorized' | 'rejected' | 'contingency';
  message: string;
}

// A NF-e só retorna sucesso quando autorizada; rejeição vem como erro HTTP.
// pdfPath vem como '' quando o DANFE não foi gerado.
export interface NfeEmissionResult extends Omit<EmissionResult, 'status' | 'pdfPath'> {
  status: 'authorized';
  pdfPath: string;
}

export type ModFrete = '0' | '1' | '2' | '3' | '4' | '9';

export interface NfeVehicle {
  plate: string;
  uf: string;
}

export interface NfeVolumes {
  qVol?: number;
  esp?: string;
  marca?: string;
  nVol?: string;
  pesoL?: number;
  pesoB?: number;
}

export interface NfeTransp {
  modFrete: ModFrete;
  carrierId?: number;
  vehicle?: NfeVehicle;
  volumes?: NfeVolumes;
}

export interface NfeFat {
  nFat: string;
  vOrig: number;
  vDesc?: number;
  vLiq: number;
}

export interface NfeDup {
  nDup: string;
  dVenc: string; // YYYY-MM-DD
  vDup: number;
}

export interface NfeCobr {
  fat?: NfeFat;
  dup?: NfeDup[];
}

export interface EmitNfeRequest {
  saleId: number;
  generateDanfe?: boolean;
  natOp: string;
  tpNF?: '0' | '1';
  finNFe?: '1' | '2' | '3' | '4';
  dhSaiEnt?: string; // ISO 8601
  permiteCredito?: boolean;
  transp: NfeTransp;
  cobr?: NfeCobr;
  omitServices?: boolean;
  payments?: NfePayment[];
  infAdic?: string;
}

export interface NfePayment {
  method: string;
  amount: number;
}
