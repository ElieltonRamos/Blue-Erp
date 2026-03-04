export interface LocationReportItem {
  name: string;
  qty: number;
  value: number;
  producedAt: string;
}

export interface LocationReportCategory {
  name: string;
  totalValue: number;
  totalQty: number;
  items: LocationReportItem[];
}

export interface LocationReportLocation {
  id: number;
  code: string;
  name: string;
  totalValue: number;
  topProduct: string;
  categories: LocationReportCategory[];
}

export interface LocationReportData {
  locations: LocationReportLocation[];
}

export interface LocationReportResponse {
  status: string;
  message?: string;
  data?: LocationReportData;
}

export const locationReportMock: LocationReportData = {
  locations: [],
};
