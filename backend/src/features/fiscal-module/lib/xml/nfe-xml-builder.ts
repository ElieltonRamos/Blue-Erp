/* eslint-disable @typescript-eslint/no-base-to-string */
import { create } from 'xmlbuilder2';
import { formatDateTimeBR, generateAccessKey } from './xml-common';

import {
  Nfe55Ipi,
  Nfe55Item,
  Nfe55Options,
  Nfe55PisCofins,
} from '../../entities/nfe.entity';

// ---------- Helpers ----------

const HOMOLOG_TEXT =
  'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL';
const HOMOLOG_DEST_NAME =
  'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL';

const ADDRESS_KEYS = [
  'xLgr',
  'nro',
  'xCpl',
  'xBairro',
  'cMun',
  'xMun',
  'UF',
  'CEP',
  'cPais',
  'xPais',
  'fone',
];

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown) => (v === undefined || v === '' ? 0 : Number(v));
const digits = (s: string) => s.replace(/\D/g, '');

/** Mantém só as chaves informadas, na ordem do schema. Números viram 2 casas. */
function pick(obj: object | undefined, keys: string[]): Record<string, string> {
  const src = (obj ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = src[k];
    if (v === undefined || v === null || v === '') continue;
    out[k] = typeof v === 'number' ? v.toFixed(2) : String(v);
  }
  return out;
}

// ---------- ICMS (Simples Nacional) ----------

const ST_FIELDS = [
  'modBCST',
  'pMVAST',
  'pRedBCST',
  'vBCST',
  'pICMSST',
  'vICMSST',
  'vBCFCPST',
  'pFCPST',
  'vFCPST',
];

const ICMS_SN: Record<string, { tag: string; fields: string[] }> = {
  '101': { tag: 'ICMSSN101', fields: ['pCredSN', 'vCredICMSSN'] },
  '102': { tag: 'ICMSSN102', fields: [] },
  '103': { tag: 'ICMSSN102', fields: [] },
  '300': { tag: 'ICMSSN102', fields: [] },
  '400': { tag: 'ICMSSN102', fields: [] },
  '201': {
    tag: 'ICMSSN201',
    fields: [...ST_FIELDS, 'pCredSN', 'vCredICMSSN'],
  },
  '202': { tag: 'ICMSSN202', fields: ST_FIELDS },
  '203': { tag: 'ICMSSN202', fields: ST_FIELDS },
  '500': {
    tag: 'ICMSSN500',
    fields: [
      'vBCSTRet',
      'pST',
      'vICMSSubstituto',
      'vICMSSTRet',
      'vBCFCPSTRet',
      'pFCPSTRet',
      'vFCPSTRet',
      'pRedBCEfet',
      'vBCEfet',
      'pICMSEfet',
      'vICMSEfet',
    ],
  },
  '900': {
    tag: 'ICMSSN900',
    fields: [
      'modBC',
      'vBC',
      'pRedBC',
      'pICMS',
      'vICMS',
      ...ST_FIELDS,
      'pCredSN',
      'vCredICMSSN',
    ],
  },
};

function buildIcms(item: Nfe55Item) {
  const def = ICMS_SN[item.csosn];
  if (!def) {
    throw new Error(
      `CSOSN "${item.csosn}" não suportado (item ${item.nItem}).`,
    );
  }
  return {
    [def.tag]: {
      orig: String(item.origem),
      CSOSN: item.csosn,
      ...pick(item.icms, def.fields),
    },
  };
}

// ---------- IPI ----------

function buildIpi(ipi: Nfe55Ipi) {
  const tributado = ['00', '49', '50', '99'].includes(ipi.cst);
  if (!tributado) {
    return { cEnq: ipi.cEnq, IPINT: { CST: ipi.cst } };
  }
  const vBC = ipi.vBC ?? 0;
  const pIPI = ipi.pIPI ?? 0;
  const vIPI = ipi.vIPI ?? round2((vBC * pIPI) / 100);
  return {
    value: vIPI,
    node: {
      cEnq: ipi.cEnq,
      IPITrib: {
        CST: ipi.cst,
        vBC: vBC.toFixed(2),
        pIPI: pIPI.toFixed(2),
        vIPI: vIPI.toFixed(2),
      },
    },
  };
}

// ---------- PIS / COFINS ----------

function buildPisCofins(name: 'PIS' | 'COFINS', t: Nfe55PisCofins) {
  const CST = t.cst;
  const p = `p${name}`;
  const v = `v${name}`;

  if (['01', '02'].includes(CST)) {
    const vBC = t.vBC ?? 0;
    const aliq = t.aliq ?? 0;
    const valor = t.valor ?? round2((vBC * aliq) / 100);
    return {
      valor,
      node: {
        [`${name}Aliq`]: {
          CST,
          vBC: vBC.toFixed(2),
          [p]: aliq.toFixed(2),
          [v]: valor.toFixed(2),
        },
      },
    };
  }

  if (CST === '03') {
    const q = t.qBCProd ?? 0;
    const a = t.vAliqProd ?? 0;
    const valor = t.valor ?? round2(q * a);
    return {
      valor,
      node: {
        [`${name}Qtde`]: {
          CST,
          qBCProd: q.toFixed(4),
          vAliqProd: a.toFixed(4),
          [v]: valor.toFixed(2),
        },
      },
    };
  }

  if (['04', '05', '06', '07', '08', '09'].includes(CST)) {
    return { valor: 0, node: { [`${name}NT`]: { CST } } };
  }

  const vBC = t.vBC ?? 0;
  const aliq = t.aliq ?? 0;
  const valor = t.valor ?? round2((vBC * aliq) / 100);
  return {
    valor,
    node: {
      [`${name}Outr`]: {
        CST,
        vBC: vBC.toFixed(2),
        [p]: aliq.toFixed(2),
        [v]: valor.toFixed(2),
      },
    },
  };
}

// ---------- Blocos ----------

function buildDest(d: Nfe55Options['dest'], isHomolog: boolean) {
  const doc = d.CNPJ
    ? { CNPJ: digits(d.CNPJ) }
    : d.CPF
      ? { CPF: digits(d.CPF) }
      : undefined;
  if (!doc) throw new Error('Destinatário sem CNPJ ou CPF.');

  return {
    ...doc,
    xNome: isHomolog ? HOMOLOG_DEST_NAME : d.xNome,
    enderDest: pick(d.enderDest, ADDRESS_KEYS),
    indIEDest: d.indIEDest,
    ...(d.IE ? { IE: d.IE } : {}),
  };
}

function buildTransp(t: Nfe55Options['transp']) {
  const transporta = t.transporta
    ? pick(t.transporta, ['CNPJ', 'CPF', 'xNome', 'IE', 'xEnder', 'xMun', 'UF'])
    : undefined;
  const veicTransp = t.veicTransp
    ? pick(t.veicTransp, ['placa', 'UF', 'RNTC'])
    : undefined;
  const vol = t.vol
    ? pick(t.vol, ['qVol', 'esp', 'marca', 'nVol', 'pesoL', 'pesoB'])
    : undefined;

  return {
    modFrete: t.modFrete,
    ...(transporta && Object.keys(transporta).length ? { transporta } : {}),
    ...(veicTransp && Object.keys(veicTransp).length ? { veicTransp } : {}),
    ...(vol && Object.keys(vol).length ? { vol } : {}),
  };
}

function buildCobr(c: NonNullable<Nfe55Options['cobr']>) {
  return {
    ...(c.fat
      ? {
          fat: {
            nFat: c.fat.nFat,
            vOrig: c.fat.vOrig.toFixed(2),
            vDesc: (c.fat.vDesc ?? 0).toFixed(2),
            vLiq: c.fat.vLiq.toFixed(2),
          },
        }
      : {}),
    ...(c.dup?.length
      ? {
          dup: c.dup.map((d) => ({
            nDup: d.nDup,
            dVenc: d.dVenc,
            vDup: d.vDup.toFixed(2),
          })),
        }
      : {}),
  };
}

function buildDetPag(pag: Nfe55Options['pag']) {
  return pag.detPag.map((p) => ({
    indPag: p.indPag,
    tPag: p.tPag,
    ...(p.tPag === '99' && p.xPag ? { xPag: p.xPag } : {}),
    vPag: p.vPag.toFixed(2),
    ...(p.card ? { card: p.card } : {}),
  }));
}

// ---------- Gerador ----------

/** Gera o XML <NFe> (sem assinatura e sem nfeProc) da NF-e modelo 55. Não altera `data`. */
export function generateNFe55XML(data: Nfe55Options): string {
  const { ide, emit } = data;
  const isHomolog = ide.tpAmb === '2';

  const dhEmi = formatDateTimeBR(ide.dhEmi);
  const dhSaiEnt = ide.dhSaiEnt ? formatDateTimeBR(ide.dhSaiEnt) : undefined;
  const nNF = parseInt(ide.nNF, 10).toString();
  const serie = parseInt(ide.serie, 10).toString();
  const accessKey = generateAccessKey({
    cUF: ide.cUF,
    dhEmiBR: dhEmi,
    cnpj: emit.CNPJ,
    mod: '55',
    serie,
    nNF,
    tpEmis: ide.tpEmis,
    cNF: ide.cNF,
  });

  const tot = {
    vBC: 0,
    vICMS: 0,
    vBCST: 0,
    vST: 0,
    vProd: 0,
    vFrete: 0,
    vSeg: 0,
    vDesc: 0,
    vIPI: 0,
    vPIS: 0,
    vCOFINS: 0,
    vOutro: 0,
    vTotTrib: 0,
  };
  let hasTotTrib = false;

  const det = data.produtos.map((p, index) => {
    const vProd = round2(p.qCom * p.vUnCom);
    const pis = buildPisCofins('PIS', p.pis);
    const cofins = buildPisCofins('COFINS', p.cofins);
    const ipi = p.ipi ? buildIpi(p.ipi) : undefined;

    tot.vProd += vProd;
    tot.vFrete += p.vFrete ?? 0;
    tot.vSeg += p.vSeg ?? 0;
    tot.vDesc += p.vDesc ?? 0;
    tot.vOutro += p.vOutro ?? 0;
    tot.vPIS += pis.valor;
    tot.vCOFINS += cofins.valor;
    tot.vBC += num(p.icms?.vBC);
    tot.vICMS += num(p.icms?.vICMS);
    tot.vBCST += num(p.icms?.vBCST);
    tot.vST += num(p.icms?.vICMSST);
    if (ipi && 'value' in ipi) tot.vIPI += ipi.value as number;
    if (p.vTotTrib !== undefined) {
      hasTotTrib = true;
      tot.vTotTrib += p.vTotTrib;
    }

    return {
      '@nItem': p.nItem.toString(),
      prod: {
        cProd: p.cProd,
        cEAN: p.gtin || 'SEM GTIN',
        xProd: isHomolog && index === 0 ? HOMOLOG_TEXT : p.xProd,
        NCM: p.ncm,
        ...(p.cest ? { CEST: p.cest } : {}),
        CFOP: p.cfop,
        uCom: p.uCom,
        qCom: p.qCom.toFixed(4),
        vUnCom: p.vUnCom.toFixed(5),
        vProd: vProd.toFixed(2),
        cEANTrib: p.gtinTrib || 'SEM GTIN',
        uTrib: p.uTrib,
        qTrib: p.qTrib.toFixed(4),
        vUnTrib: p.vUnTrib.toFixed(5),
        ...(p.vFrete ? { vFrete: p.vFrete.toFixed(2) } : {}),
        ...(p.vSeg ? { vSeg: p.vSeg.toFixed(2) } : {}),
        ...(p.vDesc ? { vDesc: p.vDesc.toFixed(2) } : {}),
        ...(p.vOutro ? { vOutro: p.vOutro.toFixed(2) } : {}),
        indTot: p.indTot,
      },
      imposto: {
        ...(p.vTotTrib !== undefined
          ? { vTotTrib: p.vTotTrib.toFixed(2) }
          : {}),
        ICMS: buildIcms(p),
        ...(ipi ? { IPI: 'node' in ipi ? ipi.node : ipi } : {}),
        PIS: pis.node,
        COFINS: cofins.node,
      },
    };
  });

  const vNF = round2(
    tot.vProd -
      tot.vDesc +
      tot.vST +
      tot.vFrete +
      tot.vSeg +
      tot.vOutro +
      tot.vIPI,
  );
  const f = (n: number) => round2(n).toFixed(2);

  const root = {
    NFe: {
      '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
      infNFe: {
        '@Id': `NFe${accessKey}`,
        '@versao': '4.00',
        ide: {
          cUF: ide.cUF,
          cNF: ide.cNF,
          natOp: ide.natOp,
          mod: '55',
          serie,
          nNF,
          dhEmi,
          ...(dhSaiEnt ? { dhSaiEnt } : {}),
          tpNF: ide.tpNF,
          idDest: ide.idDest,
          cMunFG: ide.cMunFG,
          tpImp: ide.tpImp,
          tpEmis: ide.tpEmis,
          cDV: accessKey.slice(-1),
          tpAmb: ide.tpAmb,
          finNFe: ide.finNFe,
          indFinal: ide.indFinal,
          indPres: ide.indPres,
          ...(ide.indIntermed !== undefined
            ? { indIntermed: ide.indIntermed }
            : {}),
          procEmi: ide.procEmi,
          verProc: ide.verProc,
        },
        emit: {
          CNPJ: digits(emit.CNPJ),
          xNome: emit.xNome,
          ...(emit.xFant ? { xFant: emit.xFant } : {}),
          enderEmit: pick(emit.enderEmit, ADDRESS_KEYS),
          IE: emit.IE,
          CRT: emit.CRT,
        },
        dest: buildDest(data.dest, isHomolog),
        det,
        total: {
          ICMSTot: {
            vBC: f(tot.vBC),
            vICMS: f(tot.vICMS),
            vICMSDeson: '0.00',
            vFCPUFDest: '0.00',
            vICMSUFDest: '0.00',
            vICMSUFRemet: '0.00',
            vFCP: '0.00',
            vBCST: f(tot.vBCST),
            vST: f(tot.vST),
            vFCPST: '0.00',
            vFCPSTRet: '0.00',
            vProd: f(tot.vProd),
            vFrete: f(tot.vFrete),
            vSeg: f(tot.vSeg),
            vDesc: f(tot.vDesc),
            vII: '0.00',
            vIPI: f(tot.vIPI),
            vIPIDevol: '0.00',
            vPIS: f(tot.vPIS),
            vCOFINS: f(tot.vCOFINS),
            vOutro: f(tot.vOutro),
            vNF: vNF.toFixed(2),
            ...(hasTotTrib ? { vTotTrib: f(tot.vTotTrib) } : {}),
          },
        },
        transp: buildTransp(data.transp),
        ...(data.cobr ? { cobr: buildCobr(data.cobr) } : {}),
        pag: {
          detPag: buildDetPag(data.pag),
          vTroco: (data.pag.vTroco ?? 0).toFixed(2),
        },
        ...(data.infAdic ? { infAdic: { infCpl: data.infAdic } } : {}),
      },
    },
  };

  return create(root).end({ prettyPrint: false, headless: true });
}
