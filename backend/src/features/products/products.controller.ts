import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/utils/paginated-response';
import { UploadedImage } from 'src/common/uploads/uploads.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { ProduceProductDto } from './dto/produce-product.dto';
import { ProductResponseDto } from './dto/response-product.dto';
import { UpdateCompositionDto } from './dto/update-composition.dto';
import { UpdatePreparationDto } from './dto/update-preparation.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCompositionService } from './product-composition.service';
import { ProductStockService } from './product-stock.service';
import { ProductService } from './products.service';

// Teto do multer, só para não bufferizar arquivos enormes em memória.
// O limite de 2 MB e a mensagem em pt-br ficam no UploadsService.
const UPLOAD_HARD_LIMIT = 5 * 1024 * 1024;

@ApiTags('Products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly compositionService: ProductCompositionService,
    private readonly stockService: ProductStockService,
  ) {}

  private actorOf(user: JwtPayload): string {
    return String(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar produto (com ou sem composição/preparo)' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso', type: ProductResponseDto })
  create(@Body() createProductDto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    return this.productService.create(createProductDto, this.actorOf(user));
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de produtos', type: [ProductResponseDto] })
  findAll(
    @Query() filters: FilterProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productService.findAll(
      this.actorOf(user),
      filters.page,
      filters.limit,
      filters,
      filters.sortKey,
      filters.sortOrder,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo de produtos' })
  @ApiResponse({ status: 200, description: 'Resumo dos produtos' })
  getSummary() {
    return this.stockService.getSummary();
  }

  @Get('stock-alerts')
  @ApiOperation({ summary: 'Produtos com estoque baixo' })
  @ApiResponse({ status: 200, description: 'Lista de produtos com estoque baixo' })
  getStockAlerts() {
    return this.stockService.getStockAlerts();
  }

  @Get('suggest-code')
  @ApiOperation({ summary: 'Sugerir próximo código de produto' })
  @ApiResponse({ status: 200, description: 'Código sugerido' })
  getSuggestCode() {
    return this.productService.getSuggestCode();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar produto por código' })
  @ApiResponse({ status: 200, description: 'Produto encontrado', type: ProductResponseDto })
  findByCode(@Param('code') code: string, @CurrentUser() user: JwtPayload) {
    return this.productService.findByCode(code, this.actorOf(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado', type: ProductResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.productService.findOne(id, this.actorOf(user));
  }

  @Get(':id/composition')
  @ApiOperation({ summary: 'Ver composição do produto' })
  @ApiResponse({ status: 200, description: 'Composição do produto' })
  getComposition(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.compositionService.getComposition(id, this.actorOf(user));
  }

  @Get(':id/preparation')
  @ApiOperation({ summary: 'Ver passos de preparo do produto' })
  @ApiResponse({ status: 200, description: 'Passos de preparo' })
  getPreparation(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.compositionService.getPreparation(id, this.actorOf(user));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado', type: ProductResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto, @CurrentUser() user: JwtPayload) {
    return this.productService.update(id, updateProductDto, this.actorOf(user));
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: UPLOAD_HARD_LIMIT } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary', description: 'Imagem JPEG, PNG ou WebP, de até 2 MB' } },
    },
  })
  @ApiOperation({ summary: 'Enviar a imagem do produto (cardápio online)' })
  @ApiResponse({ status: 201, description: 'Imagem atualizada', type: ProductResponseDto })
  uploadImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: UploadedImage, @CurrentUser() user: JwtPayload) {
    return this.productService.uploadImage(id, file, this.actorOf(user));
  }

  @Delete(':id/image')
  @ApiOperation({ summary: 'Remover a imagem do produto (cardápio online)' })
  @ApiResponse({ status: 200, description: 'Imagem removida', type: ProductResponseDto })
  removeImage(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.productService.removeImage(id, this.actorOf(user));
  }

  @Patch(':id/composition')
  @ApiOperation({ summary: 'Atualizar composição do produto' })
  @ApiResponse({ status: 200, description: 'Composição atualizada' })
  updateComposition(
    @Param('id', ParseIntPipe) id: number,
    @Body() composition: UpdateCompositionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.compositionService.updateComposition(id, composition, this.actorOf(user));
  }

  @Patch(':id/preparation')
  @ApiOperation({ summary: 'Atualizar passos de preparo' })
  @ApiResponse({ status: 200, description: 'Preparo atualizado' })
  updatePreparation(
    @Param('id', ParseIntPipe) id: number,
    @Body() preparation: UpdatePreparationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.compositionService.updatePreparation(id, preparation, this.actorOf(user));
  }

  @Post(':id/produce')
  @ApiOperation({ summary: 'Produzir produto (baixa matérias-primas)' })
  @ApiResponse({ status: 200, description: 'Produção realizada com sucesso' })
  produce(@Param('id', ParseIntPipe) id: number, @Body() produceDto: ProduceProductDto, @CurrentUser() user: JwtPayload) {
    return this.stockService.produce(id, produceDto, this.actorOf(user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar produto' })
  @ApiResponse({ status: 200, description: 'Produto deletado' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.productService.remove(id, this.actorOf(user));
  }
}
