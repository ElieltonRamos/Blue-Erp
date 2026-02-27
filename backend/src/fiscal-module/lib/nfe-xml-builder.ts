import { create } from 'xmlbuilder2';
import { NFeOptions, NFeProduct } from '../entities/fiscal-module.entity';
import { createHash } from 'crypto';

function calculateCheckDigit(key43: string): string {
  const multipliers = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  let idx = 0;

  for (let i = key43.length - 1; i >= 0; i--) {
    sum += parseInt(key43[i], 10) * multipliers[idx];
    idx = (idx + 1) % 8;
  }

  const remainder = sum % 11;
  return (remainder < 2 ? 0 : 11 - remainder).toString();
}

function formatDateTimeBR(isoDate: string): string {
  const date = new Date(isoDate);
  const offset = '-03:00';
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offset}`;
}

function generateAccessKey(ide: NFeOptions['ide'], cnpj: string): string {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const date = new Date(ide.dhEmi);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');

  const key43 =
    ide.cUF.padStart(2, '0') +
    yy +
    mm +
    cleanCnpj.padStart(14, '0') +
    ide.mod +
    ide.serie.padStart(3, '0') +
    ide.nNF.padStart(9, '0') +
    ide.tpEmis +
    ide.cNF.padStart(8, '0');

  return key43 + calculateCheckDigit(key43);
}

function buildItemTax(item: NFeProduct) {
  const vProd = item.qCom * item.vUnCom;
  const totalRate =
    (item.aliqFederal || 0) +
    (item.aliqEstadual || 0) +
    (item.aliqMunicipal || 0);
  const vTotTrib = totalRate > 0 ? vProd * (totalRate / 100) : 0;

  return {
    vTotTrib: vTotTrib.toFixed(2),
    ICMS: {
      ICMSSN102: {
        orig: item.origem.toString(),
        CSOSN: item.csosn,
      },
    },
    PIS: {
      PISOutr: {
        CST: item.pisCst || '49',
        vBC: '0.00',
        pPIS: '0.00',
        vPIS: '0.00',
      },
    },
    COFINS: {
      COFINSOutr: {
        CST: item.cofinsCst || '49',
        vBC: '0.00',
        pCOFINS: '0.00',
        vCOFINS: '0.00',
      },
    },
  };
}

function buildDest(data: NFeOptions) {
  const cpf = data.dest.CPF?.replace(/\D/g, '');
  const hasCpf = cpf && cpf.length === 11 && cpf !== '00000000000';

  if (hasCpf) {
    return {
      CPF: cpf,
      xNome: data.dest.xNome,
      indIEDest: '9',
    };
  }

  return undefined; // sem dest
}

// <infNFeSupl>
//   <qrCode>
//     <![CDATA[ https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?chNFe=43170620491524000130650010000000041270328804&nVersao=100&tpAmb=2&dhEmi=323031372d30362d31345432303a33343a32312b30303a3030&vNF=67&vICMS=&digVal=63365036774e6a4b774e774d515639673953553269732b6f6d4c513d&cIdToken=1&cHashQRCode=4CF97E69A5B04FF72589F32D79E1FD7A003D28B8 ]]>
//   </qrCode>
// </infNFeSupl>
// valor acima passa pela validacao => tentar seguir a mesma logica
export function buildQrCodeUrl(params: {
  accessKey: string;
  tpAmb: string;
  idCSC: string;
  csc: string;
  // contingência offline
  offline?: boolean;
  dhEmi?: string;
  vNF?: string;
  digVal?: string;
}): string {
  const { accessKey, tpAmb, idCSC, csc } = params;

  let payload: string;

  if (params.offline && params.dhEmi && params.vNF && params.digVal) {
    const dhEmiHex = Buffer.from(params.dhEmi, 'utf-8').toString('hex');
    const digValHex = Buffer.from(params.digVal, 'utf-8').toString('hex');
    payload = `${accessKey}|2|${tpAmb}|${dhEmiHex}|${params.vNF}|${digValHex}|${idCSC}`;
  } else {
    payload = `${accessKey}|2|${tpAmb}|${idCSC}`;
  }

  const hash = createHash('sha1')
    .update(payload + csc)
    .digest('hex')
    .toUpperCase();

  const baseUrl =
    tpAmb === '1'
      ? 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml'
      : 'https://hportalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml';

  return `${baseUrl}?p=${payload}|${hash}`;
}

export function generateNFeXML(data: NFeOptions): string {
  const accessKey = generateAccessKey(data.ide, data.emit.CNPJ);
  data.ide.cDV = accessKey.slice(-1);
  data.ide.dhEmi = formatDateTimeBR(data.ide.dhEmi);
  data.ide.nNF = parseInt(data.ide.nNF, 10).toString();
  const taxPerItem = data.produtos.map((p) => buildItemTax(p));

  const totalProducts = data.produtos.reduce(
    (sum, p) => sum + p.qCom * p.vUnCom,
    0,
  );

  const totalTax = taxPerItem.reduce((sum, t) => sum + Number(t.vTotTrib), 0);

  const dest = buildDest(data);

  const isHomolog = data.ide.tpAmb === '2';

  const root = {
    NFe: {
      '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
      infNFe: {
        '@Id': `NFe${accessKey}`,
        '@versao': '4.00',
        ide: {
          cUF: data.ide.cUF,
          cNF: data.ide.cNF,
          natOp: data.ide.natOp,
          mod: data.ide.mod,
          serie: data.ide.serie,
          nNF: data.ide.nNF,
          dhEmi: data.ide.dhEmi,
          tpNF: data.ide.tpNF,
          idDest: data.ide.idDest,
          cMunFG: data.ide.cMunFG,
          tpImp: data.ide.tpImp,
          tpEmis: data.ide.tpEmis,
          cDV: data.ide.cDV,
          tpAmb: data.ide.tpAmb,
          finNFe: data.ide.finNFe,
          indFinal: data.ide.indFinal,
          indPres: data.ide.indPres,
          indIntermed: data.ide.indIntermed || '0',
          procEmi: data.ide.procEmi,
          verProc: data.ide.verProc,
        },
        emit: {
          CNPJ: data.emit.CNPJ,
          xNome: data.emit.xNome,
          xFant: data.emit.xFant,
          enderEmit: data.emit.enderEmit,
          IE: data.emit.IE,
          CRT: data.emit.CRT,
        },
        ...(dest ? { dest } : {}),
        det: data.produtos.map((p, index) => ({
          '@nItem': p.nItem.toString(),
          prod: {
            cProd: p.cProd,
            cEAN: 'SEM GTIN',
            xProd:
              isHomolog && index === 0
                ? 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
                : p.xProd,
            NCM: p.ncm,
            CFOP: p.cfop,
            uCom: p.uCom,
            qCom: p.qCom.toFixed(4),
            vUnCom: p.vUnCom.toFixed(5),
            vProd: (p.qCom * p.vUnCom).toFixed(2),
            cEANTrib: 'SEM GTIN',
            uTrib: p.uTrib,
            qTrib: p.qTrib.toFixed(4),
            vUnTrib: p.vUnTrib.toFixed(5),
            indTot: p.indTot.toString(),
          },
          imposto: taxPerItem[index],
        })),
        total: {
          ICMSTot: {
            vBC: '0.00',
            vICMS: '0.00',
            vICMSDeson: '0.00',
            vFCP: '0.00',
            vBCST: '0.00',
            vST: '0.00',
            vFCPST: '0.00',
            vFCPSTRet: '0.00',
            vProd: totalProducts.toFixed(2),
            vFrete: '0.00',
            vSeg: '0.00',
            vDesc: '0.00',
            vII: '0.00',
            vIPI: '0.00',
            vIPIDevol: '0.00',
            vPIS: '0.00',
            vCOFINS: '0.00',
            vOutro: '0.00',
            vNF: totalProducts.toFixed(2),
            vTotTrib: totalTax.toFixed(2),
          },
        },
        transp: { modFrete: '9' },
        pag: {
          detPag: {
            tPag: data.pag.tPag,
            ...(data.pag.tPag === '99' && data.pag.xPag
              ? { xPag: data.pag.xPag }
              : {}),
            vPag: data.pag.vPag.toFixed(2),
          },
          vTroco: '0.00',
        },
        infAdic: data.infAdic ? { infCpl: data.infAdic } : undefined,
      },
    },
  };

  return create(root).end({ prettyPrint: false, headless: true });
}
