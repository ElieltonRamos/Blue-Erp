import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodBreakdownDto {
  @ApiProperty({
    description: 'Valor total em PIX',
    example: 1250.75,
    type: 'number',
  })
  pix: number;

  @ApiProperty({
    description: 'Valor total em dinheiro',
    example: 800.5,
    type: 'number',
  })
  cash: number;

  @ApiProperty({
    description: 'Valor total em cartão',
    example: 2100.25,
    type: 'number',
  })
  card: number;

  @ApiProperty({
    description: 'Valor total em promissórias',
    example: 500.0,
    type: 'number',
  })
  promissoryNote: number;
}

export class OperatorSalesDto {
  @ApiProperty({
    description: 'Nome do operador',
    example: 'João Silva',
  })
  operator: string;

  @ApiProperty({
    description: 'Número total de vendas',
    example: 15,
  })
  totalSales: number;

  @ApiProperty({
    description: 'Receita total do operador',
    example: 3250.75,
    type: 'number',
  })
  revenue: number;

  @ApiProperty({
    description: 'Detalhamento por forma de pagamento',
    type: PaymentMethodBreakdownDto,
  })
  paymentBreakdown: PaymentMethodBreakdownDto;
}

export class SalesReportSummaryDto {
  @ApiProperty({
    description: 'Número total de vendas no período',
    example: 45,
  })
  totalSales: number;

  @ApiProperty({
    description: 'Receita bruta total',
    example: 12500.75,
    type: 'number',
  })
  grossRevenue: number;

  @ApiProperty({
    description: 'Lucro bruto total',
    example: 4200.3,
    type: 'number',
  })
  grossProfit: number;

  @ApiProperty({
    description: 'Total de descontos aplicados',
    example: 350.5,
    type: 'number',
  })
  totalDiscounts: number;

  @ApiProperty({
    description: 'Vendas agrupadas por forma de pagamento',
    type: PaymentMethodBreakdownDto,
  })
  salesByPaymentMethod: PaymentMethodBreakdownDto;

  @ApiProperty({
    description: 'Vendas agrupadas por operador',
    type: [OperatorSalesDto],
  })
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
    description: 'Dados do relatório de vendas',
    type: SalesReportSummaryDto,
    required: false,
  })
  data?: SalesReportSummaryDto;

  @ApiProperty({
    description: 'Mensagem de erro quando status for ERROR',
    example: 'Erro interno do servidor ao gerar relatório',
    required: false,
  })
  message?: string;
}
