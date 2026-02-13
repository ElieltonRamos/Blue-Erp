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
    operator: {
      select: {
        username: true;
      };
    };
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            price: true;
          };
        };
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
        operator: {
          select: {
            username: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  private initializeAggregators() {
    return {
      totalSales: 0,
      grossRevenue: 0,
      grossProfit: 0,
      totalDiscounts: 0,
      salesByPaymentMethod: { pix: 0, cash: 0, card: 0, promissoryNote: 0 },
      salesByOperator: {} as Record<
        string,
        {
          operator: string;
          totalSales: number;
          revenue: number;
          paymentBreakdown: Record<
            'pix' | 'cash' | 'card' | 'promissoryNote',
            number
          >;
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
    const method = normalizePaymentMethod(sale.paymentMethod);
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
    processPaymentAggregation(
      method,
      total,
      salesByPaymentMethod,
      opData.paymentBreakdown,
    );
  }

  private buildResponse(
    aggregators: ReturnType<typeof this.initializeAggregators>,
  ) {
    return {
      totalSales: aggregators.totalSales,
      grossRevenue: Number(aggregators.grossRevenue.toFixed(2)),
      grossProfit: Number(aggregators.grossProfit.toFixed(2)),
      totalDiscounts: Number(aggregators.totalDiscounts.toFixed(2)),

      salesByPaymentMethod: {
        pix: Number(aggregators.salesByPaymentMethod.pix.toFixed(2)),
        cash: Number(aggregators.salesByPaymentMethod.cash.toFixed(2)),
        card: Number(aggregators.salesByPaymentMethod.card.toFixed(2)),
        promissoryNote: Number(
          aggregators.salesByPaymentMethod.promissoryNote.toFixed(2),
        ),
      },
      salesByOperator: Object.values(aggregators.salesByOperator).map((op) => ({
        operator: op.operator,
        totalSales: op.totalSales,
        revenue: Number(op.revenue.toFixed(2)),
        paymentBreakdown: {
          pix: Number(op.paymentBreakdown.pix.toFixed(2)),
          cash: Number(op.paymentBreakdown.cash.toFixed(2)),
          card: Number(op.paymentBreakdown.card.toFixed(2)),
          promissoryNote: Number(op.paymentBreakdown.promissoryNote.toFixed(2)),
        },
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
