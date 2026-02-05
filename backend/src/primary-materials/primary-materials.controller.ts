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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPrimaryMaterialDto: CreatePrimaryMaterialDto) {
    return this.primaryMaterialsService.create(createPrimaryMaterialDto);
  }

  @Get()
  findAll(@Query() filters: FilterPrimaryMaterialDto) {
    const {
      page = 1,
      limit = 10,
      sortKey = 'name',
      sortOrder = 'asc',
      ...rest
    } = filters;

    return this.primaryMaterialsService.findAll(
      page,
      limit,
      rest,
      sortKey,
      sortOrder,
    );
  }

  @Get('suggested-code')
  getSuggestedCode() {
    return this.primaryMaterialsService.getSuggestedCode();
  }

  @Get('summary')
  getSummary() {
    return this.primaryMaterialsService.getSummary();
  }

  @Get('stock-alerts')
  getStockAlerts() {
    return this.primaryMaterialsService.getStockAlerts();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.primaryMaterialsService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.primaryMaterialsService.findByCode(code);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updatePrimaryMaterialDto: UpdatePrimaryMaterialDto,
  ) {
    return this.primaryMaterialsService.update(id, updatePrimaryMaterialDto);
  }

  @Patch(':id/adjust-stock')
  adjustStock(@Param('id') id: number, @Body() adjustStockDto: AdjustStockDto) {
    return this.primaryMaterialsService.adjustStock(id, adjustStockDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: number) {
    return this.primaryMaterialsService.remove(id);
  }

  @Delete(':id/force')
  @HttpCode(HttpStatus.OK)
  forceDelete(@Param('id') id: number) {
    return this.primaryMaterialsService.forceDelete(id);
  }
}
