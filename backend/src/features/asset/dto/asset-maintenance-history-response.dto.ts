import { ApiProperty } from '@nestjs/swagger';

class MaintenanceItemProductDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Filtro de óleo' })
  name: string;

  @ApiProperty({ example: 'FLT-001' })
  code: string;
}

class MaintenanceItemServiceDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Troca de óleo' })
  name: string;

  @ApiProperty({ example: 'SRV-001' })
  code: string;
}

class MaintenanceItemUserDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'joao.mecanico' })
  username: string;
}

class MaintenanceDocumentItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SERVICE', enum: ['PRODUCT', 'SERVICE'] })
  type: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  unitPrice: number;

  @ApiProperty({ example: 150.0 })
  total: number;

  @ApiProperty({ type: MaintenanceItemProductDto, nullable: true })
  product: MaintenanceItemProductDto | null;

  @ApiProperty({ type: MaintenanceItemServiceDto, nullable: true })
  service: MaintenanceItemServiceDto | null;

  @ApiProperty({ type: MaintenanceItemUserDto, nullable: true })
  user: MaintenanceItemUserDto | null;

  constructor(item: any) {
    this.id = item.id;
    this.type = item.type;
    this.quantity = Number(item.quantity);
    this.unitPrice = Number(item.unitPrice);
    this.total = Number(item.total);
    this.product = item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          code: item.product.code,
        }
      : null;
    this.service = item.service
      ? {
          id: item.service.id,
          name: item.service.name,
          code: item.service.code,
        }
      : null;
    this.user = item.user
      ? { id: item.user.id, username: item.user.username }
      : null;
  }
}

export class MaintenanceDocumentResponseDto {
  @ApiProperty({ example: 10 })
  id: number;

  @ApiProperty({ example: 'SERVICE_ORDER', enum: ['SERVICE_ORDER', 'QUOTE'] })
  type: string;

  @ApiProperty({
    example: 'COMPLETED',
    enum: ['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'],
  })
  status: string;

  @ApiProperty({ example: 350.0 })
  total: number;

  @ApiProperty({ type: [MaintenanceDocumentItemResponseDto] })
  items: MaintenanceDocumentItemResponseDto[];

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z', nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z', nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z' })
  createdAt: Date;

  constructor(document: any) {
    this.id = document.id;
    this.type = document.type;
    this.status = document.status;
    this.total = Number(document.total);
    this.items = (document.items ?? []).map(
      (item: any) => new MaintenanceDocumentItemResponseDto(item),
    );
    this.approvedAt = document.approvedAt;
    this.finishedAt = document.finishedAt;
    this.createdAt = document.createdAt;
  }
}

export class AssetMaintenanceHistoryResponseDto {
  @ApiProperty({ example: 1 })
  assetId: number;

  @ApiProperty({ example: 'ABC-1234' })
  assetLabel: string;

  @ApiProperty({ example: 'João Silva' })
  clientName: string;

  @ApiProperty({ type: [MaintenanceDocumentResponseDto] })
  documents: MaintenanceDocumentResponseDto[];

  constructor(asset: any) {
    this.assetId = asset.id;
    this.assetLabel = asset.label;
    this.clientName = asset.client?.name;
    this.documents = (asset.documents ?? []).map(
      (doc: any) => new MaintenanceDocumentResponseDto(doc),
    );
  }
}
