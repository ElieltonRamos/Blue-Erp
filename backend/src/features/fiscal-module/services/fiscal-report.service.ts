import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { PrismaService } from 'src/database/prisma.service';
import { StorageService } from './storage.service';
import { DanfeGenerator } from '../lib/danfe/nfce-danfe-generator';
import { DanfeNfeGenerator } from '../lib/danfe/nfe-danfe-generator';
import { modelFromAccessKey } from '../lib/nfe-utils';
import { FiscalNotFoundException } from '../fiscal.exception';
import { ListFiscalDto } from '../dto/list-fiscal.dto';
import { RevenueReportQueryDto } from '../dto/revenue-report-query.dto';
import { CompanyService } from 'src/features/company/company.service';

const CFOP_DESCRIPTIONS: Record<string, string> = {
  '5101': 'Venda de produção própria',
  '5102': 'Venda de mercadoria adquirida para revenda',
  '5405': 'Venda com ICMS ST retido anteriormente',
};

@Injectable()
export class FiscalReportsService {
  private readonly logger = new Logger(FiscalReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly storageService: StorageService,
  ) {}

  private modelWhere(model?: string) {
    if (model === '55') return { fiscalModel: '55' };
    if (model === '65') {
      return { OR: [{ fiscalModel: '65' }, { fiscalModel: null }] };
    }
    return {};
  }

  async list(dto: ListFiscalDto) {
    const where: any = {
      ...this.modelWhere(dto.model),
      fiscalKey: { not: null },
    };

    if (dto.status) {
      where.fiscalStatus = dto.status;
    }

    if (dto.startDate || dto.endDate) {
      where.fiscalEmitDate = {};
      if (dto.startDate) {
        where.fiscalEmitDate.gte = new Date(`${dto.startDate}T00:00:00-03:00`);
      }
      if (dto.endDate) {
        where.fiscalEmitDate.lte = new Date(`${dto.endDate}T23:59:59-03:00`);
      }
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.sale.findMany({
        where,
        orderBy: { fiscalEmitDate: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fiscalModel: true,
          fiscalKey: true,
          fiscalProtocol: true,
          fiscalStatus: true,
          fiscalEmitDate: true,
          total: true,
          date: true,
          payments: { select: { method: true, amount: true } },
          client: { select: { name: true } },
        },
      }),
      this.prisma.client.sale.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async downloadXml(
    saleId: number,
  ): Promise<{ xmlPath: string; filename: string }> {
    const sale = await this.prisma.client.sale.findUnique({
      where: { id: saleId },
      select: {
        fiscalKey: true,
        fiscalEmitDate: true,
        fiscalXml: true,
      },
    });

    if (!sale?.fiscalKey || !sale.fiscalEmitDate) {
      throw new FiscalNotFoundException(`Venda ${saleId}`);
    }

    const paths = this.storageService.getStoragePaths(
      sale.fiscalKey,
      sale.fiscalEmitDate,
    );
    const prefix = modelFromAccessKey(sale.fiscalKey) === '55' ? 'nfe' : 'nfce';
    const filename = `${prefix}-${sale.fiscalKey}.xml`;

    if (this.storageService.fileExists(paths.xmlPath)) {
      return { xmlPath: paths.xmlPath, filename };
    }

    if (sale.fiscalXml) {
      await this.storageService.saveXml(paths.xmlPath, sale.fiscalXml);
      this.logger.log(`XML restaurado do banco para chave ${sale.fiscalKey}`);
      return { xmlPath: paths.xmlPath, filename };
    }

    throw new NotFoundException(`XML não encontrado para a venda ${saleId}`);
  }

  async reprintPdf(
    saleId: number,
  ): Promise<{ pdfPath: string; filename: string }> {
    const sale = await this.prisma.client.sale.findUnique({
      where: { id: saleId },
      select: {
        fiscalKey: true,
        fiscalEmitDate: true,
        fiscalXml: true,
      },
    });

    if (!sale?.fiscalKey || !sale.fiscalEmitDate) {
      throw new FiscalNotFoundException(`Venda ${saleId}`);
    }

    const paths = this.storageService.getStoragePaths(
      sale.fiscalKey,
      sale.fiscalEmitDate,
    );
    const isNfe = modelFromAccessKey(sale.fiscalKey) === '55';
    const filename = `${isNfe ? 'nfe' : 'nfce'}-${sale.fiscalKey}.pdf`;

    if (!paths.pdfPath) {
      throw new NotFoundException(
        `Caminho de PDF inválido para a venda ${saleId}`,
      );
    }

    const pdfPath: string = paths.pdfPath;

    if (this.storageService.fileExists(pdfPath)) {
      this.logger.log(`PDF encontrado em disco para chave ${sale.fiscalKey}`);
      return { pdfPath, filename };
    }

    if (!sale.fiscalXml) {
      throw new NotFoundException(
        `XML não disponível para regenerar PDF da venda ${saleId}`,
      );
    }

    this.logger.log(
      `PDF não encontrado em disco — regenerando para chave ${sale.fiscalKey}`,
    );

    const company = await this.companyService.getCompany();

    if (isNfe) {
      const danfe = new DanfeNfeGenerator({
        emitterEmail: company.email ?? undefined,
      });
      await fs.writeFile(pdfPath, await danfe.generate(sale.fiscalXml));
      return { pdfPath, filename };
    }

    const danfe = new DanfeGenerator({
      csc: company.nfceCsc,
      idCSC: company.nfceCscId,
      widthMM: 80,
    });

    const { nfeData, accessKey, totals, qrCodeUrl, urlChave } = danfe.parseXml(
      sale.fiscalXml,
    );

    await danfe.generateDanfe(
      nfeData,
      accessKey,
      totals,
      qrCodeUrl,
      urlChave,
      pdfPath,
    );

    return { pdfPath, filename };
  }

  async getRevenueReport(dto: RevenueReportQueryDto) {
    const { month, year } = dto;
    const start = new Date(`${year}-${month}-01T00:00:00-03:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const sales = await this.prisma.client.sale.findMany({
      where: {
        ...this.modelWhere(dto.model),
        fiscalStatus: { in: ['EMITIDA', 'CANCELADA'] },
        fiscalEmitDate: { gte: start, lt: end },
      },
      select: {
        fiscalStatus: true,
        total: true,
        cfop: true,
        items: {
          select: {
            cfop: true,
            totalPrice: true,
            product: { select: { ncm: true } },
          },
        },
      },
    });

    const emitted = sales.filter((s) => s.fiscalStatus === 'EMITIDA');
    const canceled = sales.filter((s) => s.fiscalStatus === 'CANCELADA');

    const totalRevenue = emitted.reduce((acc, s) => acc + Number(s.total), 0);
    const canceledValue = canceled.reduce((acc, s) => acc + Number(s.total), 0);

    const cfopMap = new Map<string, { totalValue: number; count: number }>();
    for (const sale of emitted) {
      for (const item of sale.items) {
        const cfop = item.cfop ?? sale.cfop ?? '5102';
        const entry = cfopMap.get(cfop) ?? { totalValue: 0, count: 0 };
        entry.totalValue += Number(item.totalPrice);
        entry.count += 1;
        cfopMap.set(cfop, entry);
      }
    }

    const byCfop = Array.from(cfopMap.entries()).map(([cfop, data]) => ({
      cfop,
      description: CFOP_DESCRIPTIONS[cfop] ?? cfop,
      totalValue: data.totalValue,
      count: data.count,
    }));

    const ncmMap = new Map<string, { totalValue: number; count: number }>();
    for (const sale of emitted) {
      for (const item of sale.items) {
        const ncm = item.product?.ncm ?? '00000000';
        const entry = ncmMap.get(ncm) ?? { totalValue: 0, count: 0 };
        entry.totalValue += Number(item.totalPrice);
        entry.count += 1;
        ncmMap.set(ncm, entry);
      }
    }

    const byNcm = Array.from(ncmMap.entries()).map(([ncm, data]) => ({
      ncm,
      totalValue: data.totalValue,
      count: data.count,
    }));

    return {
      period: `${year}-${month}`,
      totalRevenue,
      totalNotes: emitted.length,
      canceledNotes: canceled.length,
      canceledValue,
      byCfop,
      byNcm,
    };
  }

  async exportCsv(dto: RevenueReportQueryDto): Promise<string> {
    const report = await this.getRevenueReport(dto);

    const lines: string[] = [];

    lines.push(`Relatório Fiscal — ${dto.month}/${dto.year}`);
    lines.push('');
    lines.push(`Receita Bruta;${report.totalRevenue.toFixed(2)}`);
    lines.push(`Notas Emitidas;${report.totalNotes}`);
    lines.push(`Notas Canceladas;${report.canceledNotes}`);
    lines.push(`Valor Cancelado;${report.canceledValue.toFixed(2)}`);
    lines.push('');

    lines.push('Por CFOP');
    lines.push('CFOP;Descrição;Qtd. Itens;Total (R$)');
    for (const row of report.byCfop) {
      lines.push(
        `${row.cfop};${row.description};${row.count};${row.totalValue.toFixed(2)}`,
      );
    }
    lines.push('');

    lines.push('Por NCM');
    lines.push('NCM;Qtd. Itens;Total (R$)');
    for (const row of report.byNcm) {
      lines.push(`${row.ncm};${row.count};${row.totalValue.toFixed(2)}`);
    }

    return lines.join('\n');
  }
}
