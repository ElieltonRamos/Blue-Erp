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
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalesService } from './sales.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { UpdateSaleDto } from './dto/update-sale.dto.js';
import { JwtAuthGuard, JwtPayload } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  PaginatedSalesResponseDto,
  SaleResponseDto,
} from './dto/response-sale.dto.js';
import { SaleFiltersDto } from './dto/filters-sale.dto.js';
import { ConvertOrderToSaleDto } from '../orders/dto/convert-order-to-sale.js';
import { MarkAsReceivedDto } from './dto/mark-as-received.dto.js';
import { FinalizeDocumentDto } from './dto/finalize-document.dto.js';
import { DocumentSaleService } from './document-sale.service.js';
import { CreateDirectSaleDto } from './dto/create-direct-sale.dto.js';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private documentService: DocumentSaleService,
  ) {}

  @Post('direct')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar venda direta (sem pedido ou documento de origem)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Venda criada com sucesso',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cliente ou produto não encontrado, ou pagamento inválido',
  })
  createDirectSale(
    @Body() dto: CreateDirectSaleDto,
    @CurrentUser('userId') userId: number,
    @CurrentUser('username') username: string,
  ) {
    return this.salesService.createDirectSale(dto, userId, username);
  }

  @Get('by-document/:documentId')
  @ApiOperation({ summary: 'Buscar venda pelo ID do documento de origem' })
  @ApiParam({ name: 'documentId', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda encontrada',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nenhuma venda associada a esse documento',
  })
  findByDocumentId(@Param('documentId', ParseIntPipe) documentId: number) {
    return this.documentService.findByDocumentId(documentId);
  }

  @Post('finalize-document/:documentId')
  @ApiOperation({
    summary: 'Finalizar OS e gerar venda (Sale) a partir dos itens PRODUCT',
  })
  @ApiParam({
    name: 'documentId',
    type: Number,
    description: 'ID do documento',
  })
  @ApiResponse({
    status: 201,
    description: 'Venda gerada com sucesso',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Documento não está IN_PROGRESS, sem itens PRODUCT, ou pagamento inválido',
  })
  finalizeDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() dto: FinalizeDocumentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SaleResponseDto> {
    return this.documentService.convertDocumentoToSale(
      documentId,
      dto,
      user.userId,
      user.username,
    );
  }

  @Patch('mark-as-received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar múltiplas vendas como recebidas/pagas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendas marcadas como recebidas',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: '3 venda(s) marcada(s) como recebida(s) com sucesso',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lista de IDs inválida',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nenhuma venda pendente encontrada',
  })
  markAsReceived(
    @Body() dto: MarkAsReceivedDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.salesService.markAsReceived(dto.salesIds, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova venda' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Venda criada com sucesso',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cliente não encontrado',
  })
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser('userId') userId: number,
    @CurrentUser('username') username: string,
  ) {
    return this.salesService.create(createSaleDto, userId, username);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vendas com filtros e paginação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de vendas',
    type: PaginatedSalesResponseDto,
  })
  findAll(@Query() filters: SaleFiltersDto) {
    return this.salesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar venda por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda encontrada',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda não encontrada',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar venda' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda atualizada',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Venda não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Venda com nota emitida não pode ser alterada',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleDto: UpdateSaleDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.salesService.update(id, updateSaleDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir venda' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Venda excluída',
    schema: {
      properties: {
        message: { type: 'string', example: 'Venda excluída com sucesso' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Venda com nota emitida não pode ser deletada',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.salesService.remove(id, userId);
  }

  @Post('convert/:orderId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Converter pedido em venda' })
  @ApiParam({ name: 'orderId', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pedido convertido em venda',
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pedido não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Apenas pedidos fechados podem ser convertidos',
  })
  convertOrderToSale(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: ConvertOrderToSaleDto,
    @CurrentUser('userId') userId: number,
    @CurrentUser('username') username: string,
  ) {
    return this.salesService.convertOrderToSale(orderId, dto, userId, username);
  }
}
