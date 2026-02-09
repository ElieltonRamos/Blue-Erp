/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateProductionLocationDto } from './dto/create-production-location.dto';
import { UpdateProductionLocationDto } from './dto/update-production-location.dto';

@Injectable()
export class ProductionLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProductionLocationDto) {
    // Validar se código já existe
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

    return location;
  }

  findAll() {
    return this.prisma.client.productionLocation.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
  }

  findAllIncludingInactive() {
    return this.prisma.client.productionLocation.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: number) {
    const location = await this.prisma.client.productionLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Local de produção ${id} não encontrado`);
    }

    return location;
  }

  async findByCode(code: string) {
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

  async update(id: number, updateDto: UpdateProductionLocationDto) {
    await this.findOne(id); // Valida se existe

    // Se está alterando o código, validar se não existe outro com esse código
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

    const updated = await this.prisma.client.productionLocation.update({
      where: { id },
      data: updateDto,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id); // Valida se existe

    // Verificar se está sendo usado
    const usedInProducts = await this.prisma.client.product.count({
      where: { productionLocation: (await this.findOne(id)).code },
    });

    const usedInProduction = await this.prisma.client.orderProduction.count({
      where: { productionLocation: (await this.findOne(id)).code },
    });

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

  async toggleActive(id: number) {
    const location = await this.findOne(id);

    const updated = await this.prisma.client.productionLocation.update({
      where: { id },
      data: { active: !location.active },
    });

    return updated;
  }
}
