import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { PaginatedResponse } from 'src/common/paginated-response';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category-product.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CategoryResponseDto } from './dto/response-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCategoryDto) {
    const existing = await this.prisma.client.category.findFirst({
      where: { name: { equals: createDto.name } },
    });

    if (existing) {
      throw new ConflictException(
        `Categoria com nome "${createDto.name}" já existe`,
      );
    }

    return this.prisma.client.category.create({
      data: {
        name: createDto.name,
        active: createDto.active ?? true,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterCategoryDto,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Promise<PaginatedResponse<CategoryResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      throw new BadRequestException(
        'A página ou a quantidade de itens por página está incorreta',
      );
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

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.client.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
    }

    return category;
  }

  async update(id: number, updateDto: UpdateCategoryDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.client.category.findFirst({
        where: { name: { equals: updateDto.name }, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException(
          `Categoria com nome "${updateDto.name}" já existe`,
        );
      }
    }

    return this.prisma.client.category.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const hasProducts = await this.prisma.client.product.count({
      where: { categoryId: id },
    });

    if (hasProducts > 0) {
      throw new BadRequestException(
        `Categoria possui ${hasProducts} produto(s) vinculado(s) e não pode ser deletada`,
      );
    }

    await this.prisma.client.category.delete({ where: { id } });

    return { message: 'Categoria deletada com sucesso' };
  }
}
