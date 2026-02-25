import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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

@ApiTags('Fiscal')
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

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
}
