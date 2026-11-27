import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { PaginatedResponseDto } from 'src/common/utils/paginated-response';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CategoryResponseDto } from './dto/response-category.dto';
import { UpdateCategoryDto } from './dto/update-category-product.dto';

const SORT_KEYS = [
  'id',
  'name',
  'active',
  'onlineSortOrder',
  'createdAt',
  'updatedAt',
] as const;

const SORT_ORDERS = ['asc', 'desc'] as const;

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

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

  private conflict(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new ConflictException(message);
  }

  private async findCategory(id: number, actor: string): Promise<Category> {
    const category = await this.prisma.client.category.findUnique({
      where: { id },
    });

    if (!category) {
      const message = `Categoria com ID ${id} não encontrada`;
      this.logger.warn(`${message} (actor=${actor})`);
      throw new NotFoundException(message);
    }

    return category;
  }

  // Só os campos enviados que realmente mudaram em relação ao registro atual
  private diff(
    current: Category,
    dto: UpdateCategoryDto,
  ): Prisma.CategoryUpdateInput {
    const changes: Prisma.CategoryUpdateInput = {};

    if (dto.name !== undefined && dto.name !== current.name) {
      changes.name = dto.name;
    }
    if (dto.active !== undefined && dto.active !== current.active) {
      changes.active = dto.active;
    }
    if (
      dto.onlineVisible !== undefined &&
      dto.onlineVisible !== current.onlineVisible
    ) {
      changes.onlineVisible = dto.onlineVisible;
    }
    if (
      dto.onlineSortOrder !== undefined &&
      dto.onlineSortOrder !== current.onlineSortOrder
    ) {
      changes.onlineSortOrder = dto.onlineSortOrder;
    }

    return changes;
  }

  private async assertNameAvailable(
    name: string,
    actor: string,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.prisma.client.category.findFirst({
      where: {
        name: { equals: name },
        ...(ignoreId !== undefined && { id: { not: ignoreId } }),
      },
      select: { id: true },
    });

    if (existing) {
      this.conflict(`Categoria com nome "${name}" já existe`, actor);
    }
  }

  async create(createDto: CreateCategoryDto, actor: string) {
    try {
      await this.assertNameAvailable(createDto.name, actor);

      const category = await this.prisma.client.category.create({
        data: {
          name: createDto.name,
          active: createDto.active ?? true,
          onlineVisible: createDto.onlineVisible,
          onlineSortOrder: createDto.onlineSortOrder,
        },
      });

      this.logger.log(`Categoria criada (actor=${actor}, id=${category.id})`);

      return category;
    } catch (error) {
      this.rethrow(error, `Falha ao criar categoria (actor=${actor})`);
    }
  }

  async findAll(
    actor: string,
    page: number = 1,
    limit: number = 10,
    filters?: FilterCategoryDto,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      this.badRequest(
        'A página ou a quantidade de itens por página está incorreta',
        actor,
      );
    }

    if (!(SORT_KEYS as readonly string[]).includes(sortKey)) {
      this.badRequest('Campo de ordenação inválido', actor);
    }

    if (!(SORT_ORDERS as readonly string[]).includes(sortOrder)) {
      this.badRequest('Direção de ordenação inválida', actor);
    }

    const offset = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    } else {
      where.active = true;
    }

    if (filters?.search) {
      where.name = { contains: filters.search };
    }

    const [categories, total] = await Promise.all([
      this.prisma.client.category.findMany({
        where,
        orderBy: { [sortKey]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.client.category.count({ where }),
    ]);

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, actor: string) {
    return this.findCategory(id, actor);
  }

  async update(id: number, updateDto: UpdateCategoryDto, actor: string) {
    try {
      const current = await this.findCategory(id, actor);
      const changes = this.diff(current, updateDto);
      const fields = Object.keys(changes);

      if (fields.length === 0) {
        this.logger.warn(
          `Edição da categoria sem alterações (actor=${actor}, id=${id})`,
        );
        return current;
      }

      if (typeof changes.name === 'string') {
        await this.assertNameAvailable(changes.name, actor, id);
      }

      const category = await this.prisma.client.category.update({
        where: { id },
        data: changes,
      });

      // Só nomes dos campos, nunca valores
      this.logger.log(
        `Categoria editada (actor=${actor}, id=${id}, campos=${fields.join(',')})`,
      );

      return category;
    } catch (error) {
      this.rethrow(
        error,
        `Falha ao editar categoria (actor=${actor}, id=${id})`,
      );
    }
  }

  async remove(id: number, actor: string) {
    try {
      await this.findCategory(id, actor);

      const hasProducts = await this.prisma.client.product.count({
        where: { categoryId: id },
      });

      if (hasProducts > 0) {
        this.badRequest(
          `Categoria possui ${hasProducts} produto(s) vinculado(s) e não pode ser deletada`,
          actor,
        );
      }

      await this.prisma.client.category.delete({ where: { id } });

      this.logger.log(`Categoria removida (actor=${actor}, id=${id})`);

      return { message: 'Categoria deletada com sucesso' };
    } catch (error) {
      this.rethrow(
        error,
        `Falha ao remover categoria (actor=${actor}, id=${id})`,
      );
    }
  }
}
