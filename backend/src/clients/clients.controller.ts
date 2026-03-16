// src/clients/clients.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar novo cliente' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cliente criado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Nome ou CPF já cadastrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'CPF inválido ou dados incorretos',
  })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes com paginação' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Quantidade de itens por página',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filtrar por nome (busca parcial case-insensitive)',
    example: 'João',
  })
  @ApiQuery({
    name: 'filterStatus',
    required: false,
    enum: ['all', 'active', 'inactive'],
    description:
      'Filtrar por status: all (todos), active (ativos), inactive (inativos)',
    example: 'all',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de clientes retornada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de paginação inválidos',
  })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('name') name?: string,
    @Query('filterStatus') filterStatus: string = 'all',
  ) {
    // Converter string para boolean ou undefined
    let active: boolean | undefined;

    if (filterStatus === 'active') {
      active = true;
    } else if (filterStatus === 'inactive') {
      active = false;
    } else {
      active = undefined; // 'all' retorna todos (ativos e inativos)
    }

    return this.clientsService.findAll(+page, +limit, name, active);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar clientes por nome' })
  @ApiQuery({
    name: 'name',
    example: 'João',
    description: 'Nome ou parte do nome do cliente',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clientes encontrados',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Nome de busca vazio',
  })
  search(@Query('name') name: string) {
    return this.clientsService.search(name);
  }

  @Get('search/cpf')
  @ApiOperation({ summary: 'Buscar cliente por CPF' })
  @ApiQuery({
    name: 'cpf',
    example: '12345678900',
    description: 'CPF do cliente (com ou sem formatação)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'CPF inválido',
  })
  findByCpf(@Query('cpf') cpf: string) {
    return this.clientsService.findByCpf(cpf);
  }

  @Get('search/phone')
  @ApiOperation({ summary: 'Buscar clientes por telefone' })
  @ApiQuery({
    name: 'phone',
    example: '31999999999',
    description: 'Telefone ou parte do telefone',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clientes encontrados',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Telefone vazio',
  })
  findByPhone(@Query('phone') phone: string) {
    return this.clientsService.findByPhone(phone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do cliente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente atualizado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Nome ou CPF já cadastrado em outro cliente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(+id, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deletar cliente (marca como inativo)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente deletado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(+id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurar cliente (marca como ativo)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cliente restaurado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Cliente não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID inválido',
  })
  restore(@Param('id') id: string) {
    return this.clientsService.restore(+id);
  }
}
