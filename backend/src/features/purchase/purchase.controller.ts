// purchase.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { BusinessPartnerService } from './business-partner.service';
import { CreatePurchaseFromXmlDto } from './dto/create-purchase-from-xml.dto';
import { CreateBusinessPartnerDto } from './dto/create-business-partner.dto';
import { UpdateBusinessPartnerDto } from './dto/update-business-partner.dto';
import { FindAllPurchaseQueryDto } from './dto/find-all-purchase-query.dto';
import { JwtAuthGuard, JwtPayload } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NfeXmlParserService } from './nfe-xml-parser.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PartnerType } from 'generated/prisma/client';

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
    private readonly businessPartnerService: BusinessPartnerService,
  ) {}

  // --- Business Partners (fornecedores) — precisa vir antes de ':id' ---

  @Get('business-partners')
  @ApiOperation({ summary: 'Listar fornecedores' })
  findAllPartners(
    @Query('type') type?: PartnerType,
    @Query('active') active?: string,
  ) {
    return this.businessPartnerService.findAll({
      type,
      active: active !== undefined ? active === 'true' : undefined,
    });
  }

  @Get('business-partners/:id')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  findOnePartner(@Param('id', ParseIntPipe) id: number) {
    return this.businessPartnerService.findOne(id);
  }

  @Post('business-partners')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar fornecedor' })
  createPartner(@Body() dto: CreateBusinessPartnerDto) {
    return this.businessPartnerService.create(dto);
  }

  @Patch('business-partners/:id')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  updatePartner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBusinessPartnerDto,
  ) {
    return this.businessPartnerService.update(id, dto);
  }

  @Delete('business-partners/:id')
  @ApiOperation({ summary: 'Inativar fornecedor' })
  removePartner(@Param('id', ParseIntPipe) id: number) {
    return this.businessPartnerService.remove(id);
  }

  // --- Purchases ---

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
  findAll(@Query() query: FindAllPurchaseQueryDto) {
    return this.purchaseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar compra por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseService.findOne(id);
  }
}
