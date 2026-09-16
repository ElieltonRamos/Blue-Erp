// purchase.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseFromXmlDto } from './dto/create-purchase-from-xml.dto';
import { PurchaseStatus } from 'generated/prisma/client';
import { JwtAuthGuard, JwtPayload } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { NfeXmlParserService } from './nfe-xml-parser.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

interface UploadedXmlFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@ApiTags('Purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases')
export class PurchaseController {
  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly nfeXmlParserService: NfeXmlParserService,
  ) {}

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar compra e estornar estoque' })
  async cancel(@Param('id', ParseIntPipe) id: number) {
    await this.purchaseService.cancel(id);
    return { message: 'Compra cancelada e estoque estornado com sucesso' };
  }

  @Post('parse-xml')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Parsear XML da NFe e conciliar itens com produtos existentes',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async parseXml(@UploadedFile() file: UploadedXmlFile) {
    if (!file?.buffer) {
      throw new BadRequestException('Arquivo XML não enviado');
    }

    const parsed = this.nfeXmlParserService.parse(file.buffer);
    const reconciledItems = await this.purchaseService.reconcileItems(
      parsed.supplierCnpj,
      parsed.items,
    );

    return {
      ...parsed,
      items: reconciledItems,
      fiscalXml: file.buffer.toString('utf-8'),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Confirmar conciliação e registrar a compra' })
  create(
    @Body() dto: CreatePurchaseFromXmlDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.purchaseService.createFromReconciledXml(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar compras' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PurchaseStatus,
    @Query('supplier') supplier?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.purchaseService.findAll({
      page,
      limit,
      status,
      supplier,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar compra por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseService.findOne(id);
  }
}
