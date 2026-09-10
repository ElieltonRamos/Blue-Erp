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
