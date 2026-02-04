import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from 'generated/prisma/client.js';

import { PaginatedResponse } from 'src/common/paginated-response.js';
import { CreateExpenseDto } from 'src/expenses/dto/create-expense.dto.js';
import { ExpenseResponseDto } from './dto/response-expense.dto.js';
import { UpdateExpenseDto } from 'src/expenses/dto/update-expense.dto.js';
import { ExpenseFilters } from './entities/expense.entity.js';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private isValidDate(date?: string): boolean {
    if (!date) return false;
    return !isNaN(Date.parse(date));
  }

  private async updateDelayedExpenses(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    await this.prisma.client.expense.updateMany({
      where: {
        status: { not: 'Pago' },
        datePayment: {
          lt: today,
        },
      },
      data: {
        status: 'Atrasado',
      },
    });
  }

  async create(
    createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const { supplier, value, datePayment } = createExpenseDto;

    if (!supplier || !value || !datePayment) {
      throw new BadRequestException(
        'Campos obrigatórios: fornecedor, valor e data de pagamento',
      );
    }

    if (isNaN(value) || value <= 0) {
      throw new BadRequestException('Valor deve ser um número positivo');
    }

    if (!this.isValidDate(datePayment)) {
      throw new BadRequestException('Data inválida');
    }

    const expense = await this.prisma.client.expense.create({
      data: {
        ...createExpenseDto,
        status: 'Pendente',
        datePayment: new Date(datePayment),
      },
    });

    return new ExpenseResponseDto(expense);
  }

  private sanitizeFilters(filters: ExpenseFilters) {
    const clean = { ...filters };

    for (const key in clean) {
      if (
        clean[key] === 'undefined' ||
        clean[key] === 'null' ||
        clean[key] === ''
      ) {
        clean[key] = undefined;
      }
    }

    return clean;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters?: {
      supplier?: string;
      status?: 'Pago' | 'Pendente' | 'Atrasado';
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResponse<ExpenseResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      throw new BadRequestException('Página ou limite inválidos');
    }

    await this.updateDelayedExpenses();

    const offset = (page - 1) * limit;
    const cleanFilters = this.sanitizeFilters(filters as ExpenseFilters);

    const where: Prisma.ExpenseWhereInput = {};

    if (cleanFilters?.supplier) {
      where.supplier = {
        contains: cleanFilters.supplier,
      };
    }

    if (cleanFilters?.status) {
      where.status = cleanFilters.status;
    }

    if (
      this.isValidDate(cleanFilters?.startDate) &&
      this.isValidDate(cleanFilters?.endDate)
    ) {
      where.datePayment = {
        gte: new Date(cleanFilters.startDate),
        lte: new Date(cleanFilters.endDate),
      };
    }

    const orderBy: Prisma.ExpenseOrderByWithRelationInput = {};

    if (cleanFilters?.sortBy) {
      orderBy[cleanFilters.sortBy] =
        cleanFilters.sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.datePayment = 'asc';
    }

    const expenses = await this.prisma.client.expense.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
    });

    const total = await this.prisma.client.expense.count({
      where,
    });

    const data = expenses.map((expense) => new ExpenseResponseDto(expense));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number): Promise<ExpenseResponseDto> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const expense = await this.prisma.client.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Despesa não encontrada');
    }

    return new ExpenseResponseDto(expense);
  }

  async update(
    id: number,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const existing = await this.prisma.client.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Despesa não encontrada');
    }

    if (updateExpenseDto.value !== undefined) {
      if (isNaN(updateExpenseDto.value) || updateExpenseDto.value <= 0) {
        throw new BadRequestException('Valor deve ser positivo');
      }
    }

    if (updateExpenseDto.datePayment) {
      if (!this.isValidDate(updateExpenseDto.datePayment)) {
        throw new BadRequestException('Data inválida');
      }
    }

    const expense = await this.prisma.client.expense.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        datePayment: updateExpenseDto.datePayment
          ? new Date(updateExpenseDto.datePayment)
          : undefined,
      },
    });

    return new ExpenseResponseDto(expense);
  }

  async remove(id: number): Promise<{ message: string }> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const expense = await this.prisma.client.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Despesa não encontrada');
    }

    await this.prisma.client.expense.delete({
      where: { id },
    });

    return {
      message: 'Despesa removida com sucesso',
    };
  }

  async getReport(
    startDate: string,
    endDate: string,
  ): Promise<{
    totalValue: number;
    totalByStatus: {
      pago: number;
      pendente: number;
      atrasado: number;
    };
    totalBySupplier: {
      supplier: string;
      total: number;
    }[];
  }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('Informe as datas para o relatório');
    }

    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new BadRequestException('Datas inválidas');
    }

    const expenses = await this.prisma.client.expense.findMany({
      where: {
        datePayment: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    let totalValue = 0;

    const totalByStatus = {
      pago: 0,
      pendente: 0,
      atrasado: 0,
    };

    const supplierMap: Record<string, number> = {};

    for (const expense of expenses) {
      const amount = Number(expense.value);

      totalValue += amount;

      const key = expense.status?.toLowerCase() as keyof typeof totalByStatus;

      if (key in totalByStatus) {
        totalByStatus[key] += amount;
      }

      if (expense.supplier) {
        supplierMap[expense.supplier] =
          (supplierMap[expense.supplier] || 0) + amount;
      }
    }

    const totalBySupplier = Object.entries(supplierMap).map(
      ([supplier, total]) => ({
        supplier,
        total,
      }),
    );

    return {
      totalValue,
      totalByStatus,
      totalBySupplier,
    };
  }
}
