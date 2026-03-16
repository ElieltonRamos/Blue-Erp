import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './products.service';
import { ProductResponseDto } from './dto/response-product.dto';
import { PaginatedResponse } from 'src/common/paginated-response';
import { FilterProductDto } from './dto/filter-product.dto';
import { ProduceProductDto } from './dto/produce-product.dto';
import { UpdatePreparationDto } from './dto/update-preparation.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Criar produto (com ou sem composição/preparo)' })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso',
    type: ProductResponseDto,
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos',
    type: [ProductResponseDto],
  })
  findAll(
    @Query() filters: FilterProductDto,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortKey = 'name',
      sortOrder = 'asc',
      ...rest
    } = filters;

    return this.productService.findAll(page, limit, rest, sortKey, sortOrder);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo de produtos' })
  @ApiResponse({
    status: 200,
    description: 'Resumo dos produtos',
  })
  getSummary() {
    return this.productService.getSummary();
  }

  @Get('stock-alerts')
  @ApiOperation({ summary: 'Produtos com estoque baixo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos com estoque baixo',
  })
  getStockAlerts() {
    return this.productService.getStockAlerts();
  }

  @Get('suggest-code')
  @ApiOperation({ summary: 'Sugerir próximo código de produto' })
  @ApiResponse({
    status: 200,
    description: 'Código sugerido',
  })
  getSuggestCode() {
    return this.productService.getSuggestCode();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar produto por código' })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado',
    type: ProductResponseDto,
  })
  findByCode(@Param('code') code: string) {
    return this.productService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado',
    type: ProductResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Get(':id/composition')
  @ApiOperation({ summary: 'Ver composição do produto' })
  @ApiResponse({
    status: 200,
    description: 'Composição do produto',
  })
  getComposition(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getComposition(id);
  }

  @Get(':id/preparation')
  @ApiOperation({ summary: 'Ver passos de preparo do produto' })
  @ApiResponse({
    status: 200,
    description: 'Passos de preparo',
  })
  getPreparation(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getPreparation(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado',
    type: ProductResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(':id/composition')
  @ApiOperation({ summary: 'Atualizar composição do produto' })
  @ApiResponse({
    status: 200,
    description: 'Composição atualizada',
  })
  updateComposition(
    @Param('id', ParseIntPipe) id: number,
    @Body() composition: UpdateCompositionDto, // Criar DTO específico depois
  ) {
    return this.productService.updateComposition(id, composition);
  }

  @Patch(':id/preparation')
  @ApiOperation({ summary: 'Atualizar passos de preparo' })
  @ApiResponse({
    status: 200,
    description: 'Preparo atualizado',
  })
  updatePreparation(
    @Param('id', ParseIntPipe) id: number,
    @Body() preparation: UpdatePreparationDto, // Criar DTO específico depois
  ) {
    return this.productService.updatePreparation(id, preparation);
  }

  @Post(':id/produce')
  @ApiOperation({ summary: 'Produzir produto (baixa matérias-primas)' })
  @ApiResponse({
    status: 200,
    description: 'Produção realizada com sucesso',
  })
  produce(
    @Param('id', ParseIntPipe) id: number,
    @Body() produceDto: ProduceProductDto, // Criar DTO depois: { quantity: number }
  ) {
    return this.productService.produce(id, produceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto deletado',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
