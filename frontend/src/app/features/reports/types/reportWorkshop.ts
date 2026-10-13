export interface WorkshopReportSummary {
  totalDocuments: number;
  totalRevenue: number;
  averageTicket: number;
  vehiclesServed: number;
  documentsWithoutVehicle: number;
}

export interface WorkshopReportTopVehicle {
  assetId: number;
  label: string;
  clientName: string;
  visits: number;
  totalValue: number;
}

export interface WorkshopReportVehicle {
  assetId: number;
  label: string;
  clientName: string;
  visits: number;
  totalValue: number;
  lastVisit: string | null;
}

export interface WorkshopReportNoVehicle {
  totalDocuments: number;
  totalValue: number;
}

export interface WorkshopReportData {
  summary: WorkshopReportSummary;
  topVehicles: WorkshopReportTopVehicle[];
  vehicles: WorkshopReportVehicle[];
  noVehicle: WorkshopReportNoVehicle;
}

export interface WorkshopReportResponse {
  status: string;
  message?: string;
  data?: WorkshopReportData;
}

export const workshopReportMock: WorkshopReportData = {
  summary: {
    totalDocuments: 0,
    totalRevenue: 0,
    averageTicket: 0,
    vehiclesServed: 0,
    documentsWithoutVehicle: 0,
  },
  topVehicles: [],
  vehicles: [],
  noVehicle: {
    totalDocuments: 0,
    totalValue: 0,
  },
};
