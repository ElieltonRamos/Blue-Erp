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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { FiscalService } from './services/fiscal.service';
import { EmitNfceDto } from './dto/emit-nfce.dto';
import { CancelNfceDto } from './dto/cancel-nfce.dto';
import { QueryNfceDto } from './dto/query-nfce.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import { FiscalReportsService } from './services/fiscal-report.service';
import { ListNfceDto } from './dto/list-nfce.dto';

@ApiTags('Fiscal')
@Controller('fiscal')
export class FiscalController {
  constructor(
    private readonly fiscalService: FiscalService,
    private readonly fiscalReportsService: FiscalReportsService,
  ) {}

  @Post('nfce/emit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emit NFC-e' })
  @ApiResponse({ status: 201, description: 'NFC-e emitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async emitNfce(@Body() dto: EmitNfceDto) {
    return this.fiscalService.emitNfce(dto);
  }

  @Post('nfce/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel NFC-e' })
  @ApiResponse({ status: 200, description: 'NFC-e cancelled successfully' })
  @ApiResponse({ status: 404, description: 'NFC-e not found' })
  async cancelNfce(@Body() dto: CancelNfceDto) {
    return this.fiscalService.cancelNfce(dto);
  }

  @Get('nfce/query')
  @ApiOperation({ summary: 'Query NFC-e by access key' })
  @ApiResponse({ status: 200, description: 'NFC-e query result' })
  @ApiResponse({ status: 404, description: 'NFC-e not found' })
  async queryNfce(@Query() dto: QueryNfceDto) {
    return this.fiscalService.queryNfce(dto);
  }

  @Get('nfce/pdf/:accessKey')
  @ApiOperation({ summary: 'Download NFC-e PDF' })
  @ApiParam({ name: 'accessKey', description: '44-digit NFC-e access key' })
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

  @Get('sefaz/status')
  @ApiOperation({ summary: 'Query SEFAZ service status' })
  @ApiResponse({ status: 200, description: 'SEFAZ service status' })
  async queryServiceStatus() {
    return this.fiscalService.queryServiceStatus();
  }

  @Get('nfce/list')
  @ApiOperation({ summary: 'List NFC-e with filters' })
  @ApiResponse({ status: 200, description: 'List of NFC-e' })
  async listNfce(@Query() dto: ListNfceDto) {
    return this.fiscalReportsService.listNfce(dto);
  }

  @Get('nfce/xml/:saleId')
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

  @Get('nfce/reprint/:saleId')
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
}
