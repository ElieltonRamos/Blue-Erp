import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { FiscalService } from './fiscal.service';
import { EmitNfceDto } from './dto/emit-nfce.dto';
import { CancelFiscalDto } from './dto/cancel-fiscal.dto';
import { QueryFiscalDto } from './dto/query-fiscal.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import { FiscalReportsService } from './services/fiscal-report.service';
import { ListFiscalDto } from './dto/list-fiscal.dto';
import { EmitNfeDto } from './dto/emit-nfe.dto';

@ApiTags('Fiscal')
@Controller('fiscal')
export class FiscalController {
  constructor(
    private readonly fiscalService: FiscalService,
    private readonly fiscalReportsService: FiscalReportsService,
  ) {}

  // ---------- Emissão (específicas por modelo) ----------

  @Post('nfce/emit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emit NFC-e (modelo 65)' })
  @ApiResponse({ status: 201, description: 'NFC-e emitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async emitNfce(@Body() dto: EmitNfceDto) {
    return this.fiscalService.emitNfce(dto);
  }

  @Post('nfe/emit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emit NF-e (modelo 55)' })
  @ApiResponse({ status: 201, description: 'NF-e emitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async emitNfe(@Body() dto: EmitNfeDto) {
    return this.fiscalService.emitNfe(dto);
  }

  // ---------- Compartilhadas (NF-e e NFC-e) ----------

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel fiscal document (NF-e or NFC-e)' })
  @ApiResponse({ status: 200, description: 'Document cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async cancel(@Body() dto: CancelFiscalDto) {
    return this.fiscalService.cancel(dto);
  }

  @Get('query')
  @ApiOperation({
    summary: 'Query fiscal document (NF-e or NFC-e) by access key',
  })
  @ApiResponse({ status: 200, description: 'Query result' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async query(@Query() dto: QueryFiscalDto) {
    return this.fiscalService.query(dto);
  }

  @Get('pdf/:accessKey')
  @ApiOperation({ summary: 'Download fiscal document PDF (NF-e or NFC-e)' })
  @ApiParam({ name: 'accessKey', description: '44-digit access key' })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  @ApiResponse({ status: 404, description: 'PDF not found' })
  async downloadPdf(
    @Param('accessKey') accessKey: string,
    @Res() res: Response,
  ) {
    const pdfPath = await this.fiscalService.downloadPdf(accessKey);
    const fileStream = createReadStream(pdfPath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${accessKey}.pdf"`,
    });
    fileStream.pipe(res);
  }

  @Get('list')
  @ApiOperation({
    summary: 'List fiscal documents (NF-e and NFC-e) with filters',
  })
  @ApiResponse({ status: 200, description: 'List of fiscal documents' })
  async list(@Query() dto: ListFiscalDto) {
    return this.fiscalReportsService.list(dto);
  }

  @Get('xml/:saleId')
  @ApiOperation({ summary: 'Download XML saved for a sale' })
  @ApiParam({ name: 'saleId', description: 'Sale ID' })
  @ApiResponse({ status: 200, description: 'XML file stream' })
  @ApiResponse({ status: 404, description: 'XML not found' })
  async downloadXml(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Res() res: Response,
  ) {
    const { xmlPath, filename } =
      await this.fiscalReportsService.downloadXml(saleId);
    const fileStream = createReadStream(xmlPath);
    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    fileStream.pipe(res);
  }

  @Get('reprint/:saleId')
  @ApiOperation({ summary: 'Reprint PDF from saved XML (no SEFAZ required)' })
  @ApiParam({ name: 'saleId', description: 'Sale ID' })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  @ApiResponse({ status: 404, description: 'XML not found for reprint' })
  async reprintPdf(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Res() res: Response,
  ) {
    const { pdfPath, filename } =
      await this.fiscalReportsService.reprintPdf(saleId);
    const fileStream = createReadStream(pdfPath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    fileStream.pipe(res);
  }

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Get revenue report for a month/year' })
  @ApiResponse({ status: 200, description: 'Revenue report' })
  async getRevenueReport(@Query() dto: RevenueReportQueryDto) {
    return this.fiscalReportsService.getRevenueReport(dto);
  }

  @Get('reports/export')
  @ApiOperation({ summary: 'Export revenue report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportCsv(@Query() dto: RevenueReportQueryDto, @Res() res: Response) {
    const csv = await this.fiscalReportsService.exportCsv(dto);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="relatorio-fiscal-${dto.year}-${dto.month}.csv"`,
    });
    res.send('\uFEFF' + csv); // BOM para Excel abrir UTF-8 corretamente
  }

  @Get('sefaz/status')
  @ApiOperation({ summary: 'Query SEFAZ service status' })
  @ApiQuery({ name: 'model', required: false, enum: ['55', '65'] })
  async queryServiceStatus(@Query('model') model?: string) {
    return this.fiscalService.queryServiceStatus(model);
  }
}
