import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ProductType } from 'generated/prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { PaginatedResponseDto } from 'src/common/utils/paginated-response';
import { UploadedImage, UploadsService } from 'src/common/uploads/uploads.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto, PRODUCT_SORT_KEYS, SORT_ORDERS } from './dto/filter-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { COMPOSITION_INCLUDE, PRODUCT_DETAIL_INCLUDE, ProductDetail, TYPES_WITH_COMPOSITION } from './product.constants';
import { ProductCompositionService } from './product-composition.service';
import { ProductStockService } from './product-stock.service';

const UPLOADS_FOLDER = 'products';

// prettier-ignore
const PLAIN_FIELDS = [
  'name', 'code', 'productionLocation', 'ncm', 'cest', 'origin',
  'csosn', 'cst', 'cstPis', 'cstCofins', 'unit', 'active',
  'productType', 'categoryId', 'description', 'featured', 'onlineVisible', 'onlineSortOrder',
] as const;

// prettier-ignore
const DECIMAL_FIELDS = [
  'price', 'costPrice', 'extraCosts', 'promoPrice', 'quantity', 'minStock',
  'icmsRate', 'pisRate', 'cofinsRate', 'federalTaxRate', 'stateTaxRate', 'municipalTaxRate',
] as const;

const DATE_FIELDS = ['promoStartsAt', 'promoEndsAt'] as const;

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly composition: ProductCompositionService,
    private readonly stock: ProductStockService,
    private readonly uploads: UploadsService,
  ) {}

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

  private conflict(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new ConflictException(message);
  }

  private notFound(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new NotFoundException(message);
  }

  private async findProduct(id: number, actor: string): Promise<ProductDetail> {
    const product = await this.prisma.client.product.findUnique({ where: { id }, include: PRODUCT_DETAIL_INCLUDE });

    if (!product) {
      this.notFound(`Produto com ID ${id} não encontrado`, actor);
    }

    return product;
  }

  private toDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined;
    return value === null ? null : new Date(value);
  }

  private async assertCodeAvailable(code: string, actor: string, ignoreId?: number): Promise<void> {
    const existing = await this.prisma.client.product.findFirst({
      where: { code, ...(ignoreId !== undefined && { id: { not: ignoreId } }) },
      select: { id: true },
    });

    if (existing) {
      this.conflict(`Produto com código ${code} já existe`, actor);
    }
  }

  private async assertNameAvailable(name: string, actor: string, ignoreId?: number): Promise<void> {
    const existing = await this.prisma.client.product.findFirst({
      where: { name: { equals: name }, ...(ignoreId !== undefined && { id: { not: ignoreId } }) },
      select: { id: true },
    });

    if (existing) {
      this.conflict(`Produto com nome "${name}" já existe`, actor);
    }
  }

  private async assertCategoryExists(categoryId: number, actor: string): Promise<void> {
    const category = await this.prisma.client.category.findUnique({ where: { id: categoryId }, select: { id: true } });

    if (!category) {
      this.notFound(`Categoria com ID ${categoryId} não encontrada`, actor);
    }
  }

  // Preço, início e fim vêm juntos ou nenhum, e o fim é posterior ao início
  private validatePromotion(
    price: number | null | undefined,
    startsAt: Date | null | undefined,
    endsAt: Date | null | undefined,
    actor: string,
  ): void {
    if (price == null && !startsAt && !endsAt) return;

    if (price == null || !startsAt || !endsAt) {
      this.badRequest('Informe o preço promocional, o início e o fim da promoção juntos', actor);
    }

    if (endsAt.getTime() <= startsAt.getTime()) {
      this.badRequest('O fim da promoção deve ser posterior ao início', actor);
    }
  }

  // Só os campos enviados que realmente mudaram em relação ao registro atual
  private diff(current: ProductDetail, dto: UpdateProductDto): Prisma.ProductUncheckedUpdateInput {
    const changes: Record<string, unknown> = {};

    for (const key of PLAIN_FIELDS) {
      const value = dto[key];
      if (value !== undefined && value !== current[key]) {
        changes[key] = value;
      }
    }

    for (const key of DECIMAL_FIELDS) {
      const value = dto[key];
      if (value === undefined) continue;

      if (value !== (current[key]?.toNumber() ?? null)) {
        changes[key] = value;
      }
    }

    for (const key of DATE_FIELDS) {
      const value = this.toDate(dto[key]);
      if (value === undefined) continue;

      if ((value?.getTime() ?? null) !== (current[key]?.getTime() ?? null)) {
        changes[key] = value;
      }
    }

    return changes as Prisma.ProductUncheckedUpdateInput;
  }

  /**
   * Criar produto (com ou sem composição/preparo)
   */
  async create(createDto: CreateProductDto, actor: string) {
    try {
      await this.assertCodeAvailable(createDto.code, actor);
      await this.assertNameAvailable(createDto.name, actor);

      if (createDto.categoryId != null) {
        await this.assertCategoryExists(createDto.categoryId, actor);
      }

      const hasComposition = TYPES_WITH_COMPOSITION.includes(createDto.productType);

      if (createDto.productType === ProductType.RESALE && (createDto.composition || createDto.preparationSteps)) {
        this.badRequest('Produtos para revenda não podem ter composição ou modo de preparo', actor);
      }

      if (hasComposition && (!createDto.composition || createDto.composition.length === 0)) {
        this.badRequest('Produtos manufaturados ou semiprontos devem ter ao menos um item na composição', actor);
      }

      if (hasComposition && createDto.composition) {
        await this.composition.validateCompositionItems(createDto.composition, actor);
      }

      if (hasComposition && createDto.preparationSteps) {
        this.composition.validatePreparationSteps(createDto.preparationSteps, actor);
      }

      const promoStartsAt = this.toDate(createDto.promoStartsAt);
      const promoEndsAt = this.toDate(createDto.promoEndsAt);

      this.validatePromotion(createDto.promoPrice, promoStartsAt, promoEndsAt, actor);

      const product = await this.prisma.client.product.create({
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
          description: createDto.description,
          featured: createDto.featured,
          onlineVisible: createDto.onlineVisible,
          onlineSortOrder: createDto.onlineSortOrder,
          promoPrice: createDto.promoPrice,
          promoStartsAt,
          promoEndsAt,
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
              ? { create: createDto.preparationSteps.map((step) => ({ order: step.order, description: step.description })) }
              : undefined,
        },
        include: PRODUCT_DETAIL_INCLUDE,
      });

      this.logger.log(`Produto criado (actor=${actor}, id=${product.id})`);

      return product;
    } catch (error) {
      this.rethrow(error, `Falha ao criar produto (actor=${actor})`);
    }
  }

  /**
   * Listar produtos com filtros e paginação
   */
  async findAll(
    actor: string,
    page: number = 1,
    limit: number = 10,
    filters?: FilterProductDto,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      this.badRequest('A página ou a quantidade de itens por página está incorreta', actor);
    }

    if (!(PRODUCT_SORT_KEYS as readonly string[]).includes(sortKey)) {
      this.badRequest('Campo de ordenação inválido', actor);
    }

    if (!(SORT_ORDERS as readonly string[]).includes(sortOrder)) {
      this.badRequest('Direção de ordenação inválida', actor);
    }

    const where: Prisma.ProductWhereInput = { active: filters?.active ?? true };

    if (filters?.productType) {
      where.productType = filters.productType;
    }

    if (filters?.unit) {
      where.unit = filters.unit;
    }

    if (filters?.categoryId !== undefined) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.onlineVisible !== undefined) {
      where.onlineVisible = filters.onlineVisible;
    }

    if (filters?.search) {
      where.OR = [{ name: { contains: filters.search } }, { code: { contains: filters.search } }];
    }

    if (filters?.lowStock) {
      where.AND = [{ quantity: { lte: this.prisma.client.product.fields.minStock } }, { minStock: { not: null } }];
    }

    const [products, total] = await Promise.all([
      this.prisma.client.product.findMany({
        where,
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, ...COMPOSITION_INCLUDE },
      }),
      this.prisma.client.product.count({ where }),
    ]);

    const data = await Promise.all(
      products.map(async (product) => {
        product.quantity = await this.stock.syncQuantity(product);
        return new ProductResponseDto(product);
      }),
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Buscar produto por ID
   */
  async findOne(id: number, actor: string) {
    const product = await this.findProduct(id, actor);
    product.quantity = await this.stock.syncQuantity(product);
    return product;
  }

  /**
   * Buscar produto por código
   */
  async findByCode(code: string, actor: string) {
    const product = await this.prisma.client.product.findUnique({ where: { code }, include: PRODUCT_DETAIL_INCLUDE });

    if (!product) {
      this.notFound(`Produto com código ${code} não encontrado`, actor);
    }

    product.quantity = await this.stock.syncQuantity(product);

    return new ProductResponseDto(product);
  }

  /**
   * Atualizar produto
   */
  async update(id: number, updateDto: UpdateProductDto, actor: string) {
    try {
      const current = await this.findProduct(id, actor);
      const changes = this.diff(current, updateDto);
      const fields = Object.keys(changes);

      if (fields.length === 0) {
        this.logger.warn(`Edição do produto sem alterações (actor=${actor}, id=${id})`);
        return current;
      }

      if (typeof changes.code === 'string') {
        await this.assertCodeAvailable(changes.code, actor, id);
      }

      if (typeof changes.name === 'string') {
        await this.assertNameAvailable(changes.name, actor, id);
      }

      if (typeof changes.categoryId === 'number') {
        await this.assertCategoryExists(changes.categoryId, actor);
      }

      // A promoção é validada pelo estado final: o que foi enviado, ou o atual
      this.validatePromotion(
        updateDto.promoPrice !== undefined ? updateDto.promoPrice : (current.promoPrice?.toNumber() ?? null),
        this.toDate(updateDto.promoStartsAt) !== undefined ? this.toDate(updateDto.promoStartsAt) : current.promoStartsAt,
        this.toDate(updateDto.promoEndsAt) !== undefined ? this.toDate(updateDto.promoEndsAt) : current.promoEndsAt,
        actor,
      );

      const product = await this.prisma.client.product.update({ where: { id }, data: changes, include: PRODUCT_DETAIL_INCLUDE });

      // Só nomes dos campos, nunca valores
      this.logger.log(`Produto editado (actor=${actor}, id=${id}, campos=${fields.join(',')})`);

      return product;
    } catch (error) {
      this.rethrow(error, `Falha ao editar produto (actor=${actor}, id=${id})`);
    }
  }

  /**
   * Enviar a imagem do produto (cardápio online)
   */
  async uploadImage(id: number, file: UploadedImage, actor: string) {
    try {
      const current = await this.findProduct(id, actor);

      // Ordem do guia (2.7): grava o novo, atualiza o banco e só então apaga o antigo
      const imageUrl = await this.uploads.saveImage(file, UPLOADS_FOLDER, actor);

      let product: ProductDetail;
      try {
        product = await this.prisma.client.product.update({ where: { id }, data: { imageUrl }, include: PRODUCT_DETAIL_INCLUDE });
      } catch (error) {
        await this.uploads.remove(imageUrl, actor);
        throw error;
      }

      await this.uploads.remove(current.imageUrl, actor);

      this.logger.log(`Imagem do produto atualizada (actor=${actor}, id=${id})`);

      return product;
    } catch (error) {
      this.rethrow(error, `Falha ao enviar imagem do produto (actor=${actor}, id=${id})`);
    }
  }

  /**
   * Deletar produto
   */
  async remove(id: number, actor: string) {
    try {
      const product = await this.findProduct(id, actor);

      try {
        await this.prisma.client.product.delete({ where: { id } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
          this.conflict(
            'Produto possui vínculos (pedidos, vendas, documentos, compras ou composições) e não pode ser deletado. Desative-o.',
            actor,
          );
        }
        throw error;
      }

      await this.uploads.remove(product.imageUrl, actor);

      this.logger.log(`Produto removido (actor=${actor}, id=${id})`);

      return { message: 'Produto deletado com sucesso' };
    } catch (error) {
      this.rethrow(error, `Falha ao remover produto (actor=${actor}, id=${id})`);
    }
  }

  /**
   * Sugerir próximo código
   */
  async getSuggestCode() {
    const lastProduct = await this.prisma.client.product.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });

    const nextNumber = lastProduct ? lastProduct.id + 1 : 1;

    return { code: `PROD-${String(nextNumber).padStart(4, '0')}` };
  }
}
