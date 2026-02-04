import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Criar nova despesa' })
  @ApiResponse({ status: 200, description: 'Despesa criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar despesas com paginação e filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-02-03' })
  @ApiQuery({ name: 'supplier', required: false, example: 'Fornecedor ABC' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Pago', 'Pendente', 'Atrasado'],
  })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('supplier') supplier?: string,
    @Query('status') status?: 'Pago' | 'Pendente' | 'Atrasado',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const filters = {
      startDate,
      endDate,
      supplier,
      status,
      sortBy,
      sortOrder,
    };

    return this.expensesService.findAll(+page, +limit, filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar despesa por ID' })
  @ApiResponse({ status: 200, description: 'Despesa encontrada' })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar despesa' })
  @ApiResponse({ status: 200, description: 'Despesa atualizada' })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(+id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deletar despesa' })
  @ApiResponse({ status: 200, description: 'Despesa deletada' })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  remove(@Param('id') id: string) {
    return this.expensesService.remove(+id);
  }

  @Get('report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Relatório de despesas por período' })
  @ApiQuery({ name: 'startDate', example: '2026-01-01', required: true })
  @ApiQuery({ name: 'endDate', example: '2026-02-03', required: true })
  @ApiResponse({ status: 200, description: 'Relatório gerado' })
  getReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.expensesService.getReport(startDate, endDate);
  }
}
