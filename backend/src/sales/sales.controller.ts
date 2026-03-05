import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalesService } from './sales.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { UpdateSaleDto } from './dto/update-sale.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  PaginatedSalesResponseDto,
  SaleResponseDto,
} from './dto/response-sale.dto.js';
import { SaleFiltersDto } from './dto/filters-sale.dto.js';
import { ConvertOrderToSaleDto } from '../orders/dto/convert-order-to-sale.js';
import { MarkAsReceivedDto } from './dto/mark-as-received.dto.js';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Patch('mark-as-received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar múltiplas vendas como recebidas/pagas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendas marcadas como recebidas',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: '3 venda(s) marcada(s) como recebida(s) com sucesso',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lista de IDs inválida',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nenhuma venda pendente encontrada',
  })
  markAsReceived(@Body() dto: MarkAsReceivedDto) {
    return this.salesService.markAsReceived(dto.salesIds);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova venda' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Venda criada com sucesso',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cliente não encontrado',
  })
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('userId') userId: number,
    @CurrentUser('username') username: string,
  ) {
    return this.salesService.create(createSaleDto, userId, username);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vendas com filtros e paginação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de vendas',
    type: PaginatedSalesResponseDto,
  })
  findAll(@Query() filters: SaleFiltersDto) {
    return this.salesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar venda por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda encontrada',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda não encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar venda' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda atualizada',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Venda com nota emitida não pode ser alterada',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir venda' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda excluída',
    schema: {
      properties: {
        message: { type: 'string', example: 'Venda excluída com sucesso' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Venda com nota emitida não pode ser deletada',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.remove(id);
  }

  @Post('convert/:orderId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Converter pedido em venda' })
  @ApiParam({ name: 'orderId', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pedido convertido em venda',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Apenas pedidos fechados podem ser convertidos',
  })
  convertOrderToSale(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: ConvertOrderToSaleDto,
    @CurrentUser('userId') userId: number,
    @CurrentUser('username') username: string,
  ) {
    return this.salesService.convertOrderToSale(orderId, dto, userId, username);
  }
}
