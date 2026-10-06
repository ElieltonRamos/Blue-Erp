import { Injectable, Logger } from '@nestjs/common';
import { Sale } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CompanyService } from 'src/features/company/company.service';
import { CancelNfceDto } from '../dto/cancel-nfce.dto';
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

const CANCELLATION_RULES: Record<
  NfeModel,
  { label: string; deadlineMinutes: number; deadlineText: string }
> = {
  '65': { label: 'NFC-e', deadlineMinutes: 30, deadlineText: '30 minutos' },
  '55': { label: 'NF-e', deadlineMinutes: 24 * 60, deadlineText: '24 horas' },
};

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
    const accessKey = dto.accessKey.replace(/\D/g, '');
    const model = this.resolveModel(accessKey);
    const { label } = CANCELLATION_RULES[model];

    this.logger.log(`Iniciando cancelamento ${label}: ${accessKey}`);

    const sale = await this.findSaleByAccessKey(accessKey);
    this.validateCancellation(sale, model);

    const company = await this.companyService.getCompany();
    const certificate = await loadCertificate(() =>
      this.companyService.getCertificateBuffer(),
    );

    const sender = new NfeSender(buildSefazConfig(company, model), certificate);
    const result = await sender.cancelNFe(
      {
        accessKey,
        protocol: sale.fiscalProtocol as string,
        justification: dto.justification,
        cnpj: company.cnpj,
      },
      model,
    );

    if (!result.success) {
      throw new FiscalException(
        `Cancelamento rejeitado pela SEFAZ: ${result.message}`,
      );
    }

    await this.updateSaleAsCanceled(sale.id, result.protocol);

    this.logger.log(`${label} cancelada com sucesso: ${accessKey}`);

    return {
      message: `${label} cancelada com sucesso`,
      protocol: result.protocol,
    };
  }

  // O modelo (55 ou 65) vem da própria chave de acesso
  private resolveModel(accessKey: string): NfeModel {
    const model = modelFromAccessKey(accessKey);

    if (accessKey.length !== 44 || (model !== '55' && model !== '65')) {
      throw new InvalidAccessKeyException();
    }

    return model;
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

  private validateCancellation(sale: Sale, model: NfeModel): void {
    const { label, deadlineMinutes, deadlineText } = CANCELLATION_RULES[model];

    if (sale.fiscalStatus !== 'EMITIDA') {
      throw new FiscalException(
        `Apenas ${label} emitidas podem ser canceladas`,
      );
    }

    if (!sale.fiscalProtocol) {
      throw new FiscalException('Protocolo de autorização não encontrado');
    }

    if (!sale.fiscalEmitDate) {
      throw new FiscalException('Data de emissão não encontrada');
    }

    const minutesSinceEmission =
      (Date.now() - new Date(sale.fiscalEmitDate).getTime()) / (1000 * 60);

    if (minutesSinceEmission > deadlineMinutes) {
      throw new FiscalException(
        `${label} só pode ser cancelada em até ${deadlineText} após a emissão`,
      );
    }
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
