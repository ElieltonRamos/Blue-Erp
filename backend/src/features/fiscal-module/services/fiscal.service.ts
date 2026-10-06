import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from './storage.service';
import { EmissionNfceService } from './emission-nfce.service';
import { EmissionNfeService } from './emission-nfe.service';
import { CancellationService } from './cancellation.service';
import { PrismaService } from 'src/database/prisma.service';
import { EmissionResult, SefazReturn } from '../entities/fiscal-module.entity';
import { EmitNfceDto } from '../dto/emit-nfce.dto';
import { EmitNfeDto } from '../dto/emit-nfe.dto';
import { CancelNfceDto } from '../dto/cancel-nfce.dto';
import { QueryNfceDto } from '../dto/query-nfce.dto';
import {
  FiscalException,
  InvalidAccessKeyException,
  NfceNotFoundException,
} from '../fiscal.exception';
import { NfeSender } from '../lib/transport/nfe-sender';
import { NfeModel } from '../lib/transport/nfe-endpoints.config';
import {
  buildSefazConfig,
  loadCertificate,
  modelFromAccessKey,
} from '../lib/nfe-utils';
import { CompanyService } from 'src/features/company/company.service';

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

  async cancelNfce(
    dto: CancelNfceDto,
  ): Promise<{ message: string; protocol?: string }> {
    return this.cancellationService.cancel(dto);
  }

  // O modelo (55 ou 65) vem da própria chave de acesso
  async queryNfce(dto: QueryNfceDto): Promise<SefazReturn> {
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
      throw new NfceNotFoundException(accessKey);
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
      throw new NfceNotFoundException(normalizedKey);
    }

    const pdfPath = this.storageService.getPdfPath(
      normalizedKey,
      sale.fiscalEmitDate,
    );

    if (!this.storageService.fileExists(pdfPath)) {
      throw new NfceNotFoundException(`PDF not found for key ${normalizedKey}`);
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
