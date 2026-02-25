/* eslint-disable @typescript-eslint/no-unsafe-return */
import { create } from 'xmlbuilder2';
import { NFeOptions, NFeProduct } from '../entities/fiscal-module.entity';

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
    II: {
      vBC: '0.00',
      vDespAdu: '0.00',
      vII: '0.00',
      vIOF: '0.00',
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

export function generateNFeXML(data: NFeOptions): string {
  const accessKey = generateAccessKey(data.ide, data.emit.CNPJ);
  data.ide.cDV = accessKey.slice(-1);

  const taxPerItem = data.produtos.map((p) => buildItemTax(p));

  const totalProducts = data.produtos.reduce(
    (sum, p) => sum + p.qCom * p.vUnCom,
    0,
  );

  const totalTax = taxPerItem.reduce((sum, t) => sum + Number(t.vTotTrib), 0);

  const root = {
    nfeProc: {
      '@versao': '4.00',
      '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
      NFe: {
        '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
        infNFe: {
          '@Id': `NFe${accessKey}`,
          '@versao': '4.00',
          ide: data.ide,
          emit: data.emit,
          dest: data.dest,
          det: data.produtos.map((p, index) => ({
            '@nItem': p.nItem.toString(),
            prod: {
              cProd: p.cProd,
              cEAN: 'SEM GTIN',
              xProd: p.xProd,
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
              vFCPUFDest: '0.00',
              vICMSUFDest: '0.00',
              vICMSUFRemet: '0.00',
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
              indPag: data.pag.indPag,
              tPag: data.pag.tPag,
              vPag: data.pag.vPag.toFixed(2),
            },
            vTroco: '0.00',
          },
          infAdic: data.infAdic ? { infCpl: data.infAdic } : undefined,
        },
      },
    },
  };

  return create(root).end({ prettyPrint: true });
}
