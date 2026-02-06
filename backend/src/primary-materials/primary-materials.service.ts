import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePrimaryMaterialDto } from './dto/create-primary-material.dto';
import { UpdatePrimaryMaterialDto } from './dto/update-primary-material.dto';
import { FilterPrimaryMaterialDto } from './dto/filter-primary-material.dto';
import { AdjustStockDto, StockAdjustmentType } from './dto/adjust-stock.dto';
import { MaterialSummaryResponseDto } from './dto/material-summary-response.dto';
import { StockAlertResponseDto } from './dto/stock-alert-response.dto';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { PaginatedResponse } from 'src/common/paginated-response';
import { PrimaryMaterialResponseDto } from './dto/primary-material-list-response.dto';

@Injectable()
export class PrimaryMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreatePrimaryMaterialDto) {
    const existingCode = await this.prisma.client.primaryMaterial.findUnique({
      where: { code: createDto.code },
    });

    if (existingCode) {
      throw new ConflictException(
        `Matéria-prima com código ${createDto.code} já existe`,
      );
    }

    // Verificar se o nome já existe
    const existingName = await this.prisma.client.primaryMaterial.findFirst({
      where: {
        name: {
          equals: createDto.name,
        },
      },
    });

    if (existingName) {
      throw new ConflictException(
        `Matéria-prima com nome "${createDto.name}" já existe`,
      );
    }

    return this.prisma.client.primaryMaterial.create({
      data: {
        name: createDto.name,
        code: createDto.code,
        unit: createDto.unit,
        unitCost: createDto.unitCost,
        currentStock: createDto.currentStock ?? 0,
        active: createDto.active ?? true,
        ncm: createDto.ncm,
        cfop: createDto.cfop ?? '5102',
        minStock: createDto.minStock,
        expiryDate: createDto.expiryDate,
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterPrimaryMaterialDto,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Promise<PaginatedResponse<PrimaryMaterialResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      throw new BadRequestException(
        'A página ou a quantidade de itens por página está incorreta',
      );
    }

    const offset = (page - 1) * limit;

    const where: Prisma.PrimaryMaterialWhereInput = {};

    // Filtro de active: se não for fornecido, busca apenas ativos
    if (filters?.active !== undefined) {
      where.active = filters.active;
    } else {
      where.active = true;
    }

    // Filtro por unidade
    if (filters?.unit) {
      where.unit = filters.unit;
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
          currentStock: {
            lte: this.prisma.client.primaryMaterial.fields.minStock,
          },
        },
        {
          minStock: {
            not: null,
          },
        },
      ];
    }

    const materials = await this.prisma.client.primaryMaterial.findMany({
      where,
      orderBy: { [sortKey]: sortOrder },
      skip: offset,
      take: limit,
    });

    const total = await this.prisma.client.primaryMaterial.count({
      where,
    });

    const data = materials.map(
      (material) => new PrimaryMaterialResponseDto(material),
    );
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const material = await this.prisma.client.primaryMaterial.findUnique({
      where: { id },
      include: {
        compositionItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException(`Matéria-prima com ID ${id} não encontrada`);
    }

    return {
      ...material,
      usedInProducts: material.compositionItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productCode: item.product.code,
        quantityUsed: item.quantity,
      })),
      totalProductsUsing: material.compositionItems.length,
    };
  }

  async findByCode(code: string) {
    const material = await this.prisma.client.primaryMaterial.findUnique({
      where: { code },
    });

    if (!material) {
      throw new NotFoundException(
        `Matéria-prima com código ${code} não encontrada`,
      );
    }

    return material;
  }

  async update(id: number, updateDto: UpdatePrimaryMaterialDto) {
    await this.findOne(id);

    if (updateDto.code) {
      const existingCode = await this.prisma.client.primaryMaterial.findFirst({
        where: {
          code: updateDto.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new ConflictException(
          `Matéria-prima com código ${updateDto.code} já existe`,
        );
      }
    }

    // Verificar nome duplicado (se estiver sendo alterado)
    if (updateDto.name) {
      const existingName = await this.prisma.client.primaryMaterial.findFirst({
        where: {
          name: {
            equals: updateDto.name,
          },
          id: { not: id },
        },
      });

      if (existingName) {
        throw new ConflictException(
          `Matéria-prima com nome "${updateDto.name}" já existe`,
        );
      }
    }

    // Atualizar matéria-prima
    const updatedMaterial = await this.prisma.client.primaryMaterial.update({
      where: { id },
      data: updateDto,
    });

    // Se o custo unitário foi alterado, atualizar produtos que usam esta matéria-prima
    if (updateDto.unitCost !== undefined) {
      await this.updateProductsCost(id);
    }

    return updatedMaterial;
  }

  private async updateProductsCost(materialId: number) {
    const compositionItems = await this.prisma.client.compositionItem.findMany({
      where: { materialId },
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
    });

    // Atualizar o custo de cada produto
    const updates = compositionItems.map(async (item) => {
      const product = item.product;

      // Calcular novo custo baseado em todas as matérias-primas
      const totalCost = product.compositionItems.reduce((sum, compItem) => {
        const materialCost = compItem.material.unitCost.toNumber();
        const quantity = compItem.quantity.toNumber();
        return sum + materialCost * quantity;
      }, 0);

      // Atualizar custo do produto
      return this.prisma.client.product.update({
        where: { id: product.id },
        data: { costPrice: totalCost },
      });
    });

    await Promise.all(updates);

    // Log informativo
    if (compositionItems.length > 0) {
      console.log(
        `Custos atualizados para ${compositionItems.length} produto(s) que usam a matéria-prima #${materialId}`,
      );
    }
  }

  async remove(id: number) {
    // Verificar se existe
    const material = await this.findOne(id);

    // Verificar se está sendo usada em produtos
    if (material.totalProductsUsing > 0) {
      throw new BadRequestException(
        `Não é possível remover a matéria-prima ${material.name} pois está sendo usada em ${material.totalProductsUsing} produto(s)`,
      );
    }

    // Soft delete - apenas marca como inativo
    return this.prisma.client.primaryMaterial.update({
      where: { id },
      data: { active: false },
    });
  }

  async forceDelete(id: number) {
    // Verificar se existe
    const material = await this.findOne(id);

    // Verificar se está sendo usada em produtos
    if (material.totalProductsUsing > 0) {
      throw new BadRequestException(
        `Não é possível deletar a matéria-prima ${material.name} pois está sendo usada em ${material.totalProductsUsing} produto(s)`,
      );
    }

    return this.prisma.client.primaryMaterial.delete({
      where: { id },
    });
  }

  async adjustStock(id: number, adjustDto: AdjustStockDto) {
    const material = await this.prisma.client.primaryMaterial.findUnique({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException(`Matéria-prima com ID ${id} não encontrada`);
    }

    const previousStock = material.currentStock;
    let newStock: number;

    switch (adjustDto.type) {
      case StockAdjustmentType.IN:
        // Entrada - adiciona ao estoque
        newStock = Number(previousStock) + Number(adjustDto.quantity);
        break;

      case StockAdjustmentType.OUT:
        // Saída - remove do estoque
        newStock = Number(previousStock) - Number(adjustDto.quantity);
        if (newStock < 0) {
          throw new BadRequestException(
            `Estoque insuficiente. Estoque atual: ${Number(previousStock)}, tentando remover: ${adjustDto.quantity}`,
          );
        }
        break;

      case StockAdjustmentType.SET:
        // Definir valor exato
        newStock = Number(adjustDto.quantity);
        break;

      default:
        throw new BadRequestException('Tipo de ajuste inválido');
    }

    // Atualizar estoque
    const updatedMaterial = await this.prisma.client.primaryMaterial.update({
      where: { id },
      data: { currentStock: newStock },
    });

    return {
      materialId: updatedMaterial.id,
      materialName: updatedMaterial.name,
      type: adjustDto.type,
      previousStock: Number(previousStock),
      adjustedQuantity: Number(adjustDto.quantity),
      newStock: Number(newStock),
      reason: adjustDto.reason,
      adjustedAt: new Date(),
    };
  }

  async getSuggestedCode() {
    const lastMaterial = await this.prisma.client.primaryMaterial.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    // Tenta extrair número do código
    if (lastMaterial && lastMaterial.code) {
      const match = lastMaterial.code.match(/\d+/);
      if (match) {
        const lastNumber = parseInt(match[0], 10);
        return { code: lastNumber + 1 };
      }
    }

    return { code: 1 };
  }

  async getSummary(): Promise<MaterialSummaryResponseDto> {
    const materials = await this.prisma.client.primaryMaterial.findMany({
      select: {
        active: true,
        currentStock: true,
        unitCost: true,
      },
    });

    const totalMaterials = materials.length;
    const activeMaterials = materials.filter((m) => m.active).length;
    const inactiveMaterials = totalMaterials - activeMaterials;

    const totalStockValue = materials.reduce((sum, material) => {
      return sum + Number(material.currentStock) * Number(material.unitCost);
    }, 0);

    const totalItems = materials.reduce((sum, material) => {
      return sum + Number(material.currentStock);
    }, 0);

    // Materiais com estoque zero ou baixo (você pode ajustar a lógica)
    const materialsLowStock = materials.filter(
      (m) => Number(m.currentStock) === 0,
    ).length;

    return {
      totalMaterials,
      activeMaterials,
      inactiveMaterials,
      totalStockValue: Number(totalStockValue.toFixed(2)),
      materialsLowStock,
      totalItems: Number(totalItems.toFixed(3)),
    };
  }

  async getStockAlerts(): Promise<StockAlertResponseDto[]> {
    const materials = await this.prisma.client.primaryMaterial.findMany({
      where: {
        active: true,
        currentStock: {
          lte: 0, // Estoque zero ou negativo
        },
      },
      orderBy: { currentStock: 'asc' },
    });

    return materials.map((material) => ({
      id: material.id,
      name: material.name,
      code: material.code,
      unit: material.unit,
      currentStock: Number(material.currentStock),
      unitCost: Number(material.unitCost),
      estimatedValue: Number(material.currentStock) * Number(material.unitCost),
    }));
  }
}
