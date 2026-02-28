export interface NFeOptions {
  ide: {
    cUF: string;
    cNF: string;
    natOp: string;
    mod: string;
    serie: string;
    nNF: string;
    dhEmi: string;
    tpNF: string;
    idDest: string;
    cMunFG: string;
    tpImp: string;
    tpEmis: string;
    cDV: string;
    tpAmb: string;
    finNFe: string;
    indFinal: string;
    indPres: string;
    procEmi: string;
    verProc: string;
    indIntermed: string;
  };
  emit: {
    CNPJ: string;
    xNome: string;
    xFant: string;
    IE: string;
    CRT: string;
    enderEmit: {
      xLgr: string;
      nro: string;
      xCpl?: string | null;
      xBairro: string;
      cMun: string;
      xMun: string;
      UF: string;
      CEP: string;
      cPais: string;
      xPais: string;
      fone: string;
    };
  };
  dest: {
    xNome: string;
    CPF?: string;
    enderDest: {
      xLgr: string;
      nro: string;
      xBairro: string;
      cMun: string;
      xMun: string;
      UF: string;
      CEP: string;
      cPais: string;
      xPais: string;
    };
    indIEDest: string;
  };
  produtos: NFeProduct[];
  pag: {
    indPag: string;
    tPag: string;
    vPag: number;
    xPag?: string;
    card?: {
      tpIntegra: string;
      tBand: string;
      cAut: string;
    };
  };
  infAdic?: string;
  fonteIBPT?: string;
  csc: {
    idCSC: string;
    csc: string;
  };
}

export interface NFeProduct {
  nItem: number;
  cProd: string;
  xProd: string;
  ncm: string;
  cfop: string;
  csosn: string;
  origem: number;
  uCom: string;
  qCom: number;
  vUnCom: number;
  indTot: number;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  aliqFederal: number;
  aliqEstadual: number;
  aliqMunicipal: number;
  vTotTrib: number | null;
  pisCst: string;
  cofinsCst: string;
  iiValor: number;
  iofValor: number;
}

export interface DigitalCertificate {
  pfxBuffer: Buffer;
  password: string;
}

export interface NFeConfiguration {
  environment: string;
  state: string;
}

export interface SefazReturn {
  success: boolean;
  statusCode?: string;
  protocol?: string;
  message: string;
  signedXml?: string;
  accessKey?: string;
  authorizationDate?: string;
  xmlProtocol?: string;
  errors?: string[];
}

export interface DanfeConfig {
  csc: string;
  idCSC: string;
  widthMM: number;
  consultUrl?: string;
}

export interface DanfeTotals {
  productValue: number;
  discountValue: number;
  totalValue: number;
}

export interface EmissionResult {
  accessKey: string;
  protocol?: string;
  xmlPath: string;
  pdfPath?: string;
  status: 'authorized' | 'rejected' | 'contingency';
  message: string;
}

export interface StoragePaths {
  xmlDir: string;
  pdfDir: string;
  xmlPath: string;
  pdfPath?: string;
}

export interface CancelNFeParams {
  accessKey: string;
  protocol: string;
  justification: string;
  cnpj: string;
}
