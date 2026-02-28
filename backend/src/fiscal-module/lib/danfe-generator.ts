/* eslint-disable @typescript-eslint/no-unused-expressions */
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { XMLParser } from 'fast-xml-parser';
import { promises as fs } from 'fs';
import QRCode from 'qrcode';
import {
  NFeOptions,
  DanfeConfig,
  DanfeTotals,
} from '../entities/fiscal-module.entity';

const PAYMENT_LABELS: Record<string, string> = {
  '01': 'Dinheiro',
  '02': 'Cheque',
  '03': 'Cartão de Crédito',
  '04': 'Cartão de Débito',
  '05': 'Crédito Loja',
  '10': 'Vale Alimentação',
  '11': 'Vale Refeição',
  '12': 'Vale Presente',
  '13': 'Vale Combustível',
  '15': 'Boleto Bancário',
  '17': 'PIX',
  '90': 'Sem Pagamento',
  '99': 'Outros',
};

interface ParsedNfe {
  nfeData: NFeOptions;
  accessKey: string;
  totals: DanfeTotals;
  qrCodeUrl: string;
  urlChave: string;
}

export class DanfeGenerator {
  private readonly config: DanfeConfig;

  constructor(config: DanfeConfig) {
    this.config = config;
  }

  async generateDanfe(
    nfeData: NFeOptions,
    accessKey: string,
    totals: DanfeTotals,
    qrCodeUrl: string,
    urlChave: string,
    outputPath: string,
  ): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const widthPt = this.config.widthMM * 2.8346;
    const pageHeight = 600 + nfeData.produtos.length * 25;
    const page = pdfDoc.addPage([widthPt, pageHeight]);

    const ctx: DrawContext = { page, font, widthPt, y: pageHeight - 20 };

    this.drawTitle(ctx);
    this.drawEmitter(ctx, nfeData);
    this.drawInvoiceInfo(ctx, nfeData);
    this.drawProducts(ctx, nfeData);
    this.drawTotals(ctx, nfeData, totals);
    this.drawPayment(ctx, nfeData);
    this.drawAccessKey(ctx, nfeData, accessKey, urlChave);
    this.drawConsumer(ctx, nfeData);
    await this.drawQrCode(ctx, pdfDoc, qrCodeUrl);
    this.drawTaxInfo(ctx, nfeData);

    await fs.writeFile(outputPath, await pdfDoc.save());
  }

  async generateFromXml(xmlPath: string, pdfPath: string): Promise<void> {
    const xml = await fs.readFile(xmlPath, 'utf-8');
    const { nfeData, accessKey, totals, qrCodeUrl, urlChave } =
      this.parseXml(xml);
    await this.generateDanfe(
      nfeData,
      accessKey,
      totals,
      qrCodeUrl,
      urlChave,
      pdfPath,
    );
  }

  // --- Drawing sections ---

  private drawTitle(ctx: DrawContext): void {
    this.drawCenter(ctx, 'Documento Auxiliar da Nota Fiscal', 8);
    this.drawCenter(ctx, 'de Consumidor Eletrônica', 8);
    ctx.y -= 6;
  }

  private drawEmitter(ctx: DrawContext, data: NFeOptions): void {
    this.drawWrapped(ctx, data.emit.xNome, 9, true);
    this.drawCenter(ctx, `CNPJ: ${this.formatCnpj(data.emit.CNPJ)}`, 9);
    const addr = data.emit.enderEmit;
    this.drawWrapped(
      ctx,
      `${addr.xLgr}, ${addr.nro} - ${addr.xBairro}, ${addr.xMun}/${addr.UF}`,
      8,
      true,
    );
    ctx.y -= 6;
  }

  private drawInvoiceInfo(ctx: DrawContext, data: NFeOptions): void {
    this.drawLeft(ctx, `Número: ${data.ide.nNF} Série: ${data.ide.serie}`, 8);
    this.drawLeft(ctx, `Data Emissão: ${formatDisplayDate(data.ide.dhEmi)}`, 8);
    ctx.y -= 10;
  }

  private drawProducts(ctx: DrawContext, data: NFeOptions): void {
    this.drawCenter(ctx, 'ITENS DA NOTA', 9);
    this.drawSeparator(ctx);

    for (const p of data.produtos) {
      const total = p.qCom * p.vUnCom;
      this.drawWrapped(ctx, p.xProd, 8, false);
      this.drawText(
        ctx,
        `${p.qCom} x R$ ${p.vUnCom.toFixed(2)} = R$ ${total.toFixed(2)}`,
        10,
        8,
      );
      ctx.y -= 3;
    }

    this.drawSeparator(ctx);
  }

  private drawTotals(
    ctx: DrawContext,
    data: NFeOptions,
    totals: DanfeTotals,
  ): void {
    ctx.y -= 4;
    this.drawLeft(ctx, `Qtd. total de itens: ${data.produtos.length}`, 8);
    this.drawLeft(ctx, `Valor total R$: ${totals.productValue.toFixed(2)}`, 8);
    this.drawLeft(ctx, `Descontos R$: ${totals.discountValue.toFixed(2)}`, 8);
    this.drawLeft(ctx, `Valor a Pagar R$: ${totals.totalValue.toFixed(2)}`, 9);
    ctx.y -= 8;
  }

  private drawPayment(ctx: DrawContext, data: NFeOptions): void {
    this.drawLeft(ctx, 'FORMA DE PAGAMENTO', 9);
    const label = PAYMENT_LABELS[data.pag.tPag] || 'Outros';
    this.drawLeft(
      ctx,
      `${label} ............ R$ ${data.pag.vPag.toFixed(2)}`,
      8,
    );
    ctx.y -= 8;
  }

  private drawAccessKey(
    ctx: DrawContext,
    data: NFeOptions,
    accessKey: string,
    urlChave: string,
  ): void {
    this.drawCenter(ctx, 'Consulte pela Chave de Acesso em', 8);
    this.drawWrapped(ctx, urlChave, 7, true);
    this.drawLeft(ctx, 'Chave de Acesso:', 8);

    if (accessKey) {
      this.drawCenter(ctx, accessKey.replace(/(\d{4})(?=\d)/g, '$1 '), 7);
    }

    this.drawCenter(ctx, `NFC-e nº ${data.ide.nNF} Série ${data.ide.serie}`, 8);
    this.drawCenter(ctx, `Emissão: ${formatDisplayDate(data.ide.dhEmi)}`, 8);
    this.drawCenter(ctx, 'Via consumidor', 8);
    ctx.y -= 12;
  }

  private drawConsumer(ctx: DrawContext, data: NFeOptions): void {
    this.drawWrapped(ctx, `CONSUMIDOR: ${data.dest.xNome}`, 8, false);

    if (data.dest.CPF) {
      this.drawLeft(ctx, `CPF: ${this.formatCpf(data.dest.CPF)}`, 8);
    }

    const addr = data.dest.enderDest;
    if (addr?.xLgr) {
      this.drawWrapped(
        ctx,
        `${addr.xLgr}, ${addr.nro} - ${addr.xBairro}, ${addr.xMun}/${addr.UF}`,
        7,
        false,
      );
    }
  }

  private async drawQrCode(
    ctx: DrawContext,
    pdfDoc: PDFDocument,
    qrCodeUrl: string,
  ): Promise<void> {
    ctx.y -= 95;

    const qrBuffer = await QRCode.toBuffer(qrCodeUrl, { width: 90 });
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    ctx.page.drawImage(qrImage, {
      x: (ctx.widthPt - 90) / 2,
      y: ctx.y,
      width: 90,
      height: 90,
    });
  }

  private drawTaxInfo(ctx: DrawContext, data: NFeOptions): void {
    ctx.y -= 10;
    this.drawCenter(ctx, 'Tributos Totais Incidentes (Lei 12.741/2012)', 7);

    if (data.infAdic) {
      this.drawWrapped(ctx, data.infAdic, 7, true);
    }
  }

  // --- Drawing helpers ---

  private drawText(
    ctx: DrawContext,
    text: string,
    x: number,
    size: number,
  ): void {
    const safe = text ?? '';
    ctx.page.drawText(safe, {
      x,
      y: ctx.y,
      size,
      font: ctx.font,
      color: rgb(0, 0, 0),
    });
    ctx.y -= size + 3;
  }

  private drawLeft(ctx: DrawContext, text: string, size: number): void {
    this.drawText(ctx, text, 5, size);
  }

  private drawCenter(ctx: DrawContext, text: string, size: number): void {
    const safe = text ?? '';
    const w = ctx.font.widthOfTextAtSize(safe, size);
    ctx.page.drawText(safe, {
      x: (ctx.widthPt - w) / 2,
      y: ctx.y,
      size,
      font: ctx.font,
      color: rgb(0, 0, 0),
    });
    ctx.y -= size + 3;
  }

  private drawWrapped(
    ctx: DrawContext,
    text: string,
    size: number,
    center: boolean,
  ): void {
    if (!text) return;
    const maxWidth = ctx.widthPt - 10;
    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.font.widthOfTextAtSize(test, size) > maxWidth && line) {
        center
          ? this.drawCenter(ctx, line, size)
          : this.drawLeft(ctx, line, size);
        line = word;
      } else {
        line = test;
      }
    }

    if (line) {
      center
        ? this.drawCenter(ctx, line, size)
        : this.drawLeft(ctx, line, size);
    }
  }

  private drawSeparator(ctx: DrawContext): void {
    this.drawCenter(ctx, '-----------------------------------------------', 8);
  }

  // --- Utilities ---

  private formatCnpj(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '').padStart(14, '0');
    return clean.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  private formatCpf(cpf: string): string {
    const clean = cpf.replace(/\D/g, '').padStart(11, '0');
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  parseXml(xml: string): ParsedNfe {
    const parser = new XMLParser({
      ignoreAttributes: false,
      processEntities: false,
    });
    const parsed = parser.parse(xml);

    const nfe = parsed.nfeProc?.NFe || parsed.NFe;
    const inf = nfe?.infNFe;
    const infSupl = nfe?.infNFeSupl;

    const s = (v: any) => String(v || '');

    const qrCodeRaw = s(infSupl?.qrCode);
    const qrCodeUrl = qrCodeRaw
      .replace('<![CDATA[', '')
      .replace(']]>', '')
      .trim();

    const urlChave = s(infSupl?.urlChave);

    const produtos = (Array.isArray(inf.det) ? inf.det : [inf.det]).map(
      (item: any) => ({
        nItem: parseInt(s(item['@_nItem'])),
        cProd: s(item.prod.cProd),
        xProd: s(item.prod.xProd),
        ncm: s(item.prod.NCM),
        cfop: s(item.prod.CFOP),
        uCom: s(item.prod.uCom),
        qCom: parseFloat(s(item.prod.qCom)),
        vUnCom: parseFloat(s(item.prod.vUnCom)),
        indTot: parseInt(s(item.prod.indTot)) || 1,
        uTrib: s(item.prod.uTrib || item.prod.uCom),
        qTrib: parseFloat(s(item.prod.qTrib || item.prod.qCom)),
        vUnTrib: parseFloat(s(item.prod.vUnTrib || item.prod.vUnCom)),
        csosn: s(item.imposto?.ICMS?.ICMSSN102?.CSOSN || '102'),
        origem: parseInt(s(item.imposto?.ICMS?.ICMSSN102?.orig || '0')),
        aliqFederal: 0,
        aliqEstadual: 0,
        aliqMunicipal: 0,
        vTotTrib: null,
        pisCst: s(item.imposto?.PIS?.PISOutr?.CST || '49'),
        cofinsCst: s(item.imposto?.COFINS?.COFINSOutr?.CST || '49'),
        iiValor: 0,
        iofValor: 0,
      }),
    );

    return {
      nfeData: {
        ide: inf.ide,
        emit: inf.emit,
        dest: {
          xNome: s(inf.dest?.xNome),
          CPF: inf.dest?.CPF ? s(inf.dest.CPF) : undefined,
          enderDest: inf.dest?.enderDest || {},
          indIEDest: s(inf.dest?.indIEDest || '9'),
        },
        produtos,
        pag: {
          indPag: s(inf.pag?.detPag?.indPag),
          tPag: s(inf.pag?.detPag?.tPag),
          vPag: parseFloat(s(inf.pag?.detPag?.vPag || '0')),
        },
        infAdic: inf.infAdic?.infCpl ? s(inf.infAdic.infCpl) : undefined,
        csc: {
          csc: this.config.csc,
          idCSC: this.config.idCSC,
        },
      },
      accessKey: s(inf['@_Id']).replace('NFe', ''),
      totals: {
        productValue: parseFloat(s(inf.total?.ICMSTot?.vProd || '0')),
        discountValue: parseFloat(s(inf.total?.ICMSTot?.vDesc || '0')),
        totalValue: parseFloat(s(inf.total?.ICMSTot?.vNF || '0')),
      },
      qrCodeUrl,
      urlChave,
    };
  }
}

interface DrawContext {
  page: PDFPage;
  font: PDFFont;
  widthPt: number;
  y: number;
}

function formatDisplayDate(isoDate: string): string {
  // Extrai diretamente da string sem converter timezone
  const [datePart, timePart] = isoDate.split('T');
  const [year, month, day] = datePart.split('-');
  const time = timePart.substring(0, 8); // HH:MM:SS
  return `${day}/${month}/${year} ${time}`;
}
