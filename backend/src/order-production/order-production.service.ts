import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ProductionStatus, ProductType } from 'generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class ProductionService {
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
        prod.deliveredAt || new Date(),
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
    const where: any = {};

    if (filters?.status) {
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
      orderBy: {
        pendingAt: 'asc',
      },
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
        prod.deliveredAt || new Date(),
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
        startedAt: new Date(),
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
   * Completar produção (IN_PROGRESS -> COMPLETED)
   */
  async completeProduction(productionId: number) {
    const production = await this.prisma.client.orderProduction.findUnique({
      where: { id: productionId },
      include: {
        orderItem: {
          include: {
            product: {
              include: {
                compositionItems: {
                  include: {
                    material: true,
                  },
                },
              },
            },
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

    await this.prisma.client.$transaction(async (tx) => {
      // Marcar produção como completa
      await tx.orderProduction.update({
        where: { id: productionId },
        data: {
          status: ProductionStatus.COMPLETED,
          quantityProduced: production.quantityRequested,
          completedAt: new Date(),
        },
      });

      // Marcar item como pronto na cozinha
      await tx.orderItem.update({
        where: { id: production.orderItemId },
        data: {
          kitchenReadyAt: new Date(),
        },
      });

      // Consumir estoque se for produto manufaturado
      if (
        production.orderItem.product.productType === ProductType.MANUFACTURED
      ) {
        for (const comp of production.orderItem.product.compositionItems) {
          const qtdNecessaria = new Decimal(comp.quantity).times(
            new Decimal(production.quantityRequested),
          );

          if (!comp.materialId) {
            throw new BadRequestException(
              `Composição inválida: material não definido`,
            );
          }

          await tx.primaryMaterial.update({
            where: { id: comp.materialId },
            data: {
              currentStock: {
                decrement: qtdNecessaria,
              },
            },
          });
        }
      }
    });

    return {
      productionId,
      status: ProductionStatus.COMPLETED,
      completedAt: new Date(),
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
      data: {
        deliveredAt: new Date(),
      },
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
      data: {
        status: ProductionStatus.CANCELED,
      },
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

    const endDate = end || new Date();
    const diff = endDate.getTime() - start.getTime();
    return Math.floor(diff / 1000 / 60); // retorna em minutos
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
}
