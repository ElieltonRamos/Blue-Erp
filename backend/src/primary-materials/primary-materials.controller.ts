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
} from '@nestjs/common';
import { PrimaryMaterialsService } from './primary-materials.service';
import { CreatePrimaryMaterialDto } from './dto/create-primary-material.dto';
import { UpdatePrimaryMaterialDto } from './dto/update-primary-material.dto';
import { FilterPrimaryMaterialDto } from './dto/filter-primary-material.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('primary-materials')
export class PrimaryMaterialsController {
  constructor(
    private readonly primaryMaterialsService: PrimaryMaterialsService,
  ) {}

  /**
   * POST /primary-materials
   * Criar nova matéria-prima
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPrimaryMaterialDto: CreatePrimaryMaterialDto) {
    console.log(createPrimaryMaterialDto);
    return this.primaryMaterialsService.create(createPrimaryMaterialDto);
  }

  /**
   * GET /primary-materials
   * Listar todas as matérias-primas com filtros opcionais
   * Query params: search, unit, active
   */
  @Get()
  findAll(@Query() filters: FilterPrimaryMaterialDto) {
    return this.primaryMaterialsService.findAll(filters);
  }

  /**
   * GET /primary-materials/suggested-code
   * Obter sugestão de código para nova matéria-prima
   * IMPORTANTE: Este endpoint deve vir ANTES de :id para não conflitar
   */
  @Get('suggested-code')
  getSuggestedCode() {
    return this.primaryMaterialsService.getSuggestedCode();
  }

  /**
   * GET /primary-materials/summary
   * Obter resumo/estatísticas das matérias-primas
   */
  @Get('summary')
  getSummary() {
    return this.primaryMaterialsService.getSummary();
  }

  /**
   * GET /primary-materials/stock-alerts
   * Listar matérias-primas com estoque baixo/zero
   */
  @Get('stock-alerts')
  getStockAlerts() {
    return this.primaryMaterialsService.getStockAlerts();
  }

  /**
   * GET /primary-materials/:id
   * Buscar matéria-prima por ID
   */
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.primaryMaterialsService.findOne(id);
  }

  /**
   * GET /primary-materials/code/:code
   * Buscar matéria-prima por código
   */
  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.primaryMaterialsService.findByCode(code);
  }

  /**
   * PATCH /primary-materials/:id
   * Atualizar matéria-prima
   */
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updatePrimaryMaterialDto: UpdatePrimaryMaterialDto,
  ) {
    return this.primaryMaterialsService.update(id, updatePrimaryMaterialDto);
  }

  /**
   * PATCH /primary-materials/:id/adjust-stock
   * Ajustar estoque da matéria-prima (entrada/saída/definir valor)
   */
  @Patch(':id/adjust-stock')
  adjustStock(@Param('id') id: number, @Body() adjustStockDto: AdjustStockDto) {
    return this.primaryMaterialsService.adjustStock(id, adjustStockDto);
  }

  /**
   * DELETE /primary-materials/:id
   * Remover matéria-prima (soft delete - marca como inativo)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: number) {
    return this.primaryMaterialsService.remove(id);
  }

  /**
   * DELETE /primary-materials/:id/force
   * Deletar permanentemente a matéria-prima (hard delete)
   * Apenas se não estiver sendo usada em produtos
   */
  @Delete(':id/force')
  @HttpCode(HttpStatus.OK)
  forceDelete(@Param('id') id: number) {
    return this.primaryMaterialsService.forceDelete(id);
  }
}
