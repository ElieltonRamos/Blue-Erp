import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FiscalStatus } from 'generated/prisma/client';

export class SaleClientDto {
  @ApiProperty({ description: 'ID do cliente', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome do cliente', example: 'João Silva' })
  name: string;

  @ApiPropertyOptional({
    description: 'Telefone do cliente',
    example: '11987654321',
  })
  phone: string | null;

  @ApiPropertyOptional({
    description: 'Endereço do cliente',
    example: 'Rua A, 123',
  })
  address: string | null;

  @ApiPropertyOptional({
    description: 'CPF do cliente',
    example: '12345678900',
  })
  cpf: string | null;

  @ApiProperty({ description: 'Cliente ativo', example: true })
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
  @ApiProperty({ description: 'ID do operador', example: 2 })
  id: number;

  @ApiProperty({ description: 'Nome do operador', example: 'Maria Santos' })
  username: string;

  @ApiProperty({ description: 'Função do operador', example: 'USER' })
  role: string;

  constructor(data: any) {
    this.id = data.id;
    this.username = data.username;
    this.role = data.role;
  }
}

export class SaleItemResponseDto {
  @ApiProperty({ description: 'ID do item', example: 1 })
  id: number;

  @ApiProperty({ description: 'Número do item na venda', example: 1 })
  itemNumber: number;

  @ApiProperty({ description: 'ID da venda', example: 1 })
  saleId: number;

  @ApiProperty({ description: 'ID do produto', example: 5 })
  productId: number;

  @ApiPropertyOptional({
    description: 'Nome do produto',
    example: 'Pizza Margherita',
  })
  xProd: string | null;

  @ApiProperty({ description: 'Quantidade', example: 2.5 })
  quantity: number;

  @ApiProperty({ description: 'Preço unitário', example: 45.0 })
  unitPrice: number;

  @ApiProperty({ description: 'Preço total', example: 112.5 })
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Unidade tributária', example: 'UN' })
  taxUnit: string | null;

  @ApiPropertyOptional({ description: 'Quantidade tributária', example: 2.5 })
  taxQuantity: number | null;

  @ApiPropertyOptional({
    description: 'Preço unitário tributário',
    example: 45.0,
  })
  taxUnitPrice: number | null;

  @ApiProperty({ description: 'Compõe total', example: 1 })
  composesTotal: number;

  @ApiPropertyOptional({ description: 'CFOP do item', example: '5102' })
  cfop: string | null;

  @ApiPropertyOptional({
    description: 'Valor total dos impostos',
    example: 15.5,
  })
  totalTaxValue: number | null;

  @ApiPropertyOptional({
    description: 'Valor do imposto de importação',
    example: 0,
  })
  importTaxValue: number | null;

  @ApiPropertyOptional({ description: 'Valor do IOF', example: 0 })
  iofValue: number | null;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
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
  @ApiProperty({ description: 'ID da venda', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID do cliente', example: 1 })
  clientId: number;

  @ApiProperty({ description: 'Informações do cliente', type: SaleClientDto })
  client: SaleClientDto;

  @ApiProperty({ description: 'Nome do operador', example: 'João Silva' })
  userOperator: string;

  @ApiPropertyOptional({ description: 'ID do operador', example: 2 })
  operatorId: number | null;

  @ApiPropertyOptional({
    description: 'Informações do operador',
    type: SaleOperatorDto,
  })
  operator: SaleOperatorDto | null;

  @ApiProperty({ description: 'Data da venda' })
  date: Date;

  @ApiProperty({ description: 'Método de pagamento', example: 'DINHEIRO' })
  paymentMethod: string;

  @ApiProperty({
    description: 'Total dos produtos sem desconto',
    example: 150.0,
  })
  totalProductsWithoutDiscount: number;

  @ApiProperty({ description: 'Desconto aplicado', example: 10.0 })
  discount: number;

  @ApiProperty({ description: 'Total da venda', example: 140.0 })
  total: number;

  @ApiProperty({ description: 'Lucro da venda', example: 80.0 })
  profitSale: number;

  @ApiProperty({ description: 'Venda foi paga', example: true })
  isPaid: boolean;

  @ApiProperty({ description: 'CFOP da operação', example: '5102' })
  cfop: string;

  @ApiProperty({
    description: 'Status fiscal',
    enum: FiscalStatus,
    example: FiscalStatus.PENDENTE,
  })
  fiscalStatus: FiscalStatus;

  @ApiPropertyOptional({
    description: 'Chave da nota fiscal',
    example: '35210512345678901234567890123456789012345678',
  })
  fiscalKey: string | null;

  @ApiPropertyOptional({
    description: 'Protocolo de autorização',
    example: '135210000000001',
  })
  fiscalProtocol: string | null;

  @ApiPropertyOptional({ description: 'Data de emissão da nota' })
  fiscalEmitDate: Date | null;

  @ApiPropertyOptional({ description: 'XML da nota fiscal' })
  fiscalXml: string | null;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Itens da venda',
    type: [SaleItemResponseDto],
  })
  items?: SaleItemResponseDto[];

  constructor(data: any) {
    this.id = data.id;
    this.clientId = data.clientId;
    this.client = data.client ? new SaleClientDto(data.client) : data.client;
    this.userOperator = data.userOperator;
    this.operatorId = data.operatorId;
    this.operator = data.operator ? new SaleOperatorDto(data.operator) : null;
    this.date = data.date;
    this.paymentMethod = data.paymentMethod;
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
  @ApiProperty({ description: 'Lista de vendas', type: [SaleResponseDto] })
  data: SaleResponseDto[];

  @ApiProperty({ description: 'Total de registros', example: 100 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Itens por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 10 })
  totalPages: number;

  constructor(data: any) {
    this.data = data.data.map((sale: any) => new SaleResponseDto(sale));
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
    this.totalPages = data.totalPages;
  }
}
