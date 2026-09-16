// purchase.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, PurchaseStatus } from 'generated/prisma/client';
import {
  CreatePurchaseFromXmlDto,
  ReconciledPurchaseItemDto,
} from './dto/create-purchase-from-xml.dto';
import { ExpensesService } from '../../expenses/expenses.service';
import { BusinessPartnerService } from './business-partner.service';
import { ParsedNfeItemDto } from './dto/parsed-nfe.dto';
import { FindAllPurchaseQueryDto } from './dto/find-all-purchase-query.dto';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessPartnerService: BusinessPartnerService,
    private readonly expensesService: ExpensesService,
  ) {}

  async createFromReconciledXml(
    dto: CreatePurchaseFromXmlDto,
    responsibleId?: number,
  ) {
    const start = Date.now();

    this.logger.log(
      `[Compra nova] fornecedor=${dto.supplierCnpj} | nota=${dto.invoiceNumber} | chave=${dto.fiscalKey} | ${dto.items.length} item(ns)`,
    );

    await this.validateDestination(dto.destCnpj);

    if (dto.items.length === 0) {
      throw new BadRequestException('Compra sem itens');
    }

    for (const item of dto.items) {
      if (item.productId && item.materialId) {
        throw new BadRequestException(
          `Item ${item.supplierProductCode} não pode ser vinculado a Product e PrimaryMaterial ao mesmo tempo`,
        );
      }
    }

    try {
      const purchase = await this.prisma.client.$transaction(async (tx) => {
        const partner = await this.businessPartnerService.findOrCreateByCnpj(
          tx,
          dto.supplierCnpj,
          dto.supplierName,
        );

        const total = dto.items.reduce((sum, i) => sum + i.total, 0);

        const createdPurchase = await tx.purchase.create({
          data: {
            status: PurchaseStatus.RECEIVED,
            supplierId: partner.id,
            responsibleId: responsibleId ?? null,
            total,
            invoiceNumber: dto.invoiceNumber,
            fiscalKey: dto.fiscalKey,
            fiscalXml: dto.fiscalXml,
            supplierCnpj: dto.supplierCnpj,
            items: {
              create: dto.items.map((item) => ({
                productId: item.productId ?? null,
                materialId: item.materialId ?? null,
                supplierProductCode: item.supplierProductCode,
                quantity: item.quantity,
                unitCost: item.unitCost,
                total: item.total,
              })),
            },
          },
          include: { items: true, supplier: true },
        });

        this.logger.log(
          `[Compra ${createdPurchase.id}] persistida com ${createdPurchase.items.length} item(ns): ` +
            createdPurchase.items
              .map(
                (i) =>
                  `${i.id}:${i.supplierProductCode}(x${Number(i.quantity)})`,
              )
              .join(', '),
        );

        for (const item of dto.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
          } else if (item.materialId) {
            await tx.primaryMaterial.update({
              where: { id: item.materialId },
              data: { currentStock: { increment: item.quantity } },
            });
          } else {
            this.logger.log(
              `[Compra ${createdPurchase.id}] item ${item.supplierProductCode} sem vínculo (consumo) — sem baixa de estoque`,
            );
          }
        }

        if (dto.installments.length > 0) {
          await this.expensesService.createManyFromPurchase(
            tx,
            createdPurchase.id,
            partner.id,
            dto.supplierName,
            dto.invoiceNumber,
            dto.installments,
          );
        } else {
          this.logger.log(
            `[Compra ${createdPurchase.id}] sem duplicatas — nenhuma Expense gerada`,
          );
        }

        return createdPurchase;
      });

      this.logger.log(
        `[Compra ${purchase.id}] concluída em ${Date.now() - start}ms`,
      );

      return purchase;
    } catch (error: unknown) {
      if ((error as any).code === 'P2002') {
        this.logger.warn(
          `[Compra nova] chave=${dto.fiscalKey} | nota já importada anteriormente`,
        );
        throw new ConflictException(
          `Esta nota fiscal (chave ${dto.fiscalKey}) já foi importada`,
        );
      }
      if ((error as any).code === 'P2003') {
        throw new BadRequestException(
          'Erro de chave estrangeira: verifique se produto, matéria-prima ou fornecedor existem',
        );
      }
      throw error;
    }
  }

  async findAll(filters: FindAllPurchaseQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      supplier,
      invoiceNumber,
      fiscalKey,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseWhereInput = {
      ...(status && { status }),
      ...(supplier && {
        supplier: { name: { contains: supplier } },
      }),
      ...(invoiceNumber && {
        invoiceNumber: { contains: invoiceNumber },
      }),
      ...(fiscalKey && { fiscalKey: { contains: fiscalKey } }),
      ...(startDate || endDate
        ? {
            receivedAt: {
              ...(startDate && {
                gte: new Date(`${startDate}T00:00:00.000-03:00`),
              }),
              ...(endDate && {
                lte: new Date(`${endDate}T23:59:59.999-03:00`),
              }),
            },
          }
        : {}),
    };

    const orderBy: Prisma.PurchaseOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' }
      : { receivedAt: 'desc' };

    const [purchases, total] = await Promise.all([
      this.prisma.client.purchase.findMany({
        where,
        skip,
        take: limit,
        include: { supplier: true, items: true, expenses: true },
        orderBy,
      }),
      this.prisma.client.purchase.count({ where }),
    ]);

    return {
      data: purchases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const purchase = await this.prisma.client.purchase.findUnique({
      where: { id },
      include: { items: true, expenses: true, supplier: true },
    });

    if (!purchase) {
      throw new NotFoundException(`Compra ${id} não encontrada`);
    }

    return purchase;
  }

  /**
   * Casa cada item da NFe com o último PurchaseItem do mesmo fornecedor que
   * usou o mesmo supplierProductCode, pra pré-preencher productId/materialId
   * na tela de conciliação. Item sem match anterior volta sem productId/materialId
   * (front pede pra vincular manualmente ou cadastrar produto novo).
   */
  async reconcileItems(
    supplierCnpj: string,
    items: ParsedNfeItemDto[],
  ): Promise<ReconciledPurchaseItemDto[]> {
    const codes = items.map((i) => i.supplierProductCode);

    const previousItems = await this.prisma.client.purchaseItem.findMany({
      where: {
        supplierProductCode: { in: codes },
        purchase: { supplierCnpj },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        supplierProductCode: true,
        productId: true,
        materialId: true,
      },
    });

    const matchByCode = new Map<
      string,
      { productId: number | null; materialId: number | null }
    >();
    for (const prev of previousItems) {
      if (!matchByCode.has(prev.supplierProductCode!)) {
        matchByCode.set(prev.supplierProductCode!, {
          productId: prev.productId,
          materialId: prev.materialId,
        });
      }
    }

    return items.map((item) => {
      const match = matchByCode.get(item.supplierProductCode);
      return {
        supplierProductCode: item.supplierProductCode,
        description: item.description,
        quantity: item.quantity,
        ncm: item.ncm,
        unitCost: item.unitCost,
        total: item.total,
        productId: match?.productId ?? undefined,
        materialId: match?.materialId ?? undefined,
      };
    });
  }

  // purchase.service.ts — cancel() atualizado

  async cancel(id: number): Promise<void> {
    const start = Date.now();

    const purchase = await this.prisma.client.purchase.findUnique({
      where: { id },
      include: { items: true, expenses: true },
    });

    if (!purchase) {
      throw new NotFoundException(`Compra ${id} não encontrada`);
    }

    if (purchase.status === PurchaseStatus.CANCELED) {
      throw new BadRequestException('Compra já está cancelada');
    }

    await this.prisma.client.$transaction(async (tx) => {
      for (const item of purchase.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        } else if (item.materialId) {
          await tx.primaryMaterial.update({
            where: { id: item.materialId },
            data: { currentStock: { decrement: item.quantity } },
          });
        }
      }

      await tx.expense.deleteMany({
        where: { purchaseId: id },
      });

      await tx.purchase.update({
        where: { id },
        data: { status: PurchaseStatus.CANCELED },
      });
    });

    this.logger.log(
      `[Compra ${id}] cancelada: estoque estornado (${purchase.items.length} item(ns)), ${purchase.expenses.length} expense(s) removida(s) em ${Date.now() - start}ms`,
    );
  }
  private async validateDestination(destCnpj: string): Promise<void> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new BadRequestException('Empresa não configurada no sistema');
    }

    if (destCnpj.replace(/\D/g, '') !== company.cnpj.replace(/\D/g, '')) {
      throw new BadRequestException(
        `Nota fiscal não é destinada a esta empresa (CNPJ da nota: ${destCnpj})`,
      );
    }
  }

  async remove(id: number): Promise<void> {
    const purchase = await this.prisma.client.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      throw new NotFoundException(`Compra ${id} não encontrada`);
    }

    if (purchase.status !== PurchaseStatus.CANCELED) {
      throw new BadRequestException('Só é possível excluir compras canceladas');
    }

    await this.prisma.client.purchase.delete({
      where: { id },
    });

    this.logger.log(`[Compra ${id}] excluída`);
  }
}
