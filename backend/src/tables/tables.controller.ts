// src/tables/tables.controller.ts
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
import { TablesService } from './tables.service.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';
import { OccupyTableDto } from './dto/occupy-table.dto.js';
import { ReserveTableDto } from './dto/reserve-table.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Tables')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova mesa' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mesa criada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Mesa já existe nesta localização',
  })
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mesas' })
  @ApiQuery({
    name: 'locationId',
    required: false,
    type: Number,
    description: 'Filtrar por localização',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de mesas' })
  findAll(@Query('locationId') locationId?: string) {
    return this.tablesService.findAll(locationId ? +locationId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar mesa por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mesa encontrada' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mesa não encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar mesa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mesa atualizada' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mesa não encontrada',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTableDto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, updateTableDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir mesa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mesa excluída' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mesa não está disponível',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.remove(id);
  }

  @Patch(':id/occupy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ocupar mesa (cria Order automaticamente)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mesa ocupada e comanda criada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mesa já ocupada',
  })
  occupy(
    @Param('id', ParseIntPipe) id: number,
    @Body() occupyTableDto: OccupyTableDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.tablesService.occupy(id, occupyTableDto, userId);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Liberar mesa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mesa liberada' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Finalize a comanda primeiro',
  })
  release(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.release(id);
  }

  @Patch(':id/reserve')
  @ApiOperation({ summary: 'Reservar mesa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mesa reservada' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mesa está ocupada',
  })
  reserve(
    @Param('id', ParseIntPipe) id: number,
    @Body() reserveTableDto: ReserveTableDto,
  ) {
    return this.tablesService.reserve(id, reserveTableDto);
  }

  @Post(':id/close-tab')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fechar comanda da mesa (redireciona para /comandas/:orderId)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comanda fechada',
    schema: {
      properties: {
        orderId: { type: 'number' },
        total: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mesa sem comanda ativa',
  })
  closeTab(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.closeTab(id);
  }
}
