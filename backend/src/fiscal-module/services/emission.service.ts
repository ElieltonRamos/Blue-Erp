import { Injectable, Logger } from '@nestjs/common';
import { CompanyService } from '../../company/company.service';
import { CompanyResponseDto } from '../../company/dto/company-response.dto';
import { IbptService } from '../../ibpt/ibpt.service';
import { StorageService } from './storage.service';
import { SaleToNfeConverterService } from '../../sales/sale-to-nfe-converte.service';
import {
  NfceAlreadyEmittedException,
  CertificateException,
  SefazException,
  FiscalException,
} from '../fiscal.exception';
import {
  EmissionResult,
  NFeOptions,
  DigitalCertificate,
  NFeConfiguration,
  DanfeConfig,
  DanfeTotals,
  SefazReturn,
} from '../entities/fiscal-module.entity';
import { EmitNfceDto } from '../dto/emit-nfce.dto';
import { PrismaService } from 'src/database/prisma.service';
import { generateNFeXML } from '../lib/nfe-xml-builder';
import { NfeSender } from '../lib/nfe-sender';
import { DanfeGenerator } from '../lib/danfe-generator';

@Injectable()
export class EmissionService {
  private readonly logger = new Logger(EmissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly ibptService: IbptService,
    private readonly storageService: StorageService,
    private readonly saleToNfeConverter: SaleToNfeConverterService,
  ) {}

  async emit(dto: EmitNfceDto): Promise<EmissionResult> {
    this.logger.log(`Starting NFC-e emission for sale ${dto.saleId}`);

    const sale = await this.findSale(dto.saleId);
    this.checkIfAlreadyEmitted(sale);

    const company = await this.companyService.getCompany();
    const certificate = await this.loadCertificate();

    await this.ibptService.updateAliqSale(dto.saleId);

    const nfeData = await this.saleToNfeConverter.convert(dto.saleId);
    this.validateNFeData(nfeData);

    const xml = generateNFeXML(nfeData);
    const accessKey = this.extractAccessKey(xml);

    const sefazConfig: NFeConfiguration = {
      environment: company.nfceEnvironment,
      state: company.state,
    };

    const sender = new NfeSender(sefazConfig, certificate);
    this.validateCertificate(sender);

    const sefazReturn = await sender.send(xml, nfeData);

    if (!sefazReturn.success || sefazReturn.statusCode !== '100') {
      await this.handleRejection(dto.saleId, accessKey, sefazReturn);
    }

    const storagePaths = this.storageService.getStoragePaths(
      accessKey,
      new Date(nfeData.ide.dhEmi),
    );

    this.storageService.saveXml(
      storagePaths.xmlPath,
      sefazReturn.signedXml || xml,
    );

    let pdfPath = '';
    if (dto.generateDanfe && storagePaths.pdfPath) {
      pdfPath = await this.generateDanfe(
        company,
        nfeData,
        accessKey,
        storagePaths.pdfPath,
      );
    }

    await this.updateSaleAsEmitted(dto.saleId, accessKey, sefazReturn.protocol);

    this.logger.log(`NFC-e emitted successfully: ${accessKey}`);

    return {
      accessKey,
      protocol: sefazReturn.protocol,
      xmlPath: storagePaths.xmlPath,
      pdfPath,
      status: 'authorized',
      message: 'NFC-e authorized successfully',
    };
  }

  private async findSale(saleId: number) {
    const sale = await this.prisma.client.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new FiscalException('Sale not found', 404);
    }

    return sale;
  }

  private checkIfAlreadyEmitted(sale: {
    fiscalStatus: string;
    fiscalKey: string | null;
  }): void {
    if (sale.fiscalStatus === 'EMITIDA' && sale.fiscalKey) {
      throw new NfceAlreadyEmittedException(sale.fiscalKey);
    }
  }

  private async loadCertificate(): Promise<DigitalCertificate> {
    try {
      const { pfxBuffer, password } =
        await this.companyService.getCertificateBuffer();

      return { pfxBuffer, password };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error loading digital certificate';
      throw new CertificateException(message);
    }
  }

  private validateNFeData(nfeData: NFeOptions): void {
    if (!nfeData.emit?.CNPJ) {
      throw new FiscalException('Issuer CNPJ is required');
    }
    if (!nfeData.produtos || nfeData.produtos.length === 0) {
      throw new FiscalException('NFC-e must contain at least one product');
    }
    if (!nfeData.pag?.tPag || !nfeData.pag?.vPag) {
      throw new FiscalException('Payment information is required');
    }
    if (!nfeData.ide?.nNF || !nfeData.ide?.serie) {
      throw new FiscalException('Invoice number and series are required');
    }
  }

  private extractAccessKey(xml: string): string {
    const accessKey = this.storageService.extractAccessKey(xml);

    if (!accessKey) {
      throw new FiscalException('Error generating access key');
    }

    return accessKey;
  }

  private validateCertificate(sender: NfeSender): void {
    try {
      sender.signer.validateCertificate();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Invalid certificate';
      throw new CertificateException(message);
    }
  }

  private async handleRejection(
    saleId: number,
    accessKey: string,
    sefazReturn: SefazReturn,
  ): Promise<never> {
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'ERRO',
        fiscalKey: accessKey,
        fiscalProtocol: sefazReturn.protocol,
        fiscalEmitDate: new Date(),
      },
    });

    throw new SefazException(sefazReturn.message || 'NFC-e rejected by SEFAZ');
  }

  private async generateDanfe(
    company: CompanyResponseDto,
    nfeData: NFeOptions,
    accessKey: string,
    pdfPath: string,
  ): Promise<string> {
    const danfeConfig: DanfeConfig = {
      csc: company.nfceCsc,
      idCSC: company.nfceCscId,
      widthMM: 80,
    };

    const danfe = new DanfeGenerator(danfeConfig);
    const totals = this.calculateTotals(nfeData);

    await danfe.generateDanfe(nfeData, accessKey, totals, pdfPath);

    return pdfPath;
  }

  private calculateTotals(nfeData: NFeOptions): DanfeTotals {
    const productValue = nfeData.produtos.reduce(
      (sum, p) => sum + p.qCom * p.vUnCom,
      0,
    );
    const discountValue = 0;
    const totalValue = productValue - discountValue;

    return { productValue, discountValue, totalValue };
  }

  private async updateSaleAsEmitted(
    saleId: number,
    accessKey: string,
    protocol?: string,
  ): Promise<void> {
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'EMITIDA',
        fiscalKey: accessKey,
        fiscalProtocol: protocol,
        fiscalEmitDate: new Date(),
      },
    });
  }
}
