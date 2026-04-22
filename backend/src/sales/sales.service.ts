/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  Prisma,
  FiscalStatus,
  OrderStatus,
} from '../../generated/prisma/client.js';
import { Decimal } from '@prisma/client/runtime/client';
import { CreateSaleDto, CreateSalePaymentDto } from './dto/create-sale.dto.js';
import { UpdateSaleDto } from './dto/update-sale.dto.js';
import {
  PaginatedSalesResponseDto,
  SaleResponseDto,
} from './dto/response-sale.dto.js';
import { SaleFiltersDto } from './dto/filters-sale.dto.js';
import { ConvertOrderToSaleDto } from '../orders/dto/convert-order-to-sale.js';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private getBrasiliaTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + -3 * 60 * 60 * 1000);
  }

  private getStartOfDayBrasilia(dateString: string): Date {
    return new Date(`${dateString}T00:00:00-03:00`);
  }

  private getEndOfDayBrasilia(dateString: string): Date {
    return new Date(`${dateString}T23:59:59-03:00`);
  }

  private validatePayments(
    payments: CreateSalePaymentDto[],
    total: Decimal,
  ): void {
    if (!payments || payments.length === 0) {
      throw new BadRequestException('Informe ao menos um método de pagamento');
    }

    const totalPaid = payments.reduce(
      (acc, p) => acc.plus(new Decimal(p.amount)),
      new Decimal(0),
    );

    const totalChange = payments.reduce(
      (acc, p) => acc.plus(new Decimal(p.change ?? 0)),
      new Decimal(0),
    );

    const netPaid = totalPaid.minus(totalChange);

    if (netPaid.lessThan(total)) {
      throw new BadRequestException(
        `Valor pago (${netPaid.toString()}) é menor que o total da venda (${total.toString()})`,
      );
    }

    for (const p of payments) {
      if (p.method !== 'DINHEIRO' && (p.change ?? 0) > 0) {
        throw new BadRequestException(
          `Troco só é permitido para pagamento em DINHEIRO`,
        );
      }
    }
  }

  private buildPaymentsData(payments: CreateSalePaymentDto[]) {
    return payments.map((p) => ({
      method: p.method,
      amount: new Decimal(p.amount),
      change: new Decimal(p.change ?? 0),
    }));
  }

  private saleInclude() {
    return {
      items: true,
      payments: true,
      client: true,
      operator: {
        select: { id: true, username: true, role: true },
      },
    };
  }

  async create(
    createSaleDto: CreateSaleDto,
    userId: number,
    username: string,
  ): Promise<SaleResponseDto> {
    const { items, payments, ...saleData } = createSaleDto;
    const clientId = saleData.clientId ?? 1;

    const client = await this.prisma.client.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new BadRequestException(`Cliente ${clientId} não encontrado`);
    }

    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.client.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, costPrice: true, unit: true },
    });

    const foundIds = products.map((p) => p.id);
    const missingIds = productIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Produtos não encontrados: ${missingIds.join(', ')}`,
      );
    }

    const discount = new Decimal(saleData.discount || 0);
    const cfop = saleData.cfop || '5102';

    let totalProductsWithoutDiscount = new Decimal(0);
    let profitSale = new Decimal(0);

    const itemsData = items.map((item, index) => {
      const product = products.find((p) => p.id === item.productId)!;
      const totalPrice = new Decimal(item.quantity).times(
        new Decimal(item.unitPrice),
      );
      const itemCost = new Decimal(product.costPrice).times(
        new Decimal(item.quantity),
      );

      totalProductsWithoutDiscount =
        totalProductsWithoutDiscount.plus(totalPrice);
      profitSale = profitSale.plus(totalPrice.minus(itemCost));

      return {
        itemNumber: index + 1,
        productId: item.productId,
        xProd: product.name,
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        totalPrice,
        taxUnit: product.unit,
        taxQuantity: new Decimal(item.quantity),
        taxUnitPrice: new Decimal(item.unitPrice),
        composesTotal: 1,
        cfop,
        totalTaxValue: null,
        importTaxValue: new Decimal(0),
        iofValue: new Decimal(0),
      };
    });

    const total = totalProductsWithoutDiscount.minus(discount);

    this.validatePayments(payments, total);

    const sale = await this.prisma.client.sale.create({
      data: {
        clientId,
        userOperator: username,
        operatorId: userId,
        date: this.getBrasiliaTime(),
        totalProductsWithoutDiscount,
        discount,
        total,
        profitSale: profitSale.minus(discount),
        isPaid: clientId === 1,
        cfop,
        fiscalStatus: FiscalStatus.PENDENTE,
        items: { create: itemsData },
        payments: { create: this.buildPaymentsData(payments) },
      },
      include: this.saleInclude(),
    });

    return new SaleResponseDto(sale);
  }

  async findAll(filters: SaleFiltersDto): Promise<PaginatedSalesResponseDto> {
    const {
      page = 1,
      limit = 10,
      clientId,
      operatorId,
      fiscalStatus,
      isPaid,
      clientName,
      fiscalKey,
      startDate,
      paymentMethod,
      endDate,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      ...(clientId && { clientId }),
      ...(clientName && { client: { name: { contains: clientName } } }),
      ...(operatorId && { operatorId }),
      ...(fiscalStatus && { fiscalStatus }),
      ...(isPaid !== undefined && { isPaid }),
      ...(fiscalKey && { fiscalKey: { contains: fiscalKey } }),
      ...(paymentMethod && {
        payments: { some: { method: paymentMethod } },
      }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: this.getStartOfDayBrasilia(startDate) }),
              ...(endDate && { lte: this.getEndOfDayBrasilia(endDate) }),
            },
          }
        : {}),
    };

    const [sales, total] = await Promise.all([
      this.prisma.client.sale.findMany({
        where,
        skip,
        take: limit,
        include: this.saleInclude(),
        orderBy: { date: 'desc' },
      }),
      this.prisma.client.sale.count({ where }),
    ]);

    return new PaginatedSalesResponseDto({
      data: sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  async findOne(id: number): Promise<SaleResponseDto> {
    const sale = await this.prisma.client.sale.findUnique({
      where: { id },
      include: this.saleInclude(),
    });

    if (!sale) {
      throw new NotFoundException(`Venda ${id} não encontrada`);
    }

    return new SaleResponseDto(sale);
  }

  async update(
    id: number,
    updateSaleDto: UpdateSaleDto,
  ): Promise<SaleResponseDto> {
    const existingSale = await this.prisma.client.sale.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });

    if (!existingSale) {
      throw new NotFoundException(`Venda ${id} não encontrada`);
    }

    if (existingSale.fiscalStatus === FiscalStatus.EMITIDA) {
      throw new BadRequestException(
        'Venda com nota fiscal emitida não pode ser alterada',
      );
    }

    if (existingSale.fiscalStatus === FiscalStatus.CANCELADA) {
      throw new BadRequestException('Venda cancelada não pode ser alterada');
    }

    let recalculatedTotal = new Decimal(
      existingSale.totalProductsWithoutDiscount,
    );
    let recalculatedProfit = new Decimal(existingSale.profitSale);

    if (updateSaleDto.discount !== undefined) {
      const newDiscount = new Decimal(updateSaleDto.discount);
      recalculatedTotal = recalculatedTotal.minus(newDiscount);
      recalculatedProfit = recalculatedProfit.minus(
        newDiscount.minus(new Decimal(existingSale.discount)),
      );
    }

    if (updateSaleDto.payments) {
      this.validatePayments(updateSaleDto.payments, recalculatedTotal);
    }

    const updatedSale = await this.prisma.client.$transaction(async (tx) => {
      if (updateSaleDto.payments) {
        await tx.salePayment.deleteMany({ where: { saleId: id } });
        await tx.salePayment.createMany({
          data: this.buildPaymentsData(updateSaleDto.payments).map((p) => ({
            ...p,
            saleId: id,
          })),
        });
      }

      return tx.sale.update({
        where: { id },
        data: {
          ...(updateSaleDto.discount !== undefined && {
            discount: new Decimal(updateSaleDto.discount),
            total: recalculatedTotal,
            profitSale: recalculatedProfit,
          }),
          ...(updateSaleDto.isPaid !== undefined && {
            isPaid: updateSaleDto.isPaid,
          }),
          ...(updateSaleDto.fiscalStatus && {
            fiscalStatus: updateSaleDto.fiscalStatus,
          }),
          ...(updateSaleDto.cfop && { cfop: updateSaleDto.cfop }),
        },
        include: this.saleInclude(),
      });
    });

    return new SaleResponseDto(updatedSale);
  }

  async remove(id: number): Promise<{ message: string }> {
    const sale = await this.prisma.client.sale.findUnique({ where: { id } });

    if (!sale) {
      throw new NotFoundException(`Venda ${id} não encontrada`);
    }

    if (sale.fiscalStatus === FiscalStatus.EMITIDA) {
      throw new BadRequestException(
        'Venda com nota fiscal emitida não pode ser deletada',
      );
    }

    await this.prisma.client.sale.delete({ where: { id } });

    return { message: 'Venda excluída com sucesso' };
  }

  async convertOrderToSale(
    orderId: number,
    dto: ConvertOrderToSaleDto,
    userId: number,
    username: string,
  ): Promise<SaleResponseDto> {
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                costPrice: true,
                ncm: true,
                unit: true,
                productType: true,
                csosn: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    if (order.status !== OrderStatus.CLOSED) {
      throw new BadRequestException(
        'Apenas pedidos fechados podem ser convertidos em venda',
      );
    }

    const clientId = dto.clientId ?? 1;
    const client = await this.prisma.client.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new BadRequestException(`Cliente ${clientId} não encontrado`);
    }

    const discount = new Decimal(dto.discount || 0);
    const totalProductsWithoutDiscount = new Decimal(order.total);
    const total = totalProductsWithoutDiscount.minus(discount);

    this.validatePayments(dto.payments, total);

    const profitSale = order.items.reduce((acc, item) => {
      const itemCost = new Decimal(item.product.costPrice).times(
        new Decimal(item.quantity),
      );
      return acc.plus(new Decimal(item.total).minus(itemCost));
    }, new Decimal(0));

    const sale = await this.prisma.client.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          clientId,
          userOperator: username,
          operatorId: userId,
          date: this.getBrasiliaTime(),
          totalProductsWithoutDiscount,
          discount,
          total,
          profitSale: profitSale.minus(discount),
          isPaid: clientId === 1,
          cfop: dto.cfop || '5102',
          fiscalStatus: FiscalStatus.PENDENTE,
          items: {
            create: order.items.map((item, index) => ({
              itemNumber: index + 1,
              productId: item.productId,
              xProd: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.total,
              taxUnit: item.product.unit,
              taxQuantity: item.quantity,
              taxUnitPrice: item.unitPrice,
              composesTotal: 1,
              cfop:
                item.product.csosn === '500'
                  ? '5405'
                  : item.product.productType === 'MANUFACTURED'
                    ? '5101'
                    : dto.cfop || '5102',
              totalTaxValue: null,
              importTaxValue: new Decimal(0),
              iofValue: new Decimal(0),
            })),
          },
          payments: { create: this.buildPaymentsData(dto.payments) },
        },
        include: this.saleInclude(),
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      return createdSale;
    });

    return new SaleResponseDto(sale);
  }

  async markAsReceived(salesIds: number[]): Promise<{ message: string }> {
    if (!salesIds || !Array.isArray(salesIds) || salesIds.length === 0) {
      throw new BadRequestException(
        'É necessário enviar uma lista de IDs das vendas a serem recebidas',
      );
    }

    const result = await this.prisma.client.sale.updateMany({
      where: { id: { in: salesIds }, isPaid: false },
      data: { isPaid: true },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Nenhuma venda pendente encontrada para dar baixa',
      );
    }

    return {
      message: `${result.count} venda(s) marcada(s) como recebida(s) com sucesso`,
    };
  }
}
