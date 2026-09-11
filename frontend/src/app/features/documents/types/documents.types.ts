import { PaginatedResponse } from '../../../core/guards/types/paginator';

export type DocumentType = 'QUOTE' | 'SERVICE_ORDER';
export type DocumentStatus = 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type DocumentItemType = 'PRODUCT' | 'SERVICE';

export interface DocumentItem {
  id: number;
  type: DocumentItemType;
  productId: number | null;
  serviceId: number | null;
  mechanicId: number | null;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OSDocument {
  id: number;
  type: DocumentType;
  status: DocumentStatus;
  clientId: number;
  clientName: string;
  assetId: number | null;
  responsibleId: number | null;
  total: number;
  items: DocumentItem[];
  approvedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentDTO {
  type: DocumentType;
  clientId: number;
  assetId?: number;
  responsibleId?: number;
}

export interface AddDocumentItemDTO {
  type: DocumentItemType;
  productId?: number;
  serviceId?: number;
  mechanicId?: number;
  quantity: number;
  unitPrice: number;
}

export interface UpdateDocumentStatusDTO {
  status: DocumentStatus;
}

export interface FilterDocumentParams {
  type?: DocumentType;
  status?: DocumentStatus;
  clientId?: number;
}

export type DocumentPaginatedResponse = PaginatedResponse<OSDocument>;
