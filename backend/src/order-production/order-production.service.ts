import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ProductionStatus, ProductType } from 'generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { resolveLogicalDateTime } from '../common/date-utils';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listar produções por local de produção
   */
  async findByLocation(productionLocation: string) {
    const productions = await this.prisma.client.orderProduction.findMany({
      where: {
        productionLocation,
        status: { not: ProductionStatus.CANCELED },
        deliveredAt: null,
      },
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                customerName: true,
                table: true,
                type: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                preparationSteps: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { pendingAt: 'asc' },
    });

    return productions.map((prod) => ({
      id: prod.id,
      orderItemId: prod.orderItemId,
      productionLocation: prod.productionLocation,
      status: prod.status,
      quantityRequested: Number(prod.quantityRequested),
      quantityProduced: Number(prod.quantityProduced),
      pendingAt: prod.pendingAt,
      startedAt: prod.startedAt,
      completedAt: prod.completedAt,
      deliveredAt: prod.deliveredAt,
      observation: prod.observation,
      pendingDuration: this.calculateDuration(prod.pendingAt, prod.startedAt),
      inProgressDuration: this.calculateDuration(
        prod.startedAt,
        prod.completedAt,
      ),
      completedDuration: this.calculateDuration(
        prod.completedAt,
        prod.deliveredAt,
      ),
      totalDuration: this.calculateDuration(
        prod.pendingAt,
        prod.deliveredAt || resolveLogicalDateTime(),
      ),
      orderItem: {
        id: prod.orderItem.id,
        name: prod.orderItem.name,
        code: prod.orderItem.code,
        order: prod.orderItem.order,
        product: {
          ...prod.orderItem.product,
          preparationSteps: prod.orderItem.product.preparationSteps,
        },
      },
    }));
  }

  /**
   * Listar todas produções com filtros
   */
  async findAll(filters?: {
    status?: ProductionStatus;
    productionLocation?: string;
  }) {
    const where: any = {
      status: { not: ProductionStatus.CANCELED },
      deliveredAt: null,
    };

    if (filters?.status && filters.status !== ProductionStatus.CANCELED) {
      where.status = filters.status;
    }

    if (filters?.productionLocation) {
      where.productionLocation = filters.productionLocation;
    }

    const productions = await this.prisma.client.orderProduction.findMany({
      where,
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                customerName: true,
                table: true,
                type: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                preparationSteps: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { pendingAt: 'asc' },
    });

    return productions.map((prod) => ({
      id: prod.id,
      orderItemId: prod.orderItemId,
      productionLocation: prod.productionLocation,
      status: prod.status,
      quantityRequested: Number(prod.quantityRequested),
      quantityProduced: Number(prod.quantityProduced),
      pendingAt: prod.pendingAt,
      startedAt: prod.startedAt,
      completedAt: prod.completedAt,
      deliveredAt: prod.deliveredAt,
      observation: prod.observation,
      pendingDuration: this.calculateDuration(prod.pendingAt, prod.startedAt),
      inProgressDuration: this.calculateDuration(
        prod.startedAt,
        prod.completedAt,
      ),
      completedDuration: this.calculateDuration(
        prod.completedAt,
        prod.deliveredAt,
      ),
      totalDuration: this.calculateDuration(
        prod.pendingAt,
        prod.deliveredAt || resolveLogicalDateTime(),
      ),
      orderItem: {
        id: prod.orderItem.id,
        name: prod.orderItem.name,
        code: prod.orderItem.code,
        order: prod.orderItem.order,
        product: prod.orderItem.product,
      },
    }));
  }

  /**
   * Iniciar produção (PENDING -> IN_PROGRESS)
   */
  async startProduction(productionId: number) {
    const production = await this.prisma.client.orderProduction.findUnique({
      where: { id: productionId },
    });

    if (!production) {
      throw new NotFoundException(`Produção ${productionId} não encontrada`);
    }

    if (production.status !== ProductionStatus.PENDING) {
      throw new BadRequestException(
        'Apenas produções pendentes podem ser iniciadas',
      );
    }

    const updated = await this.prisma.client.orderProduction.update({
      where: { id: productionId },
      data: {
        status: ProductionStatus.IN_PROGRESS,
        startedAt: resolveLogicalDateTime(),
      },
      include: {
        orderItem: {
          include: {
            order: true,
            product: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      startedAt: updated.startedAt,
      message: 'Produção iniciada com sucesso',
    };
  }

  /**
   * Resolve recursivamente os consumos de matérias-primas.
   *
   * Para cada item da composição do produto:
   *   - Se materialId → acumula o consumo direto na matéria-prima
   *   - Se subProductId → busca a composição do subproduto e recursa,
   *     multiplicando a quantidade pelo fator da camada acima.
   *     O estoque do subproduto NÃO é decrementado.
   *
   * Retorna um Map<materialId, Decimal> com o total a consumir por matéria-prima.
   */
  private async resolveMaterialConsumption(
    productId: number,
    multiplier: Decimal,
    visited: Set<number> = new Set(),
  ): Promise<Map<number, Decimal>> {
    if (visited.has(productId)) {
      throw new BadRequestException(
        `Referência circular detectada na composição do produto ${productId}`,
      );
    }
    visited.add(productId);

    const product = await this.prisma.client.product.findUnique({
      where: { id: productId },
      include: {
        compositionItems: {
          include: {
            material: { select: { id: true } },
            subProduct: { select: { id: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto ${productId} não encontrado`);
    }

    const consumption = new Map<number, Decimal>();

    for (const comp of product.compositionItems) {
      const qtd = new Decimal(comp.quantity).times(multiplier);

      if (comp.materialId) {
        const current = consumption.get(comp.materialId) ?? new Decimal(0);
        consumption.set(comp.materialId, current.plus(qtd));
      } else if (comp.subProductId) {
        // Recursa na composição do subproduto sem decrementar seu estoque
        const subConsumption = await this.resolveMaterialConsumption(
          comp.subProductId,
          qtd,
          new Set(visited),
        );

        for (const [materialId, amount] of subConsumption) {
          const current = consumption.get(materialId) ?? new Decimal(0);
          consumption.set(materialId, current.plus(amount));
        }
      } else {
        throw new BadRequestException(
          `Composição inválida: item sem material ou subproduto definido`,
        );
      }
    }

    return consumption;
  }

  /**
   * Completar produção (IN_PROGRESS -> COMPLETED)
   * Consome matérias-primas recursivamente (semiprontos não têm estoque decrementado)
   */
  async completeProduction(productionId: number) {
    const production = await this.prisma.client.orderProduction.findUnique({
      where: { id: productionId },
      include: {
        orderItem: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!production) {
      throw new NotFoundException(`Produção ${productionId} não encontrada`);
    }

    if (production.status !== ProductionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Apenas produções em andamento podem ser completadas',
      );
    }

    const productType = production.orderItem.product.productType;
    const hasComposition =
      productType === ProductType.MANUFACTURED ||
      productType === ProductType.SEMI_MANUFACTURED;

    // Resolve todo o consumo de matérias-primas antes de abrir a transaction
    let materialConsumption = new Map<number, Decimal>();

    if (hasComposition) {
      materialConsumption = await this.resolveMaterialConsumption(
        production.orderItem.product.id,
        new Decimal(production.quantityRequested),
      );
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.orderProduction.update({
        where: { id: productionId },
        data: {
          status: ProductionStatus.COMPLETED,
          quantityProduced: production.quantityRequested,
          completedAt: resolveLogicalDateTime(),
        },
      });

      await tx.orderItem.update({
        where: { id: production.orderItemId },
        data: { kitchenReadyAt: resolveLogicalDateTime() },
      });

      for (const [materialId, amount] of materialConsumption) {
        await tx.primaryMaterial.update({
          where: { id: materialId },
          data: { currentStock: { decrement: amount } },
        });
      }
    });

    return {
      productionId,
      status: ProductionStatus.COMPLETED,
      completedAt: resolveLogicalDateTime(),
      message: 'Produção completada e estoque consumido',
    };
  }

  /**
   * Entregar produção (COMPLETED -> marca como entregue)
   */
  async deliverProduction(productionId: number) {
    const production = await this.prisma.client.orderProduction.findUnique({
      where: { id: productionId },
    });

    if (!production) {
      throw new NotFoundException(`Produção ${productionId} não encontrada`);
    }

    if (production.status !== ProductionStatus.COMPLETED) {
      throw new BadRequestException(
        'Apenas produções completadas podem ser entregues',
      );
    }

    const updated = await this.prisma.client.orderProduction.update({
      where: { id: productionId },
      data: { deliveredAt: resolveLogicalDateTime() },
    });

    return {
      productionId,
      deliveredAt: updated.deliveredAt,
      message: 'Produção entregue com sucesso',
    };
  }

  /**
   * Cancelar produção
   */
  async cancelProduction(productionId: number) {
    const production = await this.prisma.client.orderProduction.findUnique({
      where: { id: productionId },
    });

    if (!production) {
      throw new NotFoundException(`Produção ${productionId} não encontrada`);
    }

    if (production.status === ProductionStatus.COMPLETED) {
      throw new BadRequestException(
        'Produções completadas não podem ser canceladas',
      );
    }

    const updated = await this.prisma.client.orderProduction.update({
      where: { id: productionId },
      data: { status: ProductionStatus.CANCELED },
    });

    return {
      productionId,
      status: updated.status,
      message: 'Produção cancelada com sucesso',
    };
  }

  /**
   * Calcular duração em minutos entre duas datas
   */
  private calculateDuration(
    start: Date | null,
    end: Date | null,
  ): number | null {
    if (!start) return null;
    const endDate = end || resolveLogicalDateTime();
    const diff = endDate.getTime() - start.getTime();
    return Math.floor(diff / 1000 / 60);
  }

  /**
   * Obter métricas de produção por local
   */
  async getMetricsByLocation(productionLocation: string) {
    const productions = await this.prisma.client.orderProduction.findMany({
      where: { productionLocation },
    });

    const pending = productions.filter(
      (p) => p.status === ProductionStatus.PENDING,
    );
    const inProgress = productions.filter(
      (p) => p.status === ProductionStatus.IN_PROGRESS,
    );
    const completed = productions.filter(
      (p) => p.status === ProductionStatus.COMPLETED,
    );
    const delivered = productions.filter((p) => p.deliveredAt !== null);

    const avgPendingTime = this.calculateAverageTime(
      productions.map((p) => this.calculateDuration(p.pendingAt, p.startedAt)),
    );

    const avgInProgressTime = this.calculateAverageTime(
      productions.map((p) =>
        this.calculateDuration(p.startedAt, p.completedAt),
      ),
    );

    const avgTotalTime = this.calculateAverageTime(
      productions.map((p) =>
        this.calculateDuration(p.pendingAt, p.completedAt),
      ),
    );

    return {
      productionLocation,
      total: productions.length,
      pending: pending.length,
      inProgress: inProgress.length,
      completed: completed.length,
      delivered: delivered.length,
      averagePendingTimeMinutes: avgPendingTime,
      averageInProgressTimeMinutes: avgInProgressTime,
      averageTotalTimeMinutes: avgTotalTime,
    };
  }

  private calculateAverageTime(times: (number | null)[]): number | null {
    const validTimes = times.filter((t) => t !== null);
    if (validTimes.length === 0) return null;
    const sum = validTimes.reduce((acc, t) => acc + t, 0);
    return Math.round(sum / validTimes.length);
  }

  @Cron('30 5 * * *', {
    name: 'complete-forgotten-productions',
    timeZone: 'America/Sao_Paulo',
  })
  async completeAndDeliverForgotten() {
    const productions = await this.prisma.client.orderProduction.findMany({
      where: {
        deliveredAt: null, // Pega qualquer um que não foi entregue
        status: {
          in: [
            ProductionStatus.PENDING,
            ProductionStatus.IN_PROGRESS,
            ProductionStatus.COMPLETED,
          ],
        },
      },
      select: { id: true, status: true },
    });

    this.logger.log(`Processando ${productions.length} produções com gap.`);

    let succeeded = 0;
    let failed = 0;

    for (const prod of productions) {
      try {
        // 1. Se estiver Pendente, inicia
        if (prod.status === ProductionStatus.PENDING) {
          await this.startProduction(prod.id);
        }

        // 2. Se estiver Em Progresso (ou acabou de iniciar), completa
        // Se já estava COMPLETED, o service original lançaria erro, então pulamos o complete
        if (prod.status !== ProductionStatus.COMPLETED) {
          await this.completeProduction(prod.id);
        }

        // 3. Entrega (Seta o deliveredAt)
        await this.deliverProduction(prod.id);

        succeeded++;
      } catch (error: any) {
        failed++;
        this.logger.error(`Falha no item ${prod.id}: ${error.message}`);
      }
    }

    return { totalFound: productions.length, succeeded, failed };
  }
}
