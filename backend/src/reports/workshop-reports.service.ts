// workshop-reports.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { validateDateFilters } from './utils/sale-report-utils';
import { WorkshopReportResponseDto } from './dto/response-report-workshop.dto';
import { WorkshopReportFilterDto } from './dto/create-report-workshop.dto';

type DocumentWithIncludes = {
  id: number;
  assetId: number | null;
  total: number | { toNumber(): number };
  createdAt: Date;
  finishedAt: Date | null;
  client: { id: number; name: string };
  asset: { id: number; label: string } | null;
};

type VehicleAggregator = {
  assetId: number;
  label: string;
  clientName: string;
  visits: number;
  totalValue: number;
  lastVisit: Date | null;
};

@Injectable()
export class WorkshopReportService {
  constructor(private prisma: PrismaService) {}

  private getStartOfDay(dateString: string): Date {
    return new Date(`${dateString}T00:00:00-03:00`);
  }

  private getEndOfDay(dateString: string): Date {
    return new Date(`${dateString}T23:59:59.999-03:00`);
  }

  private toNumber(
    val: number | { toNumber(): number } | null | undefined,
  ): number {
    if (val == null) return 0;
    if (typeof val === 'object' && 'toNumber' in val) return val.toNumber();
    return Number(val);
  }

  private async fetchDocumentsData(
    startDate: string,
    endDate: string,
  ): Promise<DocumentWithIncludes[]> {
    return this.prisma.client.document.findMany({
      where: {
        createdAt: {
          gte: this.getStartOfDay(startDate),
          lte: this.getEndOfDay(endDate),
        },
      },
      select: {
        id: true,
        assetId: true,
        total: true,
        createdAt: true,
        finishedAt: true,
        client: { select: { id: true, name: true } },
        asset: { select: { id: true, label: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<DocumentWithIncludes[]>;
  }

  private buildResponse(documents: DocumentWithIncludes[]) {
    const fmt = (v: number) => Number(v.toFixed(2));

    const totalDocuments = documents.length;
    const totalRevenue = documents.reduce(
      (sum, d) => sum + this.toNumber(d.total),
      0,
    );
    const averageTicket =
      totalDocuments > 0 ? totalRevenue / totalDocuments : 0;

    const vehicleAggregators: Record<number, VehicleAggregator> = {};
    let noVehicleCount = 0;
    let noVehicleValue = 0;

    for (const doc of documents) {
      const value = this.toNumber(doc.total);

      if (!doc.assetId || !doc.asset) {
        noVehicleCount += 1;
        noVehicleValue += value;
        continue;
      }

      if (!vehicleAggregators[doc.assetId]) {
        vehicleAggregators[doc.assetId] = {
          assetId: doc.assetId,
          label: doc.asset.label,
          clientName: doc.client.name,
          visits: 0,
          totalValue: 0,
          lastVisit: null,
        };
      }

      const agg = vehicleAggregators[doc.assetId];
      agg.visits += 1;
      agg.totalValue += value;

      const visitDate = doc.finishedAt ?? doc.createdAt;
      if (!agg.lastVisit || visitDate > agg.lastVisit) {
        agg.lastVisit = visitDate;
      }
    }

    const vehicles = Object.values(vehicleAggregators)
      .sort((a, b) => b.visits - a.visits || b.totalValue - a.totalValue)
      .map((v) => ({
        assetId: v.assetId,
        label: v.label,
        clientName: v.clientName,
        visits: v.visits,
        totalValue: fmt(v.totalValue),
        lastVisit: v.lastVisit,
      }));

    const topVehicles = vehicles.slice(0, 5);

    return {
      summary: {
        totalDocuments,
        totalRevenue: fmt(totalRevenue),
        averageTicket: fmt(averageTicket),
        vehiclesServed: vehicles.length,
        documentsWithoutVehicle: noVehicleCount,
      },
      topVehicles,
      vehicles,
      noVehicle: {
        totalDocuments: noVehicleCount,
        totalValue: fmt(noVehicleValue),
      },
    };
  }

  async generateReportByDate(
    filters: WorkshopReportFilterDto,
  ): Promise<WorkshopReportResponseDto> {
    const validation = validateDateFilters(filters);
    if (validation) return validation;

    try {
      const documents = await this.fetchDocumentsData(
        filters.startDate,
        filters.endDate,
      );
      const data = this.buildResponse(documents);
      return { status: 'OK', data };
    } catch (error) {
      console.error('Erro ao gerar relatório da oficina:', error);
      throw new InternalServerErrorException(
        'Erro interno do servidor ao gerar relatório da oficina',
      );
    }
  }
}
