import { Injectable, Logger } from '@nestjs/common';
import { CompanyService } from '../../company/company.service';
import { StorageService } from './storage.service';
import { EmissionService } from './emission.service';
import { CancellationService } from './cancellation.service';
import { PrismaService } from 'src/database/prisma.service';
import {
  DigitalCertificate,
  EmissionResult,
  NFeConfiguration,
  SefazReturn,
} from '../entities/fiscal-module.entity';
import { EmitNfceDto } from '../dto/emit-nfce.dto';
import { CancelNfceDto } from '../dto/cancel-nfce.dto';
import { QueryNfceDto } from '../dto/query-nfce.dto';
import {
  InvalidAccessKeyException,
  NfceNotFoundException,
} from '../fiscal.exception';
import { NfeSender } from '../lib/nfe-sender';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly storageService: StorageService,
    private readonly emissionService: EmissionService,
    private readonly cancellationService: CancellationService,
  ) {}

  async emitNfce(dto: EmitNfceDto): Promise<EmissionResult> {
    return this.emissionService.emit(dto);
  }

  async cancelNfce(
    dto: CancelNfceDto,
  ): Promise<{ message: string; protocol?: string }> {
    return this.cancellationService.cancel(dto);
  }

  async queryNfce(dto: QueryNfceDto): Promise<SefazReturn> {
    this.logger.log(`Querying NFC-e: ${dto.accessKey}`);

    const company = await this.companyService.getCompany();
    const certificate = await this.loadCertificate();

    const sefazConfig: NFeConfiguration = {
      environment: company.nfceEnvironment,
      state: company.state,
    };

    const sender = new NfeSender(sefazConfig, certificate);
    const result = await sender.queryNFe(dto.accessKey);

    if (!result.success) {
      throw new NfceNotFoundException(dto.accessKey);
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

  async queryServiceStatus(): Promise<{
    online: boolean;
    message: string;
    time?: number;
  }> {
    this.logger.log('Querying SEFAZ service status');

    const company = await this.companyService.getCompany();
    const certificate = await this.loadCertificate();

    const sefazConfig: NFeConfiguration = {
      environment: company.nfceEnvironment,
      state: company.state,
    };

    const sender = new NfeSender(sefazConfig, certificate);
    return sender.queryStatus();
  }

  private async loadCertificate(): Promise<DigitalCertificate> {
    const { pfxBuffer, password } =
      await this.companyService.getCertificateBuffer();

    return {
      pfxBuffer,
      password,
    };
  }
}
