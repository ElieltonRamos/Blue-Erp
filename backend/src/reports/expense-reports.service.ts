import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ExpenseReportFilterDto } from './dto/create-report-expense.dto';
import { ExpenseReportResponseDto } from './dto/response-report-expense.dto';
import { validateDateFilters } from './utils/sale-report-utils';

@Injectable()
export class ExpenseReportService {
  constructor(private prisma: PrismaService) {}

  private getStartOfDay(dateString: string): Date {
    return new Date(dateString + ' 00:00:00');
  }

  private getEndOfDay(dateString: string): Date {
    return new Date(dateString + ' 23:59:59.999');
  }

  async generateExpenseReport(
    filters: ExpenseReportFilterDto,
  ): Promise<ExpenseReportResponseDto> {
    const validation = validateDateFilters(
      filters as { startDate: string; endDate: string },
    );
    if (validation) return validation;

    try {
      const expenses = await this.prisma.client.expense.findMany({
        where: {
          datePayment: {
            gte: this.getStartOfDay(filters.startDate),
            lte: this.getEndOfDay(filters.endDate),
          },
          deletedAt: null,
        },
        select: {
          value: true,
          status: true,
          supplier: true,
        },
      });

      const totalByStatus = { pago: 0, pendente: 0, atrasado: 0 };
      const supplierMap = new Map<string, number>();
      let totalValue = 0;

      for (const expense of expenses) {
        const value = Number(expense.value);
        totalValue += value;

        const status = expense.status.toLowerCase();
        if (status === 'pago') totalByStatus.pago += value;
        else if (status === 'pendente') totalByStatus.pendente += value;
        else if (status === 'atrasado') totalByStatus.atrasado += value;

        const current = supplierMap.get(expense.supplier) ?? 0;
        supplierMap.set(expense.supplier, current + value);
      }

      const totalBySupplier = Array.from(supplierMap.entries())
        .map(([supplier, total]) => ({
          supplier,
          total: Number(total.toFixed(2)),
        }))
        .sort((a, b) => b.total - a.total);

      return {
        status: 'OK',
        data: {
          totalValue: Number(totalValue.toFixed(2)),
          totalByStatus: {
            pago: Number(totalByStatus.pago.toFixed(2)),
            pendente: Number(totalByStatus.pendente.toFixed(2)),
            atrasado: Number(totalByStatus.atrasado.toFixed(2)),
          },
          totalBySupplier,
        },
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de despesas:', error);
      throw new InternalServerErrorException(
        'Erro interno do servidor ao gerar relatório de despesas',
      );
    }
  }
}
