import { ApiProperty } from '@nestjs/swagger';

export class PaymentBreakdownDto {
  @ApiProperty({ description: 'Valor total em dinheiro', example: 800.5 })
  dinheiro: number;

  @ApiProperty({
    description: 'Valor total em cartão de crédito',
    example: 1500.0,
  })
  cartaoCredito: number;

  @ApiProperty({
    description: 'Valor total em cartão de débito',
    example: 600.25,
  })
  cartaoDebito: number;

  @ApiProperty({ description: 'Valor total em PIX', example: 1250.75 })
  pix: number;

  @ApiProperty({ description: 'Valor total em crédito loja', example: 500.0 })
  creditoLoja: number;
}

export class OperatorSalesDto {
  @ApiProperty({ description: 'Nome do operador', example: 'João Silva' })
  operator: string;

  @ApiProperty({ description: 'Número total de vendas', example: 15 })
  totalSales: number;

  @ApiProperty({ description: 'Receita total do operador', example: 3250.75 })
  revenue: number;

  @ApiProperty({
    description: 'Detalhamento por forma de pagamento',
    type: PaymentBreakdownDto,
  })
  paymentBreakdown: PaymentBreakdownDto;
}

export class SalesReportSummaryDto {
  @ApiProperty({
    description: 'Número total de vendas no período',
    example: 45,
  })
  totalSales: number;

  @ApiProperty({ description: 'Receita bruta total', example: 12500.75 })
  grossRevenue: number;

  @ApiProperty({ description: 'Lucro bruto total', example: 4200.3 })
  grossProfit: number;

  @ApiProperty({ description: 'Total de descontos aplicados', example: 350.5 })
  totalDiscounts: number;

  @ApiProperty({
    description: 'Vendas por forma de pagamento',
    type: PaymentBreakdownDto,
  })
  salesByPaymentMethod: PaymentBreakdownDto;

  @ApiProperty({ description: 'Vendas por operador', type: [OperatorSalesDto] })
  salesByOperator: OperatorSalesDto[];
}

export class SalesReportResponseDto {
  @ApiProperty({
    description: 'Status da operação',
    enum: ['OK', 'ERROR'],
    example: 'OK',
  })
  status: 'OK' | 'ERROR';

  @ApiProperty({
    description: 'Dados do relatório',
    type: SalesReportSummaryDto,
    required: false,
  })
  data?: SalesReportSummaryDto;

  @ApiProperty({ description: 'Mensagem de erro', required: false })
  message?: string;
}
