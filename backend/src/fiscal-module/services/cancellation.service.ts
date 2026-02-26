import { Injectable, Logger } from '@nestjs/common';
import { CompanyService } from '../../company/company.service';
import {
  DigitalCertificate,
  NFeConfiguration,
  NFeOptions,
} from '../entities/fiscal-module.entity';
import { PrismaService } from 'src/database/prisma.service';
import { CancelNfceDto } from '../dto/cancel-nfce.dto';
import { FiscalException, NfceNotFoundException } from '../fiscal.exception';
import { NfeSender } from '../lib/nfe-sender';

@Injectable()
export class CancellationService {
  private readonly logger = new Logger(CancellationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
  ) {}

  async cancel(
    dto: CancelNfceDto,
  ): Promise<{ message: string; protocol?: string }> {
    this.logger.log(`Starting cancellation for NFC-e: ${dto.accessKey}`);

    const sale = await this.findSaleByAccessKey(dto.accessKey);
    this.validateCancellation(sale);

    const company = await this.companyService.getCompany();
    const certificate = await this.loadCertificate();

    const sefazConfig: NFeConfiguration = {
      environment: company.nfceEnvironment,
      state: company.state,
    };

    const sender = new NfeSender(sefazConfig, certificate);
    const result = await sender.send('', {} as NFeOptions);

    if (!result.success) {
      throw new FiscalException(`Cancellation failed: ${result.message}`);
    }

    await this.updateSaleAsCanceled(sale.id, result.protocol as string);

    this.logger.log(`NFC-e canceled successfully: ${dto.accessKey}`);

    return {
      message: 'NFC-e canceled successfully',
      protocol: result.protocol,
    };
  }

  private async findSaleByAccessKey(accessKey: string) {
    const sale = await this.prisma.client.sale.findFirst({
      where: { fiscalKey: accessKey },
    });

    if (!sale) {
      throw new NfceNotFoundException(accessKey);
    }

    return sale;
  }

  private validateCancellation(sale: any): void {
    if (sale.fiscalStatus !== 'EMITIDA') {
      throw new FiscalException('Only emitted NFC-e can be canceled');
    }

    if (!sale.fiscalProtocol) {
      throw new FiscalException('Protocol not found for this NFC-e');
    }

    const emissionDate = new Date(sale.fiscalEmitDate as Date);
    const hoursSinceEmission =
      (Date.now() - emissionDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceEmission > 24) {
      throw new FiscalException(
        'NFC-e can only be canceled within 24 hours of emission',
      );
    }
  }

  private async loadCertificate(): Promise<DigitalCertificate> {
    const certConfig = await this.companyService.getCertificateConfig();

    if (!certConfig) {
      throw new FiscalException('Error loading digital certificate');
    }

    const certficado = await this.companyService.getCertificateBuffer();

    return {
      pfxBuffer: certficado.pfxBuffer,
      password: certficado.password,
    };
  }

  private async updateSaleAsCanceled(
    saleId: number,
    protocol?: string,
  ): Promise<void> {
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'CANCELADA',
        fiscalProtocol: protocol,
      },
    });
  }
}
