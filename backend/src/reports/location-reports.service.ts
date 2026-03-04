import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { validateDateFilters } from './utils/sale-report-utils';
import { LocationReportResponseDto } from './dto/response-report-location.dto';
import { LocationReportFilterDto } from './dto/create-report-location.dto';

type OrderWithIncludes = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            productionLocation: true;
            category: {
              select: { name: true };
            };
          };
        };
      };
    };
  };
}>;

type ItemAggregator = {
  name: string;
  qty: number;
  value: number;
  producedAt: string;
};

type CategoryAggregator = {
  name: string;
  totalValue: number;
  totalQty: number;
  items: Record<string, ItemAggregator>;
};

type LocationAggregator = {
  id: number;
  code: string;
  name: string;
  totalValue: number;
  categories: Record<string, CategoryAggregator>;
};

@Injectable()
export class LocationReportService {
  constructor(private prisma: PrismaService) {}

  private getStartOfDay(dateString: string): Date {
    return new Date(dateString + ' 00:00:00');
  }

  private getEndOfDay(dateString: string): Date {
    return new Date(dateString + ' 23:59:59.999');
  }

  private async fetchOrdersData(
    startDate: string,
    endDate: string,
  ): Promise<OrderWithIncludes[]> {
    return this.prisma.client.order.findMany({
      where: {
        status: { not: 'CANCELED' },
        createdAt: {
          gte: this.getStartOfDay(startDate),
          lte: this.getEndOfDay(endDate),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productionLocation: true,
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async fetchLocationNames(): Promise<
    Record<string, { id: number; name: string }>
  > {
    const locations = await this.prisma.client.productionLocation.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true },
    });

    return Object.fromEntries(
      locations.map((l) => [l.code, { id: l.id, name: l.name }]),
    );
  }

  private initializeAggregators(): Record<string, LocationAggregator> {
    return {};
  }

  private ensureLocation(
    aggregators: Record<string, LocationAggregator>,
    locationCode: string,
    locationMap: Record<string, { id: number; name: string }>,
  ): LocationAggregator {
    if (!aggregators[locationCode]) {
      const loc = locationMap[locationCode];
      aggregators[locationCode] = {
        id: loc?.id ?? 0,
        code: locationCode,
        name: loc?.name ?? locationCode,
        totalValue: 0,
        categories: {},
      };
    }
    return aggregators[locationCode];
  }

  private ensureCategory(
    location: LocationAggregator,
    categoryName: string,
  ): CategoryAggregator {
    if (!location.categories[categoryName]) {
      location.categories[categoryName] = {
        name: categoryName,
        totalValue: 0,
        totalQty: 0,
        items: {},
      };
    }
    return location.categories[categoryName];
  }

  private processOrder(
    order: OrderWithIncludes,
    aggregators: Record<string, LocationAggregator>,
    locationMap: Record<string, { id: number; name: string }>,
  ) {
    const locationCode = order.locationId;
    const location = this.ensureLocation(
      aggregators,
      locationCode,
      locationMap,
    );

    for (const item of order.items) {
      const categoryName = item.product.category?.name ?? 'Sem Categoria';
      const producedAt = item.product.productionLocation
        ? (locationMap[item.product.productionLocation]?.name ??
          item.product.productionLocation)
        : location.name;

      const qty = Number(item.quantity);
      const value = Number(item.total);

      location.totalValue += value;

      const category = this.ensureCategory(location, categoryName);
      category.totalValue += value;
      category.totalQty += qty;

      const productKey = item.product.name;
      if (!category.items[productKey]) {
        category.items[productKey] = {
          name: item.product.name,
          qty: 0,
          value: 0,
          producedAt,
        };
      }
      category.items[productKey].qty += qty;
      category.items[productKey].value += value;
    }
  }

  private getTopProduct(location: LocationAggregator): string {
    let topName = '';
    let topValue = 0;

    for (const cat of Object.values(location.categories)) {
      for (const item of Object.values(cat.items)) {
        if (item.value > topValue) {
          topValue = item.value;
          topName = item.name;
        }
      }
    }

    return topName;
  }

  private buildResponse(aggregators: Record<string, LocationAggregator>) {
    const fmt = (v: number) => Number(v.toFixed(2));

    const locations = Object.values(aggregators).map((loc) => ({
      id: loc.id,
      code: loc.code,
      name: loc.name,
      totalValue: fmt(loc.totalValue),
      topProduct: this.getTopProduct(loc),
      categories: Object.values(loc.categories).map((cat) => ({
        name: cat.name,
        totalValue: fmt(cat.totalValue),
        totalQty: Number(cat.totalQty.toFixed(3)),
        items: Object.values(cat.items)
          .sort((a, b) => b.qty - a.qty)
          .map((item) => ({
            name: item.name,
            qty: Number(item.qty.toFixed(3)),
            value: fmt(item.value),
            producedAt: item.producedAt,
          })),
      })),
    }));

    return { locations };
  }

  async generateReportByDate(
    filters: LocationReportFilterDto,
  ): Promise<LocationReportResponseDto> {
    const validation = validateDateFilters(filters);
    if (validation) return validation;

    try {
      const [orders, locationMap] = await Promise.all([
        this.fetchOrdersData(filters.startDate, filters.endDate),
        this.fetchLocationNames(),
      ]);

      const aggregators = this.initializeAggregators();

      for (const order of orders) {
        this.processOrder(order, aggregators, locationMap);
      }

      const data = this.buildResponse(aggregators);
      return { status: 'OK', data };
    } catch (error) {
      console.error('Erro ao gerar relatório por local:', error);
      throw new InternalServerErrorException(
        'Erro interno do servidor ao gerar relatório por local',
      );
    }
  }
}
