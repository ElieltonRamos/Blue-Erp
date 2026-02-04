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

@Injectable()
export class PrimaryMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar nova matéria-prima
   */
  async create(createDto: CreatePrimaryMaterialDto) {
    // Verificar se o código já existe
    const existingMaterial =
      await this.prisma.client.primaryMaterial.findUnique({
        where: { code: createDto.code },
      });

    if (existingMaterial) {
      throw new ConflictException(
        `Matéria-prima com código ${createDto.code} já existe`,
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

  /**
   * Listar todas as matérias-primas com filtros
   */
  async findAll(filters?: FilterPrimaryMaterialDto) {
    const where: Prisma.PrimaryMaterialWhereInput = {};

    // Filtro por ativo/inativo
    if (filters?.active !== undefined) {
      where.active = filters.active;
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

    // Buscar materiais
    const materials = await this.prisma.client.primaryMaterial.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      data: materials,
      total: materials.length,
    };
  }

  /**
   * Buscar matéria-prima por ID
   */
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

  /**
   * Buscar matéria-prima por código
   */
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

  /**
   * Atualizar matéria-prima
   */
  async update(id: number, updateDto: UpdatePrimaryMaterialDto) {
    // Verificar se existe
    await this.findOne(id);

    // Se estiver alterando o código, verificar se não está duplicado
    if (updateDto.code) {
      const existingMaterial =
        await this.prisma.client.primaryMaterial.findUnique({
          where: { code: updateDto.code },
        });

      if (existingMaterial && existingMaterial.id !== id) {
        throw new ConflictException(
          `Matéria-prima com código ${updateDto.code} já existe`,
        );
      }
    }

    return this.prisma.client.primaryMaterial.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Remover matéria-prima (soft delete)
   */
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

  /**
   * Deletar permanentemente (hard delete)
   */
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

  /**
   * Ajustar estoque
   */
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

  /**
   * Obter sugestão de código (próximo número disponível)
   */
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

  /**
   * Obter resumo/estatísticas
   */
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

  /**
   * Listar alertas de estoque baixo
   */
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
