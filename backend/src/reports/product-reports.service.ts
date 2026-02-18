import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ProductReportFilterDto } from './dto/create-report-product.dto';
import { ProductReportResponseDto } from './dto/response-report-product.dto';
import {
  ProductSalesItem,
  RawMaterialUsage,
  RawMaterialExpiring,
  StockLevel,
  PurchaseSuggestion,
} from './entities/product-report.entity';
import { validateDateFilters } from './utils/sale-report-utils';

const EXPIRY_ALERT_DAYS = 30;
const TOP_ITEMS_LIMIT = 10;
const STOCK_ITEMS_LIMIT = 10;

@Injectable()
export class ProductReportService {
  constructor(private prisma: PrismaService) {}

  private getStartOfDay(dateString: string): Date {
    return new Date(dateString + ' 00:00:00');
  }

  private getEndOfDay(dateString: string): Date {
    return new Date(dateString + ' 23:59:59.999');
  }

  private calcDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ──────────────────────────────────────────────
  // Top produtos vendidos + totalProductsSold + totalRevenue
  // ──────────────────────────────────────────────
  private async fetchTopSellingProducts(
    startDate: string,
    endDate: string,
  ): Promise<{
    items: ProductSalesItem[];
    totalSold: number;
    totalRevenue: number;
  }> {
    const saleItems = await this.prisma.client.saleItem.findMany({
      where: {
        sale: {
          date: {
            gte: this.getStartOfDay(startDate),
            lte: this.getEndOfDay(endDate),
          },
        },
        composesTotal: 1,
      },
      select: {
        quantity: true,
        totalPrice: true,
        product: {
          select: { name: true },
        },
      },
    });

    const map = new Map<string, { totalSold: number; revenue: number }>();

    let totalSold = 0;
    let totalRevenue = 0;

    for (const item of saleItems) {
      const qty = Number(item.quantity);
      const price = Number(item.totalPrice);
      const name = item.product.name;

      totalSold += qty;
      totalRevenue += price;

      const existing = map.get(name) ?? { totalSold: 0, revenue: 0 };
      map.set(name, {
        totalSold: existing.totalSold + qty,
        revenue: existing.revenue + price,
      });
    }

    const items: ProductSalesItem[] = Array.from(map.entries())
      .map(([productName, agg]) => ({
        productName,
        totalSold: Number(agg.totalSold.toFixed(3)),
        revenue: Number(agg.revenue.toFixed(2)),
        averagePrice:
          agg.totalSold > 0
            ? Number((agg.revenue / agg.totalSold).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, TOP_ITEMS_LIMIT);

    return {
      items,
      totalSold: Number(totalSold.toFixed(3)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
    };
  }

  // ──────────────────────────────────────────────
  // Matérias-primas mais usadas (cross SaleItem × CompositionItem)
  // ──────────────────────────────────────────────
  private async fetchMostUsedRawMaterials(
    startDate: string,
    endDate: string,
  ): Promise<RawMaterialUsage[]> {
    // Busca itens de venda com a composição do produto
    const saleItems = await this.prisma.client.saleItem.findMany({
      where: {
        sale: {
          date: {
            gte: this.getStartOfDay(startDate),
            lte: this.getEndOfDay(endDate),
          },
        },
        composesTotal: 1,
      },
      select: {
        quantity: true,
        saleId: true,
        product: {
          select: {
            compositionItems: {
              select: {
                quantity: true,
                material: {
                  select: { name: true, unit: true },
                },
              },
            },
          },
        },
      },
    });

    const map = new Map<
      string,
      { totalUsed: number; unit: string; saleIds: Set<number> }
    >();

    for (const saleItem of saleItems) {
      const soldQty = Number(saleItem.quantity);
      for (const comp of saleItem.product.compositionItems) {
        const materialName = comp.material.name;
        const used = Number(comp.quantity) * soldQty;

        const existing = map.get(materialName) ?? {
          totalUsed: 0,
          unit: comp.material.unit,
          saleIds: new Set<number>(),
        };
        existing.totalUsed += used;
        existing.saleIds.add(saleItem.saleId);
        map.set(materialName, existing);
      }
    }

    return Array.from(map.entries())
      .map(([materialName, agg]) => ({
        materialName,
        totalUsed: Number(agg.totalUsed.toFixed(3)),
        unit: agg.unit,
        usageFrequency: agg.saleIds.size,
      }))
      .sort((a, b) => b.totalUsed - a.totalUsed)
      .slice(0, TOP_ITEMS_LIMIT);
  }

  // ──────────────────────────────────────────────
  // Matérias-primas próximas do vencimento
  // ──────────────────────────────────────────────
  private async fetchExpiringRawMaterials(): Promise<RawMaterialExpiring[]> {
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + EXPIRY_ALERT_DAYS);

    const materials = await this.prisma.client.primaryMaterial.findMany({
      where: {
        active: true,
        expiryDate: {
          not: null,
          lte: alertDate,
          gte: new Date(),
        },
      },
      select: {
        name: true,
        expiryDate: true,
        currentStock: true,
        unit: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    return materials.map((m) => ({
      materialName: m.name,
      expiryDate: m.expiryDate!.toISOString(),
      daysUntilExpiry: this.calcDaysUntilExpiry(m.expiryDate!),
      currentStock: Number(m.currentStock),
      unit: m.unit,
    }));
  }

  // ──────────────────────────────────────────────
  // Níveis de estoque (produtos + matérias-primas)
  // ──────────────────────────────────────────────
  private async fetchStockLevels(): Promise<{
    lowest: StockLevel[];
    highest: StockLevel[];
  }> {
    const [products, materials] = await Promise.all([
      this.prisma.client.product.findMany({
        where: { active: true },
        select: { name: true, quantity: true, unit: true },
      }),
      this.prisma.client.primaryMaterial.findMany({
        where: { active: true },
        select: { name: true, currentStock: true, unit: true },
      }),
    ]);

    const allStocks: StockLevel[] = [
      ...products.map((p) => ({
        itemName: p.name,
        currentStock: Number(p.quantity),
        unit: p.unit,
        type: 'product' as const,
        lastRestockDate: null,
      })),
      ...materials.map((m) => ({
        itemName: m.name,
        currentStock: Number(m.currentStock),
        unit: m.unit,
        type: 'raw_material' as const,
        lastRestockDate: null,
      })),
    ];

    const sorted = [...allStocks].sort(
      (a, b) => a.currentStock - b.currentStock,
    );

    return {
      lowest: sorted.slice(0, STOCK_ITEMS_LIMIT),
      highest: sorted.slice(-STOCK_ITEMS_LIMIT).reverse(),
    };
  }

  // ──────────────────────────────────────────────
  // Sugestões de compra (estoque < mínimo)
  // ──────────────────────────────────────────────
  private async fetchPurchaseSuggestions(): Promise<PurchaseSuggestion[]> {
    const [products, materials] = await Promise.all([
      this.prisma.client.product.findMany({
        where: {
          active: true,
          minStock: { not: null },
        },
        select: { name: true, quantity: true, minStock: true, unit: true },
      }),
      this.prisma.client.primaryMaterial.findMany({
        where: {
          active: true,
          minStock: { not: null },
        },
        select: { name: true, currentStock: true, minStock: true, unit: true },
      }),
    ]);

    const suggestions: PurchaseSuggestion[] = [];

    for (const p of products) {
      const current = Number(p.quantity);
      const min = Number(p.minStock!);
      if (current < min) {
        const deficit = min - current;
        suggestions.push({
          itemName: p.name,
          suggestedQuantity: Number((deficit * 1.5).toFixed(3)),
          unit: p.unit,
          reason: `Estoque atual (${current}) abaixo do mínimo (${min})`,
          priority:
            current === 0 ? 'high' : current < min * 0.5 ? 'high' : 'medium',
        });
      }
    }

    for (const m of materials) {
      const current = Number(m.currentStock);
      const min = Number(m.minStock!);
      if (current < min) {
        const deficit = min - current;
        suggestions.push({
          itemName: m.name,
          suggestedQuantity: Number((deficit * 1.5).toFixed(3)),
          unit: m.unit,
          reason: `Estoque atual (${current}) abaixo do mínimo (${min})`,
          priority:
            current === 0 ? 'high' : current < min * 0.5 ? 'high' : 'medium',
        });
      }
    }

    return suggestions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }

  // ──────────────────────────────────────────────
  // Entry point
  // ──────────────────────────────────────────────
  async generateProductReport(
    filters: ProductReportFilterDto,
  ): Promise<ProductReportResponseDto> {
    const validation = validateDateFilters(filters);
    if (validation) return validation;

    try {
      const [
        topSelling,
        mostUsedRawMaterials,
        expiringRawMaterials,
        stocks,
        purchaseSuggestions,
      ] = await Promise.all([
        this.fetchTopSellingProducts(filters.startDate, filters.endDate),
        this.fetchMostUsedRawMaterials(filters.startDate, filters.endDate),
        this.fetchExpiringRawMaterials(),
        this.fetchStockLevels(),
        this.fetchPurchaseSuggestions(),
      ]);

      return {
        status: 'OK',
        data: {
          topSellingProducts: topSelling.items,
          mostUsedRawMaterials,
          expiringRawMaterials,
          lowestStocks: stocks.lowest,
          highestStocks: stocks.highest,
          purchaseSuggestions,
          totalProductsSold: topSelling.totalSold,
          totalRevenue: topSelling.totalRevenue,
        },
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de produtos:', error);
      throw new InternalServerErrorException(
        'Erro interno do servidor ao gerar relatório de produtos',
      );
    }
  }
}
