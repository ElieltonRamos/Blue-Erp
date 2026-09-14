import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FinalizeDocumentDto } from './dto/finalize-document.dto.js';
import { Decimal } from '@prisma/client/runtime/client';
import {
  DocumentStatus,
  DocumentItemType,
  Prisma,
} from '../../generated/prisma/client.js';
import { FiscalStatus } from '../../generated/prisma/enums.js';
import { CreateSalePaymentDto } from './dto/create-sale.dto.js';
import { SaleResponseDto } from './dto/response-sale.dto.js';
import { resolveLogicalDateTime } from '../common/date-utils.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class DocumentSaleService {
  private readonly logger = new Logger(DocumentSaleService.name);

  constructor(private readonly prisma: PrismaService) {}

  private computeIsPaid(payments: CreateSalePaymentDto[]): boolean {
    return !payments.some((p) => p.method === 'CREDITO_LOJA');
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
          'Troco só é permitido para pagamento em DINHEIRO',
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

  async convertDocumentoToSale(
    documentId: number,
    dto: FinalizeDocumentDto,
    userId: number,
    username: string,
  ): Promise<SaleResponseDto> {
    const start = Date.now();

    this.logger.log(
      `[Venda nova] operador=${userId} | convertendo documento ${documentId} em venda`,
    );

    const document = await this.prisma.client.document.findUnique({
      where: { id: documentId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                costPrice: true,
                unit: true,
                productType: true,
                csosn: true,
              },
            },
            service: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Documento ${documentId} não encontrado`);
    }

    if (document.status !== DocumentStatus.IN_PROGRESS) {
      this.logger.warn(
        `[Venda nova] operador=${userId} | bloqueado: documento ${documentId} não está IN_PROGRESS (status=${document.status})`,
      );
      throw new BadRequestException(
        'Apenas documentos em andamento (IN_PROGRESS) podem ser finalizados e faturados',
      );
    }

    const existingSale = await this.prisma.client.sale.findUnique({
      where: { documentId },
    });

    if (existingSale) {
      this.logger.warn(
        `[Venda nova] operador=${userId} | bloqueado: documento ${documentId} já possui venda ${existingSale.id}`,
      );
      throw new BadRequestException(
        `Documento ${documentId} já possui uma venda associada (sale ${existingSale.id})`,
      );
    }

    if (document.items.length === 0) {
      throw new BadRequestException(
        'Documento não possui itens para gerar a venda',
      );
    }

    const discount = new Decimal(dto.discount || 0);
    const cfop = dto.cfop || '5102';

    let totalProductsWithoutDiscount = new Decimal(0);
    let profitSale = new Decimal(0);

    const itemsData: Prisma.SaleItemUncheckedCreateWithoutSaleInput[] =
      document.items.map((item, index) => {
        const totalPrice = new Decimal(item.total);
        totalProductsWithoutDiscount =
          totalProductsWithoutDiscount.plus(totalPrice);

        if (item.type === DocumentItemType.PRODUCT && item.product) {
          const product = item.product;
          const itemCost = new Decimal(product.costPrice).times(
            new Decimal(item.quantity),
          );
          profitSale = profitSale.plus(totalPrice.minus(itemCost));

          return {
            itemNumber: index + 1,
            productId: product.id,
            serviceId: undefined,
            userId: undefined,
            xProd: product.name,
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            totalPrice,
            taxUnit: product.unit,
            taxQuantity: new Decimal(item.quantity),
            taxUnitPrice: new Decimal(item.unitPrice),
            composesTotal: 1,
            cfop:
              product.csosn === '500'
                ? '5405'
                : product.productType === 'MANUFACTURED'
                  ? '5101'
                  : cfop,
            totalTaxValue: null,
            importTaxValue: new Decimal(0),
            iofValue: new Decimal(0),
          };
        }

        profitSale = profitSale.plus(totalPrice);

        return {
          itemNumber: index + 1,
          productId: undefined,
          serviceId: item.service?.id,
          userId: item.userId ?? undefined,
          xProd: item.service?.name ?? 'Serviço',
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          totalPrice,
          taxUnit: null,
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

    this.validatePayments(dto.payments, total);

    try {
      const sale = await this.prisma.client.$transaction(async (tx) => {
        const createdSale = await tx.sale.create({
          data: {
            clientId: document.clientId,
            userOperator: username,
            operatorId: userId,
            date: resolveLogicalDateTime(),
            totalProductsWithoutDiscount,
            discount,
            total,
            profitSale: profitSale.minus(discount),
            isPaid: this.computeIsPaid(dto.payments),
            cfop,
            fiscalStatus: FiscalStatus.PENDENTE,
            serviceCharge: new Decimal(0),
            documentId,
            createdAt: resolveLogicalDateTime(),
            items: { create: itemsData },
            payments: { create: this.buildPaymentsData(dto.payments) },
          },
          include: {
            items: true,
            payments: true,
            client: true,
            operator: { select: { id: true, username: true, role: true } },
          },
        });

        await tx.document.update({
          where: { id: documentId },
          data: {
            status: DocumentStatus.COMPLETED,
            finishedAt: resolveLogicalDateTime(),
          },
        });

        return createdSale;
      });

      this.logger.log(
        `[Venda ${sale.id}] operador=${userId} | gerada a partir do documento ${documentId} com ${sale.items.length} item(ns)`,
      );

      this.logger.log(
        `[Venda ${sale.id}] operador=${userId} | documento finalizado em ${Date.now() - start}ms`,
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
}
