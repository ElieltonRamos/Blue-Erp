import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AssetService } from './asset.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  JwtAuthGuard,
  JwtPayload,
} from '../../common/guards/jwt-auth.guard.js';
import { PaginatedResponseDto } from '../catalog-service/dto/paginated-response.dto.js';
import { AssetResponseDto } from './dto/asset-response.dto.js';
import { FindAllAssetsDto } from './dto/find-all-assets.dto.js';

@ApiTags('Assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo asset (ex: veículo do cliente)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Asset criado com sucesso',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  create(
    @Body() dto: CreateAssetDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssetResponseDto> {
    return this.assetService.create(dto, user.username);
  }

  @Get()
  @ApiOperation({ summary: 'Listar assets (paginado, com busca e filtros)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de assets',
    type: PaginatedResponseDto,
  })
  findAll(
    @Query() query: FindAllAssetsDto,
  ): Promise<PaginatedResponseDto<AssetResponseDto>> {
    return this.assetService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar asset por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do asset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset encontrado',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AssetResponseDto> {
    return this.assetService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar asset' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do asset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset atualizado com sucesso',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset não encontrado',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssetResponseDto> {
    return this.assetService.update(id, dto, user.username);
  }
}
