export interface Nfe55Address {
  xLgr: string;
  nro: string;
  xCpl?: string;
  xBairro: string;
  cMun: string;
  xMun: string;
  UF: string;
  CEP: string;
  cPais?: string;
  xPais?: string;
  fone?: string;
}

export interface Nfe55PisCofins {
  cst: string;
  vBC?: number;
  aliq?: number; // pPIS / pCOFINS
  qBCProd?: number;
  vAliqProd?: number;
  valor?: number; // se omitido, é calculado
}

export interface Nfe55Ipi {
  cEnq: string;
  cst: string;
  vBC?: number;
  pIPI?: number;
  vIPI?: number; // se omitido, é calculado
}

export interface Nfe55Item {
  nItem: number;
  cProd: string;
  xProd: string;
  ncm: string;
  cest?: string;
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vOutro?: number;
  indTot: string;
  vTotTrib?: number;
  origem: string | number;
  csosn: string;
  /** Campos do grupo ICMSSNxxx além de orig/CSOSN (pCredSN, vCredICMSSN, modBCST, vBCST...) */
  icms?: Record<string, string | number>;
  ipi?: Nfe55Ipi;
  pis: Nfe55PisCofins;
  cofins: Nfe55PisCofins;
}

export interface Nfe55Options {
  ide: {
    cUF: string;
    cNF: string;
    natOp: string;
    serie: string;
    nNF: string;
    dhEmi: string; // ISO
    dhSaiEnt?: string; // ISO
    tpNF: string;
    idDest: string;
    cMunFG: string;
    tpImp: string;
    tpEmis: string;
    tpAmb: string;
    finNFe: string;
    indFinal: string;
    indPres: string;
    indIntermed?: string;
    procEmi: string;
    verProc: string;
  };
  emit: {
    CNPJ: string;
    xNome: string;
    xFant?: string;
    enderEmit: Nfe55Address;
    IE: string;
    CRT: string;
  };
  dest: {
    CNPJ?: string;
    CPF?: string;
    xNome: string;
    enderDest: Nfe55Address;
    indIEDest: string;
    IE?: string;
  };
  produtos: Nfe55Item[];
  transp: {
    modFrete: string;
    transporta?: {
      CNPJ?: string;
      CPF?: string;
      xNome?: string;
      IE?: string;
      xEnder?: string;
      xMun?: string;
      UF?: string;
    };
    vol?: {
      qVol?: string;
      esp?: string;
      marca?: string;
      nVol?: string;
      pesoL?: string;
      pesoB?: string;
    };
  };
  cobr?: {
    fat?: { nFat: string; vOrig: number; vDesc?: number; vLiq: number };
    dup?: { nDup: string; dVenc: string; vDup: number }[];
  };
  pag: {
    detPag: {
      indPag: string;
      tPag: string;
      xPag?: string;
      vPag: number;
      card?: Record<string, string>;
    }[];
    vTroco?: number;
  };
  infAdic?: string;
}

export interface DanfeNfeConfig {
  /** PNG ou JPG do logotipo do emitente (opcional) */
  logo?: Buffer;
  /** Exibido na identificação do emitente (opcional) */
  emitterEmail?: string;
}
