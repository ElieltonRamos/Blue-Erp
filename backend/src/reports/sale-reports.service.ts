/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  normalizePaymentMethod,
  validateDateFilters,
  processOperatorAggregation,
  processPaymentAggregation,
} from './utils/sale-report-utils';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { SalesReportResponseDto } from './dto/response-report-sale.dto';
import { SalesReportFilterDto } from './dto/create-report-sale.dto';

type SaleWithIncludes = Prisma.SaleGetPayload<{
  include: {
    operator: { select: { username: true } };
    payments: true;
    items: {
      include: {
        product: { select: { id: true; name: true; price: true } };
      };
    };
  };
}>;

@Injectable()
export class SalesReportService {
  constructor(private prisma: PrismaService) {}

  private getStartOfDayBrasilia(dateString: string): Date {
    const date = new Date(dateString + ' 00:00:00');
    return date;
  }

  private getEndOfDayBrasilia(dateString: string): Date {
    const date = new Date(dateString + ' 23:59:59.999');
    return date;
  }

  private async fetchSalesData(
    startDate: string,
    endDate: string,
  ): Promise<SaleWithIncludes[]> {
    return await this.prisma.client.sale.findMany({
      where: {
        date: {
          gte: this.getStartOfDayBrasilia(startDate),
          lte: this.getEndOfDayBrasilia(endDate),
        },
      },
      include: {
        operator: { select: { username: true } },
        payments: true,
        items: {
          include: {
            product: { select: { id: true, name: true, price: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  private initializeAggregators() {
    return {
      totalSales: 0,
      grossRevenue: 0,
      grossProfit: 0,
      totalDiscounts: 0,
      salesByPaymentMethod: {
        dinheiro: 0,
        cartaoCredito: 0,
        cartaoDebito: 0,
        pix: 0,
        creditoLoja: 0,
      },
      salesByOperator: {} as Record<
        string,
        {
          operator: string;
          totalSales: number;
          revenue: number;
          paymentBreakdown: {
            dinheiro: number;
            cartaoCredito: number;
            cartaoDebito: number;
            pix: number;
            creditoLoja: number;
          };
        }
      >,
    };
  }

  private processSale(
    sale: SaleWithIncludes,
    aggregators: ReturnType<typeof this.initializeAggregators>,
  ) {
    const { salesByPaymentMethod, salesByOperator } = aggregators;
    const operatorName = sale.operator?.username || 'Desconhecido';
    const total = Number(sale.total);
    const discount = Number(sale.discount ?? 0);
    const profitSale = Number(sale.profitSale ?? 0);

    aggregators.totalSales++;
    aggregators.grossRevenue += total;
    aggregators.totalDiscounts += discount;
    aggregators.grossProfit += profitSale;

    const opData = processOperatorAggregation(
      operatorName,
      total,
      salesByOperator,
    );

    for (const payment of sale.payments) {
      const method = normalizePaymentMethod(payment.method);
      const netAmount = Number(payment.amount) - Number(payment.change);
      processPaymentAggregation(
        method,
        netAmount,
        salesByPaymentMethod,
        opData.paymentBreakdown,
      );
    }
  }

  private buildResponse(
    aggregators: ReturnType<typeof this.initializeAggregators>,
  ) {
    const fmt = (v: number) => Number(v.toFixed(2));
    const fmtBreakdown = (b: typeof aggregators.salesByPaymentMethod) => ({
      dinheiro: fmt(b.dinheiro),
      cartaoCredito: fmt(b.cartaoCredito),
      cartaoDebito: fmt(b.cartaoDebito),
      pix: fmt(b.pix),
      creditoLoja: fmt(b.creditoLoja),
    });

    return {
      totalSales: aggregators.totalSales,
      grossRevenue: fmt(aggregators.grossRevenue),
      grossProfit: fmt(aggregators.grossProfit),
      totalDiscounts: fmt(aggregators.totalDiscounts),
      salesByPaymentMethod: fmtBreakdown(aggregators.salesByPaymentMethod),
      salesByOperator: Object.values(aggregators.salesByOperator).map((op) => ({
        operator: op.operator,
        totalSales: op.totalSales,
        revenue: fmt(op.revenue),
        paymentBreakdown: fmtBreakdown(op.paymentBreakdown),
      })),
    };
  }

  async generateReportByDate(
    filters: SalesReportFilterDto,
  ): Promise<SalesReportResponseDto> {
    const validation = validateDateFilters(filters);
    if (validation) return validation;

    try {
      const allSales = await this.fetchSalesData(
        filters.startDate,
        filters.endDate,
      );

      const aggregators = this.initializeAggregators();

      for (const sale of allSales) {
        this.processSale(sale, aggregators);
      }

      const data = this.buildResponse(aggregators);
      return { status: 'OK', data };
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error);
      throw new InternalServerErrorException(
        'Erro interno do servidor ao gerar relatório',
      );
    }
  }
}
