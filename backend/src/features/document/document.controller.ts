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
import { DocumentService } from './document.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { AddDocumentItemDto } from './dto/add-document-item.dto.js';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto.js';
import { FindAllDocumentsDto } from './dto/find-all-documents.dto.js';
import { DocumentResponseDto } from './dto/document-response.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  JwtAuthGuard,
  JwtPayload,
} from '../../common/guards/jwt-auth.guard.js';
import { PaginatedResponseDto } from '../catalog-service/dto/paginated-response.dto.js';

@ApiTags('Documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo orçamento/OS' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Documento criado com sucesso',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    return this.documentService.create(dto, user.username);
  }

  @Get()
  @ApiOperation({ summary: 'Listar orçamentos/OS (paginado, com filtros)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de documentos',
    type: PaginatedResponseDto,
  })
  findAll(
    @Query() query: FindAllDocumentsDto,
  ): Promise<PaginatedResponseDto<DocumentResponseDto>> {
    return this.documentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar orçamento/OS por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do documento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento encontrado',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documento não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DocumentResponseDto> {
    return this.documentService.findOne(id);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar item (peça ou serviço) ao documento' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do documento' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item adicionado com sucesso',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou documento não editável',
  })
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddDocumentItemDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    return this.documentService.addItem(id, dto, user.username);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remover item do documento' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do documento' })
  @ApiParam({ name: 'itemId', type: Number, description: 'ID do item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removido com sucesso',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item ou documento não encontrado',
  })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    return this.documentService.removeItem(id, itemId, user.username);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprovar orçamento (DRAFT -> APPROVED)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do documento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento aprovado com sucesso',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Documento não está em DRAFT',
  })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    return this.documentService.approve(id, user.username);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do documento (ex: APPROVED -> IN_PROGRESS)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID do documento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status atualizado com sucesso',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Transição de status não permitida',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    return this.documentService.updateStatus(id, dto, user.username);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar orçamento/OS' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do documento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento cancelado com sucesso',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Documento já possui venda gerada',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    return this.documentService.cancel(id, user.username);
  }
}
