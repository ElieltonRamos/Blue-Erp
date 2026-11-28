import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse, PaginatedResponseDto } from 'src/common/utils/paginated-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { FilterOptionGroupDto } from './dto/filter-option-group.dto';
import { OptionGroupResponseDto } from './dto/option-group-response.dto';
import { ProductOptionGroupResponseDto } from './dto/product-option-group-response.dto';
import { UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { UpdateProductOptionGroupsDto } from './dto/update-product-option-groups.dto';
import { OptionGroupService } from './option-group.service';
import { ProductOptionGroupService } from './product-option-group.service';

// Sem prefixo: cada rota declara o caminho completo, porque o controller cobre
// /option-groups e /products/:id/option-groups
@ApiTags('Option Groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class OptionGroupsController {
  constructor(
    private readonly optionGroupService: OptionGroupService,
    private readonly productOptionGroupService: ProductOptionGroupService,
  ) {}

  private actorOf(user: AuthenticatedUser): string {
    return `${user.username} (#${user.userId})`;
  }

  // ===== Grupos de opções =====

  @Post('option-groups')
  @ApiOperation({ summary: 'Criar grupo de opções (com ou sem opções)' })
  @ApiResponse({ status: 201, description: 'Grupo criado com sucesso', type: OptionGroupResponseDto })
  create(@Body() createOptionGroupDto: CreateOptionGroupDto, @CurrentUser() user: JwtPayload) {
    return this.optionGroupService.create(createOptionGroupDto, this.actorOf(user));
  }

  @Get('option-groups')
  @ApiOperation({ summary: 'Listar grupos de opções com filtros e paginação' })
  @ApiPaginatedResponse(OptionGroupResponseDto, 'Lista de grupos de opções')
  findAll(
    @Query() filters: FilterOptionGroupDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<OptionGroupResponseDto>> {
    return this.optionGroupService.findAll(
      this.actorOf(user),
      filters.page,
      filters.limit,
      filters,
      filters.sortKey,
      filters.sortOrder,
    );
  }

  @Get('option-groups/:id')
  @ApiOperation({ summary: 'Buscar grupo de opções por ID (com as opções)' })
  @ApiResponse({ status: 200, description: 'Grupo encontrado', type: OptionGroupResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.optionGroupService.findOne(id, this.actorOf(user));
  }

  @Put('option-groups/:id')
  @ApiOperation({ summary: 'Atualizar grupo de opções. Se "options" for enviado, a lista substitui as opções atuais' })
  @ApiResponse({ status: 200, description: 'Grupo atualizado', type: OptionGroupResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOptionGroupDto: UpdateOptionGroupDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.optionGroupService.update(id, updateOptionGroupDto, this.actorOf(user));
  }

  @Delete('option-groups/:id')
  @ApiOperation({ summary: 'Deletar grupo de opções (remove as opções e os vínculos)' })
  @ApiResponse({ status: 200, description: 'Grupo deletado' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.optionGroupService.remove(id, this.actorOf(user));
  }

  // ===== Vínculo produto <-> grupos de opções =====

  @Get('products/:id/option-groups')
  @ApiOperation({ summary: 'Ver os grupos de opções vinculados ao produto' })
  @ApiResponse({ status: 200, description: 'Grupos vinculados, na ordem de exibição', type: [ProductOptionGroupResponseDto] })
  findByProduct(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.productOptionGroupService.findByProduct(id, this.actorOf(user));
  }

  @Put('products/:id/option-groups')
  @ApiOperation({ summary: 'Substituir os grupos de opções do produto (ordem e overrides de min, max e maxPerOption)' })
  @ApiResponse({ status: 200, description: 'Vínculos atualizados', type: [ProductOptionGroupResponseDto] })
  updateProductOptionGroups(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductOptionGroupsDto: UpdateProductOptionGroupsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productOptionGroupService.update(id, updateProductOptionGroupsDto, this.actorOf(user));
  }
}
