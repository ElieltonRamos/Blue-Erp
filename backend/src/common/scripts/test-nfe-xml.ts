// Uso (a partir de backend/): npx ts-node scripts/test-nfe-xml.ts [caminho-do-xml-de-referencia]
import { readFileSync } from 'fs';
import { generateNFe55XML } from '../../features/fiscal-module/lib/xml/nfe-xml-builder';

const xml = generateNFe55XML({
  ide: {
    cUF: '31',
    cNF: '49396902',
    natOp: 'VENDA DE PRODUCAO DO ESTABELECIMENTO - DENTRO DO ESTADO',
    serie: '1',
    nNF: '249',
    dhEmi: '2026-09-23T21:13:00Z',
    dhSaiEnt: '2026-09-23T21:13:00Z',
    tpNF: '1',
    idDest: '1',
    cMunFG: '3124302',
    tpImp: '1',
    tpEmis: '1',
    tpAmb: '1',
    finNFe: '1',
    indFinal: '0',
    indPres: '1',
    indIntermed: '0',
    procEmi: '0',
    verProc: 'LJ.002.26.0802',
  },
  emit: {
    CNPJ: '54730299000169',
    xNome: 'BED OF BOX FABRICA DE ESPUMA E COLCHOES LTDA',
    xFant: 'BED OF BOX FABRICA DE ESPUMA E COLCHOES LTDA',
    enderEmit: {
      xLgr: 'AVENIDA RAIMUNDO TOLENTINO, 771',
      nro: '.',
      xBairro: 'CIDADE NOVA',
      cMun: '3124302',
      xMun: 'ESPINOSA',
      UF: 'MG',
      CEP: '39510000',
      cPais: '1058',
      xPais: 'BRASIL',
      fone: '3892100648',
    },
    IE: '0048691250011',
    CRT: '1',
  },
  dest: {
    CNPJ: '51747530000139',
    xNome: 'USINORTE PLASTICO LTDA',
    enderDest: {
      xLgr: 'RUA MACEIO',
      nro: '181',
      xCpl: 'LETRA A',
      xBairro: 'SANTO ANTONIO',
      cMun: '3143302',
      xMun: 'MONTES CLAROS',
      UF: 'MG',
      CEP: '39402263',
      cPais: '1058',
      xPais: 'BRASIL',
      fone: '3899877520',
    },
    indIEDest: '1',
    IE: '0046863250080',
  },
  produtos: [
    {
      nItem: 1,
      cProd: '000078',
      xProd: 'BASE BOX BAU NEWSTAR CASAL 138X188X28',
      ncm: '94041000',
      cfop: '5101',
      uCom: 'UN',
      qCom: 21,
      vUnCom: 125,
      uTrib: 'UN',
      qTrib: 21,
      vUnTrib: 125,
      indTot: '1',
      origem: 0,
      csosn: '101',
      icms: { pCredSN: 0, vCredICMSSN: 0 },
      ipi: { cEnq: '999', cst: '99' },
      pis: { cst: '01', vBC: 2625, aliq: 0.65 },
      cofins: { cst: '01', vBC: 2625, aliq: 3 },
    },
  ],
  transp: {
    modFrete: '1',
    transporta: {
      xNome: 'O PROPRIO',
      xEnder: 'END -BAIRRO',
      xMun: 'MONTES CLAROS',
      UF: 'MG',
    },
    vol: {
      qVol: '21',
      esp: 'Volume(s)',
      marca: '.',
      pesoL: '0.000',
      pesoB: '0.000',
    },
  },
  cobr: {
    fat: { nFat: '001', vOrig: 2625, vDesc: 0, vLiq: 2625 },
    dup: [{ nDup: '001', dVenc: '2026-10-23', vDup: 2625 }],
  },
  pag: { detPag: [{ indPag: '1', tPag: '15', vPag: 2625 }] },
});

console.log(xml);
console.log('\nChave:', xml.match(/Id="NFe(\d{44})"/)?.[1]);

const refPath = process.argv[2];
if (refPath) {
  // Compara só o <NFe> do XML de referência, ignorando <Signature>, <II> e casas de qCom/qTrib
  const ref = readFileSync(refPath, 'utf8')
    .match(/<NFe [^>]*>[\s\S]*?(?=<Signature)/)![0]
    .concat('</NFe>')
    .replace(/<II>.*?<\/II>/g, '')
    .replace(/<(qCom|qTrib)>(\d+)\.00</g, '<$1>$2.0000<');
  console.log(
    xml === ref
      ? 'IGUAL ao XML de referência'
      : 'DIFERENTE do XML de referência',
  );
  if (xml !== ref) {
    let i = 0;
    while (xml[i] === ref[i]) i++;
    console.log('gerado:', xml.slice(Math.max(0, i - 60), i + 100));
    console.log('ref   :', ref.slice(Math.max(0, i - 60), i + 100));
  }
}
