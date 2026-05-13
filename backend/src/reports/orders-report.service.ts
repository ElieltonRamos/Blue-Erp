import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { validateDateFilters } from './utils/sale-report-utils';
import { OrderReportFilterDto } from './dto/create-report-order.dto';
import { OrderReportResponseDto } from './dto/response-report-order.dto';
import { fromZonedTime } from 'date-fns-tz';
import {
  LocationReport,
  OrderSummary,
  ProductPerformance,
  StatusDistribution,
  OrderTypeDistribution,
  TimeDistribution,
} from './entities/order-report.entity';

const TOP_LIMIT = 10;
const PERFORMANCE_LIMIT = 5;
const TZ = 'America/Sao_Paulo';

type OrderWithIncludes = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: { select: { id: true; name: true } };
        productions: {
          select: {
            startedAt: true;
            completedAt: true;
            deliveredAt: true;
            productionLocation: true;
          };
        };
      };
    };
  };
}> & {
  tableOccupiedUntil: Date | null;
};

@Injectable()
export class OrderReportService {
  constructor(private prisma: PrismaService) {}

  private diffMinutes(a: Date, b: Date): number {
    return (b.getTime() - a.getTime()) / 60000;
  }

  private round2(n: number): number {
    return Number(n.toFixed(2));
  }

  private avg(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private async fetchOrders(
    startDate: string,
    endDate: string,
  ): Promise<OrderWithIncludes[]> {
    return this.prisma.client.order.findMany({
      where: {
        createdAt: {
          gte: fromZonedTime(`${startDate} 00:00:00`, TZ),
          lte: fromZonedTime(`${endDate} 23:59:59`, TZ),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            productions: {
              select: {
                startedAt: true,
                completedAt: true,
                deliveredAt: true,
                productionLocation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<OrderWithIncludes[]>;
  }

  private async fetchLocationMap(): Promise<Map<string, string>> {
    const locations = await this.prisma.client.productionLocation.findMany({
      select: { code: true, name: true },
    });
    return new Map(locations.map((l) => [l.code, l.name]));
  }

  private async fetchTableCountByLocation(): Promise<Map<string, number>> {
    const locations = await this.prisma.client.productionLocation.findMany({
      select: { code: true, _count: { select: { tables: true } } },
    });
    return new Map(locations.map((l) => [l.code, l._count.tables]));
  }

  private calcPreparationTimeForLocation(
    order: OrderWithIncludes,
    locationCode: string,
  ): number | null {
    const productions = order.items
      .flatMap((i) => i.productions)
      .filter((p) => p.productionLocation === locationCode);

    const startTimes = productions
      .map((p) => p.startedAt?.getTime())
      .filter((t): t is number => t != null);

    const endTimes = productions
      .map((p) => p.completedAt?.getTime())
      .filter((t): t is number => t != null);

    if (startTimes.length === 0 || endTimes.length === 0) return null;

    const start = Math.min(...startTimes);
    const end = Math.max(...endTimes);
    return (end - start) / 60000;
  }

  private calcTotalOrderTime(order: OrderWithIncludes): number | null {
    const deliveredTimes = order.items
      .flatMap((i) => i.productions)
      .map((p) => p.deliveredAt?.getTime())
      .filter((t): t is number => t != null);

    if (deliveredTimes.length === 0) return null;

    const lastDelivered = Math.max(...deliveredTimes);
    return (lastDelivered - order.createdAt.getTime()) / 60000;
  }

  private calcItemPrepTime(
    productions: {
      startedAt: Date | null;
      completedAt: Date | null;
      productionLocation: string;
      deliveredAt: Date | null;
    }[],
  ): number | null {
    const times = productions
      .filter((p) => p.startedAt && p.completedAt)
      .map((p) => this.diffMinutes(p.startedAt!, p.completedAt!));

    if (times.length === 0) return null;
    return this.avg(times);
  }

  private calcPeakConcurrentOrders(orders: OrderWithIncludes[]): number {
    const events: { time: number; delta: number }[] = [];

    for (const o of orders) {
      const deliveredTimes = o.items
        .flatMap((i) => i.productions)
        .map((p) => p.deliveredAt?.getTime())
        .filter((t): t is number => t != null);

      const end =
        deliveredTimes.length > 0
          ? Math.max(...deliveredTimes)
          : o.updatedAt.getTime();

      events.push({ time: o.createdAt.getTime(), delta: 1 });
      events.push({ time: end, delta: -1 });
    }

    events.sort((a, b) => a.time - b.time);

    let current = 0;
    let peak = 0;
    for (const e of events) {
      current += e.delta;
      if (current > peak) peak = current;
    }
    return peak;
  }

  private buildStatusDistribution(
    orders: OrderWithIncludes[],
  ): StatusDistribution[] {
    const map = new Map<string, number>();
    for (const o of orders) {
      map.set(o.status, (map.get(o.status) ?? 0) + 1);
    }
    const total = orders.length || 1;
    return Array.from(map.entries()).map(([status, count]) => ({
      status: status as StatusDistribution['status'],
      count,
      percentage: this.round2((count / total) * 100),
    }));
  }

  private buildTypeDistribution(
    orders: OrderWithIncludes[],
  ): OrderTypeDistribution[] {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const o of orders) {
      const existing = map.get(o.type) ?? { count: 0, revenue: 0 };
      map.set(o.type, {
        count: existing.count + 1,
        revenue: existing.revenue + Number(o.total),
      });
    }
    const total = orders.length || 1;
    return Array.from(map.entries()).map(([type, agg]) => ({
      type: type as OrderTypeDistribution['type'],
      count: agg.count,
      percentage: this.round2((agg.count / total) * 100),
      totalRevenue: this.round2(agg.revenue),
    }));
  }

  private buildHourDistribution(
    orders: OrderWithIncludes[],
  ): TimeDistribution[] {
    const map = new Map<
      number,
      { totalOrders: number; totalRevenue: number }
    >();
    for (const o of orders) {
      const hour = o.createdAt.getHours();
      const existing = map.get(hour) ?? { totalOrders: 0, totalRevenue: 0 };
      map.set(hour, {
        totalOrders: existing.totalOrders + 1,
        totalRevenue: existing.totalRevenue + Number(o.total),
      });
    }
    return Array.from(map.entries())
      .map(([hour, agg]) => ({
        hour,
        totalOrders: agg.totalOrders,
        totalRevenue: this.round2(agg.totalRevenue),
      }))
      .sort((a, b) => a.hour - b.hour);
  }

  private buildTopProducts(orders: OrderWithIncludes[]): ProductPerformance[] {
    const map = new Map<
      number,
      {
        productName: string;
        totalOrdered: number;
        totalRevenue: number;
        prepTimes: number[];
      }
    >();

    for (const o of orders) {
      for (const item of o.items) {
        const existing = map.get(item.productId) ?? {
          productName: item.product.name,
          totalOrdered: 0,
          totalRevenue: 0,
          prepTimes: [],
        };

        existing.totalOrdered += Number(item.quantity);
        existing.totalRevenue += Number(item.total);

        const prepTime = this.calcItemPrepTime(item.productions);
        if (prepTime !== null) existing.prepTimes.push(prepTime);

        map.set(item.productId, existing);
      }
    }

    return Array.from(map.entries())
      .map(([productId, agg]) => ({
        productId,
        productName: agg.productName,
        totalOrdered: Number(agg.totalOrdered.toFixed(3)),
        totalRevenue: this.round2(agg.totalRevenue),
        averagePreparationTime:
          agg.prepTimes.length > 0 ? this.round2(this.avg(agg.prepTimes)) : 0,
      }))
      .sort((a, b) => b.totalOrdered - a.totalOrdered)
      .slice(0, TOP_LIMIT);
  }

  private buildTopTables(
    orders: OrderWithIncludes[],
    locationNameMap: Map<string, string>,
  ) {
    const map = new Map<
      string,
      { locationId: string; totalOrders: number; totalRevenue: number }
    >();
    for (const o of orders) {
      if (!o.table) continue;
      const key = `${o.locationId}::${o.table}`;
      const existing = map.get(key) ?? {
        locationId: o.locationId,
        totalOrders: 0,
        totalRevenue: 0,
      };
      map.set(key, {
        locationId: o.locationId,
        totalOrders: existing.totalOrders + 1,
        totalRevenue: existing.totalRevenue + Number(o.total),
      });
    }
    return Array.from(map.entries())
      .map(([key, agg]) => ({
        table: key.split('::')[1],
        locationId: agg.locationId,
        locationName: locationNameMap.get(agg.locationId) ?? agg.locationId,
        totalOrders: agg.totalOrders,
        totalRevenue: this.round2(agg.totalRevenue),
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, TOP_LIMIT);
  }

  private buildTopCustomers(orders: OrderWithIncludes[]) {
    const map = new Map<
      string,
      { totalOrders: number; totalRevenue: number }
    >();
    for (const o of orders) {
      if (o.type !== 'DELIVERY' || !o.customerName) continue;
      const existing = map.get(o.customerName) ?? {
        totalOrders: 0,
        totalRevenue: 0,
      };
      map.set(o.customerName, {
        totalOrders: existing.totalOrders + 1,
        totalRevenue: existing.totalRevenue + Number(o.total),
      });
    }
    return Array.from(map.entries())
      .map(([customerName, agg]) => ({
        customerName,
        totalOrders: agg.totalOrders,
        totalRevenue: this.round2(agg.totalRevenue),
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, TOP_LIMIT);
  }

  private buildOrderSummary(
    order: OrderWithIncludes,
    locationNameMap: Map<string, string>,
  ): OrderSummary {
    const allProductions = order.items.flatMap((i) => i.productions);

    const startTimes = allProductions
      .map((p) => p.startedAt?.getTime())
      .filter((t): t is number => t != null);
    const endTimes = allProductions
      .map((p) => p.completedAt?.getTime())
      .filter((t): t is number => t != null);

    const prepTime =
      startTimes.length > 0 && endTimes.length > 0
        ? (Math.max(...endTimes) - Math.min(...startTimes)) / 60000
        : undefined;

    return {
      orderId: order.id,
      table: order.table ?? undefined,
      type: order.type as OrderSummary['type'],
      locationId: order.locationId,
      locationName: locationNameMap.get(order.locationId) ?? order.locationId,
      customerName: order.customerName ?? undefined,
      totalItems: order.items.reduce((sum, i) => sum + Number(i.quantity), 0),
      totalRevenue: this.round2(Number(order.total)),
      status: order.status as OrderSummary['status'],
      createdAt: order.createdAt.toISOString(),
      finishedAt: order.finishedAt?.toISOString(),
      preparationTime:
        prepTime !== undefined ? this.round2(prepTime) : undefined,
      totalOrderTime:
        this.calcTotalOrderTime(order) !== null
          ? this.round2(this.calcTotalOrderTime(order)!)
          : undefined,
    };
  }

  private buildLocationReport(
    locationId: string,
    locationName: string,
    orders: OrderWithIncludes[],
    totalRevenueGlobal: number,
    tableCount: number | undefined,
  ): LocationReport {
    const total = orders.length;
    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const canceled = orders.filter((o) => o.status === 'CANCELED').length;

    const withKitchen = orders.filter((o) =>
      o.items.some((i) =>
        i.productions.some(
          (p) => p.productionLocation === locationId && p.startedAt != null,
        ),
      ),
    ).length;

    const prepTimesPerOrder = orders
      .map((o) => this.calcPreparationTimeForLocation(o, locationId))
      .filter((t): t is number => t !== null);

    const totalTimesPerOrder = orders
      .map((o) => this.calcTotalOrderTime(o))
      .filter((t): t is number => t !== null);

    const totalItems = orders.reduce(
      (s, o) => s + o.items.reduce((si, i) => si + Number(i.quantity), 0),
      0,
    );

    const hourDist = this.buildHourDistribution(orders);
    const peakHourEntry =
      hourDist.length > 0
        ? hourDist.reduce((max, h) =>
            h.totalOrders > max.totalOrders ? h : max,
          )
        : null;

    const tablesUsed = new Set(
      orders.filter((o) => o.table).map((o) => o.table!),
    ).size;
    const tableOccupancyRate =
      tableCount && tableCount > 0
        ? this.round2((tablesUsed / tableCount) * 100)
        : null;

    // fix 1: removido locationProductions (não era usado)
    // fix 2: tableOccupiedUntil agora está no type OrderWithIncludes
    const occupationTimes = orders
      .filter(
        (o): o is OrderWithIncludes & { tableOccupiedUntil: Date } =>
          o.table !== null && o.tableOccupiedUntil !== null,
      )
      .map((o) => this.diffMinutes(o.createdAt, o.tableOccupiedUntil));
    const avgTableOccupation =
      occupationTimes.length > 0
        ? this.round2(this.avg(occupationTimes))
        : null;

    const productMap = new Map<
      number,
      {
        productName: string;
        totalOrdered: number;
        totalRevenue: number;
        prepTimes: number[];
      }
    >();
    for (const o of orders) {
      for (const item of o.items) {
        const locProductions = item.productions.filter(
          (p) => p.productionLocation === locationId,
        );
        if (locProductions.length === 0) continue;

        const existing = productMap.get(item.productId) ?? {
          productName: item.product.name,
          totalOrdered: 0,
          totalRevenue: 0,
          prepTimes: [],
        };
        existing.totalOrdered += Number(item.quantity);
        existing.totalRevenue += Number(item.total);

        const prepTime = this.calcItemPrepTime(locProductions);
        if (prepTime !== null) existing.prepTimes.push(prepTime);

        productMap.set(item.productId, existing);
      }
    }
    const topProducts = Array.from(productMap.entries())
      .map(([productId, agg]) => ({
        productId,
        productName: agg.productName,
        totalOrdered: Number(agg.totalOrdered.toFixed(3)),
        totalRevenue: this.round2(agg.totalRevenue),
        averagePreparationTime:
          agg.prepTimes.length > 0 ? this.round2(this.avg(agg.prepTimes)) : 0,
      }))
      .sort((a, b) => b.totalOrdered - a.totalOrdered)
      .slice(0, PERFORMANCE_LIMIT);

    const tableMap = new Map<
      string,
      { totalOrders: number; totalRevenue: number }
    >();
    for (const o of orders) {
      if (!o.table) continue;
      const existing = tableMap.get(o.table) ?? {
        totalOrders: 0,
        totalRevenue: 0,
      };
      tableMap.set(o.table, {
        totalOrders: existing.totalOrders + 1,
        totalRevenue: existing.totalRevenue + Number(o.total),
      });
    }
    const topTables = Array.from(tableMap.entries())
      .map(([table, agg]) => ({
        table,
        totalOrders: agg.totalOrders,
        totalRevenue: this.round2(agg.totalRevenue),
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, PERFORMANCE_LIMIT);

    return {
      locationId,
      locationName,
      totalOrders: total,
      totalRevenue: this.round2(revenue),
      percentage:
        totalRevenueGlobal > 0
          ? this.round2((revenue / totalRevenueGlobal) * 100)
          : 0,
      averageOrderValue: total > 0 ? this.round2(revenue / total) : 0,
      averagePreparationTime:
        prepTimesPerOrder.length > 0
          ? this.round2(this.avg(prepTimesPerOrder))
          : 0,
      averageTotalOrderTime:
        totalTimesPerOrder.length > 0
          ? this.round2(this.avg(totalTimesPerOrder))
          : 0,
      cancellationRate: total > 0 ? this.round2((canceled / total) * 100) : 0,
      kitchenPassRate: total > 0 ? this.round2((withKitchen / total) * 100) : 0,
      averageItemsPerOrder: total > 0 ? this.round2(totalItems / total) : 0,
      peakHour: peakHourEntry ? peakHourEntry.hour : null,
      peakConcurrentOrders: this.calcPeakConcurrentOrders(orders),
      tableOccupancyRate,
      averageTableOccupationTime: avgTableOccupation,
      revenueByHour: hourDist,
      ordersByStatus: this.buildStatusDistribution(orders),
      ordersByType: this.buildTypeDistribution(orders),
      topProducts,
      topTables,
    };
  }

  async generateOrderReport(
    filters: OrderReportFilterDto,
  ): Promise<OrderReportResponseDto> {
    const validation = validateDateFilters(filters);
    if (validation) return validation;

    try {
      const [orders, locationNameMap, tableCountMap] = await Promise.all([
        this.fetchOrders(filters.startDate, filters.endDate),
        this.fetchLocationMap(),
        this.fetchTableCountByLocation(),
      ]);

      const total = orders.length;
      const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
      const canceled = orders.filter((o) => o.status === 'CANCELED').length;

      const allPreparationTimes: number[] = [];
      for (const order of orders) {
        const locationCodes = new Set(
          order.items.flatMap((i) =>
            i.productions.map((p) => p.productionLocation),
          ),
        );
        for (const code of locationCodes) {
          const t = this.calcPreparationTimeForLocation(order, code);
          if (t !== null) allPreparationTimes.push(t);
        }
      }

      const totalTimes = orders
        .map((o) => this.calcTotalOrderTime(o))
        .filter((t): t is number => t !== null);

      const totalItems = orders.reduce(
        (s, o) => s + o.items.reduce((si, i) => si + Number(i.quantity), 0),
        0,
      );

      const locationOrdersMap = new Map<string, OrderWithIncludes[]>();
      for (const o of orders) {
        const list = locationOrdersMap.get(o.locationId) ?? [];
        list.push(o);
        locationOrdersMap.set(o.locationId, list);
      }

      const byLocation = Array.from(locationOrdersMap.entries())
        .map(([locationId, locOrders]) => {
          const locationName = locationNameMap.get(locationId) ?? locationId;
          const tableCount = tableCountMap.get(locationId);
          return this.buildLocationReport(
            locationId,
            locationName,
            locOrders,
            totalRevenue,
            tableCount,
          );
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      const ordersWithTime = orders
        .map((o) => ({ order: o, time: this.calcTotalOrderTime(o) }))
        .filter(
          (x): x is { order: OrderWithIncludes; time: number } =>
            x.time !== null,
        );

      ordersWithTime.sort((a, b) => a.time - b.time);

      const fastestOrders = ordersWithTime
        .slice(0, PERFORMANCE_LIMIT)
        .map((x) => this.buildOrderSummary(x.order, locationNameMap));

      const slowestOrders = ordersWithTime
        .slice(-PERFORMANCE_LIMIT)
        .reverse()
        .map((x) => this.buildOrderSummary(x.order, locationNameMap));

      const recentOrders = orders.map((o) =>
        this.buildOrderSummary(o, locationNameMap),
      );

      return {
        status: 'OK',
        data: {
          totalOrders: total,
          totalRevenue: this.round2(totalRevenue),
          averageOrderValue: total > 0 ? this.round2(totalRevenue / total) : 0,
          averagePreparationTime:
            allPreparationTimes.length > 0
              ? this.round2(this.avg(allPreparationTimes))
              : 0,
          averageTotalOrderTime:
            totalTimes.length > 0 ? this.round2(this.avg(totalTimes)) : 0,
          cancellationRate:
            total > 0 ? this.round2((canceled / total) * 100) : 0,
          averageItemsPerOrder: total > 0 ? this.round2(totalItems / total) : 0,
          ordersByStatus: this.buildStatusDistribution(orders),
          ordersByType: this.buildTypeDistribution(orders),
          ordersByHour: this.buildHourDistribution(orders),
          byLocation,
          topProducts: this.buildTopProducts(orders),
          topTables: this.buildTopTables(orders, locationNameMap),
          topCustomers: this.buildTopCustomers(orders),
          recentOrders,
          slowestOrders,
          fastestOrders,
        },
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de pedidos:', error);
      throw new InternalServerErrorException(
        'Erro interno do servidor ao gerar relatório de pedidos',
      );
    }
  }
}
