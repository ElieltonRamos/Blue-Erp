import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FiscalStatus } from 'generated/prisma/client';

export class SaleClientDto {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'João Silva' })
  name: string;
  @ApiPropertyOptional()
  phone: string | null;
  @ApiPropertyOptional()
  address: string | null;
  @ApiPropertyOptional()
  cpf: string | null;
  @ApiProperty()
  active: boolean;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
    this.address = data.address;
    this.cpf = data.cpf;
    this.active = data.active;
  }
}

export class SaleOperatorDto {
  @ApiProperty({ example: 2 })
  id: number;
  @ApiProperty({ example: 'Maria Santos' })
  username: string;
  @ApiProperty({ example: 'USER' })
  role: string;

  constructor(data: any) {
    this.id = data.id;
    this.username = data.username;
    this.role = data.role;
  }
}

export class SalePaymentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'PIX' })
  method: string;
  @ApiProperty({ example: 60.0 })
  amount: number;
  @ApiProperty({ example: 0 })
  change: number;
  @ApiProperty()
  createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.method = data.method;
    this.amount = Number(data.amount);
    this.change = Number(data.change);
    this.createdAt = data.createdAt;
  }
}

export class SaleItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 1 })
  itemNumber: number;
  @ApiProperty({ example: 1 })
  saleId: number;
  @ApiProperty({ example: 5 })
  productId: number;
  @ApiPropertyOptional({ example: 'Pizza Margherita' })
  xProd: string | null;
  @ApiProperty({ example: 2.5 })
  quantity: number;
  @ApiProperty({ example: 45.0 })
  unitPrice: number;
  @ApiProperty({ example: 112.5 })
  totalPrice: number;
  @ApiPropertyOptional({ example: 'UN' })
  taxUnit: string | null;
  @ApiPropertyOptional({ example: 2.5 })
  taxQuantity: number | null;
  @ApiPropertyOptional({ example: 45.0 })
  taxUnitPrice: number | null;
  @ApiProperty({ example: 1 })
  composesTotal: number;
  @ApiPropertyOptional({ example: '5102' })
  cfop: string | null;
  @ApiPropertyOptional({ example: 15.5 })
  totalTaxValue: number | null;
  @ApiPropertyOptional({ example: 0 })
  importTaxValue: number | null;
  @ApiPropertyOptional({ example: 0 })
  iofValue: number | null;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.itemNumber = data.itemNumber;
    this.saleId = data.saleId;
    this.productId = data.productId;
    this.xProd = data.xProd;
    this.quantity = Number(data.quantity);
    this.unitPrice = Number(data.unitPrice);
    this.totalPrice = Number(data.totalPrice);
    this.taxUnit = data.taxUnit;
    this.taxQuantity = data.taxQuantity ? Number(data.taxQuantity) : null;
    this.taxUnitPrice = data.taxUnitPrice ? Number(data.taxUnitPrice) : null;
    this.composesTotal = data.composesTotal;
    this.cfop = data.cfop;
    this.totalTaxValue = data.totalTaxValue ? Number(data.totalTaxValue) : null;
    this.importTaxValue = data.importTaxValue
      ? Number(data.importTaxValue)
      : null;
    this.iofValue = data.iofValue ? Number(data.iofValue) : null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class SaleResponseDto {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 1 })
  clientId: number;
  @ApiProperty({ type: SaleClientDto })
  client: SaleClientDto;
  @ApiProperty({ example: 'João Silva' })
  userOperator: string;
  @ApiPropertyOptional({ example: 2 })
  operatorId: number | null;
  @ApiPropertyOptional({ type: SaleOperatorDto })
  operator: SaleOperatorDto | null;
  @ApiProperty()
  date: Date;
  @ApiProperty({ type: [SalePaymentResponseDto] })
  payments: SalePaymentResponseDto[];
  @ApiProperty({ example: 150.0 })
  totalProductsWithoutDiscount: number;
  @ApiProperty({ example: 10.0 })
  discount: number;
  @ApiProperty({ example: 140.0 })
  total: number;
  @ApiProperty({ example: 80.0 })
  profitSale: number;
  @ApiProperty({ example: true })
  isPaid: boolean;
  @ApiProperty({ example: '5102' })
  cfop: string;
  @ApiProperty({ enum: FiscalStatus, example: FiscalStatus.PENDENTE })
  fiscalStatus: FiscalStatus;
  @ApiPropertyOptional()
  fiscalKey: string | null;
  @ApiPropertyOptional()
  fiscalProtocol: string | null;
  @ApiPropertyOptional()
  fiscalEmitDate: Date | null;
  @ApiPropertyOptional()
  fiscalXml: string | null;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiPropertyOptional({ type: [SaleItemResponseDto] })
  items?: SaleItemResponseDto[];

  constructor(data: any) {
    this.id = data.id;
    this.clientId = data.clientId;
    this.client = data.client ? new SaleClientDto(data.client) : data.client;
    this.userOperator = data.userOperator;
    this.operatorId = data.operatorId;
    this.operator = data.operator ? new SaleOperatorDto(data.operator) : null;
    this.date = data.date;
    this.payments =
      data.payments?.map((p: any) => new SalePaymentResponseDto(p)) ?? [];
    this.totalProductsWithoutDiscount = Number(
      data.totalProductsWithoutDiscount,
    );
    this.discount = Number(data.discount);
    this.total = Number(data.total);
    this.profitSale = Number(data.profitSale);
    this.isPaid = data.isPaid;
    this.cfop = data.cfop;
    this.fiscalStatus = data.fiscalStatus;
    this.fiscalKey = data.fiscalKey;
    this.fiscalProtocol = data.fiscalProtocol;
    this.fiscalEmitDate = data.fiscalEmitDate;
    this.fiscalXml = data.fiscalXml;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.items = data.items?.map((item: any) => new SaleItemResponseDto(item));
  }
}

export class PaginatedSalesResponseDto {
  @ApiProperty({ type: [SaleResponseDto] })
  data: SaleResponseDto[];
  @ApiProperty({ example: 100 })
  total: number;
  @ApiProperty({ example: 1 })
  page: number;
  @ApiProperty({ example: 10 })
  limit: number;
  @ApiProperty({ example: 10 })
  totalPages: number;

  constructor(data: any) {
    this.data = data.data.map((sale: any) => new SaleResponseDto(sale));
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
    this.totalPages = data.totalPages;
  }
}
