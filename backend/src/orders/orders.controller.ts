import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './order.service';
import { OrderStatusService } from './order-status.service';
import { OrderEntity } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  OrderFiltersDto,
  OrderPaginatedResponseDto,
} from './dto/order-filters.dto';
import { JwtAuthGuard, JwtPayload } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReprintOrderDto } from './dto/reprint-order.dto';
import { OrderCleanupService } from './order-cleanup.service';
import { AutoClosedOrderDto } from './dto/auto-closed-order.dto';

@ApiTags('Orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderStatusService: OrderStatusService,
    private readonly orderCleanupService: OrderCleanupService,
  ) {}

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
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderEntity> {
    return this.ordersService.create(createOrderDto, user.userId);
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

  @Get('auto-closed')
  @ApiOperation({
    summary: 'Listar pedidos fechados automaticamente pelo job de limpeza',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pedidos fechados pelo sistema',
    type: [AutoClosedOrderDto],
  })
  getAutoClosedOrders(): Promise<AutoClosedOrderDto[]> {
    return this.orderCleanupService.findAutoClosed();
  }

  @Get('closed-without-payment')
  @ApiOperation({
    summary: 'Listar pedidos fechados sem pagamento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pedidos CLOSED sem Sale vinculada',
    type: [AutoClosedOrderDto],
  })
  getClosedWithoutPayment(): Promise<AutoClosedOrderDto[]> {
    return this.orderCleanupService.findClosedWithoutPayment();
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
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderEntity> {
    return this.ordersService.update(
      id,
      updateOrderDto,
      user.role,
      user.userId,
    );
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
    return this.orderStatusService.cancel(id);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir pedido' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pedido reaberto com sucesso',
    type: OrderEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Pedido já aberto, pago, ou mesa ocupada',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  reopen(@Param('id', ParseIntPipe) id: number): Promise<OrderEntity> {
    return this.orderStatusService.reopen(id);
  }

  @Post(':id/reprint')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reimprimir pedido' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiBody({ type: ReprintOrderDto })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Reimpressão enviada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Nenhum item imprimível',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  reprint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReprintOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.ordersService.reprint(id, dto, user.userId);
  }
}
