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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderEntity } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { SendToKitchenDto } from './dto/send-to-kitchen.dto';
import {
  OrderFiltersDto,
  OrderPaginatedResponseDto,
} from './dto/order-filters.dto';
import { ConvertOrderToSaleDto } from './dto/convert-order-to-sale';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo pedido' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pedido criado com sucesso',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  create(@Body() createOrderDto: CreateOrderDto): Promise<OrderEntity> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos com filtros e paginação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pedidos',
    type: OrderPaginatedResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['OPEN', 'CLOSED', 'CANCELED'],
  })
  @ApiQuery({
    name: 'location',
    required: false,
    enum: ['LOCAL_01', 'LOCAL_02', 'LOCAL_03', 'DELIVERY'],
  })
  @ApiQuery({ name: 'type', required: false, enum: ['DINE_IN', 'DELIVERY'] })
  @ApiQuery({ name: 'table', required: false, type: String })
  @ApiQuery({ name: 'searchName', required: false, type: String })
  @ApiQuery({ name: 'searchId', required: false, type: String })
  findAll(
    @Query() filters: OrderFiltersDto,
  ): Promise<OrderPaginatedResponseDto> {
    return this.ordersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido encontrado',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderEntity> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar pedido' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido atualizado com sucesso',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar pedido' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Pedido deletado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ordersService.remove(id);
  }

  @Post(':id/send-to-kitchen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar pedido para cozinha' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido enviado para cozinha',
    schema: {
      properties: {
        orderId: { type: 'number' },
        kitchenSentAt: { type: 'string', format: 'date-time' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Pedido não pode ser enviado (já enviado ou não está aberto)',
  })
  sendToKitchen(
    @Param('id', ParseIntPipe) id: number,
    @Body() sendToKitchenDto: SendToKitchenDto,
  ) {
    return this.ordersService.sendToKitchen(id, sendToKitchenDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar pedido' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido cancelado com sucesso',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Apenas pedidos abertos podem ser cancelados',
  })
  cancel(@Param('id', ParseIntPipe) id: number): Promise<OrderEntity> {
    return this.ordersService.cancel(id);
  }

  @Patch(':id/mark-ready')
  @ApiOperation({
    summary: 'Marcar pedido como pronto (todos itens preparados)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido marcado como pronto',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Pedido não pode ser marcado como pronto (não enviado para cozinha ou itens não estão prontos)',
  })
  markReady(@Param('id', ParseIntPipe) id: number): Promise<OrderEntity> {
    return this.ordersService.markReady(id);
  }

  @Post(':id/convert-to-sale')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Converter pedido fechado em venda' })
  @ApiResponse({
    status: 201,
    description: 'Pedido convertido em venda com sucesso',
    schema: {
      example: {
        saleId: 123,
        orderId: 456,
        total: 150.5,
        profitSale: 45.3,
        fiscalStatus: 'PENDENTE',
        message: 'Pedido convertido em venda com sucesso',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Apenas pedidos fechados podem ser convertidos em venda',
  })
  @ApiResponse({
    status: 401,
    description: 'Token não fornecido ou inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido ou cliente não encontrado',
  })
  convertToSale(
    @Param('id', ParseIntPipe) id: number,
    @Body() convertOrderToSaleDto: ConvertOrderToSaleDto,
    @CurrentUser('userId') userId: number,
    @CurrentUser('username') username: string,
  ) {
    return this.ordersService.convertToSale(
      id,
      convertOrderToSaleDto,
      userId,
      username,
    );
  }
}
