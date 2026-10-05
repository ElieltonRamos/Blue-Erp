/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { promises as fs } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { DanfeNfeConfig } from '../../entities/nfe.entity';

// ---------- Modelo lido do XML ----------

interface DanfeItem {
  cProd: string;
  desc: string;
  ncm: string;
  cst: string;
  cstLabel: 'O/CST' | 'O/CSOSN';
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  vBC: number;
  vICMS: number;
  vIPI: number;
  pICMS: number;
  pIPI: number;
}

interface DanfeData {
  accessKey: string;
  nNF: string;
  serie: string;
  natOp: string;
  tpNF: string;
  tpAmb: string;
  dhEmi: string;
  dhSaiEnt: string;
  protocolo: string;
  emit: {
    xNome: string;
    cnpj: string;
    ie: string;
    iest: string;
    lines: string[];
  };
  dest: {
    xNome: string;
    doc: string;
    endereco: string;
    bairro: string;
    cep: string;
    municipio: string;
    fone: string;
    uf: string;
    ie: string;
  };
  itens: DanfeItem[];
  total: Record<
    | 'vBC'
    | 'vICMS'
    | 'vBCST'
    | 'vST'
    | 'vProd'
    | 'vFrete'
    | 'vSeg'
    | 'vDesc'
    | 'vOutro'
    | 'vIPI'
    | 'vNF',
    number
  >;
  transp: {
    modFrete: string;
    xNome: string;
    doc: string;
    ie: string;
    endereco: string;
    municipio: string;
    uf: string;
    placa: string;
    placaUf: string;
    antt: string;
    qVol: string;
    esp: string;
    marca: string;
    nVol: string;
    pesoB: string;
    pesoL: string;
  };
  dup: { nDup: string; dVenc: string; vDup: number }[];
  infCpl: string;
  infAdFisco: string;
}

// ---------- Formatação ----------

const FRETE_LABELS: Record<string, string> = {
  '0': '0-Remetente (CIF)',
  '1': '1-Destinatário (FOB)',
  '2': '2-Terceiros',
  '3': '3-Próprio Remetente',
  '4': '4-Próprio Destinatário',
  '9': '9-Sem Frete',
};

const decode = (t: string) =>
  t
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const s = (v: unknown): string =>
  v === undefined || v === null ? '' : decode(String(v)).trim();

const n = (v: unknown): number => {
  const x = parseFloat(s(v));
  return Number.isFinite(x) ? x : 0;
};

const arr = <T>(v: T | T[] | undefined | null): T[] =>
  v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];

function fmtNum(v: number, minDec = 2, maxDec = minDec): string {
  const [intPart, decRaw = ''] = v.toFixed(maxDec).split('.');
  let dec = decRaw;
  while (dec.length > minDec && dec.endsWith('0')) dec = dec.slice(0, -1);
  const int = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${int},${dec}` : int;
}

function fmtDoc(doc: string): string {
  const d = doc.replace(/\D/g, '');
  if (d.length === 14)
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (d.length === 11)
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return doc;
}

function fmtFone(f: string): string {
  const d = f.replace(/\D/g, '');
  if (d.length === 10)
    return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  if (d.length === 11)
    return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  return f;
}

// Datas são lidas da string, sem conversão de fuso.
const fmtDate = (iso: string) => {
  const [y, m, d] = (iso.split('T')[0] || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};
const fmtTime = (iso: string) => iso.split('T')[1]?.substring(0, 8) ?? '';
const fmtDateTime = (iso: string) =>
  iso ? `${fmtDate(iso)} ${fmtTime(iso)}`.trim() : '';

const fmtNota = (nNF: string) =>
  nNF.padStart(9, '0').replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');

const fmtKey = (k: string) => k.replace(/(\d{4})(?=\d)/g, '$1 ');

function addressLine(e: any): string {
  const base = `${s(e?.xLgr)}, ${s(e?.nro)}`;
  return s(e?.xCpl) ? `${base} ${s(e.xCpl)}` : base;
}

// ---------- Parser ----------

function parseDanfeXml(xml: string): DanfeData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: false,
    parseTagValue: false,
  });
  const parsed = parser.parse(xml);
  const proc = parsed.nfeProc;
  const nfe = proc?.NFe ?? parsed.NFe;
  const inf = nfe?.infNFe;
  if (!inf) throw new Error('XML inválido: infNFe não encontrado.');

  const prot = proc?.protNFe?.infProt;
  const ide = inf.ide ?? {};
  const emit = inf.emit ?? {};
  const ender = emit.enderEmit ?? {};
  const dest = inf.dest ?? {};
  const endD = dest.enderDest ?? {};
  const tot = inf.total?.ICMSTot ?? {};
  const transp = inf.transp ?? {};
  const tr = transp.transporta ?? {};
  const veic = transp.veicTransp ?? {};
  const vols = arr<any>(transp.vol);

  const sumVol = (k: string) => vols.reduce((a, v) => a + n(v?.[k]), 0);
  const hasVol = (k: string) => vols.some((v) => v?.[k] !== undefined);

  const itens: DanfeItem[] = arr<any>(inf.det).map((d) => {
    const p = d.prod ?? {};
    const icms: any = Object.values(d.imposto?.ICMS ?? {})[0] ?? {};
    const ipi = d.imposto?.IPI?.IPITrib ?? {};
    const code = s(icms.CSOSN || icms.CST);
    return {
      cProd: s(p.cProd),
      desc: [s(p.xProd), s(d.infAdProd)].filter(Boolean).join('\n'),
      ncm: s(p.NCM),
      cst: `${s(icms.orig)} ${code}`.trim(),
      cstLabel: icms.CSOSN ? 'O/CSOSN' : 'O/CST',
      cfop: s(p.CFOP),
      uCom: s(p.uCom),
      qCom: n(p.qCom),
      vUnCom: n(p.vUnCom),
      vProd: n(p.vProd),
      vBC: n(icms.vBC),
      vICMS: n(icms.vICMS),
      vIPI: n(ipi.vIPI),
      pICMS: n(icms.pICMS),
      pIPI: n(ipi.pIPI),
    };
  });

  const emitLines = [
    addressLine(ender),
    s(ender.xBairro),
    `${s(ender.xMun)} - ${s(ender.UF)}`,
    s(ender.fone) ? `TELEFONE: ${fmtFone(s(ender.fone))}` : '',
    s(ender.CEP)
      ? `CEP: ${s(ender.CEP).replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3')}`
      : '',
  ].filter(Boolean);

  return {
    accessKey: s(inf['@_Id']).replace(/^NFe/, ''),
    nNF: s(ide.nNF),
    serie: s(ide.serie),
    natOp: s(ide.natOp),
    tpNF: s(ide.tpNF),
    tpAmb: s(ide.tpAmb),
    dhEmi: s(ide.dhEmi),
    dhSaiEnt: s(ide.dhSaiEnt),
    protocolo: prot?.nProt
      ? `${s(prot.nProt)} - ${fmtDateTime(s(prot.dhRecbto))}`
      : '',
    emit: {
      xNome: s(emit.xNome),
      cnpj: fmtDoc(s(emit.CNPJ || emit.CPF)),
      ie: s(emit.IE),
      iest: s(emit.IEST),
      lines: emitLines,
    },
    dest: {
      xNome: s(dest.xNome),
      doc: fmtDoc(s(dest.CNPJ || dest.CPF)),
      endereco: addressLine(endD),
      bairro: s(endD.xBairro),
      cep: s(endD.CEP).replace(/^(\d{5})(\d{3})$/, '$1-$2'),
      municipio: s(endD.xMun),
      fone: fmtFone(s(endD.fone)),
      uf: s(endD.UF),
      ie: s(dest.IE),
    },
    itens,
    total: {
      vBC: n(tot.vBC),
      vICMS: n(tot.vICMS),
      vBCST: n(tot.vBCST),
      vST: n(tot.vST),
      vProd: n(tot.vProd),
      vFrete: n(tot.vFrete),
      vSeg: n(tot.vSeg),
      vDesc: n(tot.vDesc),
      vOutro: n(tot.vOutro),
      vIPI: n(tot.vIPI),
      vNF: n(tot.vNF),
    },
    transp: {
      modFrete: s(transp.modFrete),
      xNome: s(tr.xNome),
      doc: fmtDoc(s(tr.CNPJ || tr.CPF)),
      ie: s(tr.IE),
      endereco: s(tr.xEnder),
      municipio: s(tr.xMun),
      uf: s(tr.UF),
      placa: s(veic.placa),
      placaUf: s(veic.UF),
      antt: s(veic.RNTC),
      qVol: vols.length ? String(sumVol('qVol')) : '',
      esp: s(vols[0]?.esp),
      marca: s(vols[0]?.marca),
      nVol: s(vols[0]?.nVol),
      pesoB: hasVol('pesoB') ? fmtNum(sumVol('pesoB'), 3) : '',
      pesoL: hasVol('pesoL') ? fmtNum(sumVol('pesoL'), 3) : '',
    },
    dup: arr<any>(inf.cobr?.dup).map((d) => ({
      nDup: s(d.nDup),
      dVenc: s(d.dVenc),
      vDup: n(d.vDup),
    })),
    infCpl: s(inf.infAdic?.infCpl),
    infAdFisco: s(inf.infAdic?.infAdFisco),
  };
}

// ---------- Código de barras (Code 128, conjunto C) ----------

const CODE128 = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
];

/** Sequência de larguras (barra, espaço, barra...) do Code 128C para uma string de dígitos pares. */
export function code128cPattern(digits: string): string {
  const values: number[] = [105];
  for (let i = 0; i < digits.length; i += 2) {
    values.push(parseInt(digits.slice(i, i + 2), 10));
  }
  const checksum =
    values.reduce((acc, v, i) => acc + v * (i === 0 ? 1 : i), 0) % 103;
  values.push(checksum, 106);
  return values.map((v) => CODE128[v]).join('');
}

// ---------- Desenho ----------

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const W = 555;
const MX = (PAGE_W - W) / 2;
const MT = 20;
const MB = 20;

const ROW_H = 22;
const TITLE_H = 10;
const GAP = 3;
const RECEIPT_H = 48;
const HEADER_H = 96;
const PROD_HEAD_H = 18;
const LINE_H = 7;
const DUP_ROW_H = 14;
const DUP_PER_ROW = 5;
const ADIC_LINE_H = 8;
const ADIC_MAX_LINES = 60;

const BLACK = rgb(0, 0, 0);
const RED = rgb(0.8, 0, 0);

const COLS: { w: number; label: string }[] = [
  { w: 40, label: 'COD.\nPROD.' },
  { w: 129, label: 'DESCRIÇÃO DO PRODUTO/SERVIÇO' },
  { w: 40, label: 'NCM/SH' },
  { w: 26, label: '' }, // O/CST ou O/CSOSN
  { w: 24, label: 'CFOP' },
  { w: 20, label: 'UN.' },
  { w: 40, label: 'QUANT.' },
  { w: 44, label: 'VALOR\nUNIT.' },
  { w: 44, label: 'VALOR\nTOTAL' },
  { w: 38, label: 'B.CALC.\nICMS' },
  { w: 34, label: 'VALOR\nICMS' },
  { w: 32, label: 'VALOR\nIPI' },
  { w: 22, label: 'ALÍQ.\nICMS' },
  { w: 22, label: 'ALÍQ.\nIPI' },
];
const COL_X = COLS.reduce<number[]>(
  (acc, c, i) => [...acc, i === 0 ? MX : acc[i - 1] + COLS[i - 1].w],
  [],
);

type Align = 'left' | 'center' | 'right';

function clean(t: unknown): string {
  return String(t ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\n\x20-\x7E\u00A0-\u00FF]/g, '?');
}

/** Coordenadas "top" são medidas a partir do topo da página. */
class Pen {
  constructor(
    readonly page: PDFPage,
    private readonly font: PDFFont,
    private readonly bold: PDFFont,
  ) {}

  private f(b?: boolean) {
    return b ? this.bold : this.font;
  }

  width(t: string, size: number, b?: boolean) {
    return this.f(b).widthOfTextAtSize(t, size);
  }

  text(
    str: string,
    x: number,
    top: number,
    size: number,
    o: { bold?: boolean; align?: Align; w?: number; color?: any } = {},
  ) {
    const t = clean(str).replace(/\n/g, ' ');
    if (!t) return;
    const tw = this.width(t, size, o.bold);
    let px = x;
    if (o.w !== undefined && o.align === 'center') px = x + (o.w - tw) / 2;
    if (o.w !== undefined && o.align === 'right') px = x + o.w - tw;
    this.page.drawText(t, {
      x: px,
      y: PAGE_H - top,
      size,
      font: this.f(o.bold),
      color: o.color ?? BLACK,
    });
  }

  rect(x: number, top: number, w: number, h: number) {
    this.page.drawRectangle({
      x,
      y: PAGE_H - top - h,
      width: w,
      height: h,
      borderColor: BLACK,
      borderWidth: 0.6,
    });
  }

  line(x1: number, t1: number, x2: number, t2: number, dash = false) {
    this.page.drawLine({
      start: { x: x1, y: PAGE_H - t1 },
      end: { x: x2, y: PAGE_H - t2 },
      thickness: 0.5,
      color: BLACK,
      ...(dash ? { dashArray: [2, 2] } : {}),
    });
  }

  fit(str: string, size: number, maxW: number, b = false, min = 5) {
    let t = clean(str).replace(/\n/g, ' ');
    let sz = size;
    while (sz > min && this.width(t, sz, b) > maxW) sz -= 0.5;
    if (this.width(t, sz, b) > maxW) {
      while (t.length > 1 && this.width(`${t}...`, sz, b) > maxW) {
        t = t.slice(0, -1);
      }
      t += '...';
    }
    return { t, sz };
  }

  wrap(str: string, size: number, maxW: number, b = false): string[] {
    const out: string[] = [];
    for (const para of clean(str).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        let w = word;
        while (this.width(w, size, b) > maxW && w.length > 1) {
          let cut = w.length - 1;
          while (cut > 1 && this.width(w.slice(0, cut), size, b) > maxW) cut--;
          if (line) {
            out.push(line);
            line = '';
          }
          out.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        const test = line ? `${line} ${w}` : w;
        if (line && this.width(test, size, b) > maxW) {
          out.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) out.push(line);
    }
    return out;
  }

  field(
    x: number,
    top: number,
    w: number,
    h: number,
    label: string,
    value: string,
    o: { align?: Align; bold?: boolean; size?: number } = {},
  ) {
    this.rect(x, top, w, h);
    const l = this.fit(label, 5, w - 4, false, 4);
    this.text(l.t, x + 2, top + 6, l.sz);
    if (!value) return;
    const v = this.fit(value, o.size ?? 8, w - 4, o.bold, 5.5);
    this.text(v.t, x + 2, top + h - 4.5, v.sz, {
      bold: o.bold,
      align: o.align,
      w: w - 4,
    });
  }

  barcode(digits: string, x: number, top: number, w: number, h: number) {
    const pattern = code128cPattern(digits);
    const modules = [...pattern].reduce((a, c) => a + Number(c), 0);
    const unit = w / modules;
    let cx = x;
    [...pattern].forEach((c, i) => {
      const bw = Number(c) * unit;
      if (i % 2 === 0) {
        this.page.drawRectangle({
          x: cx,
          y: PAGE_H - top - h,
          width: bw,
          height: h,
          color: BLACK,
        });
      }
      cx += bw;
    });
  }
}

interface RowPlan {
  lines: string[];
  h: number;
}

interface PagePlan {
  from: number;
  to: number;
  adic: boolean;
}

interface AdicPlan {
  linesC: string[];
  linesF: string[];
  boxH: number;
}

export class DanfeNfeGenerator {
  constructor(private readonly config: DanfeNfeConfig = {}) {}

  async generateFromXml(xmlPath: string, pdfPath: string): Promise<void> {
    const xml = await fs.readFile(xmlPath, 'utf-8');
    await fs.writeFile(pdfPath, await this.generate(xml));
  }

  async generate(xml: string): Promise<Uint8Array> {
    const data = parseDanfeXml(xml);
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const logo = await this.embedLogo(pdf);

    const measure = new Pen(pdf.addPage([PAGE_W, PAGE_H]), font, bold);
    const homolog = data.tpAmb === '2';
    const topStart = MT + (homolog ? 12 : 0);

    const rows = this.planRows(measure, data);
    const adic = this.planAdic(measure, data);
    const first = this.layoutFirst(data, topStart);
    const pages = this.planPages(rows, adic, first.products, topStart);
    pdf.removePage(0);

    pages.forEach((plan, idx) => {
      const page = pdf.addPage([PAGE_W, PAGE_H]);
      const pen = new Pen(page, font, bold);
      this.drawPage(pen, data, {
        plan,
        rows,
        adic,
        logo,
        homolog,
        topStart,
        first,
        pageNo: idx + 1,
        total: pages.length,
      });
    });

    return pdf.save();
  }

  // ----- Planejamento -----

  private fatHeight(count: number) {
    return TITLE_H + Math.ceil(count / DUP_PER_ROW) * DUP_ROW_H;
  }

  private layoutFirst(data: DanfeData, topStart: number) {
    let y = topStart;
    const receipt = y;
    y += RECEIPT_H + 8;
    const header = y;
    y += HEADER_H + 2 * ROW_H + GAP;
    const dest = y;
    y += TITLE_H + 3 * ROW_H + GAP;
    const fat = y;
    if (data.dup.length) y += this.fatHeight(data.dup.length) + GAP;
    const tax = y;
    y += TITLE_H + 2 * ROW_H + GAP;
    const transp = y;
    y += TITLE_H + 3 * ROW_H + GAP;
    return { receipt, header, dest, fat, tax, transp, products: y };
  }

  private planRows(pen: Pen, data: DanfeData): RowPlan[] {
    const maxW = COLS[1].w - 4;
    return data.itens.map((it) => {
      const lines = pen.wrap(it.desc, 6, maxW);
      return { lines, h: Math.max(1, lines.length) * LINE_H + 4 };
    });
  }

  private planAdic(pen: Pen, data: DanfeData): AdicPlan {
    const linesC = pen.wrap(data.infCpl, 6.5, 395 - 6).slice(0, ADIC_MAX_LINES);
    const linesF = pen
      .wrap(data.infAdFisco, 6.5, 160 - 6)
      .slice(0, ADIC_MAX_LINES);
    const boxH = Math.max(
      70,
      Math.max(linesC.length, linesF.length) * ADIC_LINE_H + 14,
    );
    return { linesC, linesF, boxH };
  }

  private planPages(
    rows: RowPlan[],
    adic: AdicPlan,
    firstProductsTop: number,
    topStart: number,
  ): PagePlan[] {
    const bottom = PAGE_H - MB;
    const adicBlock = TITLE_H + adic.boxH + GAP;
    const nextProductsTop = topStart + HEADER_H + 2 * ROW_H + GAP;
    const pages: PagePlan[] = [];
    let i = 0;

    for (let page = 0; ; page++) {
      const productsTop = page === 0 ? firstProductsTop : nextProductsTop;
      const avail = bottom - (productsTop + TITLE_H + PROD_HEAD_H);
      const remaining = rows.slice(i).reduce((a, r) => a + r.h, 0);

      if (remaining + adicBlock <= avail) {
        pages.push({ from: i, to: rows.length, adic: true });
        break;
      }

      let used = 0;
      let j = i;
      while (j < rows.length && used + rows[j].h <= avail) {
        used += rows[j].h;
        j++;
      }
      if (j === i) j = i + 1;

      if (j >= rows.length) {
        pages.push({ from: i, to: rows.length, adic: false });
        pages.push({ from: rows.length, to: rows.length, adic: true });
        break;
      }
      pages.push({ from: i, to: j, adic: false });
      i = j;
    }
    return pages;
  }

  private async embedLogo(pdf: PDFDocument): Promise<PDFImage | undefined> {
    const b = this.config.logo;
    if (!b) return undefined;
    const isPng = b[0] === 0x89 && b[1] === 0x50;
    return isPng ? pdf.embedPng(b) : pdf.embedJpg(b);
  }

  // ----- Páginas -----

  private drawPage(
    pen: Pen,
    data: DanfeData,
    c: {
      plan: PagePlan;
      rows: RowPlan[];
      adic: AdicPlan;
      logo?: PDFImage;
      homolog: boolean;
      topStart: number;
      first: ReturnType<DanfeNfeGenerator['layoutFirst']>;
      pageNo: number;
      total: number;
    },
  ) {
    const isFirst = c.pageNo === 1;

    if (c.homolog) {
      pen.text('AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL', MX, MT + 6, 8, {
        bold: true,
        align: 'center',
        w: W,
        color: RED,
      });
    }

    let headerTop = c.topStart;
    if (isFirst) {
      this.drawReceipt(pen, data, c.first.receipt);
      headerTop = c.first.header;
    }
    this.drawHeader(pen, data, headerTop, c.pageNo, c.total, c.logo);

    let y = headerTop + HEADER_H + 2 * ROW_H + GAP;
    if (isFirst) {
      this.drawDest(pen, data, c.first.dest);
      if (data.dup.length) this.drawFatura(pen, data, c.first.fat);
      this.drawTax(pen, data, c.first.tax);
      this.drawTransp(pen, data, c.first.transp);
      y = c.first.products;
    }

    const bottom = PAGE_H - MB;
    const adicBlock = TITLE_H + c.adic.boxH;

    if (c.plan.from < c.plan.to) {
      const limit = c.plan.adic ? bottom - adicBlock - GAP : bottom;
      this.drawProducts(pen, data, c.rows, c.plan, y, limit);
      if (c.plan.adic) this.drawAdic(pen, c.adic, bottom - adicBlock);
    } else if (c.plan.adic) {
      this.drawAdic(pen, c.adic, y);
    }
  }

  private drawReceipt(pen: Pen, data: DanfeData, top: number) {
    const x = MX;
    pen.rect(x, top, 375, 24);
    const text = `RECEBEMOS DE ${data.emit.xNome} OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO`;
    pen
      .wrap(text, 5.5, 371)
      .slice(0, 3)
      .forEach((l, i) => pen.text(l, x + 2, top + 8 + i * 6.5, 5.5));
    pen.field(
      x + 375,
      top,
      80,
      24,
      'VALOR NOTA',
      `R$ ${fmtNum(data.total.vNF)}`,
      {
        align: 'right',
        bold: true,
      },
    );
    pen.field(x, top + 24, 100, 24, 'DATA DE RECEBIMENTO', '');
    pen.field(
      x + 100,
      top + 24,
      200,
      24,
      'IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR',
      '',
    );
    pen.field(x + 300, top + 24, 155, 24, 'DESTINATÁRIO', data.dest.xNome, {
      bold: true,
    });

    pen.rect(x + 455, top, 100, RECEIPT_H);
    pen.text('NF-e', x + 455, top + 14, 11, {
      bold: true,
      align: 'center',
      w: 100,
    });
    pen.text(`Nº ${fmtNota(data.nNF)}`, x + 455, top + 28, 8, {
      bold: true,
      align: 'center',
      w: 100,
    });
    pen.text(`SÉRIE: ${data.serie}`, x + 455, top + 39, 8, {
      bold: true,
      align: 'center',
      w: 100,
    });
    pen.line(MX, top + RECEIPT_H + 4, MX + W, top + RECEIPT_H + 4, true);
  }

  private drawHeader(
    pen: Pen,
    data: DanfeData,
    top: number,
    pageNo: number,
    total: number,
    logo?: PDFImage,
  ) {
    // Emitente
    const ew = 245;
    pen.rect(MX, top, ew, HEADER_H);
    let textX = MX;
    let textW = ew;
    if (logo) {
      const scale = Math.min(66 / logo.width, 80 / logo.height);
      const lw = logo.width * scale;
      const lh = logo.height * scale;
      pen.page.drawImage(logo, {
        x: MX + 4 + (66 - lw) / 2,
        y: PAGE_H - top - (HEADER_H + lh) / 2,
        width: lw,
        height: lh,
      });
      textX = MX + 72;
      textW = ew - 72;
    }
    let ty = top + 14;
    for (const l of pen.wrap(data.emit.xNome, 9, textW - 6, true).slice(0, 3)) {
      pen.text(l, textX, ty, 9, { bold: true, align: 'center', w: textW });
      ty += 10;
    }
    const extra = this.config.emitterEmail
      ? [`E-MAIL: ${this.config.emitterEmail}`]
      : [];
    for (const raw of [...data.emit.lines, ...extra]) {
      for (const l of pen.wrap(raw, 7, textW - 6)) {
        if (ty > top + HEADER_H - 4) break;
        pen.text(l, textX, ty, 7, { align: 'center', w: textW });
        ty += 8.5;
      }
    }

    // DANFE
    const dx = MX + ew;
    const dw = 95;
    pen.rect(dx, top, dw, HEADER_H);
    pen.text('DANFE', dx, top + 15, 13, { bold: true, align: 'center', w: dw });
    ['DOCUMENTO AUXILIAR', 'DA NOTA FISCAL', 'ELETRÔNICA'].forEach((l, i) =>
      pen.text(l, dx, top + 24 + i * 7, 6, {
        bold: true,
        align: 'center',
        w: dw,
      }),
    );
    pen.text('0 - ENTRADA', dx + 6, top + 51, 6.5, { bold: true });
    pen.text('1 - SAÍDA', dx + 6, top + 60, 6.5, { bold: true });
    pen.rect(dx + dw - 24, top + 44, 16, 17);
    pen.text(data.tpNF, dx + dw - 24, top + 56, 10, {
      bold: true,
      align: 'center',
      w: 16,
    });
    pen.text(`Nº ${fmtNota(data.nNF)}`, dx, top + 73, 8, {
      bold: true,
      align: 'center',
      w: dw,
    });
    pen.text(`SÉRIE: ${data.serie}`, dx, top + 82, 8, {
      bold: true,
      align: 'center',
      w: dw,
    });
    pen.text(`FOLHA: ${pageNo} de ${total}`, dx, top + 91, 7, {
      bold: true,
      align: 'center',
      w: dw,
    });

    // Código de barras + chave
    const rx = dx + dw;
    const rw = W - ew - dw;
    pen.rect(rx, top, rw, HEADER_H);
    if (/^\d{44}$/.test(data.accessKey)) {
      pen.barcode(data.accessKey, rx + 6, top + 5, rw - 12, 29);
    }
    pen.line(rx, top + 38, rx + rw, top + 38);
    pen.text('CHAVE DE ACESSO', rx + 2, top + 44, 5);
    const k = pen.fit(fmtKey(data.accessKey), 8, rw - 4, true, 6);
    pen.text(k.t, rx, top + 56, k.sz, { bold: true, align: 'center', w: rw });
    pen.line(rx, top + 62, rx + rw, top + 62);
    [
      'Consulta de autenticidade no portal nacional da NF-e',
      'www.nfe.fazenda.gov.br/portal',
      'ou no site da Sefaz Autorizadora',
    ].forEach((l, i) =>
      pen.text(l, rx, top + 72 + i * 8, 6, { align: 'center', w: rw }),
    );

    // Natureza / protocolo / IE / CNPJ
    const r1 = top + HEADER_H;
    pen.field(MX, r1, 340, ROW_H, 'NATUREZA DA OPERAÇÃO', data.natOp);
    pen.field(
      MX + 340,
      r1,
      rw,
      ROW_H,
      'PROTOCOLO DE AUTORIZAÇÃO DE USO',
      data.protocolo,
      {
        bold: true,
        align: 'center',
      },
    );
    const r2 = r1 + ROW_H;
    pen.field(MX, r2, 185, ROW_H, 'INSCRIÇÃO ESTADUAL', data.emit.ie);
    pen.field(
      MX + 185,
      r2,
      185,
      ROW_H,
      'INSCRIÇÃO ESTADUAL DO SUBST. TRIBUTÁRIO',
      data.emit.iest,
    );
    pen.field(MX + 370, r2, 185, ROW_H, 'CNPJ', data.emit.cnpj);
  }

  private drawDest(pen: Pen, data: DanfeData, top: number) {
    const d = data.dest;
    pen.text('DESTINATÁRIO/REMETENTE', MX, top + 7, 7, { bold: true });
    let y = top + TITLE_H;
    pen.field(MX, y, 330, ROW_H, 'NOME/RAZÃO SOCIAL', d.xNome);
    pen.field(MX + 330, y, 120, ROW_H, 'CNPJ/CPF', d.doc);
    pen.field(MX + 450, y, 105, ROW_H, 'DATA DA EMISSÃO', fmtDate(data.dhEmi));
    y += ROW_H;
    pen.field(MX, y, 250, ROW_H, 'ENDEREÇO', d.endereco);
    pen.field(MX + 250, y, 125, ROW_H, 'BAIRRO/DISTRITO', d.bairro);
    pen.field(MX + 375, y, 75, ROW_H, 'CEP', d.cep);
    pen.field(
      MX + 450,
      y,
      105,
      ROW_H,
      'DATA DA SAÍDA/ENTRADA',
      fmtDate(data.dhSaiEnt),
    );
    y += ROW_H;
    pen.field(MX, y, 205, ROW_H, 'MUNICÍPIO', d.municipio);
    pen.field(MX + 205, y, 120, ROW_H, 'FONE/FAX', d.fone);
    pen.field(MX + 325, y, 30, ROW_H, 'UF', d.uf);
    pen.field(MX + 355, y, 100, ROW_H, 'INSCRIÇÃO ESTADUAL', d.ie);
    pen.field(MX + 455, y, 100, ROW_H, 'HORA DA SAÍDA', fmtTime(data.dhSaiEnt));
  }

  private drawFatura(pen: Pen, data: DanfeData, top: number) {
    pen.text('FATURA', MX, top + 7, 7, { bold: true });
    pen.text('Número   Vencimento   Valor', MX + 40, top + 7, 5.5);
    const cw = W / DUP_PER_ROW;
    data.dup.forEach((d, i) => {
      const x = MX + (i % DUP_PER_ROW) * cw;
      const y = top + TITLE_H + Math.floor(i / DUP_PER_ROW) * DUP_ROW_H;
      pen.rect(x, y, cw, DUP_ROW_H);
      pen.text(
        `${d.nDup}   ${fmtDate(d.dVenc)}   ${fmtNum(d.vDup)}`,
        x + 3,
        y + 10,
        6.5,
      );
    });
  }

  private drawTax(pen: Pen, data: DanfeData, top: number) {
    const t = data.total;
    const o = { align: 'right' as Align };
    pen.text('CÁLCULO DO IMPOSTO', MX, top + 7, 7, { bold: true });
    const y1 = top + TITLE_H;
    const w1 = W / 5;
    [
      ['BASE DE CÁLCULO DO ICMS', t.vBC],
      ['VALOR DO ICMS', t.vICMS],
      ['BASE DE CÁLCULO DO ICMS ST', t.vBCST],
      ['VALOR DO ICMS SUBSTITUIÇÃO', t.vST],
      ['VALOR TOTAL DOS PRODUTOS', t.vProd],
    ].forEach(([label, v], i) =>
      pen.field(
        MX + i * w1,
        y1,
        w1,
        ROW_H,
        label as string,
        fmtNum(v as number),
        o,
      ),
    );
    const y2 = y1 + ROW_H;
    const w2 = W / 6;
    [
      ['VALOR DO FRETE', t.vFrete],
      ['VALOR DO SEGURO', t.vSeg],
      ['DESCONTO', t.vDesc],
      ['OUTRAS DESPESAS ACESSÓRIAS', t.vOutro],
      ['VALOR DO IPI', t.vIPI],
      ['VALOR TOTAL DA NOTA', t.vNF],
    ].forEach(([label, v], i) =>
      pen.field(
        MX + i * w2,
        y2,
        w2,
        ROW_H,
        label as string,
        fmtNum(v as number),
        o,
      ),
    );
  }

  private drawTransp(pen: Pen, data: DanfeData, top: number) {
    const t = data.transp;
    pen.text('TRANSPORTADOR/VOLUMES TRANSPORTADOS', MX, top + 7, 7, {
      bold: true,
    });
    let y = top + TITLE_H;
    pen.field(MX, y, 200, ROW_H, 'RAZÃO SOCIAL', t.xNome);
    pen.field(
      MX + 200,
      y,
      110,
      ROW_H,
      'FRETE',
      FRETE_LABELS[t.modFrete] ?? t.modFrete,
    );
    pen.field(MX + 310, y, 65, ROW_H, 'CÓDIGO ANTT', t.antt);
    pen.field(MX + 375, y, 75, ROW_H, 'PLACA DO VEÍCULO', t.placa);
    pen.field(MX + 450, y, 30, ROW_H, 'UF', t.placaUf);
    pen.field(MX + 480, y, 75, ROW_H, 'CNPJ/CPF', t.doc);
    y += ROW_H;
    pen.field(MX, y, 250, ROW_H, 'ENDEREÇO', t.endereco);
    pen.field(MX + 250, y, 150, ROW_H, 'MUNICÍPIO', t.municipio);
    pen.field(MX + 400, y, 35, ROW_H, 'UF', t.uf);
    pen.field(MX + 435, y, 120, ROW_H, 'INSCRIÇÃO ESTADUAL', t.ie);
    y += ROW_H;
    pen.field(MX, y, 90, ROW_H, 'QUANTIDADE', t.qVol);
    pen.field(MX + 90, y, 110, ROW_H, 'ESPÉCIE', t.esp);
    pen.field(MX + 200, y, 110, ROW_H, 'MARCA', t.marca);
    pen.field(MX + 310, y, 100, ROW_H, 'NUMERAÇÃO', t.nVol);
    pen.field(MX + 410, y, 72.5, ROW_H, 'PESO BRUTO', t.pesoB);
    pen.field(MX + 482.5, y, 72.5, ROW_H, 'PESO LÍQUIDO', t.pesoL);
  }

  private drawProducts(
    pen: Pen,
    data: DanfeData,
    rows: RowPlan[],
    plan: PagePlan,
    top: number,
    limit: number,
  ) {
    pen.text('DADOS DO PRODUTO/SERVIÇO', MX, top + 7, 7, { bold: true });
    const t0 = top + TITLE_H;
    pen.rect(MX, t0, W, limit - t0);
    pen.line(MX, t0 + PROD_HEAD_H, MX + W, t0 + PROD_HEAD_H);

    const cstLabel = data.itens[0]?.cstLabel ?? 'O/CSOSN';
    COLS.forEach((c, i) => {
      if (i > 0) pen.line(COL_X[i], t0, COL_X[i], limit);
      const label = i === 3 ? cstLabel : c.label;
      label
        .split('\n')
        .forEach((l, k) =>
          pen.text(l, COL_X[i], t0 + 7 + k * 6, 5, { align: 'center', w: c.w }),
        );
    });

    let y = t0 + PROD_HEAD_H;
    for (let i = plan.from; i < plan.to; i++) {
      const it = data.itens[i];
      const r = rows[i];
      const base = y + 8;
      const cell = (idx: number, v: string, align: Align) => {
        const f = pen.fit(v, 6, COLS[idx].w - 4, false, 4.5);
        pen.text(f.t, COL_X[idx] + 2, base, f.sz, {
          align,
          w: COLS[idx].w - 4,
        });
      };
      cell(0, it.cProd, 'left');
      r.lines.forEach((l, k) =>
        pen.text(l, COL_X[1] + 2, base + k * LINE_H, 6),
      );
      cell(2, it.ncm, 'center');
      cell(3, it.cst, 'center');
      cell(4, it.cfop, 'center');
      cell(5, it.uCom, 'center');
      cell(6, fmtNum(it.qCom, 2, 4), 'right');
      cell(7, fmtNum(it.vUnCom, 2, 5), 'right');
      cell(8, fmtNum(it.vProd), 'right');
      cell(9, fmtNum(it.vBC), 'right');
      cell(10, fmtNum(it.vICMS), 'right');
      cell(11, fmtNum(it.vIPI), 'right');
      cell(12, fmtNum(it.pICMS), 'right');
      cell(13, fmtNum(it.pIPI), 'right');
      y += r.h;
      if (i < plan.to - 1 || y < limit) pen.line(MX, y, MX + W, y, true);
    }
  }

  private drawAdic(pen: Pen, adic: AdicPlan, top: number) {
    pen.text('DADOS ADICIONAIS', MX, top + 7, 7, { bold: true });
    const y = top + TITLE_H;
    pen.rect(MX, y, 395, adic.boxH);
    pen.rect(MX + 395, y, 160, adic.boxH);
    pen.text('INFORMAÇÕES COMPLEMENTARES', MX + 2, y + 6, 5);
    pen.text('RESERVADO AO FISCO', MX + 397, y + 6, 5);
    adic.linesC.forEach((l, i) =>
      pen.text(l, MX + 3, y + 15 + i * ADIC_LINE_H, 6.5),
    );
    adic.linesF.forEach((l, i) =>
      pen.text(l, MX + 398, y + 15 + i * ADIC_LINE_H, 6.5),
    );
  }
}
