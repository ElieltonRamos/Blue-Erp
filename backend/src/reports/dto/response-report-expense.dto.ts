import { ApiProperty } from '@nestjs/swagger';

export class ExpenseByStatusDto {
  @ApiProperty({
    description: 'Total de despesas pagas',
    example: 1500.0,
    type: 'number',
  })
  pago: number;

  @ApiProperty({
    description: 'Total de despesas pendentes',
    example: 800.0,
    type: 'number',
  })
  pendente: number;

  @ApiProperty({
    description: 'Total de despesas atrasadas',
    example: 300.0,
    type: 'number',
  })
  atrasado: number;
}

export class ExpenseBySupplierDto {
  @ApiProperty({ description: 'Nome do fornecedor', example: 'Fornecedor ABC' })
  supplier: string;

  @ApiProperty({
    description: 'Total de despesas do fornecedor',
    example: 450.0,
    type: 'number',
  })
  total: number;
}

export class ExpenseReportSummaryDto {
  @ApiProperty({
    description: 'Valor total de despesas no período',
    example: 2600.0,
    type: 'number',
  })
  totalValue: number;

  @ApiProperty({
    description: 'Total agrupado por status',
    type: ExpenseByStatusDto,
  })
  totalByStatus: ExpenseByStatusDto;

  @ApiProperty({
    description: 'Total agrupado por fornecedor',
    type: [ExpenseBySupplierDto],
  })
  totalBySupplier: ExpenseBySupplierDto[];
}

export class ExpenseReportResponseDto {
  @ApiProperty({
    description: 'Status da operação',
    enum: ['OK', 'ERROR'],
    example: 'OK',
  })
  status: 'OK' | 'ERROR';

  @ApiProperty({
    description: 'Dados do relatório de despesas',
    type: ExpenseReportSummaryDto,
    required: false,
  })
  data?: ExpenseReportSummaryDto;

  @ApiProperty({
    description: 'Mensagem de erro quando status for ERROR',
    example: 'Erro interno do servidor ao gerar relatório',
    required: false,
  })
  message?: string;
}
