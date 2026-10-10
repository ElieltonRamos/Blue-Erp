import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { EmissionNfceService } from './services/emission-nfce.service';
import { EmissionNfeService } from './services/emission-nfe.service';
import { CancellationService } from './services/cancellation.service';
import { PrismaService } from 'src/database/prisma.service';
import { EmissionResult, SefazReturn } from './entities/fiscal-module.entity';
import { EmitNfceDto } from './dto/emit-nfce.dto';
import { EmitNfeDto } from './dto/emit-nfe.dto';
import {
  FiscalException,
  FiscalNotFoundException,
  InvalidAccessKeyException,
} from './fiscal.exception';
import { NfeSender } from './lib/transport/nfe-sender';
import { NfeModel } from './lib/transport/nfe-endpoints.config';
import {
  buildSefazConfig,
  loadCertificate,
  modelFromAccessKey,
} from './lib/nfe-utils';
import { CompanyService } from 'src/features/company/company.service';
import { CancelFiscalDto } from './dto/cancel-fiscal.dto';
import { QueryFiscalDto } from './dto/query-fiscal.dto';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly storageService: StorageService,
    private readonly emissionNfceService: EmissionNfceService,
    private readonly emissionNfeService: EmissionNfeService,
    private readonly cancellationService: CancellationService,
  ) {}

  async emitNfce(dto: EmitNfceDto): Promise<EmissionResult> {
    return this.emissionNfceService.emit(dto);
  }

  async emitNfe(dto: EmitNfeDto): Promise<EmissionResult> {
    return this.emissionNfeService.emit(dto);
  }

  async cancel(
    dto: CancelFiscalDto,
  ): Promise<{ message: string; protocol?: string }> {
    return this.cancellationService.cancel(dto);
  }

  // O modelo (55 ou 65) vem da própria chave de acesso
  async query(dto: QueryFiscalDto): Promise<SefazReturn> {
    const accessKey = dto.accessKey.replace(/\D/g, '');
    const model = this.modelFromKey(accessKey);

    this.logger.log(`Querying NF modelo ${model}: ${accessKey}`);

    const company = await this.companyService.getCompany();
    const certificate = await loadCertificate(() =>
      this.companyService.getCertificateBuffer(),
    );

    const sender = new NfeSender(buildSefazConfig(company, model), certificate);
    const result = await sender.queryNFe(accessKey, model);

    if (!result.success) {
      throw new FiscalNotFoundException(accessKey);
    }

    return result;
  }

  async downloadPdf(accessKey: string): Promise<string> {
    if (!accessKey || accessKey.length !== 44) {
      throw new InvalidAccessKeyException();
    }

    const normalizedKey = accessKey.replace(/[^0-9]/g, '');

    const sale = await this.prisma.client.sale.findFirst({
      where: { fiscalKey: normalizedKey },
      select: { fiscalEmitDate: true },
    });

    if (!sale || !sale.fiscalEmitDate) {
      throw new FiscalNotFoundException(normalizedKey);
    }

    const pdfPath = this.storageService.getPdfPath(
      normalizedKey,
      sale.fiscalEmitDate,
    );

    if (!this.storageService.fileExists(pdfPath)) {
      throw new FiscalNotFoundException(
        `PDF not found for key ${normalizedKey}`,
      );
    }

    return pdfPath;
  }

  async queryServiceStatus(model: string = '65'): Promise<{
    online: boolean;
    message: string;
    time?: number;
  }> {
    if (model !== '55' && model !== '65') {
      throw new FiscalException(`Modelo inválido: ${model}`, 400);
    }

    this.logger.log(`Querying SEFAZ service status (modelo ${model})`);

    const company = await this.companyService.getCompany();
    const certificate = await loadCertificate(() =>
      this.companyService.getCertificateBuffer(),
    );

    const sender = new NfeSender(buildSefazConfig(company, model), certificate);
    return sender.queryStatus(model);
  }

  private modelFromKey(accessKey: string): NfeModel {
    const model = modelFromAccessKey(accessKey);

    if (accessKey.length !== 44 || (model !== '55' && model !== '65')) {
      throw new InvalidAccessKeyException();
    }

    return model;
  }
}
