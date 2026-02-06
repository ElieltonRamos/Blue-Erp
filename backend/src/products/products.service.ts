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

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar produto (com ou sem composição/preparo)
   */
  async create(createDto: CreateProductDto) {
    // Verificar se o código já existe
    const existingCode = await this.prisma.client.product.findUnique({
      where: { code: createDto.code },
    });

    if (existingCode) {
      throw new ConflictException(
        `Produto com código ${createDto.code} já existe`,
      );
    }

    // Verificar se o nome já existe
    const existingName = await this.prisma.client.product.findFirst({
      where: {
        name: {
          equals: createDto.name,
        },
      },
    });

    if (existingName) {
      throw new ConflictException(
        `Produto com nome "${createDto.name}" já existe`,
      );
    }

    // Verificar se a categoria existe (se fornecida)
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

    // Verificar se as matérias-primas existem (se fornecidas)
    if (
      createDto.productType === ProductType.MANUFACTURED &&
      createDto.composition &&
      createDto.composition.length > 0
    ) {
      const materialIds = createDto.composition.map((item) => item.materialId);
      const materials = await this.prisma.client.primaryMaterial.findMany({
        where: { id: { in: materialIds } },
      });

      if (materials.length !== materialIds.length) {
        const foundIds = materials.map((m) => m.id);
        const missingIds = materialIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Matéria(s)-prima(s) com ID(s) ${missingIds.join(', ')} não encontrada(s)`,
        );
      }

      // Verificar se as matérias-primas estão ativas
      const inactiveMaterials = materials.filter((m) => !m.active);
      if (inactiveMaterials.length > 0) {
        throw new BadRequestException(
          `Matéria(s)-prima(s) inativa(s): ${inactiveMaterials.map((m) => m.name).join(', ')}`,
        );
      }
    }

    // Validar que produto MANUFACTURED deve ter composição
    if (
      createDto.productType === ProductType.MANUFACTURED &&
      (!createDto.composition || createDto.composition.length === 0)
    ) {
      throw new BadRequestException(
        'Produtos manufaturados devem ter ao menos uma matéria-prima na composição',
      );
    }

    // Validar que produto RESALE não deve ter composição
    if (
      createDto.productType === ProductType.RESALE &&
      (createDto.composition || createDto.preparationSteps)
    ) {
      throw new BadRequestException(
        'Produtos para revenda não podem ter composição ou modo de preparo',
      );
    }

    // Criar produto com composição e preparo (se fornecidos)
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
        // Criar composição se fornecida e produto for MANUFACTURED
        compositionItems:
          createDto.productType === ProductType.MANUFACTURED &&
          createDto.composition
            ? {
                create: createDto.composition.map((item) => ({
                  materialId: item.materialId,
                  quantity: item.quantity,
                })),
              }
            : undefined,
        // Criar passos de preparo se fornecidos e produto for MANUFACTURED
        preparationSteps:
          createDto.productType === ProductType.MANUFACTURED &&
          createDto.preparationSteps
            ? {
                create: createDto.preparationSteps.map((step) => ({
                  order: step.order,
                  description: step.description,
                })),
              }
            : undefined,
      },
      include: {
        compositionItems: {
          include: {
            material: true,
          },
        },
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

    // Filtro de active: se não for fornecido, busca apenas ativos
    if (filters?.active !== undefined) {
      where.active = filters.active;
    } else {
      where.active = true;
    }

    // Filtro por tipo de produto
    if (filters?.productType) {
      where.productType = filters.productType;
    }

    // Filtro por unidade
    if (filters?.unit) {
      where.unit = filters.unit;
    }

    // Filtro por categoria
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // Busca por nome ou código
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
      ];
    }

    // Filtro de estoque baixo
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
        compositionItems: {
          include: {
            material: true,
          },
        },
      },
    });

    const total = await this.prisma.client.product.count({
      where,
    });

    // Sincronizar e atualizar estoque de produtos manufaturados
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        // Se for produto manufaturado, calcular e atualizar estoque
        if (
          product.productType === 'MANUFACTURED' &&
          product.compositionItems.length > 0
        ) {
          const availableStock = this.calculateAvailableStock(
            product.compositionItems,
          );

          // Sempre sobrescrever o estoque
          if (product.quantity.toNumber() !== availableStock) {
            await this.prisma.client.product.update({
              where: { id: product.id },
              data: { quantity: availableStock },
            });

            // Atualizar o objeto product com o novo estoque
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
   * Calcular quantas unidades do produto podem ser produzidas com o estoque atual de matérias-primas
   */
  private calculateAvailableStock(compositionItems: any[]): number {
    if (compositionItems.length === 0) {
      return 0;
    }

    // Calcular quantas unidades podem ser produzidas com cada matéria-prima
    const possibleQuantities = compositionItems.map((item) => {
      const materialStock = item.material.currentStock.toNumber();
      const requiredQuantity = item.quantity.toNumber();

      if (requiredQuantity === 0) {
        return 0;
      }

      // Quantas unidades do produto podem ser feitas com o estoque desta matéria-prima
      return Math.floor(materialStock / requiredQuantity);
    });

    // O estoque disponível é limitado pela matéria-prima com menor disponibilidade
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
        compositionItems: {
          include: {
            material: true,
          },
        },
        preparationSteps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    // Sincronizar estoque se for manufaturado
    if (
      product.productType === 'MANUFACTURED' &&
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
        compositionItems: {
          include: {
            material: true,
          },
        },
        preparationSteps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto com código ${code} não encontrado`);
    }

    // Sincronizar estoque se for manufaturado
    if (
      product.productType === 'MANUFACTURED' &&
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

    return product;
  }

  /**
   * Obter composição do produto
   */
  async getComposition(id: number) {
    const product = await this.findOne(id);

    if (product.productType !== ProductType.MANUFACTURED) {
      throw new BadRequestException(
        'Apenas produtos manufaturados possuem composição',
      );
    }

    return product.compositionItems;
  }

  /**
   * Obter passos de preparo do produto
   */
  async getPreparation(id: number) {
    const product = await this.findOne(id);

    if (product.productType !== ProductType.MANUFACTURED) {
      throw new BadRequestException(
        'Apenas produtos manufaturados possuem modo de preparo',
      );
    }

    return product.preparationSteps;
  }

  /**
   * Atualizar produto
   */
  async update(id: number, updateDto: UpdateProductDto) {
    await this.findOne(id);

    // Verificar código duplicado (se estiver sendo alterado)
    if (updateDto.code) {
      const existingCode = await this.prisma.client.product.findFirst({
        where: {
          code: updateDto.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new ConflictException(
          `Produto com código ${updateDto.code} já existe`,
        );
      }
    }

    // Verificar nome duplicado (se estiver sendo alterado)
    if (updateDto.name) {
      const existingName = await this.prisma.client.product.findFirst({
        where: {
          name: {
            equals: updateDto.name,
          },
          id: { not: id },
        },
      });

      if (existingName) {
        throw new ConflictException(
          `Produto com nome "${updateDto.name}" já existe`,
        );
      }
    }

    // Preparar dados para atualização
    const { categoryId, ...restData } = updateDto;

    const updateData: any = {
      ...restData,
    };

    // Adicionar categoryId apenas se fornecido
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    return this.prisma.client.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        compositionItems: {
          include: {
            material: true,
          },
        },
        preparationSteps: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Atualizar composição do produto
   */
  async updateComposition(id: number, compositionDto: UpdateCompositionDto) {
    const product = await this.findOne(id);

    if (product.productType !== ProductType.MANUFACTURED) {
      throw new BadRequestException(
        'Apenas produtos manufaturados podem ter composição',
      );
    }

    const materialIds = compositionDto.composition.map(
      (item) => item.materialId,
    );
    const materials = await this.prisma.client.primaryMaterial.findMany({
      where: { id: { in: materialIds } },
    });

    if (materials.length !== materialIds.length) {
      throw new BadRequestException('Uma ou mais matérias-primas não existem');
    }

    // Calcular preço de custo
    const costPrice = compositionDto.composition.reduce((total, item) => {
      const material = materials.find((m) => m.id === item.materialId);
      if (!material) {
        throw new BadRequestException(
          `Material ${item.materialId} não encontrado`,
        );
      }
      return total + Number(material.unitCost) * item.quantity;
    }, 0);

    await this.prisma.client.$transaction([
      this.prisma.client.compositionItem.deleteMany({
        where: { productId: id },
      }),
      this.prisma.client.compositionItem.createMany({
        data: compositionDto.composition.map((item) => ({
          productId: id,
          materialId: item.materialId,
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

    if (product.productType !== ProductType.MANUFACTURED) {
      throw new BadRequestException(
        'Apenas produtos manufaturados podem ter modo de preparo',
      );
    }

    // Deletar passos atuais e criar novos
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
   * Produzir produto (baixa matérias-primas, aumenta estoque)
   */
  async produce(id: number, produceDto: ProduceProductDto) {
    const product = await this.findOne(id);

    if (product.productType !== ProductType.MANUFACTURED) {
      throw new BadRequestException(
        'Apenas produtos manufaturados podem ser produzidos',
      );
    }

    if (!product.compositionItems || product.compositionItems.length === 0) {
      throw new BadRequestException('Produto não possui composição cadastrada');
    }

    // Verificar se há matérias-primas suficientes
    for (const item of product.compositionItems) {
      const requiredQuantity = item.quantity.toNumber() * produceDto.quantity;
      const availableStock = item.material.currentStock.toNumber();

      if (availableStock < requiredQuantity) {
        throw new BadRequestException(
          `Estoque insuficiente de ${item.material.name}. Necessário: ${requiredQuantity}, Disponível: ${availableStock}`,
        );
      }
    }

    // Baixar matérias-primas e aumentar estoque do produto
    await this.prisma.client.$transaction([
      // Baixar matérias-primas
      ...product.compositionItems.map((item) =>
        this.prisma.client.primaryMaterial.update({
          where: { id: item.materialId },
          data: {
            currentStock: {
              decrement: item.quantity.toNumber() * produceDto.quantity,
            },
          },
        }),
      ),
      // Aumentar estoque do produto
      this.prisma.client.product.update({
        where: { id },
        data: {
          quantity: {
            increment: produceDto.quantity,
          },
        },
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

    await this.prisma.client.product.delete({
      where: { id },
    });

    return {
      message: 'Produto deletado com sucesso',
    };
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
      select: {
        quantity: true,
        price: true,
        minStock: true,
      },
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
      include: {
        category: true,
      },
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

    return {
      code: suggestedCode,
    };
  }
}
