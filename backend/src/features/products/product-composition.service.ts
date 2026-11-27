import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductType } from 'generated/prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { UpdatePreparationDto } from './dto/update-preparation.dto';
import {
  COMPOSITION_INCLUDE,
  TYPES_WITH_COMPOSITION,
} from './product.constants';

export interface CompositionItemInput {
  materialId?: number | null;
  subProductId?: number | null;
  quantity: number;
}

@Injectable()
export class ProductCompositionService {
  private readonly logger = new Logger(ProductCompositionService.name);

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

  private notFound(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new NotFoundException(message);
  }

  // Produto que aceita composição e preparo (manufaturado ou semipronto)
  private async findProductWithComposition(
    id: number,
    actor: string,
    notSupportedMessage: string,
  ) {
    const product = await this.prisma.client.product.findUnique({
      where: { id },
      select: { id: true, productType: true },
    });

    if (!product) {
      this.notFound(`Produto com ID ${id} não encontrado`, actor);
    }

    if (!TYPES_WITH_COMPOSITION.includes(product.productType)) {
      this.badRequest(notSupportedMessage, actor);
    }

    return product;
  }

  /**
   * Obter composição do produto
   */
  async getComposition(id: number, actor: string) {
    await this.findProductWithComposition(
      id,
      actor,
      'Apenas produtos manufaturados ou semiprontos possuem composição',
    );

    return this.prisma.client.compositionItem.findMany({
      where: { productId: id },
      include: COMPOSITION_INCLUDE.compositionItems.include,
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Obter passos de preparo do produto
   */
  async getPreparation(id: number, actor: string) {
    await this.findProductWithComposition(
      id,
      actor,
      'Apenas produtos manufaturados ou semiprontos possuem modo de preparo',
    );

    return this.prisma.client.preparationStep.findMany({
      where: { productId: id },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Atualizar composição do produto (substitui a lista) e recalcular o custo
   * Suporta itens com materialId ou subProductId
   */
  async updateComposition(
    id: number,
    compositionDto: UpdateCompositionDto,
    actor: string,
  ) {
    try {
      await this.findProductWithComposition(
        id,
        actor,
        'Apenas produtos manufaturados ou semiprontos podem ter composição',
      );

      await this.validateCompositionItems(
        compositionDto.composition,
        actor,
        id,
      );

      const costPrice = await this.calculateCompositionCost(
        compositionDto.composition,
      );

      await this.prisma.client.$transaction([
        this.prisma.client.compositionItem.deleteMany({
          where: { productId: id },
        }),
        this.prisma.client.compositionItem.createMany({
          data: compositionDto.composition.map((item) => ({
            productId: id,
            materialId: item.materialId ?? null,
            subProductId: item.subProductId ?? null,
            quantity: item.quantity,
          })),
        }),
        this.prisma.client.product.update({
          where: { id },
          data: { costPrice },
        }),
      ]);

      this.logger.log(
        `Composição do produto atualizada (actor=${actor}, id=${id}, itens=${compositionDto.composition.length})`,
      );

      return this.getComposition(id, actor);
    } catch (error) {
      this.rethrow(
        error,
        `Falha ao atualizar composição do produto (actor=${actor}, id=${id})`,
      );
    }
  }

  /**
   * Atualizar passos de preparo (substitui a lista)
   */
  async updatePreparation(
    id: number,
    preparationDto: UpdatePreparationDto,
    actor: string,
  ) {
    try {
      await this.findProductWithComposition(
        id,
        actor,
        'Apenas produtos manufaturados ou semiprontos podem ter modo de preparo',
      );

      this.validatePreparationSteps(preparationDto.steps, actor);

      await this.prisma.client.$transaction([
        this.prisma.client.preparationStep.deleteMany({
          where: { productId: id },
        }),
        this.prisma.client.preparationStep.createMany({
          data: preparationDto.steps.map((step) => ({
            productId: id,
            order: step.order,
            description: step.description,
          })),
        }),
      ]);

      this.logger.log(
        `Modo de preparo do produto atualizado (actor=${actor}, id=${id}, passos=${preparationDto.steps.length})`,
      );

      return this.getPreparation(id, actor);
    } catch (error) {
      this.rethrow(
        error,
        `Falha ao atualizar modo de preparo do produto (actor=${actor}, id=${id})`,
      );
    }
  }

  /**
   * Valida itens da composição:
   * - Cada item deve ter exatamente materialId OU subProductId
   * - Sem matéria-prima ou subproduto repetido (chaves únicas do schema)
   * - Um produto não pode compor a si mesmo (quando productId é informado)
   * - Matérias-primas devem existir e estar ativas
   * - Subprodutos devem existir, estar ativos e ser SEMI_MANUFACTURED
   */
  async validateCompositionItems(
    items: CompositionItemInput[],
    actor: string,
    productId?: number,
  ): Promise<void> {
    for (const item of items) {
      const hasMaterial = item.materialId != null;
      const hasSubProduct = item.subProductId != null;

      if (hasMaterial === hasSubProduct) {
        this.badRequest(
          'Cada item da composição deve ter exatamente materialId ou subProductId, não ambos nem nenhum',
          actor,
        );
      }
    }

    const materialIds = items
      .map((item) => item.materialId)
      .filter((id): id is number => id != null);

    const subProductIds = items
      .map((item) => item.subProductId)
      .filter((id): id is number => id != null);

    if (new Set(materialIds).size !== materialIds.length) {
      this.badRequest('A composição possui matérias-primas repetidas', actor);
    }

    if (new Set(subProductIds).size !== subProductIds.length) {
      this.badRequest('A composição possui subprodutos repetidos', actor);
    }

    if (productId !== undefined && subProductIds.includes(productId)) {
      this.badRequest(
        'Um produto não pode fazer parte da própria composição',
        actor,
      );
    }

    if (materialIds.length > 0) {
      const materials = await this.prisma.client.primaryMaterial.findMany({
        where: { id: { in: materialIds } },
        select: { id: true, name: true, active: true },
      });

      if (materials.length !== materialIds.length) {
        const foundIds = materials.map((material) => material.id);
        const missing = materialIds.filter((id) => !foundIds.includes(id));
        this.notFound(
          `Matéria(s)-prima(s) com ID(s) ${missing.join(', ')} não encontrada(s)`,
          actor,
        );
      }

      const inactive = materials.filter((material) => !material.active);
      if (inactive.length > 0) {
        this.badRequest(
          `Matéria(s)-prima(s) inativa(s): ${inactive.map((material) => material.name).join(', ')}`,
          actor,
        );
      }
    }

    if (subProductIds.length > 0) {
      const subProducts = await this.prisma.client.product.findMany({
        where: { id: { in: subProductIds } },
        select: { id: true, name: true, active: true, productType: true },
      });

      if (subProducts.length !== subProductIds.length) {
        const foundIds = subProducts.map((subProduct) => subProduct.id);
        const missing = subProductIds.filter((id) => !foundIds.includes(id));
        this.notFound(
          `Subproduto(s) com ID(s) ${missing.join(', ')} não encontrado(s)`,
          actor,
        );
      }

      const invalid = subProducts.filter(
        (subProduct) =>
          !subProduct.active ||
          subProduct.productType !== ProductType.SEMI_MANUFACTURED,
      );

      if (invalid.length > 0) {
        this.badRequest(
          `Produto(s) inválido(s) como subproduto (deve ser ativo e SEMI_MANUFACTURED): ${invalid.map((subProduct) => subProduct.name).join(', ')}`,
          actor,
        );
      }
    }
  }

  /**
   * Valida os passos de preparo: sem ordem repetida (chave única do schema)
   */
  validatePreparationSteps(steps: { order: number }[], actor: string): void {
    const orders = steps.map((step) => step.order);

    if (new Set(orders).size !== orders.length) {
      this.badRequest('Há passos de preparo com a mesma ordem', actor);
    }
  }

  /**
   * Calcula custo total da composição somando matérias-primas e subprodutos
   */
  private async calculateCompositionCost(
    items: CompositionItemInput[],
  ): Promise<number> {
    const materialIds = items
      .map((item) => item.materialId)
      .filter((id): id is number => id != null);

    const subProductIds = items
      .map((item) => item.subProductId)
      .filter((id): id is number => id != null);

    const [materials, subProducts] = await Promise.all([
      materialIds.length > 0
        ? this.prisma.client.primaryMaterial.findMany({
            where: { id: { in: materialIds } },
            select: { id: true, unitCost: true },
          })
        : Promise.resolve<{ id: number; unitCost: Prisma.Decimal }[]>([]),
      subProductIds.length > 0
        ? this.prisma.client.product.findMany({
            where: { id: { in: subProductIds } },
            select: { id: true, costPrice: true },
          })
        : Promise.resolve<{ id: number; costPrice: Prisma.Decimal }[]>([]),
    ]);

    const materialCosts = new Map(
      materials.map((material) => [material.id, material.unitCost.toNumber()]),
    );
    const subProductCosts = new Map(
      subProducts.map((subProduct) => [
        subProduct.id,
        subProduct.costPrice.toNumber(),
      ]),
    );

    let total = 0;

    for (const item of items) {
      if (item.materialId != null) {
        total += (materialCosts.get(item.materialId) ?? 0) * item.quantity;
      } else if (item.subProductId != null) {
        total += (subProductCosts.get(item.subProductId) ?? 0) * item.quantity;
      }
    }

    return total;
  }
}
