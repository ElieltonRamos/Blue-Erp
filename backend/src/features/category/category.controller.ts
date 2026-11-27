import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticatedUser, JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CategoryResponseDto } from './dto/response-category.dto';
import { CategoryService } from './category.service';
import { UpdateCategoryDto } from './dto/update-category-product.dto';
import { PaginatedResponseDto } from 'src/common/utils/paginated-response';

@ApiTags('Categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  private actorOf(user: AuthenticatedUser): string {
    return `${user.username} (#${user.userId})`;
  }

  @Post()
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso', type: CategoryResponseDto })
  create(@Body() createCategoryDto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    return this.categoryService.create(createCategoryDto, this.actorOf(user));
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de categorias', type: [CategoryResponseDto] })
  findAll(
    @Query() filters: FilterCategoryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    const { page = 1, limit = 10, sortKey = 'name', sortOrder = 'asc', ...rest } = filters;

    return this.categoryService.findAll(this.actorOf(user), page, limit, rest, sortKey, sortOrder);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada', type: CategoryResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.categoryService.findOne(id, this.actorOf(user));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada', type: CategoryResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto, @CurrentUser() user: JwtPayload) {
    return this.categoryService.update(id, updateCategoryDto, this.actorOf(user));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria deletada' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.categoryService.remove(id, this.actorOf(user));
  }
}
