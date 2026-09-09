import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  Prisma,
  FiscalStatus,
  OrderStatus,
} from '../../generated/prisma/client.js';
import { Decimal, DecimalJsLike } from '@prisma/client/runtime/client';
import { CreateSaleDto, CreateSalePaymentDto } from './dto/create-sale.dto.js';
import { UpdateSaleDto } from './dto/update-sale.dto.js';
import {
  PaginatedSalesResponseDto,
  SaleResponseDto,
} from './dto/response-sale.dto.js';
import { SaleFiltersDto } from './dto/filters-sale.dto.js';
import { ConvertOrderToSaleDto } from '../orders/dto/convert-order-to-sale.js';
import { resolveLogicalDateTime } from '../common/date-utils.js';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    const start = Date.now();

    const { items, payments, ...saleData } = createSaleDto;
    const clientId = saleData.clientId ?? 1;

    this.logger.log(
      `[Venda nova] operador=${userId} | criando venda para pedido ${saleData.orderId} com ${items.length} item(ns)`,
    );

    const order = await this.prisma.client.order.findUnique({
      where: { id: saleData.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${saleData.orderId} não encontrado`);
    }

    if (order.status !== OrderStatus.CLOSED) {
      this.logger.warn(
        `[Venda nova] operador=${userId} | bloqueado: pedido ${saleData.orderId} não está fechado (status=${order.status})`,
      );
      throw new BadRequestException(
        'Apenas pedidos fechados podem gerar uma venda',
      );
    }

    const existingSale = await this.prisma.client.sale.findUnique({
      where: { orderId: saleData.orderId },
    });

    if (existingSale) {
      this.logger.warn(
        `[Venda nova] operador=${userId} | bloqueado: pedido ${saleData.orderId} já possui venda ${existingSale.id}`,
      );
      throw new BadRequestException(
        `Pedido ${saleData.orderId} já possui uma venda associada (sale ${existingSale.id})`,
      );
    }

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
    const orderServiceCharge = new Decimal(order.serviceCharge ?? 0);

    let totalProductsWithoutDiscount = new Decimal(0);
    let profitSale = new Decimal(0);

    let itemsData = items.map((item, index) => {
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

    if (orderServiceCharge.greaterThan(0)) {
      const shares = this.distributeServiceCharge(
        itemsData,
        orderServiceCharge,
      );
      itemsData = itemsData.map((item, index) => ({
        ...item,
        serviceCharge: shares[index],
      }));
    }

    const total = totalProductsWithoutDiscount.minus(discount);

    this.validatePayments(payments, total);

    try {
      const sale = await this.prisma.client.sale.create({
        data: {
          clientId,
          userOperator: username,
          operatorId: userId,
          orderId: saleData.orderId,
          serviceCharge: orderServiceCharge,
          date: resolveLogicalDateTime(),
          totalProductsWithoutDiscount,
          discount,
          total,
          profitSale: profitSale.minus(discount),
          isPaid: clientId === 1,
          cfop,
          fiscalStatus: FiscalStatus.PENDENTE,
          createdAt: resolveLogicalDateTime(),
          items: { create: itemsData },
          payments: { create: this.buildPaymentsData(payments) },
        },
        include: this.saleInclude(),
      });

      this.logger.log(
        `[Venda ${sale.id}] operador=${userId} | persistida com ${sale.items.length} item(ns): ` +
          sale.items
            .map((i) => `${i.id}:${i.xProd}(x${Number(i.quantity)})`)
            .join(', '),
      );

      this.logger.log(
        `[Venda ${sale.id}] operador=${userId} | criada em ${Date.now() - start}ms`,
      );

      return new SaleResponseDto(sale);
    } catch (error: unknown) {
      if ((error as any).code === 'P2003') {
        this.logger.error(
          `[Venda nova] operador=${userId} | erro de chave estrangeira: ${(error as any).message}`,
        );
        throw new BadRequestException(
          'Erro de chave estrangeira: Verifique se os dados relacionados existem',
        );
      }
      throw error;
    }
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

  private distributeServiceCharge<
    T extends {
      totalPrice: Decimal | DecimalJsLike | string | number;
    },
  >(items: T[], serviceCharge: Decimal): Decimal[] {
    if (items.length === 0) return [];

    const cents = serviceCharge.times(100).toDecimalPlaces(0);
    const baseCents = cents.dividedToIntegerBy(items.length);
    const remainderCents = cents.minus(baseCents.times(items.length));

    const shares = items.map(() => baseCents);

    const totalPrices = items.map(
      (item) => item.totalPrice as unknown as Decimal,
    );

    let maxIndex = 0;
    totalPrices.forEach((value, index) => {
      if (value.greaterThan(totalPrices[maxIndex])) {
        maxIndex = index;
      }
    });

    shares[maxIndex] = shares[maxIndex].plus(remainderCents);

    return shares.map((c) => c.dividedBy(100));
  }

  async update(
    id: number,
    updateSaleDto: UpdateSaleDto,
    operatorId: number,
  ): Promise<SaleResponseDto> {
    const start = Date.now();
    const tag = `Venda ${id}`;

    this.logger.log(
      `[${tag}] operador=${operatorId} | atualizando campos da venda`,
    );

    const existingSale = await this.prisma.client.sale.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });

    if (!existingSale) {
      throw new NotFoundException(`Venda ${id} não encontrada`);
    }

    if (existingSale.fiscalStatus === FiscalStatus.EMITIDA) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | bloqueado: nota fiscal já emitida`,
      );
      throw new BadRequestException(
        'Venda com nota fiscal emitida não pode ser alterada',
      );
    }

    if (existingSale.fiscalStatus === FiscalStatus.CANCELADA) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | bloqueado: venda cancelada`,
      );
      throw new BadRequestException('Venda cancelada não pode ser alterada');
    }

    if (updateSaleDto.clientId !== undefined) {
      const client = await this.prisma.client.client.findUnique({
        where: { id: updateSaleDto.clientId },
      });
      if (!client) {
        throw new BadRequestException(
          `Cliente ${updateSaleDto.clientId} não encontrado`,
        );
      }
    }

    let saleItemsCreateData: Prisma.SaleItemCreateManySaleInput[] | null = null;
    let orderItemsCreateData: Prisma.OrderItemCreateManyOrderInput[] | null =
      null;
    let totalProductsWithoutDiscount: Decimal;
    let recalculatedProfit: Decimal;

    const newDiscount =
      updateSaleDto.discount !== undefined
        ? new Decimal(updateSaleDto.discount)
        : new Decimal(existingSale.discount);

    const newServiceCharge =
      updateSaleDto.serviceCharge !== undefined
        ? new Decimal(updateSaleDto.serviceCharge)
        : new Decimal(existingSale.serviceCharge);

    const serviceChargeChanged =
      updateSaleDto.serviceCharge !== undefined &&
      !newServiceCharge.equals(new Decimal(existingSale.serviceCharge));

    if (updateSaleDto.items) {
      const productIds = updateSaleDto.items.map((item) => item.productId);
      const products = await this.prisma.client.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          code: true,
          costPrice: true,
          unit: true,
        },
      });

      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((pid) => !foundIds.includes(pid));

      if (missingIds.length > 0) {
        throw new BadRequestException(
          `Produtos não encontrados: ${missingIds.join(', ')}`,
        );
      }

      const cfop = updateSaleDto.cfop || existingSale.cfop;

      totalProductsWithoutDiscount = new Decimal(0);
      let rawProfit = new Decimal(0);

      saleItemsCreateData = updateSaleDto.items.map((item, index) => {
        const product = products.find((p) => p.id === item.productId)!;
        const totalPrice = new Decimal(item.quantity).times(
          new Decimal(item.unitPrice),
        );
        const itemCost = new Decimal(product.costPrice).times(
          new Decimal(item.quantity),
        );

        totalProductsWithoutDiscount =
          totalProductsWithoutDiscount.plus(totalPrice);
        rawProfit = rawProfit.plus(totalPrice.minus(itemCost));

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

      if (serviceChargeChanged) {
        const shares = this.distributeServiceCharge(
          saleItemsCreateData,
          newServiceCharge,
        );
        saleItemsCreateData = saleItemsCreateData.map((item, index) => ({
          ...item,
          serviceCharge: shares[index],
        }));
      } else {
        const oldByProduct = new Map(
          existingSale.items.map((i) => [
            i.productId,
            new Decimal(i.serviceCharge),
          ]),
        );
        const newProductIds = new Set(
          saleItemsCreateData.map((i) => i.productId),
        );

        let removedServiceCharge = new Decimal(0);
        for (const oldItem of existingSale.items) {
          if (!newProductIds.has(oldItem.productId)) {
            removedServiceCharge = removedServiceCharge.plus(
              new Decimal(oldItem.serviceCharge),
            );
          }
        }

        saleItemsCreateData = saleItemsCreateData.map((item) => ({
          ...item,
          serviceCharge: oldByProduct.get(item.productId) ?? new Decimal(0),
        }));

        if (
          removedServiceCharge.greaterThan(0) &&
          saleItemsCreateData.length > 0
        ) {
          const shares = this.distributeServiceCharge(
            saleItemsCreateData,
            removedServiceCharge,
          );
          saleItemsCreateData = saleItemsCreateData.map((item, index) => ({
            ...item,
            serviceCharge: (item.serviceCharge as unknown as Decimal).plus(
              shares[index],
            ),
          }));
        }
      }

      orderItemsCreateData = updateSaleDto.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const total = new Decimal(item.quantity).times(
          new Decimal(item.unitPrice),
        );
        return {
          code: product.code,
          name: product.name,
          productId: item.productId,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          total,
        };
      });

      recalculatedProfit = rawProfit.minus(newDiscount);
    } else {
      totalProductsWithoutDiscount = new Decimal(
        existingSale.totalProductsWithoutDiscount,
      );
      recalculatedProfit = new Decimal(existingSale.profitSale).minus(
        newDiscount.minus(new Decimal(existingSale.discount)),
      );
    }

    const recalculatedTotal = totalProductsWithoutDiscount
      .minus(newDiscount)
      .plus(newServiceCharge);

    // valida SEMPRE: pagamentos novos, se enviados; senão os existentes
    const paymentsToValidate =
      updateSaleDto.payments ??
      existingSale.payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
        change: Number(p.change),
      }));

    this.validatePayments(paymentsToValidate, recalculatedTotal);

    const shouldUpdateTotals =
      updateSaleDto.items !== undefined ||
      updateSaleDto.discount !== undefined ||
      updateSaleDto.serviceCharge !== undefined;

    const updatedSale = await this.prisma.client.$transaction(async (tx) => {
      if (saleItemsCreateData) {
        await tx.saleItem.deleteMany({ where: { saleId: id } });
        await tx.saleItem.createMany({
          data: saleItemsCreateData.map((item) => ({ ...item, saleId: id })),
        });
      }

      if (serviceChargeChanged && !saleItemsCreateData) {
        const shares = this.distributeServiceCharge(
          existingSale.items.map((i) => ({
            totalPrice: new Decimal(i.totalPrice),
          })),
          newServiceCharge,
        );

        await Promise.all(
          existingSale.items.map((item, index) =>
            tx.saleItem.update({
              where: { id: item.id },
              data: { serviceCharge: shares[index] },
            }),
          ),
        );
      }

      if (updateSaleDto.payments) {
        await tx.salePayment.deleteMany({ where: { saleId: id } });
        await tx.salePayment.createMany({
          data: this.buildPaymentsData(updateSaleDto.payments).map((p) => ({
            ...p,
            saleId: id,
          })),
        });
      }

      if (existingSale.orderId) {
        await this.syncOrderFromSale(tx, existingSale.orderId, {
          serviceCharge: updateSaleDto.serviceCharge,
          serviceChargeChanged,
          total:
            updateSaleDto.items !== undefined
              ? totalProductsWithoutDiscount
              : undefined,
          orderItems: orderItemsCreateData,
        });
      }

      return tx.sale.update({
        where: { id },
        data: {
          ...(updateSaleDto.clientId !== undefined && {
            clientId: updateSaleDto.clientId,
          }),
          ...(shouldUpdateTotals && {
            totalProductsWithoutDiscount,
            discount: newDiscount,
            serviceCharge: newServiceCharge,
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

    this.logger.log(
      `[${tag}] operador=${operatorId} | atualizada em ${Date.now() - start}ms`,
    );

    return new SaleResponseDto(updatedSale);
  }

  private async syncOrderFromSale(
    tx: Prisma.TransactionClient,
    orderId: number,
    data: {
      serviceCharge?: number;
      serviceChargeChanged: boolean;
      total?: Decimal;
      orderItems: Prisma.OrderItemCreateManyOrderInput[] | null;
    },
  ): Promise<void> {
    if (data.orderItems) {
      let finalOrderItems = data.orderItems;

      if (data.serviceChargeChanged && data.serviceCharge !== undefined) {
        const shares = this.distributeServiceCharge(
          data.orderItems.map((i) => ({ totalPrice: i.total })),
          new Decimal(data.serviceCharge),
        );
        finalOrderItems = data.orderItems.map((item, index) => ({
          ...item,
          serviceCharge: shares[index],
        }));
      } else {
        const existingOrderItems = await tx.orderItem.findMany({
          where: { orderId },
          select: { productId: true, serviceCharge: true },
        });

        const oldByProduct = new Map(
          existingOrderItems.map((i) => [
            i.productId,
            new Decimal(i.serviceCharge),
          ]),
        );
        const newProductIds = new Set(data.orderItems.map((i) => i.productId));

        let removedServiceCharge = new Decimal(0);
        for (const oldItem of existingOrderItems) {
          if (!newProductIds.has(oldItem.productId)) {
            removedServiceCharge = removedServiceCharge.plus(
              new Decimal(oldItem.serviceCharge),
            );
          }
        }

        finalOrderItems = data.orderItems.map((item) => ({
          ...item,
          serviceCharge: oldByProduct.get(item.productId) ?? new Decimal(0),
        }));

        if (removedServiceCharge.greaterThan(0) && finalOrderItems.length > 0) {
          const shares = this.distributeServiceCharge(
            finalOrderItems.map((i) => ({ totalPrice: i.total })),
            removedServiceCharge,
          );
          finalOrderItems = finalOrderItems.map((item, index) => ({
            ...item,
            serviceCharge: (item.serviceCharge as unknown as Decimal).plus(
              shares[index],
            ),
          }));
        }
      }

      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.orderItem.createMany({
        data: finalOrderItems.map((item) => ({ ...item, orderId })),
      });
    } else if (data.serviceChargeChanged && data.serviceCharge !== undefined) {
      const existingOrderItems = await tx.orderItem.findMany({
        where: { orderId },
        select: { id: true, total: true },
      });

      const shares = this.distributeServiceCharge(
        existingOrderItems.map((i) => ({ totalPrice: i.total })),
        new Decimal(data.serviceCharge),
      );

      await Promise.all(
        existingOrderItems.map((item, index) =>
          tx.orderItem.update({
            where: { id: item.id },
            data: { serviceCharge: shares[index] },
          }),
        ),
      );
    }

    const updateData: Prisma.OrderUpdateInput = {};

    if (data.serviceCharge !== undefined) {
      updateData.serviceCharge = new Decimal(data.serviceCharge);
    }
    if (data.total !== undefined) {
      updateData.total = data.total;
    }

    if (Object.keys(updateData).length > 0 || data.orderItems) {
      await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });
    }
  }

  async remove(id: number, operatorId: number): Promise<{ message: string }> {
    const start = Date.now();
    const tag = `Venda ${id}`;

    const sale = await this.prisma.client.sale.findUnique({ where: { id } });

    if (!sale) {
      throw new NotFoundException(`Venda ${id} não encontrada`);
    }

    if (sale.fiscalStatus === FiscalStatus.EMITIDA) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | bloqueado: nota fiscal já emitida, não pode ser deletada`,
      );
      throw new BadRequestException(
        'Venda com nota fiscal emitida não pode ser deletada',
      );
    }

    await this.prisma.client.sale.delete({ where: { id } });

    this.logger.log(
      `[${tag}] operador=${operatorId} | removida em ${Date.now() - start}ms`,
    );

    return { message: 'Venda excluída com sucesso' };
  }

  async convertOrderToSale(
    orderId: number,
    dto: ConvertOrderToSaleDto,
    userId: number,
    username: string,
  ): Promise<SaleResponseDto> {
    const start = Date.now();

    this.logger.log(
      `[Venda nova] operador=${userId} | convertendo pedido ${orderId} em venda`,
    );

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
      this.logger.warn(
        `[Venda nova] operador=${userId} | bloqueado: pedido ${orderId} não está fechado (status=${order.status})`,
      );
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

    const existingSale = await this.prisma.client.sale.findUnique({
      where: { orderId },
    });

    if (existingSale) {
      this.logger.warn(
        `[Venda nova] operador=${userId} | bloqueado: pedido ${orderId} já possui venda ${existingSale.id}`,
      );
      throw new BadRequestException(
        `Pedido ${orderId} já possui uma venda associada (sale ${existingSale.id})`,
      );
    }

    try {
      const sale = await this.prisma.client.$transaction(async (tx) => {
        const createdSale = await tx.sale.create({
          data: {
            clientId,
            userOperator: username,
            operatorId: userId,
            date: resolveLogicalDateTime(),
            totalProductsWithoutDiscount,
            discount,
            total,
            profitSale: profitSale.minus(discount),
            isPaid: clientId === 1,
            cfop: dto.cfop || '5102',
            fiscalStatus: FiscalStatus.PENDENTE,
            serviceCharge: order.serviceCharge ?? new Decimal(0),
            orderId: orderId,
            createdAt: resolveLogicalDateTime(),
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
                serviceCharge: item.serviceCharge ?? new Decimal(0),
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

      this.logger.log(
        `[Venda ${sale.id}] operador=${userId} | persistida com ${sale.items.length} item(ns): ` +
          sale.items
            .map((i) => `${i.id}:${i.xProd}(x${Number(i.quantity)})`)
            .join(', '),
      );

      this.logger.log(
        `[Venda ${sale.id}] operador=${userId} | convertida em ${Date.now() - start}ms`,
      );

      return new SaleResponseDto(sale);
    } catch (error: unknown) {
      if ((error as any).code === 'P2003') {
        this.logger.error(
          `[Venda nova] operador=${userId} | erro de chave estrangeira: ${(error as any).message}`,
        );
        throw new BadRequestException(
          'Erro de chave estrangeira: Verifique se os dados relacionados existem',
        );
      }
      throw error;
    }
  }

  async markAsReceived(
    salesIds: number[],
    operatorId: number,
  ): Promise<{ message: string }> {
    const start = Date.now();

    if (!salesIds || !Array.isArray(salesIds) || salesIds.length === 0) {
      throw new BadRequestException(
        'É necessário enviar uma lista de IDs das vendas a serem recebidas',
      );
    }

    this.logger.log(
      `[Vendas] operador=${operatorId} | marcando ${salesIds.length} venda(s) como recebida(s): ids=${JSON.stringify(salesIds)}`,
    );

    const result = await this.prisma.client.sale.updateMany({
      where: { id: { in: salesIds }, isPaid: false },
      data: { isPaid: true },
    });

    if (result.count === 0) {
      this.logger.warn(
        `[Vendas] operador=${operatorId} | nenhuma venda pendente encontrada para dar baixa: ids=${JSON.stringify(salesIds)}`,
      );
      throw new NotFoundException(
        'Nenhuma venda pendente encontrada para dar baixa',
      );
    }

    this.logger.log(
      `[Vendas] operador=${operatorId} | ${result.count} venda(s) marcada(s) como recebida(s) em ${Date.now() - start}ms`,
    );

    return {
      message: `${result.count} venda(s) marcada(s) como recebida(s) com sucesso`,
    };
  }
}
