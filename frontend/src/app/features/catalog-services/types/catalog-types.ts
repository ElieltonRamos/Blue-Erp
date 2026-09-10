import { PaginatedResponse } from '../../../core/guards/types/paginator';

export interface Service {
  id: number;
  name: string;
  code: string;
  price: number;
  estimatedTime: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceDTO {
  name: string;
  price: number;
  estimatedTime?: number;
}

export interface UpdateServiceDTO {
  name?: string;
  price?: number;
  estimatedTime?: number;
  active?: boolean;
}

export interface FilterServiceParams {
  search?: string;
  active?: boolean;
}

export type ServicePaginatedResponse = PaginatedResponse<Service>;
