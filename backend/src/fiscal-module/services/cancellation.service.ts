import { Injectable, Logger } from '@nestjs/common';
import { CompanyService } from '../../company/company.service';
import {
  DigitalCertificate,
  NFeConfiguration,
} from '../entities/fiscal-module.entity';
import { PrismaService } from 'src/database/prisma.service';
import { CancelNfceDto } from '../dto/cancel-nfce.dto';
import { FiscalException, NfceNotFoundException } from '../fiscal.exception';
import { NfeSender } from '../lib/nfe-sender';
import { Sale } from 'generated/prisma/client';

const CANCELLATION_DEADLINE_MINUTES = 30;

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
    this.logger.log(`Iniciando cancelamento NFC-e: ${dto.accessKey}`);

    const sale = await this.findSaleByAccessKey(dto.accessKey);
    this.validateCancellation(sale);

    const company = await this.companyService.getCompany();
    const certificate = await this.loadCertificate();

    const sefazConfig: NFeConfiguration = {
      environment: company.nfceEnvironment,
      state: company.state,
    };

    const sender = new NfeSender(sefazConfig, certificate);
    const result = await sender.cancelNFe({
      accessKey: dto.accessKey,
      protocol: sale.fiscalProtocol as string,
      justification: dto.justification,
      cnpj: company.cnpj,
    });

    if (!result.success) {
      throw new FiscalException(
        `Cancelamento rejeitado pela SEFAZ: ${result.message}`,
      );
    }

    await this.updateSaleAsCanceled(sale.id, result.protocol);

    this.logger.log(`NFC-e cancelada com sucesso: ${dto.accessKey}`);

    return {
      message: 'NFC-e cancelada com sucesso',
      protocol: result.protocol,
    };
  }

  private async findSaleByAccessKey(accessKey: string): Promise<Sale> {
    const sale = await this.prisma.client.sale.findFirst({
      where: { fiscalKey: accessKey },
    });

    if (!sale) {
      throw new NfceNotFoundException(accessKey);
    }

    return sale;
  }

  private validateCancellation(sale: Sale): void {
    if (sale.fiscalStatus !== 'EMITIDA') {
      throw new FiscalException('Apenas NFC-e emitidas podem ser canceladas');
    }

    if (!sale.fiscalProtocol) {
      throw new FiscalException('Protocolo de autorização não encontrado');
    }

    if (!sale.fiscalEmitDate) {
      throw new FiscalException('Data de emissão não encontrada');
    }

    const minutesSinceEmission =
      (Date.now() - new Date(sale.fiscalEmitDate).getTime()) / (1000 * 60);

    if (minutesSinceEmission > CANCELLATION_DEADLINE_MINUTES) {
      throw new FiscalException(
        `NFC-e só pode ser cancelada em até ${CANCELLATION_DEADLINE_MINUTES} minutos após a emissão`,
      );
    }
  }

  private async loadCertificate(): Promise<DigitalCertificate> {
    const { pfxBuffer, password } =
      await this.companyService.getCertificateBuffer();
    return { pfxBuffer, password };
  }

  private async updateSaleAsCanceled(
    saleId: number,
    protocol?: string,
  ): Promise<void> {
    const now = new Date();
    const offset = -3 * 60;
    const cancelDate = new Date(now.getTime() + offset * 60 * 1000);

    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'CANCELADA',
        fiscalProtocol: protocol,
        fiscalEmitDate: cancelDate,
      },
    });
  }
}
