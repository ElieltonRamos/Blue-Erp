import { PaginatedResponse } from '../../../core/guards/types/paginator';

export interface AssetAttribute {
  key: string;
  value: string;
}

export interface Asset {
  id: number;
  type: string;
  label: string;
  clientId: number;
  clientName: string;
  attributes: AssetAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetDTO {
  type: string;
  label: string;
  clientId: number;
  attributes?: AssetAttribute[];
}

export interface UpdateAssetDTO {
  type?: string;
  label?: string;
  clientId?: number;
  attributes?: AssetAttribute[];
}

export interface FilterAssetParams {
  search?: string;
  clientId?: number;
  type?: string;
}

export type AssetPaginatedResponse = PaginatedResponse<Asset>;

export interface MaintenanceItemProduct {
  id: number;
  name: string;
  code: string;
}

export interface MaintenanceItemService {
  id: number;
  name: string;
  code: string;
}

export interface MaintenanceItemUser {
  id: number;
  username: string;
}

export interface MaintenanceDocumentItem {
  id: number;
  type: 'PRODUCT' | 'SERVICE';
  quantity: number;
  unitPrice: number;
  total: number;
  product: MaintenanceItemProduct | null;
  service: MaintenanceItemService | null;
  user: MaintenanceItemUser | null;
}

export interface MaintenanceDocument {
  id: number;
  type: 'SERVICE_ORDER' | 'QUOTE';
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
  total: number;
  items: MaintenanceDocumentItem[];
  approvedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}

export interface AssetMaintenanceHistory {
  assetId: number;
  assetLabel: string;
  clientName: string;
  documents: MaintenanceDocument[];
}
