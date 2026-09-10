import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ServiceResponseDto } from './dto/service-response.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  JwtAuthGuard,
  JwtPayload,
} from '../../common/guards/jwt-auth.guard.js';
import { FindAllServicesDto } from './dto/find-all-services.dto.js';
import { PaginatedResponseDto } from './dto/paginated-response.dto.js';

@ApiTags('Services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo serviço' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Serviço criado com sucesso',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ServiceResponseDto> {
    return this.catalogService.create(dto, user.username);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar serviços (paginado, com busca e filtro por ativo)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de serviços',
    type: PaginatedResponseDto,
  })
  findAll(
    @Query() query: FindAllServicesDto,
  ): Promise<PaginatedResponseDto<ServiceResponseDto>> {
    return this.catalogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do serviço' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Serviço encontrado',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Serviço não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ServiceResponseDto> {
    return this.catalogService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do serviço' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Serviço atualizado com sucesso',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Serviço não encontrado',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ServiceResponseDto> {
    return this.catalogService.update(id, dto, user.username);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar serviço (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do serviço' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Serviço desativado com sucesso',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Serviço não encontrado',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ServiceResponseDto> {
    return this.catalogService.remove(id, user.username);
  }
}
