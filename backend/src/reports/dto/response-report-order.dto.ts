import { ApiProperty } from '@nestjs/swagger';

export class StatusDistributionDto {
  @ApiProperty({ enum: ['OPEN', 'CLOSED', 'CANCELED', 'PAID'] })
  status: string;
  @ApiProperty() count: number;
  @ApiProperty() percentage: number;
}

export class OrderTypeDistributionDto {
  @ApiProperty({ enum: ['DINE_IN', 'DELIVERY'] })
  type: string;
  @ApiProperty() count: number;
  @ApiProperty() percentage: number;
  @ApiProperty() totalRevenue: number;
}

export class TimeDistributionDto {
  @ApiProperty() hour: number;
  @ApiProperty() totalOrders: number;
  @ApiProperty() totalRevenue: number;
}

export class ProductPerformanceDto {
  @ApiProperty() productId: number;
  @ApiProperty() productName: string;
  @ApiProperty() totalOrdered: number;
  @ApiProperty() totalRevenue: number;
  @ApiProperty() averagePreparationTime: number;
}

export class OrderSummaryDto {
  @ApiProperty() orderId: number;
  @ApiProperty({ required: false }) table?: string;
  @ApiProperty({ enum: ['DINE_IN', 'DELIVERY'] }) type: string;
  @ApiProperty() locationId: string;
  @ApiProperty() locationName: string;
  @ApiProperty({ required: false }) customerName?: string;
  @ApiProperty() totalItems: number;
  @ApiProperty() totalRevenue: number;
  @ApiProperty({ enum: ['OPEN', 'CLOSED', 'CANCELED', 'PAID'] }) status: string;
  @ApiProperty() createdAt: string;
  @ApiProperty({ required: false }) finishedAt?: string;
  @ApiProperty({ required: false }) preparationTime?: number;
  @ApiProperty({ required: false }) totalOrderTime?: number;
}

export class TopTableGlobalDto {
  @ApiProperty() table: string;
  @ApiProperty() locationId: string;
  @ApiProperty() locationName: string;
  @ApiProperty() totalOrders: number;
  @ApiProperty() totalRevenue: number;
}

export class TopCustomerDto {
  @ApiProperty() customerName: string;
  @ApiProperty() totalOrders: number;
  @ApiProperty() totalRevenue: number;
}

export class TopTableDto {
  @ApiProperty() table: string;
  @ApiProperty() totalOrders: number;
  @ApiProperty() totalRevenue: number;
}

export class LocationReportDto {
  @ApiProperty() locationId: string;
  @ApiProperty() locationName: string;
  @ApiProperty() totalOrders: number;
  @ApiProperty() totalRevenue: number;
  @ApiProperty() percentage: number;
  @ApiProperty() averageOrderValue: number;
  @ApiProperty() averagePreparationTime: number;
  @ApiProperty() averageTotalOrderTime: number;
  @ApiProperty() cancellationRate: number;
  @ApiProperty() kitchenPassRate: number;
  @ApiProperty() averageItemsPerOrder: number;
  @ApiProperty({ nullable: true }) peakHour: number | null;
  @ApiProperty() peakConcurrentOrders: number;
  @ApiProperty({ nullable: true }) tableOccupancyRate: number | null;
  @ApiProperty({ nullable: true }) averageTableOccupationTime: number | null;
  @ApiProperty({ type: [TimeDistributionDto] })
  revenueByHour: TimeDistributionDto[];
  @ApiProperty({ type: [StatusDistributionDto] })
  ordersByStatus: StatusDistributionDto[];
  @ApiProperty({ type: [OrderTypeDistributionDto] })
  ordersByType: OrderTypeDistributionDto[];
  @ApiProperty({ type: [ProductPerformanceDto] })
  topProducts: ProductPerformanceDto[];
  @ApiProperty({ type: [TopTableDto] }) topTables: TopTableDto[];
}

export class OrderReportSummaryDto {
  @ApiProperty() totalOrders: number;
  @ApiProperty() totalRevenue: number;
  @ApiProperty() averageOrderValue: number;
  @ApiProperty() averagePreparationTime: number;
  @ApiProperty() averageTotalOrderTime: number;
  @ApiProperty() cancellationRate: number;
  @ApiProperty() averageItemsPerOrder: number;
  @ApiProperty({ type: [StatusDistributionDto] })
  ordersByStatus: StatusDistributionDto[];
  @ApiProperty({ type: [OrderTypeDistributionDto] })
  ordersByType: OrderTypeDistributionDto[];
  @ApiProperty({ type: [TimeDistributionDto] })
  ordersByHour: TimeDistributionDto[];
  @ApiProperty({ type: [LocationReportDto] }) byLocation: LocationReportDto[];
  @ApiProperty({ type: [ProductPerformanceDto] })
  topProducts: ProductPerformanceDto[];
  @ApiProperty({ type: [TopTableGlobalDto] }) topTables: TopTableGlobalDto[];
  @ApiProperty({ type: [TopCustomerDto] }) topCustomers: TopCustomerDto[];
  @ApiProperty({ type: [OrderSummaryDto] }) recentOrders: OrderSummaryDto[];
  @ApiProperty({ type: [OrderSummaryDto] }) slowestOrders: OrderSummaryDto[];
  @ApiProperty({ type: [OrderSummaryDto] }) fastestOrders: OrderSummaryDto[];
}

export class OrderReportResponseDto {
  @ApiProperty({ enum: ['OK', 'ERROR'] })
  status: 'OK' | 'ERROR';

  @ApiProperty({ type: OrderReportSummaryDto, required: false })
  data?: OrderReportSummaryDto;

  @ApiProperty({ required: false })
  message?: string;
}
