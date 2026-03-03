import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { UpdatePreparationDto } from './dto/update-preparation.dto';
import { ProduceProductDto } from './dto/produce-product.dto';
import { Prisma, ProductType } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { PaginatedResponse } from 'src/common/paginated-response';
import { ProductResponseDto } from './dto/response-product.dto';

const COMPOSITION_INCLUDE = {
  compositionItems: {
    include: {
      material: true,
      subProduct: {
        select: {
          id: true,
          name: true,
          code: true,
          quantity: true,
          unit: true,
        },
      },
    },
  },
};

const TYPES_WITH_COMPOSITION: ProductType[] = [
  ProductType.MANUFACTURED,
  ProductType.SEMI_MANUFACTURED,
];

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar produto (com ou sem composição/preparo)
   */
  async create(createDto: CreateProductDto) {
    const existingCode = await this.prisma.client.product.findUnique({
      where: { code: createDto.code },
    });

    if (existingCode) {
      throw new ConflictException(
        `Produto com código ${createDto.code} já existe`,
      );
    }

    const existingName = await this.prisma.client.product.findFirst({
      where: { name: { equals: createDto.name } },
    });

    if (existingName) {
      throw new ConflictException(
        `Produto com nome "${createDto.name}" já existe`,
      );
    }

    if (createDto.categoryId) {
      const category = await this.prisma.client.category.findUnique({
        where: { id: createDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Categoria com ID ${createDto.categoryId} não encontrada`,
        );
      }
    }

    const hasComposition = TYPES_WITH_COMPOSITION.includes(
      createDto.productType,
    );

    if (
      hasComposition &&
      createDto.composition &&
      createDto.composition.length > 0
    ) {
      await this.validateCompositionItems(createDto.composition);
    }

    if (
      hasComposition &&
      (!createDto.composition || createDto.composition.length === 0)
    ) {
      throw new BadRequestException(
        'Produtos manufaturados ou semiprontos devem ter ao menos um item na composição',
      );
    }

    if (
      createDto.productType === ProductType.RESALE &&
      (createDto.composition || createDto.preparationSteps)
    ) {
      throw new BadRequestException(
        'Produtos para revenda não podem ter composição ou modo de preparo',
      );
    }

    return this.prisma.client.product.create({
      data: {
        name: createDto.name,
        code: createDto.code,
        productionLocation: createDto.productionLocation,
        price: createDto.price,
        extraCosts: createDto.extraCosts,
        costPrice: createDto.costPrice,
        ncm: createDto.ncm,
        cest: createDto.cest,
        origin: createDto.origin,
        csosn: createDto.csosn,
        cst: createDto.cst,
        icmsRate: createDto.icmsRate,
        cstPis: createDto.cstPis,
        pisRate: createDto.pisRate,
        cstCofins: createDto.cstCofins,
        cofinsRate: createDto.cofinsRate,
        federalTaxRate: createDto.federalTaxRate,
        stateTaxRate: createDto.stateTaxRate,
        municipalTaxRate: createDto.municipalTaxRate,
        unit: createDto.unit,
        quantity: createDto.quantity ?? 0,
        minStock: createDto.minStock,
        active: createDto.active ?? true,
        productType: createDto.productType,
        categoryId: createDto.categoryId,
        compositionItems:
          hasComposition && createDto.composition
            ? {
                create: createDto.composition.map((item) => ({
                  materialId: item.materialId ?? null,
                  subProductId: item.subProductId ?? null,
                  quantity: item.quantity,
                })),
              }
            : undefined,
        preparationSteps:
          hasComposition && createDto.preparationSteps
            ? {
                create: createDto.preparationSteps.map((step) => ({
                  order: step.order,
                  description: step.description,
                })),
              }
            : undefined,
      },
      include: {
        ...COMPOSITION_INCLUDE,
        preparationSteps: true,
        category: true,
      },
    });
  }

  /**
   * Listar produtos com filtros e paginação
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterProductDto,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      throw new BadRequestException(
        'A página ou a quantidade de itens por página está incorreta',
      );
    }

    const offset = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    } else {
      where.active = true;
    }

    if (filters?.productType) {
      where.productType = filters.productType;
    }

    if (filters?.unit) {
      where.unit = filters.unit;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
      ];
    }

    if (filters?.lowStock) {
      where.AND = [
        {
          quantity: {
            lte: this.prisma.client.product.fields.minStock,
          },
        },
        {
          minStock: {
            not: null,
          },
        },
      ];
    }

    const products = await this.prisma.client.product.findMany({
      where,
      orderBy: { [sortKey]: sortOrder },
      skip: offset,
      take: limit,
      include: {
        category: true,
        ...COMPOSITION_INCLUDE,
      },
    });

    const total = await this.prisma.client.product.count({ where });

    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        if (
          TYPES_WITH_COMPOSITION.includes(product.productType) &&
          product.compositionItems.length > 0
        ) {
          const availableStock = this.calculateAvailableStock(
            product.compositionItems,
          );

          if (product.quantity.toNumber() !== availableStock) {
            await this.prisma.client.product.update({
              where: { id: product.id },
              data: { quantity: availableStock },
            });

            product.quantity = new Prisma.Decimal(availableStock);
          }
        }

        return new ProductResponseDto(product);
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: updatedProducts,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Calcular quantas unidades do produto podem ser produzidas com o estoque atual
   * Suporta matérias-primas e subprodutos semiprontos
   */
  private calculateAvailableStock(compositionItems: any[]): number {
    if (compositionItems.length === 0) return 0;

    const possibleQuantities = compositionItems.map((item) => {
      const requiredQuantity = item.quantity.toNumber();
      if (requiredQuantity === 0) return 0;

      if (item.materialId && item.material) {
        const stock = item.material.currentStock.toNumber();
        return Math.floor(stock / requiredQuantity);
      }

      if (item.subProductId && item.subProduct) {
        const stock = item.subProduct.quantity.toNumber();
        return Math.floor(stock / requiredQuantity);
      }

      return 0;
    });

    return Math.min(...possibleQuantities);
  }

  /**
   * Buscar produto por ID
   */
  async findOne(id: number) {
    const product = await this.prisma.client.product.findUnique({
      where: { id },
      include: {
        category: true,
        ...COMPOSITION_INCLUDE,
        preparationSteps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    if (
      TYPES_WITH_COMPOSITION.includes(product.productType) &&
      product.compositionItems.length > 0
    ) {
      const availableStock = this.calculateAvailableStock(
        product.compositionItems,
      );

      if (product.quantity.toNumber() !== availableStock) {
        await this.prisma.client.product.update({
          where: { id },
          data: { quantity: availableStock },
        });

        product.quantity = new Prisma.Decimal(availableStock);
      }
    }

    return product;
  }

  /**
   * Buscar produto por código
   */
  async findByCode(code: string) {
    const product = await this.prisma.client.product.findUnique({
      where: { code },
      include: {
        category: true,
        ...COMPOSITION_INCLUDE,
        preparationSteps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com código ${code} não encontrado`);
    }

    if (
      TYPES_WITH_COMPOSITION.includes(product.productType) &&
      product.compositionItems.length > 0
    ) {
      const availableStock = this.calculateAvailableStock(
        product.compositionItems,
      );

      if (product.quantity.toNumber() !== availableStock) {
        await this.prisma.client.product.update({
          where: { id: product.id },
          data: { quantity: availableStock },
        });

        product.quantity = new Prisma.Decimal(availableStock);
      }
    }

    return new ProductResponseDto(product);
  }

  /**
   * Obter composição do produto
   */
  async getComposition(id: number) {
    const product = await this.findOne(id);

    if (!TYPES_WITH_COMPOSITION.includes(product.productType)) {
      throw new BadRequestException(
        'Apenas produtos manufaturados ou semiprontos possuem composição',
      );
    }

    return product.compositionItems;
  }

  /**
   * Obter passos de preparo do produto
   */
  async getPreparation(id: number) {
    const product = await this.findOne(id);

    if (!TYPES_WITH_COMPOSITION.includes(product.productType)) {
      throw new BadRequestException(
        'Apenas produtos manufaturados ou semiprontos possuem modo de preparo',
      );
    }

    return product.preparationSteps;
  }

  /**
   * Atualizar produto
   */
  async update(id: number, updateDto: UpdateProductDto) {
    await this.findOne(id);

    if (updateDto.code) {
      const existingCode = await this.prisma.client.product.findFirst({
        where: { code: updateDto.code, id: { not: id } },
      });

      if (existingCode) {
        throw new ConflictException(
          `Produto com código ${updateDto.code} já existe`,
        );
      }
    }

    if (updateDto.name) {
      const existingName = await this.prisma.client.product.findFirst({
        where: { name: { equals: updateDto.name }, id: { not: id } },
      });

      if (existingName) {
        throw new ConflictException(
          `Produto com nome "${updateDto.name}" já existe`,
        );
      }
    }

    const { categoryId, ...restData } = updateDto;

    const updateData: any = { ...restData };

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    return this.prisma.client.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        ...COMPOSITION_INCLUDE,
        preparationSteps: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Atualizar composição do produto
   * Suporta itens com materialId ou subProductId
   */
  async updateComposition(id: number, compositionDto: UpdateCompositionDto) {
    const product = await this.findOne(id);

    if (!TYPES_WITH_COMPOSITION.includes(product.productType)) {
      throw new BadRequestException(
        'Apenas produtos manufaturados ou semiprontos podem ter composição',
      );
    }

    await this.validateCompositionItems(compositionDto.composition);

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

    return this.getComposition(id);
  }

  /**
   * Atualizar passos de preparo
   */
  async updatePreparation(id: number, preparationDto: UpdatePreparationDto) {
    const product = await this.findOne(id);

    if (!TYPES_WITH_COMPOSITION.includes(product.productType)) {
      throw new BadRequestException(
        'Apenas produtos manufaturados ou semiprontos podem ter modo de preparo',
      );
    }

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

    return this.getPreparation(id);
  }

  /**
   * Produzir produto:
   * - Baixa matérias-primas e/ou subprodutos
   * - Aumenta estoque do produto produzido
   */
  async produce(id: number, produceDto: ProduceProductDto) {
    const product = await this.findOne(id);

    if (!TYPES_WITH_COMPOSITION.includes(product.productType)) {
      throw new BadRequestException(
        'Apenas produtos manufaturados ou semiprontos podem ser produzidos',
      );
    }

    if (!product.compositionItems || product.compositionItems.length === 0) {
      throw new BadRequestException('Produto não possui composição cadastrada');
    }

    // Verificar estoque de cada item da composição
    for (const item of product.compositionItems) {
      const requiredQuantity = item.quantity.toNumber() * produceDto.quantity;

      if (item.materialId && item.material) {
        const available = item.material.currentStock.toNumber();
        if (available < requiredQuantity) {
          throw new BadRequestException(
            `Estoque insuficiente de "${item.material.name}". Necessário: ${requiredQuantity}, Disponível: ${available}`,
          );
        }
      }

      if (item.subProductId && item.subProduct) {
        const available = item.subProduct.quantity.toNumber();
        if (available < requiredQuantity) {
          throw new BadRequestException(
            `Estoque insuficiente do semiproduto "${item.subProduct.name}". Necessário: ${requiredQuantity}, Disponível: ${available}`,
          );
        }
      }
    }

    // Montar operações de baixa
    const decrementOps = product.compositionItems.map((item) => {
      const qty = item.quantity.toNumber() * produceDto.quantity;

      if (item.materialId) {
        return this.prisma.client.primaryMaterial.update({
          where: { id: item.materialId },
          data: { currentStock: { decrement: qty } },
        });
      }

      // subProduct
      return this.prisma.client.product.update({
        where: { id: item.subProductId! },
        data: { quantity: { decrement: qty } },
      });
    });

    await this.prisma.client.$transaction([
      ...decrementOps,
      this.prisma.client.product.update({
        where: { id },
        data: { quantity: { increment: produceDto.quantity } },
      }),
    ]);

    return {
      message: `${produceDto.quantity} unidade(s) de ${product.name} produzida(s) com sucesso`,
      productId: id,
      quantityProduced: produceDto.quantity,
    };
  }

  /**
   * Deletar produto
   */
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.client.product.delete({ where: { id } });

    return { message: 'Produto deletado com sucesso' };
  }

  /**
   * Resumo de produtos
   */
  async getSummary() {
    const totalProducts = await this.prisma.client.product.count();
    const activeProducts = await this.prisma.client.product.count({
      where: { active: true },
    });
    const inactiveProducts = totalProducts - activeProducts;

    const products = await this.prisma.client.product.findMany({
      select: { quantity: true, price: true, minStock: true },
    });

    const totalStockValue = products.reduce(
      (sum, p) => sum + p.quantity.toNumber() * p.price.toNumber(),
      0,
    );

    const productsLowStock = products.filter(
      (p) => p.minStock && p.quantity.toNumber() <= p.minStock.toNumber(),
    ).length;

    const totalItems = products.reduce(
      (sum, p) => sum + p.quantity.toNumber(),
      0,
    );

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
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
      where: {
        AND: [
          { minStock: { not: null } },
          {
            quantity: {
              lte: this.prisma.client.product.fields.minStock,
            },
          },
        ],
      },
      include: { category: true },
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

  /**
   * Sugerir próximo código
   */
  async getSuggestCode() {
    const lastProduct = await this.prisma.client.product.findFirst({
      orderBy: { id: 'desc' },
    });

    const nextNumber = lastProduct ? lastProduct.id + 1 : 1;
    const suggestedCode = `PROD-${String(nextNumber).padStart(4, '0')}`;

    return { code: suggestedCode };
  }

  // ---------------------------------------------------------------------------
  // Privados
  // ---------------------------------------------------------------------------

  /**
   * Valida itens da composição:
   * - Cada item deve ter exatamente materialId OU subProductId
   * - Matérias-primas devem existir e estar ativas
   * - Subprodutos devem existir, estar ativos e ser SEMI_MANUFACTURED
   */
  private async validateCompositionItems(
    items: Array<{
      materialId?: number;
      subProductId?: number;
      quantity: number;
    }>,
  ) {
    for (const item of items) {
      const hasMaterial = !!item.materialId;
      const hasSubProduct = !!item.subProductId;

      if (hasMaterial === hasSubProduct) {
        throw new BadRequestException(
          'Cada item da composição deve ter exatamente materialId ou subProductId, não ambos nem nenhum',
        );
      }
    }

    const materialIds = items
      .filter((i) => i.materialId)
      .map((i) => i.materialId!);

    if (materialIds.length > 0) {
      const materials = await this.prisma.client.primaryMaterial.findMany({
        where: { id: { in: materialIds } },
      });

      if (materials.length !== materialIds.length) {
        const foundIds = materials.map((m) => m.id);
        const missing = materialIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Matéria(s)-prima(s) com ID(s) ${missing.join(', ')} não encontrada(s)`,
        );
      }

      const inactive = materials.filter((m) => !m.active);
      if (inactive.length > 0) {
        throw new BadRequestException(
          `Matéria(s)-prima(s) inativa(s): ${inactive.map((m) => m.name).join(', ')}`,
        );
      }
    }

    const subProductIds = items
      .filter((i) => i.subProductId)
      .map((i) => i.subProductId!);

    if (subProductIds.length > 0) {
      const subProducts = await this.prisma.client.product.findMany({
        where: { id: { in: subProductIds } },
      });

      if (subProducts.length !== subProductIds.length) {
        const foundIds = subProducts.map((p) => p.id);
        const missing = subProductIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Subproduto(s) com ID(s) ${missing.join(', ')} não encontrado(s)`,
        );
      }

      const invalid = subProducts.filter(
        (p) => !p.active || p.productType !== ProductType.SEMI_MANUFACTURED,
      );

      if (invalid.length > 0) {
        throw new BadRequestException(
          `Produto(s) inválido(s) como subproduto (deve ser ativo e SEMI_MANUFACTURED): ${invalid.map((p) => p.name).join(', ')}`,
        );
      }
    }
  }

  /**
   * Calcula custo total da composição somando matérias-primas e subprodutos
   */
  private async calculateCompositionCost(
    items: Array<{
      materialId?: number;
      subProductId?: number;
      quantity: number;
    }>,
  ): Promise<number> {
    let total = 0;

    const materialIds = items
      .filter((i) => i.materialId)
      .map((i) => i.materialId!);

    const subProductIds = items
      .filter((i) => i.subProductId)
      .map((i) => i.subProductId!);

    const [materials, subProducts] = await Promise.all([
      materialIds.length > 0
        ? this.prisma.client.primaryMaterial.findMany({
            where: { id: { in: materialIds } },
          })
        : ([] as { id: number; unitCost: Prisma.Decimal }[]),
      subProductIds.length > 0
        ? this.prisma.client.product.findMany({
            where: { id: { in: subProductIds } },
            select: { id: true, costPrice: true },
          })
        : ([] as { id: number; costPrice: Prisma.Decimal }[]),
    ]);

    for (const item of items) {
      if (item.materialId) {
        const material = materials.find((m) => m.id === item.materialId);
        if (material) {
          total += material.unitCost.toNumber() * item.quantity;
        }
      } else if (item.subProductId) {
        const subProduct = subProducts.find((p) => p.id === item.subProductId);
        if (subProduct) {
          total += subProduct.costPrice.toNumber() * item.quantity;
        }
      }
    }

    return total;
  }
}
