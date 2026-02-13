import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SalesReportFilterDto } from './dto/create-report-sale.dto';
import { SalesReportService } from './sale-reports.service';
import { SalesReportResponseDto } from './dto/response-report-sale.dto';

@ApiTags('Relatórios de Vendas')
@Controller('reports/')
export class ReportsController {
  constructor(private readonly salesReportService: SalesReportService) {}

  @Get('sales')
  @ApiOperation({
    summary: 'Gerar relatório de vendas por período',
    description:
      'Gera um relatório completo de vendas filtrado por período de datas, incluindo resumo financeiro, vendas por operador e forma de pagamento.',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    description: 'Data de início do período (formato: YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    description: 'Data de fim do período (formato: YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Relatório gerado com sucesso',
    type: SalesReportResponseDto,
    schema: {
      example: {
        status: 'OK',
        data: {
          totalSales: 45,
          grossRevenue: 12500.75,
          grossProfit: 4200.3,
          totalDiscounts: 350.5,
          salesByPaymentMethod: {
            pix: 5250.25,
            cash: 3100.5,
            card: 3800.0,
            promissoryNote: 350.0,
          },
          salesByOperator: [
            {
              operator: 'João Silva',
              totalSales: 15,
              revenue: 4200.75,
              paymentBreakdown: {
                pix: 1800.25,
                cash: 1200.5,
                card: 1000.0,
                promissoryNote: 200.0,
              },
            },
            {
              operator: 'Maria Santos',
              totalSales: 20,
              revenue: 5800.0,
              paymentBreakdown: {
                pix: 2450.0,
                cash: 1400.0,
                card: 1800.0,
                promissoryNote: 150.0,
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de filtro inválidos',
    schema: {
      example: {
        status: 'ERROR',
        message: 'Data de início não pode ser maior que a data de fim',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
    schema: {
      example: {
        status: 'ERROR',
        message: 'Erro interno do servidor ao gerar relatório',
      },
    },
  })
  async generateReportByDate(
    @Query() filters: SalesReportFilterDto,
  ): Promise<SalesReportResponseDto> {
    return await this.salesReportService.generateReportByDate(filters);
  }
}
