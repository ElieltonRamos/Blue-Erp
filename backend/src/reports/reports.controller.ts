/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SalesReportFilterDto } from './dto/create-report-sale.dto';
import { SalesReportService } from './sale-reports.service';
import { ProductReportService } from './product-reports.service';
import { SalesReportResponseDto } from './dto/response-report-sale.dto';
import { ProductReportResponseDto } from './dto/response-report-product.dto';
import { ProductReportFilterDto } from './dto/create-report-product.dto';
import { ExpenseReportResponseDto } from './dto/response-report-expense.dto';
import { ExpenseReportFilterDto } from './dto/create-report-expense.dto';
import { ExpenseReportService } from './expense-reports.service';
import { OrderReportResponseDto } from './dto/response-report-order.dto';
import { OrderReportFilterDto } from './dto/create-report-order.dto';
import { OrderReportService } from './orders-report.service';

@ApiTags('Relatórios')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly salesReportService: SalesReportService,
    private readonly productReportService: ProductReportService,
    private readonly expenseReportService: ExpenseReportService,
    private readonly orderReportService: OrderReportService,
  ) {}

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
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de filtro inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async generateSalesReport(
    @Query() filters: SalesReportFilterDto,
  ): Promise<SalesReportResponseDto> {
    return await this.salesReportService.generateReportByDate(filters);
  }

  @Get('products')
  @ApiOperation({
    summary: 'Gerar relatório de produtos por período',
    description:
      'Gera um relatório de produtos com top vendidos, uso de matérias-primas, vencimentos próximos, níveis de estoque e sugestões de compra.',
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
    type: ProductReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de filtro inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async generateProductReport(
    @Query() filters: ProductReportFilterDto,
  ): Promise<ProductReportResponseDto> {
    return await this.productReportService.generateProductReport(filters);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Gerar relatório de despesas por período' })
  @ApiQuery({ name: 'startDate', type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', type: String, example: '2024-01-31' })
  @ApiResponse({ status: HttpStatus.OK, type: ExpenseReportResponseDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de filtro inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async generateExpenseReport(
    @Query() filters: ExpenseReportFilterDto,
  ): Promise<ExpenseReportResponseDto> {
    return await this.expenseReportService.generateExpenseReport(
      filters as { startDate: string; endDate: string },
    );
  }

  @Get('orders')
  @ApiOperation({ summary: 'Gerar relatório de pedidos por período' })
  @ApiQuery({ name: 'startDate', type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', type: String, example: '2024-01-31' })
  @ApiResponse({ status: HttpStatus.OK, type: OrderReportResponseDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de filtro inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async generateOrderReport(
    @Query() filters: OrderReportFilterDto,
  ): Promise<OrderReportResponseDto> {
    return await this.orderReportService.generateOrderReport(filters);
  }
}
