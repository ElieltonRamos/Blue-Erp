import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateProductionLocationDto } from './dto/create-production-location.dto';
import { UpdateProductionLocationDto } from './dto/update-production-location.dto';
import { ProductionLocation } from 'generated/prisma/browser';

@Injectable()
export class ProductionLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDto: CreateProductionLocationDto,
  ): Promise<ProductionLocation> {
    const existing = await this.prisma.client.productionLocation.findUnique({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Local de produção com código ${createDto.code} já existe`,
      );
    }

    const location = await this.prisma.client.productionLocation.create({
      data: createDto,
    });

    if (!location) {
      throw new InternalServerErrorException('Erro ao criar local de produção');
    }

    return location;
  }

  async findAll(): Promise<ProductionLocation[]> {
    const locations: ProductionLocation[] =
      await this.prisma.client.productionLocation.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      });

    if (!locations) {
      return [];
    }

    return locations;
  }

  async findAllIncludingInactive(): Promise<ProductionLocation[]> {
    const locations: ProductionLocation[] =
      await this.prisma.client.productionLocation.findMany({
        orderBy: { order: 'asc' },
      });

    return locations;
  }

  async findOne(id: number): Promise<ProductionLocation> {
    const location = await this.prisma.client.productionLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Local de produção ${id} não encontrado`);
    }

    return location;
  }

  async findByCode(code: string): Promise<ProductionLocation> {
    const location = await this.prisma.client.productionLocation.findUnique({
      where: { code },
    });

    if (!location) {
      throw new NotFoundException(
        `Local de produção com código ${code} não encontrado`,
      );
    }

    return location;
  }

  async update(
    id: number,
    updateDto: UpdateProductionLocationDto,
  ): Promise<ProductionLocation> {
    if (updateDto.code) {
      const existing = await this.prisma.client.productionLocation.findUnique({
        where: { code: updateDto.code },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Código ${updateDto.code} já está em uso`,
        );
      }
    }

    try {
      const updated = await this.prisma.client.productionLocation.update({
        where: { id },
        data: updateDto,
      });

      if (!updated) {
        throw new NotFoundException(`Local de produção ${id} não encontrado`);
      }

      return updated;
    } catch {
      throw new NotFoundException(`Local de produção ${id} não encontrado`);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const location = await this.findOne(id);

    const [usedInProducts, usedInProduction] = await Promise.all([
      this.prisma.client.product.count({
        where: { productionLocation: location.code },
      }),
      this.prisma.client.orderProduction.count({
        where: { productionLocation: location.code },
      }),
    ]);

    if (usedInProducts > 0 || usedInProduction > 0) {
      throw new BadRequestException(
        'Não é possível excluir um local de produção em uso. Desative-o ao invés disso.',
      );
    }

    await this.prisma.client.productionLocation.delete({
      where: { id },
    });

    return { message: 'Local de produção excluído com sucesso' };
  }

  async toggleActive(id: number): Promise<ProductionLocation> {
    const location = await this.findOne(id);

    const updated = await this.prisma.client.productionLocation.update({
      where: { id },
      data: { active: !location.active },
    });

    if (!updated) {
      throw new InternalServerErrorException(
        'Erro ao atualizar local de produção',
      );
    }

    return updated;
  }
}
