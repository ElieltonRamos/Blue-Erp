import { BadRequestException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ProductType } from 'generated/prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { ProduceProductDto } from './dto/produce-product.dto';
import { COMPOSITION_INCLUDE, TYPES_WITH_COMPOSITION } from './product.constants';

export type CompositionItemWithRelations = Prisma.CompositionItemGetPayload<{
  include: typeof COMPOSITION_INCLUDE.compositionItems.include;
}>;

// O mínimo que o cálculo de estoque precisa de um item da composição
interface StockCompositionItem {
  quantity: Prisma.Decimal;
  materialId: number | null;
  material: { currentStock: Prisma.Decimal } | null;
  subProductId: number | null;
}

interface SyncableProduct {
  id: number;
  productType: ProductType;
  quantity: Prisma.Decimal;
  compositionItems: CompositionItemWithRelations[];
}

@Injectable()
export class ProductStockService {
  private readonly logger = new Logger(ProductStockService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Loga como error só o que não foi decisão do próprio service (falha de banco,
  // bug, etc). HttpException já foi logada como warn onde foi lançada.
  private rethrow(error: unknown, context: string): never {
    if (!(error instanceof HttpException)) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`${context}: ${reason}`);
    }
    throw error;
  }

  private badRequest(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new BadRequestException(message);
  }

  /**
   * Calcular quantas unidades do produto podem ser produzidas com o estoque atual
   * Suporta matérias-primas e subprodutos semiprontos
   */
  async calculateAvailableStock(items: StockCompositionItem[], visited: Set<number> = new Set()): Promise<number> {
    if (items.length === 0) return 0;

    const possibleQuantities = await Promise.all(
      items.map(async (item) => {
        const requiredQuantity = item.quantity.toNumber();
        if (requiredQuantity === 0) return 0;

        if (item.materialId != null && item.material) {
          const stock = item.material.currentStock.toNumber();
          return Math.floor(stock / requiredQuantity);
        }

        if (item.subProductId != null) {
          if (visited.has(item.subProductId)) return 0;

          const subProduct = await this.prisma.client.product.findUnique({
            where: { id: item.subProductId },
            include: { compositionItems: { include: { material: true, subProduct: { select: { id: true } } } } },
          });

          if (!subProduct || subProduct.compositionItems.length === 0) return 0;

          const subStock = await this.calculateAvailableStock(
            subProduct.compositionItems,
            new Set([...visited, item.subProductId]),
          );

          return Math.floor(subStock / requiredQuantity);
        }

        return 0;
      }),
    );

    return Math.min(...possibleQuantities);
  }

  /**
   * Sincroniza Product.quantity dos produtos com composição (manufaturados e
   * semiprontos) com o que o estoque atual permite produzir. Devolve a
   * quantidade vigente. Chamada interna das leituras, sem actor.
   */
  async syncQuantity(product: SyncableProduct): Promise<Prisma.Decimal> {
    if (!TYPES_WITH_COMPOSITION.includes(product.productType) || product.compositionItems.length === 0) {
      return product.quantity;
    }

    const availableStock = await this.calculateAvailableStock(product.compositionItems);

    if (product.quantity.toNumber() === availableStock) {
      return product.quantity;
    }

    await this.prisma.client.product.update({ where: { id: product.id }, data: { quantity: availableStock } });

    return new Prisma.Decimal(availableStock);
  }

  /**
   * Produzir produto:
   * - Baixa matérias-primas e/ou subprodutos
   * - Aumenta estoque do produto produzido
   */
  async produce(id: number, produceDto: ProduceProductDto, actor: string) {
    try {
      const product = await this.prisma.client.product.findUnique({ where: { id }, include: COMPOSITION_INCLUDE });

      if (!product) {
        const message = `Produto com ID ${id} não encontrado`;
        this.logger.warn(`${message} (actor=${actor})`);
        throw new NotFoundException(message);
      }

      if (!TYPES_WITH_COMPOSITION.includes(product.productType)) {
        this.badRequest('Apenas produtos manufaturados ou semiprontos podem ser produzidos', actor);
      }

      if (product.productType === ProductType.SEMI_MANUFACTURED) {
        this.badRequest(
          'Produtos semiprontos não podem ser produzidos manualmente. O estoque é calculado automaticamente com base nas matérias-primas.',
          actor,
        );
      }

      if (product.compositionItems.length === 0) {
        this.badRequest('Produto não possui composição cadastrada', actor);
      }

      // Verificar estoque de cada item da composição
      for (const item of product.compositionItems) {
        const required = item.quantity.mul(produceDto.quantity);

        if (item.material && item.material.currentStock.lt(required)) {
          this.badRequest(
            `Estoque insuficiente de "${item.material.name}". Necessário: ${required.toString()}, Disponível: ${item.material.currentStock.toString()}`,
            actor,
          );
        }

        if (item.subProduct && item.subProduct.quantity.lt(required)) {
          this.badRequest(
            `Estoque insuficiente do semiproduto "${item.subProduct.name}". Necessário: ${required.toString()}, Disponível: ${item.subProduct.quantity.toString()}`,
            actor,
          );
        }
      }

      // Montar operações de baixa e de entrada
      const operations: Prisma.PrismaPromise<unknown>[] = [];

      for (const item of product.compositionItems) {
        const required = item.quantity.mul(produceDto.quantity);

        if (item.materialId != null) {
          operations.push(
            this.prisma.client.primaryMaterial.update({
              where: { id: item.materialId },
              data: { currentStock: { decrement: required } },
            }),
          );
        } else if (item.subProductId != null) {
          operations.push(
            this.prisma.client.product.update({ where: { id: item.subProductId }, data: { quantity: { decrement: required } } }),
          );
        }
      }

      operations.push(
        this.prisma.client.product.update({ where: { id }, data: { quantity: { increment: produceDto.quantity } } }),
      );

      await this.prisma.client.$transaction(operations);

      this.logger.log(`Produção registrada (actor=${actor}, id=${id}, quantidade=${produceDto.quantity})`);

      return {
        message: `${produceDto.quantity} unidade(s) de ${product.name} produzida(s) com sucesso`,
        productId: id,
        quantityProduced: produceDto.quantity,
      };
    } catch (error) {
      this.rethrow(error, `Falha ao registrar produção (actor=${actor}, id=${id})`);
    }
  }

  /**
   * Resumo de produtos
   */
  async getSummary() {
    const products = await this.prisma.client.product.findMany({
      select: { active: true, quantity: true, price: true, minStock: true },
    });

    const activeProducts = products.filter((p) => p.active).length;

    const totalStockValue = products.reduce((sum, p) => sum + p.quantity.toNumber() * p.price.toNumber(), 0);

    const productsLowStock = products.filter((p) => p.minStock !== null && p.quantity.lte(p.minStock)).length;

    const totalItems = products.reduce((sum, p) => sum + p.quantity.toNumber(), 0);

    return {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts: products.length - activeProducts,
      totalStockValue,
      productsLowStock,
      totalItems,
    };
  }

  /**
   * Produtos com estoque baixo
   */
  async getStockAlerts() {
    const products = await this.prisma.client.product.findMany({
      where: { AND: [{ minStock: { not: null } }, { quantity: { lte: this.prisma.client.product.fields.minStock } }] },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      code: product.code,
      unit: product.unit,
      currentStock: product.quantity.toNumber(),
      minStock: product.minStock?.toNumber(),
      price: product.price.toNumber(),
      estimatedValue: product.quantity.toNumber() * product.price.toNumber(),
    }));
  }
}
