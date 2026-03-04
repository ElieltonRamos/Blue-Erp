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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CategoryResponseDto } from './dto/response-category.dto';
import { PaginatedResponse } from 'src/common/paginated-response';
import { CategoryService } from './category-product.service';
import { UpdateCategoryDto } from './dto/update-category-product.dto';

@ApiTags('Categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
    type: CategoryResponseDto,
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias',
    type: [CategoryResponseDto],
  })
  findAll(
    @Query() filters: FilterCategoryDto,
  ): Promise<PaginatedResponse<CategoryResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortKey = 'name',
      sortOrder = 'asc',
      ...rest
    } = filters;

    return this.categoryService.findAll(page, limit, rest, sortKey, sortOrder);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({
    status: 200,
    description: 'Categoria encontrada',
    type: CategoryResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada',
    type: CategoryResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria deletada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
