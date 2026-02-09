import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductionLocationsService } from './production-locations.service';
import { CreateProductionLocationDto } from './dto/create-production-location.dto';
import { UpdateProductionLocationDto } from './dto/update-production-location.dto';

@ApiTags('Production Locations')
@Controller('production-locations')
export class ProductionLocationsController {
  constructor(
    private readonly productionLocationsService: ProductionLocationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo local de produção' })
  @ApiResponse({
    status: 201,
    description: 'Local de produção criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Código já existe',
  })
  create(@Body() createDto: CreateProductionLocationDto) {
    return this.productionLocationsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os locais de produção ativos' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir locais inativos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de locais de produção',
  })
  findAll(@Query('includeInactive') includeInactive?: string) {
    if (includeInactive === 'true') {
      return this.productionLocationsService.findAllIncludingInactive();
    }
    return this.productionLocationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar local de produção por ID' })
  @ApiParam({ name: 'id', description: 'ID do local de produção' })
  @ApiResponse({
    status: 200,
    description: 'Local de produção encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Local de produção não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productionLocationsService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar local de produção por código' })
  @ApiParam({
    name: 'code',
    description: 'Código do local de produção',
    example: 'LOCAL_01',
  })
  @ApiResponse({
    status: 200,
    description: 'Local de produção encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Local de produção não encontrado',
  })
  findByCode(@Param('code') code: string) {
    return this.productionLocationsService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar local de produção' })
  @ApiParam({ name: 'id', description: 'ID do local de produção' })
  @ApiResponse({
    status: 200,
    description: 'Local de produção atualizado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Local de produção não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Código já está em uso',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductionLocationDto,
  ) {
    return this.productionLocationsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir local de produção' })
  @ApiParam({ name: 'id', description: 'ID do local de produção' })
  @ApiResponse({
    status: 200,
    description: 'Local de produção excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Local de produção não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Local de produção está em uso',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productionLocationsService.remove(id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Ativar/desativar local de produção' })
  @ApiParam({ name: 'id', description: 'ID do local de produção' })
  @ApiResponse({
    status: 200,
    description: 'Status alterado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Local de produção não encontrado',
  })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.productionLocationsService.toggleActive(id);
  }
}
